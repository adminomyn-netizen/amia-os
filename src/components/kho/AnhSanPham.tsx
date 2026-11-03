import { urlAnhDanhMuc } from "@/lib/danh-muc";

/** Ảnh nhỏ 40×40 của sản phẩm trên các bảng kho (cột "Ảnh" như SalonHero); chưa có ảnh thì hiện ô trống viền đứt. */
export function AnhSanPham({ anh, ten }: { anh: string | null; ten: string }) {
  const u = urlAnhDanhMuc(anh);
  // eslint-disable-next-line @next/next/no-img-element
  if (u) return <img src={u} alt={`Ảnh: ${ten}`} width={40} height={40} loading="lazy" className="h-10 w-10 rounded-nho border border-vien object-cover" />;
  return <span role="img" aria-label="Chưa có ảnh" className="block h-10 w-10 rounded-nho border border-dashed border-vien bg-giay-tram" />;
}
