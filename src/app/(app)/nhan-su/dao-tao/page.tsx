import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { dsNvTrongPham, luaChonNv } from "@/lib/hr-pham-vi";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuKetQuaDaoTao, luuKhoaDaoTao } from "./actions";

const TAB = [{ ma: "lo-trinh", ten: "Lộ trình theo vị trí" }, { ma: "ket-qua", ten: "Lịch học và kết quả" }] as const;
const TT = { chua_hoc: { ten: "Chưa học", kieu: "tram" }, dang_hoc: { ten: "Đang học", kieu: "cho" }, dat: { ten: "Đạt", kieu: "tot" }, chua_dat: { ten: "Chưa đạt", kieu: "loi" } } as const;

export default async function TrangDaoTao({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem đào tạo.</p>;
  const yc = (await searchParams).tab;
  const tab = TAB.find((t) => t.ma === yc)?.ma ?? "lo-trinh";
  const db = sb();
  const [{ data: khoa }, nv] = await Promise.all([db.from("dao_tao_khoa").select("*").order("chuc_danh", { nullsFirst: true }).order("thu_tu"), dsNvTrongPham(nd.chiNhanhId, false)]);
  const ds = khoa ?? [], tenKhoa = new Map(ds.map((k) => [k.id, k.ten]));
  const truongKhoa: Truong[] = [
    { ten: "ten", nhan: "Tên khoá học", loai: "chu", batBuoc: true, rong: true }, { ten: "chuc_danh", nhan: "Vị trí (chức danh)", loai: "chu", goiY: "Để trống = mọi vị trí" },
    { ten: "thu_tu", nhan: "Thứ tự trong lộ trình", loai: "so" }, { ten: "so_gio", nhan: "Số giờ", loai: "so" }, { ten: "bat_buoc", nhan: "Bắt buộc", loai: "gat" },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", rong: true }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
  ];
  let noiDung: React.ReactNode;
  if (tab === "lo-trinh") {
    noiDung = (
      <>
        <div className="mb-3 flex justify-end"><NutHop nhan="Thêm khoá học" tieuDe="Thêm khoá học" truong={truongKhoa} action={luuKhoaDaoTao} giaTri={{ bat_buoc: "1", hoat_dong: "1", thu_tu: "1", so_gio: "1" }} /></div>
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có khoá học nào."
          cot={[
            { nhan: "Vị trí", hienThi: (r) => r.chuc_danh ?? "Mọi vị trí" }, { nhan: "Thứ tự", phai: true, hienThi: (r) => r.thu_tu },
            { nhan: "Khoá học", chinh: true, hienThi: (r) => <span className={r.hoat_dong ? "" : "text-muc-3 line-through"}>{r.ten}</span> },
            { nhan: "Số giờ", phai: true, hienThi: (r) => Number(r.so_gio) }, { nhan: "", hienThi: (r) => (r.bat_buoc ? <NhanTrangThai kieu="cho">Bắt buộc</NhanTrangThai> : <NhanTrangThai kieu="tram">Tự chọn</NhanTrangThai>) },
            { nhan: "", hienThi: (r) => <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa khoá học" truong={truongKhoa} action={luuKhoaDaoTao} an={{ id: r.id }} giaTri={{ id: r.id, ten: r.ten, chuc_danh: r.chuc_danh ?? "", thu_tu: String(r.thu_tu), so_gio: String(Number(r.so_gio)), bat_buoc: r.bat_buoc ? "1" : "", mo_ta: r.mo_ta ?? "", hoat_dong: r.hoat_dong ? "1" : "" }} /> },
          ]} />
      </>
    );
  } else {
    const ids = nv.map((n) => n.id), ten = new Map(nv.map((n) => [n.id, n]));
    const { data: kq } = ids.length ? await db.from("dao_tao_ket_qua").select("*").in("nhan_vien_id", ids).order("ngay_hoc", { ascending: false, nullsFirst: false }).limit(500) : { data: [] };
    const truong: Truong[] = [
      { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: luaChonNv(nv.filter((n) => n.hoat_dong)), rong: true },
      { ten: "khoa_id", nhan: "Khoá học", loai: "chon", batBuoc: true, luaChon: ds.filter((k) => k.hoat_dong).map((k) => ({ gia_tri: k.id, nhan: k.ten })), rong: true },
      { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", batBuoc: true, luaChon: Object.entries(TT).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten })) },
      { ten: "ngay_hoc", nhan: "Ngày học", loai: "ngay" }, { ten: "diem", nhan: "Điểm (0 đến 100)", loai: "so" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
    ];
    noiDung = (
      <>
        <div className="mb-3 flex justify-end"><NutHop nhan="Ghi kết quả" tieuDe="Ghi kết quả học" truong={truong} action={luuKetQuaDaoTao} giaTri={{ trang_thai: "dat" }} /></div>
        <Bang duLieu={kq ?? []} khoa={(r) => r.id} trong="Chưa có kết quả học nào."
          cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => ten.get(r.nhan_vien_id)?.ho_ten ?? "Đã nghỉ" }, { nhan: "Khoá học", hienThi: (r) => tenKhoa.get(r.khoa_id) },
            { nhan: "Ngày học", hienThi: (r) => (r.ngay_hoc ? ngayVN(r.ngay_hoc) : "—") }, { nhan: "Điểm", phai: true, hienThi: (r) => (r.diem == null ? "—" : Number(r.diem)) },
            { nhan: "Kết quả", hienThi: (r) => <NhanTrangThai kieu={TT[r.trang_thai as keyof typeof TT].kieu}>{TT[r.trang_thai as keyof typeof TT].ten}</NhanTrangThai> },
            { nhan: "", hienThi: (r) => <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa kết quả học" truong={truong} action={luuKetQuaDaoTao} giaTri={{ nhan_vien_id: r.nhan_vien_id, khoa_id: r.khoa_id, trang_thai: r.trang_thai, ngay_hoc: r.ngay_hoc ?? "", diem: r.diem == null ? "" : String(Number(r.diem)), ghi_chu: r.ghi_chu ?? "" }} /> },
          ]} />
      </>
    );
  }
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Đào tạo" phu="Lộ trình khoá học theo vị trí, lịch học và kết quả của từng nhân viên." />
      <nav aria-label="Đào tạo" className="mb-5 flex flex-wrap gap-2">
        {TAB.map((t) => <Link key={t.ma} href={`/nhan-su/dao-tao?tab=${t.ma}`} aria-current={t.ma === tab ? "page" : undefined} className={`rounded-nho border px-3.5 py-2 text-[14px] ${t.ma === tab ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>)}
      </nav>
      {noiDung}
    </div>
  );
}
