/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { bienTheDonVi, chuanDonVi } from "../../src/lib/chuan-hoa-kho";

// Migration 0180: đơn vị chuẩn (khớp bản TypeScript), trigger giữ chuẩn, kiểm kê tồn đầu ghi "Tồn đầu kỳ" có lô + hạn.
let db: PGlite, cn: string, nv1: string, nv2: string, spBanLe: string, spVatTu: string;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };

beforeAll(async () => {
  db = await taoDbVoiMigration();
  cn = (await q(`insert into chi_nhanh (ma, ten) values ('T1', 'Thử') returning id`))[0].id;
  nv1 = (await q(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Đếm 1', 'thu_kho', $1) returning id`, [cn]))[0].id;
  nv2 = (await q(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Duyệt', 'quan_ly', $1) returning id`, [cn]))[0].id;
  spBanLe = (await q(`insert into san_pham (ma, ten, don_vi, ban_le, gia_ban) values ('MP-0100', 'Kem bán lẻ thử 50ml', 'chai', true, 100000) returning id`))[0].id;
  spVatTu = (await q(`insert into san_pham (ma, ten, don_vi, nhom_cap, tieu_hao) values ('VT-0100', 'Kem gây tê thử 450g', 'Gr', 'A', true) returning id`))[0].id;
});

describe("0180 đơn vị chuẩn", () => {
  it("hàm SQL cho đúng kết quả như hàm TypeScript với mọi cách viết", async () => {
    for (const [bien, chuan] of bienTheDonVi()) {
      expect((await q(`select public.chuan_don_vi($1) d`, [bien]))[0].d).toBe(chuan);
      expect(chuanDonVi(bien)).toBe(chuan);
    }
    expect((await q(`select public.chuan_don_vi('  thùng   to ') d`))[0].d).toBe("thùng to");
    expect((await q(`select public.chuan_don_vi(null) d`))[0].d).toBeNull();
  });
  it("trigger: thêm hoặc sửa sản phẩm tự đưa đơn vị về dạng chuẩn", async () => {
    expect((await q(`select don_vi from san_pham where id = $1`, [spBanLe]))[0].don_vi).toBe("Chai");
    expect((await q(`select don_vi from san_pham where id = $1`, [spVatTu]))[0].don_vi).toBe("g");
    await q(`update san_pham set don_vi = 'shoot', don_vi_mua = 'hộp' where id = $1`, [spVatTu]);
    expect((await q(`select don_vi, don_vi_mua from san_pham where id = $1`, [spVatTu]))[0]).toEqual({ don_vi: "Shot", don_vi_mua: "Hộp" });
  });
});

describe("0180 kiểm kê tồn đầu", () => {
  let phieu: string;
  it("phiếu tồn đầu: thực tế nhiều hơn sổ thì ghi dòng nhập 'Tồn đầu kỳ' kèm lô + hạn; ít hơn thì ghi kiểm kê thường", async () => {
    await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong) values ($1, $2, 'nhap', 10)`, [cn, spBanLe]);
    phieu = (await q(`select public.tao_phieu_kiem_ke($1, current_date, 'ton_dau', $2, null, 'Chốt tồn đầu') id`, [cn, nv1]))[0].id;
    expect((await q(`select loai from phieu_kiem_ke where id = $1`, [phieu]))[0].loai).toBe("ton_dau");
    await q(`update phieu_kiem_ke_dong set ton_thuc = 25, so_lo = 'L77', han_dung = '2030-01-31' where phieu_id = $1 and san_pham_id = $2`, [phieu, spVatTu]);
    await q(`update phieu_kiem_ke_dong set ton_thuc = 8 where phieu_id = $1 and san_pham_id = $2`, [phieu, spBanLe]);
    await q(`update phieu_kiem_ke set trang_thai = 'cho_duyet' where id = $1`, [phieu]);
    expect(await loi(`select public.duyet_phieu_kiem_ke($1, $2)`, [phieu, nv1])).toMatch(/khác người đếm/);
    await q(`select public.duyet_phieu_kiem_ke($1, $2)`, [phieu, nv2]);
    const vt = (await q(`select loai, so_luong::float s, so_lo, han_dung::text h, ghi_chu from kho_so_cai where san_pham_id = $1`, [spVatTu]))[0];
    expect(vt).toMatchObject({ loai: "nhap", s: 25, so_lo: "L77", h: "2030-01-31" });
    expect(vt.ghi_chu).toMatch(/^Tồn đầu kỳ \(kiểm kê KK/);
    const bl = await q(`select loai, so_luong::float s from kho_so_cai where san_pham_id = $1 and loai = 'kiem_ke'`, [spBanLe]);
    expect(bl).toEqual([{ loai: "kiem_ke", s: -2 }]);
  });
  it("tồn đầu của vật tư hiện trong tồn theo lô (FEFO) và đủ để cấp phiếu", async () => {
    expect((await q(`select trim_scale(ton_kho($1, $2))::text t`, [cn, spVatTu]))[0].t).toBe("25");
    const lo = await q(`select so_lo, han_dung::text h, con_lai::float c from v_ton_lo where chi_nhanh_id = $1 and san_pham_id = $2`, [cn, spVatTu]);
    expect(lo).toEqual([{ so_lo: "L77", h: "2030-01-31", c: 25 }]);
  });
  it("báo cáo nhập xuất coi dòng 'Tồn đầu kỳ' là số dư đầu, không tính là nhập trong kỳ", async () => {
    await q(`update san_pham set ban_le = true where id = $1`, [spVatTu]);
    const r = await q(`select dau::float d, nhap::float n, cuoi::float c from public.bc_kho_nhap_xuat(current_date, current_date, $1) where san_pham_id = $2`, [cn, spVatTu]);
    expect(r).toEqual([{ d: 25, n: 0, c: 25 }]);
  });
  it("loại phiếu lạ vẫn bị chặn", async () => {
    expect(await loi(`update phieu_kiem_ke set loai = 'khac' where id = $1`, [phieu])).toMatch(/check|loai/i);
  });
});
