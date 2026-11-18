// Báo cáo "Hoá đơn trong ngày" (chi nhánh Vinh 18/11/2026): thu ngân / kế toán kiểm khách đã lên hoá đơn đủ chưa.
// CHỈ ĐỌC sổ hoá đơn. Chia hai nhóm theo ĐÚNG quy tắc màn Thu ngân (kieuTuDong ở components/ban-hang/Pos.tsx):
// mọi dòng là dịch vụ → Hoá đơn dịch vụ; có dòng sản phẩm / thẻ / liệu trình (kể cả đơn lẫn) → Hoá đơn bán hàng.
import type { sb } from "@/lib/db";
import { congNgay } from "@/lib/dinh-dang";
import { docHet } from "@/lib/xuat-excel";

type Db = ReturnType<typeof sb>;
export type LoaiHoaDonNgay = "dich_vu" | "ban";
export type DongHoaDonNgay = {
  id: string; ma: string; maSh: string | null; ngay: string; taoLuc: string; trangThai: "nhap" | "hoan_thanh";
  khachId: string | null; khach: string; maKhach: string; hang: string; phaiThu: number; daThu: number; conNo: number; nguoiLap: string; loai: LoaiHoaDonNgay;
};
export type TongHoaDonNgay = { soDon: number; phaiThu: number; daThu: number; conNo: number; soDangXuLy: number };

/** Khoảng tối đa của báo cáo này (đọc từng hoá đơn kèm dòng hàng). */
export const TOI_DA_NGAY_HD = 31;

/** Như kieuTuDong của Thu ngân: đơn có dòng và mọi dòng là dịch vụ → dịch vụ; còn lại → bán hàng. */
export function phanLoaiHoaDon(dong: { loai: string }[]): LoaiHoaDonNgay {
  return dong.length > 0 && dong.every((d) => d.loai === "dich_vu") ? "dich_vu" : "ban";
}

/** "Peel da × 2, Kem chống nắng" — gộp dòng trùng tên. */
export function tomTatHang(dong: { ten: string; so_luong: number }[]): string {
  const gop = new Map<string, number>();
  for (const d of dong) gop.set(d.ten, (gop.get(d.ten) ?? 0) + Number(d.so_luong || 1));
  return [...gop].map(([ten, sl]) => (sl > 1 ? `${ten} × ${sl}` : ten)).join(", ");
}

/** Tổng cuối bảng: chỉ tính hoá đơn hoàn thành (như tệp Excel ở Hoá đơn); đơn đang xử lý đếm riêng. */
export function tongHoaDonNgay(ds: DongHoaDonNgay[]): TongHoaDonNgay {
  const xong = ds.filter((r) => r.trangThai === "hoan_thanh");
  return {
    soDon: xong.length, phaiThu: xong.reduce((t, r) => t + r.phaiThu, 0), daThu: xong.reduce((t, r) => t + r.daThu, 0),
    conNo: xong.reduce((t, r) => t + r.conNo, 0), soDangXuLy: ds.length - xong.length,
  };
}

/** Giữ khoảng ngày trong TOI_DA_NGAY_HD ngày (tính lùi từ ngày cuối). */
export function khoangHoaDonNgay(tu: string, den: string) {
  const quaDai = congNgay(tu, TOI_DA_NGAY_HD - 1) < den;
  return { tu: quaDai ? congNgay(den, -(TOI_DA_NGAY_HD - 1)) : tu, den, quaDai };
}

type HdDoc = {
  id: string; ma: string; sh_ma: string | null; ngay_hd: string; tao_luc: string; trang_thai: string; tong_phai_thu: number | null; da_thu: number | null; con_no: number | null;
  khach_id: string | null; la_lich_su: boolean | null; thu_ngan_ten: string | null;
  khach: { ma: string | null; ho_ten: string | null } | null; lap: { ho_ten: string | null } | null; dong: { loai: string; ten: string; so_luong: number }[] | null;
};

/** Chuyển một hoá đơn đọc từ DB thành dòng báo cáo (tách riêng để test không cần DB). */
export function dongTuHoaDon(h: HdDoc): DongHoaDonNgay {
  const dong = h.dong ?? [];
  return {
    id: h.id, ma: h.ma, maSh: h.sh_ma, ngay: h.ngay_hd, taoLuc: h.tao_luc, trangThai: h.trang_thai === "hoan_thanh" ? "hoan_thanh" : "nhap",
    khachId: h.khach_id, khach: h.khach_id ? h.khach?.ho_ten ?? "" : "Khách lẻ", maKhach: h.khach?.ma ?? "", hang: tomTatHang(dong),
    phaiThu: Number(h.tong_phai_thu ?? 0), daThu: Number(h.da_thu ?? 0), conNo: h.trang_thai === "hoan_thanh" ? Number(h.con_no ?? 0) : 0,
    // Như danh sách Hoá đơn: đơn nhập từ SalonHero lấy tên thu ngân đã hoàn tất đơn, đơn lập ở AMIA lấy người lập.
    nguoiLap: (h.la_lich_su ? h.thu_ngan_ten : h.lap?.ho_ten) ?? "", loai: phanLoaiHoaDon(dong),
  };
}

/** Hoá đơn (hoàn thành + đang xử lý, bỏ đơn huỷ và công nợ đầu kỳ) theo ngày lập, của một chi nhánh (hoặc mọi chi nhánh). Sắp theo giờ tạo. */
export async function layHoaDonTrongNgay(db: Db, tu: string, den: string, cn?: string): Promise<DongHoaDonNgay[]> {
  const ds = await docHet<HdDoc>((a, b) => {
    let q = db.from("hoa_don")
      .select("id, ma, sh_ma, ngay_hd, tao_luc, trang_thai, tong_phai_thu, da_thu, con_no, khach_id, la_lich_su, thu_ngan_ten, khach:khach_hang!hoa_don_khach_id_fkey(ma, ho_ten), lap:nhan_vien!hoa_don_nguoi_lap_id_fkey(ho_ten), dong:hoa_don_dong!hoa_don_dong_hoa_don_id_fkey(loai, ten, so_luong)")
      .gte("ngay_hd", tu).lte("ngay_hd", den).neq("trang_thai", "huy").eq("la_so_du_dau", false);
    if (cn) q = q.eq("chi_nhanh_id", cn);
    return q.order("ngay_hd").order("tao_luc").order("id").range(a, b) as unknown as PromiseLike<{ data: HdDoc[] | null; error: { message: string } | null }>;
  });
  return ds.map(dongTuHoaDon);
}
