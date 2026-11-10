import { describe, expect, it } from "vitest";
import { nhacBuocTiep, tienDoBuoc, tinKetQuaLuot } from "@/lib/quy-trinh-buoc";

const b = (ten: string, daTich: boolean, goiY: string[] = []) => ({ ten, daTich, goiY });

describe("nhắc bước tiếp theo + báo thu ngân (chị Lâm 11/11/2026)", () => {
  it("bước tiếp theo = bước chưa tích đầu tiên, kèm vật tư", () => {
    const td = tienDoBuoc([b("Tẩy trang", true), b("Peel", false, ["Dung dịch peel 2ml"]), b("Đắp mặt nạ", false)]);
    expect(td).toEqual({ xong: 1, tong: 3, tiep: { stt: 2, ten: "Peel", goiY: ["Dung dịch peel 2ml"] } });
    expect(nhacBuocTiep(td)).toBe("Bước tiếp theo 2/3: Peel · Vật tư: Dung dịch peel 2ml");
  });
  it("đủ bước thì nhắc bấm Kết thúc; không có quy trình thì nhắc chung", () => {
    expect(nhacBuocTiep(tienDoBuoc([b("A", true), b("B", true)]))).toBe("Đã đủ 2/2 bước — trả khách thì bấm Kết thúc.");
    expect(nhacBuocTiep(tienDoBuoc([]))).toContain("Kết thúc");
  });
  it("tin báo thu ngân có kết quả, bước x/y, thời gian", () => {
    expect(tinKetQuaLuot({ trangThai: "xong", khach: "Lan", dichVu: "Peel da", td: { xong: 5, tong: 5, tiep: null }, phut: 45, nguoi: "Mơ" }))
      .toBe("Đã xong – trả khách · Lan · Peel da · 5/5 bước · 45 phút · (Mơ)");
    expect(tinKetQuaLuot({ trangThai: "huy", khach: "Lan", dichVu: "Peel da", lyDo: "khách về sớm" })).toBe("Khách không làm · Lan · Peel da · Lý do: khách về sớm");
  });
});
