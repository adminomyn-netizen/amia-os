import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { O_NHAP, NUT_PHU } from "@/components/ui/dinh-dang";
import { gioBaThu, tomTatGio } from "@/lib/gio-lam-viec";
import { luuChiNhanhCaiDat, xoaChiNhanhCaiDat } from "./actions";

/** Quản lý chi nhánh dạng thẻ, đối chiếu SalonHero #/locations: tên, địa chỉ, điện thoại, nhãn "Hiện thị ở web đặt lịch", Xem bản đồ, Giờ làm việc, Sửa, Xoá. Thành phố / Phường-Quận nhập tay (AMIA chưa có danh mục địa giới). */
export default async function TrangChiNhanh({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { q = "" } = await searchParams;
  const quanLy = coQuyen(nd, "nhanvien.quanly");
  const db = sb();
  const [{ data: cn }, { data: ch }] = await Promise.all([db.from("chi_nhanh").select("*").order("thu_tu").order("ma"), db.from("cua_hang").select("gio_lam_viec").eq("id", 1).maybeSingle()]);
  const tat = cn ?? [];
  const k = boDau(q.trim());
  const ds = tat.filter((c) => !k || boDau(`${c.ten} ${c.ma} ${c.dia_chi ?? ""} ${c.dien_thoai ?? ""}`).includes(k));
  const truong: Truong[] = [
    { ten: "ma", nhan: "Mã", loai: "chu", batBuoc: true }, { ten: "ten", nhan: "Tên chi nhánh", loai: "chu", batBuoc: true },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", rong: true, goiY: "Mô tả về chi nhánh" }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu", goiY: "0123456789" },
    { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", batBuoc: true, rong: true }, { ten: "thanh_pho", nhan: "Thành phố", loai: "chu" }, { ten: "phuong_quan", nhan: "Phường/Quận", loai: "chu" },
    { ten: "hien_dat_lich", nhan: "Hiện thị ở web đặt lịch", loai: "chon", luaChon: [{ gia_tri: "hien", nhan: "Hiện thị ở web đặt lịch" }, { gia_tri: "an", nhan: "Ẩn ở web đặt lịch" }] },
    { ten: "thu_tu", nhan: "Thứ tự hiện (nhỏ đứng trước)", loai: "so" }, { ten: "hoat_dong", nhan: "Đang hoạt động", loai: "gat" },
  ];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Quản lý chi nhánh" phu={`Tổng số chi nhánh: ${tat.length}`}>
        {quanLy && <NutHop nhan="Thêm chi nhánh" tieuDe="Thêm chi nhánh" truong={truong} rong giaTri={{ hoat_dong: true, thu_tu: 100, hien_dat_lich: "hien" }} action={luuChiNhanhCaiDat} />}
      </TieuDeTrang>
      <form method="get" className="mb-5 flex max-w-md gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Tìm theo tên chi nhánh, địa chỉ..." aria-label="Tìm chi nhánh" className={O_NHAP} autoComplete="off" />
        <button type="submit" className={NUT_PHU}>Tìm</button>
      </form>
      <div className="grid gap-5 lg:grid-cols-2">
        {ds.map((c) => (
          <article key={c.id} className="the-noi the-noi-thap p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-[18px] font-semibold text-nhan-dam">{c.ten}</h2>
              <span className="flex flex-wrap gap-1.5">
                {!c.hoat_dong && <NhanTrangThai kieu="tram">Ngừng hoạt động</NhanTrangThai>}
                <NhanTrangThai kieu={c.hien_dat_lich ? "tot" : "tram"}>{c.hien_dat_lich ? "Hiện thị ở web đặt lịch" : "Ẩn ở web đặt lịch"}</NhanTrangThai>
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex gap-2"><dt className="flex shrink-0 items-center gap-1.5 text-muc-3"><MapPin aria-hidden strokeWidth={1.6} className="h-4 w-4" />Địa chỉ:</dt><dd className="min-w-0 text-muc-2">{[c.dia_chi, c.phuong_quan, c.thanh_pho].filter(Boolean).join(", ") || "------"}</dd></div>
              <div className="flex gap-2"><dt className="flex shrink-0 items-center gap-1.5 text-muc-3"><Phone aria-hidden strokeWidth={1.6} className="h-4 w-4" />Điện thoại:</dt><dd className="text-muc-2">{c.dien_thoai || "------"}</dd></div>
              <div className="flex gap-2"><dt className="flex shrink-0 items-center gap-1.5 text-muc-3"><Clock aria-hidden strokeWidth={1.6} className="h-4 w-4" />Giờ làm việc:</dt><dd className="min-w-0 text-muc-2">{tomTatGio(gioBaThu(c.gio_lam_viec, ch?.gio_lam_viec))}</dd></div>
              {c.mo_ta && <p className="text-muc-3">{c.mo_ta}</p>}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-vien pt-3">
              {c.dia_chi && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.dia_chi, c.phuong_quan, c.thanh_pho].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Xem bản đồ</a>}
              <Link href="/cai-dat/gio-lam-viec" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Giờ làm việc</Link>
              {quanLy && <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa thông tin chi nhánh" truong={truong} rong giaTri={{ id: c.id, ma: c.ma, ten: c.ten, mo_ta: c.mo_ta ?? "", dien_thoai: c.dien_thoai ?? "", dia_chi: c.dia_chi ?? "", thanh_pho: c.thanh_pho ?? "", phuong_quan: c.phuong_quan ?? "", hien_dat_lich: c.hien_dat_lich ? "hien" : "an", thu_tu: c.thu_tu, hoat_dong: c.hoat_dong }} action={luuChiNhanhCaiDat} />}
              {quanLy && <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${c.ten}`} xacNhan="Xoá hẳn chi nhánh này? Không hoàn lại được. Chi nhánh đã có hoá đơn, thẻ, kho hay lịch hẹn thì hệ thống sẽ từ chối; khi đó hãy Sửa và tắt Đang hoạt động." an={{ id: c.id }} nhanLuu="Xoá" action={xoaChiNhanhCaiDat} />}
            </div>
          </article>
        ))}
      </div>
      {ds.length === 0 && <p className="py-10 text-center text-muc-3">Không có chi nhánh nào khớp.</p>}
      <p className="mt-5 text-[12px] text-muc-3">Quốc gia: Việt Nam. Thành phố và Phường/Quận nhập tay (SalonHero chọn từ danh sách tỉnh thành, AMIA chưa có danh mục này). Bản đồ mở Google Maps theo địa chỉ, không nhúng bản đồ.</p>
    </div>
  );
}
