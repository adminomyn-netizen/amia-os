// BÙ NGÂN HÀNG NHẬN TIỀN cho thanh toán SalonHero đã nhập (thanh_toan.ngan_hang, migration 0179). Chị Dung (kế toán) 30/10/2026: lọc hoá đơn điện tử theo Techcombank / Vietcombank.
// Nguồn: bản xuất SalonHero (NDJSON {l, d}). Mỗi khoản thanh toán chuyển khoản / quẹt thẻ của hoá đơn có sh_id được ghép với lịch sử thanh toán gốc theo (phương thức, số tiền):
//   1) ngân hàng ghi ở chính khoản thu đó (d.paymentHistory.bank_name), 2) amount_paid_multi (hoá đơn MULTIPLE), 3) ngân hàng chung của hoá đơn TRANSFER/CARD (l.bank_name).
//   Cùng phương thức + số tiền mà hai ngân hàng khác nhau → để null (không đoán). Hoá đơn MULTIPLE không tách được → null, có đếm.
// Idempotent (chạy lại chỉ gán thêm dòng còn trống / dòng đổi). MẶC ĐỊNH CHẠY THỬ (giao dịch rồi rollback); --that mới ghi. thanh_toan là bảng chỉ-thêm (trigger chặn sửa), nên khi ghi
// phải tắt trigger trong CHÍNH giao dịch này (set local session_replication_role = replica) — chỉ cột ngan_hang bị sửa, kiểm lại ngay sau khi ghi.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/bu-ngan-hang-thanh-toan.mjs [--that] [--nguon <thư-mục>]...
//   (mặc định nguồn: sao-luu/salonhero-20261028-1753/{hoa_don,hoa_don_2026_10,hoa_don_bosung}.ndjson + sao-luu/dong-bo-*/hoa_don.ndjson, tệp sau đè tệp trước)
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ketNoi, docNdjson, theoLo, chuanBiNganHangSh, nganHangKhoan } from "./lib.mjs";

const that = process.argv.includes("--that");
const nguonTuy = process.argv.flatMap((a, i, m) => (a === "--nguon" ? [m[i + 1]] : []));
const GOC = "sao-luu";
const teps = nguonTuy.length ? nguonTuy : [
  ...["hoa_don.ndjson", "hoa_don_2026_10.ndjson", "hoa_don_bosung.ndjson"].map((t) => join(GOC, "salonhero-20261028-1753", t)),
  ...(existsSync(GOC) ? readdirSync(GOC).filter((t) => /^dong-bo-\d{8}-\d{4}$/.test(t)).sort().map((t) => join(GOC, t, "hoa_don.ndjson")) : []),
].filter(existsSync);
if (!teps.length) throw new Error("Không thấy tệp hoá đơn SalonHero nào");

// ── Nguồn: mỗi hoá đơn (theo id SalonHero) lấy bản mới nhất ──
const nguon = new Map();
for (const t of teps) { let n = 0; for await (const r of docNdjson(t)) { if (r?.l?.id == null) continue; nguon.set(Number(r.l.id), chuanBiNganHangSh(r)); n++; } console.log(`đọc ${t}: ${n} dòng`); }
console.log(`Hoá đơn SalonHero có trong nguồn: ${nguon.size}`);

const db = await ketNoi();
const q = async (sql, p) => (await db.query(sql, p)).rows;
const dem = (rows, cot) => Object.fromEntries(Object.entries(rows.reduce((m, r) => ((m[r[cot] ?? "(null)"] = (m[r[cot] ?? "(null)"] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]));
const chup = async () => ({
  pt: await q(`select phuong_thuc, count(*)::int tong, count(ngan_hang)::int co_ngan_hang from public.thanh_toan where loai='thu' group by 1 order by 1`),
  nh: await q(`select coalesce(ngan_hang,'(chưa rõ)') ngan_hang, count(*)::int so_khoan, sum(so_tien)::bigint tong_tien from public.thanh_toan where loai='thu' and phuong_thuc in ('chuyen_khoan','quet_the') group by 1 order by 2 desc`),
});

try {
  await db.query("begin");
  console.log("\n=== TRƯỚC ==="); const truoc = await chup(); console.table(truoc.pt); console.table(truoc.nh);
  const rows = await q(`select t.id, t.phuong_thuc, t.so_tien::bigint so_tien, t.ngan_hang, h.sh_id::bigint sh_id from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
                        where t.loai = 'thu' and t.phuong_thuc in ('chuyen_khoan','quet_the') and h.sh_id is not null`);
  const dat = [], nguonDem = [], khongCo = [];
  for (const r of rows) {
    const ch = nguon.get(Number(r.sh_id));
    if (!ch) { khongCo.push(r); nguonDem.push({ nguon: "hoá đơn không có trong tệp nguồn", pt: r.phuong_thuc }); continue; }
    const k = nganHangKhoan(ch, r.phuong_thuc, r.so_tien);
    nguonDem.push({ nguon: k.nguon + (k.nguon === "khong_ro" && ch.ptHd === "MULTIPLE" ? " (MULTIPLE)" : ""), pt: r.phuong_thuc, gan: k.ten ? "gán" : "để null" });
    if (k.ten && k.ten !== r.ngan_hang) dat.push({ id: r.id, nh: k.ten });
  }
  console.log(`\nKhoản chuyển khoản/quẹt thẻ của hoá đơn SalonHero trong DB: ${rows.length}`);
  console.log("Theo nguồn gán:"); console.table(dem(nguonDem, "nguon"));
  console.log("Gán được / để null:"); console.table(dem(nguonDem, "gan"));
  console.log(`Sẽ ghi (khoản mới gán hoặc đổi): ${dat.length}`);
  if (dat.length) {
    await db.query("set local session_replication_role = replica");
    let n = 0;
    await theoLo(dat, 2000, async (lo) => { n += (await q(`update public.thanh_toan t set ngan_hang = x.nh from jsonb_to_recordset($1::jsonb) as x(id uuid, nh text) where t.id = x.id returning 1`, [JSON.stringify(lo)])).length; });
    await db.query("set local session_replication_role = origin");
    console.log(`Đã cập nhật ${n} khoản`);
  }
  console.log("\n=== SAU ==="); const sau = await chup(); console.table(sau.pt); console.table(sau.nh);
  // Kiểm: tiền và số khoản không đổi; chỉ cột ngan_hang đổi
  const tongT = truoc.pt.reduce((s, x) => s + x.tong, 0), tongS = sau.pt.reduce((s, x) => s + x.tong, 0);
  const tienT = truoc.nh.reduce((s, x) => s + Number(x.tong_tien), 0), tienS = sau.nh.reduce((s, x) => s + Number(x.tong_tien), 0);
  if (tongT !== tongS || tienT !== tienS) throw new Error(`Đối chiếu lệch: số khoản ${tongT}→${tongS}, tiền ${tienT}→${tienS}`);
  console.log(`Đối chiếu OK: ${tongS} khoản, tổng tiền chuyển khoản + quẹt thẻ ${tienS} không đổi.`);
  await db.query(that ? "commit" : "rollback");
  console.log(that ? "\nĐÃ GHI (commit)." : "\nCHẠY THỬ: đã rollback, chưa ghi gì. Thêm --that để ghi.");
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI, đã rollback:", e.message); process.exitCode = 1; } finally { await db.end(); }
