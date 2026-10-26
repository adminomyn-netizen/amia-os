import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { DangKyUngDung } from "@/components/layout/DangKyUngDung";

/** Be Vietnam Pro: phông do nhà thiết kế Việt vẽ riêng cho tiếng Việt (dấu cân, không méo). Một họ duy nhất cho cả tiêu đề lẫn nội dung, thay cặp chữ có chân + Roboto quen mắt của các bản mẫu AI (chủ yêu cầu 26/10/2026). */
const beVietnam = Be_Vietnam_Pro({ variable: "--font-be-vietnam", subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "AMIA OS",
  description: "Phần mềm vận hành phòng khám AMIA: khách hàng, lịch hẹn, thu ngân, thẻ liệu trình, cấp vật tư trước ca",
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061a17" }, { media: "(prefers-color-scheme: light)", color: "#0a2b26" }], viewportFit: "cover", width: "device-width", initialScale: 1 };

/** Chạy trước khi vẽ trang để không nháy sáng→tối: lấy lựa chọn đã lưu (sang / toi / may), mặc định theo hệ điều hành. */
const DAT_GIAO_DIEN = `try{var g=localStorage.getItem("amia_giao_dien")||"may";var t=g==="may"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):g==="toi"?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: DAT_GIAO_DIEN }} /></head>
      <body className="flex min-h-full flex-col bg-background text-foreground">{children}<DangKyUngDung /></body>
    </html>
  );
}
