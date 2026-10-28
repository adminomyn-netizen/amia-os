import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Bell, Cake, CalendarCheck, CalendarX, Receipt, Repeat, UserPlus, UserX, type LucideIcon } from "lucide-react";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { gioVNHienTai, namVNHienTai, tieuDeTheoGio, vietBaoCaoSang, type BaoCaoSang as KqBaoCao } from "@/lib/bao-cao-sang";
import { NutSaoChep } from "./NutSaoChep";
import { MoRongBaoCao } from "./MoRongBaoCao";
import { locKhach } from "@/lib/khach-danh-sach";

type Mau = "xanh" | "luc" | "tim" | "cam" | "hong";

/** Ô số cùng bảng màu và kiểu với hàng ô số lớn đầu trang chủ: nền chuyển màu, chữ trắng, biểu tượng mờ ở góc. Ô cảnh báo (canh) đổi sang cam khi có số > 0. */
function Muc({ nhan, so, phu, bt: Bt, mau, lk, canh }: { nhan: string; so: number; phu?: string; bt: LucideIcon; mau: Mau; lk?: string; canh?: boolean }) {
  const m = canh && so > 0 ? "cam" : mau;
  const noi = (
    <>
      <Bt aria-hidden strokeWidth={1.5} className="absolute -bottom-2 -right-1 h-16 w-16 opacity-20" />
      <span className="block text-[13px] opacity-90">{nhan}</span>
      <span className="mt-2 block text-[26px] font-semibold leading-none tabular-nums">{soVN(so)}</span>
      <span className="mt-2 block min-h-[1.1em] text-[11.5px] leading-snug opacity-85">{phu ?? ""}</span>
    </>
  );
  const cls = "relative block h-full min-w-0 overflow-hidden rounded-nho px-4 pb-4 pt-4 text-white shadow-sm";
  const st = { background: `linear-gradient(135deg, var(--sac-${m}-1), var(--sac-${m}-2))` };
  return lk ? <Link href={lk} className={`${cls} transition-transform hover:-translate-y-0.5`} style={st}>{noi}</Link> : <div className={cls} style={st}>{noi}</div>;
}

function Nhom({ tieuDe, phu, children }: { tieuDe: string; phu: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2"><h3 className="shrink-0 whitespace-nowrap text-[13px] font-semibold uppercase tracking-wide text-muc-2">{tieuDe}</h3><span className="text-[12px] text-muc-3">{phu}</span></div>
      {children}
    </div>
  );
}

type KhachSn = { id: string; ten: string; hang: string | null; tuoi: number | null };
const MAU_VONG = ["xanh", "luc", "tim", "cam", "hong"] as const;

/** Khung sinh nhật hoàn chỉnh: tiêu đề màu hồng + lưới thẻ khách (vòng chữ cái, tên, tuổi, hạng), bấm vào mở hồ sơ khách. Không có số điện thoại. */
function KhungSinhNhat({ tong, ds, tenDuPhong }: { tong: number; ds: KhachSn[]; tenDuPhong: string[] }) {
  return (
    <section aria-label="Khách sinh nhật hôm nay" className="overflow-hidden rounded-nho border border-vien bg-giay">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" style={{ background: "linear-gradient(135deg, var(--sac-hong-1), var(--sac-hong-2))" }}>
        <span className="flex items-center gap-2 text-[14px] font-semibold"><Cake className="h-4 w-4" strokeWidth={1.8} aria-hidden />Khách sinh nhật hôm nay</span>
        <span className="rounded-nho bg-white/20 px-2.5 py-0.5 text-[12.5px] font-medium tabular-nums">{soVN(tong)} khách</span>
      </div>
      {tong === 0 ? (
        <p className="px-4 py-5 text-center text-[13px] text-muc-3">Hôm nay chưa có khách sinh nhật.</p>
      ) : (
        <ul className="grid max-h-[300px] gap-2.5 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ds.length > 0 ? ds.map((k, i) => {
            const m = MAU_VONG[i % MAU_VONG.length];
            return (
              <li key={k.id} className="min-w-0">
                <Link href={`/khach-hang/${k.id}`} className="flex items-center gap-3 rounded-nho border border-vien bg-giay-sang px-3 py-2 transition-colors hover:border-nhan hover:bg-giay-tram">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[50%] text-[13px] font-semibold" style={{ background: `var(--sac-${m}-nen)`, color: `var(--sac-${m})` }} aria-hidden>{k.ten.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() ?? "K"}</span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-muc">{k.ten}</span><span className="block truncate text-[11.5px] text-muc-3">{[k.tuoi != null ? `${k.tuoi} tuổi` : null, k.hang ? `Hạng ${k.hang}` : null].filter(Boolean).join(" · ") || "Mở hồ sơ"}</span></span>
                </Link>
              </li>
            );
          }) : tenDuPhong.map((ten) => <li key={ten} className="rounded-nho border border-vien bg-giay-sang px-3 py-2 text-[13px] text-muc">{ten}</li>)}
        </ul>
      )}
    </section>
  );
}

/** Báo cáo sáng trên trang chủ của quản lý: hôm qua + hôm nay, TÍNH MỖI LẦN MỞ (không cần cron). Không có tiền, không có số điện thoại.
 *  Bản lưu lúc 07:00 hằng ngày (bảng bao_cao_sang, pg_cron) dùng để xem lại lịch sử; trang này luôn là số mới nhất. */
type DuLieuNgay = { b: KqBaoCao; sn: { id: string; ten: string; hang: string | null; ngay_sinh: string | null }[] };

/** Tính hàm báo cáo + danh sách sinh nhật MỘT lần rồi giữ 5 phút (hàm tính trên DB nhỏ có thể mất vài giây lúc nguội). Lỗi thì ném ra để KHÔNG bị lưu đệm. */
const docDuLieuNgay = unstable_cache(async (cn: string | null): Promise<DuLieuNgay> => {
  const { data, error } = await sb().rpc("bao_cao_sang_tinh", cn ? { p_cn: cn } : {});
  if (error || !data) throw new Error(error?.message ?? "không có dữ liệu");
  const b = data as unknown as KqBaoCao;
  const ds = b.hom_nay.sinh_nhat > 0 ? await locKhach({ sinh_nhat: "hom_nay", sx: "ten", ...(cn ? { chi_nhanh: cn } : {}) }, 0, 200) : null;
  return { b, sn: (ds?.ds ?? []).map((k) => ({ id: k.id, ten: k.ho_ten, hang: k.hang, ngay_sinh: k.ngay_sinh })) };
}, ["bao-cao-ngay-du-lieu-v2"], { revalidate: 300 });

/** Khung xương hiện ngay trong lúc khối đang tính (trang chủ không phải đợi khối này). */
export function BaoCaoNgayDangTai() {
  return (
    <section aria-label="Đang tải báo cáo ngày" aria-busy="true" className="the-noi min-w-0 space-y-4 p-5 pt-6">
      <div className="h-5 w-48 animate-pulse rounded-nho bg-giay-tram" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-nho bg-giay-tram" />)}</div>
      <div className="h-24 animate-pulse rounded-nho bg-giay-tram" />
    </section>
  );
}

export async function BaoCaoSang({ cn, tenCn }: { cn: string | null; tenCn: string | null }) {
  let d: DuLieuNgay;
  try { d = await docDuLieuNgay(cn); } catch (e) {
    console.error("[bao-cao-ngay]", e instanceof Error ? e.message : e);
    return <section aria-label="Báo cáo ngày" className="the-noi min-w-0 p-5 text-[13px] text-muc-3">Chưa tải được báo cáo ngày (máy chủ đang bận). Tải lại trang sau ít phút.</section>;
  }
  const b = d.b;
  const q = b.hom_qua, n = b.hom_nay;
  const { tieuDe, phu } = tieuDeTheoGio(gioVNHienTai());
  const namNay = namVNHienTai();
  const dsSn: KhachSn[] = d.sn.map((k) => ({ id: k.id, ten: k.ten, hang: k.hang, tuoi: k.ngay_sinh && Number(k.ngay_sinh.slice(0, 4)) > 1900 ? namNay - Number(k.ngay_sinh.slice(0, 4)) : null }));
  return (
    <section aria-label={tieuDe} className="the-noi vao min-w-0 space-y-5 p-5 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vien pb-2.5">
        <h2 className="text-[15px] font-semibold text-muc">{tieuDe}{tenCn ? ` · ${tenCn}` : ""} <span className="ml-1 text-[12.5px] font-normal text-muc-3">{phu}</span></h2>
        <NutSaoChep van={vietBaoCaoSang(b, tenCn, tieuDe)} />
      </div>
      <Nhom tieuDe="Hôm nay" phu="việc chăm sóc cần làm">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <Muc nhan="Nhắc đến hạn" so={n.nhac_den_han} phu={n.nhac_qua_han > 0 ? `+${soVN(n.nhac_qua_han)} quá hạn chưa xử lý` : "nhắc chăm sóc hôm nay"} bt={Bell} mau="tim" />
          <Muc nhan="Đến hẹn tái khám" so={n.tai_kham} phu="khách đến kỳ làm lại" bt={Repeat} mau="luc" lk="/khach-hang/tai-kham" canh />
          <Muc nhan="Khách mới hôm qua" so={q.khach_moi} phu="đăng ký ngày vừa xong" bt={UserPlus} mau="xanh" />
          <Muc nhan="Hoá đơn hôm qua" so={q.so_hoa_don} phu={`${soVN(q.lich_hoan_thanh)} lịch hoàn thành`} bt={Receipt} mau="hong" />
        </dl>
      </Nhom>
      <KhungSinhNhat tong={n.sinh_nhat} ds={dsSn} tenDuPhong={n.sinh_nhat_ten} />
      <MoRongBaoCao>
        <Nhom tieuDe="Hôm qua" phu="lịch hẹn của ngày vừa xong">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Muc nhan="Lịch hoàn thành" so={q.lich_hoan_thanh} bt={CalendarCheck} mau="xanh" />
            <Muc nhan="Lịch huỷ" so={q.lich_huy} bt={CalendarX} mau="hong" canh />
            <Muc nhan="Khách không đến" so={q.lich_khong_den} bt={UserX} mau="hong" canh />
          </dl>
        </Nhom>
      </MoRongBaoCao>
    </section>
  );
}
