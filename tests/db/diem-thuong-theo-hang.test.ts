import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { diemRaTien, diemTichDuoc, type CauHinhHang } from "../../src/lib/diem-hang";

// 0088: cấu hình điểm thưởng theo hạng + hàm DB; hàm DB và hàm TS phải cho cùng kết quả.
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
beforeAll(async () => { db = await taoDbVoiMigration(); });

describe("điểm thưởng theo hạng khách", () => {
  it("có đủ 5 hạng, mặc định ~100.000đ = 1 điểm, 1 điểm = 10.000đ", async () => {
    const r = await q<{ hang: string; tien_moi_diem: string; tien_doi_moi_diem: string }>(`select c.hang, c.tien_moi_diem, c.tien_doi_moi_diem from hang_diem_cau_hinh c join hang_khach h on h.ten = c.hang order by h.thu_tu`);
    expect(r.map((x) => x.hang)).toEqual(["Thường", "Bạc", "Vàng", "Bạch kim", "Kim cương"]);
    expect(r.every((x) => Number(x.tien_moi_diem) === 100000 && Number(x.tien_doi_moi_diem) === 10000)).toBe(true);
  });
  it("hàm DB: làm tròn xuống, theo hạng, hạng lạ / số âm = 0", async () => {
    await q(`update hang_diem_cau_hinh set tien_moi_diem = 50000, tien_doi_moi_diem = 20000 where hang = 'Kim cương'`);
    const f = async (sql: string) => Number((await q<{ v: string }>(`select ${sql} as v`))[0].v);
    expect(await f(`diem_tich_duoc('Thường', 360000)`)).toBe(3);
    expect(await f(`diem_tich_duoc('Kim cương', 360000)`)).toBe(7);
    expect(await f(`diem_tich_duoc('Thường', 99999)`)).toBe(0);
    expect(await f(`diem_tich_duoc('Không có', 1000000)`)).toBe(0);
    expect(await f(`diem_tich_duoc('Thường', -1)`)).toBe(0);
    expect(await f(`diem_ra_tien('Kim cương', 15)`)).toBe(300000);
    expect(await f(`diem_ra_tien('Thường', 15)`)).toBe(150000);
    expect(await f(`diem_ra_tien('Thường', 0)`)).toBe(0);
  });
  it("hàm TS cho cùng kết quả với hàm DB", async () => {
    const ch = (await q<{ hang: string; tien_moi_diem: string; tien_doi_moi_diem: string }>(`select hang, tien_moi_diem, tien_doi_moi_diem from hang_diem_cau_hinh`)).map((r): CauHinhHang => ({ hang: r.hang, tienMoiDiem: Number(r.tien_moi_diem), tienDoiMoiDiem: Number(r.tien_doi_moi_diem) }));
    for (const hang of ["Thường", "Bạc", "Vàng", "Bạch kim", "Kim cương"]) for (const tien of [0, 99999, 100000, 360000, 29900000]) {
      expect(Number((await q<{ v: string }>(`select diem_tich_duoc($1,$2) v`, [hang, tien]))[0].v)).toBe(diemTichDuoc(ch, hang, tien));
      expect(Number((await q<{ v: string }>(`select diem_ra_tien($1,$2) v`, [hang, Math.floor(tien / 1000)]))[0].v)).toBe(diemRaTien(ch, hang, Math.floor(tien / 1000)));
    }
  });
  it("điểm dự kiến của hoá đơn theo hạng hiện tại của khách; không đụng sổ điểm", async () => {
    const cn = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
    const nv = (await q<{ id: string }>(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('TN','thu_ngan',$1) returning id`, [cn]))[0].id;
    const kh = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K1','Khách','0900000001',$1,'mkt',$2) returning id`, [cn, nv]))[0].id;
    const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su) values ('H',$1,$2,'hoan_thanh','2026-10-01',360000,360000,360000,0,$3,true) returning id`, [cn, kh, nv]))[0].id;
    const [r] = await q<{ hang: string; so_tien: string; diem: number }>(`select * from diem_du_kien_hoa_don($1)`, [h]);
    expect(r.hang).toBe("Thường");
    expect(Number(r.so_tien)).toBe(360000);
    expect(r.diem).toBe(3);
    expect(Number((await q<{ n: string }>(`select count(*) n from khach_diem_so`))[0].n)).toBe(0);
  });
  it("bảng có ràng buộc: hạng phải có trong hang_khach, số tiền hợp lệ", async () => {
    await expect(q(`insert into hang_diem_cau_hinh (hang, tien_moi_diem, tien_doi_moi_diem) values ('Hạng lạ', 100000, 10000)`)).rejects.toThrow();
    await expect(q(`update hang_diem_cau_hinh set tien_moi_diem = 0 where hang = 'Thường'`)).rejects.toThrow();
  });
});
