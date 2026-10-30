import { khoaTen } from "@/lib/san-pham";

/** CHUẨN HOÁ VẬT TƯ KHO (chị Lâm 30/10): đơn vị về một dạng chuẩn, đủ đơn vị mua + hệ số, nhóm cấp, cờ tiêu hao, không trùng tên / mã vạch.
 *  Hàm thuần, không đụng DB. Danh sách đơn vị đồng nghĩa phải KHỚP hàm SQL public.chuan_don_vi (migration 0180); có test so khớp. */

/** Đơn vị chuẩn. Đơn vị đếm viết hoa chữ đầu; đơn vị đo (ml, g, mg, UI) viết thường như ký hiệu. */
export const DON_VI_CHUAN = ["Chai", "Lọ", "Hộp", "Tuýp", "Gói", "Cái", "Miếng", "Viên", "Vỉ", "Bộ", "Đầu", "Shot", "Line", "ml", "g", "mg", "UI"] as const;

/** Mỗi đơn vị chuẩn → các cách viết khác được gộp về nó (so sánh không phân biệt hoa thường). Chỉ gộp CÙNG NGHĨA, không gộp Chai/Lọ/Hộp. */
export const DON_VI_DONG_NGHIA: Record<string, string[]> = {
  g: ["gr", "g", "gram", "gam"], ml: ["ml"], mg: ["mg"], UI: ["ui", "iu"], Shot: ["shot", "shoot", "shots"], Line: ["line", "lines"], "Đầu": ["đầu"],
  Chai: ["chai"], "Lọ": ["lọ"], "Hộp": ["hộp"], "Tuýp": ["tuýp"], "Gói": ["gói"], "Cái": ["cái"], "Miếng": ["miếng"], "Viên": ["viên"], "Vỉ": ["vỉ"], "Bộ": ["bộ"],
};

const nfc = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();
const BANG_TRA = new Map<string, string>();
for (const [chuan, ds] of Object.entries(DON_VI_DONG_NGHIA)) for (const d of ds) BANG_TRA.set(d.normalize("NFC").toLowerCase(), chuan);

/** Đưa một đơn vị về dạng chuẩn; chưa biết thì giữ nguyên (đã bỏ khoảng trắng thừa). */
export function chuanDonVi(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = nfc(s);
  if (!t) return t;
  return BANG_TRA.get(t.toLowerCase()) ?? t;
}
export const laDonViChuan = (s: string | null | undefined) => !!s && (DON_VI_CHUAN as readonly string[]).includes(s);

/** Mọi cách viết (gốc, thường, HOA, hoa chữ đầu) → dạng chuẩn: dùng để sinh bảng tra cho hàm SQL và để kiểm khớp. */
export function bienTheDonVi(): [string, string][] {
  const ra = new Map<string, string>();
  for (const [chuan, ds] of Object.entries(DON_VI_DONG_NGHIA)) {
    for (const d of ds) {
      const c = d.normalize("NFC");
      for (const b of [c, c.toLowerCase(), c.toUpperCase(), c.charAt(0).toUpperCase() + c.slice(1)]) ra.set(b, chuan);
    }
  }
  return [...ra.entries()];
}

export type VatTuKho = {
  id: string; ma: string; ten: string; nhom: string | null; nhom_cap: string | null; don_vi: string; don_vi_mua: string | null; he_so_quy_doi: number | null;
  gia_nhap_don_vi: number | null; tieu_hao: boolean; theo_doi_kho: boolean; ban_le: boolean; ma_vach: string | null; hoat_dong: boolean;
};
export type BoiCanh = { trungTen: Set<string>; trungMaVach: Set<string>; trongDinhMuc: Set<string> };

export const NHAN_VAN_DE_KHO: Record<string, string> = {
  don_vi_la: "Đơn vị chưa theo chuẩn",
  don_vi_nghi_van: "Tên ghi một loại đơn vị, kho ghi loại khác (ml hay g?)",
  thieu_don_vi_mua: "Chưa có đơn vị mua",
  he_so_la: "Đơn vị mua khác đơn vị dùng nhưng hệ số quy đổi bằng 1 (hoặc ngược lại)",
  thieu_gia_nhap: "Chưa có giá nhập",
  thieu_nhom_cap: "Vật tư dùng trong ca nhưng chưa có nhóm cấp",
  thieu_co_tieu_hao: "Là vật tư tiêu hao nhưng chưa gắn cờ tiêu hao",
  dm_khong_nhom_a: "Có trong định mức nhưng không thuộc nhóm cấp A (phiếu cấp sẽ bỏ qua)",
  vua_ban_vua_tieu_hao: "Vừa bán lẻ vừa tiêu hao: dễ trừ kho hai lần",
  trung_ten: "Trùng tên với mặt hàng khác",
  trung_ma_vach: "Trùng mã vạch với mặt hàng khác",
};
/** Nhóm "cần làm trước" (chặn việc cấp vật tư) và nhóm "nhắc". */
export const VAN_DE_NANG = ["don_vi_la", "he_so_la", "thieu_nhom_cap", "thieu_co_tieu_hao", "dm_khong_nhom_a", "trung_ten", "trung_ma_vach", "vua_ban_vua_tieu_hao"] as const;

const LOAI_DO = /(\d+(?:[.,]\d+)?)\s*(ml|mg|gr|gram|g)\b/gi;
/** Đọc quy cách trong tên: "ml" (thể tích) hay "g" (khối lượng) hay hai loại / không có. */
export function loaiDoTrongTen(ten: string): "ml" | "g" | "ca-hai" | null {
  let ml = false, g = false;
  for (const m of ten.matchAll(LOAI_DO)) { if (m[2].toLowerCase() === "ml") ml = true; else g = true; }
  return ml && g ? "ca-hai" : ml ? "ml" : g ? "g" : null;
}
/** Đơn vị dùng là ml/g/mg mà tên ghi loại khác (vd "13ml" nhưng đơn vị Gr): chỉ báo để người có thẩm quyền xem, KHÔNG tự sửa. */
export function donViNghiVan(ten: string, donVi: string): boolean {
  const dv = chuanDonVi(donVi);
  if (dv !== "ml" && dv !== "g" && dv !== "mg") return false;
  const trongTen = loaiDoTrongTen(ten);
  if (!trongTen || trongTen === "ca-hai") return false;
  return (dv === "ml") !== (trongTen === "ml");
}

export function tinhBoiCanh(ds: VatTuKho[], idTrongDinhMuc: Iterable<string>): BoiCanh {
  const ten = new Map<string, number>(), vach = new Map<string, number>();
  for (const s of ds) {
    if (!s.hoat_dong) continue;
    ten.set(khoaTen(s.ten), (ten.get(khoaTen(s.ten)) ?? 0) + 1);
    if (s.ma_vach) vach.set(s.ma_vach, (vach.get(s.ma_vach) ?? 0) + 1);
  }
  const sau = (m: Map<string, number>) => new Set([...m.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  return { trungTen: sau(ten), trungMaVach: sau(vach), trongDinhMuc: new Set(idTrongDinhMuc) };
}

/** Các vấn đề chuẩn hoá của một vật tư / mặt hàng (chỉ xét hàng đang dùng). Giá nhập thiếu chỉ BÁO, không điền số. */
export function vanDeVatTu(s: VatTuKho, bc: BoiCanh): string[] {
  if (!s.hoat_dong) return [];
  const ra: string[] = [];
  if (!laDonViChuan(s.don_vi)) ra.push("don_vi_la");
  if (donViNghiVan(s.ten, s.don_vi)) ra.push("don_vi_nghi_van");
  if (s.theo_doi_kho && !s.don_vi_mua) ra.push("thieu_don_vi_mua");
  const khacDv = !!s.don_vi_mua && s.don_vi_mua !== s.don_vi, hs = Number(s.he_so_quy_doi ?? 1);
  if ((khacDv && hs === 1) || (!khacDv && s.don_vi_mua && hs !== 1)) ra.push("he_so_la");
  if (s.theo_doi_kho && s.gia_nhap_don_vi == null) ra.push("thieu_gia_nhap");
  const trongDm = bc.trongDinhMuc.has(s.id);
  if ((s.tieu_hao || trongDm) && !s.nhom_cap) ra.push("thieu_nhom_cap");
  if (!s.tieu_hao && (/tiêu hao/i.test(s.nhom ?? "") || trongDm)) ra.push("thieu_co_tieu_hao");
  if (trongDm && s.nhom_cap && s.nhom_cap !== "A") ra.push("dm_khong_nhom_a");
  if (s.ban_le && s.tieu_hao) ra.push("vua_ban_vua_tieu_hao");
  if (bc.trungTen.has(khoaTen(s.ten))) ra.push("trung_ten");
  if (s.ma_vach && bc.trungMaVach.has(s.ma_vach)) ra.push("trung_ma_vach");
  return ra;
}

/** Phân loại chênh lệch giữa tồn trong sổ kho AMIA và tồn cuối SalonHero chốt 28/10 của MỘT mặt hàng tại MỘT chi nhánh. */
export type LoaiLech = "khop" | "sh_am" | "amia_nhieu" | "amia_it" | "chi_co_amia";
export function phanLoaiLech(shCuoi: number | null, amia: number): { loai: LoaiLech; chenh: number } {
  if (shCuoi == null) return { loai: amia === 0 ? "khop" : "chi_co_amia", chenh: amia };
  const chenh = amia - shCuoi;
  if (Math.abs(chenh) < 1e-9) return { loai: "khop", chenh: 0 };
  // SalonHero ghi âm (bán trước khi nhập); AMIA chặn tồn âm nên để 0 — đúng thiết kế, cần kiểm đếm chứ không phải sai sổ.
  if (shCuoi < 0 && amia === 0) return { loai: "sh_am", chenh };
  return { loai: chenh > 0 ? "amia_nhieu" : "amia_it", chenh };
}
export const NHAN_LECH: Record<LoaiLech, string> = {
  khop: "Khớp", sh_am: "SalonHero ghi âm, AMIA để 0 (chặn tồn âm)", amia_nhieu: "AMIA nhiều hơn SalonHero", amia_it: "AMIA ít hơn SalonHero", chi_co_amia: "Chỉ có ở AMIA (SalonHero không có)",
};

export type SuaVatTu = { don_vi: string; don_vi_mua: string | null; he_so_quy_doi: number; gia_nhap_don_vi: number | null; nhom_cap: "A" | "B" | "C" | null; tieu_hao: boolean };
/** Kiểm dữ liệu một dòng sửa tại chỗ ở trang chuẩn hoá. Đơn vị phải thuộc danh sách chuẩn; giá nhập để trống thì giữ trống (không bịa số). */
export function kiemDuLieuSua(v: { don_vi: string; don_vi_mua: string; he_so: string; gia_nhap: string; nhom_cap: string; tieu_hao: boolean }): { loi: string } | { ok: SuaVatTu } {
  const donVi = chuanDonVi(v.don_vi) ?? "";
  if (!laDonViChuan(donVi)) return { loi: `Đơn vị "${v.don_vi}" chưa nằm trong danh sách chuẩn (${DON_VI_CHUAN.join(", ")}).` };
  const dvm = v.don_vi_mua.trim() ? chuanDonVi(v.don_vi_mua) : null;
  if (dvm && !laDonViChuan(dvm)) return { loi: `Đơn vị mua "${v.don_vi_mua}" chưa nằm trong danh sách chuẩn.` };
  const num = (s: string) => Number(s.trim().replace(/\./g, "").replace(",", "."));
  const heSo = v.he_so.trim() === "" ? 1 : num(v.he_so);
  if (!Number.isFinite(heSo) || heSo <= 0 || heSo > 1_000_000) return { loi: "Hệ số quy đổi phải là số lớn hơn 0." };
  if (!dvm && heSo !== 1) return { loi: "Chưa có đơn vị mua thì hệ số quy đổi phải bằng 1." };
  let gia: number | null = null;
  if (v.gia_nhap.trim() !== "") {
    gia = num(v.gia_nhap);
    if (!Number.isFinite(gia) || gia < 0) return { loi: "Giá nhập phải là số không âm (để trống nếu chưa biết)." };
  }
  const nc = v.nhom_cap.trim();
  if (nc && !["A", "B", "C"].includes(nc)) return { loi: "Nhóm cấp chỉ là A, B hoặc C." };
  return { ok: { don_vi: donVi, don_vi_mua: dvm, he_so_quy_doi: heSo, gia_nhap_don_vi: gia, nhom_cap: (nc || null) as SuaVatTu["nhom_cap"], tieu_hao: v.tieu_hao } };
}
