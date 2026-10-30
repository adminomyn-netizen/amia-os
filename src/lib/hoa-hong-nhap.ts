import { khoaTen } from "@/lib/san-pham";

/** NHẬP CẢ BẢNG TỈ LỆ HOA HỒNG từ Excel (dán bảng hoặc tệp .xlsx/.csv). Toàn bộ là hàm thuần để có test.
 *  Cột: Loại · Mã hoặc tên mục · Vai · Tỉ lệ (%) · Số tiền cố định · Đối tượng. Định dạng XUẤT tỉ lệ hiện có dùng đúng các cột này nên xuất ra, sửa, nhập lại được.
 *  Không đoán: mục không tìm thấy, tên trùng nhiều mục, vai lạ, số sai đều báo LỖI; còn một dòng lỗi là không ghi dòng nào. */

export type LoaiMuc = "dich_vu" | "san_pham" | "goi_the";
export const NHAN_LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ / liệu trình" };
export const NHAN_VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng", gioi_thieu: "Giới thiệu" };
/** Tiêu đề cột của mẫu và của tệp xuất (thứ tự cố định). Cột "Tên mục (để xem)" chỉ để đọc, khi nhập bị bỏ qua. */
export const TIEU_DE_NHAP = ["Loại", "Mã hoặc tên mục", "Vai", "Tỉ lệ (%)", "Số tiền cố định", "Đối tượng"] as const;
export const TIEU_DE_TEN_MUC = "Tên mục (để xem)";
export const TOI_DA_DONG = 3000;

export type MucDanhMuc = { id: string; ma: string | null; ten: string };
export type NhanVienDanhMuc = { id: string; ma_nv: string | null; ho_ten: string };
export type DanhMucNhap = { dich_vu: MucDanhMuc[]; san_pham: MucDanhMuc[]; goi_the: MucDanhMuc[]; nhan_vien: NhanVienDanhMuc[]; /** Nhóm chức danh đã có: chữ thường, bỏ khoảng trắng hai đầu (cùng cách so khớp với lúc tính hoa hồng). */ nhom: string[] };
export type TiLeHienCo = { loai: string; vai: string; muc_id: string | null; nhan_vien_id: string | null; nhom_chuc_danh: string | null; ti_le: number; so_tien: number | null };

/** Một dòng thô đọc từ bảng (chưa hiểu nghĩa). `dong` = số dòng trong bảng nguồn (dòng tiêu đề tính là 1), trùng số dòng Excel. */
export type DongTho = { dong: number; loai: string; muc: string; vai: string; tiLe: string; soTien: string; doiTuong: string };
export type HanhDongNhap = "them" | "ghi_de" | "giu_nguyen" | "loi";
export type DongNhap = {
  dong: number; hanh_dong: HanhDongNhap; loi?: string;
  loai: string; vai: string; muc_id: string | null; nhan_vien_id: string | null; nhom_chuc_danh: string | null;
  mucNhan: string; doiTuongNhan: string; ti_le: number | null; so_tien: number | null; ti_le_cu: number | null; so_tien_cu: number | null;
};

const bo = (s: string) => khoaTen(s).replace(/[^a-z0-9]+/g, " ").trim();
const gon = (s: string) => s.replace(/\s+/g, " ").trim();

/** Tách văn bản dán (Excel/Google Sheet dán ra là TSV) hoặc nội dung .csv thành các dòng ô. Có xử lý ô đặt trong dấu nháy kép. */
export function tachBang(van_ban: string): string[][] {
  const text = van_ban.replace(/^\uFEFF/, "");
  const dau = text.includes("\t") ? "\t" : text.includes(";") ? ";" : text.includes("|") ? "|" : ",";
  const ra: string[][] = [];
  let dong: string[] = [], o = "", trongNhay = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (trongNhay) {
      if (c === '"') { if (text[i + 1] === '"') { o += '"'; i++; } else trongNhay = false; } else o += c;
    } else if (c === '"' && o === "") trongNhay = true;
    else if (c === dau) { dong.push(o); o = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; dong.push(o); ra.push(dong); dong = []; o = ""; }
    else o += c;
  }
  if (o !== "" || dong.length) { dong.push(o); ra.push(dong); }
  return ra;
}

type KhoaCot = "loai" | "muc" | "vai" | "tiLe" | "soTien" | "doiTuong";
const TEN_COT: Record<KhoaCot, string[]> = {
  loai: ["loai", "loai muc", "loai hang"],
  muc: ["ma hoac ten muc", "ma muc", "ten muc", "muc", "ma hoac ten"],
  vai: ["vai", "vai tro"],
  tiLe: ["ti le", "ty le", "ti le hoa hong", "ty le hoa hong", "phan tram"],
  soTien: ["so tien co dinh", "so tien", "so tien co dinh luot", "so tien co dinh moi luot"],
  doiTuong: ["doi tuong", "ap dung cho", "ap dung"],
};

/** Đọc bảng ô → dòng thô. Có dòng tiêu đề thì nhận cột theo tên (thứ tự bất kỳ, cột lạ bị bỏ qua); không có thì theo thứ tự cố định 6 cột. Bỏ dòng trống. */
export function docBangTiLe(bang: string[][]): { dong: DongTho[]; loiChung?: string } {
  const khongTrong = bang.map((r, i) => ({ r, dong: i + 1 })).filter((x) => x.r.some((c) => gon(c)));
  if (!khongTrong.length) return { dong: [], loiChung: "Bảng đang trống." };
  const dau = khongTrong[0].r.map((c) => bo(c));
  const bangTen = Object.entries(TEN_COT) as [KhoaCot, string[]][];
  const coTieuDe = dau.some((t) => bangTen.some(([, ds]) => ds.includes(t)));
  const cot: Partial<Record<KhoaCot, number>> = {};
  if (coTieuDe) {
    dau.forEach((t, i) => { for (const [k, ds] of bangTen) if (cot[k] === undefined && ds.includes(t)) cot[k] = i; });
    const thieu = (["loai", "muc", "vai", "tiLe"] as KhoaCot[]).filter((k) => cot[k] === undefined).map((k) => ({ loai: "Loại", muc: "Mã hoặc tên mục", vai: "Vai", tiLe: "Tỉ lệ (%)" })[k as "loai" | "muc" | "vai" | "tiLe"]);
    if (thieu.length) return { dong: [], loiChung: `Thiếu cột bắt buộc trong dòng tiêu đề: ${thieu.join(", ")}.` };
  } else (["loai", "muc", "vai", "tiLe", "soTien", "doiTuong"] as KhoaCot[]).forEach((k, i) => { cot[k] = i; });
  const lay = (r: string[], k: KhoaCot) => (cot[k] === undefined ? "" : gon(r[cot[k]!] ?? ""));
  const dong = (coTieuDe ? khongTrong.slice(1) : khongTrong).map(({ r, dong }) => ({ dong, loai: lay(r, "loai"), muc: lay(r, "muc"), vai: lay(r, "vai"), tiLe: lay(r, "tiLe"), soTien: lay(r, "soTien"), doiTuong: lay(r, "doiTuong") }));
  return { dong };
}

const LOAI_TU: Record<string, LoaiMuc> = {
  "dich vu": "dich_vu", dv: "dich_vu",
  "san pham": "san_pham", sp: "san_pham",
  "goi the": "goi_the", goi: "goi_the", the: "goi_the", "lieu trinh": "goi_the", "ban the": "goi_the", "ban the lieu trinh": "goi_the", "goi the lieu trinh": "goi_the", "the lieu trinh": "goi_the",
};
const VAI_TU: Record<string, string> = { "phuc vu": "phuc_vu", "tu van": "tu_van", ban: "ban", "ban hang": "ban", "gioi thieu": "gioi_thieu" };
export const chuanLoai = (s: string): LoaiMuc | null => LOAI_TU[bo(s)] ?? null;
export const chuanVai = (s: string): string | null => VAI_TU[bo(s)] ?? null;

/** Tỉ lệ %: "10", "10%", "7,5", "7.5". Tối đa 2 số lẻ (cột lưu 2 số lẻ). Trả null nếu không phải số. */
export function docTiLe(s: string): number | null {
  const t = s.replace(/%/g, "").replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}
/** Số tiền nguyên đồng: "500000", "500.000", "500,000", "500.000đ". Số lẻ hoặc chữ lạ thì null. */
export function docTien(s: string): number | null {
  const t = s.replace(/\s/g, "").replace(/(đ|vnd|vnđ|d)$/i, "");
  if (/^\d+$/.test(t)) return Number(t);
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, ""));
  return null;
}

type MapMuc = { ma: Map<string, string>; ten: Map<string, string> };
const dat = (m: Map<string, string>, k: string, id: string) => { if (k) m.set(k, m.has(k) && m.get(k) !== id ? "" : id); };
function dungMapMuc(ds: MucDanhMuc[]): MapMuc {
  const ma = new Map<string, string>(), ten = new Map<string, string>();
  for (const d of ds) { dat(ma, khoaTen(d.ma ?? ""), d.id); dat(ten, khoaTen(d.ten), d.id); }
  return { ma, ten };
}

export const khoaDong = (r: { loai: string; vai: string; muc_id: string | null; nhan_vien_id: string | null; nhom_chuc_danh: string | null }) => `${r.loai}|${r.vai}|${r.muc_id ?? ""}|${r.nhan_vien_id ?? ""}|${r.nhom_chuc_danh ?? ""}`;
const la0 = (n: number | null) => (n ? n : null);

export type TongNhap = { them: number; ghiDe: number; giuNguyen: number; loi: number };

/** Hiểu từng dòng thô, đối chiếu danh mục và bảng tỉ lệ hiện có, quyết định THÊM / GHI ĐÈ / GIỮ NGUYÊN / LỖI cho từng dòng.
 *  Khoá dòng giống `luuTiLe`: (loại, vai, mục, nhân viên, nhóm) nên chạy lại cùng bảng thì không tạo trùng (lần hai toàn "giữ nguyên"). */
export function kiemTraNhapTiLe(tho: DongTho[], dm: DanhMucNhap, hienCo: TiLeHienCo[]): { dong: DongNhap[]; tong: TongNhap } {
  const mapMuc: Record<LoaiMuc, MapMuc> = { dich_vu: dungMapMuc(dm.dich_vu), san_pham: dungMapMuc(dm.san_pham), goi_the: dungMapMuc(dm.goi_the) };
  const tenMucTheoId = new Map<string, string>([...dm.dich_vu, ...dm.san_pham, ...dm.goi_the].map((m) => [m.id, m.ten]));
  const maNv = new Map<string, string>(), tenNv = new Map<string, string>();
  for (const n of dm.nhan_vien) { dat(maNv, khoaTen(n.ma_nv ?? ""), n.id); dat(tenNv, khoaTen(n.ho_ten), n.id); }
  const tenNvTheoId = new Map(dm.nhan_vien.map((n) => [n.id, n.ho_ten]));
  const nhomTheoGon = new Map<string, string>();
  for (const k of dm.nhom) nhomTheoGon.set(gon(k), k);
  const cu = new Map(hienCo.map((r) => [khoaDong(r), r]));
  const daThay = new Map<string, number>();
  const tong: TongNhap = { them: 0, ghiDe: 0, giuNguyen: 0, loi: 0 };

  const dong = tho.map((t): DongNhap => {
    const r: DongNhap = { dong: t.dong, hanh_dong: "loi", loai: "", vai: "", muc_id: null, nhan_vien_id: null, nhom_chuc_danh: null, mucNhan: t.muc || "Mặc định cả loại", doiTuongNhan: t.doiTuong || "Mọi người", ti_le: null, so_tien: null, ti_le_cu: null, so_tien_cu: null };
    const loi = (m: string) => { r.hanh_dong = "loi"; r.loi = m; tong.loi++; return r; };
    const loai = chuanLoai(t.loai);
    if (!loai) return loi(t.loai ? `Loại "${t.loai}" lạ, chọn: dịch vụ, sản phẩm hoặc gói thẻ.` : "Thiếu loại (dịch vụ, sản phẩm hoặc gói thẻ).");
    r.loai = loai;
    const vai = chuanVai(t.vai);
    if (!vai) return loi(t.vai ? `Vai "${t.vai}" lạ, chọn: phục vụ, tư vấn, bán hoặc giới thiệu.` : "Thiếu vai (phục vụ, tư vấn, bán hoặc giới thiệu).");
    r.vai = vai;
    // Mục: trống = tỉ lệ mặc định của cả loại. Khớp MÃ trước rồi tới TÊN; tên trùng nhiều mục thì bắt dùng mã.
    if (t.muc) {
      const k = khoaTen(t.muc), m = mapMuc[loai];
      const theoMa = m.ma.get(k), theoTen = m.ten.get(k);
      const id = theoMa ? theoMa : theoMa === undefined ? theoTen : undefined;
      if (theoMa === "" || (theoMa === undefined && theoTen === "")) return loi(`Tên "${t.muc}" trùng nhiều mục, hãy dùng mã.`);
      if (!id) return loi(`Không tìm thấy ${NHAN_LOAI[loai].toLowerCase()} "${t.muc}" (kiểm mã hoặc tên trong sheet mã của tệp mẫu).`);
      r.muc_id = id; r.mucNhan = tenMucTheoId.get(id) ?? t.muc;
    }
    // Đối tượng: trống / "mọi người" = chung; "nhóm: <chức danh>"; còn lại là nhân viên theo mã hoặc tên (tiền tố "nhân viên:" hay "nv:" là tuỳ chọn).
    const dt = gon(t.doiTuong), kdt = bo(dt);
    if (dt && !["chung", "moi nguoi", "tat ca", "ca cong ty"].includes(kdt)) {
      const nhom = /^(nhóm|nhom)\s*:\s*(.*)$/i.exec(dt);
      if (nhom) {
        const ten = nhom[2].trim().toLowerCase();
        const khoa = ten ? nhomTheoGon.get(gon(ten)) : undefined;
        if (!khoa) return loi(ten ? `Nhóm "${nhom[2].trim()}" chưa có trong chức danh nhân viên.` : "Thiếu tên nhóm sau \"nhóm:\".");
        r.nhom_chuc_danh = khoa; r.doiTuongNhan = `Nhóm: ${nhom[2].trim()}`;
      } else {
        const ten = dt.replace(/^(nhân viên|nhan vien|nv)\s*:\s*/i, "");
        const k = khoaTen(ten);
        const theoMa = maNv.get(k), theoTen = tenNv.get(k);
        if (theoMa === "" || (theoMa === undefined && theoTen === "")) return loi(`Tên nhân viên "${ten}" trùng nhiều người, hãy dùng mã nhân viên.`);
        const id = theoMa ? theoMa : theoMa === undefined ? theoTen : undefined;
        if (!id) return loi(`Không tìm thấy nhân viên "${ten}" (ghi mã hoặc tên đầy đủ; nhóm thì ghi "nhóm: <chức danh>").`);
        r.nhan_vien_id = id; r.doiTuongNhan = `Nhân viên: ${tenNvTheoId.get(id) ?? ten}`;
      }
    }
    // Tỉ lệ và số tiền.
    let ti = 0;
    if (t.tiLe) {
      const x = docTiLe(t.tiLe);
      if (x === null) return loi(`Tỉ lệ "${t.tiLe}" không phải số.`);
      if (x > 100) return loi(`Tỉ lệ ${x}% vượt 100%.`);
      if (Math.round(x * 100) / 100 !== x) return loi(`Tỉ lệ "${t.tiLe}" chỉ được tối đa 2 số lẻ.`);
      ti = x;
    }
    let tien: number | null = null;
    if (t.soTien) {
      tien = docTien(t.soTien);
      if (tien === null) return loi(`Số tiền cố định "${t.soTien}" chưa đúng (ghi số nguyên đồng, ví dụ 50000).`);
      if (tien > 1_000_000_000) return loi("Số tiền cố định vượt 1 tỷ đồng.");
    }
    if (!t.tiLe && !t.soTien) return loi("Cần ghi tỉ lệ hoặc số tiền cố định (ghi 0 nếu muốn loại khỏi hoa hồng).");
    r.ti_le = ti; r.so_tien = la0(tien);
    const khoa = khoaDong(r);
    const truoc = daThay.get(khoa);
    if (truoc !== undefined) return loi(`Trùng dòng ${truoc} (cùng loại, vai, mục, đối tượng). Mỗi tổ hợp chỉ ghi một dòng.`);
    daThay.set(khoa, t.dong);
    const c = cu.get(khoa);
    if (!c) { r.hanh_dong = "them"; tong.them++; return r; }
    r.ti_le_cu = Number(c.ti_le); r.so_tien_cu = la0(c.so_tien == null ? null : Number(c.so_tien));
    if (r.ti_le_cu === r.ti_le && r.so_tien_cu === r.so_tien) { r.hanh_dong = "giu_nguyen"; tong.giuNguyen++; } else { r.hanh_dong = "ghi_de"; tong.ghiDe++; }
    return r;
  });
  return { dong, tong };
}

/** Chữ ghi ở cột "Đối tượng" của tệp xuất, đọc lại được bằng `kiemTraNhapTiLe`. */
export function chuDoiTuongXuat(r: { nhan_vien_id: string | null; nhom_chuc_danh: string | null }, nv: Map<string, { ma_nv: string | null; ho_ten: string }>): string {
  if (r.nhan_vien_id) { const n = nv.get(r.nhan_vien_id); return n ? `Nhân viên: ${n.ma_nv || n.ho_ten}` : ""; }
  return r.nhom_chuc_danh ? `Nhóm: ${r.nhom_chuc_danh}` : "Mọi người";
}
