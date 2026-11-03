import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// Đợt 2 Thu ngân / hoá đơn (03/11/2026, "SalonHero làm sao thì làm y vậy"): 0199 hình thức trả tiền + quỹ.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, KH: string, DV: string;
const NV = u(1);

/** Đơn nháp 1 dòng dịch vụ (giá `gia`), các khoản thu [phương thức, số tiền, loại ví?, ngân hàng?] rồi chốt. */
async function taoDon(gia: number, thu: [string, number, string?, string?][], ngay?: string) {
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id${ngay ? ", ngay_hd" : ""}) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'),$1,$2,$3${ngay ? ",$4" : ""}) returning id`, ngay ? [CN, KH, NV, ngay] : [CN, KH, NV]))[0].id;
  await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia) values ($1,'dich_vu',$2,'Peel',1,$3)`, [h, DV, gia]);
  for (const [pt, tien, vi, nh] of thu) await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, loai_vi, ngan_hang, nguoi_id${ngay ? ", ngay" : ""}) values ($1,'thu',$2,$3,$4,$5,$6${ngay ? ",$7" : ""})`, ngay ? [h, pt, tien, vi ?? null, nh ?? null, NV, ngay] : [h, pt, tien, vi ?? null, nh ?? null, NV]);
  await q(`select chot_hoa_don($1,$2)`, [h, NV]);
  return h;
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Thu Ngân','thu_ngan',$2)`, [NV, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL01',$1,'Peel',1000000) returning id`, [nhom]))[0].id;
});

describe("0199 hình thức trả tiền như SalonHero", () => {
  it("ví điện tử bắt buộc có loại ví hợp lệ; hình thức khác không được có loại ví", async () => {
    const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id) values ('HDV1',$1,$2,$3) returning id`, [CN, KH, NV]))[0].id;
    await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia) values ($1,'dich_vu',$2,'Peel',1,500000)`, [h, DV]);
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id) values ($1,'vi_dien_tu',1000,$2)`, [h, NV])).toMatch(/loai_vi_check/);
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, loai_vi, nguoi_id) values ($1,'vi_dien_tu',1000,'PAYPAL',$2)`, [h, NV])).toMatch(/loai_vi_check/);
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, loai_vi, nguoi_id) values ($1,'tien_mat',1000,'MOMO',$2)`, [h, NV])).toMatch(/loai_vi_check/);
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id) values ($1,'vi_ao',1000,$2)`, [h, NV])).toMatch(/phuong_thuc_check/);
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, loai_vi, nguoi_id) values ($1,'vi_dien_tu',1000,'MOMO',$2)`, [h, NV])).toBe("");
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id) values ($1,'ship_cod',1000,$2)`, [h, NV])).toBe("");
  });

  it("tiền mặt vào quỹ tiền mặt; quẹt thẻ, chuyển khoản, ví vào quỹ ngân hàng; COD và thẻ tiền không vào quỹ (0208)", async () => {
    const h = await taoDon(1_000_000, [["tien_mat", 100_000], ["chuyen_khoan", 200_000, undefined, "OCB"], ["quet_the", 150_000, undefined, "Vietcombank"], ["vi_dien_tu", 300_000, "MOMO"], ["vi_dien_tu", 50_000, "ZALO"], ["ship_cod", 200_000]], "2026-09-10");
    const r = await q<{ loai_quy: string; tong: string }>(`select v.loai_quy, sum(v.bien_dong)::bigint as tong from v_so_quy v join hoa_don h on h.ma = v.ma where h.id = $1 group by 1 order by 1`, [h]);
    expect(r.map((x) => [x.loai_quy, Number(x.tong)])).toEqual([["ngan_hang", 700_000], ["tien_mat", 100_000]]);
    const t = await q<{ phuong_thuc: string; ngan_hang: string | null; loai_vi: string | null; thu: string }>(`select * from quy_ngan_hang_tach(array[$1::uuid], '2026-09-10', '2026-09-10') order by thu desc, phuong_thuc`, [CN]);
    expect(t.map((x) => [x.phuong_thuc, x.ngan_hang, x.loai_vi, Number(x.thu)])).toEqual([
      ["vi_dien_tu", null, "MOMO", 300_000], ["chuyen_khoan", "OCB", null, 200_000], ["quet_the", "Vietcombank", null, 150_000], ["vi_dien_tu", null, "ZALO", 50_000],
    ]);
  });

  it("báo cáo ngày: cột Momo / VNPay / Shopee / Grab / ví khác / COD", async () => {
    await taoDon(1_000_000, [["vi_dien_tu", 100_000, "VNPAY"], ["vi_dien_tu", 70_000, "SHOPEE"], ["vi_dien_tu", 60_000, "GRAB"], ["vi_dien_tu", 40_000, "GOTIT"]], "2026-09-11");
    const r = await q<Record<string, string>>(`select ngay::text as ngay, momo, vnpay, shopee, grab, vi_khac, ship_cod from bc_doanh_thu_ngay_vi('2026-09-10','2026-09-11',$1) order by ngay`, [CN]);
    expect(r.map((x) => [x.ngay, ...["momo", "vnpay", "shopee", "grab", "vi_khac", "ship_cod"].map((k) => Number(x[k]))])).toEqual([
      ["2026-09-10", 300_000, 0, 0, 0, 50_000, 200_000], ["2026-09-11", 0, 100_000, 70_000, 60_000, 40_000, 0],
    ]);
  });

  it("huỷ hoá đơn: dòng hoàn giữ đúng ngân hàng và loại ví", async () => {
    const h = await taoDon(500_000, [["vi_dien_tu", 200_000, "MOMO"], ["chuyen_khoan", 300_000, undefined, "OCB"]]);
    await q(`select huy_hoa_don($1,'thử',$2)`, [h, NV]);
    const r = await q<{ phuong_thuc: string; ngan_hang: string | null; loai_vi: string | null; so_tien: string }>(`select phuong_thuc, ngan_hang, loai_vi, so_tien from thanh_toan where hoa_don_id = $1 and loai = 'hoan' order by so_tien`, [h]);
    expect(r.map((x) => [x.phuong_thuc, x.ngan_hang, x.loai_vi, Number(x.so_tien)])).toEqual([["vi_dien_tu", null, "MOMO", 200_000], ["chuyen_khoan", "OCB", null, 300_000]]);
  });
});
