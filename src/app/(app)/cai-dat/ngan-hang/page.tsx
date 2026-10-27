import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuNganHang } from "../actions";

/** Số tài khoản luôn che, chỉ hiện 4 số cuối — tên đầy đủ chỉ thấy khi mở hộp sửa (người có quyền sửa danh mục). */
const che = (s: string) => `•••• ${s.slice(-4)}`;

export default async function TrangNganHang() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sua = coQuyen(nd, "danhmuc.sua");
  const db = sb();
  const [{ data: tk }, { data: cn }] = await Promise.all([db.from("tai_khoan_ngan_hang").select("*").order("tao_luc"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma")]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const truong: Truong[] = [
    { ten: "ngan_hang", nhan: "Ngân hàng", loai: "chu", batBuoc: true, goiY: "VD: Vietcombank" }, { ten: "so_tai_khoan", nhan: "Số tài khoản", loai: "chu", batBuoc: true },
    { ten: "chu_tai_khoan", nhan: "Chủ tài khoản", loai: "chu", batBuoc: true, goiY: "TÊN KHÔNG DẤU" }, { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Dùng chung mọi chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
  ];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Tài khoản ngân hàng" phu="Tài khoản nhận tiền chuyển khoản, dùng cho thu ngân và sổ quỹ. Số tài khoản luôn hiển thị dạng che.">
        {sua && <NutHop nhan="Thêm tài khoản" tieuDe="Thêm tài khoản ngân hàng" truong={truong} action={luuNganHang} giaTri={{ hoat_dong: true, chi_nhanh_id: "" }} />}
      </TieuDeTrang>
      <Bang duLieu={tk ?? []} khoa={(r) => r.id} trong="Chưa khai báo tài khoản ngân hàng nào."
        cot={[
          { nhan: "Ngân hàng", chinh: true, hienThi: (r) => <span className="text-muc">{r.ngan_hang}</span> },
          { nhan: "Số tài khoản", hienThi: (r) => che(r.so_tai_khoan) },
          { nhan: "Chủ tài khoản", hienThi: (r) => r.chu_tai_khoan },
          { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : "Dùng chung") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang dùng" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa tài khoản ngân hàng" truong={truong} action={luuNganHang} giaTri={{ id: r.id, ngan_hang: r.ngan_hang, so_tai_khoan: r.so_tai_khoan, chu_tai_khoan: r.chu_tai_khoan, chi_nhanh_id: r.chi_nhanh_id ?? "", ghi_chu: r.ghi_chu ?? "", hoat_dong: r.hoat_dong }} /> : null) },
        ]} />
    </div>
  );
}
