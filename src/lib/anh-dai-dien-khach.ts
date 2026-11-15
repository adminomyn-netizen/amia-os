import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/** Ảnh đại diện khách lưu thành tệp trên ổ hosting (chị Lâm 14/11/2026: không dồn vào Supabase cho nhẹ). Thư mục nằm NGOÀI thư mục chạy app
 *  (~/apps/run/amia-os bị thay mỗi lần triển khai) nên đẩy code mới không mất ảnh. Supabase chỉ giữ một dòng đánh dấu ở khach_hang.anh_dai_dien_url:
 *  "hosting:<mốc>" = ảnh tải lên ở AMIA; "https://s3…salonherodev/…" = ảnh SalonHero, lần đầu xem sẽ tự kéo về ổ hosting. */
export const THU_MUC_ANH_KHACH = process.env.ANH_KHACH_DIR || path.join(os.homedir(), "amia-du-lieu", "anh-khach");
export const NGUON_SALONHERO = "https://s3-ap-northeast-1.amazonaws.com/salonherodev/";
/** 247 khách có ảnh ở kho wasabi của SalonHero (cùng đường sau /PROD/). */
export const NGUON_SALONHERO_WASABI = "https://s3.ap-northeast-1.wasabisys.com/salonhero/";
export const laAnhSalonHero = (u: string) => (u.startsWith(NGUON_SALONHERO) || u.startsWith(NGUON_SALONHERO_WASABI)) && u.includes("/PROD/");
export const DANH_DAU_HOSTING = "hosting:";
export const ANH_TOI_DA = 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const duong = (id: string) => {
  if (!UUID.test(id)) throw new Error("mã khách không hợp lệ");
  return path.join(THU_MUC_ANH_KHACH, id.slice(0, 2), `${id}.jpg`);
};
/** JPEG/PNG/WebP nhận diện theo byte đầu, không tin đuôi tệp hay content-type. */
export function loaiAnh(b: Uint8Array): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}
export async function docAnhDaiDien(id: string): Promise<Buffer | null> {
  try { return await fs.readFile(duong(id)); } catch { return null; }
}
export async function coAnhDaiDien(id: string): Promise<boolean> {
  try { await fs.access(duong(id)); return true; } catch { return false; }
}
/** Ghi qua tệp tạm rồi đổi tên: đang ghi dở mà máy chủ tắt thì không để lại ảnh hỏng. */
export async function ghiAnhDaiDien(id: string, buf: Buffer): Promise<void> {
  const d = duong(id);
  await fs.mkdir(path.dirname(d), { recursive: true });
  const tam = `${d}.${process.pid}.${Date.now()}.tam`;
  await fs.writeFile(tam, buf);
  await fs.rename(tam, d);
}
export async function xoaAnhDaiDien(id: string): Promise<void> {
  await fs.rm(duong(id), { force: true });
}
/** Kéo ảnh SalonHero (chỉ đọc, đúng kho salonherodev) về ổ hosting. Trả null nếu không lấy được. */
export async function keoAnhSalonHero(id: string, url: string): Promise<Buffer | null> {
  if (!laAnhSalonHero(url)) return null;
  try {
    // Link S3 gốc bị chặn (403); SalonHero phục vụ qua CDN wasabi cùng đường dẫn sau /PROD/.
    const cdn = "https://salonhero-wasabi.becdn.net/" + url.split("/PROD/")[1];
    const r = await fetch(cdn, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 3 * ANH_TOI_DA || !loaiAnh(buf)) return null;
    await ghiAnhDaiDien(id, buf);
    return buf;
  } catch { return null; }
}
