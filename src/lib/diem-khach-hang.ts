// "Điểm khách hàng" của SalonHero (#/loyaltyPoint, đọc 29/10/2026): 3 khối — quy đổi tiền → điểm, quy đổi điểm → tiền, phân hạng theo điểm tích luỹ.
// MỘT nguồn dữ liệu cho mỗi thiết lập (không có bản sao):
//   • tiền cho 1 điểm / 1 điểm đổi bao nhiêu tiền theo từng hạng = bảng hang_diem_cau_hinh (như trước, các hàm DB diem_tich_duoc / diem_ra_tien đọc bảng này).
//     SalonHero lưu CẶP "X ₫ = Y điểm"; AMIA chỉ lưu tỉ lệ (X chia Y đồng cho 1 điểm) nên màn này luôn hiện dạng "… ₫ = 1 điểm". Nhập "20.000.000 = 200" vẫn lưu đúng tỉ lệ 100.000đ/điểm.
//   • bật/tắt đổi điểm ở Thu ngân + số tiền cho 1 điểm = cau_hinh diem.doi_bat / diem.doi_tien (Thu ngân đang đọc hai khoá này).
//   • các khoá còn lại (áp dụng tích điểm, loại tính điểm, ngưỡng hạng, tự động tính hạng) = cau_hinh diem.* — CÓ HIỆU LỰC từ 0214: DB tự cộng điểm khi chốt đơn lập ở AMIA
//     (hàm diem_cong_hoa_don) và tự nâng hang_goc khi điểm tích luỹ đạt ngưỡng (trigger khach_diem_so_doi_hang); "cho thu ngân đổi điểm" + tỉ lệ đổi theo hạng đọc ở diem-thuong.ts.
import type { sb } from "@/lib/db";
import { HANG_KHACH } from "@/lib/diem-hang";

export type Hang = (typeof HANG_KHACH)[number];
export type Cap = { tien: number; diem: number };
export type DiemKhachHang = {
  tichBat: boolean; tichMacDinh: Cap; tichHang: Record<Hang, Cap>; tichDv: boolean; tichSp: boolean; tichThe: boolean; doiThuNgan: boolean;
  doiBat: boolean; doiMacDinh: Cap; doiHang: Record<Hang, Cap>;
  tuDongHang: boolean; nguong: Record<Hang, number>;
};
const heHang = <T,>(f: (h: Hang) => T) => Object.fromEntries(HANG_KHACH.map((h) => [h, f(h)])) as Record<Hang, T>;
export const NGUONG_MAC_DINH: Record<Hang, number> = { Thường: 0, Bạc: 200, Vàng: 350, "Bạch kim": 500, "Kim cương": 1000 };
export const DIEM_KH_MAC_DINH: DiemKhachHang = {
  tichBat: true, tichMacDinh: { tien: 100000, diem: 1 }, tichHang: heHang(() => ({ tien: 100000, diem: 1 })), tichDv: true, tichSp: true, tichThe: true, doiThuNgan: true,
  doiBat: false, doiMacDinh: { tien: 10000, diem: 1 }, doiHang: heHang(() => ({ tien: 10000, diem: 1 })),
  tuDongHang: true, nguong: { ...NGUONG_MAC_DINH },
};
export const KHOA_DIEM_KH = ["diem.tich_bat", "diem.tich_tien", "diem.tich_dv", "diem.tich_sp", "diem.tich_the", "diem.doi_thu_ngan", "diem.doi_bat", "diem.doi_tien", "diem.tu_dong_hang", "diem.nguong_bac", "diem.nguong_vang", "diem.nguong_bach_kim", "diem.nguong_kim_cuong"];
const KHOA_NGUONG: Record<Exclude<Hang, "Thường">, string> = { Bạc: "diem.nguong_bac", Vàng: "diem.nguong_vang", "Bạch kim": "diem.nguong_bach_kim", "Kim cương": "diem.nguong_kim_cuong" };

type DongCH = { khoa: string; gia_tri: string };
type DongHang = { hang: string; tien_moi_diem: number | string; tien_doi_moi_diem: number | string };
export function docDiemKhachHang(ch: DongCH[] | null, hang: DongHang[] | null): DiemKhachHang {
  const m = new Map((ch ?? []).map((x) => [x.khoa, x.gia_tri]));
  const d = DIEM_KH_MAC_DINH;
  const b = (k: string, mac: boolean) => (m.has(k) ? m.get(k) === "1" : mac);
  const n = (v: unknown, mac: number, min = 0) => { const x = Number(v); return v !== undefined && v !== null && v !== "" && Number.isFinite(x) && x >= min ? Math.round(x) : mac; };
  const hm = new Map((hang ?? []).map((r) => [r.hang, r]));
  return {
    tichBat: b("diem.tich_bat", d.tichBat), tichMacDinh: { tien: n(m.get("diem.tich_tien"), d.tichMacDinh.tien, 1), diem: 1 },
    tichHang: heHang((h) => ({ tien: n(hm.get(h)?.tien_moi_diem, d.tichHang[h].tien, 1), diem: 1 })),
    tichDv: b("diem.tich_dv", d.tichDv), tichSp: b("diem.tich_sp", d.tichSp), tichThe: b("diem.tich_the", d.tichThe), doiThuNgan: b("diem.doi_thu_ngan", d.doiThuNgan),
    doiBat: b("diem.doi_bat", d.doiBat), doiMacDinh: { tien: n(m.get("diem.doi_tien"), d.doiMacDinh.tien, 0), diem: 1 },
    doiHang: heHang((h) => ({ tien: n(hm.get(h)?.tien_doi_moi_diem, d.doiHang[h].tien, 0), diem: 1 })),
    tuDongHang: b("diem.tu_dong_hang", d.tuDongHang),
    nguong: heHang((h) => (h === "Thường" ? 0 : n(m.get(KHOA_NGUONG[h]), NGUONG_MAC_DINH[h]))),
  };
}

export async function layDiemKhachHang(db: ReturnType<typeof sb>): Promise<DiemKhachHang> {
  const [{ data: ch }, { data: hang }] = await Promise.all([db.from("cau_hinh").select("khoa, gia_tri").in("khoa", KHOA_DIEM_KH), db.from("hang_diem_cau_hinh").select("hang, tien_moi_diem, tien_doi_moi_diem")]);
  return docDiemKhachHang(ch, hang);
}

/** Cặp "X đồng = Y điểm" → số đồng cho 1 điểm. Phải chia hết để không lệch tiền ngầm; null nếu không hợp lệ. */
export function tiLeMotDiem(c: Cap): number | null {
  if (!Number.isInteger(c.tien) || !Number.isInteger(c.diem) || c.diem < 1 || c.tien < 0) return null;
  return c.tien % c.diem === 0 ? c.tien / c.diem : null;
}

export function loiDiemKhachHang(t: DiemKhachHang): string {
  for (const h of HANG_KHACH) {
    const tich = tiLeMotDiem(t.tichHang[h]), doi = tiLeMotDiem(t.doiHang[h]);
    if (tich === null || tich < 1000 || tich > 1_000_000_000) return `Hạng ${h}: số tiền chia số điểm phải chẵn và từ 1.000đ đến 1 tỷ đồng cho 1 điểm.`;
    if (doi === null || doi > 10_000_000) return `Hạng ${h}: một điểm đổi được từ 0đ đến 10.000.000đ (số tiền phải chia hết cho số điểm).`;
  }
  const tm = tiLeMotDiem(t.tichMacDinh), dm = tiLeMotDiem(t.doiMacDinh);
  if (tm === null || tm < 1000 || tm > 1_000_000_000) return "Số tiền đơn hàng quy đổi chia số điểm nhận được phải chẵn và từ 1.000đ đến 1 tỷ đồng cho 1 điểm.";
  if (dm === null || dm < 100 || dm > 10_000_000) return "Số tiền cho 1 điểm khi đổi từ 100đ đến 10.000.000đ (phải chia hết cho số điểm).";
  const mang = HANG_KHACH.map((h) => t.nguong[h]);
  if (mang.some((x) => !Number.isInteger(x) || x < 0 || x > 1_000_000_000)) return "Mức điểm các hạng là số nguyên không âm.";
  if (mang[0] !== 0) return "Hạng Thường bắt đầu từ 0 điểm.";
  for (let i = 1; i < mang.length; i++) if (mang[i] <= mang[i - 1]) return "Mức điểm phải tăng dần: Thường < Bạc < Vàng < Bạch kim < Kim cương.";
  return "";
}

/** Dòng cau_hinh cần ghi (hang_diem_cau_hinh ghi riêng). */
export function dongDiemKhachHang(t: DiemKhachHang) {
  const bit = (v: boolean) => (v ? "1" : "0");
  return [
    { khoa: "diem.tich_bat", gia_tri: bit(t.tichBat), ghi_chu: "1 = áp dụng quy đổi tiền thành điểm: tự cộng điểm khi chốt hoá đơn lập ở AMIA (0214)" },
    { khoa: "diem.tich_tien", gia_tri: String(tiLeMotDiem(t.tichMacDinh)), ghi_chu: "Số đồng cho 1 điểm — dòng mặc định ở màn Điểm khách hàng (SalonHero: 100.000đ = 1 điểm)" },
    { khoa: "diem.tich_dv", gia_tri: bit(t.tichDv), ghi_chu: "1 = tính điểm khi khách mua dịch vụ" }, { khoa: "diem.tich_sp", gia_tri: bit(t.tichSp), ghi_chu: "1 = tính điểm khi khách mua sản phẩm" },
    { khoa: "diem.tich_the", gia_tri: bit(t.tichThe), ghi_chu: "1 = tính điểm khi khách mua thẻ dịch vụ" }, { khoa: "diem.doi_thu_ngan", gia_tri: bit(t.doiThuNgan), ghi_chu: "1 = có lựa chọn đổi điểm cho thu ngân (0 = Thu ngân không cho đổi điểm)" },
    { khoa: "diem.doi_bat", gia_tri: bit(t.doiBat), ghi_chu: "Cho đổi điểm thưởng thành giảm giá ở Thu ngân: 1 = bật, 0 = tắt (SalonHero đang tắt)" },
    { khoa: "diem.doi_tien", gia_tri: String(tiLeMotDiem(t.doiMacDinh)), ghi_chu: "Số đồng được giảm cho 1 điểm thưởng (SalonHero: 1 điểm = 10.000đ)" },
    { khoa: "diem.tu_dong_hang", gia_tri: bit(t.tuDongHang), ghi_chu: "1 = tự nâng hạng khách khi điểm tích luỹ đạt ngưỡng (0214)" },
    ...(Object.entries(KHOA_NGUONG) as [Exclude<Hang, "Thường">, string][]).map(([h, khoa]) => ({ khoa, gia_tri: String(t.nguong[h]), ghi_chu: `Điểm tối thiểu của hạng ${h}` })),
  ];
}
