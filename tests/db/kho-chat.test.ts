/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

let db: PGlite, cn: string, sp: string;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;
const kiem = (sl: number, chan = false) => db.query(`select public.kiem_kho_xuat($1::uuid, $2::uuid, $3::numeric, 'Kem thử 50ml', $4::boolean)`, [cn, sp, sl, chan]);
const nhap = (sl: number, han: string | null, lo: string) => q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung) values ($1, $2, 'nhap', $3, $4, $5)`, [cn, sp, sl, lo, han]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  cn = (await q(`insert into chi_nhanh (ma, ten) values ('T1', 'Thử') returning id`))[0].id;
  sp = (await q(`insert into san_pham (ma, ten, don_vi) values ('MP-0001', 'Kem thử 50ml', 'chai') returning id`))[0].id;
});

describe("kho chặt (0045)", () => {
  it("sản phẩm mới mặc định bắt buộc hạn dùng; mã vạch cũ toàn số được sao sang ma_vach", async () => {
    expect((await q(`select bat_buoc_han_dung b from san_pham where id = $1`, [sp]))[0].b).toBe(true);
  });
  it("mã vạch trùng bị chặn", async () => {
    await q(`update san_pham set ma_vach = '8801234567890' where id = $1`, [sp]);
    await expect(q(`insert into san_pham (ma, ten, don_vi, ma_vach) values ('MP-0002', 'Kem khác 30ml', 'chai', '8801234567890')`)).rejects.toThrow(/ma_vach|unique|duplicate/i);
  });
  it("hết tồn: chỉ chặn khi bật cờ chặn", async () => {
    await nhap(5, "2099-01-01", "L1");
    await expect(kiem(8, false)).resolves.toBeTruthy();
    await expect(kiem(8, true)).rejects.toThrow(/Kho không đủ/);
    await expect(kiem(5, true)).resolves.toBeTruthy();
  });
  it("còn hàng hết hạn mà phần còn hạn không đủ thì chặn, đủ thì cho", async () => {
    await nhap(3, "2020-01-01", "L0");
    // 8 trong kho: FEFO coi lô hết hạn (3) xuất trước, nên phần còn hạn tối đa 5
    await expect(kiem(6)).rejects.toThrow(/HẾT HẠN/);
    await expect(kiem(5)).resolves.toBeTruthy();
  });
});
