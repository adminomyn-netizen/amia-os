import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

/** Khối hiển thị dùng chung cho các màn Chính sách hoa hồng (từ 01/11/2026). */

export const phanTram = (x: number | undefined | null, so = 3) => (x == null ? "" : `${(x * 100).toLocaleString("vi-VN", { maximumFractionDigits: so })}%`);
export const tien = (x: number | null | undefined) => `${Math.round(x ?? 0).toLocaleString("vi-VN")}đ`;
export const tyDong = (x: number) => (x >= 1e9 ? `${(x / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ` : `${Math.round(x / 1e6).toLocaleString("vi-VN")} triệu`);

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Thẻ nổi có đầu mục (ô biểu tượng màu + tiêu đề + mô tả). */
export function The({ icon: I, mau = "nhan", tieuDe, moTa, phai, children, id }: { icon?: Icon; mau?: "nhan" | "dat" | "xanh" | "tim" | "cam" | "hong"; tieuDe: string; moTa?: ReactNode; phai?: ReactNode; children: ReactNode; id?: string }) {
  const nen = { nhan: "bg-nhan-nhat text-nhan-dam", dat: "bg-dat-nen text-dat-dam", xanh: "bg-sac-xanh-nen text-sac-xanh", tim: "bg-sac-tim-nen text-sac-tim", cam: "bg-sac-cam-nen text-sac-cam", hong: "bg-sac-hong-nen text-sac-hong" }[mau];
  return (
    <section id={id} className="the-noi mb-5 rounded-hop border border-vien bg-giay-sang p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {I && <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-the ${nen}`} aria-hidden><I className="h-5 w-5" strokeWidth={1.8} /></span>}
          <div className="min-w-0">
            <h2 className="text-[16.5px] font-semibold leading-snug text-muc">{tieuDe}</h2>
            {moTa && <div className="mt-0.5 text-[13px] leading-relaxed text-muc-3">{moTa}</div>}
          </div>
        </div>
        {phai}
      </div>
      {children}
    </section>
  );
}

/** Ô số lớn (chỉ số tóm tắt). */
export function OSo({ nhan, so, phu, nhan2, toi }: { nhan: string; so: string; phu?: ReactNode; nhan2?: string; toi?: boolean }) {
  return (
    <div className={`rounded-the border p-4 ${toi ? "nen-toi border-transparent text-white" : "border-vien bg-giay-sang"}`}>
      <p className={`text-[12.5px] ${toi ? "text-white/70" : "text-muc-3"}`}>{nhan}</p>
      <p className={`mt-1 text-[22px] font-bold tabular-nums leading-tight ${toi ? "text-white" : "text-muc"}`}>{so}</p>
      {phu && <div className={`mt-1 text-[12px] ${toi ? "text-white/70" : "text-muc-3"}`}>{phu}</div>}
      {nhan2 && <p className="mt-1 text-[11.5px] font-medium text-dat-dam">{nhan2}</p>}
    </div>
  );
}

/** Bảng mức tỉ lệ đơn giản: các hàng [nhãn, mức, cách tính]. */
export function BangMuc({ dong, cot = ["Khoản", "Mức", "Cách tính"] }: { dong: [ReactNode, ReactNode, ReactNode?][]; cot?: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[13.5px]">
        <thead><tr className="nhan-muc border-b border-vien">{cot.map((c) => <th key={c} className="py-2.5 pr-4 font-medium">{c}</th>)}</tr></thead>
        <tbody className="divide-y divide-vien">
          {dong.map((d, i) => (
            <tr key={i} className="align-top">
              <td className="py-2.5 pr-4 text-muc">{d[0]}</td>
              <td className="whitespace-nowrap py-2.5 pr-4 font-semibold tabular-nums text-nhan-dam">{d[1]}</td>
              {cot.length > 2 && <td className="py-2.5 pr-4 text-muc-3">{d[2]}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DanhSachDoan({ doan, so = true }: { doan: string[]; so?: boolean }) {
  return (
    <ol className="space-y-2 text-[13.5px] leading-relaxed text-muc-2">
      {doan.map((d, i) => (
        <li key={i} className="flex gap-2.5">
          {so ? <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-nho bg-giay-tram text-[11px] font-semibold text-muc-3">{i + 1}</span> : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-[1px] bg-dat" />}
          <span>{d}</span>
        </li>
      ))}
    </ol>
  );
}

/** Dải liên kết nhanh giữa các màn chính sách. */
export function DaiLienKet({ muc, dang }: { muc: { href: string; ten: string; icon: Icon }[]; dang: string }) {
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Các màn chính sách hoa hồng">
      {muc.map((m) => (
        <Link key={m.href} href={m.href} aria-current={dang === m.href ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-the border px-3 py-2 text-[13.5px] font-medium transition-colors ${dang === m.href ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien bg-giay-sang text-muc-2 hover:border-vien-dam"}`}>
          <m.icon className="h-4 w-4" strokeWidth={1.8} />{m.ten}
        </Link>
      ))}
    </nav>
  );
}
