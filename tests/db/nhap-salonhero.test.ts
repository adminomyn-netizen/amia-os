/* eslint-disable @typescript-eslint/no-explicit-any -- kiểm thử đọc hàng SQL tuỳ ý, gõ kiểu từng cột chỉ tốn chữ */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";
import { doiChieu, nhap } from "../../scripts/nhap-salonhero/nhap.mjs";

// Dữ liệu GIẢ (không phải dữ liệu thật của AMIA) mô phỏng đúng hình dạng xuất từ SalonHero, gồm các ca khó đã gặp ở dữ liệu thật:
// SĐT trống / trùng, mã khách trùng, thẻ không giới hạn buổi, thẻ của khách không còn trong danh sách, đơn nợ đã thu một phần.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const CHU = u(1);
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];

const khach = (id: number, o: Record<string, unknown> = {}) => ({ id, code: `KHAVI${id}`, full_name: ` Khách ${id}`, mobile: `090 000 ${String(id).padStart(4, "0")}`, zalo: "", email: "", gender: "F", rank: "NORMAL", loyalty_point: 0, tags: [], location_names: "Amia Beauty Center TP Vinh", ...o });
const DATA = {
  khach: [
    khach(1, { rank: "GOLD", loyalty_point: 29, tags: [{ tag_name: "HẾT LIỆU TRÌNH" }] }),
    khach(2, { mobile: "" }),                       // SĐT trống
    khach(3, { mobile: "090 000 0001", code: "KHAVI1" }), // trùng SĐT + trùng mã với khách 1
    khach(4, { gender: "M", location_names: "Amia Beauty Center Đà Lạt" }),
  ],
  khach_chi_tiet: {
    1: { full_name: "Nguyễn Thị A", dob_year: 1992, dob_month: 2, dob_date: 15, address: "1 Lê Lợi", district_name: "Vinh", city_name: "Nghệ An", note: "KHAI THÁC THÔNG TIN NGÀY 1/1: da nhạy cảm", refer_source: "Fanpage Amia", total_paid_amount: 19095000, number_visited: 11, last_visited: "2023-07-19T06:14:39.000Z", createdAt: "2020-10-15T07:46:17.000Z", init_location_id: 8377 },
    2: { full_name: "Trần B", dob_year: 0, dob_month: 0, dob_date: 0, refer_source: "Bạn bè giới thiệu", createdAt: "2021-01-01T00:00:00.000Z" },
    3: { full_name: "Lê C", dob_year: 1990, dob_month: 6, dob_date: 1, createdAt: "2021-02-02T00:00:00.000Z" },
    4: { full_name: "Phạm D", createdAt: "2022-03-03T00:00:00.000Z", init_location_id: 9202 },
  } as Record<number, unknown>,
  loai_the: [
    { id: 11, card_name: "Triệt lông Bikini", card_type: "USING", sale_price: 2990000, use_limit: 10, default_account_balance: 0, time_limit: 12, time_limit_by_day: 0, is_deleted: 0 },
    { id: 12, card_name: "Thẻ tiền 5tr", card_type: "MONEY", sale_price: 5000000, use_limit: 0, default_account_balance: 6000000, time_limit: 0, time_limit_by_day: 0, is_deleted: 0 },
  ],
  the: [
    { id: 101, customer_id: 1, card_id: 11, card_name: "Triệt lông Bikini", card_type: "USING", card_sale_price: 2990000, card_use_price: 299000, use_limit: 10, use_count: 3, account_balance: 0, card_default_account_balance: 0, code: "M1001", created_at: "2024-01-05T05:23:29.000Z", expiry_date: "2099-10-15T16:59:59.000Z", is_deleted: 0, is_locked: 0, is_revoked: 0, init_location_id: 8377 },
    { id: 102, customer_id: 1, card_id: 12, card_name: "Thẻ tiền 5tr", card_type: "MONEY", card_sale_price: 5000000, card_use_price: 0, use_limit: 0, use_count: 0, account_balance: 1250000, card_default_account_balance: 6000000, code: "M1002", created_at: "2024-02-05T05:23:29.000Z", expiry_date: null, is_deleted: 0, is_locked: 0, is_revoked: 0, init_location_id: 8377 },
    { id: 103, customer_id: 2, card_id: 99, card_name: "Thẻ cũ không còn trong danh mục", card_type: "USING", card_sale_price: 1200000, card_use_price: 0, use_limit: 999999, use_count: 13, account_balance: 0, card_default_account_balance: 0, code: "M1003", created_at: "2023-01-05T05:23:29.000Z", expiry_date: "2031-05-17T02:09:38.000Z", is_deleted: 0, is_locked: 0, is_revoked: 0, init_location_id: 8377 },
    { id: 104, customer_id: 777, customer_fullname: "Khách đã xoá", customer_phone: "0988888888", customer_code: "KHAVI777", card_id: 11, card_name: "Triệt lông Bikini", card_type: "USING", card_sale_price: 2990000, card_use_price: 0, use_limit: 10, use_count: 0, account_balance: 0, card_default_account_balance: 0, code: "M1004", created_at: "2024-01-05T05:23:29.000Z", expiry_date: null, is_deleted: 0, is_locked: 0, is_revoked: 0, init_location_id: 8377 }, // khách không còn
    { id: 105, customer_id: 4, card_id: 11, card_name: "Triệt lông Bikini", card_type: "USING", card_sale_price: 2990000, card_use_price: 0, use_limit: 10, use_count: 10, account_balance: 0, card_default_account_balance: 0, code: "M1005", created_at: "2024-01-05T05:23:29.000Z", expiry_date: null, is_deleted: 0, is_locked: 1, is_revoked: 0, init_location_id: 9202 },
  ],
  dich_vu: [{ id: 501, sku: "CSDCB.01", name: "AC Facial", group_name: "CHĂM SÓC DA CƠ BẢN", service_duration: 60, default_price: 1300000, import_price: 0, is_active: 1, is_deleted: 0 },
            { id: 502, sku: "DV502", name: "Thẻ vỏ", group_name: "Thẻ thành viên", service_duration: 0, default_price: 0, import_price: 0, is_active: 1, is_deleted: 0 }],
  san_pham: [{ id: 601, sku: "8699514350118", name: "Kem dưỡng", group_name: "Mỹ phẩm khác", unit_1: 13, unit_2: 0, capacity: 0, import_price: 100000, default_price: 590000, is_active: 1, is_deleted: 0 }],
  nhom: {},
  nhan_vien: [{ id: 701, name: "Bác sĩ Huyền", title: "Bác sĩ", phone: "0911111111", email: "", location_id: 8377, is_active: 1, is_deleted: 0 },
              { id: 702, name: "Trị liệu viên Mai", title: "Nhân viên trị liệu", phone: "", email: "", location_id: 9202, is_active: 1, is_deleted: 0 }],
  no: [
    { customer_id: 1, order_id: 9001, order_code: "24020453", location_id: 8377, total: 1570000, order_date: "2024-02-20T07:47:41.000Z", payment: 1540000, payment_debt: 0 },        // còn 30.000
    { customer_id: 2, order_id: 9002, order_code: "24020454", location_id: 8377, total: 5000000, order_date: "2024-03-01T07:47:41.000Z", payment: 3000000, payment_debt: 2000000 },  // đã thu đủ sau đó → không nợ
    { customer_id: 888, order_id: 9003, order_code: "24020455", location_id: 8377, total: 700000, order_date: "2024-03-01T07:47:41.000Z", payment: 0, payment_debt: 0 },             // khách không còn
  ],
  ton_kho: [{ product_id: 601, location_id: 8377, quantity: 7, purchase_price: 100000 }, { product_id: 601, location_id: 9202, quantity: 0, purchase_price: 0 }],
  don_vi: { u1: ["Chai", "Hộp", "Lọ", "Thùng", "Gói", "Tá", "Khay", "Cái", "Chiếc", "Túi", "Viên", "Tấm", "Miếng", "Tuýp"], u2: ["ml", "L"] },
};

beforeAll(async () => {
  db = await taoDbVoiMigration();
  // Migration 0335 đã đóng Đà Lạt (chặn gắn dòng mới); test này cố ý dựng dữ liệu lịch sử ở Đà Lạt nên mở lại trong DB thử.
  await db.query(`update chi_nhanh set hoat_dong = true where ma = 'DALAT'`);
  await q(`insert into auth.users (id) values ('${u(900)}')`);
  await q(`insert into nhan_vien (id, user_id, ho_ten, vai_tro) values ('${CHU}', '${u(900)}', 'Quản lý', 'quan_ly')`);
});

describe("nhập dữ liệu SalonHero", () => {
  let kq: Record<string, any>;
  it("nhập chạy trọn và báo đúng các ca bỏ / gắn cờ", async () => {
    kq = await nhap(db, DATA);
    expect(kq.khach).toMatchObject({ nguon: 4, dung_lai_tu_the: 1, them_moi: 5, sdt_trong: 1, sdt_trung: 1, ma_trung: 1 });
    expect(kq.the).toMatchObject({ nguon: 5, them_moi: 5, bo_vi_khong_co_khach: 0 });
    expect(kq.no).toMatchObject({ don_con_no: 1, them_moi: 1, bo_vi_khong_co_khach: 1, so_tien_bi_bo: 700000 });
    expect(kq.goi_the_chi_con_trong_the_khach).toBe(1);
  });
  it("số liệu đối chiếu với chính nguồn khớp từng đồng", async () => {
    const ds = await doiChieu(db, DATA);
    for (const d of ds) expect(d, d.muc).toMatchObject({ khop: true });
    expect(ds.find((d: { muc: string }) => d.muc.startsWith("Tổng công nợ"))).toMatchObject({ amia: 30000 });
    expect(ds.find((d: { muc: string }) => d.muc.startsWith("Tổng buổi còn"))).toMatchObject({ amia: 17 });
    expect(ds.find((d: { muc: string }) => d.muc.startsWith("Tổng số dư thẻ tiền"))).toMatchObject({ amia: 1250000 });
  });
  it("chạy lại không nhân đôi bản ghi nào", async () => {
    const l2 = await nhap(db, DATA);
    expect(l2.khach.them_moi).toBe(0);
    expect(l2.khach.dung_lai_tu_the).toBe(1);
    expect(l2.the.them_moi).toBe(0);
    expect(l2.no.them_moi).toBe(0);
    expect(l2.ton_kho.them_moi).toBe(0);
    expect((await one<{ n: string }>(`select count(*)::text n from the_so_cai where ghi_chu like '%SalonHero%'`)).n).toBe("8"); // 101: cấp + đã dùng · 102: cấp · 103: cấp + đã dùng · 104: cấp · 105: cấp + đã dùng
  });
  it("hồ sơ khách: mã, SĐT trùng/trống, hạng gốc, ghi chú điều trị, chi nhánh", async () => {
    const k1 = await one<any>(`select * from v_khach_hang where sh_id = 1`);
    expect(k1).toMatchObject({ ma: "KHAVI1", ho_ten: "Nguyễn Thị A", dien_thoai: "0900000001", hang: "Vàng", gioi_tinh: "nữ", ngay_sinh: expect.anything(), nguon: "mkt" });
    expect(k1.ghi_chu).toContain("HẾT LIỆU TRÌNH");
    const k3 = await one<any>(`select * from khach_hang where sh_id = 3`);
    expect(k3.ma).toBe("KHAVI1-3");
    expect(k3.dien_thoai).toBe("0900000001-TRUNG3");
    expect(k3.ghi_chu).toContain("trùng");
    expect((await one<any>(`select dien_thoai from khach_hang where sh_id = 2`)).dien_thoai).toBe("KHONG-SDT-2");
    expect((await one<any>(`select ngay_sinh from khach_hang where sh_id = 2`)).ngay_sinh).toBeNull();
    expect((await one<any>(`select nguon from khach_hang where sh_id = 2`)).nguon).toBe("khach_cu_gioi_thieu");
    expect((await one<any>(`select c.ma from khach_hang k join chi_nhanh c on c.id = k.chi_nhanh_id where k.sh_id = 4`)).ma).toBe("DALAT");
    expect((await one<any>(`select count(*)::int n from khach_ghi_chu`)).n).toBe(1);
    expect((await one<any>(`select ho_ten, ghi_chu from khach_hang where sh_id = 777`)).ghi_chu).toContain("bị xoá khỏi danh sách SalonHero");
    // khách có lần ghé cuối 2023 nhưng thẻ còn buổi → đang liệu trình; không bị coi là mất oan
    expect((await one<any>(`select trang_thai from v_khach_hang where sh_id = 1`)).trang_thai).toBe("dang_lieu_trinh");
  });
  it("thẻ: số dư đúng, thẻ khoá không dùng được, thẻ không giới hạn", async () => {
    const t = await q<any>(`select sh_id::int, so_buoi_con, so_du_tien::int, tinh_trang from v_the_khach order by sh_id`);
    expect(t).toEqual([
      { sh_id: 101, so_buoi_con: 7, so_du_tien: 0, tinh_trang: "hoat_dong" },
      { sh_id: 102, so_buoi_con: 0, so_du_tien: 1250000, tinh_trang: "hoat_dong" },
      { sh_id: 103, so_buoi_con: 999986, so_du_tien: 0, tinh_trang: "hoat_dong" },
      { sh_id: 104, so_buoi_con: 10, so_du_tien: 0, tinh_trang: "hoat_dong" },
      { sh_id: 105, so_buoi_con: 0, so_du_tien: 0, tinh_trang: "khoa" },
    ]);
  });
  it("thực hiện 1 buổi trên thẻ đã chuyển: trừ đúng 1 buổi, doanh thu buổi = giá ÷ số buổi", async () => {
    const the = await one<any>(`select id, khach_id, gia_tri_buoi::int g from the_khach where sh_id = 101`);
    const dv = (await one<any>(`select id from dich_vu where sh_id = 501`)).id;
    await q(`select thuc_hien_buoi($1, $2, $3, null, null, current_date, '{}'::jsonb, 'thử', $3)`, [the.id, dv, CHU]);
    expect(the.g).toBe(299000);
    expect((await one<any>(`select so_buoi_con from v_the_khach where sh_id = 101`)).so_buoi_con).toBe(6);
  });
  it("công nợ đầu kỳ: thu được, không tính vào doanh thu / đơn / nợ mới, không huỷ được", async () => {
    const h = await one<any>(`select id, con_no::int, la_so_du_dau, ngay_hd::text from hoa_don where sh_id = 9001`);
    expect(h).toMatchObject({ con_no: 30000, la_so_du_dau: true, ngay_hd: "2024-02-20" });
    await q(`insert into thanh_toan (hoa_don_id, phuong_thuc, so_tien, nguoi_id, ghi_chu) values ($1, 'tien_mat', 10000, $2, 'Thu nợ')`, [h.id, CHU]);
    const sau = await one<any>(`select con_no::int, da_thu::int, tong_phai_thu::int from hoa_don where id = $1`, [h.id]);
    expect(sau).toEqual({ con_no: 20000, da_thu: 10000, tong_phai_thu: 30000 });
    const bc = await one<any>(`select sum(so_don)::int so_don, sum(doanh_thu)::int dt, sum(thu_no_cu)::int no_cu, sum(no_moi)::int no_moi from bc_doanh_thu_ngay(current_date - 1, current_date, null)`);
    expect(bc).toEqual({ so_don: 0, dt: 0, no_cu: 10000, no_moi: 0 });
    const bcCu = await one<any>(`select sum(so_don)::int so_don, sum(doanh_thu)::int dt, sum(no_moi)::int no_moi from bc_doanh_thu_ngay('2024-02-20', '2024-02-20', null)`);
    expect(bcCu).toEqual({ so_don: 0, dt: 0, no_moi: 0 });
    await expect(db.query(`select huy_hoa_don($1, 'thử', $2)`, [h.id, CHU])).rejects.toThrow();
    const chi = await one<any>(`select chi_12_thang::int c from v_khach_hang where sh_id = 1`);
    expect(chi.c).toBe(0);
  });
  it("tồn kho đầu kỳ vào sổ kho", async () => {
    expect((await one<any>(`select ton::int t from v_ton_kho v join san_pham p on p.id = v.san_pham_id where p.sh_id = 601`)).t).toBe(7);
  });
});
