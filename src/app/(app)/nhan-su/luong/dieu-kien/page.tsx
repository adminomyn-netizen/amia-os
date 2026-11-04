import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TINH_TRANG_LUONG } from "@/lib/nhan-su";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuDieuKienLuong } from "../../actions";

export default async function TrangDieuKienLuong() {
  const nd = await yeuCauQuyen("luong.xem");
  const sua = coQuyen(nd, "luong.sua");
  const db = sb();
  const [{ data: dk }, { data: nv }] = await Promise.all([db.from("dieu_kien_luong").select("*").order("hieu_luc_tu", { ascending: false }), db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id, hoat_dong").order("ho_ten")]);
  const moiNhat = new Map<string, NonNullable<typeof dk>[number]>();
  for (const d of dk ?? []) if (!moiNhat.has(d.nhan_vien_id)) moiNhat.set(d.nhan_vien_id, d);
  const ds = [...(nv ?? [])].filter((n) => n.hoat_dong && (!nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId));
  const truong: Truong[] = [
    { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, rong: true, luaChon: ds.map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` })) },
    { ten: "hieu_luc_tu", nhan: "Hiệu lực từ ngày (mỗi lần điều chỉnh một dòng mới)", loai: "ngay", batBuoc: true }, { ten: "tinh_trang", nhan: "Tình trạng", loai: "chon", batBuoc: true, luaChon: Object.entries(TINH_TRANG_LUONG).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "luong_co_ban", nhan: "Lương cơ bản (đ/tháng)", loai: "tien", batBuoc: true }, { ten: "thu_nhap_chuc_danh", nhan: "Thu nhập chức danh để tính OT (bỏ trống = lương cơ bản)", loai: "tien" },
    { ten: "ty_le_thu_viec", nhan: "% lương thử việc (mặc định 85)", loai: "so" }, { ten: "so_npt", nhan: "Số người phụ thuộc", loai: "so" },
    { ten: "dong_bh", nhan: "Đóng bảo hiểm xã hội", loai: "gat" }, { ten: "luong_dong_bh", nhan: "Lương đóng BHXH", loai: "tien" },
    { ten: "an_ca_ngay", nhan: "Ăn ca / ngày công (đ)", loai: "tien" }, { ten: "dong_phuc_cap", nhan: "Phụ cấp đồng phục / tháng", loai: "tien" }, { ten: "nha_o_cap", nhan: "Hỗ trợ nhà ở / tháng", loai: "tien" },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  const hom = homNayHCM();
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su/luong", nhan: "Bảng lương" }} tieuDe="Cài đặt lương cơ bản" phu="Điều kiện lương theo ngày hiệu lực: kỳ lương lấy dòng có hiệu lực mới nhất không sau cuối tháng. Chỉ người có quyền lương thấy mục này.">
        {sua && <NutHop nhan="Thêm điều kiện lương" tieuDe="Thêm điều kiện lương" truong={truong} action={luuDieuKienLuong} giaTri={{ hieu_luc_tu: hom, tinh_trang: "chinh_thuc", ty_le_thu_viec: 85, so_npt: 0, dong_bh: false }} rong />}
      </TieuDeNoi>
      <Bang duLieu={ds} khoa={(r) => r.id} trong="Không có nhân viên."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ho_ten}</span><div className="text-[12.5px] text-muc-3">{r.ma_nv}</div></div> },
          { nhan: "Hiệu lực từ", hienThi: (r) => { const d = moiNhat.get(r.id); return d ? ngayVN(d.hieu_luc_tu) : <span className="text-canh-bao">Chưa cài</span>; } },
          { nhan: "Tình trạng", hienThi: (r) => { const d = moiNhat.get(r.id); return d ? TINH_TRANG_LUONG[d.tinh_trang] : ""; } },
          { nhan: "Lương cơ bản", phai: true, hienThi: (r) => { const d = moiNhat.get(r.id); return d ? tienVN(d.luong_co_ban) : ""; } },
          { nhan: "BHXH", hienThi: (r) => { const d = moiNhat.get(r.id); return d ? (d.dong_bh ? `Đóng (${tienVN(d.luong_dong_bh)})` : "Không") : ""; } },
          { nhan: "Phụ cấp", phai: true, hienThi: (r) => { const d = moiNhat.get(r.id); return d ? `${d.an_ca_ngay ? `${tienVN(d.an_ca_ngay)}/ngày` : ""}` : ""; } },
          { nhan: "", hienThi: (r) => { const d = moiNhat.get(r.id); return sua ? <NutHop kieu="chu" nhan={d ? "Điều chỉnh" : "Cài đặt"} tieuDe={`Điều kiện lương: ${r.ho_ten}`} truong={truong} action={luuDieuKienLuong} rong giaTri={{ nhan_vien_id: r.id, hieu_luc_tu: hom, tinh_trang: d?.tinh_trang ?? "chinh_thuc", luong_co_ban: d?.luong_co_ban ?? 0, thu_nhap_chuc_danh: d?.thu_nhap_chuc_danh ?? 0, ty_le_thu_viec: d?.ty_le_thu_viec ?? 85, so_npt: d?.so_npt ?? 0, dong_bh: d?.dong_bh ?? false, luong_dong_bh: d?.luong_dong_bh ?? 0, an_ca_ngay: d?.an_ca_ngay ?? 0, dong_phuc_cap: d?.dong_phuc_cap ?? 0, nha_o_cap: d?.nha_o_cap ?? 0, ghi_chu: "" }} /> : null; } },
        ]} />
    </div>
  );
}
