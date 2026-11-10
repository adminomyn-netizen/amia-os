"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN, type NguoiDung } from "@/lib/auth";
import { coQuyen, duocKetThucBuoi } from "@/lib/quyen";
import { sb, thongBaoLoi, tuyChon } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { docBuoiCho, docQuyTrinh, type BuoiCho, type QuyTrinhKhach } from "@/lib/buoi-cho-lam";
import { docHenKeTiep, docNguoiBuoi, docThamSo, ghiHenKeTiep, taoPhieuBuoi, theTrongPhamVi, type PhieuBuoi } from "@/lib/buoi-thuc-hien";
import { guiChoNhanVien } from "@/lib/push";
import { tenGonNv } from "@/lib/ten-nv";
import { nhacBuocTiep, tienDoBuoc, tinKetQuaLuot, type TienDoBuoc } from "@/lib/quy-trinh-buoc";

// Luồng thu ngân → chuyên viên trị liệu (0321). Chuyển / Bắt đầu / Trả lại / Huỷ CHỈ đổi bảng buoi_cho_lam (không sổ cái, không doanh thu, không phiếu).
// Chỉ "Đã làm xong" mới trừ buổi: hàm xong_buoi_cho gọi đúng thuc_hien_buoi có sẵn, khoá lượt chờ để bấm hai lần không trừ hai buổi.

type KQ = { ok?: true; loi?: string; canhBao?: string };
export type KQChuyen = KQ & { chuyenCho?: string; /** id lượt chờ vừa tạo, để in phiếu làm dịch vụ. */ luotId?: string };
export type KQXong = KQ & Partial<PhieuBuoi> & { xemPhieu?: boolean };

const lamMoi = (theId?: string) => {
  revalidatePath("/the/cho-lam"); revalidatePath("/trang-chu"); revalidatePath("/the");
  if (theId) revalidatePath(`/the/${theId}`);
};
const nguoiThaoTac = async () => (await kiemQuyen("the.thuchien")) ?? (await kiemQuyen("ban.tao"));

/** Lượt chờ trong phạm vi chi nhánh của người dùng. */
async function docLuot(nd: NguoiDung, id: string) {
  if (!id) return null;
  const { data } = await sb().from("buoi_cho_lam").select("*").eq("id", id).maybeSingle();
  return data && (!nd.chiNhanhId || data.chi_nhanh_id === nd.chiNhanhId) ? data : null;
}
type Luot = NonNullable<Awaited<ReturnType<typeof docLuot>>>;

/** Tiến độ quy trình hôm nay của khách (gộp các lượt đang mở). Lỗi đọc thì null: chỉ dùng để nhắc / báo, không chặn thao tác. */
async function tienDoKhach(chiNhanhId: string | null, khachId: string): Promise<TienDoBuoc | null> {
  try {
    const ngay = homNayHCM();
    const qt = (await docQuyTrinh(await docBuoiCho({ chiNhanhId, ngay, khachId, gioiHan: 30 }), ngay))[khachId];
    return qt ? tienDoBuoc(qt.buoc) : null;
  } catch { return null; }
}
const tenKhachDv = async (l: Luot) => {
  const db = sb();
  const [{ data: kh }, { data: dv }] = await Promise.all([db.from("khach_hang").select("ho_ten").eq("id", l.khach_id).maybeSingle(), db.from("dich_vu").select("ten").eq("id", l.dich_vu_id).maybeSingle()]);
  return { khach: kh?.ho_ten ?? "Khách", dichVu: dv?.ten ?? "Dịch vụ" };
};
/** Báo lại thu ngân đã lên đơn (người chuyển) khi lượt đóng: xong / trả lại / khách không làm (chị Lâm 11/11/2026).
 *  Người chuyển tự bấm thì không báo. Lỗi gửi không làm hỏng thao tác. */
async function baoThuNgan(nd: NguoiDung, l: Luot, trangThai: "xong" | "tra_lai" | "huy", td: TienDoBuoc | null, lyDo?: string) {
  if (!l.chuyen_boi || l.chuyen_boi === nd.nhanVienId) return;
  try {
    const ten = await tenKhachDv(l);
    const phut = l.bat_dau_luc ? Math.max(0, Math.round((Date.now() - new Date(l.bat_dau_luc).getTime()) / 60000)) : null;
    await guiChoNhanVien([l.chuyen_boi], { tieuDe: trangThai === "xong" ? "Khách đã làm xong" : "Lượt dịch vụ trả về thu ngân", noiDung: tinKetQuaLuot({ trangThai, ...ten, td, phut, lyDo, nguoi: tenGonNv(nd.hoTen) }), url: "/ban-hang", tag: `luot-${l.id}` });
  } catch { /* chỉ là thông báo */ }
}
/** Nhắc chuyên viên được giao bước cần làm tiếp — chỉ khi NGƯỜI KHÁC thao tác (chuyên viên tự bấm thì màn hình đã hiện "Bước tiếp theo").
 *  Một tag mỗi khách: thông báo mới thay thông báo cũ, không dồn hàng loạt. */
async function nhacChuyenVien(nd: NguoiDung, nvIds: string[], khachId: string, khachTen: string, td: TienDoBuoc | null, dau: string) {
  const nhan = [...new Set(nvIds)].filter((x) => x !== nd.nhanVienId);
  if (!nhan.length) return;
  await guiChoNhanVien(nhan, { tieuDe: `${dau} · ${khachTen}`, noiDung: td ? nhacBuocTiep(td) : "Làm theo quy trình, trả khách thì bấm Kết thúc.", url: "/the/cho-lam", tag: `buoc-${khachId}` }).catch(() => null);
}
/** Chuyên viên được giao, người đã chuyển, thu ngân (ban.tao) hoặc người được điều chỉnh thẻ thì thao tác được lượt này. */
const duocThaoTac = (nd: NguoiDung, l: Luot) => l.nv_ids.includes(nd.nhanVienId) || l.chuyen_boi === nd.nhanVienId || coQuyen(nd, "ban.tao") || coQuyen(nd, "the.dieuchinh");

/** Thu ngân / lễ tân chuyển khách cho chuyên viên trị liệu: tạo lượt "Chờ làm". Chưa trừ buổi, chưa ghi doanh thu, chưa ra phiếu vật tư. */
export async function chuyenTriLieu(fd: FormData): Promise<KQChuyen> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const theId = chuoi(fd, "the_id"), dvId = chuoi(fd, "dich_vu_id");
  if (!(await theTrongPhamVi(nd, theId))) return { loi: "Không tìm thấy thẻ." };
  if (!dvId) return { loi: "Chọn dịch vụ khách làm hôm nay." };
  const nguoi = docNguoiBuoi(fd);
  if ("loi" in nguoi) return { loi: nguoi.loi };
  const hen = docHenKeTiep(fd, homNayHCM());
  if ("loi" in hen) return { loi: hen.loi };
  const db = sb();
  const [{ data: t }, { data: dv }, { data: nv }] = await Promise.all([
    db.from("v_the_khach").select("id, khach_id, chi_nhanh_id, goi_id, loai, so_buoi_con, tinh_trang, trang_thai").eq("id", theId).maybeSingle(),
    db.from("dich_vu").select("id, ten").eq("id", dvId).maybeSingle(),
    db.from("nhan_vien").select("id, ho_ten, hoat_dong").in("id", [...nguoi.nv, ...nguoi.tuVan]),
  ]);
  if (!t?.khach_id || !t.chi_nhanh_id) return { loi: "Không tìm thấy thẻ." };
  if (t.loai !== "lan") return { loi: "Chỉ thẻ liệu trình (thẻ lần) mới chuyển làm buổi." };
  if (t.trang_thai !== "hoat_dong") return { loi: "Thẻ đang bị khoá hoặc đã thu hồi." };
  if ((t.so_buoi_con ?? 0) < 1) return { loi: "Thẻ đã hết buổi." };
  if (!dv) return { loi: "Không tìm thấy dịch vụ." };
  if (t.goi_id) {
    const { data: lk } = await db.from("goi_the_dich_vu").select("dich_vu_id").eq("goi_id", t.goi_id);
    if ((lk ?? []).length && !(lk ?? []).some((x) => x.dich_vu_id === dvId)) return { loi: "Dịch vụ này không nằm trong thẻ." };
  }
  if ((nv ?? []).length !== new Set([...nguoi.nv, ...nguoi.tuVan]).size) return { loi: "Có người thực hiện / tư vấn không còn trong danh sách nhân viên." };
  const lichId = chuoi(fd, "lich_id");
  let phong = "";
  if (lichId) {
    const { data: l } = await db.from("lich_hen").select("khach_id, trang_thai, phong").eq("id", lichId).maybeSingle();
    phong = l?.phong ?? "";
    if (!l || l.khach_id !== t.khach_id) return { loi: "Lịch hẹn không thuộc khách của thẻ." };
    if (["huy", "khong_den", "hoan_thanh"].includes(l.trang_thai)) return { loi: "Lịch hẹn đã huỷ / khách không đến / đã hoàn thành." };
  }
  const { data: moi, error } = await db.from("buoi_cho_lam").insert({
    the_id: theId, khach_id: t.khach_id, chi_nhanh_id: t.chi_nhanh_id, dich_vu_id: dvId, nv_ids: nguoi.nv, bac_si_id: tuyChon(chuoi(fd, "bac_si_id")), lich_hen_id: tuyChon(lichId),
    ngay: homNayHCM(), tham_so: docThamSo(fd), ghi_chu: chuoi(fd, "ghi_chu").slice(0, 1000) || null, tu_van_ids: nguoi.tuVan, tu_van_tinh_trang: nguoi.tinhTrang, tu_van_de_xuat: nguoi.deXuat,
    ke_tiep_ngay: hen.co ? hen.ngay : null, ke_tiep_noi_dung: hen.co ? hen.noiDung : null, chuyen_boi: nd.nhanVienId,
  }).select("id").maybeSingle();
  if (error) return { loi: error.code === "23505" ? "Khách này đã được chuyển làm dịch vụ này và đang chờ chuyên viên trị liệu. Xem ở mục Khách chờ làm." : thongBaoLoi(error) };
  lamMoi(theId);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, tenGonNv(n.ho_ten)]));
  const chuyenCho = nguoi.nv.map((x) => tenNv.get(x) ?? "").filter(Boolean).join(", ");
  const { data: kh } = await db.from("khach_hang").select("ho_ten").eq("id", t.khach_id).maybeSingle();
  // Báo đẩy tới điện thoại chuyên viên (chuông trong app tự cập nhật qua canh-bao). Lỗi đẩy không làm hỏng việc chuyển.
  await guiChoNhanVien(nguoi.nv, { tieuDe: "Khách chờ làm", noiDung: `${kh?.ho_ten ?? "Khách"} · ${dv.ten}${phong ? ` · ${phong}` : ""}${nd.hoTen ? ` (${tenGonNv(nd.hoTen)} chuyển)` : ""}. Bấm Bắt đầu làm.`, url: "/the/cho-lam", tag: "buoi-cho-lam" }).catch(() => null);
  return { ok: true, chuyenCho, luotId: moi?.id };
}

/** Một lần chuyển NHIỀU thẻ của cùng khách cho chuyên viên trị liệu (chị Diệu Thuý 10/11 mục 8: một hoá đơn làm dịch vụ chọn được nhiều thẻ).
 *  Ô `dv__<theId>` = dịch vụ làm hôm nay của thẻ đó (để trống = không làm thẻ này); người làm / bác sĩ / tư vấn dùng chung.
 *  Mỗi thẻ vẫn là một lượt chờ riêng (chuyenTriLieu, đủ mọi kiểm tra), chưa trừ buổi. Thẻ nào lỗi thì báo, thẻ khác vẫn chuyển. */
export async function chuyenNhieuThe(fd: FormData): Promise<KQChuyen> {
  const chon = [...fd.entries()].filter(([k, v]) => k.startsWith("dv__") && String(v).trim()).map(([k, v]) => ({ theId: k.slice(4), dvId: String(v).trim() }));
  if (!chon.length) return { loi: "Chọn dịch vụ cho ít nhất một thẻ." };
  if (chon.length > 10) return { loi: "Mỗi lần chuyển tối đa 10 thẻ." };
  const ok: string[] = [], loi: string[] = [];
  let nguoi = "";
  for (const c of chon) {
    const f = new FormData();
    for (const [k, v] of fd.entries()) if (!k.startsWith("dv__") && k !== "the_id" && k !== "dich_vu_id") f.append(k, v);
    f.set("the_id", c.theId); f.set("dich_vu_id", c.dvId);
    const r = await chuyenTriLieu(f);
    const ten = chuoi(fd, `ten__${c.theId}`) || "Thẻ";
    if (r.ok) { ok.push(ten); nguoi = r.chuyenCho ?? nguoi; } else loi.push(`${ten}: ${r.loi ?? "lỗi"}`);
  }
  if (!ok.length) return { loi: loi.join("\n") };
  return { ok: true, chuyenCho: nguoi, ...(loi.length ? { canhBao: `Đã chuyển ${ok.length} thẻ. Chưa chuyển được:\n${loi.join("\n")}` } : {}) };
}

/** Hoá đơn dịch vụ ở Thu ngân (chị Lâm 11/11/2026): các lượt làm dịch vụ hôm nay của MỘT khách (chờ làm / đang làm / đã xong / trả lại)
 *  + quy trình bước. CHỈ ĐỌC. `thaoTacIds` = lượt người đang xem bấm được (Bắt đầu, tích bước, Sửa, Kết thúc). */
export async function luotDvCuaKhach(khachId: string): Promise<{ ds: BuoiCho[]; quyTrinh: Record<string, QuyTrinhKhach>; thaoTacIds: string[]; /** Người đang xem bấm được Kết thúc (chỉ chuyên viên trị liệu / Chủ). */ ketThuc: boolean } | null> {
  const nd = await nguoiThaoTac();
  if (!nd || !khachId) return null;
  const ngay = homNayHCM();
  const ds = await docBuoiCho({ chiNhanhId: nd.chiNhanhId, ngay, khachId, gioiHan: 30 });
  const quyTrinh = await docQuyTrinh(ds, ngay);
  const chung = coQuyen(nd, "ban.tao") || coQuyen(nd, "the.dieuchinh");
  return { ds, quyTrinh, thaoTacIds: ds.filter((r) => chung || r.nvIds.includes(nd.nhanVienId) || r.chuyenBoi === nd.nhanVienId).map((r) => r.id), ketThuc: duocKetThucBuoi(nd) };
}

/** Sửa dòng của hoá đơn dịch vụ TRƯỚC khi Kết thúc: đổi dịch vụ (trong thẻ), người làm, bác sĩ. Chỉ đổi bảng buoi_cho_lam
 *  (chưa trừ buổi, không sổ cái, không tiền). Kết thúc sau đó trừ buổi đúng dịch vụ / người làm mới. */
export async function suaLuotCho(fd: FormData): Promise<KQ> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const l = await docLuot(nd, chuoi(fd, "id"));
  if (!l) return { loi: "Không tìm thấy lượt chờ làm." };
  if (!duocThaoTac(nd, l)) return { loi: KHONG_DU_QUYEN };
  if (!["cho_lam", "dang_lam"].includes(l.trang_thai)) return { loi: "Lượt này đã kết thúc hoặc đã trả lại, không sửa được." };
  const dvId = chuoi(fd, "dich_vu_id");
  if (!dvId) return { loi: "Chọn dịch vụ." };
  const nguoi = docNguoiBuoi(fd);
  if ("loi" in nguoi) return { loi: nguoi.loi };
  const db = sb();
  const [{ data: t }, { data: dv }, { data: nv }] = await Promise.all([
    db.from("v_the_khach").select("goi_id").eq("id", l.the_id).maybeSingle(),
    db.from("dich_vu").select("id, ten").eq("id", dvId).maybeSingle(),
    db.from("nhan_vien").select("id, ho_ten").in("id", nguoi.nv),
  ]);
  if (!dv) return { loi: "Không tìm thấy dịch vụ." };
  if (t?.goi_id) {
    const { data: lk } = await db.from("goi_the_dich_vu").select("dich_vu_id").eq("goi_id", t.goi_id);
    if ((lk ?? []).length && !(lk ?? []).some((x) => x.dich_vu_id === dvId)) return { loi: "Dịch vụ này không nằm trong thẻ." };
  }
  if ((nv ?? []).length !== nguoi.nv.length) return { loi: "Có người làm không còn trong danh sách nhân viên." };
  const { data: doi, error } = await db.from("buoi_cho_lam").update({ dich_vu_id: dvId, nv_ids: nguoi.nv, bac_si_id: tuyChon(chuoi(fd, "bac_si_id")), cap_nhat_luc: new Date().toISOString() })
    .eq("id", l.id).in("trang_thai", ["cho_lam", "dang_lam"]).select("id");
  if (error) return { loi: error.code === "23505" ? "Thẻ này đã có một lượt đang chờ làm đúng dịch vụ đó." : thongBaoLoi(error) };
  if (!doi?.length) return { loi: "Lượt này đã xử lý rồi." };
  lamMoi(l.the_id);
  const moi = nguoi.nv.filter((x) => !l.nv_ids.includes(x));
  if (moi.length) {
    const { data: kh } = await db.from("khach_hang").select("ho_ten").eq("id", l.khach_id).maybeSingle();
    await guiChoNhanVien(moi, { tieuDe: "Khách chờ làm", noiDung: `${kh?.ho_ten ?? "Khách"} · ${dv.ten}. Bấm Bắt đầu làm.`, url: "/the/cho-lam", tag: "buoi-cho-lam" }).catch(() => null);
  }
  return { ok: true };
}

/** Chuyên viên bấm Bắt đầu làm: ghi giờ bắt đầu; lượt gắn lịch hẹn thì mở ca ("Đang phục vụ") để chuông quá giờ đếm đúng. */
export async function batDauLam(fd: FormData): Promise<KQ> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const l = await docLuot(nd, chuoi(fd, "id"));
  if (!l) return { loi: "Không tìm thấy lượt chờ làm." };
  if (!duocThaoTac(nd, l)) return { loi: KHONG_DU_QUYEN };
  if (l.trang_thai !== "cho_lam") return { loi: "Lượt này không còn ở trạng thái Chờ làm." };
  const db = sb(), bayGio = new Date().toISOString();
  const { data: doi, error } = await db.from("buoi_cho_lam").update({ trang_thai: "dang_lam", bat_dau_luc: bayGio, bat_dau_boi: nd.nhanVienId, cap_nhat_luc: bayGio })
    .eq("id", l.id).eq("trang_thai", "cho_lam").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!doi?.length) return { loi: "Lượt này vừa được người khác xử lý." };
  if (l.lich_hen_id) {
    // Đi đúng đường trạng thái lịch: Đã xác nhận → Chờ phục vụ (ghi giờ đến) → Đang phục vụ (0319 tự ghi mốc bắt đầu).
    const { data: lh } = await db.from("lich_hen").select("trang_thai, checkin_luc").eq("id", l.lich_hen_id).maybeSingle();
    if (lh?.trang_thai === "da_xac_nhan") await db.from("lich_hen").update({ trang_thai: "cho_phuc_vu", checkin_luc: lh.checkin_luc ?? bayGio, cap_nhat_luc: bayGio, sua_boi: nd.nhanVienId }).eq("id", l.lich_hen_id).eq("trang_thai", "da_xac_nhan");
    if (lh && ["da_xac_nhan", "cho_phuc_vu"].includes(lh.trang_thai)) await db.from("lich_hen").update({ trang_thai: "dang_phuc_vu", cap_nhat_luc: bayGio, sua_boi: nd.nhanVienId }).eq("id", l.lich_hen_id).eq("trang_thai", "cho_phuc_vu");
    revalidatePath("/lich-hen");
  }
  lamMoi(l.the_id);
  if (l.nv_ids.some((x: string) => x !== nd.nhanVienId)) {
    const [td, ten] = await Promise.all([tienDoKhach(l.chi_nhanh_id, l.khach_id), tenKhachDv(l)]);
    await nhacChuyenVien(nd, l.nv_ids, l.khach_id, ten.khach, td, "Đã bắt đầu làm");
  }
  return { ok: true };
}

/** Chuyên viên bấm Đã làm xong (CHỈ chuyên viên trị liệu, Chủ/Kỹ thuật gỡ kẹt — duocKetThucBuoi): lúc này mới trừ 1 buổi + ghi doanh thu buổi (thuc_hien_buoi) + người làm/tư vấn, rồi ra phiếu vật tư theo định mức. */
export async function xongBuoiCho(fd: FormData): Promise<KQXong> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const l = await docLuot(nd, chuoi(fd, "id"));
  if (!l) return { loi: "Không tìm thấy lượt chờ làm." };
  if (!duocThaoTac(nd, l)) return { loi: KHONG_DU_QUYEN };
  if (!duocKetThucBuoi(nd)) return { loi: "Chỉ chuyên viên trị liệu bấm Kết thúc khi trả khách." };
  if (!["cho_lam", "dang_lam"].includes(l.trang_thai)) return { loi: "Lượt này đã xử lý rồi." };
  const nguoi = docNguoiBuoi(fd);
  if ("loi" in nguoi) return { loi: nguoi.loi };
  const hen = docHenKeTiep(fd, homNayHCM());
  if ("loi" in hen) return { loi: hen.loi };
  const db = sb();
  // Tiến độ bước đọc TRƯỚC khi đóng lượt (sau đó lượt không còn mở) — chỉ khi cần báo thu ngân.
  const td = l.chuyen_boi && l.chuyen_boi !== nd.nhanVienId ? await tienDoKhach(l.chi_nhanh_id, l.khach_id) : null;
  const { data: buoiId, error } = await db.rpc("xong_buoi_cho", {
    p_id: l.id, p_nv: nguoi.nv, p_bac_si: tuyChon(chuoi(fd, "bac_si_id")), p_tham_so: docThamSo(fd), p_ghi_chu: tuyChon(chuoi(fd, "ghi_chu").slice(0, 1000)),
    p_tu_van: nguoi.tuVan, p_tinh_trang: tuyChon(nguoi.tinhTrang), p_de_xuat: tuyChon(nguoi.deXuat), p_nguoi: nd.nhanVienId,
  });
  lamMoi(l.the_id); revalidatePath("/lich-hen");
  if (error) return { loi: thongBaoLoi(error) };
  await baoThuNgan(nd, l, "xong", td);
  // Buổi đã trừ. Từ đây lỗi nào cũng chỉ cảnh báo (bấm lại cũng không trừ thêm vì lượt đã "xong").
  const canhBao: string[] = [];
  const buoi = typeof buoiId === "string" ? buoiId : null;
  if (hen.co) {
    const r = await ghiHenKeTiep(nd, l.the_id, buoi, hen.ngay, hen.noiDung);
    if (r.loi) canhBao.push(`CHƯA lưu được hẹn buổi kế tiếp (${r.loi}). Vào hồ sơ thẻ bấm "Hẹn buổi kế tiếp" để ghi.`);
  }
  let phieu: PhieuBuoi | undefined;
  if (buoi) { const r = await taoPhieuBuoi(nd, buoi); phieu = r.phieu; if (r.canhBao) canhBao.push(r.canhBao); }
  return { ok: true, ...(phieu ? { ...phieu, xemPhieu: coQuyen(nd, "phieu.xem") } : {}), ...(canhBao.length ? { canhBao: `Đã trừ buổi, nhưng ${canhBao.join(" ")}` } : {}) };
}

/** Trả lại thu ngân (vd khách đổi dịch vụ) hoặc Huỷ (khách không làm): chỉ đóng lượt chờ, không đụng thẻ/sổ cái. Ca đang mở thì đưa lịch về Chờ phục vụ. */
async function dongLuot(fd: FormData, trangThai: "tra_lai" | "huy"): Promise<KQ> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const l = await docLuot(nd, chuoi(fd, "id"));
  if (!l) return { loi: "Không tìm thấy lượt chờ làm." };
  if (!duocThaoTac(nd, l)) return { loi: KHONG_DU_QUYEN };
  const lyDo = chuoi(fd, "ly_do").slice(0, 300);
  if (!lyDo) return { loi: "Ghi lý do." };
  const db = sb(), bayGio = new Date().toISOString();
  const td = l.chuyen_boi && l.chuyen_boi !== nd.nhanVienId ? await tienDoKhach(l.chi_nhanh_id, l.khach_id) : null;
  const { data: doi, error } = await db.from("buoi_cho_lam").update({ trang_thai: trangThai, ly_do: lyDo, xu_ly_boi: nd.nhanVienId, cap_nhat_luc: bayGio })
    .eq("id", l.id).in("trang_thai", ["cho_lam", "dang_lam"]).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!doi?.length) return { loi: "Lượt này đã xử lý rồi." };
  if (l.lich_hen_id && l.trang_thai === "dang_lam") {
    await db.from("lich_hen").update({ trang_thai: "cho_phuc_vu", cap_nhat_luc: bayGio, sua_boi: nd.nhanVienId }).eq("id", l.lich_hen_id).eq("trang_thai", "dang_phuc_vu");
    revalidatePath("/lich-hen");
  }
  lamMoi(l.the_id);
  await baoThuNgan(nd, l, trangThai, td, lyDo);
  return { ok: true };
}
export async function traLaiThuNgan(fd: FormData): Promise<KQ> { return dongLuot(fd, "tra_lai"); }
export async function huyLuotCho(fd: FormData): Promise<KQ> { return dongLuot(fd, "huy"); }

/** Chuyên viên tích / bỏ tích một bước quy trình của khách hôm nay (0322). Chỉ ghi bảng luot_buoc: không trừ buổi, không tiền, không kho.
 *  Khách phải đang có lượt chờ / đang làm hôm nay trong phạm vi chi nhánh, và người bấm phải thao tác được lượt đó. */
export async function tichBuoc(fd: FormData): Promise<KQ> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const khachId = chuoi(fd, "khach_id"), buocId = chuoi(fd, "buoc_id"), bo = chuoi(fd, "bo") === "1";
  if (!khachId || !buocId) return { loi: "Thiếu khách hoặc bước." };
  const db = sb();
  let q = db.from("buoi_cho_lam").select("*").eq("khach_id", khachId).in("trang_thai", ["cho_lam", "dang_lam"]);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data: luot } = await q;
  const cuaToi = (luot ?? []).filter((l) => duocThaoTac(nd, l));
  if (!cuaToi.length) return { loi: "Khách không còn lượt đang làm (đã kết thúc hoặc không thuộc bạn)." };
  const ngay = homNayHCM();
  if (bo) {
    const { error } = await db.from("luot_buoc").delete().eq("khach_id", khachId).eq("ngay", ngay).eq("buoc_id", buocId);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { error } = await db.from("luot_buoc").upsert({ khach_id: khachId, chi_nhanh_id: cuaToi[0].chi_nhanh_id, ngay, buoc_id: buocId, luot_ids: cuaToi.map((l) => l.id), xong_boi: nd.nhanVienId, xong_luc: new Date().toISOString() }, { onConflict: "khach_id,ngay,buoc_id" });
    if (error) return { loi: thongBaoLoi(error) };
  }
  revalidatePath("/the/cho-lam");
  if (!bo) {
    const nv = cuaToi.flatMap((l) => l.nv_ids as string[]);
    if (nv.some((x) => x !== nd.nhanVienId)) {
      const [td, ten] = await Promise.all([tienDoKhach(cuaToi[0].chi_nhanh_id, khachId), tenKhachDv(cuaToi[0])]);
      await nhacChuyenVien(nd, nv, khachId, ten.khach, td, "Xong một bước");
    }
  }
  return { ok: true };
}
