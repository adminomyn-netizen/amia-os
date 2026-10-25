import Link from "next/link";

/** Dải tab dạng liên kết (đổi tab = đổi ?tab=…, máy chủ dựng lại đúng phần cần). */
export function Tab({ muc, dang, goc, them = "" }: { muc: { ma: string; ten: string }[]; dang: string; goc: string; them?: string }) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-vien">
      {muc.map((m) => (
        <Link key={m.ma} href={`${goc}?tab=${m.ma}${them}`} role="tab" aria-selected={dang === m.ma} scroll={false}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] ${dang === m.ma ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>
          {m.ten}
        </Link>
      ))}
    </div>
  );
}
