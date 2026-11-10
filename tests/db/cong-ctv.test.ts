import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { kyPhien, docPhien, bamMa, soMa } from "../../src/lib/ctv-ky";

// Cổng CTV (0317): mã xác thực (giới hạn gửi, 5 lần nhập, dùng 1 lần, không lộ SĐT đã đăng ký), tự đăng ký (REF = SĐT, mức HH từ cài đặt, chặn SĐT đã là đối tác),
// phiên ký HMAC + phiên bản phiên, chi trả từ cổng (cùng quy tắc rut_hh_tao), số liệu cổng chỉ của đúng một nguồn + đã che, thư CTV (công tắc, bỏ qua), khiếu nại đối soát.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const NV = { mkt: u(1), ql: u(2), letan: u(4) };
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];
const loi = async (sql: string, p: unknown[] = []) => {
  try { await db.query(sql, p); } catch (e) { return (e as Error).message; }
  return "";
};
const BAM = (x: string) => x.padEnd(64, "0");
let CN: string, DV: string;
let so = 0;
/** Lùi thời điểm tạo mọi mã của một SĐT (giả lập thời gian trôi). */
const lui = (sdt: string, khoang: string) => q(`update ctv_ma_xac_thuc set tao_luc = tao_luc - interval '${khoang}' where sdt=$1`, [sdt]);
const taoMa = (muc: string, sdt: string, email: string | null, ip = "ip-mac-dinh-01", dt: string | null = null, duLieu = "{}") =>
  one<{ r: { id: string; gui: boolean; email: string | null; doi_tac_id: string | null } }>(`select ctv_ma_tao($1,$2,$3,$4,$5,$6::jsonb,$7) r`, [muc, sdt, email, BAM(`ma${++so}`), ip, duLieu, dt]);
const taoKhach = async (ten: string, sdt: string) => (await one<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ($1,$2,$3,$4,'mkt',$5) returning id`, [`KHC${++so}`, ten, sdt, CN, NV.letan])).id;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await one<{ id: string }>(`select id from chi_nhanh where ma='VINH'`)).id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Marketing','marketing',$4),($2,'Quản lý','quan_ly',$4),($3,'Lễ tân','le_tan',$4)`, [NV.mkt, NV.ql, NV.letan, CN]);
  const nhom = (await one<{ id: string }>(`select id from dich_vu_nhom limit 1`)).id;
  DV = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('TRIMUN',$1,'Trị mụn chuyên sâu',1000000) returning id`, [nhom])).id;
  await q(`update cau_hinh set gia_tri='2026-01-01' where khoa='ctv.but_toan_tu_ngay'`);
  await q(`update cau_hinh set gia_tri='phan_tram' where khoa='ctv.tu_dang_ky_kieu'`);
  await q(`update cau_hinh set gia_tri='12' where khoa='ctv.tu_dang_ky_gia_tri'`);
});

describe("Phiên CTV ký HMAC (src/lib/ctv-ky.ts)", () => {
  const K = "khoa-bi-mat-thu-nghiem-dai-du-32-ky-tu";
  it("ký rồi đọc lại đúng; sửa một ký tự / sai khoá / hết hạn → từ chối", () => {
    const c = kyPhien({ dt: u(9), v: 3, het: Date.now() + 60_000 }, K);
    expect(docPhien(c, K)).toMatchObject({ dt: u(9), v: 3 });
    expect(docPhien(c, K + "x")).toBeNull();
    const [a, b] = c.split(".");
    expect(docPhien(`${a.slice(0, -2)}AA.${b}`, K)).toBeNull();
    expect(docPhien(`${a}.${b.slice(0, -2)}AA`, K)).toBeNull();
    expect(docPhien(kyPhien({ dt: u(9), v: 3, het: Date.now() - 1 }, K), K)).toBeNull();
    expect(docPhien("rac", K)).toBeNull();
    expect(docPhien(undefined, K)).toBeNull();
  });
  it("mã 6 số; băm gắn mục đích + SĐT (cùng mã khác SĐT ra băm khác)", () => {
    for (let i = 0; i < 50; i++) expect(soMa()).toMatch(/^\d{6}$/);
    expect(bamMa(K, "dang_nhap", "0912345678", "123456")).toHaveLength(64);
    expect(bamMa(K, "dang_nhap", "0912345678", "123456")).not.toBe(bamMa(K, "dang_nhap", "0912345679", "123456"));
    expect(bamMa(K, "dang_nhap", "0912345678", "123456")).not.toBe(bamMa(K, "dang_ky", "0912345678", "123456"));
  });
});

describe("Mã xác thực (0317)", () => {
  it("SĐT sai dạng bị chặn; cùng SĐT phải đợi 60 giây; tối đa 5 mã/giờ", async () => {
    expect(await loi(`select ctv_ma_tao('dang_ky','02383123456','a@b.vn',$1,'ip1')`, [BAM("x")])).toMatch(/10 số/);
    await taoMa("dang_ky", "0901000001", "a1@mail.vn");
    expect(await loi(`select ctv_ma_tao('dang_ky','0901000001','a1@mail.vn',$1,'ip-mac-dinh-01')`, [BAM("y")])).toMatch(/60 giây/);
    for (let i = 0; i < 4; i++) { await lui("0901000001", "2 minutes"); await taoMa("dang_ky", "0901000001", `a1${i}@mail.vn`, `ip-${i}-aaaa`); }
    await lui("0901000001", "2 minutes");
    expect(await loi(`select ctv_ma_tao('dang_ky','0901000001','a9@mail.vn',$1,'ip-khac-01')`, [BAM("z")])).toMatch(/quá nhiều lần/);
    await lui("0901000001", "61 minutes");
    expect((await taoMa("dang_ky", "0901000001", "a9@mail.vn", "ip-khac-02")).r.gui).toBe(true);
  });

  it("cùng IP tối đa 10 mã/giờ; cùng email tối đa 5 mã/giờ", async () => {
    for (let i = 0; i < 10; i++) await taoMa("dang_ky", `09020000${String(i).padStart(2, "0")}`, `ip${i}@mail.vn`, "ip-dung-chung-1");
    expect(await loi(`select ctv_ma_tao('dang_ky','0902000099','ip99@mail.vn',$1,'ip-dung-chung-1')`, [BAM("w")])).toMatch(/quá nhiều lần/);
    for (let i = 0; i < 5; i++) await taoMa("dang_ky", `09030000${String(i).padStart(2, "0")}`, "trung@mail.vn", `ip-email-${i}`);
    expect(await loi(`select ctv_ma_tao('dang_ky','0903000099','trung@mail.vn',$1,'ip-email-x')`, [BAM("v")])).toMatch(/quá nhiều lần/);
  });

  it("đăng nhập bằng SĐT chưa đăng ký: vẫn trả lời bình thường, không gửi, không thể xác thực", async () => {
    const r = (await taoMa("dang_nhap", "0904000001", null, "ip-dn-1")).r;
    expect(r.gui).toBe(false);
    expect(r.email).toBeNull();
    expect(await q(`select * from ctv_ma_thu('dang_nhap','0904000001')`)).toHaveLength(0);
  });

  it("mỗi lần lấy mã = 1 lần thử; quá 5 lần thì mã khoá; mã mới huỷ mã cũ; dùng 1 lần; hết hạn thì thôi", async () => {
    const sdt = "0905000001";
    const a = (await taoMa("dang_ky", sdt, "lan@mail.vn", "ip-thu-1")).r;
    for (let i = 0; i < 5; i++) expect(await q(`select * from ctv_ma_thu('dang_ky',$1)`, [sdt])).toHaveLength(1);
    expect(await q(`select * from ctv_ma_thu('dang_ky',$1)`, [sdt])).toHaveLength(0);
    await lui(sdt, "2 minutes");
    const b = (await taoMa("dang_ky", sdt, "lan@mail.vn", "ip-thu-2")).r;
    expect((await one<{ huy: boolean }>(`select huy from ctv_ma_xac_thuc where id=$1`, [a.id])).huy).toBe(true);
    expect((await one<{ id: string }>(`select id from ctv_ma_thu('dang_ky',$1)`, [sdt])).id).toBe(b.id);
    expect((await one<{ r: boolean }>(`select ctv_ma_dung($1) r`, [b.id])).r).toBe(true);
    expect((await one<{ r: boolean }>(`select ctv_ma_dung($1) r`, [b.id])).r).toBe(false);
    expect(await q(`select * from ctv_ma_thu('dang_ky',$1)`, [sdt])).toHaveLength(0);
    await lui(sdt, "2 minutes");
    const c = (await taoMa("dang_ky", sdt, "lan@mail.vn", "ip-thu-3")).r;
    await q(`update ctv_ma_xac_thuc set het_han = now() - interval '1 second' where id=$1`, [c.id]);
    expect(await q(`select * from ctv_ma_thu('dang_ky',$1)`, [sdt])).toHaveLength(0);
    expect((await one<{ r: boolean }>(`select ctv_ma_dung($1) r`, [c.id])).r).toBe(false);
  });
});

describe("Tự đăng ký (0317)", () => {
  let DT: string;
  it("chỉ nhận mã đã xác thực; tạo nguồn REF = SĐT, mức HH theo cài đặt, bật email, ghi thư chào mừng", async () => {
    const sdt = "0906000001";
    const m = (await taoMa("dang_ky", sdt, "Hoa@Mail.vn", "ip-dk-1", null, JSON.stringify({ ho_ten: "  Trần   Thị Hoa ", dong_y_luc: new Date().toISOString() }))).r;
    expect(await loi(`select ctv_tu_dang_ky($1)`, [m.id])).toMatch(/không còn hiệu lực/);
    await q(`select ctv_ma_dung($1)`, [m.id]);
    const kq = (await one<{ r: { id: string; ma_ref: string } }>(`select ctv_tu_dang_ky($1) r`, [m.id])).r;
    DT = kq.id;
    expect(kq.ma_ref).toBe(sdt);
    const d = await one<Record<string, unknown>>(`select * from doi_tac_gt where id=$1`, [DT]);
    expect(d).toMatchObject({ ten: "Trần Thị Hoa", ma_ref: sdt, loai: "ctv", hh_kieu: "phan_tram", email: "hoa@mail.vn", gui_email: true, tu_dang_ky: true, hoat_dong: true, phien_ver: 1 });
    expect(Number(d.hh_gia_tri)).toBe(12);
    expect((await one<{ loai: string; trang_thai: string }>(`select loai, trang_thai from ctv_thu where doi_tac_id=$1`, [DT]))).toMatchObject({ loai: "chao_mung", trang_thai: "cho" });
    expect(await loi(`select ctv_tu_dang_ky($1)`, [m.id])).toMatch(/không còn hiệu lực/);
  });

  it("SĐT đã là đối tác (kể cả nguồn nhân viên tạo, SĐT viết khác) thì chặn", async () => {
    await q(`insert into doi_tac_gt (ma, ten, dien_thoai, ma_gioi_thieu) values ('DTCU1','Nguồn cũ','+84 907 000 001','GTCU1')`);
    const m = (await taoMa("dang_ky", "0907000001", "x@mail.vn", "ip-dk-2", null, JSON.stringify({ ho_ten: "Người Khác" }))).r;
    await q(`select ctv_ma_dung($1)`, [m.id]);
    expect(await loi(`select ctv_tu_dang_ky($1)`, [m.id])).toMatch(/đã là đối tác/);
  });

  it("cổng tạm đóng thì không nhận đăng ký mới, đăng nhập vẫn được", async () => {
    await q(`update cau_hinh set gia_tri='0' where khoa='ctv.cong_mo'`);
    expect(await loi(`select ctv_ma_tao('dang_ky','0908000001','y@mail.vn',$1,'ip-dk-3')`, [BAM("u")])).toMatch(/tạm dừng/);
    const r = (await taoMa("dang_nhap", "0906000001", null, "ip-dn-2")).r;
    expect(r).toMatchObject({ gui: true, email: "hoa@mail.vn", doi_tac_id: DT });
    await q(`update cau_hinh set gia_tri='1' where khoa='ctv.cong_mo'`);
    // mã đăng nhập chỉ đi tới email của đúng nguồn, kèm doi_tac_id để máy chủ tạo phiên
    expect((await one<{ doi_tac_id: string; email: string }>(`select doi_tac_id, email from ctv_ma_thu('dang_nhap','0906000001')`))).toMatchObject({ doi_tac_id: DT, email: "hoa@mail.vn" });
  });

  it("nguồn ngừng hợp tác: đăng nhập không gửi mã; phiên bản phiên tăng thì phiên cũ hết hiệu lực (máy chủ so phien_ver)", async () => {
    await q(`update doi_tac_gt set hoat_dong=false where id=$1`, [DT]);
    await lui("0906000001", "2 minutes");
    expect((await taoMa("dang_nhap", "0906000001", null, "ip-dn-3")).r.gui).toBe(false);
    await q(`update doi_tac_gt set hoat_dong=true, phien_ver = phien_ver + 1 where id=$1`, [DT]);
    expect((await one<{ phien_ver: number }>(`select phien_ver from doi_tac_gt where id=$1`, [DT])).phien_ver).toBe(2);
  });
});

describe("Số liệu cổng: chỉ của đúng một nguồn, đã che, không lộ dịch vụ (0317)", () => {
  let A: string, B: string, KA: string, KB: string, LA: string;
  beforeAll(async () => {
    A = (await one<{ id: string }>(`insert into doi_tac_gt (ma, ten, dien_thoai, ma_gioi_thieu, hh_kieu, hh_gia_tri, email, gui_email) values ('DTA','CTV A','0911000001','GTAAA','phan_tram',10,'a@ctv.vn',true) returning id`)).id;
    B = (await one<{ id: string }>(`insert into doi_tac_gt (ma, ten, dien_thoai, ma_gioi_thieu, hh_kieu, hh_gia_tri) values ('DTB','CTV B','0911000002','GTBBB','phan_tram',10) returning id`)).id;
    KA = await taoKhach("Nguyễn Thị Lan", "0988111222");
    KB = await taoKhach("Lê Văn Bình", "0988333444");
    await q(`update khach_hang set doi_tac_id=$1 where id=$2`, [A, KA]);
    await q(`update khach_hang set doi_tac_id=$1 where id=$2`, [B, KB]);
    LA = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,'2026-06-15 09:00+07','2026-06-15 10:00+07') returning id`, [KA, CN])).id;
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2,'2026-06-16 09:00+07','2026-06-16 10:00+07','huy')`, [KA, CN]);
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,'2026-06-15 09:00+07','2026-06-15 10:00+07')`, [KB, CN]);
    // hoá đơn 1.000.000 của khách A gắn lịch LA → HH 100.000; hoá đơn lẻ 2.000.000 → HH 200.000
    for (const [lich, gia, ma] of [[LA, 1000000, "HDCA1"], [null, 2000000, "HDCA2"]] as const) {
      const h = (await one<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, nguoi_lap_id, lich_hen_id) values ($1,$2,$3,'nhap','2026-06-15',$4,$4,$5,$6) returning id`,
        [ma, CN, KA, gia, NV.letan, lich])).id;
      await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia, gt_doi_tac_id, gt_kieu, gt_gia_tri) values ($1,'dich_vu',$2,'Trị mụn chuyên sâu',1,$3,$4,'phan_tram',10)`, [h, DV, gia, A]);
      await q(`update hoa_don set trang_thai='hoan_thanh' where id=$1`, [h]);
    }
    await q(`update lich_hen set trang_thai='hoan_thanh' where id=$1`, [LA]);
  });

  it("Tổng quan theo kỳ chỉ đếm của nguồn A", async () => {
    const t = await one<Record<string, number>>(`select hoa_hong::int, doanh_so::int, so_dat_hen, so_da_den, kha_dung::int from ctv_tong_quan($1,'2026-06-01','2026-06-30')`, [A]);
    expect(t).toMatchObject({ hoa_hong: 300000, doanh_so: 3000000, so_dat_hen: 2, so_da_den: 1, kha_dung: 300000 });
    const tb = await one<Record<string, number>>(`select hoa_hong::int, so_dat_hen from ctv_tong_quan($1,'2026-06-01','2026-06-30')`, [B]);
    expect(tb).toMatchObject({ hoa_hong: 0, so_dat_hen: 1 });
  });

  it("Tôi đã giới thiệu: tên + SĐT che, lọc trạng thái, không có khách của nguồn khác", async () => {
    const ds = await q<{ ten_che: string; sdt_che: string; tinh_trang: string; hoa_hong: number; co_hoa_don: boolean }>(`select * from ctv_da_gioi_thieu($1,'2026-06-01','2026-06-30')`, [A]);
    expect(ds).toHaveLength(3);
    expect(ds.every((r) => r.ten_che === "N*** T** L**" && r.sdt_che === "098****222")).toBe(true);
    expect(JSON.stringify(ds)).not.toMatch(/Lan|Bình|0988|Trị mụn/);
    expect((await q(`select * from ctv_da_gioi_thieu($1,'2026-06-01','2026-06-30','da_huy')`, [A]))).toHaveLength(1);
    expect((await q(`select * from ctv_da_gioi_thieu($1,'2026-06-01','2026-06-30','co_hoa_don')`, [A]))).toHaveLength(2);
    const dsB = await q<{ ten_che: string }>(`select * from ctv_da_gioi_thieu($1,'2026-06-01','2026-06-30')`, [B]);
    expect(dsB).toHaveLength(1);
    expect(dsB[0].ten_che).toBe("L** V** B***");
  });

  it("Đối soát: gộp theo hoá đơn, không có tên dịch vụ / cột mục", async () => {
    const ds = await q<Record<string, unknown>>(`select * from ctv_doi_soat($1,'2026-06-01','2026-06-30')`, [A]);
    expect(ds).toHaveLength(2);
    expect(Object.keys(ds[0]).sort()).toEqual(["doanh_so", "hoa_hong", "loai", "ma_hd", "ngay_ghi", "ngay_hd", "ten_che", "ty_le"].sort());
    expect(JSON.stringify(ds)).not.toMatch(/Trị mụn|Lan/);
    expect(ds.map((r) => r.ty_le)).toEqual(["10%", "10%"]);
    expect(await q(`select * from ctv_doi_soat($1,'2026-06-01','2026-06-30')`, [B])).toHaveLength(0);
  });

  it("Chi trả từ cổng: cùng quy tắc (tối thiểu, số dư, một yêu cầu mở), người tạo = cổng; trạng thái thanh toán FIFO; thư đã chi", async () => {
    await q(`update cau_hinh set gia_tri='150000' where khoa='ctv.toi_thieu_rut'`);
    expect(await loi(`select rut_hh_tao_ctv($1,100000,'tien_mat',null,null,null,null)`, [A])).toMatch(/tối thiểu/);
    expect(await loi(`select rut_hh_tao_ctv($1,400000,'tien_mat',null,null,null,null)`, [A])).toMatch(/vượt số dư/);
    expect(await loi(`select rut_hh_tao_ctv($1,200000,'chuyen_khoan',null,null,null,null)`, [A])).toMatch(/check|vi phạm|violates/i);
    expect(await loi(`select rut_hh_tao($1,200000,'tien_mat',null,null,null,null,null)`, [A])).toMatch(/Thiếu người tạo/);
    const id = (await one<{ id: string }>(`select rut_hh_tao_ctv($1,200000,'tien_mat',null,null,null,'Nhận tại phòng khám') id`, [A])).id;
    expect(await one(`select tao_boi, tu_cong_ctv, trang_thai from yeu_cau_rut_hh where id=$1`, [id])).toMatchObject({ tao_boi: null, tu_cong_ctv: true, trang_thai: "cho_xu_ly" });
    expect(await loi(`select rut_hh_tao_ctv($1,100000,'tien_mat',null,null,null,null)`, [A])).toMatch(/chưa xử lý xong/);
    expect(await loi(`update yeu_cau_rut_hh set tao_boi=$2 where id=$1`, [id, NV.mkt])).toMatch(/Không sửa/);
    await q(`select rut_hh_duyet($1,$2)`, [id, NV.ql]);
    const quy = (await one<{ id: string }>(`select id from quy where chi_nhanh_id=$1 and loai='tien_mat'`, [CN]))?.id ?? (await one<{ id: string }>(`insert into quy (chi_nhanh_id, loai, ten) values ($1,'tien_mat','Quỹ tiền mặt thử') returning id`, [CN])).id;
    await q(`select rut_hh_da_chi($1,$2,$3)`, [id, NV.mkt, quy]);
    const ds = await q<{ khoa: string; hoa_hong: number; da_tra: number; tt_thanh_toan: string }>(`select khoa, hoa_hong::int, da_tra::int, tt_thanh_toan from ctv_da_gioi_thieu($1,'2026-06-01','2026-06-30','co_hoa_don') order by hoa_hong`, [A]);
    // 200.000 đã chi trả cho dòng phát sinh trước (100.000 của HDCA1 → đủ), phần còn 100.000 cho HDCA2 (200.000) → một phần
    expect(ds.map((r) => [r.hoa_hong, r.da_tra, r.tt_thanh_toan])).toEqual([[100000, 100000, "da_tt"], [200000, 100000, "mot_phan"]]);
    expect(await one(`select loai, trang_thai, den from ctv_thu where khoa_trung=$1`, [`da_thanh_toan_hh:${id}`])).toMatchObject({ loai: "da_thanh_toan_hh", trang_thai: "cho", den: "a@ctv.vn" });
  });
});

describe("Thư CTV + khiếu nại đối soát (0317)", () => {
  let C: string, K: string;
  beforeAll(async () => {
    C = (await one<{ id: string }>(`insert into doi_tac_gt (ma, ten, dien_thoai, ma_gioi_thieu, email, gui_email) values ('DTC','CTV C','0912000003','GTCCC','c@ctv.vn',true) returning id`)).id;
    K = await taoKhach("Phạm Minh Thư", "0977555666");
    await q(`update khach_hang set doi_tac_id=$1 where id=$2`, [C, K]);
  });
  it("đặt hẹn / huỷ → thư đúng loại, tên che, không dịch vụ; loại tắt → Bỏ qua; đối tác tắt email → Bỏ qua", async () => {
    const l = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,now()+interval '2 days',now()+interval '2 days 1 hour') returning id`, [K, CN])).id;
    const t = await one<{ trang_thai: string; du_lieu: { ten: string } }>(`select trang_thai, du_lieu from ctv_thu where khoa_trung=$1`, [`da_dat_hen:${l}`]);
    expect(t.trang_thai).toBe("cho");
    expect(t.du_lieu.ten).toBe("P*** M*** T**");
    await q(`update cau_hinh set gia_tri='0' where khoa='ctv.email.da_huy'`);
    await q(`update lich_hen set trang_thai='huy' where id=$1`, [l]);
    expect(await one(`select trang_thai, ly_do from ctv_thu where khoa_trung=$1`, [`da_huy:${l}`])).toMatchObject({ trang_thai: "bo_qua", ly_do: "Loại thư đang tắt" });
    await q(`update doi_tac_gt set gui_email=false where id=$1`, [C]);
    const l2 = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,now()+interval '3 days',now()+interval '3 days 1 hour') returning id`, [K, CN])).id;
    expect(await one(`select trang_thai, ly_do, den from ctv_thu where khoa_trung=$1`, [`da_dat_hen:${l2}`])).toMatchObject({ trang_thai: "bo_qua", ly_do: "Đối tác chưa bật nhận email", den: null });
  });

  it("lịch đồng bộ từ SalonHero (sh_id / la_lich_su) hoặc trước ngày bắt đầu sổ: không xếp thư", async () => {
    const truoc = Number((await one<{ n: number }>(`select count(*) n from ctv_thu where doi_tac_id=$1`, [C])).n);
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, sh_id) values ($1,$2,now()+interval '4 days',now()+interval '4 days 1 hour', 987654321)`, [K, CN]);
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, la_lich_su) values ($1,$2,now()+interval '5 days',now()+interval '5 days 1 hour', true)`, [K, CN]);
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,'2025-12-01 09:00+07','2025-12-01 10:00+07')`, [K, CN]);
    expect(Number((await one<{ n: number }>(`select count(*) n from ctv_thu where doi_tac_id=$1`, [C])).n)).toBe(truoc);
  });

  it("khiếu nại: tối đa 3 đang mở; nhân viên xử lý phải có phản hồi; đã đóng thì không sửa", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) ids.push((await one<{ id: string }>(`select ctv_khieu_nai_gui($1,'2026-06-01','2026-06-30','HD1','Thiếu hoá đơn ngày 15/6 số ${i}') id`, [C])).id);
    expect(await loi(`select ctv_khieu_nai_gui($1,'2026-06-01','2026-06-30',null,'Thêm một khiếu nại')`, [C])).toMatch(/3 khiếu nại/);
    expect(await loi(`select ctv_khieu_nai_gui($1,'2026-06-30','2026-06-01',null,'Kỳ ngược')`, [C])).toMatch(/Kỳ đối soát/);
    expect(await loi(`select ctv_khieu_nai_xu_ly($1,$2,'da_xu_ly','')`, [ids[0], NV.mkt])).toMatch(/phản hồi/);
    await q(`select ctv_khieu_nai_xu_ly($1,$2,'da_xu_ly','Đã bổ sung hoá đơn')`, [ids[0], NV.mkt]);
    expect(await loi(`select ctv_khieu_nai_xu_ly($1,$2,'tu_choi','x y')`, [ids[0], NV.mkt])).toMatch(/đã đóng/);
    expect((await one<{ id: string }>(`select ctv_khieu_nai_gui($1,'2026-06-01','2026-06-30',null,'Sau khi một khiếu nại đã đóng') id`, [C])).id).toBeTruthy();
  });

  it("thư gộp 20:00 không gửi trùng khi gọi lại", async () => {
    const n1 = (await one<{ n: number }>(`select ctv_thu_tong_hop((now() at time zone 'Asia/Ho_Chi_Minh')::date) n`)).n;
    expect(n1).toBeGreaterThan(0);
    const dem = async () => Number((await one<{ n: number }>(`select count(*) n from ctv_thu where loai='cap_nhat_hh'`)).n);
    const truoc = await dem();
    await q(`select ctv_thu_tong_hop((now() at time zone 'Asia/Ho_Chi_Minh')::date)`);
    expect(await dem()).toBe(truoc);
  });
});
