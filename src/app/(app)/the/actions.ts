"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi, tuyChon } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import type { NguoiDung } from "@/lib/auth";
import { timKhachMaSdt } from "@/lib/tim-khach-ma-sdt";
import { tinhHanThe } from "@/lib/danh-muc";

type KQ = { ok?: true; loi?: string; canhBao?: string };
const lamMoi = (id?: string) => { revalidatePath("/the"); if (id) revalidatePath(`/the/${id}`); };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Kiểm "hẹn buổi kế tiếp" (ngày + nội dung, không bắt buộc) TRƯỚC khi trừ buổi, để lỗi nhập không xảy ra sau khi buổi đã trừ. */
function docHenKeTiep(fd: FormData, ngayLam: string): { co: false } | { co: true; ngay: string; noiDung: string | null } | { loi: string } {
  const ngay = chuoi(fd, "ke_tiep_ngay"), noiDung = chuoiHoacNull(fd, "ke_tiep_noi_dung")?.slice(0, 300) ?? null;
  if (!ngay && !noiDung) return { co: false };
  if (!ngay) return { loi: "Hẹn buổi kế tiếp: chọn ngày hẹn (hoặc xoá nội dung nếu không hẹn)." };
  if (!NGAY.test(ngay)) return { loi: "Ngày hẹn buổi kế tiếp không hợp lệ." };
  if (ngay <= ngayLam) return { loi: "Ngày hẹn buổi kế tiếp phải sau ngày làm buổi này." };
  return { co: true, ngay, noiDung };
}

/** Ghi hẹn buổi kế tiếp của một thẻ + tạo nhắc ở khach_nhac (nhắc đúng ngày hẹn). KHÔNG đụng tới số buổi/tiền. Không tạo lich_hen (chưa có giờ/nhân viên). */
async function ghiHenKeTiep(nd: NguoiDung, theId: string, buoiId: string | null, ngay: string, noiDung: string | null): Promise<{ loi?: string }> {
  const db = sb();
  const { data: t } = await db.from("the_khach").select("id, ma, khach_id, chi_nhanh_id, goi_id").eq("id", theId).maybeSingle();
  if (!t) return { loi: "Không tìm thấy thẻ." };
  const { data: g } = await db.from("goi_the").select("ten").eq("id", t.goi_id).maybeSingle();
  const ten = g?.ten ?? t.ma;
  const { data: nhac, error: e1 } = await db.from("khach_nhac").insert({
    khach_id: t.khach_id, noi_dung: `Hẹn buổi kế tiếp thẻ ${ten} (${t.ma}) ngày ${ngayVN(ngay)}${noiDung ? `: ${noiDung}` : "."}`.slice(0, 400), trang_thai: "dang_nhac",
    ngay_nhac: `${ngay}T08:00:00+07:00`, nguoi_tao_ten: nd.hoTen, chi_nhanh_id: t.chi_nhanh_id, dich_vu_ten: ten, la_lich_su: false,
  }).select("id").single();
  if (e1 || !nhac) return { loi: thongBaoLoi(e1) };
  const { error } = await db.from("the_buoi_ke_tiep").insert({ the_id: t.id, khach_id: t.khach_id, buoi_id: buoiId, ngay_hen: ngay, noi_dung: noiDung, chi_nhanh_id: t.chi_nhanh_id, nhac_id: nhac.id, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "hen_buoi_ke_tiep", doi_tuong: "khach_hang", doi_tuong_id: t.khach_id, chi_tiet: { the_id: t.id, ngay_hen: ngay, nhac_id: nhac.id } });
  revalidatePath("/khach-hang/tai-kham");
  return {};
}

export async function thucHienBuoi(fd: FormData): Promise<KQ> {
  // Thu ngân (ban.tao) trừ buổi ngay ở màn Bán hàng như SalonHero (dùng thẻ khi lên đơn).
  const nd = (await kiemQuyen("the.thuchien")) ?? (await kiemQuyen("ban.tao"));
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id");
  const thamSo: Record<string, number | string> = {};
  for (const k of ["shot", "line"]) if (chuoi(fd, k)) thamSo[k] = so(fd, k);
  if (chuoi(fd, "vung")) thamSo.vung = chuoi(fd, "vung");
  const ngayLam = chuoi(fd, "ngay") || homNayHCM();
  const hen = docHenKeTiep(fd, ngayLam);
  if ("loi" in hen) return { loi: hen.loi };
  const { data: buoiId, error } = await sb().rpc("thuc_hien_buoi", {
    p_the: theId, p_dich_vu: chuoi(fd, "dich_vu_id"), p_nv: chuoi(fd, "nv_id"), p_bac_si: tuyChon(chuoi(fd, "bac_si_id")), p_lich: tuyChon(chuoi(fd, "lich_id")),
    p_ngay: ngayLam, p_tham_so: thamSo, p_ghi_chu: tuyChon(chuoi(fd, "ghi_chu")), p_nguoi: nd.nhanVienId,
  });
  lamMoi(theId); revalidatePath("/lich-hen");
  if (error) return { loi: thongBaoLoi(error) };
  // Buổi đã trừ xong. Hẹn kế tiếp lỗi thì CHỈ cảnh báo (đừng báo lỗi: người dùng bấm lại sẽ trừ buổi lần nữa).
  if (hen.co) {
    const r = await ghiHenKeTiep(nd, theId, typeof buoiId === "string" ? buoiId : null, hen.ngay, hen.noiDung);
    if (r.loi) return { ok: true, canhBao: `Đã trừ buổi, nhưng CHƯA lưu được hẹn buổi kế tiếp (${r.loi}). Đừng làm lại buổi; vào hồ sơ thẻ bấm "Hẹn buổi kế tiếp" để ghi.` } as KQ;
  }
  return { ok: true };
}

/** Hẹn buổi kế tiếp ở hồ sơ thẻ (không trừ buổi). Dùng khi quên ghi lúc trừ buổi. */
export async function henBuoiKeTiep(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.thuchien");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id");
  const hen = docHenKeTiep(fd, homNayHCM());
  if ("loi" in hen) return { loi: hen.loi };
  if (!hen.co) return { loi: "Chọn ngày hẹn buổi kế tiếp." };
  const r = await ghiHenKeTiep(nd, theId, null, hen.ngay, hen.noiDung);
  lamMoi(theId);
  return r.loi ? { loi: r.loi } : { ok: true };
}

export async function huyBuoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("huy_buoi", { p_buoi: chuoi(fd, "buoi_id"), p_ly_do: chuoi(fd, "ly_do"), p_nguoi: nd.nhanVienId });
  lamMoi(chuoi(fd, "the_id"));
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

export async function dieuChinhThe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id");
  const buoi = Math.trunc(so(fd, "so_buoi"));
  const tien = so(fd, "so_tien");
  const lyDo = chuoi(fd, "ly_do");
  if (!lyDo) return { loi: "Điều chỉnh thẻ phải ghi lý do." };
  if (!buoi && !tien) return { loi: "Nhập số buổi hoặc số tiền cần cộng/trừ." };
  const { data: v } = await sb().from("v_the_khach").select("so_buoi_con, so_du_tien, loai").eq("id", theId).maybeSingle();
  if (!v) return { loi: "Không tìm thấy thẻ." };
  if ((v.so_buoi_con ?? 0) + buoi < 0 || Number(v.so_du_tien ?? 0) + tien < 0) return { loi: "Điều chỉnh làm số dư âm." };
  const { error } = await sb().from("the_so_cai").insert({ the_id: theId, loai: "dieu_chinh", so_buoi: v.loai === "lan" ? buoi : 0, so_tien: v.loai === "tien" ? tien : 0, ghi_chu: lyDo, nguoi_id: nd.nhanVienId });
  lamMoi(theId);
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Khoá / mở khoá thẻ: BẮT BUỘC có lý do; ghi một dòng sổ cái (0 buổi, 0 tiền) để biết ai làm, lúc nào, vì sao (migration 0188). */
export async function doiTrangThaiThe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tt = chuoi(fd, "trang_thai");
  if (!["hoat_dong", "khoa"].includes(tt)) return { loi: "Trạng thái không hợp lệ." };
  const lyDo = chuoi(fd, "ly_do");
  if (lyDo.length < 3) return { loi: tt === "khoa" ? "Nhập lý do khoá thẻ (ít nhất 3 ký tự)." : "Nhập lý do mở khoá thẻ (ít nhất 3 ký tự)." };
  if (lyDo.length > 500) return { loi: "Lý do dài quá (tối đa 500 ký tự)." };
  const theId = chuoi(fd, "the_id");
  const db = sb();
  const { data: the } = await db.from("the_khach").select("trang_thai").eq("id", theId).maybeSingle();
  if (!the) return { loi: "Không tìm thấy thẻ." };
  if (the.trang_thai === "thu_hoi") return { loi: "Thẻ đã thu hồi, không khoá hay mở khoá được." };
  if (the.trang_thai === tt) return { loi: tt === "khoa" ? "Thẻ đang khoá rồi." : "Thẻ đang dùng được, không cần mở khoá." };
  const { error } = await db.from("the_khach").update({ trang_thai: tt }).eq("id", theId).neq("trang_thai", "thu_hoi");
  if (error) return { loi: thongBaoLoi(error) };
  const { error: eSc } = await db.from("the_so_cai").insert({ the_id: theId, loai: tt === "khoa" ? "khoa" : "mo_khoa", so_buoi: 0, so_tien: 0, ghi_chu: lyDo, nguoi_id: nd.nhanVienId });
  lamMoi(theId);
  return eSc ? { loi: thongBaoLoi(eSc) } : { ok: true };
}

/** Sửa thẻ (SalonHero "Sửa thẻ", quyền memberCards.update → the.dieuchinh): hạn dùng, chủ thẻ, giá 1 buổi làm dịch vụ, ghi chú.
 *  Hàm Postgres sua_the khoá dòng thẻ, chỉ đổi mục có khác, ghi 1 dòng sổ cái "Sửa thẻ" (0 buổi, 0 tiền) kèm cũ → mới. Không đụng số buổi / số dư. */
export async function suaThe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id");
  const db = sb();
  const { data: t } = await db.from("the_khach").select("id, khach_id, chi_nhanh_id, loai, han_dung, gia_tri_buoi, ghi_chu, trang_thai").eq("id", theId).maybeSingle();
  if (!t || (nd.chiNhanhId && t.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy thẻ." };
  if (t.trang_thai === "thu_hoi") return { loi: "Thẻ đã thu hồi, không sửa được." };
  const han = chuoi(fd, "han_dung");
  if (han && !NGAY.test(han)) return { loi: "Hạn thẻ không hợp lệ." };
  let khachMoi: string | null = null;
  const nhapKhach = chuoi(fd, "khach");
  if (nhapKhach) {
    const r = await timKhachMaSdt(nhapKhach);
    if (!r.k) return { loi: r.loi };
    if (r.k.chi_nhanh_id !== t.chi_nhanh_id) return { loi: "Chủ thẻ mới phải là khách cùng chi nhánh với thẻ." };
    khachMoi = r.k.id;
  }
  const doiGia = t.loai === "lan" && chuoi(fd, "gia_tri_buoi") !== "";
  const gia = doiGia ? so(fd, "gia_tri_buoi") : null;
  if (doiGia && (gia === null || !Number.isInteger(gia) || gia < 0)) return { loi: "Giá 1 buổi phải là số tiền không âm." };
  const ghiChu = chuoi(fd, "ghi_chu").slice(0, 500), lyDo = chuoi(fd, "ly_do").slice(0, 300);
  const { error } = await db.rpc("sua_the", {
    p_the: theId, p_nguoi: nd.nhanVienId,
    p_doi_han: han !== (t.han_dung ?? ""), p_han: han || undefined,
    p_doi_chu: !!khachMoi && khachMoi !== t.khach_id, p_khach: khachMoi ?? undefined,
    p_doi_gia: doiGia && gia !== Number(t.gia_tri_buoi ?? 0), p_gia: gia ?? undefined,
    p_doi_ghi_chu: ghiChu !== (t.ghi_chu ?? ""), p_ghi_chu: ghiChu,
    p_ly_do: lyDo || undefined,
  });
  lamMoi(theId); revalidatePath("/khach-hang/dung-the");
  if (khachMoi && khachMoi !== t.khach_id) { revalidatePath(`/khach-hang/${t.khach_id}`); revalidatePath(`/khach-hang/${khachMoi}`); }
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Thu hồi thẻ (SalonHero: khoá vĩnh viễn + lý do, KHÔNG hoàn tiền, không đụng quỹ / hoá đơn; thẻ thu hồi không cấp lại được, chỉ cấp thẻ mới).
 *  Nếu có trả tiền cho khách thì ghi phiếu CHI ở Sổ quỹ riêng (như SalonHero phải làm tay). */
export async function thuHoiThe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id"), lyDo = chuoi(fd, "ly_do");
  if (lyDo.length < 3) return { loi: "Nhập lý do thu hồi thẻ (ít nhất 3 ký tự)." };
  if (lyDo.length > 500) return { loi: "Lý do dài quá (tối đa 500 ký tự)." };
  const { data: t } = await sb().from("the_khach").select("chi_nhanh_id").eq("id", theId).maybeSingle();
  if (!t || (nd.chiNhanhId && t.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Không tìm thấy thẻ." };
  const { error } = await sb().rpc("thu_hoi_the", { p_the: theId, p_ly_do: lyDo, p_nguoi: nd.nhanVienId });
  lamMoi(theId); revalidatePath("/khach-hang/dung-the");
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Hạn thẻ khi cấp, như SalonHero: ngày cấp (hoặc ngày tạo, tuỳ loại thẻ) + số tháng + số ngày của loại thẻ. Null = không hạn. */
function hanTheKhiCap(g: { han_dung_thang: number | null; han_dung_ngay: number | null; han_tinh_tu: string }, ngayCap: string): string | null {
  return tinhHanThe(g.han_dung_thang, g.han_dung_ngay, g.han_tinh_tu === "ngay_tao" ? homNayHCM() : ngayCap);
}

/** Dòng "Thời hạn thẻ" tính sẵn trong hộp Cấp thẻ (SalonHero hiện hạn ngay khi chọn loại thẻ + ngày cấp). Chỉ đọc. */
export async function duKienHanThe(fd: FormData): Promise<{ dong?: { chu: string; kieu?: "tot" | "cho" | "loi" }[] }> {
  if (!(await kiemQuyen("the.dieuchinh"))) return {};
  const goiId = chuoi(fd, "goi_id");
  if (!goiId) return {};
  const { data: g } = await sb().from("goi_the").select("han_dung_thang, han_dung_ngay, han_tinh_tu").eq("id", goiId).maybeSingle();
  if (!g) return {};
  const ngayCap = NGAY.test(chuoi(fd, "ngay_cap")) ? chuoi(fd, "ngay_cap") : homNayHCM();
  const han = hanTheKhiCap(g, ngayCap);
  const tay = chuoi(fd, "han_dung");
  return { dong: [{ chu: tay && NGAY.test(tay) ? `Thời hạn thẻ: ${ngayVN(tay)} (nhập tay; theo loại thẻ là ${han ? ngayVN(han) : "không hạn"})` : `Thời hạn thẻ: ${han ? ngayVN(han) : "không giới hạn"}` }] };
}

/** Cấp thẻ tay (SalonHero "Cấp thẻ mới", quyền memberCards.create = the.dieuchinh): tặng, chuyển thẻ từ phần mềm cũ. Không thu tiền, không tạo hoá đơn nên KHÔNG tính doanh thu.
 *  Như SalonHero: số lần / số tiền trong thẻ + đã dùng ban đầu, NGÀY CẤP (hạn tự tính theo tháng + ngày của loại thẻ, sửa tay được), SỐ LƯỢNG CẤP, TẠI CHI NHÁNH, ghi chú.
 *  Bán thẻ có thu tiền vẫn qua Thu ngân. */
export async function capTheTay(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("the.dieuchinh");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const r = await timKhachMaSdt(chuoi(fd, "khach"));
  if (!r.k || (nd.chiNhanhId && r.k.chi_nhanh_id !== nd.chiNhanhId)) return { loi: r.loi ?? "Không tìm thấy khách theo mã hoặc số điện thoại đó." };
  const k = r.k;
  // Tại chi nhánh: mặc định chi nhánh của khách; người bị giới hạn chi nhánh chỉ cấp tại chi nhánh của mình.
  const cnId = chuoi(fd, "chi_nhanh_id") || k.chi_nhanh_id || nd.chiNhanhId || "";
  if (!cnId) return { loi: "Chọn chi nhánh cấp thẻ (khách này chưa gắn chi nhánh)." };
  if (nd.chiNhanhId && cnId !== nd.chiNhanhId) return { loi: "Chỉ được cấp thẻ tại chi nhánh của mình." };
  const { data: cn } = await db.from("chi_nhanh").select("id").eq("id", cnId).eq("hoat_dong", true).maybeSingle();
  if (!cn) return { loi: "Chi nhánh cấp thẻ không còn hoạt động." };
  const { data: g } = await db.from("goi_the").select("*").eq("id", chuoi(fd, "goi_id")).maybeSingle();
  if (!g) return { loi: "Chọn gói thẻ." };
  const soBuoi = g.loai === "lan" ? Math.trunc(so(fd, "so_buoi")) || g.so_buoi || 0 : null;
  const soTien = g.loai === "tien" ? so(fd, "so_tien") || g.gia_tri_the || 0 : null;
  if (g.loai === "lan" && !soBuoi) return { loi: "Nhập số lần." };
  if (g.loai === "tien" && !soTien) return { loi: "Nhập số tiền trong thẻ." };
  if ((soBuoi ?? 0) < 0 || (soTien ?? 0) < 0) return { loi: "Số lần / số tiền không được âm." };
  const daDung = g.loai === "lan" ? Math.trunc(so(fd, "da_dung_buoi")) : so(fd, "da_dung_tien");
  if (daDung < 0) return { loi: "Số đã dùng ban đầu không được âm." };
  if (g.loai === "lan" && daDung > (soBuoi ?? 0)) return { loi: "Số lần đã dùng ban đầu lớn hơn số lần của thẻ." };
  if (g.loai === "tien" && daDung > (soTien ?? 0)) return { loi: "Số tiền đã dùng ban đầu lớn hơn số tiền trong thẻ." };
  const homNay = homNayHCM();
  const ngayCap = chuoi(fd, "ngay_cap") || homNay;
  if (!NGAY.test(ngayCap)) return { loi: "Ngày cấp không hợp lệ." };
  if (ngayCap > homNay) return { loi: "Ngày cấp không được sau hôm nay." };
  const hanTay = chuoi(fd, "han_dung");
  if (hanTay && !NGAY.test(hanTay)) return { loi: "Hạn dùng không hợp lệ." };
  const han = hanTay || hanTheKhiCap(g, ngayCap);
  if (han && han < ngayCap) return { loi: "Hạn dùng phải từ ngày cấp trở đi." };
  const soLuong = chuoi(fd, "so_luong") ? Math.trunc(so(fd, "so_luong")) : 1;
  if (soLuong < 1 || soLuong > 20) return { loi: "Số lượng cấp từ 1 đến 20 thẻ mỗi lần." };
  const lyDo = chuoi(fd, "ly_do").slice(0, 300);
  const ma: string[] = [];
  for (let i = 0; i < soLuong; i++) ma.push("TH" + String(Number((await db.rpc("so_tiep_theo", { p_khoa: "the" })).data ?? 0)).padStart(6, "0"));
  const { data: ds, error } = await db.from("the_khach").insert(ma.map((m) => ({
    ma: m, khach_id: k.id, goi_id: g.id, chi_nhanh_id: cnId, loai: g.loai, so_buoi_tong: soBuoi, tong_tien: soTien, gia_tri_buoi: 0, cap_tay: true,
    ngay_cap: ngayCap, han_dung: han || null, ghi_chu: lyDo || null,
  }))).select("id, ma");
  if (error || !ds?.length) return { loi: thongBaoLoi(error) };
  const dong = ds.flatMap((t) => {
    const d = [{ the_id: t.id, loai: g.loai === "lan" ? "cap" : "nap", so_buoi: soBuoi ?? 0, so_tien: soTien ?? 0, nguoi_id: nd.nhanVienId, ghi_chu: `Cấp tay: ${lyDo || "không ghi lý do"}` }];
    if (daDung > 0) d.push({ the_id: t.id, loai: "dieu_chinh", so_buoi: g.loai === "lan" ? -daDung : 0, so_tien: g.loai === "tien" ? -daDung : 0, nguoi_id: nd.nhanVienId, ghi_chu: `Đã dùng ban đầu khi cấp tay (${g.loai === "lan" ? `${daDung} lần` : `${daDung.toLocaleString("vi-VN")} đ`})` });
    return d;
  });
  const { error: eSc } = await db.from("the_so_cai").insert(dong);
  if (eSc) return { loi: `Đã tạo thẻ ${ds.map((t) => t.ma).join(", ")} nhưng chưa ghi được sổ thẻ (${thongBaoLoi(eSc)}). Báo Kỹ thuật, đừng cấp lại.` };
  await db.from("nhat_ky_truy_cap").insert(ds.map((t) => ({ nguoi_id: nd.nhanVienId, hanh_dong: "cap_the_tay", doi_tuong: "the_khach", doi_tuong_id: t.id, chi_tiet: { khach_id: k.id, goi_id: g.id, so_buoi: soBuoi, so_tien: soTien, da_dung: daDung, ngay_cap: ngayCap, han_dung: han, chi_nhanh_id: cnId, so_luong: soLuong } })));
  lamMoi(); revalidatePath("/khach-hang/dung-the");
  return { ok: true };
}
