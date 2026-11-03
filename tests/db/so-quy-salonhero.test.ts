import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { chuanHoaSoQuySh, napSoQuySh, tonQuyAmia } from "../../scripts/chuyen-salonhero/so-quy-sh.mjs";

// 0207/0208 + so-quy-sh.mjs (câu 16): phiếu tay SalonHero → so_quy, không số dư đầu, sửa/xoá ở SalonHero = đảo dòng (không sửa sổ cái), COD không vào quỹ.
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const NV = "00000000-0000-0000-0000-000000000009";
type Ton = Record<string, Record<string, { ton: number; tu_app: number }>>;
const ton = async (): Promise<Ton> => tonQuyAmia(db);
// dòng getCashBook SalonHero (đã rút gọn trường dùng tới)
const sh = (id: number, type: number, amount: number, o: Partial<Record<string, unknown>> = {}) => ({
  id, type, amount, location_id: 8377, createdAt: "2026-10-10T03:00:00.000Z", updatedAt: "2026-10-10T03:00:00.000Z", content: `phiếu ${id}`, owner: "", code: `C${id}`, created_by_name: "Kế toán", is_deleted: 0, ...o,
});
const cuaSo = { tu: "2026-10-01", den: "2026-10-31" };

beforeAll(async () => {
  db = await taoDbVoiMigration();
  await q(`insert into nhan_vien (id, ho_ten, vai_tro) values ($1, 'Dữ liệu SalonHero (hệ thống)', 'nhan_vien')`, [NV]);
});

describe("Sổ quỹ y SalonHero", () => {
  it("chuẩn hoá: bỏ dòng tiền khách trả (order_…), gộp chuyển quỹ hiện ở 2 sổ, Đà Lạt theo location 9202", () => {
    const p = chuanHoaSoQuySh([
      { id: "order_1", type: 1, amount: 5 }, { ...sh(10, 3, 1000), __at: "CASH" }, { ...sh(10, 3, 1000), __at: "BANK" }, sh(11, 2, 500, { location_id: 9202 }),
    ]);
    expect(p.map((x: { sh_id: number; cn: string }) => [x.sh_id, x.cn])).toEqual([[10, "VINH"], [11, "DALAT"]]);
  });

  it("nhập đủ 10 loại, chuyển quỹ = rút quỹ này + nạp quỹ kia, dòng 0 đồng bỏ qua, chạy lại không nhập trùng", async () => {
    const truoc = await ton();
    const rows = [sh(1, 1, 100), sh(2, 2, 30), sh(3, 3, 1000), sh(4, 4, 200), sh(5, 5, 7), sh(6, 6, 3), sh(7, 7, 11), sh(8, 8, 13), sh(9, 9, 17), sh(10, 10, 19), sh(11, 2, 0)];
    const b = await napSoQuySh(db, chuanHoaSoQuySh(rows), { nguoiId: NV, cuaSo });
    expect(b).toMatchObject({ moi: 10, bo_qua_0_dong: 1, nhap_dong: 10 });
    const sau = await ton();
    // tiền mặt: +100 −30 −1000 +200 −11 +17 ; ngân hàng: +1000 −200 +7 −3 −13 +19
    expect(sau.VINH.tien_mat.ton - truoc.VINH.tien_mat.ton).toBe(100 - 30 - 1000 + 200 - 11 + 17);
    expect(sau.VINH.ngan_hang.ton - truoc.VINH.ngan_hang.ton).toBe(1000 - 200 + 7 - 3 - 13 + 19);
    expect(sau.VINH.tien_mat.tu_app).toBe(0);
    const cq = await q<{ loai: string; n: number }>(`select loai, count(*)::int n from so_quy where sh_id = 3 group by 1 order by 1`);
    expect(cq).toEqual([{ loai: "nap", n: 1 }, { loai: "rut", n: 1 }]);
    const lai = await napSoQuySh(db, chuanHoaSoQuySh(rows), { nguoiId: NV, cuaSo });
    expect(lai).toMatchObject({ moi: 0, sua: 0, xoa: 0, nhap_dong: 0, dao_dong: 0 });
  });

  it("SalonHero sửa phiếu → đảo dòng cũ + ghi bản mới; xoá phiếu → đảo cùng ngày; sổ cái không bị sửa", async () => {
    const truoc = await ton();
    const rows = [sh(1, 1, 150, { updatedAt: "2026-10-12T00:00:00.000Z" }), sh(2, 2, 30), sh(4, 4, 200), sh(5, 5, 7), sh(6, 6, 3), sh(7, 7, 11), sh(8, 8, 13), sh(9, 9, 17), sh(10, 10, 19)]; // 3 (chuyển 1000) bị xoá, 1 sửa 100→150
    const b = await napSoQuySh(db, chuanHoaSoQuySh(rows), { nguoiId: NV, cuaSo });
    expect(b).toMatchObject({ sua: 1, xoa: 1, nhap_dong: 1, dao_dong: 3 });
    const sau = await ton();
    expect(sau.VINH.tien_mat.ton - truoc.VINH.tien_mat.ton).toBe(50 + 1000);
    expect(sau.VINH.ngan_hang.ton - truoc.VINH.ngan_hang.ton).toBe(-1000);
    const dao = await q<{ ngay: string }>(`select to_char(ngay,'YYYY-MM-DD') ngay from so_quy where nguon = 'dao_phieu'`);
    expect(new Set(dao.map((d) => d.ngay))).toEqual(new Set(["2026-10-10"]));
    await expect(q(`update so_quy set so_tien = 1 where sh_id = 2`)).rejects.toThrow(/chỉ được thêm dòng/);
    expect(await napSoQuySh(db, chuanHoaSoQuySh(rows), { nguoiId: NV, cuaSo })).toMatchObject({ nhap_dong: 0, dao_dong: 0 });
  });

  it("tiền khách trả bằng Ship COD không vào quỹ nào (như getTotalRevenueByCashAndBank của SalonHero)", async () => {
    const cn = (await q<{ id: string }>(`select id from chi_nhanh where ma = 'VINH'`))[0].id;
    const truoc = await ton();
    const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, trang_thai, ngay_hd, tong_hang, tong_phai_thu, da_thu, con_no, nguoi_lap_id, la_lich_su)
      values ('HDCOD', $1, 'hoan_thanh', '2026-10-10', 300, 300, 300, 0, $2, true) returning id`, [cn, NV]))[0].id;
    await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, ngay, nguoi_id, la_lich_su) values ($1,'thu','ship_cod',100,'2026-10-10',$2,true), ($1,'thu','chuyen_khoan',200,'2026-10-10',$2,true)`, [h, NV]);
    const sau = await ton();
    expect(sau.VINH.ngan_hang.ton - truoc.VINH.ngan_hang.ton).toBe(200);
    expect(sau.VINH.tien_mat.ton - truoc.VINH.tien_mat.ton).toBe(0);
  });
});
