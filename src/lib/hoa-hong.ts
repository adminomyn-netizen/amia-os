const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Đối tượng áp dụng gửi từ biểu mẫu: "" = chung mọi người; "nv:<id>" = một nhân viên; "nhom:<chức danh>" = nhóm theo chức danh (viết thường, bỏ khoảng trắng thừa). */
export function docDoiTuong(s: string): { kieu: "chung" | "nhan_vien" | "nhom"; khoa: string } | null {
  if (!s || s === "chung") return { kieu: "chung", khoa: "" };
  if (s.startsWith("nv:")) return UUID.test(s.slice(3)) ? { kieu: "nhan_vien", khoa: s.slice(3).toLowerCase() } : null;
  if (s.startsWith("nhom:")) { const k = s.slice(5).trim().toLowerCase(); return k ? { kieu: "nhom", khoa: k } : null; }
  return null;
}


/** Giờ và mức sao có thể đặt hệ số trong "Cài đặt nâng cao" (như SalonHero: 8h–23h, 1–5 sao). */
export const GIO_HE_SO = Array.from({ length: 16 }, (_, i) => i + 8);
export const SAO_HE_SO = [1, 2, 3, 4, 5];

export type CaiDatNangCao = {
  chia_deu_dich_vu: boolean; chia_deu_ban: boolean; chia_deu_tu_van: boolean; so_nv_tieu_chuan: number;
  tinh_sau_giam_gia: boolean; ap_giam_gia_tong_don: boolean; he_so_gio: Record<string, number>; he_so_sao: Record<string, number>;
};

/** Đọc biểu mẫu "Cài đặt nâng cao". Hệ số để trống hoặc 100 không lưu (trống = 100% như SalonHero). Trả lỗi tiếng Việt nếu sai. */
export function docCaiDatNangCao(lay: (ten: string) => string): { loi: string } | { gt: CaiDatNangCao } {
  const chon = (ten: string, a: string, b: string, nhan: string): boolean | string => (lay(ten) === a ? true : lay(ten) === b ? false : `Chọn ${nhan}.`);
  const dv = chon("chia_dv", "chia_deu", "giu_nguyen", "cách tính hoa hồng dịch vụ"), ban = chon("chia_ban", "chia_deu", "giu_nguyen", "cách tính hoa hồng bán hàng"),
    tv = chon("chia_tu_van", "chia_deu", "giu_nguyen", "cách tính hoa hồng tư vấn"), sau = chon("thoi_diem", "sau", "truoc", "thời điểm tính hoa hồng");
  for (const x of [dv, ban, tv, sau]) if (typeof x === "string") return { loi: x };
  const loaiGiam = sau ? chon("loai_giam", "ca_hai", "chi_dong", "loại giảm giá áp dụng") : true;
  if (typeof loaiGiam === "string") return { loi: loaiGiam };
  const tc = Number(lay("so_nv_tieu_chuan") || 1);
  if (!Number.isInteger(tc) || tc < 1 || tc > 20) return { loi: "Số lượng nhân viên tiêu chuẩn phải là số nguyên từ 1 đến 20." };
  const heSo = (tien: string, ds: number[], nhan: (k: number) => string): { loi: string } | Record<string, number> => {
    const o: Record<string, number> = {};
    for (const k of ds) {
      const s = lay(`${tien}${k}`).trim().replace(",", ".");
      if (s === "") continue;
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0 || n > 1000) return { loi: `Hệ số ${nhan(k)} phải từ 0 đến 1000%.` };
      if (n !== 100) o[String(k)] = n;
    }
    return o;
  };
  const gio = heSo("gio_", GIO_HE_SO, (k) => `${k} giờ`), sao = heSo("sao_", SAO_HE_SO, (k) => `${k} sao`);
  if ("loi" in gio && typeof gio.loi === "string") return { loi: gio.loi };
  if ("loi" in sao && typeof sao.loi === "string") return { loi: sao.loi };
  return { gt: { chia_deu_dich_vu: dv as boolean, chia_deu_ban: ban as boolean, chia_deu_tu_van: tv as boolean, so_nv_tieu_chuan: tc, tinh_sau_giam_gia: sau as boolean,
    ap_giam_gia_tong_don: loaiGiam as boolean, he_so_gio: gio as Record<string, number>, he_so_sao: sao as Record<string, number> } };
}
