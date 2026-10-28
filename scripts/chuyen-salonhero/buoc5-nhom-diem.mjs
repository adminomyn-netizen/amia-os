// BƯỚC 5 — NHÓM KHÁCH (tag) + SỔ ĐIỂM THƯỞNG + các trường khách còn thiếu, SalonHero → AMIA OS (migration 0065). Mặc định chạy THỬ (rollback); --that mới ghi.
// Dùng: PW=… node scripts/chuyen-salonhero/buoc5-nhom-diem.mjs <thư_mục_xuất> [--dot SH-2810-13] [--that]
//  • nhom_khach ← nho.ndjson (k = "tags", 27 nhóm, kể cả nhóm chưa khách nào dùng). LUXURY (4576) và Luxury (8106) để RIÊNG — không tự gộp.
//  • khach_nhom ← chi_tiet.tags từng khách.
//  • khach_diem_so ← diem[] từng khách (1 dòng SalonHero = 1 dòng sổ; so_diem = after − before). Khách nào tổng sổ ≠ loyalty_point thì thêm
//    1 dòng "dieu_chinh_dau" cho khớp (tính theo sổ ĐANG CÓ ở AMIA nên chạy lại không nhân đôi).
//  • khach_hang: chỉ điền các cột MỚI của 0065 khi đang trống (tổng đặt lịch/checkin/huỷ, công nợ gốc, ảnh đại diện, mã vùng, chặn ZNS).
//  • khach_nguoi_than ← related_person_* (gắn nhap_dot, gỡ được).
// Cập nhật cột khách có sẵn KHÔNG gỡ được bằng go_dot_nhap → phải sao lưu trước (sao-luu-db.mjs).
import { writeFileSync } from "node:fs";
import { ketNoi, docNdjson, docHet, theoLo, taoDot, mapMa, cnTheoLoc, sach, sdt, so, inBang } from "./lib.mjs";

const arg = (t, mac) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : mac; };
const thuMuc = process.argv[2]; if (!thuMuc || thuMuc.startsWith("--")) throw new Error("Thiếu thư mục xuất");
const dot = arg("--dot", "SH-2810-13"), that = process.argv.includes("--that");
const LOAI = { ORDER_REWARD_POINT: "cong_hoa_don", ORDER_REVERT_POINT: "hoan_hoa_don", USER_EDIT: "sua_tay" };
const QUAN_HE = { MOTHER: "Mẹ", FATHER: "Bố", WIFE: "Vợ", HUSBAND: "Chồng", SIBLING: "Anh chị em", CHILD: "Con", FRIEND: "Bạn" };

// ── Nguồn ──
const nho = await docHet(`${thuMuc}/nho.ndjson`);
const dsTag = nho.find((r) => r.k === "tags")?.data ?? [];
const xuatLuc = nho.find((r) => r.k === "meta")?.data?.xuat_luc ?? new Date().toISOString();
const khach = [];
for await (const r of docNdjson(`${thuMuc}/khach_tong_hop.ndjson`)) khach.push({ id: Number(r.id), ct: r.chi_tiet ?? {}, diem: (r.diem ?? []).filter((x) => !x.is_deleted) });
console.log(`Nguồn: nhóm ${dsTag.length}, khách ${khach.length}, dòng điểm ${khach.reduce((s, k) => s + k.diem.length, 0)}`);

const db = await ketNoi(); const q = async (sql, p) => (await db.query(sql, p)).rows;
const kq = []; const them = (muc, sh, am, ghi = "", chat = true) => kq.push({ muc, salonhero: Number(sh), amia: Number(am), lech: Number(am) - Number(sh), khop: Number(sh) === Number(am) ? "KHỚP" : "LỆCH", chat, ghi });
try {
  await db.query("begin");
  await taoDot(db, dot, "Nhóm khách + sổ điểm thưởng + trường khách còn thiếu từ bản xuất lần 2 (28/10/2026)");
  const khId = await mapMa(db, "khach_hang");
  const khongCo = khach.filter((k) => !khId.has(k.id)).map((k) => k.id);

  // ── 1. Danh mục nhóm ──
  const nhom = dsTag.filter((t) => !t.is_deleted).map((t) => ({ sh_id: Number(t.id), ten: sach(t.tag_name) || `Nhóm ${t.id}`, mau: t.color_code || null, tao_luc: t.createdAt ?? null }));
  const nNhom = (await q(`insert into public.nhom_khach (sh_id, ten, mau, mo_ta, tao_luc, nhap_dot)
      select x.sh_id, x.ten, x.mau, 'Chuyển từ SalonHero (tag)', coalesce(x.tao_luc, now()), $2 from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, ten text, mau text, tao_luc timestamptz)
      on conflict (sh_id) do nothing returning 1`, [JSON.stringify(nhom), dot])).length;
  const nhomId = await mapMa(db, "nhom_khach");

  // ── 2. Khách ↔ nhóm ──
  const cap = [], tagLa = [];
  for (const k of khach) for (const t of k.ct.tags ?? []) {
    if (!khId.has(k.id)) continue;
    if (!nhomId.has(Number(t.id))) { tagLa.push(`${k.id}:${t.id}`); continue; }
    cap.push({ khach_id: khId.get(k.id), nhom_id: nhomId.get(Number(t.id)) });
  }
  let nCap = 0;
  await theoLo(cap, 2000, async (lo) => { nCap += (await q(`insert into public.khach_nhom (khach_id, nhom_id, nhap_dot) select x.khach_id, x.nhom_id, $2 from jsonb_to_recordset($1::jsonb) as x(khach_id uuid, nhom_id uuid) on conflict do nothing returning 1`, [JSON.stringify(lo), dot])).length; });

  // ── 3. Sổ điểm ──
  const daCo = new Set((await q(`select sh_id from public.khach_diem_so where sh_id is not null`)).map((r) => Number(r.sh_id)));
  const dongDiem = [];
  for (const k of khach) {
    if (!khId.has(k.id)) continue;
    for (const x of k.diem) {
      if (daCo.has(Number(x.id))) continue;
      const truoc = Number(x.before_action_point ?? 0) || 0, sau = Number(x.after_action_point ?? 0) || 0;
      dongDiem.push({ sh_id: Number(x.id), khach_id: khId.get(k.id), loai: LOAI[x.type] ?? "dieu_chinh", sh_loai: x.type, so_diem: sau - truoc, truoc, sau, ly_do: sach(x.note) || null,
        hd_sh: Number(x.order_id) || null, ma_hd: sach(x.order_code) || null, cn: cnTheoLoc(x.location_id), nguoi: sach(x.created_by_name) || null, tao_luc: x.createdAt });
    }
  }
  let nDiem = 0;
  await theoLo(dongDiem, 2000, async (lo) => {
    nDiem += (await q(`insert into public.khach_diem_so (sh_id, khach_id, loai, sh_loai, so_diem, so_du_truoc_sh, so_du_sau_sh, ly_do, hoa_don_sh_id, ma_hoa_don_sh, chi_nhanh_id, nguoi_tao_ten, tao_luc, la_lich_su, nhap_dot)
      select x.sh_id, x.khach_id, x.loai, x.sh_loai, x.so_diem, x.truoc, x.sau, x.ly_do, x.hd_sh, x.ma_hd, (select id from public.chi_nhanh where ma = x.cn), x.nguoi, x.tao_luc, true, $2
      from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, khach_id uuid, loai text, sh_loai text, so_diem int, truoc int, sau int, ly_do text, hd_sh bigint, ma_hd text, cn text, nguoi text, tao_luc timestamptz)
      on conflict (sh_id) do nothing returning 1`, [JSON.stringify(lo), dot])).length;
  });
  // Điều chỉnh số dư đầu: theo sổ đang có ở AMIA ↔ loyalty_point SalonHero
  const tongSo = new Map((await q(`select khach_id, sum(so_diem)::int s from public.khach_diem_so group by khach_id`)).map((r) => [r.khach_id, r.s]));
  const dieuChinh = [];
  for (const k of khach) {
    if (!khId.has(k.id)) continue;
    const lp = so(k.ct.loyalty_point), co = tongSo.get(khId.get(k.id)) ?? 0;
    if (lp !== co) dieuChinh.push({ sh_khach: k.id, khach_id: khId.get(k.id), so_diem: lp - co, ly_do: `Điều chỉnh số dư đầu cho khớp điểm SalonHero lúc chuyển (${lp} điểm; lịch sử điểm cộng dồn ra ${co}${k.diem.length ? "" : " — SalonHero không có lịch sử điểm"})` });
  }
  if (dieuChinh.length) await q(`insert into public.khach_diem_so (khach_id, loai, so_diem, ly_do, nguoi_tao_ten, tao_luc, la_lich_su, nhap_dot)
      select x.khach_id, 'dieu_chinh_dau', x.so_diem, x.ly_do, 'Dữ liệu SalonHero (hệ thống)', $2::timestamptz, true, $3 from jsonb_to_recordset($1::jsonb) as x(khach_id uuid, so_diem int, ly_do text)`, [JSON.stringify(dieuChinh), xuatLuc, dot]);

  // ── 4. Trường khách còn thiếu (chỉ điền cột trống) ──
  const truong = khach.filter((k) => khId.has(k.id)).map((k) => ({ sh_id: k.id, dl: so(k.ct.total_booking) || null, ci: so(k.ct.total_checkin) || null, huy: so(k.ct.total_cancel) || null, no: so(k.ct.debt_amount) || null,
    anh: sach(k.ct.avatar) || null, mv: sach(k.ct.phone_country_code) || null, zns: Number(k.ct.lock_send_zns) === 1 }))
    .filter((x) => x.dl || x.ci || x.huy || x.no || x.anh || x.mv || x.zns);
  let nTruong = 0;
  await theoLo(truong, 2000, async (lo) => {
    nTruong += (await q(`update public.khach_hang k set tong_dat_lich_goc = coalesce(k.tong_dat_lich_goc, x.dl), tong_checkin_goc = coalesce(k.tong_checkin_goc, x.ci), tong_huy_lich_goc = coalesce(k.tong_huy_lich_goc, x.huy),
        cong_no_goc = coalesce(k.cong_no_goc, x.no), anh_dai_dien_url = coalesce(k.anh_dai_dien_url, x.anh), ma_vung_sdt = coalesce(k.ma_vung_sdt, x.mv), khong_gui_zns = k.khong_gui_zns or x.zns
      from jsonb_to_recordset($1::jsonb) as x(sh_id bigint, dl int, ci int, huy int, no bigint, anh text, mv text, zns boolean) where k.sh_id = x.sh_id returning 1`, [JSON.stringify(lo)])).length;
  });

  // ── 5. Người liên quan → khach_nguoi_than ──
  const nt = khach.filter((k) => khId.has(k.id) && sach(k.ct.related_person_name)).map((k) => ({ khach_id: khId.get(k.id), ho_ten: sach(k.ct.related_person_name),
    quan_he: QUAN_HE[k.ct.related_person_role] ?? (sach(k.ct.related_person_role) || null), dien_thoai: sdt(k.ct.related_person_mobile) || sach(k.ct.related_person_mobile) || null }));
  const nNt = nt.length ? (await q(`insert into public.khach_nguoi_than (khach_id, ho_ten, quan_he, dien_thoai, nhap_dot)
      select x.khach_id, x.ho_ten, x.quan_he, x.dien_thoai, $2 from jsonb_to_recordset($1::jsonb) as x(khach_id uuid, ho_ten text, quan_he text, dien_thoai text)
      where not exists (select 1 from public.khach_nguoi_than n where n.khach_id = x.khach_id and n.ho_ten = x.ho_ten) returning 1`, [JSON.stringify(nt), dot])).length : 0;

  // ── 6. ĐỐI CHIẾU (trong cùng giao dịch) ──
  const coAm = khach.filter((k) => khId.has(k.id));
  them("Khách SalonHero không còn ở AMIA", 0, khongCo.length, JSON.stringify(khongCo.slice(0, 10)));
  them("Danh mục nhóm (tag)", nhom.length, (await q(`select count(*)::int n from public.nhom_khach where sh_id = any($1::bigint[])`, [nhom.map((x) => x.sh_id)]))[0].n);
  const amNhom = new Map((await q(`select g.sh_id, count(kn.khach_id)::int n from public.nhom_khach g left join public.khach_nhom kn on kn.nhom_id = g.id where g.sh_id is not null group by g.sh_id`)).map((r) => [Number(r.sh_id), r.n]));
  const tepNhom = new Map(); for (const k of coAm) for (const t of k.ct.tags ?? []) tepNhom.set(Number(t.id), (tepNhom.get(Number(t.id)) ?? 0) + 1);
  for (const t of nhom) them(`  Nhóm "${t.ten}" (${t.sh_id}) — số khách`, tepNhom.get(t.sh_id) ?? 0, amNhom.get(t.sh_id) ?? 0);
  them("Tổng cặp khách–nhóm", [...tepNhom.values()].reduce((s, n) => s + n, 0), (await q(`select count(*)::int n from public.khach_nhom`))[0].n, tagLa.length ? `tag lạ: ${tagLa.slice(0, 5)}` : "");
  them("Khách có ít nhất 1 nhóm", coAm.filter((k) => (k.ct.tags ?? []).length).length, (await q(`select count(distinct khach_id)::int n from public.khach_nhom`))[0].n);

  const tepDiemLoai = {}; for (const k of coAm) for (const x of k.diem) { const t = (tepDiemLoai[x.type] ??= { n: 0, s: 0 }); t.n++; t.s += (Number(x.after_action_point ?? 0) || 0) - (Number(x.before_action_point ?? 0) || 0); }
  const amDiemLoai = Object.fromEntries((await q(`select sh_loai, count(*)::int n, sum(so_diem)::bigint s from public.khach_diem_so where sh_id is not null group by sh_loai`)).map((r) => [r.sh_loai, r]));
  for (const [t, v] of Object.entries(tepDiemLoai)) { them(`Dòng điểm ${t} — số dòng`, v.n, amDiemLoai[t]?.n ?? 0); them(`Dòng điểm ${t} — tổng điểm`, v.s, amDiemLoai[t]?.s ?? 0); }
  const dc = await q(`select k.sh_id, d.so_diem, d.ly_do from public.khach_diem_so d join public.khach_hang k on k.id = d.khach_id where d.loai = 'dieu_chinh_dau' and d.nhap_dot = $1 order by k.sh_id`, [dot]);
  them("Dòng điều chỉnh số dư đầu (để khớp loyalty_point)", dieuChinh.length, dc.length, JSON.stringify(dc.map((r) => [Number(r.sh_id), r.so_diem])), false);
  const tongLp = coAm.reduce((s, k) => s + so(k.ct.loyalty_point), 0);
  them("Tổng điểm: loyalty_point SalonHero ↔ tổng sổ điểm AMIA", tongLp, (await q(`select coalesce(sum(so_diem),0)::bigint n from public.khach_diem_so`))[0].n);
  them("Tổng điểm: loyalty_point SalonHero ↔ tổng diem_so_du trên khách", tongLp, (await q(`select coalesce(sum(diem_so_du),0)::bigint n from public.khach_hang`))[0].n);
  // từng khách: sổ ↔ loyalty_point ↔ diem_so_du
  const tk = new Map((await q(`select k.sh_id, k.diem_so_du, coalesce(s.s,0)::int so from public.khach_hang k left join (select khach_id, sum(so_diem) s from public.khach_diem_so group by khach_id) s on s.khach_id = k.id where k.sh_id is not null`)).map((r) => [Number(r.sh_id), r]));
  let lechLp = 0, lechDu = 0; const mau = [];
  for (const k of coAm) { const a = tk.get(k.id); const lp = so(k.ct.loyalty_point); if (a.so !== lp) { lechLp++; if (mau.length < 10) mau.push([k.id, lp, a.so]); } }
  for (const [, a] of tk) if (a.so !== a.diem_so_du) lechDu++;
  them("Khách có tổng sổ điểm ≠ loyalty_point", 0, lechLp, JSON.stringify(mau));
  them("Khách có diem_so_du ≠ tổng sổ điểm", 0, lechDu);
  const hd = (await q(`select count(*)::int n, count(h.id)::int co from public.khach_diem_so d left join public.hoa_don h on h.sh_id = d.hoa_don_sh_id where d.hoa_don_sh_id is not null`))[0];
  them("Dòng điểm gắn hoá đơn ↔ tìm thấy hoá đơn đó ở AMIA (chỉ báo: hoá đơn tạo trước 2023, đơn nháp, đơn không còn trong bản xuất thì không có ở AMIA)", hd.n, hd.co, "", false);

  const dem = async (cot) => (await q(`select count(*)::int n from public.khach_hang where ${cot}`))[0].n;
  them("Khách có tổng đặt lịch (total_booking)", coAm.filter((k) => so(k.ct.total_booking)).length, await dem("tong_dat_lich_goc is not null"));
  them("Khách có tổng checkin (total_checkin)", coAm.filter((k) => so(k.ct.total_checkin)).length, await dem("tong_checkin_goc is not null"));
  them("Khách có tổng huỷ lịch (total_cancel)", coAm.filter((k) => so(k.ct.total_cancel)).length, await dem("tong_huy_lich_goc is not null"));
  them("Khách có công nợ gốc (debt_amount)", coAm.filter((k) => so(k.ct.debt_amount)).length, await dem("cong_no_goc is not null"));
  them("Khách có ảnh đại diện (avatar)", coAm.filter((k) => sach(k.ct.avatar)).length, await dem("anh_dai_dien_url is not null"));
  them("Khách có mã vùng SĐT", coAm.filter((k) => sach(k.ct.phone_country_code)).length, await dem("ma_vung_sdt is not null"));
  them("Khách chặn ZNS", coAm.filter((k) => Number(k.ct.lock_send_zns) === 1).length, await dem("khong_gui_zns"));
  them("Người liên quan → khach_nguoi_than", nt.length, (await q(`select count(*)::int n from public.khach_nguoi_than where nhap_dot = $1`, [dot]))[0].n);
  const no = (await q(`select coalesce(sum(cong_no_goc),0)::bigint goc, (select coalesce(sum(h.con_no),0)::bigint from public.hoa_don h join public.khach_hang k on k.id = h.khach_id where k.sh_id is not null and h.con_no > 0 and h.trang_thai <> 'huy') hd from public.khach_hang`))[0];
  them("Công nợ: tổng debt_amount SalonHero ↔ tổng còn nợ trên hoá đơn AMIA (chỉ báo)", no.goc, no.hd, "", false);

  inBang(kq.map(({ chat, ...r }) => r));
  const lech = kq.filter((x) => x.chat && x.khop === "LỆCH");
  const tom = { dot, that, nhom_moi: nNhom, cap_khach_nhom: nCap, dong_diem: nDiem, dieu_chinh_dau: dieuChinh, khach_cap_nhat_truong: nTruong, nguoi_than: nNt, khach_khong_con: khongCo.length, so_muc_lech: lech.length };
  console.log(JSON.stringify(tom));
  writeFileSync(`${thuMuc}/_buoc5-${that ? "that" : "thu"}.json`, JSON.stringify({ tom, doi_chieu: kq }, null, 1));
  if (!that) { await db.query("rollback"); console.log("CHẠY THỬ XONG (đã huỷ, chưa ghi)."); }
  else if (lech.length) { await db.query("rollback"); console.log("LỆCH → HUỶ, KHÔNG GHI:", lech.map((x) => x.muc).join("; ")); process.exitCode = 2; }
  else { await db.query("commit"); console.log("ĐÃ GHI THẬT (commit)."); }
} catch (e) { await db.query("rollback").catch(() => {}); console.error("LỖI → đã huỷ:", e.message); process.exitCode = 1; }
await db.end();
