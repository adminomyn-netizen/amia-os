"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN, type NguoiDung } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi, tuyChon } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { docHenKeTiep, docNguoiBuoi, docThamSo, ghiHenKeTiep, taoPhieuBuoi, theTrongPhamVi, type PhieuBuoi } from "@/lib/buoi-thuc-hien";
import { guiChoNhanVien } from "@/lib/push";
import { tenGonNv } from "@/lib/ten-nv";

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
  if (lichId) {
    const { data: l } = await db.from("lich_hen").select("khach_id, trang_thai").eq("id", lichId).maybeSingle();
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
  await guiChoNhanVien(nguoi.nv, { tieuDe: "Khách chờ làm", noiDung: `${kh?.ho_ten ?? "Khách"} · ${dv.ten}${nd.hoTen ? ` (${tenGonNv(nd.hoTen)} chuyển)` : ""}`, url: "/the/cho-lam", tag: "buoi-cho-lam" }).catch(() => null);
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
  return { ok: true };
}

/** Chuyên viên bấm Đã làm xong: lúc này mới trừ 1 buổi + ghi doanh thu buổi (thuc_hien_buoi) + người làm/tư vấn, rồi ra phiếu vật tư theo định mức. */
export async function xongBuoiCho(fd: FormData): Promise<KQXong> {
  const nd = await nguoiThaoTac();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const l = await docLuot(nd, chuoi(fd, "id"));
  if (!l) return { loi: "Không tìm thấy lượt chờ làm." };
  if (!duocThaoTac(nd, l)) return { loi: KHONG_DU_QUYEN };
  if (!["cho_lam", "dang_lam"].includes(l.trang_thai)) return { loi: "Lượt này đã xử lý rồi." };
  const nguoi = docNguoiBuoi(fd);
  if ("loi" in nguoi) return { loi: nguoi.loi };
  const hen = docHenKeTiep(fd, homNayHCM());
  if ("loi" in hen) return { loi: hen.loi };
  const db = sb();
  const { data: buoiId, error } = await db.rpc("xong_buoi_cho", {
    p_id: l.id, p_nv: nguoi.nv, p_bac_si: tuyChon(chuoi(fd, "bac_si_id")), p_tham_so: docThamSo(fd), p_ghi_chu: tuyChon(chuoi(fd, "ghi_chu").slice(0, 1000)),
    p_tu_van: nguoi.tuVan, p_tinh_trang: tuyChon(nguoi.tinhTrang), p_de_xuat: tuyChon(nguoi.deXuat), p_nguoi: nd.nhanVienId,
  });
  lamMoi(l.the_id); revalidatePath("/lich-hen");
  if (error) return { loi: thongBaoLoi(error) };
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
  const { data: doi, error } = await db.from("buoi_cho_lam").update({ trang_thai: trangThai, ly_do: lyDo, xu_ly_boi: nd.nhanVienId, cap_nhat_luc: bayGio })
    .eq("id", l.id).in("trang_thai", ["cho_lam", "dang_lam"]).select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!doi?.length) return { loi: "Lượt này đã xử lý rồi." };
  if (l.lich_hen_id && l.trang_thai === "dang_lam") {
    await db.from("lich_hen").update({ trang_thai: "cho_phuc_vu", cap_nhat_luc: bayGio, sua_boi: nd.nhanVienId }).eq("id", l.lich_hen_id).eq("trang_thai", "dang_phuc_vu");
    revalidatePath("/lich-hen");
  }
  lamMoi(l.the_id);
  return { ok: true };
}
export async function traLaiThuNgan(fd: FormData): Promise<KQ> { return dongLuot(fd, "tra_lai"); }
export async function huyLuotCho(fd: FormData): Promise<KQ> { return dongLuot(fd, "huy"); }
