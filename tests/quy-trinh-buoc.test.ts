import { describe, expect, it } from "vitest";
import { gopBuoc } from "@/lib/quy-trinh-buoc";

const b = (buocId: string, ten: string, thuTu: number, goiY: string | null = null) => ({ buocId, ten, thuTu, goiY });
describe("gopBuoc", () => {
  it("nhiều dịch vụ: bước chung chỉ một lần, theo thứ tự sớm nhất", () => {
    const r = gopBuoc([
      { ten: "HA facial", buoc: [b("tt", "Tẩy trang", 1, "Tẩy trang A × 1.5"), b("rm", "Rửa mặt", 2), b("mn", "Đắp mặt nạ", 5)] },
      { ten: "Peel", buoc: [b("rm", "Rửa mặt", 2), b("tt", "Tẩy trang", 1, "Tẩy trang B × 1"), b("pe", "Quét peel", 3)] },
    ], new Set(["tt"]));
    expect(r.buoc.map((x) => x.id)).toEqual(["tt", "rm", "pe", "mn"]);
    expect(r.buoc[0]).toMatchObject({ daTich: true, dichVu: ["HA facial", "Peel"], goiY: ["Tẩy trang A × 1.5", "Tẩy trang B × 1"] });
    expect(r.dvChuaCo).toEqual([]);
  });
  it("dịch vụ chưa có quy trình được báo riêng", () => {
    expect(gopBuoc([{ ten: "Laser X", buoc: [] }], new Set()).dvChuaCo).toEqual(["Laser X"]);
  });
});
