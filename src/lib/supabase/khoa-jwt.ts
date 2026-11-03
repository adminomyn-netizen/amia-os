/** Khoá CÔNG KHAI kiểm chữ ký phiên đăng nhập Supabase (JWT Signing Keys, ES256) — để getClaims() kiểm tại chỗ, KHÔNG gọi mạng.
 * Không truyền khoá thì auth-js tự lấy /auth/v1/.well-known/jwks.json, nhớ 10 phút mỗi máy chủ: máy chủ Vercel nguội hoặc hết 10 phút là
 * phải gọi lại, và lúc Auth treo (03/11/2026 18:40–19:00 JWKS treo > 15 s) thì MỌI trang treo theo.
 * Đây là khoá công khai (ai cũng đọc được ở đường JWKS), không phải bí mật. Đổi/xoay khoá: đặt biến SUPABASE_JWKS = nội dung JWKS mới
 * (JSON {"keys":[...]}) trên Vercel, hoặc sửa bản mặc định dưới đây. Token mang kid lạ thì auth-js vẫn tự lấy JWKS qua mạng (có hạn giờ, xem fetchAuthCoHan). */
type Jwk = { kty: string; kid: string; alg?: string; crv?: string; x?: string; y?: string; use?: string; key_ops?: string[]; ext?: boolean };

const MAC_DINH: Jwk[] = [{
  kty: "EC", crv: "P-256", alg: "ES256", use: "sig", key_ops: ["verify"], ext: true,
  kid: "d8d49fb6-77c1-46f0-86f6-8798f596c8eb",
  x: "uLBqUdMZa4dOxkPdgkBlESlz73gdgSJxjwgUjDDcf3c",
  y: "HBqhldWdRHwdjoG8JYptXbOiwNnvq2Y593f6t9oV2gg",
}];

function docBien(): Jwk[] {
  try {
    const v = process.env.SUPABASE_JWKS;
    const keys = v ? (JSON.parse(v) as { keys?: Jwk[] }).keys : undefined;
    return Array.isArray(keys) && keys.length ? keys : MAC_DINH;
  } catch { return MAC_DINH; }
}

// auth-js chỉ cần { keys } (kiểu JWK của nó); ép kiểu cho gọn vì cấu trúc trùng.
export const KHOA_JWT = { keys: docBien() } as unknown as { keys: never[] };

/** fetch cho máy khách Supabase phía máy chủ: riêng đường JWKS có hạn 3 s (kid lạ/xoay khoá) để Auth treo không kéo cả trang treo theo. */
export const fetchAuthCoHan: typeof fetch = (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("/.well-known/jwks.json") && !init?.signal) return fetch(input, { ...init, signal: AbortSignal.timeout(3000) });
  return fetch(input, init);
};
