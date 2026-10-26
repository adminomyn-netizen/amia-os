// Ghi vào bảng khach_anh_luu_tru số ảnh cũ SalonHero của từng khách còn nằm ở kho lưu trữ (không tính ảnh đã vĩnh viễn trong AMIA OS).
// Chạy lại an toàn (ghi đè theo khách). Dùng: node scripts/nhap-salonhero/anh-cu-dem-luu-tru.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const doc = async (bang, cot, loc) => { const ra = []; for (let i = 0; ; i += 1000) { const { data, error } = await loc(sb.from(bang).select(cot).range(i, i + 999)); if (error) throw error; ra.push(...data); if (data.length < 1000) return ra; } };

const khach = new Map((await doc("khach_hang", "id, sh_id", (q) => q.not("sh_id", "is", null))).map((k) => [Number(k.sh_id), k.id]));
const vinhVien = new Set((await doc("khach_anh", "duong_dan", (q) => q.like("duong_dan", "%/sh-%").is("het_han", null))).map((r) => Number(/sh-(\d+)\.jpg$/.exec(r.duong_dan)?.[1])));
const dem = new Map();
for (const a of JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8"))) if (!a[4] && a[3] && khach.has(a[0]) && !vinhVien.has(a[1])) dem.set(a[0], (dem.get(a[0]) ?? 0) + 1);
const dong = [...dem].map(([sh, so]) => ({ khach_id: khach.get(sh), so_anh: so, cap_nhat_luc: new Date().toISOString() }));
for (let i = 0; i < dong.length; i += 500) { const { error } = await sb.from("khach_anh_luu_tru").upsert(dong.slice(i, i + 500), { onConflict: "khach_id" }); if (error) throw error; }
console.log(`Đã ghi ${dong.length} khách, tổng ${[...dem.values()].reduce((a, b) => a + b, 0)} ảnh ở kho lưu trữ`);
