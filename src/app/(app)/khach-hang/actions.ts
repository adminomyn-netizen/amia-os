"use server";

import { luuAnh, xoaAnh } from "@/lib/kho-anh";
import { docAnhTheoMa, docTrangAnh } from "@/lib/anh-khach-doc";
import type { AnhKhach } from "@/lib/anh-khach";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang } from "@/lib/form";
import { chuanSdt, coSdtHopLe, homNayHCM, soTuChu } from "@/lib/dinh-dang";
import { docKhachTuExcel } from "@/lib/nhap-khach";

type KQ = { ok?: true; loi?: string; id?: string };
const NGUON_HOP_LE = ["mkt", "telesale", "tu_van", "khach_cu_gioi_thieu", "khac"];

export async function luuKhach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const id = chuoi(fd, "id");
  const sdt = chuanSdt(chuoi(fd, "dien_thoai"));
  const nguon = chuoi(fd, "nguon");
  if (!chuoi(fd, "ho_ten")) return { loi: "Nhập họ tên khách." };
  // Số trong nước: 0 + 9–10 số. Khách nước ngoài (Đà Lạt có nhiều, SalonHero cho nhập) : 9–15 chữ số có mã nước, không bắt đầu bằng 0.
  if (!coSdtHopLe(sdt) && !/^[1-9]\d{8,14}$/.test(sdt)) return { loi: "Số điện thoại chưa hợp lệ (số trong nước bắt đầu bằng 0, 10–11 số; số nước ngoài ghi cả mã nước)." };
  if (!NGUON_HOP_LE.includes(nguon)) return { loi: "Chọn nguồn khách (bắt buộc)." };
  if (!chuoi(fd, "nguoi_phu_trach_id")) return { loi: "Chọn người phụ trách (bắt buộc)." };
  if (!chuoi(fd, "chi_nhanh_id")) return { loi: "Chọn chi nhánh." };

  const { data: trung } = await db.from("khach_hang").select("id, ma, ho_ten").eq("dien_thoai", sdt).maybeSingle();
  if (trung && trung.id !== id) return { loi: `Số này đã có khách: ${trung.ho_ten} (${trung.ma}).` };

  // Khi sửa: đọc bản ghi hiện tại để giữ người giới thiệu nếu người dùng không đổi (form hiện sẵn mã người giới thiệu cũ).
  const { data: cu } = id ? await db.from("khach_hang").select("dong_y_dung_hinh, dong_y_dung_hinh_luc, nguon, nguoi_gioi_thieu_id").eq("id", id).maybeSingle() : { data: null };
  let nguoiGt: string | null = cu?.nguoi_gioi_thieu_id ?? null;
  const gt = chuoi(fd, "nguoi_gioi_thieu");
  if (nguon === "khach_cu_gioi_thieu") {
    const maCu = nguoiGt ? ((await db.from("khach_hang").select("ma").eq("id", nguoiGt).maybeSingle()).data?.ma ?? "") : "";
    // Bắt buộc người giới thiệu khi tạo khách mới hoặc khi đổi nguồn sang "khách cũ giới thiệu". Khách chuyển từ SalonHero đã mang nguồn này
    // nhưng chưa nối được người giới thiệu (670 khách, 28/10/2026) thì vẫn cho sửa các trường khác, không chặn lưu.
    if (!gt && !nguoiGt && (!id || cu?.nguon !== "khach_cu_gioi_thieu")) return { loi: "Khách cũ giới thiệu: nhập mã hoặc số điện thoại của người giới thiệu." };
    if (gt && gt.toLowerCase() !== maCu.toLowerCase()) {
      // Khớp mã khách trước (không phân biệt hoa thường), không có mới tra theo số điện thoại hợp lệ.
      let { data } = await db.from("khach_hang").select("id").ilike("ma", gt.replace(/[%_\\]/g, "")).maybeSingle();
      if (!data && coSdtHopLe(gt)) data = (await db.from("khach_hang").select("id").eq("dien_thoai", chuanSdt(gt)).maybeSingle()).data;
      if (!data) return { loi: "Không tìm thấy người giới thiệu theo mã/số điện thoại đó." };
      if (data.id === id) return { loi: "Khách không thể tự giới thiệu chính mình." };
      nguoiGt = data.id;
    }
  } else if (cu?.nguon === "khach_cu_gioi_thieu") {
    nguoiGt = null; // đổi nguồn từ "khách cũ giới thiệu" sang nguồn khác thì bỏ người giới thiệu; nguồn khác từ trước (vd dữ liệu chuyển từ SalonHero) thì giữ nguyên.
  }
  const dongY = bat(fd, "dong_y_dung_hinh");
  const row = {
    ho_ten: chuoi(fd, "ho_ten"), dien_thoai: sdt, zalo: chuoiHoacNull(fd, "zalo"), email: chuoiHoacNull(fd, "email"),
    gioi_tinh: ["nữ", "nam", "khác"].includes(chuoi(fd, "gioi_tinh")) ? chuoi(fd, "gioi_tinh") : null,
    ngay_sinh: chuoiHoacNull(fd, "ngay_sinh"), dia_chi: chuoiHoacNull(fd, "dia_chi"), chi_nhanh_id: chuoi(fd, "chi_nhanh_id"),
    nguon, nguon_chi_tiet: chuoiHoacNull(fd, "nguon_chi_tiet"), nguoi_gioi_thieu_id: nguoiGt, nguoi_phu_trach_id: chuoi(fd, "nguoi_phu_trach_id"),
    ghi_chu: chuoiHoacNull(fd, "ghi_chu"), dong_y_dung_hinh: dongY, cap_nhat_luc: new Date().toISOString(),
    // Các ô thêm như SalonHero. Khi SỬA mà form không gửi ô nào (gọi cũ) thì không đụng tới cột đó, tránh xoá dữ liệu chuyển từ SalonHero.
    ...Object.fromEntries(["tinh_thanh", "quan_huyen", "quoc_gia", "sdt_phu", "facebook", "website", "nghe_nghiep", "cong_ty", "ma_so_thue", "ma_the_giay"].filter((k) => fd.has(k)).map((k) => [k, chuoiHoacNull(fd, k)])),
  };
  let khachId = id;
  if (id) {
    // `dong_y_dung_hinh_luc` = mốc khách ĐỒNG Ý. Bật đồng ý: ghi giờ hiện tại. Bỏ tích (rút đồng ý): XOÁ mốc cũ để không còn hiện như đang đồng ý,
    // còn việc rút đồng ý (ai, lúc nào) ghi vào nhật ký truy cập. Không đổi thì giữ nguyên.
    const doiDongY = dongY !== !!cu?.dong_y_dung_hinh;
    const { error } = await db.from("khach_hang").update({ ...row, ...(doiDongY ? { dong_y_dung_hinh_luc: dongY ? new Date().toISOString() : null } : {}) }).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
    if (doiDongY && !dongY) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "rut_dong_y_hinh", doi_tuong: "khach_hang", doi_tuong_id: id, chi_tiet: { moc_dong_y_cu: cu?.dong_y_dung_hinh_luc ?? null } });
  } else {
    const ma = "KH" + String(await soTiep("khach")).padStart(6, "0");
    const { data, error } = await db.from("khach_hang").insert({ ...row, ma, tao_boi: nd.nhanVienId, dong_y_dung_hinh_luc: dongY ? new Date().toISOString() : null }).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    khachId = data.id;
    // Nhóm khách chọn ngay trong form tạo (như SalonHero).
    const nhom = mang(fd, "nhom_ids").filter((x) => /^[0-9a-f-]{36}$/i.test(x));
    if (nhom.length) {
      const { error: loiNhom } = await db.from("khach_nhom").insert(nhom.map((n) => ({ khach_id: data.id, nhom_id: n })));
      if (loiNhom) console.error("[luuKhach] gán nhóm", loiNhom.message);
    }
  }
  await db.from("khach_quan_tam").delete().eq("khach_id", khachId);
  const qt = mang(fd, "quan_tam");
  if (qt.length) await db.from("khach_quan_tam").insert(qt.map((d) => ({ khach_id: khachId, dich_vu_id: d })));
  revalidatePath("/khach-hang");
  return { ok: true, id: khachId };
}

async function soTiep(khoa: string) {
  const { data } = await sb().rpc("so_tiep_theo", { p_khoa: khoa });
  return Number(data ?? 0);
}

export async function danhDauMat(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("khach.sua"))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("khach_hang").update({ danh_dau_mat: bat(fd, "mat") }).eq("id", chuoi(fd, "id"));
  revalidatePath("/khach-hang", "layout");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Nút "Xoá" như SalonHero, nhưng chỉ xoá được KHÁCH NHẬP NHẦM: chưa có hoá đơn, lịch, thẻ, buổi, khiếu nại... (CSDL chặn bằng khoá ngoại), chưa có ảnh/ghi chú điều trị. Khách đã có lịch sử thì dùng "Đánh dấu đã mất". Cần quyền nhập khách (quản lý). */
export async function xoaKhach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.nhap");
  if (!nd) return { loi: "Chỉ quản lý (quyền nhập khách) mới xoá được hồ sơ khách." };
  const id = chuoi(fd, "id");
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("id", id).maybeSingle();
  if (!k) return { loi: "Không tìm thấy khách." };
  const [{ count: anh }, { count: gc }, { count: anhCu }] = await Promise.all([
    db.from("khach_anh").select("id", { count: "exact", head: true }).eq("khach_id", id),
    db.from("khach_ghi_chu").select("id", { count: "exact", head: true }).eq("khach_id", id),
    db.from("khach_anh_luu_tru").select("khach_id", { count: "exact", head: true }).eq("khach_id", id),
  ]);
  if ((anh ?? 0) + (gc ?? 0) + (anhCu ?? 0) > 0) return { loi: "Khách đã có ảnh hoặc ghi chú điều trị nên không xoá được (hồ sơ điều trị phải giữ). Dùng “Đánh dấu đã mất”." };
  const { error } = await db.from("khach_hang").delete().eq("id", id);
  if (error) return { loi: error.code === "23503" ? "Khách đã có hoá đơn, lịch hẹn, thẻ, khiếu nại hoặc dữ liệu khác nên không xoá được. Dùng “Đánh dấu đã mất”." : thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xoa_khach", doi_tuong: "khach_hang", doi_tuong_id: id, chi_tiet: { ma: k.ma, ho_ten: k.ho_ten, dien_thoai: k.dien_thoai } });
  revalidatePath("/khach-hang", "layout");
  redirect("/khach-hang");
}

/** Nút "Điểm" ở hồ sơ (SalonHero): cộng/trừ điểm thưởng bằng tay. Sổ điểm chỉ thêm dòng (không sửa/xoá): sai thì thêm dòng ngược lại. Cần quyền nhập khách (quản lý). */
export async function suaDiemKhach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.nhap");
  if (!nd) return { loi: "Chỉ quản lý (quyền nhập khách) mới chỉnh điểm thưởng." };
  const id = chuoi(fd, "khach_id");
  const so = soTuChu(fd.get("so_diem"));
  const lyDo = chuoi(fd, "ly_do");
  if (!so || Math.abs(so) > 1_000_000) return { loi: "Nhập số điểm cộng (vd 50) hoặc trừ (vd -50), khác 0." };
  if (!lyDo) return { loi: "Nhập lý do chỉnh điểm." };
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("id, diem_so_du, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!k) return { loi: "Không tìm thấy khách." };
  if (k.diem_so_du + so < 0) return { loi: `Khách chỉ còn ${k.diem_so_du} điểm, không trừ được ${-so}.` };
  const { error } = await db.from("khach_diem_so").insert({ khach_id: id, loai: "sua_tay", so_diem: so, ly_do: lyDo, chi_nhanh_id: nd.chiNhanhId ?? k.chi_nhanh_id, nguoi_id: nd.nhanVienId, nguoi_tao_ten: nd.hoTen });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath(`/khach-hang/${id}`);
  return { ok: true };
}

/** Sửa nhanh ghi chú chung của khách (khach_hang.ghi_chu) từ đầu hồ sơ, không phải mở cả hộp Sửa hồ sơ (chị Diệu Thuý 10/11 mục 6: ghi chú trên điện thoại).
 *  Đồng bộ SalonHero hằng đêm chỉ thêm khách mới (on conflict do nothing) nên không ghi đè ghi chú sửa ở đây. */
export async function suaGhiChuChung(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const ghiChu = chuoi(fd, "ghi_chu").slice(0, 2000) || null;
  if (!id) return { loi: "Không tìm thấy khách." };
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("id, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!k || (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy khách." };
  const { error } = await db.from("khach_hang").update({ ghi_chu: ghiChu }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath(`/khach-hang/${id}`);
  return { ok: true };
}

export async function luuGhiChu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hoso.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const row = { khach_id: chuoi(fd, "khach_id"), tinh_trang: chuoiHoacNull(fd, "tinh_trang"), yeu_cau: chuoiHoacNull(fd, "yeu_cau"), phuong_an: chuoiHoacNull(fd, "phuong_an"), ket_qua: chuoiHoacNull(fd, "ket_qua"), bac_si_id: chuoiHoacNull(fd, "bac_si_id") ?? (nd.vaiTro === "bac_si" ? nd.nhanVienId : null), tao_boi: nd.nhanVienId };
  if (!row.tinh_trang && !row.yeu_cau && !row.phuong_an && !row.ket_qua) return { loi: "Nhập ít nhất một mục: tình trạng, yêu cầu, phương án hoặc kết quả." };
  const { error } = await sb().from("khach_ghi_chu").insert(row);
  revalidatePath(`/khach-hang/${row.khach_id}`);
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Sửa một ghi chú (kể cả ghi chú lấy từ SalonHero). Ghi chú SalonHero đã sửa trong app đổi nhap_dot thành APP-SUA để đồng bộ hằng đêm không ghi đè. */
export async function suaGhiChu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hoso.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), khachId = chuoi(fd, "khach_id");
  const moi = { tinh_trang: chuoiHoacNull(fd, "tinh_trang"), yeu_cau: chuoiHoacNull(fd, "yeu_cau"), phuong_an: chuoiHoacNull(fd, "phuong_an"), ket_qua: chuoiHoacNull(fd, "ket_qua") };
  if (!moi.tinh_trang && !moi.yeu_cau && !moi.phuong_an && !moi.ket_qua) return { loi: "Ghi chú không được để trống cả bốn mục." };
  const db = sb();
  const { data: cu } = await db.from("khach_ghi_chu").select("id, nhap_dot").eq("id", id).eq("khach_id", khachId).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy ghi chú." };
  const { error } = await db.from("khach_ghi_chu").update({ ...moi, ...(String(cu.nhap_dot ?? "").startsWith("SH-") ? { nhap_dot: "APP-SUA" } : {}) }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_ghi_chu", doi_tuong: "khach_ghi_chu", doi_tuong_id: id });
  revalidatePath(`/khach-hang/${khachId}`);
  return { ok: true };
}

export async function luuNguoiThan(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("khach.sua"))) return { loi: KHONG_DU_QUYEN };
  const row = { khach_id: chuoi(fd, "khach_id"), ho_ten: chuoi(fd, "ho_ten"), quan_he: chuoiHoacNull(fd, "quan_he"), dien_thoai: chuoiHoacNull(fd, "dien_thoai") };
  if (!row.ho_ten) return { loi: "Nhập họ tên người thân." };
  const { error } = chuoi(fd, "id") ? await sb().from("khach_nguoi_than").update(row).eq("id", chuoi(fd, "id")) : await sb().from("khach_nguoi_than").insert(row);
  revalidatePath(`/khach-hang/${row.khach_id}`);
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function xoaNguoiThan(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("khach.sua"))) return { loi: KHONG_DU_QUYEN };
  await sb().from("khach_nguoi_than").delete().eq("id", chuoi(fd, "id"));
  revalidatePath(`/khach-hang/${chuoi(fd, "khach_id")}`);
  return { ok: true };
}

const LOAI_ANH: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
/** Nhân viên bấm "Lấy ảnh cũ về xem": xếp yêu cầu vào hàng đợi, tiến trình trên máy chủ nhà chép ảnh từ kho lưu trữ (Lark) về, giữ tạm 3 ngày. */
export async function layAnhCu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("anh.xem");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id");
  const db = sb();
  const { data: lt } = await db.from("khach_anh_luu_tru").select("so_anh").eq("khach_id", khachId).maybeSingle();
  if (!lt || lt.so_anh === 0) return { loi: "Khách này không có ảnh cũ ở kho lưu trữ." };
  const { error } = await db.from("yeu_cau_lay_anh").insert({ khach_id: khachId, tao_boi: nd.nhanVienId });
  // 23505 = đang có yêu cầu chạy cho khách này: coi như đã nhận, không báo lỗi.
  if (error && error.code !== "23505") return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "lay_anh_cu", doi_tuong: "khach_hang", doi_tuong_id: khachId });
  revalidatePath(`/khach-hang/${khachId}`);
  return { ok: true };
}

/** Hỏi nhẹ (1 dòng) xem việc lấy ảnh cũ của khách đã xong chưa — thay cho làm mới cả hồ sơ khách mỗi vài giây (tiết kiệm egress Supabase Free). */
export async function trangThaiLayAnh(khachId: string): Promise<{ dangLay: boolean }> {
  if (!(await kiemQuyen("anh.xem")) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(khachId)) return { dangLay: false };
  const { data } = await sb().from("yeu_cau_lay_anh").select("trang_thai").eq("khach_id", khachId).order("tao_luc", { ascending: false }).limit(1).maybeSingle();
  return { dangLay: data?.trang_thai === "cho" || data?.trang_thai === "dang_lay" };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Trang ảnh kế tiếp của khách (cuộn xuống thì lấy thêm). `tu` = số ảnh đã có. */
export async function trangAnh(khachId: string, tu: number): Promise<{ ds: AnhKhach[]; loi?: string }> {
  if (!(await kiemQuyen("anh.xem"))) return { ds: [], loi: KHONG_DU_QUYEN };
  if (!UUID.test(khachId) || !Number.isInteger(tu) || tu < 0 || tu > 100_000) return { ds: [], loi: "Yêu cầu không hợp lệ." };
  return { ds: await docTrangAnh(khachId, tu) };
}
/** Cấp lại link xem cho vài ảnh khi link cũ đã hết hạn. */
export async function linkAnhMoi(khachId: string, ids: string[]): Promise<{ ds: AnhKhach[]; loi?: string }> {
  if (!(await kiemQuyen("anh.xem"))) return { ds: [], loi: KHONG_DU_QUYEN };
  if (!UUID.test(khachId) || ids.length === 0 || ids.length > 30 || !ids.every((x) => UUID.test(x))) return { ds: [], loi: "Yêu cầu không hợp lệ." };
  return { ds: await docAnhTheoMa(khachId, ids) };
}

/** Xoá một ảnh khách: người tải ảnh lên tự xoá được ảnh của mình; người có quyền ghi hồ sơ điều trị xoá được mọi ảnh.
 *  Xoá dòng trước rồi mới xoá tệp trong kho; ghi nhật ký (đường dẫn, ngày chụp, loại, người tạo) để truy lại. */
export async function xoaAnhKhach(khachId: string, anhId: string): Promise<KQ> {
  const nd = await kiemQuyen("anh.them");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!UUID.test(khachId) || !UUID.test(anhId)) return { loi: "Yêu cầu không hợp lệ." };
  const db = sb();
  const { data: a } = await db.from("khach_anh").select("id, duong_dan, loai, ngay_chup, tao_boi, tao_luc").eq("id", anhId).eq("khach_id", khachId).maybeSingle();
  if (!a) return { loi: "Ảnh không còn (có thể đã bị xoá)." };
  if (a.tao_boi !== nd.nhanVienId && !(await kiemQuyen("hoso.sua"))) return { loi: "Chỉ người tải ảnh lên hoặc người ghi hồ sơ điều trị mới xoá được ảnh này." };
  const { error } = await db.from("khach_anh").delete().eq("id", anhId);
  if (error) return { loi: thongBaoLoi(error) };
  await xoaAnh(a.duong_dan);
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xoa_anh", doi_tuong: "khach_hang", doi_tuong_id: khachId, chi_tiet: { duong_dan: a.duong_dan, loai: a.loai, ngay_chup: a.ngay_chup, tao_boi: a.tao_boi, tao_luc: a.tao_luc } });
  revalidatePath(`/khach-hang/${khachId}`);
  return { ok: true };
}

export async function taiAnh(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("anh.them");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id");
  const tep = fd.get("tep");
  if (!(tep instanceof File) || tep.size === 0) return { loi: "Chưa chọn ảnh." };
  const duoi = LOAI_ANH[tep.type];
  if (!duoi) return { loi: "Chỉ nhận ảnh JPG, PNG hoặc WebP." };
  if (tep.size > 10 * 1024 * 1024) return { loi: "Ảnh quá 10 MB." };
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("dong_y_dung_hinh").eq("id", khachId).maybeSingle();
  if (!k) return { loi: "Không tìm thấy khách." };
  const ngay = chuoi(fd, "ngay_chup") || homNayHCM();
  const duong = `${khachId}/${ngay}/${randomUUID()}.${duoi}`;
  if (!(await luuAnh(duong, Buffer.from(await tep.arrayBuffer()), tep.type))) return { loi: "Không tải được ảnh lên kho riêng. Thử lại." };
  const loai = ["truoc", "sau", "khac"].includes(chuoi(fd, "loai")) ? chuoi(fd, "loai") : "khac";
  const { error } = await db.from("khach_anh").insert({ khach_id: khachId, duong_dan: duong, loai, ngay_chup: ngay, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), tao_boi: nd.nhanVienId });
  if (error) { await xoaAnh(duong); return { loi: thongBaoLoi(error) }; }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "them_anh", doi_tuong: "khach_hang", doi_tuong_id: khachId });
  revalidatePath(`/khach-hang/${khachId}`);
  return { ok: true };
}

export type KetQuaNhap = { ok?: boolean; loi?: string; hopLe?: number; tongDong?: number; daCo?: number; daNhap?: number; ghiDe?: boolean; daGhiDe?: number; trungNhieu?: number; nhom?: string; dongLoi?: { dong: number; viec: string }[] };

/** Nhập khách từ Excel. che_do=xem chỉ kiểm tra (không ghi). Khách có SĐT đã tồn tại: mặc định bỏ qua; bật ghi_de=1 (như SalonHero "Ghi đè nếu trùng") thì cập nhật hồ sơ đó bằng các ô CÓ dữ liệu trong file (ô trống giữ nguyên, không đổi mã/nguồn/phụ trách/chi nhánh). SĐT trùng nhiều hồ sơ thì không ghi đè, chỉ báo. Nguồn/người phụ trách/chi nhánh áp chung cho khách mới. */
export async function nhapKhachExcel(fd: FormData): Promise<KetQuaNhap> {
  const nd = await kiemQuyen("khach.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tep = fd.get("tep");
  if (!(tep instanceof File) || tep.size === 0) return { loi: "Chưa chọn file Excel (.xlsx)." };
  if (tep.size > 8 * 1024 * 1024) return { loi: "File quá 8 MB. Tách nhỏ rồi nhập từng phần." };
  const nguon = chuoi(fd, "nguon"), phuTrach = chuoi(fd, "nguoi_phu_trach_id"), cn = chuoi(fd, "chi_nhanh_id");
  if (!NGUON_HOP_LE.includes(nguon) || !phuTrach || !cn) return { loi: "Chọn nguồn, người phụ trách và chi nhánh áp cho cả file." };
  // Nhóm khách (tuỳ chọn): khách MỚI nhập từ file được gắn luôn vào nhóm này; khách đã có trong hệ thống vẫn bị bỏ qua, không đổi nhóm.
  const nhomId = chuoi(fd, "nhom_id");
  let nhomTen = "";
  if (nhomId) {
    const { data: nh } = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nhomId) ? await sb().from("nhom_khach").select("ten").eq("id", nhomId).eq("hoat_dong", true).maybeSingle() : { data: null };
    if (!nh) return { loi: "Nhóm khách không hợp lệ hoặc đã bị ẩn." };
    nhomTen = nh.ten;
  }
  let doc;
  try { doc = await docKhachTuExcel(await tep.arrayBuffer()); } catch { return { loi: "Không đọc được file. Dùng file .xlsx (không phải .xls hoặc .csv)." }; }
  if (doc.cotThieu.length) return { loi: `File thiếu cột bắt buộc: ${doc.cotThieu.join(", ")}.` };
  const ghiDe = chuoi(fd, "ghi_de") === "1";
  if (ghiDe && !coQuyen(nd, "khach.sua")) return { loi: "Ghi đè khách trùng cần quyền sửa khách hàng." };
  const db = sb();
  const sdts = doc.khach.map((k) => k.dien_thoai);
  const idTheoSdt = new Map<string, string[]>();
  for (let i = 0; i < sdts.length; i += 300) { const { data } = await db.from("khach_hang").select("id, dien_thoai").in("dien_thoai", sdts.slice(i, i + 300)); (data ?? []).forEach((x) => idTheoSdt.set(x.dien_thoai, [...(idTheoSdt.get(x.dien_thoai) ?? []), x.id])); }
  const daCo = new Set(idTheoSdt.keys());
  const moi = doc.khach.filter((k) => !daCo.has(k.dien_thoai));
  // Ghi đè: chỉ khi SĐT khớp đúng 1 hồ sơ; dòng cuối cùng trong file thắng nếu file lặp SĐT.
  const COT_GHI_DE = ["ho_ten", "zalo", "email", "ngay_sinh", "gioi_tinh", "dia_chi", "ghi_chu"] as const;
  const canGhi = new Map<string, Partial<Record<(typeof COT_GHI_DE)[number], string>>>();
  let trungNhieu = 0;
  for (const k of doc.khach) {
    const ids = idTheoSdt.get(k.dien_thoai);
    if (!ids) continue;
    if (ids.length > 1) { trungNhieu++; continue; }
    const doi: Partial<Record<(typeof COT_GHI_DE)[number], string>> = {};
    for (const c of COT_GHI_DE) { const v = k[c]; if (v) doi[c] = v; }
    canGhi.set(ids[0], doi);
  }
  const kq: KetQuaNhap = { ok: true, tongDong: doc.tongDong, hopLe: doc.khach.length, daCo: daCo.size, ghiDe, trungNhieu: ghiDe ? trungNhieu : undefined, dongLoi: doc.loi.slice(0, 30) };
  if (chuoi(fd, "che_do") !== "nhap") return kq;
  let daGhiDe = 0;
  if (ghiDe) {
    const ds = [...canGhi];
    for (let i = 0; i < ds.length; i += 10) {
      const kqLo = await Promise.all(ds.slice(i, i + 10).map(([id, doi]) => db.from("khach_hang").update(doi).eq("id", id)));
      const loi = kqLo.find((r) => r.error)?.error;
      daGhiDe += kqLo.filter((r) => !r.error).length;
      if (loi) return { ...kq, ok: false, loi: `Dừng khi ghi đè (đã ghi đè ${daGhiDe} khách, chưa nhập khách mới): ${thongBaoLoi(loi)}`, daGhiDe };
    }
    if (nhomId && canGhi.size) {
      const ids = [...canGhi.keys()];
      for (let i = 0; i < ids.length; i += 200) await db.from("khach_nhom").upsert(ids.slice(i, i + 200).map((id) => ({ khach_id: id, nhom_id: nhomId })), { onConflict: "khach_id,nhom_id", ignoreDuplicates: true });
    }
    if (daGhiDe) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "nhap_khach_ghi_de", doi_tuong: "khach_hang", doi_tuong_id: null, chi_tiet: { so_khach: daGhiDe, ten_tep: tep.name } });
  }
  let nhap = 0;
  for (let i = 0; i < moi.length; i += 200) {
    const lo = moi.slice(i, i + 200);
    const base = Number((await db.rpc("so_tiep_theo", { p_khoa: "khach" })).data ?? 0);
    // Cấp đủ dải mã cho lô: so_tiep_theo tăng 1/lần gọi nên gọi thêm lo.length-1 lần để giữ mã duy nhất.
    for (let j = 1; j < lo.length; j++) await db.rpc("so_tiep_theo", { p_khoa: "khach" });
    const rows = lo.map((k, j) => ({ ma: "KH" + String(base + j).padStart(6, "0"), ho_ten: k.ho_ten, dien_thoai: k.dien_thoai, zalo: k.zalo, email: k.email, ngay_sinh: k.ngay_sinh, gioi_tinh: k.gioi_tinh, dia_chi: k.dia_chi, ghi_chu: k.ghi_chu, chi_nhanh_id: cn, nguon, nguoi_phu_trach_id: phuTrach, tao_boi: nd.nhanVienId }));
    const { data: moiIds, error } = await db.from("khach_hang").insert(rows).select("id");
    if (error) return { ...kq, ok: false, loi: `Dừng ở lô thứ ${i / 200 + 1} (đã nhập ${nhap} khách): ${thongBaoLoi(error)}`, daNhap: nhap, daGhiDe };
    nhap += rows.length;
    if (nhomId && moiIds?.length) {
      const { error: loiNhom } = await db.from("khach_nhom").insert(moiIds.map((x) => ({ khach_id: x.id, nhom_id: nhomId })));
      if (loiNhom) return { ...kq, ok: false, loi: `Đã nhập ${nhap} khách nhưng gắn nhóm lỗi ở lô thứ ${i / 200 + 1}: ${thongBaoLoi(loiNhom)}. Vào Quản lý nhóm để gắn lại.`, daNhap: nhap };
    }
  }
  if (nhomId && nhap) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "nhap_khach_vao_nhom", doi_tuong: "nhom_khach", doi_tuong_id: nhomId, chi_tiet: { so_khach: nhap } });
  revalidatePath("/khach-hang");
  return { ...kq, daNhap: nhap, daGhiDe: ghiDe ? daGhiDe : undefined, nhom: nhomTen || undefined };
}
