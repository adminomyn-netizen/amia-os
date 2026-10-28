// Truy vấn CHỈ ĐỌC. Dùng: PW=... node scripts/chuyen-hr/doc-db.mjs "<sql>"
import pg from "pg";
const db = new pg.Client({ connectionString: `postgresql://postgres.odhbmsjfbfefczienpda:${encodeURIComponent(process.env.PW)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query("begin read only");
try { const r = await db.query(process.argv[2]); console.log(JSON.stringify(r.rows)); } catch (e) { console.error("LỖI", e.message); }
await db.query("rollback"); await db.end();
