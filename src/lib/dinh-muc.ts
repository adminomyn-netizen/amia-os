import { khoaTen } from "@/lib/san-pham";

/** ĐỊNH MỨC vật tư theo dịch vụ: hàm thuần để tính giá vốn vật tư và đọc dữ liệu dán từ bảng tính (có test). */

export type DongDinhMuc = { so_luong: number; chon_theo_chi_dinh: boolean; nhom_cap: string | null; gia_nhap_don_vi: number | null };

export type GiaVonDinhMuc = {
  /** Vật tư luôn cấp (không phải phương án): cộng số lượng × giá nhập. Đây là giá vốn vật tư tối thiểu mỗi ca. */
  coDinh: number;
  /** Số vật tư luôn cấp chưa có giá nhập: giá vốn cố định đang thấp hơn thực tế. */
  coDinhThieuGia: number;
  /** Vật tư bác sĩ chọn theo ca: mỗi ca chỉ dùng vài loại, nên KHÔNG cộng vào giá vốn cố định. Tổng nếu dùng hết mọi phương án. */
  phuongAnTong: number;
  /** Phương án đắt nhất nếu chỉ dùng một loại. */
  phuongAnLonNhat: number;
  phuongAnThieuGia: number;
};

const tien = (d: DongDinhMuc) => Number(d.so_luong) * Number(d.gia_nhap_don_vi ?? 0);
/** Giá vốn vật tư của một dịch vụ theo định mức. Giá nhập thiếu thì tính 0 và đếm vào *ThieuGia (không bịa số). */
export function tinhGiaVonDinhMuc(rows: DongDinhMuc[]): GiaVonDinhMuc {
  const cd = rows.filter((r) => !r.chon_theo_chi_dinh), pa = rows.filter((r) => r.chon_theo_chi_dinh);
  return {
    coDinh: cd.reduce((t, r) => t + tien(r), 0), coDinhThieuGia: cd.filter((r) => r.gia_nhap_don_vi == null).length,
    phuongAnTong: pa.reduce((t, r) => t + tien(r), 0), phuongAnLonNhat: pa.reduce((m, r) => Math.max(m, tien(r)), 0), phuongAnThieuGia: pa.filter((r) => r.gia_nhap_don_vi == null).length,
  };
}

export type CanhBaoDinhMuc = { ma: "khong_nhom_a" | "thieu_gia" | "chua_co_ton"; nhan: string; soDong: number };
/** Cảnh báo trên màn định mức của MỘT dịch vụ. `tonTheoSp`: tồn hiện có (tổng các chi nhánh) của từng vật tư. */
export function canhBaoDinhMuc(rows: (DongDinhMuc & { san_pham_id: string })[], tonTheoSp: Map<string, number>): CanhBaoDinhMuc[] {
  const ra: CanhBaoDinhMuc[] = [];
  const khongA = rows.filter((r) => r.nhom_cap !== "A");
  if (khongA.length) ra.push({ ma: "khong_nhom_a", soDong: khongA.length, nhan: `${khongA.length} vật tư không thuộc nhóm cấp A: phiếu cấp trước ca sẽ BỎ QUA các dòng này, nhưng giá vốn vẫn tính. Đặt nhóm cấp A ở Chuẩn hoá vật tư nếu cần cấp trước ca.` });
  const thieuGia = rows.filter((r) => r.gia_nhap_don_vi == null);
  if (thieuGia.length) ra.push({ ma: "thieu_gia", soDong: thieuGia.length, nhan: `${thieuGia.length} vật tư chưa có giá nhập nên giá vốn đang thấp hơn thực tế.` });
  const chuaTon = rows.filter((r) => r.nhom_cap === "A" && !r.chon_theo_chi_dinh && (tonTheoSp.get(r.san_pham_id) ?? 0) < Number(r.so_luong));
  if (chuaTon.length) ra.push({ ma: "chua_co_ton", soDong: chuaTon.length, nhan: `${chuaTon.length} vật tư cấp cố định chưa đủ tồn kho để cấp một ca. Dịch vụ có vật tư nhóm A thì không mở ca được khi chưa có phiếu cấp, nên cần nhập hoặc kiểm kê tồn đầu trước.` });
  return ra;
}

export type DongDan = { dich_vu_id: string; san_pham_id: string; so_luong: number; chon_theo_chi_dinh: boolean };
const khoa = (s: string) => khoaTen(s);
const TRUE = ["1", "x", "có", "co", "true", "yes"];
/** Đọc văn bản dán từ Excel/Google Sheet: mỗi dòng "Dịch vụ ⇥ Vật tư ⇥ Số lượng ⇥ Theo chỉ định (1/0)". Khớp theo MÃ hoặc TÊN (không phân biệt hoa thường, dấu); dòng khớp được giữ, dòng lỗi được liệt kê.
 *  Cùng một cặp (dịch vụ, vật tư) xuất hiện nhiều lần thì lấy dòng cuối. Không bịa gì: không khớp thì báo lỗi, không đoán. */
export function phanTichDinhMuc(van_ban: string, dichVu: { id: string; ma: string; ten: string }[], sanPham: { id: string; ma: string; ten: string }[]): { rows: DongDan[]; loi: string[] } {
  const mapDv = new Map<string, string>(), mapSp = new Map<string, string>();
  // Tên trùng nhau (sau khi bỏ dấu) thì đánh dấu "" = mơ hồ, bắt người nhập dùng mã.
  const dat = (m: Map<string, string>, k: string, id: string) => m.set(k, m.has(k) && m.get(k) !== id ? "" : id);
  for (const d of dichVu) { dat(mapDv, khoa(d.ten), d.id); dat(mapDv, khoa(d.ma), d.id); }
  for (const s of sanPham) { dat(mapSp, khoa(s.ten), s.id); dat(mapSp, khoa(s.ma), s.id); }
  const dong = van_ban.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = new Map<string, DongDan>(), loi: string[] = [];
  dong.forEach((l, i) => {
    const c = l.split(/\t|\||;/).map((x) => x.trim());
    if (i === 0 && /^(dịch vụ|ma dich vu|mã dịch vụ)$/i.test(c[0])) return;
    if (c.length < 3) return void loi.push(`Dòng ${i + 1}: cần ít nhất 3 cột (dịch vụ, vật tư, số lượng)`);
    const d = mapDv.get(khoa(c[0])), s = mapSp.get(khoa(c[1])), n = Number(c[2].replace(/\./g, "").replace(",", "."));
    if (d === "") return void loi.push(`Dòng ${i + 1}: tên dịch vụ "${c[0]}" trùng nhiều mục, hãy dùng mã dịch vụ`);
    if (s === "") return void loi.push(`Dòng ${i + 1}: tên vật tư "${c[1]}" trùng nhiều mục, hãy dùng mã vật tư`);
    if (!d) return void loi.push(`Dòng ${i + 1}: không có dịch vụ "${c[0]}" trong danh mục`);
    if (!s) return void loi.push(`Dòng ${i + 1}: không có vật tư "${c[1]}" trong danh mục`);
    if (!(n > 0)) return void loi.push(`Dòng ${i + 1}: số lượng "${c[2]}" chưa hợp lệ`);
    rows.set(`${d}|${s}`, { dich_vu_id: d, san_pham_id: s, so_luong: n, chon_theo_chi_dinh: TRUE.includes((c[3] ?? "").toLowerCase()) });
  });
  return { rows: [...rows.values()], loi };
}
