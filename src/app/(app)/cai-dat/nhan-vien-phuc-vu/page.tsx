import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { UserCheck } from "lucide-react";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Chon } from "@/components/ui/Chon";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NHAN_O, NUT_CHINH, O_NHAP } from "@/components/ui/dinh-dang";
import { NutDoiAnh } from "@/components/danh-muc/NutDoiAnh";
import { boNhanVienPhucVu, datAnhNhanVienPhucVu, luuNhanVienPhucVu } from "./actions";

const MOI_TRANG = 10;
/** SalonHero: "Nhóm thợ loại 1–5" (danh sách chọn, không gõ tự do). */
const NHOM_THO = [1, 2, 3, 4, 5].map((n) => ({ gia_tri: `Nhóm thợ ${n}`, nhan: `Nhóm thợ loại ${n}` }));
type Sp = { tt?: string; cn?: string; q?: string; trang?: string };

/** Nhân viên phục vụ, đối chiếu SalonHero #/operators: lọc Trạng thái + Chi nhánh + Tìm kiếm; cột Ảnh / Mã / Họ tên / Chức danh / Nhóm nhân viên / Chi nhánh / Điện thoại / Email / Hiển thị / Trạng thái; nút Xóa, Sửa. */
export default async function TrangNhanVienPhucVu({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const quanLy = coQuyen(nd, "nhanvien.quanly");
  const sp = await searchParams;
  const db = sb();
  const [{ data: ds }, { data: cn }] = await Promise.all([
    db.from("nhan_vien").select("id, ma_nv, ho_ten, chuc_danh, nhom_nv, chi_nhanh_id, dien_thoai, email, hien_dat_lich, hoat_dong, anh_dai_dien, user_id").eq("la_phuc_vu", true).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
  ]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const tt = sp.tt === "hoat_dong" || sp.tt === "tam_dung" ? sp.tt : "";
  const k = boDau((sp.q ?? "").trim());
  const loc = (ds ?? []).filter((r) => (!tt || (tt === "hoat_dong") === r.hoat_dong) && (!sp.cn || !r.chi_nhanh_id || r.chi_nhanh_id === sp.cn) && (!k || boDau(`${r.ma_nv ?? ""} ${r.ho_ten} ${r.chuc_danh ?? ""} ${r.dien_thoai ?? ""} ${r.email ?? ""}`).includes(k)));
  const cuoi = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(sp.trang)) || 1), cuoi);
  const hien = loc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const gan = (n: number | undefined) => `/cai-dat/nhan-vien-phuc-vu?${new URLSearchParams(Object.entries({ tt: tt || undefined, cn: sp.cn || undefined, q: sp.q || undefined, trang: n ? String(n) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const truong: Truong[] = [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true, rong: true }, { ten: "chuc_danh", nhan: "Chức danh", loai: "chu" }, { ten: "nhom_nv", nhan: "Nhóm nhân viên", loai: "chon", luaChon: NHOM_THO },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" },
    { ten: "hien_dat_lich", nhan: "Hiển thị ở trang đặt lịch", loai: "gat" },
  ];
  // Người CHƯA có tài khoản: sửa được Email + Trạng thái ngay trong hộp. Người đã có tài khoản: hai mục này thuộc đăng nhập, sửa ở Tài khoản & phân quyền.
  const truongMo: Truong[] = [
    ...truong.slice(0, 5),
    { ten: "email", nhan: "Email", loai: "email", goiY: "ten@congty.vn" },
    { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "hoat_dong", nhan: "Hoạt động" }, { gia_tri: "tam_dung", nhan: "Tạm dừng" }] },
    truong[5],
  ];
  return (
    <div>
      <TieuDeNoi icon={UserCheck} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Nhân viên phục vụ">
        {quanLy && <NutHop nhan="Thêm nhân viên" tieuDe="Thêm nhân viên phục vụ" moTa="Tạo hồ sơ mới không có tài khoản đăng nhập. Muốn cấp tài khoản thì vào Tài khoản đăng nhập." truong={truongMo} giaTri={{ nhom_nv: "Nhóm thợ 1", chi_nhanh_id: "", hien_dat_lich: true, trang_thai: "hoat_dong" }} action={luuNhanVienPhucVu} />}
      </TieuDeNoi>
      <form method="get" action="/cai-dat/nhan-vien-phuc-vu" className="mb-5 grid grid-cols-2 items-end gap-3 md:grid-cols-4">
        <div><label className={NHAN_O}>Trạng thái:</label><Chon ten="tt" giaTriMacDinh={tt} luaChon={[{ gia_tri: "", nhan: "Tất Cả" }, { gia_tri: "hoat_dong", nhan: "Hoạt động" }, { gia_tri: "tam_dung", nhan: "Tạm dừng" }]} /></div>
        <div><label className={NHAN_O}>Chi nhánh:</label><Chon ten="cn" giaTriMacDinh={sp.cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>
        <div className="col-span-2 md:col-span-1"><label htmlFor="tim-pv" className={NHAN_O}>Tìm kiếm</label><input id="tim-pv" name="q" defaultValue={sp.q ?? ""} className={O_NHAP} autoComplete="off" /></div>
        <div><button type="submit" className={NUT_CHINH}>Tìm kiếm</button></div>
      </form>
      <Bang duLieu={hien} khoa={(r) => r.id} trong="Không có dữ liệu."
        cot={[
          { nhan: "Ảnh", hienThi: (r) => <NutDoiAnh id={r.id} anh={r.anh_dai_dien} ten={r.ho_ten} sua={quanLy} canh={256} action={datAnhNhanVienPhucVu} /> },
          { nhan: "Mã", hienThi: (r) => r.ma_nv ?? "" }, { nhan: "Họ tên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> }, { nhan: "Chức danh", hienThi: (r) => r.chuc_danh ?? "" },
          { nhan: "Nhóm nhân viên", hienThi: (r) => r.nhom_nv ?? "" }, { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : <span className="flex flex-col">{(cn ?? []).map((c) => <span key={c.id}>{c.ten}</span>)}</span>) },
          { nhan: "Điện thoại", hienThi: (r) => (quanLy ? r.dien_thoai ?? "" : "") }, { nhan: "Email", hienThi: (r) => (quanLy ? <span className="break-all">{r.email ?? ""}</span> : "") },
          { nhan: "Hiển thị", hienThi: (r) => (r.hien_dat_lich ? "Hiển thị ở trang đặt lịch" : "Ẩn ở trang đặt lịch") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Hoạt động" : "Tạm dừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (quanLy ? (
            <span className="flex gap-4">
              <NutHop kieu="chu" nguy nhan="Xóa" tieuDe="Xóa khỏi danh sách phục vụ" xacNhan={`Bỏ ${r.ho_ten} khỏi danh sách Nhân viên phục vụ? Hồ sơ nhân sự, tài khoản, hoá đơn và hoa hồng của người này giữ nguyên.`} an={{ id: r.id }} nhanLuu="Xóa" action={boNhanVienPhucVu} />
              <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ho_ten}`} moTa={r.user_id ? "Người này có tài khoản đăng nhập: email và trạng thái (tạm dừng = khoá đăng nhập) sửa ở Tài khoản đăng nhập." : undefined} truong={r.user_id ? truong : truongMo} giaTri={{ id: r.id, ho_ten: r.ho_ten, chuc_danh: r.chuc_danh ?? "", nhom_nv: r.nhom_nv ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "", dien_thoai: r.dien_thoai ?? "", hien_dat_lich: r.hien_dat_lich, email: r.email ?? "", trang_thai: r.hoat_dong ? "hoat_dong" : "tam_dung" }} action={luuNhanVienPhucVu} />
            </span>
          ) : null) },
        ]} />
      <ThanhTrang trang={trang} tong={loc.length} moi={MOI_TRANG} gan={gan} luonHien />
    </div>
  );
}
