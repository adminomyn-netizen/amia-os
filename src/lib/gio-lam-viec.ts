// Giờ làm việc theo từng chi nhánh (migration 0120). Dạng lưu: {"t2":{"mo":"08:00","dong":"20:00"},"cn":{"nghi":true}} trong chi_nhanh.gio_lam_viec;
// null = dùng giờ chung ở cua_hang.gio_lam_viec ({"mo","dong","nghi":["cn"]}). Hàm gio_trong_online ở DB đọc đúng dạng này.
export const THU = [
  { khoa: "t2", nhan: "Thứ hai" }, { khoa: "t3", nhan: "Thứ ba" }, { khoa: "t4", nhan: "Thứ tư" }, { khoa: "t5", nhan: "Thứ năm" },
  { khoa: "t6", nhan: "Thứ sáu" }, { khoa: "t7", nhan: "Thứ bảy" }, { khoa: "cn", nhan: "Chủ nhật" },
] as const;
export type KhoaThu = (typeof THU)[number]["khoa"];
export type GioNgay = { nghi: boolean; mo: string; dong: string };
export type GioChung = { mo?: string; dong?: string; nghi?: string[] };
export const GIO_HOP_LE = /^([01]\d|2[0-3]):[0-5]\d$/;

const doiObj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Giờ của 7 thứ để hiện/sửa: lấy giờ riêng của chi nhánh, thứ nào chưa có thì lấy giờ chung. */
export function gioBaThu(rieng: unknown, chung: unknown): Record<KhoaThu, GioNgay & { riengThu: boolean }> {
  const r = doiObj(rieng), c = doiObj(chung) as GioChung;
  const moC = typeof c.mo === "string" && GIO_HOP_LE.test(c.mo) ? c.mo : "08:00";
  const dongC = typeof c.dong === "string" && GIO_HOP_LE.test(c.dong) ? c.dong : "20:00";
  const nghiC = Array.isArray(c.nghi) ? c.nghi : [];
  const ra = {} as Record<KhoaThu, GioNgay & { riengThu: boolean }>;
  for (const { khoa } of THU) {
    const d = doiObj(r[khoa]);
    const coRieng = Object.keys(d).length > 0;
    ra[khoa] = {
      riengThu: coRieng,
      nghi: coRieng ? d.nghi === true : nghiC.includes(khoa),
      mo: typeof d.mo === "string" && GIO_HOP_LE.test(d.mo) ? d.mo : moC,
      dong: typeof d.dong === "string" && GIO_HOP_LE.test(d.dong) ? d.dong : dongC,
    };
  }
  return ra;
}

/** Kiểm tra 7 thứ trước khi lưu; trả lỗi tiếng Việt hoặc chuỗi rỗng. */
export function loiGioBaThu(g: Record<KhoaThu, GioNgay>): string {
  for (const { khoa, nhan } of THU) {
    const d = g[khoa];
    if (d.nghi) continue;
    if (!GIO_HOP_LE.test(d.mo) || !GIO_HOP_LE.test(d.dong)) return `${nhan}: giờ nhập dạng 08:00.`;
    if (d.mo >= d.dong) return `${nhan}: giờ đóng cửa phải sau giờ mở cửa.`;
  }
  if (THU.every(({ khoa }) => g[khoa].nghi)) return "Phải có ít nhất một ngày mở cửa trong tuần.";
  return "";
}

/** Dạng ghi vào DB. */
export const gioDeLuu = (g: Record<KhoaThu, GioNgay>) =>
  Object.fromEntries(THU.map(({ khoa }) => [khoa, g[khoa].nghi ? { nghi: true } : { mo: g[khoa].mo, dong: g[khoa].dong }]));

/** Tóm tắt một dòng: "T2–T6 08:00–20:00 · T7 08:00–17:00 · nghỉ CN". */
export function tomTatGio(g: Record<KhoaThu, GioNgay>): string {
  const nhan: Record<KhoaThu, string> = { t2: "T2", t3: "T3", t4: "T4", t5: "T5", t6: "T6", t7: "T7", cn: "CN" };
  const nhom: { tu: KhoaThu; den: KhoaThu; k: string }[] = [];
  for (const { khoa } of THU) {
    const d = g[khoa];
    const k = d.nghi ? "nghi" : `${d.mo}–${d.dong}`;
    const cuoi = nhom[nhom.length - 1];
    if (cuoi && cuoi.k === k) cuoi.den = khoa; else nhom.push({ tu: khoa, den: khoa, k });
  }
  const ten = (n: { tu: KhoaThu; den: KhoaThu }) => (n.tu === n.den ? nhan[n.tu] : `${nhan[n.tu]}–${nhan[n.den]}`);
  const mo = nhom.filter((n) => n.k !== "nghi").map((n) => `${ten(n)} ${n.k}`);
  const nghi = nhom.filter((n) => n.k === "nghi").map(ten);
  return [...mo, ...(nghi.length ? [`nghỉ ${nghi.join(", ")}`] : [])].join(" · ");
}
