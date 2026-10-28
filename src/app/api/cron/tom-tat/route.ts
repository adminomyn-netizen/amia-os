import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { layCanhBao } from "@/lib/canh-bao";
import { guiChoNhanVien } from "@/lib/push";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { laVaiTro, quyenHieuLuc } from "@/lib/quyen";

export const maxDuration = 60;

/** Tóm tắt 8 giờ sáng (01:00 UTC): mỗi người đã bật thông báo nhận một dòng "hôm nay bạn có N lịch · M việc đang chờ". Không có gì thì không gửi. Vercel Cron gọi kèm CRON_SECRET. */
export async function GET(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const db = sb();
  const { data: dk } = await db.from("dang_ky_thong_bao").select("nhan_vien_id");
  const ids = [...new Set((dk ?? []).map((d) => d.nhan_vien_id))];
  if (ids.length === 0) return NextResponse.json({ nguoi: 0, daGui: 0 });
  const { data: nvs } = await db.from("nhan_vien").select("id, ho_ten, vai_tro, quyen_rieng, chi_nhanh_id, hoat_dong").in("id", ids).eq("hoat_dong", true);
  const homNay = homNayHCM(), tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  let daGui = 0;
  for (const n of nvs ?? []) {
    if (!laVaiTro(n.vai_tro)) continue;
    const nd = { nhanVienId: n.id, vaiTro: n.vai_tro, quyen: quyenHieuLuc(n.vai_tro, n.quyen_rieng), chiNhanhId: n.chi_nhanh_id };
    const [cb, { count: lich }] = await Promise.all([layCanhBao(nd), db.from("lich_hen").select("id", { count: "exact", head: true }).eq("nhan_vien_id", n.id).gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)")]);
    const phan = [lich ? `${lich} lịch của bạn` : "", cb.length ? `${cb.length} việc đang chờ` : ""].filter(Boolean);
    if (phan.length === 0) continue;
    const kq = await guiChoNhanVien([n.id], { tieuDe: "Chào buổi sáng, " + n.ho_ten.split(" ").slice(-1)[0], noiDung: `Hôm nay: ${phan.join(" · ")}.`, url: "/trang-chu", tag: "tom-tat" });
    daGui += kq.thanhCong;
  }
  return NextResponse.json({ nguoi: nvs?.length ?? 0, daGui });
}
