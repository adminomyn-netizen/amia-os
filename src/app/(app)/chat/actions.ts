"use server";

import { randomBytes } from "node:crypto";
import { layNguoiDungHienTai } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";

export type TinChat = { id: string; vai: "nguoi" | "agent"; loai: "hoi" | "sua" | "duyet"; noiDung: string; trangThai: string; coTep: boolean; choDuyet: boolean; tenTep: string | null; luc: string };
export type TrangChat = { tin: TinChat[]; online: boolean; dangCho: boolean };
type KQ = { ok?: true; loi?: string };

const NHIP_SONG_GIAY = 90;
const CHO_SUA = ["chu", "ky_thuat"];

/** Gửi một tin cho Tula. Vai trò và quyền "nhờ sửa" do máy chủ quyết, không tin trình duyệt; mỗi tin sinh một mã thông hành 15 phút để cổng công cụ biết đúng người đang hỏi. */
export async function guiTinChat(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || nd.phaiDoiMatKhau) return { loi: "Phiên đăng nhập đã hết." };
  const noiDung = chuoi(fd, "noi_dung");
  if (!noiDung) return { loi: "Gõ nội dung cần hỏi." };
  if (noiDung.length > 2000) return { loi: "Tin dài quá (tối đa 2000 ký tự). Chia nhỏ giúp em." };
  const loai = chuoi(fd, "loai") === "sua" ? "sua" : "hoi";
  if (loai === "sua" && !CHO_SUA.includes(nd.vaiTro)) return { loi: "Chỉ Chủ và Kỹ thuật mới nhờ Amia Bot sửa ứng dụng. Chị/anh vẫn hỏi đáp và xuất file bình thường." };
  const db = sb();
  const { data: cuoc, error: eC } = await db.from("chat_cuoc").upsert({ nhan_vien_id: nd.nhanVienId }, { onConflict: "nhan_vien_id" }).select("id").single();
  if (eC || !cuoc) return { loi: thongBaoLoi(eC) };
  const [{ count: dangCho }, { count: homNay }, { data: ch }] = await Promise.all([
    db.from("chat_tin").select("id", { count: "exact", head: true }).eq("cuoc_id", cuoc.id).eq("vai", "nguoi").in("trang_thai", ["cho", "dang_xu_ly"]),
    db.from("chat_tin").select("id", { count: "exact", head: true }).eq("cuoc_id", cuoc.id).eq("vai", "nguoi").gte("tao_luc", new Date(Date.now() - 86_400_000).toISOString()),
    db.from("cau_hinh").select("gia_tri").eq("khoa", "chat_gioi_han_ngay").maybeSingle(),
  ]);
  if ((dangCho ?? 0) > 0) return { loi: "Amia Bot đang trả lời tin trước, đợi một chút nhé." };
  const gioiHan = Number(ch?.gia_tri) > 0 ? Number(ch?.gia_tri) : 60;
  if ((homNay ?? 0) >= gioiHan) return { loi: `Hôm nay chị/anh đã gửi ${gioiHan} tin cho Amia Bot, mai hỏi tiếp nhé.` };
  const { error } = await db.from("chat_tin").insert({
    cuoc_id: cuoc.id, nhan_vien_id: nd.nhanVienId, vai: "nguoi", loai, vai_tro_chup: nd.vaiTro, noi_dung: noiDung, trang_thai: "cho",
    thong_hanh: randomBytes(24).toString("hex"), han_thong_hanh: new Date(Date.now() + 15 * 60_000).toISOString(),
  });
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Đọc cuộc chat của chính mình (40 tin gần nhất) và xem Tula có đang online không (nhịp tim của máy chạy Tula trong 90 giây). */
export async function layChat(): Promise<TrangChat | { loi: string }> {
  const nd = await layNguoiDungHienTai();
  if (!nd) return { loi: "Phiên đăng nhập đã hết." };
  const db = sb();
  const [{ data: cuoc }, { data: nhip }] = await Promise.all([
    db.from("chat_cuoc").select("id").eq("nhan_vien_id", nd.nhanVienId).maybeSingle(),
    db.from("chat_nhip").select("luc").eq("id", 1).maybeSingle(),
  ]);
  const online = !!nhip && Date.now() - new Date(nhip.luc).getTime() < NHIP_SONG_GIAY * 1000;
  if (!cuoc) return { tin: [], online, dangCho: false };
  const { data } = await db.from("chat_tin").select("id, vai, loai, noi_dung, trang_thai, tep_duong_dan, tep_ten, tao_luc, nhanh_sua, da_duyet_luc").eq("cuoc_id", cuoc.id).order("tao_luc", { ascending: false }).limit(40);
  const tin = (data ?? []).reverse().map((t) => ({ id: t.id, vai: t.vai as "nguoi" | "agent", loai: t.loai as "hoi" | "sua" | "duyet", noiDung: t.noi_dung, trangThai: t.trang_thai, coTep: !!t.tep_duong_dan, choDuyet: t.vai === "agent" && !!t.nhanh_sua && !t.da_duyet_luc, tenTep: t.tep_ten, luc: t.tao_luc }));
  return { tin, online, dangCho: tin.some((t) => t.vai === "nguoi" && ["cho", "dang_xu_ly"].includes(t.trangThai)) };
}

/** Chủ/Kỹ thuật bấm "Duyệt đưa lên" dưới câu trả lời của Amia Bot có nhánh sửa: sinh một tin loại 'duyet' để máy Amia Bot đưa nhánh đó vào ứng dụng. Mỗi nhánh chỉ duyệt một lần. */
export async function duyetSuaChat(fd: FormData): Promise<KQ> {
  const nd = await layNguoiDungHienTai();
  if (!nd || !CHO_SUA.includes(nd.vaiTro)) return { loi: "Chỉ Chủ và Kỹ thuật mới duyệt đưa lên." };
  const db = sb(), id = chuoi(fd, "id");
  const { data: t } = await db.from("chat_tin").select("id, cuoc_id, nhanh_sua, da_duyet_luc, nhan_vien_id").eq("id", id).maybeSingle();
  if (!t?.nhanh_sua || t.da_duyet_luc || t.nhan_vien_id !== nd.nhanVienId) return { loi: "Bản sửa này đã được duyệt hoặc không còn." };
  const { data: da } = await db.from("chat_tin").update({ da_duyet_luc: new Date().toISOString() }).eq("id", id).is("da_duyet_luc", null).select("id");
  if (!da?.length) return { loi: "Bản sửa này đã được duyệt." };
  const { error } = await db.from("chat_tin").insert({ cuoc_id: t.cuoc_id, nhan_vien_id: nd.nhanVienId, vai: "nguoi", loai: "duyet", vai_tro_chup: nd.vaiTro, noi_dung: `Duyệt đưa lên: ${t.nhanh_sua}`, nhanh_sua: t.nhanh_sua, trang_thai: "cho", hoi_tin_id: id });
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}
