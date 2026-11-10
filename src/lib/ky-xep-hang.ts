export type KyXh = "thang-nay" | "thang-truoc";

const congThang = (ngay: string, n: number) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
const truMotNgay = (ngay: string) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

/** Khoảng ngày của kỳ xếp hạng: tháng này = đầu tháng → hôm nay; tháng trước = trọn tháng trước (tới ngày cuối tháng, gồm cả ngày đó). */
export function khoangKy(ky: KyXh, homNay: string) {
  const dau = `${homNay.slice(0, 8)}01`;
  if (ky === "thang-truoc") { const tu = congThang(dau, -1); return { tu, den: truMotNgay(dau), nhan: `tháng ${Number(tu.slice(5, 7))}` }; }
  return { tu: dau, den: homNay, nhan: `tháng ${Number(homNay.slice(5, 7))}` };
}
