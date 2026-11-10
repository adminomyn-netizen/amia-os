import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration, chayVoiTu } from "./khung";

// 0321: thu ngân chuyển khách cho chuyên viên trị liệu (hàng chờ), nhiều người làm một buổi, tư vấn trong buổi.
// Điều cốt lõi: CHỈ "Đã làm xong" mới ghi sổ cái thẻ; chuyển / bắt đầu / trả lại / huỷ không đụng sổ cái, không tạo buổi.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN: string, KH: string, THE: string, DV: string;
const NV = u(1), KTV2 = u(2), TV = u(3), TN = u(4);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  for (const [id, ten, vai] of [[NV, "Chuyên Viên A", "ktv"], [KTV2, "Bác Sĩ B", "bac_si"], [TV, "Tư Vấn C", "tu_van"], [TN, "Thu Ngân D", "thu_ngan"]])
    await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,$2,$3,$4)`, [id, ten, vai, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('K1','K1','0900000001',$1,'mkt',$2) returning id`, [CN, TV]))[0].id;
  const goi = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('G1','Triệt lông','lan',1000,5) returning id`))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom where ten='Peel da'`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('DV1',$1,'Laser',500000) returning id`, [nhom]))[0].id;
  THE = (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, ngay_cap, cap_tay) values ('T1',$1,$2,$3,'lan',5, hom_nay(), true) returning id`, [KH, goi, CN]))[0].id;
  await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',5)`, [THE]);
});

const soCai = async () => Number((await q<{ n: string }>(`select count(*) n from the_so_cai where the_id = $1`, [THE]))[0].n);
const con = async () => Number((await q<{ s: string }>(`select coalesce(sum(so_buoi),0) s from the_so_cai where the_id = $1`, [THE]))[0].s);
const soBuoi = async () => Number((await q<{ n: string }>(`select count(*) n from buoi_thuc_hien where the_id = $1`, [THE]))[0].n);
const chuyen = async () => (await q<{ id: string }>(
  `insert into buoi_cho_lam (the_id, khach_id, chi_nhanh_id, dich_vu_id, nv_ids, chuyen_boi, ghi_chu, tu_van_ids, tu_van_tinh_trang)
   values ($1,$2,$3,$4, array[$5::uuid,$6::uuid], $7, 'Khách da nhạy cảm', array[$8::uuid], 'Da dầu, lỗ chân lông to') returning id`,
  [THE, KH, CN, DV, NV, KTV2, TN, TV]))[0].id;

describe("buoi_cho_lam: chuyển / bắt đầu / trả lại / huỷ không đụng sổ cái", () => {
  it("chuyển cho chuyên viên: chưa trừ buổi, chưa có buổi, chưa có phiếu vật tư", async () => {
    const truoc = await soCai();
    const id = await chuyen();
    expect(await soCai()).toBe(truoc);
    expect(await soBuoi()).toBe(0);
    expect(Number((await q<{ n: string }>(`select count(*) n from phieu_cap where khach_id = $1`, [KH]))[0].n)).toBe(0);
    // Không chuyển trùng thẻ + dịch vụ khi lượt cũ còn đang chờ.
    await expect(chuyen()).rejects.toThrow();
    await q(`update buoi_cho_lam set trang_thai='dang_lam', bat_dau_luc=now() where id=$1`, [id]);
    await q(`update buoi_cho_lam set trang_thai='tra_lai', ly_do='Khách đổi dịch vụ' where id=$1`, [id]);
    expect(await soCai()).toBe(truoc);
    expect(await soBuoi()).toBe(0);
    // Trả lại / huỷ phải ghi lý do.
    const id2 = await chuyen();
    await expect(q(`update buoi_cho_lam set trang_thai='huy' where id=$1`, [id2])).rejects.toThrow();
    await q(`update buoi_cho_lam set trang_thai='huy', ly_do='Khách về' where id=$1`, [id2]);
    expect(await soCai()).toBe(truoc);
    // Lượt đã trả lại / huỷ thì không làm xong được.
    await expect(q(`select xong_buoi_cho($1, null, null, null, null, null, null, null, $2)`, [id2, NV])).rejects.toThrow(/đã xử lý/);
    expect(await soCai()).toBe(truoc);
  });

  it("Đã làm xong: trừ đúng 1 buổi, người chính = người đầu, ghi nhiều người chia đều, phiếu tư vấn gắn buổi; bấm lại không trừ thêm", async () => {
    const conTruoc = await con(), dongTruoc = await soCai();
    const id = await chuyen();
    const buoi = (await q<{ b: string }>(`select xong_buoi_cho($1, null, null, '{"shot":120}'::jsonb, null, null, null, 'Nên dùng kem chống nắng', $2) b`, [id, NV]))[0].b;
    expect(await con()).toBe(conTruoc - 1);
    expect(await soCai()).toBe(dongTruoc + 1);
    const b = (await q<{ nv_thuc_hien_id: string; tham_so: { shot: number }; ghi_chu: string }>(`select * from buoi_thuc_hien where id=$1`, [buoi]))[0];
    expect(b.nv_thuc_hien_id).toBe(NV);
    expect(b.tham_so.shot).toBe(120);
    expect(b.ghi_chu).toBe("Khách da nhạy cảm");
    const nguoi = await q<{ nhan_vien_id: string; vai: string; ti_le: string }>(`select nhan_vien_id, vai, ti_le::text from buoi_nhan_vien where buoi_id=$1 order by vai, thu_tu`, [buoi]);
    expect(nguoi).toEqual([{ nhan_vien_id: NV, vai: "thuc_hien", ti_le: "50.00" }, { nhan_vien_id: KTV2, vai: "thuc_hien", ti_le: "50.00" }, { nhan_vien_id: TV, vai: "tu_van", ti_le: "100.00" }]);
    const p = (await q<{ tu_van_vien_id: string; dat_van_de: string; phan_tich: string; ket_qua: string; ma: string }>(`select * from phieu_tu_van where buoi_id=$1`, [buoi]))[0];
    expect(p).toMatchObject({ tu_van_vien_id: TV, dat_van_de: "Da dầu, lỗ chân lông to", phan_tich: "Nên dùng kem chống nắng", ket_qua: "cho_chot" });
    expect(p.ma).toMatch(/^TV\d{6}$/);
    expect((await q<{ trang_thai: string; buoi_id: string }>(`select trang_thai, buoi_id from buoi_cho_lam where id=$1`, [id]))[0]).toEqual({ trang_thai: "xong", buoi_id: buoi });
    await expect(q(`select xong_buoi_cho($1, null, null, null, null, null, null, null, $2)`, [id, NV])).rejects.toThrow(/đã xử lý/);
    expect(await con()).toBe(conTruoc - 1);
  });

  it("ghi_nguoi_buoi: chia 3 người 33,33/33,33/33,34; có nội dung tư vấn mà không có người tư vấn thì báo lỗi; danh sách người chỉ thêm", async () => {
    const buoi = (await q<{ b: string }>(`select thuc_hien_buoi($1,$2,$3,null,null,hom_nay(),'{}'::jsonb,null,$3) b`, [THE, DV, NV]))[0].b;
    await expect(q(`select ghi_nguoi_buoi($1, array[$2::uuid], '{}', 'Da khô', null, $2)`, [buoi, NV])).rejects.toThrow(/người tư vấn/);
    await q(`select ghi_nguoi_buoi($1, array[$2::uuid,$3::uuid,$4::uuid,$2::uuid], '{}', null, null, $2)`, [buoi, KTV2, TV, NV]);
    const tl = await q<{ nhan_vien_id: string; ti_le: string }>(`select nhan_vien_id, ti_le::text from buoi_nhan_vien where buoi_id=$1 order by thu_tu`, [buoi]);
    expect(tl.map((x) => x.nhan_vien_id)).toEqual([NV, KTV2, TV]); // người chính (NV) đứng đầu, bỏ trùng
    expect(tl.map((x) => x.ti_le)).toEqual(["33.33", "33.33", "33.34"]);
    await expect(q(`update buoi_nhan_vien set ti_le = 10 where buoi_id=$1`, [buoi])).rejects.toThrow(/chỉ được thêm dòng/);
  });

  it("người đăng nhập không đọc/ghi thẳng bảng mới được", async () => {
    await expect(chayVoiTu(db, { sub: NV }, `insert into buoi_cho_lam (the_id, khach_id, chi_nhanh_id, dich_vu_id, nv_ids) values ('${THE}','${KH}','${CN}','${DV}', array['${NV}'::uuid])`)).rejects.toThrow();
    const r = await chayVoiTu(db, { sub: NV }, `select count(*)::int n from buoi_cho_lam`).catch(() => ({ rows: [{ n: -1 }] }));
    expect([0, -1]).toContain((r.rows[0] as { n: number }).n);
  });
});
