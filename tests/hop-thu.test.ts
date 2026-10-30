import { beforeEach, describe, expect, it, vi } from "vitest";
import { taoSbGia, type KhoGia } from "./gia-lap-sb";

vi.mock("server-only", () => ({}));
let kho: KhoGia = {};
vi.mock("@/lib/db", () => ({ sb: () => taoSbGia(kho, { hop_thu_hoi_thoai: { chua_doc: 0 } }) }));
beforeEach(() => { kho = { hop_thu_hoi_thoai: [], hop_thu_tin: [], ket_noi_ben_thu_ba: [] }; });

describe("hộp thư: nhận tin đến", () => {
  it("tin đầu tạo hội thoại mới; tin sau cùng khách thì dùng lại hội thoại và tăng số chưa đọc", async () => {
    const { nhanTinDen } = await import("@/lib/hop-thu");
    const a = await nhanTinDen({ kenh: "zalo_oa", maNgoai: "zl-1", tenKhach: "Lan", noiDung: "Chào AMIA", luc: "2026-10-30T01:00:00Z" });
    expect(a.ok).toBe(true);
    const b = await nhanTinDen({ kenh: "zalo_oa", maNgoai: "zl-1", noiDung: "Em hỏi giá", luc: "2026-10-30T01:05:00Z" });
    expect(b.ok && a.ok && b.hoiThoaiId === a.hoiThoaiId).toBe(true);
    expect(kho.hop_thu_hoi_thoai).toHaveLength(1);
    expect(kho.hop_thu_hoi_thoai[0]).toMatchObject({ ten_khach: "Lan", chua_doc: 2, tin_cuoi: "Em hỏi giá", tin_cuoi_luc: "2026-10-30T01:05:00Z" });
    expect(kho.hop_thu_tin.map((t) => [t.huong, t.noi_dung, t.trang_thai])).toEqual([["den", "Chào AMIA", "da_nhan"], ["den", "Em hỏi giá", "da_nhan"]]);
  });
  it("cùng mã nhưng khác kênh là hai hội thoại; kênh lạ và tin trống bị từ chối", async () => {
    const { nhanTinDen } = await import("@/lib/hop-thu");
    await nhanTinDen({ kenh: "zalo_oa", maNgoai: "x", noiDung: "a" });
    await nhanTinDen({ kenh: "messenger", maNgoai: "x", noiDung: "b" });
    expect(kho.hop_thu_hoi_thoai).toHaveLength(2);
    expect(await nhanTinDen({ kenh: "sms", maNgoai: "x", noiDung: "a" })).toMatchObject({ ok: false });
    expect(await nhanTinDen({ kenh: "zalo_oa", maNgoai: "x", noiDung: "   " })).toMatchObject({ ok: false });
    expect(await nhanTinDen({ kenh: "zalo_oa", maNgoai: "", noiDung: "a" })).toMatchObject({ ok: false });
    expect(kho.hop_thu_tin).toHaveLength(2);
  });
});

describe("hộp thư: lưu tin trả lời", () => {
  it("lưu tin đi ở trạng thái chờ gửi và cho biết kênh đã nối chưa", async () => {
    const { nhanTinDen, luuTinTraLoi } = await import("@/lib/hop-thu");
    const a = await nhanTinDen({ kenh: "messenger", maNgoai: "m1", noiDung: "Chào" });
    if (!a.ok) throw new Error("lỗi dựng");
    const chuaNoi = await luuTinTraLoi({ hoiThoaiId: a.hoiThoaiId, noiDung: " Dạ AMIA nghe ", nguoiId: "nv1" });
    expect(chuaNoi).toEqual({ ok: true, kenhDaNoi: false });
    kho.ket_noi_ben_thu_ba.push({ kenh: "messenger", trang_thai: "da_noi" });
    expect(await luuTinTraLoi({ hoiThoaiId: a.hoiThoaiId, noiDung: "Dạ", nguoiId: "nv1" })).toEqual({ ok: true, kenhDaNoi: true });
    const di = kho.hop_thu_tin.filter((t) => t.huong === "di");
    expect(di.map((t) => [t.noi_dung, t.trang_thai, t.nguoi_id])).toEqual([["Dạ AMIA nghe", "cho_gui", "nv1"], ["Dạ", "cho_gui", "nv1"]]);
    expect(await luuTinTraLoi({ hoiThoaiId: "khong-co", noiDung: "x", nguoiId: null })).toMatchObject({ ok: false });
    expect(await luuTinTraLoi({ hoiThoaiId: a.hoiThoaiId, noiDung: " ", nguoiId: null })).toMatchObject({ ok: false });
  });
});
