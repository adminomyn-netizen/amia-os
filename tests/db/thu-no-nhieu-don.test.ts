import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { lapPhieuThuNo } from "../../src/lib/thu-no";

// Nút "Trả nợ" của báo cáo Khách hàng nợ: thu nốt toàn bộ nợ nhiều hoá đơn bằng MỘT lần ghi vào sổ thu tiền (thanh_toan, chỉ-thêm). Chỉ chạy trên PGlite.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string;
const TN = u(1);
const ids: Record<string, string> = {};

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${TN}','Thu Ngân','thu_ngan',$1)`, [CN]);
  for (const [ma, phai, thu] of [["N1", 12900000, 3000000], ["N2", 3500000, 500000], ["N3", 790000, 0]] as const) {
    ids[ma] = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_so_du_dau) values ($1,$2,'hoan_thanh','2026-07-07',$3,$3,0,$3,$4,true) returning id`, [ma, CN, phai, TN]))[0].id;
    if (thu) await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id) values ($1,'thu','tien_mat',$2,'2026-07-07',$3)`, [ids[ma], thu, TN]);
  }
});

const docNo = () => q<{ id: string; ma: string; trang_thai: string; con_no: string; chi_nhanh_id: string }>(`select id, ma, trang_thai, con_no::text, chi_nhanh_id from hoa_don where ma in ('N1','N2','N3') order by ma`);
const ghi = (dong: { hoa_don_id: string; so_tien: number }[]) => db.query(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, ghi_chu) select (x->>'hoa_don_id')::uuid, 'thu', 'chuyen_khoan', (x->>'so_tien')::bigint, '2026-10-29', $2, 'Thu nợ' from jsonb_array_elements($1::jsonb) x`, [JSON.stringify(dong), TN]);

describe("Trả nợ nhiều hoá đơn", () => {
  it("thu nốt N1 và N2: còn nợ về 0, đã thu bằng tổng hoá đơn, sổ thu có đủ 2 dòng", async () => {
    const p = lapPhieuThuNo([ids.N1, ids.N2], await docNo(), CN);
    if (p.loi !== undefined) throw new Error(p.loi);
    expect(p.tong).toBe(9900000 + 3000000);
    await ghi(p.dong);
    const r = await q(`select ma, con_no::int, da_thu::int from hoa_don where ma in ('N1','N2','N3') order by ma`);
    expect(r).toEqual([{ ma: "N1", con_no: 0, da_thu: 12900000 }, { ma: "N2", con_no: 0, da_thu: 3500000 }, { ma: "N3", con_no: 790000, da_thu: 0 }]);
    expect(Number((await q<{ n: string }>(`select count(*)::text n from thanh_toan where ghi_chu = 'Thu nợ' and phuong_thuc = 'chuyen_khoan'`))[0].n)).toBe(2);
  });
  it("hoá đơn đã hết nợ bị phiếu từ chối ngay ở bước kiểm (không ghi thêm)", async () => {
    const p = lapPhieuThuNo([ids.N1, ids.N3], await docNo(), CN);
    expect(p.loi).toMatch(/N1 không còn nợ/);
  });
  it("ghi vượt nợ thì DB từ chối cả lô, hoá đơn khác không bị thu dở", async () => {
    await expect(ghi([{ hoa_don_id: ids.N3, so_tien: 790000 }, { hoa_don_id: ids.N1, so_tien: 1 }])).rejects.toThrow(/vượt/);
    const r = await q(`select ma, con_no::int from hoa_don where ma = 'N3'`);
    expect(r).toEqual([{ ma: "N3", con_no: 790000 }]);
  });
  it("sổ thu chỉ-thêm: không sửa/xoá được lần thu", async () => {
    await expect(q(`delete from thanh_toan where ghi_chu = 'Thu nợ'`)).rejects.toThrow(/chỉ được thêm/);
  });
});
