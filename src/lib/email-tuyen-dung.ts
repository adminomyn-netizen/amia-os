import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Bước ứng viên → mẫu thư tự động. Vòng 1, Vòng 2 không có thư (nhân sự tự liên hệ). */
export const MAU_THEO_BUOC: Record<string, string> = { "Mới nộp": "nhan_cv", "Hẹn phỏng vấn": "moi_phong_van", "Đề nghị": "de_nghi", "Nhận việc": "chao_mung", "Không đạt": "cam_on" };
export const BIEN_MAU = ["ten", "vi_tri", "ngay_phong_van", "ngay_nhan_viec"] as const;

/** Điền {{biến}} vào mẫu. Biến chưa biết hoặc rỗng thì bỏ trống, không để lộ "{{...}}" trong thư gửi đi. */
export const dienMau = (mau: string, giaTri: Record<string, string | null | undefined>) =>
  mau.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k: string) => giaTri[k] ?? "");

export const ngayThu = (d: string | null | undefined) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "");
export const emailHopLe = (s: string) => /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200;

const khoaTu = (biMat: string) => createHash("sha256").update(`tuyen-dung-thu:${biMat}`).digest();
/** Mã hoá mật khẩu ứng dụng Gmail trước khi lưu: AES-256-GCM, khoá suy ra từ khoá máy chủ. Kết quả base64(iv|tag|nội dung). */
export function maHoaThu(chu: string, biMat: string) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", khoaTu(biMat), iv);
  const ct = Buffer.concat([c.update(chu, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}
/** Giải mã; sai khoá hoặc dữ liệu hỏng thì trả null (người dùng nhập lại kết nối). */
export function giaiMaThu(b64: string, biMat: string) {
  try {
    const b = Buffer.from(b64, "base64"), d = createDecipheriv("aes-256-gcm", khoaTu(biMat), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch { return null; }
}
