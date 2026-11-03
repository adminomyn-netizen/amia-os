import { describe, expect, it } from "vitest";
import { docKetQuaMst, kiemMstTraCuu, traCuuMst } from "@/lib/tra-cuu-mst";

describe("Tra cứu MST (như SalonHero, dịch vụ VietQR)", () => {
  it("kiểm MST trước khi gọi", () => {
    expect(kiemMstTraCuu("")).toEqual({ loi: "Hãy điền mã số thuế cần tra cứu." });
    expect(kiemMstTraCuu("12345")).toEqual({ loi: "Mã số thuế phải từ 10 kí tự trở lên." });
    expect(kiemMstTraCuu("01001091AB")).toHaveProperty("loi");
    expect(kiemMstTraCuu(" 0100 109 106 ")).toEqual({ mst: "0100109106" });
    expect(kiemMstTraCuu("0100109106-001")).toEqual({ mst: "0100109106-001" });
  });
  it("đọc phản hồi", () => {
    expect(docKetQuaMst(200, { code: "00", data: { name: " CÔNG TY A ", address: "Vinh" } })).toEqual({ ok: { ten: "CÔNG TY A", diaChi: "Vinh" } });
    expect(docKetQuaMst(200, { code: "52", desc: "not found" })).toEqual({ khongThay: true });
    expect(docKetQuaMst(200, { code: "51" })).toEqual({ khongThay: true });
    expect(docKetQuaMst(429, null)).toHaveProperty("loi");
    expect(docKetQuaMst(500, {})).toHaveProperty("loi");
    expect(docKetQuaMst(200, { code: "99" })).toHaveProperty("loi");
  });
  it("gọi đúng địa chỉ và không gọi khi MST sai", async () => {
    const goi: string[] = [];
    const f = (async (u: string) => { goi.push(u); return new Response(JSON.stringify({ code: "00", data: { name: "B", address: "" } }), { status: 200 }); }) as unknown as typeof fetch;
    expect(await traCuuMst("0100109106", f)).toEqual({ ok: { ten: "B", diaChi: "" } });
    expect(goi).toEqual(["https://api.vietqr.io/v2/business/0100109106"]);
    expect(await traCuuMst("123", f)).toHaveProperty("loi");
    expect(goi.length).toBe(1);
    const hong = (async () => { throw new Error("mạng"); }) as unknown as typeof fetch;
    expect(await traCuuMst("0100109106", hong)).toHaveProperty("loi");
  });
});
