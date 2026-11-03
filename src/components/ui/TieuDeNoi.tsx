import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ComponentType } from "react";
import { BieuTuongChucNang } from "@/components/layout/bieu-tuong";

type BieuTuong = ComponentType<{ className?: string; strokeWidth?: number }>;
const VANG = { background: "linear-gradient(135deg, #e3c68a 0%, #ba9551 55%, #9c7a3a 100%)" } as const;

/** Đầu trang nổi bật (Cài đặt và trang tổng các mục): thẻ sáng có quầng màu thương hiệu, ô biểu tượng vàng, đường quay lại, tiêu đề lớn, mô tả, hành động bên phải, viền vàng dưới.
 *  `icon` cho biểu tượng riêng; không có thì chọn theo tên như thẻ chức năng. */
export function TieuDeNoi({ tieuDe, phu, children, icon: Icon, quayLai, so }: {
  tieuDe: string; phu?: React.ReactNode; children?: React.ReactNode; icon?: BieuTuong; quayLai?: { href: string; nhan: string }; /** Ô số nhỏ cạnh tiêu đề, VD "12 chức năng". */ so?: string;
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-hop border border-vien bg-giay-sang shadow-[0_1px_0_rgb(255_255_255/0.6)_inset,0_6px_24px_rgb(10_43_38/0.06)]">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-28 h-[300px] w-[300px]" style={{ background: "radial-gradient(closest-side, rgb(217 184 119 / 0.28), transparent)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-[260px] w-[260px]" style={{ background: "radial-gradient(closest-side, rgb(20 163 148 / 0.14), transparent)" }} />
      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-the text-espresso shadow-[0_4px_14px_rgb(156_122_58/0.35)] sm:h-14 sm:w-14" style={VANG} aria-hidden>
            {Icon ? <Icon strokeWidth={1.7} className="h-6 w-6 sm:h-7 sm:w-7" /> : <BieuTuongChucNang ten={tieuDe} className="h-6 w-6 sm:h-7 sm:w-7" />}
          </span>
          <div className="min-w-0">
            {quayLai && <Link href={quayLai.href} className="mb-1 inline-flex items-center gap-0.5 text-[12.5px] font-medium text-muc-3 hover:text-nhan-dam"><ChevronLeft className="h-3.5 w-3.5" aria-hidden />{quayLai.nhan}</Link>}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="chu-tieu-de text-[24px] leading-[1.15] text-muc lg:text-[30px]">{tieuDe}</h1>
              {so && <span className="rounded-nho bg-nhan-nhat px-2 py-0.5 text-[12px] font-semibold text-nhan-dam">{so}</span>}
            </div>
            {phu && <div className="mt-1.5 max-w-[720px] text-[14px] leading-relaxed text-muc-3">{phu}</div>}
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
      </div>
      <div aria-hidden className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, var(--nhan) 0%, #ba9551 60%, transparent 100%)" }} />
    </header>
  );
}
