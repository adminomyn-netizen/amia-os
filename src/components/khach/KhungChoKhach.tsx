/** Khung chờ của các màn con Khách hàng (Thống kê, Gần đây, Tư vấn, Nhóm, Chăm sóc, Nhắc, Tái khám, Dùng thẻ, Thẻ sắp hết):
 *  dải tiêu đề + ô lọc + vài dòng bảng. Dùng ở loading.tsx và khi vừa bấm lối tắt (hiện ngay trên máy, không chờ máy chủ). */
export function KhungChoKhach() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-nho bg-giay-tram" />
        <div className="h-7 w-48 max-w-[60%] animate-pulse rounded-nho bg-giay-tram" />
      </div>
      <div className="h-16 animate-pulse rounded-the bg-giay-tram" />
      <div className="the-noi divide-y divide-vien">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1.5"><div className="h-3.5 w-2/5 animate-pulse rounded-[3px] bg-giay-tram" /><div className="h-3 w-1/4 animate-pulse rounded-[3px] bg-giay-tram" /></div>
            <div className="h-3.5 w-16 shrink-0 animate-pulse rounded-[3px] bg-giay-tram" />
          </div>
        ))}
      </div>
    </div>
  );
}
