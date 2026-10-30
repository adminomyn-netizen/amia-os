// BƯỚC 1d — GÓI THẺ CŨ chỉ còn trong thẻ khách đã hết buổi (chị Lâm 30/10/2026: "bù 113 thẻ đã hết buổi").
// Dựng gói (không hoạt động, không bán nữa) từ chính thẻ khách, cùng quy ước với nhap.mjs: ma SH<id>, loại USING = lần, còn lại = tiền. Sau đó chạy lại buoc1b-the-het.mjs để nạp thẻ.
// Mặc định CHẠY THỬ (rollback); --that mới ghi. Dùng: PW=… node scripts/chuyen-salonhero/buoc1d-goi-the-cu.mjs <thư-mục-xuất> [--that]
import { ketNoi, docNdjson, sach } from "./lib.mjs";
const thuMuc = process.argv[2], that = process.argv.includes("--that");
if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất");
const db = await ketNoi(); const q = async (s, p) => (await db.query(s, p)).rows;
try {
  await db.query("begin");
  const co = new Set((await q(`select sh_id from public.goi_the where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const maDaCo = new Set((await q(`select ma from public.goi_the`)).map((r) => r.ma));
  const moi = new Map();
  for (const tep of ["the.ndjson", "the_het.ndjson"]) for await (const c of docNdjson(`${thuMuc}/${tep}`)) {
    const x = c.l ?? c; const id = Number(x.card_id); if (!id || co.has(id) || moi.has(id)) continue;
    const lan = x.card_type === "USING";
    moi.set(id, { sh_id: id, ten: sach(x.card_name) || `Thẻ SalonHero ${id}`, loai: lan ? "lan" : "tien", gia: Math.max(0, Math.round(Number(x.card_sale_price) || 0)),
      so_buoi: lan ? Math.max(1, Math.round(Number(x.use_limit) || 1)) : null, gia_tri_the: lan ? null : Math.max(1, Math.round(Number(x.card_default_account_balance) || Number(x.account_balance) || Number(x.card_sale_price) || 1)) });
  }
  const goi = [...moi.values()].map((g) => { let ma = `SH${g.sh_id}`; if (maDaCo.has(ma)) ma = `${ma}-${g.sh_id}`; maDaCo.add(ma); return { ...g, ma }; });
  const them = (await q(`insert into public.goi_the (sh_id, ma, ten, loai, gia, so_buoi, gia_tri_the, hoat_dong)
    select x.sh_id, x.ma, x.ten, x.loai, x.gia, x.so_buoi, x.gia_tri_the, false from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, ten text, loai text, gia bigint, so_buoi int, gia_tri_the bigint)
    on conflict (sh_id) do nothing returning 1`, [JSON.stringify(goi)])).length;
  console.log(JSON.stringify({ that, goi_thieu_tim_thay: moi.size, goi_them: them }));
  if (!that) { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); } else { await db.query("commit"); console.log("ĐÃ GHI THẬT (commit)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
finally { await db.end(); }
