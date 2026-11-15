import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { layCanhBao } from "@/lib/canh-bao";
import { guiChoNhanVien } from "@/lib/push";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { laVaiTro, quyenHieuLuc } from "@/lib/quyen";

export const maxDuration = 60;

/** Tóm tắt 8 giờ sáng (01:00 UTC): mỗi người đã bật thông báo nhận một dòng "hôm nay bạn có N lịch · M việc đang chờ". Không có gì thì không gửi. Vercel Cron gọi kèm CRON_SECRET. */
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const db = sb();
  const { data: dk } = await db.from("dang_ky_thong_bao").select("nhan_vien_id");
  const ids = [...new Set((dk ?? []).map((d) => d.nhan_vien_id))];
  if (ids.length === 0) return NextResponse.json({ nguoi: 0, daGui: 0 });
  const { data: nvs } = await db.from("nhan_vien").select("id, ho_ten, vai_tro, quyen_rieng, chi_nhanh_id, hoat_dong").in("id", ids).eq("hoat_dong", true);
  const homNay = homNayHCM(), tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  // Chị Lâm 15/11/2026: "chào buổi sáng 1 lần thôi". Lịch có thể gọi lặp (Vercel cũ + hosting): ghi người đã nhận trong ngày, gọi lại thì bỏ qua.
  const KHOA = "tom_tat.da_gui";
  const { data: ghi } = await db.from("cau_hinh").select("gia_tri").eq("khoa", KHOA).maybeSingle();
  let daNhan: string[] = [];
  try { const v = JSON.parse(ghi?.gia_tri ?? "{}") as { ngay?: string; ids?: string[] }; if (v.ngay === homNay) daNhan = v.ids ?? []; } catch { /* hỏng thì coi như chưa ai nhận */ }
  const daNhanSet = new Set(daNhan);
  let daGui = 0;
  for (const n of nvs ?? []) {
    if (!laVaiTro(n.vai_tro) || daNhanSet.has(n.id)) continue;
    const nd = { nhanVienId: n.id, vaiTro: n.vai_tro, quyen: quyenHieuLuc(n.vai_tro, n.quyen_rieng), chiNhanhId: n.chi_nhanh_id };
    const [cb, { count: lich }] = await Promise.all([layCanhBao(nd), db.from("lich_hen").select("id", { count: "exact", head: true }).eq("nhan_vien_id", n.id).gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)")]);
    const phan = [lich ? `${lich} lịch của bạn` : "", cb.length ? `${cb.length} việc đang chờ (${cb.slice(0, 3).map((c) => c.nhan).join("; ")}${cb.length > 3 ? `; và ${cb.length - 3} việc khác` : ""})` : ""].filter(Boolean);
    if (phan.length === 0) continue;
    const kq = await guiChoNhanVien([n.id], { tieuDe: "Việc hôm nay của " + n.ho_ten.split(" ").slice(-1)[0], noiDung: `${phan.join(" · ")}.`, url: "/trang-chu", tag: "tom-tat" });
    daGui += kq.thanhCong;
    if (kq.thanhCong) { daNhanSet.add(n.id); await db.from("cau_hinh").upsert({ khoa: KHOA, gia_tri: JSON.stringify({ ngay: homNay, ids: [...daNhanSet] }), ghi_chu: "Người đã nhận tóm tắt sáng hôm nay (chặn gửi lặp)" }, { onConflict: "khoa" }); }
  }
  return NextResponse.json({ nguoi: nvs?.length ?? 0, daGui });
}
