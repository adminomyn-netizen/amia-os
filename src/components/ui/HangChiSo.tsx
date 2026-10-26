/** Hàng chỉ số: mỗi chỉ số là một khối nổi (số lớn + nhãn nhỏ), hiện lần lượt, nhấc nhẹ khi rê chuột. */
export function HangChiSo({ muc }: { muc: { nhan: string; so: string; ghiChu?: string }[] }) {
  const cot = muc.length >= 4 ? "lg:grid-cols-4" : muc.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <dl className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cot}`}>
      {muc.map((m, i) => (
        <div key={m.nhan} className="the-noi the-noi-nang vao px-5 pb-5 pt-6" style={{ animationDelay: `${i * 70}ms` }}>
          <dt className="text-[13px] text-muc-3">{m.nhan}</dt>
          <dd className="mt-2 text-[30px] font-medium leading-none tabular-nums text-muc">{m.so}</dd>
          {m.ghiChu && <dd className="mt-2 text-[12px] text-muc-3">{m.ghiChu}</dd>}
        </div>
      ))}
    </dl>
  );
}
