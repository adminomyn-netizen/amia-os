/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

let db: PGlite;
let nv: string;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;
const loiMa = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); return null; } catch (e: any) { return e.code as string; } };
beforeAll(async () => { db = await taoDbVoiMigration(); nv = (await q(`insert into nhan_vien (ho_ten, vai_tro) values ('Lễ tân thử', 'le_tan') returning id`))[0].id; });

describe("chuông thông báo: đã đọc / xoá theo từng nhân viên", () => {
  it("mỗi nhân viên một dòng cho mỗi loại việc; ghi đè khi đổi trạng thái", async () => {
    await q(`insert into thong_bao_trang_thai (nhan_vien_id, ma, dau_van, trang_thai) values ($1, 'no', '151 hoá đơn còn nợ', 'da_doc')`, [nv]);
    expect(await loiMa(`insert into thong_bao_trang_thai (nhan_vien_id, ma, dau_van, trang_thai) values ($1, 'no', 'x', 'da_xoa')`, [nv])).toBe("23505");
    await q(`update thong_bao_trang_thai set trang_thai = 'da_xoa' where nhan_vien_id = $1 and ma = 'no'`, [nv]);
    expect((await q(`select trang_thai from thong_bao_trang_thai where nhan_vien_id = $1`, [nv]))[0].trang_thai).toBe("da_xoa");
  });
  it("chỉ nhận loại việc và trạng thái hợp lệ", async () => {
    expect(await loiMa(`insert into thong_bao_trang_thai (nhan_vien_id, ma, dau_van, trang_thai) values ($1, 'la', 'x', 'da_doc')`, [nv])).toBe("23514");
    expect(await loiMa(`insert into thong_bao_trang_thai (nhan_vien_id, ma, dau_van, trang_thai) values ($1, 'kho', 'x', 'la')`, [nv])).toBe("23514");
  });
  it("xoá nhân viên thì dọn trạng thái của họ", async () => {
    await q(`delete from nhan_vien where id = $1`, [nv]);
    expect((await q(`select count(*)::int n from thong_bao_trang_thai`))[0].n).toBe(0);
  });
});
