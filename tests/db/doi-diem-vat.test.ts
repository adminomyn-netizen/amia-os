import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0067: đổi điểm thưởng khi chốt đơn (trừ trong cùng giao dịch, không đủ điểm thì không chốt), huỷ đơn hoàn điểm đúng một lần; cột HĐ VAT; ràng buộc kiểu lặp lịch.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, KH: string, DV: string;
const NV = u(1);

async function taoDon(giam: number) {
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id, giam_gia_don) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'),$1,$2,$3,$4) returning id`, [CN, KH, NV, giam]))[0].id;
  await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia) values ($1,'dich_vu',$2,'Peel',1,1500000)`, [h, DV]);
  await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, nguoi_id) values ($1,'thu','tien_mat',$2,$3)`, [h, 1500000 - giam, NV]);
  return h;
}
const du = async () => (await q<{ diem_so_du: number }>(`select diem_so_du from khach_hang where id=$1`, [KH]))[0].diem_so_du;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Thu Ngân','thu_ngan',$2)`, [NV, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL01',$1,'Peel',1500000) returning id`, [nhom]))[0].id;
  // 0214 tự cộng điểm khi chốt đơn; file này chỉ kiểm cơ chế ĐỔI điểm nên tắt tích điểm để số dư không bị cộng thêm.
  await q(`insert into cau_hinh (khoa, gia_tri) values ('diem.tich_bat','0') on conflict (khoa) do update set gia_tri='0'`);
  await q(`insert into khach_diem_so (khach_id, loai, so_diem) values ($1,'dieu_chinh',30)`, [KH]);
});

describe("đổi điểm thưởng ở thu ngân", () => {
  it("cấu hình theo SalonHero: 1 điểm = 10.000đ, mặc định tắt", async () => {
    const r = await q<{ khoa: string; gia_tri: string }>(`select khoa, gia_tri from cau_hinh where khoa in ('diem.doi_bat','diem.doi_tien') order by khoa`);
    expect(r).toEqual([{ khoa: "diem.doi_bat", gia_tri: "0" }, { khoa: "diem.doi_tien", gia_tri: "10000" }]);
  });
  it("không đủ điểm: báo lỗi, không trừ điểm, đơn vẫn là nháp", async () => {
    const h = await taoDon(400000);
    expect(await loi(`select chot_hoa_don_doi_diem($1,$2,40,400000)`, [h, NV])).toMatch(/chỉ còn 30 điểm/);
    expect(await du()).toBe(30);
    expect((await q<{ trang_thai: string }>(`select trang_thai from hoa_don where id=$1`, [h]))[0].trang_thai).toBe("nhap");
  });
  it("tiền đổi điểm lớn hơn giảm giá của đơn thì chặn", async () => {
    const h = await taoDon(100000);
    expect(await loi(`select chot_hoa_don_doi_diem($1,$2,20,200000)`, [h, NV])).toMatch(/không khớp/);
    expect(await du()).toBe(30);
  });
  it("đủ điểm: trừ điểm, ghi giam_diem, chốt; huỷ thì hoàn đúng một lần", async () => {
    const h = await taoDon(200000);
    await q(`select chot_hoa_don_doi_diem($1,$2,20,200000)`, [h, NV]);
    expect(await du()).toBe(10);
    const hd = (await q<{ trang_thai: string; giam_diem: string; tong_phai_thu: string }>(`select trang_thai, giam_diem::text, tong_phai_thu::text from hoa_don where id=$1`, [h]))[0];
    expect(hd).toEqual({ trang_thai: "hoan_thanh", giam_diem: "200000", tong_phai_thu: "1300000" });
    await q(`select huy_hoa_don($1,'Khách đổi ý',$2)`, [h, NV]);
    expect(await du()).toBe(30);
    // cập nhật lại trạng thái (vd đổi cột khác) không hoàn thêm
    await q(`update hoa_don set ghi_chu='x' where id=$1`, [h]);
    expect(await du()).toBe(30);
    expect((await q<{ n: number }>(`select count(*)::int n from khach_diem_so where hoa_don_id=$1`, [h]))[0].n).toBe(2);
  });
  it("không đổi điểm (0 điểm) thì chốt như thường", async () => {
    const h = await taoDon(0);
    await q(`select chot_hoa_don_doi_diem($1,$2,0,0)`, [h, NV]);
    expect((await q<{ trang_thai: string }>(`select trang_thai from hoa_don where id=$1`, [h]))[0].trang_thai).toBe("hoan_thanh");
    expect(await du()).toBe(30);
  });
});

describe("HĐ VAT + lịch lặp", () => {
  it("ghi nhận đã xuất HĐ VAT", async () => {
    const h = await taoDon(0);
    await q(`select chot_hoa_don($1,$2)`, [h, NV]);
    await q(`update hoa_don set vat_hd_so='0000123', vat_hd_ky_hieu='1C26TAA', vat_hd_luc=now(), vat_hd_nguoi_id=$2 where id=$1`, [h, NV]);
    expect((await q<{ n: number }>(`select count(*)::int n from hoa_don where vat_hd_luc is not null`))[0].n).toBe(1);
  });
  it("kieu_lap chỉ nhận mã SalonHero", async () => {
    const t = new Date("2026-11-01T03:00:00Z").toISOString();
    await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, kieu_lap, lap_nhom, lap_khoang, lap_tong, lap_thu_tu) values ($1,$2,$3,$3::timestamptz + interval '1 hour','WEEKLY',$4,1,4,1)`, [KH, CN, t, u(77)]);
    expect(await loi(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, kieu_lap) values ($1,$2,$3,$3::timestamptz + interval '1 hour','WEEK')`, [KH, CN, t])).toMatch(/kieu_lap/);
  });
});
