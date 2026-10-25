// Đọc FormData gọn (máy chủ).
export const chuoi = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const chuoiHoacNull = (fd: FormData, k: string) => chuoi(fd, k) || null;
export const so = (fd: FormData, k: string) => Number(String(fd.get(k) ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
export const soHoacNull = (fd: FormData, k: string) => (chuoi(fd, k) === "" ? null : so(fd, k));
export const bat = (fd: FormData, k: string) => fd.get(k) === "1";
export const mang = (fd: FormData, k: string) => fd.getAll(k).map(String).filter(Boolean);
