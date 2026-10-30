import "server-only";
import { sb } from "@/lib/db";
import { linkAnh } from "@/lib/kho-anh";
import { SO_ANH_TRANG, type AnhKhach } from "@/lib/anh-khach";

const COT = "id, duong_dan, loai, ngay_chup, ghi_chu, tao_luc, tao_boi, van_ban, nhan_vien(ho_ten)";
type Dong = { id: string; duong_dan: string; loai: string; ngay_chup: string; ghi_chu: string | null; tao_luc: string; tao_boi: string | null; van_ban: string | null; nhan_vien: { ho_ten: string } | null };

async function kemLink(dong: Dong[]): Promise<AnhKhach[]> {
  const url = dong.length ? await linkAnh(dong.map((d) => d.duong_dan), 3600) : new Map<string, string>();
  return dong.map((d) => ({ id: d.id, url: url.get(d.duong_dan) ?? null, loai: d.loai, ngay: d.ngay_chup, ghiChu: d.ghi_chu, taoLuc: d.tao_luc, taoBoiId: d.tao_boi, taoBoi: d.nhan_vien?.ho_ten ?? null, vanBan: d.van_ban }));
}

/** Một trang ảnh của khách, mới nhất trước (thứ tự cố định để cắt trang không trùng/sót). */
export async function docTrangAnh(khachId: string, tu: number, so = SO_ANH_TRANG): Promise<AnhKhach[]> {
  const { data } = await sb().from("khach_anh").select(COT).eq("khach_id", khachId)
    .order("ngay_chup", { ascending: false }).order("tao_luc", { ascending: false }).order("id").range(tu, tu + so - 1);
  return kemLink((data ?? []) as unknown as Dong[]);
}

/** Cấp lại link cho vài ảnh (link cũ hết hạn khi mở tab quá lâu). */
export async function docAnhTheoMa(khachId: string, ids: string[]): Promise<AnhKhach[]> {
  const { data } = await sb().from("khach_anh").select(COT).eq("khach_id", khachId).in("id", ids);
  return kemLink((data ?? []) as unknown as Dong[]);
}
