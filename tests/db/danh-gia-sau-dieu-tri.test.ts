import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// 0106: đánh giá sau điều trị Hài lòng / Không hài lòng; không hài lòng tự tạo khiếu nại, nối hai chiều, một lần cho mỗi lần điều trị.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, KH: string, DV: string;
const NV = u(1);
type KQ = { r_danh_gia_id: string; r_khieu_nai_id: string | null; r_khieu_nai_moi: boolean; r_chi_nhanh_id: string };
const ghi = (hd: string | null, lich: string | null, kq: string, ly: string | null, gc: string | null = null) =>
  q<KQ>(`select * from ghi_danh_gia_sau_dieu_tri($1,$2,$3,$4,$5,$6)`, [hd, lich, kq, ly, gc, NV]);

async function taoDon(chot: boolean, lich: string | null = null, loai: "dich_vu" | "san_pham" = "dich_vu") {
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id, lich_hen_id) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'),$1,$2,$3,$4) returning id`, [CN, KH, NV, lich]))[0].id;
  if (loai === "dich_vu") await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, ten, so_luong, don_gia) values ($1,'dich_vu',$2,'Peel',1,1000000)`, [h, DV]);
  else {
    const sp = (await q<{ id: string }>(`select id from san_pham limit 1`))[0]?.id;
    if (sp) await q(`insert into hoa_don_dong (hoa_don_id, loai, san_pham_id, ten, so_luong, don_gia) values ($1,'san_pham',$2,'Kem',1,100000)`, [h, sp]);
  }
  if (chot) {
    await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, nguoi_id) values ($1,'thu','tien_mat',(select tong_phai_thu from hoa_don where id=$1),$2)`, [h, NV]).catch(() => {});
    await q(`select chot_hoa_don($1,$2)`, [h, NV]);
  }
  return h;
}
const taoLich = async (tt: string) => (await q<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2,'2026-10-20 03:00+00','2026-10-20 04:00+00',$3) returning id`, [KH, CN, tt]))[0].id;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Thu Ngân','thu_ngan',$2)`, [NV, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Khách','0900000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL01',$1,'Peel',1000000) returning id`, [nhom]))[0].id;
});

describe("đánh giá sau điều trị: điều kiện", () => {
  it("chỉ hoá đơn hoàn thành có dịch vụ; chỉ lịch hoàn thành; cần chọn đúng một đối tượng", async () => {
    const nhap = await taoDon(false);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri($1,null,'hai_long',null,null,$2)`, [nhap, NV])).toMatch(/hoá đơn đã hoàn thành/);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri(null,$1,'hai_long',null,null,$2)`, [await taoLich("da_xac_nhan"), NV])).toMatch(/lịch hẹn đã hoàn thành/);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri(null,null,'hai_long',null,null,$1)`, [NV])).toMatch(/một hoá đơn hoặc một lịch/);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri($1,$2,'hai_long',null,null,$3)`, [nhap, u(5), NV])).toMatch(/một hoá đơn hoặc một lịch/);
    const h = await taoDon(true);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri($1,null,'meh',null,null,$2)`, [h, NV])).toMatch(/ket_qua_check/);
  });
  it("không hài lòng bắt buộc có lý do trong danh sách", async () => {
    const h = await taoDon(true);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri($1,null,'khong_hai_long',null,null,$2)`, [h, NV])).toMatch(/lý do/);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri($1,null,'khong_hai_long','y_khoa',null,$2)`, [h, NV])).toMatch(/ly_do_check/);
  });
});

describe("đánh giá sau điều trị: hài lòng, sửa, nhật ký", () => {
  it("hài lòng không tạo khiếu nại; sửa có nhật ký cũ → mới; không xoá; không đổi đối tượng", async () => {
    const h = await taoDon(true);
    const [a] = await ghi(h, null, "hai_long", "gia", "Cảm ơn");
    expect(a.r_khieu_nai_id).toBeNull();
    expect((await q<{ ly_do: string | null }>(`select ly_do from danh_gia_sau_dieu_tri where id=$1`, [a.r_danh_gia_id]))[0].ly_do).toBeNull();
    const [b] = await ghi(h, null, "hai_long", null, "Rất tốt");
    expect(b.r_danh_gia_id).toBe(a.r_danh_gia_id);
    const nk = await q<{ hanh_dong: string; chi_tiet: { truoc: { ghi_chu: string } | null; sau: { ghi_chu: string } } }>(`select hanh_dong, chi_tiet from nhat_ky_truy_cap where doi_tuong='danh_gia_sau_dieu_tri' and doi_tuong_id=$1 order by id`, [a.r_danh_gia_id]);
    expect(nk.map((x) => x.hanh_dong)).toEqual(["ghi_danh_gia_sau_dt", "sua_danh_gia_sau_dt"]);
    expect(nk[1].chi_tiet.truoc?.ghi_chu).toBe("Cảm ơn"); expect(nk[1].chi_tiet.sau.ghi_chu).toBe("Rất tốt");
    expect(await loi(`delete from danh_gia_sau_dieu_tri where id=$1`, [a.r_danh_gia_id])).toMatch(/chỉ được thêm dòng/);
    expect(await loi(`update danh_gia_sau_dieu_tri set hoa_don_id=$2 where id=$1`, [a.r_danh_gia_id, await taoDon(true)])).toMatch(/Không đổi lần điều trị/);
    // ghi lại y nguyên thì không thêm dòng nhật ký
    await ghi(h, null, "hai_long", null, "Rất tốt");
    expect((await q<{ n: number }>(`select count(*)::int n from nhat_ky_truy_cap where doi_tuong='danh_gia_sau_dieu_tri' and doi_tuong_id=$1`, [a.r_danh_gia_id]))[0].n).toBe(2);
  });
});

describe("không hài lòng → khiếu nại", () => {
  it("tạo đúng một khiếu nại mới, nối hai chiều; sửa lại không tạo thêm; đổi lại hài lòng giữ khiếu nại", async () => {
    const h = await taoDon(true);
    const [a] = await ghi(h, null, "khong_hai_long", "thai_do", "Lễ tân chưa niềm nở");
    expect(a.r_khieu_nai_moi).toBe(true);
    const kn = (await q<{ id: string; ma: string; trang_thai: string; loai: string; khach_id: string; hoa_don_id: string; chi_nhanh_id: string; nguoi_tiep_nhan_id: string; danh_gia_sau_dt_id: string; noi_dung: string; dich_vu_id: string }>(`select * from khieu_nai where id=$1`, [a.r_khieu_nai_id]))[0];
    expect(kn).toMatchObject({ trang_thai: "moi", loai: "thai_do", khach_id: KH, hoa_don_id: h, chi_nhanh_id: CN, nguoi_tiep_nhan_id: NV, danh_gia_sau_dt_id: a.r_danh_gia_id, dich_vu_id: DV });
    expect(kn.ma).toMatch(/^KN\d{6}$/); expect(kn.noi_dung).toMatch(/Thái độ nhân viên.*Lễ tân chưa niềm nở/);
    expect((await q<{ khieu_nai_id: string }>(`select khieu_nai_id from danh_gia_sau_dieu_tri where id=$1`, [a.r_danh_gia_id]))[0].khieu_nai_id).toBe(kn.id);
    const [b] = await ghi(h, null, "khong_hai_long", "gia", "Thấy đắt");
    expect(b.r_khieu_nai_moi).toBe(false); expect(b.r_khieu_nai_id).toBe(kn.id);
    const [c] = await ghi(h, null, "hai_long", null, "Đã được giải thích, ok");
    expect(c.r_khieu_nai_id).toBe(kn.id);
    expect((await q<{ n: number }>(`select count(*)::int n from khieu_nai where hoa_don_id=$1`, [h]))[0].n).toBe(1);
    const [d] = await ghi(h, null, "khong_hai_long", "cho_doi");
    expect(d.r_khieu_nai_moi).toBe(false);
  });
  it("hài lòng rồi sửa thành không hài lòng thì mới tạo khiếu nại; lý do giá → loại tài chính; lý do khác → dịch vụ", async () => {
    const h = await taoDon(true);
    expect((await ghi(h, null, "hai_long", null))[0].r_khieu_nai_id).toBeNull();
    const [b] = await ghi(h, null, "khong_hai_long", "gia");
    expect(b.r_khieu_nai_moi).toBe(true);
    expect((await q<{ loai: string }>(`select loai from khieu_nai where id=$1`, [b.r_khieu_nai_id]))[0].loai).toBe("tai_chinh");
    const h2 = await taoDon(true);
    const [c] = await ghi(h2, null, "khong_hai_long", "ket_qua");
    expect((await q<{ loai: string }>(`select loai from khieu_nai where id=$1`, [c.r_khieu_nai_id]))[0].loai).toBe("dich_vu");
  });
});

describe("một lần cho mỗi lần điều trị (hoá đơn ↔ lịch hẹn)", () => {
  it("lịch hoàn thành chưa có hoá đơn thì đánh giá theo lịch; sau khi có hoá đơn hoàn thành phải đánh giá ở hoá đơn", async () => {
    const lich = await taoLich("hoan_thanh");
    const [a] = await ghi(null, lich, "khong_hai_long", "ve_sinh");
    expect(a.r_khieu_nai_moi).toBe(true);
    expect((await q<{ hoa_don_id: string | null }>(`select hoa_don_id from khieu_nai where id=$1`, [a.r_khieu_nai_id]))[0].hoa_don_id).toBeNull();
    // hoá đơn của chính lịch này đã hoàn thành sau đó: không được đánh giá lần hai ở hoá đơn
    const h = await taoDon(true, lich);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri($1,null,'hai_long',null,null,$2)`, [h, NV])).toMatch(/đã được đánh giá ở lịch hẹn/);
  });
  it("lịch đã có hoá đơn hoàn thành thì không đánh giá theo lịch; hoá đơn đã đánh giá thì ghi lại là sửa chứ không thêm dòng", async () => {
    const lich = await taoLich("hoan_thanh");
    const h = await taoDon(true, lich);
    expect(await loi(`select * from ghi_danh_gia_sau_dieu_tri(null,$1,'hai_long',null,null,$2)`, [lich, NV])).toMatch(/đánh giá ở hoá đơn/);
    await ghi(h, null, "hai_long", null); await ghi(h, null, "hai_long", null, "ghi chú mới");
    expect((await q<{ n: number }>(`select count(*)::int n from danh_gia_sau_dieu_tri where hoa_don_id=$1`, [h]))[0].n).toBe(1);
    expect(await loi(`insert into danh_gia_sau_dieu_tri (hoa_don_id, ket_qua, khach_id) values ($1,'hai_long',$2)`, [h, KH])).toMatch(/dgsdt_mot_lan_hoa_don|duplicate/);
  });
});
