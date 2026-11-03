import type { ReactNode } from "react";
import type { NguoiDung } from "@/lib/auth";
import { sb } from "@/lib/db";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { khoangNgay } from "@/lib/bao-cao";
import { ngayGioVN, soVN, tienVN } from "@/lib/dinh-dang";
import { layPhieuKho, PHAN_LOAI_PHIEU, TINH_TRANG_PHIEU, type HuongPhieu } from "@/lib/kho-phieu";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";

export type SpPhieu = { tu?: string; den?: string; cn?: string; tt?: string; nguoi?: string; pl?: string; q?: string; trang?: string };
const MOI_TRANG = 20;
const KIEU_TT: Record<string, "tot" | "cho" | "loi" | "tram"> = { "Hoàn thành": "tot", "Chờ duyệt": "cho", "Bị từ chối": "loi", "Đã huỷ": "tram" };

/** Danh sách phiếu nhập / phiếu xuất của kho hàng bán (SalonHero #/inventory): lọc chi nhánh, khoảng ngày, tình trạng, người tạo, phân loại, tìm mã phiếu / tên / mã sản phẩm; Xuất Excel theo đúng bộ lọc. */
export async function DanhSachPhieuKho({ nd, huong, sp, nut }: { nd: NguoiDung; huong: HuongPhieu; sp: SpPhieu; nut?: ReactNode }) {
  const db = sb();
  const goc = huong === "nhap" ? "/kho/phieu-nhap" : "/kho/phieu-xuat";
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cn = nd.chiNhanhId ?? (dsCn?.some((c) => c.id === sp.cn) ? sp.cn! : "");
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const trang = Math.max(1, Math.floor(Number(sp.trang)) || 1);
  const loc = { tu, den, cn, tt: sp.tt, nguoi: sp.nguoi, pl: sp.pl, q: sp.q };
  const [{ rows, tong }, { data: nv }] = await Promise.all([
    layPhieuKho(db, huong, { ...loc, trang, so: MOI_TRANG }),
    db.from("nhan_vien").select("id, ho_ten").order("ho_ten"),
  ]);
  const thamSo = (o: Record<string, string | undefined>) => new URLSearchParams(Object.entries({ tu, den, cn: cn || undefined, tt: sp.tt, nguoi: sp.nguoi, pl: sp.pl, q: sp.q, ...o }).filter((e): e is [string, string] => !!e[1])).toString();
  const chu = huong === "nhap" ? "nhập" : "xuất";
  return (
    <>
      <form method="get" action={goc} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div><label htmlFor="pk-tu" className={NHAN_O}>Từ ngày</label><NgayChon id="pk-tu" ten="tu" giaTriMacDinh={tu} tuNam={2018} /></div>
        <div><label htmlFor="pk-den" className={NHAN_O}>Đến ngày</label><NgayChon id="pk-den" ten="den" giaTriMacDinh={den} tuNam={2018} /></div>
        {!nd.chiNhanhId && <div><label className={NHAN_O}>Chi nhánh</label><Chon ten="cn" giaTriMacDinh={cn} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...(dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>}
        <div><label className={NHAN_O}>Tình trạng</label><Chon ten="tt" giaTriMacDinh={sp.tt ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả tình trạng" }, ...TINH_TRANG_PHIEU[huong].map((t) => ({ gia_tri: t, nhan: t }))]} /></div>
        <div><label className={NHAN_O}>Người tạo</label><Chon ten="nguoi" giaTriMacDinh={sp.nguoi ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả người tạo" }, ...(nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))]} /></div>
        {PHAN_LOAI_PHIEU[huong].length > 1 && <div><label className={NHAN_O}>Phân loại</label><Chon ten="pl" giaTriMacDinh={sp.pl ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả phân loại" }, ...PHAN_LOAI_PHIEU[huong].map((t) => ({ gia_tri: t, nhan: t }))]} /></div>}
        <div><label htmlFor="pk-q" className={NHAN_O}>Tìm kiếm</label><input id="pk-q" name="q" defaultValue={sp.q ?? ""} placeholder="Mã phiếu, tên hoặc mã sản phẩm" className={O_NHAP} /></div>
        <div className="flex items-end gap-2">
          <button type="submit" className={NUT_CHINH}>Lọc</button>
          <a href={`/api/xuat/phieu-kho?huong=${huong}&${thamSo({})}`} download className={`${NUT_PHU} inline-flex items-center`}>Xuất Excel</a>
          {nut}
        </div>
      </form>
      <HangChiSo muc={[{ nhan: `Số phiếu ${chu}`, so: soVN(tong.dong) }, { nhan: "Tổng tiền (theo giá nhập)", so: tienVN(tong.tien) }]} />
      <div className="mt-5">
        <Bang duLieu={rows} khoa={(r) => `${r.ma}-${r.chi_nhanh_id}`} trong={`Không có phiếu ${chu} nào trong bộ lọc này.`}
          cot={[
            { nhan: "Mã phiếu", chinh: true, hienThi: (r) => <span className="block"><span className="font-medium tabular-nums text-muc">{r.ma}</span><span className="block max-w-[320px] truncate text-[12.5px] text-muc-3" title={r.mat_hang}>{r.so_mat_hang} mặt hàng · {r.mat_hang}</span></span> },
            { nhan: "Ngày", hienThi: (r) => ngayGioVN(r.thoi_gian) }, { nhan: "Người tạo", hienThi: (r) => r.nguoi ?? "" },
            ...(huong === "xuat" || rows.some((r) => r.ncc) ? [{ nhan: "Nhà cung cấp", hienThi: (r: (typeof rows)[number]) => r.ncc ?? "" }] : []),
            { nhan: "Phân loại", hienThi: (r) => r.phan_loai }, { nhan: "Tình trạng", hienThi: (r) => <NhanTrangThai kieu={KIEU_TT[r.tinh_trang] ?? "tram"}>{r.tinh_trang}</NhanTrangThai> },
            { nhan: "Chi nhánh", hienThi: (r) => r.chi_nhanh ?? "" }, { nhan: "Tổng tiền", phai: true, hienThi: (r) => tienVN(r.tong_tien) },
          ]} />
      </div>
      <ThanhTrang trang={trang} tong={tong.dong} moi={MOI_TRANG} gan={(t) => `${goc}?${thamSo({ trang: t ? String(t) : undefined })}`} don="phiếu" />
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Một phiếu gom các dòng sổ kho cùng mã (phiếu chuyển từ SalonHero giữ mã PN…/PX…; phiếu lập ở AMIA: XL… xử lý vật tư, XK… xuất khẩn cấp, NB… xuất sang kho nội bộ; nhập tay không có mã thì mỗi lần nhập là một phiếu NK…). Tổng tiền = số lượng × giá nhập của dòng (chưa có giá thì lấy giá nhập trên danh mục). Số dư đầu kỳ chuyển từ SalonHero không phải phiếu nhập nên không hiện.</p>
    </>
  );
}
