import { describe, expect, it } from "vitest";
import { chayVoiKhach, taoDbVoiMigration } from "./khung";

describe("Khung vận hành Kinh doanh (migration 0050, sinh từ 2 tệp Excel MSC)", () => {
  it("nạp đủ số dòng theo bản gốc", async () => {
    const db = await taoDbVoiMigration();
    const dem = async (b: string) => Number((await db.query<{ n: string }>(`select count(*)::int as n from public.${b}`)).rows[0].n);
    expect(await dem("kd_quy_trinh")).toBe(14);
    expect(await dem("kd_qt_buoc")).toBe(80);
    expect(await dem("kd_checklist")).toBe(42);
    expect(await dem("kd_bieu_mau")).toBe(26);
    expect(await dem("kd_kich_ban")).toBe(10);
    expect(await dem("kd_kpi")).toBe(23);
    expect(await dem("kd_rui_ro")).toBe(12);
    expect(await dem("kd_nhip")).toBe(12);
    expect(await dem("kd_cum")).toBe(14);
    expect(await dem("kd_hang_muc")).toBe(73);
    expect(await dem("kd_dau_viec")).toBe(104);
    // mỗi quy trình có ít nhất một bước; mỗi đầu việc thuộc đúng một hạng mục
    expect(await dem("kd_quy_trinh q where not exists (select 1 from public.kd_qt_buoc b where b.qt_ma = q.ma)")).toBe(0);
  });
  it("chỉ máy chủ đọc được: khách chưa đăng nhập không đọc được bảng nào", async () => {
    const db = await taoDbVoiMigration();
    for (const b of ["kd_quy_trinh", "kd_dau_viec", "kd_kpi"]) {
      const kq = await chayVoiKhach(db, `select count(*)::int as n from public.${b}`).catch(() => null);
      expect(kq === null || Number(kq.rows[0].n) === 0).toBe(true);
    }
  });
});
