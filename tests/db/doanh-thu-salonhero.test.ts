import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0086: doanh thu tính như SalonHero = tổng đơn hoàn thành (gồm VAT, phụ phí, tip) − phần trả bằng thẻ tiền.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string;
const TN = u(1);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${TN}','Thu Ngân','thu_ngan',$1)`, [CN]);
  const hd = (ma: string, ngay: string, o: { hang: number; vat?: number; pp?: number; tip?: number; giam?: number; the?: number; ls?: boolean; sdd?: boolean; huy?: boolean }) =>
    q(`insert into hoa_don (ma, chi_nhanh_id, trang_thai, ngay_hd, giam_gia_don, vat_tien, phu_phi, tip, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su, la_so_du_dau, tien_tru_the)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,0,$11,$12,$13,$14) returning id`,
      [ma, CN, o.huy ? "huy" : "hoan_thanh", ngay, o.giam ?? 0, o.vat ?? 0, o.pp ?? 0, o.tip ?? 0, o.hang, o.hang - (o.giam ?? 0) + (o.vat ?? 0) + (o.pp ?? 0) + (o.tip ?? 0), TN, o.ls ?? true, o.sdd ?? false, o.the ?? 0]);
  await hd("A", "2026-10-28", { hang: 13000000, the: 4000000 });                                   // 13.000.000 − 4.000.000 thẻ = 9.000.000
  await hd("B", "2026-10-28", { hang: 12990000, vat: 1299000 });                                   // có VAT: tính cả VAT
  await hd("C", "2026-10-28", { hang: 1000000, giam: 100000, pp: 50000, tip: 20000 });             // giảm giá, phụ phí, tip: 970.000
  await hd("D", "2026-10-28", { hang: 5000000, huy: true });                                       // huỷ: không tính
  await hd("E", "2026-10-28", { hang: 700000, sdd: true });                                        // công nợ đầu kỳ: không tính
});

describe("doanh thu như SalonHero", () => {
  it("báo cáo theo thu ngân: doanh số = tổng đơn (gồm VAT), doanh thu = doanh số − thẻ", async () => {
    const [r] = await q(`select so_don, doanh_so::int, tru_the_tien::int, doanh_thu::int from bc_thu_ngan('2026-10-28','2026-10-28',null,'tong')`);
    expect(r).toEqual({ so_don: 3, doanh_so: 13000000 + 14289000 + 970000, tru_the_tien: 4000000, doanh_thu: 13000000 + 14289000 + 970000 - 4000000 });
  });
  it("báo cáo doanh thu ngày: doanh thu = tổng đơn − thẻ (đúng 9.000.000 cho đơn A)", async () => {
    const [r] = await q(`select so_don, doanh_thu::int from bc_doanh_thu_ngay('2026-10-28','2026-10-28',null)`);
    expect(r).toEqual({ so_don: 3, doanh_thu: 13000000 + 14289000 + 970000 - 4000000 });
  });
  it("hoá đơn làm trong app: phần trả bằng thẻ lấy từ thanh toán thẻ tiền", async () => {
    const h = (await hdApp())[0].id;
    const [r] = await q(`select tong_don::int, tru_the::int from v_hd_doanh_thu where hoa_don_id = $1`, [h]);
    expect(r).toEqual({ tong_don: 2000000, tru_the: 500000 });
  });
});

async function hdApp() {
  const rows = await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su) values ('APP', $1, 'hoan_thanh', '2026-10-29', 2000000, 2000000, 2000000, 0, $2, true) returning id`, [CN, TN]);
  await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) values ($1,'thu','the_tien',500000,'2026-10-29',$2,true)`, [rows[0].id, TN]);
  // la_lich_su = true lấy cột tien_tru_the; đổi sang đơn làm trong app để thử nhánh tính từ thanh toán thẻ tiền
  await q(`alter table hoa_don disable trigger user`);
  await q(`update hoa_don set la_lich_su = false where id = $1`, [rows[0].id]);
  await q(`alter table hoa_don enable trigger user`);
  return rows;
}
