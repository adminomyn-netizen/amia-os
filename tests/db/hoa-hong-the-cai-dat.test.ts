import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0205: hoa hồng buổi làm bằng thẻ (câu 17) + "Cài đặt nâng cao" theo chi nhánh (câu 18), mặc định = lựa chọn SalonHero đang dùng.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const NV = { an: u(1), binh: u(2), tn: u(9) };
let CN: string, DV: string, KH: string, SP: string;

type Dong = { loai?: "dich_vu" | "san_pham"; gia: number; sl?: number; giam?: number; the?: number; nv: [string, number][]; vai?: string };
async function don(ma: string, d: Dong[], o: { giamDon?: number; gio?: string; ngay?: string } = {}) {
  const hang = d.reduce((s, x) => s + x.gia * (x.sl ?? 1) - (x.giam ?? 0), 0), ptt = hang - (o.giamDon ?? 0);
  const h = (await q<{ id: string }>(
    `insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, giam_gia_don, tong_phai_thu, da_thu, con_no, nguoi_lap_id, gio_vao, la_lich_su)
     values ($1,$2,$3,'hoan_thanh',$4,$5,$6,$7,$7,0,$8,$9,true) returning id`, [ma, CN, KH, o.ngay ?? "2026-10-05", hang, o.giamDon ?? 0, ptt, NV.tn, o.gio ?? null]))[0].id;
  if (ptt > 0) await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) values ($1,'thu','tien_mat',$2,$3,$4,true)`, [h, ptt, o.ngay ?? "2026-10-05", NV.tn]);
  for (const x of d) {
    const loai = x.loai ?? "dich_vu";
    const dg = (await q<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, san_pham_id, ten, so_luong, don_gia, giam_gia, the_khach_sh_id, la_lich_su) values ($1,$2,$3,$4,'X',$5,$6,$7,$8,true) returning id`,
      [h, loai, loai === "dich_vu" ? DV : null, loai === "san_pham" ? SP : null, x.sl ?? 1, x.gia, x.giam ?? 0, x.the ?? null]))[0].id;
    for (const [nv, ti] of x.nv) await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,$3,$4)`, [dg, nv, x.vai ?? (loai === "dich_vu" ? "phuc_vu" : "ban"), ti]);
  }
  return h;
}
const hh = async (tu = "2026-10-01", den = "2026-10-31") => Object.fromEntries((await q<{ nv: string; hh: number }>(`select nhan_vien_id nv, sum(hoa_hong)::int hh from bc_nhan_vien($1,$2,null) group by 1`, [tu, den])).map((r) => [r.nv, r.hh]));
const caiDat = (set: string) => q(`update hoa_hong_cai_dat set ${set} where chi_nhanh_id = $1`, [CN]);
const macDinh = () => caiDat(`chia_deu_dich_vu=false, chia_deu_ban=true, chia_deu_tu_van=true, so_nv_tieu_chuan=1, tinh_sau_giam_gia=true, ap_giam_gia_tong_don=true, he_so_gio='{}', he_so_sao='{}'`);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${NV.an}','An','ktv',$1),('${NV.binh}','Bình','ktv',$1),('${NV.tn}','Thu ngân','thu_ngan',$1)`, [CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV.tn]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom limit 1`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL',$1,'Peel',1000000) returning id`, [nhom]))[0].id;
  SP = (await q<{ id: string }>(`insert into san_pham (ma, ten, gia_ban, don_vi) values ('SP1','Kem',500000,'hộp') returning id`))[0].id;
  await q(`insert into hoa_hong_ti_le (loai, vai, ti_le) values ('dich_vu','phuc_vu',10),('san_pham','ban',10)`);
});

describe("cài đặt mặc định = SalonHero", () => {
  it("migration tạo sẵn cài đặt cho chi nhánh với đúng lựa chọn SalonHero", async () => {
    const [r] = await q(`select chia_deu_dich_vu, chia_deu_ban, chia_deu_tu_van, so_nv_tieu_chuan, tinh_sau_giam_gia, ap_giam_gia_tong_don, he_so_gio, he_so_sao from hoa_hong_cai_dat where chi_nhanh_id = $1`, [CN]);
    expect(r).toEqual({ chia_deu_dich_vu: false, chia_deu_ban: true, chia_deu_tu_van: true, so_nv_tieu_chuan: 1, tinh_sau_giam_gia: true, ap_giam_gia_tong_don: true, he_so_gio: {}, he_so_sao: {} });
  });
});

describe("chia giữa nhiều người (câu 18)", () => {
  it("dịch vụ Giữ nguyên: 2 người làm 50/50 → mỗi người nhận đủ hoa hồng; doanh số vẫn chia 50/50", async () => {
    await macDinh();
    await don("C1", [{ gia: 1000000, nv: [[NV.an, 50], [NV.binh, 50]] }], { ngay: "2026-07-01" });
    expect(await hh("2026-07-01", "2026-07-31")).toEqual({ [NV.an]: 100000, [NV.binh]: 100000 });
    const ds = await q<{ ds: number }>(`select doanh_so::int ds from bc_nhan_vien('2026-07-01','2026-07-31',null) order by 1`);
    expect(ds.map((r) => r.ds)).toEqual([500000, 500000]);
  });
  it("đổi sang Chia đều: 2 người 50/50 → mỗi người một nửa", async () => {
    await caiDat("chia_deu_dich_vu = true");
    expect(await hh("2026-07-01", "2026-07-31")).toEqual({ [NV.an]: 50000, [NV.binh]: 50000 });
  });
  it("Chia đều nhưng số lượng tiêu chuẩn = 2: 2 người không vượt → mỗi người đủ", async () => {
    await caiDat("chia_deu_dich_vu = true, so_nv_tieu_chuan = 2");
    expect(await hh("2026-07-01", "2026-07-31")).toEqual({ [NV.an]: 100000, [NV.binh]: 100000 });
  });
  it("bán sản phẩm mặc định Chia đều: chia theo tỉ lệ chia người (70/30)", async () => {
    await macDinh();
    await don("C2", [{ loai: "san_pham", gia: 1000000, nv: [[NV.an, 70], [NV.binh, 30]] }], { ngay: "2026-06-01" });
    expect(await hh("2026-06-01", "2026-06-30")).toEqual({ [NV.an]: 70000, [NV.binh]: 30000 });
  });
});

describe("giảm giá (câu 18)", () => {
  // dòng 1.000.000 giảm dòng 100.000; giảm tổng đơn 180.000 trên tiền hàng 900.000 → doanh số 720.000
  beforeAll(async () => { await don("G1", [{ gia: 1000000, giam: 100000, nv: [[NV.an, 100]] }], { ngay: "2026-05-01", giamDon: 180000 }); });
  const t5 = () => hh("2026-05-01", "2026-05-31");
  it("mặc định: sau giảm giá, cả giảm dòng và giảm tổng đơn → 10% × 720.000", async () => { await macDinh(); expect(await t5()).toEqual({ [NV.an]: 72000 }); });
  it("chỉ giảm giá từng dòng → 10% × 900.000", async () => { await caiDat("ap_giam_gia_tong_don = false"); expect(await t5()).toEqual({ [NV.an]: 90000 }); });
  it("tính trước giảm giá → 10% × 1.000.000", async () => { await caiDat("tinh_sau_giam_gia = false"); expect(await t5()).toEqual({ [NV.an]: 100000 }); await macDinh(); });
});

describe("hệ số theo giờ và theo sao (câu 18, chỉ vai Phục vụ)", () => {
  let h: string;
  beforeAll(async () => { h = await don("H1", [{ gia: 1000000, nv: [[NV.an, 100]] }], { ngay: "2026-04-01", gio: "2026-04-01T13:30:00+07:00" }); });
  const t4 = () => hh("2026-04-01", "2026-04-30");
  it("trống = 100%", async () => { await macDinh(); expect(await t4()).toEqual({ [NV.an]: 100000 }); });
  it("13 giờ = 120% (theo giờ VN)", async () => { await caiDat(`he_so_gio = '{"13":120,"14":80}'`); expect(await t4()).toEqual({ [NV.an]: 120000 }); });
  it("khách chấm 2 sao, 2 sao = 50% → nhân thêm", async () => {
    await q(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem) values ($1,$2,2)`, [h, NV.an]);
    await caiDat(`he_so_sao = '{"2":50}'`);
    expect(await t4()).toEqual({ [NV.an]: 60000 });
    await macDinh();
  });
});

describe("buổi làm bằng thẻ (câu 17)", () => {
  let G_TU: string, G_CO: string;
  beforeAll(async () => {
    G_TU = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi, tu_tinh_gia_tri_1_lan) values ('GT1','Thẻ tự tính','lan',3000000,10,true) returning id`))[0].id;
    G_CO = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi, gia_tri_1_lan, giam_hh_theo_giam_gia) values ('GT2','Thẻ cố định','lan',2000000,5,500000,true) returning id`))[0].id;
    const the = (ma: string, sh: number, goi: string, tien: number, buoi: number, gtb: number, rieng: number | null) =>
      q(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, tong_tien, gia_tri_buoi, sh_id, gia_tri_1_lan_hh) values ($1,$2,$3,$4,'lan',$5,$6,$7,$8,$9)`, [ma, KH, goi, CN, buoi, tien, gtb, sh, rieng]);
    await the("M1", 1, G_TU, 2700000, 10, 270000, null);    // tự tính: 2.700.000 ÷ 10 = 270.000
    await the("M2", 2, G_CO, 1500000, 5, 300000, null);     // loại cố định 500.000, bán giảm còn 1.5tr/2tr → × 0,75 = 375.000
    await the("M3", 3, G_CO, 2000000, 5, 400000, 450000);   // thẻ khách có số riêng (SalonHero card_use_price) → 450.000
  });
  it("hoa hồng = 10% × số lần × giá 1 lần của thẻ (riêng thẻ khách > tự tính > loại thẻ)", async () => {
    await don("T1", [{ gia: 0, the: 1, nv: [[NV.an, 100]] }, { gia: 0, sl: 2, the: 2, nv: [[NV.binh, 100]] }, { gia: 0, the: 3, nv: [[NV.an, 100]] }], { ngay: "2026-03-01" });
    expect(await hh("2026-03-01", "2026-03-31")).toEqual({ [NV.an]: 27000 + 45000, [NV.binh]: 75000 });
  });
  it("báo cáo thực thu: buổi thẻ không có tiền thu → vào cột trừ thẻ theo ngày hoá đơn; đối chiếu khác = 0", async () => {
    const r = await q<{ nv: string; hh_the: number; hh_tien: number }>(`select nhan_vien_id nv, hoa_hong_the::int hh_the, hoa_hong_tien::int hh_tien from bc_hoa_hong_thuc_thu('2026-03-01','2026-03-31',null) order by 2`);
    expect(r).toEqual([{ nv: NV.an, hh_the: 72000, hh_tien: 0 }, { nv: NV.binh, hh_the: 75000, hh_tien: 0 }]);
    const [d] = await q<{ theo_hoa_don: number; khac: number }>(`select theo_hoa_don::int, khac::int from bc_hoa_hong_doi_chieu('2026-03-01','2026-03-31',null)`);
    expect(d).toEqual({ theo_hoa_don: 147000, khac: 0 });
  });
  it("bảng 4 nhóm + chi tiết dùng cùng công thức", async () => {
    const n = await q<{ hh: number }>(`select sum(hoa_hong)::int hh from bc_hoa_hong_nv_nhom('2026-03-01','2026-03-31',null)`);
    expect(n[0].hh).toBe(147000);
    const c = await q<{ hh: number }>(`select sum(hoa_hong)::int hh from bc_hoa_hong_nv_chi_tiet($1,'2026-03-01','2026-03-31',null)`, [NV.an]);
    expect(c[0].hh).toBe(72000);
  });
});
