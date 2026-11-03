import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const gui = vi.fn();
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification: (...a: unknown[]) => gui(...a) } }));

const xoa: string[][] = [], capNhat: string[][] = [];
let subs: { id: string; endpoint: string; p256dh: string; auth: string }[] = [];
vi.mock("@/lib/db", () => ({
  sb: () => ({
    from: () => ({
      select: () => ({ in: async () => ({ data: subs }), eq: async () => ({ data: [] }) }),
      delete: () => ({ in: async (_c: string, ids: string[]) => { xoa.push(ids); return {}; } }),
      update: () => ({ in: async (_c: string, ids: string[]) => { capNhat.push(ids); return {}; } }),
    }),
  }),
}));

beforeEach(() => { gui.mockReset(); xoa.length = 0; capNhat.length = 0; subs = []; vi.resetModules(); });
const nap = async (khoa = true) => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = khoa ? "pub" : ""; process.env.VAPID_PRIVATE_KEY = khoa ? "pri" : "";
  return import("../../src/lib/push");
};

describe("gửi thông báo đẩy", () => {
  it("gửi tới mọi thiết bị, ghi giờ gửi cuối, cắt tiêu đề/nội dung quá dài", async () => {
    subs = [{ id: "a", endpoint: "https://x/1", p256dh: "k", auth: "t" }, { id: "b", endpoint: "https://x/2", p256dh: "k", auth: "t" }];
    gui.mockResolvedValue({});
    const { guiChoNhanVien } = await nap();
    const kq = await guiChoNhanVien(["n1", "n1"], { tieuDe: "T".repeat(200), noiDung: "N".repeat(600), url: "/lich-hen" });
    expect(kq).toEqual({ thietBi: 2, thanhCong: 2, daGo: 0 });
    expect(JSON.parse(gui.mock.calls[0][1] as string).tieuDe).toHaveLength(80);
    expect(JSON.parse(gui.mock.calls[0][1] as string).noiDung).toHaveLength(420);
    expect(capNhat[0].sort()).toEqual(["a", "b"]);
  });
  it("thiết bị hết hạn (410/404) bị gỡ; lỗi khác giữ lại; một thiết bị hỏng không chặn thiết bị khác", async () => {
    subs = [{ id: "a", endpoint: "https://x/1", p256dh: "k", auth: "t" }, { id: "b", endpoint: "https://x/2", p256dh: "k", auth: "t" }, { id: "c", endpoint: "https://x/3", p256dh: "k", auth: "t" }];
    gui.mockImplementation(async (s: { endpoint: string }) => { if (s.endpoint.endsWith("/1")) throw { statusCode: 410 }; if (s.endpoint.endsWith("/2")) throw { statusCode: 500 }; return {}; });
    const { guiChoNhanVien } = await nap();
    const kq = await guiChoNhanVien(["n1"], { tieuDe: "t", noiDung: "n", url: "/" });
    expect(kq).toEqual({ thietBi: 3, thanhCong: 1, daGo: 1 });
    expect(xoa).toEqual([["a"]]);
  });
  it("thiếu khoá VAPID hoặc không có người nhận thì không làm gì và không ném lỗi", async () => {
    const { guiChoNhanVien } = await nap(false);
    expect(await guiChoNhanVien(["n1"], { tieuDe: "t", noiDung: "n", url: "/" })).toEqual({ thietBi: 0, thanhCong: 0, daGo: 0 });
    const m = await nap();
    expect(await m.guiChoNhanVien([], { tieuDe: "t", noiDung: "n", url: "/" })).toEqual({ thietBi: 0, thanhCong: 0, daGo: 0 });
    expect(gui).not.toHaveBeenCalled();
  });
});
