import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// Migration 0179: thanh_toan.ngan_hang — ngân hàng nhận tiền của khoản chuyển khoản / quẹt thẻ. Bảng vẫn chỉ-thêm.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let hd: string;
const ghi = (pt: string, nh: string | null) => db.query(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, ngan_hang, la_lich_su) values ($1,'thu',$2,1000,'2026-10-20',$3,$4,true)`, [hd, pt, u(1), nh]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  const cn = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Thu Ngân','thu_ngan',$2)`, [u(1), cn]);
  hd = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su) values ('NH1',$1,'hoan_thanh','2026-10-20',10000,10000,0,10000,$2,true) returning id`, [cn, u(1)]))[0].id;
}, 60000);

describe("thanh_toan.ngan_hang", () => {
  it("ghi và đọc lại đúng; không có ngân hàng thì null", async () => {
    await ghi("chuyen_khoan", "Techcombank");
    await ghi("tien_mat", null);
    const r = await q<{ phuong_thuc: string; ngan_hang: string | null }>(`select phuong_thuc, ngan_hang from thanh_toan where hoa_don_id=$1 order by phuong_thuc`, [hd]);
    expect(r).toEqual([{ phuong_thuc: "chuyen_khoan", ngan_hang: "Techcombank" }, { phuong_thuc: "tien_mat", ngan_hang: null }]);
  });
  it("chặn chuỗi rỗng hoặc quá dài", async () => {
    await expect(ghi("chuyen_khoan", "")).rejects.toThrow();
    await expect(ghi("chuyen_khoan", "x".repeat(61))).rejects.toThrow();
  });
  it("bảng vẫn chỉ-thêm: sửa ngan_hang hay xoá khoản thu đều bị chặn", async () => {
    await expect(db.query(`update thanh_toan set ngan_hang='BIDV' where hoa_don_id=$1`, [hd])).rejects.toThrow();
    await expect(db.query(`delete from thanh_toan where hoa_don_id=$1`, [hd])).rejects.toThrow();
  });
  it("có chỉ mục lọc theo ngân hàng + ngày", async () => {
    expect((await q(`select 1 from pg_indexes where tablename='thanh_toan' and indexname='thanh_toan_ngan_hang_idx'`)).length).toBe(1);
  });
});

describe("migration 0181: bảng tên xuất riêng", () => {
  let dong: string;
  beforeAll(async () => { dong = (await q<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, ten, so_luong, don_gia, giam_gia, la_lich_su) values ($1,'dich_vu','Filler',1,1000,0,true) returning id`, [hd]))[0].id; });
  it("mỗi hoá đơn / dòng hàng chỉ một bản sửa; MST đúng dạng; độ dài", async () => {
    await db.query(`insert into hoa_don_xuat_tuy_chinh (hoa_don_id, ten_nguoi_mua, ma_so_thue) values ($1,'Công ty Hoa','0123456789-001')`, [hd]);
    await expect(db.query(`insert into hoa_don_xuat_tuy_chinh (hoa_don_id, ten_nguoi_mua) values ($1,'Trùng')`, [hd])).rejects.toThrow();
    await db.query(`delete from hoa_don_xuat_tuy_chinh where hoa_don_id=$1`, [hd]);
    for (const m of ["0123456789", "001234567890"]) await db.query(`insert into hoa_don_xuat_tuy_chinh (hoa_don_id, ma_so_thue) values ($1,$2)`, [hd, m]).then(() => db.query(`delete from hoa_don_xuat_tuy_chinh where hoa_don_id=$1`, [hd]));
    for (const m of ["12345", "0123456789-1", "01234567890"]) await expect(db.query(`insert into hoa_don_xuat_tuy_chinh (hoa_don_id, ma_so_thue) values ($1,$2)`, [hd, m])).rejects.toThrow();
    await expect(db.query(`insert into hoa_don_xuat_tuy_chinh (hoa_don_id, ten_nguoi_mua) values ($1,$2)`, [hd, "x".repeat(201)])).rejects.toThrow();
    await db.query(`insert into hoa_don_xuat_dong (hoa_don_dong_id, ten_xuat) values ($1,'Tiêm filler môi')`, [dong]);
    await expect(db.query(`insert into hoa_don_xuat_dong (hoa_don_dong_id, ten_xuat) values ($1,'Trùng')`, [dong])).rejects.toThrow();
    await expect(db.query(`update hoa_don_xuat_dong set ten_xuat='' where hoa_don_dong_id=$1`, [dong])).rejects.toThrow();
  });
  it("sửa tên xuất không đổi tên trong đơn bán", async () => {
    expect((await q<{ ten: string }>(`select ten from hoa_don_dong where id=$1`, [dong]))[0].ten).toBe("Filler");
  });
  it("xoá dòng hàng thì bản sửa đi theo", async () => {
    await db.query(`delete from hoa_don_dong where id=$1`, [dong]);
    expect((await q(`select 1 from hoa_don_xuat_dong where hoa_don_dong_id=$1`, [dong])).length).toBe(0);
  });
});
