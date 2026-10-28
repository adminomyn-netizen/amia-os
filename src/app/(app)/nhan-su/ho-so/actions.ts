"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, kiemQuyen, KHONG_DU_QUYEN, type NguoiDung } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { sb, thongBaoLoi } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuoi, chuoiHoacNull, mang } from "@/lib/form";
import { KHO_HO_SO, quyenHoSo } from "@/lib/data-ho-so";
import { guiChoNhanVien } from "@/lib/push";
import {
  LOAI_TAI_LIEU, NHOM_HO_SO, NHOM_LY_DO_NGHI, QUAN_HE_THAN_NHAN, TRANG_THAI_TAI_LIEU, VAI_TRO_CHUYEN_MON, duoiTep, kiemTraHoSo, kiemTraTep,
} from "@/lib/ho-so";

type KQ = { ok?: true; loi?: string };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const lamMoi = (id?: string) => { if (id) revalidatePath(`/nhan-su/ho-so/${id}`); revalidatePath("/nhan-su", "layout"); revalidatePath("/nhan-vien"); };

async function nguoiVaQuyen(nhanVienId: string) {
  const nd = await layNguoiDungHienTai();
  if (!nd || !uuid(nhanVienId)) return null;
  const q = await quyenHoSo(nd, nhanVienId);
  return q.xem ? { nd, ...q } : null;
}

/** Lưu MỘT NHÓM trường hồ sơ (cá nhân / giấy tờ / liên hệ khẩn / học vấn / nhận lương). Trường trống = xoá giá trị. Chính chủ và HCNS đều sửa được. */
export async function luuHoSoNhom(fd: FormData): Promise<KQ> {
  const nhanVienId = chuoi(fd, "nhan_vien_id");
  const ctx = await nguoiVaQuyen(nhanVienId);
  if (!ctx) return { loi: KHONG_DU_QUYEN };
  const nhom = NHOM_HO_SO.find((n) => n.ma === chuoi(fd, "nhom"));
  if (!nhom) return { loi: "Nhóm thông tin không đúng." };
  const v: Record<string, string> = {};
  for (const t of nhom.truong) {
    v[t.ten] = chuoi(fd, t.ten).slice(0, t.rong ? 300 : 120);
    if (t.loai === "chon" && v[t.ten] && !t.luaChon!.includes(v[t.ten])) return { loi: `${t.nhan} chưa đúng.` };
  }
  const loi = kiemTraHoSo(v);
  if (loi) return { loi };
  const du = Object.fromEntries(nhom.truong.map((t) => [t.ten, v[t.ten] || null]));
  const { error } = await sb().from("nhan_vien_ho_so").upsert({ nhan_vien_id: nhanVienId, ...du, cap_nhat_luc: new Date().toISOString(), cap_nhat_boi: ctx.nd.nhanVienId }, { onConflict: "nhan_vien_id" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(nhanVienId);
  return { ok: true };
}

/** HCNS cập nhật thông tin công việc của một người: chức danh, phòng ban, chi nhánh, ngày vào, khung chấm công, vai trò chuyên môn, điện thoại. (Vai trò hệ thống/quyền vẫn chỉ ở Tài khoản & phân quyền.) */
export async function luuThongTinCongViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "nhan_vien_id");
  const ctx = await nguoiVaQuyen(id);
  if (!ctx || !ctx.quanTri) return { loi: KHONG_DU_QUYEN };
  const vao = chuoiHoacNull(fd, "ngay_vao_lam"), chinh = chuoiHoacNull(fd, "ngay_vao_chinh_thuc");
  if ((vao && !NGAY.test(vao)) || (chinh && !NGAY.test(chinh))) return { loi: "Ngày vào làm / vào chính thức chưa đúng." };
  if (vao && chinh && chinh < vao) return { loi: "Ngày vào chính thức không thể trước ngày vào làm." };
  const khung = chuoi(fd, "khung_lam_viec");
  if (khung && !["van_phong", "chi_nhanh", "khong_cham_cong"].includes(khung)) return { loi: "Khung làm việc chưa đúng." };
  const mon = mang(fd, "vai_tro_chuyen_mon").filter((m) => m in VAI_TRO_CHUYEN_MON);
  const cn = chuoiHoacNull(fd, "chi_nhanh_id");
  if (nd.chiNhanhId && cn !== nd.chiNhanhId) return { loi: "Bạn chỉ được xếp người vào chi nhánh của mình." };
  const du: TablesUpdate<"nhan_vien"> = {
    chuc_danh: chuoiHoacNull(fd, "chuc_danh"), phong_ban_id: chuoiHoacNull(fd, "phong_ban_id"), chi_nhanh_id: cn, ngay_vao_lam: vao, ngay_vao_chinh_thuc: chinh,
    dien_thoai: chuoiHoacNull(fd, "dien_thoai"), vai_tro_chuyen_mon: mon,
  };
  if (khung) du.khung_lam_viec = khung as "van_phong";
  const { error } = await sb().from("nhan_vien").update(du).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(id);
  return { ok: true };
}

// ─── Người thân ─────────────────────────────────────────────────────────────
export async function themThanNhan(fd: FormData): Promise<KQ> {
  const nhanVienId = chuoi(fd, "nhan_vien_id");
  if (!(await nguoiVaQuyen(nhanVienId))) return { loi: KHONG_DU_QUYEN };
  const hoTen = chuoi(fd, "ho_ten").slice(0, 120), quanHe = chuoi(fd, "quan_he"), ns = chuoi(fd, "ngay_sinh"), cccd = chuoi(fd, "cccd").slice(0, 20);
  if (hoTen.length < 2) return { loi: "Nhập họ tên người thân." };
  if (!(QUAN_HE_THAN_NHAN as readonly string[]).includes(quanHe)) return { loi: "Chọn quan hệ." };
  const loi = kiemTraHoSo({ ngay_sinh: ns, cccd });
  if (loi) return { loi };
  const { error } = await sb().from("nhan_vien_than_nhan").insert({ nhan_vien_id: nhanVienId, ho_ten: hoTen, quan_he: quanHe, ngay_sinh: ns || null, cccd: cccd || null, phu_thuoc: fd.get("phu_thuoc") === "1" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(nhanVienId);
  return { ok: true };
}

export async function xoaThanNhan(fd: FormData): Promise<KQ> {
  const nhanVienId = chuoi(fd, "nhan_vien_id"), id = chuoi(fd, "id");
  if (!(await nguoiVaQuyen(nhanVienId)) || !uuid(id)) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("nhan_vien_than_nhan").delete().eq("id", id).eq("nhan_vien_id", nhanVienId);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(nhanVienId);
  return { ok: true };
}

// ─── Giấy tờ scan ───────────────────────────────────────────────────────────
/** Bước 1: kiểm loại/dung lượng rồi cấp link tải lên trực tiếp vào kho riêng tư (tệp không đi qua máy chủ app). */
export async function xinLinkTaiLen(fd: FormData): Promise<KQ & { duongDan?: string; token?: string }> {
  const nhanVienId = chuoi(fd, "nhan_vien_id");
  if (!(await nguoiVaQuyen(nhanVienId))) return { loi: KHONG_DU_QUYEN };
  const loai = chuoi(fd, "loai"), mime = chuoi(fd, "mime"), kichThuoc = Number(chuoi(fd, "kich_thuoc"));
  if (!(LOAI_TAI_LIEU as readonly string[]).includes(loai)) return { loi: "Chọn loại giấy tờ." };
  const sai = kiemTraTep(mime, kichThuoc);
  if (sai) return { loi: sai };
  const duongDan = `${nhanVienId}/${randomUUID()}.${duoiTep(mime)}`;
  const { data, error } = await createAdminClient().storage.from(KHO_HO_SO).createSignedUploadUrl(duongDan);
  if (error || !data) return { loi: "Chưa mở được kho tệp. Thử lại sau." };
  return { ok: true, duongDan, token: data.token } as KQ & { duongDan: string; token: string };
}

/** Bước 2: sau khi tệp đã lên kho, kiểm tệp có thật (đúng loại, đúng dung lượng kho ghi nhận) rồi mới ghi vào hồ sơ. */
export async function xacNhanTaiLen(fd: FormData): Promise<KQ> {
  const nhanVienId = chuoi(fd, "nhan_vien_id");
  const ctx = await nguoiVaQuyen(nhanVienId);
  if (!ctx) return { loi: KHONG_DU_QUYEN };
  const duongDan = chuoi(fd, "duong_dan"), loai = chuoi(fd, "loai"), tenTep = chuoi(fd, "ten_tep").slice(0, 200) || "tai-lieu";
  if (!duongDan.startsWith(`${nhanVienId}/`) || duongDan.includes("..") || !(LOAI_TAI_LIEU as readonly string[]).includes(loai)) return { loi: "Dữ liệu không hợp lệ." };
  const db = sb(), kho = createAdminClient().storage.from(KHO_HO_SO);
  const ten = duongDan.slice(nhanVienId.length + 1);
  const { data: ds } = await kho.list(nhanVienId, { search: ten, limit: 5 });
  const tep = (ds ?? []).find((x) => x.name === ten);
  if (!tep) return { loi: "Chưa thấy tệp trong kho. Thử tải lại." };
  const meta = tep.metadata as { mimetype?: string; size?: number } | undefined;
  const mime = meta?.mimetype ?? "", size = Number(meta?.size ?? 0);
  const sai = kiemTraTep(mime, size);
  if (sai) { await kho.remove([duongDan]); return { loi: sai }; }
  // HCNS tải hộ thì coi như đã được xác nhận; nhân viên tự tải thì chờ HCNS xác nhận.
  const { error } = await db.from("nhan_vien_tai_lieu").insert({ nhan_vien_id: nhanVienId, loai, ten_tep: tenTep, duong_dan: duongDan, mime, kich_thuoc: size, tai_boi: ctx.nd.nhanVienId, trang_thai: ctx.quanTri && !ctx.chinhChu ? "Đã xác nhận" : "Chờ xác nhận" });
  if (error) { await kho.remove([duongDan]); return { loi: thongBaoLoi(error) }; }
  lamMoi(nhanVienId);
  return { ok: true };
}

/** HCNS xác nhận giấy tờ hợp lệ hoặc yêu cầu bổ sung (kèm ghi chú). Không tự xác nhận giấy tờ của chính mình. */
export async function doiTrangThaiTaiLieu(fd: FormData): Promise<KQ> {
  const id = chuoi(fd, "id"), den = chuoi(fd, "den"), ghiChu = chuoi(fd, "ghi_chu").slice(0, 300);
  if (!uuid(id) || !(TRANG_THAI_TAI_LIEU as readonly string[]).includes(den)) return { loi: "Dữ liệu không hợp lệ." };
  const db = sb();
  const { data: tl } = await db.from("nhan_vien_tai_lieu").select("nhan_vien_id").eq("id", id).maybeSingle();
  const ctx = tl && (await nguoiVaQuyen(tl.nhan_vien_id));
  if (!tl || !ctx || !ctx.quanTri) return { loi: KHONG_DU_QUYEN };
  if (ctx.chinhChu && !coQuyen(ctx.nd, "hethong.phanquyen")) return { loi: "Giấy tờ của chính mình cần người khác xác nhận." };
  if (den === "Cần bổ sung" && ghiChu.length < 3) return { loi: "Ghi rõ cần bổ sung gì." };
  const { error } = await db.from("nhan_vien_tai_lieu").update({ trang_thai: den, ghi_chu: ghiChu || null }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  if (den === "Cần bổ sung") await guiChoNhanVien([tl.nhan_vien_id], { tieuDe: "Hồ sơ cần bổ sung giấy tờ", noiDung: ghiChu, url: "/nhan-su/ho-so-cua-toi?tab=giay-to" }).catch(() => undefined);
  lamMoi(tl.nhan_vien_id);
  return { ok: true };
}

/** Gỡ giấy tờ khỏi hồ sơ (kèm lý do). Không xoá cứng: tệp vẫn nằm trong kho để truy vết. Nhân viên chỉ gỡ tệp mình tải khi chưa được xác nhận. */
export async function goTaiLieu(fd: FormData): Promise<KQ> {
  const id = chuoi(fd, "id"), lyDo = chuoi(fd, "ly_do").slice(0, 300);
  if (!uuid(id)) return { loi: "Thiếu mã giấy tờ." };
  const db = sb();
  const { data: tl } = await db.from("nhan_vien_tai_lieu").select("nhan_vien_id, trang_thai").eq("id", id).maybeSingle();
  const ctx = tl && (await nguoiVaQuyen(tl.nhan_vien_id));
  if (!tl || !ctx) return { loi: KHONG_DU_QUYEN };
  if (!ctx.quanTri && tl.trang_thai === "Đã xác nhận") return { loi: "Giấy tờ đã được HCNS xác nhận, nhờ HCNS gỡ nếu cần." };
  if (lyDo.length < 3) return { loi: "Ghi lý do gỡ (từ 3 ký tự)." };
  const { error } = await db.from("nhan_vien_tai_lieu").update({ da_go: true, go_luc: new Date().toISOString(), go_boi: ctx.nd.nhanVienId, ly_do_go: lyDo }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(tl.nhan_vien_id);
  return { ok: true };
}

// ─── Lộ trình thăng tiến (Lark 1.6 / 1.10) ──────────────────────────────────
/** Ghi một mốc lộ trình: chức danh / phòng ban / vị trí / loại thay đổi, đi cùng điều kiện lương hiện hành (nếu có) — mỗi lần điều chỉnh là MỘT dòng mới có hiệu lực theo ngày. */
export async function luuLoTrinh(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), tu = chuoi(fd, "hieu_luc_tu"), loai = chuoi(fd, "loai_thay_doi");
  if (!(await nguoiVaQuyen(nv)) || !NGAY.test(tu)) return { loi: "Chọn ngày hiệu lực." };
  const db = sb();
  const { data: cu } = await db.from("dieu_kien_luong").select("*").eq("nhan_vien_id", nv).lte("hieu_luc_tu", tu).order("hieu_luc_tu", { ascending: false }).limit(1).maybeSingle();
  const chucDanh = chuoiHoacNull(fd, "chuc_danh"), pb = chuoiHoacNull(fd, "phong_ban_id");
  const luong = coQuyen(nd, "luong.sua");
  const goc = cu ? { tinh_trang: cu.tinh_trang, luong_co_ban: cu.luong_co_ban, thu_nhap_chuc_danh: cu.thu_nhap_chuc_danh, ty_le_thu_viec: cu.ty_le_thu_viec, dong_bh: cu.dong_bh, luong_dong_bh: cu.luong_dong_bh, an_ca_ngay: cu.an_ca_ngay, dong_phuc_cap: cu.dong_phuc_cap, nha_o_cap: cu.nha_o_cap, so_npt: cu.so_npt } : { tinh_trang: "chinh_thuc", luong_co_ban: 0 };
  if (!luong && !cu) return { loi: "Người này chưa có điều kiện lương; nhờ người phụ trách lương cài trước." };
  const { error } = await db.from("dieu_kien_luong").upsert({
    ...goc, nhan_vien_id: nv, hieu_luc_tu: tu, chuc_danh: chucDanh, phong_ban_id: pb, vi_tri: chuoiHoacNull(fd, "vi_tri"), loai_thay_doi: loai || null, so_quyet_dinh: chuoiHoacNull(fd, "so_quyet_dinh"),
    ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId,
  }, { onConflict: "nhan_vien_id,hieu_luc_tu" });
  if (error) return { loi: thongBaoLoi(error) };
  // Mốc mới nhất tới hôm nay cũng là chức danh/phòng ban đang hiển thị trên hồ sơ.
  const { data: moi } = await db.from("dieu_kien_luong").select("chuc_danh, phong_ban_id, hieu_luc_tu").eq("nhan_vien_id", nv).order("hieu_luc_tu", { ascending: false }).limit(1).maybeSingle();
  if (moi && moi.hieu_luc_tu === tu) await db.from("nhan_vien").update({ ...(chucDanh ? { chuc_danh: chucDanh } : {}), ...(pb ? { phong_ban_id: pb } : {}) }).eq("id", nv);
  lamMoi(nv);
  return { ok: true };
}

// ─── Danh mục phòng ban / chức danh ─────────────────────────────────────────
export async function luuPhongBan(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("hr.hoso"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten").slice(0, 80), tp = chuoiHoacNull(fd, "truong_phong_id");
  if (ten.length < 2) return { loi: "Nhập tên phòng ban." };
  const du = { ten, truong_phong_id: tp, hoat_dong: fd.get("hoat_dong") !== "0" };
  const { error } = id ? await sb().from("phong_ban").update(du).eq("id", id) : await sb().from("phong_ban").insert(du);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  revalidatePath("/nhan-su/danh-muc");
  return { ok: true };
}
export async function luuChucDanh(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("hr.hoso"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten").slice(0, 80);
  if (ten.length < 2) return { loi: "Nhập tên chức danh." };
  const du = { ten, hoat_dong: fd.get("hoat_dong") !== "0" };
  const { error } = id ? await sb().from("chuc_danh_dm").update(du).eq("id", id) : await sb().from("chuc_danh_dm").insert(du);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/nhan-su/danh-muc");
  return { ok: true };
}

// ─── Nghỉ việc (Lark 1.8 / 1.9) ─────────────────────────────────────────────
/** Nhân viên tự xin nghỉ việc, hoặc HCNS lập hộ. Mỗi người chỉ một phiếu đang chạy. */
export async function guiNghiViec(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id") || nd.nhanVienId;
  const ctx = await nguoiVaQuyen(nv);
  if (!ctx) return { loi: KHONG_DU_QUYEN };
  const loai = chuoi(fd, "loai"), nhom = chuoi(fd, "nhom_ly_do"), cuoi = chuoi(fd, "ngay_lam_cuoi");
  if (!["dung_han", "truoc_han"].includes(loai) || !(nhom in NHOM_LY_DO_NGHI)) return { loi: "Chọn loại nghỉ và lý do." };
  if (!NGAY.test(cuoi)) return { loi: "Chọn ngày làm việc cuối cùng." };
  const ban = chuoiHoacNull(fd, "nguoi_nhan_ban_giao_id");
  if (ban === nv) return { loi: "Người nhận bàn giao phải là người khác." };
  const { error } = await sb().from("nghi_viec").insert({ nhan_vien_id: nv, loai, nhom_ly_do: nhom, ly_do: chuoiHoacNull(fd, "ly_do"), ngay_lam_cuoi: cuoi, nguoi_nhan_ban_giao_id: ban, nguoi_gui_id: nd.nhanVienId });
  if (error) return { loi: error.code === "23505" ? "Người này đã có phiếu nghỉ việc đang chạy." : thongBaoLoi(error) };
  lamMoi(nv);
  revalidatePath("/nhan-su/nghi-viec");
  return { ok: true };
}

async function phieuNghi(fd: FormData) {
  const id = chuoi(fd, "id");
  if (!uuid(id)) return null;
  const { data } = await sb().from("nghi_viec").select("*").eq("id", id).maybeSingle();
  return data;
}
const lamMoiNghi = (nv: string) => { lamMoi(nv); revalidatePath("/nhan-su/nghi-viec"); };

/** Duyệt phiếu nghỉ việc: cần quyền duyệt nghỉ của Ban Giám đốc; người lập hoặc chính chủ không tự duyệt (Kỹ thuật được bỏ qua). */
export async function duyetNghiViec(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nghi.duyet_bgd");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await phieuNghi(fd);
  if (!p || p.trang_thai !== "cho_duyet") return { loi: "Phiếu không còn ở trạng thái chờ duyệt." };
  const ky = nd.vaiTro === "ky_thuat";
  if (!ky && (p.nhan_vien_id === nd.nhanVienId || p.nguoi_gui_id === nd.nhanVienId)) return { loi: "Người lập hoặc chính chủ phiếu không tự duyệt." };
  const tuChoi = chuoi(fd, "quyet") === "tu_choi", lyDo = chuoiHoacNull(fd, "ly_do_duyet");
  if (tuChoi && !lyDo) return { loi: "Ghi lý do từ chối." };
  const { error } = await sb().from("nghi_viec").update({ trang_thai: tuChoi ? "tu_choi" : "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString(), ly_do_duyet: lyDo }).eq("id", p.id);
  if (error) return { loi: thongBaoLoi(error) };
  await guiChoNhanVien([p.nhan_vien_id], { tieuDe: tuChoi ? "Đơn xin nghỉ việc bị từ chối" : "Đơn xin nghỉ việc đã được duyệt", noiDung: lyDo ?? "Nhân sự sẽ liên hệ để bàn giao.", url: "/nhan-su/ho-so-cua-toi?tab=nghi-viec" }).catch(() => undefined);
  lamMoiNghi(p.nhan_vien_id);
  return { ok: true };
}

export async function huyNghiViec(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  const p = await phieuNghi(fd);
  if (!nd || !p || p.trang_thai !== "cho_duyet") return { loi: "Phiếu không còn ở trạng thái chờ duyệt." };
  if (p.nguoi_gui_id !== nd.nhanVienId && p.nhan_vien_id !== nd.nhanVienId && !coQuyen(nd, "hr.hoso")) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("nghi_viec").update({ trang_thai: "huy" }).eq("id", p.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoiNghi(p.nhan_vien_id);
  return { ok: true };
}

/** HCNS cập nhật bàn giao, biên bản, cam kết bảo mật, khảo sát thôi việc. */
export async function capNhatBanGiao(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("hr.hoso"))) return { loi: KHONG_DU_QUYEN };
  const p = await phieuNghi(fd);
  if (!p || p.trang_thai !== "da_duyet") return { loi: "Chỉ cập nhật bàn giao khi phiếu đã được duyệt." };
  const { error } = await sb().from("nghi_viec").update({
    ban_giao_xong: fd.get("ban_giao_xong") === "1", bien_ban_thoa_thuan: fd.get("bien_ban_thoa_thuan") === "1", cam_ket_bao_mat: fd.get("cam_ket_bao_mat") === "1", khao_sat: chuoiHoacNull(fd, "khao_sat"),
  }).eq("id", p.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoiNghi(p.nhan_vien_id);
  return { ok: true };
}

/** Hoàn tất nghỉ việc: chỉ khi đã bàn giao, có biên bản và cam kết bảo mật. Khoá tài khoản (không xoá để giữ lịch sử), ghi ngày nghỉ. */
export async function hoanTatNghiViec(fd: FormData): Promise<KQ> {
  const nd: NguoiDung | null = await kiemQuyen("hr.hoso");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await phieuNghi(fd);
  if (!p || p.trang_thai !== "da_duyet") return { loi: "Phiếu chưa được duyệt." };
  if (!p.ban_giao_xong || !p.bien_ban_thoa_thuan || !p.cam_ket_bao_mat) return { loi: "Cần hoàn thành bàn giao, ký biên bản thoả thuận và cam kết bảo mật trước khi hoàn tất." };
  const db = sb();
  const { data: n } = await db.from("nhan_vien").select("user_id, vai_tro").eq("id", p.nhan_vien_id).maybeSingle();
  if (!n) return { loi: "Không tìm thấy nhân viên." };
  if (n.vai_tro === "ky_thuat" || n.vai_tro === "chu") return { loi: "Không khoá được tài khoản Chủ / Kỹ thuật ở đây." };
  const { error } = await db.from("nhan_vien").update({ trang_thai_lam: "nghi_viec", hoat_dong: false, ngay_nghi_viec: p.ngay_lam_cuoi }).eq("id", p.nhan_vien_id);
  if (error) return { loi: thongBaoLoi(error) };
  if (n.user_id) await createAdminClient().auth.admin.updateUserById(n.user_id, { ban_duration: "876000h" });
  await db.from("nghi_viec").update({ trang_thai: "hoan_tat", hoan_tat_luc: new Date().toISOString() }).eq("id", p.id);
  lamMoiNghi(p.nhan_vien_id);
  return { ok: true };
}
