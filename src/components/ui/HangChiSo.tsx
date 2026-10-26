/** Hàng chỉ số: mỗi chỉ số là một khối nổi (số lớn + nhãn nhỏ), hiện lần lượt, nhấc nhẹ khi rê chuột. */
export function HangChiSo({ muc }: { muc: { nhan: string; so: string; ghiChu?: string }[] }) {
  const cot = muc.length >= 4 ? "lg:grid-cols-4" : muc.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <dl className={`grid grid-cols-2 gap-3 sm:gap-4 ${cot}`}>
      {muc.map((m, i) => (
        <div key={m.nhan} className="the-noi the-noi-nang vao px-4 pb-4 pt-5 sm:px-5 sm:pb-5 sm:pt-6" style={{ animationDelay: `${i * 70}ms` }}>
          <dt className="text-[13px] text-muc-3">{m.nhan}</dt>
          <dd className={`mt-2 font-medium leading-none tabular-nums text-muc ${m.so.length > 14 ? "text-[21px]" : m.so.length > 11 ? "text-[25px]" : "text-[30px]"} ${m.so.length > 9 ? "max-sm:text-[18px]" : "max-sm:text-[24px]"}`}>{m.so}</dd>
          {m.ghiChu && <dd className="mt-2 text-[12px] text-muc-3">{m.ghiChu}</dd>}
        </div>
      ))}
    </dl>
  );
}
