// THỬ KHÔI PHỤC bản sao lưu (anh Nam yêu cầu 28/10): dựng PGlite giống DB thật (chạy migration đến mốc đã áp), nạp bản sao lưu, rồi so từng bảng:
//   (1) SHA-256 tệp .gz khớp manifest (tệp sao lưu không hỏng); (2) số dòng khớp; (3) mã băm nội dung từng dòng (không phụ thuộc thứ tự) khớp; (4) không có khoá ngoại mồ côi.
// Dùng: node scripts/chuyen-salonhero/thu-khoi-phuc.mjs sao-luu/db-<giờ>-<nhãn> [--den 0056]
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync, createReadStream, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
import { join } from "node:path";

const thuMuc = process.argv[2]; if (!thuMuc) throw new Error("Thiếu thư mục sao lưu");
const iDen = process.argv.indexOf("--den"); const den = iDen > 0 ? process.argv[iDen + 1] : "0056";
const manifest = JSON.parse(readFileSync(`${thuMuc}/_manifest.json`, "utf8"));

const chuanHoa = (v) => (Array.isArray(v) ? v.map(chuanHoa) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, chuanHoa(v[k])])) : v);
const bam = (obj) => createHash("sha256").update(JSON.stringify(chuanHoa(obj))).digest();
const cong = (acc, h) => (acc + h.readBigUInt64BE(0)) & 0xffffffffffffffffn; // tổng 64-bit: không phụ thuộc thứ tự dòng
async function* docGz(tep) { const rl = createInterface({ input: createReadStream(tep).pipe(createGunzip()), crlfDelay: Infinity }); for await (const l of rl) if (l) yield JSON.parse(l); }

// 1. Dựng DB
const db = new PGlite();
await db.exec(`set time zone 'UTC'`); // DB thật xuất JSON theo múi giờ UTC
await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create schema auth;
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role; grant execute on all functions in schema auth to anon, authenticated, service_role; grant usage on schema public to anon, authenticated, service_role;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;`);
const dirMig = join(process.cwd(), "supabase", "migrations");
for (const f of readdirSync(dirMig).filter((f) => f.endsWith(".sql")).sort()) {
  if (f.slice(0, 4) > den) break;
  await db.exec(readFileSync(join(dirMig, f), "utf8").replace(/create extension[^;]*;/gi, ""));
}
const bangDb = (await db.query(`select c.relname n from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname='public' and c.relkind='r' order by 1`)).rows.map((r) => r.n);
console.log(`Đã dựng PGlite với migration đến ${den}: ${bangDb.length} bảng; bản sao lưu có ${Object.keys(manifest.bang).length} bảng`);
const thieuTrongDb = Object.keys(manifest.bang).filter((b) => !bangDb.includes(b)), thieuTrongSaoLuu = bangDb.filter((b) => !(b in manifest.bang));

// 2. Nạp (tắt trigger/khoá ngoại khi nạp: session_replication_role = replica; kiểm khoá ngoại ở bước 4)
await db.exec(`set session_replication_role = replica`);
for (const b of bangDb) await db.exec(`truncate table public."${b}" cascade`);
const kq = [];
for (const [b, m] of Object.entries(manifest.bang)) {
  if (thieuTrongDb.includes(b)) { kq.push({ bang: b, ketqua: "KHÔNG CÓ BẢNG TRONG MIGRATION" }); continue; }
  const tep = `${thuMuc}/${b}.ndjson.gz`;
  const shaTep = createHash("sha256").update(readFileSync(tep)).digest("hex");
  const cot = (await db.query(`select column_name c from information_schema.columns where table_schema='public' and table_name=$1 and is_generated='NEVER' order by ordinal_position`, [b])).rows.map((r) => `"${r.c}"`).join(", ");
  let lo = [], n = 0, hGoc = 0n;
  const day = async () => { if (lo.length) { await db.query(`insert into public."${b}" (${cot}) overriding system value select ${cot} from json_populate_recordset(null::public."${b}", $1::json)`, [JSON.stringify(lo)]); lo = []; } };
  for await (const r of docGz(tep)) { n++; hGoc = cong(hGoc, bam(r)); lo.push(r); if (lo.length >= 1000) await day(); }
  await day();
  kq.push({ bang: b, shaTep, m });
  kq.at(-1).nGoc = n; kq.at(-1).hGoc = hGoc;
}

// 3. Đọc lại từ PGlite và so
const bao = [];
for (const k of kq) {
  if (k.ketqua) { bao.push({ bang: k.bang, dong_sao_luu: "-", dong_khoi_phuc: "-", sha_tep: "-", noi_dung: k.ketqua }); continue; }
  const dem = Number((await db.query(`select count(*)::int n from public."${k.bang}"`)).rows[0].n);
  let hKp = 0n;
  for (let off = 0; ; off += 5000) {
    const r = await db.query(`select row_to_json(t) j from (select * from public."${k.bang}" order by ctid limit 5000 offset ${off}) t`);
    for (const x of r.rows) hKp = cong(hKp, bam(x.j));
    if (r.rows.length < 5000) break;
  }
  let vd = null;
  if (process.env.CHI_TIET && !(k.m.dong === dem && k.nGoc === dem && k.hGoc === hKp)) {
    const goc = new Map(); for await (const r of docGz(`${thuMuc}/${k.bang}.ndjson.gz`)) goc.set(bam(r).toString("hex"), r);
    for (const x of (await db.query(`select row_to_json(t) j from public."${k.bang}" t limit 2000`)).rows) if (!goc.has(bam(x.j).toString("hex"))) { vd = x.j; break; }
    if (vd) { const g = [...goc.values()].find((r) => r.id === vd.id) ?? [...goc.values()][0]; console.log("VÍ DỤ LỆCH", k.bang, "\n khôi phục:", JSON.stringify(vd), "\n gốc     :", JSON.stringify(g)); }
  }
  bao.push({ bang: k.bang, dong_sao_luu: k.m.dong, dong_khoi_phuc: dem, sha_tep: k.shaTep === k.m.sha256 ? "KHỚP" : "LỆCH", noi_dung: k.m.dong === dem && k.nGoc === dem && k.hGoc === hKp ? "KHỚP" : "LỆCH" });
}

// 4. Khoá ngoại mồ côi (khoá 1 cột)
await db.exec(`set session_replication_role = origin`);
const fk = (await db.query(`select c.conrelid::regclass::text con, a.attname cc, c.confrelid::regclass::text cha, pa.attname pc
  from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1] join pg_attribute pa on pa.attrelid=c.confrelid and pa.attnum=c.confkey[1]
  where c.contype='f' and array_length(c.conkey,1)=1 and c.connamespace='public'::regnamespace`)).rows;
const moCoi = [];
for (const f of fk) { const n = Number((await db.query(`select count(*)::int n from ${f.con} c where c."${f.cc}" is not null and not exists (select 1 from ${f.cha} p where p."${f.pc}" = c."${f.cc}")`)).rows[0].n); if (n) moCoi.push({ ...f, n }); }

const tongDong = bao.reduce((s, r) => s + (Number(r.dong_khoi_phuc) || 0), 0);
const lech = bao.filter((r) => r.sha_tep !== "KHỚP" || r.noi_dung !== "KHỚP");
console.table(lech.length ? lech : [{ ket_qua: "mọi bảng KHỚP" }]);
const tom = { thu_muc: thuMuc, migration_den: den, bang_sao_luu: bao.length, tong_dong_khoi_phuc: tongDong, bang_lech: lech.length, bang_co_trong_db_thu_ma_sao_luu_khong_co: thieuTrongSaoLuu, bang_sao_luu_khong_co_trong_migration: thieuTrongDb, fk_mo_coi: moCoi.length, chi_tiet_fk_mo_coi: moCoi.slice(0, 10) };
console.log(JSON.stringify(tom, null, 1));
writeFileSync(`${thuMuc}/_thu-khoi-phuc.json`, JSON.stringify({ tom, bao }, null, 1));
process.exitCode = lech.length || moCoi.length ? 2 : 0;
