import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { chuyenDong, cuaSoNgay, gopTheoNhom, keoInsights, layTienTe, type SoLieuQc } from "@/lib/meta-ads";

export const maxDuration = 120;

/**
 * Kéo số liệu quảng cáo Meta về "Quảng cáo theo ngày" mỗi sáng 05:30 giờ VN. Cần 2 biến môi trường: META_ACCESS_TOKEN (token dài hạn/System User, quyền ads_read) và
 * META_AD_ACCOUNT_IDS (các tài khoản quảng cáo, cách nhau dấu phẩy). Chưa có thì trả 503 và KHÔNG ghi gì.
 * Các bản sao "… - Bản sao N" gộp về một chiến dịch theo tên (mã `meta-n-<tên>`); chiến dịch chưa có tự tạo (nháp, đánh dấu cần người phụ trách chọn mục tiêu). Chiến dịch nhập tay không bị đụng.
 * Mỗi lần kéo 3 ngày gần nhất và ghi đè, vì Meta còn điều chỉnh số vài ngày sau. Muốn kéo bù lịch sử: gọi tay kèm ?ngay=<số ngày> (tối đa 365).
 */
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const token = process.env.META_ACCESS_TOKEN, ds = (process.env.META_AD_ACCOUNT_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || ds.length === 0) return NextResponse.json({ loi: "Chưa cấu hình META_ACCESS_TOKEN / META_AD_ACCOUNT_IDS" }, { status: 503 });
  const phienBan = process.env.META_GRAPH_VERSION, { since, until } = cuaSoNgay(homNayHCM(), Math.min(Number(new URL(req.url).searchParams.get("ngay")) || Number(process.env.META_SO_NGAY_KEO) || 3, 365));
  const db = sb(), loi: string[] = [], so: SoLieuQc[] = [];
  for (const tk of ds) {
    try {
      const tien = await layTienTe({ token, taiKhoan: tk, phienBan });
      if (tien !== "VND") { loi.push(`${tk}: tiền tệ ${tien}, chỉ nhận VND — bỏ qua`); continue; }
      for (const d of await keoInsights({ token, taiKhoan: tk, since, until, phienBan })) { const x = chuyenDong(d); if (x) so.push(x); }
    } catch (e) { loi.push(e instanceof Error ? e.message : String(e)); }
  }
  if (so.length === 0) return NextResponse.json({ since, until, dong: 0, loi }, { status: loi.length ? 502 : 200 });

  const gop = gopTheoNhom(so).filter((x) => x.chi_phi + x.hien_thi + x.click + x.tin_nhan_moi + x.lead_so > 0), ma = [...new Set(gop.map((x) => x.ma))];
  const { data: co } = await db.from("chien_dich").select("id, ma").in("ma", ma);
  const id = new Map((co ?? []).map((c) => [c.ma, c.id]));
  const moi = [...new Map(gop.filter((x) => !id.has(x.ma)).map((x) => [x.ma, x])).values()];
  if (moi.length) {
    const { data: tao, error } = await db.from("chien_dich").insert(moi.map((x) => ({
      ma: x.ma, ten: x.ten, muc_tieu: "thong_diep", kenh: "Meta Ads", trang_thai: "dang_chay",
      ghi_chu: "Tự tạo từ Meta Ads (gộp các bản sao cùng tên). Mục tiêu đang để tạm 'thông điệp' — người phụ trách chọn lại cho đúng.",
    }))).select("id, ma");
    if (error) return NextResponse.json({ loi: [...loi, `tạo chiến dịch: ${error.message}`] }, { status: 500 });
    for (const c of tao ?? []) id.set(c.ma, c.id);
  }
  const dong = gop.map((x) => ({ ngay: x.ngay, chien_dich_id: id.get(x.ma)!, chi_phi: x.chi_phi, hien_thi: x.hien_thi, tiep_can: x.tiep_can, click: x.click, tin_nhan_moi: x.tin_nhan_moi, lead_so: x.lead_so }));
  const { error } = await db.from("chi_phi_qc_ngay").upsert(dong, { onConflict: "ngay,chien_dich_id" });
  if (error) return NextResponse.json({ loi: [...loi, `ghi số liệu: ${error.message}`] }, { status: 500 });
  return NextResponse.json({ since, until, dong: dong.length, chienDichMoi: moi.length, loi });
}
