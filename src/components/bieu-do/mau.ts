/** Bảng màu biểu đồ lấy từ sắc nhấn của AMIA (xanh lục chính trước, rồi các sắc phụ); phần "khác" dùng xám ấm. */
export const MAU_BIEU_DO = ["var(--sac-luc-mau)", "var(--dat)", "var(--sac-xanh-mau)", "var(--sac-tim-mau)", "var(--sac-hong-mau)", "#00564c", "#7d5f22", "#8c8777"];
/** `mau`: màu riêng của khúc (nếu bỏ trống thì lấy theo thứ tự bảng màu). */
export type Diem = { nhan: string; gia_tri: number; mau?: string };
