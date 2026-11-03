import Link from "next/link";

/** Thanh liên kết của "Quản lý kho hàng bán" như SalonHero #/inventory: Tồn kho · Phiếu nhập · Phiếu xuất · Phiếu chuyển kho · Quản lý nhà cung cấp. */
const LIEN_KET = [
  { ma: "ton", ten: "Tồn kho", url: "/kho/hang-ban" }, { ma: "nhap", ten: "Phiếu nhập", url: "/kho/phieu-nhap" }, { ma: "xuat", ten: "Phiếu xuất", url: "/kho/phieu-xuat" },
  { ma: "chuyen", ten: "Phiếu chuyển kho", url: "/kho/chuyen-kho" }, { ma: "ncc", ten: "Quản lý nhà cung cấp", url: "/kho-mua-sam/nha-cung-cap" },
] as const;

export function ThanhKhoHangBan({ dang }: { dang: (typeof LIEN_KET)[number]["ma"] }) {
  return (
    <nav aria-label="Kho hàng bán" className="mb-5 flex gap-1 overflow-x-auto border-b border-vien">
      {LIEN_KET.map((l) => <Link key={l.ma} href={l.url} aria-current={l.ma === dang ? "page" : undefined} className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] ${l.ma === dang ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>{l.ten}</Link>)}
    </nav>
  );
}
