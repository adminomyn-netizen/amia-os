// BƯỚC 2 — HOÁ ĐƠN LỊCH SỬ (hoá đơn + dòng + người hưởng + thanh toán) từ bản xuất lần 2 của SalonHero vào DB thật.
// Quy tắc chị Lâm chốt 28/10/2026: hoá đơn lịch sử CÓ tính vào doanh thu/báo cáo, gắn cờ la_lich_su (không trừ kho, không thông báo, không đụng sổ cái thẻ);
// hoa hồng cũ giữ đúng số SalonHero (chỉ lưu các khoản ≠ 0 từ comission_log); đơn NHÁP không nhập (ở lại tệp lưu); đơn huỷ nhập với trạng thái 'huy'.
// 150 hoá đơn công nợ đầu kỳ (la_so_du_dau) mà đơn gốc nằm trong tệp → nâng cấp thành hoá đơn lịch sử đầy đủ (không đếm đôi nợ).
// Mặc định CHẠY THỬ (giao dịch rồi rollback) + in bảng đối chiếu; --that mới commit; đối chiếu lệch thì tự huỷ.
// Dùng: PW=$(security find-generic-password -s amia-os-db-password -w) node scripts/chuyen-salonhero/buoc2-hoa-don.mjs <thư-mục-xuất> --tep hoa_don_2026_10.ndjson --thang 2026-10 --dot SH-2810-02 [--that]
import { ketNoi, docNdjson, theoLo, taoDot, nhanVienHeThong, mapMa, cnTheoLoc, vnNgay, sach, so, inBang } from "./lib.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = process.argv[2]; if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất");
const tep = arg("--tep", "hoa_don.ndjson"), thang = arg("--thang", null), dot = arg("--dot", "SH-2810-02"), that = process.argv.includes("--that");
const db = await ketNoi(); const q = async (sql, p) => (await db.query(sql, p)).rows;
const PT = { CASH: "tien_mat", TRANSFER: "chuyen_khoan", CARD: "quet_the", COD: "tien_mat", WALLET: "chuyen_khoan" };
const ptDich = (t) => PT[String(t ?? "").toUpperCase()] ?? "chuyen_khoan";

// ── Nguồn (lọc theo tháng nếu có) ──
const don = [], daThay = new Set(); // lọc theo --thang (1 tháng) hoặc --tu/--den (khoảng tháng, gồm cả hai đầu); bỏ trùng mã đơn (tệp kéo lại có thể lặp)
const tu = arg("--tu", null), den = arg("--den", null);
for await (const r of docNdjson(`${thuMuc}/${tep}`)) {
  const ngay = vnNgay(r.l.created_at);
  if (thang && !ngay.startsWith(thang)) continue;
  if (tu && ngay.slice(0, 7) < tu) continue;
  if (den && ngay.slice(0, 7) > den) continue;
  if (daThay.has(r.l.id)) continue; daThay.add(r.l.id);
  don.push(r);
}
console.log(`Nguồn ${tep}${thang ? " tháng " + thang : ""}: ${don.length} đơn`);
const nhap = don.filter((r) => r.d.status !== "DRAFT");
const maDung = new Map();
const bao = { ma_trung_them_duoi: [], nhap_bo_qua: don.length - nhap.length, khong_co_khach_o_amia: 0, dong_khong_co_danh_muc: 0, tong_hang_lech: [], chenh_thanh_toan: [], khach_dong_du: [], da_co_lich_su: 0, no_dau_nang_cap: 0, no_dau_bo_qua_vi_co_thanh_toan: [] };

try {
  await db.query("begin");
  await taoDot(db, dot, `Hoá đơn lịch sử ${thang ?? (tu || den ? `${tu ?? "đầu"}→${den ?? "cuối"}` : "toàn bộ")} từ bản xuất lần 2 (28/10/2026)`);
  const he = await nhanVienHeThong(db);
  const cn = Object.fromEntries((await q(`select ma, id from public.chi_nhanh`)).map((r) => [r.ma, r.id]));
  const khach = await mapMa(db, "khach_hang"), nv = await mapMa(db, "nhan_vien"), dv = await mapMa(db, "dich_vu"), sp = await mapMa(db, "san_pham"), goi = await mapMa(db, "goi_the");
  const co = new Map((await q(`select sh_id, id, la_so_du_dau, la_lich_su, (select count(*)::int from public.thanh_toan t where t.hoa_don_id = h.id) tt from public.hoa_don h where sh_id is not null`)).map((r) => [Number(r.sh_id), r]));
  for (const r of await q(`select ma, sh_id from public.hoa_don where sh_id is not null`)) maDung.set(r.ma, Number(r.sh_id));
  const maDaCo = new Set((await q(`select ma from public.hoa_don`)).map((r) => r.ma));

  // ── Dựng dữ liệu ──
  const hd = [], dong = [], nvDong = [], hhGoc = [], tt = [];
  for (const { l, d } of nhap) {
    const shId = Number(d.id);
    const huy = d.status === "VOID";
    const items = (d.orderItems ?? []).filter((it) => !it.is_delete);
    const tongHang = items.reduce((s, it) => s + so(it.subtotal) - so(it.discount), 0);
    if (!huy && tongHang !== so(d.subtotal)) bao.tong_hang_lech.push(shId);
    const phuPhi = so(d.total_service_charge) + so(d.delivery_fee);
    const phai = so(d.subtotal) - so(d.discount) + so(d.tax_amount) + so(d.total_tip) + phuPhi;
    const daThuNguon = huy ? 0 : so(d.amount_paid) + so(d.total_amount_card);
    const khId = khach.get(Number(d.customer_id)) ?? null;
    if (d.customer_id && !khId) bao.khong_co_khach_o_amia++;
    const ngay = vnNgay(l.created_at);
    let ma = `SH-${sach(d.order_id)}`;
    // SalonHero có 2 đơn khác nhau cùng mã hiển thị (vd SH-25110747 = đơn 23103117 và 23103118): đơn sau thêm đuôi -<mã đơn> để mã AMIA không trùng.
    if (maDung.has(ma) && maDung.get(ma) !== shId) { ma = `${ma}-${shId}`; bao.ma_trung_them_duoi.push(shId); }
    maDung.set(ma, shId);
    const c = co.get(shId);
    if (c?.la_lich_su) { bao.da_co_lich_su++; continue; }
    if (c?.la_so_du_dau && c.tt > 0) { bao.no_dau_bo_qua_vi_co_thanh_toan.push(shId); continue; }
    if (c?.la_so_du_dau) bao.no_dau_nang_cap++;
    hd.push({ sh_id: shId, ma, chi_nhanh: cnTheoLoc(d.location_id), khach_id: khId, trang_thai: huy ? "huy" : "hoan_thanh", ngay, giam_gia_don: so(d.discount), vat_pct: Number(d.tax_percent) || 0,
      phu_phi: phuPhi, tip: so(d.total_tip), tong_hang: tongHang, vat_tien: so(d.tax_amount), tong_phai_thu: huy ? 0 : phai, da_thu: daThuNguon, con_no: huy ? 0 : so(d.debt),
      sh_ma: sach(d.order_id), sh_trang_thai: d.status, tien_tru_the: so(d.total_amount_card), giam_voucher: so(d.total_voucher), giam_diem: so(d.point2money),
      // thu ngân = người hoàn tất đơn (báo cáo thu ngân của SalonHero tính theo người này, migration 0068)
      thu_ngan_sh_id: d.completed_by ?? d.created_by ?? null, thu_ngan_ten: sach(d.completed_by_name ?? d.created_by_name) || null,
      ghi_chu: [sach(d.note), d.created_by_name ? `Người lập (SalonHero): ${sach(d.created_by_name)}` : "", d.customer_id && !khId ? `Khách gốc không còn trong AMIA: ${sach(d.customer_fullname)} ${sach(d.customer_phone)}` : ""].filter(Boolean).join(" · ") || null,
      ly_do_huy: huy ? sach(d.reason_to_void) || "Huỷ ở SalonHero" : null, tao_luc: l.created_at, chot_luc: d.completed_at ?? l.completed_at ?? null, huy_luc: d.void_at ?? null });
    for (const it of items) {
      const mc = it.member_card_id ? Number(it.member_card_id) : null;
      const laThe = !mc && Number(it.product_card_id) > 0 && it.product_type === "SERVICE";
      const loai = it.product_type === "PRODUCT" ? "san_pham" : laThe ? "goi_the" : "dich_vu";
      const ref = loai === "san_pham" ? sp.get(Number(it.product_id)) : loai === "goi_the" ? goi.get(Number(it.product_card_id)) : dv.get(Number(it.product_id));
      if (!ref) bao.dong_khong_co_danh_muc++;
      const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
      dong.push({ sh_id: Number(it.id), don_sh: shId, loai, ref: ref ?? null, ten: sach(it.product_name) || "(không tên)", so_luong: qty, don_gia: Math.max(0, so(it.product_price)), giam_gia: Math.max(0, so(it.discount)),
        loai_goc: `${it.product_type}${it.product_card_type ? ":" + it.product_card_type : ""}`, the_khach_sh_id: mc });
      const kiem = (vai, tien, k) => { const id = it[`${tien}${k}`]; return id ? Number(id) : null; };
      for (const [vai, tien] of [["phuc_vu", "operator_id_"], ["tu_van", "presale_operator_id_"], ["ban", "sale_operator_id_"]]) {
        const ids = []; for (let k = 1; k <= 5; k++) { const id = kiem(vai, tien, k); if (id && nv.has(id) && !ids.includes(id)) ids.push(id); }
        ids.forEach((id, i) => { const chia = Math.floor(10000 / ids.length) / 100; nvDong.push({ dong_sh: Number(it.id), nv: nv.get(id), vai, ti_le: i === 0 ? +(100 - chia * (ids.length - 1)).toFixed(2) : chia }); });
      }
      try {
        const lg = it.comission_log ? JSON.parse(it.comission_log) : {};
        for (const [pid, v] of Object.entries(lg)) {
          for (const [vai, truong] of [["phuc_vu", "commission"], ["ban", "sale_commission"], ["tu_van", "presale_commission"]]) {
            const gt = Number(v[truong]); if (!gt) continue;
            hhGoc.push({ dong_sh: Number(it.id), vai, sh_nv: Number(pid), nv: nv.get(Number(pid)) ?? null, gia_tri: gt, kieu: v[`${truong === "commission" ? "commission" : truong}_type`] ?? null });
          }
        }
        if (it.referral_commission && Number(it.referral_commission)) hhGoc.push({ dong_sh: Number(it.id), vai: "gioi_thieu", sh_nv: Number(it.referral_id) || null, nv: null, gia_tri: Number(it.referral_commission), kieu: it.referral_commission_type ?? null });
      } catch { /* log hỏng: bỏ qua, số vẫn nằm ở tệp lưu */ }
    }
    if (!huy) {
      const ev = (d.paymentHistory ?? []).filter((x) => !x.is_deleted && so(x.amount_paid) > 0);
      let tong = 0;
      for (const x of ev) { tt.push({ don_sh: shId, pt: ptDich(x.payment_type), so_tien: so(x.amount_paid), ngay: vnNgay(x.action_date) ?? ngay, ghi: `SalonHero ${x.actions}${x.user_name ? " · " + sach(x.user_name) : ""}` }); tong += so(x.amount_paid); }
      // Khách đóng dư (SalonHero ghi đã thu > phải thu): KHÔNG bù khoản dư vào sổ thanh toán để công nợ không âm; ghi vào danh sách ngoại lệ đã biết.
      const thieu = Math.max(0, phai - so(d.total_amount_card) - tong);
      if (daThuNguon > phai) bao.khach_dong_du.push([shId, daThuNguon - phai]);
      if (tong !== so(d.amount_paid)) { bao.chenh_thanh_toan.push([shId, so(d.amount_paid), tong]); const bu = Math.min(so(d.amount_paid) - tong, thieu); if (bu > 0) tt.push({ don_sh: shId, pt: ptDich(d.payment_type), so_tien: bu, ngay, ghi: "Chênh lệch lịch sử thanh toán SalonHero (bù để khớp số đã thu)" }); }
      if (so(d.total_amount_card) > 0) tt.push({ don_sh: shId, pt: "the_tien", so_tien: so(d.total_amount_card), ngay, ghi: "Trừ thẻ (lịch sử SalonHero, không ghi sổ thẻ)" });
    }
  }

  // ── Ghi: nâng cấp công nợ đầu kỳ ──
  const nangCap = hd.filter((h) => co.get(h.sh_id)?.la_so_du_dau);
  const moi = hd.filter((h) => !co.get(h.sh_id));
  await theoLo(nangCap, 500, (lo) => q(`update public.hoa_don h set la_so_du_dau = false, la_lich_su = true, trang_thai = x.trang_thai, ngay_hd = x.ngay, khach_id = coalesce(x.khach_id, h.khach_id), giam_gia_don = x.giam_gia_don,
      vat_pct = x.vat_pct, phu_phi = x.phu_phi, tip = x.tip, tong_hang = x.tong_hang, vat_tien = x.vat_tien, tong_phai_thu = x.tong_phai_thu, sh_ma = x.sh_ma, sh_trang_thai = x.sh_trang_thai, tien_tru_the = x.tien_tru_the,
      giam_voucher = x.giam_voucher, giam_diem = x.giam_diem, thu_ngan_sh_id = x.thu_ngan_sh_id, thu_ngan_ten = x.thu_ngan_ten, ghi_chu = coalesce(x.ghi_chu, h.ghi_chu), nhap_dot = $2
     from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, trang_thai text, ngay date, khach_id uuid, giam_gia_don bigint, vat_pct numeric, phu_phi bigint, tip bigint, tong_hang bigint, vat_tien bigint, tong_phai_thu bigint, sh_ma text, sh_trang_thai text,
       tien_tru_the bigint, giam_voucher bigint, giam_diem bigint, thu_ngan_sh_id bigint, thu_ngan_ten text, ghi_chu text) where h.sh_id = x.sh_id`, [JSON.stringify(lo), dot]));
  let nHd = 0;
  await theoLo(moi, 500, async (lo) => {
    const r = await q(`insert into public.hoa_don (sh_id, ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, giam_gia_don, vat_pct, phu_phi, tip, tong_hang, vat_tien, tong_phai_thu, da_thu, con_no, nguoi_lap_id, ghi_chu, ly_do_huy,
          tao_luc, chot_luc, huy_luc, la_lich_su, sh_ma, sh_trang_thai, tien_tru_the, giam_voucher, giam_diem, thu_ngan_sh_id, thu_ngan_ten, nhap_dot)
       select x.sh_id, x.ma, (select id from public.chi_nhanh where ma = x.chi_nhanh), x.khach_id, x.trang_thai, x.ngay, x.giam_gia_don, x.vat_pct, x.phu_phi, x.tip, x.tong_hang, x.vat_tien, x.tong_phai_thu, x.da_thu, x.con_no, $2::uuid, x.ghi_chu, x.ly_do_huy,
          coalesce(x.tao_luc, now()), x.chot_luc, x.huy_luc, true, x.sh_ma, x.sh_trang_thai, x.tien_tru_the, x.giam_voucher, x.giam_diem, x.thu_ngan_sh_id, x.thu_ngan_ten, $3
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ma text, chi_nhanh text, khach_id uuid, trang_thai text, ngay date, giam_gia_don bigint, vat_pct numeric, phu_phi bigint, tip bigint, tong_hang bigint, vat_tien bigint, tong_phai_thu bigint, da_thu bigint,
          con_no bigint, ghi_chu text, ly_do_huy text, tao_luc timestamptz, chot_luc timestamptz, huy_luc timestamptz, sh_ma text, sh_trang_thai text, tien_tru_the bigint, giam_voucher bigint, giam_diem bigint, thu_ngan_sh_id bigint, thu_ngan_ten text)
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), he, dot]);
    nHd += r.length;
  });
  const idHd = await mapMa(db, "hoa_don");
  const dsHd = new Set(hd.map((h) => h.sh_id));
  // ── dòng ──
  const dongCan = dong.filter((x) => dsHd.has(x.don_sh));
  let nDong = 0;
  await theoLo(dongCan, 1000, async (lo) => {
    const r = await q(`insert into public.hoa_don_dong (sh_id, hoa_don_id, loai, dich_vu_id, san_pham_id, goi_id, ten, so_luong, don_gia, giam_gia, la_lich_su, loai_goc, the_khach_sh_id, nhap_dot)
       select x.sh_id, h.id, x.loai, case when x.loai = 'dich_vu' then x.ref end, case when x.loai = 'san_pham' then x.ref end, case when x.loai = 'goi_the' then x.ref end, x.ten, x.so_luong, x.don_gia, x.giam_gia, true, x.loai_goc, x.the_khach_sh_id, $2
       from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, don_sh bigint, loai text, ref uuid, ten text, so_luong int, don_gia bigint, giam_gia bigint, loai_goc text, the_khach_sh_id bigint) join public.hoa_don h on h.sh_id = x.don_sh
       on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), dot]);
    nDong += r.length;
  });
  const idDong = await mapMa(db, "hoa_don_dong");
  const nvC = nvDong.filter((x) => idDong.has(x.dong_sh));
  await theoLo(nvC, 2000, (lo) => q(`insert into public.dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le, nhap_dot)
     select d.id, x.nv, x.vai, x.ti_le, $2 from jsonb_to_recordset($1::jsonb) as x(dong_sh bigint, nv uuid, vai text, ti_le numeric) join public.hoa_don_dong d on d.sh_id = x.dong_sh
     where d.nhap_dot = $2 on conflict do nothing`, [JSON.stringify(lo), dot]));
  const hhC = hhGoc.filter((x) => idDong.has(x.dong_sh));
  if (hhC.length) await theoLo(hhC, 2000, (lo) => q(`insert into public.dong_hoa_hong_goc (dong_id, vai, nhan_vien_id, sh_nhan_vien_id, gia_tri, kieu, nhap_dot)
     select d.id, x.vai, x.nv, x.sh_nv, x.gia_tri, x.kieu, $2 from jsonb_to_recordset($1::jsonb) as x(dong_sh bigint, vai text, sh_nv bigint, nv uuid, gia_tri numeric, kieu text) join public.hoa_don_dong d on d.sh_id = x.dong_sh where d.nhap_dot = $2`, [JSON.stringify(lo), dot]));
  // ── thanh toán ──
  const ttC = tt.filter((x) => dsHd.has(x.don_sh));
  let nTt = 0;
  await theoLo(ttC, 2000, async (lo) => {
    const r = await q(`insert into public.thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, ghi_chu, la_lich_su, nhap_dot)
       select h.id, 'thu', x.pt, x.so_tien, x.ngay, $2::uuid, x.ghi, true, $3 from jsonb_to_recordset($1::jsonb) as x(don_sh bigint, pt text, so_tien bigint, ngay date, ghi text) join public.hoa_don h on h.sh_id = x.don_sh returning 1`, [JSON.stringify(lo), he, dot]);
    nTt += r.length;
  });
  // đảm bảo tổng hoá đơn khớp sau khi thêm dòng/thanh toán (hàm tinh_lai giữ số lịch sử, tính lại da_thu/con_no theo thanh toán)
  await q(`select public.tinh_lai_hoa_don(h.id) from public.hoa_don h where h.sh_id = any($1::bigint[])`, [[...dsHd]]);

  // ── ĐỐI CHIẾU ──
  const ids = [...dsHd];
  const dichSh = (loc) => {
    const o = { dong_du: 0, dem: 0, phai: 0, doanhthu: 0, thu: 0, no: 0, dong: 0, thanhtien: 0, tt_the: 0 };
    for (const r of loc) { const d = r.d; const t = (d.orderItems ?? []).filter((it) => !it.is_delete); if (d.status === "VOID") continue; o.dem++; const th = t.reduce((s, it) => s + so(it.subtotal) - so(it.discount), 0);
      o.phai += so(d.subtotal) - so(d.discount) + so(d.tax_amount) + so(d.total_tip) + so(d.total_service_charge) + so(d.delivery_fee); o.doanhthu += th - so(d.discount); o.thu += Math.min(so(d.amount_paid) + so(d.total_amount_card), so(d.subtotal) - so(d.discount) + so(d.tax_amount) + so(d.total_tip) + so(d.total_service_charge) + so(d.delivery_fee)); o.dong_du += Math.max(0, so(d.amount_paid) + so(d.total_amount_card) - (so(d.subtotal) - so(d.discount) + so(d.tax_amount) + so(d.total_tip) + so(d.total_service_charge) + so(d.delivery_fee))); o.no += so(d.debt);
      o.dong += t.length; o.thanhtien += th; o.tt_the += so(d.total_amount_card); }
    return o;
  };
  const sh = dichSh(nhap);
  const am = (await q(`select count(*)::int dem, coalesce(sum(tong_phai_thu),0)::bigint phai, coalesce(sum(greatest(tong_hang - giam_gia_don,0)),0)::bigint doanhthu, coalesce(sum(da_thu),0)::bigint thu, coalesce(sum(con_no),0)::bigint "no",
       coalesce(sum(tien_tru_the),0)::bigint tt_the from public.hoa_don where sh_id = any($1::bigint[]) and trang_thai = 'hoan_thanh'`, [ids]))[0];
  const amDong = (await q(`select count(*)::int dong, coalesce(sum(thanh_tien),0)::bigint thanhtien from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id where h.sh_id = any($1::bigint[]) and h.trang_thai = 'hoan_thanh'`, [ids]))[0];
  const amVoid = (await q(`select count(*)::int n from public.hoa_don where sh_id = any($1::bigint[]) and trang_thai = 'huy'`, [ids]))[0].n;
  const amTT = (await q(`select coalesce(sum(case when phuong_thuc <> 'the_tien' then so_tien end),0)::bigint tien, coalesce(sum(case when phuong_thuc = 'the_tien' then so_tien end),0)::bigint the from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id where h.sh_id = any($1::bigint[])`, [ids]))[0];
  const kq = [];
  const them = (muc, a, b, ghi = "") => kq.push({ muc, salonhero: Number(a), amia: Number(b), lech: Number(b) - Number(a), khop: Number(a) === Number(b) ? "KHỚP" : "LỆCH", ghi });
  // số đếm của chính SalonHero (đếm trực tiếp ngày 28/10 trước khi xuất)
  // Số đếm TRỰC TIẾP của SalonHero theo tháng (đếm bằng hàm đọc của SalonHero trước khi xuất): [tháng, tất cả, hoàn thành, nháp, huỷ, tổng đơn hoàn thành, tổng nháp, tổng nợ]
  const tepDem = `${thuMuc}/_dem_song_hoa_don.json`;
  if (existsSync(tepDem)) {
    const song = JSON.parse(readFileSync(tepDem, "utf8")).filter((x) => x[1] !== "ERR");
    const cacThang = [...new Set(nhap.map((r) => vnNgay(r.l.created_at).slice(0, 7)))].sort();
    const amThang = new Map((await q(`select to_char(ngay_hd,'YYYY-MM') m, count(*) filter (where trang_thai='hoan_thanh')::int ht, count(*) filter (where trang_thai='huy')::int huy,
        coalesce(sum(tong_phai_thu - tien_tru_the) filter (where trang_thai='hoan_thanh'),0)::bigint tien, coalesce(sum(con_no) filter (where trang_thai='hoan_thanh'),0)::bigint no
        from public.hoa_don where sh_id = any($1::bigint[]) group by 1`, [ids])).map((r) => [r.m, r]));
    let sumSh = 0, sumAm = 0;
    for (const m of cacThang) {
      const s = song.find((x) => x[0] === m); const a = amThang.get(m); if (!s) continue;
      them(`[SalonHero trực tiếp] ${m} hoàn thành`, s[2], a?.ht ?? 0); them(`[SalonHero trực tiếp] ${m} huỷ`, s[4], a?.huy ?? 0); them(`[SalonHero trực tiếp] ${m} tổng tiền đơn hoàn thành`, s[5], a?.tien ?? 0);
      sumSh += Number(s[5]); sumAm += Number(a?.tien ?? 0);
    }
    them(`[SalonHero trực tiếp] CỘNG ${cacThang.length} tháng — tổng tiền đơn hoàn thành`, sumSh, sumAm);
  }
  them("Số hoá đơn hoàn thành", sh.dem, am.dem, `nhập ${nHd} đơn mới + ${bao.no_dau_nang_cap} nâng cấp từ nợ đầu kỳ; bỏ qua ${bao.nhap_bo_qua} đơn nháp`);
  them("Số hoá đơn huỷ", nhap.filter((r) => r.d.status === "VOID").length, amVoid);
  them("Tổng phải thu (sau giảm, VAT, tip, phụ phí)", sh.phai, am.phai);
  them("Tổng doanh thu (tổng hàng − giảm giá cả đơn)", sh.doanhthu, am.doanhthu);
  them("Tổng đã thu (tiền + trừ thẻ)", sh.thu, Number(amTT.tien) + Number(amTT.the));
  them("  trong đó trừ thẻ", sh.tt_the, amTT.the);
  them("Tổng còn nợ", sh.no, am.no);
  console.log(`Ngoại lệ đã biết — khách đóng dư (đã thu > phải thu), KHÔNG tính vào đã thu của AMIA: ${bao.khach_dong_du.length} đơn, tổng ${sh.dong_du} đ`, bao.khach_dong_du.slice(0, 10));
  them("Số dòng hàng", sh.dong, amDong.dong);
  them("Tổng thành tiền các dòng", sh.thanhtien, amDong.thanhtien);
  inBang(kq);
  const tom = { dot, that, thang, nguon: don.length, hoa_don_moi: nHd, dong: nDong, thanh_toan: nTt, tt_dung: tt.length, tt_ghi: ttC.length, nhan_vien_dong: nvC.length, hoa_hong_goc: hhC.length, ...bao, tong_hang_lech: bao.tong_hang_lech.length, khach_dong_du_don: bao.khach_dong_du.length, ma_trung_them_duoi: bao.ma_trung_them_duoi.length, khach_dong_du_tien: sh.dong_du, chenh_thanh_toan: bao.chenh_thanh_toan.length };
  console.log(JSON.stringify(tom));
  writeFileSync(`${thuMuc}/_buoc2-${thang ?? (tu || den ? `${tu ?? "dau"}-${den ?? "cuoi"}` : "tat-ca")}-${that ? "that" : "thu"}.json`, JSON.stringify({ tom, doi_chieu: kq, mau_lech: { tong_hang: bao.tong_hang_lech.slice(0, 20), thanh_toan: bao.chenh_thanh_toan.slice(0, 20) } }, null, 1));
  const lech = kq.filter((x) => x.khop === "LỆCH");
  if (!that) { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); }
  else if (lech.length) { await db.query("rollback"); console.log("ĐỐI CHIẾU LỆCH → HUỶ, KHÔNG GHI:", lech.map((x) => x.muc).join("; ")); process.exitCode = 1; }
  else { await db.query("commit"); console.log("ĐÃ GHI THẬT (commit)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message, e.stack?.split("\n")[1] ?? ""); process.exitCode = 1; }
await db.end();
