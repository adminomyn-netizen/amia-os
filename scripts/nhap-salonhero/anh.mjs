// Chuyển ảnh khách SalonHero → Cloudflare R2 (+ bảng khach_anh). Chạy lại an toàn: ảnh đã có (duong_dan) thì bỏ qua; dừng giữa chừng chạy tiếp được.
// Dùng: PW=<mật khẩu DB> R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=… node scripts/nhap-salonhero/anh.mjs [--gioi-han 50] [--song-song 8]
//   Đầu vào: sao-luu/salonhero/anh.json = [[sh_khach_id, sh_anh_id, url_s3, createdAt, is_deleted, nguoi_tao, ghi_chu], …]
//   Tải ảnh từ CDN công khai của SalonHero (đổi tên miền S3 → salonhero-wasabi.becdn.net), đẩy lên R2 theo khoá `<khach_uuid>/<ngày>/sh-<id>.jpg`.
import pg from "pg";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? Number(process.argv[i + 1]) : mac; };
const gioiHan = arg("--gioi-han", Infinity), songSong = arg("--song-song", 8);
const { R2_ACCOUNT_ID: acc, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: key, R2_BUCKET: bucket } = process.env;
if (!acc || !id || !key || !bucket) throw new Error("Thiếu biến R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET");
const r2 = new S3Client({ region: "auto", endpoint: `https://${acc}.r2.cloudflarestorage.com`, credentials: { accessKeyId: id, secretAccessKey: key } });
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect();

const cdn = (u) => u.replace("https://s3-ap-northeast-1.amazonaws.com/salonherodev/PROD/", "https://salonhero-wasabi.becdn.net/");
const vnNgay = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
const khach = new Map((await db.query("select sh_id, id from public.khach_hang where sh_id is not null")).rows.map((r) => [Number(r.sh_id), r.id]));
const daCo = new Set((await db.query("select duong_dan from public.khach_anh")).rows.map((r) => r.duong_dan));

const ds = JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8")).filter((a) => !a[4] && khach.has(a[0]));
const viec = ds.map((a) => ({ a, duong: `${khach.get(a[0])}/${vnNgay(a[3])}/sh-${a[1]}.jpg` })).filter((v) => !daCo.has(v.duong)).slice(0, gioiHan);
console.log(`Ảnh trong nguồn ${ds.length}, còn phải chuyển ${viec.length}`);

let xong = 0, loi = 0, byte = 0, i = 0;
const t0 = Date.now();
async function chay() {
  while (i < viec.length) {
    const { a, duong } = viec[i++];
    try {
      const r = await fetch(cdn(a[2]));
      if (!r.ok) throw new Error("CDN " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      await r2.send(new PutObjectCommand({ Bucket: bucket, Key: duong, Body: buf, ContentType: "image/jpeg" }));
      await db.query("insert into public.khach_anh (khach_id, duong_dan, loai, ngay_chup, ghi_chu) values ($1, $2, 'khac', $3, $4) on conflict (duong_dan) do nothing",
        [khach.get(a[0]), duong, vnNgay(a[3]), [a[6], a[5] ? `Chụp bởi ${a[5]} (SalonHero)` : "Chuyển từ SalonHero"].filter(Boolean).join(" — ") || null]);
      xong++; byte += buf.length;
    } catch (e) { loi++; if (loi <= 10) console.log("lỗi", a[1], e.message); }
    if ((xong + loi) % 200 === 0) console.log(`${xong + loi}/${viec.length} · ${(byte / 1e9).toFixed(2)} GB · lỗi ${loi} · ${Math.round((Date.now() - t0) / 1000)}s`);
  }
}
await Promise.all(Array.from({ length: songSong }, chay));
console.log(`XONG: chuyển ${xong}, lỗi ${loi}, ${(byte / 1e9).toFixed(2)} GB, ${Math.round((Date.now() - t0) / 1000)}s`);
await db.end();
