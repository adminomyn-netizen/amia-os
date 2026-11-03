"use server";

import { revalidatePath, updateTag } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuanHoaTen, khoaTen, loiMa, loiMaVach, loiTen, tienToTheoNhom } from "@/lib/san-pham";
import { bat, chuoi, chuoiHoacNull, mang, so, soHoacNull } from "@/lib/form";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { CHE_DO_SUA_LAN, CHE_DO_SUA_TIEN, DON_VI_DICH_VU, DOI_TUONG, DON_VI_DUNG_TICH, HAN_TINH_TU, HINH_THUC_NHAP, MAU_THE, NOI_HIEN_THI, SO_BUOI_KHONG_GIOI_HAN, vatTuChon } from "@/lib/danh-muc";

const KHO_ANH_DM = "danh-muc-anh";

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
  const vat = vatTuChon(chuoi(fd, "vat") || "0");
  const phut = Math.round(so(fd, "tg_gio")) * 60 + Math.round(so(fd, "tg_phut"));
  const donVi = chuoi(fd, "don_vi_tinh") || "buổi";
  const doiTuong = chuoi(fd, "doi_tuong") || "ca_hai", noiHienThi = chuoi(fd, "noi_hien_thi") || "tat_ca";
  if (!vat) return { loi: "Chọn mức thuế VAT trong danh sách." };
  if (phut <= 0 || phut > 24 * 60) return { loi: "Thời gian phục vụ phải lớn hơn 0 và không quá 24 giờ." };
  if (!DON_VI_DICH_VU.some((d) => d.gia_tri === donVi)) return { loi: "Đơn vị tính không có trong danh sách." };
  if (!DOI_TUONG.some((d) => d.gia_tri === doiTuong) || !NOI_HIEN_THI.some((d) => d.gia_tri === noiHienThi)) return { loi: "Đối tượng hoặc nơi hiển thị không hợp lệ." };
  const tenEn = chuoiHoacNull(fd, "ten_en"), moTa = chuoiHoacNull(fd, "mo_ta");
  if ((tenEn ?? "").length > 200) return { loi: "Tên tiếng Anh tối đa 200 ký tự." };
  if ((moTa ?? "").length > 2000) return { loi: "Mô tả tối đa 2000 ký tự." };
  const db = sb();
  // Địa điểm cung cấp: bỏ trống hoặc chọn đủ mọi chi nhánh đang hoạt động = mọi chi nhánh (null).
  const chon = [...new Set(mang(fd, "chi_nhanh_ids"))];
  const { data: cnAll } = await db.from("chi_nhanh").select("id").eq("hoat_dong", true);
  const cnHopLe = new Set((cnAll ?? []).map((c) => c.id));
  if (chon.some((c) => !cnHopLe.has(c))) return { loi: "Có chi nhánh không còn hoạt động trong danh sách địa điểm. Mở lại hộp và chọn lại." };
  const diaDiem = chon.length === 0 || chon.length >= cnHopLe.size ? null : chon;
  const row: TablesInsert<"dich_vu"> = {
    ma: chuoi(fd, "ma").toUpperCase(), nhom_id: chuoi(fd, "nhom_id"), ten: chuoi(fd, "ten"), don_vi_tinh: donVi,
    thoi_luong_phut: phut, gia: so(fd, "gia"), gia_von: so(fd, "gia_von"), vat_pct: vat.vat_pct, vat_loai: vat.vat_loai, hoat_dong: bat(fd, "hoat_dong"), dat_online: bat(fd, "dat_online"),
    ten_en: tenEn, mo_ta: moTa, doi_tuong: doiTuong, cho_sua_gia: bat(fd, "cho_sua_gia"), in_gio_phuc_vu: bat(fd, "in_gio_phuc_vu"), noi_hien_thi: noiHienThi, chi_nhanh_ids: diaDiem,
  };
  if (!row.ma || !row.ten || !row.nhom_id) return { loi: "Nhập mã, tên và chọn nhóm dịch vụ." };
  const { error } = id ? await db.from("dich_vu").update(row).eq("id", id) : await db.from("dich_vu").insert(row);
  if (error?.code === "23505") return { loi: "Mã dịch vụ này đã có. Đặt mã khác." };
  return error ? { loi: thongBaoLoi(error) } : xong();
}

/** Chuyển nhiều dịch vụ sang một nhóm khác (SalonHero: nút "Chuyển nhóm"). Chỉ đổi nhom_id. */
export async function chuyenNhomDichVu(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const ids = [...new Set(mang(fd, "dich_vu_ids"))], nhomId = chuoi(fd, "nhom_id");
  if (!nhomId) return { loi: "Chọn nhóm đích." };
  if (!ids.length) return { loi: "Chọn ít nhất một dịch vụ cần chuyển." };
  const db = sb();
  const { data: n } = await db.from("dich_vu_nhom").select("id").eq("id", nhomId).maybeSingle();
  if (!n) return { loi: "Nhóm đích không còn tồn tại." };
  const { error } = await db.from("dich_vu").update({ nhom_id: nhomId }).in("id", ids);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

const KIEU_ANH = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/;
/** Ảnh dịch vụ / sản phẩm: trình duyệt đã cắt vuông + thu nhỏ thành JPEG; máy chủ chỉ nhận JPEG nhỏ, đưa vào kho công khai danh-muc-anh và chỉ lưu ĐƯỜNG DẪN trong bảng (không lưu ảnh nhúng, vì trang danh mục đọc cả bảng). */
export async function datAnhDanhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const bang = chuoi(fd, "bang"), id = chuoi(fd, "id");
  if (bang !== "dich_vu" && bang !== "san_pham") return { loi: "Loại mục không hợp lệ." };
  const db = sb();
  const { data: cu } = bang === "dich_vu" ? await db.from("dich_vu").select("anh").eq("id", id).maybeSingle() : await db.from("san_pham").select("anh").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy mục này." };
  let duong: string | null = null, buf: Buffer | null = null;
  if (fd.get("xoa") !== "1") {
    const m = KIEU_ANH.exec(chuoi(fd, "anh"));
    if (!m) return { loi: "Ảnh không hợp lệ." };
    buf = Buffer.from(m[1], "base64");
    if (buf.length < 200 || buf[0] !== 0xff || buf[1] !== 0xd8) return { loi: "Ảnh không hợp lệ." };
    if (buf.length > 1_500_000) return { loi: "Ảnh quá lớn." };
    duong = `${bang}/${id}-${Date.now()}.jpg`;
    const { error: loiTai } = await db.storage.from(KHO_ANH_DM).upload(duong, buf, { contentType: "image/jpeg", upsert: false });
    if (loiTai) return { loi: "Không tải được ảnh, thử lại." };
  }
  const { error } = bang === "dich_vu" ? await db.from("dich_vu").update({ anh: duong }).eq("id", id) : await db.from("san_pham").update({ anh: duong }).eq("id", id);
  if (error) { if (duong) await db.storage.from(KHO_ANH_DM).remove([duong]); return { loi: thongBaoLoi(error) }; }
  if (cu.anh) await db.storage.from(KHO_ANH_DM).remove([cu.anh]);
  return xong();
}

export async function luuGoiThe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const loai = chuoi(fd, "loai") === "tien" ? "tien" : "lan";
  const khongGioiHan = loai === "lan" && bat(fd, "khong_gioi_han");
  // Thẻ lần không giới hạn dùng đúng quy ước sẵn có của thẻ khách: số buổi 999999 (màn Thẻ và Tổng quan đã hiểu là "Không giới hạn").
  const soBuoi = loai === "lan" ? (khongGioiHan ? SO_BUOI_KHONG_GIOI_HAN : so(fd, "so_buoi") || null) : null;
  const mau = chuoi(fd, "mau_the"), hanTu = chuoi(fd, "han_tinh_tu") || "ngay_cap", noiHienThi = chuoi(fd, "noi_hien_thi") || "tat_ca";
  const cheDo = chuoi(fd, loai === "lan" ? "che_do_lan" : "che_do_tien") || "co_dinh";
  if (mau && !MAU_THE.some((m) => m.gia_tri === mau)) return { loi: "Màu thẻ không có trong danh sách." };
  if (!HAN_TINH_TU.some((h) => h.gia_tri === hanTu) || !NOI_HIEN_THI.some((h) => h.gia_tri === noiHienThi)) return { loi: "Cách tính hạn hoặc nơi hiển thị không hợp lệ." };
  if (!(loai === "lan" ? CHE_DO_SUA_LAN : CHE_DO_SUA_TIEN).some((c) => c.gia_tri === cheDo)) return { loi: "Cách sửa số tại thu ngân không hợp lệ." };
  const tenEn = chuoiHoacNull(fd, "ten_en"), moTa = chuoiHoacNull(fd, "mo_ta");
  if ((tenEn ?? "").length > 200) return { loi: "Tên tiếng Anh tối đa 200 ký tự." };
  if ((moTa ?? "").length > 2000) return { loi: "Mô tả tối đa 2000 ký tự." };
  const db = sb();
  const nhomChon = chuoi(fd, "nhom_id");
  let nhomId: string | null = null;
  if (nhomChon) {
    const { data: n } = await db.from("goi_the_nhom").select("id, mac_dinh").eq("id", nhomChon).maybeSingle();
    if (!n) return { loi: "Nhóm thẻ không còn tồn tại." };
    nhomId = n.mac_dinh ? null : n.id; // null = nhóm mặc định "Thẻ thành viên"
  }
  const row: TablesInsert<"goi_the"> = {
    ma: chuoi(fd, "ma").toUpperCase(), ten: chuoi(fd, "ten"), loai, gia: so(fd, "gia"),
    so_buoi: soBuoi,
    gia_tri_the: loai === "tien" ? so(fd, "gia_tri_the") || null : null,
    han_dung_ngay: soHoacNull(fd, "han_dung_ngay") || null, hoat_dong: bat(fd, "hoat_dong"),
    ten_en: tenEn, mo_ta: moTa, mau_the: mau || null, han_tinh_tu: hanTu, nhom_id: nhomId, cho_sua_gia: bat(fd, "cho_sua_gia"), che_do_sua_so: cheDo,
    gia_tri_1_lan: loai === "lan" ? (soHoacNull(fd, "gia_tri_1_lan") || null) : null, noi_hien_thi: noiHienThi,
  };
  if (!row.ma || !row.ten) return { loi: "Nhập mã và tên gói." };
  if (loai === "lan" && !row.so_buoi) return { loi: "Thẻ liệu trình bắt buộc nhập số buổi (hoặc bật Không giới hạn số lần)." };
  if (loai === "tien" && !row.gia_tri_the) return { loi: "Thẻ tiền bắt buộc nhập giá trị nạp vào thẻ." };
  let goiId = id;
  if (id) {
    const { error } = await db.from("goi_the").update(row).eq("id", id);
    if (error) return { loi: error.code === "23505" ? "Mã gói thẻ này đã có. Đặt mã khác." : thongBaoLoi(error) };
  } else {
    const { data, error } = await db.from("goi_the").insert(row).select("id").single();
    if (error || !data) return { loi: error?.code === "23505" ? "Mã gói thẻ này đã có. Đặt mã khác." : thongBaoLoi(error) };
    goiId = data.id;
  }
  const dv = mang(fd, "dich_vu_ids");
  await db.from("goi_the_dich_vu").delete().eq("goi_id", goiId);
  if (dv.length) await db.from("goi_the_dich_vu").insert(dv.map((d) => ({ goi_id: goiId, dich_vu_id: d })));
  return xong();
}

/** Nhóm thẻ (SalonHero: hộp "Các nhóm thẻ"). Nhóm mặc định "Thẻ thành viên" giữ nguyên, không xoá. */
export async function luuNhomThe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten").replace(/\s+/g, " ");
  if (ten.length < 1 || ten.length > 80) return { loi: "Tên nhóm từ 1 đến 80 ký tự." };
  const row = { ten, thu_tu: so(fd, "thu_tu") || 100 };
  const { error } = id ? await sb().from("goi_the_nhom").update(row).eq("id", id) : await sb().from("goi_the_nhom").insert(row);
  if (error?.code === "23505") return { loi: "Đã có nhóm thẻ trùng tên." };
  return error ? { loi: thongBaoLoi(error) } : xong();
}
export async function xoaNhomThe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: n } = await db.from("goi_the_nhom").select("id, mac_dinh").eq("id", id).maybeSingle();
  if (!n) return { loi: "Nhóm này không còn tồn tại." };
  if (n.mac_dinh) return { loi: "Không xoá được nhóm mặc định." };
  const { count } = await db.from("goi_the").select("id", { count: "exact", head: true }).eq("nhom_id", id);
  if (count) return { loi: `Nhóm này còn ${count} loại thẻ. Chuyển các thẻ sang nhóm khác rồi hãy xoá.` };
  const { error } = await db.from("goi_the_nhom").delete().eq("id", id);
  return error ? { loi: thongBaoLoi(error) } : xong();
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
  const tenEn = chuoiHoacNull(fd, "ten_en"), moTa = chuoiHoacNull(fd, "mo_ta"), nhanHieu = chuoiHoacNull(fd, "nhan_hieu");
  const dungTich = soHoacNull(fd, "dung_tich"), uoc = soHoacNull(fd, "uoc_tinh_1_lan"), dungTichDv = chuoi(fd, "dung_tich_dv"), uocDv = chuoi(fd, "uoc_tinh_1_lan_dv");
  const hinhThuc = chuoi(fd, "hinh_thuc_nhap") || "mua_dut", noiHienThi = chuoi(fd, "noi_hien_thi") || "tat_ca";
  if ((tenEn ?? "").length > 200) return { loi: "Tên tiếng Anh tối đa 200 ký tự." };
  if ((moTa ?? "").length > 2000) return { loi: "Mô tả tối đa 2000 ký tự." };
  if ((nhanHieu ?? "").length > 120) return { loi: "Nhãn hiệu tối đa 120 ký tự." };
  if ((dungTich != null && dungTich < 0) || (uoc != null && uoc < 0)) return { loi: "Dung tích và mức dùng một lần không được âm." };
  if ([dungTichDv, uocDv].some((d) => d && !DON_VI_DUNG_TICH.some((x) => x.gia_tri === d))) return { loi: "Đơn vị dung tích không có trong danh sách." };
  if (!HINH_THUC_NHAP.some((h) => h.gia_tri === hinhThuc) || !NOI_HIEN_THI.some((h) => h.gia_tri === noiHienThi)) return { loi: "Hình thức nhập hoặc nơi hiển thị không hợp lệ." };
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
    ten_en: tenEn, mo_ta: moTa, nhan_hieu: nhanHieu, dung_tich: dungTich, dung_tich_dv: dungTich == null ? null : dungTichDv, uoc_tinh_1_lan: uoc, uoc_tinh_1_lan_dv: uoc == null ? null : uocDv,
    hinh_thuc_nhap: hinhThuc, cho_sua_gia: bat(fd, "cho_sua_gia"), noi_hien_thi: noiHienThi,
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
  const db = sb();
  const anhCu = bang === "dich_vu" ? (await db.from("dich_vu").select("anh").eq("id", id).maybeSingle()).data?.anh : bang === "san_pham" ? (await db.from("san_pham").select("anh").eq("id", id).maybeSingle()).data?.anh : null;
  const { error, count } = await db.from(bang).delete({ count: "exact" }).eq("id", id);
  if (error) return { loi: error.code === "23503" ? MUC_DA_DUNG : thongBaoLoi(error) };
  if (!count) return { loi: "Mục này không còn tồn tại." };
  if (anhCu) await db.storage.from(KHO_ANH_DM).remove([anhCu]);
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
