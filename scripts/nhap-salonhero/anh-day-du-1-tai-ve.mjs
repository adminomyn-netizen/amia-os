// BƯỚC 1/2 chuyển TOÀN BỘ ảnh cũ SalonHero: tải từ CDN, xoay đúng chiều, thu nhỏ cạnh dài 1200 px (JPEG q78) rồi LƯU RA Ổ ĐĨA.
// Chưa đụng tới kho Supabase, nên chạy được khi chưa có chỗ chứa. Chạy lại an toàn: tệp đã có thì bỏ qua; dừng giữa chừng chạy tiếp được.
// Dùng: node scripts/nhap-salonhero/anh-day-du-1-tai-ve.mjs [--thu-muc ~/amia-anh-tam] [--song-song 6] [--gioi-han 100]
// Ảnh lỗi (CDN 403/404/hỏng) ghi vào <thu-muc>/loi.jsonl để xem lại; không dừng cả tiến trình.
import sharp from "sharp";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = (arg("--thu-muc", join(homedir(), "amia-anh-tam"))).replace(/^~/, homedir());
const songSong = Number(arg("--song-song", 6)), gioiHan = Number(arg("--gioi-han", Infinity));
const cdn = (u) => "https://salonhero-wasabi.becdn.net/" + u.split("/PROD/")[1];
const vnNgay = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);

// [sh_khach_id, sh_anh_id, url, createdAt, is_deleted, nguoi_tao, ghi_chu]
const ds = JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8")).filter((a) => !a[4] && a[3]);
const duong = (a) => join(thuMuc, String(a[0]), vnNgay(a[3]), `sh-${a[1]}.jpg`);
const chuaCo = ds.filter((a) => !existsSync(duong(a)));
const viec = chuaCo.slice(0, gioiHan);
mkdirSync(thuMuc, { recursive: true });
console.log(`Tổng ${ds.length} ảnh, đã có ở ổ đĩa ${ds.length - chuaCo.length}, lượt này tải ${viec.length}`);

let xong = 0, loi = 0, byte = 0, i = 0;
const t0 = Date.now();
async function chay() {
  while (i < viec.length) {
    const a = viec[i++];
    try {
      let buf;
      for (let lan = 0; lan < 3 && !buf; lan++) {
        const r = await fetch(cdn(a[2]), { signal: AbortSignal.timeout(60_000) }).catch(() => null);
        if (r?.ok) buf = Buffer.from(await r.arrayBuffer());
        else if (r && (r.status === 403 || r.status === 404)) throw new Error("CDN " + r.status);
        else await new Promise((x) => setTimeout(x, 1500 * (lan + 1)));
      }
      if (!buf) throw new Error("CDN không trả ảnh");
      const nho = await sharp(buf).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      const d = duong(a); mkdirSync(dirname(d), { recursive: true });
      writeFileSync(d + ".tmp", nho); renameSync(d + ".tmp", d); // ghi xong mới đổi tên: không để lại tệp dở
      xong++; byte += nho.length;
    } catch (e) { loi++; appendFileSync(join(thuMuc, "loi.jsonl"), JSON.stringify({ khach: a[0], anh: a[1], url: a[2], loi: String(e.message ?? e) }) + "\n"); }
    const n = xong + loi;
    if (n % 500 === 0) console.log(`${n}/${viec.length} · ${(byte / 1e9).toFixed(2)} GB · lỗi ${loi} · ${Math.round((Date.now() - t0) / 60000)} phút · còn ~${Math.round(((Date.now() - t0) / n) * (viec.length - n) / 60000)} phút`);
  }
}
await Promise.all(Array.from({ length: songSong }, chay));
console.log(`XONG BƯỚC 1: ${xong} ảnh mới (${(byte / 1e9).toFixed(2)} GB), lỗi ${loi}, ${Math.round((Date.now() - t0) / 60000)} phút`);
