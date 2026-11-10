import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// Hộp Lead dạng pipeline (0313): giai đoạn, kết quả open/won/lost, lý do thua, dòng thời gian, hỗ trợ, tác vụ ↔ việc, tệp, cấu hình cột có phiên bản.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const NV = { a: u(1), b: u(2), c: u(3) };

let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await q<T>(sql, p))[0];
const loi = async (sql: string, p: unknown[] = []) => {
  try { await db.query(sql, p); } catch (e) { return (e as Error).message; }
  return "";
};
let CN: string, NGUON: string;
const gd = async (ma: string) => (await one<{ id: string }>(`select id from lead_giai_doan where ma=$1`, [ma])).id;
let so = 0;
const taoLead = async (sdt: string, them: Record<string, unknown> = {}) => {
  const cot = ["ma", "ho_ten", "sdt", "nguon_id", "chi_nhanh_id", "tao_boi", ...Object.keys(them)];
  const gt = [`LDT${++so}`, "Chị Lan", sdt, NGUON, CN, NV.a, ...Object.values(them)];
  return (await one<{ id: string }>(`insert into lead (${cot.join(",")}) values (${cot.map((_, i) => `$${i + 1}`).join(",")}) returning id`, gt)).id;
};
const lead = async (id: string) => one<{ giai_doan_id: string; ket_qua: string; owner_id: string | null; ly_do_thua_id: string | null; dong_luc: string | null }>(`select * from lead where id=$1`, [id]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await one<{ id: string }>(`select id from chi_nhanh where ma='VINH'`)).id;
  NGUON = (await one<{ id: string }>(`select id from nguon_lead where ma='fanpage'`)).id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Tư vấn A','tu_van',$4),($2,'Tư vấn B','tu_van',$4),($3,'Marketing C','marketing',$4)`, [NV.a, NV.b, NV.c, CN]);
});

describe("Hộp Lead pipeline (0313)", () => {
  it("có 6 cột mặc định, Thắng/Thua cố định, nguồn có loại", async () => {
    const ds = await q<{ ma: string }>(`select ma from lead_giai_doan order by thu_tu`);
    expect(ds.map((x) => x.ma)).toEqual(["moi", "dang_lien_he", "tiem_nang", "da_dat_lich", "thang", "thua"]);
    expect((await one<{ loai: string }>(`select loai from nguon_lead where ma='ctv'`)).loai).toBe("doi_tac");
    expect((await one<{ loai: string }>(`select loai from nguon_lead where ma='fanpage'`)).loai).toBe("nguon_ngoai");
  });

  it("lead mới vào cột Mới, kết quả open, có dòng 'Tạo lead'", async () => {
    const id = await taoLead("0911000001");
    const l = await lead(id);
    expect(l.giai_doan_id).toBe(await gd("moi"));
    expect(l.ket_qua).toBe("open");
    const hd = await q<{ loai: string }>(`select loai from lead_hoat_dong where lead_id=$1`, [id]);
    expect(hd.map((x) => x.loai)).toContain("tao");
  });

  it("phụ trách lead theo chi nhánh: lead chưa người nhận tự giao", async () => {
    await q(`update chi_nhanh set phu_trach_lead_id=$1 where id=$2`, [NV.b, CN]);
    const id = await taoLead("0911000002");
    expect((await lead(id)).owner_id).toBe(NV.b);
    const id2 = await taoLead("0911000003", { owner_id: NV.a });
    expect((await lead(id2)).owner_id).toBe(NV.a);
    await q(`update chi_nhanh set phu_trach_lead_id=null where id=$1`, [CN]);
  });

  it("sang Thua phải có lý do; có lý do thì lost + mở lại về open", async () => {
    const id = await taoLead("0911000004");
    expect(await loi(`update lead set giai_doan_id=$1 where id=$2`, [await gd("thua"), id])).toMatch(/lý do thua/);
    const ld = (await one<{ id: string }>(`select id from lead_ly_do_thua where ma='gia'`)).id;
    await q(`update lead set giai_doan_id=$1, ly_do_thua_id=$2, sua_boi=$3 where id=$4`, [await gd("thua"), ld, NV.a, id]);
    let l = await lead(id);
    expect(l.ket_qua).toBe("lost");
    expect(l.dong_luc).not.toBeNull();
    // Số này đã thua thì tạo lead mới được
    await taoLead("0911000004");
    // Mở lại khi số đã có lead khác đang mở → trùng
    expect(await loi(`update lead set giai_doan_id=$1 where id=$2`, [await gd("moi"), id])).toMatch(/lead_sdt_con_mo|duplicate|unique/i);
    const id3 = await taoLead("0911000005");
    await q(`update lead set giai_doan_id=$1, ly_do_thua_id=$2 where id=$3`, [await gd("thua"), ld, id3]);
    await q(`update lead set giai_doan_id=$1, sua_boi=$2 where id=$3`, [await gd("moi"), NV.a, id3]);
    l = await lead(id3);
    expect(l.ket_qua).toBe("open");
    expect(l.ly_do_thua_id).toBeNull();
    const hd = await q<{ loai: string; noi_dung: string }>(`select loai, noi_dung from lead_hoat_dong where lead_id=$1 order by id`, [id3]);
    expect(hd.map((x) => x.loai)).toEqual(["tao", "doi_giai_doan", "mo_lai"]);
    expect(hd[1].noi_dung).toContain("Giá chưa phù hợp");
  });

  it("không tạo hai lead đang mở cùng số", async () => {
    await taoLead("0911000006");
    expect(await loi(`insert into lead (ma, ho_ten, sdt, nguon_id, chi_nhanh_id) values ('LDX1','X','0911000006',$1,$2)`, [NGUON, CN])).toMatch(/lead_sdt_con_mo|duplicate|unique/i);
  });

  it("ghi kết quả liên hệ đẩy giai đoạn tiến lên, không lùi; kết thúc → Thua kèm lý do", async () => {
    const id = await taoLead("0911000007");
    await q(`update lead set trang_thai_lien_he='da_xac_nhan_nhu_cau' where id=$1`, [id]);
    expect((await lead(id)).giai_doan_id).toBe(await gd("tiem_nang"));
    await q(`update lead set trang_thai_lien_he='hen_goi_lai' where id=$1`, [id]);
    expect((await lead(id)).giai_doan_id).toBe(await gd("tiem_nang"));
    await q(`update lead set trang_thai_lien_he='sai_sdt', ly_do='Số không đúng' where id=$1`, [id]);
    const l = await lead(id);
    expect(l.ket_qua).toBe("lost");
    expect(l.ly_do_thua_id).toBe((await one<{ id: string }>(`select id from lead_ly_do_thua where ma='sai_sdt'`)).id);
    // Đánh dấu trùng
    const id2 = await taoLead("0911000008");
    await q(`update lead set trang_thai_phan_bo='lead_trung', trang_thai_lien_he='trung_lead', ly_do='Trùng LD1' where id=$1`, [id2]);
    expect((await lead(id2)).ket_qua).toBe("lost");
  });

  it("Thắng → won", async () => {
    const id = await taoLead("0911000009");
    await q(`update lead set giai_doan_id=$1 where id=$2`, [await gd("thang"), id]);
    expect((await lead(id)).ket_qua).toBe("won");
  });

  it("hỗ trợ, tác vụ, nhắc chỉ trong người của lead; gỡ người còn việc bị chặn; tác vụ khớp Việc cần làm", async () => {
    const id = await taoLead("0911000010", { owner_id: NV.a });
    expect(await loi(`insert into lead_nguoi_ho_tro (lead_id, nhan_vien_id) values ($1,$2)`, [id, NV.a])).toMatch(/đang phụ trách/);
    expect(await loi(`insert into lead_tac_vu (lead_id, ten, giao_cho_id) values ($1,'Gọi lại',$2)`, [id, NV.b])).toMatch(/người phụ trách hoặc người hỗ trợ/);
    await q(`insert into lead_nguoi_ho_tro (lead_id, nhan_vien_id) values ($1,$2)`, [id, NV.b]);
    const cv = (await one<{ id: string }>(`insert into cong_viec (tieu_de, nguoi_giao_id, nguoi_nhan_id) values ('Gọi lại',$1,$2) returning id`, [NV.a, NV.b])).id;
    const tv = (await one<{ id: string }>(`insert into lead_tac_vu (lead_id, ten, giao_cho_id, cong_viec_id) values ($1,'Gọi lại',$2,$3) returning id`, [id, NV.b, cv])).id;
    expect(await loi(`delete from lead_nguoi_ho_tro where lead_id=$1 and nhan_vien_id=$2`, [id, NV.b])).toMatch(/còn tác vụ/);
    expect((await one<{ so_tac_vu_mo: number; ho_tro_ids: string[] }>(`select so_tac_vu_mo, ho_tro_ids from v_lead_ds where id=$1`, [id]))).toMatchObject({ so_tac_vu_mo: 1, ho_tro_ids: [NV.b] });
    // Xong ở Nơi làm việc → tác vụ lead xong
    await q(`update cong_viec set trang_thai='xong' where id=$1`, [cv]);
    expect((await one<{ trang_thai: string }>(`select trang_thai from lead_tac_vu where id=$1`, [tv])).trang_thai).toBe("xong");
    // Mở lại ở Nơi làm việc (nút Mở lại → moi, chấm Chưa đạt → dang_lam) → tác vụ lead mở lại (0315), có dòng thời gian
    await q(`update cong_viec set trang_thai='moi' where id=$1`, [cv]);
    expect(await one(`select trang_thai, dong_luc, dong_boi from lead_tac_vu where id=$1`, [tv])).toMatchObject({ trang_thai: "mo", dong_luc: null, dong_boi: null });
    await q(`update cong_viec set trang_thai='xong' where id=$1`, [cv]);
    await q(`update cong_viec set trang_thai='dang_lam' where id=$1`, [cv]);
    expect((await one<{ trang_thai: string }>(`select trang_thai from lead_tac_vu where id=$1`, [tv])).trang_thai).toBe("mo");
    await q(`update cong_viec set trang_thai='xong' where id=$1`, [cv]);
    expect((await one<{ trang_thai: string }>(`select trang_thai from lead_tac_vu where id=$1`, [tv])).trang_thai).toBe("xong");
    const nk = async () => (await q<{ noi_dung: string }>(`select noi_dung from lead_hoat_dong where lead_id=$1 and noi_dung like '%(ở Việc cần làm)%' order by tao_luc, id`, [id])).map((x) => x.noi_dung.split(" (")[0]);
    expect((await nk()).sort()).toEqual(["Hoàn thành tác vụ", "Hoàn thành tác vụ", "Hoàn thành tác vụ", "Mở lại tác vụ", "Mở lại tác vụ"]);
    // Huỷ ở lead → việc huỷ
    const cv2 = (await one<{ id: string }>(`insert into cong_viec (tieu_de, nguoi_giao_id, nguoi_nhan_id) values ('Nhắn Zalo',$1,$2) returning id`, [NV.a, NV.b])).id;
    const tv2 = (await one<{ id: string }>(`insert into lead_tac_vu (lead_id, ten, giao_cho_id, cong_viec_id) values ($1,'Nhắn Zalo',$2,$3) returning id`, [id, NV.b, cv2])).id;
    await q(`update lead_tac_vu set trang_thai='huy' where id=$1`, [tv2]);
    expect((await one<{ trang_thai: string }>(`select trang_thai from cong_viec where id=$1`, [cv2])).trang_thai).toBe("huy");
    expect(await nk()).toHaveLength(5); // đóng từ khung lead: không ghi trùng dòng "(ở Việc cần làm)"
    await q(`delete from lead_nguoi_ho_tro where lead_id=$1 and nhan_vien_id=$2`, [id, NV.b]);
  });

  it("việc của tác vụ trên lead đã Thắng / Thua vẫn đóng, mở lại được (0315)", async () => {
    const ldThua = (await one<{ id: string }>(`select id from lead_ly_do_thua where ma='gia'`)).id;
    for (const [sdt, them] of [["0911000020", { giai_doan_id: await gd("thang") }], ["0911000021", { giai_doan_id: await gd("thua"), ly_do_thua_id: ldThua }]] as const) {
      const id = await taoLead(sdt, { owner_id: NV.a });
      const cv = (await one<{ id: string }>(`insert into cong_viec (tieu_de, nguoi_giao_id, nguoi_nhan_id) values ('Gọi',$1,$1) returning id`, [NV.a])).id;
      const tv = (await one<{ id: string }>(`insert into lead_tac_vu (lead_id, ten, giao_cho_id, cong_viec_id) values ($1,'Gọi',$2,$3) returning id`, [id, NV.a, cv])).id;
      await q(`update lead set giai_doan_id=$2, ly_do_thua_id=$3 where id=$1`, [id, them.giai_doan_id, "ly_do_thua_id" in them ? them.ly_do_thua_id : null]);
      await q(`update cong_viec set trang_thai='xong' where id=$1`, [cv]);
      await q(`update cong_viec set trang_thai='dang_lam' where id=$1`, [cv]);
      await q(`update cong_viec set trang_thai='huy' where id=$1`, [cv]);
      expect((await one<{ trang_thai: string }>(`select trang_thai from lead_tac_vu where id=$1`, [tv])).trang_thai).toBe("huy");
      expect((await q(`select 1 from lead_hoat_dong where lead_id=$1 and noi_dung like '%(ở Việc cần làm)%'`, [id])).length).toBe(3);
    }
  });

  it("tệp tải tay tối đa 5", async () => {
    const id = await taoLead("0911000011");
    for (let i = 0; i < 5; i++) await q(`insert into lead_tep (lead_id, ten, duong_dan) values ($1,'a.jpg',$2)`, [id, `${id}/${i}.jpg`]);
    expect(await loi(`insert into lead_tep (lead_id, ten, duong_dan) values ($1,'a.jpg',$2)`, [id, `${id}/6.jpg`])).toMatch(/tối đa 5/);
    await q(`insert into lead_tep (lead_id, ten, duong_dan, nguon) values ($1,'chat.jpg',$2,'chat')`, [id, `${id}/chat.jpg`]);
  });

  it("cấu hình cột: kiểm phiên bản, không ngừng Thắng/Thua hay cột còn lead, tên không trùng", async () => {
    const pb = (await one<{ v: number }>(`select max(phien_ban) v from lead_giai_doan`)).v;
    expect(await loi(`select lead_gd_cau_hinh($1,'sua',$2,'Mới 2',null,10)`, [pb + 5, await gd("moi")])).toMatch(/người khác thay đổi/);
    expect(await loi(`select lead_gd_cau_hinh($1,'ngung',$2,null,null,null)`, [pb, await gd("thang")])).toMatch(/Thắng hoặc Thua/);
    expect(await loi(`select lead_gd_cau_hinh($1,'ngung',$2,null,null,null)`, [pb, await gd("moi")])).toMatch(/Cột còn \d+ lead/);
    expect(await loi(`select lead_gd_cau_hinh($1,'them',null,'đang liên hệ','#123456',null)`, [pb])).toMatch(/Tên cột đã có/);
    const v2 = (await one<{ v: number }>(`select lead_gd_cau_hinh($1,'them',null,'Chờ tư vấn','#123456',60) v`, [pb])).v;
    expect(v2).toBe(pb + 1);
    const moi = (await one<{ id: string; thu_tu: number }>(`select id, thu_tu from lead_giai_doan where ten='Chờ tư vấn'`));
    expect(moi.thu_tu).toBe(5);
    const v3 = (await one<{ v: number }>(`select lead_gd_cau_hinh($1,'len',$2,null,null,null) v`, [v2, moi.id])).v;
    expect((await one<{ thu_tu: number }>(`select thu_tu from lead_giai_doan where id=$1`, [moi.id])).thu_tu).toBe(4);
    await q(`select lead_gd_cau_hinh($1,'ngung',$2,null,null,null)`, [v3, moi.id]);
    // Cột đã ngừng thì không chuyển lead vào
    const id = await taoLead("0911000012");
    expect(await loi(`update lead set giai_doan_id=$1 where id=$2`, [moi.id, id])).toMatch(/ngừng dùng/);
  });
});
