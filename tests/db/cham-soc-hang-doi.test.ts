import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration, chayVoiTu } from "./khung";

// 0100: danh sách chăm sóc tự sinh (7 loại) + sổ ghi kết quả gọi (cham_soc_cuoc_goi).
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, CN2: string, GOI: string, DV: string;
const hang = async (loai: string, cn: string | null = null, sdt: number | null = null) =>
  (await q<{ ma: string; hang: string; loai: string; moc: number | null; so_lan_goi: number; goi_tt: string | null; dich_vu: string | null }>(`select * from ds_cham_soc($1, $2::uuid, $3::int) order by ma`, [loai, cn, sdt]));
const maHang = async (loai: string, cn: string | null = null, sdt: number | null = null) => (await hang(loai, cn, sdt)).map((x) => x.ma);
const dem = async (cn: string | null = null) => Object.fromEntries((await q<{ hang: string; so: string }>(`select * from dem_cham_soc($1::uuid)`, [cn])).map((r) => [r.hang, Number(r.so)]));
let seq = 0;
async function khach(ma: string, extra: { ns?: string; cn?: string; denCuoi?: string; mat?: boolean } = {}) {
  seq++;
  return (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, ngay_sinh, lan_den_cuoi, danh_dau_mat) values ($1,$1,$2,$3,'mkt','${u(1)}',$4,$5,$6) returning id`,
    [ma, `09000${String(seq).padStart(5, "0")}`, extra.cn ?? CN, extra.ns ?? null, extra.denCuoi ?? null, extra.mat ?? false]))[0].id;
}
/** Lịch cách hôm nay `ngay` ngày (âm = quá khứ), lúc 10:00 giờ VN. */
async function lich(khachId: string, ngay: number, tt: string, cn: string = CN) {
  return (await q<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, (hom_nay() + $3::int)::timestamp at time zone 'Asia/Ho_Chi_Minh' + interval '10 hours', (hom_nay() + $3::int)::timestamp at time zone 'Asia/Ho_Chi_Minh' + interval '11 hours', $4) returning id`, [khachId, cn, ngay, tt]))[0].id;
}
async function goi(khachId: string, loai: string, ngayGoc: string, tt: string, o: { goiLai?: string | null; khong?: boolean; luc?: string } = {}) {
  await q(`insert into cham_soc_cuoc_goi (khach_id, loai, ngay_goc, trang_thai, ngay_goi_lai, khong_can_goi_lai, tao_luc) values ($1,$2,$3,$4,$5,$6, coalesce($7::timestamptz, now()))`, [khachId, loai, ngayGoc, tt, o.goiLai ?? null, o.khong ?? false, o.luc ?? null]);
}
const ngay = async (d: number) => (await q<{ d: string }>(`select to_char(hom_nay() + $1::int, 'YYYY-MM-DD') d`, [d]))[0].d;

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  CN2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('DL','Đà Lạt') returning id`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ('${u(1)}','Tư Vấn','tu_van',$1)`, [CN]);
  GOI = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('G1','Triệt lông','lan',1000,10) returning id`))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('DV1',$1,'Laser nám',500000) returning id`, [nhom]))[0].id;
});

describe("hàng đợi theo loại", () => {
  it("nhắc lịch NGÀY MAI: chỉ lịch mai chưa xác nhận/đã xác nhận, mỗi khách một dòng, lọc chi nhánh", async () => {
    const a = await khach("NL-A"), b = await khach("NL-B"), c = await khach("NL-C"), d = await khach("NL-D", { cn: CN2 });
    const la = await lich(a, 1, "da_xac_nhan"); await lich(a, 1, "chua_xac_nhan");
    await lich(b, 1, "huy"); await lich(c, 2, "da_xac_nhan"); await lich(d, 1, "chua_xac_nhan", CN2);
    await q(`insert into lich_hen_dich_vu (lich_id, dich_vu_id) values ($1,$2)`, [la, DV]);
    const r = await hang("nhac_lich");
    expect(r.map((x) => x.ma)).toEqual(["NL-A", "NL-D"]);
    expect(r[0].dich_vu).toBe("Laser nám");
    expect(await maHang("nhac_lich", CN)).toEqual(["NL-A"]);
    expect(await maHang("nhac_lich", CN2)).toEqual(["NL-D"]);
  });

  it("không đến / huỷ: trong cửa sổ N ngày và khách chưa có lịch/lần đến sau đó", async () => {
    const a = await khach("KD-A"), b = await khach("KD-B"), c = await khach("KD-C"), d = await khach("HL-D"), e = await khach("HL-E");
    await lich(a, -2, "khong_den");
    await lich(b, -3, "khong_den"); await lich(b, 5, "da_xac_nhan");         // đã đặt lại → khỏi gọi
    await lich(c, -30, "khong_den");                                           // quá cửa sổ 14 ngày
    await lich(d, -1, "huy");
    await lich(e, -5, "huy"); await lich(e, -2, "hoan_thanh");                 // đã đến sau đó
    expect(await maHang("khong_den")).toEqual(["KD-A"]);
    expect(await maHang("huy_lich")).toEqual(["HL-D"]);
  });

  it("sau điều trị: lần hoàn thành mới nhất cách N..N+2 ngày; N chỉnh được", async () => {
    const a = await khach("SD-A"), b = await khach("SD-B"), c = await khach("SD-C"), d = await khach("SD-D");
    await lich(a, -3, "hoan_thanh"); await lich(b, -5, "hoan_thanh"); await lich(c, -4, "hoan_thanh"); await lich(c, -1, "hoan_thanh"); // C có lần mới hơn
    await lich(d, -9, "hoan_thanh");
    expect((await maHang("sau_dieu_tri")).filter((x) => x.startsWith("SD-")).sort()).toEqual(["SD-A", "SD-B"]);      // mặc định N=3: cách 3..5 ngày
    expect((await maHang("sau_dieu_tri", null, 9)).includes("SD-D")).toBe(true);
    expect((await maHang("sau_dieu_tri", null, 9)).includes("SD-A")).toBe(false);
  });

  it("định kỳ 1/3/6/12 tháng: đúng mốc (cửa sổ 7 ngày), có lịch sắp tới hoặc đã đến lại thì khỏi", async () => {
    const mocNgay = async (thang: number) => (await q<{ d: string }>(`select to_char((hom_nay() - make_interval(months => $1))::date, 'YYYY-MM-DD') d`, [thang]))[0].d;
    const a = await khach("DK-A", { denCuoi: await mocNgay(1) }), b = await khach("DK-B", { denCuoi: await mocNgay(3) });
    const c = await khach("DK-C", { denCuoi: await mocNgay(6) }), d = await khach("DK-D", { denCuoi: await mocNgay(12) });
    const e = await khach("DK-E", { denCuoi: await mocNgay(3) }); await lich(e, 4, "da_xac_nhan");        // có lịch sắp tới
    const f = await khach("DK-F", { denCuoi: await mocNgay(3), mat: true });                              // đã mất
    const g = await khach("DK-G", { denCuoi: await mocNgay(2) });                                          // không đúng mốc nào
    const h = await khach("DK-H", { denCuoi: await mocNgay(6) }); await lich(h, -10, "hoan_thanh");       // vừa đến lại 10 ngày trước
    // khách chỉ có lịch hoàn thành (không có lan_den_cuoi) đúng mốc 3 tháng
    const i = await khach("DK-I"); await q(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2, (hom_nay() - interval '3 months' - interval '2 days')::timestamp at time zone 'Asia/Ho_Chi_Minh' + interval '10 hours', (hom_nay() - interval '3 months' - interval '2 days')::timestamp at time zone 'Asia/Ho_Chi_Minh' + interval '11 hours', 'hoan_thanh')`, [i, CN]);
    void [c, d, f, g, h];
    const r = await hang("dinh_ky");
    expect(r.map((x) => `${x.ma}:${x.moc}`).sort()).toEqual(["DK-A:1", "DK-B:3", "DK-C:6", "DK-D:12", "DK-I:3"]);
    void [a, b];
  });

  it("sinh nhật: hôm nay đến 3 ngày tới, ngày gốc là sinh nhật năm nay; khách đã mất không hiện", async () => {
    const ns = async (d: number) => (await q<{ d: string }>(`select to_char(hom_nay() + $1::int, '1990-MM-DD') d`, [d]))[0].d;
    await khach("SN-0", { ns: await ns(0) }); await khach("SN-3", { ns: await ns(3) }); await khach("SN-4", { ns: await ns(4) }); await khach("SN-M1", { ns: await ns(-1) });
    await khach("SN-MAT", { ns: await ns(1), mat: true });
    const r = await hang("sinh_nhat");
    expect(r.map((x) => x.ma)).toEqual(["SN-0", "SN-3"]);
    expect((await q<{ ngay_goc: string }>(`select to_char(ngay_goc,'YYYY-MM-DD') ngay_goc from ds_cham_soc('sinh_nhat') order by ma`))[0].ngay_goc).toBe(await ngay(0));
  });

  it("đến mà không mua: lịch hoàn thành 1..7 ngày qua; có hoá đơn / buổi trừ thẻ thì khỏi; hôm nay chưa tính", async () => {
    const a = await khach("DM-A"), b = await khach("DM-B"), c = await khach("DM-C"), d = await khach("DM-D"), e = await khach("DM-E"), f = await khach("DM-F");
    await lich(a, -2, "hoan_thanh");
    const lb = await lich(b, -2, "hoan_thanh");
    await q(`insert into hoa_don (ma, chi_nhanh_id, khach_id, lich_hen_id, trang_thai, ngay_hd, nguoi_lap_id) values ('HD-DM-B',$1,$2,$3,'hoan_thanh', hom_nay() - 2,'${u(1)}')`, [CN, b, lb]);
    await lich(c, -3, "hoan_thanh");
    await q(`insert into hoa_don (ma, chi_nhanh_id, khach_id, trang_thai, ngay_hd, nguoi_lap_id) values ('HD-DM-C',$1,$2,'hoan_thanh', hom_nay() - 3,'${u(1)}')`, [CN, c]); // hoá đơn không gắn lịch (dữ liệu chuyển từ SalonHero) nhưng cùng ngày
    const ld = await lich(d, -2, "hoan_thanh");
    const the = (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, ngay_cap, cap_tay) values ('T-DM',$1,$2,$3,'lan',5, hom_nay() - 30, true) returning id`, [d, GOI, CN]))[0].id;
    await q(`insert into buoi_thuc_hien (khach_id, the_id, dich_vu_id, lich_hen_id, chi_nhanh_id, ngay_lam, nv_thuc_hien_id, tao_boi) values ($1,$2,$3,$4,$5, hom_nay() - 2, '${u(1)}','${u(1)}')`, [d, the, DV, ld, CN]);
    await lich(e, 0, "hoan_thanh"); await lich(f, -20, "hoan_thanh");
    expect((await maHang("den_khong_mua")).filter((x) => x.startsWith("DM-"))).toEqual(["DM-A"]);
  });
});

describe("ghi kết quả gọi: ẩn / hiện lại", () => {
  it("đã liên lạc, từ chối, đã đặt lịch: ẩn hẳn; không nghe máy: ẩn trong ngày, mai hiện lại; 'không cần gọi lại' ẩn hẳn", async () => {
    const ids: Record<string, string> = {};
    for (const m of ["GA", "GB", "GC", "GD", "GE", "GF"]) { ids[m] = await khach(`G-${m}`); await lich(ids[m], 1, "da_xac_nhan"); }
    const mai = await ngay(1);
    expect((await maHang("nhac_lich")).filter((x) => x.startsWith("G-")).length).toBe(6);
    await goi(ids.GA, "nhac_lich", mai, "da_lien_lac");
    await goi(ids.GB, "nhac_lich", mai, "tu_choi");
    await goi(ids.GC, "nhac_lich", mai, "da_dat_lich");
    await goi(ids.GD, "nhac_lich", mai, "khong_nghe_may");                         // hôm nay: ẩn
    await goi(ids.GE, "nhac_lich", mai, "khong_nghe_may", { luc: new Date(Date.now() - 36 * 3600e3).toISOString() }); // hôm qua: hiện lại
    await goi(ids.GF, "nhac_lich", mai, "khong_nghe_may", { khong: true, luc: new Date(Date.now() - 36 * 3600e3).toISOString() }); // hôm qua nhưng không cần gọi lại
    const con = (await maHang("nhac_lich")).filter((x) => x.startsWith("G-"));
    expect(con).toEqual(["G-GE"]);
    const e = (await hang("nhac_lich")).find((x) => x.ma === "G-GE")!;
    expect(e.goi_tt).toBe("khong_nghe_may");
    expect(e.so_lan_goi).toBe(1);
  });

  it("hẹn gọi lại: ẩn khỏi hàng gốc; đến ngày (hoặc quá ngày) hiện ở 'hen_goi_lai'; gọi mới hơn thì hết hiện; kết quả gắn đúng sự kiện", async () => {
    const a = await khach("HG-A"), b = await khach("HG-B"), c = await khach("HG-C");
    for (const k of [a, b, c]) await lich(k, 1, "chua_xac_nhan");
    const mai = await ngay(1);
    await goi(a, "nhac_lich", mai, "hen_goi_lai", { goiLai: await ngay(0) });     // đến hạn hôm nay
    await goi(b, "nhac_lich", mai, "hen_goi_lai", { goiLai: await ngay(3) });     // chưa tới hạn
    await goi(c, "nhac_lich", mai, "hen_goi_lai", { goiLai: await ngay(-2) });    // quá hạn vẫn hiện
    expect((await maHang("nhac_lich")).filter((x) => x.startsWith("HG-"))).toEqual([]);
    const h = await hang("hen_goi_lai");
    expect(h.filter((x) => x.ma.startsWith("HG-")).map((x) => x.ma)).toEqual(["HG-A", "HG-C"]);
    expect(h.find((x) => x.ma === "HG-A")!.loai).toBe("nhac_lich");
    expect((await dem()).hen_goi_lai).toBeGreaterThanOrEqual(2);
    await goi(a, "nhac_lich", mai, "da_lien_lac");                                // gọi xong → hết hiện
    expect((await maHang("hen_goi_lai")).includes("HG-A")).toBe(false);
    // lịch MỚI của cùng khách (ngày gốc khác) mở hàng đợi mới, không bị kết quả cũ che
    await q(`delete from lich_hen where khach_id = $1 and bat_dau < now() + interval '30 hours'`, [a]);
    await lich(a, 1, "da_xac_nhan");
    expect((await maHang("nhac_lich")).includes("HG-A")).toBe(false);              // vẫn cùng ngày gốc → vẫn ẩn
  });

  it("đếm theo loại khớp danh sách; phân trang ≤ 50 dòng và giữ tổng", async () => {
    const d = await dem();
    for (const l of ["nhac_lich", "khong_den", "huy_lich", "sau_dieu_tri", "dinh_ky", "sinh_nhat", "den_khong_mua", "hen_goi_lai"]) {
      expect(d[l] ?? 0).toBe((await maHang(l)).length);
    }
    for (let i = 0; i < 55; i++) { const k = await khach(`PT-${String(i).padStart(2, "0")}`); await lich(k, -2, "huy"); }
    const trang1 = await q<{ tong: string }>(`select * from ds_cham_soc('huy_lich', null, null, 0, 500)`);
    expect(trang1.length).toBe(50);                                                  // chặn cứng 50 dòng/trang
    expect(Number(trang1[0].tong)).toBeGreaterThanOrEqual(56);
    const trang2 = await q(`select * from ds_cham_soc('huy_lich', null, null, 50, 50)`);
    expect(trang2.length).toBe(Number(trang1[0].tong) - 50);
  });
});

describe("sổ cuộc gọi: chỉ-thêm, ràng buộc, khoá quyền", () => {
  it("không sửa/xoá được; hẹn gọi lại bắt buộc có ngày; không vừa 'không cần' vừa có ngày", async () => {
    const k = await khach("SO-A");
    await goi(k, "sinh_nhat", await ngay(0), "da_lien_lac");
    await expect(q(`update cham_soc_cuoc_goi set noi_dung = 'x'`)).rejects.toThrow(/chỉ được thêm dòng/);
    await expect(q(`delete from cham_soc_cuoc_goi`)).rejects.toThrow(/chỉ được thêm dòng/);
    await expect(goi(k, "sinh_nhat", await ngay(0), "hen_goi_lai")).rejects.toThrow();
    await expect(goi(k, "sinh_nhat", await ngay(0), "khong_nghe_may", { goiLai: await ngay(2), khong: true })).rejects.toThrow();
    await expect(q(`insert into cham_soc_cuoc_goi (khach_id, loai, ngay_goc, trang_thai) values ($1,'khong_co','2026-01-01','da_lien_lac')`, [k])).rejects.toThrow();
  });
  it("vai trò đăng nhập (anon/authenticated) không đọc/ghi được bảng và hàm", async () => {
    const dongHienCo = (await q<{ n: string }>(`select count(*) n from cham_soc_cuoc_goi`))[0].n;
    expect(Number(dongHienCo)).toBeGreaterThan(0);
    const r = await chayVoiTu(db, { sub: u(1) }, `select count(*)::int n from cham_soc_cuoc_goi`).catch(() => ({ rows: [{ n: -1 }] }));
    expect([0, -1]).toContain((r.rows[0] as { n: number }).n);
    await expect(chayVoiTu(db, { sub: u(1) }, `insert into cham_soc_cuoc_goi (khach_id, loai, ngay_goc, trang_thai) select id,'sinh_nhat',hom_nay(),'da_lien_lac' from khach_hang limit 1`)).rejects.toThrow();
    await expect(chayVoiTu(db, { sub: u(1) }, `select * from ds_cham_soc('nhac_lich')`)).rejects.toThrow();
    await expect(chayVoiTu(db, { sub: u(1) }, `select * from dem_cham_soc()`)).rejects.toThrow();
  });
});
