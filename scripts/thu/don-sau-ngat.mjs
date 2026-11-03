// Dọn dữ liệu thử sót khi phiên chạy thử Lịch hẹn bị ngắt giữa chừng: chỗ [THỬ], lịch ghi chú [THỬ], khách [THỬ].
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: ks } = await db.from("khach_hang").select("id").like("ho_ten", "[THỬ]%");
const ids = (ks ?? []).map((k) => k.id);
if (ids.length) { const { data: ls } = await db.from("lich_hen").select("id").in("khach_id", ids); const li = (ls ?? []).map((l) => l.id); if (li.length) { await db.from("lich_hen_dich_vu").delete().in("lich_id", li); await db.from("lich_hen").delete().in("id", li); } await db.from("khach_quan_tam").delete().in("khach_id", ids); const r = await db.from("khach_hang").delete().in("id", ids); console.log("xoá khách thử:", r.error?.message ?? ids.length); }
const c = await db.from("cho_lam").delete().like("ten", "[THỬ]%"); console.log("xoá chỗ thử:", c.error?.message ?? "ok");
