"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull } from "@/lib/form";
import { ngayVN } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const TRANG_THAI = ["da_goi", "da_hen", "bo_qua"];
const LOAI = ["buoi_ke", "tai_kham"];

/** Người gắn một chi nhánh chỉ xử lý khách thuộc chi nhánh đó. */
async function trongChiNhanh(nd: { chiNhanhId: string | null }, khachId: string) {
  if (!nd.chiNhanhId) return true;
  const { data } = await sb().from("khach_hang").select("chi_nhanh_id").eq("id", khachId).maybeSingle();
  return !data?.chi_nhanh_id || data.chi_nhanh_id === nd.chiNhanhId;
}

function khoa(fd: FormData) {
  const khachId = chuoi(fd, "khach_id"), dichVuId = chuoi(fd, "dich_vu_id"), loai = chuoi(fd, "loai"), lanCuoi = chuoi(fd, "lan_cuoi");
  if (!UUID.test(khachId) || !UUID.test(dichVuId) || !LOAI.includes(loai) || !NGAY.test(lanCuoi)) return null;
  return { khach_id: khachId, dich_vu_id: dichVuId, loai, lan_cuoi: lanCuoi };
}

/** Đã gọi / đã hẹn / bỏ qua cho một gợi ý (gắn với lần làm gần nhất: khách làm buổi mới thì gợi ý mới tự mở lại). */
export async function datTrangThaiGoiY(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const k = khoa(fd), tt = chuoi(fd, "trang_thai");
  if (!k) return { loi: "Dữ liệu gợi ý không hợp lệ." };
  if (!TRANG_THAI.includes(tt)) return { loi: "Chọn trạng thái: đã gọi, đã hẹn hoặc bỏ qua." };
  if (!(await trongChiNhanh(nd, k.khach_id))) return { loi: KHONG_DU_QUYEN };
  const ghiChu = chuoiHoacNull(fd, "ghi_chu")?.slice(0, 300) ?? null;
  const { error } = await sb().from("lich_goi_y_xu_ly").upsert({ ...k, trang_thai: tt, ghi_chu: ghiChu, nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "khach_id,dich_vu_id,loai,lan_cuoi" });
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "goi_y_lich_trang_thai", doi_tuong: "khach_hang", doi_tuong_id: k.khach_id, chi_tiet: { ...k, trang_thai: tt } });
  revalidatePath("/lich-hen/goi-y");
  return { ok: true };
}

/** Ghi nhắc vào mục nhắc chăm sóc của khách (không gửi SMS/Zalo cho khách). */
export async function ghiNhacGoiY(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const k = khoa(fd), denHan = chuoi(fd, "den_han");
  if (!k || !NGAY.test(denHan)) return { loi: "Dữ liệu gợi ý không hợp lệ." };
  if (!(await trongChiNhanh(nd, k.khach_id))) return { loi: KHONG_DU_QUYEN };
  const tenDv = chuoi(fd, "ten_dich_vu").slice(0, 120), cn = chuoi(fd, "chi_nhanh_id");
  const noiDung = `${k.loai === "tai_kham" ? "Nhắc tái khám / chăm sóc sau" : "Nhắc buổi kế tiếp"} ${tenDv}: nên hẹn ngày ${ngayVN(denHan)} (lần làm gần nhất ${ngayVN(k.lan_cuoi)}).`.slice(0, 400);
  const db = sb();
  let nhacId: string;
  const { data: co } = await db.from("khach_nhac").select("id").eq("khach_id", k.khach_id).eq("trang_thai", "dang_nhac").eq("noi_dung", noiDung).limit(1).maybeSingle();
  if (co) nhacId = co.id;
  else {
    const { data, error } = await db.from("khach_nhac").insert({ khach_id: k.khach_id, noi_dung: noiDung, trang_thai: "dang_nhac", ngay_nhac: new Date(`${denHan}T08:00:00+07:00`).toISOString(), nguoi_tao_ten: nd.hoTen, chi_nhanh_id: UUID.test(cn) ? cn : null, dich_vu_ten: tenDv || null, la_lich_su: false }).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    nhacId = data.id;
  }
  const { error } = await db.from("lich_goi_y_xu_ly").upsert({ ...k, nhac_id: nhacId, nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "khach_id,dich_vu_id,loai,lan_cuoi" });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "goi_y_lich_ghi_nhac", doi_tuong: "khach_hang", doi_tuong_id: k.khach_id, chi_tiet: { nhac_id: nhacId, ...k } });
  revalidatePath("/lich-hen/goi-y");
  return { ok: true };
}

/** Lưu khoảng cách của nhiều dịch vụ một lần (trang cài đặt): ô kc_<id> = buổi kế tiếp, tk_<id> = tái khám; để trống = không gợi ý. Chỉ ghi dòng có đổi. */
export async function luuKhoangCachDichVu(fd: FormData): Promise<void> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) redirect("/lich-hen/goi-y/cai-dat?loi=quyen");
  const ids = fd.getAll("id").map(String).filter((s) => UUID.test(s)).slice(0, 600);
  const docSo = (k: string, max: number): number | null | undefined => {
    const v = chuoi(fd, k);
    if (v === "") return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
  };
  const db = sb();
  const { data: cu } = await db.from("dich_vu").select("id, khoang_cach_ngay, tai_kham_sau_ngay").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const map = new Map((cu ?? []).map((r) => [r.id, r]));
  const doi: { id: string; kc: number | null; tk: number | null }[] = [];
  for (const id of ids) {
    const kc = docSo(`kc_${id}`, 730), tk = docSo(`tk_${id}`, 365);
    if (kc === undefined || tk === undefined) redirect("/lich-hen/goi-y/cai-dat?loi=so");
    const c = map.get(id);
    if (c && (c.khoang_cach_ngay !== kc || c.tai_kham_sau_ngay !== tk)) doi.push({ id, kc, tk });
  }
  for (const d of doi) {
    const { error } = await db.from("dich_vu").update({ khoang_cach_ngay: d.kc, tai_kham_sau_ngay: d.tk }).eq("id", d.id);
    if (error) { console.error("[luuKhoangCachDichVu]", error.message); redirect("/lich-hen/goi-y/cai-dat?loi=ghi"); }
  }
  if (doi.length) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "dat_khoang_cach_dich_vu", doi_tuong: "dich_vu", chi_tiet: { so_dich_vu: doi.length, doi: doi.slice(0, 100) } });
  revalidatePath("/lich-hen/goi-y");
  revalidatePath("/lich-hen/goi-y/cai-dat");
  redirect(`/lich-hen/goi-y/cai-dat?da_luu=${doi.length}`);
}
