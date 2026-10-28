import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0073: nhắc tái khám theo liệu trình + thẻ sắp hết.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, GOI: string;
const hn = async (d: number) => (await q<{ d: string }>(`select to_char(hom_nay() + $1::int, 'YYYY-MM-DD') d`, [d]))[0].d;
const taiKham = async (cn: string | null = null, extra = "") => q<{ ma: string; so_ngay_tre: number; trang_thai: string | null; so_the: number; khoang_cach: number }>(`select * from ds_tai_kham($1::uuid${extra}) order by ma`, [cn]);
const sapHet = async (cn: string | null = null) => q<{ ma: string; ly_do: string; loai: string }>(`select * from ds_the_sap_het($1::uuid) order by ma`, [cn]);

async function khach(ma: string, sdt: string) {
  return (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ($1,$1,$2,$3,'mkt','${u(1)}') returning id`, [ma, sdt, CN]))[0].id;
}
async function the(khachId: string, ma: string, soBuoi: number, ngayCapLui: number, han: string | null = null, tong: number | null = null) {
  const id = (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, ngay_cap, han_dung, cap_tay) values ($1,$2,$3,$4,'lan',$5, hom_nay() - $6::int, $7, true) returning id`, [ma, khachId, GOI, CN, tong ?? soBuoi, ngayCapLui, han]))[0].id;
  await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',$2)`, [id, soBuoi]);
  return id;
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Tư Vấn','tu_van',$1)`, [CN]);
  GOI = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi, khoang_cach_ngay) values ('G1','Triệt lông','lan',1000,10,14) returning id`))[0].id;
});

describe("ds_tai_kham", () => {
  it("tới hẹn theo khoảng cách của gói; chưa tới hẹn và quá cũ thì không hiện", async () => {
    const a = await khach("A", "0900000001"); await the(a, "T-A", 5, 20); // cấp 20 ngày trước, hẹn 14 ngày → trễ 6 ngày
    const b = await khach("B", "0900000002"); await the(b, "T-B", 5, 3);  // mới cấp 3 ngày: tới hẹn sau 11 ngày → ngoài cửa sổ 7 ngày
    const c = await khach("C", "0900000003"); await the(c, "T-C", 5, 400); // quá 90 ngày trễ → bỏ
    const d = await khach("D", "0900000004"); await the(d, "T-D", 5, 10);  // còn 4 ngày tới hẹn → trong cửa sổ báo trước 7 ngày
    const r = await taiKham();
    expect(r.map((x) => x.ma)).toEqual(["A", "D"]);
    expect(r.find((x) => x.ma === "A")!.so_ngay_tre).toBe(6);
    expect(r.find((x) => x.ma === "D")!.so_ngay_tre).toBe(-4);
    expect(r[0].khoang_cach).toBe(14);
    expect((await taiKham(null, ", 0")).map((x) => x.ma)).toEqual(["A"]);          // không báo trước: chỉ khách đã trễ
    expect((await taiKham(null, ", 7, 1000")).map((x) => x.ma)).toEqual(["A", "C", "D"]);
  });
  it("lịch hoàn thành mới nhất đẩy ngày hẹn; có lịch sắp tới thì khỏi nhắc; không đặt khoảng cách thì lấy mặc định 30", async () => {
    const e = await khach("E", "0900000005"); await the(e, "T-E", 5, 60);
    expect((await taiKham()).map((x) => x.ma)).toContain("E");
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, now() - interval '2 days', now() - interval '2 days' + interval '1 hour', 'hoan_thanh')`, [e, CN]);
    expect((await taiKham()).map((x) => x.ma)).not.toContain("E"); // vừa làm 2 ngày trước
    const f = await khach("F", "0900000006"); await the(f, "T-F", 5, 40);
    await q(`update goi_the set khoang_cach_ngay = null`);
    expect((await taiKham()).find((x) => x.ma === "F")!.khoang_cach).toBe(30);
    await q(`update goi_the set khoang_cach_ngay = 14`);
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, now() + interval '3 days', now() + interval '3 days 1 hour', 'da_xac_nhan')`, [f, CN]);
    expect((await taiKham()).map((x) => x.ma)).not.toContain("F");
  });
  it("một khách nhiều thẻ chỉ một dòng; trạng thái xử lý gắn theo ngày làm gần nhất; lọc chi nhánh", async () => {
    const g = await khach("G", "0900000007"); await the(g, "T-G1", 3, 30); await the(g, "T-G2", 4, 25);
    const r = (await taiKham()).filter((x) => x.ma === "G");
    expect(r.length).toBe(1); expect(r[0].so_the).toBe(2);
    const lc = (await q<{ lan_cuoi: string }>(`select to_char(lan_cuoi,'YYYY-MM-DD') lan_cuoi from ds_tai_kham(null) where ma='G'`))[0].lan_cuoi;
    await q(`insert into tai_kham_xu_ly (khach_id, lan_cuoi, trang_thai) select id, $1::date, 'da_goi' from khach_hang where ma='G'`, [lc]);
    expect((await taiKham()).find((x) => x.ma === "G")!.trang_thai).toBe("da_goi");
    const cn2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('X2','Chi nhánh 2') returning id`))[0].id;
    expect(await taiKham(cn2)).toEqual([]);
  });
  it("thẻ không giới hạn (999999) vẫn nhắc tái khám; thẻ hết buổi/hết hạn không nhắc", async () => {
    const h = await khach("H", "0900000008"); await the(h, "T-H", 999990, 50, null, 999999);
    const i = await khach("I", "0900000009"); await the(i, "T-I", 5, 50, await hn(-1));
    const m = (await taiKham()).map((x) => x.ma);
    expect(m).toContain("H"); expect(m).not.toContain("I");
  });
});

describe("ds_the_sap_het", () => {
  it("còn ≤ 2 buổi hoặc còn hạn ≤ 30 ngày; bỏ thẻ không giới hạn và hạn rác", async () => {
    const j = await khach("J", "0900000010"); await the(j, "T-J1", 1, 1);                       // sắp hết buổi
    const k = await khach("K", "0900000011"); await the(k, "T-K1", 8, 1, await hn(10));         // còn 10 ngày
    const l = await khach("L", "0900000012"); await the(l, "T-L1", 2, 1, await hn(5));          // cả hai
    const n = await khach("N", "0900000013"); await the(n, "T-N1", 999990, 1, null, 999999);    // không giới hạn: không báo
    const o = await khach("O", "0900000014"); await the(o, "T-O1", 8, 1, "1969-12-31");         // hạn rác: bỏ
    const r = await sapHet();
    const m = Object.fromEntries(r.map((x) => [x.ma, x.ly_do]));
    expect(m.J).toBe("het_buoi"); expect(m.K).toBe("het_han"); expect(m.L).toBe("ca_hai");
    expect(m.N).toBeUndefined(); expect(m.O).toBeUndefined();
  });
  it("ngưỡng chỉnh được và lọc chi nhánh", async () => {
    expect((await q<{ ma: string }>(`select ma from ds_the_sap_het(null, 0, 10) order by ma`)).map((x) => x.ma)).toEqual(["K", "L"]);
    expect((await q<{ ma: string }>(`select ma from ds_the_sap_het(null, 10, 0) where ma = 'K'`)).length).toBe(1);
    expect(await sapHet("00000000-0000-0000-0000-0000000000ff")).toEqual([]);
  });
});
