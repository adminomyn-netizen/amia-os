// Bù liên kết gói thẻ ↔ dịch vụ (goi_the_dich_vu) cho gói liệu trình (thẻ lần) CHƯA gắn dịch vụ nào (chị Lâm 11/11/2026:
// "chọn mà nó không tự động ra dịch vụ"). CHỈ thêm dòng goi_the_dich_vu, không đụng thẻ / buổi / tiền.
//   (1) Theo tên: tên gói (bỏ "Thẻ", "(10B)") trùng đúng tên một dịch vụ trong danh mục.
//   (2) Theo lịch sử: dòng hoá đơn SalonHero khi khách dùng thẻ của gói ghi tên một dịch vụ có trong danh mục,
//       dịch vụ đó là nhiều nhất và chiếm ≥ 50% số lần dùng (hoặc ≥ 10 lần).
// Gói vẫn không khớp: màn Đơn làm dịch vụ tự hiện chính thẻ thành một dòng tick (dịch vụ mang tên gói, xem src/lib/dich-vu-theo-the.ts).
// Chạy: PW=... node scripts/chuyen-salonhero/bu-goi-the-dich-vu.mjs [--chi-tiet] [--ghi]
// Trước --ghi: node scripts/chuyen-salonhero/sao-luu-db.mjs --bang=goi_the_dich_vu,goi_the <nhãn>
import { ketNoi } from "./lib.mjs";

const db = await ketNoi();
const q = async (s, p) => (await db.query(s, p)).rows;
const goc = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/đơi\b/g, "đời").replace(/^\s*thẻ\s+/, "").replace(/[.\s]+$/g, "").replace(/\s+/g, " ").trim();
/** Tên gói: bỏ thêm số buổi "(10B)" / "10B" (tên dịch vụ thì giữ, "Tạo hình viền trán 10B" khác "50B"). */
const chuanGoi = (s) => goc(String(s ?? "").normalize("NFC").replace(/\(\s*\d+\s*b\s*\)/gi, " ").replace(/\b\d+\s*b\b/gi, " "));
const dv = await q(`select id, ten, hoat_dong from public.dich_vu order by tao_luc`);
const dvTheoTen = new Map();
for (const d of dv) { const k = goc(d.ten); if (!dvTheoTen.has(k)) dvTheoTen.set(k, []); dvTheoTen.get(k).push(d); }
const goi = await q(`select g.id, g.ma, g.ten, (select count(*) from public.the_khach t where t.goi_id = g.id and t.trang_thai = 'hoat_dong')::int the_hd
  from public.goi_the g where g.loai = 'lan' and not exists (select 1 from public.goi_the_dich_vu x where x.goi_id = g.id)`);
const ls = await q(`select t.goi_id, d.ten, count(*)::int n from public.hoa_don_dong d join public.the_khach t on t.sh_id = d.the_khach_sh_id
  where d.loai = 'dich_vu' and t.goi_id = any($1::uuid[]) group by 1, 2`, [goi.map((g) => g.id)]);
const lsTheoGoi = new Map();
for (const r of ls) { if (!lsTheoGoi.has(r.goi_id)) lsTheoGoi.set(r.goi_id, []); lsTheoGoi.get(r.goi_id).push(r); }
const chon = (ds) => { const hd = ds.filter((d) => d.hoat_dong); return hd.length ? hd : ds; };
const ket = { ten: [], lich_su: [], khong: [] };
for (const g of goi) {
  const theoTen = dvTheoTen.get(chuanGoi(g.ten)) ?? dvTheoTen.get(goc(g.ten));
  if (theoTen) { ket.ten.push({ g, dvs: chon(theoTen) }); continue; }
  const dong = lsTheoGoi.get(g.id) ?? [], tong = dong.reduce((s, r) => s + r.n, 0);
  const ung = dong.map((r) => ({ ...r, dvs: dvTheoTen.get(goc(r.ten)) })).filter((r) => r.dvs).sort((a, b) => b.n - a.n);
  if (ung.length && (ung[0].n >= 10 || ung[0].n * 2 >= tong) && ung[0].n >= 3) { ket.lich_su.push({ g, dvs: chon(ung[0].dvs), n: ung[0].n, tong }); continue; }
  ket.khong.push({ g, ung: ung.map((u) => `${u.ten}:${u.n}/${tong}`) });
}
const tom = (a) => `${a.length} gói (${a.reduce((s, x) => s + x.g.the_hd, 0)} thẻ đang hoạt động)`;
console.log(`Gói liệu trình chưa gắn dịch vụ: ${goi.length}. Khớp theo tên: ${tom(ket.ten)}. Khớp theo lịch sử: ${tom(ket.lich_su)}. Vẫn chưa khớp: ${tom(ket.khong)}.`);
if (process.argv.includes("--chi-tiet")) {
  for (const x of ket.ten) console.log("TÊN     |", x.g.ten, "=>", x.dvs.map((d) => d.ten).join(" | "));
  for (const x of ket.lich_su) console.log("LỊCH SỬ |", x.g.ten, "=>", x.dvs.map((d) => d.ten).join(" | "), `(${x.n}/${x.tong} lần)`);
  for (const x of ket.khong.filter((x) => x.g.the_hd > 0).sort((a, b) => b.g.the_hd - a.g.the_hd)) console.log("CHƯA    |", x.g.ten, `(${x.g.the_hd} thẻ)`, x.ung.join(", "));
}
if (process.argv.includes("--ghi")) {
  const dong = [...ket.ten, ...ket.lich_su].flatMap((x) => x.dvs.map((d) => ({ goi_id: x.g.id, dich_vu_id: d.id })));
  // Chỉ gói vẫn còn trống lúc ghi (người dùng vừa gắn tay ở Danh mục thì không đè).
  const r = await q(`insert into public.goi_the_dich_vu (goi_id, dich_vu_id, la_tang) select x.goi_id, x.dich_vu_id, false from jsonb_to_recordset($1::jsonb) as x(goi_id uuid, dich_vu_id uuid)
    where not exists (select 1 from public.goi_the_dich_vu y where y.goi_id = x.goi_id) on conflict do nothing returning goi_id`, [JSON.stringify(dong)]);
  console.log(`ĐÃ GHI ${r.length} dòng goi_the_dich_vu cho ${new Set(r.map((x) => x.goi_id)).size} gói.`);
}
await db.end();
