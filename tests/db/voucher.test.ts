import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { tinhGiamVoucher } from "../../src/lib/ban-hang";

// 0080: voucher ở thu ngân. Kiểm: tính tiền giảm (DB khớp với hàm TypeScript của giao diện), hết hạn / chưa tới ngày / quá lượt / sai chi nhánh / tắt,
// tiền gửi lên lệch thì không chốt, lỗi thì không ghi lượt, huỷ đơn hoàn lượt đúng một lần, đơn không voucher tính y hệt trước.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const loi = async (sql: string, p: unknown[] = []) => { try { await db.query(sql, p); } catch (e) { return (e as Error).message; } return ""; };
let CN: string, CN2: string, KH: string, DV: string, SP: string;
const NV = u(1);
const ngay = (lech: number) => new Date(Date.now() + lech * 86400000 + 7 * 3600000).toISOString().slice(0, 10);

type Dong = { loai: "dich_vu" | "san_pham"; sl: number; gia: number; giam?: number };
/** Tạo đơn nháp như máy chủ: giam_gia_don đã gồm tiền voucher (và phần giảm tay), có thanh toán đủ. */
async function taoDon(dong: Dong[], giamDon: number, chi = CN) {
  const h = (await q<{ id: string }>(`insert into hoa_don (ma, chi_nhanh_id, khach_id, nguoi_lap_id, giam_gia_don) values ('HD'||lpad(so_tiep_theo('hd')::text,6,'0'),$1,$2,$3,$4) returning id`, [chi, KH, NV, giamDon]))[0].id;
  let hang = 0;
  for (const d of dong) {
    await q(`insert into hoa_don_dong (hoa_don_id, loai, dich_vu_id, san_pham_id, ten, so_luong, don_gia, giam_gia) values ($1,$2,$3,$4,'x',$5,$6,$7)`,
      [h, d.loai, d.loai === "dich_vu" ? DV : null, d.loai === "san_pham" ? SP : null, d.sl, d.gia, d.giam ?? 0]);
    hang += d.sl * d.gia - (d.giam ?? 0);
  }
  await q(`insert into thanh_toan (hoa_don_id, loai, phuong_thuc, so_tien, nguoi_id) values ($1,'thu','tien_mat',$2,$3)`, [h, hang - giamDon, NV]);
  return h;
}
type PV = { ten?: string; loai_giam?: string; gia_tri?: number; giam_toi_da?: number | null; gioi_han?: string; don_toi_thieu?: number; so_luong?: number; loai_ma?: string; tu_ngay?: string; den_ngay?: string; cn?: string[] | null; hang?: string[] | null; moi_cu?: string | null; so_lan_khach?: number | null; thu?: number[] | null; khoa?: boolean };
/** Tạo voucher + một mã (mặc định hiệu lực hôm qua → ngày mai, mọi chi nhánh, 1 mã dùng nhiều lần). Trả id voucher. */
const taoVoucher = async (ma: string, p: PV = {}) => {
  const id = (await q<{ id: string }>(`insert into voucher (ten, tu_ngay, den_ngay, loai_giam, gia_tri, giam_toi_da, so_luong, loai_ma, gioi_han, don_toi_thieu, so_lan_toi_da_khach, hang_khach, khach_moi_cu, chi_nhanh_ids, ngay_trong_tuan, bi_khoa)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning id`,
    [p.ten ?? "Thử", p.tu_ngay ?? ngay(-1), p.den_ngay ?? ngay(1), p.loai_giam ?? "phan_tram", p.gia_tri ?? 10, p.giam_toi_da ?? null, p.so_luong ?? 1000, p.loai_ma ?? "mot_ma", p.gioi_han ?? "tong_don",
      p.don_toi_thieu ?? 0, p.so_lan_khach ?? null, p.hang ?? null, p.moi_cu ?? null, p.cn ?? null, p.thu ?? null, p.khoa ?? false]))[0].id;
  await q(`insert into voucher_ma (voucher_id, ma) values ($1,$2)`, [id, ma]);
  return id;
};
const luot = async (vid: string) => (await q<{ d: number; h: number }>(`select count(*) filter (where loai='dung')::int d, count(*) filter (where loai='hoan')::int h from voucher_luot_dung where voucher_id=$1`, [vid]))[0];
const tt = async (h: string) => (await q<{ trang_thai: string; giam_voucher: string; giam_gia_don: string; tong_phai_thu: string }>(`select trang_thai, giam_voucher::text, giam_gia_don::text, tong_phai_thu::text from hoa_don where id=$1`, [h]))[0];
const chot = (h: string, ma: string, tien: number, diem = 0, tienDiem = 0) => loi(`select chot_hoa_don_voucher($1,$2,$3,$4,$5,$6)`, [h, NV, ma, tien, diem, tienDiem]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  // 0214 tự cộng điểm khi chốt đơn; file này chỉ kiểm voucher + cơ chế ĐỔI điểm nên tắt tích điểm để số dư không bị cộng thêm từ các đơn trước.
  await q(`insert into cau_hinh (khoa, gia_tri) values ('diem.tich_bat','0') on conflict (khoa) do update set gia_tri='0'`);
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  CN2 = (await q<{ id: string }>(`insert into chi_nhanh (ma, ten) values ('DL','Đà Lạt') returning id`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Thu Ngân','thu_ngan',$2)`, [NV, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id, ngay_sinh) values ('KH1','Khách','0900000001',$1,'mkt',$2,'1990-01-01') returning id`, [CN, NV]))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('PEEL01',$1,'Peel',1000000) returning id`, [nhom]))[0].id;
  SP = (await q<{ id: string }>(`insert into san_pham (ma, ten, gia_ban, ban_le, don_vi) values ('SP01','Kem',500000,true,'hộp') returning id`))[0].id;
});

describe("tiền giảm voucher: DB và giao diện cùng một công thức", () => {
  const dong = [{ loai: "dich_vu" as const, thanh: 1_000_000 }, { loai: "san_pham" as const, thanh: 333_333 }];
  const cac = [
    { loai_giam: "phan_tram", gia_tri: 10, giam_toi_da: null, gioi_han: "tong_don" },
    { loai_giam: "phan_tram", gia_tri: 12.5, giam_toi_da: null, gioi_han: "san_pham" },
    { loai_giam: "phan_tram", gia_tri: 50, giam_toi_da: 100_000, gioi_han: "tong_don" },
    { loai_giam: "tien", gia_tri: 200_000, giam_toi_da: null, gioi_han: "dich_vu" },
    { loai_giam: "tien", gia_tri: 900_000, giam_toi_da: null, gioi_han: "san_pham" },
    { loai_giam: "tien", gia_tri: 5_000_000, giam_toi_da: null, gioi_han: "dich_vu_san_pham" },
    { loai_giam: "tien", gia_tri: 100_000, giam_toi_da: null, gioi_han: "the" },
  ] as const;
  it.each(cac)("khớp nhau: %o", async (c) => {
    const vid = await taoVoucher("T" + Math.random().toString(36).slice(2, 8).toUpperCase(), c);
    const h = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }, { loai: "san_pham", sl: 1, gia: 333_333 }], 0);
    const db1 = Number((await q<{ t: string }>(`select tinh_giam_voucher($1,$2)::text t`, [vid, h]))[0].t);
    expect(tinhGiamVoucher({ ...c, giam_toi_da: c.giam_toi_da }, dong)).toBe(db1);
  });
  it("số cụ thể", async () => {
    expect(tinhGiamVoucher({ loai_giam: "phan_tram", gia_tri: 10, giam_toi_da: null, gioi_han: "tong_don" }, dong)).toBe(133_333);
    expect(tinhGiamVoucher({ loai_giam: "tien", gia_tri: 900_000, giam_toi_da: null, gioi_han: "san_pham" }, dong)).toBe(333_333);
    expect(tinhGiamVoucher({ loai_giam: "phan_tram", gia_tri: 50, giam_toi_da: 100_000, gioi_han: "tong_don" }, dong)).toBe(100_000);
    expect(tinhGiamVoucher({ loai_giam: "tien", gia_tri: 100_000, giam_toi_da: null, gioi_han: "the" }, dong)).toBe(0);
  });
});

describe("chốt đơn có voucher", () => {
  it("mã chỉ gồm chữ in hoa và số, không trùng; % không quá 100", async () => {
    await taoVoucher("TRUNG1");
    const id = (await q<{ id: string }>(`select voucher_id id from voucher_ma where ma='TRUNG1'`))[0].id;
    expect(await loi(`insert into voucher_ma (voucher_id, ma) values ($1,'abc')`, [id])).toMatch(/voucher_ma_ma_check/);
    expect(await loi(`insert into voucher_ma (voucher_id, ma) values ($1,'AB-CD')`, [id])).toMatch(/voucher_ma_ma_check/);
    expect(await loi(`insert into voucher_ma (voucher_id, ma) values ($1,'TRUNG1')`, [id])).toMatch(/voucher_ma_uq|duplicate/);
    expect(await loi(`insert into voucher (ten, tu_ngay, den_ngay, loai_giam, gia_tri, so_luong, loai_ma) values ('x','2026-01-01','2026-02-01','phan_tram',101,1,'mot_ma')`)).toMatch(/voucher_phan_tram_hop_le/);
    expect(await loi(`insert into voucher (ten, tu_ngay, den_ngay, loai_giam, gia_tri, so_luong, loai_ma) values ('x','2026-03-01','2026-02-01','tien',5,1,'mot_ma')`)).toMatch(/voucher_ngay_hop_le/);
  });
  it("hợp lệ: ghi lượt, giam_voucher, tổng tiền đúng; huỷ hoàn lượt đúng một lần", async () => {
    const v = await taoVoucher("GIAM10");
    const h = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 100_000);
    expect(await chot(h, " giam10 ", 100_000)).toBe("");
    expect(await tt(h)).toEqual({ trang_thai: "hoan_thanh", giam_voucher: "100000", giam_gia_don: "100000", tong_phai_thu: "900000" });
    expect(await luot(v)).toEqual({ d: 1, h: 0 });
    await q(`select huy_hoa_don($1,'Khách đổi ý',$2)`, [h, NV]);
    expect(await luot(v)).toEqual({ d: 1, h: 1 });
    await q(`update hoa_don set ghi_chu='x' where id=$1`, [h]);
    expect(await luot(v)).toEqual({ d: 1, h: 1 });
  });
  it("tiền gửi lên lệch: không chốt, không ghi lượt", async () => {
    const v = await taoVoucher("LECH10");
    const h = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 200_000);
    expect(await chot(h, "LECH10", 200_000)).toMatch(/không khớp \(máy chủ tính 100000/);
    expect(await luot(v)).toEqual({ d: 0, h: 0 });
    expect((await tt(h)).trang_thai).toBe("nhap");
  });
  it("không có / khoá / hết hạn / chưa tới ngày / sai chi nhánh / sai thứ / đơn tối thiểu", async () => {
    const h = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 100_000);
    expect(await chot(h, "KHONGCO", 100_000)).toMatch(/không tồn tại/);
    await taoVoucher("TATROI", { khoa: true });
    expect(await chot(h, "TATROI", 100_000)).toMatch(/bị khoá/);
    await taoVoucher("HETHAN", { tu_ngay: ngay(-9), den_ngay: ngay(-1) });
    expect(await chot(h, "HETHAN", 100_000)).toMatch(/hết hạn/);
    await taoVoucher("CHUATOI", { tu_ngay: ngay(2), den_ngay: ngay(5) });
    expect(await chot(h, "CHUATOI", 100_000)).toMatch(/chưa đến ngày/);
    await taoVoucher("DALAT", { cn: [CN2] });
    expect(await chot(h, "DALAT", 100_000)).toMatch(/không áp dụng cho chi nhánh/);
    const homNay = (await q<{ d: number }>(`select extract(isodow from hom_nay())::int d`))[0].d;
    await taoVoucher("SAITHU", { thu: [(homNay % 7) + 1] });
    expect(await chot(h, "SAITHU", 100_000)).toMatch(/ngày hôm nay trong tuần/);
    await taoVoucher("TOITHIEU", { don_toi_thieu: 2_000_000 });
    expect(await chot(h, "TOITHIEU", 100_000)).toMatch(/từ 2000000/);
    await taoVoucher("TRONGHAN", { cn: [CN, CN2], thu: [homNay] });
    expect(await chot(h, "TRONGHAN", 100_000)).toBe("");
  });
  it("giới hạn áp dụng: voucher dịch vụ mà đơn chỉ có sản phẩm thì không áp dụng được", async () => {
    await taoVoucher("CHIDV", { gioi_han: "dich_vu" });
    const h = await taoDon([{ loai: "san_pham", sl: 1, gia: 500_000 }], 0);
    expect(await chot(h, "CHIDV", 0)).toMatch(/không áp dụng được/);
  });
  it("1 mã dùng nhiều lần: số lượng phát hành là số lượt; lượt cuối được, lượt sau bị chặn; huỷ trả lượt", async () => {
    const v = await taoVoucher("HAI", { loai_giam: "tien", gia_tri: 50_000, so_luong: 2 });
    const don = () => taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 50_000);
    const h1 = await don(), h2 = await don(), h3 = await don();
    expect(await chot(h1, "HAI", 50_000)).toBe("");
    expect(await chot(h2, "HAI", 50_000)).toBe("");
    expect(await chot(h3, "HAI", 50_000)).toMatch(/hết mã/);
    expect(await luot(v)).toEqual({ d: 2, h: 0 });
    await q(`select huy_hoa_don($1,'Huỷ',$2)`, [h1, NV]);
    expect(await chot(h3, "HAI", 50_000)).toBe("");
    expect(await luot(v)).toEqual({ d: 3, h: 1 });
  });
  it("nhiều mã (mỗi mã 1 lần): mã dùng rồi thì chặn, mã khác của cùng voucher vẫn dùng được", async () => {
    const v = await taoVoucher("NM0001", { loai_giam: "tien", gia_tri: 50_000, so_luong: 2, loai_ma: "nhieu_ma" });
    await q(`insert into voucher_ma (voucher_id, ma) values ($1,'NM0002'), ($1,'NM0003')`, [v]);
    const don = () => taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 50_000);
    const [a, b, c, d] = [await don(), await don(), await don(), await don()];
    expect(await chot(a, "NM0001", 50_000)).toBe("");
    expect(await chot(b, "NM0001", 50_000)).toMatch(/hết mã/);
    expect(await chot(c, "NM0002", 50_000)).toBe("");
    expect(await chot(d, "NM0003", 50_000)).toMatch(/hết mã/);   // đã phát hành 2 mã dùng hết 2 lượt
  });
  it("mỗi khách tối đa N lần; hạng khách; khách mới/cũ", async () => {
    await taoVoucher("MOT1KHACH", { loai_giam: "tien", gia_tri: 10_000, so_lan_khach: 1 });
    const a = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 10_000), b = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 10_000);
    expect(await chot(a, "MOT1KHACH", 10_000)).toBe("");
    expect(await chot(b, "MOT1KHACH", 10_000)).toMatch(/đã dùng voucher MOT1KHACH đủ 1 lần/);
    await taoVoucher("HANGVANG", { loai_giam: "tien", gia_tri: 10_000, hang: ["Vàng", "Bạch kim"] });
    expect(await chot(b, "HANGVANG", 10_000)).toMatch(/không áp dụng cho hạng khách này/);
    await taoVoucher("KHACHMOI", { loai_giam: "tien", gia_tri: 10_000, moi_cu: "moi" });
    expect(await chot(b, "KHACHMOI", 10_000)).toMatch(/chỉ áp dụng cho khách mới/);   // khách này đã có hoá đơn hoàn thành
    await taoVoucher("KHACHCU", { loai_giam: "tien", gia_tri: 10_000, moi_cu: "cu" });
    expect(await chot(b, "KHACHCU", 10_000)).toBe("");
  });
  it("sổ lượt chỉ thêm dòng; mỗi hoá đơn một dòng dùng", async () => {
    expect(await loi(`update voucher_luot_dung set so_tien = 1`)).toMatch(/chỉ được thêm dòng/);
    expect(await loi(`delete from voucher_luot_dung`)).toMatch(/chỉ được thêm dòng/);
    const l = (await q<{ voucher_id: string; ma_id: string; hoa_don_id: string }>(`select voucher_id, ma_id, hoa_don_id from voucher_luot_dung where loai='dung' limit 1`))[0];
    expect(await loi(`insert into voucher_luot_dung (voucher_id, ma_id, hoa_don_id, loai, so_tien) values ($1,$2,$3,'dung',1)`, [l.voucher_id, l.ma_id, l.hoa_don_id])).toMatch(/voucher_luot_hd_loai_uq|duplicate/);
  });
  it("voucher + đổi điểm cùng đơn: trừ điểm, ghi lượt, đủ tổng; không đủ điểm thì không ghi lượt", async () => {
    await q(`insert into khach_diem_so (khach_id, loai, so_diem) values ($1,'dieu_chinh',30)`, [KH]);
    const v = await taoVoucher("KEMDIEM", { loai_giam: "tien", gia_tri: 100_000 });
    const hSai = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 100_000 + 400_000);
    expect(await chot(hSai, "KEMDIEM", 100_000, 40, 400_000)).toMatch(/chỉ còn 30 điểm/);
    expect(await luot(v)).toEqual({ d: 0, h: 0 });
    const h = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 100_000 + 200_000);
    expect(await chot(h, "KEMDIEM", 100_000, 20, 200_000)).toBe("");
    expect(await luot(v)).toEqual({ d: 1, h: 0 });
    const r = (await q<{ giam_voucher: string; giam_diem: string; giam_gia_don: string }>(`select giam_voucher::text, giam_diem::text, giam_gia_don::text from hoa_don where id=$1`, [h]))[0];
    expect(r).toEqual({ giam_voucher: "100000", giam_diem: "200000", giam_gia_don: "300000" });
    const h2 = await taoDon([{ loai: "dich_vu", sl: 1, gia: 1_000_000 }], 250_000);
    expect(await chot(h2, "KEMDIEM", 100_000, 20, 200_000)).toMatch(/nhỏ hơn tổng voucher/);
  });
  it("đơn không dùng voucher: chốt và tính y hệt trước (mã rỗng đi thẳng sang chốt thường)", async () => {
    const h = await taoDon([{ loai: "dich_vu", sl: 2, gia: 1_000_000 }, { loai: "san_pham", sl: 1, gia: 500_000, giam: 50_000 }], 150_000);
    expect(await chot(h, "", 0)).toBe("");
    expect(await tt(h)).toEqual({ trang_thai: "hoan_thanh", giam_voucher: "0", giam_gia_don: "150000", tong_phai_thu: "2300000" });
    expect((await q<{ n: number }>(`select count(*)::int n from voucher_luot_dung where hoa_don_id=$1`, [h]))[0].n).toBe(0);
  });
});
