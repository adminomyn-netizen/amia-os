import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0115: báo cáo theo chi nhánh, theo khách hàng, lịch sử dùng thẻ (đối chiếu SalonHero 29/10/2026).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let VINH: string, DALAT: string, K1: string, K2: string, K3: string, GOI: string;

async function hd(o: { ma: string; sh?: string; cn: string; khach: string | null; ngay: string; tong: number; no?: number; truThe?: number; dong?: { ten: string; theSh?: number; sl?: number }[]; thu?: { pt: string; tien: number; ngay?: string }[] }) {
  const id = (await q<{ id: string }>(
    `insert into hoa_don (ma, sh_ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su, tien_tru_the, tao_luc)
     values ($1,$2,$3,$4,'hoan_thanh',$5,$6,$6,$7,$8,$9,true,$10,$5::date + time '09:30') returning id`,
    [o.ma, o.sh ?? null, o.cn, o.khach, o.ngay, o.tong, o.tong - (o.no ?? 0), o.no ?? 0, u(1), o.truThe ?? 0]))[0].id;
  for (const d of o.dong ?? []) await q(`insert into hoa_don_dong (hoa_don_id, loai, ten, so_luong, don_gia, la_lich_su, the_khach_sh_id) values ($1,'dich_vu',$2,$3,0,true,$4)`, [id, d.ten, d.sl ?? 1, d.theSh ?? null]);
  for (const t of o.thu ?? []) await q(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) values ($1,$2,$3,$4,$5,true)`, [id, t.pt, t.tien, t.ngay ?? o.ngay, u(1)]);
  return id;
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  VINH = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  DALAT = (await q<{ id: string }>(`select id from chi_nhanh where ma='DALAT'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id, trang_thai_lam) values ($1,'Thu ngân','thu_ngan',$2,'dang_lam'),($3,'KTV Vinh','ktv',$2,'dang_lam'),($4,'KTV nghỉ','ktv',$2,'nghi_viec'),($5,'KTV Đà Lạt','ktv',$6,'dang_lam')`, [u(1), VINH, u(2), u(3), u(4), DALAT]);
  const k = async (ma: string, ten: string, dt: string, hang: string | null) =>
    (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, hang_goc, nguoi_phu_trach_id) values ($1,$2,$3,$4,'mkt',$5,$6) returning id`, [ma, ten, dt, VINH, hang, u(1)]))[0].id;
  K1 = await k("KH1", "Nguyễn Thị Thuỳ Nga", "0914420789", "Kim cương");
  K2 = await k("KH2", "Trần Văn Bình", "0900000002", null);
  K3 = await k("KH3", "Lê Thị Mới", "0900000003", "Bạc");
  GOI = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('LT30','Chăm sóc da 30 buổi','lan',9588000,30) returning id`))[0].id;
  const goiTien = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi, gia_tri_the) values ('TT10','Thẻ giá trị 10 triệu','tien',10000000,null,10000000) returning id`))[0].id;
  await q(`insert into the_khach (sh_id, ma, khach_id, goi_id, loai, chi_nhanh_id, so_buoi_tong, tong_tien, gia_tri_buoi) values (77,'M77',$1,$2,'lan',$3,30,9588000,319600),(88,'M88',$1,$4,'tien',$3,1,10000000,0)`, [K1, GOI, VINH, goiTien]);

  // Trước kỳ: K1, K2 đã mua (khách cũ). Trong kỳ 10/2026: K1 3 đơn, K2 1 đơn (có nợ), K3 khách mới 1 đơn, Đà Lạt 1 đơn.
  await hd({ ma: "SH-1", sh: "1", cn: VINH, khach: K1, ngay: "2026-08-01", tong: 1000000, thu: [{ pt: "tien_mat", tien: 1000000 }] });
  await hd({ ma: "SH-2", sh: "2", cn: VINH, khach: K2, ngay: "2026-09-01", tong: 500000, thu: [{ pt: "tien_mat", tien: 500000 }] });
  await hd({ ma: "SH-10", sh: "26100010", cn: VINH, khach: K1, ngay: "2026-10-02", tong: 3000000, thu: [{ pt: "chuyen_khoan", tien: 3000000 }] });
  await hd({ ma: "SH-11", sh: "26100011", cn: VINH, khach: K1, ngay: "2026-10-05", tong: 2000000, no: 500000, thu: [{ pt: "tien_mat", tien: 1500000 }] });
  // thu nợ đơn SH-11 vào 20/10 (tiền mặt) → "thu nợ" của Vinh
  await q(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) select id,'tien_mat',200000,'2026-10-20',$1,true from hoa_don where ma='SH-11'`, [u(1)]);
  await q(`update hoa_don set con_no = 300000, da_thu = 1700000 where ma='SH-11'`);
  await hd({ ma: "SH-12", sh: "26100012", cn: VINH, khach: K1, ngay: "2026-10-07", tong: 1000000, truThe: 400000, thu: [{ pt: "the_tien", tien: 400000 }, { pt: "quet_the", tien: 600000 }], dong: [{ ten: "Chăm sóc da", theSh: 77, sl: 2 }] });
  await hd({ ma: "SH-13", sh: "26100013", cn: VINH, khach: K2, ngay: "2026-10-09", tong: 800000, no: 800000 });
  await hd({ ma: "SH-14", sh: "26100014", cn: VINH, khach: K3, ngay: "2026-10-10", tong: 700000, thu: [{ pt: "tien_mat", tien: 700000 }] });
  await hd({ ma: "SH-15", sh: "26100015", cn: DALAT, khach: K3, ngay: "2026-10-11", tong: 900000, thu: [{ pt: "tien_mat", tien: 900000 }] });
  await q(`with n as (insert into nhom_khach (ten) values ('VIP test') returning id) insert into khach_nhom (khach_id, nhom_id) select $1, id from n`, [K1]);
});

describe("bc_theo_chi_nhanh", () => {
  it("đơn · đã thu (kể cả thu nợ) · còn nợ · doanh thu sau trừ thẻ · tách bán hàng / thu nợ", async () => {
    const r = await q(`select ten, so_nhan_vien, so_don, da_thu::int, con_no::int, doanh_thu::int, tm_ban::int, tm_no::int, ck_ban::int, ck_no::int from bc_theo_chi_nhanh('2026-10-01','2026-10-31')`);
    const vinh = r.find((x) => x.ten === "AMIA Vinh");
    // Vinh: 5 đơn (3M + 2M + 1M + 0,8M + 0,7M = 7,5M) − trừ thẻ 0,4M; đã thu = 3M + 1.5M + 0.2M + 0.6M + 0.7M
    expect(vinh).toMatchObject({ so_nhan_vien: 2, so_don: 5, doanh_thu: 7100000, con_no: 1100000, da_thu: 6000000, tm_ban: 2200000, tm_no: 200000, ck_ban: 3600000, ck_no: 0 });
    expect(r.find((x) => x.ten === "AMIA Đà Lạt")).toMatchObject({ so_nhan_vien: 1, so_don: 1, da_thu: 900000, doanh_thu: 900000, con_no: 0 });
  });
  it("đồng nhất với bc_doanh_thu_ngay (doanh thu và thực thu)", async () => {
    const [a] = await q(`select sum(doanh_thu)::int dt, sum(thuc_thu)::int tt from bc_doanh_thu_ngay('2026-10-01','2026-10-31',$1)`, [VINH]);
    const [b] = await q(`select doanh_thu::int dt, da_thu::int tt from bc_theo_chi_nhanh('2026-10-01','2026-10-31') where chi_nhanh_id=$1`, [VINH]);
    expect(b).toEqual(a);
  });
});

describe("bc_theo_khach_hang", () => {
  it("một dòng mỗi khách, số tổng, khách mới / cũ, thu nợ", async () => {
    const r = await q<Record<string, string | number | boolean | null>>(`select * from bc_theo_khach_hang('2026-10-01','2026-10-31',$1)`, [VINH]);
    expect(r.map((x) => [x.ho_ten, x.hang, x.so_don, Number(x.doanh_thu), Number(x.thuc_thu), Number(x.thu_no), x.la_moi])).toEqual([
      ["Nguyễn Thị Thuỳ Nga", "Kim cương", 3, 5600000, 5300000, 200000, false],
      ["Trần Văn Bình", "Thường", 1, 800000, 0, 0, false],
      ["Lê Thị Mới", "Bạc", 1, 700000, 700000, 0, true],
    ]);
    expect(r[0]).toMatchObject({ tong_dong: 3, t_khach: 3, t_khach_moi: 1, t_khach_cu: 2 });
    expect(Number(r[0].t_doanh_thu)).toBe(7100000);
    expect(Number(r[0].t_dt_moi)).toBe(700000);
    expect(Number(r[0].t_thu_no)).toBe(200000);
  });
  it("lọc hạng, nhóm, tìm không dấu, phân trang giữ nguyên số tổng", async () => {
    expect((await q(`select ho_ten from bc_theo_khach_hang('2026-10-01','2026-10-31',null,null,'Thường')`)).map((x) => x.ho_ten)).toEqual(["Trần Văn Bình"]);
    expect((await q(`select ho_ten from bc_theo_khach_hang('2026-10-01','2026-10-31',null,(select array_agg(id) from nhom_khach))`)).map((x) => x.ho_ten)).toEqual(["Nguyễn Thị Thuỳ Nga"]);
    const t = await q<{ ho_ten: string; tong_dong: string; t_khach: string }>(`select ho_ten, tong_dong, t_khach from bc_theo_khach_hang('2026-10-01','2026-10-31',null,null,null,'thuy nga')`);
    expect(t).toEqual([{ ho_ten: "Nguyễn Thị Thuỳ Nga", tong_dong: 1, t_khach: 3 }]);
    const p2 = await q<{ ho_ten: string; tong_dong: string }>(`select ho_ten, tong_dong from bc_theo_khach_hang('2026-10-01','2026-10-31',null,null,null,null,1,1)`);
    expect(p2.length).toBe(1);
    expect(Number(p2[0].tong_dong)).toBe(3);
    expect((await q(`select 1 from bc_theo_khach_hang('2026-10-01','2026-10-31',null,null,null,'0914420789')`)).length).toBe(1);
  });
});

describe("bc_lich_su_dung_the", () => {
  it("thẻ lần: số lần × làm tròn(giá thẻ ÷ số buổi); thẻ tiền: số tiền trừ (khách chỉ có một thẻ tiền thì gán thẻ đó)", async () => {
    const r = await q<Record<string, string | number | null>>(`select ma_hd, ten_the, ma_the, loai_the, so_lan, tien::int, tong_dong, tong_lan, tong_tien from bc_lich_su_dung_the('2026-10-01','2026-10-31')`);
    expect(r.length).toBe(2);
    const lan = r.find((x) => x.loai_the === "lan")!, tien = r.find((x) => x.loai_the === "tien")!;
    expect(lan).toMatchObject({ ma_hd: "26100012", ten_the: "Chăm sóc da 30 buổi", ma_the: "M77", so_lan: 2, tien: 639200 });
    expect(tien).toMatchObject({ ma_hd: "26100012", ten_the: "Thẻ giá trị 10 triệu", ma_the: "M88", so_lan: 1, tien: 400000 });
    expect(lan).toMatchObject({ tong_dong: 2, tong_lan: 3, tong_tien: 1039200 });
  });
  it("lọc loại thẻ, tên thẻ, khách, kỳ ngoài khoảng, phân trang", async () => {
    expect((await q(`select 1 from bc_lich_su_dung_the('2026-10-01','2026-10-31',null,null,null,'tien')`)).length).toBe(1);
    expect((await q(`select 1 from bc_lich_su_dung_the('2026-10-01','2026-10-31',null,null,'M77')`)).length).toBe(1);
    expect((await q(`select 1 from bc_lich_su_dung_the('2026-10-01','2026-10-31',null,'thuy nga')`)).length).toBe(2);
    expect((await q(`select 1 from bc_lich_su_dung_the('2026-10-01','2026-10-31',null,'binh')`)).length).toBe(0);
    expect((await q(`select 1 from bc_lich_su_dung_the('2026-11-01','2026-11-30')`)).length).toBe(0);
    expect((await q(`select 1 from bc_lich_su_dung_the('2026-10-01','2026-10-31',null,null,null,null,1,0)`)).length).toBe(1);
  });
});
