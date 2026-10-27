"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, soHoacNull } from "@/lib/form";
import { chuanSdt, coSdtHopLe, homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/van-ban", "layout"); };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const ngayHopLe = (v: string | null) => v === null || NGAY.test(v);

async function ghiVet(vanBanId: string, hanhDong: string, nguoi: string, ghiChu?: string | null) {
  await sb().from("van_ban_nhat_ky").insert({ van_ban_id: vanBanId, hanh_dong: hanhDong, nguoi_id: nguoi, ghi_chu: ghiChu ?? null });
}
const layVb = async (id: string) => (await sb().from("van_ban").select("*").eq("id", id).maybeSingle()).data;
const trongPhamVi = (nd: { chiNhanhId: string | null }, cn: string | null) => !nd.chiNhanhId || !cn || nd.chiNhanhId === cn;

async function timKhach(sdtRaw: string): Promise<{ id?: string; loi?: string }> {
  if (!sdtRaw) return {};
  const sdt = chuanSdt(sdtRaw);
  if (!coSdtHopLe(sdt)) return { loi: "Số điện thoại khách chưa hợp lệ." };
  const { data } = await sb().from("khach_hang").select("id").eq("dien_thoai", sdt).maybeSingle();
  return data ? { id: data.id } : { loi: "Không có khách nào dùng số điện thoại này." };
}

export async function luuVanBan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), tieuDe = chuoi(fd, "tieu_de");
  if (!tieuDe || !chuoi(fd, "loai_id")) return { loi: "Chọn loại và nhập tiêu đề." };
  const tu = chuoiHoacNull(fd, "hieu_luc_tu"), den = chuoiHoacNull(fd, "hieu_luc_den");
  if (!ngayHopLe(tu) || !ngayHopLe(den) || (tu && den && den < tu)) return { loi: "Ngày hiệu lực chưa đúng (ngày hết hạn phải sau ngày bắt đầu)." };
  const k = await timKhach(chuoi(fd, "sdt_khach"));
  if (k.loi) return { loi: k.loi };
  const gt = soHoacNull(fd, "gia_tri");
  if (gt != null && gt < 0) return { loi: "Giá trị không được âm." };
  const row = { loai_id: chuoi(fd, "loai_id"), tieu_de: tieuDe, chi_nhanh_id: nd.chiNhanhId ?? chuoiHoacNull(fd, "chi_nhanh_id"), khach_id: k.id ?? null, ncc_id: chuoiHoacNull(fd, "ncc_id"), gia_tri: gt == null ? null : Math.round(gt), hieu_luc_tu: tu, hieu_luc_den: den, dung_tam: bat(fd, "dung_tam"), ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  const db = sb();
  if (id) {
    const cu = await layVb(id);
    if (!cu || !trongPhamVi(nd, cu.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
    if (!["nhap"].includes(cu.trang_thai) && !(cu.trang_thai === "da_ky" && !bat(fd, "doi_noi_dung"))) return { loi: "Chỉ sửa được văn bản nháp. Văn bản đã ký thì tạo phiên bản mới để thay thế." };
    const { error } = await db.from("van_ban").update(row).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
    await ghiVet(id, "sua", nd.nhanVienId);
  } else {
    const ma = `VB${String(Number((await db.rpc("so_tiep_theo", { p_khoa: "van_ban" })).data ?? 0)).padStart(6, "0")}`;
    const { data, error } = await db.from("van_ban").insert({ ...row, ma, nguoi_soan_id: nd.nhanVienId }).select("id").single();
    if (error || !data) return { loi: thongBaoLoi(error) };
    await ghiVet(data.id, "soan", nd.nhanVienId);
  }
  lamMoi();
  return { ok: true };
}

export async function guiDuyetVb(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("van_ban").update({ trang_thai: "cho_duyet" }).eq("id", vb.id).eq("trang_thai", "nhap").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Văn bản không ở trạng thái nháp." };
  await ghiVet(vb.id, "gui_duyet", nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

export async function duyetVb(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  if (vb.nguoi_soan_id === nd.nhanVienId && nd.vaiTro !== "ky_thuat") return { loi: "Người duyệt phải khác người soạn." };
  const { data: ch } = await db.from("cau_hinh").select("gia_tri").eq("khoa", "van_ban.nguong_gd_chi_nhanh").maybeSingle();
  const nguong = Number(ch?.gia_tri ?? 0);
  if (nguong > 0 && Number(vb.gia_tri ?? 0) > nguong && nd.chiNhanhId) return { loi: "Giá trị vượt ngưỡng của Giám đốc chi nhánh — cần Ban Giám đốc (người không gắn chi nhánh) duyệt." };
  const { data, error } = await db.from("van_ban").update({ trang_thai: "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString() }).eq("id", vb.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Văn bản không còn chờ duyệt." };
  await ghiVet(vb.id, "duyet", nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

export async function traVeVb(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!chuoi(fd, "ly_do")) return { loi: "Ghi lý do yêu cầu sửa." };
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("van_ban").update({ trang_thai: "nhap", ly_do: chuoi(fd, "ly_do") }).eq("id", vb.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Văn bản không còn chờ duyệt." };
  await ghiVet(vb.id, "yeu_cau_sua", nd.nhanVienId, chuoi(fd, "ly_do"));
  lamMoi();
  return { ok: true };
}

export async function kyVb(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  const ngay = chuoi(fd, "ngay_ky"), nguoiKy = chuoi(fd, "nguoi_ky");
  if (!NGAY.test(ngay) || ngay > homNayHCM() || !nguoiKy) return { loi: "Nhập ngày ký (không ở tương lai) và người ký." };
  const link = chuoiHoacNull(fd, "link_ban_dien_tu");
  if (link && !/^https?:\/\//.test(link)) return { loi: "Link bản điện tử phải bắt đầu bằng https://" };
  const db = sb();
  const { data, error } = await db.from("van_ban").update({ trang_thai: "da_ky", ngay_ky: ngay, nguoi_ky: nguoiKy, link_ban_dien_tu: link ?? vb.link_ban_dien_tu, vi_tri_ban_giay: chuoiHoacNull(fd, "vi_tri_ban_giay") ?? vb.vi_tri_ban_giay, hieu_luc_tu: vb.hieu_luc_tu ?? ngay }).eq("id", vb.id).eq("trang_thai", "da_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Chỉ ghi nhận ký cho văn bản đã được duyệt." };
  if (vb.thay_the_id) await db.from("van_ban").update({ trang_thai: "thay_the" }).eq("id", vb.thay_the_id).eq("trang_thai", "da_ky");
  await ghiVet(vb.id, "da_ky", nd.nhanVienId, `${nguoiKy}, ${ngay}`);
  lamMoi();
  return { ok: true };
}

export async function luuBanDienTu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id) || vb.trang_thai === "huy") return { loi: KHONG_DU_QUYEN };
  const link = chuoiHoacNull(fd, "link_ban_dien_tu");
  if (link && !/^https?:\/\//.test(link)) return { loi: "Link bản điện tử phải bắt đầu bằng https://" };
  const { error } = await sb().from("van_ban").update({ link_ban_dien_tu: link, vi_tri_ban_giay: chuoiHoacNull(fd, "vi_tri_ban_giay") }).eq("id", vb.id);
  if (error) return { loi: thongBaoLoi(error) };
  await ghiVet(vb.id, "luu_ban_dien_tu", nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

export async function huyVb(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!chuoi(fd, "ly_do")) return { loi: "Ghi lý do huỷ." };
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id)) return { loi: KHONG_DU_QUYEN };
  if (["da_duyet", "da_ky"].includes(vb.trang_thai) && !nd.quyen.includes("vb.duyet")) return { loi: "Huỷ văn bản đã duyệt hoặc đã ký cần người có quyền duyệt." };
  const { data, error } = await sb().from("van_ban").update({ trang_thai: "huy", ly_do: chuoi(fd, "ly_do") }).eq("id", vb.id).in("trang_thai", ["nhap", "cho_duyet", "da_duyet", "da_ky"]).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Văn bản đã huỷ hoặc đã thay thế." };
  await ghiVet(vb.id, "huy", nd.nhanVienId, chuoi(fd, "ly_do"));
  lamMoi();
  return { ok: true };
}

/** Phiên bản mới thay thế một văn bản đã ký: tạo bản nháp sao chép; bản cũ chỉ chuyển "đã thay thế" khi bản mới được ký. */
export async function taoPhienBanMoi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const vb = await layVb(chuoi(fd, "id"));
  if (!vb || !trongPhamVi(nd, vb.chi_nhanh_id) || vb.trang_thai !== "da_ky") return { loi: "Chỉ tạo phiên bản mới từ văn bản đã ký." };
  const { data: daCo } = await db.from("van_ban").select("id").eq("thay_the_id", vb.id).in("trang_thai", ["nhap", "cho_duyet", "da_duyet"]).maybeSingle();
  if (daCo) return { loi: "Đã có một phiên bản mới đang soạn cho văn bản này." };
  const ma = `VB${String(Number((await db.rpc("so_tiep_theo", { p_khoa: "van_ban" })).data ?? 0)).padStart(6, "0")}`;
  const { data, error } = await db.from("van_ban").insert({ ma, loai_id: vb.loai_id, tieu_de: vb.tieu_de, chi_nhanh_id: vb.chi_nhanh_id, khach_id: vb.khach_id, ncc_id: vb.ncc_id, nhan_vien_id: vb.nhan_vien_id, hoa_don_id: vb.hoa_don_id, gia_tri: vb.gia_tri, nguoi_soan_id: nd.nhanVienId, phien_ban: vb.phien_ban + 1, thay_the_id: vb.id, ghi_chu: vb.ghi_chu, hieu_luc_den: vb.hieu_luc_den }).select("id").single();
  if (error || !data) return { loi: thongBaoLoi(error) };
  await ghiVet(data.id, "soan", nd.nhanVienId, `Phiên bản ${vb.phien_ban + 1} thay ${vb.ma}`);
  lamMoi();
  return { ok: true };
}

// ─── Đồng ý dùng ảnh ────────────────────────────────────────────────────────
export async function luuConsent(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const k = await timKhach(chuoi(fd, "sdt_khach"));
  if (!k.id) return { loi: k.loi ?? "Nhập số điện thoại của khách." };
  const loai = chuoi(fd, "loai"), ngay = chuoi(fd, "ngay_ky") || homNayHCM(), den = chuoiHoacNull(fd, "hieu_luc_den"), kenh = chuoiHoacNull(fd, "pham_vi_kenh");
  if (!["theo_doi_dieu_tri", "truyen_thong"].includes(loai) || !NGAY.test(ngay) || ngay > homNayHCM()) return { loi: "Chọn loại đồng ý và ngày ký (không ở tương lai)." };
  if (!ngayHopLe(den) || (den && den < ngay)) return { loi: "Hạn đồng ý phải sau ngày ký." };
  if (loai === "truyen_thong" && (!den || !kenh)) return { loi: "Đồng ý dùng ảnh cho truyền thông phải có hạn và phạm vi kênh." };
  const { error } = await sb().from("consent_anh").insert({ khach_id: k.id, loai, pham_vi_kenh: kenh, ngay_ky: ngay, hieu_luc_den: den, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function rutConsent(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("vb.soan");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("consent_anh").update({ da_rut: true, rut_luc: new Date().toISOString(), ghi_chu: chuoiHoacNull(fd, "ly_do") }).eq("id", chuoi(fd, "id")).eq("da_rut", false).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Đồng ý này đã rút." };
  lamMoi();
  return { ok: true };
}
