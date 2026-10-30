/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// Chị Lâm 30/10: vật tư tiêu hao xuất TRƯỚC KHI LÊN BILL theo phiếu cấp; chốt hoá đơn KHÔNG được trừ kho vật tư lần nữa.
// Chạy trên Postgres thật (PGlite) với đúng các migration.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const NV = { thuNgan: u(1), bacSi: u(2), ktv: u(3), kho: u(4), tuVan: u(5), quanLy: u(6) };
let db: PGlite, CN: string, KH: string, DV: string, KEM: string, DAU: string, THUOC: string, SRM: string;
const q = async <T = any>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = any>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
const ton = async (sp: string) => Number((await one<{ t: string }>(`select trim_scale(ton_kho($1,$2))::text t`, [CN, sp])).t);

async function taoHoaDon(dong: { loai: "dich_vu" | "san_pham"; ref: string; ten: string; sl?: number; gia: number }[]) {
  const hd = await one<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'), $1, $2, $3) returning id`, [CN, KH, NV.thuNgan]);
  for (const d of dong) {
    const col = d.loai === "dich_vu" ? "dich_vu_id" : "san_pham_id";
    const dg = await one<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, ${col}, ten, so_luong, don_gia, giam_gia) values ($1,$2,$3,$4,$5,$6,0) returning id`, [hd.id, d.loai, d.ref, d.ten, d.sl ?? 1, d.gia]);
    await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'ban',60),($1,$3,'ban',40)`, [dg.id, NV.thuNgan, NV.tuVan]);
  }
  return hd.id;
}
const thuDu = async (hd: string) => {
  await q(`select tinh_lai_hoa_don($1)`, [hd]);
  const h = await one<{ tong_phai_thu: string }>(`select tong_phai_thu::text from hoa_don where id = $1`, [hd]);
  await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, nguoi_id) values ($1,'thu','tien_mat',$2,$3)`, [hd, h.tong_phai_thu, NV.thuNgan]);
};
const dongSoCai = (hd: string) => q<{ san_pham_id: string; loai: string; so_luong: string }>(`select san_pham_id, loai, so_luong::text from kho_so_cai where hoa_don_id = $1`, [hd]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await one(`select id from chi_nhanh where ma='VINH'`)).id;
  await q(`insert into auth.users (id) values ('${u(900)}')`);
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values
    ('${NV.thuNgan}','Thu Ngân','thu_ngan','${CN}'),('${NV.bacSi}','Bác Sĩ','bac_si','${CN}'),('${NV.ktv}','KTV','ktv','${CN}'),
    ('${NV.kho}','Kho','thu_kho','${CN}'),('${NV.tuVan}','Tư Vấn','tu_van','${CN}'),('${NV.quanLy}','Quản Lý','quan_ly','${CN}')`);
  KH = (await one(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH000001','Khách Thử','0900000001',$1,'mkt',$2) returning id`, [CN, NV.tuVan])).id;
  const nhom = (await one(`select id from dich_vu_nhom where ten='Peel da'`)).id;
  DV = (await one(`insert into dich_vu (ma, nhom_id, ten, gia) values ('MFU01',$1,'MFU Basic',20000000) returning id`, [nhom])).id;
  KEM = (await one(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('KEM','Kem tê','A','g',2156,true) returning id`)).id;
  DAU = (await one(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao) values ('DAU45','Đầu MFU N4.5','A','shot',2144,true) returning id`)).id;
  // Giống VT0225: vừa tiêu hao (liều trong ca) vừa bán lẻ.
  THUOC = (await one(`insert into san_pham (ma, ten, nhom_cap, don_vi, gia_nhap_don_vi, tieu_hao, ban_le, gia_ban) values ('VT0225','Thuốc giảm đau thử','A','viên',3250,true,true,10000) returning id`)).id;
  SRM = (await one(`insert into san_pham (ma, ten, don_vi, gia_ban, ban_le) values ('SRM','Sữa rửa mặt','chai',300000,true) returning id`)).id;
  await q(`insert into dinh_muc (dich_vu_id, san_pham_id, so_luong, chon_theo_chi_dinh) values ($1,$2,20,false),($1,$3,1,false),($1,$4,300,true)`, [DV, KEM, THUOC, DAU]);
  await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, nguoi_id) values ($1,$2,'nhap',100,2156,$6),($1,$3,'nhap',1000,2144,$6),($1,$4,'nhap',50,3250,$6),($1,$5,'nhap',10,200000,$6)`, [CN, KEM, DAU, THUOC, SRM, NV.kho]);
});

describe("xuất vật tư trước bill, chốt bill không trừ đôi", () => {
  let PHIEU: string, HD: string;
  it("phiếu cấp trừ kho ngay lúc kho cấp, trả phần dư vào lại; tồn khớp từng đơn vị", async () => {
    PHIEU = (await one(`select tao_phieu_cap($1,null,$2,$3,$4,$5,$6::jsonb,$5) id`, [CN, KH, DV, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: DAU, so_luong: 200 }])])).id;
    expect([await ton(KEM), await ton(THUOC), await ton(DAU)]).toEqual([100, 50, 1000]);
    await q(`select cap_phieu($1,$2)`, [PHIEU, NV.kho]);
    expect([await ton(KEM), await ton(THUOC), await ton(DAU)]).toEqual([80, 49, 800]);
    await q(`select nhan_phieu($1,$2,null)`, [PHIEU, NV.ktv]);
    const dong = await q<{ id: string; san_pham_id: string }>(`select id, san_pham_id from phieu_cap_dong where phieu_id = $1`, [PHIEU]);
    const tra = (sp: string, n: number) => ({ dong_id: dong.find((d) => d.san_pham_id === sp)!.id, so_tra: n });
    await q(`select hoan_tat_phieu($1,$2::jsonb,null,$3)`, [PHIEU, JSON.stringify([tra(KEM, 2), tra(THUOC, 0), tra(DAU, 10)]), NV.ktv]);
    expect([await ton(KEM), await ton(THUOC), await ton(DAU)]).toEqual([82, 49, 810]);
  });
  it("chốt hoá đơn có dịch vụ đó + 1 hàng bán: vật tư tiêu hao KHÔNG bị trừ thêm, chỉ hàng bán bị trừ", async () => {
    HD = await taoHoaDon([{ loai: "dich_vu", ref: DV, ten: "MFU Basic", gia: 20_000_000 }, { loai: "san_pham", ref: SRM, ten: "Sữa rửa mặt", gia: 300_000 }]);
    await thuDu(HD);
    await q(`select chot_hoa_don($1,$2)`, [HD, NV.thuNgan]);
    expect((await one(`select trang_thai from hoa_don where id = $1`, [HD])).trang_thai).toBe("hoan_thanh");
    expect([await ton(KEM), await ton(THUOC), await ton(DAU)]).toEqual([82, 49, 810]);
    expect(await ton(SRM)).toBe(9);
    expect(await dongSoCai(HD)).toEqual([{ san_pham_id: SRM, loai: "xuat_ban", so_luong: "-1.000" }]);
  });
  it("sổ kho của vật tư tiêu hao chỉ có nhập, cấp theo phiếu và trả (không có dòng bán)", async () => {
    const loai = await q<{ loai: string }>(`select distinct loai from kho_so_cai where san_pham_id in ($1,$2,$3) and loai not in ('nhap') order by 1`, [KEM, DAU, THUOC]);
    expect(loai.map((l) => l.loai)).toEqual(["cap_ca", "tra_ca"]);
  });
  it("huỷ hoá đơn chỉ hoàn hàng bán, không đụng vật tư đã cấp theo phiếu", async () => {
    await q(`select huy_hoa_don($1,'Khách đổi ý',$2)`, [HD, NV.quanLy]);
    expect([await ton(KEM), await ton(THUOC), await ton(DAU), await ton(SRM)]).toEqual([82, 49, 810, 10]);
  });
  it("thuốc vừa tiêu hao vừa bán lẻ: bán một hộp là một lần xuất khác với liều dùng trong ca; liều đã cấp theo phiếu không bị trừ lại", async () => {
    const hd = await taoHoaDon([{ loai: "san_pham", ref: THUOC, ten: "Thuốc giảm đau thử", sl: 2, gia: 10_000 }]);
    await thuDu(hd);
    await q(`select chot_hoa_don($1,$2)`, [hd, NV.thuNgan]);
    expect(await ton(THUOC)).toBe(47);
    expect(await dongSoCai(hd)).toEqual([{ san_pham_id: THUOC, loai: "xuat_ban", so_luong: "-2.000" }]);
  });
  it("chốt chặn sổ kho: dòng bán của vật tư tiêu hao không bán lẻ bị từ chối; hoàn kho (số dương) và hàng bán lẻ vẫn ghi được", async () => {
    expect(await loi(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong) values ($1,$2,'xuat_ban',-1)`, [CN, KEM])).toMatch(/vật tư tiêu hao dùng trong ca/);
    await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong) values ($1,$2,'xuat_ban',-1)`, [CN, THUOC]);
    await q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong) values ($1,$2,'dieu_chinh',1)`, [CN, KEM]);
    expect(await ton(KEM)).toBe(83);
  });
  it("hoá đơn lỡ có dòng vật tư tiêu hao thì chốt bị chặn chứ không trừ kho đôi", async () => {
    const hd = await taoHoaDon([{ loai: "san_pham", ref: KEM, ten: "Kem tê", gia: 5_000 }]);
    await thuDu(hd);
    expect(await loi(`select chot_hoa_don($1,$2)`, [hd, NV.thuNgan])).toMatch(/vật tư tiêu hao dùng trong ca/);
    expect(await ton(KEM)).toBe(83);
  });
  it("cấp thêm giữa ca cần lý do + bác sĩ; tồn trừ đúng một lần", async () => {
    const lich = (await one(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2, now(), now() + interval '1 hour') returning id`, [KH, CN])).id;
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [lich, DV]);
    const p = (await one(`select tao_phieu_cap($1,$2,$3,$4,$5,$6,$7::jsonb,$6) id`, [CN, lich, KH, DV, NV.bacSi, NV.ktv, JSON.stringify([{ san_pham_id: DAU, so_luong: 100 }])])).id;
    await q(`select cap_phieu($1,$2)`, [p, NV.kho]);
    expect(await loi(`select cap_them_phieu($1,$2,5,'',null,$3)`, [p, KEM, NV.kho])).toMatch(/lý do và bác sĩ xác nhận/);
    const truoc = await ton(KEM);
    await q(`select cap_them_phieu($1,$2,5,'Khách cần thêm vùng cổ',$3,$4)`, [p, KEM, NV.bacSi, NV.kho]);
    expect(await ton(KEM)).toBe(truoc - 5);
  });
});
