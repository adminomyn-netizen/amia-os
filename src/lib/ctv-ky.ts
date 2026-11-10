import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** Phần thuần (không đọc cookie / env) của phiên CTV — tách riêng để test được. Máy chủ dùng qua src/lib/ctv-phien.ts.
 *  Phiên = base64url(JSON {dt, v, het}) + "." + HMAC-SHA256(khoá máy chủ). v = doi_tac_gt.phien_ver lúc đăng nhập (tăng = đăng xuất mọi thiết bị). */
export type PhienCtv = { dt: string; v: number; het: number };

const b64 = (b: Buffer) => b.toString("base64url");
const chuKy = (noiDung: string, khoa: string) => createHmac("sha256", `ctv-phien|${khoa}`).update(noiDung).digest();

export function kyPhien(p: PhienCtv, khoa: string): string {
  const noiDung = b64(Buffer.from(JSON.stringify({ dt: p.dt, v: p.v, het: p.het })));
  return `${noiDung}.${b64(chuKy(noiDung, khoa))}`;
}

/** Đọc + kiểm chữ ký (so sánh hằng thời gian) + hạn. Sai bất cứ gì → null. */
export function docPhien(chuoi: string | undefined | null, khoa: string): PhienCtv | null {
  if (!chuoi || chuoi.length > 600 || !khoa) return null;
  const [noiDung, ky, thua] = chuoi.split(".");
  if (!noiDung || !ky || thua !== undefined) return null;
  const mong = chuKy(noiDung, khoa);
  let nhan: Buffer;
  try { nhan = Buffer.from(ky, "base64url"); } catch { return null; }
  if (nhan.length !== mong.length || !timingSafeEqual(nhan, mong)) return null;
  try {
    const p = JSON.parse(Buffer.from(noiDung, "base64url").toString("utf8")) as PhienCtv;
    if (typeof p.dt !== "string" || !/^[0-9a-f-]{36}$/i.test(p.dt) || !Number.isInteger(p.v) || typeof p.het !== "number") return null;
    return p.het > Date.now() ? p : null;
  } catch { return null; }
}

/** Mã 6 số ngẫu nhiên an toàn (crypto.randomInt). */
export const soMa = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** Băm mã xác thực: HMAC(khoá máy chủ, mục đích|SĐT|mã) → hex 64 ký tự. DB chỉ giữ băm này. */
export const bamMa = (khoa: string, mucDich: string, sdt: string, ma: string) => createHmac("sha256", `ctv-ma|${khoa}`).update(`${mucDich}|${sdt}|${ma}`).digest("hex");

/** So hai băm hex hằng thời gian. */
export function bangNhau(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8"), y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}
