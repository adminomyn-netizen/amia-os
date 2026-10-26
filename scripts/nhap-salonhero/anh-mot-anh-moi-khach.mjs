// Chuyển ảnh cũ SalonHero → kho ảnh AMIA OS, MỖI KHÁCH MỘT ẢNH (ảnh chụp sớm nhất = ảnh ban đầu, nhãn "trước điều trị").
// Ảnh được xoay đúng chiều (EXIF) và thu nhỏ cạnh dài 1200 px, JPEG chất lượng 78 (~100–200 KB) để vừa kho hiện tại.
// Chạy lại an toàn: ảnh đã có (duong_dan) thì bỏ qua; ảnh hỏng thì thử ảnh sớm nhất kế tiếp (tối đa 3 ảnh/khách).
// Dùng: node scripts/nhap-salonhero/anh-mot-anh-moi-khach.mjs [--gioi-han 50] [--song-song 8] [--tran-mb 900]
// Ảnh mới lưu hàng đợi 'cho' ⇒ tiến trình dong-bo-anh-lark.mjs tự đẩy sang Base Lark.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readFileSync } from "node:fs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? Number(process.argv[i + 1]) : mac; };
const gioiHan = arg("--gioi-han", Infinity), songSong = arg("--song-song", 8), tranMb = arg("--tran-mb", 900);
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Mọi ảnh (cả máy chủ AWS cũ lẫn Wasabi) đều đọc được qua CDN công khai theo phần đường dẫn sau "/PROD/".
const cdn = (u) => "https://salonhero-wasabi.becdn.net/" + u.split("/PROD/")[1];
const vnNgay = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);

const khach = new Map();
for (let i = 0; ; i += 1000) {
  const { data, error } = await sb.from("khach_hang").select("id, sh_id").not("sh_id", "is", null).range(i, i + 999);
  if (error) throw error;
  for (const k of data) khach.set(Number(k.sh_id), k.id);
  if (data.length < 1000) break;
}
const daCo = new Set();
for (let i = 0; ; i += 1000) {
  const { data, error } = await sb.from("khach_anh").select("khach_id").range(i, i + 999);
  if (error) throw error;
  for (const r of data) daCo.add(r.khach_id);
  if (data.length < 1000) break;
}

// [sh_khach_id, sh_anh_id, url, createdAt, is_deleted, nguoi_tao, ghi_chu]
const theoKhach = new Map();
for (const a of JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8"))) {
  if (a[4] || !khach.has(a[0]) || !a[3]) continue;
  (theoKhach.get(a[0]) ?? theoKhach.set(a[0], []).get(a[0])).push(a);
}
const viec = [...theoKhach.entries()]
  .filter(([sh]) => !daCo.has(khach.get(sh)))
  .map(([sh, ds]) => ({ khachId: khach.get(sh), ds: ds.sort((x, y) => x[3].localeCompare(y[3])).slice(0, 3) }))
  .slice(0, gioiHan);
console.log(`Khách có ảnh ${theoKhach.size}, đã có ảnh trong AMIA OS ${daCo.size}, còn phải chuyển ${viec.length}`);

let xong = 0, loi = 0, khongCo = 0, byte = 0, i = 0, dung = false;
const t0 = Date.now();
async function mot({ khachId, ds }) {
  for (const a of ds) {
    try {
      let buf;
      for (let lan = 0; lan < 3; lan++) {
        const r = await fetch(cdn(a[2]), { signal: AbortSignal.timeout(60_000) });
        if (r.ok) { buf = Buffer.from(await r.arrayBuffer()); break; }
        if (r.status === 404 || r.status === 403) throw new Error("CDN " + r.status);
      }
      if (!buf) throw new Error("CDN không trả ảnh");
      const nho = await sharp(buf).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      const ngay = vnNgay(a[3]);
      const duong = `${khachId}/${ngay}/sh-${a[1]}.jpg`;
      const { error: e1 } = await sb.storage.from("khach-anh").upload(duong, nho, { contentType: "image/jpeg", upsert: false });
      if (e1 && !/already exists|Duplicate/i.test(e1.message)) throw new Error("kho: " + e1.message);
      const { error: e2 } = await sb.from("khach_anh").insert({ khach_id: khachId, duong_dan: duong, loai: "truoc", ngay_chup: ngay, ghi_chu: [a[6], a[5] ? `Chụp bởi ${a[5]} (SalonHero)` : "Chuyển từ SalonHero"].filter(Boolean).join(" — ").slice(0, 500) || null });
      if (e2) { await sb.storage.from("khach-anh").remove([duong]); throw new Error("db: " + e2.message); }
      xong++; byte += nho.length;
      return;
    } catch (e) { if (loi++ < 10) console.log("lỗi", a[1], e.message); }
  }
  khongCo++;
}
async function chay() {
  while (i < viec.length && !dung) {
    await mot(viec[i++]);
    const n = xong + khongCo;
    if (n % 100 === 0) console.log(`${n}/${viec.length} · ${(byte / 1e6).toFixed(0)} MB · lỗi ${loi} · ${Math.round((Date.now() - t0) / 1000)}s`);
    if (byte / 1e6 > tranMb) { dung = true; console.log(`Dừng: đã vượt ${tranMb} MB (trần an toàn của kho).`); }
  }
}
await Promise.all(Array.from({ length: songSong }, chay));
console.log(`XONG: chuyển ${xong} ảnh (${(byte / 1e6).toFixed(0)} MB, TB ${xong ? Math.round(byte / xong / 1024) : 0} KB/ảnh), khách không lấy được ảnh nào ${khongCo}, lỗi ${loi}, ${Math.round((Date.now() - t0) / 1000)}s`);
