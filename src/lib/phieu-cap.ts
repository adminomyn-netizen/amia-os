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
