import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { chayVoiKhach, chayVoiTu, taoDbVoiMigration } from "./khung";

// Hàm tính giờ trống + giới hạn chống lạm dụng + duyệt yêu cầu đặt lịch online (migration 0075).
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, CN2: string, NV: string, DV1: string, DV2: string, DV_TAT: string;
const IP = (n: number) => `iphash${String(n).padStart(8, "0")}`;
/** Ngày VN cách hôm nay `n` ngày (YYYY-MM-DD), tính bằng chính Postgres để khớp múi giờ. */
const ngayVN = async (n: number) => (await q<{ d: string }>(`select ((now() at time zone 'Asia/Ho_Chi_Minh')::date + $1::int)::text d`, [n]))[0].d;
const luc = (ngay: string, gio: string) => `${ngay}T${gio}:00+07:00`;
const gui = (o: { cn?: string; dv?: string[]; bd: string; ten?: string; sdt?: string; ghi?: string | null; ip?: string }) =>
  db.query<{ gui_yeu_cau_dat_lich: string }>(`select public.gui_yeu_cau_dat_lich($1,$2::uuid[],$3::timestamptz,$4,$5,$6,$7)`, [o.cn ?? CN, o.dv ?? [DV1], o.bd, o.ten ?? "Chị Test", o.sdt ?? "0900111222", o.ghi ?? null, o.ip ?? IP(1)]);
const goiLoi = async (o: Parameters<typeof gui>[0]) => { try { await gui(o); } catch (e) { return (e as Error).message; } return ""; };
const gioTrong = async (cn: string, ngay: string, phut: number) => (await q<{ gio_trong_online: string }>(`select * from public.gio_trong_online($1,$2::date,$3)`, [cn, ngay, phut])).map((r) => r.gio_trong_online);
const bat = (v: string) => db.query(`update cau_hinh set gia_tri=$1 where khoa='dat_online.mo'`, [v]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  CN2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('CN2','Chi nhánh hai') returning id`))[0].id;
  NV = (await q<{ id: string }>(`insert into nhan_vien (ho_ten, vai_tro, chi_nhanh_id) values ('Lễ tân','le_tan',$1) returning id`, [CN]))[0].id;
  const nhom = (await q<{ id: string }>(`insert into dich_vu_nhom (ten) values ('Nhóm') returning id`))[0].id;
  const dv = async (ma: string, phut: number, online: boolean, hd = true) => (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, thoi_luong_phut, dat_online, hoat_dong) values ($1,$2,$1,$3,$4,$5) returning id`, [ma, nhom, phut, online, hd]))[0].id;
  DV1 = await dv("D60", 60, true); DV2 = await dv("D30", 30, true); DV_TAT = await dv("KHONG", 60, false);
  await db.query(`insert into cho_lam (chi_nhanh_id, ten) values ($1,'Giường 1'), ($1,'Giường 2')`, [CN]);
  await db.query(`update cua_hang set gio_lam_viec = '{"mo":"08:00","dong":"20:00","nghi":[]}'::jsonb where id = 1`);
}, 60000);

describe("khung giờ trống", () => {
  it("công tắc tắt (mặc định) thì không có giờ nào", async () => {
    expect(await gioTrong(CN, await ngayVN(5), 60)).toEqual([]);
  });
  it("bật: mỗi 30 phút trong giờ mở cửa, dịch vụ 60 phút không vượt giờ đóng", async () => {
    await bat("1");
    const g = await gioTrong(CN, await ngayVN(5), 60);
    expect(g[0]).toBe("08:00"); expect(g.at(-1)).toBe("19:00"); expect(g).toHaveLength(23);
    expect((await gioTrong(CN, await ngayVN(5), 30)).at(-1)).toBe("19:30");
  });
  it("chi nhánh chưa có chỗ nào thì không có giờ", async () => {
    expect(await gioTrong(CN2, await ngayVN(5), 60)).toEqual([]);
  });
  it("ngày nghỉ cố định không có giờ", async () => {
    const d = await ngayVN(5);
    const thu = ["t2", "t3", "t4", "t5", "t6", "t7", "cn"][(await q<{ x: number }>(`select extract(isodow from $1::date)::int x`, [d]))[0].x - 1];
    await db.query(`update cua_hang set gio_lam_viec = jsonb_set(gio_lam_viec, '{nghi}', $1::jsonb) where id = 1`, [JSON.stringify([thu])]);
    expect(await gioTrong(CN, d, 60)).toEqual([]);
    await db.query(`update cua_hang set gio_lam_viec = jsonb_set(gio_lam_viec, '{nghi}', '[]'::jsonb) where id = 1`);
  });
  it("quá khứ, hôm nay trong khung đặt-trước và quá 60 ngày đều không có giờ", async () => {
    expect(await gioTrong(CN, await ngayVN(-1), 60)).toEqual([]);
    expect(await gioTrong(CN, await ngayVN(61), 60)).toEqual([]);
    // Ngày thứ 60 chỉ mở tới đúng giờ-trong-ngày hiện tại (ngưỡng = now()+60 ngày) nên phụ thuộc giờ chạy test; dùng ngày 59 để ổn định.
    expect((await gioTrong(CN, await ngayVN(59), 60)).length).toBeGreaterThan(0);
  });
  it("hết chỗ khi số lịch chạy cùng lúc bằng số chỗ; huỷ thì trống lại", async () => {
    const d = await ngayVN(7);
    const kh = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KHX','A','0911000001',$1,'mkt',$2) returning id`, [CN, NV]))[0].id;
    const them = async (bd: string, kt: string, tt = "da_xac_nhan") => (await q<{ id: string }>(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai) values ($1,$2,$3,$4,$5) returning id`, [kh, CN, luc(d, bd), luc(d, kt), tt]))[0].id;
    const l1 = await them("10:00", "11:00");
    let g = await gioTrong(CN, d, 60);
    expect(g).toContain("10:00"); // còn 1 chỗ trong 2
    await them("10:30", "11:30");
    g = await gioTrong(CN, d, 60);
    expect(g).not.toContain("10:00"); expect(g).not.toContain("10:30"); 
    expect(g).toContain("09:00"); expect(g).toContain("11:30"); // 09:00-10:00 vừa khít, 11:30 sau khi lịch 2 kết thúc
    expect(g).toContain("09:30"); // 09:30-10:30 chỉ đè lịch 10:00-11:00 (lịch 10:30 bắt đầu đúng lúc kết thúc) nên còn 1 chỗ
    expect(g).not.toContain("10:00");
    await db.query(`update lich_hen set trang_thai='huy' where id=$1`, [l1]);
    expect(await gioTrong(CN, d, 60)).toContain("10:00");
  });
  it("chỗ ngừng hoạt động không tính vào sức chứa", async () => {
    await db.query(`update cho_lam set hoat_dong=false where chi_nhanh_id=$1 and ten='Giường 2'`, [CN]);
    const d = await ngayVN(9);
    const kh = (await q<{ id: string }>(`select id from khach_hang limit 1`))[0].id;
    await db.query(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,$3,$4)`, [kh, CN, luc(d, "10:00"), luc(d, "11:00")]);
    expect(await gioTrong(CN, d, 60)).not.toContain("10:00");
    await db.query(`update cho_lam set hoat_dong=true where chi_nhanh_id=$1`, [CN]);
  });
});

describe("gửi yêu cầu: kiểm tra đầu vào", () => {
  it("hợp lệ: chỉ ghi vào yeu_cau_dat_lich, KHÔNG tạo khách, KHÔNG tạo lịch", async () => {
    const [k0, l0] = [(await q<{ n: number }>(`select count(*)::int n from khach_hang`))[0].n, (await q<{ n: number }>(`select count(*)::int n from lich_hen`))[0].n];
    const d = await ngayVN(10);
    await gui({ bd: luc(d, "09:00"), sdt: "0901 234 567", ten: "  Chị   Lan  ", ghi: "Da nhạy cảm" });
    const [y] = await q<Record<string, unknown>>(`select * from yeu_cau_dat_lich where dien_thoai='0901234567'`);
    expect(y).toMatchObject({ ho_ten: "Chị Lan", ghi_chu: "Da nhạy cảm", trang_thai: "cho", thoi_luong_phut: 60, lich_id: null });
    expect((await q<{ n: number }>(`select count(*)::int n from khach_hang`))[0].n).toBe(k0);
    expect((await q<{ n: number }>(`select count(*)::int n from lich_hen`))[0].n).toBe(l0);
  });
  it("số +84 được chuẩn hoá về 0", async () => {
    await gui({ bd: luc(await ngayVN(10), "14:00"), sdt: "+84 912 345 678", ip: IP(2) });
    expect((await q(`select 1 from yeu_cau_dat_lich where dien_thoai='0912345678'`)).length).toBe(1);
  });
  it("từ chối: tên/SĐT/ghi chú sai, liên kết, dịch vụ chưa bật online", async () => {
    const bd = luc(await ngayVN(11), "09:00");
    expect(await goiLoi({ bd, ten: "A" })).toMatch(/họ tên/);
    expect(await goiLoi({ bd, ten: "Xem http://spam.vn" })).toMatch(/họ tên/);
    expect(await goiLoi({ bd, ten: "<b>x</b>" })).toMatch(/họ tên/);
    expect(await goiLoi({ bd, sdt: "12345" })).toMatch(/Số điện thoại/);
    expect(await goiLoi({ bd, sdt: "1900111222" })).toMatch(/Số điện thoại/);
    expect(await goiLoi({ bd, ghi: "vào www.abc.com" })).toMatch(/Ghi chú/);
    expect(await goiLoi({ bd, ghi: "x".repeat(301) })).toMatch(/Ghi chú/);
    expect(await goiLoi({ bd, dv: [DV_TAT] })).toMatch(/chưa nhận đặt online/);
    expect(await goiLoi({ bd, dv: [] })).toMatch(/Chọn từ 1 đến 5/);
    expect(await goiLoi({ bd, dv: [DV1, DV1] })).toMatch(/trùng/);
    expect(await goiLoi({ bd, cn: CN2 })).toMatch(/không còn trống/); // chi nhánh không có chỗ
  });
  it("từ chối: quá khứ, quá 60 ngày, ngoài giờ mở cửa, lệch mốc 30 phút", async () => {
    expect(await goiLoi({ bd: luc(await ngayVN(-1), "10:00") })).toMatch(/đã qua/);
    expect(await goiLoi({ bd: luc(await ngayVN(61), "10:00") })).toMatch(/60 ngày/);
    expect(await goiLoi({ bd: luc(await ngayVN(12), "07:00") })).toMatch(/không còn trống/);
    expect(await goiLoi({ bd: luc(await ngayVN(12), "19:30") })).toMatch(/không còn trống/); // 60 phút vượt giờ đóng
    expect(await goiLoi({ bd: luc(await ngayVN(12), "10:15") })).toMatch(/không còn trống/);
  });
  it("công tắc tắt thì không nhận", async () => {
    await bat("0");
    expect(await goiLoi({ bd: luc(await ngayVN(13), "10:00") })).toMatch(/chưa mở/);
    await bat("1");
  });
  it("thiếu/ngắn dấu vết IP thì từ chối", async () => {
    expect(await goiLoi({ bd: luc(await ngayVN(13), "10:00"), ip: "abc" })).toMatch(/Chưa gửi được/);
  });
});

describe("giới hạn tốc độ", () => {
  it("tối đa 3 yêu cầu chờ xác nhận mỗi số điện thoại, không đếm lộ khách cũ", async () => {
    for (let i = 0; i < 3; i++) await gui({ bd: luc(await ngayVN(20 + i), "10:00"), sdt: "0933000111", ip: IP(30 + i) });
    const e = await goiLoi({ bd: luc(await ngayVN(25), "10:00"), sdt: "0933000111", ip: IP(40) });
    expect(e).toMatch(/đang có yêu cầu chờ/);
    expect(e).not.toMatch(/khách|đã đăng ký|tồn tại/i);
  });
  it("cùng số điện thoại không đặt hai yêu cầu chồng giờ", async () => {
    await gui({ bd: luc(await ngayVN(30), "10:00"), sdt: "0944000111", ip: IP(41) });
    expect(await goiLoi({ bd: luc(await ngayVN(30), "10:30"), sdt: "0944000111", ip: IP(42) })).toMatch(/khung giờ đó/);
  });
  it("tối đa 10 yêu cầu mỗi giờ cho một IP", async () => {
    for (let i = 0; i < 10; i++) await gui({ bd: luc(await ngayVN(35), "10:00"), sdt: `09550001${String(i).padStart(2, "0")}`, ip: IP(99) });
    expect(await goiLoi({ bd: luc(await ngayVN(36), "10:00"), sdt: "0955000199", ip: IP(99) })).toMatch(/quá nhiều lần/);
    // IP khác vẫn gửi được; IP cũ gửi được lại khi bản ghi cũ hơn 1 giờ
    await gui({ bd: luc(await ngayVN(36), "10:00"), sdt: "0955000198", ip: IP(98) });
    await db.query(`update yeu_cau_dat_lich set tao_luc = now() - interval '2 hours' where ip_bam=$1`, [IP(99)]);
    await gui({ bd: luc(await ngayVN(36), "11:00"), sdt: "0955000197", ip: IP(99) });
  });
  it("tối đa 60 yêu cầu mỗi giờ toàn hệ thống", async () => {
    await db.query(`update yeu_cau_dat_lich set trang_thai='tu_choi'`);
    const n = (await q<{ n: number }>(`select count(*)::int n from yeu_cau_dat_lich where tao_luc > now() - interval '1 hour'`))[0].n;
    const kd = await q<{ id: string }>(`select id from dich_vu where ma='D60'`);
    await db.query(`insert into yeu_cau_dat_lich (chi_nhanh_id, dich_vu_ids, bat_dau, thoi_luong_phut, ho_ten, dien_thoai, ip_bam, trang_thai)
      select $1, array[$2::uuid], now() + interval '40 days', 60, 'Bot', '0966' || lpad(g::text, 6, '0'), 'iphash' || lpad(g::text, 8, '0'), 'tu_choi' from generate_series(1, $3) g`, [CN, kd[0].id, 60 - n]);
    expect(await goiLoi({ bd: luc(await ngayVN(40), "10:00"), sdt: "0977000111", ip: IP(77) })).toMatch(/quá nhiều yêu cầu/);
  });
});

describe("phân quyền: trang công khai không đọc/ghi trực tiếp", () => {
  it("anon/authenticated không đụng được bảng và hàm", async () => {
    await expect(chayVoiKhach(db, "select * from public.yeu_cau_dat_lich")).rejects.toThrow(/permission denied/);
    await expect(chayVoiKhach(db, "select * from public.cho_lam")).rejects.toThrow(/permission denied/);
    await expect(chayVoiKhach(db, "select public.gio_trong_online(null, current_date, 60)")).rejects.toThrow(/permission denied/);
    await expect(chayVoiTu(db, { sub: "00000000-0000-0000-0000-000000000009" }, "select public.gui_yeu_cau_dat_lich(null,null,null,'a','b','c','d')")).rejects.toThrow(/permission denied/);
  });
});

describe("lễ tân duyệt yêu cầu", () => {
  beforeAll(async () => { await db.query(`update yeu_cau_dat_lich set trang_thai='tu_choi', tao_luc = now() - interval '3 hours'`); });
  const moi = async (sdt: string, ngay: number, gio = "15:00", ten = "Chị Mới") => {
    await gui({ bd: luc(await ngayVN(ngay), gio), sdt, ten, ip: IP(500 + ngay) });
    return (await q<{ id: string }>(`select id from yeu_cau_dat_lich where dien_thoai=$1 order by tao_luc desc limit 1`, [sdt]))[0].id;
  };
  it("số điện thoại mới: tạo khách + lịch chưa xác nhận nguồn ONLINE + dịch vụ", async () => {
    await db.query(`update yeu_cau_dat_lich set trang_thai='tu_choi'`);
    const id = await moi("0988000001", 15);
    const lich = (await q<{ duyet_yeu_cau_dat_lich: string }>(`select public.duyet_yeu_cau_dat_lich($1,$2)`, [id, NV]))[0].duyet_yeu_cau_dat_lich;
    const [l] = await q<Record<string, unknown>>(`select l.trang_thai, l.nguon, l.ghi_chu, k.ho_ten, k.nguon k_nguon from lich_hen l join khach_hang k on k.id=l.khach_id where l.id=$1`, [lich]);
    expect(l).toMatchObject({ trang_thai: "chua_xac_nhan", nguon: "ONLINE", ho_ten: "Chị Mới", k_nguon: "mkt" });
    expect((await q(`select 1 from lich_hen_dich_vu where lich_id=$1 and dich_vu_id=$2`, [lich, DV1])).length).toBe(1);
    expect((await q(`select 1 from yeu_cau_dat_lich where id=$1 and trang_thai='da_duyet' and lich_id=$2 and xu_ly_boi=$3`, [id, lich, NV])).length).toBe(1);
  });
  it("số điện thoại đã là khách: gắn vào khách cũ, không sửa tên, không tạo khách mới", async () => {
    await db.query(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KHC','Khách Cũ','0988000002',$1,'mkt',$2)`, [CN, NV]);
    const truoc = (await q<{ n: number }>(`select count(*)::int n from khach_hang`))[0].n;
    const id = await moi("0988000002", 16, "15:00", "Tên Khác");
    const lich = (await q<{ d: string }>(`select public.duyet_yeu_cau_dat_lich($1,$2) d`, [id, NV]))[0].d;
    expect((await q<{ n: number }>(`select count(*)::int n from khach_hang`))[0].n).toBe(truoc);
    const [l] = await q<Record<string, unknown>>(`select k.ho_ten, l.ghi_chu from lich_hen l join khach_hang k on k.id=l.khach_id where l.id=$1`, [lich]);
    expect(l.ho_ten).toBe("Khách Cũ"); expect(String(l.ghi_chu)).toContain("Tên khách ghi: Tên Khác");
  });
  it("không duyệt hai lần; hết chỗ thì từ chối duyệt; giờ đã qua thì từ chối duyệt", async () => {
    const id = await moi("0988000003", 17);
    await db.query(`select public.duyet_yeu_cau_dat_lich($1,$2)`, [id, NV]);
    expect(await loi(`select public.duyet_yeu_cau_dat_lich($1,$2)`, [id, NV])).toMatch(/đã được xử lý/);
    const id2 = await moi("0988000004", 18);
    const kh = (await q<{ id: string }>(`select id from khach_hang limit 1`))[0].id;
    const d = await ngayVN(18);
    await db.query(`insert into lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc) values ($1,$2,$3,$4), ($1,$2,$3,$4)`, [kh, CN, luc(d, "15:00"), luc(d, "16:00")]);
    expect(await loi(`select public.duyet_yeu_cau_dat_lich($1,$2)`, [id2, NV])).toMatch(/hết chỗ/);
    const id3 = await moi("0988000005", 19);
    await db.query(`update yeu_cau_dat_lich set bat_dau = now() - interval '1 hour' where id=$1`, [id3]);
    expect(await loi(`select public.duyet_yeu_cau_dat_lich($1,$2)`, [id3, NV])).toMatch(/đã qua/);
  });
});
