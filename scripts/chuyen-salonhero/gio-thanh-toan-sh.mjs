// Nạp bảng tra GIỜ THU của tiền khách trả từ SalonHero (migration 0251) — chỉ đọc tệp getCashBook đã kéo về, chỉ ghi bảng tra sh_gio_thanh_toan.
// Dòng "order_…" của getCashBook = một lần khách trả tiền: order_code (mã HĐ SalonHero), amount, createdAt (giờ thu thật), __at CASH/BANK.
// Báo cáo "Các lần trả nợ" tra giờ theo (mã HĐ SalonHero, ngày, số tiền, quỹ). Không đụng thanh_toan/so_quy.
// Dùng: PW=… node scripts/chuyen-salonhero/gio-thanh-toan-sh.mjs --tep sao-luu/salonhero-so-quy-getCashBook-YYYYMMDD.ndjson
import { ketNoi, docHet, vnNgay, theoLo } from "./lib.mjs";

const i = process.argv.indexOf("--tep");
const tep = i > 0 ? process.argv[i + 1] : null;
if (!tep) throw new Error("Thiếu --tep <tệp ndjson getCashBook>");
const dong = (await docHet(tep))
  .filter((r) => String(r.id).startsWith("order") && !r.is_deleted && r.order_code && r.createdAt && Number(r.amount) > 0)
  .map((r) => ({ ma_hd: String(r.order_code).trim(), ngay: vnNgay(r.createdAt), so_tien: Math.round(Number(r.amount)), quy: (r.__at ?? r.payment_type) === "CASH" ? "tien_mat" : "ngan_hang", thu_luc: r.createdAt }));
const db = await ketNoi();
let n = 0;
try {
  await theoLo(dong, 2000, async (l) => {
    n += (await db.query(`insert into public.sh_gio_thanh_toan (ma_hd, ngay, so_tien, quy, thu_luc)
      select x.ma_hd, x.ngay, x.so_tien, x.quy, x.thu_luc from jsonb_to_recordset($1::jsonb) as x(ma_hd text, ngay date, so_tien bigint, quy text, thu_luc timestamptz)
      on conflict do nothing`, [JSON.stringify(l)])).rowCount;
  });
  console.log(`Đọc ${dong.length} dòng tiền khách trả, ghi mới ${n} dòng vào sh_gio_thanh_toan.`);
} finally { await db.end(); }
