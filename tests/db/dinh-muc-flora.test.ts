/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { taoDbVoiMigration } from "./khung";
import { lamSach, nhapDinhMuc } from "../../scripts/dinh-muc/nhap.mjs";

const rows = JSON.parse(readFileSync("scripts/dinh-muc/flora-25-10.json", "utf8"));
let db: PGlite;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  const nhom = (await q(`select id from dich_vu_nhom limit 1`))[0].id;
  await q(`insert into dich_vu (ma, nhom_id, ten, gia, sh_id) values ('PP', $1, 'Thermage Pro Plus', 1, 1), ('MPB', $1, 'MFU Pro Basic', 1, 2)`, [nhom]);
  await q(`insert into san_pham (ma, ten, don_vi, ban_le) values ('EFF', 'Thuốc giảm đau efferalgan codeine 500mg', 'viên', true)`);
});

describe("định mức Flora 25/10", () => {
  it("file gốc có đủ 105 dòng / 16 dịch vụ", () => {
    expect(rows).toHaveLength(105);
    expect(new Set(rows.map((r: any) => r.dich_vu)).size).toBe(16);
  });
  it("làm sạch: bỏ dòng trùng + dòng trống, đổi đầu típ Thermage mặt+cổ, không nhập số đoán", () => {
    const { dong, bo, da_sua } = lamSach(rows);
    expect(dong.length + bo.length).toBe(105);
    expect(bo.filter((b: any) => /trùng/.test(b.ly_do))).toHaveLength(3);
    expect(bo.filter((b: any) => /trống/.test(b.ly_do))).toHaveLength(6);
    expect(bo.filter((b: any) => /0,5/.test(b.ly_do))).toHaveLength(1);
    expect(da_sua).toHaveLength(1);
    const tip = dong.find((d: any) => d.dich_vu.startsWith("Thermage FLX Pro Plus") && /típ/.test(d.vat_tu));
    expect(tip).toMatchObject({ vat_tu: expect.stringContaining("TOTAL TIP 3.0"), don_gia: 22270000, dinh_muc: 1 });
    expect(dong.filter((d: any) => /^Đầu M/.test(d.vat_tu)).every((d: any) => d.chon)).toBe(true);
  });
  it("nhập đúng cho dịch vụ đã xác nhận tên, chạy lại không nhân đôi, dùng lại Efferalgan có sẵn", async () => {
    const anhXa = { "Thermage FLX Pro Plus (mặt + cổ)": 1, "Mfu Pro Basic": 2 };
    const a = await nhapDinhMuc(db, rows, anhXa);
    expect(a.dinh_muc_them_moi).toBe(17);   // 7 + 10
    expect(a.dich_vu_chua_xac_nhan_ten).toContain("Mfu Basic");
    const b = await nhapDinhMuc(db, rows, anhXa);
    expect(b.dinh_muc_them_moi).toBe(0);
    expect((await q(`select count(*)::int n from dinh_muc`))[0].n).toBe(17);
    expect((await q(`select count(*)::int n from san_pham where lower(ten) like '%efferalgan%'`))[0].n).toBe(1);
    const tip = (await q(`select m.so_luong::int s, p.gia_nhap_don_vi::bigint g, p.nhom_cap, p.tieu_hao from dinh_muc m join san_pham p on p.id = m.san_pham_id join dich_vu d on d.id = m.dich_vu_id where d.sh_id = 1 and p.ten like '%TOTAL TIP%'`))[0];
    expect(tip).toMatchObject({ s: 1, g: 22270000, nhom_cap: "A", tieu_hao: true });
    const dau = await q(`select m.chon_theo_chi_dinh c from dinh_muc m join san_pham p on p.id = m.san_pham_id join dich_vu d on d.id = m.dich_vu_id where d.sh_id = 2 and p.ten ilike 'Đầu MFU%'`);
    expect(dau).toHaveLength(7);
    expect(dau.every((x: any) => x.c)).toBe(true);
  });
});
