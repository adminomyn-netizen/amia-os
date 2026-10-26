// BƯỚC 3 chuyển TOÀN BỘ ảnh cũ SalonHero: đẩy ảnh đã thu nhỏ (bước 1, ở ổ đĩa) lên Base Lark "AMIA - Kho ảnh khách".
// Mỗi dòng Lark = 50 ảnh liền nhau của MỘT khách (xếp theo ngày chụp), nén thành MỘT tệp .zip (không nén lại, ảnh đã là JPEG) trong ô "Ảnh";
// bên trong tên tệp "<ngày>_sh-<mã ảnh>.jpg". Đo thật: tải từng ảnh lên Lark ~1,1–1,8 giây/ảnh và KHÔNG tăng khi chạy song song (≈1 ảnh/giây → 3 ngày);
// gói 50 ảnh thành 1 tệp mất 3,5 giây (nhanh gấp 16 lần) → vài giờ. Đổi lại ảnh trong Lark nằm trong tệp nén, xem qua ứng dụng AMIA OS.
// Chỉ đẩy mã khách, khoảng ngày, số ảnh; KHÔNG đẩy tên, SĐT. Mỗi bảng ≤ 10.500 dòng (trần số dòng của Lark chưa rõ).
// Sổ ghi dòng/mã tệp: <thu-muc>/lark-so.jsonl → chạy lại an toàn (ảnh đã có mã tệp thì bỏ qua), dừng giữa chừng chạy tiếp được.
// Chỉ đẩy dòng đã tải đủ ở bước 1 (bước 1 có thể còn đang chạy); dòng chưa đủ để vòng sau.
// Dùng: node scripts/nhap-salonhero/anh-day-du-3-day-len-lark.mjs [--thu-muc ~/amia-anh-tam] [--song-song 6] [--gioi-han-dong 100]
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const chay = promisify(execFile);
const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = arg("--thu-muc", join(homedir(), "amia-anh-tam")).replace(/^~/, homedir());
const songSong = Number(arg("--song-song", 6)), gioiHanDong = Number(arg("--gioi-han-dong", Infinity));
const LARK = process.env.LARK_CLI ?? "/Users/phamtunglam/.local/bin/lark-cli2";
const BASE = "HqZobkuRNa0giLsmaxwj64lFpCc";
const BANG = JSON.parse(readFileSync(join(thuMuc, "lark-bang.json"), "utf8")); // ["tbl…", …] theo thứ tự bảng 1, 2, …
const DONG_MOT_BANG = 10_500, ANH_MOT_DONG = 50;
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const vnNgay = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
const doc = async (bang, cot, loc) => { const ra = []; for (let i = 0; ; i += 1000) { const { data, error } = await loc(sb.from(bang).select(cot).range(i, i + 999)); if (error) throw error; ra.push(...data); if (data.length < 1000) return ra; } };
const ngu = (ms) => new Promise((x) => setTimeout(x, ms));

// ── Dữ liệu nguồn ──
const khach = new Map((await doc("khach_hang", "ma, sh_id", (q) => q.not("sh_id", "is", null))).map((k) => [Number(k.sh_id), k.ma]));
// Ảnh đã nằm VĨNH VIỄN trong kho AMIA OS (mỗi khách 1 ảnh đầu tiên) → không đẩy lại. Ảnh lấy tạm từ kho Lark về xem (het_han có giá trị) không tính.
const daTrongKho = new Set((await doc("khach_anh", "duong_dan", (q) => q.like("duong_dan", "%/sh-%").is("het_han", null))).map((r) => Number(/sh-(\d+)\.jpg$/.exec(r.duong_dan)?.[1])));
const ds = JSON.parse(readFileSync("sao-luu/salonhero/anh.json", "utf8")).filter((a) => !a[4] && a[3] && khach.has(a[0]) && !daTrongKho.has(a[1]));
const loiTai = new Set(existsSync(join(thuMuc, "loi.jsonl")) ? readFileSync(join(thuMuc, "loi.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).anh) : []);

// ── Chia dòng: thứ tự cố định (mã khách tăng dần, ngày, mã ảnh) để một ảnh luôn thuộc đúng một dòng giữa các lần chạy ──
const theoKhach = new Map();
for (const a of ds) { if (!theoKhach.has(a[0])) theoKhach.set(a[0], []); theoKhach.get(a[0]).push({ id: a[1], ngay: vnNgay(a[3]) }); }
const dong = [];
for (const sh of [...theoKhach.keys()].sort((x, y) => x - y)) {
  const arr = theoKhach.get(sh).sort((x, y) => x.ngay.localeCompare(y.ngay) || x.id - y.id);
  for (let p = 0; p * ANH_MOT_DONG < arr.length; p++) { const f = arr.slice(p * ANH_MOT_DONG, (p + 1) * ANH_MOT_DONG); dong.push({ ma: `SH${sh}|${p + 1}`, sh, f, tu: f[0].ngay, den: f.at(-1).ngay }); }
}
dong.forEach((d, i) => { d.bang = Math.floor(i / DONG_MOT_BANG); });
console.log(`Ảnh cần đẩy ${ds.length} (đã trong kho ${daTrongKho.size}), ${dong.length} dòng Lark, ${Math.ceil(dong.length / DONG_MOT_BANG)} bảng (có sẵn ${BANG.length})`);

// ── Sổ ghi ──
const SO = join(thuMuc, "lark-so.jsonl");
const rec = new Map(), token = new Map();
if (existsSync(SO)) for (const l of readFileSync(SO, "utf8").split("\n").filter(Boolean)) { const j = JSON.parse(l); if (j.t === "rec") rec.set(j.ma, { rec: j.rec, bang: j.bang ?? 0 }); else if (j.t === "zip") for (const id of j.anh) token.set(id, j.token); else token.set(j.anh, j.token); }
const ghi = (o) => appendFileSync(SO, JSON.stringify(o) + "\n");
const nguon = (d, f) => join(thuMuc, String(d.sh), f.ngay, `sh-${f.id}.jpg`);

const conLai = (d) => d.f.filter((f) => !token.has(f.id) && existsSync(nguon(d, f)));
const daTaiDu = (d) => d.f.every((f) => token.has(f.id) || existsSync(nguon(d, f)) || loiTai.has(f.id));
const viec = dong.filter((d) => d.bang < BANG.length && conLai(d).length > 0 && daTaiDu(d)).slice(0, gioiHanDong);
console.log(`Lượt này đẩy ${viec.length} dòng`);

const lark = async (cwd, ...a) => {
  for (let lan = 0; ; lan++) {
    try {
      const { stdout } = await chay(LARK, ["base", ...a, "--as", "user", "--base-token", BASE], { cwd, maxBuffer: 20 * 1024 * 1024, timeout: 600_000 });
      const j = JSON.parse(stdout.slice(stdout.indexOf("{")));
      if (!j.ok) throw new Error(j.error?.message ?? "Lark báo lỗi");
      return j.data;
    } catch (e) {
      const m = String(e.stderr || e.message || e);
      if (lan >= 4) throw new Error(m.slice(0, 300));
      await ngu(/429|frequen|rate|too many|limit/i.test(m) ? 30_000 * (lan + 1) : 3_000 * (lan + 1)); // bị giới hạn tốc độ thì lùi lâu hơn
    }
  }
};

let xongDong = 0, xongAnh = 0, loi = 0, i = 0, byte = 0;
const t0 = Date.now();
async function lam() {
  while (i < viec.length) {
    const d = viec[i++];
    const tam = join(thuMuc, "_lark", d.ma.replace(/\W+/g, "_"));
    try {
      let r = rec.get(d.ma);
      if (!r) {
        const x = await lark(thuMuc, "+record-batch-create", "--table-id", BANG[d.bang], "--json", JSON.stringify({ create_records: [{ "Mã nhóm": d.ma, "Mã khách": khach.get(d.sh), "Ngày chụp": `${d.tu} 00:00`, "Số ảnh": d.f.length, "Ghi chú": d.tu === d.den ? d.tu : `${d.tu} → ${d.den}` }] }));
        r = { rec: x.record_id_list[0], bang: d.bang }; rec.set(d.ma, r); ghi({ t: "rec", ma: d.ma, rec: r.rec, bang: d.bang });
      }
      const can = conLai(d);
      if (!can.length) continue;
      // Lark CLI chỉ nhận đường dẫn tương đối trong thư mục đang chạy → chép ảnh vào thư mục tạm (tên có ngày), nén 1 tệp rồi tải lên.
      rmSync(tam, { recursive: true, force: true }); mkdirSync(tam, { recursive: true });
      const tenAnh = can.map((f) => { const ten = `${f.ngay}_sh-${f.id}.jpg`; copyFileSync(nguon(d, f), join(tam, ten)); return ten; });
      const tenZip = `${d.ma.replace(/\W+/g, "_")}${can.length < d.f.length ? "_con_lai" : ""}.zip`;
      await chay("zip", ["-q", "-0", tenZip, ...tenAnh], { cwd: tam, maxBuffer: 20 * 1024 * 1024 });
      const up = await lark(tam, "+record-upload-attachment", "--table-id", BANG[r.bang], "--record-id", r.rec, "--field-id", "Ảnh", "--file", tenZip);
      const ra = Object.values(Object.values(up.attachments ?? {})[0] ?? {})[0] ?? [];
      const z = ra.find((x) => x.name === tenZip);
      if (!z?.file_token) throw new Error("Lark không trả mã tệp nén");
      ghi({ t: "zip", ma: d.ma, ten: tenZip, token: z.file_token, anh: can.map((f) => f.id) });
      for (const f of can) token.set(f.id, z.file_token);
      xongAnh += can.length; byte += z.size ?? 0;
      xongDong++;
    } catch (e) { loi++; console.error(`lỗi ${d.ma}:`, String(e.message).slice(0, 200)); }
    finally { rmSync(tam, { recursive: true, force: true }); }
    if ((xongDong + 1) % 5 === 0) console.log(`${xongDong}/${viec.length} dòng · ${xongAnh} ảnh · ${(byte / 1e6).toFixed(0)} MB · lỗi ${loi} · ${Math.round((Date.now() - t0) / 60000)} phút`);
  }
}
await Promise.all(Array.from({ length: songSong }, lam));
console.log(`XONG LƯỢT: ${xongDong} dòng, ${xongAnh} ảnh (${(byte / 1e6).toFixed(0)} MB), lỗi ${loi}, ${Math.round((Date.now() - t0) / 60000)} phút`);
