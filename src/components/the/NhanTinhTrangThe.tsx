/** Tình trạng thẻ khách (cột tinh_trang của v_the_khach — đúng 6 giá trị DB tính ra): MỖI tình trạng MỘT màu riêng, dùng chung ở mọi chỗ hiện thẻ
 *  (danh sách thẻ, hồ sơ thẻ, hồ sơ khách, Khách dùng thẻ, Bán hàng). Có chữ nhãn + chấm màu, không chỉ dựa vào màu (chị Bích góp ý 10/11). */
export const TINH_TRANG_THE = {
  hoat_dong: { nhan: "Đang dùng", lop: "bg-sac-luc-nen text-sac-luc" },
  sap_het: { nhan: "Sắp hết buổi", lop: "bg-canh-bao-nen text-canh-bao" },
  hoan_thanh: { nhan: "Đã dùng hết", lop: "bg-sac-xanh-nen text-sac-xanh" },
  het_han: { nhan: "Hết hạn", lop: "bg-giay-tram text-muc-2" },
  khoa: { nhan: "Đang khoá", lop: "bg-sac-tim-nen text-sac-tim" },
  thu_hoi: { nhan: "Đã thu hồi", lop: "bg-loi-nen text-loi" },
} as const satisfies Record<string, { nhan: string; lop: string }>;
export type TinhTrangThe = keyof typeof TINH_TRANG_THE;

export const tinhTrangThe = (tt: string | null | undefined) => TINH_TRANG_THE[(tt ?? "hoat_dong") as TinhTrangThe] ?? { nhan: tt ?? "", lop: "bg-giay-tram text-muc-2" };

export function NhanTinhTrangThe({ tt }: { tt: string | null | undefined }) {
  const t = tinhTrangThe(tt);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-tag px-2 py-0.5 text-[12px] font-medium ${t.lop}`}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-[2px] bg-current" />{t.nhan}
    </span>
  );
}
