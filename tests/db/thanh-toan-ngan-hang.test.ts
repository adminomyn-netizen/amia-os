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
