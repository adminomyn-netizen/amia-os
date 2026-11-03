import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { NHAN_VAI_TRO, VAI_TRO, laVaiTro } from "@/lib/quyen";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { Chon } from "@/components/ui/Chon";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { taoNhanVien } from "../../nhan-vien/actions";

const MOI_TRANG = 10;
type Sp = { vt?: string; cn?: string; q?: string; trang?: string };

/** Tài khoản đăng nhập, đối chiếu SalonHero #/staff: nút Thiết lập quyền + Tạo người dùng mới, lọc theo Vai trò, Chi nhánh và ô tìm (tên, email, số điện thoại, mã NV), cột Ảnh / Tên tài khoản / Tài khoản đăng nhập / Số điện thoại / Nhân viên liên kết / Quyền chi nhánh. Chỉ XEM danh sách: mọi thao tác Sửa, đặt lại mật khẩu, khoá, xoá làm ở Tài khoản & phân quyền (/nhan-vien) như cũ. */
export default async function TrangTaiKhoanDangNhap({ searchParams }: { searchParams: Promise<Sp> }) {
  await yeuCauQuyen("hethong.phanquyen");
  const sp = await searchParams;
  const db = sb();
  const [{ data: ds }, { data: cn }] = await Promise.all([
    db.from("nhan_vien").select("id, ma_nv, ho_ten, email, dien_thoai, vai_tro, chi_nhanh_id, la_phuc_vu, hoat_dong").not("user_id", "is", null).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
  ]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const vt = laVaiTro(sp.vt ?? "") ? (sp.vt as string) : "";
  const q = (sp.q ?? "").trim().slice(0, 100), tuKhoa = boDau(q);
  const loc = (ds ?? []).filter((r) => (!vt || r.vai_tro === vt) && (!sp.cn || !r.chi_nhanh_id || r.chi_nhanh_id === sp.cn) && (!tuKhoa || boDau(`${r.ho_ten} ${r.email ?? ""} ${r.dien_thoai ?? ""} ${r.ma_nv ?? ""}`).includes(tuKhoa)));
  const cuoi = Math.max(1, Math.ceil(loc.length / MOI_TRANG));
  const trang = Math.min(Math.max(1, Math.floor(Number(sp.trang)) || 1), cuoi);
  const hien = loc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const gan = (n: number | undefined) => `/cai-dat/tai-khoan-dang-nhap?${new URLSearchParams(Object.entries({ vt: vt || undefined, cn: sp.cn || undefined, q: q || undefined, trang: n ? String(n) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const truongTao: Truong[] = [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "vai_tro", nhan: "Vai trò", loai: "chon", batBuoc: true, luaChon: VAI_TRO.map((v) => ({ gia_tri: v, nhan: NHAN_VAI_TRO[v] })) },
    { ten: "chuc_danh", nhan: "Chức danh hiển thị", loai: "chu" }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] },
    { ten: "email", nhan: "Email đăng nhập", loai: "email", rong: true },
    { ten: "mat_khau", nhan: "Mật khẩu ban đầu (bỏ trống = 12345678; người dùng buộc đổi khi vào lần đầu)", loai: "mat_khau", rong: true },
  ];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Tài khoản đăng nhập">
        <Link href="/cai-dat/vai-tro" className={`${NUT_PHU} inline-flex items-center`}>Thiết lập quyền</Link>
        <NutHop nhan="Tạo người dùng mới" tieuDe="Tạo người dùng mới" truong={truongTao} giaTri={{ vai_tro: "le_tan", chi_nhanh_id: "" }} action={taoNhanVien} />
      </TieuDeTrang>
      <form method="get" action="/cai-dat/tai-khoan-dang-nhap" className="mb-5 grid grid-cols-2 items-end gap-3 md:grid-cols-4" role="search">
        <div><label className={NHAN_O}>Lọc theo Vai trò:</label><Chon ten="vt" giaTriMacDinh={vt} luaChon={[{ gia_tri: "", nhan: "Tất cả" }, ...VAI_TRO.map((v) => ({ gia_tri: v, nhan: NHAN_VAI_TRO[v] }))]} /></div>
        <div><label className={NHAN_O}>Chi nhánh:</label><Chon ten="cn" giaTriMacDinh={sp.cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>
        <div><label className={NHAN_O} htmlFor="tk-q">Tìm kiếm:</label><input id="tk-q" name="q" defaultValue={q} placeholder="Tên, email, số điện thoại..." className={O_NHAP} autoComplete="off" /></div>
        <div><button type="submit" className={NUT_CHINH}>Lọc</button></div>
      </form>
      <Bang duLieu={hien} khoa={(r) => r.id} trong="Không có dữ liệu."
        cot={[
          { nhan: "Ảnh", hienThi: (r) => <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-nho bg-giay-tram text-[13px] font-medium text-muc-2">{(r.ho_ten.trim().split(/\s+/).pop() ?? "?").charAt(0).toUpperCase()}</span> },
          { nhan: "Tên tài khoản", chinh: true, hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> }, { nhan: "Tài khoản đăng nhập", hienThi: (r) => <span className="break-all">{r.email ?? ""}</span> },
          { nhan: "Số điện thoại", hienThi: (r) => r.dien_thoai ?? "" }, { nhan: "Nhân viên liên kết", hienThi: (r) => (r.la_phuc_vu ? r.ma_nv ?? "" : "") },
          { nhan: "Quyền chi nhánh", hienThi: (r) => <span className="flex flex-col"><span>{NHAN_VAI_TRO[r.vai_tro as keyof typeof NHAN_VAI_TRO] ?? r.vai_tro}</span><span className="text-[12.5px] text-muc-3">{r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : "Mọi chi nhánh"}</span></span> },
          { nhan: "", hienThi: (r) => <Link href="/nhan-vien" className={NUT_CHU}>{r.vai_tro === "chu" ? "Xem" : "Sửa"}</Link> },
        ]} />
      <ThanhTrang trang={trang} tong={loc.length} moi={MOI_TRANG} gan={gan} luonHien />
    </div>
  );
}
