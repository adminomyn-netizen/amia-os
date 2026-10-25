import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Pos } from "@/components/ban-hang/Pos";
import type { DongDon, MucBan } from "@/lib/ban-hang";
import { chotDonBanHang, layTheTien, timKhach } from "./actions";

export default async function TrangBanHang({ searchParams }: { searchParams: Promise<{ khach?: string; lich?: string }> }) {
  const nd = await yeuCauQuyen("ban.tao");
  const { khach: khachId, lich: lichId } = await searchParams;
  const db = sb();
  const [{ data: dv }, { data: nhomDv }, { data: goi }, { data: sp }, { data: nv }, { data: cn }] = await Promise.all([
    db.from("dich_vu").select("id, ten, gia, nhom_id, vat_pct").eq("hoat_dong", true).order("ten"),
    db.from("dich_vu_nhom").select("id, ten"),
    db.from("goi_the").select("id, ten, gia, loai, so_buoi").eq("hoat_dong", true).order("ten"),
    db.from("san_pham").select("id, ten, gia_ban, nhom").eq("hoat_dong", true).eq("ban_le", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro, chi_nhanh_id").eq("hoat_dong", true).order("ho_ten"),
    db.from("chi_nhanh").select("id").eq("hoat_dong", true).order("ma"),
  ]);
  const tenNhom = new Map((nhomDv ?? []).map((n) => [n.id, n.ten]));
  const muc: MucBan[] = [
    ...(dv ?? []).map((d) => ({ loai: "dich_vu" as const, id: d.id, ten: d.ten, gia: d.gia, nhom: tenNhom.get(d.nhom_id) ?? "Khác" })),
    ...(goi ?? []).map((g) => ({ loai: "goi_the" as const, id: g.id, ten: g.ten, gia: g.gia, nhom: g.loai === "lan" ? "Liệu trình" : "Thẻ tiền" })),
    ...(sp ?? []).map((s) => ({ loai: "san_pham" as const, id: s.id, ten: s.ten, gia: s.gia_ban, nhom: s.nhom ?? "Sản phẩm" })),
  ];
  type K = { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string };
  let khach: K | null = null;
  if (khachId) khach = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id").eq("id", khachId).maybeSingle()).data;
  let dongBanDau: DongDon[] = [];
  let lichDung: string | null = null;
  if (lichId) {
    const { data: l } = await db.from("lich_hen").select("id, khach_id, nhan_vien_id").eq("id", lichId).maybeSingle();
    if (l) {
      lichDung = l.id;
      if (!khach) khach = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id").eq("id", l.khach_id).maybeSingle()).data;
      const { data: ld } = await db.from("lich_hen_dich_vu").select("dich_vu_id, so_luong").eq("lich_id", l.id);
      dongBanDau = (ld ?? []).filter((x) => muc.some((m) => m.loai === "dich_vu" && m.id === x.dich_vu_id)).map((x) => ({
        loai: "dich_vu", ref: x.dich_vu_id, sl: x.so_luong, giam: 0,
        nv: { phuc_vu: l.nhan_vien_id ? [{ id: l.nhan_vien_id, ti: 100 }] : [], tu_van: [], ban: khach?.nguoi_phu_trach_id ? [{ id: khach.nguoi_phu_trach_id, ti: 100 }] : [] },
      }));
    }
  }
  const chiNhanhId = nd.chiNhanhId ?? cn?.[0]?.id ?? "";
  return (
    <>
      <TieuDeTrang tieuDe="Bán hàng" phu="Chọn khách, thêm dịch vụ, thẻ hoặc sản phẩm, ghi người hưởng, thu tiền nhiều lần rồi chốt đơn." />
      <Pos muc={muc} nhanVien={(nv ?? []).map((n) => ({ id: n.id, ten: n.ho_ten, vaiTro: n.vai_tro }))} khachBanDau={khach} dongBanDau={dongBanDau} chiNhanhId={chiNhanhId} lichId={lichDung}
        tim={timKhach} layThe={layTheTien} chot={chotDonBanHang} />
    </>
  );
}
