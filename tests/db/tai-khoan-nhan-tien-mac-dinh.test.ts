import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { tenTaiKhoan } from "../../src/lib/hoa-don-dien-tu-ngan-hang";

// Migration 0183: seed 3 tài khoản nhận tiền (OCB, Techcombank, VCB) khi bảng trống; sửa được như tài khoản khác (ẩn, đổi tên, xoá).
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
beforeAll(async () => { db = await taoDbVoiMigration(); }, 60000);

describe("tài khoản nhận tiền mặc định", () => {
  it("có đúng 3 tài khoản OCB, Techcombank, Vietcombank theo thứ tự, đang hoạt động, OCB ghi chú tiêm cấy", async () => {
    const r = await q<{ ngan_hang: string; ghi_chu: string | null; hoat_dong: boolean; dung_chuyen_khoan: boolean }>(`select ngan_hang, ghi_chu, hoat_dong, dung_chuyen_khoan from tai_khoan_ngan_hang order by tao_luc`);
    expect(r.map((x) => x.ngan_hang)).toEqual(["Ngân hàng OCB", "Ngân hàng Techcombank", "Ngân hàng Vietcombank"]);
    expect(r[0].ghi_chu).toMatch(/tiêm, cấy/);
    expect(r.every((x) => x.hoat_dong && x.dung_chuyen_khoan)).toBe(true);
    expect(tenTaiKhoan(r)).toEqual(["OCB", "Techcombank", "Vietcombank"]);
  });
  it("ẩn một tài khoản thì không còn trong danh sách đang dùng; thêm / đổi tên được", async () => {
    await db.query(`update tai_khoan_ngan_hang set hoat_dong=false where ngan_hang='Ngân hàng OCB'`);
    await db.query(`insert into tai_khoan_ngan_hang (ngan_hang, so_tai_khoan, chu_tai_khoan) values ('Ngân hàng ACB','123456789','Cty')`);
    await db.query(`update tai_khoan_ngan_hang set ngan_hang='Ngân hàng MBBank' where ngan_hang='Ngân hàng Techcombank'`);
    const r = await q<{ ngan_hang: string }>(`select ngan_hang from tai_khoan_ngan_hang where hoat_dong order by tao_luc`);
    expect(tenTaiKhoan(r)).toEqual(["MBBank", "Vietcombank", "ACB"]);
  });
});
