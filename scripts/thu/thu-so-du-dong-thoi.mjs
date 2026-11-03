// Dùng: PW=... node scripts/thu/thu-so-du-dong-thoi.mjs
// Hai giao dịch cùng ghi sổ cho MỘT thẻ: giao dịch sau phải CHỜ giao dịch trước (khoá thẻ trong the_so_du_tinh). Cả hai ROLLBACK — không để lại dữ liệu.
import { ketNoi } from "../chuyen-salonhero/lib.mjs";
const a = await ketNoi(), b = await ketNoi();
try {
  const the = (await a.query(`select id from public.the_khach where loai='lan' limit 1`)).rows[0].id;
  const sql = `insert into public.the_so_cai (the_id, loai, so_buoi, so_tien, ghi_chu) values ($1, 'dieu_chinh', 0, 0, '[THỬ] đồng thời')`;
  await a.query("begin"); await b.query("begin");
  await b.query("set local lock_timeout = '3s'");
  await a.query(sql, [the]);
  const t = Date.now();
  const kq = await b.query(sql, [the]).then(() => "B chạy xong KHÔNG chờ (SAI)", (e) => `B bị chặn chờ A (đúng): ${e.message} sau ${Date.now() - t} ms`);
  console.log(kq);
} finally { await a.query("rollback").catch(() => {}); await b.query("rollback").catch(() => {}); await a.end(); await b.end(); }
