// Kiểm nhanh trên bản thật: đăng nhập tài khoản tạm vai Chủ, tải từng trang, báo mã HTTP, thời gian, và có chữ lỗi không.
// Dùng: node scripts/thu/kiem-trang-ban-that.mjs [BASE] -- /duong/dan1 /duong/dan2 ...   Không xuất Excel (để xoá được tài khoản tạm).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2); const i = args.indexOf("--");
const BASE = (i > 0 ? args[0] : null) ?? "https://amia-os-neon.vercel.app";
const TRANG = i >= 0 ? args.slice(i + 1) : args;
const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const k = l.indexOf("="); return [l.slice(0, k), l.slice(k + 1).replace(/^"|"$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const db = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY);
let uid, nvId;
try {
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-kiem-${Date.now()}@amia-os.invalid`;
  uid = (await db.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  nvId = (await db.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ] Chủ kiểm trang", vai_tro: "chu", email }).select("id").single()).data.id;
  const s = await createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = [];
  for (let j = 0; j < val.length; j += 3180) parts.push(val.slice(j, j + 3180));
  const cookie = parts.map((p, j) => `${parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${j}`}=${encodeURIComponent(p)}`).join("; ");
  for (const p of TRANG) {
    const t = Date.now();
    const r = await fetch(BASE + p, { headers: { cookie }, redirect: "manual" });
    const html = r.status === 200 ? await r.text() : "";
    const loi = /Đã có lỗi|Application error|statement timeout|Không tải được/i.exec(html)?.[0] ?? "";
    console.log(`${r.status} ${String(Date.now() - t).padStart(5)}ms ${p}${r.headers.get("location") ? " → " + r.headers.get("location") : ""}${loi ? "  LỖI: " + loi : ""}`);
  }
} finally {
  if (nvId) await db.from("nhan_vien").delete().eq("id", nvId);
  if (uid) await db.auth.admin.deleteUser(uid);
}
