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
