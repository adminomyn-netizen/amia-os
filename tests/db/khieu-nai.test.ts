import { readFileSync } from "fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, taoDbVoiMigration } from "./khung";
import { THAM_SO_BH_MAC_DINH, soDuongHoacNull, thamSoBaoHanh, thangTron, tinhBaoHanh } from "../../src/lib/khieu-nai";

describe("bảo hành: mốc tính từ buổi cuối (Khung KD 4.4.2)", () => {
  it("số tháng tròn", () => {
    expect(thangTron("2026-01-15", "2026-04-14")).toBe(2);
    expect(thangTron("2026-01-15", "2026-04-15")).toBe(3);
    expect(thangTron("2025-10-28", "2026-10-28")).toBe(12);
  });
  it("3–6 tháng giảm 50%, 6–12 tháng giảm 40%, quá 12 tháng theo giá mới, dưới 3 tháng chưa có mức", () => {
    expect(tinhBaoHanh("2026-07-28", "2026-10-28", "chuan")).toMatchObject({ moc: "moc_1", tyLeGiam: 50 });
    expect(tinhBaoHanh("2026-01-28", "2026-10-28", "chuan")).toMatchObject({ moc: "moc_2", tyLeGiam: 40 });
    expect(tinhBaoHanh("2025-10-27", "2026-10-28", "chuan")).toMatchObject({ moc: "tren_moc_3", tyLeGiam: null });
    expect(tinhBaoHanh("2026-09-28", "2026-10-28", "chuan")).toMatchObject({ moc: "duoi_moc_1", tyLeGiam: null });
  });
  it("triệt lông: bảo hành 1 năm/lần, không có % ưu đãi", () => {
    expect(tinhBaoHanh("2026-03-01", "2026-10-28", "nam_mot_lan")).toMatchObject({ moc: "nam_mot_lan", tyLeGiam: null, nhan: "Trong hạn bảo hành 1 năm/lần" });
    expect(tinhBaoHanh("2025-03-01", "2026-10-28", "nam_mot_lan").nhan).toBe("Quá hạn bảo hành 1 năm");
  });
  it("tham số đọc từ cau_hinh, thiếu thì dùng khung; SLA trống = chờ chốt", () => {
    expect(thamSoBaoHanh([])).toEqual(THAM_SO_BH_MAC_DINH);
    expect(thamSoBaoHanh([{ khoa: "bh_ty_le_moc_1", gia_tri: "45" }]).tyLe1).toBe(45);
    expect(soDuongHoacNull("")).toBeNull();
    expect(soDuongHoacNull("  ")).toBeNull();
    expect(soDuongHoacNull("24")).toBe(24);
    expect(soDuongHoacNull("abc")).toBeNull();
  });
});

const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, KH: string;
const NV = { leTan: u(1), quanLy: u(2), bacSi: u(3), ktv: u(4) };

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  for (const [vt, id] of [["le_tan", NV.leTan], ["quan_ly", NV.quanLy], ["bac_si", NV.bacSi], ["ktv", NV.ktv]] as const) await db.query(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,$2,$3,$4)`, [id, vt, vt, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KH1','Chị A','0900000001',$1,'mkt',$2) returning id`, [CN, NV.leTan]))[0].id;
}, 60000);

const taoKn = async (loai = "dich_vu") => (await q<{ id: string }>(`insert into khieu_nai (ma, khach_id, chi_nhanh_id, loai, noi_dung, nguoi_tiep_nhan_id) values ('KN'||lpad(so_tiep_theo('kn')::text,6,'0'),$1,$2,$3,'Khách phàn nàn',$4) returning id`, [KH, CN, loai, NV.leTan]))[0].id;

describe("khiếu nại: quy tắc đóng và duyệt nằm trong cơ sở dữ liệu", () => {
  it("không đóng được khi khách chưa xác nhận", async () => {
    const id = await taoKn();
    expect(await loi(`update khieu_nai set trang_thai='dong', dong_luc=now() where id=$1`, [id])).toMatch(/khieu_nai_dong_can_khach_xac_nhan/);
    expect(await loi(`update khieu_nai set trang_thai='dong', khach_xac_nhan=true, dong_luc=now() where id=$1`, [id])).toMatch(/khieu_nai_dong_can_khach_xac_nhan/);
    expect(await loi(`update khieu_nai set trang_thai='dong', khach_xac_nhan=true, cach_xac_nhan='zalo', dong_luc=now() where id=$1`, [id])).toBe("");
  });
  it("phương án cần duyệt thì không đóng được nếu chưa có người duyệt", async () => {
    const id = await taoKn();
    await db.query(`update khieu_nai set can_duyet=true, co_chi_phi=true, chi_phi=500000, trang_thai='da_duyet' where id=$1`, [id]);
    expect(await loi(`update khieu_nai set trang_thai='dong', khach_xac_nhan=true, cach_xac_nhan='ky', dong_luc=now() where id=$1`, [id])).toMatch(/khieu_nai_dong_can_duyet/);
    await db.query(`update khieu_nai set nguoi_duyet_id=$2 where id=$1`, [id, NV.quanLy]);
    expect(await loi(`update khieu_nai set trang_thai='dong', khach_xac_nhan=true, cach_xac_nhan='ky', dong_luc=now() where id=$1`, [id])).toBe("");
  });
  it("người ghi nhận hoặc đề xuất không tự duyệt", async () => {
    const id = await taoKn();
    expect(await loi(`update khieu_nai set nguoi_duyet_id=$2 where id=$1`, [id, NV.leTan])).toMatch(/không được tự duyệt/);
    await db.query(`update khieu_nai set nguoi_de_xuat_id=$2 where id=$1`, [id, NV.quanLy]);
    expect(await loi(`update khieu_nai set nguoi_duyet_id=$2 where id=$1`, [id, NV.quanLy])).toMatch(/không được tự duyệt/);
  });
  it("khiếu nại y khoa không đi đường khiếu nại thường", async () => {
    const id = await taoKn("y_khoa");
    expect(await loi(`update khieu_nai set trang_thai='cho_duyet' where id=$1`, [id])).toMatch(/khieu_nai_y_khoa_di_bien_chung/);
    expect(await loi(`update khieu_nai set trang_thai='chuyen_bc' where id=$1`, [id])).toBe("");
  });
});

describe("biến chứng: bác sĩ chủ trì, đóng phải có nguyên nhân gốc", () => {
  const tao = async () => (await q<{ id: string }>(`insert into bien_chung (ma, khach_id, chi_nhanh_id, nguoi_bao_id, dau_hieu) values ('BC'||lpad(so_tiep_theo('bc')::text,6,'0'),$1,$2,$3,'Đỏ rát, phồng nhẹ') returning id`, [KH, CN, NV.ktv]))[0].id;
  it("ca mới có mốc báo lãnh đạo ngay lúc tạo", async () => {
    const id = await tao();
    const r = (await q<{ lanh_dao: boolean; moi: string }>(`select bao_lanh_dao_luc is not null as lanh_dao, trang_thai as moi from bien_chung where id=$1`, [id]))[0];
    expect(r).toEqual({ lanh_dao: true, moi: "moi" });
  });
  it("sang bước khám phải có bác sĩ, chẩn đoán, phương án; cam kết phải có văn bản; đóng phải có gốc và phòng ngừa", async () => {
    const id = await tao();
    expect(await loi(`update bien_chung set trang_thai='dang_xu_ly' where id=$1`, [id])).toMatch(/bien_chung_xu_ly_can_bac_si/);
    expect(await loi(`update bien_chung set trang_thai='dang_xu_ly', bac_si_id=$2, chan_doan='Viêm da tiếp xúc', phuong_an='Thuốc bôi' where id=$1`, [id, NV.bacSi])).toBe("");
    expect(await loi(`update bien_chung set trang_thai='da_cam_ket' where id=$1`, [id])).toMatch(/bien_chung_cam_ket_can_van_ban/);
    expect(await loi(`update bien_chung set trang_thai='da_cam_ket', cam_ket='Theo dõi 3 lần, không thu phí' where id=$1`, [id])).toBe("");
    expect(await loi(`update bien_chung set trang_thai='dong', dong_luc=now() where id=$1`, [id])).toMatch(/bien_chung_dong_can_goc/);
    expect(await loi(`update bien_chung set trang_thai='dong', dong_luc=now(), nguyen_nhan_goc='Sai cơ địa', phong_ngua='Thử vùng nhỏ trước' where id=$1`, [id])).toBe("");
  });
});

describe("tham số và nhóm dịch vụ", () => {
  it("tham số nguồn Khung KD có sẵn; SLA và hạn mức để trống chờ chốt", async () => {
    const m = new Map((await q<{ khoa: string; gia_tri: string }>(`select khoa, gia_tri from cau_hinh where khoa like 'bh_%' or khoa like 'kn_%'`)).map((r) => [r.khoa, r.gia_tri]));
    expect(m.get("bh_ty_le_moc_1")).toBe("50");
    expect(m.get("bh_ty_le_moc_2")).toBe("40");
    expect(m.get("kn_sla_tiep_nhan_gio")).toBe("");
    expect(m.get("kn_han_muc_tu_xu_ly")).toBe("");
  });
  it("nhóm Triệt lông được đánh dấu bảo hành 1 năm/lần, nhóm khác là chuẩn", async () => {
    const r = await q<{ ten: string; kieu_bao_hanh: string }>(`select ten, kieu_bao_hanh from dich_vu_nhom order by ten`);
    expect(r.find((x) => x.ten === "Triệt lông")?.kieu_bao_hanh).toBe("nam_mot_lan");
    expect(r.filter((x) => x.ten !== "Triệt lông").every((x) => x.kieu_bao_hanh === "chuan")).toBe(true);
  });
  it("bảng mới đã khoá: người chưa đăng nhập không đọc được", async () => {
    for (const b of ["khieu_nai", "bien_chung", "bao_hanh_lan"]) {
      const kq = await chayVoiKhach(db, `select count(*)::int as n from public.${b}`).catch(() => null);
      expect(kq === null || Number(kq.rows[0].n) === 0).toBe(true);
    }
  });
});

describe("chuông thông báo: ràng buộc mã cảnh báo khớp kiểu CanhBao trong mã nguồn", () => {
  it("mọi mã khai báo trong canh-bao.ts đều lưu được trạng thái đã đọc (không có migration nào làm rơi mã)", async () => {
    const nguon = readFileSync("src/lib/canh-bao.ts", "utf8");
    const khai = /export type CanhBao = \{ ma: ([^;]*);/.exec(nguon)![1];
    const ma = [...khai.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
    expect(ma).toEqual(expect.arrayContaining(["lich", "tdyc", "tduv", "tdtin", "knai", "bchung"]));
    for (const m of ma) expect(await loi(`insert into thong_bao_trang_thai (nhan_vien_id, ma, dau_van, trang_thai) values ($1,$2,'x','da_doc') on conflict do nothing`, [NV.leTan, m])).toBe("");
  });
});

describe("chat nổi: chỉ Chủ và Kỹ thuật được nhờ sửa hoặc duyệt đưa lên", () => {
  let cuoc: string;
  const gui = (loai: string, vaiTro: string) => loi(`insert into chat_tin (cuoc_id, nhan_vien_id, vai, loai, vai_tro_chup, noi_dung) values ($1,$2,'nguoi',$3,$4,'x')`, [cuoc, NV.leTan, loai, vaiTro]);
  beforeAll(async () => { cuoc = (await q<{ id: string }>(`insert into chat_cuoc (nhan_vien_id) values ($1) returning id`, [NV.leTan]))[0].id; });
  it("hỏi đáp ai cũng gửi được", async () => { expect(await gui("hoi", "le_tan")).toBe(""); });
  it("lễ tân, quản lý không gửi được loại sửa hay duyệt", async () => {
    for (const vt of ["le_tan", "quan_ly", "tu_van"]) for (const l of ["sua", "duyet"]) expect(await gui(l, vt)).toMatch(/chat_tin_sua_chi_chu_va_ky_thuat/);
  });
  it("Chủ và Kỹ thuật gửi được", async () => { for (const vt of ["chu", "ky_thuat"]) for (const l of ["sua", "duyet"]) expect(await gui(l, vt)).toBe(""); });
});
