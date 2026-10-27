import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, tienVN } from "@/lib/dinh-dang";
import { TT_KY_LUONG } from "@/lib/nhan-su";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { taoKyLuong } from "../actions";

export default async function TrangLuong() {
  const nd = await yeuCauQuyen("luong.xem");
  const sua = coQuyen(nd, "luong.sua");
  const db = sb();
  const [{ data: ky }, { data: dong }, { data: nv }] = await Promise.all([db.from("ky_luong").select("*").order("nam", { ascending: false }).order("thang", { ascending: false }).limit(60), db.from("bang_luong_dong").select("ky_id, thuc_tra, nhan_vien_id"), db.from("nhan_vien").select("id, ho_ten")]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tong = new Map<string, { n: number; tien: number }>();
  for (const d of dong ?? []) { const g = tong.get(d.ky_id) ?? { n: 0, tien: 0 }; g.n += 1; g.tien += Number(d.thuc_tra); tong.set(d.ky_id, g); }
  const hom = homNayHCM();
  const truong: Truong[] = [{ ten: "nam", nhan: "Năm", loai: "so", batBuoc: true }, { ten: "thang", nhan: "Tháng", loai: "so", batBuoc: true }, { ten: "cong_chuan", nhan: "Công chuẩn của kỳ (quy ước 26)", loai: "so", rong: true }];
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Bảng lương tổng hợp" phu="Mỗi tháng một kỳ lương. Lập → gửi duyệt → duyệt → chi. Mỗi dòng lương là bản chụp, sau khi duyệt không đổi. Bảng lương là TẠM TÍNH cho tới khi kế toán thuế xác nhận biểu thuế và các khoản chờ xác nhận.">
        <Link href="/nhan-su/luong/dieu-kien" className="text-[14px] text-nhan-dam hover:underline">Cài đặt lương cơ bản</Link>
        {sua && <NutHop nhan="Tạo bảng lương" tieuDe="Tạo bảng lương" moTa="Lấy công từ bảng chấm công và phiếu đã duyệt, điều kiện lương hiện hành, hoa hồng trong tháng." truong={truong} action={taoKyLuong} giaTri={{ nam: Number(hom.slice(0, 4)), thang: Number(hom.slice(5, 7)), cong_chuan: 26 }} />}
      </TieuDeTrang>
      <Bang duLieu={ky ?? []} khoa={(r) => r.id} trong="Chưa có kỳ lương nào."
        cot={[
          { nhan: "Kỳ lương", chinh: true, hienThi: (r) => <Link href={`/nhan-su/luong/${r.id}`} className="font-medium text-nhan-dam hover:underline">Tháng {String(r.thang).padStart(2, "0")}/{r.nam}</Link> },
          { nhan: "Số nhân viên", phai: true, hienThi: (r) => tong.get(r.id)?.n ?? 0 }, { nhan: "Tổng thực trả", phai: true, hienThi: (r) => tienVN(tong.get(r.id)?.tien ?? 0) },
          { nhan: "Người lập", hienThi: (r) => ten.get(r.nguoi_lap_id) ?? "" },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_KY_LUONG[r.trang_thai].kieu}>{TT_KY_LUONG[r.trang_thai].ten}</NhanTrangThai> },
        ]} />
    </div>
  );
}
