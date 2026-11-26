"use server";

import { revalidatePath } from "next/cache";
import { kiemNoiBo, kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, bat, so } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { hanMucHieuLuc, phanTichHangMuc, HINH_THUC_CHI, PHAN_LOAI_VAT } from "@/lib/de-xuat";
import { buocHienTai, kiemTraDuyet } from "@/lib/quy-trinh-duyet";
import { coNguoiGiuChucDanhFn, taiBuocDeXuat } from "@/lib/quy-trinh-duyet-server";
import { vuotNganSach } from "@/lib/ngan-sach";
import { GIO_HAN_MAC_DINH, hanGioTuNhap } from "@/lib/cong-viec-han";
import type { Database } from "@/lib/supabase/database.types";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/noi-lam-viec", "layout"); };
const dem = async (k: string, tien: string) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: k })).data ?? 0)).padStart(6, "0")}`;
const TOI_DA = 100_000_000_000;

// ─── Việc cần hoàn thành ────────────────────────────────────────────────────
/** Giao việc: bắt buộc có người làm, hạn nộp (ngày + giờ, giờ Việt Nam) và tiêu chí xong để chị kiểm soát việc phải XONG. */
export async function giaoViec(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tieuDe = chuoi(fd, "tieu_de");
  if (!tieuDe) return { loi: "Nhập tên công việc." };
  const nhan = chuoi(fd, "nguoi_nhan_id") || nd.nhanVienId;
  const { data: nv } = await sb().from("nhan_vien").select("id").eq("id", nhan).eq("hoat_dong", true).maybeSingle();
  if (!nv) return { loi: "Người nhận việc không hợp lệ." };
  const han = chuoi(fd, "han");
  if (!han) return { loi: "Nhập hạn nộp (ngày)." };
  const hanGio = hanGioTuNhap(han, chuoi(fd, "han_gio") || GIO_HAN_MAC_DINH);
  if (!hanGio) return { loi: "Hạn nộp chưa đúng, nhập lại ngày và giờ." };
  if (han < homNayHCM()) return { loi: "Hạn nộp không được ở quá khứ." };
  const tieuChi = chuoi(fd, "tieu_chi_xong");
  if (!tieuChi) return { loi: "Ghi tiêu chí xong: làm được gì, xem ở đâu, đo bằng gì, dùng thế nào." };
  const uuTien = ["thap", "thuong", "cao"].includes(chuoi(fd, "uu_tien")) ? chuoi(fd, "uu_tien") : "thuong";
  const { error } = await sb().from("cong_viec").insert({ tieu_de: tieuDe, mo_ta: chuoiHoacNull(fd, "mo_ta"), nguoi_giao_id: nd.nhanVienId, nguoi_nhan_id: nhan, han, han_gio: hanGio, tieu_chi_xong: tieuChi, uu_tien: uuTien });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Đổi trạng thái: người nhận bắt đầu / NỘP KẾT QUẢ (ghi nơi thấy sản phẩm và 4 tiêu chí); người giao (hoặc người xem tất cả) huỷ hoặc mở lại. */
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
  type Cap = Database["public"]["Tables"]["cong_viec"]["Update"];
  const cap: Cap = { trang_thai: dich, hoan_thanh_luc: dich === "xong" ? new Date().toISOString() : null, danh_gia: "cho", danh_gia_ghi_chu: null, danh_gia_boi: null, danh_gia_luc: null };
  if (dich === "xong") {
    const sanPham = chuoi(fd, "san_pham");
    if (!sanPham) return { loi: "Ghi sản phẩm ở đâu (đường dẫn, tên tệp hoặc nơi xem) để nộp." };
    Object.assign(cap, { san_pham: sanPham, ket_qua: chuoiHoacNull(fd, "ket_qua"), tc_lam_duoc: bat(fd, "tc_lam_duoc"), tc_thay_duoc: bat(fd, "tc_thay_duoc"), tc_do_duoc: bat(fd, "tc_do_duoc"), tc_dung_duoc: bat(fd, "tc_dung_duoc"), ket_nguoi_id: null, ket_ly_do: null, ket_luc: null });
  }
  const { error } = await sb().from("cong_viec").update(cap).eq("id", v.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Báo kẹt ở ai (người nhận, người giao hoặc quản lý); gỡ kẹt khi `go` = 1. Chỉ cho việc chưa nộp. */
export async function baoKetViec(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data: v } = await sb().from("cong_viec").select("id, trang_thai, nguoi_nhan_id, nguoi_giao_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!v) return { loi: "Không tìm thấy công việc." };
  if (!(v.nguoi_nhan_id === nd.nhanVienId || v.nguoi_giao_id === nd.nhanVienId || coQuyen(nd, "viec.tatca"))) return { loi: KHONG_DU_QUYEN };
  if (!["moi", "dang_lam"].includes(v.trang_thai)) return { loi: "Việc đã nộp hoặc đã huỷ, không báo kẹt được." };
  if (bat(fd, "go")) {
    const { error } = await sb().from("cong_viec").update({ ket_nguoi_id: null, ket_ly_do: null, ket_luc: null }).eq("id", v.id);
    if (error) return { loi: thongBaoLoi(error) };
    lamMoi();
    return { ok: true };
  }
  const lyDo = chuoi(fd, "ket_ly_do");
  if (!lyDo) return { loi: "Ghi lý do kẹt." };
  const ai = chuoi(fd, "ket_nguoi_id");
  const { data: nv } = await sb().from("nhan_vien").select("id").eq("id", ai).eq("hoat_dong", true).maybeSingle();
  if (!nv) return { loi: "Chọn người đang làm việc bị kẹt chờ." };
  const { error } = await sb().from("cong_viec").update({ ket_nguoi_id: nv.id, ket_ly_do: lyDo, ket_luc: new Date().toISOString() }).eq("id", v.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Người giao (hoặc quản lý) chấm việc đã nộp: Đạt, hoặc Chưa đạt kèm lý do (việc quay về Đang làm để nộp lại). */
export async function chamViec(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { data: v } = await sb().from("cong_viec").select("id, trang_thai, nguoi_giao_id").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!v) return { loi: "Không tìm thấy công việc." };
  if (!(v.nguoi_giao_id === nd.nhanVienId || coQuyen(nd, "viec.tatca"))) return { loi: KHONG_DU_QUYEN };
  if (v.trang_thai !== "xong") return { loi: "Chỉ chấm được việc đã nộp." };
  const kq = chuoi(fd, "ket");
  if (kq !== "dat" && kq !== "chua_dat") return { loi: "Chọn Đạt hoặc Chưa đạt." };
  const ghiChu = chuoiHoacNull(fd, "ghi_chu");
  if (kq === "chua_dat" && !ghiChu) return { loi: "Ghi lý do chưa đạt." };
  const cap = kq === "dat"
    ? { danh_gia: "dat", danh_gia_ghi_chu: ghiChu, danh_gia_boi: nd.nhanVienId, danh_gia_luc: new Date().toISOString() }
    : { danh_gia: "chua_dat", danh_gia_ghi_chu: ghiChu, danh_gia_boi: nd.nhanVienId, danh_gia_luc: new Date().toISOString(), trang_thai: "dang_lam", hoan_thanh_luc: null };
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
  let tien = chuoi(fd, "so_tien") === "" ? null : so(fd, "so_tien");
  // Tạm ứng chi phí: nhập các hạng mục dự trù thì tổng tiền là tổng hạng mục (như "Tổng tiền dự trù" của phiếu Lark).
  let hangMuc: { ten: string; so_tien: number }[] | null = null;
  if (loai === "tam_ung" && chuoi(fd, "hang_muc")) {
    const hm = phanTichHangMuc(chuoi(fd, "hang_muc"));
    if ("loi" in hm) return { loi: hm.loi };
    hangMuc = hm.ds; tien = hm.tong;
  }
  const hinhThuc = chuoi(fd, "hinh_thuc_chi"), vat = chuoi(fd, "phan_loai_vat");
  if (hinhThuc && !HINH_THUC_CHI[hinhThuc]) return { loi: "Hình thức thanh toán không hợp lệ." };
  if (vat && !PHAN_LOAI_VAT[vat]) return { loi: "Phân loại hoá đơn VAT không hợp lệ." };
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
  const { data: moi, error } = await db.from("de_xuat").insert({
    ma: await dem("de_xuat", "DX"), loai, tieu_de: tieuDe, noi_dung: chuoiHoacNull(fd, "noi_dung"), so_tien: tien,
    doi_tuong: loai === "tam_ung" || loai === "hoan_ung" ? null : chuoiHoacNull(fd, "doi_tuong"), chi_nhanh_id: cn, nguoi_gui_id: nd.nhanVienId, han_duyet: chuoiHoacNull(fd, "han_duyet"),
    ngay_can_chi: chuoiHoacNull(fd, "ngay_can_chi"), de_xuat_goc_id: goc, loai_tam_ung: loaiTamUng,
    bo_phan: chuoiHoacNull(fd, "bo_phan"), so_tai_khoan: chuoiHoacNull(fd, "so_tai_khoan"), chu_tai_khoan: chuoiHoacNull(fd, "chu_tai_khoan"), ngan_hang: chuoiHoacNull(fd, "ngan_hang"), link_dinh_kem: chuoiHoacNull(fd, "link_dinh_kem"),
    khoan_chi: chuoiHoacNull(fd, "khoan_chi"), hinh_thuc_chi: hinhThuc || null, phan_loai_vat: vat || null, hang_muc: hangMuc,
  }).select("id").single();
  if (error || !moi) return { loi: error?.code === "23505" ? "Khoản tạm ứng này đã có hoàn ứng." : thongBaoLoi(error) };
  // Chép chuỗi bước duyệt theo quy trình đang áp dụng. Lỗi thì rút lại đề xuất, tránh đề xuất không ai duyệt được.
  const { error: eBuoc } = await db.rpc("tao_buoc_duyet", { p_de_xuat: moi.id });
  if (eBuoc) { await db.from("de_xuat").delete().eq("id", moi.id); return { loi: thongBaoLoi(eBuoc) }; }
  lamMoi();
  return { ok: true };
}

async function layDeXuat(id: string, chiNhanhId: string | null) {
  const { data } = await sb().from("de_xuat").select("*").eq("id", id).maybeSingle();
  return data && (!chiNhanhId || data.chi_nhanh_id === chiNhanhId) ? data : null;
}

/** Duyệt MỘT bước (bước đang tới lượt) của đề xuất có quy trình nhiều bước. Bước cuối duyệt xong thì đề xuất chuyển "Đã duyệt". */
async function duyetTheoBuoc(nd: NonNullable<Awaited<ReturnType<typeof kiemQuyen>>>, d: NonNullable<Awaited<ReturnType<typeof layDeXuat>>>, buocs: Awaited<ReturnType<typeof taiBuocDeXuat>> extends Map<string, infer B> ? B : never, ghiChu: string): Promise<KQ> {
  const hien = buocHienTai(buocs);
  if (!hien) return { loi: "Đề xuất không còn bước nào chờ duyệt." };
  const { data: nv } = await sb().from("nhan_vien").select("han_muc_duyet, chuc_danh_tai_chinh").eq("id", nd.nhanVienId).maybeSingle();
  const kq = kiemTraDuyet({
    nguoi: { nhanVienId: nd.nhanVienId, vaiTro: nd.vaiTro, chucDanhTaiChinh: nv?.chuc_danh_tai_chinh ?? null }, nguoiGuiId: d.nguoi_gui_id, buoc: hien,
    daDuyetBoi: new Set(buocs.filter((b) => b.trang_thai === "da_duyet" && b.nguoi_id).map((b) => b.nguoi_id as string)), coNguoiGiuChucDanh: await coNguoiGiuChucDanhFn(),
  });
  if (kq.loi) return { loi: kq.loi };
  // Hạn mức chỉ kiểm ở bước đánh dấu "kiểm hạn mức" và chỉ khi người duyệt ĐÃ được đặt hạn mức riêng (chưa đặt thì chức danh của bước là đủ).
  if (hien.kiem_han_muc && nd.vaiTro !== "ky_thuat" && nv?.han_muc_duyet != null && (d.so_tien ?? 0) > Number(nv.han_muc_duyet)) {
    return { loi: `Số tiền vượt hạn mức duyệt của bạn (${Number(nv.han_muc_duyet).toLocaleString("vi-VN")} đ). Chuyển cho người có hạn mức cao hơn.` };
  }
  const { error } = await sb().rpc("duyet_buoc_de_xuat", { p_buoc: hien.id, p_nguoi: nd.nhanVienId, p_thay: kq.thay, p_ghi_chu: ghiChu });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Người gửi không tự duyệt đề xuất của mình (trừ Kỹ thuật). Điều kiện trạng thái nằm trong câu lệnh nên hai người duyệt cùng lúc chỉ một lần thắng. */
export async function duyetDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("dexuat.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d || d.trang_thai !== "cho_duyet") return { loi: "Đề xuất không ở trạng thái chờ duyệt." };
  const buocs = (await taiBuocDeXuat([d.id])).get(d.id) ?? [];
  if (buocs.length) return duyetTheoBuoc(nd, d, buocs, chuoi(fd, "ghi_chu"));
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
  const buocs = (await taiBuocDeXuat([d.id])).get(d.id) ?? [];
  if (buocs.length) {
    const hien = buocHienTai(buocs);
    if (!hien) return { loi: "Đề xuất không còn bước nào chờ duyệt." };
    const { data: nv } = await sb().from("nhan_vien").select("chuc_danh_tai_chinh").eq("id", nd.nhanVienId).maybeSingle();
    const kq = kiemTraDuyet({ nguoi: { nhanVienId: nd.nhanVienId, vaiTro: nd.vaiTro, chucDanhTaiChinh: nv?.chuc_danh_tai_chinh ?? null }, nguoiGuiId: d.nguoi_gui_id, buoc: hien, daDuyetBoi: new Set(), coNguoiGiuChucDanh: await coNguoiGiuChucDanhFn() });
    if (kq.loi) return { loi: kq.loi };
    const { error: eTc } = await sb().rpc("tu_choi_buoc_de_xuat", { p_buoc: hien.id, p_nguoi: nd.nhanVienId, p_thay: kq.thay, p_ly_do: ly });
    if (eTc) return { loi: thongBaoLoi(eTc) };
    lamMoi();
    return { ok: true };
  }
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
  if (d.trang_thai !== "cho_duyet" && d.trang_thai !== "can_bo_sung") return { loi: "Chỉ huỷ được đề xuất đang chờ duyệt hoặc đang cần bổ sung." };
  const { error } = await sb().from("de_xuat").update({ trang_thai: "huy" }).eq("id", d.id).eq("trang_thai", d.trang_thai);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Trả về "Cần bổ sung chứng từ": người đang giữ bước hiện tại trả phiếu về người lập kèm lý do; người lập sửa rồi gửi lại, chuỗi duyệt chạy lại từ đầu. */
export async function traVeBoSungDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("dexuat.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d || d.trang_thai !== "cho_duyet") return { loi: "Đề xuất không ở trạng thái chờ duyệt." };
  const ly = chuoi(fd, "ly_do");
  if (!ly) return { loi: "Nhập lý do cần bổ sung." };
  const buocs = (await taiBuocDeXuat([d.id])).get(d.id) ?? [];
  const hien = buocHienTai(buocs);
  if (!hien) return { loi: "Đề xuất này không có quy trình nhiều bước nên không trả về được. Hãy từ chối kèm lý do." };
  const { data: nv } = await sb().from("nhan_vien").select("chuc_danh_tai_chinh").eq("id", nd.nhanVienId).maybeSingle();
  const kq = kiemTraDuyet({ nguoi: { nhanVienId: nd.nhanVienId, vaiTro: nd.vaiTro, chucDanhTaiChinh: nv?.chuc_danh_tai_chinh ?? null }, nguoiGuiId: d.nguoi_gui_id, buoc: hien, daDuyetBoi: new Set(), coNguoiGiuChucDanh: await coNguoiGiuChucDanhFn() });
  if (kq.loi) return { loi: kq.loi };
  const { error } = await sb().rpc("tra_ve_bo_sung_buoc", { p_buoc: hien.id, p_nguoi: nd.nhanVienId, p_thay: kq.thay, p_ly_do: ly });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Người lập gửi lại sau khi bổ sung chứng từ (lần gửi + 1). */
export async function guiLaiDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("gui_lai_de_xuat", { p_de_xuat: chuoi(fd, "id"), p_nguoi: nd.nhanVienId, p_noi_dung: chuoi(fd, "noi_dung"), p_link: chuoi(fd, "link_dinh_kem"), p_ghi_chu: chuoi(fd, "ghi_chu") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Bút toán Nợ/Có của phiếu (Kế toán tổng hợp điền như bản "có bút toán" bên Lark): ghi nhận chi phí + ghi nhận thanh toán. */
export async function luuButToanDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d) return { loi: "Không tìm thấy đề xuất." };
  if (d.dong_ho_so_luc) return { loi: "Hồ sơ đã đóng, không sửa bút toán." };
  if (!["da_duyet", "da_thuc_hien"].includes(d.trang_thai)) return { loi: "Chỉ điền bút toán cho đề xuất đã duyệt." };
  const { data: tk } = await sb().from("tai_khoan_ke_toan").select("so_hieu").eq("hoat_dong", true);
  const hop = new Set((tk ?? []).map((x) => x.so_hieu));
  const doi = (ma: string) => {
    const no = chuoi(fd, `${ma}_no`), co = chuoi(fd, `${ma}_co`), tien = Math.round(so(fd, `${ma}_so_tien`));
    if (!hop.has(no) || !hop.has(co)) return null;
    if (no === co) return null;
    if (!Number.isInteger(tien) || tien <= 0 || tien > TOI_DA) return null;
    return { no, co, so_tien: tien, doi_tuong: chuoiHoacNull(fd, `${ma}_doi_tuong`) };
  };
  const ghiNhan = doi("ghi_nhan"), thanhToan = doi("thanh_toan");
  if (!ghiNhan || !thanhToan) return { loi: "Điền đủ hai bút toán: Nợ, Có (chọn trong danh mục tài khoản, khác nhau) và số tiền lớn hơn 0." };
  const { error } = await sb().from("de_xuat").update({ but_toan: { ghi_nhan: ghiNhan, thanh_toan: thanhToan } }).eq("id", d.id).is("dong_ho_so_luc", null);
  if (error) return { loi: thongBaoLoi(error) };
  await sb().from("de_xuat_lich_su").insert({ de_xuat_id: d.id, nguoi_id: nd.nhanVienId, hanh_dong: "but_toan" });
  lamMoi();
  return { ok: true };
}

/** Đóng hồ sơ sau khi đã chi và đã có bút toán. */
export async function dongHoSoDeXuat(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const d = await layDeXuat(chuoi(fd, "id"), nd.chiNhanhId);
  if (!d) return { loi: "Không tìm thấy đề xuất." };
  const { error } = await sb().rpc("dong_ho_so_de_xuat", { p_de_xuat: d.id, p_nguoi: nd.nhanVienId });
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
  // Khoản chi vượt ngân sách tháng: chỉ người có quyền Khoá kỳ (hoặc Kỹ thuật) được tick "chấp nhận vượt" để chi tiếp.
  const loaiChi = chuoi(fd, "loai_thu_chi_id");
  if (loaiChi && d.so_tien && d.loai !== "hoan_khach" && d.loai !== "hoan_ung") {
    const vuot = await vuotNganSach({ ngay, loaiThuChiId: loaiChi, chiNhanhId: d.chi_nhanh_id, soTien: Number(d.so_tien) });
    const choQua = (nd.vaiTro === "ky_thuat" || coQuyen(nd, "ky.khoa")) && bat(fd, "chap_nhan_vuot");
    if (vuot && !choQua) return { loi: `${vuot} ${nd.vaiTro === "ky_thuat" || coQuyen(nd, "ky.khoa") ? "Tick \"Chấp nhận vượt ngân sách\" nếu vẫn chi." : "Nhờ kế toán trưởng nâng ngân sách hoặc cho phép chi."}` };
  }
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
