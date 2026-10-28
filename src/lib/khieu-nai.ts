// Khiếu nại (QT-11 / BM17), biến chứng (QT-12 / BM18), bảo hành (BM19, chính sách 4.4) của Khung nghiệp vụ KD.

export const LOAI_KN: Record<string, string> = { dich_vu: "Dịch vụ", thai_do: "Thái độ", tai_chinh: "Tài chính", y_khoa: "Y khoa (chuyển biến chứng)" };
export const KENH_KN: Record<string, string> = { truc_tiep: "Trực tiếp", dien_thoai: "Điện thoại", zalo: "Zalo", facebook: "Facebook / mạng xã hội", khac: "Khác" };
export const CACH_XAC_NHAN: Record<string, string> = { ky: "Khách ký xác nhận", zalo: "Khách xác nhận qua Zalo", goi: "Khách xác nhận qua điện thoại" };

type Kieu = "tot" | "cho" | "loi" | "tram";
export const TT_KN: Record<string, { ten: string; kieu: Kieu; buoc: number }> = {
  moi: { ten: "Mới tiếp nhận", kieu: "loi", buoc: 1 },
  cho_duyet: { ten: "Chờ duyệt phương án", kieu: "cho", buoc: 4 },
  da_duyet: { ten: "Đang khắc phục, chờ khách xác nhận", kieu: "cho", buoc: 5 },
  dong: { ten: "Đã đóng", kieu: "tot", buoc: 7 },
  chuyen_bc: { ten: "Đã chuyển biến chứng", kieu: "tram", buoc: 2 },
};
export const TT_BC: Record<string, { ten: string; kieu: Kieu; buoc: number }> = {
  moi: { ten: "Mới báo, chờ bác sĩ", kieu: "loi", buoc: 1 },
  dang_xu_ly: { ten: "Bác sĩ đã khám, chờ cam kết", kieu: "cho", buoc: 2 },
  da_cam_ket: { ten: "Đã cam kết với khách", kieu: "cho", buoc: 3 },
  dong: { ten: "Đã đóng", kieu: "tot", buoc: 6 },
};
/** Các bước của QT-11 / QT-12 để hiện thanh tiến độ (mã bước khớp bảng kd_qt_buoc). */
export const BUOC_KN = ["Tiếp nhận", "Phân loại", "Phương án", "Duyệt", "Khắc phục & khách xác nhận", "Lưu hồ sơ"];
export const BUOC_BC = ["Phát hiện, đưa đến bác sĩ", "Bác sĩ khám & phương án", "Cam kết với khách", "Báo lãnh đạo", "Nguyên nhân gốc & phòng ngừa"];

export const KN_DANG_XU_LY = ["moi", "cho_duyet", "da_duyet"];

export type ThamSoBaoHanh = { moc1: number; moc2: number; moc3: number; tyLe1: number; tyLe2: number; trietLong: number };
export const THAM_SO_BH_MAC_DINH: ThamSoBaoHanh = { moc1: 3, moc2: 6, moc3: 12, tyLe1: 50, tyLe2: 40, trietLong: 12 };

/** Đọc tham số bảo hành từ bảng cau_hinh (thiếu thì dùng giá trị trong Khung KD 4.4.2). */
export function thamSoBaoHanh(cauHinh: { khoa: string; gia_tri: string }[]): ThamSoBaoHanh {
  const m = new Map(cauHinh.map((c) => [c.khoa, Number(c.gia_tri)]));
  const g = (k: string, mac: number) => { const v = m.get(k); return v != null && Number.isFinite(v) && v >= 0 ? v : mac; };
  const d = THAM_SO_BH_MAC_DINH;
  return { moc1: g("bh_thang_moc_1", d.moc1), moc2: g("bh_thang_moc_2", d.moc2), moc3: g("bh_thang_moc_3", d.moc3), tyLe1: g("bh_ty_le_moc_1", d.tyLe1), tyLe2: g("bh_ty_le_moc_2", d.tyLe2), trietLong: g("bh_triet_long_thang", d.trietLong) };
}

/** Số tháng tròn từ ngày a đến ngày b (yyyy-mm-dd). */
export function thangTron(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number), [y2, m2, d2] = b.split("-").map(Number);
  return Math.max(0, (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0));
}
const congThang = (ngay: string, n: number) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };

export type KetQuaBaoHanh = { moc: "duoi_moc_1" | "moc_1" | "moc_2" | "tren_moc_3" | "nam_mot_lan"; tyLeGiam: number | null; nhan: string; chiTiet: string };

/** Mốc ưu đãi làm lại tính từ buổi cuối của dịch vụ (Khung KD 4.4.2): 3–6 tháng giảm 50%, 6–12 tháng giảm 40%, quá 12 tháng theo giá mới; triệt lông bảo hành 1 năm/lần.
 *  Dưới mốc đầu khung chưa ghi mức nên KHÔNG tự đặt: xử lý theo từng ca (QT-11/12). */
export function tinhBaoHanh(ngayCuoi: string, homNay: string, kieu: string, t: ThamSoBaoHanh = THAM_SO_BH_MAC_DINH): KetQuaBaoHanh {
  const thang = thangTron(ngayCuoi, homNay);
  if (kieu === "nam_mot_lan") {
    const het = congThang(ngayCuoi, t.trietLong);
    return thang < t.trietLong
      ? { moc: "nam_mot_lan", tyLeGiam: null, nhan: "Trong hạn bảo hành 1 năm/lần", chiTiet: `Triệt lông: bảo hành ${t.trietLong} tháng/lần, tính từ buổi cuối, đến hết ${het.split("-").reverse().join("/")}.` }
      : { moc: "nam_mot_lan", tyLeGiam: null, nhan: "Quá hạn bảo hành 1 năm", chiTiet: `Quá ${t.trietLong} tháng kể từ buổi cuối: làm lại theo giá mới.` };
  }
  if (thang < t.moc1) return { moc: "duoi_moc_1", tyLeGiam: null, nhan: `Dưới ${t.moc1} tháng`, chiTiet: "Khung nghiệp vụ chưa ghi mức ưu đãi cho giai đoạn này: Quản lý xem từng ca (QT-11/12)." };
  if (thang < t.moc2) return { moc: "moc_1", tyLeGiam: t.tyLe1, nhan: `Mốc ${t.moc1}–${t.moc2} tháng`, chiTiet: `Làm lại ưu đãi ${t.tyLe1}%.` };
  if (thang < t.moc3) return { moc: "moc_2", tyLeGiam: t.tyLe2, nhan: `Mốc ${t.moc2}–${t.moc3} tháng`, chiTiet: `Làm lại ưu đãi ${t.tyLe2}%.` };
  return { moc: "tren_moc_3", tyLeGiam: null, nhan: `Trên ${t.moc3} tháng`, chiTiet: "Làm lại theo giá mới." };
}

/** Giờ đã trôi qua kể từ lúc tiếp nhận (làm tròn xuống). */
export const gioTroi = (iso: string, bayGio = Date.now()) => Math.floor((bayGio - new Date(iso).getTime()) / 3_600_000);
/** Tham số số dương (SLA, hạn mức): trống hoặc không hợp lệ = "chờ chốt", chưa áp. */
export const soDuongHoacNull = (v: string | null | undefined): number | null => { const n = Number(String(v ?? "").trim()); return String(v ?? "").trim() !== "" && Number.isFinite(n) && n > 0 ? n : null; };
