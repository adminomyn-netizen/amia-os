import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { TT_CHUYEN } from "@/lib/kho";
import { locPhieuChuyen, type LocChuyen } from "@/lib/kho-chuyen";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { guiChuyenKho, huyChuyenKho, nhanChuyenKho, xuLyLechChuyenKho } from "../actions";

const phutConLai = (iso: string) => (new Date(iso).getTime() - Date.now()) / 60000;

export default async function TrangChuyenKho({ searchParams }: { searchParams: Promise<LocChuyen> }) {
  const loc = await searchParams;
  const nd = await yeuCauQuyen("kho.xem");
  const nhap = coQuyen(nd, "kho.nhap"), duyet = coQuyen(nd, "kho.duyet");
  const db = sb();
  const { q, tu, den, thamSo } = locPhieuChuyen(db, nd, loc, 500);
  const [{ data: ds }, { data: cn }, { data: sp }, { data: nv }] = await Promise.all([
    q, db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"), db.from("san_pham").select("id, ten, don_vi").eq("hoat_dong", true).eq("theo_doi_kho", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten").order("ho_ten"),
  ]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten])), tenSp = new Map((sp ?? []).map((s) => [s.id, s])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truong: Truong[] = [
    ...(nd.chiNhanhId ? [] : [{ ten: "tu_chi_nhanh_id", nhan: "Kho đi", loai: "chon" as const, batBuoc: true, luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }]),
    { ten: "den_chi_nhanh_id", nhan: "Kho đến", loai: "chon", batBuoc: true, luaChon: (cn ?? []).filter((c) => c.id !== nd.chiNhanhId).map((c) => ({ gia_tri: c.id, nhan: c.ten })) },
    { ten: "san_pham_id", nhan: "Vật tư / sản phẩm", loai: "chon", batBuoc: true, rong: true, luaChon: (sp ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` })) },
    { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true }, { ten: "so_lo", nhan: "Số lô", loai: "chu" }, { ten: "han_dung", nhan: "Hạn dùng", loai: "ngay" },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho", nhan: "Kho" }} tieuDe="Chuyển kho" phu="Kho đi trừ ngay khi gửi. Kho nhận đếm và xác nhận trong 24 giờ thì mới được cộng vào tồn; nhận lệch phải ghi lý do và chờ xử lý, không tự đóng.">
        {nhap && <NutHop nhan="Tạo phiếu chuyển" tieuDe="Tạo phiếu chuyển kho" truong={truong} action={guiChuyenKho} giaTri={{ tu_chi_nhanh_id: "", den_chi_nhanh_id: "", san_pham_id: "" }} rong />}
      </TieuDeNoi>
      <form method="get" action="/kho/chuyen-kho" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div><label htmlFor="ck-tu" className={NHAN_O}>Từ ngày</label><NgayChon id="ck-tu" ten="tu" giaTriMacDinh={tu} tuNam={2018} /></div>
        <div><label htmlFor="ck-den" className={NHAN_O}>Đến ngày</label><NgayChon id="ck-den" ten="den" giaTriMacDinh={den} tuNam={2018} /></div>
        <div><label className={NHAN_O}>Tình trạng</label><Chon ten="tt" giaTriMacDinh={loc.tt ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả tình trạng" }, ...Object.entries(TT_CHUYEN).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten }))]} /></div>
        <div><label className={NHAN_O}>Người tạo</label><Chon ten="nguoi" giaTriMacDinh={loc.nguoi ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả người tạo" }, ...(nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))]} /></div>
        <div className="flex items-end gap-2"><button type="submit" className={NUT_CHINH}>Lọc</button><a href={`/api/xuat/chuyen-kho?${thamSo}`} download className={`${NUT_PHU} inline-flex items-center`}>Xuất Excel</a></div>
      </form>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có phiếu chuyển."
        cot={[
          { nhan: "Phiếu", chinh: true, hienThi: (r) => <div>{r.ma}<div className="text-[12.5px] text-muc-3">{ngayGioVN(r.gui_luc)} · {tenNv.get(r.nguoi_gui_id)}</div></div> },
          { nhan: "Từ → đến", hienThi: (r) => `${tenCn.get(r.tu_chi_nhanh_id)} → ${tenCn.get(r.den_chi_nhanh_id)}` },
          { nhan: "Vật tư", hienThi: (r) => <div>{tenSp.get(r.san_pham_id)?.ten}<div className="text-[12.5px] text-muc-3">{[r.so_lo, r.han_dung ? ngayVN(r.han_dung) : ""].filter(Boolean).join(" · ")}</div></div> },
          { nhan: "Gửi", phai: true, hienThi: (r) => soVN(r.so_luong_gui) },
          { nhan: "Nhận", phai: true, hienThi: (r) => (r.so_luong_nhan == null ? "" : <div>{soVN(r.so_luong_nhan)}{r.ly_do_lech && <div className="text-[12.5px] text-canh-bao">{r.ly_do_lech}</div>}</div>) },
          { nhan: "Trạng thái", hienThi: (r) => {
            const con = phutConLai(r.han_nhan), qua = r.trang_thai === "dang_chuyen" && con < 0;
            return <div><NhanTrangThai kieu={qua ? "loi" : TT_CHUYEN[r.trang_thai].kieu}>{TT_CHUYEN[r.trang_thai].ten}</NhanTrangThai>{r.trang_thai === "dang_chuyen" && <div className={`mt-1 text-[12.5px] ${qua ? "text-canh-bao" : "text-muc-3"}`}>{qua ? `Quá hạn xác nhận ${Math.ceil(-con / 60)} giờ` : `Còn ${Math.floor(con / 60)} giờ để xác nhận`}</div>}</div>;
          } },
          { nhan: "", hienThi: (r) => (
            <div className="flex flex-wrap justify-end gap-2">
              {nhap && r.trang_thai === "dang_chuyen" && (!nd.chiNhanhId || nd.chiNhanhId === r.den_chi_nhanh_id) && <NutHop kieu="chu" nhan="Xác nhận nhận" tieuDe={`Nhận ${r.ma}`} moTa={`Đã gửi ${soVN(r.so_luong_gui)}. Đếm thực tế rồi nhập số nhận; nếu lệch, ghi lý do.`} truong={[{ ten: "so_thuc_nhan", nhan: "Số thực nhận", loai: "so", batBuoc: true }, { ten: "ly_do", nhan: "Lý do nếu lệch", loai: "nhieu_dong", rong: true }]} action={nhanChuyenKho} an={{ id: r.id }} giaTri={{ so_thuc_nhan: Number(r.so_luong_gui) }} />}
              {nhap && r.trang_thai === "dang_chuyen" && (!nd.chiNhanhId || nd.chiNhanhId === r.tu_chi_nhanh_id) && <NutHop kieu="chu" nguy nhan="Huỷ phiếu" tieuDe="Huỷ phiếu chuyển" xacNhan={`Huỷ ${r.ma}? Số đã trừ sẽ được cộng lại kho đi.`} action={huyChuyenKho} an={{ id: r.id }} nhanLuu="Huỷ phiếu" />}
              {duyet && r.trang_thai === "cho_xu_ly_chenh_lech" && <NutHop kieu="chu" nhan="Xử lý chênh lệch" tieuDe={`Chênh lệch ${r.ma}`} moTa={`Gửi ${soVN(r.so_luong_gui)}, nhận ${soVN(r.so_luong_nhan)}. Chọn: ghi hao hụt (mất luôn phần lệch) hoặc trả phần lệch về kho đi.`} truong={[{ ten: "cach", nhan: "Cách xử lý", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "ghi_hao_hut", nhan: "Ghi hao hụt" }, { gia_tri: "tra_ve_nguon", nhan: "Trả phần lệch về kho đi" }] }]} action={xuLyLechChuyenKho} an={{ id: r.id }} giaTri={{ cach: "ghi_hao_hut" }} />}
            </div>
          ) },
        ]} />
    </div>
  );
}
