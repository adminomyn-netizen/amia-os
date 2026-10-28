import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration, chayVoiTu } from "./khung";

// 0101: hẹn buổi kế tiếp khi trừ buổi thẻ. Hẹn chỉ GHI THÊM, không đổi số buổi/tiền của thẻ.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, KH: string, THE: string, DV: string, BUOI: string;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Tư Vấn','tu_van',$1)`, [CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K1','K1','0900000001',$1,'mkt','${u(1)}') returning id`, [CN]))[0].id;
  const goi = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('G1','Triệt lông','lan',1000,5) returning id`))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('DV1',$1,'Laser',500000) returning id`, [nhom]))[0].id;
  THE = (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, ngay_cap, cap_tay) values ('T1',$1,$2,$3,'lan',5, hom_nay(), true) returning id`, [KH, goi, CN]))[0].id;
  await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',5)`, [THE]);
  BUOI = (await q<{ thuc_hien_buoi: string }>(`select thuc_hien_buoi($1,$2,'${u(1)}',null,null,hom_nay(),'{}'::jsonb,null,'${u(1)}')`, [THE, DV]))[0].thuc_hien_buoi;
});

const con = async () => Number((await q<{ s: string }>(`select coalesce(sum(so_buoi),0) s from the_so_cai where the_id = $1`, [THE]))[0].s);

describe("the_buoi_ke_tiep", () => {
  it("ghi hẹn buổi kế tiếp + nhắc, số buổi còn lại của thẻ không đổi", async () => {
    expect(await con()).toBe(4);                                  // 5 buổi, đã trừ 1
    const nhac = (await q<{ id: string }>(`insert into khach_nhac (khach_id, noi_dung, trang_thai, ngay_nhac) values ($1,'Hẹn buổi kế tiếp','dang_nhac', (hom_nay() + 14)::timestamp at time zone 'Asia/Ho_Chi_Minh' + interval '8 hours') returning id`, [KH]))[0].id;
    await q(`insert into the_buoi_ke_tiep (the_id, khach_id, buoi_id, ngay_hen, noi_dung, chi_nhanh_id, nhac_id, nguoi_id) values ($1,$2,$3, hom_nay() + 14, 'Làm vùng cổ', $4, $5, '${u(1)}')`, [THE, KH, BUOI, CN, nhac]);
    expect(await con()).toBe(4);
    expect(Number((await q<{ n: string }>(`select count(*) n from the_buoi_ke_tiep where the_id = $1`, [THE]))[0].n)).toBe(1);
  });
  it("mỗi buổi tối đa 1 hẹn; hẹn không buổi (từ hồ sơ thẻ) thì ghi nhiều được", async () => {
    await expect(q(`insert into the_buoi_ke_tiep (the_id, khach_id, buoi_id, ngay_hen) values ($1,$2,$3, hom_nay() + 20)`, [THE, KH, BUOI])).rejects.toThrow();
    await q(`insert into the_buoi_ke_tiep (the_id, khach_id, ngay_hen) values ($1,$2, hom_nay() + 20)`, [THE, KH]);
    await q(`insert into the_buoi_ke_tiep (the_id, khach_id, ngay_hen) values ($1,$2, hom_nay() + 21)`, [THE, KH]);
  });
  it("sổ chỉ-thêm; nội dung ≤ 300 ký tự; người đăng nhập không đọc/ghi được", async () => {
    await expect(q(`update the_buoi_ke_tiep set noi_dung = 'x'`)).rejects.toThrow(/chỉ được thêm dòng/);
    await expect(q(`delete from the_buoi_ke_tiep`)).rejects.toThrow(/chỉ được thêm dòng/);
    await expect(q(`insert into the_buoi_ke_tiep (the_id, khach_id, ngay_hen, noi_dung) values ($1,$2, hom_nay() + 1, $3)`, [THE, KH, "x".repeat(301)])).rejects.toThrow();
    await expect(chayVoiTu(db, { sub: u(1) }, `insert into the_buoi_ke_tiep (the_id, khach_id, ngay_hen) values ('${THE}','${KH}', current_date)`)).rejects.toThrow();
    const r = await chayVoiTu(db, { sub: u(1) }, `select count(*)::int n from the_buoi_ke_tiep`).catch(() => ({ rows: [{ n: -1 }] }));
    expect([0, -1]).toContain((r.rows[0] as { n: number }).n);
  });
});
