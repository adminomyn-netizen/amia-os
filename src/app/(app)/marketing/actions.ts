"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so } from "@/lib/form";
import { chuanSdt, coSdtHopLe, homNayHCM } from "@/lib/dinh-dang";
import { CAN_LY_DO, KET_QUA_LIEN_HE, docMucHoaHong } from "@/lib/marketing";
import { layLeadChoXuLy } from "@/lib/lead-quyen";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/marketing", "layout"); };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const dem = async (k: string, tien: string, n = 6) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: k })).data ?? 0)).padStart(n, "0")}`;
const tien = (fd: FormData, k: string) => Math.max(0, Math.round(so(fd, k)));

// ─── Lead ───────────────────────────────────────────────────────────────────
// Giai đoạn, kết quả open/won/lost và dòng thời gian do trigger 0313 lo; ở đây chỉ kiểm quyền + dữ liệu. Mọi lần sửa ghi sua_boi để dòng thời gian đúng người.
// Phần pipeline (kéo thả, hỗ trợ, tác vụ, nhắc, tệp, cấu hình cột) ở ./lead/actions.ts.
const SO_CON_MO = (db: ReturnType<typeof sb>, sdt: string) =>
  db.from("lead").select("ma").eq("sdt", sdt).neq("ket_qua", "lost").not("trang_thai_phan_bo", "in", "(lead_trung,khong_hop_le)").limit(1).maybeSingle();
export async function taoLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const hoTen = chuoi(fd, "ho_ten"), sdt = chuanSdt(chuoi(fd, "sdt")), nguon = chuoi(fd, "nguon_id"), email = chuoiHoacNull(fd, "email")?.toLowerCase() ?? null;
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id");
  if (!hoTen || !nguon || !cn) return { loi: "Nhập họ tên, nguồn và chi nhánh." };
  if (!coSdtHopLe(sdt)) return { loi: "Số điện thoại chưa hợp lệ (bắt đầu bằng 0, 10–11 số)." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { loi: "Email chưa hợp lệ." };
  const [{ data: khach }, { data: dup }, { data: ng }] = await Promise.all([
    db.from("khach_hang").select("ma, ho_ten").eq("dien_thoai", sdt).maybeSingle(),
    SO_CON_MO(db, sdt),
    db.from("nguon_lead").select("id").eq("id", nguon).eq("hoat_dong", true).maybeSingle(),
  ]);
  if (khach) return { loi: `Số này đã là khách ${khach.ho_ten} (${khach.ma}). Không tạo lead mới cho khách cũ.` };
  if (dup) return { loi: `Số này đang có lead ${dup.ma}. Mở lead đó để cập nhật.` };
  if (!ng) return { loi: "Nguồn không hợp lệ hoặc đã ngừng." };
  const nhanNgay = bat(fd, "nhan_ngay");
  const { error } = await db.from("lead").insert({
    ma: await dem("lead", "LD"), ho_ten: hoTen, sdt, email, gia_tri_du_kien: tien(fd, "gia_tri_du_kien"), nguon_id: nguon, chien_dich_id: chuoiHoacNull(fd, "chien_dich_id"), doi_tac_id: chuoiHoacNull(fd, "doi_tac_id"), chi_nhanh_id: cn,
    dich_vu_quan_tam: chuoiHoacNull(fd, "dich_vu_quan_tam"), nhu_cau: chuoiHoacNull(fd, "nhu_cau"), tao_boi: nd.nhanVienId, sua_boi: nd.nhanVienId,
    ...(nhanNgay ? { owner_id: nd.nhanVienId, owner_xac_nhan_luc: new Date().toISOString(), trang_thai_phan_bo: "da_xac_nhan" } : {}),
  });
  if (error) return { loi: error.code === "23505" ? "Số này đang có lead khác." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Owner xác nhận lead ngay (SOP: không tự nhận lead đã có người phụ trách). */
export async function nhanLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  let q = sb().from("lead").update({ owner_id: nd.nhanVienId, owner_xac_nhan_luc: new Date().toISOString(), trang_thai_phan_bo: "da_xac_nhan", sua_boi: nd.nhanVienId }).eq("id", chuoi(fd, "id")).is("owner_id", null);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data, error } = await q.select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Lead đã có người phụ trách." };
  await sb().from("lead_nguoi_ho_tro").delete().eq("lead_id", data[0].id).eq("nhan_vien_id", nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

/** Chuyển/thu hồi owner phải do người có quyền duyệt (SOP: cần approval). Người được giao đang là người hỗ trợ thì bỏ khỏi danh sách hỗ trợ. */
export async function giaoLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const owner = chuoi(fd, "owner_id"), id = chuoi(fd, "id");
  const { data: n } = await sb().from("nhan_vien").select("id").eq("id", owner).eq("hoat_dong", true).maybeSingle();
  if (!n) return { loi: "Chọn người phụ trách hợp lệ." };
  let q = sb().from("lead").update({ owner_id: owner, owner_xac_nhan_luc: null, trang_thai_phan_bo: "da_phan_bo", sua_boi: nd.nhanVienId }).eq("id", id);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data, error } = await q.select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Không tìm thấy lead." };
  await sb().from("lead_nguoi_ho_tro").delete().eq("lead_id", id).eq("nhan_vien_id", owner);
  lamMoi();
  return { ok: true };
}

export async function ghiLienHe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: "Chỉ người phụ trách, người hỗ trợ (hoặc người duyệt) ghi liên hệ cho lead này." };
  if (lead.ket_qua !== "open") return { loi: "Lead đã đóng. Mở lại lead trước khi ghi liên hệ." };
  const kq = chuoi(fd, "ket_qua"), kenh = chuoi(fd, "kenh"), ghiChu = chuoiHoacNull(fd, "ghi_chu"), han = chuoiHoacNull(fd, "han_tiep");
  if (!(KET_QUA_LIEN_HE as readonly string[]).includes(kq) || !["goi", "zalo", "sms", "truc_tiep", "khac"].includes(kenh)) return { loi: "Chọn kênh và kết quả liên hệ." };
  if (CAN_LY_DO.includes(kq) && !ghiChu) return { loi: "Kết thúc lead cần ghi lý do (SOP không xoá lead)." };
  if (han && (!NGAY.test(han) || han < homNayHCM())) return { loi: "Hạn liên hệ tiếp không được ở quá khứ." };
  const db = sb();
  const { error } = await db.from("lead_lien_he").insert({ lead_id: lead.id, kenh, ket_qua: kq, ghi_chu: ghiChu, han_tiep: han, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  // Giai đoạn tự tiến theo kết quả (trigger 0313): kết thúc → cột Thua kèm lý do.
  const { error: e2 } = await db.from("lead").update({ trang_thai_lien_he: kq, ly_do: CAN_LY_DO.includes(kq) ? ghiChu : lead.ly_do, sua_boi: nd.nhanVienId, ...(lead.owner_xac_nhan_luc ? {} : { owner_id: lead.owner_id ?? nd.nhanVienId, owner_xac_nhan_luc: new Date().toISOString(), trang_thai_phan_bo: "da_xac_nhan" }) }).eq("id", lead.id);
  if (e2) return { loi: thongBaoLoi(e2) };
  // Hẹn liên hệ tiếp = một nhắc việc 08:00 ngày đó cho người phụ trách (hiện ở chuông khi đến giờ).
  if (han && !CAN_LY_DO.includes(kq)) {
    await db.from("lead_nhac").insert({ lead_id: lead.id, noi_dung: "Liên hệ lại theo hẹn", nhac_luc: new Date(`${han}T08:00:00+07:00`).toISOString(), nhac_cho_id: lead.owner_id ?? nd.nhanVienId, tao_boi: nd.nhanVienId });
  }
  lamMoi();
  return { ok: true };
}

/** Đánh dấu trùng / không hợp lệ: đổi trạng thái kèm lý do, không xoá (lead sang cột Thua). */
export async function danhDauLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: "Chỉ người phụ trách (hoặc người duyệt) đánh dấu lead này." };
  const loai = chuoi(fd, "loai"), ly = chuoi(fd, "ly_do");
  if (!["lead_trung", "khong_hop_le"].includes(loai) || !ly) return { loi: "Chọn loại và nhập lý do." };
  const { error } = await sb().from("lead").update({ trang_thai_phan_bo: loai, trang_thai_lien_he: loai === "lead_trung" ? "trung_lead" : "da_ket_thuc", ly_do: ly, sua_boi: nd.nhanVienId }).eq("id", lead.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Lead → khách hàng (cần quyền sửa khách). Số đã có khách thì chỉ gắn lead vào khách đó. */
export async function chuyenLeadThanhKhach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd || !coQuyen(nd, "khach.sua")) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: "Chỉ người phụ trách (hoặc người duyệt) chuyển lead này." };
  if (lead.khach_id) return { loi: "Lead đã gắn với một khách." };
  const db = sb();
  const { data: cu } = await db.from("khach_hang").select("id").eq("dien_thoai", lead.sdt).maybeSingle();
  let khachId = cu?.id;
  if (!khachId) {
    const { data: ng } = await db.from("nguon_lead").select("ten").eq("id", lead.nguon_id).maybeSingle();
    const { data: moi, error } = await db.from("khach_hang").insert({ ma: await dem("khach", "KH"), ho_ten: lead.ho_ten, dien_thoai: lead.sdt, email: lead.email, chi_nhanh_id: lead.chi_nhanh_id, nguon: "mkt", nguon_chi_tiet: ng?.ten ?? null, nguoi_phu_trach_id: lead.owner_id ?? nd.nhanVienId, ghi_chu: lead.nhu_cau, tao_boi: nd.nhanVienId }).select("id").single();
    if (error || !moi) return { loi: thongBaoLoi(error) };
    khachId = moi.id;
  }
  const { error: e2 } = await db.from("lead").update({ khach_id: khachId, sua_boi: nd.nhanVienId }).eq("id", lead.id);
  if (e2) return { loi: thongBaoLoi(e2) };
  revalidatePath("/khach-hang");
  lamMoi();
  return { ok: true };
}

// ─── Chiến dịch, quảng cáo ──────────────────────────────────────────────────
export async function luuChienDich(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten"), bd = chuoiHoacNull(fd, "bat_dau"), kt = chuoiHoacNull(fd, "ket_thuc");
  if (!ten || !["branding", "slogan", "khuyen_mai", "thong_diep"].includes(chuoi(fd, "muc_tieu"))) return { loi: "Nhập tên và chọn mục tiêu (một trong Branding, Slogan, Khuyến mãi, Thông điệp)." };
  if (bd && kt && kt < bd) return { loi: "Ngày kết thúc phải sau ngày bắt đầu." };
  const row = { ten, muc_tieu: chuoi(fd, "muc_tieu"), kenh: chuoiHoacNull(fd, "kenh"), chi_nhanh_id: chuoiHoacNull(fd, "chi_nhanh_id"), nguon_id: chuoiHoacNull(fd, "nguon_id"), ngan_sach: tien(fd, "ngan_sach"), bat_dau: bd, ket_thuc: kt, owner_id: chuoiHoacNull(fd, "owner_id") ?? nd.nhanVienId, ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  const { error } = id ? await sb().from("chien_dich").update(row).eq("id", id) : await sb().from("chien_dich").insert({ ...row, ma: await dem("chien_dich", "CD", 4) });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

const CHUYEN_CD: Record<string, { tu: string[]; duyet: boolean }> = {
  cho_duyet: { tu: ["nhap"], duyet: false }, da_duyet: { tu: ["cho_duyet"], duyet: true }, nhap: { tu: ["cho_duyet"], duyet: true },
  dang_chay: { tu: ["da_duyet", "tam_dung"], duyet: false }, tam_dung: { tu: ["dang_chay"], duyet: false }, ket_thuc: { tu: ["dang_chay", "tam_dung", "da_duyet"], duyet: false },
};
/** Nháp → chờ duyệt (người làm) → đã duyệt / trả về nháp (người duyệt) → chạy / tạm dừng / kết thúc. */
export async function doiTrangThaiChienDich(fd: FormData): Promise<KQ> {
  const dich = chuoi(fd, "trang_thai"), r = CHUYEN_CD[dich];
  const nd = await kiemQuyen(r?.duyet ? "mkt.duyet" : "mkt.sua");
  if (!nd || !r) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("chien_dich").update({ trang_thai: dich, ...(dich === "da_duyet" ? { nguoi_duyet_id: nd.nhanVienId } : {}) }).eq("id", chuoi(fd, "id")).in("trang_thai", r.tu).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Chiến dịch không ở trạng thái phù hợp để chuyển." };
  lamMoi();
  return { ok: true };
}

export async function luuQuangCao(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ngay = chuoi(fd, "ngay"), cd = chuoi(fd, "chien_dich_id");
  if (!NGAY.test(ngay) || ngay > homNayHCM() || !cd) return { loi: "Chọn chiến dịch và ngày (không ở tương lai)." };
  const n = (k: string) => Math.max(0, Math.round(so(fd, k)));
  const { error } = await sb().from("chi_phi_qc_ngay").upsert({ ngay, chien_dich_id: cd, chi_phi: n("chi_phi"), hien_thi: n("hien_thi"), tiep_can: n("tiep_can"), click: n("click"), tin_nhan_moi: n("tin_nhan_moi"), lead_so: n("lead_so"), nguoi_id: nd.nhanVienId }, { onConflict: "ngay,chien_dich_id" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Nội dung ───────────────────────────────────────────────────────────────
export async function luuNoiDung(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), td = chuoi(fd, "tieu_de"), han = chuoi(fd, "han");
  if (!td || !NGAY.test(han)) return { loi: "Nhập tiêu đề và hạn (bắt buộc có hạn)." };
  const row = { tieu_de: td, loai: ["video", "bai_viet", "anh", "khac"].includes(chuoi(fd, "loai")) ? chuoi(fd, "loai") : "bai_viet", kenh: chuoiHoacNull(fd, "kenh"), chien_dich_id: chuoiHoacNull(fd, "chien_dich_id"), nguoi_phu_trach_id: chuoi(fd, "nguoi_phu_trach_id") || nd.nhanVienId, han, link_bai: chuoiHoacNull(fd, "link_bai"), ngay_dang: chuoiHoacNull(fd, "ngay_dang"), ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  const { error } = id ? await sb().from("noi_dung_mkt").update(row).eq("id", id) : await sb().from("noi_dung_mkt").insert({ ...row, ma: await dem("noi_dung", "ND") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Nộp duyệt (người làm hoặc người sửa) → duyệt / chưa đạt (người duyệt). Duyệt xong phải có link bài hoặc ngày đăng mới tính hoàn thành. */
export async function doiTrangThaiNoiDung(fd: FormData): Promise<KQ> {
  const dich = chuoi(fd, "trang_thai");
  if (!["cho_duyet", "da_duyet", "chua_dat", "nhap"].includes(dich)) return { loi: "Trạng thái không hợp lệ." };
  const nd = await kiemQuyen(dich === "da_duyet" || dich === "chua_dat" ? "mkt.duyet" : "mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: cu } = await db.from("noi_dung_mkt").select("*").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy nội dung." };
  if (dich === "da_duyet" && !cu.link_bai && !cu.ngay_dang) return { loi: "Cần có link bài hoặc ngày đăng trước khi duyệt hoàn thành." };
  const { error } = await db.from("noi_dung_mkt").update({ trang_thai_duyet: dich, so_lan_duyet: dich === "cho_duyet" ? cu.so_lan_duyet + 1 : cu.so_lan_duyet, ...(dich === "da_duyet" || dich === "chua_dat" ? { nguoi_duyet_id: nd.nhanVienId } : {}), hoan_thanh_luc: dich === "da_duyet" ? new Date().toISOString() : null }).eq("id", cu.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Đối tác giới thiệu, link theo dõi, nguồn ──────────────────────────────
export async function luuDoiTac(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten");
  if (!ten) return { loi: "Nhập tên đối tác." };
  const sdt = chuoi(fd, "dien_thoai") ? chuanSdt(chuoi(fd, "dien_thoai")) : null;
  if (sdt && !coSdtHopLe(sdt)) return { loi: "Số điện thoại chưa hợp lệ." };
  // Mức hoa hồng mặc định (như SalonHero): biểu mẫu không gửi ô này (bản cũ) thì giữ nguyên khi sửa, thêm mới thì 0%.
  const coMuc = fd.has("hh_kieu");
  const muc = coMuc ? docMucHoaHong(chuoi(fd, "hh_kieu"), so(fd, "hh_gia_tri")) : null;
  if (muc && "loi" in muc) return { loi: muc.loi };
  // M4: tên hiển thị trên trang đặt lịch, email + công tắc gửi email (biểu mẫu cũ không gửi các ô này thì giữ nguyên).
  const email = fd.has("email") ? chuoiHoacNull(fd, "email")?.toLowerCase() ?? null : undefined;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { loi: "Email chưa hợp lệ." };
  const tenHienThi = fd.has("ten_hien_thi") ? (chuoiHoacNull(fd, "ten_hien_thi")?.slice(0, 80) ?? null) : undefined;
  const row = {
    ten, loai: ["ctv", "khach_cu", "kol", "khac"].includes(chuoi(fd, "loai")) ? chuoi(fd, "loai") : "ctv", dien_thoai: sdt, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), hoat_dong: chuoi(fd, "hoat_dong") !== "0",
    ...(muc ? { hh_kieu: muc.kieu, hh_gia_tri: muc.giaTri } : {}),
    ...(email !== undefined ? { email, gui_email: !!email && bat(fd, "gui_email") } : {}),
    ...(tenHienThi !== undefined ? { ten_hien_thi: tenHienThi } : {}),
  };
  if (id) {
    const db = sb();
    const { data: cu } = await db.from("doi_tac_gt").select("id, ten, hh_kieu, hh_gia_tri").eq("id", id).maybeSingle();
    if (!cu) return { loi: "Không tìm thấy đối tác." };
    const { error } = await db.from("doi_tac_gt").update(row).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
    if (muc && (cu.hh_kieu !== muc.kieu || Number(cu.hh_gia_tri) !== muc.giaTri))
      await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "sua_muc_hoa_hong_gioi_thieu", doi_tuong: "doi_tac_gt", doi_tuong_id: id, chi_tiet: { ten: cu.ten, truoc: { hh_kieu: cu.hh_kieu, hh_gia_tri: Number(cu.hh_gia_tri) }, sau: { hh_kieu: muc.kieu, hh_gia_tri: muc.giaTri } } });
  } else {
    const ma = await dem("doi_tac", "DT", 4);
    const { error } = await sb().from("doi_tac_gt").insert({ ...row, ma, ma_gioi_thieu: `GT${Math.random().toString(36).slice(2, 7).toUpperCase()}` });
    if (error) return { loi: thongBaoLoi(error) };
  }
  lamMoi();
  revalidatePath("/hoa-hong");
  if (id) revalidatePath(`/marketing/doi-tac/${id}`);
  return { ok: true };
}

export async function luuLink(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten"), den = chuoi(fd, "dich_den");
  if (!ten || !/^(https?:\/\/|\/(?!\/))/.test(den) || /\s/.test(den)) return { loi: "Nhập tên và địa chỉ đích bắt đầu bằng https:// hoặc / (đường dẫn trong phần mềm)." };
  const ma = chuoi(fd, "ma").toLowerCase();
  if (!id && !/^[a-z0-9-]{3,40}$/.test(ma)) return { loi: "Mã link gồm 3–40 ký tự: chữ thường không dấu, số, gạch ngang." };
  const row = { ten, dich_den: den, nguon_id: chuoiHoacNull(fd, "nguon_id"), chien_dich_id: chuoiHoacNull(fd, "chien_dich_id"), doi_tac_id: chuoiHoacNull(fd, "doi_tac_id"), hoat_dong: chuoi(fd, "hoat_dong") !== "0" };
  const { error } = id ? await sb().from("link_theo_doi").update(row).eq("id", id) : await sb().from("link_theo_doi").insert({ ...row, ma, nguoi_id: nd.nhanVienId });
  if (error) return { loi: error.code === "23505" ? "Mã link đã tồn tại." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function luuNguonLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten"), loai = chuoi(fd, "loai") || "nguon_ngoai";
  if (!ten) return { loi: "Nhập tên nguồn." };
  if (!["nguon_ngoai", "doi_tac"].includes(loai)) return { loi: "Chọn loại nguồn." };
  const { error } = id ? await sb().from("nguon_lead").update({ ten, loai, hoat_dong: chuoi(fd, "hoat_dong") !== "0" }).eq("id", id)
    : await sb().from("nguon_lead").insert({ ma: `n${Date.now().toString(36)}`, ten, loai, nhom: loai === "doi_tac" ? "gioi_thieu" : "khac", thu_tu: 99 });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}
