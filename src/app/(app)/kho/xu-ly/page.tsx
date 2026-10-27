import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { LOAI_XU_LY, TT_XU_LY, TT_XUAT_KHAN } from "@/lib/kho";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { duyetXuLyVatTu, hauKiemXuatKhan, huyXuLyVatTu, taoXuLyVatTu, tuChoiXuLyVatTu, xuatKhanCap } from "../actions";

const TAB = [{ ma: "xu-ly", ten: "Xử lý vật tư" }, { ma: "xuat-khan", ten: "Xuất khẩn cấp" }];

export default async function TrangXuLy({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const nhap = coQuyen(nd, "kho.nhap"), duyet = coQuyen(nd, "kho.duyet");
  const { tab: t } = await searchParams;
  const tab = t === "xuat-khan" ? "xuat-khan" : "xu-ly";
  const db = sb();
  const [{ data: cn }, { data: sp }, { data: nv }, { data: ncc }] = await Promise.all([
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"), db.from("san_pham").select("id, ten, don_vi").eq("hoat_dong", true).eq("theo_doi_kho", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten, chi_nhanh_id").eq("hoat_dong", true).order("ho_ten"), db.from("nha_cung_cap").select("id, ten").order("ten"),
  ]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten])), tenSp = new Map((sp ?? []).map((s) => [s.id, s])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const spLC = (sp ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` }));
  const cnLC = nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }];
  let noiDung: React.ReactNode;
  let nut: React.ReactNode = null;
  if (tab === "xu-ly") {
    let q = db.from("xu_ly_vat_tu").select("*").order("tao_luc", { ascending: false }).limit(200);
    if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
    const { data: ds } = await q;
    const truong: Truong[] = [
      ...cnLC, { ten: "loai", nhan: "Loại xử lý", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_XU_LY).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
      { ten: "san_pham_id", nhan: "Vật tư", loai: "chon", batBuoc: true, rong: true, luaChon: spLC }, { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true },
      { ten: "so_lo", nhan: "Số lô", loai: "chu" }, { ten: "han_dung", nhan: "Hạn dùng", loai: "ngay" },
      { ten: "ncc_id", nhan: "Nhà cung cấp (khi trả hàng)", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(ncc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
      { ten: "ly_do", nhan: "Lý do (hết hạn, hỏng, mất tem, sai lô…)", loai: "nhieu_dong", batBuoc: true, rong: true },
    ];
    if (nhap) nut = <NutHop nhan="Lập phiếu xử lý" tieuDe="Lập phiếu xử lý vật tư" moTa="Chỉ ghi vào sổ kho sau khi người khác duyệt. Huỷ hàng cần ghi rõ lý do và nên chụp ảnh lưu lại." truong={truong} action={taoXuLyVatTu} giaTri={{ loai: "huy", san_pham_id: "", ncc_id: "", chi_nhanh_id: "" }} rong />;
    noiDung = (
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có phiếu xử lý."
        cot={[
          { nhan: "Phiếu", chinh: true, hienThi: (r) => <div>{r.ma}<div className="text-[12.5px] text-muc-3">{ngayGioVN(r.tao_luc)} · {tenNv.get(r.nguoi_lap_id)}{!nd.chiNhanhId && ` · ${tenCn.get(r.chi_nhanh_id)}`}</div></div> },
          { nhan: "Loại", hienThi: (r) => LOAI_XU_LY[r.loai] }, { nhan: "Vật tư", hienThi: (r) => <div>{tenSp.get(r.san_pham_id)?.ten}<div className="text-[12.5px] text-muc-3">{[r.so_lo, r.han_dung ? ngayVN(r.han_dung) : ""].filter(Boolean).join(" · ")}</div></div> },
          { nhan: "Số lượng", phai: true, hienThi: (r) => soVN(r.so_luong) }, { nhan: "Lý do", hienThi: (r) => <div>{r.ly_do}{r.ly_do_tu_choi && <div className="text-[12.5px] text-canh-bao">Từ chối: {r.ly_do_tu_choi}</div>}</div> },
          { nhan: "Trạng thái", hienThi: (r) => <div><NhanTrangThai kieu={TT_XU_LY[r.trang_thai].kieu}>{TT_XU_LY[r.trang_thai].ten}</NhanTrangThai>{r.nguoi_duyet_id && <div className="mt-1 text-[12.5px] text-muc-3">{tenNv.get(r.nguoi_duyet_id)}</div>}</div> },
          { nhan: "", hienThi: (r) => r.trang_thai !== "cho_duyet" ? null : (
            <div className="flex flex-wrap justify-end gap-2">
              {duyet && (r.nguoi_lap_id !== nd.nhanVienId || nd.vaiTro === "ky_thuat") && <NutHop kieu="chu" nhan="Duyệt" tieuDe="Duyệt xử lý" xacNhan={`Duyệt ${r.ma}? ${LOAI_XU_LY[r.loai]} ${soVN(r.so_luong)} sẽ ghi vào sổ kho.`} action={duyetXuLyVatTu} an={{ id: r.id }} nhanLuu="Duyệt" />}
              {duyet && (r.nguoi_lap_id !== nd.nhanVienId || nd.vaiTro === "ky_thuat") && <NutHop kieu="chu" nguy nhan="Từ chối" tieuDe="Từ chối" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={tuChoiXuLyVatTu} an={{ id: r.id }} />}
              {r.nguoi_lap_id === nd.nhanVienId && <NutHop kieu="chu" nhan="Huỷ phiếu" tieuDe="Huỷ phiếu" xacNhan={`Huỷ ${r.ma}?`} action={huyXuLyVatTu} an={{ id: r.id }} nhanLuu="Huỷ phiếu" />}
            </div>
          ) },
        ]} />
    );
  } else {
    let q = db.from("phieu_xuat_khan").select("*").order("xuat_luc", { ascending: false }).limit(200);
    if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
    const { data: ds } = await q;
    const quanLy = (nv ?? []).filter((n) => !nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId || !n.chi_nhanh_id);
    const truong: Truong[] = [
      ...cnLC, { ten: "san_pham_id", nhan: "Vật tư", loai: "chon", batBuoc: true, rong: true, luaChon: spLC }, { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true },
      { ten: "so_lo", nhan: "Số lô", loai: "chu" }, { ten: "han_dung", nhan: "Hạn dùng", loai: "ngay" },
      { ten: "ly_do_lam_sang", nhan: "Lý do lâm sàng (ca nào, tình huống gì)", loai: "nhieu_dong", batBuoc: true, rong: true },
      { ten: "nguoi_quyet_dinh_id", nhan: "Người quyết định xuất", loai: "chon", batBuoc: true, luaChon: quanLy.map((n) => ({ gia_tri: n.id, nhan: n.ho_ten })) },
      { ten: "nguoi_de_nghi", nhan: "Người đề nghị", loai: "chu" }, { ten: "nguoi_nhan", nhan: "Người nhận hàng", loai: "chu" },
    ];
    if (nhap) nut = <NutHop nhan="Lập phiếu xuất khẩn" tieuDe="Xuất khẩn cấp" moTa="Chỉ cho cấp cứu y tế thực sự. Hàng ra khỏi kho ngay; kế toán/quản lý phải hậu kiểm trong 24 giờ. Không dùng cho nhu cầu gấp thông thường." truong={truong} action={xuatKhanCap} giaTri={{ san_pham_id: "", nguoi_quyet_dinh_id: "", chi_nhanh_id: "" }} rong />;
    noiDung = (
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có phiếu xuất khẩn cấp."
        cot={[
          { nhan: "Phiếu", chinh: true, hienThi: (r) => <div>{r.ma}<div className="text-[12.5px] text-muc-3">{ngayGioVN(r.xuat_luc)}{!nd.chiNhanhId && ` · ${tenCn.get(r.chi_nhanh_id)}`}</div></div> },
          { nhan: "Vật tư", hienThi: (r) => <div>{tenSp.get(r.san_pham_id)?.ten}<div className="text-[12.5px] text-muc-3">{soVN(r.so_luong)} {tenSp.get(r.san_pham_id)?.don_vi}</div></div> },
          { nhan: "Lý do lâm sàng", hienThi: (r) => r.ly_do_lam_sang }, { nhan: "Người quyết định", hienThi: (r) => tenNv.get(r.nguoi_quyet_dinh_id) ?? "" },
          { nhan: "Hậu kiểm", hienThi: (r) => {
            const qua = r.trang_thai === "cho_hau_kiem" && new Date(r.han_hau_kiem).getTime() < Date.now();
            return <div><NhanTrangThai kieu={qua ? "loi" : TT_XUAT_KHAN[r.trang_thai].kieu}>{qua ? "Quá hạn hậu kiểm" : TT_XUAT_KHAN[r.trang_thai].ten}</NhanTrangThai>{r.trang_thai === "cho_hau_kiem" ? <div className="mt-1 text-[12.5px] text-muc-3">Hạn {ngayGioVN(r.han_hau_kiem)}</div> : r.ket_luan && <div className="mt-1 text-[12.5px] text-muc-3">{r.ket_luan}</div>}</div>;
          } },
          { nhan: "", hienThi: (r) => (duyet && r.trang_thai === "cho_hau_kiem" ? <NutHop kieu="chu" nhan="Hậu kiểm" tieuDe={`Hậu kiểm ${r.ma}`} truong={[{ ten: "trang_thai", nhan: "Kết luận", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "da_hau_kiem", nhan: "Hợp lệ, đủ hồ sơ" }, { gia_tri: "vuot_tham_quyen", nhan: "Nghi vấn / vượt thẩm quyền, trình cấp trên" }] }, { ten: "ket_luan", nhan: "Nhận xét", loai: "nhieu_dong", batBuoc: true, rong: true }]} action={hauKiemXuatKhan} an={{ id: r.id }} giaTri={{ trang_thai: "da_hau_kiem" }} /> : null) },
        ]} />
    );
  }
  return (
    <div>
      <Link href="/kho" className="text-[13px] text-muc-3 hover:text-muc">← Kho</Link>
      <TieuDeTrang tieuDe="Xử lý vật tư & xuất khẩn cấp" phu="Huỷ, hao hụt, trả nhà cung cấp và điều chỉnh tồn chỉ ghi sổ sau khi người khác duyệt. Xuất khẩn cấp ghi sổ ngay rồi hậu kiểm trong 24 giờ.">{nut}</TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/kho/xu-ly" />
      {noiDung}
    </div>
  );
}
