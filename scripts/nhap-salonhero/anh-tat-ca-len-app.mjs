// Đưa TOÀN BỘ ảnh cũ SalonHero (bản thu nhỏ ở ~/amia-anh-tam, bước 1 của anh-day-du-1-tai-ve.mjs) vào kho ảnh AMIA OS (bucket khach-anh) + bảng khach_anh,
// để mở hồ sơ khách là thấy đủ ảnh (tab Ảnh khách hàng). Chạy lại an toàn: ảnh đã có duong_dan thì bỏ qua; dừng giữa chừng chạy tiếp được.
// Dòng mới có lark_trang_thai = 'khong_dong_bo' vì ảnh đã nằm ở Base Lark theo gói zip (anh-day-du-3-day-len-lark.mjs), không đẩy lại từng ảnh.
// Dùng: node scripts/nhap-salonhero/anh-tat-ca-len-app.mjs [--gioi-han 300] [--song-song 32] [--thu-muc ~/amia-anh-tam]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const gioiHan = Number(arg("--gioi-han", Infinity)), songSong = Number(arg("--song-song", 32));
const thuMuc = arg("--thu-muc", join(homedir(), "amia-anh-tam")).replace(/^~/, homedir());
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const doc = async (bang, cot, loc) => { const ra = []; for (let i = 0; ; i += 1000) { const { data, error } = await loc(sb.from(bang).select(cot).range(i, i + 999)); if (error) throw error; ra.push(...data); if (data.length < 1000) return ra; } };

const khach = new Map((await doc("khach_hang", "id, sh_id", (q) => q.not("sh_id", "is", null))).map((k) => [Number(k.sh_id), k.id]));
const daCo = new Set((await doc("khach_anh", "duong_dan", (q) => q.like("duong_dan", "%/sh-%"))).map((r) => r.duong_dan));
// [sh_khach_id, sh_anh_id, url, createdAt, is_deleted, nguoi_tao, ghi_chu]
const meta = new Map();
for (const a of JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8"))) if (!a[4]) meta.set(Number(a[1]), a);

const viec = [];
for (const sh of readdirSync(thuMuc)) {
  if (!/^\d+$/.test(sh) || !khach.has(Number(sh))) continue;
  for (const ngay of readdirSync(join(thuMuc, sh))) {
    if (!/^\d{4}-\d\d-\d\d$/.test(ngay)) continue;
    for (const f of readdirSync(join(thuMuc, sh, ngay))) {
      const m = /^sh-(\d+)\.jpg$/.exec(f); if (!m) continue;
      const duong = `${khach.get(Number(sh))}/${ngay}/${f}`;
      if (!daCo.has(duong)) viec.push({ khachId: khach.get(Number(sh)), ngay, f, id: Number(m[1]), duong, tep: join(thuMuc, sh, ngay, f) });
    }
  }
  if (viec.length >= gioiHan) break;
}
viec.length = Math.min(viec.length, gioiHan);
console.log(`Ảnh đã có trong app ${daCo.size}, còn phải đưa vào ${viec.length}, song song ${songSong}`);

let xong = 0, loi = 0, byte = 0, i = 0, cho = [];
const t0 = Date.now();
async function ghiLo(lo) {
  for (let lan = 0; lan < 4; lan++) {
    const { error } = await sb.from("khach_anh").upsert(lo, { onConflict: "duong_dan", ignoreDuplicates: true });
    if (!error) return;
    if (lan === 3) { loi += lo.length; console.log("lỗi ghi bảng", error.message.slice(0, 150)); return; }
    await new Promise((x) => setTimeout(x, 2000 * (lan + 1)));
  }
}
async function mot(v) {
  try {
    const buf = readFileSync(v.tep);
    let e1;
    for (let lan = 0; lan < 4; lan++) {
      ({ error: e1 } = await sb.storage.from("khach-anh").upload(v.duong, buf, { contentType: "image/jpeg", upsert: false }));
      if (!e1 || /already exists|Duplicate/i.test(e1.message)) { e1 = null; break; }
      await new Promise((x) => setTimeout(x, 1500 * (lan + 1)));
    }
    if (e1) throw new Error(e1.message);
    const a = meta.get(v.id);
    cho.push({ khach_id: v.khachId, duong_dan: v.duong, loai: "truoc", ngay_chup: v.ngay, ghi_chu: [a?.[6], a?.[5] ? `Chụp bởi ${a[5]} (SalonHero)` : "Chuyển từ SalonHero"].filter(Boolean).join(" — ").slice(0, 1000), lark_trang_thai: "khong_dong_bo" });
    xong++; byte += buf.length;
    if (cho.length >= 200) { const lo = cho; cho = []; await ghiLo(lo); }
  } catch (e) { if (loi++ < 10) console.log("lỗi", v.id, String(e.message).slice(0, 150)); }
}
async function chay() {
  while (i < viec.length) {
    await mot(viec[i++]);
    if (i % 2000 === 0) console.log(`${i}/${viec.length} · ${(byte / 1e6).toFixed(0)} MB · lỗi ${loi} · ${Math.round((Date.now() - t0) / 1000)}s`);
  }
}
await Promise.all(Array.from({ length: songSong }, chay));
if (cho.length) await ghiLo(cho);
console.log(`XONG: ${xong} ảnh (${(byte / 1e6).toFixed(0)} MB), lỗi ${loi}, ${Math.round((Date.now() - t0) / 1000)}s`);
