import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: nvs } = await db.from("nhan_vien").select("id, user_id, email, hoat_dong").like("ho_ten", "[THỬ] Chủ lịch hẹn%");
console.log("nhan_vien thử:", nvs?.length);
for (const n of nvs ?? []) {
  const x = await db.from("nhan_vien").delete().eq("id", n.id);
  if (x.error) { await db.from("nhan_vien").update({ hoat_dong: false }).eq("id", n.id); console.log("không xoá được, đặt hoat_dong=false", n.id); }
  if (n.user_id) await db.auth.admin.deleteUser(n.user_id);
}
const { data: us } = await db.auth.admin.listUsers({ perPage: 1000 });
for (const u of us.users.filter((u) => /^thu-lich-.*@amia-os\.invalid$/.test(u.email ?? ""))) { await db.auth.admin.deleteUser(u.id); console.log("xoá auth", u.email); }
const c = await db.from("nhan_vien").select("id", { count: "exact", head: true }).like("ho_ten", "[THỬ] Chủ lịch hẹn%").eq("hoat_dong", true);
console.log("còn hoạt động:", c.count);
