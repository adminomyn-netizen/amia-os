/** Nút "Xuất Excel" chung cho các màn báo cáo ngoài trang Báo cáo (API /api/xuat/bao-cao-khac). Máy chủ tự kiểm quyền và ghi nhật ký. */
export function NutXuatExcel({ loai, tham = {}, ten }: { loai: string; tham?: Record<string, string | undefined>; ten: string }) {
  const u = new URLSearchParams({ loai });
  for (const [k, v] of Object.entries(tham)) if (v) u.set(k, v);
  return <a href={`/api/xuat/bao-cao-khac?${u}`} download aria-label={`Xuất Excel ${ten}`} className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Xuất Excel</a>;
}
