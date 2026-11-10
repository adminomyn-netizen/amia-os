"use server";

// Hộp Lead dạng pipeline (M3, 0313): đổi giai đoạn (kéo thả), sửa tại ô, người hỗ trợ, hoạt động ghi tay, tác vụ, nhắc việc, tệp, gắn hồ sơ khách, cấu hình cột & nguồn.
// Mỗi hành động kiểm quyền ở máy chủ (kiemQuyen chặn cả vai Chỉ xem) + kiểm lead cùng chi nhánh và người được sửa (lib/lead-quyen).
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuoi, chuoiHoacNull, so } from "@/lib/form";
import { chuanSdt, coSdtHopLe, homNayHCM } from "@/lib/dinh-dang";
import { layLeadChoXuLy, layLeadDuocXem, nguoiCuaLead } from "@/lib/lead-quyen";
import { HOAT_DONG_GHI_TAY, KHO_LEAD_TEP, NHAN_TEP, SO_TEP_TAI_TAY, kiemTraTepLead, loaiTepLead } from "@/lib/lead";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/marketing/lead", "layout"); revalidatePath("/trang-chu"); };
const LA_UUID = /^[0-9a-f-]{36}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const KHONG_SUA = "Chỉ người phụ trách, người hỗ trợ hoặc người duyệt mới sửa được lead này.";
const ghi = (leadId: string, loai: string, noiDung: string, nguoi: string) => sb().from("lead_hoat_dong").insert({ lead_id: leadId, loai, noi_dung: noiDung, nguoi_id: nguoi });

// ─── Giai đoạn ──────────────────────────────────────────────────────────────
/** Kéo thả / chọn giai đoạn. Sang Thua phải chọn lý do trong danh mục; từ Thắng/Thua về cột mở = mở lại lead. */
export async function doiGiaiDoan(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const gdId = chuoi(fd, "giai_doan_id");
  if (gdId === lead.giai_doan_id) return { ok: true };
  const db = sb();
  const { data: gd } = await db.from("lead_giai_doan").select("id, la_thua, dang_dung").eq("id", gdId).maybeSingle();
  if (!gd || !gd.dang_dung) return { loi: "Cột không hợp lệ hoặc đã ngừng dùng." };
  const doi: { giai_doan_id: string; sua_boi: string; ly_do_thua_id?: string | null; trang_thai_phan_bo?: string } = { giai_doan_id: gd.id, sua_boi: nd.nhanVienId };
  if (gd.la_thua) {
    const ld = chuoi(fd, "ly_do_thua_id");
    const { data: r } = LA_UUID.test(ld) ? await db.from("lead_ly_do_thua").select("id").eq("id", ld).eq("dang_dung", true).maybeSingle() : { data: null };
    if (!r) return { loi: "Chọn lý do thua." };
    doi.ly_do_thua_id = r.id;
  } else if (["lead_trung", "khong_hop_le"].includes(lead.trang_thai_phan_bo)) {
    doi.trang_thai_phan_bo = lead.owner_id ? "da_xac_nhan" : "cho_tiep_nhan"; // mở lại lead đã đánh dấu trùng / không hợp lệ
  }
  const { error } = await db.from("lead").update(doi).eq("id", lead.id);
  if (error) return { loi: error.code === "23505" ? "Số này đang có lead khác còn mở, không mở lại được." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

type Doi = Record<string, string | number | null>;
const SUA_DUOC = ["ho_ten", "sdt", "email", "gia_tri_du_kien", "nguon_id", "doi_tac_id", "dich_vu_quan_tam", "nhu_cau"] as const;
/** Kiểm một ô người dùng sửa; trả phần cần ghi hoặc lỗi. Chỉ các trường trong SUA_DUOC. */
async function kiemTruong(truong: string, gt: string): Promise<{ doi: Doi } | { loi: string }> {
  const db = sb();
  if (truong === "ho_ten") return !gt || gt.length > 120 ? { loi: "Nhập họ tên." } : { doi: { ho_ten: gt } };
  if (truong === "sdt") { const s = chuanSdt(gt); return coSdtHopLe(s) ? { doi: { sdt: s } } : { loi: "Số điện thoại chưa hợp lệ (bắt đầu bằng 0, 10–11 số)." }; }
  if (truong === "email") { const e = gt.toLowerCase(); return e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? { loi: "Email chưa hợp lệ." } : { doi: { email: e || null } }; }
  if (truong === "gia_tri_du_kien") { const n = Number(gt.replace(/[^\d]/g, "")) || 0; return { doi: { gia_tri_du_kien: Math.max(0, Math.round(n)) } }; }
  if (truong === "nguon_id") {
    const { data: ng } = LA_UUID.test(gt) ? await db.from("nguon_lead").select("id").eq("id", gt).eq("hoat_dong", true).maybeSingle() : { data: null };
    return ng ? { doi: { nguon_id: ng.id } } : { loi: "Nguồn không hợp lệ hoặc đã ngừng." };
  }
  if (truong === "doi_tac_id") {
    if (!gt) return { doi: { doi_tac_id: null } };
    const { data: dt } = LA_UUID.test(gt) ? await db.from("doi_tac_gt").select("id").eq("id", gt).eq("hoat_dong", true).maybeSingle() : { data: null };
    return dt ? { doi: { doi_tac_id: dt.id } } : { loi: "Người giới thiệu không hợp lệ hoặc đã ngừng." };
  }
  if (truong === "dich_vu_quan_tam" || truong === "nhu_cau") return { doi: { [truong]: gt.slice(0, 1000) || null } };
  return { loi: "Ô này không sửa được." };
}

/** Sửa tại ô (chế độ Bảng): một trường mỗi lần. */
export async function suaOLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const kq = await kiemTruong(chuoi(fd, "truong"), chuoi(fd, "gia_tri"));
  if ("loi" in kq) return { loi: kq.loi };
  const { error } = await sb().from("lead").update({ ...kq.doi, sua_boi: nd.nhanVienId }).eq("id", lead.id);
  if (error) return { loi: error.code === "23505" ? "Số này đang có lead khác còn mở." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Sửa thông tin lead (hộp thoại ở tab Thông tin): các trường gửi lên đều được kiểm như sửa tại ô. */
export async function suaThongTinLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  let doi: Doi = {};
  for (const t of SUA_DUOC) {
    if (!fd.has(t)) continue;
    const kq = await kiemTruong(t, chuoi(fd, t));
    if ("loi" in kq) return { loi: kq.loi };
    doi = { ...doi, ...kq.doi };
  }
  const { error } = await sb().from("lead").update({ ...doi, sua_boi: nd.nhanVienId }).eq("id", lead.id);
  if (error) return { loi: error.code === "23505" ? "Số này đang có lead khác còn mở." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Người hỗ trợ ───────────────────────────────────────────────────────────
export async function themHoTro(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const nv = chuoi(fd, "nhan_vien_id");
  const db = sb();
  const { data: n } = LA_UUID.test(nv) ? await db.from("nhan_vien").select("id, ho_ten").eq("id", nv).eq("hoat_dong", true).maybeSingle() : { data: null };
  if (!n) return { loi: "Chọn nhân viên." };
  const { error } = await db.from("lead_nguoi_ho_tro").insert({ lead_id: lead.id, nhan_vien_id: n.id, them_boi: nd.nhanVienId });
  if (error) return { loi: error.code === "23505" ? "Người này đã là người hỗ trợ." : thongBaoLoi(error) };
  await ghi(lead.id, "ho_tro", `Thêm người hỗ trợ ${n.ho_ten}`, nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

export async function goHoTro(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const nv = chuoi(fd, "nhan_vien_id");
  const db = sb();
  const { data, error } = await db.from("lead_nguoi_ho_tro").delete().eq("lead_id", lead.id).eq("nhan_vien_id", nv).select("nhan_vien_id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Người này không còn trong danh sách hỗ trợ." };
  const { data: n } = await db.from("nhan_vien").select("ho_ten").eq("id", nv).maybeSingle();
  await ghi(lead.id, "ho_tro", `Bỏ người hỗ trợ ${n?.ho_ten ?? ""}`, nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

// ─── Hoạt động ghi tay ──────────────────────────────────────────────────────
export async function ghiHoatDong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const loai = chuoi(fd, "loai"), nd2 = chuoi(fd, "noi_dung").slice(0, 2000);
  if (!HOAT_DONG_GHI_TAY.some((x) => x.gia_tri === loai)) return { loi: "Chọn loại: Ghi chú, Gọi hoặc Nhắn tin." };
  if (!nd2) return { loi: "Nhập nội dung." };
  const { error } = await ghi(lead.id, loai, nd2, nd.nhanVienId);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Tác vụ (mỗi tác vụ có một việc ở Nơi làm việc › Việc cần làm) ─────────
export async function taoTacVu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const ten = chuoi(fd, "ten").slice(0, 200), giao = chuoi(fd, "giao_cho_id"), han = chuoiHoacNull(fd, "han");
  if (!ten) return { loi: "Nhập tên tác vụ." };
  if (!(await nguoiCuaLead(lead.id, lead.owner_id)).includes(giao)) return { loi: "Chỉ giao cho người phụ trách hoặc người hỗ trợ của lead." };
  if (han && (!NGAY.test(han) || han < homNayHCM())) return { loi: "Hạn không được ở quá khứ." };
  const db = sb();
  const { data: cv, error: e1 } = await db.from("cong_viec").insert({
    tieu_de: `${ten} · Lead ${lead.ma}`, mo_ta: `Lead ${lead.ma} · ${lead.ho_ten} · ${lead.sdt}\nMở lead: /marketing/lead/${lead.id}`,
    nguoi_giao_id: nd.nhanVienId, nguoi_nhan_id: giao, han,
  }).select("id").single();
  if (e1 || !cv) return { loi: thongBaoLoi(e1) };
  const { error } = await db.from("lead_tac_vu").insert({ lead_id: lead.id, ten, giao_cho_id: giao, han, cong_viec_id: cv.id, tao_boi: nd.nhanVienId });
  if (error) { await db.from("cong_viec").delete().eq("id", cv.id); return { loi: thongBaoLoi(error) }; }
  await ghi(lead.id, "tac_vu", `Tạo tác vụ: ${ten}`, nd.nhanVienId);
  lamMoi();
  revalidatePath("/noi-lam-viec", "layout");
  return { ok: true };
}

export async function dongTacVu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: tv } = LA_UUID.test(chuoi(fd, "id")) ? await db.from("lead_tac_vu").select("id, lead_id, ten, trang_thai").eq("id", chuoi(fd, "id")).maybeSingle() : { data: null };
  if (!tv) return { loi: "Không tìm thấy tác vụ." };
  const lead = await layLeadChoXuLy(tv.lead_id, nd);
  if (!lead) return { loi: KHONG_SUA };
  const tt = chuoi(fd, "trang_thai");
  if (!["xong", "huy"].includes(tt)) return { loi: "Thao tác không hợp lệ." };
  const { data, error } = await db.from("lead_tac_vu").update({ trang_thai: tt, dong_boi: nd.nhanVienId, dong_luc: new Date().toISOString() }).eq("id", tv.id).eq("trang_thai", "mo").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Tác vụ đã đóng." };
  await ghi(lead.id, "tac_vu", `${tt === "xong" ? "Hoàn thành" : "Hủy"} tác vụ: ${tv.ten}`, nd.nhanVienId);
  lamMoi();
  revalidatePath("/noi-lam-viec", "layout");
  return { ok: true };
}

// ─── Nhắc việc ──────────────────────────────────────────────────────────────
export async function taoNhac(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const noiDung = chuoi(fd, "noi_dung").slice(0, 500), ngay = chuoi(fd, "ngay"), gio = chuoi(fd, "gio") || "08:00", cho = chuoi(fd, "nhac_cho_id");
  if (!noiDung) return { loi: "Nhập nội dung nhắc." };
  if (!NGAY.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) return { loi: "Chọn ngày và giờ nhắc." };
  const luc = new Date(`${ngay}T${gio}:00+07:00`);
  if (Number.isNaN(luc.getTime()) || luc.getTime() < Date.now() - 60000) return { loi: "Thời điểm nhắc phải ở tương lai." };
  if (!(await nguoiCuaLead(lead.id, lead.owner_id)).includes(cho)) return { loi: "Chỉ nhắc cho người phụ trách hoặc người hỗ trợ của lead." };
  const { error } = await sb().from("lead_nhac").insert({ lead_id: lead.id, noi_dung: noiDung, nhac_luc: luc.toISOString(), nhac_cho_id: cho, tao_boi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  await ghi(lead.id, "nhac", `Đặt nhắc ${gio} ${ngay.split("-").reverse().join("/")}: ${noiDung}`, nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

export async function dongNhac(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: n } = LA_UUID.test(chuoi(fd, "id")) ? await db.from("lead_nhac").select("id, lead_id, noi_dung, nhac_cho_id").eq("id", chuoi(fd, "id")).maybeSingle() : { data: null };
  if (!n) return { loi: "Không tìm thấy nhắc việc." };
  const lead = n.nhac_cho_id === nd.nhanVienId ? await layLeadDuocXem(n.lead_id, nd) : await layLeadChoXuLy(n.lead_id, nd);
  if (!lead) return { loi: KHONG_SUA };
  const tt = chuoi(fd, "trang_thai");
  if (!["xong", "huy"].includes(tt)) return { loi: "Thao tác không hợp lệ." };
  const { data, error } = await db.from("lead_nhac").update({ trang_thai: tt, dong_luc: new Date().toISOString() }).eq("id", n.id).eq("trang_thai", "cho").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Nhắc việc đã đóng." };
  await ghi(lead.id, "nhac", `${tt === "xong" ? "Đã xử lý" : "Hủy"} nhắc: ${n.noi_dung}`, nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

// ─── Hồ sơ khách ────────────────────────────────────────────────────────────
/** Xác nhận đúng khách (khớp SĐT) — gắn tay, không tự gộp. */
export async function ganKhachLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  if (lead.khach_id) return { loi: "Lead đã gắn hồ sơ khách." };
  const kh = chuoi(fd, "khach_id");
  const { data: k } = LA_UUID.test(kh) ? await sb().from("khach_hang").select("id, dien_thoai").eq("id", kh).maybeSingle() : { data: null };
  if (!k || k.dien_thoai !== lead.sdt) return { loi: "Chỉ gắn được hồ sơ khách có cùng số điện thoại." };
  const { error } = await sb().from("lead").update({ khach_id: k.id, sua_boi: nd.nhanVienId }).eq("id", lead.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Tệp (kho riêng tư lead-tep; tải lên thẳng bằng link ký, máy chủ kiểm lại rồi mới ghi) ─
export async function xinLinkTepLead(fd: FormData): Promise<KQ & { duongDan?: string; token?: string }> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const ten = chuoi(fd, "ten_tep");
  const sai = kiemTraTepLead(ten, Number(chuoi(fd, "kich_thuoc")));
  if (sai) return { loi: sai };
  const { count } = await sb().from("lead_tep").select("id", { count: "exact", head: true }).eq("lead_id", lead.id).eq("nguon", "tai_tay");
  if ((count ?? 0) >= SO_TEP_TAI_TAY) return { loi: `Mỗi lead tối đa ${SO_TEP_TAI_TAY} tệp tải tay. Xoá bớt tệp cũ trước.` };
  const duongDan = `${lead.id}/${randomUUID()}.${loaiTepLead(ten)!.duoi}`;
  const { data, error } = await createAdminClient().storage.from(KHO_LEAD_TEP).createSignedUploadUrl(duongDan);
  if (error || !data) return { loi: "Chưa mở được kho tệp. Thử lại sau." };
  return { ok: true, duongDan, token: data.token } as KQ & { duongDan: string; token: string };
}

export async function xacNhanTepLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const lead = await layLeadChoXuLy(chuoi(fd, "id"), nd);
  if (!lead) return { loi: KHONG_SUA };
  const duongDan = chuoi(fd, "duong_dan"), tenTep = chuoi(fd, "ten_tep").slice(0, 200) || "tep", nhan = chuoi(fd, "nhan") || "khac";
  if (!duongDan.startsWith(`${lead.id}/`) || duongDan.includes("..") || !(nhan in NHAN_TEP)) return { loi: "Dữ liệu không hợp lệ." };
  const kho = createAdminClient().storage.from(KHO_LEAD_TEP);
  const ten = duongDan.slice(lead.id.length + 1);
  const { data: ds } = await kho.list(lead.id, { search: ten, limit: 5 });
  const tep = (ds ?? []).find((x) => x.name === ten);
  if (!tep) return { loi: "Chưa thấy tệp trong kho. Thử tải lại." };
  const kichThuoc = Number((tep.metadata as { size?: number } | undefined)?.size ?? 0);
  const sai = kiemTraTepLead(tenTep, kichThuoc);
  if (sai) { await kho.remove([duongDan]); return { loi: sai }; }
  const { error } = await sb().from("lead_tep").insert({ lead_id: lead.id, ten: tenTep, duong_dan: duongDan, mime: loaiTepLead(tenTep)?.mime ?? null, kich_thuoc: kichThuoc, nhan, tao_boi: nd.nhanVienId });
  if (error) { await kho.remove([duongDan]); return { loi: thongBaoLoi(error) }; }
  await ghi(lead.id, "tep", `Tải tệp ${tenTep}`, nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

export async function doiNhanTep(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: t } = LA_UUID.test(chuoi(fd, "id")) ? await db.from("lead_tep").select("id, lead_id").eq("id", chuoi(fd, "id")).maybeSingle() : { data: null };
  if (!t || !(await layLeadChoXuLy(t.lead_id, nd))) return { loi: KHONG_SUA };
  const nhan = chuoi(fd, "nhan"), ten = chuoi(fd, "ten").slice(0, 200);
  if (!(nhan in NHAN_TEP)) return { loi: "Chọn nhãn." };
  const { error } = await db.from("lead_tep").update({ nhan, ...(ten ? { ten } : {}) }).eq("id", t.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function xoaTepLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lead.xu_ly");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: t } = LA_UUID.test(chuoi(fd, "id")) ? await db.from("lead_tep").select("id, lead_id, ten, duong_dan").eq("id", chuoi(fd, "id")).maybeSingle() : { data: null };
  if (!t) return { loi: "Không tìm thấy tệp." };
  const lead = await layLeadChoXuLy(t.lead_id, nd);
  if (!lead) return { loi: KHONG_SUA };
  const { error } = await db.from("lead_tep").delete().eq("id", t.id);
  if (error) return { loi: thongBaoLoi(error) };
  await createAdminClient().storage.from(KHO_LEAD_TEP).remove([t.duong_dan]);
  await ghi(lead.id, "tep", `Xoá tệp ${t.ten}`, nd.nhanVienId);
  lamMoi();
  return { ok: true };
}

// ─── Cấu hình cột & nguồn & lý do thua & phụ trách theo chi nhánh ──────────
/** thao_tac: them | sua | len | xuong | ngung | dung_lai; phiên bản cũ thì báo "người khác vừa thay đổi". */
export async function cauHinhCot(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tt = chuoi(fd, "thao_tac"), id = chuoi(fd, "id"), sla = chuoi(fd, "sla_phut");
  if (!["them", "sua", "len", "xuong", "ngung", "dung_lai"].includes(tt) || (tt !== "them" && !LA_UUID.test(id))) return { loi: "Thao tác không hợp lệ." };
  const { error } = await sb().rpc("lead_gd_cau_hinh", {
    p_phien_ban: Number(chuoi(fd, "phien_ban")), p_thao_tac: tt, p_id: (tt === "them" ? null : id) as unknown as string,
    p_ten: (chuoiHoacNull(fd, "ten")) as unknown as string, p_mau: (chuoiHoacNull(fd, "mau")) as unknown as string,
    p_sla: (sla === "" || sla === "0" ? null : Math.round(so(fd, "sla_phut"))) as unknown as number,
  });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function luuLyDoThua(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten").slice(0, 80);
  if (!ten) return { loi: "Nhập lý do." };
  const db = sb();
  const { error } = id ? await db.from("lead_ly_do_thua").update({ ten, dang_dung: chuoi(fd, "dang_dung") !== "0" }).eq("id", id)
    : await db.from("lead_ly_do_thua").insert({ ten, thu_tu: 99 });
  if (error) return { loi: error.code === "23505" ? "Lý do này đã có." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Phụ trách lead theo chi nhánh: lead mới chưa có người phụ trách của chi nhánh tự giao người này (trigger 0313). */
export async function datPhuTrachLead(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cn = chuoi(fd, "chi_nhanh_id"), nv = chuoi(fd, "nhan_vien_id");
  if (!LA_UUID.test(cn) || (nd.chiNhanhId && nd.chiNhanhId !== cn)) return { loi: "Chi nhánh không hợp lệ." };
  const db = sb();
  if (nv) {
    const { data: n } = LA_UUID.test(nv) ? await db.from("nhan_vien").select("id").eq("id", nv).eq("hoat_dong", true).maybeSingle() : { data: null };
    if (!n) return { loi: "Chọn nhân viên đang làm." };
  }
  const { error } = await db.from("chi_nhanh").update({ phu_trach_lead_id: nv || null }).eq("id", cn);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}
