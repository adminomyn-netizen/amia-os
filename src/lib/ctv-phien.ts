import "server-only";
import { createHash, createHmac } from "node:crypto";
import { cookies, headers } from "next/headers";
import { sb } from "@/lib/db";
import { docPhien, kyPhien } from "@/lib/ctv-ky";

/** Phiên CỔNG CTV — TÁCH HẲN đăng nhập nhân viên (Supabase Auth + nhan_vien). Cookie riêng `amia_ctv` chỉ gửi kèm đường dẫn /ctv,
 *  httpOnly + SameSite=Lax + Secure, sống 12 giờ, ký HMAC bằng khoá máy chủ. Mọi trang/hành động cổng gọi layCtv() rồi chỉ đọc/ghi theo ctv.id.
 *  Khoá: CTV_SESSION_SECRET nếu có, không thì dẫn xuất từ SUPABASE_SERVICE_ROLE_KEY (đã có sẵn trên máy chủ). Không có khoá → không ai đăng nhập được. */
export const COOKIE_CTV = "amia_ctv";
const TTL_GIO = 12;

export function khoaCtv(): string {
  const rieng = process.env.CTV_SESSION_SECRET;
  if (rieng && rieng.length >= 32) return rieng;
  const goc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return goc ? createHmac("sha256", goc).update("amia-ctv-phien-v1").digest("hex") : "";
}

export type Ctv = {
  id: string; ten: string; ten_hien_thi: string | null; ma_ref: string; email: string | null; gui_email: boolean;
  hh_kieu: string; hh_gia_tri: number; phien_ver: number; tu_dang_ky: boolean; tao_luc: string;
};

/** CTV đang đăng nhập (phiên hợp lệ + đúng phiên bản + nguồn còn hợp tác + có REF), không thì null. */
export async function layCtv(): Promise<Ctv | null> {
  const khoa = khoaCtv();
  const p = docPhien((await cookies()).get(COOKIE_CTV)?.value, khoa);
  if (!p) return null;
  const { data } = await sb().from("doi_tac_gt").select("id, ten, ten_hien_thi, ma_ref, email, gui_email, hh_kieu, hh_gia_tri, phien_ver, tu_dang_ky, tao_luc, hoat_dong").eq("id", p.dt).maybeSingle();
  if (!data || !data.hoat_dong || !data.ma_ref || data.phien_ver !== p.v) return null;
  return { ...data, ma_ref: data.ma_ref, hh_gia_tri: Number(data.hh_gia_tri) };
}

export async function datPhienCtv(dt: string, ver: number) {
  const khoa = khoaCtv();
  if (!khoa) throw new Error("Thiếu khoá phiên CTV");
  (await cookies()).set(COOKIE_CTV, kyPhien({ dt, v: ver, het: Date.now() + TTL_GIO * 3600_000 }, khoa), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/ctv", maxAge: TTL_GIO * 3600,
  });
}

export async function xoaPhienCtv() {
  (await cookies()).set(COOKIE_CTV, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/ctv", maxAge: 0 });
}

/** Dấu vết IP đã băm (không lưu IP thật) — dùng cho giới hạn gửi mã theo IP. */
export async function ipBamCtv(): Promise<string> {
  const h = await headers();
  // Hosting không qua Cloudflare nên không tin cf-connecting-ip; lấy chặng CUỐI của x-forwarded-for (do proxy gần nhất thêm). Header vẫn có thể giả,
  // nên giới hạn theo IP chỉ là lớp phụ — lớp chính là giới hạn theo SĐT / email + trần mã đăng ký toàn hệ thống trong DB.
  const ip = (h.get("x-forwarded-for") ?? "").split(",").map((x) => x.trim()).filter(Boolean).pop() || h.get("x-real-ip") || "khong-ro";
  return createHash("sha256").update(`ctv-ip|${ip}|${khoaCtv()}`).digest("hex").slice(0, 40);
}
