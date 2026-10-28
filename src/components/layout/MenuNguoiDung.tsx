"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserCog } from "lucide-react";
import { dangXuat } from "@/app/dang-nhap/actions";
import { AnhDaiDien } from "./AnhDaiDien";
import { ChonGiaoDien } from "./ChonGiaoDien";

export type NhomCaiDat = { nhan: string; the: { ten: string; moTa: string; duongDan?: string }[] };
type Props = { hoTen: string; vaiTro: string; chucDanh: string | null; email: string; chiNhanh: string | null; anh: string | null; toi?: boolean; caiDat?: NhomCaiDat[] };

/** Nút "avatar + tên" mở bảng nhỏ: ảnh lớn, họ tên, vị trí đầy đủ (vai trò, chức danh, chi nhánh), email;
 *  rồi lối vào chỉnh thông tin cá nhân / đổi mật khẩu; đăng xuất nằm dưới cùng. Đóng bằng Esc, bấm ra ngoài hoặc chọn một mục. */
export function MenuNguoiDung({ hoTen, vaiTro, chucDanh, email, chiNhanh, anh, toi = false, caiDat = [] }: Props) {
  const [mo, setMo] = useState(false);
  const [moCD, setMoCD] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  const nut = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mo && !moCD) return;
    const ngoai = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) { setMo(false); setMoCD(false); } };
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") { setMo(false); setMoCD(false); nut.current?.focus(); } };
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", phim);
    return () => { document.removeEventListener("mousedown", ngoai); document.removeEventListener("keydown", phim); };
  }, [mo, moCD]);

  return (
    <div ref={goc} className="relative">
      <button ref={nut} type="button" onClick={() => { setMoCD(false); setMo((x) => !x); }} aria-haspopup="menu" aria-expanded={mo} title="Tài khoản của tôi"
        className={`nut-nguoi flex items-center gap-3 rounded-nho py-1 pl-1 ${toi ? "pr-1.5 2xl:pr-2.5" : "pr-2.5"}`}>
        <AnhDaiDien hoTen={hoTen} anh={anh} kichCo={38} />
        <span className={`hidden text-left leading-tight ${toi ? "2xl:block" : "sm:block"}`}>
          <span className={`block max-w-[170px] truncate text-[14px] font-medium ${toi ? "text-menu-sang" : "text-muc"}`}>{hoTen}</span>
          <span className={`block text-[12px] ${toi ? "text-menu-chu-phu" : "text-muc-3"}`}>{vaiTro}</span>
        </span>
        <ChevronDown strokeWidth={1.8} className={`h-4 w-4 ${toi ? "text-menu-chu-phu" : "text-muc-3"} transition-transform ${mo ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {mo && (
        <div role="menu" aria-label="Tài khoản" style={{ position: "absolute" }} className="the-noi the-noi-thap vao right-0 top-full z-50 mt-2.5 w-[312px] max-w-[calc(100vw-24px)] overflow-hidden">
          <div className="flex items-center gap-4 px-5 pb-4 pt-6">
            <AnhDaiDien hoTen={hoTen} anh={anh} kichCo={56} />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-muc">{hoTen}</div>
              <div className="mt-0.5 text-[13px] text-nhan-dam">{vaiTro}{chucDanh && chucDanh !== vaiTro ? ` · ${chucDanh}` : ""}</div>
            </div>
          </div>
          <dl className="space-y-2.5 border-t border-vien px-5 py-3.5 text-[13px]">
            <div><dt className="nhan-muc">Email đăng nhập</dt><dd className="mt-0.5 break-all text-muc-2">{email}</dd></div>
            <div><dt className="nhan-muc">Chi nhánh</dt><dd className="mt-0.5 text-muc-2">{chiNhanh ?? "Mọi chi nhánh"}</dd></div>
          </dl>
          <ChonGiaoDien />
          <div className="border-t border-vien p-2">
            {caiDat.length > 0 && (
              <button type="button" role="menuitem" onClick={() => { setMo(false); setMoCD(true); }} className="flex w-full items-center gap-3 rounded-nho px-3 py-2.5 text-left text-[14px] font-medium text-muc hover:bg-giay-tram">
                <Settings strokeWidth={1.6} className="h-[18px] w-[18px] text-nhan" aria-hidden />Cài đặt hệ thống
                <span className="ml-auto text-muc-3" aria-hidden>›</span>
              </button>
            )}
            <Link href="/tai-khoan" role="menuitem" onClick={() => setMo(false)} className="flex items-center gap-3 rounded-nho px-3 py-2.5 text-[14px] text-muc hover:bg-giay-tram">
              <UserCog strokeWidth={1.6} className="h-[18px] w-[18px] text-muc-3" aria-hidden />Thông tin cá nhân & đổi mật khẩu
            </Link>
          </div>
          <form action={dangXuat} className="border-t border-vien p-2">
            <button type="submit" role="menuitem" className="flex w-full items-center gap-3 rounded-nho px-3 py-2.5 text-left text-[14px] text-loi hover:bg-loi-nen">
              <LogOut strokeWidth={1.6} className="h-[18px] w-[18px]" aria-hidden />Đăng xuất
            </button>
          </form>
        </div>
      )}
      {moCD && (
        <div role="dialog" aria-label="Cài đặt hệ thống" className="the-noi the-noi-thap vao fixed inset-x-3 top-[76px] z-50 mx-auto max-h-[calc(100vh-96px)] max-w-[1080px] overflow-y-auto p-5 sm:inset-x-6 lg:left-[268px] lg:right-6 lg:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-vien pb-3">
            <h2 className="flex items-center gap-2.5 text-[16px] font-semibold text-muc"><Settings strokeWidth={1.6} className="h-[19px] w-[19px] text-nhan" aria-hidden />Cài đặt hệ thống</h2>
            <button type="button" onClick={() => setMoCD(false)} className="rounded-nho px-3 py-1.5 text-[13px] text-muc-2 hover:bg-giay-tram">Đóng</button>
          </div>
          <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {caiDat.map((g) => (
              <section key={g.nhan} className="min-w-0">
                <h3 className="nhan-muc mb-2">{g.nhan}</h3>
                <ul className="space-y-0.5">
                  {g.the.map((t) => (
                    <li key={t.ten}>
                      {t.duongDan ? (
                        <Link href={t.duongDan} onClick={() => setMoCD(false)} title={t.moTa} className="block rounded-nho px-2.5 py-2 text-[14px] text-muc hover:bg-giay-tram">{t.ten}</Link>
                      ) : (
                        <span className="flex items-center justify-between gap-2 rounded-nho px-2.5 py-2 text-[14px] text-muc-3">{t.ten}<span className="text-[11px]">Sắp có</span></span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
