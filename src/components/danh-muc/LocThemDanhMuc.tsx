import Link from "next/link";

export type MucLoc = { gia_tri: string; nhan: string };

/** Hàng lọc phụ của Danh mục như SalonHero: "Tất cả các chi nhánh / từng chi nhánh" và "Tùy chọn nơi hiển thị".
 *  Chỉ là đường dẫn (GET), giữ nguyên các tham số lọc khác; đổi lọc thì về trang 1. */
export function LocThemDanhMuc({ ten, nhanTatCa, muc, chon, thamSo, aria }: { ten: string; nhanTatCa: string; muc: MucLoc[]; chon: string; thamSo: Record<string, string>; aria: string }) {
  const href = (v: string) => {
    const u = new URLSearchParams(Object.entries({ ...thamSo, [ten]: v }).filter(([, x]) => x));
    return `/danh-muc?${u}`;
  };
  const chip = (act: boolean) => `rounded-nho px-3 py-1.5 text-[13px] ${act ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`;
  return (
    <nav aria-label={aria} className="mb-3 flex flex-wrap gap-1.5">
      <Link href={href("")} className={chip(!chon)}>{nhanTatCa}</Link>
      {muc.map((m) => <Link key={m.gia_tri} href={href(m.gia_tri)} className={chip(chon === m.gia_tri)}>{m.nhan}</Link>)}
    </nav>
  );
}
