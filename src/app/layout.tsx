import type { Metadata, Viewport } from "next";
import { Playfair_Display, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin", "latin-ext", "vietnamese"], weight: ["400", "500", "700"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin", "latin-ext", "vietnamese"], weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "AMIA OS",
  description: "Phần mềm vận hành phòng khám AMIA: khách hàng, lịch hẹn, thu ngân, thẻ liệu trình, cấp vật tư trước ca",
};
export const viewport: Viewport = { themeColor: "#faf7f1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${roboto.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
