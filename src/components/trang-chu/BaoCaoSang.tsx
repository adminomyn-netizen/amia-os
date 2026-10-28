import Link from "next/link";
import { Bell, Cake, CalendarCheck, CalendarClock, CalendarDays, CalendarX, CreditCard, Receipt, Repeat, UserPlus, UserX, type LucideIcon } from "lucide-react";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { gioVNHienTai, tieuDeTheoGio, vietBaoCaoSang, type BaoCaoSang as KqBaoCao } from "@/lib/bao-cao-sang";
import { NutSaoChep } from "./NutSaoChep";
import { MoRongBaoCao } from "./MoRongBaoCao";
import { locKhach } from "@/lib/khach-danh-sach";

type Mau = "xanh" | "luc" | "tim" | "cam" | "hong";

/** Một ô số: vạch màu trên đầu + biểu tượng tròn nhạt + số lớn, cùng ngôn ngữ với khối "Số liệu kinh doanh". Ô cảnh báo (canh) đổi sang cam khi có số > 0. */
function Muc({ nhan, so, phu, bt: Bt, mau, lk, canh }: { nhan: string; so: number; phu?: string; bt: LucideIcon; mau: Mau; lk?: string; canh?: boolean }) {
  const m = canh && so > 0 ? "cam" : mau;
  return (
    <div className={`relative min-w-0 rounded-nho border border-vien bg-giay px-3.5 py-3 transition-shadow ${lk ? "hover:shadow-[var(--bong-2)]" : ""}`} style={{ borderTop: `4px solid var(--sac-${m}-mau)` }}>
      <div className="flex items-start justify-between gap-2">
        <dt className="min-w-0 text-[12.5px] leading-snug text-muc-3">{nhan}</dt>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[50%]" style={{ background: `var(--sac-${m}-nen)`, color: `var(--sac-${m})` }} aria-hidden><Bt className="h-4 w-4" strokeWidth={1.8} /></span>
      </div>
      <dd className="mt-1 text-[24px] font-semibold leading-none tabular-nums text-muc">{soVN(so)}</dd>
      {phu && <dd className="mt-1.5 text-[12px] text-muc-3">{phu}</dd>}
      {lk && <Link href={lk} aria-label={`${nhan}: mở danh sách`} className="absolute inset-0 rounded-nho" />}
    </div>
  );
}

function Nhom({ tieuDe, phu, children }: { tieuDe: string; phu: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2"><h3 className="text-[13px] font-semibold uppercase tracking-wide text-muc-2">{tieuDe}</h3><span className="text-[12px] text-muc-3">{phu}</span></div>
      {children}
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
  const { tieuDe, phu } = tieuDeTheoGio(gioVNHienTai());
  // Danh sách khách sinh nhật hôm nay (chỉ id + tên) để bấm vào mở hồ sơ; cùng bộ lọc với liên kết 'Khách sinh nhật'.
  const sn = n.sinh_nhat > 0 ? await locKhach({ sinh_nhat: "hom_nay", sx: "ten", ...(cn ? { chi_nhanh: cn } : {}) }, 0, 200) : null;
  const dsSn = (sn?.ds ?? []).map((k) => ({ id: k.id, ten: k.ho_ten }));
  return (
    <section aria-label={tieuDe} className="the-noi vao min-w-0 space-y-5 p-5 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vien pb-2.5">
        <h2 className="text-[15px] font-semibold text-muc">{tieuDe}{tenCn ? ` · ${tenCn}` : ""} <span className="ml-1 text-[12.5px] font-normal text-muc-3">{phu}</span></h2>
        <NutSaoChep van={vietBaoCaoSang(b, tenCn, tieuDe)} />
      </div>
      <Nhom tieuDe="Hôm nay" phu="việc cần để ý trong ngày">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Muc nhan="Lịch hẹn" so={n.so_lich} bt={CalendarDays} mau="xanh" lk="/lich-hen" />
          <Muc nhan="Khách sinh nhật" so={n.sinh_nhat} bt={Cake} mau="hong" lk="/khach-hang?sinh_nhat=hom_nay" />
          <Muc nhan="Nhắc đến hạn" so={n.nhac_den_han} phu={n.nhac_qua_han > 0 ? `+${soVN(n.nhac_qua_han)} quá hạn` : undefined} bt={Bell} mau="tim" />
          <Muc nhan="Thẻ sắp hết" so={n.the_sap_het} bt={CreditCard} mau="cam" lk="/khach-hang/the-sap-het" canh />
          <Muc nhan="Đến hẹn tái khám" so={n.tai_kham} bt={Repeat} mau="luc" lk="/khach-hang/tai-kham" canh />
        </dl>
      </Nhom>
      <MoRongBaoCao>
      <Nhom tieuDe="Hôm qua" phu="kết quả ngày vừa xong">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Muc nhan="Hoá đơn" so={q.so_hoa_don} bt={Receipt} mau="luc" />
          <Muc nhan="Lịch hoàn thành" so={q.lich_hoan_thanh} bt={CalendarCheck} mau="xanh" />
          <Muc nhan="Lịch huỷ" so={q.lich_huy} bt={CalendarX} mau="hong" canh />
          <Muc nhan="Khách không đến" so={q.lich_khong_den} bt={UserX} mau="hong" canh />
          <Muc nhan="Khách mới" so={q.khach_moi} bt={UserPlus} mau="tim" />
        </dl>
      </Nhom>

      {n.sinh_nhat > 0 && (
          <div className="rounded-nho bg-giay-tram px-3 py-2.5 text-[12.5px] text-muc-2">
            <div className="mb-1.5 flex items-center gap-2 font-medium text-muc"><CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />Sinh nhật hôm nay ({soVN(n.sinh_nhat)})</div>
            <ul className="flex flex-wrap gap-x-1 gap-y-1">
              {dsSn.length > 0 ? dsSn.map((k) => <li key={k.id}><Link href={`/khach-hang/${k.id}`} className="inline-block rounded-nho border border-vien bg-giay px-2 py-0.5 text-muc hover:border-nhan hover:text-nhan-dam">{k.ten}</Link></li>)
                : n.sinh_nhat_ten.map((ten) => <li key={ten} className="inline-block rounded-nho border border-vien bg-giay px-2 py-0.5">{ten}</li>)}
            </ul>
          </div>
        )}
      </MoRongBaoCao>
    </section>
  );
}
