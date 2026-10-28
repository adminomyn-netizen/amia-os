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

const nhan = process.argv[2] ?? "thu";
const luc = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1-$2");
const thuMuc = `sao-luu/db-${luc}-${nhan}`;
mkdirSync(thuMuc, { recursive: true });
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query("begin read only isolation level repeatable read");
const bang = (await db.query(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by 1`)).rows.map((r) => r.relname);
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
