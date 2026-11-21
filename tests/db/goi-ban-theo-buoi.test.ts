import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0344: gói bán theo buổi (EXION vùng mặt): SL = số buổi → 1 thẻ SL buổi; gói thường vẫn mỗi đơn vị 1 thẻ.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const TN = u(1);
let db: PGlite, CN: string, KH: string, EXION: string, THUONG: string;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;

async function ban(goi: string, ten: string, sl: number, gia: number, giam: number) {
  const hd = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'), $1,$2,$3) returning id`, [CN, KH, TN]))[0].id;
  const d = (await q<{ id: string }>(`insert into hoa_don_dong (hoa_don_id, loai, goi_id, ten, so_luong, don_gia, giam_gia) values ($1,'goi_the',$2,$3,$4,$5,$6) returning id`, [hd, goi, ten, sl, gia, giam]))[0].id;
  await q(`insert into dong_nhan_vien (dong_id, nhan_vien_id, vai, ti_le) values ($1,$2,'ban',100)`, [d, TN]);
  await q(`select chot_hoa_don($1,$2)`, [hd, TN]);
  return q<{ so_buoi_tong: number; gia_tri_buoi: string }>(`select so_buoi_tong, gia_tri_buoi::text from the_khach where hoa_don_dong_id=$1 order by ma`, [d]);
}

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${TN}','Thu Ngân','thu_ngan',$1)`, [CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, TN]))[0].id;
  EXION = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi, ban_theo_buoi) values ('EX','EXION Full Face','lan',9000000,2,true) returning id`))[0].id;
  THUONG = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('TH','Gói thường 2 buổi','lan',2000000,2) returning id`))[0].id;
});

describe("chot_hoa_don gói bán theo buổi", () => {
  it("SL 4 EXION → 1 thẻ 4 buổi, giá buổi = thành tiền / 4; sổ cái cấp 4", async () => {
    const t = await ban(EXION, "EXION Full Face", 4, 9_000_000, 12_000_000);
    expect(t.map((x) => [x.so_buoi_tong, x.gia_tri_buoi])).toEqual([[4, "6000000"]]);
    const c = await q<{ s: string }>(`select sum(so_buoi)::text s from the_so_cai where the_id=(select id from the_khach order by ma desc limit 1)`);
    expect(c[0].s).toBe("4");
  });
  it("gói thường SL 2 vẫn 2 thẻ x 2 buổi", async () => {
    const t = await ban(THUONG, "Gói thường", 2, 2_000_000, 0);
    expect(t.map((x) => x.so_buoi_tong)).toEqual([2, 2]);
  });
});
