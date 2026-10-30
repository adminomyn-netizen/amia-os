import { describe, expect, it } from "vitest";
import { chuyenDong, cuaSoNgay, keoInsights, layTienTe, maChienDich } from "../src/lib/meta-ads";

describe("Meta Ads → quảng cáo theo ngày", () => {
  it("đổi một dòng insights đúng từng trường", () => {
    const r = chuyenDong({
      campaign_id: "123", campaign_name: " AMIA Nám ", date_start: "2026-10-29", spend: "1250000.4", impressions: "40210", reach: "30100", inline_link_clicks: "820",
      actions: [{ action_type: "onsite_conversion.messaging_conversation_started_7d", value: "37" }, { action_type: "lead", value: "5" }, { action_type: "onsite_conversion.lead_grouped", value: "5" }, { action_type: "link_click", value: "999" }],
    });
    expect(r).toEqual({ metaId: "123", ten: "AMIA Nám", ngay: "2026-10-29", chi_phi: 1250000, hien_thi: 40210, tiep_can: 30100, click: 820, tin_nhan_moi: 37, lead_so: 5 });
  });
  it("lead không đếm đôi; thiếu action thì bằng 0, không đoán", () => {
    expect(chuyenDong({ campaign_id: "1", date_start: "2026-10-29", actions: [{ action_type: "onsite_conversion.lead_grouped", value: "4" }] })?.lead_so).toBe(4);
    const z = chuyenDong({ campaign_id: "1", date_start: "2026-10-29" });
    expect(z).toMatchObject({ chi_phi: 0, tin_nhan_moi: 0, lead_so: 0, click: 0 });
  });
  it("thiếu mã chiến dịch hoặc ngày sai thì bỏ", () => {
    expect(chuyenDong({ date_start: "2026-10-29" })).toBeNull();
    expect(chuyenDong({ campaign_id: "1", date_start: "29/10/2026" })).toBeNull();
  });
  it("giá trị âm/NaN thành 0", () => {
    expect(chuyenDong({ campaign_id: "1", date_start: "2026-10-29", spend: "-5", impressions: "abc" })).toMatchObject({ chi_phi: 0, hien_thi: 0 });
  });
  it("cửa sổ 3 ngày gồm hôm nay, qua tháng đúng", () => {
    expect(cuaSoNgay("2026-11-01", 3)).toEqual({ since: "2026-10-30", until: "2026-11-01" });
    expect(cuaSoNgay("2026-10-30", 1)).toEqual({ since: "2026-10-30", until: "2026-10-30" });
  });
  it("mã chiến dịch nối bằng meta-<id>", () => expect(maChienDich("42")).toBe("meta-42"));
  it("đi hết các trang, token ở header không ở URL, lỗi Meta thì ném", async () => {
    const goi: { url: string; auth: string }[] = [];
    const f = (async (url: string, init: RequestInit) => {
      goi.push({ url, auth: (init.headers as Record<string, string>).Authorization });
      return url.includes("p2") ? { ok: true, json: async () => ({ data: [{ campaign_id: "2", date_start: "2026-10-29" }] }) } : { ok: true, json: async () => ({ data: [{ campaign_id: "1", date_start: "2026-10-29" }], paging: { next: "https://graph.facebook.com/v23.0/act_9/insights?p2=1" } }) };
    }) as unknown as typeof fetch;
    const ra = await keoInsights({ token: "TOK", taiKhoan: "9", since: "2026-10-27", until: "2026-10-29", fetchFn: f });
    expect(ra).toHaveLength(2);
    expect(goi.every((g) => g.auth === "Bearer TOK" && !g.url.includes("TOK"))).toBe(true);
    expect(goi[0].url).toContain("/act_9/insights");
    const hong = (async () => ({ ok: false, status: 400, json: async () => ({ error: { code: 190, message: "token hết hạn" } }) })) as unknown as typeof fetch;
    await expect(keoInsights({ token: "x", taiKhoan: "act_9", since: "a", until: "b", fetchFn: hong })).rejects.toThrow(/190/);
    const vnd = (async () => ({ ok: true, json: async () => ({ currency: "VND" }) })) as unknown as typeof fetch;
    expect(await layTienTe({ token: "x", taiKhoan: "9", fetchFn: vnd })).toBe("VND");
  });
});

import { gopTheoNhom, nhomChienDich } from "../src/lib/meta-ads";
describe("gộp bản sao chiến dịch Meta", () => {
  it("bỏ đuôi Bản sao N, không phân biệt khoảng trắng/hoa thường", () => {
    const a = nhomChienDich("G99-AMIA - Vinh - 15/08 -Live - Bản sao 12"), b = nhomChienDich("G99-AMIA - Vinh - 15/08 -Live");
    expect(a.ma).toBe(b.ma);
    expect(a.ten).toBe("G99-AMIA - Vinh - 15/08 -Live");
    expect(nhomChienDich("X - ULTHERAPY - Bản sao").ma).toBe(nhomChienDich("x - ultherapy").ma);
  });
  it("chiến dịch khác tên thì không gộp", () => {
    expect(nhomChienDich("A - Exion - KHTM").ma).not.toBe(nhomChienDich("A - Exion").ma);
  });
  it("cộng cùng nhóm cùng ngày, khác ngày để riêng", () => {
    const d = (metaId: string, ten: string, ngay: string, chi: number) => ({ metaId, ten, ngay, chi_phi: chi, hien_thi: 10, tiep_can: 5, click: 1, tin_nhan_moi: 1, lead_so: 0 });
    const r = gopTheoNhom([d("1", "Live", "2026-10-28", 100), d("2", "Live - Bản sao 2", "2026-10-28", 50), d("2", "Live - Bản sao 2", "2026-10-29", 7)]);
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.ngay === "2026-10-28")).toMatchObject({ chi_phi: 150, hien_thi: 20, click: 2, tin_nhan_moi: 2 });
  });
});
