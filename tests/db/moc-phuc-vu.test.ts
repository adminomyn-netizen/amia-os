import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0319: tự ghi mốc bắt đầu làm / hoàn thành khi lịch đổi trạng thái (chuông quá giờ + báo cáo Thời gian dịch vụ).
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, KH: string;
type Moc = { bat_dau_lam_luc: string | null; hoan_thanh_luc: string | null };
const taoLich = async (lichSu = false) =>
  (await q<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, la_lich_su) values ($1,$2,now(),now() + interval '1 hour','cho_phuc_vu',$3) returning id`, [KH, CN, lichSu]))[0].id;
const doi = async (id: string, tt: string, them = "") => (await q<Moc>(`update lich_hen set trang_thai = '${tt}'${them} where id = $1 returning bat_dau_lam_luc, hoan_thanh_luc`, [id]))[0];
const iso = (v: string | null) => (v ? new Date(v).toISOString() : null);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  const NV = (await q<{ id: string }>(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Lễ Tân','le_tan',$1) returning id`, [CN]))[0].id;
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K1','Khách thử','0900000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
});

describe("mốc phục vụ lịch hẹn", () => {
  it("mở ca ghi giờ bắt đầu, hoàn thành ghi giờ xong", async () => {
    const id = await taoLich();
    const a = await doi(id, "dang_phuc_vu");
    expect(a.bat_dau_lam_luc).not.toBeNull();
    expect(a.hoan_thanh_luc).toBeNull();
    const b = await doi(id, "hoan_thanh");
    expect(iso(b.bat_dau_lam_luc)).toBe(iso(a.bat_dau_lam_luc));
    expect(b.hoan_thanh_luc).not.toBeNull();
  });
  it("bấm nhầm mở ca rồi quay lại chờ: bỏ mốc bắt đầu", async () => {
    const id = await taoLich();
    await doi(id, "dang_phuc_vu");
    expect((await doi(id, "cho_phuc_vu")).bat_dau_lam_luc).toBeNull();
  });
  it("câu lệnh tự đặt mốc thì giữ nguyên; sửa cột khác không đụng mốc", async () => {
    const id = await taoLich();
    const a = await doi(id, "dang_phuc_vu", `, bat_dau_lam_luc = '2026-11-10T07:00:00Z'`);
    expect(iso(a.bat_dau_lam_luc)).toBe("2026-11-10T07:00:00.000Z");
    const b = (await q<Moc>(`update lich_hen set ghi_chu = 'x' where id = $1 returning bat_dau_lam_luc, hoan_thanh_luc`, [id]))[0];
    expect(iso(b.bat_dau_lam_luc)).toBe("2026-11-10T07:00:00.000Z");
  });
  it("lịch lịch sử SalonHero không bị ghi mốc", async () => {
    const id = await taoLich(true);
    expect((await doi(id, "dang_phuc_vu")).bat_dau_lam_luc).toBeNull();
    expect((await doi(id, "hoan_thanh")).hoan_thanh_luc).toBeNull();
  });
});
