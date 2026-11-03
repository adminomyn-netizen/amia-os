import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, taoDbVoiMigration } from "./khung";

// Đặt lịch online y SalonHero (migration 0270): khách đặt là có lịch hẹn ngay, khung giờ theo cài đặt, còn/hết chỗ theo sức chứa + số lượt, chọn người làm, chống spam.
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, CN2: string, NV: string, KTV: string, DV1: string, DV2: string;
const IP = (n: number) => `iphash${String(n).padStart(8, "0")}`;
const ngayVN = async (n: number) => (await q<{ d: string }>(`select ((now() at time zone 'Asia/Ho_Chi_Minh')::date + $1::int)::text d`, [n]))[0].d;
const thuCua = async (d: string) => ["t2", "t3", "t4", "t5", "t6", "t7", "cn"][(await q<{ x: number }>(`select extract(isodow from $1::date)::int x`, [d]))[0].x - 1];
const luc = (ngay: string, gio: string) => `${ngay}T${gio}:00+07:00`;
const tuyChon = (o: Record<string, unknown>) => db.query(`insert into cau_hinh (khoa, gia_tri) values ('dat_online.tuy_chon', $1) on conflict (khoa) do update set gia_tri = excluded.gia_tri`, [JSON.stringify(o)]);
const khung = async (cn: string, ngay: string, phut = 30, sk = 1, nv: string | null = null) =>
  q<{ gio: string; con_cho: boolean }>(`select * from public.khung_gio_online($1,$2::date,$3,$4,$5)`, [cn, ngay, phut, sk, nv]);
const con = async (...a: Parameters<typeof khung>) => (await khung(...a)).filter((k) => k.con_cho).map((k) => k.gio);
type Dat = { cn?: string; dv?: string[]; bd: string; ten?: string; sdt?: string; gt?: string; sk?: number; nv?: string | null; ghi?: string | null; ip?: string };
const dat = async (o: Dat) => (await q<{ r: { lich_id: string; ma: string; phut: number; trang_thai: string } }>(
  `select public.dat_lich_online($1,$2::uuid[],$3::timestamptz,$4,$5,$6,$7,$8,$9,$10) r`,
  [o.cn ?? CN, o.dv ?? [], o.bd, o.ten ?? "[THỬ] Chị Test", o.sdt ?? "0900111222", o.gt ?? "nữ", o.sk ?? 1, o.nv ?? null, o.ghi ?? null, o.ip ?? IP(1)]))[0].r;
const datLoi = async (o: Dat) => { try { await dat(o); } catch (e) { return (e as Error).message; } return ""; };

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh order by ma limit 1`))[0].id;
  CN2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('CN2','Chi nhánh hai') returning id`))[0].id;
  NV = (await q<{ id: string }>(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Quản lý','quan_ly',$1) returning id`, [CN]))[0].id;
  KTV = (await q<{ id: string }>(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id, la_phuc_vu, hien_dat_lich) values ('KTV A','ktv',$1,true,true) returning id`, [CN]))[0].id;
  const nhom = (await q<{ id: string }>(`insert into dich_vu_nhom (ten) values ('Nhóm') returning id`))[0].id;
  const dv = async (ma: string, phut: number) => (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, thoi_luong_phut, dat_online) values ($1,$2,$1,$3,true) returning id`, [ma, nhom, phut]))[0].id;
  DV1 = await dv("D60", 60); DV2 = await dv("D45", 45);
  await db.query(`insert into cho_lam (chi_nhanh_id, ten, suc_chua) values ($1,'Phòng 2 giường',2)`, [CN]);
  await db.query(`update cua_hang set gio_lam_viec = '{"mo":"08:00","dong":"20:00","nghi":[]}'::jsonb where id = 1`);
  await db.query(`update cau_hinh set gia_tri='1' where khoa='dat_online.mo'`);
  await tuyChon({});
}, 60000);

describe("khung giờ như SalonHero", () => {
  it("mặc định khung 15 phút, trả cả giờ còn chỗ", async () => {
    const k = await khung(CN, await ngayVN(5));
    expect(k[0]).toEqual({ gio: "08:00", con_cho: true });
    expect(k[1].gio).toBe("08:15");
    expect(k.at(-1)?.gio).toBe("19:30"); // 30 phút mặc định không vượt giờ đóng 20:00
  });
  it("đổi 'Thời gian của 1 khung giờ' sang 1 giờ", async () => {
    await tuyChon({ khungPhut: 60 });
    expect((await khung(CN, await ngayVN(5))).map((k) => k.gio).slice(0, 3)).toEqual(["08:00", "09:00", "10:00"]);
    await tuyChon({});
  });
  it("giờ hôm nay đã qua / trong thời gian phải đặt trước thì HẾT CHỖ (vẫn hiện); ngày đã qua hoặc quá giới hạn ngày thì không có dòng", async () => {
    const homNay = await khung(CN, await ngayVN(0));
    if (homNay.length) expect(homNay[0].con_cho).toBe(false);
    expect(await khung(CN, await ngayVN(-1))).toEqual([]);
    await db.query(`update cau_hinh set gia_tri='7' where khoa='dat_online.toi_da_ngay'`);
    expect(await khung(CN, await ngayVN(8))).toEqual([]);
    expect((await khung(CN, await ngayVN(6))).length).toBeGreaterThan(0);
    await db.query(`update cau_hinh set gia_tri='60' where khoa='dat_online.toi_da_ngay'`);
  });
  it("trang khoá, chi nhánh tắt hiện ở web, chi nhánh chưa có chỗ: không có giờ còn chỗ", async () => {
    await db.query(`update cau_hinh set gia_tri='0' where khoa='dat_online.mo'`);
    expect(await khung(CN, await ngayVN(5))).toEqual([]);
    await db.query(`update cau_hinh set gia_tri='1' where khoa='dat_online.mo'`);
    expect(await con(CN2, await ngayVN(5))).toEqual([]);
  });
});

describe("sức chứa + số lượt mỗi khung", () => {
  it("sức chứa tính theo số khách (lịch nhóm): phòng 2 giường, lịch nhóm 2 khách thì hết chỗ", async () => {
    const d = await ngayVN(7);
    const kh = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KHX','[THỬ] A','0911000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
    await db.query(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, so_khach) values ($1,$2,$3,$4,2)`, [kh, CN, luc(d, "10:00"), luc(d, "11:00")]);
    const g = await con(CN, d);
    expect(g).not.toContain("10:00"); expect(g).not.toContain("10:30"); expect(g).toContain("09:30"); expect(g).toContain("11:00");
    // Nhóm 2 khách không vừa khi đã có 1 khách cùng lúc
    await db.query(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,$3,$4)`, [kh, CN, luc(d, "14:00"), luc(d, "15:00")]);
    expect(await con(CN, d, 30, 1)).toContain("14:00");
    expect(await con(CN, d, 30, 2)).not.toContain("14:00");
  });
  it("số lượt tối đa cho 1 khung giờ + dòng giới hạn riêng theo giờ / thứ / chi nhánh", async () => {
    const d = await ngayVN(9), thu = await thuCua(d);
    await db.query(`update cho_lam set suc_chua=10 where chi_nhanh_id=$1`, [CN]);
    const kh = (await q<{ id: string }>(`select id from khach_hang limit 1`))[0].id;
    await db.query(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,$3,$4)`, [kh, CN, luc(d, "09:00"), luc(d, "09:30")]);
    await tuyChon({ toiDaLuot: 1 });
    let g = await con(CN, d);
    expect(g).not.toContain("09:00"); expect(g).toContain("09:15");
    await tuyChon({ toiDaLuot: 1, gioiHanRieng: [{ tu: "09:00", den: "10:00", so: 3, thu: [thu], cn: CN }] });
    g = await con(CN, d);
    expect(g).toContain("09:00");
    await tuyChon({ toiDaLuot: 10, gioiHanRieng: [{ tu: "08:00", den: "09:00", so: 0, thu: [], cn: null }] });
    g = await con(CN, d);
    expect(g).not.toContain("08:00"); expect(g).not.toContain("08:45"); expect(g).toContain("09:15");
    await tuyChon({});
    await db.query(`update cho_lam set suc_chua=2 where chi_nhanh_id=$1`, [CN]);
  });
  it("chọn người làm: người đó có lịch thì giờ đó hết chỗ", async () => {
    const d = await ngayVN(11);
    const kh = (await q<{ id: string }>(`select id from khach_hang limit 1`))[0].id;
    await db.query(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, nhan_vien_id) values ($1,$2,$3,$4,$5)`, [kh, CN, luc(d, "15:00"), luc(d, "16:00"), KTV]);
    expect(await con(CN, d, 30, 1, KTV)).not.toContain("15:30");
    expect(await con(CN, d, 30, 1, null)).toContain("15:30");
    expect(await con(CN, d, 30, 1, NV)).toEqual([]); // quản lý không nhận khách online
  });
});

describe("khách đặt lịch → có lịch hẹn ngay", () => {
  it("SĐT mới: tạo khách (giới tính, nguồn Đặt lịch online) + lịch Chưa xác nhận nguồn ONLINE, thời lượng mặc định khi không chọn dịch vụ", async () => {
    const r = await dat({ bd: luc(await ngayVN(12), "10:00"), sdt: "+84 901 234 567", ten: "  [THỬ]   Chị Lan ", gt: "nam", sk: 2, ghi: "Da nhạy cảm", dv: [DV1] });
    expect(r.trang_thai).toBe("chua_xac_nhan"); expect(r.phut).toBe(30); expect(r.ma).toMatch(/^W[0-9A-F]{7}$/);
    const [l] = await q<Record<string, unknown>>(`select l.trang_thai, l.nguon, l.so_khach, l.ghi_chu, l.ma_dat_lich, extract(epoch from l.ket_thuc - l.bat_dau)/60 phut, k.ho_ten, k.dien_thoai, k.gioi_tinh, k.nguon_chi_tiet
      from lich_hen l join khach_hang k on k.id = l.khach_id where l.id = $1`, [r.lich_id]);
    expect(l).toMatchObject({ trang_thai: "chua_xac_nhan", nguon: "ONLINE", so_khach: 2, ho_ten: "[THỬ] Chị Lan", dien_thoai: "0901234567", gioi_tinh: "nam", nguon_chi_tiet: "Đặt lịch online", ma_dat_lich: r.ma });
    expect(Number(l.phut)).toBe(30);
    expect(String(l.ghi_chu)).toContain("nhóm 2 khách"); expect(String(l.ghi_chu)).toContain("Da nhạy cảm");
    // Tắt "Hiện thị dịch vụ" thì dịch vụ gửi lên bị bỏ qua
    expect((await q(`select 1 from lich_hen_dich_vu where lich_id=$1`, [r.lich_id])).length).toBe(0);
    expect((await q(`select 1 from yeu_cau_dat_lich where lich_id=$1 and trang_thai='da_duyet' and so_khach=2`, [r.lich_id])).length).toBe(1);
  });
  it("bật hiện dịch vụ + chọn người làm + trạng thái mặc định Đã xác nhận + chỉ khách nữ", async () => {
    await tuyChon({ hienDvSp: true, chonKtv: true, trangThai: "da_xac_nhan", doiTuong: "nu", thoiLuongPhut: 60 });
    const r = await dat({ bd: luc(await ngayVN(13), "10:00"), sdt: "0901234568", dv: [DV1, DV2], nv: KTV, gt: "nam", ip: IP(2) });
    expect(r).toMatchObject({ trang_thai: "da_xac_nhan", phut: 105 });
    const [l] = await q<Record<string, unknown>>(`select l.nhan_vien_id, l.xac_nhan_luc is not null xn, k.gioi_tinh from lich_hen l join khach_hang k on k.id=l.khach_id where l.id=$1`, [r.lich_id]);
    expect(l).toMatchObject({ nhan_vien_id: KTV, xn: true, gioi_tinh: "nữ" });
    expect((await q(`select 1 from lich_hen_dich_vu where lich_id=$1`, [r.lich_id])).length).toBe(2);
    // Người làm đã kín giờ đó thì không đặt được nữa
    expect(await datLoi({ bd: luc(await ngayVN(13), "10:30"), sdt: "0901234569", nv: KTV, ip: IP(3) })).toMatch(/hết chỗ/);
    await tuyChon({});
  });
  it("SĐT đã là khách: gắn vào khách cũ, không sửa hồ sơ, không tạo khách mới", async () => {
    await db.query(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KHC','Khách Cũ','0988000002',$1,'mkt',$2)`, [CN, NV]);
    const n0 = (await q<{ n: number }>(`select count(*)::int n from khach_hang`))[0].n;
    const r = await dat({ bd: luc(await ngayVN(14), "11:00"), sdt: "0988000002", ten: "Tên Khác", ip: IP(4) });
    expect((await q<{ n: number }>(`select count(*)::int n from khach_hang`))[0].n).toBe(n0);
    const [l] = await q<Record<string, unknown>>(`select k.ho_ten, l.ghi_chu from lich_hen l join khach_hang k on k.id=l.khach_id where l.id=$1`, [r.lich_id]);
    expect(l.ho_ten).toBe("Khách Cũ"); expect(String(l.ghi_chu)).toContain("Tên khách ghi: Tên Khác");
  });
  it("từ chối: giờ không có trong lưới, giờ hết chỗ, đã qua, tên/SĐT sai, nhóm quá 20", async () => {
    const d = await ngayVN(15);
    expect(await datLoi({ bd: luc(d, "10:05"), sdt: "0902000001", ip: IP(5) })).toMatch(/hết chỗ/);
    expect(await datLoi({ bd: luc(d, "07:00"), sdt: "0902000001", ip: IP(5) })).toMatch(/hết chỗ/);
    expect(await datLoi({ bd: luc(await ngayVN(-1), "10:00"), sdt: "0902000001", ip: IP(5) })).toMatch(/đã qua/);
    expect(await datLoi({ bd: luc(d, "10:00"), ten: "A", ip: IP(5) })).toMatch(/họ tên/);
    expect(await datLoi({ bd: luc(d, "10:00"), sdt: "123", ip: IP(5) })).toMatch(/Số điện thoại/);
    expect(await datLoi({ bd: luc(d, "10:00"), sk: 21, ip: IP(5) })).toMatch(/1 đến 20/);
    expect(await datLoi({ bd: luc(d, "10:00"), cn: CN2, ip: IP(5) })).toMatch(/hết chỗ/);
  });
});

describe("chống spam theo SĐT / IP", () => {
  it("một SĐT tối đa 3 lịch online sắp tới, không chồng giờ; không lộ là khách cũ", async () => {
    for (let i = 0; i < 3; i++) await dat({ bd: luc(await ngayVN(20 + i), "10:00"), sdt: "0933000111", ip: IP(30 + i) });
    const e = await datLoi({ bd: luc(await ngayVN(25), "10:00"), sdt: "0933000111", ip: IP(40) });
    expect(e).toMatch(/nhiều lịch đặt online/); expect(e).not.toMatch(/khách cũ|đã đăng ký|tồn tại/i);
    await dat({ bd: luc(await ngayVN(30), "10:00"), sdt: "0944000111", ip: IP(41) });
    expect(await datLoi({ bd: luc(await ngayVN(30), "10:15"), sdt: "0944000111", ip: IP(42) })).toMatch(/khung giờ đó/);
  });
  it("lịch online đã bị huỷ không còn tính vào giới hạn của SĐT (0271)", async () => {
    await db.query(`update lich_hen set trang_thai='huy' where id in (select lich_id from yeu_cau_dat_lich where dien_thoai='0933000111')`);
    await dat({ bd: luc(await ngayVN(25), "10:00"), sdt: "0933000111", ip: IP(43) });
    await db.query(`update lich_hen set trang_thai='huy' where id in (select lich_id from yeu_cau_dat_lich where dien_thoai='0944000111')`);
    await dat({ bd: luc(await ngayVN(30), "10:15"), sdt: "0944000111", ip: IP(44) });
  });
  it("một IP tối đa 10 lần mỗi giờ", async () => {
    await db.query(`update yeu_cau_dat_lich set tao_luc = now() - interval '2 hours'`);
    for (let i = 0; i < 10; i++) await dat({ bd: luc(await ngayVN(35 + (i % 5)), `1${i % 2}:${i < 5 ? "00" : "30"}`), sdt: `09550001${String(i).padStart(2, "0")}`, ip: IP(99) });
    expect(await datLoi({ bd: luc(await ngayVN(41), "10:00"), sdt: "0955000199", ip: IP(99) })).toMatch(/quá nhiều lần/);
  });
  it("anon không gọi được hàm", async () => {
    await expect(chayVoiKhach(db, "select * from public.khung_gio_online(null, current_date, 30)")).rejects.toThrow(/permission denied/);
    await expect(chayVoiKhach(db, "select public.dat_lich_online(null,null,null,'a','b','c',1,null,'d','e')")).rejects.toThrow(/permission denied/);
  });
});
