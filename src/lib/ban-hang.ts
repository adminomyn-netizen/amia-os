export type Vai = "phuc_vu" | "tu_van" | "ban";
export const VAI: { ma: Vai; ten: string }[] = [{ ma: "phuc_vu", ten: "Phục vụ" }, { ma: "tu_van", ten: "Tư vấn" }, { ma: "ban", ten: "Bán hàng" }];
export const PHUONG_THUC = [
  { gia_tri: "tien_mat", nhan: "Tiền mặt" }, { gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "quet_the", nhan: "Quẹt thẻ" }, { gia_tri: "the_tien", nhan: "Trừ thẻ tiền" },
];
export const NHAN_PHUONG_THUC = Object.fromEntries(PHUONG_THUC.map((p) => [p.gia_tri, p.nhan])) as Record<string, string>;

export type MucBan = { loai: "dich_vu" | "goi_the" | "san_pham"; id: string; ten: string; gia: number; nhom: string; vatPct?: number };
export type DongDon = { loai: MucBan["loai"]; ref: string; sl: number; giam: number; nv: Record<Vai, { id: string; ti: number }[]> };
export type KhoanThu = { phuong_thuc: string; so_tien: number; the_id?: string };
export type DonBan = {
  khachId: string | null; lichId: string | null; chiNhanhId: string;
  dong: DongDon[]; giamDon: number; vatPct: number; phuPhi: number; tip: number; nguoiGioiThieu: string; ghiChu: string; thu: KhoanThu[];
};
export const tinhDon = (hang: number, giamDon: number, vatPct: number, phuPhi: number, tip: number) => {
  const sauGiam = Math.max(hang - giamDon, 0);
  const vat = Math.round((sauGiam * vatPct) / 100);
  return { vat, phai: sauGiam + vat + phuPhi + tip };
};
