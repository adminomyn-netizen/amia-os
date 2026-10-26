/** Một ảnh khách đã kèm link xem có hạn. Dùng chung cho server và trình duyệt (không import gì phía server). */
export type AnhKhach = { id: string; url: string | null; loai: string; ngay: string; ghiChu: string | null; taoLuc: string };
/** Mỗi lần chỉ lấy và ký link cho từng này ảnh; cuộn gần tới cuối mới lấy tiếp (khách có thể có hàng nghìn ảnh). */
export const SO_ANH_TRANG = 30;
