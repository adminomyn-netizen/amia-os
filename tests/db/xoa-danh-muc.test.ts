/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

let db: PGlite;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;
const loiMa = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); return null; } catch (e: any) { return e.code as string; } };

beforeAll(async () => { db = await taoDbVoiMigration(); });

describe("xoá mục danh mục / nhân viên: DB chặn khi đã có lịch sử", () => {
  it("dịch vụ chưa dùng xoá được; nhóm còn dịch vụ thì bị chặn (23503)", async () => {
    const nhom = (await q(`insert into dich_vu_nhom (ten) values ('Nhóm thử') returning id`))[0].id;
    const dv = (await q(`insert into dich_vu (ma, nhom_id, ten, gia) values ('XOA1', $1, 'Dịch vụ thử', 1) returning id`, [nhom]))[0].id;
    expect(await loiMa(`delete from dich_vu_nhom where id = $1`, [nhom])).toBe("23503");
    expect(await loiMa(`delete from dich_vu where id = $1`, [dv])).toBeNull();
    expect(await loiMa(`delete from dich_vu_nhom where id = $1`, [nhom])).toBeNull();
  });

  it("nhân viên đã là người phụ trách khách thì không xoá được (23503); chưa gắn gì thì xoá được", async () => {
    const cn = (await q(`select id from chi_nhanh limit 1`))[0].id;
    const nv = (await q(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Có khách', 'tu_van', $1) returning id`, [cn]))[0].id;
    await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguoi_phu_trach_id, nguon) values ('K-XOA', 'Khách', '0900000001', $1, $2, 'khac')`, [cn, nv]);
    expect(await loiMa(`delete from nhan_vien where id = $1`, [nv])).toBe("23503");
    const roi = (await q(`insert into nhan_vien (ho_ten, vai_tro) values ('Chưa gắn gì', 'le_tan') returning id`))[0].id;
    expect(await loiMa(`delete from nhan_vien where id = $1`, [roi])).toBeNull();
  });
});
