import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Ba kênh bên thứ ba. Mỗi kênh một dòng trong bảng ket_noi_ben_thu_ba; các khoá gom thành một JSON rồi mã hoá. */
export const KENH_NOI = ["zalo_oa", "sms", "messenger"] as const;
export type KenhNoi = (typeof KENH_NOI)[number];
export const laKenhNoi = (k: unknown): k is KenhNoi => typeof k === "string" && (KENH_NOI as readonly string[]).includes(k);

export type TruongKenh = { ten: string; nhan: string; loai: "chu" | "mat_khau_an" | "chon"; luaChon?: { gia_tri: string; nhan: string }[]; hien?: boolean; ghiChu?: string };
export const THONG_TIN_KENH: Record<KenhNoi, { ten: string; moTa: string; nhanGuiThu: string; truong: TruongKenh[] }> = {
  zalo_oa: {
    ten: "Zalo OA", moTa: "Nhắn nhắc lịch, chăm sóc khách và trả lời khách qua Zalo Official Account.", nhanGuiThu: "Số điện thoại nhận thử",
    truong: [
      { ten: "oa_id", nhan: "OA ID", loai: "chu" }, { ten: "app_id", nhan: "App ID", loai: "chu" },
      { ten: "secret", nhan: "Secret", loai: "mat_khau_an" }, { ten: "access_token", nhan: "Access token", loai: "mat_khau_an" },
    ],
  },
  sms: {
    ten: "SMS", moTa: "Nhắn tin SMS qua nhà cung cấp (brandname).", nhanGuiThu: "Số điện thoại nhận thử",
    truong: [
      { ten: "nha_cung_cap", nhan: "Nhà cung cấp", loai: "chon", hien: true, luaChon: ["eSMS", "SpeedSMS", "VNPT", "Khác"].map((x) => ({ gia_tri: x, nhan: x })) },
      { ten: "api_key", nhan: "API key", loai: "mat_khau_an" }, { ten: "secret", nhan: "Secret", loai: "mat_khau_an" },
      { ten: "ten_thuong_hieu", nhan: "Tên thương hiệu gửi", loai: "chu", hien: true, ghiChu: "Tên hiện ở máy khách khi nhận tin, vd AMIA." },
    ],
  },
  messenger: {
    ten: "Messenger", moTa: "Trả lời khách nhắn vào trang Facebook của AMIA.", nhanGuiThu: "Mã người nhận trên Messenger",
    truong: [
      { ten: "page_id", nhan: "Page ID", loai: "chu" }, { ten: "page_access_token", nhan: "Page access token", loai: "mat_khau_an" },
      { ten: "app_secret", nhan: "App secret", loai: "mat_khau_an" },
    ],
  },
};

export type CauHinh = Record<string, string>;
const DAI_TOI_DA = 600;

/** Gộp giá trị vừa nhập với cấu hình cũ: ô để trống thì giữ khoá cũ. Thiếu ô bắt buộc thì báo lỗi. */
export function gopCauHinh(kenh: KenhNoi, nhap: Record<string, string>, cu: CauHinh | null): { cauHinh: CauHinh } | { loi: string } {
  const ra: CauHinh = {};
  for (const t of THONG_TIN_KENH[kenh].truong) {
    const v = (nhap[t.ten] ?? "").trim() || cu?.[t.ten] || "";
    if (!v) return { loi: `Nhập ${t.nhan}.` };
    if (v.length > DAI_TOI_DA) return { loi: `${t.nhan} quá dài.` };
    if (t.loai === "chon" && !t.luaChon?.some((l) => l.gia_tri === v)) return { loi: `${t.nhan} chưa hợp lệ.` };
    ra[t.ten] = v;
  }
  return { cauHinh: ra };
}

/** Chỉ hiện 4 ký tự cuối của khoá. Khoá quá ngắn thì giấu hết. */
export const cheKhoa = (s: string) => (s.length > 8 ? `****${s.slice(-4)}` : "****");
/** Bản an toàn gửi ra trình duyệt: mọi khoá bị che, trừ ô chọn nhà cung cấp và tên thương hiệu. */
export function xemCauHinh(kenh: KenhNoi, c: CauHinh): Record<string, string> {
  const ra: Record<string, string> = {};
  for (const t of THONG_TIN_KENH[kenh].truong) if (c[t.ten]) ra[t.ten] = t.hien ? c[t.ten] : cheKhoa(c[t.ten]);
  return ra;
}

const khoaTu = (biMat: string) => createHash("sha256").update(`ket-noi-ben-thu-ba:${biMat}`).digest();
/** Mã hoá cấu hình: AES-256-GCM, khoá suy ra từ khoá máy chủ. Kết quả base64(iv|tag|nội dung). */
export function maHoaCauHinh(c: CauHinh, biMat: string) {
  const iv = randomBytes(12), m = createCipheriv("aes-256-gcm", khoaTu(biMat), iv);
  const ct = Buffer.concat([m.update(JSON.stringify(c), "utf8"), m.final()]);
  return Buffer.concat([iv, m.getAuthTag(), ct]).toString("base64");
}
/** Giải mã; sai khoá hoặc dữ liệu hỏng thì trả null (người dùng nhập lại kết nối). */
export function giaiMaCauHinh(b64: string, biMat: string): CauHinh | null {
  try {
    const b = Buffer.from(b64, "base64"), d = createDecipheriv("aes-256-gcm", khoaTu(biMat), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"));
    return o && typeof o === "object" && !Array.isArray(o) ? (o as CauHinh) : null;
  } catch { return null; }
}
