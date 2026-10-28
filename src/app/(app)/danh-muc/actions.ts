"use server";

import { revalidatePath, updateTag } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuanHoaTen, khoaTen, loiMa, loiMaVach, loiTen, tienToTheoNhom } from "@/lib/san-pham";
import { bat, chuoi, chuoiHoacNull, mang, so, soHoacNull } from "@/lib/form";
import type { TablesInsert } from "@/lib/supabase/database.types";

type KQ = { ok?: true; loi?: string };
const xong = (): KQ => { revalidatePath("/danh-muc"); return { ok: true }; };

export async function luuNhomDichVu(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { ten: chuoi(fd, "ten"), thu_tu: so(fd, "thu_tu") };
  if (!row.ten) return { loi: "Nhập tên nhóm." };
  const { error } = id ? await sb().from("dich_vu_nhom").update(row).eq("id", id) : await sb().from("dich_vu_nhom").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function luuDichVu(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row: TablesInsert<"dich_vu"> = {
    ma: chuoi(fd, "ma").toUpperCase(), nhom_id: chuoi(fd, "nhom_id"), ten: chuoi(fd, "ten"), don_vi_tinh: chuoi(fd, "don_vi_tinh") || "buổi",
    thoi_luong_phut: so(fd, "thoi_luong_phut") || 60, gia: so(fd, "gia"), gia_von: so(fd, "gia_von"), vat_pct: so(fd, "vat_pct"), hoat_dong: bat(fd, "hoat_dong"), dat_online: bat(fd, "dat_online"),
  };
  if (!row.ma || !row.ten || !row.nhom_id) return { loi: "Nhập mã, tên và chọn nhóm dịch vụ." };
  const { error } = id ? await sb().from("dich_vu").update(row).eq("id", id) : await sb().from("dich_vu").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function luuGoiThe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const loai = chuoi(fd, "loai") === "tien" ? "tien" : "lan";
  const row: TablesInsert<"goi_the"> = {
    ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), loai, gia: so(fd, "gia"),
    so_buoi: loai === "lan" ? so(fd, "so_buoi") || null : null,
    gia_tri_the: loai === "tien" ? so(fd, "gia_tri_the") || null : null,
    han_dung_ngay: soHoacNull(fd, "han_dung_ngay") || null, hoat_dong: bat(fd, "hoat_dong"),
  };
  if (!row.ma || !row.ten) return { loi: "Nhập mã và tên gói." };
  if (loai === "lan" && !row.so_buoi) return { loi: "Thẻ liệu trình bắt buộc nhập số buổi." };
  if (loai === "tien" && !row.gia_tri_the) return { loi: "Thẻ tiền bắt buộc nhập giá trị nạp vào thẻ." };
  const db = sb();
  let goiId = id;
  if (id) {
    const { error } = await db.from("goi_the").update(row).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { data, error } = await db.from("goi_the").insert(row).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    goiId = data.id;
  }
  const dv = mang(fd, "dich_vu_ids");
  await db.from("goi_the_dich_vu").delete().eq("goi_id", goiId);
  if (dv.length) await db.from("goi_the_dich_vu").insert(dv.map((d) => ({ goi_id: goiId, dich_vu_id: d })));
  return xong();
}

export async function luuSanPham(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const nhomCap = chuoi(fd, "nhom_cap");
  const ten = chuanHoaTen(chuoi(fd, "ten")), nhom = chuoiHoacNull(fd, "nhom"), maVach = chuoi(fd, "ma_vach").replace(/\s+/g, "");
  let ma = chuoi(fd, "ma").toUpperCase().replace(/\s+/g, "");
  if (!ten || !chuoi(fd, "don_vi")) return { loi: "Nhập tên và đơn vị dùng." };
  const goc = id ? (await db.from("san_pham").select("ma, ten, ma_vach").eq("id", id).maybeSingle()).data : null;
  // Quy ước chỉ ép khi tạo mới hoặc khi người dùng đổi mã/tên: hàng cũ nhập từ SalonHero chưa theo quy ước vẫn lưu được các sửa khác (giá, tồn tối thiểu...).
  if (!id || ten !== goc?.ten) { const l = loiTen(ten); if (l) return { loi: l }; }
  if (!ma && !id) ma = `${tienToTheoNhom(nhom)}-${String(Number((await db.rpc("so_tiep_theo", { p_khoa: `sp_${tienToTheoNhom(nhom)}` })).data ?? 0)).padStart(4, "0")}`;
  if (!ma) return { loi: "Nhập mã sản phẩm." };
  if (!id || ma !== goc?.ma) { const l = loiMa(ma); if (l) return { loi: l }; }
  if (!id || maVach !== (goc?.ma_vach ?? "")) { const l = loiMaVach(maVach); if (l) return { loi: l }; }
  const { data: ds } = await db.from("san_pham").select("id, ma, ten, ma_vach");
  const trung = (ds ?? []).find((x) => x.id !== id && khoaTen(x.ten) === khoaTen(ten));
  if (trung) return { loi: `Tên này trùng sản phẩm đã có (${trung.ma}: ${trung.ten}). Sửa sản phẩm đó hoặc đặt tên khác (thêm quy cách, dung tích).` };
  if (maVach && (ds ?? []).some((x) => x.id !== id && x.ma_vach === maVach)) return { loi: "Mã vạch này đã gắn cho sản phẩm khác." };
  const row: TablesInsert<"san_pham"> = {
    ma, ten, nhom,
    nhom_cap: nhomCap === "A" || nhomCap === "B" || nhomCap === "C" ? nhomCap : null,
    don_vi: chuoi(fd, "don_vi"), don_vi_mua: chuoiHoacNull(fd, "don_vi_mua"), he_so_quy_doi: so(fd, "he_so_quy_doi") || 1,
    gia_nhap_don_vi: soHoacNull(fd, "gia_nhap_don_vi"), gia_ban: so(fd, "gia_ban"), ma_vach: maVach || null, bat_buoc_han_dung: bat(fd, "bat_buoc_han_dung"),
    ban_le: bat(fd, "ban_le"), tieu_hao: bat(fd, "tieu_hao"), theo_doi_kho: bat(fd, "theo_doi_kho"), ton_toi_thieu: so(fd, "ton_toi_thieu"), hoat_dong: bat(fd, "hoat_dong"),
  };
  const { error } = id ? await db.from("san_pham").update(row).eq("id", id) : await db.from("san_pham").insert(row);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function luuChiNhanh(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("nhanvien.quanly"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), dia_chi: chuoiHoacNull(fd, "dia_chi"), dien_thoai: chuoiHoacNull(fd, "dien_thoai"), thu_tu: so(fd, "thu_tu") || 100, hoat_dong: bat(fd, "hoat_dong") };
  if (!row.ma || !row.ten) return { loi: "Nhập mã và tên chi nhánh." };
  const { error } = id ? await sb().from("chi_nhanh").update(row).eq("id", id) : await sb().from("chi_nhanh").insert(row);
  if (!error) updateTag("chi-nhanh");
  return error ? { loi: thongBaoLoi(error) } : xong();
}

/** Xoá một mục danh mục. Mục đã có lịch sử (hoá đơn, thẻ, kho, lịch...) bị khoá ngoại chặn ở DB → hướng người dùng bấm "Ngừng" (tắt Đang bán/Đang dùng) thay vì xoá. */
const MUC_DA_DUNG = "Mục này đã được dùng ở nơi khác (hoá đơn, thẻ, kho, lịch hẹn...) nên không xoá được. Hãy sửa và tắt \"Đang dùng/Đang bán\" để ngừng dùng.";
async function xoaMuc(quyen: "danhmuc.sua" | "nhanvien.quanly", bang: "dich_vu" | "goi_the" | "san_pham" | "dich_vu_nhom" | "chi_nhanh", fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen(quyen))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  if (!id) return { loi: "Thiếu mục cần xoá." };
  const { error, count } = await sb().from(bang).delete({ count: "exact" }).eq("id", id);
  if (error) return { loi: error.code === "23503" ? MUC_DA_DUNG : thongBaoLoi(error) };
  if (!count) return { loi: "Mục này không còn tồn tại." };
  if (bang === "chi_nhanh") updateTag("chi-nhanh");
  return xong();
}
export const xoaDichVu = async (fd: FormData) => xoaMuc("danhmuc.sua", "dich_vu", fd);
export const xoaGoiThe = async (fd: FormData) => xoaMuc("danhmuc.sua", "goi_the", fd);
export const xoaSanPham = async (fd: FormData) => xoaMuc("danhmuc.sua", "san_pham", fd);
export const xoaNhomDichVu = async (fd: FormData) => xoaMuc("danhmuc.sua", "dich_vu_nhom", fd);
export const xoaChiNhanh = async (fd: FormData) => xoaMuc("nhanvien.quanly", "chi_nhanh", fd);

/** Chỗ làm (giường/phòng) theo chi nhánh: tên chỗ được ghi vào lich_hen.phong khi đặt lịch; số chỗ đang hoạt động là sức chứa để tính giờ trống cho khách đặt online. */
export async function luuChoLam(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { chi_nhanh_id: chuoi(fd, "chi_nhanh_id"), ten: chuoi(fd, "ten").replace(/\s+/g, " "), thu_tu: so(fd, "thu_tu") || 100, hoat_dong: bat(fd, "hoat_dong") };
  if (!row.chi_nhanh_id) return { loi: "Chọn chi nhánh." };
  if (row.ten.length < 1 || row.ten.length > 40) return { loi: "Tên chỗ từ 1 đến 40 ký tự." };
  const db = sb();
  const { error } = id ? await db.from("cho_lam").update(row).eq("id", id) : await db.from("cho_lam").insert(row);
  if (error?.code === "23505") return { loi: "Chi nhánh này đã có chỗ trùng tên." };
  if (error) return { loi: thongBaoLoi(error) };
  // Đổi tên chỗ: các lịch chưa diễn ra dùng tên cũ được đổi theo để lưới không tách thành hai hàng.
  const cu = chuoi(fd, "ten_cu");
  if (id && cu && cu !== row.ten) await db.from("lich_hen").update({ phong: row.ten }).eq("chi_nhanh_id", row.chi_nhanh_id).eq("phong", cu).gte("bat_dau", new Date().toISOString());
  return xong();
}
export async function xoaChoLam(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  if (!id) return { loi: "Thiếu mục cần xoá." };
  const { error } = await sb().from("cho_lam").delete().eq("id", id);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

/** Công tắc + thông số của trang đặt lịch online (/dat-lich). Mở trang ra Internet nên chỉ người quản lý, và ghi nhật ký. */
export async function luuDatLichOnline(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nhanvien.quanly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const truoc = Math.round(so(fd, "bao_truoc_phut")), ngay = Math.round(so(fd, "toi_da_ngay"));
  if (truoc < 0 || truoc > 10080) return { loi: "Đặt trước tối thiểu từ 0 đến 10.080 phút." };
  if (ngay < 1 || ngay > 60) return { loi: "Chỉ nhận đặt trong 1 đến 60 ngày tới." };
  const mo = bat(fd, "mo");
  const db = sb();
  const { error } = await db.from("cau_hinh").upsert([
    { khoa: "dat_online.mo", gia_tri: mo ? "1" : "0" }, { khoa: "dat_online.bao_truoc_phut", gia_tri: String(truoc) }, { khoa: "dat_online.toi_da_ngay", gia_tri: String(ngay) },
  ]);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_cau_hinh", doi_tuong: "cau_hinh", chi_tiet: { khoa: "dat_online", mo, bao_truoc_phut: truoc, toi_da_ngay: ngay } });
  return xong();
}
