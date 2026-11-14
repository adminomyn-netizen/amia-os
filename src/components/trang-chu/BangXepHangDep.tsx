import Link from "next/link";
import { TrendingUp, Trophy, type LucideIcon } from "lucide-react";
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
/** Tách mã đứng đầu tên ("0017.Nguyễn Hoài Thương" → mã "0017", tên "Nguyễn Hoài Thương") để tên đọc trọn, mã để nhỏ. */
const tachMa = (ten: string) => {
  const m = ten.match(/^\s*(\d{3,})\.\s*(\p{L}.*)$/u);
  return m ? { ma: m[1], ten: m[2] } : { ma: "", ten };
};

/** Ba sắc kim loại cho hạng 1-2-3: vòng ảnh, huy hiệu, mặt bục. Chữ trên bục đạt tương phản AA. */
const KIM: Record<number, { vong: string; huy: string; buc: string; mat: string; so: string; ten: string }> = {
  1: { ten: "Vàng", vong: "conic-gradient(from 200deg, #f7dc8a, #c9971f, #f3cf6b, #a87b14, #f7dc8a)", huy: "linear-gradient(145deg, #f6d675, #c8961f)", buc: "linear-gradient(180deg, #f1cf6f 0%, #ddb043 55%, #c79425 100%)", mat: "#f8e2a0", so: "#3d2c05" },
  2: { ten: "Bạc", vong: "conic-gradient(from 200deg, #f1f3f6, #9aa3b1, #e4e7ec, #848d9b, #f1f3f6)", huy: "linear-gradient(145deg, #eef0f4, #a7afbc)", buc: "linear-gradient(180deg, #e3e6eb 0%, #c8cdd6 55%, #aeb5c1 100%)", mat: "#f2f4f7", so: "#2b323c" },
  3: { ten: "Đồng", vong: "conic-gradient(from 200deg, #f0c39b, #a7602c, #e5ab7c, #8c4c1f, #f0c39b)", huy: "linear-gradient(145deg, #f0c39b, #c27a45)", buc: "linear-gradient(180deg, #b8703f 0%, #9e5c2c 55%, #874d23 100%)", mat: "#d99466", so: "#ffffff" },
};
const CAO: Record<number, string> = { 1: "h-[92px]", 2: "h-[64px]", 3: "h-[48px]" };
const THU_TU: Record<number, string> = { 1: "order-2", 2: "order-1", 3: "order-3" };

/** Ảnh đại diện chữ cái đầu: nền đậm theo bảng màu AMIA (chữ trắng đạt AA), tuỳ chọn vòng kim loại quanh ảnh. */
function Dau({ ten, i, co, vong }: { ten: string; i: number; co: "lon" | "vua" | "nho"; vong?: string }) {
  const kt = co === "lon" ? "h-[60px] w-[60px] text-[18px]" : co === "vua" ? "h-12 w-12 text-[15px]" : "h-8 w-8 text-[12px]";
  const mat = (
    <span className={`flex shrink-0 items-center justify-center font-semibold tracking-wide text-white ${kt}`}
      style={{ borderRadius: "50%", background: `linear-gradient(140deg, var(--sac-${mau(i)}-1), var(--sac-${mau(i)}-2))`, boxShadow: vong ? "0 0 0 2.5px var(--giay-sang)" : undefined }} aria-hidden>
      {chuCai(ten)}
    </span>
  );
  if (!vong) return mat;
  return <span className="inline-flex p-[3px]" style={{ borderRadius: "50%", background: vong, boxShadow: "0 6px 14px -6px rgb(10 43 38 / 0.35)" }} aria-hidden>{mat}</span>;
}

/** Vương miện vẽ tay bằng SVG, tô vàng hai lớp, có ba hạt ngọc. */
function VuongMien() {
  return (
    <svg viewBox="0 0 32 22" className="xh-vuong-mien h-[18px] w-[26px] drop-shadow-[0_2px_2px_rgb(120_80_10/0.35)]" aria-hidden>
      <path d="M3 7.5 9.5 12 16 2.5 22.5 12 29 7.5 26.5 19h-21Z" fill="#d9a72c" />
      <path d="M3 7.5 9.5 12 16 2.5 16 19H5.5Z" fill="#f2cf68" />
      <rect x="5" y="17.5" width="22" height="3.5" rx="1" fill="#b98a1c" />
      <circle cx="16" cy="2.6" r="1.9" fill="#fff4cf" />
      <circle cx="3" cy="7.5" r="1.6" fill="#fff4cf" />
      <circle cx="29" cy="7.5" r="1.6" fill="#fff4cf" />
      <circle cx="16" cy="13.5" r="1.7" fill="var(--sac-hong-1)" />
    </svg>
  );
}

/** Một cột trên sân khấu: vương miện (hạng 1), ảnh có vòng kim loại + huy hiệu hạng, tên, mã/dòng phụ, giá trị, bục. */
function CotBuc({ x, hang }: { x: DongXepHang; hang: 1 | 2 | 3 }) {
  const k = KIM[hang];
  const { ma, ten } = tachMa(x.ten);
  const phu = x.phu ?? x.phu2;
  const tre = { 1: 60, 2: 0, 3: 120 }[hang];
  return (
    <li className={`flex min-w-0 flex-col ${THU_TU[hang]}`}>
      <NoiChiTiet cls="flex min-w-0 flex-1 flex-col" tieuDe={`Hạng ${hang} · ${x.ten}`} dong={x.chiTiet}>
        <div tabIndex={0} role="group" className="flex w-full min-w-0 flex-1 flex-col items-center rounded-nho px-0.5 pb-2 text-center" aria-label={`Hạng ${hang}, huy chương ${k.ten.toLowerCase()}: ${x.ten}, ${x.chu}`}>
          <div className="xh-hien flex w-full min-w-0 flex-col items-center" style={{ animationDelay: `${tre + 160}ms` }}>
            <span className="flex h-[20px] items-end">{hang === 1 && <VuongMien />}</span>
            <span className="relative mt-0.5">
              <Dau ten={x.ten} i={hang - 1} co={hang === 1 ? "lon" : "vua"} vong={k.vong} />
              <span className="absolute -bottom-1 left-1/2 flex h-[20px] w-[20px] -translate-x-1/2 items-center justify-center text-[11px] font-bold tabular-nums"
                style={{ borderRadius: "50%", background: k.huy, color: k.so === "#ffffff" ? "#3a1f0a" : k.so, boxShadow: "0 0 0 2px var(--giay-sang), 0 2px 4px rgb(0 0 0 / 0.18)" }} aria-hidden>{hang}</span>
            </span>
            <span className={`mt-2.5 line-clamp-2 max-w-full break-words font-semibold leading-tight text-muc ${hang === 1 ? "text-[13.5px]" : "text-[12.5px]"}`}>{ten}</span>
            {phu && <span className="mt-0.5 line-clamp-2 max-w-full break-words text-[11px] leading-tight text-muc-3" title={ma ? `Mã ${ma} · ${phu}` : phu}>{phu}</span>}
            <span className={`mt-1.5 inline-flex max-w-full items-center truncate rounded-nho px-2 py-0.5 font-semibold tabular-nums ${hang === 1 ? "text-[13px] text-sac-cam" : "text-[12px] text-nhan-dam"}`}
              style={{ background: hang === 1 ? "var(--sac-cam-nen)" : "var(--nhan-nhat)" }}>{x.chu}</span>
          </div>
        </div>
      </NoiChiTiet>
      <div className={`xh-buc relative mx-0.5 flex items-start justify-center overflow-hidden pt-2 ${CAO[hang]}`}
        style={{ background: k.buc, borderRadius: "8px 8px 0 0", animationDelay: `${tre}ms`, boxShadow: `inset 0 3px 0 ${k.mat}, inset 0 -10px 18px -10px rgb(0 0 0 / 0.18)` }} aria-hidden>
        <span className={`font-bold tabular-nums leading-none ${hang === 1 ? "text-[30px]" : hang === 2 ? "text-[24px]" : "text-[21px]"}`}
          style={{ color: k.so, textShadow: k.so === "#ffffff" ? "0 1px 0 rgb(0 0 0 / 0.25)" : "0 1px 0 rgb(255 255 255 / 0.55)" }}>{hang}</span>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3" style={{ background: "linear-gradient(90deg, rgb(255 255 255 / 0.22), transparent)" }} />
      </div>
    </li>
  );
}

/** Ô trống trên bục khi chưa đủ ba hạng: bục mờ viền đứt, giữ cân đối sân khấu. */
function CotTrong({ hang }: { hang: 2 | 3 }) {
  return (
    <li className={`flex min-w-0 flex-col justify-end ${THU_TU[hang]}`} aria-hidden>
      <span className="mb-2 text-center text-[11px] text-muc-3">Còn trống</span>
      <div className={`mx-0.5 flex items-start justify-center pt-2 text-[18px] font-semibold text-muc-3 ${CAO[hang]}`} style={{ borderRadius: "8px 8px 0 0", border: "1.5px dashed var(--vien-dam)", borderBottom: "none", opacity: 0.55 }}>{hang}</div>
    </li>
  );
}

/** Bảng xếp hạng kiểu BeDental, làm sang hơn: sân khấu bục 1-2-3 (vương miện, vòng vàng/bạc/đồng, huy hiệu hạng, bục mọc lên),
 *  dòng "hạng 1 vượt hạng 2", rồi danh sách từ hạng 4 (số hạng mờ, ảnh, tên, dòng phụ, giá trị bên phải, thanh tỉ lệ so với người đứng đầu).
 *  Rê chuột hoặc Tab vào bất kỳ mục nào để xem chi tiết. */
export function BangXepHangDep({ tieuDe, Icon, href, nhanHref, dong, trong, cls = "", gon = false }: { tieuDe: string; Icon: LucideIcon; href?: string; nhanHref?: string; dong: DongXepHang[]; trong: string; cls?: string; /** Trống thì chỉ một dòng nhỏ, không vẽ bục to. */ gon?: boolean }) {
  const max = Math.max(1, ...dong.map((x) => x.gt));
  const [mot, hai, ba] = dong;
  const conLai = dong.slice(3);
  const vuot = mot && hai && hai.gt > 0 && mot.gt > hai.gt ? Math.round(((mot.gt - hai.gt) / hai.gt) * 100) : null;
  return (
    <section className={`the-noi vao flex min-w-0 flex-col p-5 pt-6 ${cls}`} aria-label={tieuDe}>
      <div className="flex items-center justify-between gap-3 border-b border-vien pb-2.5">
        <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-muc">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-nho" style={{ background: "linear-gradient(145deg, var(--nhan-nhat), color-mix(in srgb, var(--nhan-nhat) 55%, var(--dat-nen)))", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--nhan) 18%, transparent)" }} aria-hidden>
            <Icon strokeWidth={1.8} className="h-[15px] w-[15px] text-nhan-dam" />
          </span>
          <span className="truncate">{tieuDe}</span>
        </h2>
        {href && <Link href={href} className="shrink-0 text-[13px] font-medium text-nhan-dam hover:underline">{nhanHref ?? "Xem"}</Link>}
      </div>

      {dong.length === 0 && gon ? (
        <p className="mt-3 text-[13.5px] text-muc-3">{trong}</p>
      ) : dong.length === 0 ? (
        <div className="xh-san mt-4 flex flex-col items-center rounded-vua px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center" style={{ borderRadius: "50%", background: "var(--giay-sang)", boxShadow: "inset 0 0 0 1px var(--vien), 0 6px 14px -8px rgb(10 43 38 / 0.3)" }} aria-hidden>
            <Trophy strokeWidth={1.6} className="h-6 w-6 text-sac-cam" />
          </span>
          <p className="mt-3 text-[14px] font-medium text-muc-2">{trong}</p>
          <p className="mt-1 text-[12.5px] text-muc-3">Bục vinh danh sẽ hiện ngay khi có số liệu.</p>
        </div>
      ) : (
        <>
          <ol className="xh-san mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] items-end gap-1.5 rounded-vua px-2.5 pt-3 sm:gap-2.5 sm:px-4" aria-label={`Ba hạng đầu: ${tieuDe}`}>
            <CotBuc x={mot} hang={1} />
            {hai ? <CotBuc x={hai} hang={2} /> : <CotTrong hang={2} />}
            {ba ? <CotBuc x={ba} hang={3} /> : <CotTrong hang={3} />}
          </ol>

          {vuot != null && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muc-3">
              <TrendingUp strokeWidth={2} className="h-3.5 w-3.5 text-nhan" aria-hidden />
              Hạng 1 đang dẫn trước hạng 2 <span className="font-semibold tabular-nums text-nhan-dam">{vuot > 999 ? ">999" : vuot}%</span>
            </p>
          )}

          {conLai.length > 0 && (
            <ol className="mt-3 space-y-0.5 border-t lg:max-h-[300px] lg:overflow-y-auto border-vien pt-2 pr-0.5" start={4} aria-label={`Các hạng tiếp theo: ${tieuDe}`}>
              {conLai.map((x, j) => {
                const i = j + 3;
                const { ma, ten } = tachMa(x.ten);
                const phu = [x.phu, x.phu2].filter(Boolean).join(" · ");
                const tiLe = Math.max(2, (x.gt / max) * 100);
                return (
                  <li key={x.ten + i}>
                    <NoiChiTiet tieuDe={`Hạng ${i + 1} · ${x.ten}`} dong={x.chiTiet}>
                      <div tabIndex={0} role="group" className="xh-dong xh-hien rounded-nho px-2 py-2" style={{ animationDelay: `${Math.min(j, 8) * 45 + 280}ms` }} aria-label={`Hạng ${i + 1}: ${x.ten}, ${x.chu}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 shrink-0 text-center text-[13px] font-semibold tabular-nums text-muc-3" aria-hidden>{i + 1}</span>
                          <Dau ten={x.ten} i={i} co="nho" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-semibold leading-snug text-muc">{ten}{ma && <span className="ml-1.5 text-[11px] font-normal text-muc-3">Mã {ma}</span>}</p>
                            {phu && <p className="truncate text-[12px] leading-snug text-muc-3">{phu}</p>}
                          </div>
                          <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-nhan-dam">{x.chu}</span>
                        </div>
                        <div className="ml-[34px] mt-1.5 h-[5px] overflow-hidden bg-giay-tram" style={{ borderRadius: 3 }} aria-hidden>
                          <div className="xh-thanh h-full" style={{ width: `${tiLe}%`, background: `linear-gradient(90deg, var(--sac-${mau(i)}-mau), var(--sac-${mau(i)}-1))`, borderRadius: 3 }} />
                        </div>
                      </div>
                    </NoiChiTiet>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
