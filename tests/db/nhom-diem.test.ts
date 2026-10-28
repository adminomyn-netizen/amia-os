import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0065: nhóm khách + sổ điểm thưởng (chỉ thêm dòng, số dư trên khách, gỡ đợt được).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string) => { try { await db.exec(sql); } catch (e) { return (e as Error).message; } return ""; };
let KH: string;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  const cn = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Tư Vấn','tu_van',$1)`, [cn]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt','${u(1)}') returning id`, [cn]))[0].id;
  await q(`insert into nhap_dot (ma) values ('SH-T-13')`);
});

describe("nhóm khách + sổ điểm thưởng", () => {
  it("số dư điểm = tổng sổ điểm, cộng theo lô", async () => {
    await q(`insert into khach_diem_so (sh_id, khach_id, loai, so_diem, nhap_dot) values (1,$1,'cong_hoa_don',30,'SH-T-13'),(2,$1,'hoan_hoa_don',-10,'SH-T-13'),(3,$1,'sua_tay',5,'SH-T-13')`, [KH]);
    await q(`insert into khach_diem_so (khach_id, loai, so_diem) values ($1,'dieu_chinh',7)`, [KH]);
    expect((await q<{ diem_so_du: number }>(`select diem_so_du from khach_hang where id=$1`, [KH]))[0].diem_so_du).toBe(32);
  });
  it("sổ điểm chỉ thêm dòng: không sửa, không xoá", async () => {
    expect(await loi(`update khach_diem_so set so_diem = 1`)).toMatch(/chỉ được thêm dòng/);
    expect(await loi(`delete from khach_diem_so`)).toMatch(/chỉ được thêm dòng/);
  });
  it("gỡ đợt xoá sổ điểm + nhóm của đợt và tính lại số dư", async () => {
    const nh = (await q<{ id: string }>(`insert into nhom_khach (sh_id, ten, nhap_dot) values (4187,'SHOPPER','SH-T-13') returning id`))[0].id;
    await q(`insert into khach_nhom (khach_id, nhom_id, nhap_dot) values ($1,$2,'SH-T-13')`, [KH, nh]);
    const r = (await q<{ r: Record<string, number> }>(`select go_dot_nhap('SH-T-13') r`))[0].r;
    expect(r.khach_diem_so).toBe(3);
    expect(r.khach_nhom).toBe(1);
    expect(r.nhom_khach).toBe(1);
    expect((await q<{ diem_so_du: number }>(`select diem_so_du from khach_hang where id=$1`, [KH]))[0].diem_so_du).toBe(7);
    expect(await loi(`delete from khach_diem_so`)).toMatch(/chỉ được thêm dòng/);
  });
});
