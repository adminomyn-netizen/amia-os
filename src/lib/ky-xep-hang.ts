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

/** Kỳ xem của tab Doanh thu (chị Lâm 11/11/2026: "có các tab tháng này, tháng trước, 90 ngày qua hoặc khoảng ngày tùy chỉnh hoặc là tuần này, hôm nay").
 *  Tập RIÊNG, không nới KyXh: tab Tổng quan cộng từ bản tính sẵn chỉ từ đầu tháng trước, kỳ 90 ngày / tùy chỉnh lọt sang đó sẽ thiếu số. */
export type KyDt = KyXh | "hom-qua" | "90-ngay" | "tuy-chinh";
export const DS_KY_DT: { ma: KyDt; ten: string }[] = [
  { ma: "hom-nay", ten: "Hôm nay" }, { ma: "hom-qua", ten: "Hôm qua" }, { ma: "tuan-nay", ten: "Tuần này" }, { ma: "thang-nay", ten: "Tháng này" },
  { ma: "thang-truoc", ten: "Tháng trước" }, { ma: "90-ngay", ten: "90 ngày qua" }, { ma: "tuy-chinh", ten: "Tùy chỉnh" },
];
export const docKyDt = (s: string | undefined): KyDt => (DS_KY_DT.some((k) => k.ma === s) ? (s as KyDt) : "thang-nay");
/** Khoảng tùy chỉnh dài nhất (ngày, gồm hai đầu): 90 ngày ~250 ms, một năm vẫn dưới 1 s. */
export const TOI_DA_NGAY = 366;
const laNgay = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
export const soNgayGom = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / 86_400_000) + 1;

/** Khoảng ngày (gồm hai đầu) của kỳ Doanh thu + nhãn ngắn cho tiêu đề ô ("Doanh thu tuần này"). Tùy chỉnh: ngày sai thì về tháng này,
 *  đảo ngược thì đổi chỗ, quá hôm nay thì chặn ở hôm nay, dài quá TOI_DA_NGAY thì cắt lấy đoạn cuối (catBot = true để báo). */
export function khoangKyDt(ky: KyDt, homNay: string, tuQ?: string, denQ?: string): { tu: string; den: string; nhan: string; catBot?: boolean } {
  const coNam = (d: string) => `${ngayThang(d)}/${d.slice(0, 4)}`;
  const ngan = (a: string, b: string) => (a === b ? ngayThang(a) : a.slice(0, 4) !== b.slice(0, 4) ? `${coNam(a)}–${coNam(b)}` : `${ngayThang(a)}–${ngayThang(b)}`);
  if (ky === "hom-qua") { const d = congNgayUtc(homNay, -1); return { tu: d, den: d, nhan: `hôm qua ${ngayThang(d)}` }; }
  if (ky === "90-ngay") return { tu: congNgayUtc(homNay, -89), den: homNay, nhan: "90 ngày qua" };
  if (ky === "tuy-chinh") {
    if (!laNgay(tuQ) && !laNgay(denQ)) return khoangKyDt("thang-nay", homNay);
    let tu = laNgay(tuQ) ? tuQ : denQ!, den = laNgay(denQ) ? denQ : tuQ!;
    if (tu > den) [tu, den] = [den, tu];
    if (den > homNay) den = homNay;
    if (tu > den) tu = den;
    let catBot = false;
    if (soNgayGom(tu, den) > TOI_DA_NGAY) { tu = congNgayUtc(den, -(TOI_DA_NGAY - 1)); catBot = true; }
    return { tu, den, nhan: ngan(tu, den), ...(catBot ? { catBot } : {}) };
  }
  if (ky === "hom-nay") return { tu: homNay, den: homNay, nhan: "hôm nay" };
  return khoangKy(ky, homNay);
}

/** Kỳ để so sánh: tháng này ↔ cùng số ngày đầu tháng trước (01/10–11/10, không quá cuối tháng); tháng trước ↔ trọn tháng trước nữa;
 *  tuần này ↔ cùng các thứ của tuần trước;
 *  còn lại ↔ đoạn dài bằng nhau ngay trước kỳ (hôm nay ↔ hôm qua, 90 ngày ↔ 90 ngày trước đó, tùy chỉnh ↔ bấy nhiêu ngày ngay trước). */
export function kyTruoc(ky: KyDt, tu: string, den: string): { tu: string; den: string } {
  if (ky === "thang-nay") {
    const tuT = congThang(tu, -1), cuoiT = congNgayUtc(tu, -1), denT = congThang(den, -1);
    return { tu: tuT, den: denT > cuoiT || denT.slice(5, 7) !== tuT.slice(5, 7) ? cuoiT : denT };
  }
  if (ky === "thang-truoc") { const tuT = congThang(tu, -1); return { tu: tuT, den: congNgayUtc(tu, -1) }; }
  if (ky === "tuan-nay") return { tu: congNgayUtc(tu, -7), den: congNgayUtc(den, -7) };
  const n = soNgayGom(tu, den);
  return { tu: congNgayUtc(tu, -n), den: congNgayUtc(tu, -1) };
}
