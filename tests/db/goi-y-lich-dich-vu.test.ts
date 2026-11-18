import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0342: gợi ý lịch hẹn sắp đến theo dịch vụ (chị Diệu Thuý 18/11/2026).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, NHOM: string, EXION: string, PEEL: string, MFU: string, KHAC: string;
type Dong = { ma: string; ten_dich_vu: string; loai: string; so_ngay_con: number; trang_thai: string | null };
const goiY = async (extra = "") => q<Dong>(`select * from ds_goi_y_lich(null${extra}) order by ma, ten_dich_vu, loai`);

async function khach(ma: string) {
  return (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ($1,$1,$2,$3,'mkt','${u(1)}') returning id`, [ma, `09${String(ma.charCodeAt(0)).padStart(8, "0")}`, CN]))[0].id;
}
/** Dòng hoá đơn lịch sử SalonHero: KHÔNG có mã dịch vụ, chỉ có tên → khớp theo tên. */
let soHd = 0;
async function hoaDonTen(khachId: string, ten: string, luiNgay: number) {
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, nguoi_lap_id, la_lich_su) values ($1,$2,$3,'hoan_thanh', hom_nay() - $4::int, 0, 0, $5, true) returning id`, [`HD${++soHd}`, CN, khachId, luiNgay, u(1)]))[0].id;
  await q(`insert into hoa_don_dong (hoa_don_id, loai, ten, so_luong, don_gia, la_lich_su) values ($1,'dich_vu',$2,1,0,true)`, [h, ten]);
}
async function lichHoanThanh(khachId: string, dv: string, luiNgay: number) {
  const l = (await q<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id) values ($1,$2, now() - make_interval(days => $3), now() - make_interval(days => $3) + interval '1 hour','hoan_thanh',$4) returning id`, [khachId, CN, luiNgay, u(1)]))[0].id;
  await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [l, dv]);
}
async function lichSapToi(khachId: string, dv: string, sauNgay: number) {
  const l = (await q<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id) values ($1,$2, now() + make_interval(days => $3), now() + make_interval(days => $3) + interval '1 hour','da_xac_nhan',$4) returning id`, [khachId, CN, sauNgay, u(1)]))[0].id;
  await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [l, dv]);
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Lễ Tân','le_tan',$1)`, [CN]);
  NHOM = (await q<{ id: string }>(`insert into dich_vu_nhom (ten) values ('PEEL DA') returning id`))[0].id;
  const dv = async (ma: string, ten: string, kc: number | null, tk: number | null) =>
    (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia, khoang_cach_ngay, tai_kham_sau_ngay) values ($1,$2,$3,100000,$4,$5) returning id`, [ma, NHOM, ten, kc, tk]))[0].id;
  EXION = await dv("EX", "EXION Full Face", 7, null);
  PEEL = await dv("PE", "Active Peel", 30, 7);
  MFU = await dv("MF", "MFU PRO Basic", 150, null);
  KHAC = await dv("KH", "Gội đầu", null, null);
});

describe("ds_goi_y_lich", () => {
  it("tính theo lần làm gần nhất của từng dịch vụ; peel sinh 2 gợi ý; khớp dòng hoá đơn lịch sử theo tên", async () => {
    const a = await khach("A");
    await hoaDonTen(a, "exion full face", 6);   // tên khác hoa/thường vẫn khớp → hẹn sau 1 ngày (trong 3 ngày báo trước)
    await hoaDonTen(a, "Gội đầu", 6);           // dịch vụ không đặt khoảng cách → không gợi ý
    const b = await khach("B");
    await lichHoanThanh(b, PEEL, 7);            // peel 7 ngày trước: tái khám hôm nay, buổi kế còn 23 ngày (ngoài cửa sổ)
    const c = await khach("C");
    await hoaDonTen(c, "MFU PRO Basic", 155);   // MFU 5 tháng: quá 5 ngày
    const r = await goiY();
    expect(r.map((x) => [x.ma, x.ten_dich_vu, x.loai, x.so_ngay_con])).toEqual([
      ["A", "EXION Full Face", "buoi_ke", 1],
      ["B", "Active Peel", "tai_kham", 0],
      ["C", "MFU PRO Basic", "buoi_ke", -5],
    ]);
    // Mở rộng báo trước 30 ngày: thấy cả buổi peel kế tiếp của B.
    expect((await goiY(", null, null, 30")).filter((x) => x.ma === "B").map((x) => x.loai)).toEqual(["buoi_ke", "tai_kham"]);
    // Lọc theo loại và dịch vụ.
    expect((await goiY(", null, 'tai_kham'")).map((x) => x.ma)).toEqual(["B"]);
    expect((await goiY(`, '${MFU}'::uuid`)).map((x) => x.ma)).toEqual(["C"]);
    expect(KHAC).toBeTruthy();
  });

  it("làm lại dịch vụ thì đẩy ngày; có lịch sắp tới gồm dịch vụ đó thì thôi gợi ý; tái khám trễ quá lâu thì bỏ", async () => {
    const d = await khach("D");
    await hoaDonTen(d, "EXION Full Face", 20);
    await lichHoanThanh(d, EXION, 5);           // làm lại 5 ngày trước → hẹn sau 2 ngày
    const e = await khach("E");
    await hoaDonTen(e, "EXION Full Face", 8);
    await lichSapToi(e, EXION, 2);              // đã đặt lịch Exion → không gợi ý
    const f = await khach("F");
    await lichHoanThanh(f, PEEL, 20);           // tái khám trễ 13 ngày (> 7) → bỏ; buổi kế còn 10 ngày → ngoài 3 ngày
    const r = (await goiY(", null, null, 3, 60")).filter((x) => ["D", "E", "F"].includes(x.ma));
    expect(r.map((x) => [x.ma, x.so_ngay_con])).toEqual([["D", 2]]);
  });

  it("đã hẹn / bỏ qua ẩn khỏi mặc định; đã gọi vẫn hiện; xem lại bằng p_tt", async () => {
    const g = await khach("G");
    await hoaDonTen(g, "EXION Full Face", 7);
    const lc = (await q<{ d: string }>(`select to_char(hom_nay() - 7, 'YYYY-MM-DD') d`))[0].d;
    const ghi = (tt: string) => q(`insert into lich_goi_y_xu_ly (khach_id, dich_vu_id, loai, lan_cuoi, trang_thai) values ($1,$2,'buoi_ke',$3,$4)
      on conflict (khach_id, dich_vu_id, loai, lan_cuoi) do update set trang_thai = excluded.trang_thai`, [g, EXION, lc, tt]);
    await ghi("da_goi");
    expect((await goiY()).find((x) => x.ma === "G")?.trang_thai).toBe("da_goi");
    await ghi("da_hen");
    expect((await goiY()).some((x) => x.ma === "G")).toBe(false);
    expect((await goiY(", null, null, null, null, 'da_hen'")).map((x) => x.ma)).toEqual(["G"]);
    expect((await goiY(", null, null, null, null, 'tat_ca'")).some((x) => x.ma === "G")).toBe(true);
  });
});
