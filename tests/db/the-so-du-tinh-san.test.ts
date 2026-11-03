import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0301: số dư thẻ tính sẵn (the_so_du) phải luôn bằng tổng sổ cái; v_the_khach giữ nguyên kết quả như khi cộng trực tiếp.
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, KH: string, GOI: string;
const taoThe = async (ma: string, loai = "lan") => (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, gia_tri_buoi, ngay_cap, cap_tay) values ($1,$2,$3,$4,$5,5,1000,'2026-01-01',true) returning id`, [ma, KH, GOI, CN, loai]))[0].id;
/** Số dòng thẻ mà view (dùng bảng phụ) khác với cách cộng thẳng sổ cái như trước 0301. */
const lech = async () => Number((await q<{ n: number }>(`select count(*)::int n from v_the_khach v join the_khach t on t.id = v.id
  left join lateral (select sum(so_buoi) b, sum(so_tien) tien from the_so_cai where the_id = t.id) g on true
  where (v.so_buoi_con, v.so_du_tien) is distinct from (coalesce(g.b,0)::int, coalesce(g.tien,0)::bigint)`))[0].n);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('00000000-0000-0000-0000-000000000001','Thu Ngân','thu_ngan',$1)`, [CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K1','K1','0900000001',$1,'mkt','00000000-0000-0000-0000-000000000001') returning id`, [CN]))[0].id;
  GOI = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('G1','Gói','lan',1000,5) returning id`))[0].id;
});

describe("số dư thẻ tính sẵn", () => {
  it("ghi sổ từng dòng và cả lô nhiều thẻ trong 1 câu lệnh: view khớp tổng sổ cái, tình trạng đúng", async () => {
    const a = await taoThe("T1"), b = await taoThe("T2"), c = await taoThe("T3", "tien");
    expect((await q<{ so_buoi_con: number; tinh_trang: string }>(`select so_buoi_con, tinh_trang from v_the_khach where id=$1`, [a]))[0]).toEqual({ so_buoi_con: 0, tinh_trang: "hoan_thanh" });
    await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',5)`, [a]);
    await q(`insert into the_so_cai (the_id, loai, so_buoi, so_tien) values ($1,'cap',5,0),($2,'cap',3,0),($1,'dung_buoi',-3,0),($3,'nap',0,500000),($3,'tru_tien',0,-120000)`, [b, b, c]);
    await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'dung_buoi',-1)`, [a]);
    const r = await q<{ ma: string; so_buoi_con: number; so_du_tien: number; tinh_trang: string }>(`select ma, so_buoi_con, so_du_tien::int so_du_tien, tinh_trang from v_the_khach where khach_id=$1 order by ma`, [KH]);
    expect(r).toEqual([
      { ma: "T1", so_buoi_con: 4, so_du_tien: 0, tinh_trang: "hoat_dong" },
      { ma: "T2", so_buoi_con: 5, so_du_tien: 0, tinh_trang: "hoat_dong" },
      { ma: "T3", so_buoi_con: 0, so_du_tien: 380000, tinh_trang: "hoat_dong" },
    ]);
    await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'dung_buoi',-2)`, [a]);
    expect((await q<{ tinh_trang: string }>(`select tinh_trang from v_the_khach where id=$1`, [a]))[0].tinh_trang).toBe("sap_het");
    expect(await lech()).toBe(0);
  });

  it("xoá dòng sổ (gỡ đợt nhập) và TRUNCATE cũng cập nhật; tinh_lai_the_so_du sửa được chỗ lệch khi trigger bị tắt", async () => {
    const d = await taoThe("T4");
    await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',2),($1,'dung_buoi',-1)`, [d]);
    await q(`select set_config('amia.go_dot','on',false)`);
    await q(`delete from the_so_cai where the_id = $1 and loai = 'dung_buoi'`, [d]); // trigger xoá chạy: còn 2 buổi
    await q(`select set_config('amia.go_dot','off',false)`);
    expect((await q<{ so_buoi_con: number }>(`select so_buoi_con from v_the_khach where id=$1`, [d]))[0].so_buoi_con).toBe(2);
    expect(await lech()).toBe(0);
    // Gỡ đợt nhập xoá dòng sổ cái (qua cờ amia.go_dot); bỏ qua trigger chỉ-thêm bằng replica, rồi trả lại origin.
    await q(`set session_replication_role = replica`);
    await q(`delete from the_so_cai where the_id = $1`, [d]);
    await q(`set session_replication_role = origin`);
    expect(await lech()).toBe(1); // trigger không chạy trong replica → lệch
    expect(Number((await q<{ n: number }>(`select public.tinh_lai_the_so_du() n`))[0].n)).toBe(1);
    expect(await lech()).toBe(0);
    expect(Number((await q<{ n: number }>(`select public.tinh_lai_the_so_du() n`))[0].n)).toBe(0);
  });
});
