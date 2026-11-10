// NẠP TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN từ SalonHero + BÙ thanh_toan.tai_khoan_id cho khoản thu SalonHero cũ (migration 0323). Chị Lâm 10/11/2026.
// Nguồn:
//   --sh <tệp.json>  : danh sách tài khoản ĐANG DÙNG ở SalonHero (#/bankInfoSetting, lấy bằng ABA từ scope Angular bankAcountList: id, so, chu, ngan_hang, the, ck).
//                      Tệp có số tài khoản → để ở scratchpad (chmod 700), KHÔNG để trong repo, xoá sau khi nạp.
//   bản xuất hoá đơn SalonHero (NDJSON {l, d}, như bu-ngan-hang-thanh-toan.mjs): tài khoản từng khoản thu (paymentHistory/amount_paid_multi/hoá đơn TRANSFER|CARD).
// Việc làm (một giao dịch):
//   1) Tài khoản đang dùng ở SalonHero → tai_khoan_ngan_hang (hoat_dong = true). Trùng số đã có thì cập nhật; dòng mẫu trống của 0183 (OCB/Techcombank/Vietcombank, số '')
//      được điền nếu SalonHero chỉ có MỘT tài khoản của ngân hàng đó (giữ ghi chú); dòng mẫu trống còn lại không khoản thu nào trỏ tới thì xoá.
//      Tài khoản có chữ "ĐÀ LẠT" ở chủ tài khoản gắn chi nhánh Đà Lạt (Thu ngân Vinh không thấy).
//   2) Tài khoản chỉ còn trong lịch sử thanh toán (đã xoá ở SalonHero) → thêm, ẨN (hoat_dong = false): không hiện ở ô chọn, chỉ để tra khoản thu cũ.
//   3) Bù thanh_toan.tai_khoan_id cho khoản thu chuyển khoản / quẹt thẻ của hoá đơn SalonHero: khớp (phương thức, số tiền) như bu-ngan-hang-thanh-toan.mjs; mơ hồ thì để null.
//      thanh_toan là bảng chỉ-thêm (trigger chặn sửa) → tắt trigger trong CHÍNH giao dịch (session_replication_role = replica), chỉ cột tai_khoan_id đổi, đối chiếu ngay.
// Không in số tài khoản (chỉ 3 số cuối). MẶC ĐỊNH CHẠY THỬ (rollback); --that mới ghi. Idempotent. Sao lưu trước: sao-luu-db.mjs <nhãn> --bang=tai_khoan_ngan_hang,thanh_toan
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/nap-tai-khoan-ngan-hang.mjs --sh <tệp.json> [--that] [--nguon <ndjson>]...
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ketNoi, docNdjson, theoLo, chuanBiTaiKhoanSh, nganHangKhoan, khoaTaiKhoan, chuanTenNganHang, sach } from "./lib.mjs";

const that = process.argv.includes("--that");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const nguonTuy = process.argv.flatMap((a, i, m) => (a === "--nguon" ? [m[i + 1]] : []));
const tepSh = arg("--sh");
if (!tepSh || !existsSync(tepSh)) throw new Error("Thiếu --sh <tệp danh sách tài khoản SalonHero>");
const GOC = "sao-luu";
const teps = nguonTuy.length ? nguonTuy : [
  ...["hoa_don.ndjson", "hoa_don_2026_10.ndjson", "hoa_don_bosung.ndjson"].map((t) => join(GOC, "salonhero-20261028-1753", t)),
  ...(existsSync(GOC) ? readdirSync(GOC).filter((t) => /^dong-bo-\d{8}-\d{4}(-\d+)?$/.test(t)).sort().map((t) => join(GOC, t, "hoa_don.ndjson")) : []),
].filter(existsSync);
const che = (s) => `…${String(s).slice(-3)}`;
const soCua = (khoa) => khoa.split("#")[1];

// ── Nguồn 1: tài khoản đang dùng ──
const dangDung = JSON.parse(readFileSync(tepSh, "utf8")).filter((x) => !x.xoa).map((x) => ({
  sh_id: x.id, so: String(x.so ?? "").replace(/\D/g, ""), chu: sach(x.chu ?? ""), ngan_hang: sach(x.ngan_hang ?? ""), the: !!x.the, ck: !!x.ck, mac_dinh: !!x.mac_dinh,
})).filter((x) => x.so && x.ngan_hang);
for (const x of dangDung) x.khoa = khoaTaiKhoan(x.ngan_hang, x.so);
console.log(`Tài khoản đang dùng ở SalonHero: ${dangDung.length}`);

// ── Nguồn 2: hoá đơn SalonHero (bản mới nhất mỗi hoá đơn) + mọi tài khoản từng xuất hiện ──
const nguon = new Map(); const lichSu = new Map(); // khoa → { ngan_hang: Map<tên gốc, n>, chu: Map<chủ, n>, n }
const ghiLs = (bank, so, chu) => {
  const k = khoaTaiKhoan(bank, so); if (!k) return;
  const o = lichSu.get(k) ?? lichSu.set(k, { ngan_hang: new Map(), chu: new Map(), n: 0 }).get(k);
  o.n++; const b = sach(bank ?? ""), c = sach(chu ?? "");
  if (b) o.ngan_hang.set(b, (o.ngan_hang.get(b) ?? 0) + 1); if (c) o.chu.set(c, (o.chu.get(c) ?? 0) + 1);
};
for (const t of teps) {
  let n = 0;
  for await (const r of docNdjson(t)) {
    if (r?.l?.id == null) continue;
    nguon.set(Number(r.l.id), chuanBiTaiKhoanSh(r)); n++;
    const d = r.d ?? {}, l = r.l ?? {};
    for (const x of d.paymentHistory ?? []) if (!x.is_deleted) ghiLs(x.bank_name, x.account_number, x.account_owner);
    let m = []; try { m = JSON.parse(l.amount_paid_multi ?? d.amount_paid_multi ?? "[]"); } catch { m = []; }
    for (const x of Array.isArray(m) ? m : []) ghiLs(x?.bank_name, x?.account_number, x?.account_owner);
    ghiLs(l.bank_name ?? d.bank_name, l.account_number ?? d.account_number, l.account_owner ?? d.account_owner);
  }
  console.log(`đọc ${t}: ${n} dòng`);
}
const nhieuNhat = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
console.log(`Hoá đơn SalonHero trong nguồn: ${nguon.size} · tài khoản từng nhận tiền: ${lichSu.size}`);

const db = await ketNoi();
const q = async (s, p) => (await db.query(s, p)).rows;
try {
  await db.query("begin");
  const cnDl = (await q(`select id from public.chi_nhanh where ma = 'DALAT'`))[0]?.id ?? null;
  const coSan = await q(`select id, ngan_hang, so_tai_khoan, chu_tai_khoan, ghi_chu, hoat_dong from public.tai_khoan_ngan_hang`);
  const theoKhoa = new Map(coSan.filter((r) => r.so_tai_khoan).map((r) => [khoaTaiKhoan(r.ngan_hang, r.so_tai_khoan), r]));
  const mauTrong = coSan.filter((r) => !r.so_tai_khoan.replace(/\D/g, ""));
  const daDung = new Set();
  const bao = { cap_nhat: 0, dien_mau: 0, them_dang_dung: 0, them_an: 0, xoa_mau: 0 };
  // 1) đang dùng
  for (const x of dangDung) {
    const cn = /đà lạt|da lat/i.test(x.chu) ? cnDl : null;
    const gt = [x.ngan_hang, x.so, x.chu, x.the, x.ck, cn];
    const co = theoKhoa.get(x.khoa);
    const cungNh = dangDung.filter((y) => chuanTenNganHang(y.ngan_hang) === chuanTenNganHang(x.ngan_hang));
    const mau = !co && cungNh.length === 1 ? mauTrong.find((r) => !daDung.has(r.id) && chuanTenNganHang(r.ngan_hang) === chuanTenNganHang(x.ngan_hang)) : null;
    if (co || mau) {
      const id = (co ?? mau).id; daDung.add(id);
      await q(`update public.tai_khoan_ngan_hang set ngan_hang = $1, so_tai_khoan = $2, chu_tai_khoan = $3, dung_quet_the = $4, dung_chuyen_khoan = $5, chi_nhanh_id = $6, hoat_dong = true where id = $7`, [...gt, id]);
      bao[co ? "cap_nhat" : "dien_mau"]++;
    } else {
      const [r] = await q(`insert into public.tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan, dung_quet_the, dung_chuyen_khoan, chi_nhanh_id, hoat_dong, ghi_chu) values ($1,$2,$3,$4,$5,$6,true,null) returning id`, gt);
      daDung.add(r.id); theoKhoa.set(x.khoa, { id: r.id }); bao.them_dang_dung++;
    }
  }
  // dòng mẫu trống còn lại: xoá nếu không khoản thu nào trỏ tới
  for (const r of mauTrong.filter((r) => !daDung.has(r.id))) {
    const [{ n }] = await q(`select count(*)::int n from public.thanh_toan where tai_khoan_id = $1`, [r.id]);
    if (!n) { await q(`delete from public.tai_khoan_ngan_hang where id = $1`, [r.id]); bao.xoa_mau++; }
  }
  // 2) chỉ còn trong lịch sử → ẩn
  const dsDangDung = new Set(dangDung.map((x) => x.khoa));
  for (const [k, o] of lichSu) {
    if (dsDangDung.has(k) || theoKhoa.has(k)) continue;
    const tenGoc = nhieuNhat(o.ngan_hang);
    const [r] = await q(`insert into public.tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan, dung_quet_the, dung_chuyen_khoan, hoat_dong, ghi_chu) values ($1,$2,$3,true,true,false,$4) returning id`,
      [tenGoc.startsWith("Ngân hàng") ? tenGoc : `Ngân hàng ${chuanTenNganHang(tenGoc) ?? tenGoc}`, soCua(k), nhieuNhat(o.chu), "Tài khoản cũ SalonHero (đã xoá ở SalonHero), chỉ để tra khoản thu cũ"]);
    theoKhoa.set(k, { id: r.id }); bao.them_an++;
  }
  console.log("Tài khoản:", bao);
  console.table((await q(`select ngan_hang, right(so_tai_khoan, 3) so3, left(chu_tai_khoan, 28) chu, hoat_dong, chi_nhanh_id is not null co_cn, dung_chuyen_khoan ck, dung_quet_the qt from public.tai_khoan_ngan_hang order by hoat_dong desc, ngan_hang`)).map((r) => ({ ...r, so3: `…${r.so3}` })));

  // 3) bù thanh_toan.tai_khoan_id
  const idTheoKhoa = new Map((await q(`select id, ngan_hang, so_tai_khoan from public.tai_khoan_ngan_hang where so_tai_khoan <> ''`)).map((r) => [khoaTaiKhoan(r.ngan_hang, r.so_tai_khoan), r.id]));
  const chup = async () => (await q(`select count(*)::int so_khoan, coalesce(sum(so_tien),0)::bigint tien, count(tai_khoan_id)::int co_tk from public.thanh_toan`))[0];
  const truoc = await chup();
  const rows = await q(`select t.id, t.phuong_thuc, t.so_tien::bigint so_tien, t.tai_khoan_id, h.sh_id::bigint sh_id from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
                        where t.loai = 'thu' and t.phuong_thuc in ('chuyen_khoan','quet_the') and h.sh_id is not null`);
  const dat = [], dem = {};
  for (const r of rows) {
    const ch = nguon.get(Number(r.sh_id));
    const kq = ch ? nganHangKhoan(ch, r.phuong_thuc, r.so_tien) : { ten: null, nguon: "khong_co_trong_nguon" };
    const id = kq.ten ? idTheoKhoa.get(kq.ten) ?? null : null;
    const nhan = id ? `gán (${kq.nguon})` : kq.ten ? "có số nhưng không thấy tài khoản" : `để null (${kq.nguon})`;
    dem[nhan] = (dem[nhan] ?? 0) + 1;
    if (id && id !== r.tai_khoan_id) dat.push({ id: r.id, tk: id });
  }
  console.log(`\nKhoản chuyển khoản/quẹt thẻ của hoá đơn SalonHero: ${rows.length}`); console.table(dem);
  if (dat.length) {
    await db.query("set local session_replication_role = replica");
    let n = 0;
    await theoLo(dat, 2000, async (lo) => { n += (await q(`update public.thanh_toan t set tai_khoan_id = x.tk from jsonb_to_recordset($1::jsonb) as x(id uuid, tk uuid) where t.id = x.id returning 1`, [JSON.stringify(lo)])).length; });
    await db.query("set local session_replication_role = origin");
    console.log(`Đã gán tài khoản cho ${n} khoản`);
  }
  const sau = await chup();
  if (truoc.so_khoan !== sau.so_khoan || truoc.tien !== sau.tien) throw new Error(`Đối chiếu lệch: số khoản ${truoc.so_khoan}→${sau.so_khoan}, tiền ${truoc.tien}→${sau.tien}`);
  // Mỗi khoản đã gán tài khoản: tên ngân hàng (0179) phải khớp tài khoản (không gán Vietcombank vào khoản ghi Techcombank).
  const [{ lech }] = await q(`select count(*)::int lech from public.thanh_toan t join public.tai_khoan_ngan_hang k on k.id = t.tai_khoan_id where t.ngan_hang is not null and position(t.ngan_hang in k.ngan_hang) = 0`);
  console.log(`Đối chiếu OK: ${sau.so_khoan} khoản, tổng tiền không đổi; có tài khoản ${truoc.co_tk} → ${sau.co_tk}; lệch tên ngân hàng: ${lech}`);
  if (lech) console.log("  (lệch tên: SalonHero ghi ngân hàng khác số tài khoản ở cùng khoản — xem lại trước khi ghi)");
  console.log(`Ví dụ số đã che: ${dangDung.slice(0, 2).map((x) => che(x.so)).join(", ")}`);
  await db.query(that ? "commit" : "rollback");
  console.log(that ? "\nĐÃ GHI (commit)." : "\nCHẠY THỬ: đã rollback, chưa ghi gì. Thêm --that để ghi.");
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI, đã rollback:", e.message); process.exitCode = 1; } finally { await db.end(); }
