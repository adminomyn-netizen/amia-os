import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@/app/(app)/the/cho-lam/actions", () => ({ tichBuoc: vi.fn() }));
import { BuocQuyTrinh } from "@/components/the/BuocQuyTrinh";

describe("BuocQuyTrinh", () => {
  it("hiện bước gộp, số đã làm, vật tư gợi ý, dịch vụ chưa có quy trình", () => {
    const html = renderToStaticMarkup(createElement(BuocQuyTrinh, { khachId: "k", thaoTac: true, qt: { dvChuaCo: ["Laser X"], buoc: [
      { id: "a", ten: "Tẩy trang sạch mặt", goiY: ["Tẩy trang A × 1.5"], dichVu: ["HA", "Peel"], daTich: true },
      { id: "b", ten: "Quét peel", goiY: [], dichVu: ["Peel"], daTich: false },
    ] } }));
    expect(html).toContain("đã làm 1/2 bước");
    expect(html).toContain("Vật tư gợi ý: Tẩy trang A × 1.5");
    expect(html).toContain("(HA, Peel)");
    expect(html).toContain("Chưa có quy trình từng bước cho: Laser X");
  });
});
