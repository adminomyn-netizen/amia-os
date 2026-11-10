"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const NGAY_TRONG_TUAN = ["t2", "t3", "t4", "t5", "t6", "t7", "cn"];
const GIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function luuThongTinChung(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const mo = chuoi(fd, "gio_mo"), dong = chuoi(fd, "gio_dong");
  if (!GIO.test(mo) || !GIO.test(dong)) return { loi: "Giờ mở/đóng cửa nhập dạng 08:00." };
  if (mo >= dong) return { loi: "Giờ đóng cửa phải sau giờ mở cửa." };
  const ten = chuoi(fd, "ten_thuong_hieu");
  if (!ten) return { loi: "Nhập tên thương hiệu." };
  const { error } = await sb().from("cua_hang").update({
    ten_thuong_hieu: ten, ten_phap_nhan: chuoiHoacNull(fd, "ten_phap_nhan"), ma_so_thue: chuoiHoacNull(fd, "ma_so_thue"),
    dia_chi: chuoiHoacNull(fd, "dia_chi"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), email: chuoiHoacNull(fd, "email"), website: chuoiHoacNull(fd, "website"),
    gio_lam_viec: { mo, dong, nghi: mang(fd, "nghi").filter((x) => NGAY_TRONG_TUAN.includes(x)) }, cap_nhat_luc: new Date().toISOString(),
  }).eq("id", 1);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/cai-dat/thong-tin-chung");
  return { ok: true };
}

/** Thêm / sửa tài khoản ngân hàng theo hộp "Thêm tài khoản" của SalonHero: ngân hàng, số tài khoản, chủ tài khoản, chức năng (Quẹt thẻ / Chuyển khoản), Mặc định. Ghi nhật ký (chỉ ghi 4 số cuối của số tài khoản). */
export async function luuNganHang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = {
    ngan_hang: chuoi(fd, "ngan_hang"), so_tai_khoan: chuoi(fd, "so_tai_khoan").replace(/\s/g, ""), chu_tai_khoan: chuoi(fd, "chu_tai_khoan"),
    dung_quet_the: bat(fd, "dung_quet_the"), dung_chuyen_khoan: bat(fd, "dung_chuyen_khoan"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"),
  };
  const macDinh = bat(fd, "mac_dinh");
  if (!row.ngan_hang) return { loi: "Mời chọn tên ngân hàng." };
  // Số tài khoản và chủ tài khoản được để trống (kế toán chỉ cần danh sách nơi nhận tiền để lọc); có nhập thì số phải đúng dạng.
  if (row.so_tai_khoan && !/^\d{6,20}$/.test(row.so_tai_khoan)) return { loi: "Số tài khoản chỉ gồm chữ số (6–20 số)." };
  if ((row.ghi_chu ?? "").length > 200) return { loi: "Ghi chú dài quá 200 ký tự." };
  const db = sb();
  if (macDinh) await db.from("tai_khoan_ngan_hang").update({ mac_dinh: false }).eq("mac_dinh", true);
  const luu = { ...row, ...(macDinh ? { mac_dinh: true } : id ? {} : { mac_dinh: false }) };
  const { data: moi, error } = id ? await db.from("tai_khoan_ngan_hang").update(luu).eq("id", id).select("id").single() : await db.from("tai_khoan_ngan_hang").insert(luu).select("id").single();
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: id ? "sua_tai_khoan_ngan_hang" : "them_tai_khoan_ngan_hang", doi_tuong: "tai_khoan_ngan_hang", doi_tuong_id: moi.id, chi_tiet: { ngan_hang: row.ngan_hang, so_cuoi: row.so_tai_khoan.slice(-4), quet_the: row.dung_quet_the, chuyen_khoan: row.dung_chuyen_khoan, mac_dinh: macDinh } });
  revalidatePath("/cai-dat/ngan-hang");
  return { ok: true };
}

/** Nút "Đặt mặc định": đúng một tài khoản mặc định. */
export async function datMacDinhNganHang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: tk } = await db.from("tai_khoan_ngan_hang").select("id, ngan_hang, so_tai_khoan").eq("id", id).maybeSingle();
  if (!tk) return { loi: "Không có tài khoản này." };
  await db.from("tai_khoan_ngan_hang").update({ mac_dinh: false }).eq("mac_dinh", true);
  const { error } = await db.from("tai_khoan_ngan_hang").update({ mac_dinh: true }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "dat_mac_dinh_ngan_hang", doi_tuong: "tai_khoan_ngan_hang", doi_tuong_id: id, chi_tiet: { ngan_hang: tk.ngan_hang, so_cuoi: tk.so_tai_khoan.slice(-4) } });
  revalidatePath("/cai-dat/ngan-hang");
  return { ok: true };
}

/** Nút "Ẩn" / "Hiện lại": tài khoản ẩn không còn trong ô chọn ở Thu ngân và bộ lọc Hoá đơn điện tử, nhưng không mất dữ liệu. */
export async function anHienNganHang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), hien = chuoi(fd, "hien") === "1";
  const db = sb();
  const { data: tk } = await db.from("tai_khoan_ngan_hang").select("id, ngan_hang").eq("id", id).maybeSingle();
  if (!tk) return { loi: "Không có tài khoản này." };
  const { error } = await db.from("tai_khoan_ngan_hang").update({ hoat_dong: hien }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: hien ? "hien_tai_khoan_ngan_hang" : "an_tai_khoan_ngan_hang", doi_tuong: "tai_khoan_ngan_hang", doi_tuong_id: id, chi_tiet: { ngan_hang: tk.ngan_hang } });
  revalidatePath("/cai-dat/ngan-hang"); revalidatePath("/ban-hang"); revalidatePath("/tai-chinh/hoa-don-dien-tu");
  return { ok: true };
}

/** Nút "Xóa": xoá hẳn tài khoản khỏi danh sách (bảng này chưa có chứng từ nào trỏ tới); ghi nhật ký. */
export async function xoaNganHang(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: tk } = await db.from("tai_khoan_ngan_hang").select("id, ngan_hang, so_tai_khoan, mac_dinh").eq("id", id).maybeSingle();
  if (!tk) return { loi: "Không có tài khoản này." };
  // Khoản thu đã ghi tài khoản này (0323, sổ chỉ-thêm) thì không xoá được — chỉ ẩn, để chi tiết hoá đơn vẫn hiện đúng tài khoản đã nhận tiền.
  const { count: daDung } = await db.from("thanh_toan").select("id", { count: "exact", head: true }).eq("tai_khoan_id", id);
  if (daDung) return { loi: `Tài khoản đã nhận ${daDung.toLocaleString("vi-VN")} khoản thu nên không xoá được. Bấm Ẩn để thôi dùng ở Thu ngân.` };
  const { error } = await db.from("tai_khoan_ngan_hang").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xoa_tai_khoan_ngan_hang", doi_tuong: "tai_khoan_ngan_hang", doi_tuong_id: id, chi_tiet: { ngan_hang: tk.ngan_hang, so_cuoi: tk.so_tai_khoan.slice(-4), mac_dinh: tk.mac_dinh } });
  revalidatePath("/cai-dat/ngan-hang");
  return { ok: true };
}

export async function luuBangTin(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = {
    tieu_de: chuoi(fd, "tieu_de"), noi_dung: chuoi(fd, "noi_dung"), ghim: bat(fd, "ghim"), hoat_dong: bat(fd, "hoat_dong"),
    hien_tu: chuoi(fd, "hien_tu") || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }), hien_den: chuoiHoacNull(fd, "hien_den"),
  };
  if (!row.tieu_de || !row.noi_dung) return { loi: "Nhập tiêu đề và nội dung." };
  if (row.hien_den && row.hien_den < row.hien_tu) return { loi: "Ngày kết thúc phải sau ngày bắt đầu." };
  const { error } = id ? await sb().from("bang_tin").update(row).eq("id", id) : await sb().from("bang_tin").insert({ ...row, tao_boi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/cai-dat/bang-tin");
  revalidatePath("/trang-chu");
  return { ok: true };
}

/** Chính sách phê duyệt: chỉnh ngưỡng tiền và đánh dấu đã được chủ phòng khám xác nhận. Chỉ Kỹ thuật (hethong.phanquyen). */
export async function luuQuyTacDuyet(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("hethong.phanquyen"))) return { loi: KHONG_DU_QUYEN };
  const nguong = Math.round(so(fd, "nguong_tien"));
  if (!Number.isInteger(nguong) || nguong < 0 || nguong > 100_000_000_000) return { loi: "Ngưỡng là số đồng từ 0 đến 100 tỷ." };
  const { error } = await sb().from("quy_tac_duyet").update({ nguong_tien: nguong, trang_thai: bat(fd, "hieu_luc") ? "hieu_luc" : "cho_xac_nhan", cap_nhat_luc: new Date().toISOString() }).eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/cai-dat", "layout");
  return { ok: true };
}

/** Đổi điểm thưởng thành giảm giá ở Thu ngân: bật/tắt + số đồng cho 1 điểm (SalonHero: 1 điểm = 10.000đ, đang tắt). Chỉ Chủ / Kỹ thuật. */
export async function luuDoiDiem(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hethong.phanquyen");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tien = Math.round(so(fd, "tien_moi_diem"));
  if (!Number.isInteger(tien) || tien < 100 || tien > 10_000_000) return { loi: "Số tiền cho 1 điểm từ 100đ đến 10.000.000đ." };
  const db = sb();
  const { error } = await db.from("cau_hinh").upsert([
    { khoa: "diem.doi_bat", gia_tri: bat(fd, "bat") ? "1" : "0", ghi_chu: "Cho đổi điểm thưởng thành giảm giá ở Thu ngân: 1 = bật, 0 = tắt (SalonHero đang tắt)" },
    { khoa: "diem.doi_tien", gia_tri: String(tien), ghi_chu: "Số đồng được giảm cho 1 điểm thưởng (SalonHero: convert2money 1 điểm = 10.000đ)" },
  ]);
  if (!error) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_cau_hinh", doi_tuong: "cau_hinh", chi_tiet: { khoa: "diem.doi", bat: bat(fd, "bat"), tien_moi_diem: tien } });
  revalidatePath("/cai-dat/thong-tin-chung");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}
