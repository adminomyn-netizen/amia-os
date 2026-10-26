// BƯỚC 2/2 chuyển TOÀN BỘ ảnh cũ SalonHero: đẩy các ảnh đã thu nhỏ ở ổ đĩa (bước 1) lên kho ảnh AMIA OS + ghi bảng khach_anh.
// Cần kho đủ chỗ (gói Supabase Pro trở lên; gói miễn phí chỉ 1 GB). Chạy lại an toàn: ảnh đã có (duong_dan) thì bỏ qua.
// Ảnh nhập hàng loạt đánh dấu lark_trang_thai='khong_dong_bo' để không bị đẩy sang Base Lark.
// Dùng: node scripts/nhap-salonhero/anh-day-du-2-day-len.mjs [--thu-muc ~/amia-anh-tam] [--song-song 8] [--gioi-han 100] [--tran-mb 900]
//   --tran-mb: dừng khi kho vượt ngần này MB (mặc định 900 = an toàn cho gói miễn phí; đặt 90000 khi đã lên Pro).
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = arg("--thu-muc", join(homedir(), "amia-anh-tam")).replace(/^~/, homedir());
const songSong = Number(arg("--song-song", 8)), gioiHan = Number(arg("--gioi-han", Infinity)), tranMb = Number(arg("--tran-mb", 900));
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const vnNgay = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
const doc = async (bang, cot, loc) => { const ra = []; for (let i = 0; ; i += 1000) { const { data, error } = await loc(sb.from(bang).select(cot).range(i, i + 999)); if (error) throw error; ra.push(...data); if (data.length < 1000) break; } return ra; };

const khach = new Map((await doc("khach_hang", "id, sh_id", (q) => q.not("sh_id", "is", null))).map((k) => [Number(k.sh_id), k.id]));
const daCo = new Set((await doc("khach_anh", "duong_dan", (q) => q)).map((r) => r.duong_dan));
const ds = JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8")).filter((a) => !a[4] && a[3] && khach.has(a[0]));
const viec = ds.map((a) => ({ a, ngay: vnNgay(a[3]) }))
  .map((v) => ({ ...v, duong: `${khach.get(v.a[0])}/${v.ngay}/sh-${v.a[1]}.jpg`, tep: join(thuMuc, String(v.a[0]), v.ngay, `sh-${v.a[1]}.jpg`) }))
  .filter((v) => !daCo.has(v.duong) && existsSync(v.tep)).slice(0, gioiHan);
console.log(`Ảnh trong nguồn ${ds.length}, đã có trong AMIA OS ${daCo.size}, sẵn sàng đẩy ${viec.length}`);

async function dungLuong() { const { data } = await sb.rpc("dung_luong_kho_anh_mb"); return Number(data ?? 0); }
let xong = 0, loi = 0, byte = 0, i = 0, dung = false;
const t0 = Date.now();
async function chay() {
  while (i < viec.length && !dung) {
    const { a, ngay, duong, tep } = viec[i++];
    try {
      const buf = readFileSync(tep);
      const { error: e1 } = await sb.storage.from("khach-anh").upload(duong, buf, { contentType: "image/jpeg", upsert: true });
      if (e1) throw new Error("kho: " + e1.message);
      const { error: e2 } = await sb.from("khach_anh").upsert({ khach_id: khach.get(a[0]), duong_dan: duong, loai: "khac", ngay_chup: ngay, lark_trang_thai: "khong_dong_bo",
        ghi_chu: [a[6], a[5] ? `Chụp bởi ${a[5]} (SalonHero)` : "Chuyển từ SalonHero"].filter(Boolean).join(" — ").slice(0, 500) || null }, { onConflict: "duong_dan", ignoreDuplicates: true });
      if (e2) throw new Error("db: " + e2.message);
      xong++; byte += buf.length;
    } catch (e) { loi++; if (loi <= 10) console.log("lỗi", a[1], e.message); if (/quota|exceed|limit|storage/i.test(String(e.message))) { dung = true; console.log("Kho báo hết chỗ, dừng."); } }
    const n = xong + loi;
    if (n % 500 === 0) { console.log(`${n}/${viec.length} · ${(byte / 1e9).toFixed(2)} GB · lỗi ${loi} · ${Math.round((Date.now() - t0) / 60000)} phút`); if ((await dungLuong()) > tranMb) { dung = true; console.log(`Dừng: kho vượt ${tranMb} MB (trần an toàn).`); } }
  }
}
await Promise.all(Array.from({ length: songSong }, chay));
console.log(`XONG BƯỚC 2: ${xong} ảnh (${(byte / 1e9).toFixed(2)} GB), lỗi ${loi}, ${Math.round((Date.now() - t0) / 60000)} phút`);
