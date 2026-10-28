// Hồ sơ nhân sự: sơ yếu lý lịch + giấy tờ scan + nghỉ việc (dùng chung máy chủ và giao diện, không import "server-only").
// Nguồn nghiệp vụ: bitable HRM-HRIS-01 của MSC (bảng 1.1, 1.6, 1.8, 1.9), docs/msc-lark/nhan-su-ho-so-cong-luong.md mục 2.
export const LOAI_TAI_LIEU = [
  "CCCD mặt trước", "CCCD mặt sau", "Sơ yếu lý lịch", "Bằng cấp", "Hợp đồng lao động", "Cam kết bảo mật (NDA)", "Giấy khám sức khoẻ",
  "Sổ BHXH", "Giấy tờ người phụ thuộc", "Quyết định điều chỉnh", "Biên bản nghỉ việc", "Khác",
] as const;
export type LoaiTaiLieu = (typeof LOAI_TAI_LIEU)[number];

/** Giấy tờ bắt buộc trong hồ sơ (bảng 1.1 của MSC: ảnh CCCD 2 mặt, NDA, hợp đồng). */
export const GIAY_TO_BAT_BUOC: readonly LoaiTaiLieu[] = ["CCCD mặt trước", "CCCD mặt sau", "Sơ yếu lý lịch", "Hợp đồng lao động", "Cam kết bảo mật (NDA)"];
export const TRANG_THAI_TAI_LIEU = ["Chờ xác nhận", "Đã xác nhận", "Cần bổ sung"] as const;

export const MIME_CHO_PHEP = ["application/pdf", "image/jpeg", "image/png"] as const;
export const KICH_THUOC_TOI_DA = 10 * 1024 * 1024;
const DUOI: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
export const duoiTep = (mime: string) => DUOI[mime] ?? "";

export function kiemTraTep(mime: string, kichThuoc: number): string | null {
  if (!(MIME_CHO_PHEP as readonly string[]).includes(mime)) return "Chỉ nhận PDF, JPG hoặc PNG.";
  if (!Number.isInteger(kichThuoc) || kichThuoc <= 0) return "Tệp rỗng.";
  if (kichThuoc > KICH_THUOC_TOI_DA) return "Tệp quá 10 MB.";
  return null;
}

type TlTom = { loai: string; da_go: boolean; trang_thai: string };
/** Giấy tờ bắt buộc còn thiếu: chưa có tệp nào còn hiệu lực, hoặc tệp bị đánh dấu "Cần bổ sung". */
export function giayToConThieu(ds: TlTom[]): LoaiTaiLieu[] {
  return GIAY_TO_BAT_BUOC.filter((l) => !ds.some((d) => d.loai === l && !d.da_go && d.trang_thai !== "Cần bổ sung"));
}

/** Các nhóm trường của hồ sơ. Mỗi nhóm một hộp sửa nhỏ (không dồn 30 ô vào một form) để nhân viên tự điền dần, không bị choáng. */
export type TruongHoSo = { ten: string; nhan: string; loai: "chu" | "ngay" | "chon"; luaChon?: string[]; rong?: boolean; goiY?: string };
export const NHOM_HO_SO: { ma: string; ten: string; moTa: string; truong: TruongHoSo[] }[] = [
  { ma: "ca_nhan", ten: "Thông tin cá nhân", moTa: "Giới tính, ngày sinh, quê quán, địa chỉ.", truong: [
    { ten: "gioi_tinh", nhan: "Giới tính", loai: "chon", luaChon: ["Nam", "Nữ"] },
    { ten: "ngay_sinh", nhan: "Ngày sinh", loai: "ngay" },
    { ten: "noi_sinh", nhan: "Nơi sinh", loai: "chu" },
    { ten: "que_quan", nhan: "Quê quán", loai: "chu" },
    { ten: "dan_toc", nhan: "Dân tộc", loai: "chu" },
    { ten: "ton_giao", nhan: "Tôn giáo", loai: "chu" },
    { ten: "quoc_tich", nhan: "Quốc tịch", loai: "chu", goiY: "Việt Nam" },
    { ten: "tinh_trang_hon_nhan", nhan: "Tình trạng hôn nhân", loai: "chon", luaChon: ["Độc thân", "Đã lập gia đình", "Đã lập gia đình, có con", "Khác"] },
    { ten: "dien_thoai_rieng", nhan: "Số điện thoại cá nhân", loai: "chu" },
    { ten: "dia_chi_thuong_tru", nhan: "Địa chỉ thường trú", loai: "chu", rong: true },
    { ten: "dia_chi_hien_tai", nhan: "Địa chỉ hiện tại", loai: "chu", rong: true },
  ] },
  { ma: "giay_to", ten: "Giấy tờ, thuế, bảo hiểm", moTa: "CCCD, mã số thuế TNCN, sổ BHXH, thẻ BHYT.", truong: [
    { ten: "cccd", nhan: "Số CCCD", loai: "chu", goiY: "12 chữ số" },
    { ten: "ngay_cap_cccd", nhan: "Ngày cấp", loai: "ngay" },
    { ten: "noi_cap_cccd", nhan: "Nơi cấp", loai: "chu", rong: true },
    { ten: "ma_so_thue", nhan: "Mã số thuế TNCN", loai: "chu" },
    { ten: "so_bhxh", nhan: "Số sổ BHXH", loai: "chu", goiY: "10 chữ số" },
    { ten: "so_bhyt", nhan: "Số thẻ BHYT", loai: "chu", goiY: "15 ký tự" },
    { ten: "noi_dk_bhyt", nhan: "Nơi đăng ký khám BHYT", loai: "chu" },
  ] },
  { ma: "lien_he", ten: "Liên hệ khẩn cấp", moTa: "Người báo tin khi có việc gấp.", truong: [
    { ten: "nguoi_than_ten", nhan: "Họ tên người thân", loai: "chu" },
    { ten: "nguoi_than_quan_he", nhan: "Mối quan hệ", loai: "chu" },
    { ten: "nguoi_than_dien_thoai", nhan: "Số điện thoại", loai: "chu" },
  ] },
  { ma: "hoc_van", ten: "Học vấn", moTa: "Trình độ, trường, ngành.", truong: [
    { ten: "trinh_do", nhan: "Trình độ", loai: "chon", luaChon: ["Trung cấp", "Cao đẳng", "Đại học", "Sau đại học", "Khác"] },
    { ten: "truong", nhan: "Trường", loai: "chu" },
    { ten: "nganh", nhan: "Ngành học", loai: "chu" },
  ] },
  { ma: "nhan_luong", ten: "Nhận lương", moTa: "Hình thức và tài khoản nhận lương.", truong: [
    { ten: "hinh_thuc_nhan_luong", nhan: "Hình thức", loai: "chon", luaChon: ["chuyen_khoan", "tien_mat"] },
    { ten: "ngan_hang", nhan: "Ngân hàng", loai: "chu" },
    { ten: "so_tai_khoan", nhan: "Số tài khoản", loai: "chu" },
    { ten: "chu_tai_khoan", nhan: "Chủ tài khoản", loai: "chu", goiY: "Đúng họ tên trên thẻ" },
  ] },
];
export const NHAN_HINH_THUC_LUONG: Record<string, string> = { chuyen_khoan: "Chuyển khoản", tien_mat: "Tiền mặt" };
export const TRUONG_HO_SO = NHOM_HO_SO.flatMap((n) => n.truong.map((t) => t.ten));
const KIEU_NGAY = new Set(NHOM_HO_SO.flatMap((n) => n.truong.filter((t) => t.loai === "ngay").map((t) => t.ten)));
export const laTruongNgay = (ten: string) => KIEU_NGAY.has(ten);

const so = (s: string) => s.replace(/\s/g, "");
/** Kiểm tra các trường hồ sơ; trả về lỗi đầu tiên hoặc null. Trường trống luôn hợp lệ (điền dần). */
export function kiemTraHoSo(h: Record<string, string | undefined>): string | null {
  const ngayHopLe = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
  const sdt = /^[0-9+().-]{8,16}$/;
  if (h.cccd && !/^(\d{9}|\d{12})$/.test(so(h.cccd))) return "Số CCCD gồm 12 chữ số (CMND cũ 9 số).";
  if (h.dien_thoai_rieng && !sdt.test(so(h.dien_thoai_rieng))) return "Số điện thoại chưa đúng.";
  if (h.nguoi_than_dien_thoai && !sdt.test(so(h.nguoi_than_dien_thoai))) return "Số điện thoại người thân chưa đúng.";
  if (h.ma_so_thue && !/^(\d{10}|\d{13}|\d{10}-\d{3})$/.test(so(h.ma_so_thue))) return "Mã số thuế gồm 10 hoặc 13 chữ số.";
  if (h.so_bhxh && !/^\d{10}$/.test(so(h.so_bhxh))) return "Số sổ BHXH gồm 10 chữ số.";
  if (h.so_bhyt && !/^[A-Za-z0-9]{10,15}$/.test(so(h.so_bhyt))) return "Số thẻ BHYT gồm 10 đến 15 ký tự.";
  if (h.so_tai_khoan && !/^[0-9]{6,20}$/.test(so(h.so_tai_khoan))) return "Số tài khoản chỉ gồm chữ số (6 đến 20 số).";
  for (const k of ["ngay_sinh", "ngay_cap_cccd"]) if (h[k] && !ngayHopLe(h[k]!)) return k === "ngay_sinh" ? "Ngày sinh chưa đúng." : "Ngày cấp CCCD chưa đúng.";
  return null;
}

/** Hồ sơ đã điền bao nhiêu phần trăm các trường chính (để HCNS thấy ai còn thiếu). */
export const TRUONG_CHINH = ["gioi_tinh", "ngay_sinh", "que_quan", "dien_thoai_rieng", "cccd", "ngay_cap_cccd", "noi_cap_cccd", "dia_chi_thuong_tru", "dia_chi_hien_tai", "nguoi_than_ten", "nguoi_than_dien_thoai", "ma_so_thue", "so_bhxh", "ngan_hang", "so_tai_khoan"] as const;
export const tyLeDienHoSo = (h: Record<string, unknown> | null) => (h ? Math.round((TRUONG_CHINH.filter((k) => String(h[k] ?? "").trim() !== "").length / TRUONG_CHINH.length) * 100) : 0);

export const QUAN_HE_THAN_NHAN = ["Vợ", "Chồng", "Con", "Cha", "Mẹ", "Anh chị em", "Người giám hộ"] as const;
export const VAI_TRO_CHUYEN_MON: Record<string, string> = { bac_si_da_lieu: "Bác sĩ da liễu", ky_thuat_vien: "Kỹ thuật viên", tu_van: "Tư vấn", le_tan: "Lễ tân", thu_ngan: "Thu ngân", quan_ly: "Quản lý", cskh: "Chăm sóc khách hàng" };

// ───────── Lộ trình thăng tiến (Lark 1.6, 1.10) ─────────
export const VI_TRI: Record<string, string> = { giam_doc: "Giám đốc", truong_phong: "Trưởng phòng", truong_bo_phan: "Trưởng bộ phận", nhan_vien: "Nhân viên" };
export const LOAI_THAY_DOI: Record<string, string> = { tuyen_moi: "Tuyển mới", len_chinh_thuc: "Lên chính thức", thang_chuc: "Thăng chức", tang_luong: "Tăng lương", luan_chuyen: "Luân chuyển", dieu_chinh: "Điều chỉnh", khac: "Khác" };

// ───────── Nghỉ việc (Lark 1.8, 1.9) ─────────
export const NHOM_LY_DO_NGHI: Record<string, string> = {
  luong_thuong: "Lương thưởng chưa phù hợp", co_hoi_thang_tien: "Chưa có cơ hội thăng tiến", dinh_huong: "Công việc không đúng định hướng", doi_moi_truong: "Muốn đổi môi trường",
  ap_luc: "Áp lực công việc cao", khoi_luong: "Khối lượng công việc chưa hợp lý", van_hoa: "Chưa phù hợp văn hoá", ca_nhan: "Việc cá nhân / gia đình", khac: "Lý do khác",
};
export const LOAI_NGHI_VIEC: Record<string, string> = { dung_han: "Đúng hạn báo trước", truoc_han: "Trước hạn" };
export const TT_NGHI_VIEC: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt, chờ bàn giao", kieu: "cho" }, tu_choi: { ten: "Từ chối", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" }, hoan_tat: { ten: "Đã nghỉ việc", kieu: "tot" },
};

// ───────── Thống kê nhân sự (Lark 1.1: tuổi, thâm niên, tỷ lệ giữ chân) ─────────
const Y = (ngay: string) => new Date(`${ngay}T00:00:00Z`);
/** Số tháng tròn từ `tu` đến `den` (cả hai YYYY-MM-DD). */
export function soThang(tu: string, den: string): number {
  const a = Y(tu), b = Y(den);
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) m -= 1;
  return Math.max(0, m);
}
export function thamNien(tu: string | null | undefined, den: string): string {
  if (!tu) return "";
  const m = soThang(tu, den);
  if (m < 1) return "Mới vào";
  const nam = Math.floor(m / 12), thang = m % 12;
  return [nam ? `${nam} năm` : "", thang ? `${thang} tháng` : ""].filter(Boolean).join(" ");
}
export function nhomThamNien(tu: string | null | undefined, den: string): string {
  if (!tu) return "Chưa có ngày vào";
  const m = soThang(tu, den);
  return m < 3 ? "Dưới 3 tháng" : m < 6 ? "3 – 6 tháng" : m < 12 ? "6 tháng – 1 năm" : m < 36 ? "1 – 3 năm" : m < 84 ? "3 – 7 năm" : "Trên 7 năm";
}
export const THU_TU_THAM_NIEN = ["Dưới 3 tháng", "3 – 6 tháng", "6 tháng – 1 năm", "1 – 3 năm", "3 – 7 năm", "Trên 7 năm", "Chưa có ngày vào"];
export function tuoi(ngaySinh: string | null | undefined, den: string): number | null {
  if (!ngaySinh) return null;
  return Math.floor(soThang(ngaySinh, den) / 12);
}
export function nhomTuoi(t: number | null): string {
  return t === null ? "Chưa có ngày sinh" : t < 25 ? "Dưới 25" : t < 30 ? "25 – 29" : t < 35 ? "30 – 34" : t < 45 ? "35 – 44" : "Từ 45";
}
export const THU_TU_TUOI = ["Dưới 25", "25 – 29", "30 – 34", "35 – 44", "Từ 45", "Chưa có ngày sinh"];

/** Số ngày từ hôm nay (YYYY-MM-DD) tới sinh nhật kế tiếp (0 = hôm nay). */
export function ngayToiSinhNhat(ngaySinh: string, hom: string): number {
  const [, m, d] = ngaySinh.split("-").map(Number);
  const nam = Number(hom.slice(0, 4));
  const thu = (n: number) => Date.UTC(n, m - 1, d === 29 && m === 2 && !(n % 4 === 0 && (n % 100 !== 0 || n % 400 === 0)) ? 28 : d);
  const h = Y(hom).getTime();
  const t = thu(nam) >= h ? thu(nam) : thu(nam + 1);
  return Math.round((t - h) / 86_400_000);
}
