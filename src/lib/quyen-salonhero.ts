import type { Quyen, VaiTro } from "@/lib/quyen";
import { SH_MA_TRAN, type ShVai } from "@/lib/quyen-salonhero-du-lieu";

/** Chị Lâm chốt 29/10/2026: quyền AMIA OS làm Y HỆT SalonHero, bê nguyên toàn bộ, không cắt quyền rộng.
 *  Nguồn duy nhất là SH_MA_TRAN (227 quyền × 10 vai SalonHero). Mỗi quyền AMIA có ánh xạ (QUYEN_TU_SH) sang một hay nhiều khoá SalonHero: có BẤT KỲ khoá nào bật là được. */
export const VAI_SH_CUA_AMIA: Partial<Record<VaiTro, ShVai>> = {
  quan_ly: "manager", ke_toan: "accountant", thu_ngan: "cashier", tu_van: "sale", ktv: "operator",
  bac_si: "doctor", marketing: "marketing", thu_kho: "stocktaker", nha_dau_tu: "investor",
};

export const QUYEN_TU_SH: Partial<Record<Quyen, string[]>> = {
  "khach.xem": ["customer.read", "customer.readByLoc"],  // SalonHero: Quản lý/CTV chỉ có readByLoc (xem khách theo cơ sở) nhưng route /customer vẫn mở
  "khach.sua": ["customer.create", "customer.update"],
  "khach.nhap": ["customer.create"],
  "khach.xuat": ["customer.export"],
  "khach.sdt": ["customer.customerPhone.read"],
  "khach.email": ["customer.customerEmail.read"],
  "lich.xem": ["booking.read"],
  "lich.sua": ["booking.create", "booking.update", "booking.delete"],
  "lich.xuat": ["booking.export"],
  "ban.xem": ["pos.read"],
  "ban.tao": ["pos.create"],
  "ban.huy": ["pos.void", "pos.delete"],
  "ban.sua": ["pos.update"],  // Sửa hoá đơn đã chốt = về nháp (SalonHero nút "Sửa": quản lý, kế toán, nhà đầu tư, chủ — câu 4, 03/11/2026)
  "ban.giamgia": ["pos.discount.update"],
  "ban.sua_khoa": ["pos.editLockedOrder.update"],
  "ban.toan_co_so": ["pos.readByLoc.read"],
  "ban.tip": ["pos.tip.update"],
  "no.thu": ["pos.update", "reportCustomer.customerDebt.update", "reportCustomer.customerDebt.create"],
  "no.xoa": ["reportCustomer.customerDebt.delete"],  // Xoá nợ / điều chỉnh nợ: SalonHero chỉ Chủ có (câu 3, 03/11/2026)
  "the.xem": ["settingCustomer.memberCards.read", "reportCustomer.useCardHistory.read", "pos.read"],
  "the.dieuchinh": ["settingCustomer.memberCards.update"],
  "danhmuc.sua": ["seviceAndProduct.service.update", "seviceAndProduct.service.create", "seviceAndProduct.product.update", "seviceAndProduct.product.create", "seviceAndProduct.card.update", "seviceAndProduct.card.create"],
  "kho.xem": ["seviceAndProduct.inventory.read", "reportInventory.inventory.read"],
  "kho.nhap": ["seviceAndProduct.importInventory.create", "seviceAndProduct.exportInventory.create", "seviceAndProduct.transfer.create"],
  "baocao.xem": ["reports.read", "reportCustomer.read", "reportOperator.read", "reportInventory.read", "reportFinancial.read"],
  "baocao.tien": ["reportFinancial.read", "reportOperator.commission.read"],
  "quy.xem": ["reportFinancial.cost.read", "reportFinancial.costAndBalance.read"],
  "quy.ghi": ["reportFinancial.cost.create", "reportFinancial.cost.update", "reportFinancial.expenseInvoice.create"],
  "quy.dao": ["reportFinancial.cost.delete"],  // Đảo phiếu = xoá phiếu SalonHero: chỉ Kế toán (và Chủ) có
  "luong.xem": ["reportOperator.salary.read"],
  "cong.xem": ["reportOperator.timeSheet.read"],
  "cong.sua": ["settingOperator.timeSheet.update", "settingOperator.timeSheet.create"],
  "nhanvien.quanly": ["settingOperator.operator.update", "settingOperator.operator.create", "settingMerchant.location.update"],
  "mkt.xem": ["reminder.read", "settingCustomer.sms.read"],
  "mkt.sua": ["reminder.create", "reminder.update"],
};

/** Quyền AMIA của một vai SalonHero, suy từ ma trận. */
export function quyenTuSalonHero(vai: ShVai): Quyen[] {
  const m = SH_MA_TRAN[vai];
  return (Object.entries(QUYEN_TU_SH) as [Quyen, string[]][]).filter(([, ks]) => ks.some((k) => m[k] === true)).map(([q]) => q);
}

/** Hợp nhất: quyền AMIA-only (không có ánh xạ) giữ nguyên bản mặc định cũ; quyền có ánh xạ lấy THEO SalonHero (thêm cả bớt). */
export function ganSalonHero(vt: VaiTro, macDinhCu: Quyen[]): Quyen[] {
  const vai = VAI_SH_CUA_AMIA[vt];
  if (!vai) return macDinhCu;
  const coAnhXa = new Set(Object.keys(QUYEN_TU_SH) as Quyen[]);
  const giu = macDinhCu.filter((q) => !coAnhXa.has(q));
  return [...new Set([...giu, ...quyenTuSalonHero(vai)])];
}
