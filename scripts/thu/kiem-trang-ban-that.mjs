// Kiểm nhanh trên bản thật: đăng nhập tài khoản tạm vai Chủ, tải từng trang, báo mã HTTP, thời gian, và có chữ lỗi không.
// Dùng: node scripts/thu/kiem-trang-ban-that.mjs [BASE] [--lap N] -- /duong/dan1 /duong/dan2 ...   Không xuất Excel (để xoá được tài khoản tạm).
// In: mã HTTP, TTFB (byte đầu), thời gian tải trọn HTML (gồm phần stream sau) và cỡ HTML; --lap N đo N lần mỗi trang, in số tốt nhất.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2); const i = args.indexOf("--");
const iLap = args.indexOf("--lap"), LAP = iLap >= 0 && iLap < i ? Math.max(1, +args[iLap + 1] || 1) : 1;
const BASE = (i > 0 && !args[0].startsWith("--") ? args[0] : null) ?? "https://amia-os-neon.vercel.app";
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
    let tot = null, r, html = "";
    for (let k = 0; k < LAP; k++) {
      const t = Date.now();
      r = await fetch(BASE + p, { headers: { cookie }, redirect: "manual" });
      const ttfb = Date.now() - t;
      html = r.status === 200 ? await r.text() : "";
      const xong = Date.now() - t;
      if (!tot || xong < tot.xong) tot = { ttfb, xong };
    }
    const loi = /Đã có lỗi|Application error|statement timeout|Không tải được/i.exec(html)?.[0] ?? "";
    console.log(`${r.status} ttfb ${String(tot.ttfb).padStart(5)}ms  trọn ${String(tot.xong).padStart(5)}ms ${String(Math.round(html.length / 1024)).padStart(5)} KB ${p}${r.headers.get("location") ? " → " + r.headers.get("location") : ""}${loi ? "  LỖI: " + loi : ""}`);
  }
} finally {
  // Xoá nhân viên tạm (thử lại vì lúc CSDL bận có thể hết giờ); không xoá được thì khoá lại và báo, để không sót tài khoản Chủ còn mở.
  if (nvId) { let r; for (let k = 0; k < 3; k++) { r = await db.from("nhan_vien").delete().eq("id", nvId); if (!r.error) break; await new Promise((x) => setTimeout(x, 2000)); }
    if (r.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.error("CẢNH BÁO: chưa xoá được nhân viên tạm", nvId, r.error.message, "→ đã khoá (hoat_dong=false)"); } }
  if (uid) await db.auth.admin.deleteUser(uid);
}
