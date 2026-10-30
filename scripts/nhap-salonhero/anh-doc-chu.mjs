// Đọc chữ trong ảnh khách cũ (phiếu, phác đồ, giấy ghi tay) bằng OCR Vision của macOS (công cụ ocr của Tula), lưu vào khach_anh.van_ban.
// Chỉ đọc ảnh còn van_ban_luc null; ảnh ít chữ (< 40 ký tự có nghĩa) thì chỉ đánh dấu đã quét. Chạy lại an toàn, dừng giữa chừng chạy tiếp được.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/nhap-salonhero/anh-doc-chu.mjs [--gioi-han 500] [--song-song 6] [--thu-muc ~/amia-anh-tam]
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";

const chay = promisify(execFile);
const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const gioiHan = Number(arg("--gioi-han", Infinity)), songSong = Number(arg("--song-song", 6));
const thuMuc = arg("--thu-muc", join(homedir(), "amia-anh-tam")).replace(/^~/, homedir());
const OCR = join(homedir(), ".config/ags/tula-tools/ocr");
const NGUONG = 40;
const db = await ketNoi();
const sh = new Map((await db.query(`select id, sh_id from public.khach_hang where sh_id is not null`)).rows.map((r) => [r.id, r.sh_id]));

let daDoc = 0, coChu = 0, loi = 0, khongTep = 0;
const t0 = Date.now();
while (daDoc < gioiHan) {
  const ds = (await db.query(`select id, khach_id, duong_dan from public.khach_anh where van_ban_luc is null and duong_dan like '%/sh-%' order by id limit $1`, [Math.min(600, gioiHan - daDoc)])).rows;
  if (!ds.length) break;
  const khongChu = [], coChuLo = [];
  let k = 0;
  const lam = async () => {
    while (k < ds.length) {
      const r = ds[k++];
      const m = /^[^/]+\/(\d{4}-\d\d-\d\d)\/(sh-\d+\.jpg)$/.exec(r.duong_dan);
      const tep = m && sh.has(r.khach_id) ? join(thuMuc, String(sh.get(r.khach_id)), m[1], m[2]) : null;
      if (!tep || !existsSync(tep)) { khongTep++; khongChu.push(r.id); continue; }
      try {
        const { stdout } = await chay(OCR, [tep], { timeout: 30_000, maxBuffer: 4 << 20 });
        const sach = stdout.split("\n").map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
        if (sach.replace(/[^\p{L}\p{N}]/gu, "").length >= NGUONG) coChuLo.push({ id: r.id, vanBan: sach.slice(0, 6000) }); else khongChu.push(r.id);
      } catch { loi++; khongChu.push(r.id); }
    }
  };
  await Promise.all(Array.from({ length: songSong }, lam));
  if (khongChu.length) await db.query(`update public.khach_anh set van_ban_luc = now() where id = any($1::uuid[])`, [khongChu]);
  if (coChuLo.length) await db.query(`update public.khach_anh a set van_ban = v.t, van_ban_luc = now() from unnest($1::uuid[], $2::text[]) as v(i, t) where a.id = v.i`, [coChuLo.map((x) => x.id), coChuLo.map((x) => x.vanBan)]);
  daDoc += ds.length; coChu += coChuLo.length;
  console.log(`${daDoc} ảnh · có chữ ${coChu} · không thấy tệp ${khongTep} · lỗi ${loi} · ${Math.round((Date.now() - t0) / 1000)}s`);
}
console.log(`XONG: quét ${daDoc} ảnh, có chữ ${coChu}, lỗi ${loi}`);
await db.end();
