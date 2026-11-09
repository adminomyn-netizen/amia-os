import type { Metadata } from "next";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { gioBaThu, type KhoaThu } from "@/lib/gio-lam-viec";
import { NOI_DAT_LICH } from "@/lib/ban-hang";
import { anhBlogUrl } from "@/lib/blog";
import { layWebDatLich, thoiLuongMacDinh } from "@/lib/web-dat-lich";
import { FormDatLich, type CnDat, type DvDat, type NvDat } from "./FormDatLich";
import { hoiDapDatLich, type NgonNgu } from "./chu";

export const dynamic = "force-dynamic";

const GOC = (process.env.NEXT_PUBLIC_SITE_URL || "https://lammec.mscvn.com").replace(/\/$/, "");
const GIAY_PHEP = "1233/NA-GPHĐ";
const THU_JS: KhoaThu[] = ["cn", "t2", "t3", "t4", "t5", "t6", "t7"];
const SCHEMA_THU: Record<KhoaThu, string> = { t2: "Monday", t3: "Tuesday", t4: "Wednesday", t5: "Thursday", t6: "Friday", t7: "Saturday", cn: "Sunday" };

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const en = (await searchParams).lang === "en";
  const title = en ? "Book an appointment online · AMIA Dermatology Clinic, Vinh" : "Đặt lịch hẹn online · AMIA Phòng khám da liễu Vinh";
  const description = en
    ? "Book at AMIA – dermatology clinic pioneering high-tech care at 39A Le Hong Phong, Vinh. See open slots in real time; reception calls to confirm."
    : "Đặt lịch online tại AMIA – Phòng khám da liễu tiên phong công nghệ cao, 39A Lê Hồng Phong, TP. Vinh. Xem khung giờ còn trống, lễ tân gọi xác nhận.";
  return {
    metadataBase: new URL(GOC), title, description,
    keywords: ["AMIA", "phòng khám da liễu Vinh", "đặt lịch da liễu", "tiên phong công nghệ cao", "chăm sóc da Nghệ An", "AMIA Beauty Center"],
    alternates: { canonical: en ? "/dat-lich?lang=en" : "/dat-lich", languages: { vi: "/dat-lich", en: "/dat-lich?lang=en" } },
    openGraph: { type: "website", url: en ? "/dat-lich?lang=en" : "/dat-lich", siteName: "AMIA", locale: en ? "en_US" : "vi_VN", title, description, images: [{ url: "/logo-amia.png", width: 600, height: 272, alt: "AMIA" }] },
    twitter: { card: "summary", title, description, images: ["/logo-amia.png"] },
    robots: { index: true, follow: true },
  };
}

/** TRANG CÔNG KHAI (không đăng nhập) y SalonHero amia.salonhero.vn/dat-lich: chỉ hiện tên/địa chỉ chi nhánh, giờ mở cửa, dịch vụ (khi cài đặt bật), tên người làm (khi bật "Cho phép chọn stylist"). Không có dữ liệu khách.
 *  Kèm dữ liệu có cấu trúc (MedicalClinic + FAQPage + danh mục dịch vụ) để Google và trợ lý AI đọc đúng tên, địa chỉ, giờ mở cửa, cách đặt lịch. */
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
    const tuan = gioBaThu(c.gio_lam_viec, ch?.gio_lam_viec);
    const g = tuan[thu];
    return {
      id: c.id, ten: c.ten, diaChi: c.dia_chi ?? "", khuVuc: c.thanh_pho ?? "", dienThoai: c.dien_thoai ?? "", gioHomNay: g.nghi ? null : `${g.mo} – ${g.dong}`, datDuoc: coCho.has(c.id),
      gioTuan: THU_JS.map((k) => (tuan[k].nghi ? null : `${tuan[k].mo} – ${tuan[k].dong}`)),
    };
  });
  const tenNhom = new Map((nhomKq.data ?? []).map((n) => [n.id, n.ten]));
  const dichVu: DvDat[] = (dvKq.data ?? []).map((d) => ({ id: d.id, ten: d.ten, phut: d.thoi_luong_phut, nhom: tenNhom.get(d.nhom_id) ?? "Dịch vụ", cn: d.chi_nhanh_ids, ...(web.hienGia ? { gia: Number(d.gia) } : {}) }));
  const nhanVien: NvDat[] = (nvKq.data ?? []).map((n) => ({ id: n.id, ten: n.ho_ten.replace(/^MSC[.\-A-Z0-9]*\.\s*/, "").trim() || n.ho_ten, chucDanh: n.chuc_danh ?? "", cn: n.chi_nhanh_id }));
  const mo = !web.khoaTrang && chiNhanh.some((c) => c.datDuoc);
  const sdt = ch?.dien_thoai || chiNhanh.map((c) => c.dienThoai).find(Boolean) || "";
  const tenCuaHang = ch?.ten_thuong_hieu || "AMIA Beauty Center";
  const soNgay = Math.min(web.toiDaNgay, 60);
  const cnDau = chiNhanh.find((c) => c.datDuoc) ?? chiNhanh[0];
  const hoiDap = hoiDapDatLich(nn, { ten: "AMIA", diaChi: cnDau?.diaChi ?? "", sdt, soNgay, baoTruocPhut: web.baoTruocPhut, khungPhut: web.khungPhut, giayPhep: GIAY_PHEP, gioHomNay: cnDau?.gioHomNay ?? null });

  // Dữ liệu có cấu trúc schema.org: phòng khám (tên, địa chỉ, giờ, điện thoại, giấy phép, cách đặt lịch) + hỏi đáp + danh mục dịch vụ.
  const ldPhongKham = (cn ?? []).map((c) => {
    const tuan = gioBaThu(c.gio_lam_viec, ch?.gio_lam_viec);
    return {
      "@type": ["MedicalClinic", "LocalBusiness"], "@id": `${GOC}/dat-lich#${c.id}`, name: /^amia/i.test(c.ten) ? c.ten : `AMIA – ${c.ten}`, alternateName: tenCuaHang,
      description: "AMIA · Phòng khám da liễu · Tiên phong công nghệ cao", medicalSpecialty: "Dermatology", url: `${GOC}/dat-lich`, image: `${GOC}/logo-amia.png`, logo: `${GOC}/logo-amia.png`,
      telephone: c.dien_thoai || sdt || undefined, priceRange: "$$", currenciesAccepted: "VND", isAcceptingNewPatients: true,
      address: { "@type": "PostalAddress", streetAddress: c.dia_chi ?? undefined, addressLocality: c.thanh_pho || "Vinh", addressRegion: "Nghệ An", addressCountry: "VN" },
      hasCredential: { "@type": "EducationalOccupationalCredential", credentialCategory: "Giấy phép hoạt động khám bệnh, chữa bệnh", identifier: GIAY_PHEP },
      openingHoursSpecification: THU_JS.filter((k) => !tuan[k].nghi).map((k) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_THU[k], opens: tuan[k].mo, closes: tuan[k].dong })),
      potentialAction: { "@type": "ReserveAction", target: { "@type": "EntryPoint", urlTemplate: `${GOC}/dat-lich`, inLanguage: nn, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] }, result: { "@type": "Reservation", name: nn === "en" ? "Appointment" : "Lịch hẹn" } },
      hasOfferCatalog: web.hienDvSp && dichVu.length ? {
        "@type": "OfferCatalog", name: nn === "en" ? "Services" : "Dịch vụ",
        itemListElement: dichVu.filter((d) => !d.cn?.length || d.cn.includes(c.id)).slice(0, 120).map((d) => ({
          "@type": "Offer", itemOffered: { "@type": "MedicalProcedure", name: d.ten, ...(d.phut ? { duration: `PT${d.phut}M` } : {}) }, ...(d.gia ? { price: d.gia, priceCurrency: "VND" } : {}),
        })),
      } : undefined,
    };
  });
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      ...ldPhongKham,
      { "@type": "WebPage", "@id": `${GOC}/dat-lich#trang`, url: `${GOC}/dat-lich`, name: nn === "en" ? "Book an appointment · AMIA" : "Đặt lịch hẹn · AMIA", inLanguage: nn, about: ldPhongKham.map((x) => ({ "@id": x["@id"] })) },
      { "@type": "FAQPage", "@id": `${GOC}/dat-lich#hoi-dap`, inLanguage: nn, mainEntity: hoiDap.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };

  // Màu trang (SalonHero "Đặt màu cho web đặt lịch"): bỏ tick "Mặc định" thì thay màu nhấn bằng màu đã chọn.
  const mau = web.macDinhMau ? undefined : ({ "--nhan": web.mau, "--nhan-dam": web.mau } as React.CSSProperties);
  return (
    <div style={mau} lang={nn} className="min-h-dvh bg-giay">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <FormDatLich
        nn={nn} mo={mo} sdt={sdt} tenCuaHang={tenCuaHang} anhBia={anhBlogUrl(web.anhBia)} giayPhep={GIAY_PHEP} hoiDap={hoiDap}
        chiNhanh={chiNhanh} dichVu={web.hienDvSp ? dichVu : []} nhanVien={nhanVien}
        homNay={homNay} soNgay={soNgay} khungPhut={web.khungPhut} hienBuoi={web.hienBuoi} doiTuong={web.doiTuong}
        phutMacDinh={thoiLuongMacDinh(web)}
      />
    </div>
  );
}
