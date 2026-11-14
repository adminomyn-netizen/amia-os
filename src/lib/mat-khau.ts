/** Mật khẩu ban đầu khi chủ chốt (26/10/2026): người dùng buộc phải đổi ở lần đăng nhập đầu. */
export const MK_MAC_DINH = "12345678";

/** Mật khẩu mặc định đã bị đăng công khai (29/10/2026) và các mật khẩu quá phổ biến: không cho đặt làm mật khẩu mới. */
export const MAT_KHAU_YEU = ["12345678", "123456789", "1234567890", "11111111", "00000000", "password", "matkhau123", "amia1234", "amia@123"];

/** Kiểm mật khẩu mới; trả về câu lỗi hoặc null nếu dùng được. */
export function loiMatKhauMoi(moi: string): string | null {
  if (moi.length < 8) return "Mật khẩu mới tối thiểu 8 ký tự.";
  if (MAT_KHAU_YEU.includes(moi.toLowerCase())) return "Mật khẩu này quá dễ đoán (đã lộ). Chọn mật khẩu khác, tối thiểu 8 ký tự.";
  return null;
}
