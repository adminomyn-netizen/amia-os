import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { LOAI_NGHI_VIEC, NHOM_LY_DO_NGHI, TT_NGHI_VIEC } from "@/lib/ho-so";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { ThanhTyLe } from "@/components/ui/ThanhTyLe";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { duyetNghiViec, guiNghiViec } from "../ho-so/actions";

const TAB = [{ ma: "dang-chay", ten: "Đang xử lý" }, { ma: "lich-su", ten: "Lịch sử" }, { ma: "ly-do", ten: "Lý do nghỉ" }];

/** Hàng chờ nghỉ việc (Lark 1.8 / 1.9): phiếu → Ban Giám đốc duyệt → bàn giao, biên bản, cam kết → hoàn tất (khoá tài khoản). */
export default async function TrangNghiViec({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("hr.hoso");
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "dang-chay";
  const db = sb();
  const [{ data: ds }, { data: nv }] = await Promise.all([
    db.from("nghi_viec").select("*").order("tao_luc", { ascending: false }).limit(300),
    db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id, hoat_dong, vai_tro").order("ho_ten"),
  ]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n]));
  const trongPham = (ds ?? []).filter((p) => !nd.chiNhanhId || ten.get(p.nhan_vien_id)?.chi_nhanh_id === nd.chiNhanhId);
  const dangChay = trongPham.filter((p) => ["cho_duyet", "da_duyet"].includes(p.trang_thai));
  const lichSu = trongPham.filter((p) => !["cho_duyet", "da_duyet"].includes(p.trang_thai));
  const nam = new Date().getFullYear().toString();
  const hoanTatNam = trongPham.filter((p) => p.trang_thai === "hoan_tat" && p.ngay_lam_cuoi.startsWith(nam));
  const lyDo = Object.entries(NHOM_LY_DO_NGHI).map(([k, nhan]) => ({ nhan, so: hoanTatNam.filter((p) => p.nhom_ly_do === k).length })).filter((x) => x.so > 0).sort((a, b) => b.so - a.so);
  const duyet = coQuyen(nd, "nghi.duyet_bgd");
  const dong = tab === "dang-chay" ? dangChay : lichSu;
  return (
    <div>
      <Link href="/nhan-su/ho-so" className="text-[13px] text-muc-3 hover:text-muc">← Hồ sơ nhân sự</Link>
      <TieuDeTrang tieuDe="Nghỉ việc" phu="Đơn xin nghỉ → Ban Giám đốc duyệt → bàn giao, ký biên bản thoả thuận và cam kết bảo mật → hoàn tất (khoá tài khoản, giữ hồ sơ). Người lập hoặc chính chủ không tự duyệt.">
        <NutHop nhan="Lập phiếu hộ nhân viên" tieuDe="Lập phiếu nghỉ việc" action={guiNghiViec} giaTri={{ loai: "dung_han", nhom_ly_do: "khac" }} rong
          truong={[
            { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, rong: true, luaChon: (nv ?? []).filter((n) => n.hoat_dong && (!nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId) && !["ky_thuat", "chu"].includes(n.vai_tro)).map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` })) },
            { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_NGHI_VIEC).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
            { ten: "ngay_lam_cuoi", nhan: "Ngày làm việc cuối cùng", loai: "ngay", batBuoc: true },
            { ten: "nhom_ly_do", nhan: "Lý do chính", loai: "chon", batBuoc: true, rong: true, luaChon: Object.entries(NHOM_LY_DO_NGHI).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
            { ten: "nguoi_nhan_ban_giao_id", nhan: "Người nhận bàn giao", loai: "chon", rong: true, luaChon: [{ gia_tri: "", nhan: "Chưa chọn" }, ...(nv ?? []).filter((n) => n.hoat_dong).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] },
            { ten: "ly_do", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
          ]} />
      </TieuDeTrang>
      <HangChiSo muc={[{ nhan: "Đang xử lý", so: String(dangChay.length), ghiChu: `${dangChay.filter((p) => p.trang_thai === "cho_duyet").length} chờ duyệt` }, { nhan: `Đã nghỉ việc ${nam}`, so: String(hoanTatNam.length) }]} />
      <div className="mt-6" />
      <Tab muc={TAB.map((x) => (x.ma === "dang-chay" ? { ...x, ten: `Đang xử lý (${dangChay.length})` } : x))} dang={tab} goc="/nhan-su/nghi-viec" />
      {tab === "ly-do" ? (
        lyDo.length === 0 ? <p className="text-[14px] text-muc-3">Năm {nam} chưa có ai hoàn tất nghỉ việc nên chưa có thống kê lý do.</p> : <div className="max-w-xl"><ThanhTyLe dong={lyDo} donVi="người" /></div>
      ) : (
        <Bang duLieu={dong} khoa={(r) => r.id} trong={tab === "dang-chay" ? "Không có phiếu nào đang xử lý." : "Chưa có phiếu nào."}
          cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <Link href={`/nhan-su/ho-so/${r.nhan_vien_id}?tab=nghi-viec`} className="hover:underline">{ten.get(r.nhan_vien_id)?.ho_ten ?? ""}<div className="text-[12.5px] text-muc-3">{ten.get(r.nhan_vien_id)?.ma_nv}</div></Link> },
            { nhan: "Loại / lý do", hienThi: (r) => <div className="text-[13px]">{LOAI_NGHI_VIEC[r.loai]}<div className="text-muc-3">{NHOM_LY_DO_NGHI[r.nhom_ly_do]}</div></div> },
            { nhan: "Ngày làm cuối", hienThi: (r) => ngayVN(r.ngay_lam_cuoi) },
            { nhan: "Bàn giao", hienThi: (r) => (["da_duyet", "hoan_tat"].includes(r.trang_thai) ? <div className="text-[13px]">{r.ban_giao_xong ? "✓" : "✗"} bàn giao · {r.bien_ban_thoa_thuan ? "✓" : "✗"} biên bản · {r.cam_ket_bao_mat ? "✓" : "✗"} bảo mật</div> : "") },
            { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_NGHI_VIEC[r.trang_thai].kieu}>{TT_NGHI_VIEC[r.trang_thai].ten}</NhanTrangThai> },
            { nhan: "", hienThi: (r) => (r.trang_thai === "cho_duyet" && duyet ? (
              <span className="flex gap-4">
                <NutHop kieu="chu" nhan="Duyệt" tieuDe="Duyệt đơn nghỉ việc" xacNhan="Duyệt đơn nghỉ việc này?" action={duyetNghiViec} an={{ id: r.id, quyet: "duyet" }} nhanLuu="Duyệt" />
                <NutHop kieu="chu" nguy nhan="Từ chối" tieuDe="Từ chối đơn nghỉ việc" action={duyetNghiViec} an={{ id: r.id, quyet: "tu_choi" }} truong={[{ ten: "ly_do_duyet", nhan: "Lý do từ chối", loai: "nhieu_dong", batBuoc: true, rong: true }]} nhanLuu="Từ chối" />
              </span>
            ) : <Link href={`/nhan-su/ho-so/${r.nhan_vien_id}?tab=nghi-viec`} className="text-[13px] text-nhan-dam hover:underline">Mở</Link>) },
          ]} />
      )}
    </div>
  );
}
