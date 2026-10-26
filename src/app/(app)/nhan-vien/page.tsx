import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_VAI_TRO, VAI_TRO, laVaiTro, quyenHieuLuc } from "@/lib/quyen";
import { NutPhanQuyen } from "@/components/nhan-vien/NutPhanQuyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { datLaiMatKhau, suaNhanVien, taoNhanVien } from "./actions";

export default async function TrangNhanVien() {
  await yeuCauQuyen("hethong.phanquyen");
  const db = sb();
  const [{ data: ds }, { data: cn }] = await Promise.all([db.from("nhan_vien").select("id, user_id, ho_ten, email, dien_thoai, vai_tro, chuc_danh, chi_nhanh_id, hoat_dong, quyen_rieng").order("ho_ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma")]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const vaiTroLC = VAI_TRO.map((v) => ({ gia_tri: v, nhan: NHAN_VAI_TRO[v] }));
  const cnLC = [{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))];
  const chung: Truong[] = [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "vai_tro", nhan: "Vai trò", loai: "chon", luaChon: vaiTroLC, batBuoc: true },
    { ten: "chuc_danh", nhan: "Chức danh hiển thị", loai: "chu" }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: cnLC },
  ];
  const truongTao: Truong[] = [
    ...chung,
    { ten: "email", nhan: "Email đăng nhập (bỏ trống nếu không cần tài khoản)", loai: "email", rong: true },
    { ten: "mat_khau", nhan: "Mật khẩu ban đầu (bỏ trống = 12345678; người dùng buộc đổi khi vào lần đầu)", loai: "mat_khau", rong: true },
  ];
  const truongSua: Truong[] = [...chung, { ten: "hoat_dong", nhan: "Đang làm việc / được đăng nhập", loai: "gat" }];

  return (
    <>
      <TieuDeTrang tieuDe="Nhân viên" phu="Tài khoản, vai trò, phân quyền từng người và chi nhánh. Chỉ Kỹ thuật thấy mục này. Người không cần đăng nhập (VD kỹ thuật viên) vẫn tạo hồ sơ để gán vào hoá đơn và hoa hồng.">
        <NutHop nhan="Thêm nhân viên" tieuDe="Thêm nhân viên" truong={truongTao} giaTri={{ vai_tro: "le_tan", chi_nhanh_id: "" }} action={taoNhanVien} />
      </TieuDeTrang>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} cot={[
        { nhan: "Họ tên", hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> }, { nhan: "Vai trò", hienThi: (r) => NHAN_VAI_TRO[r.vai_tro as keyof typeof NHAN_VAI_TRO] ?? r.vai_tro },
        { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : "Mọi chi nhánh") }, { nhan: "Email", hienThi: (r) => r.email ?? "Không có tài khoản" },
        { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang làm" : "Đã khoá"}</NhanTrangThai> },
        { nhan: "", hienThi: (r) => (
          <span className="flex gap-4">
            {laVaiTro(r.vai_tro) && r.vai_tro !== "ky_thuat" && <NutPhanQuyen id={r.id} hoTen={r.ho_ten} vaiTro={NHAN_VAI_TRO[r.vai_tro]} dangDung={quyenHieuLuc(r.vai_tro, r.quyen_rieng)} macDinh={!r.quyen_rieng} coRieng={!!r.quyen_rieng} />}
            <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ho_ten}`} truong={truongSua} giaTri={{ ...r, chuc_danh: r.chuc_danh ?? "", dien_thoai: r.dien_thoai ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "" }} action={suaNhanVien} />
            {r.user_id && <NutHop kieu="chu" nhan="Đặt lại mật khẩu" tieuDe={`Đặt lại mật khẩu: ${r.ho_ten}`} truong={[{ ten: "mat_khau", nhan: "Mật khẩu mới (≥ 8 ký tự)", loai: "mat_khau", batBuoc: true, rong: true }]} giaTri={{ id: r.id }} action={datLaiMatKhau} />}
          </span>
        ) },
      ]} />
    </>
  );
}
