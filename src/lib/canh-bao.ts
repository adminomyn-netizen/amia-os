import "server-only";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, tienVN } from "@/lib/dinh-dang";
import { coQuyen, type CoQuyen } from "@/lib/quyen";

/** `ma` = loại việc (khoá trạng thái đã đọc/đã xoá của từng nhân viên). */
export type CanhBao = { ma: "lich" | "phieu" | "the" | "no" | "kho" | "han" | "chuyen" | "xuatkhan" | "hdv" | "vb" | "hdld"; nhan: string; href: string };

/** Việc đang chờ người này xử lý (theo quyền và chi nhánh của họ): dùng cho chuông thông báo và Trang chủ. */
export async function layCanhBao(nd: CoQuyen & { chiNhanhId: string | null }): Promise<CanhBao[]> {
  const db = sb(), cn = nd.chiNhanhId, homNay = homNayHCM();
  const ra: CanhBao[] = [];
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  const loc = <T extends { eq: (c: string, v: string) => T }>(q: T) => (cn ? q.eq("chi_nhanh_id", cn) : q);
  const [lich, phieu, the, no, kho] = await Promise.all([
    coQuyen(nd, "lich.xem") ? loc(db.from("lich_hen").select("id", { count: "exact", head: true }).gte("bat_dau", tu).lt("bat_dau", den).eq("trang_thai", "chua_xac_nhan")) : null,
    coQuyen(nd, "phieu.xem") ? loc(db.from("phieu_cap").select("id", { count: "exact", head: true }).in("trang_thai", ["cho_cap", "da_cap"])) : null,
    coQuyen(nd, "the.xem") ? loc(db.from("v_the_khach").select("id", { count: "exact", head: true }).eq("tinh_trang", "sap_het").eq("loai", "lan")) : null,
    coQuyen(nd, "baocao.tien") ? loc(db.from("hoa_don").select("con_no").eq("trang_thai", "hoan_thanh").gt("con_no", 0)) : null,
    coQuyen(nd, "kho.xem") ? loc(db.from("v_ton_kho").select("san_pham_id", { count: "exact", head: true }).eq("duoi_muc_toi_thieu", true)) : null,
  ]);
  if ((lich?.count ?? 0) > 0) ra.push({ ma: "lich", nhan: `${lich!.count} lịch hôm nay chưa xác nhận`, href: "/lich-hen" });
  if ((phieu?.count ?? 0) > 0) ra.push({ ma: "phieu", nhan: `${phieu!.count} phiếu cấp vật tư đang chờ kho cấp hoặc KTV nhận`, href: "/phieu-cap" });
  if ((the?.count ?? 0) > 0) ra.push({ ma: "the", nhan: `${the!.count} thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)`, href: "/the" });
  const dsNo = (no?.data ?? []) as { con_no: number }[];
  if (dsNo.length > 0) ra.push({ ma: "no", nhan: `${dsNo.length} hoá đơn còn nợ, tổng ${tienVN(dsNo.reduce((s, r) => s + Number(r.con_no), 0))}`, href: "/bao-cao?tab=no" });
  if ((kho?.count ?? 0) > 0) ra.push({ ma: "kho", nhan: `${kho!.count} mặt hàng dưới mức tồn tối thiểu`, href: "/kho?thieu=1" });
  await themCanhBaoNangCao(nd, ra, homNay);
  return ra;
}

/** Cảnh báo kho nâng cao, hoá đơn đầu vào, văn bản và hợp đồng lao động (mỗi loại chỉ hỏi khi người này có quyền). */
async function themCanhBaoNangCao(nd: CoQuyen & { chiNhanhId: string | null }, ra: CanhBao[], homNay: string) {
  const db = sb(), cn = nd.chiNhanhId;
  const [han, chuyen, xk, hdv, vbHet, vbCho, hd] = await Promise.all([
    coQuyen(nd, "kho.xem") ? (cn ? db.from("v_ton_lo").select("san_pham_id", { count: "exact", head: true }).eq("chi_nhanh_id", cn) : db.from("v_ton_lo").select("san_pham_id", { count: "exact", head: true })).gt("con_lai", 0).lte("han_dung", congNgay(homNay, 30)) : null,
    coQuyen(nd, "kho.xem") ? db.from("phieu_chuyen_kho").select("id, trang_thai, den_chi_nhanh_id, han_nhan").in("trang_thai", ["dang_chuyen", "cho_xu_ly_chenh_lech"]) : null,
    coQuyen(nd, "kho.duyet") ? (cn ? db.from("phieu_xuat_khan").select("id", { count: "exact", head: true }).eq("chi_nhanh_id", cn) : db.from("phieu_xuat_khan").select("id", { count: "exact", head: true })).eq("trang_thai", "cho_hau_kiem") : null,
    coQuyen(nd, "quy.ghi") ? db.from("hoa_don_dau_vao").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_hoa_don").lt("han_nhan", homNay) : null,
    coQuyen(nd, "vb.xem") ? db.from("van_ban").select("id", { count: "exact", head: true }).eq("trang_thai", "da_ky").lte("hieu_luc_den", congNgay(homNay, 30)) : null,
    coQuyen(nd, "vb.duyet") ? db.from("van_ban").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet") : null,
    coQuyen(nd, "cong.xem") ? db.from("hd_lao_dong").select("nhan_vien_id, giai_doan, den_ngay") : null,
  ]);
  if ((han?.count ?? 0) > 0) ra.push({ ma: "han", nhan: `${han!.count} lô vật tư hết hạn trong 30 ngày hoặc đã quá hạn`, href: "/kho?tab=han" });
  const ck = ((chuyen?.data ?? []) as { trang_thai: string; den_chi_nhanh_id: string; han_nhan: string }[]).filter((c) => (!cn || c.den_chi_nhanh_id === cn) && (c.trang_thai === "cho_xu_ly_chenh_lech" || new Date(c.han_nhan).getTime() < Date.now()));
  if (ck.length > 0) ra.push({ ma: "chuyen", nhan: `${ck.length} phiếu chuyển kho quá 24 giờ chưa nhận hoặc đang chờ xử lý chênh lệch`, href: "/kho/chuyen-kho" });
  if ((xk?.count ?? 0) > 0) ra.push({ ma: "xuatkhan", nhan: `${xk!.count} phiếu xuất khẩn cấp chờ hậu kiểm`, href: "/kho/xu-ly?tab=xuat-khan" });
  if ((hdv?.count ?? 0) > 0) ra.push({ ma: "hdv", nhan: `${hdv!.count} khoản “hoá đơn chưa về” đã quá hạn`, href: "/tai-chinh/hoa-don-dau-vao" });
  const nVb = (vbHet?.count ?? 0) + (vbCho?.count ?? 0);
  if (nVb > 0) ra.push({ ma: "vb", nhan: `${nVb} văn bản chờ duyệt hoặc sắp hết hạn`, href: "/van-ban/danh-sach?tab=can-xu-ly" });
  if (hd?.data) {
    const rows = hd.data as { nhan_vien_id: string; giai_doan: string; den_ngay: string | null }[], thu = ["thu_viec", "hdld_1", "hdld_2", "kxd"];
    const moiNhat = new Map<string, (typeof rows)[number]>();
    for (const r of rows) { const c = moiNhat.get(r.nhan_vien_id); if (!c || thu.indexOf(r.giai_doan) > thu.indexOf(c.giai_doan)) moiNhat.set(r.nhan_vien_id, r); }
    const sap = [...moiNhat.values()].filter((r) => r.giai_doan !== "kxd" && r.den_ngay && r.den_ngay <= congNgay(homNay, 45)).length;
    if (sap > 0) ra.push({ ma: "hdld", nhan: `${sap} hợp đồng lao động sắp hết hạn hoặc đã hết hạn`, href: "/nhan-su/hop-dong" });
  }
}
