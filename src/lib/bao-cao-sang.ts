import { ngayVN } from "@/lib/dinh-dang";

/** Kết quả hàm bao_cao_sang_tinh (migration 0074): chỉ số lượng, không tiền, không số điện thoại. */
export type BaoCaoSang = {
  ngay: string; chi_nhanh_id: string | null;
  hom_qua: { ngay: string; so_hoa_don: number; lich_hoan_thanh: number; lich_huy: number; lich_khong_den: number; khach_moi: number };
  hom_nay: { ngay: string; so_lich: number; sinh_nhat: number; sinh_nhat_ten: string[]; nhac_den_han: number; nhac_qua_han: number; the_sap_het: number; tai_kham: number };
};

/** Văn bản báo cáo sáng sẵn để dán vào Zalo/Lark cho quản lý. */
export function vietBaoCaoSang(b: BaoCaoSang, tenChiNhanh: string | null): string {
  const q = b.hom_qua, n = b.hom_nay;
  const ten = n.sinh_nhat_ten ?? [];
  const sn = n.sinh_nhat > 0 ? `${n.sinh_nhat} khách sinh nhật (${ten.join(", ")}${n.sinh_nhat > ten.length ? ", …" : ""})` : "không có khách sinh nhật";
  return [
    `BÁO CÁO SÁNG ${ngayVN(b.ngay)} · ${tenChiNhanh ?? "Tất cả chi nhánh"}`,
    `Hôm qua (${ngayVN(q.ngay)}): ${q.so_hoa_don} hoá đơn · ${q.lich_hoan_thanh} lịch hoàn thành · ${q.lich_huy} lịch huỷ · ${q.lich_khong_den} khách không đến · ${q.khach_moi} khách mới.`,
    `Hôm nay: ${n.so_lich} lịch hẹn · ${sn} · ${n.nhac_den_han} nhắc đến hạn hôm nay${n.nhac_qua_han > 0 ? ` (còn ${n.nhac_qua_han} nhắc quá hạn chưa xử lý)` : ""} · ${n.the_sap_het} thẻ sắp hết · ${n.tai_kham} khách đến hẹn tái khám.`,
  ].join("\n");
}
