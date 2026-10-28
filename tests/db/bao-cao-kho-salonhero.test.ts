import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0121: sáu báo cáo kho kiểu SalonHero (nhập xuất kho hàng, nhập kho, xuất kho, bán sản phẩm, tồn theo lô, chi phí dịch vụ).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let VINH: string, DALAT: string, A: string, B: string, VT: string, DV: string;
const so = (v: unknown) => Number(v);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  VINH = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  DALAT = (await q<{ id: string }>(`select id from chi_nhanh where ma='DALAT'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id, trang_thai_lam) values ($1,'Thu ngân','thu_ngan',$2,'dang_lam'),($3,'KTV Vinh','ktv',$2,'dang_lam')`, [u(1), VINH, u(2)]);
  const sp = async (ma: string, ten: string, nhom: string, banLe: boolean, von: number | null, ton: number) =>
    (await q<{ id: string }>(`insert into san_pham (ma, ten, nhom, don_vi, gia_ban, ban_le, gia_nhap_don_vi, ton_toi_thieu) values ($1,$2,$3,'cái',1000,$4,$5,$6) returning id`, [ma, ten, nhom, banLe, von, ton]))[0].id;
  A = await sp("SPA", "Kem A", "Thermo", true, 300, 0);
  B = await sp("SPB", "Kem B", "Quà tặng", true, null, 5);
  VT = await sp("VT1", "Găng tay", "Vật tư tiêu hao", false, 50, 0);
  const so_cai = (cn: string, spx: string, loai: string, sl: number, ngay: string, o: { ghi?: string; gia?: number; lo?: string; han?: string; hd?: string; pc?: string } = {}) =>
    q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, so_lo, han_dung, ghi_chu, hoa_don_id, phieu_cap_id, tao_luc) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,($11::date + time '10:00') at time zone 'Asia/Ho_Chi_Minh')`,
      [cn, spx, loai, sl, o.gia ?? null, o.lo ?? null, o.han ?? null, o.ghi ?? null, o.hd ?? null, o.pc ?? null, ngay]);
  // Số dư đầu (không tính là nhập) + nhập trong kỳ + bán + chuyển kho + hao hụt
  await so_cai(VINH, A, "nhap", 10, "2026-10-25", { ghi: "Tồn đầu kỳ chuyển từ SalonHero" });
  await so_cai(VINH, A, "nhap", 5, "2026-10-10", { gia: 200, lo: "L1", han: "2027-12-31" });
  await so_cai(VINH, A, "xuat_ban", -2, "2026-10-12");
  await so_cai(VINH, A, "chuyen_di", -1, "2026-10-13", { ghi: "Chuyển kho CK000001" });
  await so_cai(VINH, A, "hao_hut", -1, "2026-10-14");
  await so_cai(VINH, A, "nhap", 4, "2026-09-20", { gia: 100 });
  await so_cai(DALAT, A, "chuyen_den", 1, "2026-10-13", { ghi: "Chuyển kho CK000001" });
  await so_cai(VINH, B, "nhap", 3, "2026-10-01", { ghi: "Tồn đầu kỳ chuyển từ SalonHero", lo: "LB", han: "2020-01-01" });
});

describe("bc_kho_nhap_xuat", () => {
  it("tồn đầu kỳ gồm số dư đầu và nhập trước kỳ; nhập, xuất, chuyển kho đúng; cuối kỳ khớp", async () => {
    const r = await q(`select * from bc_kho_nhap_xuat('2026-10-01','2026-10-31',$1)`, [VINH]);
    const a = r.find((x) => x.ma === "SPA")!;
    expect([a.dau, a.nhap, a.xuat, a.nhap_cd, a.xuat_cd, a.cuoi].map(so)).toEqual([14, 5, 3, 0, 1, 15]);
    expect(so(a.gia_nhap_tb)).toBeCloseTo(155.56, 1);
    expect(r.map((x) => x.ma)).not.toContain("VT1"); // vật tư tiêu hao không phải hàng bán lẻ
    expect([so(r[0].tong_dong), so(r[0].tong_dau), so(r[0].tong_cuoi)]).toEqual([2, 17, 18]);
  });
  it("kỳ một ngày trước nhập: nhập = 0, dầu kỳ vẫn gồm số dư đầu; lọc nhóm và tìm không dấu", async () => {
    const [a] = await q(`select * from bc_kho_nhap_xuat('2026-10-10','2026-10-10',$1,'Thermo','kem a')`, [VINH]);
    expect([a.dau, a.nhap, a.cuoi].map(so)).toEqual([14, 5, 19]);
    expect(await q(`select 1 from bc_kho_nhap_xuat('2026-10-10','2026-10-10',$1,'Quà tặng','kem a')`, [VINH])).toHaveLength(0);
  });
  it("tất cả chi nhánh: chuyển đi và chuyển đến triệt tiêu nhau", async () => {
    const [a] = await q(`select * from bc_kho_nhap_xuat('2026-10-01','2026-10-31',null,null,'SPA')`);
    expect([a.nhap_cd, a.xuat_cd, a.cuoi].map(so)).toEqual([1, 1, 16]);
  });
  it("phân trang", async () => {
    const r = await q(`select ma, tong_dong from bc_kho_nhap_xuat('2026-10-01','2026-10-31',$1,null,null,1,1)`, [VINH]);
    expect(r).toHaveLength(1);
    expect(so(r[0].tong_dong)).toBe(2);
  });
});

describe("bc_kho_nhap", () => {
  it("chi tiết: không tính số dư đầu; giá nhập × số lượng; tổng chi phí", async () => {
    const r = await q(`select * from bc_kho_nhap('2026-10-01','2026-10-31',$1,'ncc')`, [VINH]);
    expect(r).toHaveLength(1);
    expect([r[0].lo, so(r[0].so_luong), so(r[0].gia_nhap), so(r[0].tong_tien), so(r[0].tong_chi_phi), so(r[0].giam_gia)]).toEqual(["L1", 5, 200, 1000, 1000, 0]);
    expect(String(r[0].ma_phieu)).toMatch(/^NK\d{6}$/);
  });
  it("nguồn Các chi nhánh lấy dòng chuyển đến; Tổng quan gom theo sản phẩm", async () => {
    const r = await q(`select * from bc_kho_nhap('2026-10-01','2026-10-31',null,'cn')`);
    expect(r).toHaveLength(1);
    expect(r[0].ma_phieu).toBe("CK000001");
    const t = await q(`select * from bc_kho_nhap('2026-09-01','2026-10-31',$1,null,null,null,true)`, [VINH]);
    expect(t).toHaveLength(1);
    expect([so(t[0].so_luong), so(t[0].tong_tien)]).toEqual([9, 1400]);
  });
});

describe("bc_kho_xuat", () => {
  it("chỉ lấy xuất tay (hao hụt, tiêu hao…), không lấy bán lẻ và chuyển kho; lọc phân loại", async () => {
    const r = await q(`select * from bc_kho_xuat('2026-10-01','2026-10-31',$1)`, [VINH]);
    expect(r).toHaveLength(1);
    expect([r[0].phan_loai, so(r[0].so_luong), so(r[0].gia_tb), so(r[0].gia_von)]).toEqual(["huy", 1, 300, 300]);
    expect(await q(`select 1 from bc_kho_xuat('2026-10-01','2026-10-31',$1,'tieu_hao')`, [VINH])).toHaveLength(0);
    expect(await q(`select 1 from bc_kho_xuat('2026-10-01','2026-10-31',$1,'huy')`, [VINH])).toHaveLength(1);
  });
});

describe("bc_ton_theo_lo", () => {
  it("lô có hạn; lọc hết hạn / còn hạn", async () => {
    const r = await q(`select * from bc_ton_theo_lo($1)`, [VINH]);
    expect(r.length).toBeGreaterThanOrEqual(1);
    const het = await q(`select ma from bc_ton_theo_lo($1,null,null,'het_han')`, [VINH]);
    expect(het.map((x) => x.ma)).toEqual(["SPB"]);
    const con = await q(`select ma from bc_ton_theo_lo($1,null,null,'con_han')`, [VINH]);
    expect(con.map((x) => x.ma)).toEqual(["SPA"]);
  });
});

describe("bc_ban_san_pham", () => {
  it("doanh thu sau giảm giá cả đơn, giá vốn, lợi nhuận; Tổng quan gom theo sản phẩm", async () => {
    const hd = (await q<{ id: string }>(`insert into hoa_don (ma, sh_ma, chi_nhanh_id, trang_thai, ngay_hd, tong_hang, giam_gia_don, tong_phai_thu, da_thu, nguoi_lap_id, la_lich_su, tao_luc)
      values ('H1','26100001',$1,'hoan_thanh','2026-10-12',2000,500,1500,1500,$2,true,'2026-10-12 10:30+07') returning id`, [VINH, u(1)]))[0].id;
    await q(`insert into hoa_don_dong (hoa_don_id, loai, san_pham_id, ten, so_luong, don_gia, la_lich_su) values ($1,'san_pham',$2,'Kem A',2,1000,true)`, [hd, A]);
    const r = await q(`select * from bc_ban_san_pham('2026-10-01','2026-10-31',$1)`, [VINH]);
    expect(r).toHaveLength(1);
    expect([r[0].ma_hd, so(r[0].so_luong), so(r[0].doanh_thu), so(r[0].gia_sau), so(r[0].gia_von), so(r[0].loi_nhuan), so(r[0].tong_doanh_thu), so(r[0].tong_nhap)]).toEqual(["26100001", 2, 1500, 750, 300, 900, 1500, 600]);
    const t = await q(`select * from bc_ban_san_pham('2026-10-01','2026-10-31',$1,null,true)`, [VINH]);
    expect([t.length, so(t[0].doanh_thu), so(t[0].loi_nhuan)]).toEqual([1, 1500, 900]);
  });
});

describe("bc_chi_phi_dich_vu", () => {
  it("rỗng khi chưa có phiếu cấp đã làm; có phiếu thì cộng dùng thật = cấp − trả", async () => {
    expect(await q(`select 1 from bc_chi_phi_dich_vu('2026-10-01','2026-10-31')`)).toHaveLength(0);
    const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom limit 1`))[0].id;
    DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('DV1',$1,'Triệt lông',100000) returning id`, [nhom]))[0].id;
    const k = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K1','Khách','0900000001',$1,'mkt',$2) returning id`, [VINH, u(1)]))[0].id;
    const pc = (await q<{ id: string }>(`insert into phieu_cap (ma, chi_nhanh_id, khach_id, dich_vu_id, bac_si_id, ktv_id, trang_thai, lam_xong_luc, tao_boi) values ('PC1',$1,$2,$3,$4,$4,'da_lam','2026-10-20 11:00+07',$4) returning id`, [VINH, k, DV, u(2)]))[0].id;
    await q(`insert into phieu_cap_dong (phieu_id, san_pham_id, nhom_cap, dinh_muc, so_cap, so_tra, don_gia) values ($1,$2,'A',3,4,1,50)`, [pc, VT]);
    const r = await q(`select * from bc_chi_phi_dich_vu('2026-10-01','2026-10-31',$1,$2,$3)`, [VINH, DV, u(2)]);
    expect([so(r[0].so_luong), so(r[0].so_lan), so(r[0].chi_phi), so(r[0].tong_chi_phi)]).toEqual([3, 1, 150, 150]);
    const ct = await q(`select * from bc_chi_phi_dich_vu_ct('2026-10-01','2026-10-31',$1,$2)`, [VINH, VT]);
    expect([ct[0].ma, ct[0].nguoi_lam, so(ct[0].chi_phi)]).toEqual(["PC1", "KTV Vinh", 150]);
  });
});
