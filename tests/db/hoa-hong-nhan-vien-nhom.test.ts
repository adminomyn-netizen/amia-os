import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0087: tỉ lệ hoa hồng theo nhân viên / nhóm (chức danh), số tiền cố định, sao chép cài đặt. Không đổi cách tính khi chưa có dòng riêng.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const NV = { an: u(1), binh: u(2), chi: u(3), tn: u(9) };
let CN: string, DV: string, DV2: string;

async function don(ma: string, ngay: string, dongs: { dv: string; gia: number; sl?: number; nv: [string, number][] }[]) {
  const hang = dongs.reduce((s, d) => s + d.gia * (d.sl ?? 1), 0);
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su) values ($1,$2,'hoan_thanh',$3,$4,$4,$4,0,$5,true) returning id`, [ma, CN, ngay, hang, NV.tn]))[0].id;
  for (const d of dongs) {
    const dg = (await q<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia, la_lich_su) values ($1,'dich_vu',$2,'DV',$3,$4,true) returning id`, [h, d.dv, d.sl ?? 1, d.gia]))[0].id;
    for (const [nv, ti] of d.nv) await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'phuc_vu',$3)`, [dg, nv, ti]);
  }
}
const hh = async () => Object.fromEntries((await q<{ nhan_vien_id: string; hh: number }>(`select nhan_vien_id, hoa_hong::int hh from bc_nhan_vien('2026-10-01','2026-10-31',null)`)).map((r) => [r.nhan_vien_id, r.hh]));

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chuc_danh, chi_nhanh_id) values ('${NV.an}','An','ktv','Chuyên viên Trị liệu',$1),('${NV.binh}','Bình','ktv','  chuyên viên trị liệu ',$1),('${NV.chi}','Chi','ktv','Bác sĩ',$1),('${NV.tn}','Thu ngân','thu_ngan',null,$1)`, [CN]);
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom limit 1`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('A',$1,'Peel',1000000) returning id`, [nhom]))[0].id;
  DV2 = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('B',$1,'Laser',2000000) returning id`, [nhom]))[0].id;
  await don("H1", "2026-10-05", [{ dv: DV, gia: 1000000, nv: [[NV.an, 100]] }, { dv: DV2, gia: 2000000, sl: 2, nv: [[NV.binh, 50], [NV.chi, 50]] }]);
});

describe("tỉ lệ theo nhân viên / nhóm", () => {
  it("chưa có dòng riêng: kết quả giống hệt công thức cũ (chỉ tỉ lệ chung theo loại, mục)", async () => {
    await q(`insert into hoa_hong_ti_le (loai, vai, ti_le) values ('dich_vu','phuc_vu',10)`);
    await q(`insert into hoa_hong_ti_le (loai, vai, muc_id, ti_le) values ('dich_vu','phuc_vu',$1,20)`, [DV2]);
    const moi = await hh();
    // công thức cũ của 0011, viết lại độc lập trong test
    const cu = Object.fromEntries((await q<{ nv: string; hh: number }>(
      `select c.nhan_vien_id nv, round(sum(v.doanh_so * c.ti_le / 100 * coalesce((select r.ti_le from hoa_hong_ti_le r where r.loai = v.loai and r.vai = c.vai and r.muc_id = v.muc_id),
         (select r.ti_le from hoa_hong_ti_le r where r.loai = v.loai and r.vai = c.vai and r.muc_id is null), 0) / 100))::int hh
         from dong_nhan_vien c join v_doanh_so_dong v on v.dong_id = c.dong_id where v.ngay_hd between '2026-10-01' and '2026-10-31' group by c.nhan_vien_id`)).map((r) => [r.nv, r.hh]));
    expect(moi).toEqual(cu);
    expect(moi).toEqual({ [NV.an]: 100000, [NV.binh]: 400000, [NV.chi]: 400000 }); // An 1.000.000×10%; Bình, Chi: 4.000.000×50%×20%
  });

  it("thứ tự ưu tiên: nhân viên+mục > nhân viên+loại > nhóm+mục > nhóm+loại > chung", async () => {
    // nhóm 'chuyên viên trị liệu' (An và Bình, dù viết hoa/khoảng trắng khác nhau): 30% cả loại, thắng cả tỉ lệ chung theo mục
    await q(`insert into hoa_hong_ti_le (loai, vai, ti_le, nhom_chuc_danh) values ('dich_vu','phuc_vu',30,'chuyên viên trị liệu')`);
    let r = await hh();
    expect(r).toEqual({ [NV.an]: 300000, [NV.binh]: 600000, [NV.chi]: 400000 }); // Chi (Bác sĩ) không thuộc nhóm nên giữ tỉ lệ chung
    await q(`insert into hoa_hong_ti_le (loai, vai, muc_id, ti_le, nhom_chuc_danh) values ('dich_vu','phuc_vu',$1,40,'chuyên viên trị liệu')`, [DV2]);
    r = await hh();
    expect(r[NV.binh]).toBe(800000); // nhóm + mục 40%
    await q(`insert into hoa_hong_ti_le (loai, vai, ti_le, nhan_vien_id) values ('dich_vu','phuc_vu',50,$1)`, [NV.an]);
    r = await hh();
    expect(r[NV.an]).toBe(500000); // nhân viên + loại 50% thắng nhóm
    await q(`insert into hoa_hong_ti_le (loai, vai, muc_id, ti_le, nhan_vien_id) values ('dich_vu','phuc_vu',$1,5,$2)`, [DV2, NV.binh]);
    r = await hh();
    expect(r[NV.binh]).toBe(100000); // nhân viên + mục 5%
    expect(r[NV.chi]).toBe(400000);
  });

  it("số tiền cố định × số lượng; chỉ một đối tượng mỗi dòng; không trùng khoá", async () => {
    await q(`insert into hoa_hong_ti_le (loai, vai, ti_le, so_tien, nhan_vien_id) values ('dich_vu','phuc_vu',0,20000,$1)`, [NV.chi]);
    expect((await hh())[NV.chi]).toBe(20000); // 20.000 × 2 lượt × chia 50%
    await expect(q(`insert into hoa_hong_ti_le (loai, vai, ti_le, so_tien, nhan_vien_id) values ('dich_vu','phuc_vu',1,1,$1)`, [NV.chi])).rejects.toThrow();
    await expect(q(`insert into hoa_hong_ti_le (loai, vai, ti_le, nhan_vien_id, nhom_chuc_danh) values ('san_pham','ban',1,$1,'x')`, [NV.an])).rejects.toThrow();
  });

  it("báo cáo theo thực thu cũng theo tỉ lệ riêng", async () => {
    await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) select id,'thu','tien_mat',5000000,'2026-10-05',$1,true from hoa_don where ma='H1'`, [NV.tn]);
    const r = Object.fromEntries((await q<{ nv: string; hh: number }>(`select nhan_vien_id nv, hoa_hong_tien::int hh from bc_hoa_hong_thuc_thu('2026-10-01','2026-10-31',null)`)).map((x) => [x.nv, x.hh]));
    expect(r).toEqual(await hh()); // thu đủ trong kỳ = theo hoá đơn
  });
});

describe("sao chép cài đặt", () => {
  it("xem trước: thêm / ghi đè / giữ nguyên; áp dụng không ghi đè rồi có ghi đè", async () => {
    const xt = await q<{ loai: string; muc_id: string | null; hanh_dong: string }>(`select loai, muc_id, hanh_dong from hh_xem_truoc_sao_chep('nhom','Chuyên Viên Trị Liệu','nhan_vien',$1) order by muc_id nulls first`, [NV.chi]);
    expect(xt.map((x) => x.hanh_dong)).toEqual(["ghi_de", "them"]); // cả loại: Chi đang 0%+20.000 (khác 30%); mục DV2: Chi chưa có riêng
    const [a] = await q(`select them::int, ghi_de::int, giu_nguyen::int from hh_sao_chep('nhom','chuyên viên trị liệu','nhan_vien',$1,false)`, [NV.chi]);
    expect(a).toEqual({ them: 1, ghi_de: 0, giu_nguyen: 0 });
    expect(await q(`select ti_le::int, so_tien::int from hoa_hong_ti_le where nhan_vien_id=$1 and muc_id is null`, [NV.chi])).toEqual([{ ti_le: 0, so_tien: 20000 }]); // không bị ghi đè
    const [b] = await q(`select them::int, ghi_de::int, giu_nguyen::int from hh_sao_chep('nhom','chuyên viên trị liệu','nhan_vien',$1,true)`, [NV.chi]);
    expect(b).toEqual({ them: 0, ghi_de: 1, giu_nguyen: 1 });
    expect(await q(`select ti_le::int, so_tien from hoa_hong_ti_le where nhan_vien_id=$1 and muc_id is null`, [NV.chi])).toEqual([{ ti_le: 30, so_tien: null }]);
    const r = await hh();
    expect(r[NV.chi]).toBe(800000); // nay Chi theo đúng cài đặt của nhóm: nhân viên + mục 40%
  });
  it("chép nhân viên → nhóm khác; nguồn trùng đích bị chặn; nguồn rỗng thì không có dòng", async () => {
    await q(`select * from hh_sao_chep('nhan_vien',$1,'nhom','bác sĩ',true)`, [NV.an]);
    expect((await q(`select count(*)::int n from hoa_hong_ti_le where nhom_chuc_danh = 'bác sĩ'`))[0]).toEqual({ n: 1 });
    await expect(q(`select * from hh_xem_truoc_sao_chep('nhom','a','nhom','A')`)).rejects.toThrow();
    expect(await q(`select * from hh_xem_truoc_sao_chep('nhom','không có','chung','')`)).toEqual([]);
  });
});
