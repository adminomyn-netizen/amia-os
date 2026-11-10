// Quy trình từng bước khi chuyên viên trị liệu làm cho khách (0322). Phần gộp thuần, không đọc DB, để test được.
// Khách làm nhiều dịch vụ cùng lúc: bước chung (tẩy trang, rửa mặt…) chỉ hiện và tích MỘT lần; thứ tự theo bước sớm nhất trong các dịch vụ.

export type BuocDv = { buocId: string; ten: string; thuTu: number; goiY: string | null };
export type BuocGop = { id: string; ten: string; goiY: string[]; dichVu: string[]; daTich: boolean };

export function gopBuoc(dv: { ten: string; buoc: BuocDv[] }[], daTich: Set<string>): { buoc: BuocGop[]; dvChuaCo: string[] } {
  const m = new Map<string, BuocGop & { thu: number; vao: number }>();
  let vao = 0;
  for (const d of dv) {
    for (const b of [...d.buoc].sort((a, c) => a.thuTu - c.thuTu)) {
      const cu = m.get(b.buocId);
      if (cu) {
        cu.thu = Math.min(cu.thu, b.thuTu);
        if (!cu.dichVu.includes(d.ten)) cu.dichVu.push(d.ten);
        if (b.goiY && !cu.goiY.includes(b.goiY)) cu.goiY.push(b.goiY);
      } else m.set(b.buocId, { id: b.buocId, ten: b.ten, goiY: b.goiY ? [b.goiY] : [], dichVu: [d.ten], daTich: daTich.has(b.buocId), thu: b.thuTu, vao: vao++ });
    }
  }
  const buoc = [...m.values()].sort((a, b) => a.thu - b.thu || a.vao - b.vao).map((x) => ({ id: x.id, ten: x.ten, goiY: x.goiY, dichVu: x.dichVu, daTich: x.daTich }));
  return { buoc, dvChuaCo: [...new Set(dv.filter((d) => d.buoc.length === 0).map((d) => d.ten))] };
}

/** Tiến độ quy trình: đã làm x/y bước và bước kế tiếp (bước chưa tích đầu tiên theo thứ tự) — để nhắc chuyên viên và báo thu ngân (chị Lâm 11/11/2026). */
export type TienDoBuoc = { xong: number; tong: number; tiep: { stt: number; ten: string; goiY: string[] } | null };
export function tienDoBuoc(buoc: readonly Pick<BuocGop, "ten" | "goiY" | "daTich">[]): TienDoBuoc {
  const i = buoc.findIndex((b) => !b.daTich);
  return { xong: buoc.filter((b) => b.daTich).length, tong: buoc.length, tiep: i < 0 ? null : { stt: i + 1, ten: buoc[i].ten, goiY: buoc[i].goiY } };
}

/** Một dòng nhắc việc tiếp theo cho chuyên viên: "Bước tiếp theo 2/5: Rửa mặt · Vật tư: …" hoặc "Đã đủ 5/5 bước — trả khách thì bấm Kết thúc." */
export function nhacBuocTiep(td: TienDoBuoc): string {
  if (!td.tong) return "Làm theo quy trình, trả khách thì bấm Kết thúc.";
  if (!td.tiep) return `Đã đủ ${td.tong}/${td.tong} bước — trả khách thì bấm Kết thúc.`;
  return `Bước tiếp theo ${td.tiep.stt}/${td.tong}: ${td.tiep.ten}${td.tiep.goiY.length ? ` · Vật tư: ${td.tiep.goiY.join("; ")}` : ""}`;
}

/** Báo lại thu ngân lên đơn khi lượt đóng: "Đã xong – trả khách · Lan · Peel da · 5/5 bước · 45 phút". */
export function tinKetQuaLuot(o: { trangThai: "xong" | "tra_lai" | "huy"; khach: string; dichVu: string; td?: TienDoBuoc | null; phut?: number | null; lyDo?: string | null; nguoi?: string }): string {
  const dau = o.trangThai === "xong" ? "Đã xong – trả khách" : o.trangThai === "tra_lai" ? "Trả lại thu ngân" : "Khách không làm";
  return [dau, o.khach, o.dichVu, o.td?.tong ? `${o.td.xong}/${o.td.tong} bước` : "", o.phut != null ? `${o.phut} phút` : "", o.lyDo ? `Lý do: ${o.lyDo}` : "", o.nguoi ? `(${o.nguoi})` : ""].filter(Boolean).join(" · ");
}
