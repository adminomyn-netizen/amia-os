import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0081: tối đa 5 người hưởng mỗi vai mỗi dòng. 0082: đánh giá nhân viên theo đơn (chỉ hoá đơn hoàn thành, chỉ người phục vụ, mỗi cặp một đánh giá, sửa có nhật ký).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, KH: string, DV: string;
const NV = u(1);
const NVS = Array.from({ length: 7 }, (_, i) => u(10 + i));

async function taoDon(chot: boolean) {
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'),$1,$2,$3) returning id`, [CN, KH, NV]))[0].id;
  const d = (await q<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia) values ($1,'dich_vu',$2,'Peel',1,1000000) returning id`, [h, DV]))[0].id;
  if (chot) {
    await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'phuc_vu',60), ($1,$3,'phuc_vu',40), ($1,$4,'tu_van',100)`, [d, NVS[0], NVS[1], NVS[2]]);
    await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, nguoi_id) values ($1,'thu','tien_mat',1000000,$2)`, [h, NV]);
    await q(`select chot_hoa_don($1,$2)`, [h, NV]);
  }
  return { h, d };
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Thu Ngân','thu_ngan',$2)`, [NV, CN]);
  for (const [i, id] of NVS.entries()) await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,$2,'ktv',$3)`, [id, `KTV ${i}`, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, ngay_sinh) values ('KH1','Khách','0900000001',$1,'mkt',$2,'1990-01-01') returning id`, [CN, NV]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL01',$1,'Peel',1000000) returning id`, [nhom]))[0].id;
});

describe("tối đa 5 người hưởng mỗi vai", () => {
  it("5 người cùng vai thì được, người thứ 6 bị chặn, vai khác vẫn thêm được", async () => {
    const { d } = await taoDon(false);
    for (let i = 0; i < 5; i++) await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'phuc_vu',20)`, [d, NVS[i]]);
    expect(await loi(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'phuc_vu',10)`, [d, NVS[5]])).toMatch(/tối đa 5 người/);
    await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'tu_van',100)`, [d, NVS[5]]);
    expect((await q<{ n: number }>(`select count(*)::int n from dong_nhan_vien where dong_id=$1 and vai='phuc_vu'`, [d]))[0].n).toBe(5);
  });
});

describe("đánh giá nhân viên theo đơn", () => {
  it("chỉ đánh giá hoá đơn đã hoàn thành và người phục vụ của đơn", async () => {
    const nhap = await taoDon(false);
    expect(await loi(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem, nguoi_ghi_id) values ($1,$2,5,$3)`, [nhap.h, NVS[0], NV])).toMatch(/hoàn thành/);
    const { h } = await taoDon(true);
    expect(await loi(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem, nguoi_ghi_id) values ($1,$2,5,$3)`, [h, NVS[2], NV])).toMatch(/không phải người phục vụ/);   // chỉ là tư vấn
    expect(await loi(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem, nguoi_ghi_id) values ($1,$2,6,$3)`, [h, NVS[0], NV])).toMatch(/danh_gia_nhan_vien_diem_check/);
    expect(await loi(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem, nguoi_ghi_id) values ($1,$2,0,$3)`, [h, NVS[0], NV])).toMatch(/danh_gia_nhan_vien_diem_check/);
  });
  it("mỗi cặp đơn–nhân viên một đánh giá; sửa được và ghi nhật ký cũ → mới", async () => {
    const { h } = await taoDon(true);
    await q(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem, y_kien, nguoi_ghi_id) values ($1,$2,4,'Tốt',$3)`, [h, NVS[0], NV]);
    expect(await loi(`insert into danh_gia_nhan_vien (hoa_don_id, nhan_vien_id, diem, nguoi_ghi_id) values ($1,$2,3,$3)`, [h, NVS[0], NV])).toMatch(/danh_gia_mot_cap|duplicate/);
    await q(`update danh_gia_nhan_vien set diem = 2, y_kien = 'Chờ lâu', nguoi_ghi_id = $3 where hoa_don_id = $1 and nhan_vien_id = $2`, [h, NVS[0], NV]);
    const nk = await q<{ hanh_dong: string; chi_tiet: { truoc: { diem: number } | null; sau: { diem: number; y_kien: string } } }>(`select hanh_dong, chi_tiet from nhat_ky_truy_cap where doi_tuong='danh_gia_nhan_vien' order by id desc limit 2`);
    expect(nk.map((x) => x.hanh_dong)).toEqual(["sua_danh_gia_nv", "ghi_danh_gia_nv"]);
    expect(nk[0].chi_tiet.truoc?.diem).toBe(4);
    expect(nk[0].chi_tiet.sau).toEqual({ diem: 2, y_kien: "Chờ lâu" });
    expect(await loi(`update danh_gia_nhan_vien set nhan_vien_id = $2 where hoa_don_id = $1`, [h, NVS[1]])).toMatch(/Không đổi hoá đơn hay nhân viên/);
    expect(await loi(`delete from danh_gia_nhan_vien`)).toMatch(/chỉ được thêm dòng/);
  });
});
