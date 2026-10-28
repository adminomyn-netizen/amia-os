import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { DangKyUngDung } from "@/components/layout/DangKyUngDung";

/** Roboto: đúng phông SalonHero đang dùng (đọc CSS thật 28/10/2026: Google Fonts Roboto, subset vietnamese). Chị Lâm yêu cầu chữ giống SalonHero cho nhân viên quen mắt. */
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400", "500", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "AMIA OS",
  description: "Phần mềm vận hành phòng khám AMIA: khách hàng, lịch hẹn, thu ngân, thẻ liệu trình, cấp vật tư trước ca",
};
export const viewport: Viewport = { themeColor: "#0a2b26", viewportFit: "cover", width: "device-width", initialScale: 1 };

/** Chạy trước khi vẽ trang để không nháy sáng→tối. Mặc định LUÔN sáng ở mọi màn hình; chỉ tối khi người dùng tự bấm nút Tối (lưu ở máy họ). */
const DAT_GIAO_DIEN = `var t="light";try{if(localStorage.getItem("amia_giao_dien")==="toi")t="dark"}catch(e){}document.documentElement.dataset.theme=t;`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${roboto.variable} h-full antialiased`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: DAT_GIAO_DIEN }} /></head>
      <body className="flex min-h-full flex-col bg-background text-foreground">{children}<DangKyUngDung /></body>
    </html>
  );
}
