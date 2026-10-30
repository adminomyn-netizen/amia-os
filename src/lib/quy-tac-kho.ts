// Quy tắc kho đã chạy ở máy chủ (migration 0045): chốt đơn gọi kiem_kho_xuat, đọc cau_hinh 'kho.chan_ban_khi_het_ton'.
// Bắt buộc hạn dùng khi nhập kho là cờ riêng từng sản phẩm (san_pham.bat_buoc_han_dung), sửa ở Danh mục.
export const KHOA_CHAN_HET_TON = "kho.chan_ban_khi_het_ton";

export function docChanHetTon(gia: string | null | undefined): boolean {
  return (gia ?? "0").trim() === "1";
}

export function giaTriChanHetTon(bat: boolean): string {
  return bat ? "1" : "0";
}
