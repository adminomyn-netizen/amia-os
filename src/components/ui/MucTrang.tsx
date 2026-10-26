/** Một khu trong trang: tiêu đề nhỏ đậm + đường kẻ mảnh, hành động nhỏ bên phải. `noi` = đặt trong khối nổi có chiều sâu (dashboard, tài khoản). */
export function MucTrang({
  tieuDe,
  phai,
  noi = false,
  children,
}: {
  tieuDe: string;
  phai?: React.ReactNode;
  noi?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 ${noi ? "the-noi vao p-5 pt-6" : ""}`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-vien pb-2.5">
        <h2 className="text-[15px] font-semibold text-muc">{tieuDe}</h2>
        {phai && <div className="text-[13px]">{phai}</div>}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}
