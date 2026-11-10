"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";

/** CTV / giới thiệu (M4, migration 0314). Mọi quy tắc tiền (số dư, tối thiểu, một yêu cầu một lúc, người tạo không tự duyệt / tự chi, phiếu chi) nằm trong hàm Postgres;
 *  ở đây kiểm quyền + chi nhánh rồi gọi hàm. */
type KQ = { ok?: true; loi?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const lamMoi = (dt?: string) => { revalidatePath("/marketing/doi-tac"); if (dt) revalidatePath(`/marketing/doi-tac/${dt}`); };

/** Hoa hồng theo dịch vụ / sản phẩm / thẻ của một nguồn. Mỗi ô "<loai>:<muc_id>" = "kieu|gia_tri"; trống = dùng mức chung (xoá mức riêng). */
export async function luuHhTheoMuc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const dt = chuoi(fd, "doi_tac_id");
  if (!UUID.test(dt)) return { loi: "Thiếu nguồn giới thiệu." };
  const db = sb();
  const ghi: { doi_tac_id: string; loai: string; muc_id: string; kieu: string; gia_tri: number; nguoi_id: string }[] = [];
  const xoa: { loai: string; muc_id: string }[] = [];
  for (const [k, v] of fd.entries()) {
    const m = /^muc:(dich_vu|san_pham|goi_the):([0-9a-f-]{36})$/i.exec(k);
    if (!m || typeof v !== "string") continue;
    const [kieu, giaTriChu] = v.split("|");
    if (!giaTriChu?.trim()) { xoa.push({ loai: m[1], muc_id: m[2] }); continue; }
    const gt = Number(giaTriChu.replace(",", "."));
    if (!["phan_tram", "tien"].includes(kieu) || !Number.isFinite(gt) || gt < 0) return { loi: "Mức hoa hồng không hợp lệ." };
    if (kieu === "phan_tram" && gt > 100) return { loi: "Phần trăm hoa hồng từ 0 đến 100." };
    if (kieu === "tien" && gt > 1_000_000_000) return { loi: "Mức hoa hồng quá lớn." };
    ghi.push({ doi_tac_id: dt, loai: m[1], muc_id: m[2], kieu, gia_tri: kieu === "tien" ? Math.round(gt) : gt, nguoi_id: nd.nhanVienId });
  }
  if (ghi.length > 2000) return { loi: "Quá nhiều dòng một lần." };
  if (ghi.length) {
    const { error } = await db.from("doi_tac_hh_muc").upsert(ghi.map((x) => ({ ...x, cap_nhat_luc: new Date().toISOString() })), { onConflict: "doi_tac_id,loai,muc_id" });
    if (error) return { loi: thongBaoLoi(error) };
  }
  for (const x of xoa) await db.from("doi_tac_hh_muc").delete().eq("doi_tac_id", dt).eq("loai", x.loai).eq("muc_id", x.muc_id);
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_hh_gioi_thieu_theo_muc", doi_tuong: "doi_tac_gt", doi_tuong_id: dt, chi_tiet: { so_muc_rieng: ghi.length, bo: xoa.length } });
  lamMoi(dt);
  return { ok: true };
}

/** Tạo yêu cầu chi trả hoa hồng cho một nguồn (người làm Marketing / quản lý ghi thay CTV; cổng CTV tự gửi ở M5). */
export async function taoYeuCauRut(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const dt = chuoi(fd, "doi_tac_id"), ht = chuoi(fd, "hinh_thuc") === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";
  const tien = Math.round(so(fd, "so_tien"));
  if (!UUID.test(dt)) return { loi: "Thiếu nguồn giới thiệu." };
  if (!Number.isInteger(tien) || tien <= 0) return { loi: "Nhập số tiền lớn hơn 0." };
  if (ht === "chuyen_khoan" && (!chuoi(fd, "ngan_hang") || !chuoi(fd, "so_tk") || !chuoi(fd, "ten_chu_tk"))) return { loi: "Chuyển khoản cần ngân hàng, số tài khoản và tên chủ tài khoản." };
  const { error } = await sb().rpc("rut_hh_tao", {
    p_dt: dt, p_so_tien: tien, p_hinh_thuc: ht, p_ngan_hang: chuoiHoacNull(fd, "ngan_hang"), p_so_tk: chuoiHoacNull(fd, "so_tk"), p_ten_chu_tk: chuoiHoacNull(fd, "ten_chu_tk"),
    p_ghi_chu: chuoiHoacNull(fd, "ghi_chu"), p_nguoi: nd.nhanVienId,
  });
  if (error) return { loi: error.code === "23505" ? "Nguồn này đang có một yêu cầu chi trả chưa xử lý xong." : thongBaoLoi(error) };
  lamMoi(dt);
  return { ok: true };
}

/** Xử lý: Cần xử lý → Đang duyệt chi. Người tạo không tự duyệt; người duyệt phải đủ hạn mức (Cài đặt › Chính sách phê duyệt) — kiểm trong hàm DB. */
export async function duyetYeuCauRut(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  if (!UUID.test(id)) return { loi: "Không tìm thấy yêu cầu." };
  const { error } = await sb().rpc("rut_hh_duyet", { p_id: id, p_nguoi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error).replace("của bạn", "của người duyệt") };
  lamMoi();
  return { ok: true };
}

/** Đánh dấu đã chi: hàm DB ghi một phiếu chi vào Sổ quỹ (quỹ đúng hình thức nhận, ngày hôm nay). Người gắn chi nhánh chỉ chi từ quỹ của chi nhánh mình. */
export async function daChiYeuCauRut(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), quy = chuoi(fd, "quy_id");
  if (!UUID.test(id) || !UUID.test(quy)) return { loi: "Chọn quỹ chi." };
  const { data: q } = await sb().from("quy").select("chi_nhanh_id").eq("id", quy).eq("hoat_dong", true).maybeSingle();
  if (!q || (nd.chiNhanhId && q.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Chọn quỹ hợp lệ của chi nhánh mình." };
  const { error } = await sb().rpc("rut_hh_da_chi", { p_id: id, p_nguoi: nd.nhanVienId, p_quy: quy, p_bo_qua_kiem: nd.vaiTro === "ky_thuat" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  revalidatePath("/tai-chinh/so-quy");
  return { ok: true };
}

/** Từ chối có lý do: không ghi tiền, số tiền quay về số dư của nguồn. */
export async function tuChoiYeuCauRut(fd: FormData): Promise<KQ> {
  const nd = (await kiemQuyen("mkt.duyet")) ?? (await kiemQuyen("quy.ghi"));
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ly = chuoi(fd, "ly_do");
  if (!UUID.test(id)) return { loi: "Không tìm thấy yêu cầu." };
  if (!ly) return { loi: "Nhập lý do từ chối." };
  const { error } = await sb().rpc("rut_hh_tu_choi", { p_id: id, p_nguoi: nd.nhanVienId, p_ly_do: ly });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Cài đặt chi trả: mức tối thiểu được rút + mức hoa hồng mặc định cho CTV tự đăng ký (dùng khi mở cổng CTV). */
export async function luuCaiDatCtv(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const toiThieu = Math.round(so(fd, "toi_thieu_rut")), kieu = chuoi(fd, "tu_dang_ky_kieu") === "tien" ? "tien" : "phan_tram", gt = so(fd, "tu_dang_ky_gia_tri");
  if (!Number.isFinite(toiThieu) || toiThieu < 0 || toiThieu > 1_000_000_000) return { loi: "Mức tối thiểu không hợp lệ." };
  if (!Number.isFinite(gt) || gt < 0 || (kieu === "phan_tram" && gt > 100) || gt > 1_000_000_000) return { loi: "Mức hoa hồng không hợp lệ." };
  const { error } = await sb().from("cau_hinh").upsert([
    { khoa: "ctv.toi_thieu_rut", gia_tri: String(toiThieu) }, { khoa: "ctv.tu_dang_ky_kieu", gia_tri: kieu }, { khoa: "ctv.tu_dang_ky_gia_tri", gia_tri: String(kieu === "tien" ? Math.round(gt) : gt) },
  ], { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_cai_dat_ctv", doi_tuong: "cau_hinh", chi_tiet: { toi_thieu_rut: toiThieu, kieu, gia_tri: gt } });
  lamMoi();
  return { ok: true };
}

// ── Cổng CTV (M5, migration 0317) ─────────────────────────────────────────
const LOAI_THU_BAT_TAT = ["ma_dang_nhap", "chao_mung", "da_dat_hen", "da_su_dung", "da_huy", "da_thanh_toan_hh", "cap_nhat_hh"];

/** Bật/tắt trang đăng ký CTV + từng loại thư CTV (cau_hinh ctv.cong_mo, ctv.email.<loai>). Loại "giai đoạn sau" không cho bật. */
export async function luuThongBaoCtv(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const dong = [{ khoa: "ctv.cong_mo", gia_tri: fd.get("cong_mo") === "1" ? "1" : "0" }, ...LOAI_THU_BAT_TAT.map((l) => ({ khoa: `ctv.email.${l}`, gia_tri: fd.get(l) === "1" ? "1" : "0" }))];
  const { error } = await sb().from("cau_hinh").upsert(dong, { onConflict: "khoa" });
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_thong_bao_ctv", doi_tuong: "cau_hinh", chi_tiet: Object.fromEntries(dong.map((d) => [d.khoa, d.gia_tri])) });
  lamMoi();
  revalidatePath("/ctv/dang-ky");
  return { ok: true };
}

/** Xử lý khiếu nại đối soát của CTV: Đang xử lý / Đã xử lý / Từ chối (đóng thì bắt buộc phản hồi). */
export async function xuLyKhieuNaiCtv(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), tt = chuoi(fd, "trang_thai");
  if (!UUID.test(id)) return { loi: "Không tìm thấy khiếu nại." };
  const { error } = await sb().rpc("ctv_khieu_nai_xu_ly", { p_id: id, p_nguoi: nd.nhanVienId, p_trang_thai: tt, p_phan_hoi: chuoi(fd, "phan_hoi").slice(0, 1000) });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  revalidatePath("/ctv");
  return { ok: true };
}
