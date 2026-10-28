import Link from "next/link";
import { Star } from "lucide-react";
import { sb } from "@/lib/db";
import { ngayVN, soVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { chuSao, layDanhGia, tongTheoNhanVien, trungBinh } from "@/lib/bao-cao-danh-gia";

/** Báo cáo đánh giá nhân viên theo đơn hàng (theo SalonHero: nhóm Tất cả / 5 sao … 1 sao, ô Tìm kiếm nhân viên, bảng Ngày · Mã hóa đơn · Tên Nhân Viên · Đánh giá · Ý kiến đánh giá · Dịch vụ đã thực hiện).
 *  Phần tổng hợp theo nhân viên (trung bình sao, số đánh giá, phân bố 1–5) là phần thêm của AMIA OS. */
type Loc = { tu: string; den: string; cn?: string };
const MOI_TRANG = 30;

export const Sao = ({ n }: { n: number }) => (
  <span className="inline-flex items-center gap-0.5 whitespace-nowrap" role="img" aria-label={`${n} sao`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden strokeWidth={1.6} className={`h-3.5 w-3.5 ${i <= n ? "fill-canh-bao text-canh-bao" : "text-vien-dam"}`} />)}
  </span>
);

export async function BaoCaoDanhGia({ loc, sao, q, trang }: { loc: Loc; sao?: string; q?: string; trang?: string }) {
  const tatCa = await layDanhGia(sb(), loc.tu, loc.den, loc.cn);
  const tuKhoa = (q ?? "").trim().toLowerCase();
  const theoTen = tatCa.filter((d) => !tuKhoa || d.ten.toLowerCase().includes(tuKhoa));
  const dem = (n: number) => theoTen.filter((d) => d.diem === n).length;
  const soSao = /^[1-5]$/.test(sao ?? "") ? Number(sao) : 0;
  const ds = theoTen.filter((d) => !soSao || d.diem === soSao);
  const tong = tongTheoNhanVien(theoTen);
  const tr = Math.max(1, Math.min(Number(trang) || 1, Math.max(1, Math.ceil(ds.length / MOI_TRANG))));
  const cuoi = Math.max(1, Math.ceil(ds.length / MOI_TRANG));
  const hien = ds.slice((tr - 1) * MOI_TRANG, tr * MOI_TRANG);
  const gan = (cap: Record<string, string | undefined>) => `/bao-cao?${new URLSearchParams(Object.entries({ tab: "danh-gia", tu: loc.tu, den: loc.den, cn: loc.cn, q: q || undefined, sao: soSao ? String(soSao) : undefined, ...cap }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const NUT = "rounded-nho border border-vien-dam px-3 py-1.5 text-[13px] text-muc-2 hover:bg-giay-tram aria-disabled:pointer-events-none aria-disabled:opacity-40";
  return (
    <>
      <HangChiSo muc={[{ nhan: "Số đánh giá", so: soVN(theoTen.length) }, { nhan: "Trung bình sao", so: theoTen.length ? chuSao(trungBinh(theoTen)) : "—", ghiChu: "trên 5 sao" }, { nhan: "Nhân viên được đánh giá", so: soVN(tong.length) }]} />
      <nav aria-label="Lọc theo số sao" className="mb-3 mt-6 flex gap-2 overflow-x-auto pb-1">
        {[{ k: "", t: `Tất cả ${theoTen.length}` }, ...[5, 4, 3, 2, 1].map((n) => ({ k: String(n), t: `${n} sao ${dem(n)}` }))].map((c) => (
          <Link key={c.k} href={gan({ sao: c.k || undefined, trang: undefined })} aria-current={String(soSao || "") === c.k ? "page" : undefined}
            className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${String(soSao || "") === c.k ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{c.t}</Link>
        ))}
      </nav>
      <form method="get" action="/bao-cao" className="mb-5 flex gap-2">
        <input type="hidden" name="tab" value="danh-gia" /><input type="hidden" name="tu" value={loc.tu} /><input type="hidden" name="den" value={loc.den} />
        {loc.cn && <input type="hidden" name="cn" value={loc.cn} />}{soSao > 0 && <input type="hidden" name="sao" value={soSao} />}
        <input name="q" defaultValue={q ?? ""} placeholder="Tìm kiếm nhân viên" aria-label="Tìm kiếm nhân viên" className={O_NHAP} />
        <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
      </form>

      <h2 className="mb-2 text-[15px] font-medium text-muc">Tổng hợp theo nhân viên</h2>
      <Bang duLieu={tong} khoa={(r) => r.nhanVienId} trong="Chưa có đánh giá nào trong khoảng này."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Số đánh giá", phai: true, hienThi: (r) => soVN(r.so) },
          { nhan: "Trung bình", phai: true, hienThi: (r) => <span className="font-medium text-muc">{chuSao(r.tb)} ★</span> },
          ...[5, 4, 3, 2, 1].map((n) => ({ nhan: `${n} sao`, phai: true, hienThi: (r: (typeof tong)[number]) => r.phanBo[n - 1] || "" })),
        ]} />

      <h2 className="mb-2 mt-8 text-[15px] font-medium text-muc">Đánh giá theo đơn hàng</h2>
      <Bang duLieu={hien} khoa={(r) => r.id} trong="Không tìm thấy kết quả nào"
        cot={[
          { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) },
          { nhan: "Mã hóa đơn", hienThi: (r) => <Link href={`/hoa-don/${r.hoaDonId}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
          { nhan: "Tên Nhân Viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Đánh giá", hienThi: (r) => <Sao n={r.diem} /> },
          { nhan: "Ý kiến đánh giá", hienThi: (r) => r.yKien },
          { nhan: "Dịch vụ đã thực hiện", hienThi: (r) => r.dichVu },
        ]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muc-3">
        <span>Hiện {ds.length ? (tr - 1) * MOI_TRANG + 1 : 0} đến {Math.min(tr * MOI_TRANG, ds.length)} của {ds.length} dữ liệu</span>
        <span className="flex gap-2">
          <Link href={gan({ trang: undefined })} aria-disabled={tr <= 1} className={NUT}>Đầu tiên</Link>
          <Link href={gan({ trang: String(tr - 1) })} aria-disabled={tr <= 1} className={NUT}>Trước đó</Link>
          <Link href={gan({ trang: String(tr + 1) })} aria-disabled={tr >= cuoi} className={NUT}>Tiếp theo</Link>
          <Link href={gan({ trang: String(cuoi) })} aria-disabled={tr >= cuoi} className={NUT}>Cuối cùng</Link>
        </span>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Lọc theo ngày hoá đơn; chỉ tính hoá đơn còn hoàn thành. Đánh giá do thu ngân hoặc lễ tân ghi ở trang chi tiết hoá đơn sau khi đơn hoàn thành, cho từng người đứng vai Phục vụ. Dịch vụ đã thực hiện là các dòng hàng người đó đứng vai Phục vụ.</p>
    </>
  );
}
