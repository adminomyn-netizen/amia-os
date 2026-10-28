import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0068: báo cáo theo thu ngân (người hoàn tất đơn SalonHero / người lập trong app), thống kê đặt lịch, thống kê dùng dịch vụ.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, KH: string, DV: string;
const NV = { thuNgan: u(1), ktv: u(2) };

async function hdLichSu(o: { sh: number; ngay: string; tong: number; truThe?: number; no?: number; tnSh?: number; tnTen?: string; dong?: { ten: string; gia: number; theSh?: number; nv?: string }[] }) {
  const tt = o.tong - (o.truThe ?? 0);
  const h = (await q<{ id: string }>(
    `insert into hoa_don (sh_id, ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su, tien_tru_the, thu_ngan_sh_id, thu_ngan_ten)
     values ($1, $12, $2, $3, 'hoan_thanh', $4, $5, $5, $6, $7, $8, true, $9, $10, $11) returning id`,
    [o.sh, CN, KH, o.ngay, o.tong, tt - (o.no ?? 0), o.no ?? 0, NV.thuNgan, o.truThe ?? 0, o.tnSh ?? null, o.tnTen ?? null, `SH-${o.sh}`]))[0].id;
  for (const [i, d] of (o.dong ?? []).entries()) {
    const dg = (await q<{ id: string }>(
      `insert into hoa_don_dong (sh_id, hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia, la_lich_su, the_khach_sh_id) values ($1, $2, 'dich_vu', $3, $4, 1, $5, true, $6) returning id`,
      [o.sh * 10 + i, h, DV, d.ten, d.gia, d.theSh ?? null]))[0].id;
    if (d.nv) await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1, $2, 'phuc_vu', 100)`, [dg, d.nv]);
  }
  // phần trừ thẻ tiền nằm ở cột tien_tru_the (như bộ nhập); tiền thật thu = tổng − nợ
  const thu = o.tong - (o.no ?? 0);
  if (thu > 0) await q(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) values ($1, 'tien_mat', $2, $3, $4, true)`, [h, thu, o.ngay, NV.thuNgan]);
  return h;
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${NV.thuNgan}','Thu Ngân App','thu_ngan',$1),('${NV.ktv}','KTV Lan','ktv',$1)`, [CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV.thuNgan]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom limit 1`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL',$1,'Peel da',1000000) returning id`, [nhom]))[0].id;
  const goi = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('LT10','Liệu trình 10 buổi','lan',3000000,10) returning id`))[0].id;
  await q(`insert into the_khach (sh_id, ma, khach_id, goi_id, loai, chi_nhanh_id, so_buoi_tong, gia_tri_buoi) values (77, 'T77', $1, $2, 'lan', $3, 10, 300000)`, [KH, goi, CN]);

  // Hai đơn cùng tài khoản SalonHero 500 (đổi tên giữa kỳ), một đơn của tài khoản 600, một đơn trừ thẻ tiền + nợ.
  await hdLichSu({ sh: 1, ngay: "2025-10-02", tong: 1000000, tnSh: 500, tnTen: "Thu ngân cũ", dong: [{ ten: "Peel da", gia: 1000000, nv: NV.ktv }] });
  await hdLichSu({ sh: 2, ngay: "2025-10-20", tong: 2000000, truThe: 500000, no: 300000, tnSh: 500, tnTen: "Thu ngân Đà Lạt", dong: [{ ten: "Peel da", gia: 0, theSh: 77, nv: NV.ktv }, { ten: "Peel da", gia: 2000000 }] });
  await hdLichSu({ sh: 3, ngay: "2025-10-05", tong: 700000, tnSh: 600, tnTen: "Vân Anh" });
  // Công nợ đầu kỳ không tính.
  await q(`insert into hoa_don (sh_id, ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, con_no, nguoi_lap_id, la_so_du_dau) values (9, 'NO-9', $1, $2, 'hoan_thanh', '2025-10-03', 0, 50000, 50000, $3, true)`, [CN, KH, NV.thuNgan]);

  // Lịch hẹn: giờ Việt Nam — 00:30 ngày 01/11 (VN) là 17:30 UTC ngày 31/10, phải thuộc tháng 11.
  const lich = (bd: string, tt: string, nguon: string | null, nv: string | null, ten: string | null = null) =>
    q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nguon_dat, nhan_vien_id, nhan_vien_ten) values ($1,$2,$3::timestamptz,$3::timestamptz + interval '1 hour',$4,$5,$6,$7)`, [KH, CN, bd, tt, nguon, nv, ten]);
  await lich("2025-10-01T09:00:00+07:00", "hoan_thanh", "PHONE", NV.ktv);
  await lich("2025-10-15T09:00:00+07:00", "huy", "PHONE", null, "Nhân viên cũ");
  await lich("2025-10-31T23:30:00+07:00", "khong_den", "MESSENGER", null);
  await lich("2025-11-01T00:30:00+07:00", "da_xac_nhan", "WEB", null);
});

describe("báo cáo theo thu ngân", () => {
  it("gom theo mã tài khoản SalonHero, hiện tên mới nhất; doanh số / trừ thẻ / sau trừ thẻ / nợ / đã thu", async () => {
    const r = await q(`select khoa, thu_ngan, cac_ten, so_don, doanh_so::int, tru_the_tien::int, doanh_thu::int, con_no::int, da_thu::int from bc_thu_ngan('2025-10-01','2025-10-31',null,'tong')`);
    expect(r).toEqual([
      { khoa: "sh:500", thu_ngan: "Thu ngân Đà Lạt", cac_ten: "Thu ngân cũ, Thu ngân Đà Lạt", so_don: 2, doanh_so: 3000000, tru_the_tien: 500000, doanh_thu: 2500000, con_no: 300000, da_thu: 2200000 },
      { khoa: "sh:600", thu_ngan: "Vân Anh", cac_ten: "Vân Anh", so_don: 1, doanh_so: 700000, tru_the_tien: 0, doanh_thu: 700000, con_no: 0, da_thu: 700000 },
    ]);
  });
  it("nhóm theo ngày tách kỳ", async () => {
    const r = await q(`select ky::text, khoa, so_don from bc_thu_ngan('2025-10-01','2025-10-31',null,'ngay') order by 1, 2`);
    expect(r.map((x) => `${x.ky}|${x.khoa}|${x.so_don}`)).toEqual(["2025-10-02|sh:500|1", "2025-10-05|sh:600|1", "2025-10-20|sh:500|1"]);
  });
});

describe("thống kê đặt lịch", () => {
  it("đếm theo trạng thái, nguồn, nhân viên, kỳ theo giờ Việt Nam", async () => {
    const r = await q(`select chieu, khoa, nhan, so_lich, hoan_thanh, huy, khong_den, chua_den from bc_dat_lich('2025-10-01','2025-10-31',null,'thang')`);
    const tim = (c: string, k: string) => r.find((x) => x.chieu === c && x.khoa === k);
    expect(tim("tong", "")).toMatchObject({ so_lich: 3, hoan_thanh: 1, huy: 1, khong_den: 1, chua_den: 0 });
    expect(tim("nguon", "PHONE")).toMatchObject({ so_lich: 2 });
    expect(tim("ky", "2025-10-01")).toMatchObject({ so_lich: 3 });
    expect(tim("nhan_vien", NV.ktv)).toMatchObject({ nhan: "KTV Lan", so_lich: 1 });
    expect(tim("nhan_vien", "ten:Nhân viên cũ")).toMatchObject({ nhan: "Nhân viên cũ", huy: 1 });
    expect(r.filter((x) => x.chieu === "trang_thai").length).toBe(3);
  });
});

describe("thống kê dùng dịch vụ", () => {
  it("tách dùng thẻ / trả tiền, giá trị thẻ theo giá buổi, theo người làm", async () => {
    const r = await q(`select chieu, khoa, nhan, luot_the::int, luot_tien::int, doanh_so::int, gia_tri_the::int from bc_dung_dich_vu('2025-10-01','2025-10-31',null,'thang')`);
    const tim = (c: string, k: string) => r.find((x) => x.chieu === c && x.khoa === k);
    expect(tim("tong", "")).toMatchObject({ luot_the: 1, luot_tien: 2, doanh_so: 3000000, gia_tri_the: 300000 });
    expect(tim("dich_vu", DV)).toMatchObject({ nhan: "Peel da", luot_the: 1, luot_tien: 2 });
    expect(tim("nhan_vien", NV.ktv)).toMatchObject({ luot_the: 1, luot_tien: 1, doanh_so: 1000000, gia_tri_the: 300000 });
    expect(tim("nhan_vien", "")).toMatchObject({ nhan: "Chưa gán người làm", luot_tien: 1, doanh_so: 2000000 });
  });
});
