/** Thu nợ nhiều hoá đơn một lúc (nút "Trả nợ" của báo cáo Khách hàng nợ, như SalonHero): mỗi hoá đơn được chọn thu NỐT toàn bộ số còn nợ. */
export const TOI_DA_DON_THU_NO = 50;

export type HoaDonNo = { id: string; ma: string; trang_thai: string; con_no: number | string; chi_nhanh_id: string };
export type DongThuNo = { hoa_don_id: string; ma: string; so_tien: number };
export type PhieuThuNo = { loi: string } | { loi?: undefined; dong: DongThuNo[]; tong: number };

/** Kiểm các hoá đơn được chọn rồi lập các dòng thu. Một hoá đơn sai thì cả phiếu bị từ chối (không thu dở dang). */
export function lapPhieuThuNo(ids: string[], hds: HoaDonNo[], chiNhanhId: string | null): PhieuThuNo {
  const duy = [...new Set(ids.filter(Boolean))];
  if (duy.length === 0) return { loi: "Chọn ít nhất một hoá đơn còn nợ." };
  if (duy.length > TOI_DA_DON_THU_NO) return { loi: `Mỗi lần chỉ thu nợ tối đa ${TOI_DA_DON_THU_NO} hoá đơn.` };
  const theoId = new Map(hds.map((h) => [h.id, h]));
  const dong: DongThuNo[] = [];
  for (const id of duy) {
    const h = theoId.get(id);
    if (!h) return { loi: "Có hoá đơn không tồn tại, tải lại trang rồi chọn lại." };
    if (h.trang_thai !== "hoan_thanh") return { loi: `Hoá đơn ${h.ma} chưa hoàn thành hoặc đã huỷ, không thu nợ được.` };
    if (chiNhanhId && h.chi_nhanh_id !== chiNhanhId) return { loi: `Hoá đơn ${h.ma} không thuộc chi nhánh của bạn.` };
    const no = Number(h.con_no);
    if (!(no > 0)) return { loi: `Hoá đơn ${h.ma} không còn nợ, tải lại trang rồi chọn lại.` };
    dong.push({ hoa_don_id: h.id, ma: h.ma, so_tien: no });
  }
  return { dong, tong: dong.reduce((s, d) => s + d.so_tien, 0) };
}
