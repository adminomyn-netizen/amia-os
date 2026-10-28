// Kiểm dung lượng DB + Storage Supabase so với giới hạn gói (mặc định giả định gói Free: DB 500 MB, Storage 1 GB — chưa xác nhận gói thật). Chạy TRƯỚC mỗi bước đổ dữ liệu. Chỉ đọc.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/kiem-dung-luong.mjs [them_MB_du_kien]
import pg from "pg";
const them = Number(process.argv[2] ?? 0);
const GH_DB = Number(process.env.GH_DB_MB ?? 500), GH_ST = Number(process.env.GH_ST_MB ?? 1024);
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect(); await db.query("begin read only");
const dbMB = Number((await db.query("select pg_database_size(current_database())::bigint b")).rows[0].b) / 1048576;
const st = (await db.query("select count(*)::int n, coalesce(sum((metadata->>'size')::bigint),0)::bigint b from storage.objects")).rows[0];
const top = (await db.query("select relname, pg_total_relation_size(c.oid)::bigint b, reltuples::bigint n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r' order by 2 desc limit 8")).rows;
await db.query("rollback"); await db.end();
const stMB = Number(st.b) / 1048576;
const ra = { luc: new Date().toISOString(), db_mb: +dbMB.toFixed(1), gioi_han_db_mb: GH_DB, db_phan_tram: +(100 * dbMB / GH_DB).toFixed(1), storage_mb: +stMB.toFixed(1), storage_doi_tuong: st.n, gioi_han_storage_mb: GH_ST, storage_phan_tram: +(100 * stMB / GH_ST).toFixed(1),
  sau_khi_them_mb: them ? +(dbMB + them).toFixed(1) : undefined, sau_khi_them_phan_tram: them ? +(100 * (dbMB + them) / GH_DB).toFixed(1) : undefined, bang_lon: top.map((t) => `${t.relname} ${(Number(t.b) / 1048576).toFixed(1)}MB`) };
console.log(JSON.stringify(ra));
if ((dbMB + them) / GH_DB > 0.8 || stMB / GH_ST > 0.8) { console.log("CẢNH BÁO: gần chạm giới hạn gói (>80%). Phần nặng (JSON gốc, tệp, ảnh) đẩy về Lark; chỉ dữ liệu dạng bảng vào DB."); process.exitCode = 2; }
