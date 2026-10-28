import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { chiNhanhXem, docNguongCSKH, docTheSapHet, soTrongKhoang } from "@/lib/cham-soc-khach";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { ghiNhacTheSapHet } from "../cham-soc/actions";

/** Chọn nhanh "Tình trạng" như SalonHero (Khách hàng dùng thẻ): sắp hết tiền/lần · hết hạn sau 1 tuần · hết hạn sau 1 tháng. */
const TINH_TRANG = [{ ma: "", nhan: "Tất cả" }, { ma: "sap_het", nhan: "Sắp hết tiền/lần" }, { ma: "tuan", nhan: "Hết hạn sau 1 tuần" }, { ma: "thang", nhan: "Hết hạn sau 1 tháng" }];

/** /khach-hang/the-sap-het — Thẻ sắp hết: thẻ lần còn ít buổi hoặc thẻ (lần/tiền) sắp hết hạn, kèm khách và nút ghi nhắc. Ngưỡng chỉnh được. */
export default async function TheSapHet({ searchParams }: { searchParams: Promise<{ cn?: string; tt?: string; buoi?: string; ngay?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const ng = await docNguongCSKH();
  const { cn, ds: dsCn, khoa } = await chiNhanhXem(nd, sp.cn);
  const tt = TINH_TRANG.some((x) => x.ma === sp.tt) ? (sp.tt ?? "") : "";
  let buoi = soTrongKhoang(sp.buoi, 0, 50, ng.sapHetBuoi)!;
  const ngay = soTrongKhoang(sp.ngay, 0, 365, ng.sapHetNgay)!;
  const buoiHieuLuc = tt === "tuan" || tt === "thang" ? -1 : buoi;           // -1 = không xét số buổi
  const ngayHieuLuc = tt === "sap_het" ? -1 : tt === "tuan" ? 7 : tt === "thang" ? 30 : ngay; // -1 = không xét hạn
  if (tt === "tuan" || tt === "thang") buoi = ng.sapHetBuoi;
  const ds = await docTheSapHet(cn, buoiHieuLuc, ngayHieuLuc);
  const tenCn = new Map(dsCn.map((c) => [c.id, c.ten]));
  const tong = ds[0]?.tong ?? 0;
  const sua = coQuyen(nd, "khach.sua");

  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div>
        <h1 className="chu-tieu-de text-[22px] text-muc">Thẻ sắp hết</h1>
        <p className="text-[13px] text-muc-3">Thẻ liệu trình còn ≤ {buoi} buổi hoặc thẻ còn hạn ≤ {ngay} ngày. Thẻ không giới hạn buổi và thẻ đã hết/thu hồi/khoá không tính.</p>
      </div>
      <form method="get" className="flex flex-wrap items-end gap-3 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-56"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Tình trạng</span>
          <div className="w-52"><Chon ten="tt" ariaLabel="Tình trạng" giaTriMacDinh={tt} luaChon={TINH_TRANG.map((x) => ({ gia_tri: x.ma, nhan: x.nhan }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Còn ≤ (buổi)</span>
          <input name="buoi" inputMode="numeric" defaultValue={buoi} className={`${O_NHAP} !h-10 !w-24 tabular-nums`} /></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Hết hạn trong (ngày)</span>
          <input name="ngay" inputMode="numeric" defaultValue={ngay} className={`${O_NHAP} !h-10 !w-28 tabular-nums`} /></label>
        <button type="submit" className={NUT_PHU}>Lọc</button>
      </form>
      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> thẻ sắp hết{tong > ds.length ? ` (hiện ${ds.length} thẻ đầu, hết hạn sớm nhất trước)` : ""}{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}</p>
      <Bang duLieu={ds} khoa={(r) => r.the_id} trong="Không có thẻ nào sắp hết với điều kiện này."
        cot={[
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => <div><Link href={`/khach-hang/${r.khach_id}`} className="font-medium text-muc hover:underline">{r.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{r.dien_thoai} · {r.ma}</div></div> },
          { nhan: "Tên thẻ", hienThi: (r) => <div className="text-[13px]"><Link href={`/the/${r.the_id}`} className="font-medium text-nhan-dam hover:underline">{r.ma_the}</Link><div className="text-muc-3">{r.ten_goi}</div></div> },
          { nhan: "Ngày cấp", hienThi: (r) => <span className="tabular-nums">{ngayVN(r.ngay_cap)}</span> },
          { nhan: "Hết hạn", hienThi: (r) => r.han_dung && r.han_dung >= "2000-01-01" ? <div className="text-[13px] tabular-nums">{ngayVN(r.han_dung)}<div className={r.so_ngay_con != null && r.so_ngay_con <= 7 ? "text-loi" : "text-muc-3"}>{r.so_ngay_con === 0 ? "Hôm nay" : `còn ${r.so_ngay_con} ngày`}</div></div> : <span className="text-muc-3">Không hạn</span> },
          { nhan: "Còn lại", phai: true, hienThi: (r) => <span className="tabular-nums">{r.loai === "lan" ? `${r.so_buoi_con} buổi` : tienVN(r.so_du_tien)}</span> },
          { nhan: "Tình trạng", hienThi: (r) => <NhanTrangThai kieu={r.ly_do === "het_han" ? "loi" : "cho"}>{r.ly_do === "ca_hai" ? "Sắp hết lần và hạn" : r.ly_do === "het_buoi" ? "Sắp hết lần" : "Sắp hết hạn"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {coQuyen(nd, "lich.sua") && <Link href={`/lich-hen?khach=${r.khach_id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Đặt lịch</Link>}
              {sua && <NutHop kieu="chu" nhan="Ghi nhắc" tieuDe="Ghi nhắc thẻ sắp hết" xacNhan={`Ghi nhắc thẻ ${r.ma_the} sắp hết cho ${r.ho_ten} vào mục nhắc chăm sóc của khách? (Không gửi tin nhắn cho khách.)`} nhanLuu="Ghi nhắc" an={{ khach_id: r.khach_id, the_id: r.the_id, han_dung: r.han_dung ?? "" }} action={ghiNhacTheSapHet} />}
            </span>) },
        ]} />
    </div>
  );
}
