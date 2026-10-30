import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { chuyenDong, cuaSoNgay, keoInsights, layTienTe, maChienDich, type SoLieuQc } from "@/lib/meta-ads";

export const maxDuration = 120;

/**
 * Kéo số liệu quảng cáo Meta về "Quảng cáo theo ngày" mỗi sáng 05:30 giờ VN. Cần 2 biến môi trường: META_ACCESS_TOKEN (token dài hạn/System User, quyền ads_read) và
 * META_AD_ACCOUNT_IDS (các tài khoản quảng cáo, cách nhau dấu phẩy). Chưa có thì trả 503 và KHÔNG ghi gì.
 * Chiến dịch Meta được nối bằng mã `meta-<campaign_id>`; chiến dịch chưa có tự tạo (nháp, đánh dấu cần người phụ trách chọn mục tiêu). Chiến dịch nhập tay không bị đụng.
 * Mỗi lần kéo 3 ngày gần nhất và ghi đè, vì Meta còn điều chỉnh số vài ngày sau.
 */
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const token = process.env.META_ACCESS_TOKEN, ds = (process.env.META_AD_ACCOUNT_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || ds.length === 0) return NextResponse.json({ loi: "Chưa cấu hình META_ACCESS_TOKEN / META_AD_ACCOUNT_IDS" }, { status: 503 });
  const phienBan = process.env.META_GRAPH_VERSION, { since, until } = cuaSoNgay(homNayHCM(), Number(process.env.META_SO_NGAY_KEO) || 3);
  const db = sb(), loi: string[] = [], so: SoLieuQc[] = [];
  for (const tk of ds) {
    try {
      const tien = await layTienTe({ token, taiKhoan: tk, phienBan });
      if (tien !== "VND") { loi.push(`${tk}: tiền tệ ${tien}, chỉ nhận VND — bỏ qua`); continue; }
      for (const d of await keoInsights({ token, taiKhoan: tk, since, until, phienBan })) { const x = chuyenDong(d); if (x) so.push(x); }
    } catch (e) { loi.push(e instanceof Error ? e.message : String(e)); }
  }
  if (so.length === 0) return NextResponse.json({ since, until, dong: 0, loi }, { status: loi.length ? 502 : 200 });

  const ma = [...new Set(so.map((x) => maChienDich(x.metaId)))];
  const { data: co } = await db.from("chien_dich").select("id, ma").in("ma", ma);
  const id = new Map((co ?? []).map((c) => [c.ma, c.id]));
  const moi = [...new Map(so.filter((x) => !id.has(maChienDich(x.metaId))).map((x) => [x.metaId, x])).values()];
  if (moi.length) {
    const { data: tao, error } = await db.from("chien_dich").insert(moi.map((x) => ({
      ma: maChienDich(x.metaId), ten: x.ten, muc_tieu: "thong_diep", kenh: "Meta Ads", trang_thai: "dang_chay",
      ghi_chu: "Tự tạo từ Meta Ads. Mục tiêu đang để tạm 'thông điệp' — người phụ trách chọn lại cho đúng.",
    }))).select("id, ma");
    if (error) return NextResponse.json({ loi: [...loi, `tạo chiến dịch: ${error.message}`] }, { status: 500 });
    for (const c of tao ?? []) id.set(c.ma, c.id);
  }
  const dong = so.map((x) => ({ ngay: x.ngay, chien_dich_id: id.get(maChienDich(x.metaId))!, chi_phi: x.chi_phi, hien_thi: x.hien_thi, tiep_can: x.tiep_can, click: x.click, tin_nhan_moi: x.tin_nhan_moi, lead_so: x.lead_so }));
  const { error } = await db.from("chi_phi_qc_ngay").upsert(dong, { onConflict: "ngay,chien_dich_id" });
  if (error) return NextResponse.json({ loi: [...loi, `ghi số liệu: ${error.message}`] }, { status: 500 });
  return NextResponse.json({ since, until, dong: dong.length, chienDichMoi: moi.length, loi });
}
