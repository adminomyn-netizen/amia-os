"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { HINH_THUC_TT, kiemNguoiBan, kiemNguoiMua, laThueSuat, taoXml, thieuNguoiBan } from "@/lib/hoa-don-gtgt";
import { layDuLieuGtgt } from "@/lib/hoa-don-gtgt-may-chu";

type KQ = { ok?: true; loi?: string };
const lamMoi = (id?: string) => { revalidatePath("/tai-chinh/hoa-don-dien-tu"); if (id) revalidatePath(`/tai-chinh/hoa-don-dien-tu/lap/${id}`); revalidatePath("/hoa-don"); };

/** Người lập / xuất / huỷ hoá đơn GTGT: cùng điều kiện ghi số hoá đơn điện tử (hd.vat + sửa hoá đơn đã khoá). */
async function nguoiGhi() {
  const nd = await kiemQuyen("hd.vat");
  return nd && coQuyen(nd, "ban.sua_khoa") ? nd : null;
}

/** Thông tin người bán theo chi nhánh: như phần cài đặt kết nối — chỉ tài khoản văn phòng chung (không gắn chi nhánh) có quyền hd.vat và khoá kỳ. */
export async function luuNguoiBan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hd.vat");
  if (!nd || nd.chiNhanhId || !coQuyen(nd, "ky.khoa")) return { loi: KHONG_DU_QUYEN };
  const cn = chuoi(fd, "chi_nhanh_id");
  const { data: c } = await sb().from("chi_nhanh").select("id").eq("id", cn).maybeSingle();
  if (!c) return { loi: "Không tìm thấy chi nhánh." };
  const kt = kiemNguoiBan(Object.fromEntries(fd.entries()));
  if ("loi" in kt) return kt;
  const v = kt.ok, rong = (s: string) => s || null;
  const { error } = await sb().from("hddt_nguoi_ban").upsert({
    chi_nhanh_id: cn, ten_don_vi: rong(v.ten_don_vi), ma_so_thue: rong(v.ma_so_thue), dia_chi: rong(v.dia_chi), dien_thoai: rong(v.dien_thoai), email: rong(v.email),
    so_tai_khoan: rong(v.so_tai_khoan), ngan_hang: rong(v.ngan_hang), mau_so: v.mau_so, ky_hieu: rong(v.ky_hieu), thue_suat: v.thue_suat, sua_boi: nd.nhanVienId, sua_luc: new Date().toISOString(),
  });
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "luu_nguoi_ban_hddt", doi_tuong: "chi_nhanh", doi_tuong_id: cn, chi_tiet: { thieu: thieuNguoiBan(v) } });
  lamMoi();
  return { ok: true };
}

/** Lưu nháp người mua + thuế suất + hình thức thanh toán (như hộp "Khởi tạo hoá đơn điện tử" của SalonHero). Không cấp số, không khoá đơn. */
export async function luuNhapGtgt(fd: FormData): Promise<KQ> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoa_don_id");
  const d = await layDuLieuGtgt(nd, id);
  if (!d) return { loi: "Không tìm thấy hoá đơn." };
  if (d.dangXuat) return { loi: "Hoá đơn GTGT đã xuất, không sửa nháp được nữa. Huỷ hoá đơn GTGT nếu cần lập lại." };
  const kt = kiemNguoiMua({ loai: chuoi(fd, "loai"), ten_don_vi: chuoi(fd, "ten_don_vi"), mst: chuoi(fd, "mst"), cccd: chuoi(fd, "cccd"), dia_chi: chuoi(fd, "dia_chi"), ho_ten: chuoi(fd, "ho_ten"), dien_thoai: chuoi(fd, "dien_thoai"), email: chuoi(fd, "email") });
  if ("loi" in kt) return kt;
  const ts = chuoi(fd, "thue_suat"), ht = chuoi(fd, "hinh_thuc_tt"), ghiChu = chuoi(fd, "ghi_chu").slice(0, 500);
  if (ts && !laThueSuat(ts)) return { loi: "Thuế suất chưa hợp lệ." };
  if (ht && !HINH_THUC_TT.some((h) => h.gia_tri === ht)) return { loi: "Hình thức thanh toán chưa hợp lệ." };
  const m = kt.ok, rong = (s: string) => s || null;
  const { error } = await sb().from("hoa_don_gtgt_nhap").upsert({
    hoa_don_id: d.hd.id, loai_nguoi_mua: m.loai, ma_so_thue: rong(m.mst), cccd: rong(m.cccd), ten_don_vi: rong(m.ten_don_vi), dia_chi: rong(m.dia_chi), ho_ten_nguoi_mua: rong(m.ho_ten),
    dien_thoai: rong(m.dien_thoai), email: rong(m.email), thue_suat: ts || null, hinh_thuc_tt: ht || null, ghi_chu: rong(ghiChu), sua_boi: nd.nhanVienId, sua_luc: new Date().toISOString(),
  });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(d.hd.id);
  return { ok: true };
}

/** Xuất hoá đơn GTGT: cấp số tự tăng theo ký hiệu (hàm hddt_xuat khoá dãy số), lưu ảnh chụp + XML; đơn bị khoá sửa như khi đã ghi số hoá đơn điện tử. */
export async function xuatGtgt(fd: FormData): Promise<KQ> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDuLieuGtgt(nd, chuoi(fd, "hoa_don_id"));
  if (!d) return { loi: "Không tìm thấy hoá đơn." };
  const thieu = thieuNguoiBan(d.nguoiBanCd ?? undefined);
  if (thieu.length) return { loi: `Chưa điền thông tin người bán của chi nhánh: ${thieu.join(", ")}. Vào Hoá đơn điện tử › Thông tin người bán.` };
  if (!d.noiDung.dong.some((x) => x.tinh_chat === 1)) return { loi: "Hoá đơn không có dòng hàng có tiền, không xuất hoá đơn GTGT." };
  const kt = kiemNguoiMua({ ...d.nguoiMua });
  if ("loi" in kt) return { loi: `Thông tin người mua chưa đủ: ${kt.loi}` };
  const ngay = homNayHCM();
  const { data, error } = await sb().rpc("hddt_xuat", { p_hoa_don: d.hd.id, p_nguoi: nd.nhanVienId, p_cn: nd.chiNhanhId as string, p_ngay: ngay, p_noi_dung: d.noiDung as never });
  if (error) return { loi: thongBaoLoi(error) };
  const r = data?.[0];
  if (r) {
    const xml = taoXml({ mau_so: r.mau_so, ky_hieu: r.ky_hieu, so: r.so, ngay_lap: ngay }, d.nguoiBan, d.noiDung);
    await sb().from("hoa_don_gtgt").update({ xml }).eq("id", r.id).is("xml", null);
  }
  lamMoi(d.hd.id);
  return { ok: true };
}

export async function huyGtgt(fd: FormData): Promise<KQ> {
  const nd = await nguoiGhi();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDuLieuGtgt(nd, chuoi(fd, "hoa_don_id"));
  if (!d?.dangXuat) return { loi: "Không có hoá đơn GTGT đang xuất để huỷ." };
  const { error } = await sb().rpc("hddt_huy", { p_id: d.dangXuat.id, p_nguoi: nd.nhanVienId, p_cn: nd.chiNhanhId as string, p_ly_do: chuoi(fd, "ly_do") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(d.hd.id);
  return { ok: true };
}
