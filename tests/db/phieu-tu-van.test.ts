import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0105: phiếu tư vấn theo phễu (đặt vấn đề → phân tích → chứng minh → kết quả), nhu cầu phát sinh, báo cáo tỉ lệ chốt.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, KH: string;
const NV = u(1), TV1 = u(2), TV2 = u(3);
const them = (tvv: string, kq: string, gia: number, ngay = "2026-10-10", lyDo: string | null = null) =>
  q<{ id: string }>(`insert into phieu_tu_van (ma, khach_id, tu_van_vien_id, ngay_tu_van, ket_qua, bao_gia, ly_do_khong_chot, nguoi_ghi_id, chi_nhanh_id)
    values ('TV'||lpad(so_tiep_theo('tv')::text,6,'0'),$1,$2,$3,$4,$5,$6,$7,$8) returning id`, [KH, tvv, ngay, kq, gia, lyDo, NV, CN]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  for (const [id, ten] of [[NV, "Lễ tân"], [TV1, "Tư vấn A"], [TV2, "Tư vấn B"]]) await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,$2,'tu_van',$3)`, [id, ten, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
});

describe("phiếu tư vấn", () => {
  it("không chốt thì bắt buộc có lý do; chốt/chờ chốt không cần", async () => {
    expect(await loi(`insert into phieu_tu_van (ma, khach_id, tu_van_vien_id, ket_qua) values ('TVX1',$1,$2,'khong_chot')`, [KH, TV1])).toMatch(/phieu_tu_van_khong_chot_can_ly_do/);
    expect(await loi(`insert into phieu_tu_van (ma, khach_id, tu_van_vien_id, ket_qua, ly_do_khong_chot) values ('TVX2',$1,$2,'khong_chot','   ')`, [KH, TV1])).toMatch(/phieu_tu_van_khong_chot_can_ly_do/);
    expect(await loi(`insert into phieu_tu_van (ma, khach_id, tu_van_vien_id, ket_qua, bao_gia) values ('TVX3',$1,$2,'chot',-1)`, [KH, TV1])).toMatch(/bao_gia/);
    await q(`insert into phieu_tu_van (ma, khach_id, tu_van_vien_id, ket_qua, ly_do_khong_chot, ngay_tu_van) values ('TVX4',$1,$2,'khong_chot','Chê giá','2026-09-01')`, [KH, TV1]);
    // chi nhánh tự lấy theo khách khi để trống
    expect((await q<{ chi_nhanh_id: string }>(`select chi_nhanh_id from phieu_tu_van where ma='TVX4'`))[0].chi_nhanh_id).toBe(CN);
  });
  it("sửa có nhật ký cũ → mới, không đổi khách, không xoá", async () => {
    const [{ id }] = await them(TV1, "cho_chot", 5_000_000, "2026-10-11");
    await q(`update phieu_tu_van set ket_qua='chot', bao_gia=4500000, nguoi_ghi_id=$2 where id=$1`, [id, NV]);
    const nk = await q<{ hanh_dong: string; chi_tiet: { truoc: { ket_qua: string } | null; sau: { ket_qua: string; bao_gia: number } } }>(`select hanh_dong, chi_tiet from nhat_ky_truy_cap where doi_tuong='phieu_tu_van' and doi_tuong_id=$1 order by id`, [id]);
    expect(nk.map((x) => x.hanh_dong)).toEqual(["ghi_phieu_tu_van", "sua_phieu_tu_van"]);
    expect(nk[1].chi_tiet.truoc?.ket_qua).toBe("cho_chot");
    expect(nk[1].chi_tiet.sau).toMatchObject({ ket_qua: "chot", bao_gia: 4500000 });
    const kh2 = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH2','Khác','0900000002',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
    expect(await loi(`update phieu_tu_van set khach_id=$2 where id=$1`, [id, kh2])).toMatch(/Không đổi khách/);
    expect(await loi(`delete from phieu_tu_van where id=$1`, [id])).toMatch(/chỉ được thêm dòng/);
  });
  it("nhu cầu phát sinh chỉ thêm, có nhật ký, không sửa/xoá", async () => {
    const [{ id }] = await them(TV1, "cho_chot", 0, "2026-10-12");
    const n = (await q<{ id: string }>(`insert into phieu_tu_van_nhu_cau (phieu_id, noi_dung, nguoi_ghi_id) values ($1,'Muốn thêm triệt nách',$2) returning id`, [id, NV]))[0].id;
    expect(await loi(`insert into phieu_tu_van_nhu_cau (phieu_id, noi_dung) values ($1,'   ')`, [id])).toMatch(/noi_dung_check/);
    expect(await loi(`update phieu_tu_van_nhu_cau set noi_dung='x' where id=$1`, [n])).toMatch(/chỉ được thêm dòng/);
    expect(await loi(`delete from phieu_tu_van_nhu_cau where id=$1`, [n])).toMatch(/chỉ được thêm dòng/);
    expect((await q<{ n: number }>(`select count(*)::int n from nhat_ky_truy_cap where hanh_dong='them_nhu_cau_tu_van' and doi_tuong_id=$1`, [id]))[0].n).toBe(1);
  });
});

describe("báo cáo tỉ lệ chốt", () => {
  it("đếm đúng theo tư vấn viên, khoảng ngày, chi nhánh; giá trị chốt chỉ cộng phiếu chốt", async () => {
    await them(TV2, "chot", 10_000_000, "2026-12-01");
    await them(TV2, "chot", 2_000_000, "2026-12-02");
    await them(TV2, "khong_chot", 3_000_000, "2026-12-03", "Cần hỏi chồng");
    await them(TV2, "cho_chot", 1_000_000, "2026-12-04");
    await them(TV1, "khong_chot", 9_000_000, "2026-12-05", "Chê giá");
    await them(TV2, "chot", 7_000_000, "2027-01-02");   // ngoài khoảng
    const r = await q<{ tu_van_vien_id: string; so_phieu: string; cho_chot: string; chot: string; khong_chot: string; tong_bao_gia_chot: string; tong_bao_gia: string }>(`select * from bc_ti_le_chot('2026-12-01','2026-12-31',$1)`, [CN]);
    const b = r.find((x) => x.tu_van_vien_id === TV2)!, a = r.find((x) => x.tu_van_vien_id === TV1)!;
    expect([b.so_phieu, b.chot, b.khong_chot, b.cho_chot, b.tong_bao_gia_chot, b.tong_bao_gia].map(Number)).toEqual([4, 2, 1, 1, 12_000_000, 16_000_000]);
    expect([a.so_phieu, a.chot, a.khong_chot, a.tong_bao_gia_chot].map(Number)).toEqual([1, 0, 1, 0]);
    expect((await q(`select * from bc_ti_le_chot('2026-12-01','2026-12-31','${u(999)}')`)).length).toBe(0);
  });
});
