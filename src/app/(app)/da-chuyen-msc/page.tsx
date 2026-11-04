import Link from "next/link";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { MucTrang } from "@/components/ui/MucTrang";

/** Mọi đường dẫn /nhan-su/... chuyển về đây (xem redirects trong next.config.ts). */
export default function DaChuyenMsc() {
  return (
    <div className="space-y-6">
      <TieuDeNoi tieuDe="Phần Nhân sự đã chuyển sang MSC Group OS" phu="Hồ sơ, chấm công, nghỉ phép, lương, tuyển dụng, đào tạo, KPI và quản lý công việc nội bộ nay nằm ở ứng dụng riêng." />
      <MucTrang noi tieuDe="Mở MSC Group OS">
        <p className="mb-3 text-[14px] text-muc-2">AMIA OS chỉ giữ phần kinh doanh: Marketing, Sale, Tài chính, Kho – Hàng. Tài khoản nhân viên, vai trò, quyền và chi nhánh vẫn dùng chung ở đây.</p>
        <a href="https://mscgroup-os.vercel.app" className="font-medium text-nhan-dam hover:underline" rel="noopener">mscgroup-os.vercel.app</a>
        <p className="mt-4 text-[13px] text-muc-3"><Link href="/trang-chu" className="text-nhan-dam hover:underline">← Về trang chủ</Link></p>
      </MucTrang>
    </div>
  );
}
