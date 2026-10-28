import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0072: nhóm ẩn không hiện nhãn, gán/bỏ nhóm hàng loạt theo bộ lọc (xem trước = áp dụng), chỉ mục email.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, A: string, B: string;
const gan = async (p: object, nhom: string, che: "gan" | "bo", apDung: boolean) =>
  (await q<{ r: { tong: number; thay_doi: number } }>(`select gan_nhom_theo_loc($1::jsonb, $2, $3, $4) r`, [JSON.stringify(p), nhom, che, apDung]))[0].r;
const nhomCua = async (ma: string) => (await q<{ ten: string }>(`select n.ten from khach_nhom kn join nhom_khach n on n.id = kn.nhom_id join khach_hang k on k.id = kn.khach_id where k.ma = $1 order by 1`, [ma])).map((x) => x.ten);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Tư Vấn','tu_van',$1)`, [CN]);
  await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, gioi_tinh, email) values
    ('KH1','An','0900000001',$1,'mkt','${u(1)}','nữ','an@x.vn'),
    ('KH2','Bình','0900000002',$1,'mkt','${u(1)}','nam',null),
    ('KH3','Chi','0900000003',$1,'mkt','${u(1)}','nữ',null)`, [CN]);
  A = (await q<{ id: string }>(`insert into nhom_khach (ten, mau) values ('LUXURY','#ff7043') returning id`))[0].id;
  B = (await q<{ id: string }>(`insert into nhom_khach (ten, mau) values ('Luxury','#65ba69') returning id`))[0].id;
});

describe("gán nhóm hàng loạt theo bộ lọc", () => {
  it("xem trước không ghi gì; áp dụng thêm đúng số khách xem trước; làm lại không thêm lần nữa", async () => {
    const xem = await gan({ gioi_tinh: "nữ" }, A, "gan", false);
    expect(xem).toEqual({ tong: 2, thay_doi: 2 });
    expect((await q(`select 1 from khach_nhom`)).length).toBe(0);
    const ap = await gan({ gioi_tinh: "nữ" }, A, "gan", true);
    expect(ap.thay_doi).toBe(xem.thay_doi);
    expect(await nhomCua("KH1")).toEqual(["LUXURY"]);
    expect(await nhomCua("KH2")).toEqual([]);
    expect((await gan({ gioi_tinh: "nữ" }, A, "gan", true)).thay_doi).toBe(0);
  });
  it("một khách nhiều nhóm; tên trùng hoa/thường vẫn là hai nhóm riêng (không tự gộp)", async () => {
    await gan({ q: "An" }, B, "gan", true);
    expect(await nhomCua("KH1")).toEqual(["LUXURY", "Luxury"]);
    expect((await q(`select 1 from nhom_khach where lower(ten) = 'luxury'`)).length).toBe(2);
  });
  it("bỏ nhóm theo bộ lọc chỉ gỡ liên kết, khách vẫn còn", async () => {
    const xem = await gan({ gioi_tinh: "nữ" }, A, "bo", false);
    expect(xem.thay_doi).toBe(2);
    const ap = await gan({ gioi_tinh: "nữ" }, A, "bo", true);
    expect(ap.thay_doi).toBe(2);
    expect(await nhomCua("KH1")).toEqual(["Luxury"]);
    expect((await q(`select 1 from khach_hang`)).length).toBe(3);
  });
  it("nhóm ẩn: không còn nhãn trên danh sách, liên kết giữ nguyên, không gán được thêm", async () => {
    await q(`update nhom_khach set hoat_dong = false where id = $1`, [B]);
    const r = await q<{ dong: { ma: string; nhom: { ten: string }[] } }>(`select dong from loc_khach('{"q":"An"}'::jsonb, 0, 10)`);
    expect(r[0].dong.nhom).toEqual([]);
    expect((await q(`select 1 from khach_nhom where nhom_id = $1`, [B])).length).toBe(1);
    await expect(gan({}, B, "gan", true)).rejects.toThrow(/đã bị ẩn/);
    await q(`update nhom_khach set hoat_dong = true where id = $1`, [B]);
    expect((await q<{ dong: { nhom: unknown[] } }>(`select dong from loc_khach('{"q":"An"}'::jsonb, 0, 10)`))[0].dong.nhom.length).toBe(1);
  });
  it("áp dụng với số dự kiến sai thì huỷ cả thao tác", async () => {
    await expect(q(`select gan_nhom_theo_loc('{}'::jsonb, $1, 'gan', true, 999)`, [A])).rejects.toThrow(/Xem trước lại/);
    expect((await q(`select 1 from khach_nhom where nhom_id = $1`, [A])).length).toBe(0);
    const ok = (await q<{ r: { thay_doi: number } }>(`select gan_nhom_theo_loc('{}'::jsonb, $1, 'gan', true, 3) r`, [A]))[0].r;
    expect(ok.thay_doi).toBe(3);
    await q(`delete from khach_nhom where nhom_id = $1`, [A]);
  });
  it("chế độ sai bị từ chối; tìm theo email vẫn chạy", async () => {
    await expect(gan({}, A, "xoa" as never, false)).rejects.toThrow(/Chế độ/);
    expect((await q<{ dong: { ma: string } }>(`select dong from loc_khach('{"q":"AN@X.VN"}'::jsonb, 0, 10)`)).map((x) => x.dong.ma)).toEqual(["KH1"]);
  });
});
