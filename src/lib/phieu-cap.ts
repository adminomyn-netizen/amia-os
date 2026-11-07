/** Ca (lịch hẹn) có dịch vụ cần vật tư nhóm A cấp trước ca nhưng CHƯA có phiếu cấp (phiếu huỷ coi như chưa có). Hàm thuần, có test.
 *  Cùng tiêu chí với chốt chặn mở ca (trg_lich_hen_khoa_ca): dịch vụ có ít nhất một dòng định mức thuộc vật tư nhóm A. */
export type CaCanPhieu = { lichId: string; dichVuId: string };
export function tinhCaCanPhieu(
  lichDichVu: { lich_id: string; dich_vu_id: string }[],
  dinhMuc: { dich_vu_id: string; san_pham_id: string }[],
  nhomCapTheoSp: Map<string, string | null>,
  phieuDangCo: { lich_hen_id: string | null; dich_vu_id: string }[],
): CaCanPhieu[] {
  const dvCan = new Set(dinhMuc.filter((d) => nhomCapTheoSp.get(d.san_pham_id) === "A").map((d) => d.dich_vu_id));
  const co = new Set(phieuDangCo.filter((p) => p.lich_hen_id).map((p) => `${p.lich_hen_id}|${p.dich_vu_id}`));
  const thay = new Set<string>(), ra: CaCanPhieu[] = [];
  for (const x of lichDichVu) {
    const k = `${x.lich_id}|${x.dich_vu_id}`;
    if (!dvCan.has(x.dich_vu_id) || co.has(k) || thay.has(k)) continue;
    thay.add(k); ra.push({ lichId: x.lich_id, dichVuId: x.dich_vu_id });
  }
  return ra;
}

/** Nhãn trạng thái riêng của phiếu vật tư THEO BUỔI khi chưa chốt (migration 0310): chờ chuyên viên trị liệu xác nhận / đã xác nhận, chờ chốt cuối ngày.
 *  Phiếu bác sĩ chỉ định hoặc phiếu đã chốt/huỷ trả null → dùng nhãn chung theo trang_thai. */
export function nhanPhieuBuoi(p: { trang_thai: string; buoi_id: string | null; xac_nhan_luc: string | null }): { nhan: string; kieu: "tot" | "cho" | "loi" } | null {
  if (!p.buoi_id || p.trang_thai !== "cho_cap") return null;
  return p.xac_nhan_luc ? { nhan: "Đã xác nhận, chờ chốt ngày", kieu: "tot" } : { nhan: "Chờ chuyên viên trị liệu xác nhận", kieu: "loi" };
}
