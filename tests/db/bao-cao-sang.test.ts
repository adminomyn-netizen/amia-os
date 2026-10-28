import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0074: báo cáo sáng (hôm qua / hôm nay), lưu bản 07:00.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
type BC = { hom_qua: Record<string, number>; hom_nay: Record<string, number | string[]> };
const tinh = async (cn: string | null = null) => (await q<{ r: BC }>(`select bao_cao_sang_tinh(null, $1::uuid) r`, [cn]))[0].r;
let CN: string, CN2: string, K1: string;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  CN2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('DL2','Đà Lạt 2') returning id`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Lễ tân','le_tan',$1)`, [CN]);
  K1 = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, ngay_sinh, tao_luc) values ('K1','Khách Sinh Nhật','0900000001',$1,'mkt','${u(1)}', (hom_nay() - interval '30 years')::date, now() - interval '1 day') returning id`, [CN]))[0].id;
  await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K2','Khách Hai','0900000002',$1,'mkt','${u(1)}')`, [CN2]);
  const hq = `((hom_nay() - 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') + interval '10 hours'`;
  const hn = `(hom_nay()::timestamp at time zone 'Asia/Ho_Chi_Minh') + interval '10 hours'`;
  for (const [tt, k, cn] of [["hoan_thanh", K1, CN], ["hoan_thanh", K1, CN], ["huy", K1, CN], ["khong_den", K1, CN]] as const)
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, ${hq}, ${hq} + interval '1 hour', $3)`, [k, cn, tt]);
  await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, ${hn}, ${hn} + interval '1 hour', 'da_xac_nhan')`, [K1, CN]);
  await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, ${hn}, ${hn} + interval '1 hour', 'huy')`, [K1, CN]);
  await q(`insert into khach_nhac (khach_id, noi_dung, trang_thai, ngay_nhac, chi_nhanh_id) values ($1,'hôm nay','dang_nhac', ${hn}, $2), ($1,'quá hạn','dang_nhac', ${hq}, $2), ($1,'lịch sử cũ','dang_nhac', ${hq}, $2)`, [K1, CN]);
  await q(`update khach_nhac set la_lich_su = true where noi_dung = 'lịch sử cũ'`);
});

describe("bao_cao_sang_tinh", () => {
  it("hôm qua: lịch hoàn thành/huỷ/không đến và khách mới đúng; không đếm lịch hôm nay", async () => {
    const r = await tinh();
    expect(r.hom_qua).toMatchObject({ lich_hoan_thanh: 2, lich_huy: 1, lich_khong_den: 1, khach_moi: 1, so_hoa_don: 0 });
  });
  it("hôm nay: lịch (bỏ huỷ), sinh nhật, nhắc đến hạn và quá hạn (bỏ nhắc lịch sử)", async () => {
    const r = await tinh();
    expect(r.hom_nay).toMatchObject({ so_lich: 1, sinh_nhat: 1, nhac_den_han: 1, nhac_qua_han: 1, the_sap_het: 0, tai_kham: 0 });
    expect(r.hom_nay.sinh_nhat_ten).toEqual(["Khách Sinh Nhật"]);
  });
  it("lọc chi nhánh và không có số điện thoại hay tiền trong kết quả", async () => {
    const r2 = await tinh(CN2);
    expect(r2.hom_nay.so_lich).toBe(0); expect(r2.hom_qua.khach_moi).toBe(0);
    const txt = JSON.stringify(await tinh());
    expect(txt).not.toMatch(/0900000001|dien_thoai|tien|doanh/);
  });
  it("lưu bản sáng: 1 bản tất cả + mỗi chi nhánh, chạy lại không nhân đôi", async () => {
    const n = (await q<{ n: number }>(`select luu_bao_cao_sang() n`))[0].n;
    const soCn = (await q<{ c: number }>(`select count(*)::int c from chi_nhanh where hoat_dong`))[0].c;
    expect(n).toBe(soCn + 1);
    await q(`select luu_bao_cao_sang()`);
    expect((await q<{ c: number }>(`select count(*)::int c from bao_cao_sang`))[0].c).toBe(soCn + 1);
  });
});
