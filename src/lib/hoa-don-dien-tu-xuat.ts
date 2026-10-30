// Gom dữ liệu để xuất Excel các hoá đơn đã chọn ở ngăn "Cần xuất". Hàm thuần: không chạm DB.
// Tên xuất = tên đã sửa riêng (nếu có, bảng hoa_don_xuat_*) hoặc tên trong đơn / hồ sơ khách. Không bao giờ ghi ngược về đơn bán hay hồ sơ khách.
import { chuThu, type TomTatThu } from "@/lib/hoa-don-dien-tu-ngan-hang";

export const TOI_DA_CHON = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** ?ids=a,b,c → danh sách mã hợp lệ (đúng dạng uuid, bỏ trùng, tối đa TOI_DA_CHON). Quá nhiều mã thì báo lỗi thay vì cắt lặng lẽ. */
export function docIdsChon(raw: string | null | undefined): { ids: string[] } | { loi: string } {
  const ds = [...new Set((raw ?? "").split(",").map((x) => x.trim()).filter(Boolean))];
  if (!ds.length) return { loi: "Chưa chọn hoá đơn nào." };
  if (ds.length > TOI_DA_CHON) return { loi: `Mỗi lần xuất tối đa ${TOI_DA_CHON} hoá đơn.` };
  if (ds.some((x) => !UUID.test(x))) return { loi: "Mã hoá đơn không hợp lệ." };
  return { ids: ds.map((x) => x.toLowerCase()) };
}

export type HdXuat = { id: string; ma: string; ngay_hd: string; khach_id: string | null; vat_pct: number | string | null; vat_tien: number | string | null; giam_gia_don: number | string | null; phu_phi: number | string | null; tip: number | string | null; tong_hang: number | string | null; tong_phai_thu: number | string | null };
export type KhachXuat = { ho_ten: string | null; cong_ty: string | null; ma_so_thue: string | null; dia_chi: string | null };
export type DongHangXuat = { id: string; hoa_don_id: string; ten: string; so_luong: number | string; don_gia: number | string; giam_gia: number | string; thanh_tien: number | string | null };
export type TuyChinhNguoiMua = { ten_nguoi_mua: string | null; ma_so_thue: string | null; dia_chi: string | null };

const s = (v: string | null | undefined) => (v ?? "").trim();
/** Người mua mặc định: khách có tên công ty thì ghi công ty (hoá đơn công ty), không thì tên khách; không có khách là "Khách lẻ". */
export function nguoiMuaMacDinh(k: KhachXuat | undefined) {
  if (!k) return { ten: "Khách lẻ", mst: "", diaChi: "" };
  return { ten: s(k.cong_ty) || s(k.ho_ten) || "Khách lẻ", mst: s(k.ma_so_thue), diaChi: s(k.dia_chi) };
}
/** Ô nào đã sửa riêng (khác null, không trống) thì lấy ô đó; còn lại lấy mặc định. */
export function nguoiMuaXuat(k: KhachXuat | undefined, tc: TuyChinhNguoiMua | undefined) {
  const md = nguoiMuaMacDinh(k);
  return { ten: s(tc?.ten_nguoi_mua) || md.ten, mst: s(tc?.ma_so_thue) || md.mst, diaChi: s(tc?.dia_chi) || md.diaChi };
}
/** Tên hàng xuất: tên đã sửa riêng nếu có, không thì tên trong đơn. */
export const tenHangXuat = (d: { id: string; ten: string }, tenSua: Map<string, string> | undefined) => s(tenSua?.get(d.id)) || d.ten;

export type DonXuat = {
  ma: string; ngay: string; khachHoTen: string; nguoiMua: string; mst: string; diaChi: string; nganHang: string;
  tongHang: number; giamDon: number; phuPhiTip: number; vatPct: number; vatTien: number; tongPhaiThu: number;
  dong: { ten: string; sl: number; donGia: number; giamGia: number; thanhTien: number; daSuaTen: boolean }[];
  daSuaNguoiMua: boolean;
};
export function gomDonXuat(
  hd: HdXuat, khach: KhachXuat | undefined, dong: DongHangXuat[], thu: TomTatThu | undefined,
  tuyChinh: TuyChinhNguoiMua | undefined, tenSua: Map<string, string> | undefined, dinhDang: (n: number) => string,
): DonXuat {
  const nm = nguoiMuaXuat(khach, tuyChinh), md = nguoiMuaMacDinh(khach);
  return {
    ma: hd.ma, ngay: hd.ngay_hd, khachHoTen: s(khach?.ho_ten) || "Khách lẻ", nguoiMua: nm.ten, mst: nm.mst, diaChi: nm.diaChi, daSuaNguoiMua: nm.ten !== md.ten || nm.mst !== md.mst || nm.diaChi !== md.diaChi,
    nganHang: thu ? chuThu(thu, dinhDang).join("; ") : "",
    tongHang: Number(hd.tong_hang ?? 0), giamDon: Number(hd.giam_gia_don ?? 0), phuPhiTip: Number(hd.phu_phi ?? 0) + Number(hd.tip ?? 0), vatPct: Number(hd.vat_pct ?? 0), vatTien: Number(hd.vat_tien ?? 0), tongPhaiThu: Number(hd.tong_phai_thu ?? 0),
    dong: dong.map((d) => ({ ten: tenHangXuat(d, tenSua), sl: Number(d.so_luong), donGia: Number(d.don_gia), giamGia: Number(d.giam_gia), thanhTien: d.thanh_tien == null ? Number(d.don_gia) * Number(d.so_luong) - Number(d.giam_gia) : Number(d.thanh_tien), daSuaTen: !!s(tenSua?.get(d.id)) && s(tenSua?.get(d.id)) !== d.ten })),
  };
}

// ── Sửa tên trên hoá đơn xuất (bảng hoa_don_xuat_tuy_chinh / hoa_don_xuat_dong) ──
export type NhapTenXuat = { tenNguoiMua: string; mst: string; diaChi: string; dong: { id: string; ten: string }[] };
export type TenXuatDaKiem = { ten_nguoi_mua: string; ma_so_thue: string; dia_chi: string; dong: { id: string; ten: string }[] };
const gon = (v: string) => v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
export const MST_XUAT = /^([0-9]{10}(-[0-9]{3})?|[0-9]{12})$/;

/** Kiểm dữ liệu người nhập: gọn khoảng trắng, đúng độ dài, MST đúng dạng (10 số, 10-3 số hoặc 12 số căn cước), không trùng dòng. Ô trống hợp lệ (nghĩa là dùng tên mặc định). */
export function kiemTenXuat(n: NhapTenXuat): { loi: string } | { ok: TenXuatDaKiem } {
  const ten = gon(n.tenNguoiMua), mst = gon(n.mst).replace(/\s+/g, ""), diaChi = gon(n.diaChi);
  if (ten.length > 200) return { loi: "Tên người mua dài quá 200 ký tự." };
  if (diaChi.length > 300) return { loi: "Địa chỉ dài quá 300 ký tự." };
  if (mst && !MST_XUAT.test(mst)) return { loi: "Mã số thuế gồm 10 số, 13 số dạng 0123456789-001, hoặc 12 số." };
  const dong = n.dong.map((d) => ({ id: d.id, ten: gon(d.ten) }));
  if (new Set(dong.map((d) => d.id)).size !== dong.length) return { loi: "Có dòng hàng bị gửi hai lần." };
  const qua = dong.find((d) => d.ten.length > 300);
  if (qua) return { loi: "Tên hàng dài quá 300 ký tự." };
  return { ok: { ten_nguoi_mua: ten, ma_so_thue: mst, dia_chi: diaChi, dong } };
}

/** Quyết định ghi gì: ô người mua chỉ lưu khi có chữ VÀ khác mặc định (hồ sơ khách đổi sau này thì vẫn theo); dòng hàng chỉ lưu khi có chữ VÀ khác tên gốc.
 *  Còn lại là xoá bản sửa (quay về tên mặc định). Không bao giờ đụng tới đơn bán hay hồ sơ khách. */
export function quyetSuaTenXuat(ok: TenXuatDaKiem, macDinh: { ten: string; mst: string; diaChi: string }, tenGoc: Map<string, string>) {
  const nm = { ten_nguoi_mua: ok.ten_nguoi_mua && ok.ten_nguoi_mua !== macDinh.ten ? ok.ten_nguoi_mua : null, ma_so_thue: ok.ma_so_thue && ok.ma_so_thue !== macDinh.mst ? ok.ma_so_thue : null, dia_chi: ok.dia_chi && ok.dia_chi !== macDinh.diaChi ? ok.dia_chi : null };
  const coNguoiMua = !!(nm.ten_nguoi_mua || nm.ma_so_thue || nm.dia_chi);
  const luu = ok.dong.filter((d) => d.ten && d.ten !== tenGoc.get(d.id));
  const xoa = ok.dong.filter((d) => !d.ten || d.ten === tenGoc.get(d.id)).map((d) => d.id);
  return { nguoiMua: coNguoiMua ? nm : null, dongLuu: luu, dongXoa: xoa };
}
