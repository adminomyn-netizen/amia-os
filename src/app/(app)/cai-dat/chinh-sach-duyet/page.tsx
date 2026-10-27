import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { tienVN } from "@/lib/dinh-dang";
import { CHUC_DANH_TC, hanMucHieuLuc } from "@/lib/de-xuat";
import { NHAN_VAI_TRO, laVaiTro } from "@/lib/quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuQuyTacDuyet } from "../actions";

export default async function TrangChinhSachDuyet() {
  await yeuCauQuyen("hethong.phanquyen");
  const db = sb();
  const [{ data: qt }, { data: nv }] = await Promise.all([db.from("quy_tac_duyet").select("*").order("nguong_tien"), db.from("nhan_vien").select("id, ho_ten, vai_tro, chuc_danh_tai_chinh, han_muc_duyet").eq("hoat_dong", true).order("ho_ten")]);
  const duyet = (nv ?? []).filter((n) => hanMucHieuLuc(n.vai_tro, n.han_muc_duyet) > 0);
  const truong: Truong[] = [{ ten: "nguong_tien", nhan: "Ngưỡng (đ)", loai: "tien", batBuoc: true }, { ten: "hieu_luc", nhan: "Đã được chủ phòng khám xác nhận, đang áp dụng", loai: "gat" }];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Chính sách phê duyệt" phu="Ngưỡng tiền theo quy trình tài chính MSC và hạn mức duyệt của từng người. Người duyệt phải có hạn mức từ số tiền đề xuất trở lên; người gửi không tự duyệt; người duyệt không tự chi cùng đề xuất (trừ Kỹ thuật)." />
      <h2 className="nhan-muc mb-2">Ngưỡng tiền</h2>
      <Bang duLieu={qt ?? []} khoa={(r) => r.id}
        cot={[
          { nhan: "Quy tắc", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ten}</span><div className="mt-0.5 text-[13px] text-muc-3">{r.mo_ta}</div></div> },
          { nhan: "Ngưỡng", phai: true, hienThi: (r) => tienVN(r.nguong_tien) },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.trang_thai === "hieu_luc" ? "tot" : "cho"}>{r.trang_thai === "hieu_luc" ? "Đang áp dụng" : "Chờ xác nhận"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => <NutHop kieu="chu" nhan="Sửa" tieuDe={r.ten} truong={truong} action={luuQuyTacDuyet} giaTri={{ id: r.id, nguong_tien: r.nguong_tien, hieu_luc: r.trang_thai === "hieu_luc" }} /> },
        ]} />
      <h2 className="nhan-muc mb-2 mt-9">Người được duyệt chi</h2>
      <p className="mb-3 text-[13px] text-muc-3">Đặt hạn mức và chức danh tài chính ở mục Nhân viên (nút Sửa). Chưa đặt: Kỹ thuật và Quản lý không giới hạn, vai trò khác không duyệt tiền.</p>
      <Bang duLieu={duyet} khoa={(r) => r.id} trong="Chưa có ai được duyệt chi."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> },
          { nhan: "Vai trò", hienThi: (r) => (laVaiTro(r.vai_tro) ? NHAN_VAI_TRO[r.vai_tro] : r.vai_tro) }, { nhan: "Chức danh tài chính", hienThi: (r) => (r.chuc_danh_tai_chinh ? CHUC_DANH_TC[r.chuc_danh_tai_chinh] : "") },
          { nhan: "Hạn mức duyệt", phai: true, hienThi: (r) => { const h = hanMucHieuLuc(r.vai_tro, r.han_muc_duyet); return h === Infinity ? "Không giới hạn" : tienVN(h); } },
        ]} />
    </div>
  );
}
