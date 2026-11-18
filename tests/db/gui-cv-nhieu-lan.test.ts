import { beforeAll, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { taoDbVoiMigration } from "./khung";

// Chi nhánh Vinh 18/11/2026: "Hoá đơn dịch vụ: chọn dịch vụ lẻ trong thẻ (Ha Facial - Cấp nước đa tầng, thẻ Amia Basic 30 buổi) không tích chọn lặp lại được —
// khách làm 2 lần trong ngày thì không chọn được 2 lần." Chạy ĐÚNG server action chuyenNhieuDichVu trên PGlite (migration thật), sb() giả lập tối thiểu.
// Mỗi lần = 1 buổi (so_luong của lượt, Kết thúc trừ so_luong buổi — 0333); lần trước còn mở thì cộng vào lượt đó; máy chủ chặn vượt số buổi còn.
const u = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;
let CN = "", KH = "", DV = "", GOI = "";
const CV = u(11), TN = u(12);

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/push", () => ({ guiChoNhanVien: vi.fn(async () => null) }));
vi.mock("@/lib/auth", () => ({
  KHONG_DU_QUYEN: "Bạn không có quyền thực hiện thao tác này.",
  kiemQuyen: async () => ({ userId: u(99), nhanVienId: TN, hoTen: "Thu Ngân Vinh", email: "", vaiTro: "thu_ngan", chiNhanhId: CN, chucDanh: null, quyen: ["the.thuchien", "ban.tao"], anhDaiDien: null, phaiDoiMatKhau: false, dsCoSo: [] }),
}));
// sb() tối thiểu cho các lệnh action dùng: from().select().eq().in().maybeSingle() / await, insert(), update().eq().in().select().
vi.mock("@/lib/db", () => {
  type Loc = [string, "eq" | "in", unknown];
  const giaTri = (v: unknown) => (v !== null && typeof v === "object" && !Array.isArray(v) ? JSON.stringify(v) : v);
  class Q {
    cot = "*"; loc: Loc[] = []; thao: "select" | "insert" | "update" = "select"; du: unknown = null; traVe = false;
    constructor(public bang: string) {}
    select(c = "*") { if (this.thao === "select") this.cot = c; this.traVe = true; return this; }
    eq(c: string, v: unknown) { this.loc.push([c, "eq", v]); return this; }
    in(c: string, v: unknown[]) { this.loc.push([c, "in", v]); return this; }
    insert(d: unknown) { this.thao = "insert"; this.du = d; return this; }
    update(d: unknown) { this.thao = "update"; this.du = d; return this; }
    async maybeSingle() { const r = await this.chay(); return { data: r.data?.[0] ?? null, error: r.error }; }
    then<A>(ok: (r: { data: Record<string, unknown>[] | null; error: { code?: string; message?: string } | null }) => A, loi?: (e: unknown) => A) { return this.chay().then(ok, loi); }
    async chay() {
      const p: unknown[] = [];
      const where = () => (this.loc.length ? ` where ${this.loc.map(([c, k, v]) => (p.push(k === "in" ? (v as unknown[]).map(String) : String(v)), k === "in" ? `"${c}"::text = any($${p.length}::text[])` : `"${c}"::text = $${p.length}`)).join(" and ")}` : "");
      try {
        let sql: string;
        if (this.thao === "insert") {
          const ds = (Array.isArray(this.du) ? this.du : [this.du]) as Record<string, unknown>[];
          const cot = [...new Set(ds.flatMap((d) => Object.keys(d)))];
          const hang = ds.map((d) => `(${cot.map((c) => (p.push(giaTri(d[c] ?? null)), `$${p.length}`)).join(",")})`);
          sql = `insert into public.${this.bang} (${cot.map((c) => `"${c}"`).join(",")}) values ${hang.join(",")} returning *`;
        } else if (this.thao === "update") {
          const d = this.du as Record<string, unknown>;
          const set = Object.keys(d).map((c) => (p.push(giaTri(d[c])), `"${c}" = $${p.length}`)).join(", ");
          sql = `update public.${this.bang} set ${set}${where()} returning *`;
        } else sql = `select ${this.cot} from public.${this.bang}${where()}`;
        return { data: (await db.query<Record<string, unknown>>(sql, p)).rows, error: null };
      } catch (e) { return { data: null, error: { code: (e as { code?: string }).code, message: (e as Error).message } }; }
    }
  }
  return { sb: () => ({ from: (b: string) => new Q(b) }), thongBaoLoi: (e: { message?: string } | null) => e?.message ?? "Lỗi", tuyChon: (v: string | null | undefined) => (v ? v : null) };
});

const { chuyenNhieuDichVu } = await import("../../src/app/(app)/the/cho-lam/actions");

const taoThe = async (ma: string, soBuoi: number) => {
  const id = (await q<{ id: string }>(`insert into the_khach (ma, khach_id, goi_id, chi_nhanh_id, loai, so_buoi_tong, ngay_cap, cap_tay) values ($1,$2,$3,$4,'lan',$5, hom_nay(), true) returning id`, [ma, KH, GOI, CN, soBuoi]))[0].id;
  await q(`insert into the_so_cai (the_id, loai, so_buoi) values ($1,'cap',$2)`, [id, soBuoi]);
  return id;
};
const gui = (dong: unknown[]) => { const f = new FormData(); f.set("dong", JSON.stringify(dong)); f.append("nv_ids", CV); return chuyenNhieuDichVu(f); };
const luotMo = (the: string) => q<{ id: string; so_luong: number }>(`select id, so_luong from buoi_cho_lam where the_id=$1 and trang_thai in ('cho_lam','dang_lam')`, [the]);
const con = async (the: string) => Number((await q<{ s: string }>(`select coalesce(sum(so_buoi),0) s from the_so_cai where the_id=$1`, [the]))[0].s);
const dongTru = async (the: string) => Number((await q<{ n: string }>(`select count(*) n from the_so_cai where the_id=$1 and so_buoi < 0`, [the]))[0].n);
const xong = (id: string) => q(`select xong_buoi_cho($1, null, null, null, null, null, null, null, $2)`, [id, CV]);

beforeAll(async () => {
  db = await taoDbVoiMigration();
  CN = (await q<{ id: string }>(`select id from chi_nhanh where ma='VINH'`))[0].id;
  await q(`insert into nhan_vien (id, ho_ten, vai_tro, chi_nhanh_id) values ($1,'Chuyên Viên Vinh','ktv',$3), ($2,'Thu Ngân Vinh','thu_ngan',$3)`, [CV, TN, CN]);
  KH = (await q<{ id: string }>(`insert into khach_hang (ma, ho_ten, dien_thoai, chi_nhanh_id, nguon, nguoi_phu_trach_id) values ('KV1','Khách Vinh','0900000099',$1,'mkt',$2) returning id`, [CN, TN]))[0].id;
  GOI = (await q<{ id: string }>(`insert into goi_the (ma, ten, loai, gia, so_buoi) values ('AB30','Amia Basic 30 buổi','lan',1000,30) returning id`))[0].id;
  const nhom = (await q<{ id: string }>(`select id from dich_vu_nhom limit 1`))[0].id;
  DV = (await q<{ id: string }>(`insert into dich_vu (ma, nhom_id, ten, gia) values ('HAF',$1,'Ha Facial - Cấp nước đa tầng',500000) returning id`, [nhom]))[0].id;
  await q(`insert into goi_the_dich_vu (goi_id, dich_vu_id) values ($1,$2)`, [GOI, DV]);
});

describe("Hoá đơn dịch vụ: chọn cùng dịch vụ trong thẻ nhiều lần (Vinh 18/11/2026)", () => {
  it("chọn 2 lần trong một đơn → một lượt 2 lần, Kết thúc trừ đúng 2 buổi (sổ cái chỉ thêm 2 dòng)", async () => {
    const the = await taoThe("TV-2LAN", 5);
    const r = await gui([{ theId: the, dvId: DV, soLuong: 2 }]);
    expect(r.loi).toBeUndefined();
    expect(r.ok).toBe(true);
    const mo = await luotMo(the);
    expect(mo).toHaveLength(1);
    expect(mo[0].so_luong).toBe(2);
    expect(await con(the)).toBe(5); // chưa trừ khi mới gửi
    await xong(mo[0].id);
    expect(await con(the)).toBe(3);
    expect(await dongTru(the)).toBe(2);
    // Lần trước đã Kết thúc: tick lại cùng dịch vụ thành lượt mới bình thường.
    expect((await gui([{ theId: the, dvId: DV }])).ok).toBe(true);
    expect((await luotMo(the))[0].so_luong).toBe(1);
  });

  it("lần trước còn đang chờ: tick lại thì cộng vào lượt đó; bấm gửi hai lần không cộng hai lần", async () => {
    const the = await taoThe("TV-CHO", 5);
    expect((await gui([{ theId: the, dvId: DV }])).ok).toBe(true);
    const [l] = await luotMo(the);
    // Gửi dòng mới (không mang luotId) trùng lượt đang mở vẫn bị chỉ mục một-lượt-mở chặn, không ghi gì.
    expect((await gui([{ theId: the, dvId: DV }])).loi).toMatch(/Chưa gửi dịch vụ nào/);
    expect(await luotMo(the)).toEqual([{ id: l.id, so_luong: 1 }]);
    const r = await gui([{ theId: the, dvId: DV, luotId: l.id, slCu: 1 }]);
    expect(r.loi).toBeUndefined();
    expect(await luotMo(the)).toEqual([{ id: l.id, so_luong: 2 }]);
    // Bấm gửi lần nữa với cùng slCu cũ (đúp chuột / tab cũ): lượt đã đổi nên chặn.
    expect((await gui([{ theId: the, dvId: DV, luotId: l.id, slCu: 1 }])).loi).toMatch(/vừa thay đổi/);
    expect(await luotMo(the)).toEqual([{ id: l.id, so_luong: 2 }]);
    await xong(l.id);
    expect(await con(the)).toBe(3);
    expect(await dongTru(the)).toBe(2);
  });

  it("máy chủ chặn vượt số buổi còn: buổi đang chờ + buổi mới > so_buoi_con thì không ghi gì", async () => {
    const the = await taoThe("TV-HET", 3);
    expect((await gui([{ theId: the, dvId: DV, soLuong: 4 }])).loi).toMatch(/chỉ còn 3 buổi|không trừ 4 buổi/);
    expect(await luotMo(the)).toEqual([]);
    expect((await gui([{ theId: the, dvId: DV, soLuong: 2 }])).ok).toBe(true);
    const [l] = await luotMo(the);
    // Còn 3, đang chờ 2: thêm 2 lần vào lượt đang chờ → vượt.
    const r = await gui([{ theId: the, dvId: DV, luotId: l.id, slCu: 2, soLuong: 2 }]);
    expect(r.loi).toMatch(/chọn 2 buổi nhưng thẻ chỉ còn 1 buổi/);
    expect(await luotMo(the)).toEqual([{ id: l.id, so_luong: 2 }]);
    // Thêm đúng 1 lần thì vừa đủ.
    expect((await gui([{ theId: the, dvId: DV, luotId: l.id, slCu: 2 }])).ok).toBe(true);
    expect(await luotMo(the)).toEqual([{ id: l.id, so_luong: 3 }]);
    // Hết chỗ: thêm nữa bị chặn.
    expect((await gui([{ theId: the, dvId: DV, luotId: l.id, slCu: 3 }])).loi).toMatch(/thẻ chỉ còn 0 buổi/);
    await xong(l.id);
    expect(await con(the)).toBe(0);
    expect(await dongTru(the)).toBe(3);
  });
});
