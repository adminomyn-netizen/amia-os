import { describe, expect, it } from "vitest";
import { tinhTraLai } from "@/lib/ban-hang";

describe("tinhTraLai (Tiền khách đưa / Trả lại khách)", () => {
  it("khách đưa dư thì trả lại phần dư", () => expect(tinhTraLai(500000, 320000)).toEqual({ traLai: 180000, thieu: 0 }));
  it("đưa vừa đủ thì không trả, không thiếu", () => expect(tinhTraLai(320000, 320000)).toEqual({ traLai: 0, thieu: 0 }));
  it("đưa thiếu thì báo còn thiếu", () => expect(tinhTraLai(200000, 320000)).toEqual({ traLai: 0, thieu: 120000 }));
  it("chưa nhập tiền khách đưa thì chưa tính gì", () => expect(tinhTraLai(0, 320000)).toEqual({ traLai: 0, thieu: 0 }));
});
