// Thư viện chung cho bộ chuyển NHÂN SỰ Lark MSC (base HRM-HRIS-01) → AMIA OS (đợt 28/10/2026).
// Nguồn: sao-luu/hr-lark/b_<mã bảng>.ndjson (xuất bằng lark-cli2, CHỈ nằm trên máy, thư mục sao-luu/ đã .gitignore — có CCCD/số TK/lương).
// Không in dữ liệu cá nhân ra log: chỉ đếm.
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";

export const DIR = "sao-luu/hr-lark";
export const docBang = (ma) => {
  const tep = existsSync(`${DIR}/b_${ma}.full.ndjson`) ? `${DIR}/b_${ma}.full.ndjson` : `${DIR}/b_${ma}.ndjson`;
  return readFileSync(tep, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
};

export async function ketNoi() {
  if (!process.env.PW) throw new Error("Thiếu PW (mật khẩu DB lấy từ Keychain amia-os-db-password)");
  const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false }, statement_timeout: 600000 });
  await db.connect();
  return db;
}

// ───────── Bộ đọc giá trị của Lark ─────────
const b1 = (v) => (Array.isArray(v) ? (v.length ? v[0] : null) : v);
/** Chuỗi/đa chọn → chuỗi đầu, rỗng → null. */
export const chu = (v) => { v = b1(v); if (v == null) return null; if (typeof v === "object") return v.name ?? v.text ?? null; const s = String(v).replace(/\s+/g, " ").trim(); return s === "" || s === "None" ? null : s; };
export const danhSach = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "object" ? x.name ?? x.text : x)).filter(Boolean) : v ? [v] : []);
/** Số: nhận "15,800,000", "35000", 35000, "" → null. Tiền làm tròn về đồng nguyên. */
export const so = (v) => { v = b1(v); if (v == null || v === "") return null; const n = Number(String(v).replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
export const tien = (v) => { const n = so(v); return n == null ? null : Math.round(n); };
const iso = (y, m, d) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
/** Ngày: ISO có múi giờ (+07:00), "dd/mm/yyyy", hoặc số seri Excel/Lark tính theo UTC (xx.70833 = 00:00 giờ VN hôm sau). → "yyyy-mm-dd" hoặc null. */
export function ngay(v) {
  v = b1(v);
  if (v == null || v === "" || v === "None") return null;
  if (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v))) {
    const n = Number(v); if (n < 20000 || n > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round((n + 7 / 24) * 86400e3) - 0); // giờ VN
    return d.toISOString().slice(0, 10);
  }
  const s = String(v);
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  if (m) { const t = new Date(s).getTime() + 7 * 3600e3; return new Date(t).toISOString().slice(0, 10); }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return s;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return iso(m[3], m[2], m[1]);
  return null;
}
/** Thời điểm đầy đủ → ISO UTC (timestamptz) hoặc null. Nhận số mili giây, ISO, hoặc chuỗi "yyyy/mm/dd hh:mm". */
export function thoiDiem(v) {
  v = b1(v); if (v == null || v === "") return null;
  if (typeof v === "number" || /^\d{12,14}$/.test(String(v))) { const d = new Date(Number(v)); return isNaN(d) ? null : d.toISOString(); }
  const d = new Date(String(v)); return isNaN(d) ? null : d.toISOString();
}
export const nguoiLark = (v) => { const a = Array.isArray(v) ? v : v ? [v] : []; return a[0]?.id ?? null; };

// ───────── Chuẩn hoá tên / điện thoại ─────────
export const khongDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
export const sdt = (s) => { let p = String(s ?? "").replace(/\D/g, ""); if (p.startsWith("84") && p.length >= 11) p = "0" + p.slice(2); return p; };
/** Bỏ tiền tố mã kiểu "MSC.CT-25.0090." / "MSC.TV-" ở tên nhân viên SalonHero. */
export function tenSach(s) {
  const t = String(s ?? "").trim().split(/[\s.\-]+/); let i = 0;
  while (i < t.length && !/^[A-ZĐ][a-zà-ỹđ]+$/.test(t[i])) i++;
  return i < t.length ? t.slice(i).join(" ") : String(s ?? "");
}
export const maTrongTen = (s) => { const m = String(s ?? "").match(/^(MSC[\w.\-]*?)[.\s\-]+(?=[A-ZĐ][a-zà-ỹđ])/); return m ? m[1].replace(/\.$/, "") : null; };

// ───────── Ánh xạ danh mục ─────────
export const DON_VI = { MSC: "MSC", AVI: "AVI", ADL: "ADL" };
export const CN_THEO_DON_VI = { AVI: "VINH", ADL: "DALAT", MSC: null };
/** Phòng ban Lark → phòng ban chung AMIA (tên trong bảng phong_ban). */
export function phongBanChung(ten) {
  const k = khongDau(ten);
  if (!k) return null;
  if (k === "bod") return "Ban Giám đốc";
  if (k.startsWith("tai chinh")) return "Tài chính - Kế toán - Cung ứng";
  if (k.startsWith("kinh doanh")) return "Kinh doanh";
  if (k.startsWith("tri lieu")) return "Chuyên môn - Trị liệu";
  if (k.startsWith("tu van")) return "Tư vấn";
  if (k.startsWith("hanh chinh")) return "Hành chính - Nhân sự";
  if (k.startsWith("tiep thi")) return "Tiếp thị";
  if (k.startsWith("dvkh")) return "Dịch vụ khách hàng";
  return null;
}
/** Chức danh/chức vụ Lark → vai trò hệ thống AMIA (chỉ quyền chuyên môn gợi ý, KHÔNG cấp tài khoản). */
export function vaiTroTheoChucDanh(cd) {
  const k = khongDau(cd);
  if (/quan ly chi nhanh|giam doc chi nhanh/.test(k)) return "quan_ly";
  if (/^giam doc|tro ly giam doc|truong ban kiem soat|truong phong|truong bo phan|truong nhom/.test(k) && !/tri lieu|tu van/.test(k)) return k.startsWith("truong phong tiep thi") ? "marketing" : k.startsWith("truong phong nhan luc") ? "nhan_su" : "quan_ly";
  if (/bac si|bac sy/.test(k)) return "bac_si";
  if (/tri lieu|ktv|ky thuat vien/.test(k)) return "ktv";
  if (/tu van|telesales/.test(k)) return "tu_van";
  if (/thu ngan/.test(k)) return "thu_ngan";
  if (/ke toan/.test(k)) return "ke_toan";
  if (/tiep thi|noi dung|bien tap|thiet ke|tuyen dung cong tac|marketing|su kien/.test(k)) return "marketing";
  if (/hanh chinh|nhan luc|nhan su|tuyen dung/.test(k)) return "nhan_su";
  if (/le tan/.test(k)) return "le_tan";
  if (/thu kho/.test(k)) return "thu_kho";
  return "nhan_vien";
}
export const KHUNG = { "Văn Phòng": "van_phong", "Chi Nhánh": "chi_nhanh", "Không chấm công": "khong_cham_cong" };
export const VI_TRI = { "Giám đốc": "giam_doc", "Trưởng phòng": "truong_phong", "Trưởng bộ phận": "truong_bo_phan", "Nhân viên": "nhan_vien" };
