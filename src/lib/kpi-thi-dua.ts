export type KyKpi = "thang" | "quy";
export type DiemKpi = { nhan_vien_id: string; nam: number; thang: number; diem: number | string };
export type NguoiKpi = { id: string; ten: string; phongId: string | null; diem: number; soThang: number; hang: number };
export type PhongKpi = { id: string; ten: string; diem: number; soNguoi: number; hang: number };

export const quyCuaThang = (thang: number) => Math.ceil(thang / 3);
/** Các tháng thuộc kỳ: tháng → [m]; quý q → 3 tháng của quý. */
export const thangCuaKy = (ky: KyKpi, moc: number) => (ky === "thang" ? [moc] : [1, 2, 3].map((i) => (moc - 1) * 3 + i));

/** Hạng kiểu thi đua: cùng điểm thì cùng hạng, hạng sau nhảy cách (1, 1, 3). Danh sách đã xếp giảm dần theo điểm. */
function ganHang<T extends { diem: number }>(ds: T[]) {
  const sx = [...ds].sort((a, b) => b.diem - a.diem);
  return sx.map((x, i) => ({ ...x, hang: i > 0 && sx[i - 1].diem === x.diem ? 0 : i + 1 })).map((x, i, a) => ({ ...x, hang: x.hang || a[i - 1].hang })) as (T & { hang: number })[];
}

/** Điểm cá nhân của kỳ = trung bình các tháng có điểm trong kỳ (quý thiếu tháng thì tính trên các tháng có). Người không có điểm nào trong kỳ không vào bảng. */
export function xepHangCaNhan(diem: DiemKpi[], nam: number, ky: KyKpi, moc: number, nguoi: Map<string, { ten: string; phongId: string | null }>): NguoiKpi[] {
  const thangs = new Set(thangCuaKy(ky, moc));
  const gom = new Map<string, number[]>();
  for (const d of diem) if (d.nam === nam && thangs.has(d.thang) && nguoi.has(d.nhan_vien_id)) gom.set(d.nhan_vien_id, [...(gom.get(d.nhan_vien_id) ?? []), Number(d.diem)]);
  const ds = [...gom].map(([id, v]) => ({ id, ten: nguoi.get(id)!.ten, phongId: nguoi.get(id)!.phongId, diem: Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 100) / 100, soThang: v.length }));
  return ganHang(ds);
}

/** Điểm phòng = trung bình điểm cá nhân của những người có điểm trong kỳ (người chưa có điểm không kéo điểm phòng xuống). Người chưa gán phòng không tính. */
export function xepHangPhong(canhan: NguoiKpi[], tenPhong: (id: string) => string): PhongKpi[] {
  const gom = new Map<string, number[]>();
  for (const n of canhan) if (n.phongId) gom.set(n.phongId, [...(gom.get(n.phongId) ?? []), n.diem]);
  return ganHang([...gom].map(([id, v]) => ({ id, ten: tenPhong(id), diem: Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 100) / 100, soNguoi: v.length })));
}

/** Xếp hạng trong từng phòng (hạng tính lại theo phòng). */
export function xepHangTrongPhong(canhan: NguoiKpi[], phongId: string) {
  return ganHang(canhan.filter((n) => n.phongId === phongId));
}

export type Thuong = { ky: string; doi_tuong: string; hang: number; so_tien: number | string };
export const tienThuong = (bang: Thuong[], ky: KyKpi, doiTuong: "phong" | "ca_nhan_phong" | "cong_ty", hang: number) =>
  hang >= 1 && hang <= 3 ? Number(bang.find((t) => t.ky === ky && t.doi_tuong === doiTuong && t.hang === hang)?.so_tien ?? 0) : 0;
