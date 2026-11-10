/** Kỳ xem của tab Tổng quan › Hôm nay: chỉ số doanh thu + bảng xếp hạng đi theo kỳ này (chị Lâm 10/11/2026: "hôm nay mà bảng xếp hạng theo tháng sao được"). */
export type KyXh = "hom-nay" | "tuan-nay" | "thang-nay" | "thang-truoc";
export const DS_KY: { ma: KyXh; ten: string }[] = [
  { ma: "hom-nay", ten: "Hôm nay" }, { ma: "tuan-nay", ten: "Tuần này" }, { ma: "thang-nay", ten: "Tháng này" }, { ma: "thang-truoc", ten: "Tháng trước" },
];
export const docKy = (s: string | undefined): KyXh => (DS_KY.some((k) => k.ma === s) ? (s as KyXh) : "hom-nay");

const congThang = (ngay: string, n: number) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
const congNgayUtc = (ngay: string, n: number) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ngayThang = (ngay: string) => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`;

/** Khoảng ngày (gồm cả hai đầu) của kỳ: hôm nay; tuần này = thứ Hai → hôm nay; tháng này = đầu tháng → hôm nay; tháng trước = trọn tháng trước. */
export function khoangKy(ky: KyXh, homNay: string) {
  if (ky === "hom-nay") return { tu: homNay, den: homNay, nhan: `hôm nay ${ngayThang(homNay)}` };
  if (ky === "tuan-nay") {
    const thu = new Date(`${homNay}T00:00:00Z`).getUTCDay(); // 0 = Chủ nhật
    return { tu: congNgayUtc(homNay, -((thu + 6) % 7)), den: homNay, nhan: "tuần này" };
  }
  const dau = `${homNay.slice(0, 8)}01`;
  if (ky === "thang-truoc") { const tu = congThang(dau, -1); return { tu, den: congNgayUtc(dau, -1), nhan: `tháng ${Number(tu.slice(5, 7))}` }; }
  return { tu: dau, den: homNay, nhan: `tháng ${Number(homNay.slice(5, 7))}` };
}
