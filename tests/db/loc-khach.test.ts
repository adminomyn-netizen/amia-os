import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0066: lọc khách ở CSDL (loc_khach), 4 số đầu trang (so_lieu_khach), danh mục lọc (tuy_chon_loc_khach).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
type Dong = { tong: number; dong: { ma: string; nhom: { ten: string }[]; diem_so_du: number } };
const loc = async (p: object, tu = 0, so = 40) => q<Dong>(`select tong::int tong, dong from loc_khach($1::jsonb, $2, $3)`, [JSON.stringify(p), tu, so]);
let NHOM: string;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  const cn = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Tư Vấn','tu_van',$1)`, [cn]);
  const hn = (await q<{ d: string }>(`select to_char(hom_nay(), 'YYYY-MM-DD') d`))[0].d;
  const ns = `1990-${hn.slice(5)}`;
  await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, gioi_tinh, ngay_sinh, tinh_thanh, quan_huyen, co_so_goc) values
    ('KH1','An Nữ','0900000001',$1,'mkt','${u(1)}','nữ',$2,'Nghệ An','TP Vinh','Vinh, Đà Lạt'),
    ('KH2','Bình Nam','0900000002',$1,'mkt','${u(1)}','nam','1980-01-01','Lâm Đồng','Đà Lạt',null),
    ('KH3','Chi O''Neil','0900000003',$1,'mkt','${u(1)}',null,null,null,null,null)`, [cn, ns]);
  NHOM = (await q<{ id: string }>(`insert into nhom_khach (ten, mau) values ('VIP','#ff7043') returning id`))[0].id;
  await q(`insert into khach_nhom (khach_id, nhom_id) select id, $1 from khach_hang where ma='KH1'`, [NHOM]);
  await q(`insert into khach_diem_so (khach_id, loai, so_diem) select id, 'dieu_chinh', 120 from khach_hang where ma='KH2'`);
});

describe("loc_khach", () => {
  it("không lọc: đủ khách, có tổng và nhãn nhóm", async () => {
    const r = await loc({});
    expect(r.length).toBe(3);
    expect(r[0].tong).toBe(3);
    expect(r.find((x) => x.dong.ma === "KH1")!.dong.nhom.map((n) => n.ten)).toEqual(["VIP"]);
  });
  it("lọc theo nhóm, chưa có nhóm, điểm, giới tính, tỉnh/quận, nhiều chi nhánh, sinh nhật", async () => {
    expect((await loc({ nhom: NHOM })).map((x) => x.dong.ma)).toEqual(["KH1"]);
    expect((await loc({ nhom: "khong" })).map((x) => x.dong.ma).sort()).toEqual(["KH2", "KH3"]);
    expect((await loc({ diem_tu: "100" })).map((x) => x.dong.ma)).toEqual(["KH2"]);
    expect((await loc({ gioi_tinh: "nam" })).map((x) => x.dong.ma)).toEqual(["KH2"]);
    expect((await loc({ gioi_tinh: "chua_ro" })).map((x) => x.dong.ma)).toEqual(["KH3"]);
    expect((await loc({ tinh: "Lâm Đồng", quan: "Đà Lạt" })).map((x) => x.dong.ma)).toEqual(["KH2"]);
    expect((await loc({ nhieu_cn: "1" })).map((x) => x.dong.ma)).toEqual(["KH1"]);
    expect((await loc({ sinh_nhat: "hom_nay" })).map((x) => x.dong.ma)).toEqual(["KH1"]);
    expect((await loc({ tuoi_tu: "40" })).map((x) => x.dong.ma)).toEqual(["KH2"]);
  });
  it("tìm kiếm có dấu nháy không vỡ câu lệnh; phân trang giữ tổng", async () => {
    expect((await loc({ q: "O'Neil" })).map((x) => x.dong.ma)).toEqual(["KH3"]);
    expect((await loc({ q: "x' or 1=1 --" })).length).toBe(0);
    const tr2 = await loc({ sx: "ten" }, 1, 1);
    expect(tr2.length).toBe(1);
    expect(tr2[0].tong).toBe(3);
    expect(tr2[0].dong.ma).toBe("KH2");
  });
  it("tìm tên không dấu, nhiều từ, đ → d, ký tự đặc biệt không vỡ (0090)", async () => {
    await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values
      ('KH4','Hồ Thị Thanh Đào','0900000004',(select id from chi_nhanh where ma='VINH'),'mkt','${u(1)}'),
      ('KH5','ZZ_TEST_100%','0900000005',(select id from chi_nhanh where ma='VINH'),'mkt','${u(1)}')`);
    expect((await loc({ q: "ho thi thanh dao" })).map((x) => x.dong.ma)).toEqual(["KH4"]);
    expect((await loc({ q: "HỒ THỊ" })).map((x) => x.dong.ma)).toEqual(["KH4"]);
    expect((await loc({ q: "dao ho" })).map((x) => x.dong.ma)).toEqual(["KH4"]);
    expect((await loc({ q: "binh nam" })).map((x) => x.dong.ma)).toEqual(["KH2"]);
    expect((await loc({ q: "100%" })).map((x) => x.dong.ma)).toEqual(["KH5"]);
    expect((await loc({ q: "zz_test" })).map((x) => x.dong.ma)).toEqual(["KH5"]);
    expect((await loc({ q: "z%" })).length).toBe(0);
    // 0091: tên bắt đầu bằng cụm gõ lên trước; từ chỉ khớp ĐẦU từ (không khớp giữa từ khi gõ nhiều từ)
    await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values
      ('KH6','Bùi Thị Hồng Thanh','0900000006',(select id from chi_nhanh where ma='VINH'),'mkt','${u(1)}'),
      ('KH7','Hồ Thị Thanh','0900000007',(select id from chi_nhanh where ma='VINH'),'mkt','${u(1)}')`);
    expect((await loc({ q: "ho thi thanh" })).map((x) => x.dong.ma)).toEqual(["KH7", "KH4", "KH6"]);
    expect((await loc({ q: "hi anh" })).length).toBe(0);
    await q(`delete from khach_hang where ma in ('KH6','KH7')`);
    await q(`delete from khach_hang where ma in ('KH4','KH5')`);
  });
  it("số đầu trang và danh mục lọc", async () => {
    const s = (await q<{ s: Record<string, number> }>(`select so_lieu_khach() s`))[0].s;
    expect(s.tong).toBe(3);
    expect(s.moi_hom_nay).toBe(3);
    expect(s.sinh_nhat_hom_nay).toBe(1);
    const t = (await q<{ t: { tinh: { tinh: string; quan: string[] }[] } }>(`select tuy_chon_loc_khach() t`))[0].t;
    expect(t.tinh.map((x) => x.tinh).sort()).toEqual(["Lâm Đồng", "Nghệ An"]);
  });
});

describe("thong_ke_khach (0070)", () => {
  it("đếm theo giới tính, tỉnh, nhóm tuổi, khách mới tháng này, điểm", async () => {
    const t = (await q<{ t: Record<string, unknown> }>(`select thong_ke_khach() t`))[0].t as {
      tong: number; gioi_tinh: Record<string, number>; tinh: { ten: string; so: number }[]; tuoi: Record<string, number>; moi_theo_thang: { so: number }[]; co_diem: number; tong_diem: number;
    };
    expect(t.tong).toBe(3);
    expect(t.gioi_tinh).toEqual({ "nữ": 1, nam: 1, chua_ro: 1 });
    expect(t.tinh.length).toBe(2);
    expect(t.tuoi.chua_ro).toBe(1);
    expect(t.moi_theo_thang.length).toBe(12);
    expect(t.moi_theo_thang.at(-1)!.so).toBe(3);
    expect(t.co_diem).toBe(1);
    expect(t.tong_diem).toBe(120);
  });
});
