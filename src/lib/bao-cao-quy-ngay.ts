// Báo cáo quỹ ngày: dựng bảng ngày × quỹ từ số tiền theo (ngày, quỹ, nhóm, hướng). Phần thuần để kiểm thử.
export const NHOM_THU = ["Thu từ khách", "Thu nội bộ", "Thu từ đối tác - NCC", "Thu tài chính"] as const;
export const NHOM_CHI = ["Chi cho khách", "Chi đối tác - NCC", "Chi nội bộ"] as const;
export type DongTien = { ngay: string; quy_id: string; nhom: string | null; huong: string; tien: number };
export type QuyBC = { id: string; ten: string; dau: number };
export type DongQuyNgay = {
  ngay: string; quyId: string | null; ten: string; dau: number; thu: Record<string, number>; tongThu: number;
  chi: Record<string, number>; tongChi: number; chuyen: number; cuoi: number; tong: boolean;
};

const cong = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const trong = (nhom: readonly string[]) => Object.fromEntries(nhom.map((n) => [n, 0])) as Record<string, number>;

/** Mỗi ngày trong [tu, den] ra một dòng cho từng quỹ và một dòng TỔNG (khi có từ 2 quỹ). Tồn cuối ngày này là tồn đầu ngày sau; chuyển quỹ = nạp − rút. Nhóm lạ (không thuộc 7 nhóm) tính vào nhóm nội bộ cùng hướng. */
export function dungBaoCaoQuy(quy: QuyBC[], dong: DongTien[], tu: string, den: string): DongQuyNgay[] {
  const theoNgay = new Map<string, DongTien[]>();
  for (const d of dong) { const ds = theoNgay.get(d.ngay) ?? []; ds.push(d); theoNgay.set(d.ngay, ds); }
  const ton = new Map(quy.map((q) => [q.id, q.dau]));
  const kq: DongQuyNgay[] = [];
  for (let ngay = tu; ngay <= den; ngay = cong(ngay, 1)) {
    const trongNgay = theoNgay.get(ngay) ?? [];
    const cacDong: DongQuyNgay[] = quy.map((q) => {
      const thu = trong(NHOM_THU), chi = trong(NHOM_CHI);
      let chuyen = 0;
      for (const d of trongNgay) {
        if (d.quy_id !== q.id) continue;
        if (d.huong === "thu") thu[(NHOM_THU as readonly string[]).includes(d.nhom ?? "") ? (d.nhom as string) : "Thu nội bộ"] += d.tien;
        else if (d.huong === "chi") chi[(NHOM_CHI as readonly string[]).includes(d.nhom ?? "") ? (d.nhom as string) : "Chi nội bộ"] += d.tien;
        else if (d.huong === "nap") chuyen += d.tien;
        else if (d.huong === "rut") chuyen -= d.tien;
      }
      const tongThu = Object.values(thu).reduce((a, b) => a + b, 0), tongChi = Object.values(chi).reduce((a, b) => a + b, 0);
      const dau = ton.get(q.id) ?? 0, cuoi = dau + tongThu - tongChi + chuyen;
      ton.set(q.id, cuoi);
      return { ngay, quyId: q.id, ten: q.ten, dau, thu, tongThu, chi, tongChi, chuyen, cuoi, tong: false };
    });
    kq.push(...cacDong);
    if (cacDong.length > 1) {
      const gop = (k: "thu" | "chi", nhom: readonly string[]) => Object.fromEntries(nhom.map((n) => [n, cacDong.reduce((t, r) => t + r[k][n], 0)])) as Record<string, number>;
      const sum = (f: (r: DongQuyNgay) => number) => cacDong.reduce((t, r) => t + f(r), 0);
      kq.push({ ngay, quyId: null, ten: "TỔNG CỘNG", dau: sum((r) => r.dau), thu: gop("thu", NHOM_THU), tongThu: sum((r) => r.tongThu), chi: gop("chi", NHOM_CHI), tongChi: sum((r) => r.tongChi), chuyen: sum((r) => r.chuyen), cuoi: sum((r) => r.cuoi), tong: true });
    }
  }
  return kq;
}
