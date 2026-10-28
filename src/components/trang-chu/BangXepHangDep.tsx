import Link from "next/link";
import { Crown, type LucideIcon } from "lucide-react";
import { NoiChiTiet } from "@/components/ui/NoiChiTiet";

export type DongXepHang = {
  ten: string;
  /** Dòng nhỏ dưới tên: chi nhánh · chức danh, hoặc loại. */
  phu?: string;
  /** Dòng nhỏ thứ hai: doanh số · số lượt. */
  phu2?: string;
  /** Giá trị hiển thị ở bên phải và dưới tên trên bục. */
  chu: string;
  /** Giá trị số để so sánh thanh tỉ lệ. */
  gt: number;
  chiTiet: { nhan: string; gt: string }[];
};

const MAU = ["tim", "xanh", "luc", "cam", "hong"] as const;
const mau = (i: number) => MAU[i % MAU.length];
const chuCai = (ten: string) => ten.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).slice(-2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

/** Ảnh đại diện chữ cái đầu (tròn, màu theo thứ tự) — bảng màu AMIA, không dải tím/xanh lam ngoài bảng. */
function Dau({ ten, i, lon }: { ten: string; i: number; lon?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center font-semibold text-white ${lon ? "h-11 w-11 text-[14px]" : "h-9 w-9 text-[12.5px]"}`} style={{ borderRadius: "50%", background: `var(--sac-${mau(i)}-mau)` }} aria-hidden>{chuCai(ten)}</span>
  );
}

const BUC: Record<number, { cao: string; nen: string; chu: string; mau: string }> = {
  1: { cao: "h-24", nen: "linear-gradient(180deg, #F6D060, #DFA51D)", chu: "text-[26px]", mau: "text-muc" },
  2: { cao: "h-16", nen: "linear-gradient(180deg, #DDE0E6, #B7BDC9)", chu: "text-[22px]", mau: "text-muc-2" },
  3: { cao: "h-12", nen: "linear-gradient(180deg, #EBA672, #CE7A3A)", chu: "text-[20px]", mau: "text-white" },
};
const HUY: Record<number, string> = { 1: "var(--sac-cam-nen)", 2: "var(--giay-tram)", 3: "var(--sac-hong-nen)" };

/** Bảng xếp hạng theo BeDental: bục 1-2-3 có ảnh đại diện và vương miện, bên dưới là danh sách từng hạng
 *  (số hạng, ảnh, tên, hai dòng phụ, giá trị bên phải, thanh tỉ lệ so với người đứng đầu); rê chuột ra chi tiết. */
export function BangXepHangDep({ tieuDe, Icon, href, nhanHref, dong, trong, cls = "" }: { tieuDe: string; Icon: LucideIcon; href?: string; nhanHref?: string; dong: DongXepHang[]; trong: string; cls?: string }) {
  const max = Math.max(1, ...dong.map((x) => x.gt));
  const bucThu = [dong[1], dong[0], dong[2]].map((x, i) => x && { x, hang: [2, 1, 3][i] });
  return (
    <section className={`the-noi vao flex min-w-0 flex-col p-5 pt-6 ${cls}`} aria-label={tieuDe}>
      <div className="flex items-center justify-between gap-3 border-b border-vien pb-2.5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-muc"><Icon strokeWidth={1.7} className="h-4 w-4 text-nhan" aria-hidden />{tieuDe}</h2>
        {href && <Link href={href} className="shrink-0 text-[13px] font-medium text-nhan-dam hover:underline">{nhanHref ?? "Xem"}</Link>}
      </div>
      {dong.length === 0 ? <p className="pt-4 text-[14px] text-muc-3">{trong}</p> : (
        <>
          <ol className="mt-4 grid grid-cols-3 items-end gap-2 bg-giay-tram px-3 pt-5" style={{ borderRadius: 8 }}>
            {bucThu.map((b, i) => b ? (
              <li key={b.x.ten + i} className="min-w-0">
                <NoiChiTiet cls="flex min-w-0 flex-col items-center" tieuDe={`Hạng ${b.hang}: ${b.x.ten}`} dong={b.x.chiTiet}>
                  <span className="relative">
                    {b.hang === 1 && <Crown strokeWidth={1.8} className="absolute -top-4 left-1/2 h-4 w-4 -translate-x-1/2 text-sac-cam-mau" aria-hidden />}
                    <Dau ten={b.x.ten} i={b.hang - 1} lon />
                  </span>
                  <span className="mt-1.5 max-w-full truncate text-[12.5px] font-semibold text-muc">{b.x.ten}</span>
                  <span className="mb-2 max-w-full truncate text-[11.5px] tabular-nums text-muc-3">{b.x.chu}</span>
                  <span className={`flex w-full items-start justify-center pt-2 font-semibold ${BUC[b.hang].mau} ${BUC[b.hang].cao} ${BUC[b.hang].chu}`} style={{ background: BUC[b.hang].nen, borderRadius: "6px 6px 0 0" }}>{b.hang}</span>
                </NoiChiTiet>
              </li>
            ) : <li key={i} />)}
          </ol>
          <ol className="mt-4 max-h-[300px] space-y-2 overflow-y-auto pr-0.5">
            {dong.map((x, i) => (
              <li key={x.ten + i}>
                <NoiChiTiet tieuDe={`#${i + 1} ${x.ten}`} dong={x.chiTiet}>
                  <div className="rounded-nho border border-vien px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-nho text-[12px] font-semibold text-muc" style={{ background: HUY[i + 1] ?? "var(--giay-tram)" }}>{i + 1}</span>
                      <Dau ten={x.ten} i={i} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-muc">{x.ten}</p>
                        {x.phu && <p className="truncate text-[12px] text-muc-3">{x.phu}</p>}
                        {x.phu2 && <p className="truncate text-[12px] text-muc-3">{x.phu2}</p>}
                      </div>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-nhan-dam">{x.chu}</span>
                    </div>
                    <div className="mt-2 h-1 bg-giay-tram" style={{ borderRadius: 2 }}><div className="h-full" style={{ width: `${(x.gt / max) * 100}%`, background: `var(--sac-${mau(i)}-mau)`, borderRadius: 2 }} /></div>
                  </div>
                </NoiChiTiet>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
