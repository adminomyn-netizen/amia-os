import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

// Kiểm thử NGHIỆP VỤ trên Postgres thật (PGlite) chạy đúng các migration: tiền, thẻ, kho phải khớp từng đồng.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const NV = { thuNgan: u(1), bacSi: u(2), ktv: u(3), kho: u(4), tuVan: u(5), quanLy: u(6) };

let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];
const loi = async (sql: string, p: unknown[] = []) => {
  try { await db.query(sql, p); } catch (e) { return (e as Error).message; }
  return "";
};

let CN: string, KH: string, DV_PEEL: string, DV_MFU: string, GOI10: string, GOITIEN: string;
let SP_KEM: string, SP_DAU: string, SP_BONG: string;

async function taoHoaDon(khach: string | null, dong: { loai: "dich_vu" | "san_pham" | "goi_the"; ref: string; ten: string; sl?: number; gia: number; giam?: number }[], opts: { giam?: number; vat?: number; chia?: boolean } = {}) {
  const hd = await one<{ id: string }>(
    `insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id, giam_gia_don, vat_pct) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'), $1, $2, $3, $4, $5) returning id`,
    [CN, khach, NV.thuNgan, opts.giam ?? 0, opts.vat ?? 0],
  );
  for (const d of dong) {
    const col = d.loai === "dich_vu" ? "dich_vu_id" : d.loai === "san_pham" ? "san_pham_id" : "goi_id";
    const dg = await one<{ id: string }>(
      `insert into hoa_don_dong (hoa_don_id, loai, ${col}, ten, so_luong, don_gia, giam_gia) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [hd.id, d.loai, d.ref, d.ten, d.sl ?? 1, d.gia, d.giam ?? 0],
    );
    if (opts.chia !== false) {
      await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'ban',60),($1,$3,'ban',40)`, [dg.id, NV.thuNgan, NV.tuVan]);
    }
  }
  return hd.id;
}
const thu = (hd: string, pt: string, n: number, the: string | null = null, loai = "thu") =>
  q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, the_id, nguoi_id) values ($1,$2,$3,$4,$5,$6)`, [hd, loai, pt, n, the, NV.thuNgan]);
const hd = (id: string) => one<{ tong_hang: string; tong_phai_thu: string; da_thu: string; con_no: string; trang_thai: string }>(`select tong_hang::text, tong_phai_thu::text, da_thu::text, con_no::text, trang_thai from hoa_don where id=$1`, [id]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await one<{ id: string }>(`select id from chi_nhanh where ma='VINH'`)).id;
  await q(`insert into auth.users (id) values ('${u(900)}')`);
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values
    ('${NV.thuNgan}','Thu Ngân Thử','thu_ngan','${CN}'),('${NV.bacSi}','Bác Sĩ Thử','bac_si','${CN}'),('${NV.ktv}','KTV Thử','ktv','${CN}'),
    ('${NV.kho}','Kho Thử','thu_kho','${CN}'),('${NV.tuVan}','Tư Vấn Thử','tu_van','${CN}'),('${NV.quanLy}','Quản Lý Thử','quan_ly','${CN}')`);
  KH = (await one<{ id: string }>(
    `insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH000001','Khách Thử','0900000001',$1,'mkt',$2) returning id`, [CN, NV.tuVan])).id;
  const nhom = (await one<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`)).id;
  DV_PEEL = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL01',$1,'Peel da cơ bản',1500000) returning id`, [nhom])).id;
  DV_MFU = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('MFU01',$1,'MFU Basic',20000000) returning id`, [nhom])).id;
  GOI10 = (await one<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('LT10','Liệu trình peel 10 buổi','lan',10000000,10) returning id`)).id;
  GOITIEN = (await one<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, gia_tri_the) values ('TT5','Thẻ tiền 5tr tặng 1tr','tien',5000000,6000000) returning id`)).id;
  await q(`insert into goi_the_dich_vu (goi_id, dich_vu_id) values ($1,$2)`, [GOI10, DV_PEEL]);
  SP_KEM = (await one<{ id: string }>(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('KEM','Kem tê','A','g',2156,true) returning id`)).id;
  SP_DAU = (await one<{ id: string }>(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('DAU45','Đầu MFU N4.5','A','shot',2144,true) returning id`)).id;
  SP_BONG = (await one<{ id: string }>(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao, gia_ban, ban_le) values ('BONG','Bông','C','cái',100,true,0,false) returning id`)).id;
});

describe("cổng cấu trúc", () => {
  it("mọi bảng public bật RLS + FORCE RLS và có policy", async () => {
    const r = await q<{ ten: string; rls: boolean; ep: boolean; n: number }>(`
      select c.relname as ten, c.relrowsecurity as rls, c.relforcerowsecurity as ep,
             (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname)::int as n
        from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`);
    expect(r.length).toBeGreaterThanOrEqual(25);
    expect(r.filter((x) => !x.rls || !x.ep || x.n === 0).map((x) => x.ten)).toEqual([]);
  });
  it("anon/authenticated không có quyền nào trên bảng, view, hàm", async () => {
    const b = await q(`select 1 from information_schema.role_table_grants where grantee in ('anon','authenticated') and table_schema='public'`);
    expect(b).toHaveLength(0);
    const f = await q(`select 1 from information_schema.role_routine_grants where grantee in ('anon','authenticated','PUBLIC') and routine_schema='public'`);
    expect(f).toHaveLength(0);
    await expect(chayVoiKhach(db, "select * from public.khach_hang")).rejects.toThrow(/permission denied/);
    await expect(chayVoiTu(db, { sub: u(900) }, "select * from public.khach_hang")).rejects.toThrow(/permission denied/);
    await expect(chayVoiTu(db, { sub: u(900) }, "select * from public.v_khach_hang")).rejects.toThrow(/permission denied/);
  });
});

describe("bán thẻ liệu trình, thanh toán nhiều lần, nợ, thực hiện buổi", () => {
  let HD: string; let THE: string;
  it("tính tổng đúng: 10 buổi 10tr, giảm cả đơn 1tr", async () => {
    HD = await taoHoaDon(KH, [{ loai: "goi_the", ref: GOI10, ten: "Liệu trình peel 10 buổi", gia: 10_000_000 }], { giam: 1_000_000 });
    expect(await hd(HD)).toMatchObject({ tong_hang: "10000000", tong_phai_thu: "9000000", da_thu: "0", con_no: "9000000" });
  });
  it("thu 2 lần (tiền mặt + chuyển khoản), chưa chốt đã thấy nợ đúng", async () => {
    await thu(HD, "tien_mat", 4_000_000);
    await thu(HD, "chuyen_khoan", 3_000_000);
    expect(await hd(HD)).toMatchObject({ da_thu: "7000000", con_no: "2000000" });
  });
  it("không thu vượt phần còn phải thu", async () => {
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id) values ('${HD}','tien_mat',2000001,'${NV.thuNgan}')`)).toMatch(/vượt/);
  });
  it("chốt đơn: cấp 1 thẻ 10 buổi, doanh thu mỗi buổi = 900.000 (đã chia giảm giá)", async () => {
    await q(`select chot_hoa_don($1,$2)`, [HD, NV.thuNgan]);
    expect((await hd(HD)).trang_thai).toBe("hoan_thanh");
    const the = await one<{ id: string; gia_tri_buoi: string; so_buoi_con: number; tinh_trang: string }>(`select id, gia_tri_buoi::text, so_buoi_con, tinh_trang from v_the_khach where khach_id=$1`, [KH]);
    THE = the.id;
    expect(the).toMatchObject({ gia_tri_buoi: "900000", so_buoi_con: 10, tinh_trang: "hoat_dong" });
  });
  it("sau khi chốt, không sửa được dòng hàng", async () => {
    expect(await loi(`update hoa_don_dong set don_gia = 1 where hoa_don_id = $1`, [HD])).toMatch(/đã chốt/);
    expect(await loi(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, don_gia) values ($1,'dich_vu',$2,'x',1)`, [HD, DV_PEEL])).toMatch(/đã chốt/);
  });
  it("trả nợ 2tr → hết nợ; trả thừa bị chặn", async () => {
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id) values ('${HD}','tien_mat',2000001,'${NV.thuNgan}')`)).toMatch(/vượt/);
    await thu(HD, "tien_mat", 2_000_000);
    expect(await hd(HD)).toMatchObject({ da_thu: "9000000", con_no: "0" });
  });
  it("thực hiện buổi trừ 1 buổi, ghi doanh thu buổi; hết buổi thì chặn", async () => {
    const b1 = await one<{ thuc_hien_buoi: string }>(`select thuc_hien_buoi($1,$2,$3,$4,null,null,'{"vung":"mặt"}'::jsonb,null,$5)`, [THE, DV_PEEL, NV.ktv, NV.bacSi, NV.ktv]);
    await q(`select thuc_hien_buoi($1,$2,$3,$4,null,null,'{}'::jsonb,null,$5)`, [THE, DV_PEEL, NV.ktv, NV.bacSi, NV.ktv]);
    expect((await one<{ so_buoi_con: number }>(`select so_buoi_con from v_the_khach where id=$1`, [THE])).so_buoi_con).toBe(8);
    expect((await one<{ s: string }>(`select sum(doanh_thu_buoi)::text s from buoi_thuc_hien where the_id=$1`, [THE])).s).toBe("1800000");
    await q(`select huy_buoi($1,'Nhập nhầm',$2)`, [b1.thuc_hien_buoi, NV.quanLy]);
    expect((await one<{ so_buoi_con: number }>(`select so_buoi_con from v_the_khach where id=$1`, [THE])).so_buoi_con).toBe(9);
    expect(await loi(`select huy_buoi($1,'lần 2',$2)`, [b1.thuc_hien_buoi, NV.quanLy])).toMatch(/đã huỷ/);
  });
  it("dịch vụ ngoài thẻ bị chặn", async () => {
    expect(await loi(`select thuc_hien_buoi($1,$2,$3,null,null,null,'{}'::jsonb,null,$3)`, [THE, DV_MFU, NV.ktv])).toMatch(/không nằm trong thẻ/);
  });
  it("sổ cái thẻ chỉ thêm, không sửa không xoá", async () => {
    expect(await loi(`update the_so_cai set so_buoi = 99`)).toMatch(/chỉ được thêm/);
    expect(await loi(`delete from the_so_cai`)).toMatch(/chỉ được thêm/);
    expect(await loi(`delete from thanh_toan`)).toMatch(/chỉ được thêm/);
  });
  it("không huỷ được hoá đơn khi thẻ đã được dùng", async () => {
    expect(await loi(`select huy_hoa_don($1,'thử',$2)`, [HD, NV.quanLy])).toMatch(/đã được dùng/);
  });
  it("hạng và trạng thái khách tự tính (đang liệu trình, hạng Thường vì chi 9tr < 10tr)", async () => {
    expect(await one(`select hang, trang_thai, chi_12_thang::text from v_khach_hang where id=$1`, [KH])).toMatchObject({ hang: "Thường", trang_thai: "dang_lieu_trinh", chi_12_thang: "9000000" });
  });
});

describe("chia người hưởng và ràng buộc khi chốt", () => {
  it("chia % không đủ 100 thì không chốt được", async () => {
    const h = await taoHoaDon(KH, [{ loai: "dich_vu", ref: DV_PEEL, ten: "Peel", gia: 1_500_000 }], { chia: false });
    const d = await one<{ id: string }>(`select id from hoa_don_dong where hoa_don_id=$1`, [h]);
    await q(`insert into dong_nhan_vien values ($1,$2,'ban',70)`, [d.id, NV.thuNgan]);
    expect(await loi(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan])).toMatch(/100/);
    await q(`insert into dong_nhan_vien values ($1,$2,'ban',30)`, [d.id, NV.tuVan]);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    expect((await hd(h)).trang_thai).toBe("hoan_thanh");
  });
  it("còn nợ hoặc bán thẻ mà không có khách thì chặn", async () => {
    const h = await taoHoaDon(null, [{ loai: "dich_vu", ref: DV_PEEL, ten: "Peel", gia: 1_500_000 }]);
    expect(await loi(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan])).toMatch(/gắn khách/);
    await thu(h, "tien_mat", 1_500_000);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
  });
  it("VAT 8% tính trên tiền sau giảm; tip cộng vào tổng phải thu nhưng không vào doanh thu", async () => {
    const h = await taoHoaDon(KH, [{ loai: "dich_vu", ref: DV_PEEL, ten: "Peel", gia: 1_000_000 }], { giam: 100_000, vat: 8 });
    await q(`update hoa_don set tip = 50000 where id=$1`, [h]);
    await q(`select tinh_lai_hoa_don($1)`, [h]);
    expect(await hd(h)).toMatchObject({ tong_hang: "1000000", tong_phai_thu: String(900_000 + 72_000 + 50_000) });
  });
});

describe("thẻ tiền", () => {
  let THE_TIEN: string;
  it("bán thẻ tiền 5tr nạp 6tr", async () => {
    const h = await taoHoaDon(KH, [{ loai: "goi_the", ref: GOITIEN, ten: "Thẻ tiền", gia: 5_000_000 }]);
    await thu(h, "chuyen_khoan", 5_000_000);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    const t = await one<{ id: string; so_du_tien: string }>(`select id, so_du_tien::text from v_the_khach where khach_id=$1 and loai='tien'`, [KH]);
    THE_TIEN = t.id;
    expect(t.so_du_tien).toBe("6000000");
  });
  it("trả bằng thẻ tiền trừ đúng số dư; không đủ thì chặn", async () => {
    const h = await taoHoaDon(KH, [{ loai: "dich_vu", ref: DV_PEEL, ten: "Peel", gia: 1_500_000 }]);
    await thu(h, "the_tien", 1_500_000, THE_TIEN);
    expect((await one<{ so_du_tien: string }>(`select so_du_tien::text from v_the_khach where id=$1`, [THE_TIEN])).so_du_tien).toBe("4500000");
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    const h2 = await taoHoaDon(KH, [{ loai: "dich_vu", ref: DV_MFU, ten: "MFU", gia: 20_000_000 }]);
    expect(await loi(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, the_id, nguoi_id) values ('${h2}','the_tien',5000000,'${THE_TIEN}','${NV.thuNgan}')`)).toMatch(/không đủ/);
  });
  it("huỷ hoá đơn trả bằng thẻ tiền → hoàn lại số dư", async () => {
    const h = await taoHoaDon(KH, [{ loai: "dich_vu", ref: DV_PEEL, ten: "Peel", gia: 1_000_000 }]);
    await thu(h, "the_tien", 1_000_000, THE_TIEN);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    expect((await one<{ s: string }>(`select so_du_tien::text s from v_the_khach where id=$1`, [THE_TIEN])).s).toBe("3500000");
    await q(`select huy_hoa_don($1,'Khách đổi ý',$2)`, [h, NV.quanLy]);
    expect((await one<{ s: string }>(`select so_du_tien::text s from v_the_khach where id=$1`, [THE_TIEN])).s).toBe("4500000");
    expect(await hd(h)).toMatchObject({ trang_thai: "huy", da_thu: "0" });
  });
  it("huỷ hoá đơn bán thẻ chưa dùng → thu hồi thẻ + hoàn tiền", async () => {
    const h = await taoHoaDon(KH, [{ loai: "goi_the", ref: GOI10, ten: "LT", gia: 10_000_000 }]);
    await thu(h, "tien_mat", 10_000_000);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    await q(`select huy_hoa_don($1,'Nhầm gói',$2)`, [h, NV.quanLy]);
    const t = await one<{ tinh_trang: string; so_buoi_con: number }>(`select v.tinh_trang, v.so_buoi_con from v_the_khach v join hoa_don_dong d on d.id=v.hoa_don_dong_id where d.hoa_don_id=$1`, [h]);
    expect(t).toMatchObject({ tinh_trang: "thu_hoi", so_buoi_con: 0 });
    expect((await hd(h)).da_thu).toBe("0");
  });
});

describe("kho + phiếu cấp vật tư trước ca", () => {
  let LICH: string; let PHIEU: string; let DONG_DAU: string; let DONG_KEM: string;
  beforeAll(async () => {
    await q(`insert into dinh_muc (dich_vu_id, san_pham_id, so_luong, chon_theo_chi_dinh) values ($1,$2,20,false),($1,$3,300,true)`, [DV_MFU, SP_KEM, SP_DAU]);
    await q(`insert into dinh_muc (dich_vu_id, san_pham_id, so_luong) values ($1,$2,5)`, [DV_MFU, SP_BONG]);
    await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, nguoi_id) values ($1,$2,'nhap',100,2156,$4),($1,$3,'nhap',1000,2144,$4)`, [CN, SP_KEM, SP_DAU, NV.kho]);
    LICH = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id) values ($1,$2, now(), now() + interval '1 hour','cho_phuc_vu',$3) returning id`, [KH, CN, NV.ktv])).id;
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [LICH, DV_MFU]);
  });
  it("không mở ca được khi chưa có phiếu cấp đã nhận", async () => {
    expect(await loi(`update lich_hen set trang_thai='dang_phuc_vu' where id=$1`, [LICH])).toMatch(/phiếu cấp vật tư/);
  });
  it("ra phiếu = định mức cố định + đầu tip bác sĩ chỉ định; nhóm C không vào phiếu; vật tư ngoài định mức bị chặn", async () => {
    expect(await loi(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$6)`, [CN, LICH, KH, DV_MFU, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: SP_BONG, so_luong: 3 }])])).toMatch(/không nằm trong phương án/);
    PHIEU = (await one<{ tao_phieu_cap: string }>(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$6)`, [CN, LICH, KH, DV_MFU, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: SP_DAU, so_luong: 200 }])])).tao_phieu_cap;
    const dong = await q<{ id: string; san_pham_id: string; so_cap: string; dinh_muc: string }>(`select id, san_pham_id, trim_scale(so_cap)::text as so_cap, trim_scale(dinh_muc)::text as dinh_muc from phieu_cap_dong where phieu_id=$1`, [PHIEU]);
    expect(dong).toHaveLength(2);
    DONG_DAU = dong.find((d) => d.san_pham_id === SP_DAU)!.id;
    DONG_KEM = dong.find((d) => d.san_pham_id === SP_KEM)!.id;
    expect(dong.find((d) => d.id === DONG_DAU)).toMatchObject({ so_cap: "200", dinh_muc: "300" });
    expect(await loi(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,'[]'::jsonb,$6)`, [CN, LICH, KH, DV_MFU, NV.bacSi, NV.ktv])).toMatch(/đã có phiếu/);
  });
  it("kho chưa trừ cho tới khi kho bấm cấp; cấp xong tồn trừ đúng; KTV chưa nhận thì vẫn chưa mở ca", async () => {
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, SP_DAU])).t).toBe("1000");
    await q(`select cap_phieu($1,$2)`, [PHIEU, NV.kho]);
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, SP_DAU])).t).toBe("800");
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, SP_KEM])).t).toBe("80");
    expect(await loi(`update lich_hen set trang_thai='dang_phuc_vu' where id=$1`, [LICH])).toMatch(/phiếu cấp vật tư/);
    expect(await loi(`select cap_phieu($1,$2)`, [PHIEU, NV.kho])).toMatch(/không ở trạng thái chờ cấp/);
  });
  it("KTV nhận xong thì mở ca được", async () => {
    await q(`select nhan_phieu($1,$2,1200)`, [PHIEU, NV.ktv]);
    await q(`update lich_hen set trang_thai='dang_phuc_vu' where id=$1`, [LICH]);
    expect((await one<{ trang_thai: string }>(`select trang_thai from lich_hen where id=$1`, [LICH])).trang_thai).toBe("dang_phuc_vu");
  });
  it("kết thúc: phải điền số trả cho mọi dòng; trả thừa vào lại kho; dùng thật = cấp − trả", async () => {
    expect(await loi(`select hoan_tat_phieu($1,$2::jsonb,1400,$3)`, [PHIEU, JSON.stringify([{ dong_id: DONG_DAU, so_tra: 0 }]), NV.ktv])).toMatch(/Thiếu số trả/);
    await q(`select hoan_tat_phieu($1,$2::jsonb,1400,$3)`, [PHIEU, JSON.stringify([{ dong_id: DONG_DAU, so_tra: 10 }, { dong_id: DONG_KEM, so_tra: 2 }]), NV.ktv]);
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, SP_DAU])).t).toBe("810");
    const l = await one<{ dung_that: string; lech_pct: string }>(`select trim_scale(dung_that)::text as dung_that, lech_pct::text from v_phieu_cap_lech where dong_id=$1`, [DONG_DAU]);
    expect(l).toMatchObject({ dung_that: "190", lech_pct: "-36.7" });
    expect((await one<{ trang_thai: string }>(`select trang_thai from phieu_cap where id=$1`, [PHIEU])).trang_thai).toBe("da_lam");
    await q(`select doi_chieu_phieu($1,$2)`, [PHIEU, NV.quanLy]);
  });
  it("dùng vượt định mức quá 5% phải có lý do + bác sĩ xác nhận; có thì cho qua và lệch hiện trong view", async () => {
    const lich2 = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2, now(), now() + interval '1 hour') returning id`, [KH, CN])).id;
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [lich2, DV_MFU]);
    const p = (await one<{ tao_phieu_cap: string }>(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$6)`, [CN, lich2, KH, DV_MFU, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: SP_DAU, so_luong: 300 }])])).tao_phieu_cap;
    await q(`select cap_phieu($1,$2)`, [p, NV.kho]);
    await q(`select nhan_phieu($1,$2,null)`, [p, NV.ktv]);
    await q(`select cap_them_phieu($1,$2,40,'Khách cần thêm vùng cổ',$3,$4)`, [p, SP_DAU, NV.bacSi, NV.kho]);
    const dong = await q<{ id: string; san_pham_id: string }>(`select id, san_pham_id from phieu_cap_dong where phieu_id=$1`, [p]);
    const dDau = dong.find((x) => x.san_pham_id === SP_DAU)!.id, dKem = dong.find((x) => x.san_pham_id === SP_KEM)!.id;
    // cấp 340, trả 0 → dùng 340 > 300×1.05 = 315, nhưng dòng đã có lý do + bác sĩ từ lần cấp thêm → cho qua
    await q(`select hoan_tat_phieu($1,$2::jsonb,null,$3)`, [p, JSON.stringify([{ dong_id: dDau, so_tra: 0 }, { dong_id: dKem, so_tra: 0 }]), NV.ktv]);
    expect(await one(`select trim_scale(dung_that)::text as dung_that, lech_pct::text from v_phieu_cap_lech where dong_id=$1`, [dDau])).toMatchObject({ dung_that: "340", lech_pct: "13.3" });
  });
  it("dùng vượt mà không có lý do thì chặn", async () => {
    const lich3 = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2, now(), now() + interval '1 hour') returning id`, [KH, CN])).id;
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [lich3, DV_MFU]);
    // định mức kem = 20, cấp 20; thêm kem 5 có lý do thì qua; nhưng ép dòng không có lý do bằng cách tự sửa DB để mô phỏng
    const p = (await one<{ tao_phieu_cap: string }>(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$6)`, [CN, lich3, KH, DV_MFU, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: SP_DAU, so_luong: 300 }])])).tao_phieu_cap;
    await q(`update phieu_cap_dong set so_cap = 400 where phieu_id=$1 and san_pham_id=$2`, [p, SP_DAU]);
    await q(`select cap_phieu($1,$2)`, [p, NV.kho]);
    await q(`select nhan_phieu($1,$2,null)`, [p, NV.ktv]);
    const dong = await q<{ id: string; san_pham_id: string }>(`select id, san_pham_id from phieu_cap_dong where phieu_id=$1`, [p]);
    const arr = dong.map((x) => ({ dong_id: x.id, so_tra: 0 }));
    expect(await loi(`select hoan_tat_phieu($1,$2::jsonb,null,$3)`, [p, JSON.stringify(arr), NV.ktv])).toMatch(/lý do và bác sĩ xác nhận/);
  });
  it("kho không đủ thì không cấp; huỷ phiếu đã cấp hoàn kho", async () => {
    const lich4 = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2, now(), now() + interval '1 hour') returning id`, [KH, CN])).id;
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [lich4, DV_MFU]);
    const p = (await one<{ tao_phieu_cap: string }>(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$6)`, [CN, lich4, KH, DV_MFU, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: SP_DAU, so_luong: 99999 }])])).tao_phieu_cap;
    expect(await loi(`select cap_phieu($1,$2)`, [p, NV.kho])).toMatch(/Kho không đủ/);
    await q(`update phieu_cap_dong set so_cap = 10 where phieu_id=$1 and san_pham_id=$2`, [p, SP_DAU]);
    const truoc = (await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, SP_DAU])).t;
    await q(`select cap_phieu($1,$2)`, [p, NV.kho]);
    await q(`select huy_phieu($1,'Khách hoãn',$2)`, [p, NV.quanLy]);
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, SP_DAU])).t).toBe(truoc);
  });
});

describe("bán sản phẩm trừ kho", () => {
  it("chốt đơn sản phẩm theo dõi kho trừ tồn; huỷ trả lại", async () => {
    const sp = (await one<{ id: string }>(`insert into san_pham (ma, ten, don_vi, gia_ban, ban_le) values ('SRM','Sữa rửa mặt','chai',300000,true) returning id`)).id;
    await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong) values ($1,$2,'nhap',10)`, [CN, sp]);
    const h = await taoHoaDon(KH, [{ loai: "san_pham", ref: sp, ten: "Sữa rửa mặt", sl: 3, gia: 300_000 }]);
    await thu(h, "tien_mat", 900_000);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, sp])).t).toBe("7");
    await q(`select huy_hoa_don($1,'Trả hàng',$2)`, [h, NV.quanLy]);
    expect((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, sp])).t).toBe("10");
  });
});

describe("khách hàng: bắt buộc nguồn + người phụ trách, 1 SĐT = 1 khách", () => {
  it("trùng số điện thoại bị chặn", async () => {
    expect(await loi(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH000002','Trùng','0900000001',$1,'mkt',$2)`, [CN, NV.tuVan])).toMatch(/duplicate|unique/i);
  });
  it("thiếu nguồn hoặc người phụ trách bị chặn", async () => {
    expect(await loi(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguoi_phu_trach_id) values ('KH000003','A','0900000003',$1,$2)`, [CN, NV.tuVan])).toMatch(/null/i);
    expect(await loi(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon) values ('KH000004','A','0900000004',$1,'mkt')`, [CN])).toMatch(/null/i);
    expect(await loi(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH000005','A','0900000005',$1,'zalo',$2)`, [CN, NV.tuVan])).toMatch(/check/i);
  });
  it("thẻ lần bắt buộc có số buổi", async () => {
    expect(await loi(`insert into goi_the (ma, ten, loai, gia) values ('X','x','lan',1000)`)).toMatch(/check/i);
  });
  it("khách mới chưa phát sinh gì là lead", async () => {
    await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH000006','Lead','0900000006',$1,'telesale',$2)`, [CN, NV.tuVan]);
    expect((await one<{ trang_thai: string; hang: string }>(`select trang_thai, hang from v_khach_hang where ma='KH000006'`))).toMatchObject({ trang_thai: "lead", hang: "Thường" });
  });
});

describe("báo cáo + hoa hồng", () => {
  it("báo cáo ngày khớp từng đồng: đơn mới, thu đơn mới, thu nợ cũ, thẻ tiền, nợ mới", async () => {
    // Một ngày riêng: 2030-01-10. Đơn 10.000.000 giảm 1tr → doanh thu 9tr; thu 6tr tiền mặt + 1tr CK ngay trong ngày; nợ 2tr trả ngày 2030-01-12.
    const kh = (await one<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH900001','BC','0900000900',$1,'mkt',$2) returning id`, [CN, NV.tuVan])).id;
    const h = (await one<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id, giam_gia_don, ngay_hd) values ('HDBC1',$1,$2,$3,1000000,'2030-01-10') returning id`, [CN, kh, NV.thuNgan])).id;
    const dg = await one<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, don_gia) values ($1,'dich_vu',$2,'Peel',10000000) returning id`, [h, DV_PEEL]);
    await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'ban',60),($1,$3,'ban',40)`, [dg.id, NV.thuNgan, NV.tuVan]);
    await q(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id, ngay) values ($1,'tien_mat',6000000,$2,'2030-01-10'),($1,'chuyen_khoan',1000000,$2,'2030-01-10')`, [h, NV.thuNgan]);
    await q(`select chot_hoa_don($1,$2)`, [h, NV.thuNgan]);
    await q(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id, ngay) values ($1,'quet_the',2000000,$2,'2030-01-12')`, [h, NV.thuNgan]);
    const r = await q<Record<string, string>>(`select ngay::text, so_don, doanh_thu::text, thu_don_moi::text, thu_no_cu::text, thuc_thu::text, tien_mat::text, chuyen_khoan::text, quet_the::text, no_moi::text from bc_doanh_thu_ngay('2030-01-10','2030-01-12',$1)`, [CN]);
    expect(r[0]).toMatchObject({ ngay: "2030-01-10", so_don: 1, doanh_thu: "9000000", thu_don_moi: "7000000", thu_no_cu: "0", thuc_thu: "7000000", tien_mat: "6000000", chuyen_khoan: "1000000", no_moi: "2000000" });
    expect(r[2]).toMatchObject({ ngay: "2030-01-12", so_don: 0, thu_no_cu: "2000000", thuc_thu: "2000000", quet_the: "2000000" });
  });
  it("hoa hồng: doanh số chia theo vai, đã chia phần giảm giá cả đơn, nhân tỉ lệ cài đặt (riêng cho mục thắng mặc định)", async () => {
    await q(`insert into hoa_hong_ti_le (loai, muc_id, vai, ti_le) values ('dich_vu', null, 'ban', 10), ('dich_vu', $1, 'ban', 20)`, [DV_PEEL]);
    // đơn BC ở trên: doanh thu 9tr, chia ban 60/40 cho thu ngân và tư vấn
    const r = await q<{ nhan_vien_id: string; doanh_so: string; hoa_hong: string }>(`select nhan_vien_id, doanh_so::text, hoa_hong::text from bc_nhan_vien('2030-01-10','2030-01-10',$1) where vai='ban' order by 2 desc`, [CN]);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ nhan_vien_id: NV.thuNgan, doanh_so: "5400000", hoa_hong: "1080000" });
    expect(r[1]).toMatchObject({ nhan_vien_id: NV.tuVan, doanh_so: "3600000", hoa_hong: "720000" });
  });
  it("doanh số theo mục bán", async () => {
    const r = await one<{ ten: string; so_luong: string; doanh_so: string }>(`select ten, so_luong::text, doanh_so::text from bc_muc_ban('2030-01-10','2030-01-10',$1)`, [CN]);
    expect(r).toMatchObject({ ten: "Peel", so_luong: "1", doanh_so: "9000000" });
  });
});
