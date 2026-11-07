import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { taoDbVoiMigration } from "./khung";

// Phiếu vật tư theo buổi (0310): ra phiếu đủ định mức khi ghi buổi, KTV sửa/xác nhận, chốt cuối ngày mới xuất kho.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const NV = { thuNgan: u(1), bacSi: u(2), ktv: u(3), kho: u(4) };

let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];
const loi = async (sql: string, p: unknown[] = []) => {
  try { await db.query(sql, p); } catch (e) { return (e as Error).message; }
  return "";
};
const ton = async (sp: string) => (await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, sp])).t;
const tt = async (id: string) => (await one<{ trang_thai: string }>(`select trang_thai from phieu_cap where id=$1`, [id])).trang_thai;

let CN: string, KH: string, DV: string, DV_TRONG: string, SP_KEM: string, SP_TIP: string, SP_GANG: string;
const NGAY = "2026-11-07";
async function taoBuoi(dv: string, ngay = NGAY, lich: string | null = null) {
  return (await one<{ id: string }>(`insert into buoi_thuc_hien (khach_id, dich_vu_id, chi_nhanh_id, ngay_lam, nv_thuc_hien_id, lich_hen_id, tao_boi) values ($1,$2,$3,$4,$5,$6,$7) returning id`, [KH, dv, CN, ngay, NV.ktv, lich, NV.thuNgan])).id;
}
const taoPhieu = async (buoi: string) => (await one<{ id: string }>(`select tao_phieu_theo_buoi($1,$2) as id`, [buoi, NV.thuNgan])).id;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await one<{ id: string }>(`select id from chi_nhanh where ma='VINH'`)).id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${NV.thuNgan}','Thu Ngân','thu_ngan','${CN}'),('${NV.bacSi}','Bác Sĩ','bac_si','${CN}'),('${NV.ktv}','KTV','ktv','${CN}'),('${NV.kho}','Kho','thu_kho','${CN}')`);
  KH = (await one<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH900001','Khách Buổi','0900000901',$1,'mkt',$2) returning id`, [CN, NV.thuNgan])).id;
  const nhom = (await one<{ id: string }>(`select id from dich_vu_nhom limit 1`)).id;
  DV = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('BUOI01',$1,'Dịch vụ có định mức',1000000) returning id`, [nhom])).id;
  DV_TRONG = (await one<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('BUOI02',$1,'Dịch vụ chưa định mức',1000000) returning id`, [nhom])).id;
  SP_KEM = (await one<{ id: string }>(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('B-KEM','Kem tê','A','g',2000,true) returning id`)).id;
  SP_TIP = (await one<{ id: string }>(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('B-TIP','Đầu tip','A','shot',1000,true) returning id`)).id;
  SP_GANG = (await one<{ id: string }>(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('B-GANG','Găng tay','C','đôi',500,true) returning id`)).id;
  await q(`insert into dinh_muc (dich_vu_id, san_pham_id, so_luong, chon_theo_chi_dinh) values ($1,$2,20,false),($1,$3,300,true)`, [DV, SP_KEM, SP_TIP]);
  await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, nguoi_id) values ($1,$2,'nhap',100,$5),($1,$3,'nhap',1000,$5),($1,$4,'nhap',50,$5)`, [CN, SP_KEM, SP_TIP, SP_GANG, NV.kho]);
});

describe("phiếu vật tư theo buổi", () => {
  let B1: string, P1: string;
  it("ra phiếu chờ cấp với ĐỦ dòng định mức (cả phương án chỉ định), số cấp = định mức; gọi lại không tạo trùng", async () => {
    B1 = await taoBuoi(DV);
    P1 = await taoPhieu(B1);
    expect(await one(`select trang_thai, bac_si_id, ktv_id, buoi_id from phieu_cap where id=$1`, [P1])).toMatchObject({ trang_thai: "cho_cap", bac_si_id: null, ktv_id: NV.ktv, buoi_id: B1 });
    const d = await q<{ san_pham_id: string; so_cap: string; dinh_muc: string }>(`select san_pham_id, trim_scale(so_cap)::text so_cap, trim_scale(dinh_muc)::text dinh_muc from phieu_cap_dong where phieu_id=$1 order by phieu_cap_dong.so_cap`, [P1]);
    expect(d).toEqual([{ san_pham_id: SP_KEM, so_cap: "20", dinh_muc: "20" }, { san_pham_id: SP_TIP, so_cap: "300", dinh_muc: "300" }]);
    expect(await taoPhieu(B1)).toBe(P1);
    expect(await ton(SP_KEM)).toBe("100");
  });
  it("dịch vụ chưa có định mức vẫn ra phiếu 0 dòng", async () => {
    const p = await taoPhieu(await taoBuoi(DV_TRONG));
    expect((await one<{ n: number }>(`select count(*)::int n from phieu_cap_dong where phieu_id=$1`, [p])).n).toBe(0);
  });
  it("KTV sửa số, thêm, bỏ dòng; sửa thì mất xác nhận cũ; số ≤ 0 bị chặn; thêm trùng bị chặn", async () => {
    await q(`select xac_nhan_phieu_buoi($1,$2)`, [P1, NV.ktv]);
    expect((await one<{ x: string | null }>(`select xac_nhan_boi x from phieu_cap where id=$1`, [P1])).x).toBe(NV.ktv);
    const tip = (await one<{ id: string }>(`select id from phieu_cap_dong where phieu_id=$1 and san_pham_id=$2`, [P1, SP_TIP])).id;
    const kem = (await one<{ id: string }>(`select id from phieu_cap_dong where phieu_id=$1 and san_pham_id=$2`, [P1, SP_KEM])).id;
    expect(await loi(`select sua_dong_phieu_buoi($1,0,$2)`, [kem, NV.ktv])).toMatch(/lớn hơn 0/);
    await q(`select sua_dong_phieu_buoi($1,15,$2)`, [kem, NV.ktv]);
    expect(await one(`select xac_nhan_boi, xac_nhan_luc, sua_boi from phieu_cap where id=$1`, [P1])).toMatchObject({ xac_nhan_boi: null, xac_nhan_luc: null, sua_boi: NV.ktv });
    await q(`select xoa_dong_phieu_buoi($1,$2)`, [tip, NV.ktv]);
    await q(`select them_dong_phieu_buoi($1,$2,2,$3)`, [P1, SP_GANG, NV.ktv]);
    expect(await loi(`select them_dong_phieu_buoi($1,$2,1,$3)`, [P1, SP_GANG, NV.ktv])).toMatch(/đã có trên phiếu/);
    const d = await q<{ san_pham_id: string; so_cap: string; dinh_muc: string }>(`select san_pham_id, trim_scale(so_cap)::text so_cap, trim_scale(dinh_muc)::text dinh_muc from phieu_cap_dong where phieu_id=$1 order by phieu_cap_dong.so_cap`, [P1]);
    expect(d).toEqual([{ san_pham_id: SP_GANG, so_cap: "2", dinh_muc: "0" }, { san_pham_id: SP_KEM, so_cap: "15", dinh_muc: "20" }]);
  });
  it("phiếu theo buổi không đi luồng kho cấp / nhận của bác sĩ", async () => {
    expect(await loi(`select cap_phieu($1,$2)`, [P1, NV.kho])).toMatch(/phiếu vật tư theo buổi/);
    expect(await ton(SP_KEM)).toBe("100");
    expect(await tt(P1)).toBe("cho_cap");
  });
  it("chốt ngày: chỉ phiếu đã xác nhận được xuất kho; phiếu chưa xác nhận báo lại; ngày khác không đụng", async () => {
    const pKhacNgay = await taoPhieu(await taoBuoi(DV, "2026-11-06"));
    await q(`select xac_nhan_phieu_buoi($1,$2)`, [pKhacNgay, NV.ktv]);
    let kq = await one<{ k: { da_chot: number; chua_xac_nhan: { id: string }[]; loi: unknown[] } }>(`select chot_phieu_ngay($1,$2::date,$3) k`, [CN, NGAY, NV.kho]);
    expect(kq.k.da_chot).toBe(0);
    expect(kq.k.chua_xac_nhan.map((x) => x.id)).toContain(P1);
    await q(`select xac_nhan_phieu_buoi($1,$2)`, [P1, NV.ktv]);
    kq = await one(`select chot_phieu_ngay($1,$2::date,$3) k`, [CN, NGAY, NV.kho]);
    expect(kq.k.da_chot).toBe(1);
    expect(kq.k.chua_xac_nhan.map((x) => x.id)).not.toContain(P1);
    expect(await ton(SP_KEM)).toBe("85");
    expect(await ton(SP_GANG)).toBe("48");
    expect(await ton(SP_TIP)).toBe("1000");
    expect(await one(`select trang_thai, cap_boi, nhan_boi from phieu_cap where id=$1`, [P1])).toMatchObject({ trang_thai: "da_lam", cap_boi: NV.kho, nhan_boi: NV.ktv });
    expect(await tt(pKhacNgay)).toBe("cho_cap");
    // hiện ở đối chiếu ngày (so_tra = 0 → dùng thật = số đã xác nhận), lam_xong_luc nằm trong ngày chốt
    const v = await q<{ dung_that: string }>(`select trim_scale(dung_that)::text dung_that from v_phieu_cap_lech where phieu_id=$1 order by dung_that`, [P1]);
    expect(v.map((x) => x.dung_that)).toEqual(["15", "2"]);
    expect((await one<{ d: string }>(`select to_char(lam_xong_luc at time zone 'Asia/Ho_Chi_Minh','YYYY-MM-DD') d from phieu_cap where id=$1`, [P1])).d).toBe(NGAY);
    // chốt rồi thì không sửa, không huỷ, chốt lại không xuất lần nữa; đối chiếu như ca thường
    const kem = (await one<{ id: string }>(`select id from phieu_cap_dong where phieu_id=$1 and san_pham_id=$2`, [P1, SP_KEM])).id;
    expect(await loi(`select sua_dong_phieu_buoi($1,1,$2)`, [kem, NV.ktv])).toMatch(/đã chốt/);
    expect(await loi(`select huy_phieu($1,'x',$2)`, [P1, NV.kho])).toMatch(/không huỷ được/);
    await q(`select chot_phieu_ngay($1,$2::date,$3)`, [CN, NGAY, NV.kho]);
    expect(await ton(SP_KEM)).toBe("85");
    await q(`select doi_chieu_phieu($1,$2)`, [P1, NV.kho]);
    expect(await tt(P1)).toBe("da_doi_chieu");
  });
  it("thiếu tồn: phiếu đó giữ nguyên + báo lý do, phiếu khác vẫn chốt", async () => {
    const pThieu = await taoPhieu(await taoBuoi(DV));
    const kem = (await one<{ id: string }>(`select id from phieu_cap_dong where phieu_id=$1 and san_pham_id=$2`, [pThieu, SP_KEM])).id;
    await q(`select sua_dong_phieu_buoi($1,9999,$2)`, [kem, NV.ktv]);
    await q(`select xac_nhan_phieu_buoi($1,$2)`, [pThieu, NV.ktv]);
    const pDu = await taoPhieu(await taoBuoi(DV_TRONG));
    await q(`select them_dong_phieu_buoi($1,$2,1,$3)`, [pDu, SP_GANG, NV.ktv]);
    await q(`select xac_nhan_phieu_buoi($1,$2)`, [pDu, NV.ktv]);
    const kq = await one<{ k: { da_chot: number; loi: { id: string; loi: string }[] } }>(`select chot_phieu_ngay($1,$2::date,$3) k`, [CN, NGAY, NV.kho]);
    expect(kq.k.loi.find((x) => x.id === pThieu)?.loi).toMatch(/Kho không đủ/);
    expect(await tt(pThieu)).toBe("cho_cap");
    expect(await tt(pDu)).toBe("da_lam");
    expect(await ton(SP_TIP)).toBe("1000"); // dòng tip của phiếu thiếu không bị xuất lẻ
    expect(await ton(SP_GANG)).toBe("47");
  });
  it("huỷ buổi → huỷ phiếu chưa chốt; buổi đã huỷ không ra phiếu", async () => {
    const b = await taoBuoi(DV);
    const p = await taoPhieu(b);
    await q(`select huy_buoi($1,'Nhập nhầm',$2)`, [b, NV.kho]);
    expect(await one(`select trang_thai, ly_do_huy from phieu_cap where id=$1`, [p])).toMatchObject({ trang_thai: "huy", ly_do_huy: "Huỷ buổi: Nhập nhầm" });
    expect(await loi(`select tao_phieu_theo_buoi($1,$2)`, [b, NV.thuNgan])).toMatch(/đã huỷ/);
  });
  it("lịch đã có phiếu bác sĩ chỉ định cho dịch vụ đó → trả phiếu đó, không ra phiếu thứ hai", async () => {
    const lich = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id) values ($1,$2, now(), now() + interval '1 hour','cho_phuc_vu',$3) returning id`, [KH, CN, NV.ktv])).id;
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [lich, DV]);
    const pBs = (await one<{ id: string }>(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$5) id`, [CN, lich, KH, DV, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: SP_TIP, so_luong: 100 }])])).id;
    expect(await taoPhieu(await taoBuoi(DV, NGAY, lich))).toBe(pBs);
    // luồng bác sĩ không đổi: cấp → nhận chạy như cũ, bác sĩ vẫn bắt buộc khi ra phiếu chỉ định
    await q(`select cap_phieu($1,$2)`, [pBs, NV.kho]);
    await q(`select nhan_phieu($1,$2,null)`, [pBs, NV.ktv]);
    expect(await tt(pBs)).toBe("da_nhan");
    const lich2 = (await one<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, nhan_vien_id) values ($1,$2, now(), now() + interval '1 hour','cho_phuc_vu',$3) returning id`, [KH, CN, NV.ktv])).id;
    expect(await loi(`select tao_phieu_cap($1,$2,$3,$4,null,$5,$6::jsonb,$5)`, [CN, lich2, KH, DV, NV.ktv, JSON.stringify([{ san_pham_id: SP_TIP, so_luong: 100 }])])).toMatch(/phieu_cap_bac_si_hoac_buoi/);
  });
  it("chạy lại migration 0310 lần nữa không lỗi (idempotent)", async () => {
    await db.exec(readFileSync(join(process.cwd(), "supabase", "migrations", "0310_phieu_vat_tu_theo_buoi.sql"), "utf8"));
    expect((await one<{ n: number }>(`select count(*)::int n from pg_trigger where tgname in ('phieu_buoi_trang_thai','buoi_huy_phieu')`)).n).toBe(2);
  });
});
