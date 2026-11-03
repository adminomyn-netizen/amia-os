import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { KHOA_JWT, fetchAuthCoHan } from "@/lib/supabase/khoa-jwt";

// getClaims có truyền khoá: kiểm chữ ký tại chỗ, KHÔNG gọi mạng (03/11/2026 Auth treo làm cả app treo khi phải lấy JWKS qua mạng).
const b64 = (b: ArrayBuffer | Uint8Array | string) => Buffer.from(typeof b === "string" ? b : new Uint8Array(b as ArrayBuffer)).toString("base64url");

async function taoToken(kid: string) {
  const cap = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const jwk = { ...(await crypto.subtle.exportKey("jwk", cap.publicKey)), kid, alg: "ES256" };
  const dau = b64(JSON.stringify({ alg: "ES256", kid, typ: "JWT" })), than = b64(JSON.stringify({ sub: "u-1", exp: Math.floor(Date.now() / 1000) + 600, role: "authenticated" }));
  const ky = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cap.privateKey, new TextEncoder().encode(`${dau}.${than}`));
  return { token: `${dau}.${than}.${b64(ky)}`, jwk };
}

describe("khoá JWT nhúng sẵn", () => {
  it("getClaims với { keys } không gọi mạng; chữ ký sai bị từ chối", async () => {
    let goi = 0;
    const sb = createClient("https://x.supabase.co", "anon", { global: { fetch: () => { goi++; throw new Error("cấm mạng"); } }, auth: { persistSession: false } });
    const { token, jwk } = await taoToken("kid-thu");
    const ok = await sb.auth.getClaims(token, { keys: [jwk] } as never);
    expect(ok.error).toBeNull();
    expect(ok.data?.claims.sub).toBe("u-1");
    const sai = await sb.auth.getClaims(token.slice(0, -6) + (token.endsWith("AAAAAA") ? "BBBBBB" : "AAAAAA"), { keys: [jwk] } as never);
    expect(sai.error).not.toBeNull();
    expect(goi).toBe(0);
  });
  it("khoá mặc định là khoá ES256 của dự án", () => {
    const k = (KHOA_JWT.keys as unknown as { kid: string; alg: string }[])[0];
    expect(k.kid).toBe("d8d49fb6-77c1-46f0-86f6-8798f596c8eb");
    expect(k.alg).toBe("ES256");
  });
  it("fetchAuthCoHan gắn hạn giờ cho đường JWKS", async () => {
    const goc = globalThis.fetch; let tinHieu: AbortSignal | undefined | null;
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => { tinHieu = init?.signal; return new Response("{}"); }) as typeof fetch;
    try {
      await fetchAuthCoHan("https://x.supabase.co/auth/v1/.well-known/jwks.json");
      expect(tinHieu).toBeInstanceOf(AbortSignal);
      tinHieu = undefined;
      await fetchAuthCoHan("https://x.supabase.co/auth/v1/user");
      expect(tinHieu).toBeUndefined();
    } finally { globalThis.fetch = goc; }
  });
});
