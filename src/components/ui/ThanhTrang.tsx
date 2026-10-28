import Link from "next/link";

/** Thanh phân trang kiểu Đầu tiên / Trước đó / Tiếp theo / Cuối cùng (giống báo cáo Đánh giá). `gan(trang)` trả địa chỉ giữ nguyên các bộ lọc khác; trang 1 dùng `gan(undefined)`. */
const NUT = "rounded-nho border border-vien-dam px-3 py-1.5 text-[13px] text-muc-2 hover:bg-giay-tram aria-disabled:pointer-events-none aria-disabled:opacity-40";
export function ThanhTrang({ trang, tong, moi, gan, don = "dữ liệu", luonHien = false, nhanNut = ["Đầu tiên", "Trước đó", "Tiếp theo", "Cuối cùng"] }: { trang: number; tong: number; moi: number; gan: (trang: number | undefined) => string; don?: string; luonHien?: boolean; nhanNut?: [string, string, string, string] }) {
  const cuoi = Math.max(1, Math.ceil(tong / moi));
  if (cuoi <= 1 && !luonHien) return null;
  return (
    <nav aria-label="Phân trang" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muc-3">
      <span>Hiện {tong === 0 ? 0 : (trang - 1) * moi + 1} đến {Math.min(trang * moi, tong)} của {tong.toLocaleString("vi-VN")} {don}</span>
      <span className="flex gap-2">
        <Link href={gan(undefined)} aria-disabled={trang <= 1} className={NUT}>{nhanNut[0]}</Link>
        <Link href={gan(trang - 1 <= 1 ? undefined : trang - 1)} aria-disabled={trang <= 1} className={NUT}>{nhanNut[1]}</Link>
        <Link href={gan(Math.min(trang + 1, cuoi))} aria-disabled={trang >= cuoi} className={NUT}>{nhanNut[2]}</Link>
        <Link href={gan(cuoi)} aria-disabled={trang >= cuoi} className={NUT}>{nhanNut[3]}</Link>
      </span>
    </nav>
  );
}
