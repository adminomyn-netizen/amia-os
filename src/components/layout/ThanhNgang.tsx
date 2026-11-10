"use client";

import { LinkNhe } from "@/components/ui/LinkNhe";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { MENU, mucDangChon } from "@/lib/nav";

export type MucNgang = {
  ten: string; ngan: string; duong_dan: string; nhom: string; moTa: string;
  con: { nhan: string; the: { ten: string; duongDan: string; moTa: string }[] }[];
  /** Số đỏ cạnh tên mục (vd số lịch hẹn hôm nay); 0/không có = không hiện. */
  dem?: number;
};

const KHOA = "amia-thanh-ben-thu-nho", SU_KIEN = "amia-thanh-ben-doi";
const docNho = () => { try { return localStorage.getItem(KHOA) === "1"; } catch { return false; } };
const dangKy = (cb: () => void) => { window.addEventListener(SU_KIEN, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(SU_KIEN, cb); window.removeEventListener("storage", cb); }; };

/** Thanh bên dọc cho máy tính (≥1024px), kiểu BeDental: khối nổi bo góc màu đặc trưng của AMIA nằm DƯỚI đầu trang và tách khỏi đầu trang một khoảng,
 *  cao vừa đủ các mục (không kéo dài xuống đáy). TOÀN BỘ chức năng xếp dọc thành nút có biểu tượng; nút đang mở sáng vàng.
 *  Nút ở góc trên thu nhỏ còn cột biểu tượng; lựa chọn được nhớ trên máy. Điện thoại dùng thanh trên + thanh tab dưới. */
export function ThanhBen({ muc }: { muc: MucNgang[] }) {
  const pathname = usePathname();
  const nho = useSyncExternalStore(dangKy, docNho, () => false);
  const doi = () => { try { localStorage.setItem(KHOA, nho ? "0" : "1"); } catch { /* không có bộ nhớ thì bỏ qua */ } window.dispatchEvent(new Event(SU_KIEN)); };
  return (
    <aside className={`thanh-ben khong-in sticky top-[84px] m-4 mr-0 hidden shrink-0 flex-col self-start lg:flex ${nho ? "w-[72px]" : "w-[236px]"}`}>
      <div className={`flex px-3 pt-3 ${nho ? "justify-center" : "justify-end"}`}>
        <button type="button" onClick={doi} aria-label={nho ? "Mở rộng menu" : "Thu nhỏ menu"} title={nho ? "Mở rộng menu" : "Thu nhỏ menu"} className="muc-menu flex h-9 w-9 items-center justify-center rounded-nho">
          {nho ? <ChevronsRight strokeWidth={1.7} className="h-[18px] w-[18px]" aria-hidden /> : <ChevronsLeft strokeWidth={1.7} className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      </div>
      <nav aria-label="Menu chính" className="khong-thanh-cuon max-h-[calc(100dvh-140px)] overflow-y-auto overscroll-contain px-3 pb-4 pt-1">
        <ul className="space-y-1">
          {muc.map((m) => {
            const Icon = MENU.find((x) => x.duong_dan === m.duong_dan)!.icon;
            const dang = mucDangChon(pathname, m.duong_dan);
            return (
              <li key={m.duong_dan}>
                <LinkNhe href={m.duong_dan} title={nho ? m.ten : m.moTa} aria-label={nho ? m.ten : undefined} aria-current={dang ? "page" : undefined}
                  className={`muc-menu relative flex h-10 items-center gap-3 rounded-nho text-[14.5px] ${nho ? "justify-center px-0" : "px-3.5"}`}>
                  <Icon strokeWidth={1.7} className="h-[19px] w-[19px] shrink-0" aria-hidden />{!nho && <span className="min-w-0 truncate">{m.ten}</span>}{!!m.dem && <span className={`${nho ? "absolute right-1.5 top-1.5" : "ml-auto"} flex h-[18px] min-w-[18px] items-center justify-center rounded-[50%] bg-loi px-1 text-[11px] font-semibold leading-none text-white`} aria-label={`${m.dem} lịch hôm nay`}>{m.dem}</span>}
                </LinkNhe>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
