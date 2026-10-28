import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// [G3] Nhân viên phục vụ: 3 cột mới của nhan_vien (migration 0131) có mặc định đúng, không đụng cột cũ.
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
beforeAll(async () => { db = await taoDbVoiMigration(); }, 60000);

describe("nhân viên phục vụ", () => {
  it("người mới mặc định: chưa vào danh sách phục vụ, chưa có nhóm, hiện ở trang đặt lịch", async () => {
    const r = (await q<{ la_phuc_vu: boolean; nhom_nv: string | null; hien_dat_lich: boolean; hoat_dong: boolean }>(`insert into nhan_vien (ho_ten, vai_tro) values ('Thử A','ktv') returning la_phuc_vu, nhom_nv, hien_dat_lich, hoat_dong`))[0];
    expect(r).toEqual({ la_phuc_vu: false, nhom_nv: null, hien_dat_lich: true, hoat_dong: true });
  });
  it("đặt vào danh sách rồi bỏ ra không ảnh hưởng đăng nhập (hoat_dong)", async () => {
    await db.query(`update nhan_vien set la_phuc_vu = true, nhom_nv = 'Nhóm thợ 1' where ho_ten = 'Thử A'`);
    await db.query(`update nhan_vien set la_phuc_vu = false where ho_ten = 'Thử A'`);
    const r = (await q<{ hoat_dong: boolean; nhom_nv: string }>(`select hoat_dong, nhom_nv from nhan_vien where ho_ten='Thử A'`))[0];
    expect(r).toEqual({ hoat_dong: true, nhom_nv: "Nhóm thợ 1" });
  });
});
