"use server";

import { revalidatePath } from "next/cache";
import { layNguoiDungHienTai, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen, type Quyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so } from "@/lib/form";
import { chuanSdt, homNayHCM } from "@/lib/dinh-dang";
import { guiChoNhanVien, nguoiCoQuyen } from "@/lib/push";
import { soDuongHoacNull, thamSoBaoHanh, tinhBaoHanh } from "@/lib/khieu-nai";

type KQ = { ok?: true; loi?: string; id?: string };
const dem = async (k: string, tien: string) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: k })).data ?? 0)).padStart(6, "0")}`;
const lamMoi = (...duong: string[]) => { revalidatePath("/khieu-nai"); revalidatePath("/khach-hang"); for (const d of duong) revalidatePath(d); };

/** Bắn thông báo đẩy tới những người có một trong các quyền (trừ người vừa thao tác); lỗi gửi không làm hỏng thao tác chính. */
async function bao(quyen: Quyen[], cn: string | null, tin: { tieuDe: string; noiDung: string; url: string; tag: string }, tru?: string) {
  try {
    const ids = new Set<string>();
    for (const q of quyen) for (const id of await nguoiCoQuyen(q, cn)) ids.add(id);
    if (tru) ids.delete(tru);
    if (ids.size) await guiChoNhanVien([...ids], tin);
  } catch (e) { console.error("[khieu-nai] gửi thông báo lỗi", (e as Error).message); }
}

/** Khách theo mã (nút trên hồ sơ khách) hoặc theo số điện thoại (nhập ở danh sách). */
async function timKhach(fd: FormData, cnKhoa: string | null = null) {
  const db = sb();
  const loc = <T extends { chi_nhanh_id: string | null } | null>(k: T): T | null => (k && cnKhoa && k.chi_nhanh_id !== cnKhoa ? null : k);
  const id = chuoi(fd, "khach_id");
  if (id) return loc((await db.from("khach_hang").select("id, ho_ten, chi_nhanh_id").eq("id", id).maybeSingle()).data);
  const sdt = chuanSdt(chuoi(fd, "dien_thoai"));
  if (!sdt) return null;
  let q = db.from("khach_hang").select("id, ho_ten, chi_nhanh_id").eq("dien_thoai", sdt);
  if (cnKhoa) q = q.eq("chi_nhanh_id", cnKhoa);
  return (await q.limit(1).maybeSingle()).data;
}
const KHONG_THAY_KHACH = "Chưa có khách với số điện thoại này. Thêm khách trước rồi ghi lại.";

/** Chuyển một khiếu nại sang biến chứng (QT-11 bước 2: y khoa → QT-12). Trả mã ca biến chứng. */
async function chuyenBienChung(kn: { id: string; khach_id: string; chi_nhanh_id: string | null; dich_vu_id: string | null; buoi_id: string | null; noi_dung: string }, nguoiId: string) {
  const db = sb();
  const ma = await dem("bc", "BC");
  const { data: bc, error } = await db.from("bien_chung").insert({ ma, khach_id: kn.khach_id, chi_nhanh_id: kn.chi_nhanh_id, dich_vu_id: kn.dich_vu_id, buoi_id: kn.buoi_id, khieu_nai_id: kn.id, nguoi_bao_id: nguoiId, dau_hieu: kn.noi_dung }).select("id, ma").single();
  if (error || !bc) return { loi: thongBaoLoi(error) };
  const { error: e2 } = await db.from("khieu_nai").update({ trang_thai: "chuyen_bc", loai: "y_khoa", bien_chung_id: bc.id }).eq("id", kn.id);
  if (e2) return { loi: thongBaoLoi(e2) };
  await bao(["bc.xu_ly", "kn.duyet"], kn.chi_nhanh_id, { tieuDe: "Ca biến chứng mới", noiDung: `${bc.ma}: có dấu hiệu bất thường cần bác sĩ xem ngay.`, url: `/khieu-nai/bien-chung/${bc.id}`, tag: `bchung-${bc.id}` }, nguoiId);
  return { id: bc.id };
}

/** BM17 — tiếp nhận khiếu nại. Loại "y khoa" tự chuyển sang biến chứng. */
export async function ghiKhieuNai(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "kn.ghi")) return { loi: KHONG_DU_QUYEN };
  const k = await timKhach(fd, nd.chiNhanhId);
  if (!k) return { loi: KHONG_THAY_KHACH };
  const loai = chuoi(fd, "loai"), noiDung = chuoi(fd, "noi_dung");
  if (!["dich_vu", "thai_do", "tai_chinh", "y_khoa"].includes(loai)) return { loi: "Chọn loại khiếu nại." };
  if (!noiDung) return { loi: "Ghi nội dung khách phản ánh." };
  const db = sb();
  const { data: kn, error } = await db.from("khieu_nai").insert({
    ma: await dem("kn", "KN"), khach_id: k.id, chi_nhanh_id: k.chi_nhanh_id, kenh: chuoi(fd, "kenh") || "truc_tiep", loai, noi_dung: noiDung,
    dich_vu_id: chuoiHoacNull(fd, "dich_vu_id"), nguoi_tiep_nhan_id: nd.nhanVienId,
  }).select("id, khach_id, chi_nhanh_id, dich_vu_id, buoi_id, noi_dung").single();
  if (error || !kn) return { loi: thongBaoLoi(error) };
  if (loai === "y_khoa") {
    const r = await chuyenBienChung(kn, nd.nhanVienId);
    if (r.loi) return { loi: r.loi };
    lamMoi(`/khach-hang/${k.id}`);
    return { ok: true, id: kn.id };
  }
  lamMoi(`/khach-hang/${k.id}`);
  return { ok: true, id: kn.id };
}

/** QT-11 bước 2–3: xác minh nguyên nhân, phân loại lại (nếu cần) và đề xuất phương án. Có chi phí vượt thẩm quyền thì chờ Quản lý duyệt. */
export async function deXuatPhuongAn(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet"))) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: kn } = await db.from("khieu_nai").select("id, khach_id, chi_nhanh_id, dich_vu_id, buoi_id, noi_dung, trang_thai, loai").eq("id", id).maybeSingle();
  if (!kn) return { loi: "Không tìm thấy khiếu nại." };
  if (kn.trang_thai !== "moi") return { loi: "Khiếu nại này không còn ở bước đề xuất phương án." };
  const loai = chuoi(fd, "loai") || kn.loai;
  if (loai === "y_khoa") {
    const r = await chuyenBienChung(kn, nd.nhanVienId);
    if (r.loi) return { loi: r.loi };
    lamMoi(`/khieu-nai/${id}`);
    return { ok: true, id: r.id };
  }
  const nguyenNhan = chuoi(fd, "nguyen_nhan"), phuongAn = chuoi(fd, "phuong_an");
  if (!nguyenNhan || !phuongAn) return { loi: "Ghi nguyên nhân đã xác minh và phương án khắc phục." };
  const chiPhi = Math.max(0, Math.trunc(so(fd, "chi_phi")));
  const coChiPhi = bat(fd, "co_chi_phi") || chiPhi > 0;
  // Hạn mức tự xử lý còn "chờ chốt": để trống thì mọi phương án có chi phí đều phải duyệt.
  const { data: ch } = await db.from("cau_hinh").select("gia_tri").eq("khoa", "kn_han_muc_tu_xu_ly").maybeSingle();
  const han = soDuongHoacNull(ch?.gia_tri);
  const canDuyet = coChiPhi && !(han !== null && chiPhi <= han);
  const { error } = await db.from("khieu_nai").update({
    loai, nguyen_nhan: nguyenNhan, phuong_an: phuongAn, co_chi_phi: coChiPhi, chi_phi: chiPhi, can_duyet: canDuyet,
    nguoi_de_xuat_id: nd.nhanVienId, de_xuat_luc: new Date().toISOString(), ly_do_tra_lai: null,
    trang_thai: canDuyet ? "cho_duyet" : "da_duyet",
  }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  if (canDuyet) await bao(["kn.duyet"], kn.chi_nhanh_id, { tieuDe: "Khiếu nại chờ duyệt", noiDung: "Có phương án khắc phục có chi phí cần Quản lý duyệt.", url: `/khieu-nai/${id}`, tag: `kn-${id}` }, nd.nhanVienId);
  lamMoi(`/khieu-nai/${id}`, `/khach-hang/${kn.khach_id}`);
  return { ok: true };
}

/** QT-11 bước 4: duyệt hoặc trả lại. Người tiếp nhận và người đề xuất không tự duyệt (cả ở đây lẫn trong cơ sở dữ liệu). */
export async function duyetKhieuNai(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "kn.duyet")) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id"), quyet = chuoi(fd, "quyet");
  const { data: kn } = await db.from("khieu_nai").select("id, khach_id, trang_thai, nguoi_tiep_nhan_id, nguoi_de_xuat_id").eq("id", id).maybeSingle();
  if (!kn) return { loi: "Không tìm thấy khiếu nại." };
  if (kn.trang_thai !== "cho_duyet") return { loi: "Khiếu nại này không ở trạng thái chờ duyệt." };
  if (kn.nguoi_tiep_nhan_id === nd.nhanVienId || kn.nguoi_de_xuat_id === nd.nhanVienId) return { loi: "Bạn là người ghi nhận hoặc đề xuất nên không tự duyệt được. Nhờ một Quản lý khác." };
  if (quyet === "tra_lai") {
    const ly = chuoi(fd, "ly_do");
    if (!ly) return { loi: "Ghi lý do trả lại để người xử lý sửa phương án." };
    const { error } = await db.from("khieu_nai").update({ trang_thai: "moi", ly_do_tra_lai: ly }).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { error } = await db.from("khieu_nai").update({ trang_thai: "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString() }).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  }
  try { await guiChoNhanVien([kn.nguoi_de_xuat_id ?? kn.nguoi_tiep_nhan_id], { tieuDe: quyet === "tra_lai" ? "Phương án bị trả lại" : "Phương án đã được duyệt", noiDung: quyet === "tra_lai" ? "Quản lý đề nghị sửa phương án khiếu nại." : "Bạn có thể thực hiện khắc phục và xin khách xác nhận.", url: `/khieu-nai/${id}`, tag: `kn-${id}` }); } catch { /* không chặn thao tác */ }
  lamMoi(`/khieu-nai/${id}`, `/khach-hang/${kn.khach_id}`);
  return { ok: true };
}

/** QT-11 bước 5–6: khách xác nhận mới đóng được; ghi nguyên nhân gốc và cách phòng ngừa. */
export async function dongKhieuNai(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet"))) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: kn } = await db.from("khieu_nai").select("id, khach_id, trang_thai").eq("id", id).maybeSingle();
  if (!kn) return { loi: "Không tìm thấy khiếu nại." };
  if (kn.trang_thai !== "da_duyet") return { loi: "Chỉ đóng được khi phương án đã duyệt." };
  if (!bat(fd, "khach_xac_nhan")) return { loi: "Chưa đóng được: khách phải xác nhận đồng ý với cách xử lý." };
  const cach = chuoi(fd, "cach_xac_nhan");
  if (!["ky", "zalo", "goi"].includes(cach)) return { loi: "Chọn khách xác nhận bằng cách nào." };
  const goc = chuoi(fd, "nguyen_nhan_goc"), ngua = chuoi(fd, "phong_ngua");
  if (!goc || !ngua) return { loi: "Ghi nguyên nhân gốc và cách phòng ngừa lặp lại." };
  const { error } = await db.from("khieu_nai").update({ trang_thai: "dong", khach_xac_nhan: true, cach_xac_nhan: cach, dong_luc: new Date().toISOString(), nguyen_nhan_goc: goc, phong_ngua: ngua }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(`/khieu-nai/${id}`, `/khach-hang/${kn.khach_id}`);
  return { ok: true };
}

/** QT-12 bước 1: bất kỳ ai thấy dấu hiệu bất thường báo ngay; lãnh đạo và bác sĩ nhận thông báo đẩy. */
export async function baoBienChung(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !(coQuyen(nd, "bc.bao") || coQuyen(nd, "kn.ghi"))) return { loi: KHONG_DU_QUYEN };
  const k = await timKhach(fd, nd.chiNhanhId);
  if (!k) return { loi: KHONG_THAY_KHACH };
  const dauHieu = chuoi(fd, "dau_hieu");
  if (!dauHieu) return { loi: "Ghi dấu hiệu bất thường bạn thấy." };
  const { data: bc, error } = await sb().from("bien_chung").insert({ ma: await dem("bc", "BC"), khach_id: k.id, chi_nhanh_id: k.chi_nhanh_id, dich_vu_id: chuoiHoacNull(fd, "dich_vu_id"), buoi_id: chuoiHoacNull(fd, "buoi_id"), nguoi_bao_id: nd.nhanVienId, dau_hieu: dauHieu }).select("id, ma").single();
  if (error || !bc) return { loi: thongBaoLoi(error) };
  await bao(["bc.xu_ly", "kn.duyet"], k.chi_nhanh_id, { tieuDe: "Ca biến chứng mới", noiDung: `${bc.ma}: ${k.ho_ten} có dấu hiệu bất thường, cần bác sĩ xem ngay.`, url: `/khieu-nai/bien-chung/${bc.id}`, tag: `bchung-${bc.id}` }, nd.nhanVienId);
  lamMoi(`/khach-hang/${k.id}`);
  return { ok: true, id: bc.id };
}

/** QT-12 bước 2: bác sĩ khám, chẩn đoán, lập phương án (BM18). */
export async function khamBienChung(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "bc.xu_ly")) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: bc } = await db.from("bien_chung").select("id, khach_id, trang_thai").eq("id", id).maybeSingle();
  if (!bc) return { loi: "Không tìm thấy ca." };
  if (!["moi", "dang_xu_ly"].includes(bc.trang_thai)) return { loi: "Ca này đã cam kết hoặc đã đóng, không sửa phần khám nữa." };
  const cd = chuoi(fd, "chan_doan"), pa = chuoi(fd, "phuong_an");
  if (!cd || !pa) return { loi: "Ghi chẩn đoán và phương án khắc phục bằng văn bản." };
  const { error } = await db.from("bien_chung").update({ bac_si_id: nd.nhanVienId, chan_doan: cd, phuong_an: pa, trang_thai: "dang_xu_ly" }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(`/khieu-nai/bien-chung/${id}`, `/khach-hang/${bc.khach_id}`);
  return { ok: true };
}

/** QT-12 bước 3: cam kết mức khắc phục với khách, áp chính sách bảo hành biến chứng. */
export async function camKetBienChung(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "bc.xu_ly")) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: bc } = await db.from("bien_chung").select("id, khach_id, trang_thai").eq("id", id).maybeSingle();
  if (!bc) return { loi: "Không tìm thấy ca." };
  if (bc.trang_thai !== "dang_xu_ly") return { loi: "Cần bác sĩ khám và lập phương án trước khi cam kết." };
  const ck = chuoi(fd, "cam_ket");
  if (!ck) return { loi: "Ghi nội dung cam kết với khách." };
  const { error } = await db.from("bien_chung").update({ cam_ket: ck, trang_thai: "da_cam_ket" }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(`/khieu-nai/bien-chung/${id}`, `/khach-hang/${bc.khach_id}`);
  return { ok: true };
}

/** QT-12 bước 5: lưu hồ sơ, nguyên nhân gốc và hành động phòng ngừa. */
export async function dongBienChung(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "bc.xu_ly")) return { loi: KHONG_DU_QUYEN };
  const db = sb(), id = chuoi(fd, "id");
  const { data: bc } = await db.from("bien_chung").select("id, khach_id, trang_thai").eq("id", id).maybeSingle();
  if (!bc) return { loi: "Không tìm thấy ca." };
  if (bc.trang_thai !== "da_cam_ket") return { loi: "Chỉ đóng được sau khi đã cam kết với khách." };
  const goc = chuoi(fd, "nguyen_nhan_goc"), ngua = chuoi(fd, "phong_ngua");
  if (!goc || !ngua) return { loi: "Ghi nguyên nhân gốc và hành động phòng ngừa." };
  const { error } = await db.from("bien_chung").update({ nguyen_nhan_goc: goc, phong_ngua: ngua, trang_thai: "dong", dong_luc: new Date().toISOString() }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(`/khieu-nai/bien-chung/${id}`, `/khach-hang/${bc.khach_id}`);
  return { ok: true };
}

/** BM19 — ghi một lần làm lại theo bảo hành. Mốc và % ưu đãi do hệ thống tính từ buổi cuối của dịch vụ, người ghi không nhập tay. */
export async function ghiBaoHanh(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !coQuyen(nd, "kn.ghi")) return { loi: KHONG_DU_QUYEN };
  const db = sb(), khachId = chuoi(fd, "khach_id"), dvId = chuoi(fd, "dich_vu_id");
  if (!khachId || !dvId) return { loi: "Chọn dịch vụ được làm lại." };
  const [{ data: buoi }, { data: dv }, { data: ch }] = await Promise.all([
    db.from("buoi_thuc_hien").select("id, ngay_lam").eq("khach_id", khachId).eq("dich_vu_id", dvId).eq("trang_thai", "da_lam").order("ngay_lam", { ascending: false }).limit(1),
    db.from("dich_vu").select("id, dich_vu_nhom(kieu_bao_hanh)").eq("id", dvId).maybeSingle(),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "bh_%"),
  ]);
  if (!buoi?.[0]) return { loi: "Khách chưa có buổi nào đã làm của dịch vụ này nên chưa tính được mốc bảo hành." };
  const kieu = (dv as unknown as { dich_vu_nhom: { kieu_bao_hanh: string } | null } | null)?.dich_vu_nhom?.kieu_bao_hanh ?? "chuan";
  const kq = tinhBaoHanh(buoi[0].ngay_lam, homNayHCM(), kieu, thamSoBaoHanh(ch ?? []));
  const { error } = await db.from("bao_hanh_lan").insert({
    khach_id: khachId, dich_vu_id: dvId, buoi_cuoi_id: buoi[0].id, ngay_dich_vu_cuoi: buoi[0].ngay_lam, moc: kq.moc, ty_le_giam: kq.tyLeGiam,
    khieu_nai_id: chuoiHoacNull(fd, "khieu_nai_id"), bien_chung_id: chuoiHoacNull(fd, "bien_chung_id"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_ghi_id: nd.nhanVienId,
  });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi(`/khach-hang/${khachId}`);
  return { ok: true };
}
