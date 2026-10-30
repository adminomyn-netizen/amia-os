// BƯỚC 1c — KHÁCH CÓ ĐƠN NHƯNG KHÔNG CÒN TRONG DANH SÁCH SALONHERO (chị Lâm 30/10/2026: "nạp 42 khách ngoài danh sách").
// Dựng hồ sơ từ chính các đơn (tên, SĐT, cơ sở), gắn lại các hoá đơn đã nạp mà khach_id đang trống, ghi chú "cần rà lại".
// Mặc định CHẠY THỬ (rollback); --that mới ghi. Dùng: PW=… node scripts/chuyen-salonhero/buoc1c-khach-ngoai-danh-sach.mjs <thư-mục-xuất> --dot SH-3010-04 [--that]
import { ketNoi, docNdjson, taoDot, cnTheoLoc, sdt, sach } from "./lib.mjs";
const thuMuc = process.argv[2], that = process.argv.includes("--that");
const dot = process.argv[process.argv.indexOf("--dot") + 1];
if (!thuMuc || !dot || dot.startsWith("--")) throw new Error("Thiếu thư mục xuất hoặc --dot");
const db = await ketNoi(); const q = async (s, p) => (await db.query(s, p)).rows;
try {
  await db.query("begin");
  await taoDot(db, dot, "Khách có đơn nhưng không còn trong danh sách SalonHero (dựng từ đơn)");
  const co = new Set((await q(`select sh_id from public.khach_hang where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const sdtDaCo = new Set((await q(`select dien_thoai from public.khach_hang`)).map((r) => r.dien_thoai));
  const maDaCo = new Set((await q(`select ma from public.khach_hang`)).map((r) => r.ma));
  const phuTrach = (await q(`select nguoi_phu_trach_id id from public.khach_hang where ma ~ '^SH[0-9]+$' and nguoi_phu_trach_id is not null limit 1`))[0]?.id;
  if (!phuTrach) throw new Error("Không tìm được người phụ trách mặc định");
  // 1. Quét các tệp đơn, gom khách chưa có ở AMIA
  const moi = new Map(); const donCua = new Map(); // khách → [mã đơn]
  for (const tep of ["hoa_don.ndjson", "hoa_don_bosung.ndjson", "hoa_don_2026_10.ndjson"]) {
    for await (const { l, d } of docNdjson(`${thuMuc}/${tep}`)) {
      const cid = Number(d.customer_id); if (!cid || co.has(cid)) continue;
      const k = moi.get(cid) ?? { id: cid, ten: "", dt: "", loc: d.location_id, soDon: 0 };
      k.soDon++; if (!k.ten) k.ten = sach(d.customer_fullname); if (!k.dt) k.dt = sdt(d.customer_phone); moi.set(cid, k);
      donCua.set(Number(d.id), cid);
    }
  }
  console.log(`Khách có đơn nhưng chưa có ở AMIA: ${moi.size}; số đơn của họ trong tệp: ${donCua.size}`);
  // 2. Thêm khách
  let them = 0, khongSdt = 0, trung = 0;
  for (const k of moi.values()) {
    let p = k.dt; let ghi = "Khách đã bị xoá khỏi danh sách SalonHero nhưng còn đơn — hồ sơ dựng lại từ dữ liệu đơn, cần rà lại thông tin.";
    if (!p) { p = `KHONG-SDT-${k.id}`; khongSdt++; } else if (sdtDaCo.has(p)) { p = `${p}-TRUNG${k.id}`; trung++; ghi += " SĐT trùng với một khách khác, cần gộp hoặc sửa tay."; }
    sdtDaCo.add(p);
    let ma = `SH${k.id}`; if (maDaCo.has(ma)) ma = `${ma}-${k.id}`; maDaCo.add(ma);
    const r = await q(`insert into public.khach_hang (sh_id, ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, ghi_chu, nhap_dot)
      values ($1, $2, $3, $4, (select id from public.chi_nhanh where ma = $5), 'khac', $6, $7, $8) on conflict (sh_id) do nothing returning 1`,
      [k.id, ma, k.ten || `Khách SalonHero ${k.id}`, p, cnTheoLoc(k.loc), phuTrach, ghi, dot]);
    them += r.length;
  }
  // 3. Gắn lại hoá đơn đã nạp mà chưa có khách
  const ds = [...donCua].map(([don, kh]) => ({ don, kh }));
  const gan = (await q(`update public.hoa_don h set khach_id = k.id from jsonb_to_recordset($1::jsonb) as x(don bigint, kh bigint) join public.khach_hang k on k.sh_id = x.kh where h.sh_id = x.don and h.khach_id is null returning 1`, [JSON.stringify(ds)])).length;
  const conTrong = (await q(`select count(*)::int n from public.hoa_don where khach_id is null and ghi_chu like '%Khách gốc không còn trong AMIA%'`))[0].n;
  console.log(JSON.stringify({ dot, that, khach_tim_thay: moi.size, khach_them: them, khong_sdt: khongSdt, sdt_trung: trung, hoa_don_gan_lai: gan, hoa_don_van_trong_khach: conTrong }));
  if (!that) { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); }
  else { await db.query("commit"); console.log("ĐÃ GHI THẬT (commit)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
finally { await db.end(); }
