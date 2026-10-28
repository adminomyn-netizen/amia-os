import Link from "next/link";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { vietBaoCaoSang, type BaoCaoSang as KqBaoCao } from "@/lib/bao-cao-sang";
import { NutSaoChep } from "./NutSaoChep";

function Muc({ nhan, so, lk, canh }: { nhan: string; so: number; lk?: string; canh?: boolean }) {
  return (
    <div className={`relative rounded-nho border border-vien bg-giay-sang px-3 py-2 ${lk ? "hover:border-nhan" : ""}`}>
      <dt className="text-[12px] text-muc-3">{nhan}</dt>
      <dd className={`mt-0.5 text-[20px] font-medium leading-tight tabular-nums ${canh && so > 0 ? "text-canh-bao" : "text-muc"}`}>{soVN(so)}</dd>
      {lk && <Link href={lk} aria-label={`${nhan}: mở danh sách`} className="absolute inset-0 rounded-nho" />}
    </div>
  );
}

/** Báo cáo sáng trên trang chủ của quản lý: hôm qua + hôm nay, TÍNH MỖI LẦN MỞ (không cần cron). Không có tiền, không có số điện thoại.
 *  Bản lưu lúc 07:00 hằng ngày (bảng bao_cao_sang, pg_cron) dùng để xem lại lịch sử; trang này luôn là số mới nhất. */
export async function BaoCaoSang({ cn, tenCn }: { cn: string | null; tenCn: string | null }) {
  const { data, error } = await sb().rpc("bao_cao_sang_tinh", cn ? { p_cn: cn } : {});
  if (error || !data) { console.error("[bao-cao-sang]", error?.message); return null; }
  const b = data as unknown as KqBaoCao;
  const q = b.hom_qua, n = b.hom_nay;
  return (
    <section aria-label="Báo cáo sáng" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-muc">Báo cáo sáng{tenCn ? ` · ${tenCn}` : ""}</h2>
        <NutSaoChep van={vietBaoCaoSang(b, tenCn)} />
      </div>
      <div>
        <h3 className="mb-1.5 text-[13px] font-medium text-muc-2">Hôm qua</h3>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Muc nhan="Hoá đơn" so={q.so_hoa_don} /><Muc nhan="Lịch hoàn thành" so={q.lich_hoan_thanh} /><Muc nhan="Lịch huỷ" so={q.lich_huy} canh />
          <Muc nhan="Khách không đến" so={q.lich_khong_den} canh /><Muc nhan="Khách mới" so={q.khach_moi} />
        </dl>
      </div>
      <div>
        <h3 className="mb-1.5 text-[13px] font-medium text-muc-2">Hôm nay</h3>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Muc nhan="Lịch hẹn" so={n.so_lich} lk="/lich-hen" />
          <Muc nhan="Khách sinh nhật" so={n.sinh_nhat} lk="/khach-hang?sinh_nhat=hom_nay" />
          <Muc nhan={`Nhắc đến hạn${n.nhac_qua_han > 0 ? ` (+${soVN(n.nhac_qua_han)} quá hạn)` : ""}`} so={n.nhac_den_han} />
          <Muc nhan="Thẻ sắp hết" so={n.the_sap_het} lk="/khach-hang/the-sap-het" canh />
          <Muc nhan="Đến hẹn tái khám" so={n.tai_kham} lk="/khach-hang/tai-kham" canh />
        </dl>
        {n.sinh_nhat > 0 && <p className="mt-2 text-[12px] text-muc-3">Sinh nhật: {n.sinh_nhat_ten.join(", ")}{n.sinh_nhat > n.sinh_nhat_ten.length ? ", …" : ""}</p>}
      </div>
    </section>
  );
}
