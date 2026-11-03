// Dùng: PW=... node scripts/thu/do-trigger-so-du-lo.mjs [số dòng=1000]
// Đo tốc độ ghi lô sổ cái thẻ có/không trigger the_so_du — trong giao dịch rồi ROLLBACK (không để lại dữ liệu).
import { ketNoi } from "../chuyen-salonhero/lib.mjs";
const db = await ketNoi();
const N = +(process.argv[2] || 1000);
const sql = `insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, ghi_chu) select id, 'dieu_chinh', 0, 0, '[THỬ] đo tốc độ' from public.the_khach order by random() limit ${N}`;
try {
  for (const che of ["origin", "replica", "origin", "replica"]) {
    await db.query("begin");
    // replica = bỏ mọi trigger thường (gồm the_so_du) → mốc so sánh; origin = có trigger
    await db.query(`set local session_replication_role = ${che}`);
    const t = Date.now(); await db.query(sql); const ms = Date.now() - t;
    await db.query("rollback");
    console.log(che === "origin" ? "CÓ trigger  " : "KHÔNG trigger", N, "dòng:", ms, "ms");
  }
} finally { await db.end(); }
