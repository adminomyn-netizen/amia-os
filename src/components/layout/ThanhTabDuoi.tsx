"use client";

import { LinkNhe } from "@/components/ui/LinkNhe";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Grid2x2, X } from "lucide-react";
import { gomTheoNhom, MENU, mucDangChon } from "@/lib/nav";

type MucDto = { ten: string; duong_dan: string; nhom: string; moTa: string };
const UU_TIEN = ["/trang-chu", "/lich-hen", "/ban-hang", "/khach-hang", "/the", "/kho-mua-sam", "/noi-lam-viec", "/bao-cao"];

/** Thanh tab nổi dưới đáy cho điện thoại: 4 mục dùng nhiều nhất người này được phép + "Thêm" mở bảng các mục còn lại. */
export function ThanhTabDuoi({ muc }: { muc: MucDto[] }) {
  const pathname = usePathname();
  // Mở gắn với trang đang xem: đổi trang là tự đóng, không cần effect.
  const [moTai, setMoTai] = useState<string | null>(null);
  const mo = moTai === pathname;
  const setMo = (b: boolean) => setMoTai(b ? pathname : null);
  useEffect(() => {
    if (!mo) return;
    const phim = (e: KeyboardEvent) => e.key === "Escape" && setMo(false);
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo]);

  const co = new Set(muc.map((m) => m.duong_dan));
  const chinh = UU_TIEN.filter((d) => co.has(d)).slice(0, 4).map((d) => MENU.find((m) => m.duong_dan === d)!).filter(Boolean);
  // Bảng "Thêm" chỉ liệt kê những mục chưa có trên thanh tab, tránh lặp.
  const tren = new Set(chinh.map((m) => m.duong_dan));
  const nhom = gomTheoNhom(muc.filter((m) => !tren.has(m.duong_dan)).map((m) => MENU.find((x) => x.duong_dan === m.duong_dan)!).filter(Boolean));
  const dang = (d: string) => mucDangChon(pathname, d);

  return (
    <>
      <nav className="thanh-tab khong-in" aria-label="Điều hướng nhanh">
        {chinh.map((m) => {
          const Icon = m.icon;
          return (
            <LinkNhe key={m.duong_dan} href={m.duong_dan} aria-current={dang(m.duong_dan) ? "page" : undefined}>
              <ChoTab />
              <Icon strokeWidth={1.7} className="h-[22px] w-[22px]" />
              <span>{m.ten.length > 11 ? m.ten.split(" ")[0] : m.ten}</span>
            </LinkNhe>
          );
        })}
        <button type="button" onClick={() => setMo(true)} aria-haspopup="dialog" aria-expanded={mo}>
          <Grid2x2 strokeWidth={1.7} className="h-[22px] w-[22px]" /><span>Thêm</span>
        </button>
      </nav>
      {mo && (
        <div className="fixed inset-0 z-50 lg:hidden khong-in" role="dialog" aria-modal="true" aria-label="Thêm chức năng">
          <button type="button" aria-label="Đóng" className="absolute inset-0 bg-muc/45" onClick={() => setMo(false)} />
          <div className="bang-duoi vao absolute inset-x-0 bottom-0 flex max-h-[86dvh] flex-col overflow-hidden rounded-t-[20px] bg-giay shadow-[0_-18px_40px_-12px_rgba(6,26,23,0.5)]">
            <div className="nen-toi relative shrink-0 px-4 pb-4 pt-3 text-white">
              <div className="mx-auto mb-3 h-1 w-10 rounded-[3px] bg-white/30" aria-hidden />
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-[180px] w-[180px]" style={{ background: "radial-gradient(closest-side, rgb(217 184 119 / 0.35), transparent)" }} />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-bold">Thêm chức năng</h2>
                  <p className="mt-0.5 text-[12.5px] text-menu-chu-phu">{nhom.reduce((a, g) => a + g.muc.length, 0)} mục · chạm để mở</p>
                </div>
                <button type="button" onClick={() => setMo(false)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-nho border border-white/20 text-white hover:bg-white/10"><X strokeWidth={1.8} className="h-5 w-5" /></button>
              </div>
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--nhan), #ba9551 60%, transparent)" }} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
              {nhom.map((g, gi) => {
                const SAC = [["bg-sac-luc-nen", "text-sac-luc"], ["bg-sac-xanh-nen", "text-sac-xanh"], ["bg-sac-cam-nen", "text-sac-cam"], ["bg-sac-tim-nen", "text-sac-tim"], ["bg-sac-hong-nen", "text-sac-hong"]][gi % 5];
                return (
                  <section key={g.nhom} className="mb-5">
                    <div className="mb-2.5 flex items-center gap-2"><h3 className="nhan-muc shrink-0">{g.nhom}</h3><span aria-hidden className="h-px flex-1 bg-vien" /></div>
                    <ul className="grid grid-cols-3 gap-2.5">
                      {g.muc.map((m) => {
                        const Icon = m.icon, chon = dang(m.duong_dan);
                        return (
                          <li key={m.duong_dan}>
                            <LinkNhe href={m.duong_dan} aria-current={chon ? "page" : undefined}
                              className={`flex h-full min-h-[92px] flex-col items-center justify-center gap-2 rounded-the border px-1.5 py-3 text-center text-[12.5px] font-medium leading-tight transition-colors active:scale-[0.98] ${chon ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien bg-giay-sang text-muc shadow-[0_1px_2px_rgba(6,26,23,0.05)]"}`}>
                              <span className={`flex h-10 w-10 items-center justify-center rounded-the ${chon ? "bg-nhan text-white" : `${SAC[0]} ${SAC[1]}`}`}><Icon strokeWidth={1.7} className="h-5 w-5" /></span>
                              {m.ten}
                            </LinkNhe>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Lớp sáng trong mục tab vừa chạm, trong lúc trang mới đang mở (useLinkStatus). */
function ChoTab() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden className="tab-cho" /> : null;
}
