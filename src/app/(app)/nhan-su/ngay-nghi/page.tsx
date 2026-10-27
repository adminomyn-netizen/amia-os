import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayCuaIso, ngayVN, soVN } from "@/lib/dinh-dang";
import { LOAI_PHIEU, LOAI_NGHI, LOI_CC, TT_PHIEU } from "@/lib/nhan-su";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { guiPhieuHr, huyPhieuHr, dieuChinhPhep } from "../actions";

export default async function TrangNgayNghi({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xem = coQuyen(nd, "cong.xem") || coQuyen(nd, "nghi.duyet"), sua = coQuyen(nd, "cong.sua");
  const TAB = [{ ma: "cua-toi", ten: "Của tôi" }, ...(xem ? [{ ma: "tat-ca", ten: "Tất cả" }, { ma: "cho-duyet", ten: "Chờ duyệt" }] : [])];
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "cua-toi";
  const hom = homNayHCM(), nam = Number(hom.slice(0, 4));
  const db = sb();
  let q = db.from("phieu_hr").select("*").order("tao_luc", { ascending: false }).limit(300);
  if (tab === "cua-toi") q = q.eq("nhan_vien_id", nd.nhanVienId);
  if (tab === "cho-duyet") q = q.eq("trang_thai", "cho_duyet");
  const [{ data: ds }, { data: nv }, { data: du }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id").eq("hoat_dong", true).order("ho_ten"), db.rpc("so_du_phep", { p_nv: nd.nhanVienId, p_nam: nam })]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const ngoai = (ds ?? []).filter((p) => !nd.chiNhanhId || tab === "cua-toi" || (nv ?? []).find((n) => n.id === p.nhan_vien_id)?.chi_nhanh_id === nd.chiNhanhId);
  const nhanLoai = Object.entries(LOAI_PHIEU).map(([gia_tri, nhan]) => ({ gia_tri, nhan }));
  const truong: Truong[] = [
    { ten: "loai", nhan: "Loại phiếu", loai: "chon", batBuoc: true, luaChon: nhanLoai },
    { ten: "loai_nghi", nhan: "Loại nghỉ (khi chọn Nghỉ)", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...Object.entries(LOAI_NGHI).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))] },
    ...(sua ? [{ ten: "nhan_vien_id", nhan: "Tạo thay cho nhân viên (bỏ trống = chính tôi)", loai: "chon" as const, rong: true, luaChon: [{ gia_tri: "", nhan: "Chính tôi" }, ...(nv ?? []).filter((n) => n.id !== nd.nhanVienId).map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` }))] }] : []),
    { ten: "tu_ngay", nhan: "Từ ngày", loai: "ngay", batBuoc: true }, { ten: "den_ngay", nhan: "Đến ngày (bỏ trống = một ngày)", loai: "ngay" },
    { ten: "so_ngay", nhan: "Số ngày (nghỉ nửa ngày: 0,5; bỏ trống = đủ khoảng ngày)", loai: "so" }, { ten: "so_gio", nhan: "Số giờ (tăng ca, đi trễ, ra ngoài)", loai: "so" },
    { ten: "vao_dieu_chinh", nhan: "Giờ vào đúng (điều chỉnh công, 08:00)", loai: "chu" }, { ten: "ra_dieu_chinh", nhan: "Giờ ra đúng (điều chỉnh công, 17:30)", loai: "chu" },
    { ten: "loi_cham_cong", nhan: "Loại lỗi (điều chỉnh công)", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...Object.entries(LOI_CC).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))] },
    { ten: "nguoi_nhan_ban_giao_id", nhan: "Người nhận bàn giao", loai: "chon", rong: true, luaChon: [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.id !== nd.nhanVienId).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] },
    { ten: "ly_do", nhan: "Lý do", loai: "nhieu_dong", batBuoc: true, rong: true },
  ];
  const truongPhep: Truong[] = [
    { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` })) }, { ten: "nam", nhan: "Năm", loai: "so", batBuoc: true },
    { ten: "so_ngay", nhan: "Số ngày cộng (âm để trừ)", loai: "so", batBuoc: true }, { ten: "ly_do", nhan: "Lý do (phép tồn năm trước, thưởng phép…)", loai: "chu", batBuoc: true, rong: true },
  ];
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Quản lý ngày nghỉ" phu={<>Phiếu nghỉ, tăng ca, đi trễ, ra ngoài, làm online, công tác và điều chỉnh công. Duyệt ở <Link href="/noi-lam-viec/phe-duyet" className="text-nhan-dam hover:underline">Trung tâm phê duyệt</Link>; chỉ phiếu đã duyệt mới tính vào công.</>}>
        <NutHop nhan="Tạo phiếu" tieuDe="Tạo phiếu" moTa="Nghỉ ≤ 2 ngày báo trước 5 ngày, từ 2 đến dưới 4 ngày báo trước 7 ngày, từ 4 ngày do Ban Giám đốc duyệt. Báo trễ vẫn gửi được nhưng bị gắn cờ." truong={truong} action={guiPhieuHr} giaTri={{ tu_ngay: hom, loai: "nghi", loai_nghi: "phep_nam", nhan_vien_id: "", nguoi_nhan_ban_giao_id: "" }} rong />
        {sua && <NutHop kieu="phu" nhan="Chỉnh phép năm" tieuDe="Chỉnh phép năm" truong={truongPhep} action={dieuChinhPhep} giaTri={{ nam }} />}
      </TieuDeTrang>
      <HangChiSo muc={[{ nhan: `Phép năm ${nam} còn lại`, so: soVN(du), ghiChu: "ngày (1 ngày/tháng từ ngày vào chính thức)" }]} />
      <div className="mt-6" />
      <Tab muc={TAB} dang={tab} goc="/nhan-su/ngay-nghi" />
      <Bang duLieu={ngoai} khoa={(r) => r.id} trong="Chưa có phiếu nào."
        cot={[
          { nhan: "Mã", chinh: true, hienThi: (r) => r.ma }, { nhan: "Nhân viên", hienThi: (r) => ten.get(r.nhan_vien_id) ?? "" },
          { nhan: "Loại", hienThi: (r) => <div>{LOAI_PHIEU[r.loai]}{r.loai_nghi && <div className="text-[12.5px] text-muc-3">{LOAI_NGHI[r.loai_nghi]}</div>}</div> },
          { nhan: "Thời gian", hienThi: (r) => <div>{ngayVN(r.tu_ngay)}{r.den_ngay !== r.tu_ngay && ` – ${ngayVN(r.den_ngay)}`}<div className="text-[12.5px] text-muc-3">{r.loai === "lam_them" || r.so_gio ? `${soVN(r.so_gio)} giờ` : `${soVN(r.so_ngay)} ngày`}</div></div> },
          { nhan: "Lý do", hienThi: (r) => <div>{r.ly_do}{r.qua_han_bao_truoc && <div className="text-[12.5px] text-canh-bao">Báo trễ so với quy định</div>}{r.vuot_han_muc && <div className="text-[12.5px] text-canh-bao">Quên chấm công quá 3 lần/tháng</div>}{r.ly_do_duyet && <div className="text-[12.5px] text-muc-3">Ghi chú duyệt: {r.ly_do_duyet}</div>}</div> },
          { nhan: "Gửi", hienThi: (r) => ngayVN(ngayCuaIso(r.tao_luc)) },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_PHIEU[r.trang_thai].kieu}>{TT_PHIEU[r.trang_thai].ten}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (r.trang_thai === "cho_duyet" && (r.nguoi_gui_id === nd.nhanVienId || sua) ? <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ phiếu" xacNhan={`Huỷ phiếu ${r.ma}?`} action={huyPhieuHr} an={{ id: r.id }} nhanLuu="Huỷ phiếu" /> : null) },
        ]} />
    </div>
  );
}
