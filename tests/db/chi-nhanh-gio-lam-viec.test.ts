import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// Giờ làm việc theo từng chi nhánh + "Hiện thị ở web đặt lịch" (migration 0120): chỉ đổi cách tính khung giờ trống của khách đặt online.
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, CN2: string;
const ngayVN = async (n: number) => (await q<{ d: string }>(`select ((now() at time zone 'Asia/Ho_Chi_Minh')::date + $1::int)::text d`, [n]))[0].d;
const thuCua = async (d: string) => ["t2", "t3", "t4", "t5", "t6", "t7", "cn"][(await q<{ x: number }>(`select extract(isodow from $1::date)::int x`, [d]))[0].x - 1];
const gioTrong = async (cn: string, ngay: string, phut = 60) => (await q<{ gio_trong_online: string }>(`select * from public.gio_trong_online($1,$2::date,$3)`, [cn, ngay, phut])).map((r) => r.gio_trong_online);
const datGio = (cn: string, v: unknown) => db.query(`update chi_nhanh set gio_lam_viec = $2::jsonb where id = $1`, [cn, v === null ? null : JSON.stringify(v)]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh order by ma limit 1`))[0].id;
  CN2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('CN2','Chi nhánh hai') returning id`))[0].id;
  await db.query(`insert into cho_lam (chi_nhanh_id, ten) values ($1,'G1'), ($2,'G1')`, [CN, CN2]);
  await db.query(`update cau_hinh set gia_tri='1' where khoa='dat_online.mo'`);
  await db.query(`update cua_hang set gio_lam_viec = '{"mo":"08:00","dong":"20:00","nghi":[]}'::jsonb where id = 1`);
}, 60000);

describe("giờ làm việc theo chi nhánh", () => {
  it("cột mới có mặc định đúng: hiện ở web đặt lịch, chưa có giờ riêng", async () => {
    const r = (await q<{ hien_dat_lich: boolean; gio_lam_viec: unknown }>(`select hien_dat_lich, gio_lam_viec from chi_nhanh where id=$1`, [CN]))[0];
    expect(r.hien_dat_lich).toBe(true); expect(r.gio_lam_viec).toBeNull();
  });
  it("chưa có giờ riêng thì dùng giờ chung như trước", async () => {
    const g = await gioTrong(CN, await ngayVN(5));
    expect(g[0]).toBe("08:00"); expect(g.at(-1)).toBe("19:00");
  });
  it("giờ riêng của đúng thứ đó thắng giờ chung; thứ khác vẫn dùng giờ chung", async () => {
    const d = await ngayVN(5), t = await thuCua(d);
    await datGio(CN, { [t]: { mo: "09:00", dong: "12:00" } });
    const g = await gioTrong(CN, d);
    expect(g[0]).toBe("09:00"); expect(g.at(-1)).toBe("11:00");
    const khac = await ngayVN(6);
    expect((await gioTrong(CN, khac))[0]).toBe("08:00");
    expect(await gioTrong(CN2, d)).toContain("08:00");
  });
  it("thứ đánh dấu nghỉ thì không có giờ; nghỉ riêng của chi nhánh không làm chi nhánh khác nghỉ", async () => {
    const d = await ngayVN(5), t = await thuCua(d);
    await datGio(CN, { [t]: { nghi: true } });
    expect(await gioTrong(CN, d)).toEqual([]);
    expect((await gioTrong(CN2, d)).length).toBeGreaterThan(0);
  });
  it("giờ riêng của chi nhánh mở lại được ngày mà giờ chung đang nghỉ", async () => {
    const d = await ngayVN(5), t = await thuCua(d);
    await db.query(`update cua_hang set gio_lam_viec = jsonb_set(gio_lam_viec, '{nghi}', $1::jsonb) where id = 1`, [JSON.stringify([t])]);
    expect(await gioTrong(CN2, d)).toEqual([]);
    await datGio(CN, { [t]: { mo: "10:00", dong: "11:00" } });
    expect(await gioTrong(CN, d)).toEqual(["10:00"]);
    await db.query(`update cua_hang set gio_lam_viec = jsonb_set(gio_lam_viec, '{nghi}', '[]'::jsonb) where id = 1`);
  });
  it("tắt 'Hiện thị ở web đặt lịch' thì không có khung giờ nào, bật lại có lại", async () => {
    const d = await ngayVN(5);
    await datGio(CN, null);
    await db.query(`update chi_nhanh set hien_dat_lich = false where id = $1`, [CN]);
    expect(await gioTrong(CN, d)).toEqual([]);
    await db.query(`update chi_nhanh set hien_dat_lich = true where id = $1`, [CN]);
    expect((await gioTrong(CN, d)).length).toBeGreaterThan(0);
  });
  it("giờ riêng phải là một đối tượng JSON", async () => {
    await expect(db.query(`update chi_nhanh set gio_lam_viec = '[1]'::jsonb where id = $1`, [CN])).rejects.toThrow();
  });
});
