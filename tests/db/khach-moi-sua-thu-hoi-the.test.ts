import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0202: cờ "Khách mới" gắn 1 lần lúc tạo lịch (câu 15); Sửa thẻ + Thu hồi thẻ ghi sổ cái thẻ, không đổi số dư (câu 8, 9).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, CN2: string, KH: string, KH2: string, KH3: string, THE: string;
const taoKhach = async (ma: string, cn: string) => (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ($1,$1,$2,$3,'mkt','${u(1)}') returning id`, [ma, `09000${ma.padStart(5, "0")}`, cn]))[0].id;
const taoLich = async (kh: string, ngay = "2026-11-10") => (await q<{ id: string; khach_moi: boolean }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,$3::timestamptz,$3::timestamptz + interval '1 hour') returning id, khach_moi`, [kh, CN, `${ngay}T09:00:00+07`]))[0];
const so = async () => (await q<{ b: string; t: string }>(`select coalesce(sum(so_buoi),0) b, coalesce(sum(so_tien),0) t from the_so_cai where the_id = $1`, [THE]))[0];

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  CN2 = (await q<{ id: string }>(`select id from chi_nhanh where ma<>'VINH' limit 1`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Thu Ngân','thu_ngan',$1)`, [CN]);
  KH = await taoKhach("1", CN); KH2 = await taoKhach("2", CN); KH3 = await taoKhach("3", CN2);
  const goi = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('G1','Triệt lông','lan',1000,5) returning id`))[0].id;
  THE = (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, gia_tri_buoi, ngay_cap, cap_tay) values ('T1',$1,$2,$3,'lan',5,200000,'2026-01-01',true) returning id`, [KH, goi, CN]))[0].id;
  await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',5)`, [THE]);
});

describe("khách mới trên lịch hẹn (gắn lúc tạo, không tính lại)", () => {
  it("lịch đầu tiên của khách = mới; lịch thứ hai = quay lại; sửa lịch không đổi cờ", async () => {
    const a = await taoLich(KH);
    expect(a.khach_moi).toBe(true);
    const b = await taoLich(KH, "2026-11-12");
    expect(b.khach_moi).toBe(false);
    await q(`update lich_hen set ghi_chu = 'sửa' where id = $1`, [a.id]);
    expect((await q<{ khach_moi: boolean }>(`select khach_moi from lich_hen where id = $1`, [a.id]))[0].khach_moi).toBe(true);
  });
  it("khách chưa có lịch nhưng đã có hoá đơn hoàn thành = quay lại; cờ chèn sẵn được giữ", async () => {
    await q(`insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, nguoi_lap_id) values ('HD-T1',$1,$2,'hoan_thanh','${u(1)}')`, [CN, KH2]);
    expect((await taoLich(KH2)).khach_moi).toBe(false);
    const r = await q<{ khach_moi: boolean }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, khach_moi) values ($1,$2,now(),now() + interval '1 hour', true) returning khach_moi`, [KH2, CN]);
    expect(r[0].khach_moi).toBe(true);
  });
});

describe("Sửa thẻ / Thu hồi thẻ", () => {
  it("sửa hạn, giá 1 buổi, chủ thẻ: ghi 1 dòng sua_the (0, 0), số buổi không đổi", async () => {
    await q(`select sua_the($1, '${u(1)}', p_doi_han => true, p_han => '2027-06-30', p_doi_gia => true, p_gia => 250000, p_doi_chu => true, p_khach => $2)`, [THE, KH2]);
    const t = (await q<{ han_dung: unknown; gia_tri_buoi: string; khach_id: string }>(`select han_dung, gia_tri_buoi, khach_id from the_khach where id = $1`, [THE]))[0];
    expect(Number(t.gia_tri_buoi)).toBe(250000);
    expect(t.khach_id).toBe(KH2);
    const dong = await q<{ ghi_chu: string; so_buoi: number }>(`select ghi_chu, so_buoi from the_so_cai where the_id = $1 and loai = 'sua_the'`, [THE]);
    expect(dong).toHaveLength(1);
    expect(dong[0].ghi_chu).toMatch(/Hạn: không hạn → 30\/06\/2027/);
    expect(dong[0].ghi_chu).toMatch(/Giá 1 buổi: 200,000 → 250,000|Giá 1 buổi: 200\.000 → 250\.000/);
    expect(Number((await so()).b)).toBe(5);
  });
  it("chặn: không đổi gì, chủ thẻ khác chi nhánh, hạn trước ngày cấp; dòng sua_the có số bị chặn", async () => {
    await expect(q(`select sua_the($1, '${u(1)}', p_doi_han => true, p_han => '2027-06-30')`, [THE])).rejects.toThrow(/Chưa có gì thay đổi/);
    await expect(q(`select sua_the($1, '${u(1)}', p_doi_chu => true, p_khach => $2)`, [THE, KH3])).rejects.toThrow(/cùng chi nhánh/);
    await expect(q(`select sua_the($1, '${u(1)}', p_doi_han => true, p_han => '2025-01-01')`, [THE])).rejects.toThrow(/trước ngày cấp/);
    await expect(q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'sua_the',1)`, [THE])).rejects.toThrow();
  });
  it("xoá hạn → không hạn", async () => {
    await q(`select sua_the($1, '${u(1)}', p_doi_han => true, p_han => null)`, [THE]);
    expect((await q<{ han_dung: unknown }>(`select han_dung from the_khach where id = $1`, [THE]))[0].han_dung).toBeNull();
  });
  it("thu hồi: bắt lý do, khoá vĩnh viễn, không hoàn tiền (số dư giữ nguyên), không thu hồi/sửa lại được", async () => {
    await expect(q(`select thu_hoi_the($1, ' ', '${u(1)}')`, [THE])).rejects.toThrow(/lý do/);
    await q(`select thu_hoi_the($1, 'Khách chuyển nhượng sai', '${u(1)}')`, [THE]);
    expect((await q<{ tinh_trang: string }>(`select tinh_trang from v_the_khach where id = $1`, [THE]))[0].tinh_trang).toBe("thu_hoi");
    expect(Number((await so()).b)).toBe(5);
    await expect(q(`select thu_hoi_the($1, 'lần hai', '${u(1)}')`, [THE])).rejects.toThrow(/đã thu hồi/);
    await expect(q(`select sua_the($1, '${u(1)}', p_doi_gia => true, p_gia => 1)`, [THE])).rejects.toThrow(/đã thu hồi/);
  });
});
