/** Một ảnh khách đã kèm link xem có hạn. Dùng chung cho server và trình duyệt (không import gì phía server). */
export type AnhKhach = { id: string; url: string | null; loai: string; ngay: string; ghiChu: string | null; taoLuc: string; taoBoiId: string | null; taoBoi: string | null; vanBan: string | null };
/** Mỗi lần chỉ lấy và ký link cho từng này ảnh; cuộn gần tới cuối mới lấy tiếp (khách có thể có hàng nghìn ảnh). */
export const SO_ANH_TRANG = 30;
/** Lô đầu nhỏ hơn (đủ lấp màn hình đầu): server ký ít link, trình duyệt tải ít ảnh nên tab mở nhanh; cuộn tới đâu lấy tiếp tới đó. */
export const SO_ANH_TRANG_DAU = 12;
