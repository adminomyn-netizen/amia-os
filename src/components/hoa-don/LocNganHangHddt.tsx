import Link from "next/link";
import { chuyenNhomLoc, dsNhomLoc, ghiNhomLoc, type NhomLoc } from "@/lib/hoa-don-dien-tu-ngan-hang";

const CHIP = "inline-flex h-9 items-center rounded-nho border px-3 text-[13.5px] transition-colors";
const BAT = "border-nhan bg-nhan-nhat font-medium text-nhan-dam";
const TAT = "border-vien-dam text-muc-2 hover:bg-giay-tram";

/** Lọc nhanh theo nơi nhận tiền ở ngăn "Cần xuất": Tất cả + từng tài khoản trong Cài đặt › Tài khoản Ngân Hàng + Ngân hàng khác + Chưa rõ + Tiền mặt. Chọn được nhiều. Là các liên kết (máy chủ dựng lại danh sách), không cần JavaScript. */
export function LocNganHangHddt({ nh, taiKhoan, tu, den, q }: { nh: NhomLoc[] | null; taiKhoan: string[]; tu: string; den: string; q: string }) {
  const href = (v: NhomLoc[] | null) => `/tai-chinh/hoa-don-dien-tu?${new URLSearchParams({ tab: "can", tu, den, ...(q ? { q } : {}), nh: ghiNhomLoc(v) })}`;
  return (
    <div className="mb-4" role="group" aria-label="Lọc theo nơi nhận tiền">
      <p className="mb-1.5 text-[13px] text-muc-3">Tiền thu vào</p>
      <div className="flex flex-wrap gap-2">
        <Link href={href(null)} scroll={false} aria-pressed={nh === null} className={`${CHIP} ${nh === null ? BAT : TAT}`}>Tất cả</Link>
        {dsNhomLoc(taiKhoan).map((n) => {
          const bat = nh?.includes(n.ma) ?? false;
          return <Link key={n.ma} href={href(chuyenNhomLoc(nh, n.ma, taiKhoan))} scroll={false} aria-pressed={bat} className={`${CHIP} ${bat ? BAT : TAT}`}>{n.nhan}</Link>;
        })}
      </div>
      {taiKhoan.length === 0 && <p className="mt-1.5 text-[12.5px] text-muc-3">Chưa có tài khoản nhận tiền nào. Thêm ở Cài đặt › Tài khoản Ngân Hàng.</p>}
    </div>
  );
}
