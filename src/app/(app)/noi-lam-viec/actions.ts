"use server";

import { revalidatePath } from "next/cache";
import { kiemNoiBo, kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, bat, so } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { hanMucHieuLuc } from "@/lib/de-xuat";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/noi-lam-viec", "layout"); };
const dem = async (k: string, tien: string) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: k })).data ?? 0)).padStart(6, "0")}`;
const TOI_DA = 100_000_000_000;

// ─── Việc cần hoàn thành ────────────────────────────────────────────────────
export async function giaoViec(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tieuDe = chuoi(fd, "tieu_de");
  if (!tieuDe) return { loi: "Nhập tên công việc." };
  const nhan = chuoi(fd, "nguoi_nhan_id") || nd.nhanVienId;
  const { data: nv } = await sb().from("nhan_vien").select("id").eq("id", nhan).eq("hoat_dong", true).maybeSingle();
  if (!nv) return { loi: "Người nhận việc không hợp lệ." };
  const han = chuoiHoacNull(fd, "han");
  const uuTien = ["thap", "thuong", "cao"].includes(chuoi(fd, "uu_tien")) ? chuoi(fd, "uu_tien") : "thuong";
  const { error } = await sb().from("cong_viec").insert({ tieu_de: tieuDe, mo_ta: chuoiHoacNull(fd, "mo_ta"), nguoi_giao_id: nd.nhanVienId, nguoi_nhan_id: nhan, han, uu_tien: uuTien });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Đổi trạng thái: người nhận bắt đầu / hoàn thành; người giao (hoặc người xem tất cả) huỷ hoặc mở lại. */
export async function doiTrangThaiViec(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data: v } = await sb().from("cong_viec").select("*").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!v) return { loi: "Không tìm thấy công việc." };
  const quanLy = coQuyen(nd, "viec.tatca");
  const laNhan = v.nguoi_nhan_id === nd.nhanVienId, laGiao = v.nguoi_giao_id === nd.nhanVienId;
  const dich = chuoi(fd, "trang_thai");
  const duocPhep = (dich === "dang_lam" || dich === "xong") ? (laNhan || laGiao || quanLy) : (dich === "huy" || dich === "moi") ? (laGiao || quanLy) : false;
  if (!duocPhep) return { loi: KHONG_DU_QUYEN };
  if (v.trang_thai === "huy" && dich !== "moi") return { loi: "Việc đã huỷ, chỉ mở lại được." };
  const cap: { trang_thai: string; ket_qua?: string | null; hoan_thanh_luc: string | null } = { trang_thai: dich, hoan_thanh_luc: dich === "xong" ? new Date().toISOString() : null };
  if (dich === "xong") cap.ket_qua = chuoiHoacNull(fd, "ket_qua");
  const { error } = await sb().from("cong_viec").update(cap).eq("id", v.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Báo cáo ngày ───────────────────────────────────────────────────────────
/** Một báo cáo / người / ngày: nộp lại cùng ngày thì cập nhật bản cũ. Quản lý nộp thay được. */
export async function nopBaoCaoNgay(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ngay = chuoi(fd, "ngay") || homNayHCM();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay > homNayHCM()) return { loi: "Ngày báo cáo không được ở tương lai." };
  const thay = chuoi(fd, "thay_cho");
  const nv = thay && thay !== nd.nhanVienId ? thay : nd.nhanVienId;
  if (nv !== nd.nhanVienId) {
    if (!coQuyen(nd, "viec.tatca")) return { loi: KHONG_DU_QUYEN };
    const { data: x } = await sb().from("nhan_vien").select("id").eq("id", nv).eq("hoat_dong", true).maybeSingle();
    if (!x) return { loi: "Nhân viên không hợp lệ." };
  }
  const daLam = chuoi(fd, "da_lam");
  if (!daLam) return { loi: "Nhập việc đã làm hôm nay." };
  const { error } = await sb().from("bao_cao_ngay").upsert({ nhan_vien_id: nv, ngay, da_lam: daLam, vuong: chuoiHoacNull(fd, "vuong"), ke_hoach: chuoiHoacNull(fd, "ke_hoach"), nguoi_nop_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "nhan_vien_id,ngay" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Wiki công ty ───────────────────────────────────────────────────────────
export async function luuWiki(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("wiki.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { tieu_de: chuoi(fd, "tieu_de"), nhom: chuoi(fd, "nhom") || "Chung", noi_dung: chuoi(fd, "noi_dung"), ghim: bat(fd, "ghim"), cong_khai: chuoi(fd, "cong_khai") !== "0" };
  if (!row.tieu_de || !row.noi_dung) return { loi: "Nhập tiêu đề và nội dung." };
  const { error } = id ? await sb().from("wiki_bai").update({ ...row, cap_nhat_luc: new Date().toISOString() }).eq("id", id) : await sb().from("wiki_bai").insert({ ...row, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function xoaWiki(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("wiki.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("wiki_bai").delete().eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Đề xuất & phê duyệt ────────────────────────────────────────────────────
export async function guiDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const loai = chuoi(fd, "loai");
  if (!["mua_sam", "thanh_toan", "tam_ung", "hoan_ung", "hoan_khach"].includes(loai)) return { loi: "Loại đề xuất không hợp lệ." };
  const tieuDe = chuoi(fd, "tieu_de");
  if (!tieuDe) return { loi: "Nhập nội dung đề xuất." };
  const tien = chuoi(fd, "so_tien") === "" ? null : so(fd, "so_tien");
  if (tien !== null && (!Number.isInteger(tien) || tien <= 0 || tien > TOI_DA)) return { loi: "Số tiền phải là số đồng lớn hơn 0 và không quá 100 tỷ." };
  if (loai !== "mua_sam" && tien === null) return { loi: "Nhập số tiền." };
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id");
  if (!cn) return { loi: "Chọn chi nhánh." };
  const db = sb();
  let goc: string | null = null;
  const loaiTamUng = loai === "tam_ung" ? (chuoi(fd, "loai_tam_ung") === "chi_phi" ? "chi_phi" : "luong") : null;
  if (loaiTamUng === "luong") {
    const { count } = await db.from("de_xuat").select("id", { count: "exact", head: true }).eq("loai", "tam_ung").eq("loai_tam_ung", "luong").eq("nguoi_gui_id", nd.nhanVienId).in("trang_thai", ["cho_duyet", "da_duyet"]);
    if (count) return { loi: "Bạn đang có đề xuất tạm ứng lương chưa xử lý xong." };
  }
  if (loaiTamUng === "chi_phi") {
    // Còn khoản tạm ứng chi phí cũ chưa hoàn ứng thì chưa xin khoản mới.
    const { data: cu } = await db.from("de_xuat").select("id, trang_thai").eq("loai", "tam_ung").eq("loai_tam_ung", "chi_phi").eq("nguoi_gui_id", nd.nhanVienId).in("trang_thai", ["cho_duyet", "da_duyet", "da_thuc_hien"]);
    const mo = (cu ?? []).filter((x) => x.trang_thai !== "da_thuc_hien");
    if (mo.length) return { loi: "Bạn đang có đề xuất tạm ứng chưa xử lý xong." };
    const ids = (cu ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: hu } = await db.from("de_xuat").select("de_xuat_goc_id").eq("loai", "hoan_ung").in("de_xuat_goc_id", ids).not("trang_thai", "in", "(tu_choi,huy)");
      const daHoan = new Set((hu ?? []).map((x) => x.de_xuat_goc_id));
      if (ids.some((i) => !daHoan.has(i))) return { loi: "Bạn còn khoản tạm ứng chưa hoàn ứng. Hoàn ứng khoản cũ trước khi xin khoản mới." };
    }
  }
  if (loai === "hoan_ung") {
    goc = chuoi(fd, "de_xuat_goc_id");
    const { data: g } = await db.from("de_xuat").select("id, nguoi_gui_id, loai, trang_thai, chi_nhanh_id, loai_tam_ung").eq("id", goc).maybeSingle();
    if (g && g.loai_tam_ung !== "chi_phi") return { loi: "Tạm ứng lương được trừ vào kỳ lương, không cần hoàn ứng." };
    if (!g || g.loai !== "tam_ung" || g.trang_thai !== "da_thuc_hien" || g.nguoi_gui_id !== nd.nhanVienId) return { loi: "Chọn khoản tạm ứng chi phí đã chi của chính bạn." };
  }
  const { error } = await db.from("de_xuat").insert({
    ma: await dem("de_xuat", "DX"), loai, tieu_de: tieuDe, noi_dung: chuoiHoacNull(fd, "noi_dung"), so_tien: tien,
    doi_tuong: loai === "tam_ung" || loai === "hoan_ung" ? null : chuoiHoacNull(fd, "doi_tuong"), chi_nhanh_id: cn, nguoi_gui_id: nd.nhanVienId, han_duyet: chuoiHoacNull(fd, "han_duyet"),
    ngay_can_chi: chuoiHoacNull(fd, "ngay_can_chi"), de_xuat_goc_id: goc, loai_tam_ung: loaiTamUng,
  });
  if (error) return { loi: error.code === "23505" ? "Khoản tạm ứng này đã có hoàn ứng." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

async function layDeXuat(id: string, chiNhanhId: string | null) {
  const { data } = await sb().from("de_xuat").select("*").eq("id", id).maybeSingle();
  return data && (!chiNhanhId || data.chi_nhanh_id === chiNhanhId) ? data : null;
}

/** Người gửi không tự duyệt đề xuất của mình (trừ Kỹ thuật). Điều kiện trạng thái nằm trong câu lệnh nên hai người duyệt cùng lúc chỉ một lần thắng. */
export async function duyetDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("dexuat.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d || d.trang_thai !== "cho_duyet") return { loi: "Đề xuất không ở trạng thái chờ duyệt." };
  if (d.nguoi_gui_id === nd.nhanVienId && nd.vaiTro !== "ky_thuat") return { loi: "Người gửi không tự duyệt đề xuất của mình." };
  const { data: nv } = await sb().from("nhan_vien").select("han_muc_duyet").eq("id", nd.nhanVienId).maybeSingle();
  const han = hanMucHieuLuc(nd.vaiTro, nv?.han_muc_duyet);
  if (d.loai === "hoan_khach" && han !== Infinity) return { loi: "Hoàn trả khách chỉ Giám đốc (không giới hạn hạn mức) được duyệt." };
  if ((d.so_tien ?? 0) > han) return { loi: `Số tiền vượt hạn mức duyệt của bạn (${han.toLocaleString("vi-VN")} đ). Chuyển cho người có hạn mức cao hơn.` };
  const { data, error } = await sb().from("de_xuat").update({ trang_thai: "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString(), ly_do: null }).eq("id", d.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Đề xuất vừa được xử lý bởi người khác." };
  lamMoi();
  return { ok: true };
}

export async function tuChoiDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("dexuat.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d || d.trang_thai !== "cho_duyet") return { loi: "Đề xuất không ở trạng thái chờ duyệt." };
  const ly = chuoi(fd, "ly_do");
  if (!ly) return { loi: "Nhập lý do từ chối." };
  const { data, error } = await sb().from("de_xuat").update({ trang_thai: "tu_choi", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString(), ly_do: ly }).eq("id", d.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Đề xuất vừa được xử lý bởi người khác." };
  lamMoi();
  return { ok: true };
}

export async function huyDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d || d.nguoi_gui_id !== nd.nhanVienId) return { loi: KHONG_DU_QUYEN };
  if (d.trang_thai !== "cho_duyet") return { loi: "Chỉ huỷ được đề xuất đang chờ duyệt." };
  const { error } = await sb().from("de_xuat").update({ trang_thai: "huy" }).eq("id", d.id).eq("trang_thai", "cho_duyet");
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Chi theo đề xuất đã duyệt: ghi sổ quỹ và đánh dấu đã thực hiện trong một giao dịch (hàm DB khoá dòng đề xuất). */
export async function chiTheoDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d) return { loi: "Không tìm thấy đề xuất." };
  const ngay = chuoi(fd, "ngay") || homNayHCM();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay > homNayHCM()) return { loi: "Ngày chi không được ở tương lai." };
  const canLoai = d.loai !== "hoan_khach" && d.loai !== "hoan_ung";
  if (!chuoi(fd, "quy_id") || (canLoai && !chuoi(fd, "loai_thu_chi_id"))) return { loi: "Chọn quỹ và phân loại chi." };
  const { error } = await sb().rpc("chi_theo_de_xuat", { p_de_xuat: d.id, p_quy: chuoi(fd, "quy_id"), p_loai_thu_chi: chuoi(fd, "loai_thu_chi_id") || (null as unknown as string), p_ngay: ngay, p_nguoi: nd.nhanVienId, p_bo_qua_kiem: nd.vaiTro === "ky_thuat" });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/tai-chinh", "layout");
  lamMoi();
  return { ok: true };
}

/** Đề xuất mua sắm đã duyệt → lập đơn mua nháp (nhà cung cấp chọn lúc này), đề xuất chuyển sang "đã thực hiện". */
export async function lapDonMuaTuDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mua.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d || d.loai !== "mua_sam" || d.trang_thai !== "da_duyet") return { loi: "Chỉ lập đơn mua từ đề xuất mua sắm đã duyệt." };
  const { data: n } = await sb().from("nha_cung_cap").select("id").eq("id", chuoi(fd, "ncc_id")).eq("hoat_dong", true).maybeSingle();
  if (!n) return { loi: "Chọn nhà cung cấp hợp lệ." };
  const { data: don, error } = await sb().from("don_mua").insert({ ma: await dem("don_mua", "DM"), chi_nhanh_id: d.chi_nhanh_id, ncc_id: n.id, ghi_chu: `Từ đề xuất ${d.ma}: ${d.tieu_de}`, nguoi_tao_id: nd.nhanVienId }).select("id").single();
  if (error || !don) return { loi: thongBaoLoi(error) };
  const { data: cap } = await sb().from("de_xuat").update({ trang_thai: "da_thuc_hien", don_mua_id: don.id }).eq("id", d.id).eq("trang_thai", "da_duyet").select("id");
  if (!cap?.length) {
    await sb().from("don_mua").delete().eq("id", don.id);
    return { loi: "Đề xuất vừa được xử lý bởi người khác." };
  }
  revalidatePath("/kho-mua-sam", "layout");
  lamMoi();
  return { ok: true };
}
