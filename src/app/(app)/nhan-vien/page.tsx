import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_VAI_TRO, VAI_TRO, laVaiTro, quyenHieuLuc } from "@/lib/quyen";
import { NutPhanQuyen } from "@/components/nhan-vien/NutPhanQuyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { datLaiMatKhau, duyetYeuCauTaiKhoan, suaNhanVien, taoNhanVien, tuChoiYeuCauTaiKhoan, xoaNhanVien } from "./actions";
import { ngayVN, ngayCuaIso } from "@/lib/dinh-dang";

export default async function TrangNhanVien() {
  await yeuCauQuyen("hethong.phanquyen");
  const db = sb();
  const [{ data: yeuCau }, { data: ds }, { data: cn }] = await Promise.all([db.from("yeu_cau_tai_khoan").select("*").eq("trang_thai", "cho_duyet").order("tao_luc"), db.from("nhan_vien").select("id, user_id, ho_ten, email, dien_thoai, vai_tro, chuc_danh, chi_nhanh_id, hoat_dong, quyen_rieng").order("ho_ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma")]);
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
      {(yeuCau ?? []).length > 0 && (
        <section className="mb-8">
          <h2 className="nhan-muc mb-2">Yêu cầu đăng ký đang chờ ({yeuCau!.length})</h2>
          <Bang duLieu={yeuCau ?? []} khoa={(r) => r.id}
            cot={[
              { nhan: "Họ tên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> },
              { nhan: "Liên hệ", hienThi: (r) => <div>{r.email}<div className="text-[12.5px] text-muc-3">{r.dien_thoai}</div></div> },
              { nhan: "Chi nhánh · vị trí", hienThi: (r) => [tenCn.get(r.chi_nhanh_id ?? ""), r.vi_tri].filter(Boolean).join(" · ") },
              { nhan: "Gửi lúc", hienThi: (r) => ngayVN(ngayCuaIso(r.tao_luc)) },
              { nhan: "", hienThi: (r) => (
                <div className="flex flex-wrap justify-end gap-1.5">
                  <NutHop kieu="chu" nhan="Duyệt" tieuDe={`Duyệt: ${r.ho_ten}`} moTa="Tạo tài khoản với mật khẩu ban đầu 12345678; người dùng buộc đổi khi vào lần đầu. Nhớ báo mật khẩu cho họ." truong={[{ ten: "vai_tro", nhan: "Vai trò", loai: "chon", luaChon: vaiTroLC, batBuoc: true }]} giaTri={{ vai_tro: "le_tan" }} an={{ id: r.id }} action={duyetYeuCauTaiKhoan} nhanLuu="Tạo tài khoản" />
                  <NutHop kieu="chu" nguy nhan="Từ chối" tieuDe={`Từ chối: ${r.ho_ten}`} truong={[{ ten: "ly_do", nhan: "Lý do (không bắt buộc)", loai: "chu", rong: true }]} an={{ id: r.id }} action={tuChoiYeuCauTaiKhoan} nhanLuu="Từ chối" />
                </div>
              ) },
            ]} />
        </section>
      )}
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} cot={[
        { nhan: "Họ tên", hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> }, { nhan: "Vai trò", hienThi: (r) => NHAN_VAI_TRO[r.vai_tro as keyof typeof NHAN_VAI_TRO] ?? r.vai_tro },
        { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : "Mọi chi nhánh") }, { nhan: "Email", hienThi: (r) => r.email ?? "Không có tài khoản" },
        { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang làm" : "Đã khoá"}</NhanTrangThai> },
        { nhan: "", hienThi: (r) => (
          <span className="flex gap-4">
            {laVaiTro(r.vai_tro) && r.vai_tro !== "ky_thuat" && <NutPhanQuyen id={r.id} hoTen={r.ho_ten} vaiTro={NHAN_VAI_TRO[r.vai_tro]} dangDung={quyenHieuLuc(r.vai_tro, r.quyen_rieng)} macDinh={!r.quyen_rieng} coRieng={!!r.quyen_rieng} />}
            <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ho_ten}`} truong={truongSua} giaTri={{ ...r, chuc_danh: r.chuc_danh ?? "", dien_thoai: r.dien_thoai ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "" }} action={suaNhanVien} />
            {r.user_id && <NutHop kieu="chu" nhan="Đặt lại mật khẩu" tieuDe={`Đặt lại mật khẩu: ${r.ho_ten}`} truong={[{ ten: "mat_khau", nhan: "Mật khẩu mới (≥ 8 ký tự)", loai: "mat_khau", batBuoc: true, rong: true }]} giaTri={{ id: r.id }} action={datLaiMatKhau} />}
            {r.vai_tro !== "ky_thuat" && <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá nhân viên: ${r.ho_ten}`} xacNhan="Xoá hồ sơ này (kèm tài khoản đăng nhập nếu có)? Không hoàn lại được. Người đã có hoá đơn, lịch hay phiếu liên quan sẽ không xoá được; khi đó hãy khoá tài khoản." an={{ id: r.id }} nhanLuu="Xoá" action={xoaNhanVien} />}
          </span>
        ) },
      ]} />
    </>
  );
}
