import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0085: hoa hồng theo THỰC THU (tính trên tiền khách đã trả thật, theo ngày thu) và hoa hồng GIỚI THIỆU. Tỉ lệ cài trong test; DB thật chưa cài tỉ lệ nào.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const NV = { a: u(1), b: u(2), thuNgan: u(3) };
let CN: string, DV: string, KH: string, KHGT: string;

type Don = { ma: string; ngay: string; hang: number; giam?: number; vat?: number; gt?: string; nv: [string, number][]; tt: { loai?: "thu" | "hoan"; pt: string; tien: number; ngay: string }[] };
async function tao(d: Don) {
  const giam = d.giam ?? 0, vat = d.vat ?? 0, ptt = d.hang - giam + vat;
  const thu = d.tt.reduce((s, t) => s + (t.loai === "hoan" ? -t.tien : t.tien), 0);
  const h = (await q<{ id: string }>(
    `insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, giam_gia_don, vat_tien, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, nguoi_gioi_thieu_id, la_lich_su)
     values ($1,$2,$3,'hoan_thanh',$4,$5,$6,$7,$8,$9,$10,$11,$12,true) returning id`,
    [d.ma, CN, KH, d.ngay, giam, vat, d.hang, ptt, thu, ptt - thu, NV.thuNgan, d.gt ?? null]))[0].id;
  const dong = (await q<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia, la_lich_su) values ($1,'dich_vu',$2,'Peel da',1,$3,true) returning id`, [h, DV, d.hang]))[0].id;
  for (const [nv, ti] of d.nv) await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'phuc_vu',$3)`, [dong, nv, ti]);
  for (const t of d.tt) await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) values ($1,$2,$3,$4,$5,$6,true)`, [h, t.loai ?? "thu", t.pt, t.tien, t.ngay, NV.thuNgan]);
  return { h, dong };
}
const hh = async (tu = "2026-10-01", den = "2026-10-31") =>
  q<{ nv: string; nguon: string; ds_tien: number; hh_tien: number; ds_the: number; hh_the: number }>(
    `select nhan_vien_id nv, nguon, doanh_so_tien::int ds_tien, hoa_hong_tien::int hh_tien, doanh_so_the::int ds_the, hoa_hong_the::int hh_the from bc_hoa_hong_thuc_thu($1,$2,null) order by nguon, nhan_vien_id`, [tu, den]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${NV.a}','KTV An','ktv',$1),('${NV.b}','KTV Bình','ktv',$1),('${NV.thuNgan}','Thu ngân','thu_ngan',$1)`, [CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV.thuNgan]))[0].id;
  KHGT = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH2','Chị Giới Thiệu','0900000002',$1,'mkt',$2) returning id`, [CN, NV.thuNgan]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom limit 1`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL',$1,'Peel da',1000000) returning id`, [nhom]))[0].id;
  // 0205: các ca ở đây kiểm công thức chia theo tỉ lệ chia người = chế độ "Chia đều". Mặc định SalonHero (dịch vụ "Giữ nguyên") kiểm ở hoa-hong-the-cai-dat.test.ts.
  await q(`update hoa_hong_cai_dat set chia_deu_dich_vu = true`);
});

describe("hoa hồng theo thực thu", () => {
  it("chưa cài tỉ lệ: doanh số thực thu vẫn có, hoa hồng 0", async () => {
    await tao({ ma: "T0", ngay: "2026-08-01", hang: 1000000, nv: [[NV.a, 100]], tt: [{ pt: "chuyen_khoan", tien: 1000000, ngay: "2026-08-01" }] });
    const r = await hh("2026-08-01", "2026-08-31");
    expect(r).toEqual([{ nv: NV.a, nguon: "moi", ds_tien: 1000000, hh_tien: 0, ds_the: 0, hh_the: 0 }]);
  });

  describe("có tỉ lệ 10% (dịch vụ, phục vụ)", () => {
    beforeAll(async () => {
      await q(`insert into hoa_hong_ti_le (loai, vai, ti_le) values ('dich_vu','phuc_vu',10),('dich_vu','gioi_thieu',5)`);
      // 1) đủ tiền trong kỳ, chia 60/40, có hoàn 100.000 → thực thu 900.000
      await tao({ ma: "T1", ngay: "2026-10-05", hang: 1000000, nv: [[NV.a, 60], [NV.b, 40]], tt: [{ pt: "chuyen_khoan", tien: 600000, ngay: "2026-10-05" }, { pt: "tien_mat", tien: 400000, ngay: "2026-10-20" }, { loai: "hoan", pt: "tien_mat", tien: 100000, ngay: "2026-10-28" }] });
      // 2) giảm 200.000 + VAT 180.000, mới thu một nửa trong kỳ, nửa còn lại thu sau kỳ (tháng 11)
      await tao({ ma: "T2", ngay: "2026-10-10", hang: 2000000, giam: 200000, vat: 180000, nv: [[NV.a, 100]], tt: [{ pt: "chuyen_khoan", tien: 990000, ngay: "2026-10-10" }, { pt: "chuyen_khoan", tien: 990000, ngay: "2026-11-05" }] });
      // 3) hoá đơn tháng 9, thu nợ trong tháng 10
      await tao({ ma: "T3", ngay: "2026-09-20", hang: 1000000, nv: [[NV.a, 100]], tt: [{ pt: "chuyen_khoan", tien: 500000, ngay: "2026-09-20" }, { pt: "tien_mat", tien: 500000, ngay: "2026-10-15" }] });
      // 4) trả hoàn toàn bằng thẻ tiền
      await tao({ ma: "T4", ngay: "2026-10-12", hang: 500000, nv: [[NV.a, 100]], tt: [{ pt: "the_tien", tien: 500000, ngay: "2026-10-12" }] });
    });

    it("tính trên tiền đã thu theo ngày thu: đơn mới / thu nợ cũ / thẻ tiền tách riêng", async () => {
      const r = await hh();
      expect(r).toEqual([
        { nv: NV.a, nguon: "cu", ds_tien: 500000, hh_tien: 50000, ds_the: 0, hh_the: 0 },
        { nv: NV.a, nguon: "moi", ds_tien: 540000 + 900000, hh_tien: 54000 + 90000, ds_the: 500000, hh_the: 50000 },
        { nv: NV.b, nguon: "moi", ds_tien: 360000, hh_tien: 36000, ds_the: 0, hh_the: 0 },
      ]);
    });

    it("khoản thu sau kỳ chưa tính; sang kỳ sau thì tính phần còn lại", async () => {
      const r = await hh("2026-11-01", "2026-11-30");
      expect(r).toEqual([{ nv: NV.a, nguon: "cu", ds_tien: 900000, hh_tien: 90000, ds_the: 0, hh_the: 0 }]);
    });

    it("đối chiếu: theo hoá đơn = thực thu đơn mới + thẻ + còn nợ cuối kỳ + khác; khác = 0 với số liệu sạch", async () => {
      const [d] = await q<Record<string, number>>(`select theo_hoa_don::int, thuc_thu_don_moi::int, tru_the_don_moi::int, con_no_cuoi_ky::int, thu_no_cu::int, tru_the_no_cu::int, khac::int from bc_hoa_hong_doi_chieu('2026-10-01','2026-10-31',null)`);
      expect(d).toEqual({ theo_hoa_don: 330000, thuc_thu_don_moi: 180000, tru_the_don_moi: 50000, con_no_cuoi_ky: 100000, thu_no_cu: 50000, tru_the_no_cu: 0, khac: 0 });
      expect(d.theo_hoa_don - d.thuc_thu_don_moi - d.tru_the_don_moi - d.con_no_cuoi_ky).toBe(d.khac);
      // hoa hồng theo hoá đơn của bc_nhan_vien là số làm gốc
      const [g] = await q<{ s: number }>(`select sum(hoa_hong)::int s from bc_nhan_vien('2026-10-01','2026-10-31',null)`);
      expect(g.s).toBe(d.theo_hoa_don);
    });

    it("lọc chi nhánh khác thì rỗng", async () => {
      const cn2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('DL','Đà Lạt') returning id`))[0].id;
      expect(await q(`select * from bc_hoa_hong_thuc_thu('2026-10-01','2026-10-31',$1)`, [cn2])).toEqual([]);
    });

    it("hoá đơn không có khoản thu nào trong kỳ thì không có hoa hồng thực thu", async () => {
      expect(await hh("2026-12-01", "2026-12-31")).toEqual([]);
    });
  });
});

describe("hoa hồng giới thiệu", () => {
  it("khách giới thiệu trên hoá đơn × tỉ lệ vai gioi_thieu; số SalonHero giữ đúng, chưa ghép thì ghi mã", async () => {
    const { dong } = await tao({ ma: "G1", ngay: "2026-10-07", hang: 1000000, gt: KHGT, nv: [[NV.a, 100]], tt: [{ pt: "chuyen_khoan", tien: 1000000, ngay: "2026-10-07" }] });
    const sh = await tao({ ma: "SH-1", ngay: "2026-10-08", hang: 6000000, nv: [[NV.a, 100]], tt: [{ pt: "chuyen_khoan", tien: 6000000, ngay: "2026-10-08" }] });
    await q(`insert into dong_hoa_hong_goc (dong_id, vai, sh_nhan_vien_id, gia_tri, kieu) values ($1,'gioi_thieu',4940,600000,'PERCENT')`, [sh.dong]);
    await q(`insert into dong_hoa_hong_goc (dong_id, vai, nhan_vien_id, gia_tri, kieu) values ($1,'gioi_thieu',$2,200000,'PERCENT')`, [dong, NV.b]);
    const r = await q(`select nguon, nguoi_ten, nguoi_ma, so_hd::int, doanh_so::int, hoa_hong::int from bc_hoa_hong_gioi_thieu('2026-10-01','2026-10-31',null) order by nguon, nguoi_ten`);
    expect(r).toEqual([
      { nguon: "khach", nguoi_ten: "Chị Giới Thiệu", nguoi_ma: "KH2", so_hd: 1, doanh_so: 1000000, hoa_hong: 50000 },
      { nguon: "salonhero", nguoi_ten: "KTV Bình", nguoi_ma: "NV0002", so_hd: 1, doanh_so: 1000000, hoa_hong: 200000 },
      { nguon: "salonhero", nguoi_ten: "SalonHero #4940 (chưa ghép)", nguoi_ma: null, so_hd: 1, doanh_so: 6000000, hoa_hong: 600000 },
    ]);
    expect(await q(`select * from bc_hoa_hong_gioi_thieu('2026-11-01','2026-11-30',null)`)).toEqual([]);
  });

  it("tỉ lệ cho vai gioi_thieu lưu được, vai lạ bị chặn", async () => {
    await expect(q(`insert into hoa_hong_ti_le (loai, vai, ti_le) values ('san_pham','la',1)`)).rejects.toThrow();
    await q(`insert into hoa_hong_ti_le (loai, vai, ti_le) values ('san_pham','gioi_thieu',3)`);
  });
});
