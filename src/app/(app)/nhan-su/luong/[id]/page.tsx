import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, soVN, tienVN } from "@/lib/dinh-dang";
import { TINH_TRANG_LUONG, TT_KY_LUONG } from "@/lib/nhan-su";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { tinhLaiKyLuong, guiDuyetKyLuong, duyetKyLuong, traLaiKyLuong, chiKyLuong, themKhoanLuong, xoaKhoanLuong, xoaKyLuong } from "../../actions";

const LOAI_KHOAN: Record<string, string> = { cong: "Cộng thêm", tru: "Trừ khác", tru_vi_pham: "Trừ vi phạm" };

export default async function TrangKyLuong({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nd = await yeuCauQuyen("luong.xem");
  const db = sb();
  const { data: ky } = await db.from("ky_luong").select("*").eq("id", id).maybeSingle();
  if (!ky) notFound();
  const [{ data: dong }, { data: nv }, { data: khoan }, { data: quy }] = await Promise.all([
    db.from("bang_luong_dong").select("*").eq("ky_id", id),
    db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id").order("ho_ten"),
    db.from("luong_khoan").select("*").eq("ky_id", id).order("tao_luc"),
    coQuyen(nd, "quy.ghi") ? db.from("quy").select("id, ten, chi_nhanh_id").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] }),
  ]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n]));
  const ds = (dong ?? []).filter((d) => !nd.chiNhanhId || ten.get(d.nhan_vien_id)?.chi_nhanh_id === nd.chiNhanhId).sort((a, b) => (ten.get(a.nhan_vien_id)?.ho_ten ?? "").localeCompare(ten.get(b.nhan_vien_id)?.ho_ten ?? "", "vi"));
  const tong = (k: keyof (typeof ds)[number]) => ds.reduce((a, d) => a + Number(d[k]), 0);
  const sua = coQuyen(nd, "luong.sua"), duyet = coQuyen(nd, "luong.duyet"), chi = coQuyen(nd, "quy.ghi");
  const tt = TT_KY_LUONG[ky.trang_thai];
  const truongKhoan: Truong[] = [
    { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: ds.map((d) => ({ gia_tri: d.nhan_vien_id, nhan: ten.get(d.nhan_vien_id)?.ho_ten ?? "" })) },
    { ten: "loai", nhan: "Loại khoản", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_KHOAN).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "tieu_de", nhan: "Nội dung (thưởng, phạt biên bản…)", loai: "chu", batBuoc: true, rong: true }, { ten: "so_tien", nhan: "Số tiền", loai: "tien", batBuoc: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su/luong", nhan: "Bảng lương" }} tieuDe={`Lương tháng ${String(ky.thang).padStart(2, "0")}/${ky.nam}`} phu={<><NhanTrangThai kieu={tt.kieu}>{tt.ten}</NhanTrangThai> <span className="ml-2">Công chuẩn {soVN(ky.cong_chuan)} · người lập: {ten.get(ky.nguoi_lap_id)?.ho_ten}{ky.nguoi_duyet_id && ` · người duyệt: ${ten.get(ky.nguoi_duyet_id)?.ho_ten}`}</span></>}>
        <a href={`/api/xuat/luong?id=${ky.id}`} className="text-[14px] text-nhan-dam hover:underline">Xuất Excel</a>
        {sua && ky.trang_thai === "nhap" && (
          <>
            <NutHop kieu="phu" nhan="Thêm khoản cộng/trừ" tieuDe="Thêm khoản cộng/trừ" moTa="Thưởng, trừ khác, phạt có biên bản. Bảng lương tự tính lại sau khi thêm." truong={truongKhoan} action={themKhoanLuong} an={{ ky_id: ky.id }} giaTri={{ loai: "cong" }} />
            <NutHop kieu="phu" nhan="Tính lại" tieuDe="Tính lại bảng lương" xacNhan="Tính lại toàn bộ từ chấm công, phiếu đã duyệt, điều kiện lương và hoa hồng mới nhất?" action={tinhLaiKyLuong} an={{ id: ky.id }} nhanLuu="Tính lại" />
            <NutHop nhan="Gửi duyệt" tieuDe="Gửi duyệt bảng lương" xacNhan="Gửi bảng lương này cho người duyệt? Sau khi gửi không tính lại được trừ khi bị trả về." action={guiDuyetKyLuong} an={{ id: ky.id }} nhanLuu="Gửi duyệt" />
            <NutHop kieu="chu" nguy nhan="Xoá kỳ" tieuDe="Xoá kỳ lương" xacNhan="Xoá kỳ lương đang lập này? Các khoản tạm ứng đã tính sẽ được trả lại để trừ ở kỳ sau." action={xoaKyLuong} an={{ id: ky.id }} nhanLuu="Xoá kỳ" />
          </>
        )}
        {duyet && ky.trang_thai === "cho_duyet" && (
          <>
            <NutHop kieu="phu" nhan="Trả về" tieuDe="Trả về chỉnh sửa" truong={[{ ten: "ly_do", nhan: "Lý do / cần sửa gì", loai: "chu", rong: true }]} action={traLaiKyLuong} an={{ id: ky.id }} nhanLuu="Trả về" />
            <NutHop nhan="Duyệt" tieuDe="Duyệt bảng lương" xacNhan={`Duyệt bảng lương tháng ${ky.thang}/${ky.nam}, tổng thực trả ${tienVN(tong("thuc_tra"))}? Người lập không tự duyệt.`} action={duyetKyLuong} an={{ id: ky.id }} nhanLuu="Duyệt" />
          </>
        )}
        {chi && ky.trang_thai === "da_duyet" && (
          <NutHop nhan="Chi lương" tieuDe="Chi lương" moTa={`Ghi một dòng chi ${tienVN(tong("thuc_tra"))} vào sổ quỹ. Người duyệt không tự chi cùng kỳ (trừ Kỹ thuật).`} action={chiKyLuong} an={{ id: ky.id }} giaTri={{ ngay: homNayHCM() }} nhanLuu="Chi lương"
            truong={[{ ten: "quy_id", nhan: "Chi từ quỹ", loai: "chon", batBuoc: true, luaChon: (quy ?? []).map((q) => ({ gia_tri: q.id, nhan: q.ten })) }, { ten: "ngay", nhan: "Ngày chi", loai: "ngay" }]} />
        )}
      </TieuDeNoi>
      <HangChiSo muc={[{ nhan: "Nhân viên", so: String(ds.length) }, { nhan: "Tổng thu nhập", so: tienVN(tong("gross")) }, { nhan: "BHXH + thuế", so: tienVN(tong("bhxh_nld") + tong("thue_tncn")) }, { nhan: "Tổng thực trả", so: tienVN(tong("thuc_tra")) }]} />
      <div className="mt-6" />
      <Bang duLieu={ds} khoa={(r) => r.id} trong="Kỳ lương chưa có dòng nào. Cài điều kiện lương cho nhân viên rồi bấm Tính lại."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div><span className="text-muc">{ten.get(r.nhan_vien_id)?.ho_ten}</span><div className="text-[12.5px] text-muc-3">{TINH_TRANG_LUONG[r.tinh_trang]} · {soVN(r.cong_tinh)}/{soVN(r.cong_chuan)} công</div></div> },
          { nhan: "Lương theo công", phai: true, hienThi: (r) => tienVN(r.luong_cong) }, { nhan: "OT", phai: true, hienThi: (r) => (r.luong_ot ? tienVN(r.luong_ot) : "") },
          { nhan: "Phụ cấp", phai: true, hienThi: (r) => tienVN(Number(r.an_ca) + Number(r.dong_phuc) + Number(r.nha_o)) }, { nhan: "Hoa hồng", phai: true, hienThi: (r) => (r.hoa_hong ? tienVN(r.hoa_hong) : "") },
          { nhan: "Cộng khác", phai: true, hienThi: (r) => (r.cong_khac ? tienVN(r.cong_khac) : "") }, { nhan: "Tổng thu nhập", phai: true, hienThi: (r) => tienVN(r.gross) },
          { nhan: "BHXH", phai: true, hienThi: (r) => (r.bhxh_nld ? tienVN(r.bhxh_nld) : "") }, { nhan: "Thuế TNCN", phai: true, hienThi: (r) => (r.thue_tncn ? tienVN(r.thue_tncn) : "") },
          { nhan: "Trừ khác / vi phạm", phai: true, hienThi: (r) => (Number(r.tru_khac) + Number(r.tru_vi_pham) ? tienVN(Number(r.tru_khac) + Number(r.tru_vi_pham)) : "") }, { nhan: "Tạm ứng", phai: true, hienThi: (r) => (r.tam_ung ? tienVN(r.tam_ung) : "") },
          { nhan: "Thực trả", phai: true, hienThi: (r) => <b className={Number(r.thuc_tra) < 0 ? "text-loi" : ""}>{tienVN(r.thuc_tra)}</b> },
        ]} />
      {(khoan ?? []).length > 0 && (
        <>
          <h2 className="nhan-muc mb-2 mt-9">Khoản cộng/trừ của kỳ</h2>
          <Bang duLieu={khoan ?? []} khoa={(r) => r.id}
            cot={[
              { nhan: "Nhân viên", chinh: true, hienThi: (r) => ten.get(r.nhan_vien_id)?.ho_ten }, { nhan: "Loại", hienThi: (r) => LOAI_KHOAN[r.loai] }, { nhan: "Nội dung", hienThi: (r) => r.tieu_de },
              { nhan: "Số tiền", phai: true, hienThi: (r) => tienVN(r.so_tien) },
              { nhan: "", hienThi: (r) => (sua && ky.trang_thai === "nhap" ? <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá khoản" xacNhan="Xoá khoản này và tính lại bảng lương?" action={xoaKhoanLuong} an={{ id: r.id }} nhanLuu="Xoá" /> : null) },
            ]} />
        </>
      )}
      <p className="mt-4 text-[12px] text-muc-3">Thứ tự tính như bảng lương MSC: lương theo công + OT + ăn ca + đồng phục + nhà ở + hoa hồng + cộng khác = tổng thu nhập; trừ BHXH, thuế TNCN (luỹ tiến theo biểu đang cài), trừ khác, tạm ứng lương → thực trả (làm tròn nghìn). Thu nhập chịu thuế = tổng thu nhập − ăn ca − OT − đồng phục. Các tham số nằm ở cấu hình lương, không viết cứng.</p>
    </div>
  );
}
