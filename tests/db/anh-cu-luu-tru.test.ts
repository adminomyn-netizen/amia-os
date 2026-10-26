/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

let db: PGlite;
let khach: string;
const q = async (sql: string, p: unknown[] = []) => (await db.query<any>(sql, p)).rows;
const loiMa = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); return null; } catch (e: any) { return e.code as string; } };

beforeAll(async () => {
  db = await taoDbVoiMigration();
  const cn = (await q(`select id from chi_nhanh limit 1`))[0].id;
  const nv = (await q(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Tư vấn thử', 'tu_van', $1) returning id`, [cn]))[0].id;
  khach = (await q(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguoi_phu_trach_id, nguon) values ('KH-LT', 'Khách thử', '0900000077', $1, $2, 'khac') returning id`, [cn, nv]))[0].id;
});

describe("ảnh cũ ở kho lưu trữ: hàng đợi lấy ảnh về xem tạm", () => {
  it("mỗi khách chỉ có MỘT yêu cầu đang chạy; xong rồi thì tạo yêu cầu mới được", async () => {
    await q(`insert into yeu_cau_lay_anh (khach_id) values ($1)`, [khach]);
    expect(await loiMa(`insert into yeu_cau_lay_anh (khach_id) values ($1)`, [khach])).toBe("23505");
    await q(`update yeu_cau_lay_anh set trang_thai = 'dang_lay' where khach_id = $1`, [khach]);
    expect(await loiMa(`insert into yeu_cau_lay_anh (khach_id) values ($1)`, [khach])).toBe("23505");
    await q(`update yeu_cau_lay_anh set trang_thai = 'xong', so_anh_lay = 12 where khach_id = $1`, [khach]);
    expect(await loiMa(`insert into yeu_cau_lay_anh (khach_id) values ($1)`, [khach])).toBeNull();
  });

  it("trạng thái ngoài danh sách bị từ chối; số ảnh âm bị từ chối", async () => {
    expect(await loiMa(`update yeu_cau_lay_anh set trang_thai = 'la' where khach_id = $1`, [khach])).toBe("23514");
    expect(await loiMa(`insert into khach_anh_luu_tru (khach_id, so_anh) values ($1, -1)`, [khach])).toBe("23514");
  });

  it("ảnh tạm có hạn dùng (het_han); ảnh vĩnh viễn để trống", async () => {
    await q(`insert into khach_anh (khach_id, duong_dan, het_han) values ($1, 'a/vinh-vien.jpg', null), ($1, 'a/tam.jpg', now() + interval '3 days')`, [khach]);
    const r = await q(`select duong_dan from khach_anh where khach_id = $1 and het_han is not null`, [khach]);
    expect(r.map((x) => x.duong_dan)).toEqual(["a/tam.jpg"]);
  });

  it("xoá khách thì dọn luôn bản đếm và yêu cầu (không để rác)", async () => {
    await q(`insert into khach_anh_luu_tru (khach_id, so_anh) values ($1, 40)`, [khach]);
    await q(`delete from khach_anh where khach_id = $1`, [khach]);
    await q(`delete from khach_hang where id = $1`, [khach]);
    expect((await q(`select count(*)::int n from khach_anh_luu_tru where khach_id = $1`, [khach]))[0].n).toBe(0);
    expect((await q(`select count(*)::int n from yeu_cau_lay_anh where khach_id = $1`, [khach]))[0].n).toBe(0);
  });
});
