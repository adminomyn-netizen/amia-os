import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0256: nhập từ kho hàng bán sang kho nội bộ (1 giao dịch, sổ chỉ thêm) + danh sách phiếu nhập / phiếu xuất (bc_phieu_kho).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let VINH: string, A: string, VT: string;
const so = (v: unknown) => Number(v);
const homNay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  VINH = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id, trang_thai_lam) values ($1,'Thủ kho','quan_ly',$2,'dang_lam')`, [u(1), VINH]);
  const sp = async (ma: string, ten: string, banLe: boolean, von: number | null) =>
    (await q<{ id: string }>(`insert into san_pham (ma, ten, don_vi, gia_ban, ban_le, gia_nhap_don_vi) values ($1,$2,'chai',1000,$3,$4) returning id`, [ma, ten, banLe, von]))[0].id;
  A = await sp("SPA", "Kem A", true, 300);
  VT = await sp("VT1", "Găng tay", false, 50);
  const dong = (spx: string, loai: string, sl: number, ghi: string | null, gia: number | null = null) =>
    q(`insert into kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, ghi_chu, nguoi_id) values ($1,$2,$3,$4,$5,$6,$7)`, [VINH, spx, loai, sl, gia, ghi, u(1)]);
  await dong(A, "nhap", 10, "Tồn đầu kỳ chuyển từ SalonHero");
  await dong(A, "nhap", 5, "Lịch sử SalonHero [SH-1] · nhập PN111 #1 · IM_BUY", 200);
  await dong(VT, "nhap", 4, "Lịch sử SalonHero [SH-1] · nhập PN111 #2 · IM_BUY", 50);
  await dong(A, "nhap", 2, null, 250);
  await dong(A, "tra_ncc", -1, "Lịch sử SalonHero [SH-1] · xuất PX9 #3 · EX_RETURN Xuất trả hàng NCC");
});

describe("kho_nhap_noi_bo", () => {
  it("trừ kho hàng bán, cộng kho nội bộ, cùng mã phiếu", async () => {
    const [{ ma }] = await q<{ ma: string }>(`select kho_nhap_noi_bo($1,$2,3,'dùng cho phòng','${u(1)}') ma`, [VINH, A]);
    expect(ma).toMatch(/^NB\d{6}$/);
    expect(so((await q(`select ton_kho($1,$2) t`, [VINH, A]))[0].t)).toBe(13);
    const [n] = await q(`select ton from v_ton_kho_noi_bo where chi_nhanh_id=$1 and san_pham_id=$2`, [VINH, A]);
    expect(so(n.ton)).toBe(3);
  });
  it("không cho quá tồn, không cho vật tư không bán lẻ", async () => {
    await expect(q(`select kho_nhap_noi_bo($1,$2,999,null,'${u(1)}')`, [VINH, A])).rejects.toThrow(/Kho hàng bán chỉ còn 13/);
    await expect(q(`select kho_nhap_noi_bo($1,$2,1,null,'${u(1)}')`, [VINH, VT])).rejects.toThrow(/không phải hàng bán lẻ/);
  });
  it("tiêu dùng nội bộ ghi dòng âm, chặn quá tồn, sổ không sửa được", async () => {
    await q(`select kho_tieu_dung_noi_bo($1,$2,1,'ca sáng','${u(1)}')`, [VINH, A]);
    await expect(q(`select kho_tieu_dung_noi_bo($1,$2,5,'x','${u(1)}')`, [VINH, A])).rejects.toThrow(/Kho nội bộ chỉ còn 2/);
    await expect(q(`update kho_noi_bo_so_cai set so_luong = 9`)).rejects.toThrow();
  });
});

describe("bc_phieu_kho", () => {
  it("phiếu nhập: gom theo mã PN, dòng tay là phiếu riêng, bỏ tồn đầu kỳ, tổng tiền", async () => {
    const r = await q(`select * from bc_phieu_kho('nhap', $1, $1, $2)`, [homNay(), VINH]);
    expect(r).toHaveLength(2);
    const pn = r.find((x) => x.ma === "PN111")!;
    expect([so(pn.so_mat_hang), so(pn.tong_tien), pn.phan_loai, pn.tinh_trang, pn.nguoi]).toEqual([2, 1200, "Nhập mua hàng", "Hoàn thành", "Thủ kho"]);
    expect(so(r[0].tong_dong)).toBe(2);
    expect(so(r[0].tong_tien_tat_ca)).toBe(1700);
  });
  it("phiếu xuất: gồm PX SalonHero, xuất sang kho nội bộ; lọc phân loại và tìm", async () => {
    const r = await q(`select * from bc_phieu_kho('xuat', $1, $1, $2)`, [homNay(), VINH]);
    expect(r.map((x) => x.phan_loai).sort()).toEqual(["Xuất sang kho nội bộ", "Xuất trả hàng NCC"]);
    expect(await q(`select 1 from bc_phieu_kho('xuat', $1, $1, $2, null, null, 'Xuất trả hàng NCC')`, [homNay(), VINH])).toHaveLength(1);
    expect(await q(`select 1 from bc_phieu_kho('xuat', $1, $1, $2, null, null, null, 'kem a')`, [homNay(), VINH])).toHaveLength(2);
    expect(await q(`select 1 from bc_phieu_kho('xuat', $1, $1, $2, 'Chờ duyệt')`, [homNay(), VINH])).toHaveLength(0);
  });
});

describe("bc_kho_xuat (0257)", () => {
  it("dòng xuất sang kho nội bộ vào phân loại noi_bo, mã phiếu NB…", async () => {
    const r = await q(`select * from bc_kho_xuat($1, $1, $2, 'noi_bo')`, [homNay(), VINH]);
    expect(r).toHaveLength(1);
    expect(r[0].ma_phieu).toMatch(/^NB\d{6}$/);
    expect(so(r[0].so_luong)).toBe(3);
  });
});
