import Image from "next/image";
import Link from "next/link";

/** Khung CỔNG CTV CÔNG KHAI (/ctv…): không dùng phiên nhân viên, không có menu phần mềm. Thiết kế cho điện thoại trước. */
export default function KhungCtv({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-giay text-muc">
      <header className="border-b border-vien bg-giay-sang">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/ctv" aria-label="AMIA · Cổng đối tác"><Image src="/logo-amia.png" alt="AMIA" width={600} height={272} priority className="h-auto w-[96px]" /></Link>
          <span className="text-[13px] font-medium text-muc-2">Cổng đối tác giới thiệu</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-8 pt-2 text-center text-[12.5px] leading-relaxed text-muc-3">
        <div className="font-medium text-nhan-dam">AMIA · Phòng khám da liễu · Tiên phong công nghệ cao</div>
        <div>39A Lê Hồng Phong, TP. Vinh · Giấy phép 1233/NA-GPHĐ</div>
        <div className="mt-1"><Link href="/ctv/dieu-khoan" className="underline">Điều khoản chương trình &amp; Chính sách bảo mật</Link></div>
      </footer>
    </div>
  );
}
