import Link from "next/link";
import { NhanTinhTrangThe } from "@/components/the/NhanTinhTrangThe";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";

export type DuLieuKhoiThe = {
  id: string; ma: string; ten: string; loai: string; tinhTrang: string | null;
  buoiCon: number; buoiTong: number | null; soDu: number; tongTien: number | null;
  ngayCap: string | null; han: string | null;
  khach?: { id: string; ten: string; ma?: string | null } | null;
  lanGan?: { ngay: string; dv?: string | null; nv?: string | null } | null;
  lichToi?: string | null; phuTrach?: string | null;
};

/** Thanh tiến độ đã dùng / tổng (thẻ lần) hoặc số dư / đã nạp (thẻ tiền). Không giới hạn buổi thì không vẽ thanh. */
function ThanhTienDo({ t }: { t: DuLieuKhoiThe }) {
  if (t.loai === "lan") {
    const tong = t.buoiTong ?? 0;
    if (!tong || tong >= 999999) return <p className="text-[14px] font-semibold tabular-nums text-muc">Còn {t.buoiCon} buổi{tong >= 999999 ? " · không giới hạn" : ""}</p>;
    const daDung = Math.max(tong - t.buoiCon, 0), pt = Math.min(100, Math.round((daDung / tong) * 100));
    return (
      <div>
        <p className="flex items-baseline justify-between gap-2 text-[13px]"><span className="text-muc-2">Đã dùng <span className="font-semibold tabular-nums text-muc">{daDung}/{tong}</span> buổi</span><span className="font-semibold tabular-nums text-muc">Còn {t.buoiCon}</span></p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-tag bg-giay-tram" role="progressbar" aria-valuemin={0} aria-valuemax={tong} aria-valuenow={daDung} aria-label="Số buổi đã dùng"><div className="h-full bg-nhan" style={{ width: `${pt}%` }} /></div>
      </div>
    );
  }
  const tong = Number(t.tongTien ?? 0), pt = tong > 0 ? Math.min(100, Math.round((t.soDu / tong) * 100)) : 0;
  return (
    <div>
      <p className="flex items-baseline justify-between gap-2 text-[13px]"><span className="text-muc-2">Số dư</span><span className="font-semibold tabular-nums text-muc">{tienVN(t.soDu)}{tong > 0 && <span className="font-normal text-muc-3"> / {tienVN(tong)}</span>}</span></p>
      {tong > 0 && <div className="mt-1 h-1.5 overflow-hidden rounded-tag bg-giay-tram" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pt} aria-label="Số dư còn lại"><div className="h-full bg-nhan" style={{ width: `${pt}%` }} /></div>}
    </div>
  );
}

/** Một thẻ khách dạng khối: hiện NGAY đủ thông tin chính + nút thao tác, không phải bấm vào mới thấy (chị Lâm 10/11).
 *  Dùng ở /the, hồ sơ khách (tab Thẻ dịch vụ); `nut` là các nút thao tác (Dùng buổi, Gia hạn…), luôn kèm "Lịch sử thẻ" mở hồ sơ thẻ. */
export function KhoiThe({ t, nut, an }: { t: DuLieuKhoiThe; nut?: React.ReactNode; an?: { khach?: boolean } }) {
  const dong = (nhan: string, giaTri: React.ReactNode) => <div className="flex justify-between gap-3"><dt className="text-muc-3">{nhan}</dt><dd className="min-w-0 text-right text-muc [overflow-wrap:anywhere]">{giaTri}</dd></div>;
  return (
    <article className="flex flex-col gap-2.5 rounded-nho border border-vien bg-giay-sang px-3.5 py-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium leading-snug text-muc [overflow-wrap:anywhere]">{t.ten}</p>
          <p className="text-[12.5px] text-muc-3"><Link href={`/the/${t.id}`} className="font-medium text-nhan-dam hover:underline">{t.ma}</Link> · {t.loai === "lan" ? "Thẻ liệu trình" : "Thẻ tiền"}</p>
          {!an?.khach && t.khach && <p className="text-[13px]"><Link href={`/khach-hang/${t.khach.id}`} className="text-muc hover:underline">{t.khach.ten}</Link>{t.khach.ma && <span className="text-muc-3"> · {t.khach.ma}</span>}</p>}
        </div>
        <NhanTinhTrangThe tt={t.tinhTrang} />
      </header>
      <ThanhTienDo t={t} />
      <dl className="space-y-1 text-[12.5px]">
        {dong("Ngày mua", ngayVN(t.ngayCap) || "—")}
        {dong("Hạn dùng", ngayVN(t.han) || "Không hạn")}
        {t.loai === "lan" && dong("Lần làm gần nhất", t.lanGan ? <>{ngayVN(t.lanGan.ngay)}{t.lanGan.dv ? ` · ${t.lanGan.dv}` : ""}{t.lanGan.nv ? ` · ${t.lanGan.nv}` : ""}</> : (t.buoiTong ?? 0) > t.buoiCon ? "Trước khi chuyển sang AMIA OS" : "Chưa làm")}
        {dong("Lịch hẹn kế tiếp", t.lichToi ? ngayGioVN(t.lichToi) : "Chưa có")}
        {dong("Người phụ trách", t.phuTrach || "—")}
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-t border-vien pt-2">
        {nut}
        <Link href={`/the/${t.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Lịch sử thẻ</Link>
      </div>
    </article>
  );
}

/** Lưới khối thẻ: 1 cột trên điện thoại, 2–3 cột trên máy lớn. */
export function LuoiThe({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
