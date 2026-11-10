import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { DANH_SACH_NGAN_HANG, chucNangNganHang } from "@/lib/ngan-hang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Landmark } from "lucide-react";
import { MaQrChuyenKhoan } from "@/components/ui/MaQrChuyenKhoan";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { anHienNganHang, datMacDinhNganHang, luuNganHang, xoaNganHang } from "../actions";

const MOI_TRANG = 10;
/** Số tài khoản hiện ĐỦ như SalonHero (chị Lâm 10/11/2026: "cứ làm y như Salon Hero", bỏ che 4 số cuối). */
const soTk = (s: string) => s || "Chưa nhập số";

/** Đối chiếu SalonHero #/bankInfoSetting: "Tài khoản Ngân Hàng", nút Thêm tài khoản, ô Tìm kiếm, Số tài khoản / Ngân hàng / Chủ tài khoản / Chức năng, nút Đặt mặc định · Sửa · Xóa, chân "Hiện 1 đến N của N kết quả".
 *  Mỗi tài khoản là một THẺ (chị Lâm 10/11/2026: "QR các kiểu cả thẻ đó đầy đủ"): ngân hàng, số TK đủ, chủ TK, chi nhánh dùng, chức năng, ghi chú và mã VietQR tĩnh (khách tự nhập số tiền), bấm để phóng to.
 *  SalonHero không lưu ảnh QR mà ghép VietQR từ mã ngân hàng + số TK, nên AMIA cũng dựng mã từ chính tài khoản (không có ảnh tải lên, không gọi dịch vụ ngoài). */
export default async function TrangNganHang({ searchParams }: { searchParams: Promise<{ q?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sua = coQuyen(nd, "danhmuc.sua");
  const { q = "", trang: t } = await searchParams;
  const [{ data: tk }, { data: dsCn }] = await Promise.all([
    sb().from("tai_khoan_ngan_hang").select("*").order("hoat_dong", { ascending: false }).order("mac_dinh", { ascending: false }).order("tao_luc"),
    sb().from("chi_nhanh").select("id, ten"),
  ]);
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  const k = boDau(q.trim());
  const ds = (tk ?? []).filter((r) => !k || boDau(`${r.so_tai_khoan} ${r.ngan_hang} ${r.chu_tai_khoan}`).includes(k));
  const cuoi = Math.max(1, Math.ceil(ds.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(t)) || 1), cuoi);
  const hien = ds.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const gan = (n: number | undefined) => `/cai-dat/ngan-hang?${new URLSearchParams(Object.entries({ q: q || undefined, trang: n ? String(n) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const truong: Truong[] = [
    { ten: "ngan_hang", nhan: "Tên ngân hàng", loai: "chon", batBuoc: true, rong: true, goiY: "Mời chọn tên ngân hàng", luaChon: DANH_SACH_NGAN_HANG.map((x) => ({ gia_tri: x, nhan: x })) },
    { ten: "so_tai_khoan", nhan: "Số tài khoản", loai: "chu", goiY: "Có thể để trống" }, { ten: "chu_tai_khoan", nhan: "Chủ tài khoản", loai: "chu", goiY: "Có thể để trống" },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh dùng", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...(dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true, goiY: "Ví dụ: chủ yếu thu dịch vụ tiêm, cấy" },
    { ten: "dung_quet_the", nhan: "Quẹt thẻ", loai: "gat" }, { ten: "dung_chuyen_khoan", nhan: "Chuyển khoản", loai: "gat" }, { ten: "mac_dinh", nhan: "Mặc định", loai: "gat" },
  ];
  return (
    <div>
      <TieuDeNoi icon={Landmark} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Tài khoản Ngân Hàng">
        {sua && <NutHop nhan="Thêm tài khoản" tieuDe="Thêm tài khoản" nhanLuu="Lưu thông tin" truong={truong} action={luuNganHang} giaTri={{ ngan_hang: "", ghi_chu: "", chi_nhanh_id: "", dung_quet_the: true, dung_chuyen_khoan: true, mac_dinh: false }} />}
      </TieuDeNoi>
      <form method="get" role="search" className="mb-5 flex max-w-md items-center gap-2">
        <label htmlFor="tim-nh" className="shrink-0 text-[13px] font-medium text-muc-2">Tìm kiếm:</label>
        <input id="tim-nh" name="q" defaultValue={q} aria-label="Tìm kiếm" className={O_NHAP} autoComplete="off" />
        <button type="submit" className={NUT_PHU}>Tìm</button>
      </form>
      {hien.length === 0 ? <p className="rounded-the border border-vien bg-giay-sang px-4 py-6 text-center text-[14px] text-muc-3">Không có dữ liệu.</p> : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {hien.map((r) => (
            <li key={r.id} className={`flex flex-col rounded-the border bg-giay-sang ${r.mac_dinh ? "border-nhan" : "border-vien"} ${r.hoat_dong ? "" : "opacity-75"}`}>
              <div className="flex flex-wrap items-center gap-2 border-b border-vien px-4 py-3">
                <Landmark aria-hidden strokeWidth={1.6} className="h-[18px] w-[18px] shrink-0 text-nhan-dam" />
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-muc">{r.ngan_hang}</span>
                {r.mac_dinh && <NhanTrangThai kieu="tot">Mặc định</NhanTrangThai>}{!r.hoat_dong && <NhanTrangThai kieu="cho">Đang ẩn</NhanTrangThai>}
              </div>
              <div className="flex flex-1 flex-col gap-3 px-4 py-3 min-[400px]:flex-row">
                {r.so_tai_khoan && r.dung_chuyen_khoan ? <MaQrChuyenKhoan gon co={112} tieuDe={`QR ${r.ngan_hang}`} tk={{ nganHang: r.ngan_hang, chu: r.chu_tai_khoan, so: r.so_tai_khoan }} />
                  : <span className="flex h-[122px] w-[122px] shrink-0 items-center justify-center rounded-nho border border-dashed border-vien-dam px-2 text-center text-[11.5px] text-muc-3">{r.so_tai_khoan ? "Chỉ quẹt thẻ, không cần QR" : "Chưa có số tài khoản"}</span>}
                <dl className="min-w-0 flex-1 space-y-1.5 text-[13.5px]">
                  <div><dt className="text-[12px] text-muc-3">Số tài khoản</dt><dd className="break-all text-[17px] font-semibold tabular-nums tracking-wide text-muc">{soTk(r.so_tai_khoan)}</dd></div>
                  <div><dt className="text-[12px] text-muc-3">Chủ tài khoản</dt><dd className="font-medium text-muc">{r.chu_tai_khoan || "—"}</dd></div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <div><dt className="text-[12px] text-muc-3">Chi nhánh</dt><dd className="text-muc-2">{r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "—" : "Mọi chi nhánh"}</dd></div>
                    <div><dt className="text-[12px] text-muc-3">Chức năng</dt><dd className="text-muc-2">{chucNangNganHang(r).join(" · ") || "—"}</dd></div>
                  </div>
                  {r.ghi_chu && <div><dt className="text-[12px] text-muc-3">Ghi chú</dt><dd className="text-muc-2">{r.ghi_chu}</dd></div>}
                </dl>
              </div>
              {sua && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-vien px-4 py-2.5">
                  <NutHop kieu="chu" nhan={r.hoat_dong ? "Ẩn" : "Hiện lại"} tieuDe={r.hoat_dong ? "Ẩn tài khoản" : "Hiện lại tài khoản"} xacNhan={r.hoat_dong ? `Ẩn ${r.ngan_hang}? Tài khoản ẩn không còn trong ô chọn ở Thu ngân và bộ lọc Hoá đơn điện tử, dữ liệu cũ vẫn giữ.` : `Hiện lại ${r.ngan_hang} trong Thu ngân và bộ lọc Hoá đơn điện tử?`} an={{ id: r.id, hien: r.hoat_dong ? "0" : "1" }} nhanLuu={r.hoat_dong ? "Ẩn" : "Hiện lại"} action={anHienNganHang} />
                  {!r.mac_dinh && <NutHop kieu="chu" nhan="Đặt mặc định" tieuDe="Đặt mặc định" xacNhan={`Đặt ${r.ngan_hang} (${soTk(r.so_tai_khoan)}) làm tài khoản mặc định?`} an={{ id: r.id }} nhanLuu="Đặt mặc định" action={datMacDinhNganHang} />}
                  <NutHop kieu="chu" nhan="Sửa" tieuDe="Chỉnh sửa tài khoản" nhanLuu="Lưu thông tin" truong={truong} action={luuNganHang} giaTri={{ id: r.id, ghi_chu: r.ghi_chu ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "", ngan_hang: r.ngan_hang, so_tai_khoan: r.so_tai_khoan, chu_tai_khoan: r.chu_tai_khoan, dung_quet_the: r.dung_quet_the, dung_chuyen_khoan: r.dung_chuyen_khoan, mac_dinh: r.mac_dinh }} />
                  <NutHop kieu="chu" nguy nhan="Xóa" tieuDe="Xóa tài khoản" xacNhan={`Xóa tài khoản ${r.ngan_hang} (${soTk(r.so_tai_khoan)}) khỏi danh sách? Không hoàn lại được.`} an={{ id: r.id }} nhanLuu="Xóa" action={xoaNganHang} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <ThanhTrang trang={trang} tong={ds.length} moi={MOI_TRANG} gan={gan} don="kết quả" luonHien nhanNut={["Trang đầu", "Trang trước", "Trang sau", "Trang cuối"]} />
    </div>
  );
}
