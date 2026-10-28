import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// [G3] Tài khoản ngân hàng: chức năng Quẹt thẻ / Chuyển khoản và đúng MỘT tài khoản mặc định (migration 0130).
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
beforeAll(async () => { db = await taoDbVoiMigration(); }, 60000);

describe("tài khoản ngân hàng", () => {
  it("cột mới có mặc định như hộp Thêm tài khoản: quẹt thẻ + chuyển khoản, chưa mặc định", async () => {
    const r = (await q<{ dung_quet_the: boolean; dung_chuyen_khoan: boolean; mac_dinh: boolean }>(`insert into tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan) values ('Ngân hàng OCB','123456789','A') returning dung_quet_the, dung_chuyen_khoan, mac_dinh`))[0];
    expect(r).toEqual({ dung_quet_the: true, dung_chuyen_khoan: true, mac_dinh: false });
  });
  it("chỉ cho một tài khoản mặc định", async () => {
    await db.query(`insert into tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan, mac_dinh) values ('Ngân hàng ACB','111111','B', true)`);
    await expect(db.query(`insert into tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan, mac_dinh) values ('Ngân hàng BIDV','222222','C', true)`)).rejects.toThrow();
    expect((await q<{ n: number }>(`select count(*) n from tai_khoan_ngan_hang where mac_dinh`))[0].n).toBe(1);
    await db.query(`update tai_khoan_ngan_hang set mac_dinh=false where mac_dinh`);
    await db.query(`update tai_khoan_ngan_hang set mac_dinh=true where so_tai_khoan='123456789'`);
    expect((await q<{ so_tai_khoan: number }>(`select so_tai_khoan from tai_khoan_ngan_hang where mac_dinh`)).map((r) => r.so_tai_khoan)).toEqual(["123456789"]);
  });
});
