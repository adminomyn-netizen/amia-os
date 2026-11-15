import type { ReactNode } from "react";
import { sb } from "@/lib/db";
import { docIn, type KhoGiay } from "@/lib/thiet-lap-in";
import { CO_SO } from "@/lib/in-hoa-don";
import { ngayGioVN } from "@/lib/dinh-dang";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BE_NGANG, KHO_CUON } from "@/components/cai-dat/BanInHoaDon";

/** Khổ giấy cho các tờ in phụ (ghi chú khách, sổ quỹ, phiếu kho, phiếu thu…): theo Cài đặt › Thiết lập in (Hoá đơn) của chi nhánh, như SalonHero dùng chung khổ hoá đơn cho mọi tờ in. */
export async function khoGiayIn(chiNhanhId: string | null): Promise<KhoGiay> {
  const { data } = await sb().from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%");
  return docIn("hoa_don", data ?? [], chiNhanhId ?? "tat_ca").cauHinh.khoGiay;
}

/** Khung một tờ in: lề đúng khổ (@page), nút In + Kết nối máy in, đầu trang cơ sở + chi nhánh, tiêu đề. `rongBang` = tờ có bảng nhiều cột: khổ cuộn tự thu cỡ chữ. */
export function ToInChung({ giay, tieuDe, phu, chiNhanh, children, kyTen }: {
  giay: KhoGiay; tieuDe: string; phu?: ReactNode; chiNhanh?: { ten: string; dia_chi?: string | null; dien_thoai?: string | null } | null; children: ReactNode; kyTen?: string[];
}) {
  const cuon = KHO_CUON(giay);
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${cuon ? `${giay.replace("mm", "")}mm auto` : giay};margin:${cuon ? "2mm" : "12mm"}}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] flex-wrap items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">{tieuDe} · khổ giấy {giay} (đổi ở Cài đặt › Thiết lập in)</p>
        <NutIn kho={giay} />
      </div>
      <div className={`to-in mx-auto bg-white ${cuon ? "px-2 py-3 text-[11px]" : "px-6 py-8 text-[13px]"}`} style={{ width: "100%", maxWidth: BE_NGANG[giay] }}>
        <header className="text-center">
          <h1 className={`chu-tieu-de ${cuon ? "text-[15px]" : "text-[20px]"}`}>{CO_SO.ten}</h1>
          <p className="text-muc-2">{CO_SO.linhVuc} · Giấy phép {CO_SO.giayPhep}</p>
          {chiNhanh && <p className="text-muc-2">Chi nhánh: {chiNhanh.ten}{chiNhanh.dia_chi ? ` · ${chiNhanh.dia_chi}` : ""}{chiNhanh.dien_thoai ? ` · ĐT ${chiNhanh.dien_thoai}` : ""}</p>}
          <p className={`mt-3 font-bold uppercase tracking-wide ${cuon ? "text-[13px]" : "text-[16px]"}`}>{tieuDe}</p>
          {phu && <div className="text-muc-2">{phu}</div>}
        </header>
        <div className="mt-3">{children}</div>
        {kyTen && kyTen.length > 0 && (
          <div className={`mt-6 grid gap-4 text-center`} style={{ gridTemplateColumns: `repeat(${kyTen.length}, minmax(0, 1fr))` }}>
            {kyTen.map((k) => <div key={k}><p className="font-medium">{k}</p><p className="text-[10.5px] text-muc-3">(Ký, ghi rõ họ tên)</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>)}
          </div>
        )}
        <p className="mt-5 text-center text-[10.5px] text-muc-3">In lúc {ngayGioVN(new Date().toISOString())}</p>
      </div>
    </main>
  );
}

/** Bảng in gọn (không dùng Bang của app vì Bang có thẻ/hover cho màn hình). */
export function BangIn({ cot, dong, cuoi }: { cot: { nhan: string; phai?: boolean }[]; dong: ReactNode[][]; cuoi?: ReactNode[] }) {
  return (
    <table className="w-full border-collapse [&_td]:border-b [&_td]:border-vien [&_td]:px-1 [&_td]:py-1 [&_td]:align-top [&_th]:border-b [&_th]:border-vien-dam [&_th]:px-1 [&_th]:py-1">
      <thead><tr>{cot.map((c) => <th key={c.nhan} className={`font-semibold ${c.phai ? "text-right" : "text-left"}`}>{c.nhan}</th>)}</tr></thead>
      <tbody>{dong.map((d, i) => <tr key={i}>{d.map((o, j) => <td key={j} className={`[overflow-wrap:anywhere] ${cot[j]?.phai ? "text-right tabular-nums" : ""}`}>{o}</td>)}</tr>)}</tbody>
      {cuoi && <tfoot><tr>{cuoi.map((o, j) => <td key={j} className={`font-semibold ${cot[j]?.phai ? "text-right tabular-nums" : ""}`}>{o}</td>)}</tr></tfoot>}
    </table>
  );
}
