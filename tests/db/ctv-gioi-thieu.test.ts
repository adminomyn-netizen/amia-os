import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// CTV / giới thiệu đầy đủ (0314): REF = SĐT (REF cũ còn 90 ngày), đặt lịch qua REF → lịch + khách + lead, sổ bút toán hoa hồng (ghi nhận / đảo khi huỷ),
// hoa hồng riêng theo dịch vụ, chi trả hoa hồng (máy trạng thái, người tạo không tự duyệt / tự chi, phiếu chi vào Sổ quỹ, từ chối trả về số dư).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const NV = { mkt: u(1), ql: u(2), ketoan: u(3), letan: u(4) };
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];
const loi = async (sql: string, p: unknown[] = []) => {
  try { await db.query(sql, p); } catch (e) { return (e as Error).message; }
  return "";
};
let CN: string, DV: string, DV2: string, KH: string;
let so = 0;
const taoDt = async (ten: string, dt: string | null, them: Record<string, unknown> = {}) => {
  const cot = ["ma", "ten", "loai", "dien_thoai", "ma_gioi_thieu", "hh_kieu", "hh_gia_tri", ...Object.keys(them)];
  const gt = [`DTT${++so}`, ten, "ctv", dt, `GTT${so}X`, "phan_tram", 10, ...Object.values(them)];
  return (await one<{ id: string }>(`insert into doi_tac_gt (${cot.join(",")}) values (${cot.map((_, i) => `$${i + 1}`).join(",")}) returning id`, gt)).id;
};
/** Hoá đơn nháp có các dòng (dịch vụ, đơn giá, người giới thiệu dòng) rồi chốt bằng cách đổi trạng thái như chot_hoa_don. */
const taoHd = async (dong: { dv: string; gia: number; gt?: { id: string; kieu: string; gt: number } }[], ngay = "2026-06-15") => {
  const tong = dong.reduce((s, d) => s + d.gia, 0);
  const h = (await one<{ id: string }>(
    `insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, nguoi_lap_id) values ($1,$2,$3,'nhap',$4,$5,$5,$6) returning id`,
    [`HDT${++so}`, CN, KH, ngay, tong, NV.letan])).id;
  for (const d of dong) await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia, gt_doi_tac_id, gt_kieu, gt_gia_tri) values ($1,'dich_vu',$2,'DV',1,$3,$4,$5,$6)`,
    [h, d.dv, d.gia, d.gt?.id ?? null, d.gt?.kieu ?? null, d.gt?.gt ?? null]);
  await q(`update hoa_don set trang_thai='hoan_thanh' where id=$1`, [h]);
  return h;
};
const soDu = async (dt: string) => one<{ tong_hh: number; da_chi: number; dang_cho: number; kha_dung: number }>(
  `select tong_hh::int, da_chi::int, dang_cho::int, kha_dung::int from so_du_hh_gt($1)`, [dt]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await one<{ id: string }>(`select id from chi_nhanh where ma='VINH'`)).id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Marketing','marketing',$5),($2,'Quản lý','quan_ly',$5),($3,'Kế toán','ke_toan',$5),($4,'Lễ tân','le_tan',$5)`,
    [NV.mkt, NV.ql, NV.ketoan, NV.letan, CN]);
  KH = (await one<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KHT1','Chị Mua','0911222333',$1,'mkt',$2) returning id`, [CN, NV.letan])).id;
  const nhom = (await one<{ id: string }>(`select id from dich_vu_nhom limit 1`)).id;
  DV = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEELT',$1,'Peel da',1000000) returning id`, [nhom])).id;
  DV2 = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('LASERT',$1,'Laser',2000000) returning id`, [nhom])).id;
  await q(`update cau_hinh set gia_tri='2026-01-01' where khoa='ctv.but_toan_tu_ngay'`);
});

describe("Mã REF = SĐT (0314)", () => {
  it("REF tự lấy từ SĐT di động; số bàn / số sai thì không có REF", async () => {
    const a = await taoDt("CTV A", "0912 345 678");
    const b = await taoDt("CTV B", "02383123456");
    expect((await one<{ ma_ref: string }>(`select ma_ref from doi_tac_gt where id=$1`, [a])).ma_ref).toBe("0912345678");
    expect((await one<{ ma_ref: string | null }>(`select ma_ref from doi_tac_gt where id=$1`, [b])).ma_ref).toBeNull();
    expect((await one<{ r: string }>(`select doi_tac_theo_ref('+84912345678') r`)).r).toBe(a);
    expect((await one<{ r: string }>(`select doi_tac_theo_ref('0912345678') r`)).r).toBe(a);
  });

  it("hai nguồn không chung một REF", async () => {
    expect(await loi(`insert into doi_tac_gt (ma, ten, dien_thoai, ma_gioi_thieu) values ('DTX1','Trùng','0912345678','GTXX1')`)).toMatch(/mã REF của nguồn giới thiệu khác/);
  });

  it("đổi SĐT: REF cũ còn dùng 90 ngày, hết hạn thì thôi; nguồn khác chưa lấy được số cũ", async () => {
    const c = await taoDt("CTV C", "0987000111");
    await q(`update doi_tac_gt set dien_thoai='0987000222' where id=$1`, [c]);
    expect((await one<{ r: string }>(`select doi_tac_theo_ref('0987000111') r`)).r).toBe(c);
    expect((await one<{ r: string }>(`select doi_tac_theo_ref('0987000222') r`)).r).toBe(c);
    expect((await one<{ r: string | null }>(`select doi_tac_theo_ref('0987000111', now() + interval '91 days') r`)).r).toBeNull();
    expect((await one<{ r: string }>(`select doi_tac_theo_ref('0987000111', now() + interval '89 days') r`)).r).toBe(c);
    expect(await loi(`insert into doi_tac_gt (ma, ten, dien_thoai, ma_gioi_thieu) values ('DTX2','Lấy số cũ','0987000111','GTXX2')`)).toMatch(/REF cũ của nguồn khác/);
  });

  it("mã GT cũ vẫn là mã phụ; nguồn ngừng hợp tác thì REF không còn tác dụng", async () => {
    const d = await taoDt("CTV D", "0977000333");
    const ma = (await one<{ ma_gioi_thieu: string }>(`select ma_gioi_thieu from doi_tac_gt where id=$1`, [d])).ma_gioi_thieu;
    expect((await one<{ r: string }>(`select doi_tac_theo_ref($1) r`, [ma.toLowerCase()])).r).toBe(d);
    await q(`update doi_tac_gt set hoat_dong=false where id=$1`, [d]);
    expect((await one<{ r: string | null }>(`select doi_tac_theo_ref('0977000333') r`)).r).toBeNull();
  });

  it("lượt ghé: mỗi IP băm một lượt / ngày, trả tên hiển thị", async () => {
    const e = await taoDt("Nguyễn Thị E", "0966000444", { ten_hien_thi: "Chị E" });
    const r = await one<{ r: { ten: string } }>(`select ghi_luot_ghe_ref('0966000444','abcdef0123456789') r`);
    expect(r.r.ten).toBe("Chị E");
    await q(`select ghi_luot_ghe_ref('0966000444','abcdef0123456789')`);
    await q(`select ghi_luot_ghe_ref('0966000444','fffff00000111112')`);
    expect((await one<{ n: number }>(`select count(*)::int n from luot_ghe_ref where doi_tac_id=$1`, [e])).n).toBe(2);
    expect((await one<{ r: unknown }>(`select ghi_luot_ghe_ref('0999999999','abcdef0123456789') r`)).r).toBeNull();
  });
});

describe("Đặt lịch qua REF", () => {
  let F: string;
  const dat = (sdt: string, ref: string | null, gio = 10) =>
    one<{ r: { lich_id: string; gioi_thieu: boolean } }>(`select dat_lich_online($1,'{}'::uuid[], $2::timestamptz, 'Chị Lan', $3, 'nữ', 1, null, null, 'ipbam12345678', $4) r`,
      [CN, `${new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)}T${String(gio).padStart(2, "0")}:00:00+07:00`, sdt, ref]);
  beforeAll(async () => {
    F = await taoDt("CTV F", "0933000555");
    await q(`insert into cau_hinh (khoa, gia_tri) values ('dat_online.mo','1') on conflict (khoa) do update set gia_tri='1'`);
    await q(`insert into cho_lam (chi_nhanh_id, ten) values ($1,'Giường 1'),($1,'Giường 2')`, [CN]);
    await q(`update chi_nhanh set hien_dat_lich=true, hoat_dong=true where id=$1`, [CN]);
  });

  it("khách mới: lịch hẹn + yêu cầu + khách mang người giới thiệu, có lead nguồn CTV ở cột Đã đặt lịch", async () => {
    const r = (await dat("0944111222", "0933000555")).r;
    expect(r.gioi_thieu).toBe(true);
    const l = await one<{ doi_tac_id: string; khach_id: string }>(`select doi_tac_id, khach_id from lich_hen where id=$1`, [r.lich_id]);
    expect(l.doi_tac_id).toBe(F);
    expect((await one<{ doi_tac_id: string }>(`select doi_tac_id from yeu_cau_dat_lich where lich_id=$1`, [r.lich_id])).doi_tac_id).toBe(F);
    expect((await one<{ doi_tac_id: string }>(`select doi_tac_id from khach_hang where id=$1`, [l.khach_id])).doi_tac_id).toBe(F);
    const ld = await one<{ doi_tac_id: string; khach_id: string; nguon: string; gd: string; ket_qua: string }>(
      `select l.doi_tac_id, l.khach_id, n.ma nguon, g.ma gd, l.ket_qua from lead l join nguon_lead n on n.id=l.nguon_id join lead_giai_doan g on g.id=l.giai_doan_id where l.sdt='0944111222'`);
    expect(ld).toMatchObject({ doi_tac_id: F, khach_id: l.khach_id, nguon: "ctv", gd: "da_dat_lich", ket_qua: "open" });
  });

  it("lịch nhân viên tạo sau cho khách đó tự mang nguồn", async () => {
    const k = (await one<{ id: string }>(`select id from khach_hang where dien_thoai='0944111222'`)).id;
    const l = await one<{ doi_tac_id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,now()+interval '5 days',now()+interval '5 days 1 hour') returning doi_tac_id`, [k, CN]);
    expect(l.doi_tac_id).toBe(F);
  });

  it("khách cũ: lịch mang nguồn nhưng không tạo lead mới; tự giới thiệu chính mình thì bỏ qua", async () => {
    const r = (await dat("0911222333", "0933000555", 11)).r;
    expect(r.gioi_thieu).toBe(true);
    expect((await one<{ n: number }>(`select count(*)::int n from lead where sdt='0911222333'`)).n).toBe(0);
    const r2 = (await dat("0933000555", "0933000555", 12)).r;
    expect(r2.gioi_thieu).toBe(false);
    expect((await one<{ doi_tac_id: string | null }>(`select doi_tac_id from lich_hen where id=$1`, [r2.lich_id])).doi_tac_id).toBeNull();
  });

  it("REF sai không làm hỏng đặt lịch", async () => {
    const r = (await dat("0955111999", "abc-<script>", 13)).r;
    expect(r.gioi_thieu).toBe(false);
    expect(r.lich_id).toBeTruthy();
  });
});

describe("Sổ bút toán hoa hồng giới thiệu", () => {
  let G: string;
  beforeAll(async () => { G = await taoDt("CTV G", "0922000666"); });

  it("chốt hoá đơn → ghi nhận; huỷ → bút toán đảo âm, tổng về 0", async () => {
    const h = await taoHd([{ dv: DV, gia: 1000000, gt: { id: G, kieu: "phan_tram", gt: 10 } }]);
    let bt = await q<{ loai: string; so_tien: number; doanh_so: number }>(`select loai, so_tien::int, doanh_so::int from but_toan_hh_gt where hoa_don_id=$1 order by ghi_luc, so_tien desc`, [h]);
    expect(bt).toEqual([{ loai: "ghi_nhan", so_tien: 100000, doanh_so: 1000000 }]);
    await q(`update hoa_don set trang_thai='huy' where id=$1`, [h]);
    bt = await q(`select loai, so_tien::int, doanh_so::int from but_toan_hh_gt where hoa_don_id=$1 order by so_tien desc`, [h]);
    expect(bt).toEqual([{ loai: "ghi_nhan", so_tien: 100000, doanh_so: 1000000 }, { loai: "dao", so_tien: -100000, doanh_so: -1000000 }]);
    expect((await soDu(G)).tong_hh).toBe(0);
  });

  it("đối chiếu lại không ghi trùng; sổ chỉ thêm, không sửa/xoá", async () => {
    const h = await taoHd([{ dv: DV, gia: 500000, gt: { id: G, kieu: "tien", gt: 30000 } }]);
    expect((await one<{ n: number }>(`select ghi_but_toan_hh_gt($1) n`, [h])).n).toBe(0);
    await q(`select dong_bo_but_toan_hh_gt()`);
    expect((await one<{ n: number }>(`select count(*)::int n from but_toan_hh_gt where hoa_don_id=$1`, [h])).n).toBe(1);
    expect(await loi(`update but_toan_hh_gt set so_tien=0 where hoa_don_id=$1`, [h])).toMatch(/chỉ được thêm dòng/);
    expect(await loi(`delete from but_toan_hh_gt where hoa_don_id=$1`, [h])).toMatch(/chỉ được thêm dòng/);
    expect((await soDu(G)).tong_hh).toBe(30000);
  });

  it("mở lại để sửa rồi chốt lại: đảo bút toán cũ, ghi nhận theo mức mới; dòng của hoá đơn đã chốt không sửa được", async () => {
    const h = await taoHd([{ dv: DV2, gia: 2000000, gt: { id: G, kieu: "phan_tram", gt: 5 } }]);
    expect(await loi(`update hoa_don_dong set gt_gia_tri=10 where hoa_don_id=$1`, [h])).toMatch(/không sửa dòng/);
    await q(`update hoa_don set trang_thai='nhap' where id=$1`, [h]);
    await q(`update hoa_don_dong set gt_gia_tri=10 where hoa_don_id=$1`, [h]);
    await q(`update hoa_don set trang_thai='hoan_thanh' where id=$1`, [h]);
    const bt = await q<{ loai: string; so_tien: number }>(`select loai, so_tien::int from but_toan_hh_gt where hoa_don_id=$1 order by ghi_luc, id`, [h]);
    expect(bt.map((x) => x.loai).sort()).toEqual(["dao", "ghi_nhan", "ghi_nhan"]);
    expect(bt.reduce((s, x) => s + x.so_tien, 0)).toBe(200000);
  });

  it("hoá đơn trước ngày bắt đầu sổ hoặc lịch sử SalonHero: không vào sổ", async () => {
    const h = await taoHd([{ dv: DV, gia: 1000000, gt: { id: G, kieu: "phan_tram", gt: 10 } }], "2025-12-31");
    expect((await one<{ n: number }>(`select count(*)::int n from but_toan_hh_gt where hoa_don_id=$1`, [h])).n).toBe(0);
  });

  it("người giới thiệu cả đơn (khách là nguồn): dùng mức riêng theo dịch vụ, không có thì mức mặc định", async () => {
    const kgt = (await one<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KHT9','Chị Nguồn','0988777666',$1,'mkt',$2) returning id`, [CN, NV.letan])).id;
    const H = await taoDt("Chị Nguồn", "0988777666", { khach_id: kgt });
    await q(`insert into doi_tac_hh_muc (doi_tac_id, loai, muc_id, kieu, gia_tri) values ($1,'dich_vu',$2,'tien',50000)`, [H, DV2]);
    const h = (await one<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, nguoi_lap_id, nguoi_gioi_thieu_id) values ('HDTN',$1,$2,'nhap','2026-06-20',3000000,3000000,$3,$4) returning id`, [CN, KH, NV.letan, kgt])).id;
    await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia) values ($1,'dich_vu',$2,'Peel',1,1000000),($1,'dich_vu',$3,'Laser',1,2000000)`, [h, DV, DV2]);
    await q(`update hoa_don set trang_thai='hoan_thanh' where id=$1`, [h]);
    const bt = await q<{ muc_id: string; so_tien: number }>(`select muc_id, so_tien::int from but_toan_hh_gt where hoa_don_id=$1 order by so_tien`, [h]);
    expect(bt).toEqual([{ muc_id: DV2, so_tien: 50000 }, { muc_id: DV, so_tien: 100000 }]);
    const bc = await one<{ hoa_hong: number }>(`select hoa_hong::int from bc_hoa_hong_gioi_thieu('2026-06-20','2026-06-20') where nguoi_khoa=$1`, [kgt]);
    expect(bc.hoa_hong).toBe(150000);
    // Đổi mức của nguồn sau khi đã ghi sổ: đối chiếu lại không đổi bút toán cũ.
    await q(`update doi_tac_hh_muc set gia_tri=90000 where doi_tac_id=$1`, [H]);
    await q(`update doi_tac_gt set hh_gia_tri=50 where id=$1`, [H]);
    await q(`select dong_bo_but_toan_hh_gt()`);
    expect((await one<{ s: number }>(`select sum(so_tien)::int s from but_toan_hh_gt where hoa_don_id=$1`, [h])).s).toBe(150000);
  });
});

describe("Chi trả hoa hồng", () => {
  let K: string, QUY_TM: string, QUY_NH: string;
  beforeAll(async () => {
    K = await taoDt("CTV K", "0911000777");
    await taoHd([{ dv: DV, gia: 1000000, gt: { id: K, kieu: "phan_tram", gt: 20 } }]); // 200.000
    const tm = await q<{ id: string }>(`select id from quy where chi_nhanh_id=$1 and loai='tien_mat'`, [CN]);
    QUY_TM = tm[0]?.id ?? (await one<{ id: string }>(`insert into quy (chi_nhanh_id, loai, ten) values ($1,'tien_mat','Tiền mặt') returning id`, [CN])).id;
    const nh = await q<{ id: string }>(`select id from quy where chi_nhanh_id=$1 and loai='ngan_hang'`, [CN]);
    QUY_NH = nh[0]?.id ?? (await one<{ id: string }>(`insert into quy (chi_nhanh_id, loai, ten) values ($1,'ngan_hang','Ngân hàng') returning id`, [CN])).id;
  });
  const tao = (tien: number, ht = "tien_mat") => one<{ id: string }>(`select rut_hh_tao($1,$2,$3,'VCB','0123','NGUYEN K',null,$4) id`, [K, tien, ht, NV.mkt]);

  it("không rút quá số dư, dưới mức tối thiểu; mỗi lúc một yêu cầu", async () => {
    expect(await loi(`select rut_hh_tao($1,300000,'tien_mat',null,null,null,null,$2)`, [K, NV.mkt])).toMatch(/vượt số dư/);
    await q(`update cau_hinh set gia_tri='150000' where khoa='ctv.toi_thieu_rut'`);
    expect(await loi(`select rut_hh_tao($1,100000,'tien_mat',null,null,null,null,$2)`, [K, NV.mkt])).toMatch(/tối thiểu/);
    await q(`update cau_hinh set gia_tri='0' where khoa='ctv.toi_thieu_rut'`);
    expect(await loi(`select rut_hh_tao($1,100000,'chuyen_khoan',null,null,null,null,$2)`, [K, NV.mkt])).toMatch(/check/i);
    await tao(150000);
    expect(await loi(`select rut_hh_tao($1,10000,'tien_mat',null,null,null,null,$2)`, [K, NV.mkt])).toMatch(/chưa xử lý xong/);
    expect(await soDu(K)).toEqual({ tong_hh: 200000, da_chi: 0, dang_cho: 150000, kha_dung: 50000 });
  });

  it("từ chối có lý do: tiền quay về số dư", async () => {
    const r = (await one<{ id: string }>(`select id from yeu_cau_rut_hh where doi_tac_id=$1 and trang_thai='cho_xu_ly'`, [K])).id;
    expect(await loi(`select rut_hh_tu_choi($1,$2,'')`, [r, NV.ql])).toMatch(/lý do/);
    await q(`select rut_hh_tu_choi($1,$2,'Sai số tài khoản')`, [r, NV.ql]);
    expect(await soDu(K)).toEqual({ tong_hh: 200000, da_chi: 0, dang_cho: 0, kha_dung: 200000 });
    expect(await loi(`update yeu_cau_rut_hh set trang_thai='cho_xu_ly' where id=$1`, [r])).toMatch(/kết thúc/);
  });

  it("duyệt: người tạo không tự duyệt, phải đủ hạn mức; đã chi: sinh đúng một phiếu chi, người duyệt không tự chi", async () => {
    const r = (await tao(200000)).id;
    expect(await loi(`select rut_hh_da_chi($1,$2,$3)`, [r, NV.ketoan, QUY_TM])).toMatch(/chưa được duyệt/);
    expect(await loi(`select rut_hh_duyet($1,$2)`, [r, NV.mkt])).toMatch(/không tự duyệt/);
    expect(await loi(`select rut_hh_duyet($1,$2)`, [r, NV.ketoan])).toMatch(/Hạn mức/);
    await q(`select rut_hh_duyet($1,$2)`, [r, NV.ql]);
    expect(await loi(`select rut_hh_da_chi($1,$2,$3)`, [r, NV.ql, QUY_TM])).toMatch(/Người duyệt không tự/);
    expect(await loi(`select rut_hh_da_chi($1,$2,$3)`, [r, NV.mkt, QUY_TM])).toMatch(/Người tạo/);
    expect(await loi(`select rut_hh_da_chi($1,$2,$3)`, [r, NV.ketoan, QUY_NH])).toMatch(/không khớp/);
    const pc = (await one<{ id: string }>(`select rut_hh_da_chi($1,$2,$3) id`, [r, NV.ketoan, QUY_TM])).id;
    const sq = await one<{ loai: string; so_tien: number; ten: string }>(`select s.loai, s.so_tien::int, lt.ten from so_quy s join loai_thu_chi lt on lt.id=s.loai_thu_chi_id where s.id=$1`, [pc]);
    expect(sq).toEqual({ loai: "chi", so_tien: 200000, ten: "Chi hoa hồng giới thiệu" });
    expect(await soDu(K)).toEqual({ tong_hh: 200000, da_chi: 200000, dang_cho: 0, kha_dung: 0 });
    expect(await loi(`select rut_hh_tu_choi($1,$2,'x')`, [r, NV.ql])).toMatch(/kết thúc/);
    expect(await loi(`update yeu_cau_rut_hh set so_tien=1 where id=$1`, [r])).toMatch(/Không sửa số tiền/);
    expect(await loi(`delete from yeu_cau_rut_hh where id=$1`, [r])).toMatch(/không xoá/);
  });

  it("bảng nguồn gộp số: hoa hồng theo kỳ, chưa thanh toán = tổng sổ − đã chi", async () => {
    const r = await one<{ so_don: number; doanh_thu: number; hoa_hong: number; chua_thanh_toan: number; so_khach: number }>(
      `select so_don, doanh_thu::int, hoa_hong::int, chua_thanh_toan::int, so_khach from bc_nguon_gioi_thieu('2026-06-01','2026-06-30') where doi_tac_id=$1`, [K]);
    expect(r).toEqual({ so_don: 1, doanh_thu: 1000000, hoa_hong: 200000, chua_thanh_toan: 0, so_khach: 1 });
  });
});
