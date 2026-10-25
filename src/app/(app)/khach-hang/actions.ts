"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang } from "@/lib/form";
import { chuanSdt, coSdtHopLe, homNayHCM } from "@/lib/dinh-dang";
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
  if (!coSdtHopLe(sdt)) return { loi: "Số điện thoại chưa hợp lệ (bắt đầu bằng 0, 10–11 số)." };
  if (!NGUON_HOP_LE.includes(nguon)) return { loi: "Chọn nguồn khách (bắt buộc)." };
  if (!chuoi(fd, "nguoi_phu_trach_id")) return { loi: "Chọn người phụ trách (bắt buộc)." };
  if (!chuoi(fd, "chi_nhanh_id")) return { loi: "Chọn chi nhánh." };

  const { data: trung } = await db.from("khach_hang").select("id, ma, ho_ten").eq("dien_thoai", sdt).maybeSingle();
  if (trung && trung.id !== id) return { loi: `Số này đã có khách: ${trung.ho_ten} (${trung.ma}).` };

  let nguoiGt: string | null = null;
  const gt = chuoi(fd, "nguoi_gioi_thieu");
  if (nguon === "khach_cu_gioi_thieu") {
    if (!gt) return { loi: "Khách cũ giới thiệu: nhập mã hoặc số điện thoại của người giới thiệu." };
    const { data } = await db.from("khach_hang").select("id").or(`ma.eq.${gt.toUpperCase()},dien_thoai.eq.${chuanSdt(gt)}`).maybeSingle();
    if (!data) return { loi: "Không tìm thấy người giới thiệu theo mã/số điện thoại đó." };
    nguoiGt = data.id;
  }
  const dongY = bat(fd, "dong_y_dung_hinh");
  const row = {
    ho_ten: chuoi(fd, "ho_ten"), dien_thoai: sdt, zalo: chuoiHoacNull(fd, "zalo"), email: chuoiHoacNull(fd, "email"),
    gioi_tinh: ["nữ", "nam", "khác"].includes(chuoi(fd, "gioi_tinh")) ? chuoi(fd, "gioi_tinh") : null,
    ngay_sinh: chuoiHoacNull(fd, "ngay_sinh"), dia_chi: chuoiHoacNull(fd, "dia_chi"), chi_nhanh_id: chuoi(fd, "chi_nhanh_id"),
    nguon, nguon_chi_tiet: chuoiHoacNull(fd, "nguon_chi_tiet"), nguoi_gioi_thieu_id: nguoiGt, nguoi_phu_trach_id: chuoi(fd, "nguoi_phu_trach_id"),
    ghi_chu: chuoiHoacNull(fd, "ghi_chu"), dong_y_dung_hinh: dongY, cap_nhat_luc: new Date().toISOString(),
  };
  let khachId = id;
  if (id) {
    const { data: cu } = await db.from("khach_hang").select("dong_y_dung_hinh").eq("id", id).maybeSingle();
    const { error } = await db.from("khach_hang").update({ ...row, ...(dongY && !cu?.dong_y_dung_hinh ? { dong_y_dung_hinh_luc: new Date().toISOString() } : {}) }).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const ma = "KH" + String(await soTiep("khach")).padStart(6, "0");
    const { data, error } = await db.from("khach_hang").insert({ ...row, ma, tao_boi: nd.nhanVienId, dong_y_dung_hinh_luc: dongY ? new Date().toISOString() : null }).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    khachId = data.id;
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

export async function luuGhiChu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hoso.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const row = { khach_id: chuoi(fd, "khach_id"), tinh_trang: chuoiHoacNull(fd, "tinh_trang"), yeu_cau: chuoiHoacNull(fd, "yeu_cau"), phuong_an: chuoiHoacNull(fd, "phuong_an"), ket_qua: chuoiHoacNull(fd, "ket_qua"), bac_si_id: chuoiHoacNull(fd, "bac_si_id") ?? (nd.vaiTro === "bac_si" ? nd.nhanVienId : null), tao_boi: nd.nhanVienId };
  if (!row.tinh_trang && !row.yeu_cau && !row.phuong_an && !row.ket_qua) return { loi: "Nhập ít nhất một mục: tình trạng, yêu cầu, phương án hoặc kết quả." };
  const { error } = await sb().from("khach_ghi_chu").insert(row);
  revalidatePath(`/khach-hang/${row.khach_id}`);
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
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
  const { error: e1 } = await db.storage.from("khach-anh").upload(duong, Buffer.from(await tep.arrayBuffer()), { contentType: tep.type, upsert: false });
  if (e1) return { loi: "Không tải được ảnh lên kho riêng. Thử lại." };
  const loai = ["truoc", "sau", "khac"].includes(chuoi(fd, "loai")) ? chuoi(fd, "loai") : "khac";
  const { error } = await db.from("khach_anh").insert({ khach_id: khachId, duong_dan: duong, loai, ngay_chup: ngay, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), tao_boi: nd.nhanVienId });
  if (error) { await db.storage.from("khach-anh").remove([duong]); return { loi: thongBaoLoi(error) }; }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "them_anh", doi_tuong: "khach_hang", doi_tuong_id: khachId });
  revalidatePath(`/khach-hang/${khachId}`);
  return { ok: true };
}

export type KetQuaNhap = { ok?: boolean; loi?: string; hopLe?: number; tongDong?: number; daCo?: number; daNhap?: number; dongLoi?: { dong: number; viec: string }[] };

/** Nhập khách từ Excel. che_do=xem chỉ kiểm tra (không ghi). Khách có SĐT đã tồn tại thì bỏ qua (không ghi đè). Nguồn/người phụ trách/chi nhánh áp chung cho cả file. */
export async function nhapKhachExcel(fd: FormData): Promise<KetQuaNhap> {
  const nd = await kiemQuyen("khach.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tep = fd.get("tep");
  if (!(tep instanceof File) || tep.size === 0) return { loi: "Chưa chọn file Excel (.xlsx)." };
  if (tep.size > 8 * 1024 * 1024) return { loi: "File quá 8 MB. Tách nhỏ rồi nhập từng phần." };
  const nguon = chuoi(fd, "nguon"), phuTrach = chuoi(fd, "nguoi_phu_trach_id"), cn = chuoi(fd, "chi_nhanh_id");
  if (!NGUON_HOP_LE.includes(nguon) || !phuTrach || !cn) return { loi: "Chọn nguồn, người phụ trách và chi nhánh áp cho cả file." };
  let doc;
  try { doc = await docKhachTuExcel(await tep.arrayBuffer()); } catch { return { loi: "Không đọc được file. Dùng file .xlsx (không phải .xls hoặc .csv)." }; }
  if (doc.cotThieu.length) return { loi: `File thiếu cột bắt buộc: ${doc.cotThieu.join(", ")}.` };
  const db = sb();
  const sdts = doc.khach.map((k) => k.dien_thoai);
  const daCo = new Set<string>();
  for (let i = 0; i < sdts.length; i += 300) { const { data } = await db.from("khach_hang").select("dien_thoai").in("dien_thoai", sdts.slice(i, i + 300)); (data ?? []).forEach((x) => daCo.add(x.dien_thoai)); }
  const moi = doc.khach.filter((k) => !daCo.has(k.dien_thoai));
  const kq: KetQuaNhap = { ok: true, tongDong: doc.tongDong, hopLe: doc.khach.length, daCo: daCo.size, dongLoi: doc.loi.slice(0, 30) };
  if (chuoi(fd, "che_do") !== "nhap") return kq;
  let nhap = 0;
  for (let i = 0; i < moi.length; i += 200) {
    const lo = moi.slice(i, i + 200);
    const base = Number((await db.rpc("so_tiep_theo", { p_khoa: "khach" })).data ?? 0);
    // Cấp đủ dải mã cho lô: so_tiep_theo tăng 1/lần gọi nên gọi thêm lo.length-1 lần để giữ mã duy nhất.
    for (let j = 1; j < lo.length; j++) await db.rpc("so_tiep_theo", { p_khoa: "khach" });
    const rows = lo.map((k, j) => ({ ma: "KH" + String(base + j).padStart(6, "0"), ho_ten: k.ho_ten, dien_thoai: k.dien_thoai, zalo: k.zalo, email: k.email, ngay_sinh: k.ngay_sinh, gioi_tinh: k.gioi_tinh, dia_chi: k.dia_chi, ghi_chu: k.ghi_chu, chi_nhanh_id: cn, nguon, nguoi_phu_trach_id: phuTrach, tao_boi: nd.nhanVienId }));
    const { error } = await db.from("khach_hang").insert(rows);
    if (error) return { ...kq, ok: false, loi: `Dừng ở lô thứ ${i / 200 + 1} (đã nhập ${nhap} khách): ${thongBaoLoi(error)}`, daNhap: nhap };
    nhap += rows.length;
  }
  revalidatePath("/khach-hang");
  return { ...kq, daNhap: nhap };
}
