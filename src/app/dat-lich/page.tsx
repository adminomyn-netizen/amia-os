import type { Metadata } from "next";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { gioBaThu, type KhoaThu } from "@/lib/gio-lam-viec";
import { NOI_DAT_LICH } from "@/lib/ban-hang";
import { anhBlogUrl } from "@/lib/blog";
import { layWebDatLich, thoiLuongMacDinh } from "@/lib/web-dat-lich";
import { FormDatLich, type CnDat, type DvDat, type NvDat } from "./FormDatLich";
import type { NgonNgu } from "./chu";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Đặt lịch hẹn · AMIA", description: "Chọn chi nhánh và giờ hẹn tại AMIA Beauty Center.", robots: { index: false } };

const THU_JS: KhoaThu[] = ["cn", "t2", "t3", "t4", "t5", "t6", "t7"];

/** TRANG CÔNG KHAI (không đăng nhập) y SalonHero amia.salonhero.vn/dat-lich: chỉ hiện tên/địa chỉ chi nhánh, giờ mở cửa, dịch vụ (khi cài đặt bật), tên người làm (khi bật "Cho phép chọn stylist"). Không có dữ liệu khách. */
export default async function TrangDatLich({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const db = sb();
  const web = await layWebDatLich(db);
  const sp = await searchParams;
  const nn: NgonNgu = sp.lang === "en" || sp.lang === "vi" ? sp.lang : web.ngonNgu === "en" ? "en" : "vi";
  const [{ data: ch }, { data: cn }, { data: cho }, dvKq, nhomKq, nvKq] = await Promise.all([
    db.from("cua_hang").select("ten_thuong_hieu, dien_thoai, gio_lam_viec").eq("id", 1).maybeSingle(),
    db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai, thanh_pho, gio_lam_viec").eq("hoat_dong", true).eq("hien_dat_lich", true).order("thu_tu").order("ma"),
    db.from("cho_lam").select("chi_nhanh_id").eq("hoat_dong", true),
    db.from("dich_vu").select("id, ten, gia, thoi_luong_phut, nhom_id, chi_nhanh_ids").eq("hoat_dong", true).eq("dat_online", true).in("noi_hien_thi", NOI_DAT_LICH).order("ma"),
    db.from("dich_vu_nhom").select("id, ten, thu_tu").order("thu_tu"),
    web.chonKtv ? db.from("nhan_vien").select("id, ho_ten, chuc_danh, chi_nhanh_id").eq("hoat_dong", true).eq("la_phuc_vu", true).eq("hien_dat_lich", true).order("ho_ten") : Promise.resolve({ data: [] as { id: string; ho_ten: string; chuc_danh: string | null; chi_nhanh_id: string | null }[] }),
  ]);
  const homNay = homNayHCM();
  const thu = THU_JS[new Date(`${homNay}T12:00:00+07:00`).getUTCDay()];
  const coCho = new Set((cho ?? []).map((x) => x.chi_nhanh_id));
  const chiNhanh: CnDat[] = (cn ?? []).map((c) => {
    const g = gioBaThu(c.gio_lam_viec, ch?.gio_lam_viec)[thu];
    return { id: c.id, ten: c.ten, diaChi: c.dia_chi ?? "", khuVuc: c.thanh_pho ?? "", dienThoai: c.dien_thoai ?? "", gioHomNay: g.nghi ? null : `${g.mo} – ${g.dong}`, datDuoc: coCho.has(c.id) };
  });
  const tenNhom = new Map((nhomKq.data ?? []).map((n) => [n.id, n.ten]));
  const dichVu: DvDat[] = (dvKq.data ?? []).map((d) => ({ id: d.id, ten: d.ten, phut: d.thoi_luong_phut, nhom: tenNhom.get(d.nhom_id) ?? "Dịch vụ", cn: d.chi_nhanh_ids, ...(web.hienGia ? { gia: Number(d.gia) } : {}) }));
  const nhanVien: NvDat[] = (nvKq.data ?? []).map((n) => ({ id: n.id, ten: n.ho_ten, chucDanh: n.chuc_danh ?? "", cn: n.chi_nhanh_id }));
  const mo = !web.khoaTrang && chiNhanh.some((c) => c.datDuoc);
  const sdt = ch?.dien_thoai || chiNhanh.map((c) => c.dienThoai).find(Boolean);
  // Màu trang (SalonHero "Đặt màu cho web đặt lịch"): bỏ tick "Mặc định" thì thay màu nhấn bằng màu đã chọn.
  const mau = web.macDinhMau ? undefined : ({ "--nhan": web.mau, "--nhan-dam": web.mau } as React.CSSProperties);
  return (
    <div style={mau} className="min-h-dvh bg-giay-tram/40">
      <FormDatLich
        nn={nn} mo={mo} sdt={sdt ?? ""} tenCuaHang={ch?.ten_thuong_hieu || "AMIA Beauty Center"} anhBia={anhBlogUrl(web.anhBia)}
        chiNhanh={chiNhanh} dichVu={web.hienDvSp ? dichVu : []} nhanVien={nhanVien}
        homNay={homNay} soNgay={Math.min(web.toiDaNgay, 60)} khungPhut={web.khungPhut} hienBuoi={web.hienBuoi} doiTuong={web.doiTuong}
        phutMacDinh={thoiLuongMacDinh(web)}
      />
    </div>
  );
}
