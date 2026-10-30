import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { DANH_SACH_NGAN_HANG, chucNangNganHang } from "@/lib/ngan-hang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { anHienNganHang, datMacDinhNganHang, luuNganHang, xoaNganHang } from "../actions";

const MOI_TRANG = 10;
/** Số tài khoản luôn che, chỉ hiện 4 số cuối — số đầy đủ chỉ thấy khi mở hộp Sửa (người có quyền sửa danh mục). */
const che = (s: string) => (s ? `•••• ${s.slice(-4)}` : "Chưa nhập số");

/** Đối chiếu SalonHero #/bankInfoSetting: "Tài khoản Ngân Hàng", nút Thêm tài khoản, ô Tìm kiếm, cột Số tài khoản / Ngân hàng / Chủ tài khoản / Chức năng, nút Đặt mặc định · Sửa · Xóa, chân bảng "Hiện 1 đến N của N kết quả". */
export default async function TrangNganHang({ searchParams }: { searchParams: Promise<{ q?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sua = coQuyen(nd, "danhmuc.sua");
  const { q = "", trang: t } = await searchParams;
  const { data: tk } = await sb().from("tai_khoan_ngan_hang").select("*").order("mac_dinh", { ascending: false }).order("tao_luc");
  const k = boDau(q.trim());
  const ds = (tk ?? []).filter((r) => !k || boDau(`${r.so_tai_khoan} ${r.ngan_hang} ${r.chu_tai_khoan}`).includes(k));
  const cuoi = Math.max(1, Math.ceil(ds.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(t)) || 1), cuoi);
  const hien = ds.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const gan = (n: number | undefined) => `/cai-dat/ngan-hang?${new URLSearchParams(Object.entries({ q: q || undefined, trang: n ? String(n) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const truong: Truong[] = [
    { ten: "ngan_hang", nhan: "Tên ngân hàng", loai: "chon", batBuoc: true, rong: true, goiY: "Mời chọn tên ngân hàng", luaChon: DANH_SACH_NGAN_HANG.map((x) => ({ gia_tri: x, nhan: x })) },
    { ten: "so_tai_khoan", nhan: "Số tài khoản", loai: "chu", goiY: "Có thể để trống" }, { ten: "chu_tai_khoan", nhan: "Chủ tài khoản", loai: "chu", goiY: "Có thể để trống" },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true, goiY: "Ví dụ: chủ yếu thu dịch vụ tiêm, cấy" },
    { ten: "dung_quet_the", nhan: "Quẹt thẻ", loai: "gat" }, { ten: "dung_chuyen_khoan", nhan: "Chuyển khoản", loai: "gat" }, { ten: "mac_dinh", nhan: "Mặc định", loai: "gat" },
  ];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Tài khoản Ngân Hàng">
        {sua && <NutHop nhan="Thêm tài khoản" tieuDe="Thêm tài khoản" nhanLuu="Lưu thông tin" truong={truong} action={luuNganHang} giaTri={{ ngan_hang: "", ghi_chu: "", dung_quet_the: true, dung_chuyen_khoan: true, mac_dinh: false }} />}
      </TieuDeTrang>
      <form method="get" role="search" className="mb-5 flex max-w-md items-center gap-2">
        <label htmlFor="tim-nh" className="shrink-0 text-[13px] font-medium text-muc-2">Tìm kiếm:</label>
        <input id="tim-nh" name="q" defaultValue={q} aria-label="Tìm kiếm" className={O_NHAP} autoComplete="off" />
        <button type="submit" className={NUT_PHU}>Tìm</button>
      </form>
      <Bang duLieu={hien} khoa={(r) => r.id} trong="Không có dữ liệu."
        cot={[
          { nhan: "Số tài khoản", chinh: true, hienThi: (r) => <span className="flex flex-wrap items-center gap-2"><span className="tabular-nums text-muc">{che(r.so_tai_khoan)}</span>{r.mac_dinh && <NhanTrangThai kieu="tot">Mặc định</NhanTrangThai>}{!r.hoat_dong && <NhanTrangThai kieu="cho">Đang ẩn</NhanTrangThai>}</span> },
          { nhan: "Ngân hàng", hienThi: (r) => <div>{r.ngan_hang}{r.ghi_chu && <div className="text-[12.5px] text-muc-3">{r.ghi_chu}</div>}</div> }, { nhan: "Chủ tài khoản", hienThi: (r) => r.chu_tai_khoan },
          { nhan: "Chức năng", hienThi: (r) => <span className="flex flex-col">{chucNangNganHang(r).map((c) => <span key={c}>{c}</span>)}</span> },
          { nhan: "", hienThi: (r) => (sua ? (
            <span className="flex flex-wrap gap-4">
              <NutHop kieu="chu" nhan={r.hoat_dong ? "Ẩn" : "Hiện lại"} tieuDe={r.hoat_dong ? "Ẩn tài khoản" : "Hiện lại tài khoản"} xacNhan={r.hoat_dong ? `Ẩn ${r.ngan_hang}? Tài khoản ẩn không còn trong ô chọn ở Thu ngân và bộ lọc Hoá đơn điện tử, dữ liệu cũ vẫn giữ.` : `Hiện lại ${r.ngan_hang} trong Thu ngân và bộ lọc Hoá đơn điện tử?`} an={{ id: r.id, hien: r.hoat_dong ? "0" : "1" }} nhanLuu={r.hoat_dong ? "Ẩn" : "Hiện lại"} action={anHienNganHang} />
              {!r.mac_dinh && <NutHop kieu="chu" nhan="Đặt mặc định" tieuDe="Đặt mặc định" xacNhan={`Đặt ${r.ngan_hang} (${che(r.so_tai_khoan)}) làm tài khoản mặc định?`} an={{ id: r.id }} nhanLuu="Đặt mặc định" action={datMacDinhNganHang} />}
              <NutHop kieu="chu" nhan="Sửa" tieuDe="Chỉnh sửa tài khoản" nhanLuu="Lưu thông tin" truong={truong} action={luuNganHang} giaTri={{ id: r.id, ghi_chu: r.ghi_chu ?? "", ngan_hang: r.ngan_hang, so_tai_khoan: r.so_tai_khoan, chu_tai_khoan: r.chu_tai_khoan, dung_quet_the: r.dung_quet_the, dung_chuyen_khoan: r.dung_chuyen_khoan, mac_dinh: r.mac_dinh }} />
              <NutHop kieu="chu" nguy nhan="Xóa" tieuDe="Xóa tài khoản" xacNhan={`Xóa tài khoản ${r.ngan_hang} (${che(r.so_tai_khoan)}) khỏi danh sách? Không hoàn lại được.`} an={{ id: r.id }} nhanLuu="Xóa" action={xoaNganHang} />
            </span>
          ) : null) },
        ]} />
      <ThanhTrang trang={trang} tong={ds.length} moi={MOI_TRANG} gan={gan} don="kết quả" luonHien nhanNut={["Trang đầu", "Trang trước", "Trang sau", "Trang cuối"]} />
    </div>
  );
}
