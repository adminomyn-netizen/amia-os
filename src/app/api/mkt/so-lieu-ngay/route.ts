import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { cuaSoNgay } from "@/lib/meta-ads";
import { GET as keoMeta } from "@/app/api/cron/meta-ads/route";

export const maxDuration = 60;

/**
 * Số liệu MKT theo ngày × chiến dịch (Meta + Pancake) dạng phẳng, tên cột đúng như bảng 3.4 trong Lark Base MAR-CAMP-01,
 * để luồng AnyCross đọc rồi ghi vào Lark. Chỉ đọc. Cùng khoá bí mật với cron (Authorization: Bearer ${CRON_SECRET}).
 * ?ngay=<số ngày gần nhất, mặc định 3, tối đa 400>. Mặc định LÀM MỚI số Meta trước (gọi cùng logic cron meta-ads cho cùng số ngày) rồi mới đọc; ?lam_moi=0 để chỉ đọc.
 */
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const q = new URL(req.url).searchParams, n = Math.min(Number(q.get("ngay")) || 3, 400);
  let meta: unknown = null;
  if (q.get("lam_moi") !== "0") { const r = await keoMeta(req); meta = await r.json().catch(() => null); if (!r.ok) return NextResponse.json({ loi: "Làm mới Meta lỗi", chi_tiet: meta }, { status: 502 }); }
  const { since } = cuaSoNgay(homNayHCM(), n);
  const db = sb();
  const [{ data: so, error }, { data: cd }] = await Promise.all([
    db.from("chi_phi_qc_ngay").select("ngay, chien_dich_id, chi_phi, hien_thi, tiep_can, click, tin_nhan_moi, lead_so").gte("ngay", since).order("ngay", { ascending: false }).limit(5000),
    db.from("chien_dich").select("id, ma, ten"),
  ]);
  if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
  const c = new Map((cd ?? []).map((x) => [x.id, x]));
  const dong = (so ?? []).flatMap((r) => {
    const k = c.get(r.chien_dich_id);
    if (!k) return [];
    return [{ "Khoá": `${r.ngay}|${k.ma}`, "Ngày": `${r.ngay} 00:00`, "Nguồn": k.ma === "pancake-hoi-thoai" ? "Pancake" : "Meta", "Mã chiến dịch": k.ma, "Chiến dịch": k.ten, "Chi phí": r.chi_phi, "Hiển thị": r.hien_thi, "Tiếp cận": r.tiep_can, "Click": r.click, "Tin nhắn": r.tin_nhan_moi, "Lead": r.lead_so }];
  });
  return NextResponse.json({ since, so_dong: dong.length, meta, dong });
}
