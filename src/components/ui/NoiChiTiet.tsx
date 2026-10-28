/** Bọc một phần tử của dashboard: rê chuột hoặc Tab vào thì nhảy khung chi tiết lên (tiêu đề + các dòng nhãn / giá trị). Chỉ dùng CSS, không cần JavaScript. */
export function NoiChiTiet({ tieuDe, dong, children, vi = "tren", cls = "" }: { tieuDe: string; dong: { nhan: string; gt: string }[]; children: React.ReactNode; vi?: "tren" | "duoi"; cls?: string }) {
  return (
    <div className={`group/ct relative ${cls}`}>
      {children}
      <div role="tooltip" className={`noi-chi-tiet pointer-events-none invisible absolute left-1/2 z-40 w-max max-w-[260px] -translate-x-1/2 translate-y-1 opacity-0 transition duration-150 group-hover/ct:visible group-hover/ct:translate-y-0 group-hover/ct:opacity-100 group-focus-within/ct:visible group-focus-within/ct:translate-y-0 group-focus-within/ct:opacity-100 ${vi === "tren" ? "bottom-full mb-2" : "top-full mt-2"}`}>
        <div className="the-noi the-noi-nang px-3.5 py-3 text-left">
          <p className="text-[13px] font-semibold text-muc">{tieuDe}</p>
          <dl className="mt-1.5 space-y-1">
            {dong.map((d) => <div key={d.nhan} className="flex justify-between gap-4 text-[12.5px]"><dt className="text-muc-3">{d.nhan}</dt><dd className="font-medium tabular-nums text-muc">{d.gt}</dd></div>)}
          </dl>
        </div>
      </div>
    </div>
  );
}
