// Dùng: PW=... [BASE=http://localhost:3105] node scripts/thu/soi-truy-van-trang.mjs /trang1 /trang2 (tài khoản tạm vai Chủ, tự xoá)
// Mỗi trang: chụp pg_stat_statements → tải trang (bản thật, tài khoản tạm Chủ) → chụp lại → in truy vấn tốn nhất của trang đó.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";
const R = new URL("../../", import.meta.url).pathname;
const BASE = process.env.BASE ?? "https://amia-os-neon.vercel.app";
const env = Object.fromEntries(readFileSync(R + ".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const k = l.indexOf("="); return [l.slice(0, k), l.slice(k + 1).replace(/^"|"$/g, "")]; }));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ref = new URL(URL_).host.split(".")[0];
const sbA = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY);
const pg = await ketNoi();
const chup = async () => new Map((await pg.query(`select queryid::text id, calls, total_exec_time t, regexp_replace(left(query, 260), '\\s+', ' ', 'g') q from extensions.pg_stat_statements`)).rows.map((r) => [r.id, r]));
let uid, nvId;
try {
  const pw = "Th-" + Math.random().toString(36).slice(2) + "A9!", email = `thu-kiem-${Date.now()}@amia-os.invalid`;
  uid = (await sbA.auth.admin.createUser({ email, password: pw, email_confirm: true })).data.user.id;
  nvId = (await sbA.from("nhan_vien").insert({ user_id: uid, ho_ten: "[THỬ] Chủ kiểm trang", vai_tro: "chu", email }).select("id").single()).data.id;
  const s = await createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY).auth.signInWithPassword({ email, password: pw });
  const val = "base64-" + Buffer.from(JSON.stringify(s.data.session)).toString("base64url"); const parts = [];
  for (let j = 0; j < val.length; j += 3180) parts.push(val.slice(j, j + 3180));
  const cookie = parts.map((p, j) => `${parts.length === 1 ? `sb-${ref}-auth-token` : `sb-${ref}-auth-token.${j}`}=${encodeURIComponent(p)}`).join("; ");
  for (const p of process.argv.slice(2)) {
    await (await fetch(BASE + p, { headers: { cookie } })).text(); // làm ấm
    const a = await chup(); const t = Date.now();
    const html = await (await fetch(BASE + p, { headers: { cookie } })).text();
    const ms = Date.now() - t; await new Promise((r) => setTimeout(r, 300)); const b = await chup();
    const d = [...b.values()].map((x) => { const o = a.get(x.id); return { ...x, dc: x.calls - (o?.calls ?? 0), dt: x.t - (o?.t ?? 0) }; }).filter((x) => x.dc > 0 && !/pg_stat_statements|get_auth|set_config\('search_path/.test(x.q)).sort((x, y) => y.dt - x.dt);
    console.log(`\n=== ${p}  ${ms} ms, ${Math.round(html.length / 1024)} KB, ${d.length} truy vấn, tổng DB ${Math.round(d.reduce((s, x) => s + x.dt, 0))} ms`);
    for (const x of d.slice(0, 8)) console.log(`  ${Math.round(x.dt).toString().padStart(5)}ms ×${x.dc} ${x.q.replace(/^WITH pgrst_source AS \( ?/, "").slice(0, 200)}`);
  }
} finally {
  // Xoá nhân viên tạm (thử lại vì lúc CSDL bận có thể hết giờ); không xoá được thì khoá lại và báo, để không sót tài khoản Chủ còn mở.
  if (nvId) { let r; for (let k = 0; k < 3; k++) { r = await sbA.from("nhan_vien").delete().eq("id", nvId); if (!r.error) break; await new Promise((x) => setTimeout(x, 2000)); }
    if (r.error) { await sbA.from("nhan_vien").update({ hoat_dong: false }).eq("id", nvId); console.error("CẢNH BÁO: chưa xoá được nhân viên tạm", nvId, r.error.message, "→ đã khoá (hoat_dong=false)"); } }
  if (uid) await sbA.auth.admin.deleteUser(uid);
  await pg.end();
}
