/** Thanh tiến độ các bước của quy trình (QT-11 / QT-12): bước đã qua đậm, bước hiện tại có viền. */
export function TienDo({ buoc, hienTai }: { buoc: string[]; hienTai: number }) {
  return (
    <ol className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr" aria-label="Tiến độ xử lý">
      {buoc.map((ten, i) => {
        const n = i + 1, xong = n < hienTai, nay = n === hienTai;
        return (
          <li key={ten} aria-current={nay ? "step" : undefined} className={`flex items-center gap-2.5 rounded-nho border px-3 py-2 text-[13px] ${nay ? "border-nhan bg-nhan-nhat text-nhan-dam" : xong ? "border-vien bg-giay-tram text-muc-2" : "border-vien text-muc-3"}`}>
            <span style={{ borderRadius: 9999 }} className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-semibold ${xong ? "bg-nhan text-white" : nay ? "border border-nhan" : "border border-vien-dam"}`}>{xong ? "✓" : n}</span>
            <span className="min-w-0">{ten}</span>
          </li>
        );
      })}
    </ol>
  );
}
