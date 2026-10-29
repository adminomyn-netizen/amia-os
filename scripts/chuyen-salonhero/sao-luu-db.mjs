// Sao lưu LOGIC toàn bộ dữ liệu bảng public của DB thật (mọi bảng, mọi dòng) ra thư mục sao-luu/db-<giờ>/ — mỗi bảng 1 tệp NDJSON nén gzip + manifest (số dòng từng bảng, SHA-256).
// Không có pg_dump trên máy này và gói Supabase hiện tại không có sao lưu tự động, nên đây là bản sao lưu bắt buộc TRƯỚC MỖI đợt đổ dữ liệu.
// Chỉ ĐỌC (giao dịch read only). Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/sao-luu-db.mjs [nhãn]
// Khôi phục 1 bảng: đọc lại NDJSON và insert (cấu trúc bảng nằm trong supabase/migrations). Thư mục sao-luu/ nằm trong .gitignore (có dữ liệu khách).
import pg from "pg";
import { createGzip } from "node:zlib";
import { createWriteStream, mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// LUẬT 29/10/2026 (chị Lâm, giữ gói Supabase Free; egress 14/5GB do ~47 bản sao lưu toàn DB): sao lưu TOÀN DB chỉ chạy 23:00–05:00 (giờ VN) và TỐI ĐA 1 bản/đêm,
// chỉ khi có nạp/migration trong đêm đó. Ban ngày chỉ được sao lưu MỘT SỐ bảng sẽ đổi: --bang=ten1,ten2 (≤ 8 bảng). Mỗi bản toàn DB đọc ~0,3GB ra khỏi Supabase.
const dayDu = !process.argv.some((a) => a.startsWith("--bang="));
const dsBang = (process.argv.find((a) => a.startsWith("--bang=")) ?? "").slice(7).split(",").map((x) => x.trim()).filter(Boolean);
const doiSo = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const gioVN = new Date(Date.now() + 7 * 3600e3);
const gio = gioVN.getUTCHours();
if (dayDu) {
  if (gio >= 5 && gio < 23) { console.error("TỪ CHỐI: không sao lưu TOÀN DB ban ngày (luật 29/10, tiết kiệm egress). Chạy 23:00–05:00, hoặc dùng --bang=bang1,bang2 cho vài bảng sắp đổi."); process.exit(2); }
  const dau = new Date(gioVN.getTime()); if (gio < 5) dau.setUTCDate(dau.getUTCDate() - 1); dau.setUTCHours(23, 0, 0, 0);
  const moc = dau.toISOString().slice(0, 10).replace(/-/g, "");
  const { readdirSync } = await import("node:fs");
  const daCo = readdirSync("sao-luu").filter((d) => d.startsWith("db-") && d.slice(3, 11) >= moc && !/-bang-/.test(d)).filter((d) => { const t = d.slice(3, 15); return t >= moc + (gio < 5 ? "2300" : "2300"); });
  if (daCo.length) { console.error(`TỪ CHỐI: đêm nay đã có bản sao lưu toàn DB (${daCo[0]}); tối đa 1 bản/đêm.`); process.exit(2); }
} else if (dsBang.length === 0 || dsBang.length > 8) { console.error("TỪ CHỐI: --bang cần 1–8 tên bảng."); process.exit(2); }
const nhan = (dayDu ? "" : "bang-") + (doiSo[0] ?? "thu");
const luc = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1-$2");
const thuMuc = `sao-luu/db-${luc}-${nhan}`;
mkdirSync(thuMuc, { recursive: true });
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query("begin read only isolation level repeatable read");
const bang = (await db.query(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by 1`)).rows.map((r) => r.relname).filter((b) => dayDu || dsBang.includes(b));
if (!dayDu && bang.length !== dsBang.length) { console.error(`TỪ CHỐI: có bảng không tồn tại trong public: ${dsBang.filter((x) => !bang.includes(x)).join(", ")}`); process.exit(2); }
const manifest = { luc: new Date().toISOString(), nhan, bang: {} };
for (const b of bang) {
  const f = `${thuMuc}/${b}.ndjson.gz`;
  let n = 0;
  async function* dong() {
    for (let off = 0; ; off += 2000) {
      const r = await db.query(`select row_to_json(t) j from (select * from public."${b}" order by 1 limit 2000 offset ${off}) t`);
      for (const x of r.rows) { n++; yield JSON.stringify(x.j) + "\n"; }
      if (r.rows.length < 2000) break;
    }
  }
  await pipeline(Readable.from(dong()), createGzip(), createWriteStream(f));
  const sha = createHash("sha256").update(readFileSync(f)).digest("hex");
  manifest.bang[b] = { dong: n, byte: statSync(f).size, sha256: sha };
}
// Tài khoản đăng nhập (auth.users) KHÔNG nằm trong schema public nên xuất riêng 1 tệp: id, email, vai trò, liên kết nhân viên. KHÔNG lấy mật khẩu/băm mật khẩu. Không in nội dung ra màn hình.
const tk = (await db.query(`select u.id, u.email, u.role, u.created_at, u.last_sign_in_at, u.banned_until, nv.id as nhan_vien_id, nv.ho_ten as nhan_vien_ten, nv.vai_tro as nhan_vien_vai_tro, nv.hoat_dong as nhan_vien_hoat_dong
  from auth.users u left join public.nhan_vien nv on nv.user_id = u.id order by u.created_at`)).rows;
writeFileSync(`${thuMuc}/_tai-khoan-dang-nhap.json`, JSON.stringify({ luc: manifest.luc, so_tai_khoan: tk.length, tai_khoan: tk }, null, 1));
manifest.tai_khoan_dang_nhap = tk.length;
const dem = (await db.query(`select (select count(*) from public.khach_hang)::int khach, (select count(*) from public.hoa_don)::int hoa_don, (select count(*) from public.lich_hen)::int lich_hen, (select count(*) from public.the_khach)::int the`)).rows[0];
manifest.doi_chieu_nhanh = dem;
await db.query("rollback"); await db.end();
writeFileSync(`${thuMuc}/_manifest.json`, JSON.stringify(manifest, null, 1));
const tong = Object.values(manifest.bang).reduce((s, x) => s + x.dong, 0);
console.log(`ĐÃ SAO LƯU ${bang.length} bảng, ${tong} dòng → ${thuMuc} (${manifest.luc})`);
