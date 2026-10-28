import "server-only";
import { sb } from "@/lib/db";
import { congNgay, ngayVN, tienVN } from "@/lib/dinh-dang";

export type LoaiKy = "tuan" | "thang" | "nam";
export type KyTongHop = { loai: LoaiKy; ky: string; tu: string; den: string; nhan: string };
const cuoiThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).toISOString().slice(0, 10);

/** Kỳ vừa kết thúc cần báo hôm nay (giờ HCM): Thứ Hai → tuần trước; ngày 1 → tháng trước; 1/1 → năm trước. Có thể trả nhiều kỳ cùng lúc. */
export function kyCanBaoHomNay(homNay: string): KyTongHop[] {
  const ra: KyTongHop[] = [];
  const [y, m, d] = homNay.split("-").map(Number);
  if (new Date(`${homNay}T00:00:00Z`).getUTCDay() === 1) {
    const tu = congNgay(homNay, -7), den = congNgay(homNay, -1);
    ra.push({ loai: "tuan", ky: tu, tu, den, nhan: `tuần ${ngayVN(tu).slice(0, 5)} – ${ngayVN(den).slice(0, 5)}` });
  }
  if (d === 1) {
    const nam = m === 1 ? y - 1 : y, thang = m === 1 ? 12 : m - 1;
    ra.push({ loai: "thang", ky: `${nam}-${String(thang).padStart(2, "0")}`, tu: `${nam}-${String(thang).padStart(2, "0")}-01`, den: cuoiThang(nam, thang), nhan: `tháng ${String(thang).padStart(2, "0")}/${nam}` });
  }
  if (m === 1 && d === 1) ra.push({ loai: "nam", ky: String(y - 1), tu: `${y - 1}-01-01`, den: `${y - 1}-12-31`, nhan: `năm ${y - 1}` });
  return ra;
}

/** Tổng hợp hiệu suất AMIA trong một kỳ, toàn bằng số liệu thật: doanh số, khách, lịch hẹn, lead, chuyên cần. */
export async function tinhTongHop(k: KyTongHop): Promise<{ tieuDe: string; noiDung: string; chiTiet: Record<string, number> }> {
  const db = sb(), tu = `${k.tu}T00:00:00+07:00`, den = `${congNgay(k.den, 1)}T00:00:00+07:00`;
  const [hd, khach, lich, lead, cc] = await Promise.all([
    db.from("hoa_don").select("tong_phai_thu, con_no, la_so_du_dau").eq("trang_thai", "hoan_thanh").gte("ngay_hd", k.tu).lte("ngay_hd", k.den).limit(50000),
    db.from("khach_hang").select("id", { count: "exact", head: true }).gte("tao_luc", tu).lt("tao_luc", den),
    db.from("lich_hen").select("trang_thai").gte("bat_dau", tu).lt("bat_dau", den).limit(50000),
    db.from("lead").select("id", { count: "exact", head: true }).gte("tao_luc", tu).lt("tao_luc", den),
    db.from("cham_cong").select("tre_phut, cong").gte("ngay", k.tu).lte("ngay", k.den).limit(50000),
  ]);
  // Hoá đơn nợ đầu kỳ (la_so_du_dau) là SỐ DƯ chuyển từ SalonHero, không phải doanh số: loại khỏi doanh số và số hoá đơn, nhưng vẫn tính vào còn nợ.
  const banHang = (hd.data ?? []).filter((r) => !r.la_so_du_dau);
  const doanhSo = banHang.reduce((a, r) => a + Number(r.tong_phai_thu), 0), conNo = (hd.data ?? []).reduce((a, r) => a + Number(r.con_no), 0);
  const nLich = lich.data?.length ?? 0, huy = (lich.data ?? []).filter((l) => l.trang_thai === "huy" || l.trang_thai === "khong_den").length;
  const luot = cc.data?.length ?? 0, tre = (cc.data ?? []).filter((c) => c.tre_phut > 0).length;
  const chiTiet = { doanhSo, soHoaDon: banHang.length, conNo, khachMoi: khach.count ?? 0, lich: nLich, lichHuy: huy, leadMoi: lead.count ?? 0, luotChamCong: luot, luotTre: tre };
  const noiDung = [
    `Bán hàng: ${chiTiet.soHoaDon} hoá đơn, doanh số ${tienVN(doanhSo)}${conNo > 0 ? `, còn nợ ${tienVN(conNo)}` : ""}.`,
    `Khách: ${chiTiet.khachMoi} khách mới, ${chiTiet.leadMoi} lead mới. Lịch hẹn: ${nLich} (huỷ/không đến ${huy}).`,
    luot ? `Chuyên cần: ${luot} lượt chấm công, đi trễ ${tre}.` : "Chuyên cần: chưa có lượt chấm công.",
  ].join(" ");
  return { tieuDe: `Tổng hợp hiệu suất ${k.nhan}`, noiDung, chiTiet };
}
