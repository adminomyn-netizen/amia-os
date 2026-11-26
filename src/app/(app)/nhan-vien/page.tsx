import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_VAI_TRO, VAI_TRO, laVaiTro, quyenHieuLuc } from "@/lib/quyen";
import { NutPhanQuyen } from "@/components/nhan-vien/NutPhanQuyen";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { datDangKyTuDo, datLaiMatKhau, suaNhanVien, taoNhanVien, xoaNhanVien } from "./actions";
import { ngayVN } from "@/lib/dinh-dang";
import { CHUC_DANH_TC } from "@/lib/de-xuat";
import { KHUNG_LAM, TT_LAM } from "@/lib/nhan-su";
import { laNguoiSuaQuyTrinh } from "@/lib/quy-trinh-duyet-server";
import { giaTriVaiTheoChiNhanh, truongVaiTheoChiNhanh } from "./truong-chi-nhanh";

export default async function TrangNhanVien({ searchParams }: { searchParams: Promise<{ nghi?: string }> }) {
  const ndTrang = await yeuCauQuyen("hethong.phanquyen");
  const nguoiSuaQT = await laNguoiSuaQuyTrinh(ndTrang.nhanVienId);
  const hienNghi = (await searchParams).nghi === "1";
  const db = sb();
  const [{ data: moDk }, { data: ds }, { data: cn }] = await Promise.all([db.from("cau_hinh").select("gia_tri").eq("khoa", "dang_ky.mo").maybeSingle(), db.from("nhan_vien").select("id, user_id, ho_ten, email, dien_thoai, vai_tro, chuc_danh, chi_nhanh_id, hoat_dong, quyen_rieng, han_muc_duyet, chuc_danh_tai_chinh, ma_nv, ngay_vao_lam, ngay_vao_chinh_thuc, trang_thai_lam, khung_lam_viec, vai_tro_chuyen_mon, them:nhan_vien_chi_nhanh!nhan_vien_chi_nhanh_nhan_vien_id_fkey(chi_nhanh_id, vai_tro)").order("ho_ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma")]);
  const dangKyMo = (moDk?.gia_tri ?? "1") !== "0";
  // Mặc định chỉ hiện nhân sự ĐANG LÀM (được đăng nhập + trạng thái Đang làm); người đã nghỉ / khoá / tài khoản thử giữ nguyên trong DB (hoá đơn, hoa hồng cũ trỏ tới), bấm "Hiện cả nhân sự đã nghỉ" mới thấy.
  const dangLam = (r: { hoat_dong: boolean; trang_thai_lam: string }) => r.hoat_dong && r.trang_thai_lam === "dang_lam";
  const soNghi = (ds ?? []).filter((r) => !dangLam(r)).length;
  const dsHien = hienNghi ? ds ?? [] : (ds ?? []).filter(dangLam);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const vaiTroLC = VAI_TRO.map((v) => ({ gia_tri: v, nhan: NHAN_VAI_TRO[v] }));
  const cnLC = [{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))];
  const chung: Truong[] = [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "vai_tro", nhan: "Vai trò", loai: "chon", luaChon: vaiTroLC, batBuoc: true },
    { ten: "chuc_danh", nhan: "Chức danh hiển thị", loai: "chu" }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh chính", loai: "chon", luaChon: cnLC, ghiChu: "Mọi chi nhánh = vào được mọi chi nhánh với một vai. Chọn một chi nhánh thì chỉ vào được chi nhánh đó và các chi nhánh có quyền bên dưới." },
    ...truongVaiTheoChiNhanh(cn ?? []),
  ];
  const truongTao: Truong[] = [
    ...chung,
    { ten: "email", nhan: "Email đăng nhập (bỏ trống nếu không cần tài khoản)", loai: "email", rong: true },
    { ten: "mat_khau", nhan: "Mật khẩu ban đầu (bỏ trống = 12345678; người dùng buộc đổi khi vào lần đầu)", loai: "mat_khau", rong: true },
  ];
  const truongSuaDayDu: Truong[] = [...chung,
    { ten: "trang_thai_lam", nhan: "Trạng thái làm việc (Nghỉ việc / Khoá = không đăng nhập được)", loai: "chon", rong: true, luaChon: Object.entries(TT_LAM).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "ngay_vao_lam", nhan: "Ngày vào làm", loai: "ngay" }, { ten: "ngay_vao_chinh_thuc", nhan: "Ngày vào chính thức (tính phép năm)", loai: "ngay" },
    { ten: "khung_lam_viec", nhan: "Khung làm việc / chấm công", loai: "chon", rong: true, luaChon: Object.entries(KHUNG_LAM).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "vai_tro_chuyen_mon", nhan: "Vai trò chuyên môn (chọn nhiều)", loai: "nhieu", luaChon: [["bac_si_da_lieu", "Bác sĩ da liễu"], ["ky_thuat_vien", "Chuyên viên trị liệu"], ["tu_van", "Tư vấn"], ["le_tan", "Lễ tân"], ["thu_ngan", "Thu ngân"], ["quan_ly", "Quản lý"], ["cskh", "Chăm sóc khách hàng"]].map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "chuc_danh_tai_chinh", nhan: "Chức danh tài chính (nếu có)", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không có" }, ...Object.entries(CHUC_DANH_TC).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))] },
    { ten: "han_muc_duyet", nhan: "Hạn mức duyệt chi (đ). Bỏ trống = theo vai trò (Kỹ thuật, Quản lý không giới hạn; vai trò khác không duyệt tiền)", loai: "so", rong: true },
    { ten: "hoat_dong", nhan: "Đang làm việc / được đăng nhập", loai: "gat" }];
  // Chức danh tài chính và hạn mức duyệt chỉ anh Nam được đổi: người khác không thấy hai ô này.
  const truongSua = truongSuaDayDu.filter((t) => nguoiSuaQT || (t.ten !== "chuc_danh_tai_chinh" && t.ten !== "han_muc_duyet"));

  return (
    <>
      <TieuDeNoi tieuDe="Nhân viên" phu="Tài khoản, vai trò, phân quyền từng người và chi nhánh. Chỉ Kỹ thuật thấy mục này. Người tự đăng ký có sẵn vai trò Nhân viên: vào Sửa để đổi vai trò, vị trí, chi nhánh cho họ. Người không cần đăng nhập (VD kỹ thuật viên) vẫn tạo hồ sơ để gán vào hoá đơn và hoa hồng.">
        <NutHop kieu="phu" nhan={dangKyMo ? "Đăng ký tự do: đang bật" : "Đăng ký tự do: đang tắt"} tieuDe="Đăng ký tự do" xacNhan={dangKyMo ? "Tắt đăng ký tự do? Người chưa có tài khoản sẽ không đăng ký được nữa." : "Bật đăng ký tự do? Ai vào /dang-ky cũng tạo được tài khoản vai trò Nhân viên, dùng được ngay."} action={datDangKyTuDo} an={{ mo: dangKyMo ? "0" : "1" }} nhanLuu={dangKyMo ? "Tắt" : "Bật"} />
        <NutHop nhan="Thêm nhân viên" tieuDe="Thêm nhân viên" truong={truongTao} giaTri={{ vai_tro: "le_tan", chi_nhanh_id: "" }} action={taoNhanVien} />
      </TieuDeNoi>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
        <span className="text-muc-2">{hienNghi ? `Tất cả ${(ds ?? []).length} hồ sơ` : `${dsHien.length} nhân sự đang làm`}</span>
        {soNghi > 0 && <Link href={hienNghi ? "/nhan-vien" : "/nhan-vien?nghi=1"} scroll={false} className="font-medium text-nhan-dam hover:underline">{hienNghi ? "Chỉ nhân sự đang làm" : `Hiện cả nhân sự đã nghỉ (${soNghi})`}</Link>}
      </div>
      <Bang noi duLieu={dsHien} khoa={(r) => r.id} cot={[
        { nhan: "Họ tên", hienThi: (r) => <div><span className="text-muc">{r.ho_ten}</span><div className="text-[12.5px] text-muc-3">{r.ma_nv}{r.ngay_vao_lam ? ` · từ ${ngayVN(r.ngay_vao_lam)}` : ""}</div></div> }, { nhan: "Vai trò", hienThi: (r) => NHAN_VAI_TRO[r.vai_tro as keyof typeof NHAN_VAI_TRO] ?? r.vai_tro },
        { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? <span className="flex flex-col"><span>{tenCn.get(r.chi_nhanh_id) ?? ""}</span>{r.vai_tro !== "chu" && r.vai_tro !== "ky_thuat" && r.them.filter((g) => g.chi_nhanh_id !== r.chi_nhanh_id).map((g) => <span key={g.chi_nhanh_id} className="text-[12.5px] text-muc-3">+ {tenCn.get(g.chi_nhanh_id) ?? "Chi nhánh"}: {NHAN_VAI_TRO[g.vai_tro as keyof typeof NHAN_VAI_TRO] ?? g.vai_tro}</span>)}</span> : "Mọi chi nhánh") }, { nhan: "Email", hienThi: (r) => r.email ?? "Không có tài khoản" },
        { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong && r.trang_thai_lam === "dang_lam" ? "tot" : r.hoat_dong ? "cho" : "tram"}>{TT_LAM[r.trang_thai_lam] ?? (r.hoat_dong ? "Đang làm" : "Đã khoá")}</NhanTrangThai> },
        { nhan: "", hienThi: (r) => (
          <span className="flex gap-4">
            {laVaiTro(r.vai_tro) && r.vai_tro !== "ky_thuat" && r.vai_tro !== "chu" && <NutPhanQuyen id={r.id} hoTen={r.ho_ten} vaiTro={NHAN_VAI_TRO[r.vai_tro]} dangDung={quyenHieuLuc(r.vai_tro, r.quyen_rieng)} macDinh={!r.quyen_rieng} coRieng={!!r.quyen_rieng} />}
            <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ho_ten}`} truong={truongSua} giaTri={{ ...r, them: undefined, chuc_danh: r.chuc_danh ?? "", dien_thoai: r.dien_thoai ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "", chuc_danh_tai_chinh: r.chuc_danh_tai_chinh ?? "", han_muc_duyet: r.han_muc_duyet ?? "", trang_thai_lam: r.trang_thai_lam, ngay_vao_lam: r.ngay_vao_lam ?? "", ngay_vao_chinh_thuc: r.ngay_vao_chinh_thuc ?? "", khung_lam_viec: r.khung_lam_viec, vai_tro_chuyen_mon: r.vai_tro_chuyen_mon ?? [], ...giaTriVaiTheoChiNhanh(r.them) }} action={suaNhanVien} />
            {r.user_id && <NutHop kieu="chu" nhan="Đặt lại mật khẩu" tieuDe={`Đặt lại mật khẩu: ${r.ho_ten}`} truong={[{ ten: "mat_khau", nhan: "Mật khẩu mới (≥ 8 ký tự)", loai: "mat_khau", batBuoc: true, rong: true }]} giaTri={{ id: r.id }} action={datLaiMatKhau} />}
            {r.vai_tro !== "ky_thuat" && r.vai_tro !== "chu" && <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá nhân viên: ${r.ho_ten}`} xacNhan="Xoá hồ sơ này (kèm tài khoản đăng nhập nếu có)? Không hoàn lại được. Người đã có hoá đơn, lịch hay phiếu liên quan sẽ không xoá được; khi đó hãy khoá tài khoản." an={{ id: r.id }} nhanLuu="Xoá" action={xoaNhanVien} />}
          </span>
        ) },
      ]} />
    </>
  );
}
