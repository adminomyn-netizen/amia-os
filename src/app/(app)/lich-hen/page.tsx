import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { CalendarDays, ChevronDown, Gem, Info, Medal, Trophy } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import type { Tables } from "@/lib/supabase/database.types";
import { congNgay, gioVN, homNayHCM, ngayCuaIso, ngayVN } from "@/lib/dinh-dang";
import { NutHop } from "@/components/ui/BieuMau";
import { baoBienChung } from "../khieu-nai/actions";
import { truongBaoBatThuong } from "@/lib/khieu-nai-form";
import { FormLichHen } from "@/components/lich-hen/FormLichHen";
import { hienDatLich } from "@/lib/ban-hang";
import { NutInLich } from "@/components/lich-hen/NutInLich";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { timKhach } from "../ban-hang/actions";
import { chuyenTriLieu } from "../the/cho-lam/actions";
import { NutBuoi } from "@/components/the/NutBuoi";
import { doiTrangThaiLich, duyetYeuCauOnline, ganNhomKhachMoi, khungGioTrong, luuLichHen, thongTinKhachDatLich, tuChoiYeuCauOnline } from "./actions";
import { XacNhanDen } from "@/components/lich-hen/XacNhanDen";
import { XemLich } from "@/components/lich-hen/XemLich";
import { luuKhach } from "../khach-hang/actions";
import { LocNguon } from "@/components/lich-hen/LocNguon";
import { ChonKhoang, KhungNgay, LocCho, TimVaLoc, XemThemO } from "@/components/lich-hen/DieuKhienLich";
import { LocNhieuNhanVien } from "@/components/lich-hen/LocNhieuNhanVien";
import { BIEU_TUONG_HANG, cacNgayTrong, chuTatTen, dsNvLoc, MAU_TRANG_THAI, moTaLap, NGUON_DAT, NV_CHUA_PHAN, nhanCotNgay, nhanNgayDai, nhanNguon, tenNvHoa, thuCuaNgay } from "@/lib/lich-hen";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";
import { KhungChiTietLich, TheLich } from "@/components/lich-hen/KhungChiTietLich";
import { LocLoaiLich } from "@/components/lich-hen/LocSuaLich";
import { khoaSuaLich, laLoaiLich, laQuanLyLich, nhanLoaiLich, quyenSuaLich } from "@/lib/lich-hen-sua";
import { NHAN_HANH_DONG_SUA, dongThayDoi } from "@/lib/lich-hen-lich-su";

const TT: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  chua_xac_nhan: { nhan: "Chưa xác nhận", kieu: "tram" }, da_xac_nhan: { nhan: "Đã xác nhận", kieu: "cho" }, cho_phuc_vu: { nhan: "Chờ phục vụ", kieu: "cho" },
  dang_phuc_vu: { nhan: "Đang phục vụ", kieu: "tot" }, hoan_thanh: { nhan: "Hoàn thành", kieu: "tot" }, huy: { nhan: "Đã huỷ", kieu: "loi" }, khong_den: { nhan: "Khách không đến", kieu: "loi" },
};
const LC_TT = [{ gia_tri: "", nhan: "Tất cả trạng thái" }, ...Object.entries(TT).map(([gia_tri, v]) => ({ gia_tri, nhan: v.nhan }))];
const NHAN_PHIEU: Record<string, string> = { cho_cap: "Phiếu chờ cấp", da_cap: "Đã cấp, chờ Chuyên viên trị liệu nhận", da_nhan: "Chuyên viên trị liệu đã nhận", da_lam: "Đã làm xong", da_doi_chieu: "Đã đối chiếu", huy: "Phiếu đã huỷ" };
const KIEU_XEM = [{ ma: "cho", nhan: "Vị trí chỗ" }, { ma: "nv", nhan: "Nhân viên" }, { ma: "gio", nhan: "Thời gian" }] as const;
const DAT = /^\d{4}-\d{2}-\d{2}$/;
const TOI_DA_THEO_O = 5;
const MAU_VONG = ["bg-sac-xanh-nen text-sac-xanh", "bg-sac-luc-nen text-sac-luc", "bg-sac-cam-nen text-sac-cam", "bg-sac-tim-nen text-sac-tim", "bg-sac-hong-nen text-sac-hong"];

type Sp = { ngay?: string; tu?: string; den?: string; cn?: string; khach?: string; nguon?: string; nv?: string; cho?: string; kieu?: string; q?: string; tt?: string; lich?: string; loai?: string };

/** Truy vấn `.in()` theo lô 100 mã để địa chỉ yêu cầu không quá dài khi lưới có hàng trăm lịch. */
async function theoLo<T>(ids: string[], f: (lo: string[]) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const lo: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) lo.push(ids.slice(i, i + 100));
  return (await Promise.all(lo.map(f))).flatMap((r) => r.data ?? []);
}

function BieuTuongHang({ hang }: { hang: string }) {
  const k = BIEU_TUONG_HANG[hang];
  if (k === "cup") return <Trophy className="h-4 w-4 text-dat" aria-label="Hạng Vàng" />;
  if (k === "kim_cuong") return <Gem className="h-4 w-4 text-sac-xanh-mau" aria-label={`Hạng ${hang}`} />;
  if (k === "huy_chuong") return <Medal className="h-4 w-4 text-muc-3" aria-label="Hạng Bạc" />;
  return null;
}

export default async function TrangLichHen({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("lich.xem");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const tu = DAT.test(sp.tu ?? "") ? sp.tu! : homNay;
  let den = DAT.test(sp.den ?? "") ? sp.den! : congNgay(tu, 7);
  if (den < tu) den = tu;
  if (den > congNgay(tu, 30)) den = congNgay(tu, 30);
  const ngay = DAT.test(sp.ngay ?? "") ? sp.ngay! : homNay >= tu && homNay <= den ? homNay : tu;
  const nvLoc = dsNvLoc(sp.nv);
  const kieu = KIEU_XEM.some((k) => k.ma === sp.kieu) ? sp.kieu! : "nv";
  const q = (sp.q ?? "").trim().slice(0, 60);
  const tt = TT[sp.tt ?? ""] ? sp.tt! : "";
  const nguon = sp.nguon && (NGUON_DAT[sp.nguon] || /^[A-Z0-9_]{2,20}$/.test(sp.nguon)) ? sp.nguon : "";
  const loai = laLoaiLich(sp.loai) || sp.loai === "chua_ghi" ? sp.loai! : "";
  const lichMo = /^[0-9a-f-]{36}$/i.test(sp.lich ?? "") ? sp.lich! : "";
  const quanLy = laQuanLyLich(nd.vaiTro);
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cnId = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  // Đường dẫn giữ mọi bộ lọc hiện có, chỉ đổi phần được nêu (chuỗi rỗng = bỏ tham số).
  const url = (doi: Record<string, string> = {}) => {
    const m: Record<string, string> = { tu, den, ngay, cn: cnId, kieu, q, tt, nguon, loai, nv: nvLoc.join(","), cho: sp.cho ?? "", ...doi };
    const u = new URLSearchParams(Object.entries(m).filter(([, v]) => v));
    return `/lich-hen?${u}`;
  };

  const tuQ = tu < ngay ? tu : ngay, denQ = den > ngay ? den : ngay;
  const tuIso = new Date(`${tuQ}T00:00:00+07:00`).toISOString(), denIso = new Date(`${congNgay(denQ, 1)}T00:00:00+07:00`).toISOString();
  const homNayDau = new Date(`${homNay}T00:00:00+07:00`).toISOString(), homNayCuoi = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  let qLich = db.from("lich_hen").select("*").eq("chi_nhanh_id", cnId).gte("bat_dau", tuIso).lt("bat_dau", denIso).order("bat_dau").limit(3000);
  if (nguon) qLich = qLich.eq("nguon", nguon);
  // Mọi truy vấn không phụ thuộc nhau chạy cùng một lượt (trước đây xếp hàng 4 lượt → chuyển trang chậm).
  const sua = coQuyen(nd, "lich.sua");
  const taoKhachDuoc = sua && coQuyen(nd, "khach.sua");
  const [{ data: lichTho }, { data: nv }, { data: dv }, { count: demHomNay }, { data: choLam }, { data: yeuCau }, { data: lk }, { data: khachMoi }, { data: nhomKh }] = await Promise.all([
    qLich,
    db.from("nhan_vien").select("id, ho_ten, vai_tro, chuc_danh, ma_nv, chi_nhanh_id").eq("hoat_dong", true).order("ma_nv"),
    db.from("dich_vu").select("id, ma, ten, thoi_luong_phut, noi_hien_thi, chi_nhanh_ids").eq("hoat_dong", true).order("ma"),
    db.from("lich_hen").select("id", { count: "exact", head: true }).eq("chi_nhanh_id", cnId).gte("bat_dau", homNayDau).lt("bat_dau", homNayCuoi).not("trang_thai", "in", "(huy,khong_den)"),
    db.from("cho_lam").select("chi_nhanh_id, ten, thu_tu, hoat_dong").order("thu_tu").order("ten"),
    db.from("yeu_cau_dat_lich").select("id, dich_vu_ids, bat_dau, thoi_luong_phut, ho_ten, dien_thoai, ghi_chu, tao_luc").eq("chi_nhanh_id", cnId).eq("trang_thai", "cho").gte("bat_dau", new Date().toISOString()).order("bat_dau").limit(100),
    db.from("goi_the_dich_vu").select("goi_id, dich_vu_id"),
    sp.khach ? db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id").eq("id", sp.khach).maybeSingle() : Promise.resolve({ data: null }),
    // Nhóm khách hàng cho ô "Nhóm khách hàng" khi tạo khách trong hộp đặt lịch (như SalonHero).
    taoKhachDuoc ? db.from("nhom_khach").select("id, ten").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] as { id: string; ten: string }[] }),
  ]);
  const idsK = [...new Set((lichTho ?? []).map((l) => l.khach_id))];
  const qThuong = q.toLowerCase();
  // Lọc mọi điều kiện trừ ô tìm (ô tìm cần tên khách) → lấy chi tiết cho cột phải song song với tên khách; có ô tìm thì tập này rộng hơn, lọc lại sau.
  const lichKhongTim = (lichTho ?? []).filter((l) => {
    if (tt && l.trang_thai !== tt) return false;
    if (loai && (l.loai_lich ?? "chua_ghi") !== loai) return false;
    if (nvLoc.length && !nvLoc.includes(l.nhan_vien_id ?? NV_CHUA_PHAN)) return false;
    if (sp.cho && (l.phong ?? "").trim().toLowerCase() !== sp.cho.toLowerCase()) return false;
    return true;
  });
  const lichNgayRong = lichKhongTim.filter((l) => ngayCuaIso(l.bat_dau) === ngay);

  // Chi tiết chỉ cần cho cột phải (lịch của ngày đang chọn).
  const idsN = lichNgayRong.map((l) => l.id), idsKN = [...new Set(lichNgayRong.map((l) => l.khach_id))];
  const shIds = lichNgayRong.map((l) => l.hoa_don_sh_id).filter((x): x is number => x != null);
  const [ks, ld, ph, the, hd, nhom, { data: lichSuMo }] = await Promise.all([
    theoLo(idsK, (lo) => db.rpc("khach_cho_lich", { p_ids: lo })), // hàm riêng thay cho view v_khach_hang (nặng): cùng 6 cột, cùng luật hạng
    theoLo(idsN, (lo) => db.from("lich_hen_dich_vu").select("lich_id, dich_vu_id").in("lich_id", lo)),
    theoLo(idsN, (lo) => db.from("phieu_cap").select("lich_hen_id, trang_thai, ma").in("lich_hen_id", lo).neq("trang_thai", "huy")),
    theoLo(idsKN, (lo) => db.from("v_the_khach").select("id, ma, khach_id, goi_id, so_buoi_con, so_buoi_tong").eq("loai", "lan").in("khach_id", lo).in("tinh_trang", ["hoat_dong", "sap_het"])),
    Promise.all([
      theoLo(shIds.map(String), (lo) => db.from("hoa_don").select("id, ma, sh_id, sh_ma, lich_hen_id").in("sh_id", lo.map(Number))),
      theoLo(idsN, (lo) => db.from("hoa_don").select("id, ma, sh_id, sh_ma, lich_hen_id").in("lich_hen_id", lo)),
    ]).then((r) => r.flat()),
    // Lịch nhiều khách: Khách 2, 3… (câu 14).
    theoLo(idsN, (lo) => db.from("lich_hen_khach").select("lich_id, thu_tu, ten, dich_vu_ids, nhan_vien_id, phong, thoi_luong_phut").in("lich_id", lo).order("thu_tu")),
    // Lịch sử sửa của lịch đang mở trong khung chi tiết: chỉ Chủ, Kỹ thuật, Quản lý / Leader.
    lichMo && quanLy ? db.from("lich_hen_lich_su").select("id, luc, nguoi_ten, hanh_dong, thay_doi").eq("lich_id", lichMo).order("luc", { ascending: false }).limit(30) : Promise.resolve({ data: null }),
  ]);
  const tenK = new Map(ks.map((k) => [k.id as string, k]));
  const lich = !qThuong ? lichKhongTim : lichKhongTim.filter((l) => {
    const k = tenK.get(l.khach_id);
    return [k?.ho_ten, k?.dien_thoai, k?.ma, l.ma_dat_lich].some((x) => (x ?? "").toLowerCase().includes(qThuong));
  });
  const homLich = (l: { trang_thai: string }) => !["huy", "khong_den"].includes(l.trang_thai);
  const lichNgay = !qThuong ? lichNgayRong : lich.filter((l) => ngayCuaIso(l.bat_dau) === ngay);
  const nhomCua = (id: string) => nhom.filter((x) => x.lich_id === id);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const nvLC = luaChonNhanVien((nv ?? []).filter((n) => n.vai_tro !== "nha_dau_tu"));
  // Hộp "Gửi chuyên viên làm" từng thẻ: tên gói + dịch vụ của gói (gói chưa gắn dịch vụ → gửi chính thẻ).
  const idsGoiThe = [...new Set(the.map((x) => x.goi_id).filter((x): x is string => !!x))];
  const { data: goiThe } = idsGoiThe.length ? await db.from("goi_the").select("id, ten").in("id", idsGoiThe) : { data: [] as { id: string; ten: string }[] };
  const tenGoiThe = new Map((goiThe ?? []).map((g) => [g.id, g.ten]));
  const dvDuLich = (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }));
  const dvTen = new Map(dvDuLich.map((d) => [d.gia_tri, d]));
  const bsLC = [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  // "Nơi hiển thị" / "Địa điểm cung cấp": hộp đặt lịch chỉ ẩn khỏi danh sách chọn; lịch cũ đã có dịch vụ đó vẫn giữ và hiện tên.
  const dichVu = (dv ?? []).map((d) => ({ id: d.id, ma: d.ma, ten: d.ten, thoiLuong: d.thoi_luong_phut, an: !hienDatLich(d.noi_hien_thi), chiNhanhIds: d.chi_nhanh_ids }));
  // Ô của hộp "Báo bất thường" dựng MỘT lần và dùng lại cho mọi lịch (trước đây mỗi lịch dựng lại ~230 dịch vụ → trang nặng hàng trăm KB).
  const truongBBT = truongBaoBatThuong((dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), false);
  const cnLC = (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  const choDm = (choLam ?? []).filter((c) => c.hoat_dong).map((c) => ({ chiNhanhId: c.chi_nhanh_id, ten: c.ten }));
  const choCn = choDm.filter((c) => c.chiNhanhId === cnId);
  const nvLocLC = (nv ?? []).filter((n) => n.chi_nhanh_id === cnId && ["bac_si", "ktv", "tu_van", "le_tan"].includes(n.vai_tro)).map((n) => ({ gia_tri: n.id, nhan: tenNvHoa(n.ho_ten) }));
  const moFormMoi = !!sp.khach;

  // ───────── Lưới: hàng theo kiểu xem × cột theo ngày ─────────
  const cacNgay = cacNgayTrong(tu, den);
  const gioCua = (iso: string) => String(Number(gioVN(iso).split(":")[0]));
  type Hang = { khoa: string; ten: string; phu?: string; vong?: string; mau?: number };
  let hang: Hang[];
  let khoaHang: (l: Tables<"lich_hen">) => string;
  if (kieu === "nv") {
    const coLich = new Set(lich.map((l) => l.nhan_vien_id ?? ""));
    const ds = (nv ?? []).filter((n) => !["nha_dau_tu"].includes(n.vai_tro) && (nvLoc.length ? nvLoc.includes(n.id) : ((n.chi_nhanh_id === cnId && ["bac_si", "ktv", "tu_van", "le_tan"].includes(n.vai_tro)) || coLich.has(n.id))));
    hang = [{ khoa: "", ten: "CHƯA CHỌN NHÂN VIÊN" }, ...ds.map((n, i) => ({ khoa: n.id, ten: tenNvHoa(n.ho_ten), phu: n.chuc_danh ?? undefined, vong: chuTatTen(n.ho_ten), mau: i % MAU_VONG.length }))];
    if (nvLoc.length) hang = hang.filter((h) => (h.khoa ? nvLoc.includes(h.khoa) : nvLoc.includes(NV_CHUA_PHAN)));
    khoaHang = (l) => l.nhan_vien_id ?? "";
  } else if (kieu === "cho") {
    // Chỗ trong danh mục (đang dùng) của chi nhánh + chỗ chỉ có trong chữ ghi ở lịch (lịch cũ/nhập tay); đang lọc một chỗ thì chỉ hiện chỗ đó.
    const trongDm = choCn.map((c) => c.ten);
    const ngoaiDm = [...new Set(lich.map((l) => (l.phong ?? "").trim()).filter((t) => t && !trongDm.some((x) => x.toLowerCase() === t.toLowerCase())))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
    const cho = [...trongDm, ...ngoaiDm].filter((t) => !sp.cho || t.toLowerCase() === sp.cho.toLowerCase());
    hang = [...(sp.cho ? [] : [{ khoa: "", ten: "CHƯA XẾP CHỖ" }]), ...cho.map((c, i) => ({ khoa: c, ten: c.toLocaleUpperCase("vi-VN"), vong: c.slice(0, 2).toLocaleUpperCase("vi-VN"), mau: i % MAU_VONG.length }))];
    khoaHang = (l) => { const t = (l.phong ?? "").trim(); return cho.find((x) => x.toLowerCase() === t.toLowerCase()) ?? t; };
  } else {
    const gios = [...new Set([...Array.from({ length: 14 }, (_, i) => String(i + 7)), ...lich.map((l) => gioCua(l.bat_dau))])].sort((a, b) => Number(a) - Number(b));
    hang = gios.map((g) => ({ khoa: g, ten: `${g.padStart(2, "0")}:00` }));
    khoaHang = (l) => gioCua(l.bat_dau);
  }
  const o = new Map<string, typeof lich>();
  for (const l of lich.filter(homLich)) {
    const kq = `${khoaHang(l)}|${ngayCuaIso(l.bat_dau)}`;
    o.set(kq, [...(o.get(kq) ?? []), l]);
  }
  /** Thẻ lịch trong ô lưới: nền đậm theo trạng thái (chị Lâm 10/11), tên khách, giờ, hạng + loại lịch. Bấm → khung chi tiết ngay cạnh thẻ. */
  const theLuoi = (l: Tables<"lich_hen">, d: string) => {
    const k = tenK.get(l.khach_id);
    const mau = MAU_TRANG_THAI[l.trang_thai];
    const loaiNgan = nhanLoaiLich(l.loai_lich, true);
    return (
      <TheLich key={l.id} id={l.id} href={url({ ngay: d })} tom={{ ten: k?.ho_ten ?? "", gio: `${gioVN(l.bat_dau)} ~ ${gioVN(l.ket_thuc)}`, trangThai: TT[l.trang_thai].nhan, mau: mau?.dac ?? "bg-giay-tram text-muc" }}
        title={`${k?.ho_ten ?? ""}${(l.so_khach ?? 1) > 1 ? ` (+${(l.so_khach ?? 1) - 1} khách)` : ""} · Hạng ${k?.hang ?? "Thường"} · ${gioVN(l.bat_dau)}–${gioVN(l.ket_thuc)} · ${TT[l.trang_thai].nhan}${loaiNgan ? ` · ${nhanLoaiLich(l.loai_lich)}` : ""}`}
        className={`block rounded-nho border-l-4 px-1.5 py-1 text-white shadow-[0_1px_2px_rgb(10_43_38/0.18)] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-nhan ${mau?.luoi ?? "border-l-nhan bg-lich-xong"} ${lichMo === l.id ? "outline-2 outline-offset-1 outline-muc" : ""}`}>
        <div className="truncate text-[11.5px] font-semibold uppercase leading-tight">{k?.ho_ten}{(l.so_khach ?? 1) > 1 ? <span className="ml-1 normal-case">+{(l.so_khach ?? 1) - 1}</span> : null}</div>
        <div className="text-[11px] font-semibold leading-tight tabular-nums">{gioVN(l.bat_dau)} ~ {gioVN(l.ket_thuc)}</div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10.5px] leading-tight">
          <span className="truncate">Hạng {k?.hang ?? "Thường"}</span>
          {loaiNgan && <span className="shrink-0 rounded-[3px] bg-white/20 px-1 font-medium">{loaiNgan}</span>}
        </div>
      </TheLich>
    );
  };
  const dauThang = ngay.slice(0, 8) + "01", cuoiThang = congNgay(congNgay(dauThang, 32).slice(0, 8) + "01", -1);
  const duoi = nguon ? `&nguon=${nguon}` : "";
  const xuat = (a: string, b: string) => `/api/xuat/lich-hen?tu=${a}&den=${b}&cn=${cnId}${duoi}`;
  const cotLuoi = `${kieu === "gio" ? 64 : 176}px repeat(${cacNgay.length}, minmax(148px, 1fr))`;
  const nutKieu = (on: boolean) => `px-3.5 py-2 text-[13px] font-medium ${on ? "bg-nhan text-white" : "bg-giay-sang text-muc-2 hover:bg-giay-tram"}`;
  const nutPhu = "rounded-nho border border-vien-dam bg-giay-sang px-3.5 py-2 text-[13px] font-medium text-muc-2 hover:bg-giay-tram";
  const lichNgayHieuLuc = lichNgay.filter(homLich).length;
  const soHuy = lichNgay.length - lichNgayHieuLuc;

  const tenYeuCau = (ids: string[]) => ids.map((d) => tenDv.get(d)).filter(Boolean).join(", ");
  type KhachGon = { ma?: string | null; ho_ten?: string | null; dien_thoai?: string | null; nguoi_phu_trach_id?: string | null } | undefined;
  const hoaDonCua = (l: Tables<"lich_hen">) => hd.find((x) => x.lich_hen_id === l.id) ?? hd.find((x) => l.hoa_don_sh_id != null && String(x.sh_id) === String(l.hoa_don_sh_id));
  /** Nút "Sửa lịch hẹn" cho MỌI lịch (chị Lâm 10/11): người tạo lịch hoặc quản lý; trường khoá theo trạng thái / hoá đơn (máy chủ kiểm lại khi lưu). */
  const nutSua = (l: Tables<"lich_hen">, k: KhachGon, dvIds: string[], kieuNut: "chinh" | "chu") => {
    if (!sua) return null;
    const q = quyenSuaLich(nd, l);
    if (!q.duoc) return <span className="text-[12px] leading-snug text-muc-3">Sửa lịch: {q.lyDo}.</span>;
    return (
      <FormLichHen kieu={kieuNut} nhan="Sửa lịch hẹn" cho={choDm} khungGio={khungGioTrong} ttKhach={thongTinKhachDatLich} dichVu={dichVu} nhanVien={nvLC} chiNhanh={cnLC} tim={timKhach} action={luuLichHen} homNay={ngay}
        sua={{ id: l.id, khach: { id: l.khach_id, ma: k?.ma ?? "", ho_ten: k?.ho_ten ?? "", dien_thoai: k?.dien_thoai ?? "", nguoi_phu_trach_id: k?.nguoi_phu_trach_id ?? "" }, ngay: ngayCuaIso(l.bat_dau), gio: gioVN(l.bat_dau), thoiLuong: Math.round((new Date(l.ket_thuc).getTime() - new Date(l.bat_dau).getTime()) / 60000), nhanVienId: l.nhan_vien_id ?? "", phong: l.phong ?? "", nguon: l.nguon ?? "", ghiChu: l.ghi_chu ?? "", dichVuIds: dvIds, chiNhanhId: l.chi_nhanh_id,
          khachDiCung: nhomCua(l.id).map((x) => ({ ten: x.ten, dichVuIds: x.dich_vu_ids ?? [], nhanVienId: x.nhan_vien_id, phong: x.phong, thoiLuong: x.thoi_luong_phut })), loaiLich: l.loai_lich ?? "", khoa: khoaSuaLich(l.trang_thai, !!hoaDonCua(l)), dichVuTen: l.dich_vu_ten ?? "" }} />
    );
  };
  const hanhDong = (l: Tables<"lich_hen">, k: KhachGon, dvIds: string[], ngang = false) => {
    const theKhach = the.filter((x) => x.khach_id === l.khach_id);
    const nvDefault = l.nhan_vien_id ?? "";
    return (
      <div className={ngang ? "flex flex-wrap items-center gap-x-4 gap-y-2.5" : "flex flex-col items-start gap-2.5 p-3"}>
        {l.trang_thai === "chua_xac_nhan" && <NutNhanh chinh nhan="Xác nhận" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "da_xac_nhan" }} />}
        {l.trang_thai === "da_xac_nhan" && <XacNhanDen id={l.id} action={doiTrangThaiLich} />}
        {l.trang_thai === "cho_phuc_vu" && <NutNhanh chinh nhan="Mở ca" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "dang_phuc_vu" }} />}
        {l.trang_thai === "dang_phuc_vu" && <NutNhanh chinh nhan="Hoàn thành" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "hoan_thanh" }} />}
        {coQuyen(nd, "phieu.xem") && ["cho_phuc_vu", "dang_phuc_vu", "da_xac_nhan"].includes(l.trang_thai) && <Link href={`/phieu-cap?lich=${l.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Phiếu cấp vật tư</Link>}
        {["chua_xac_nhan", "da_xac_nhan", "dang_phuc_vu", "hoan_thanh", "cho_phuc_vu"].includes(l.trang_thai) && coQuyen(nd, "ban.tao") && <Link href={`/ban-hang?lich=${l.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Thanh toán ngay</Link>}
        {sua && ["cho_phuc_vu", "dang_phuc_vu"].includes(l.trang_thai) && theKhach.length > 0 && coQuyen(nd, "the.thuchien") && (
          // Mỗi thẻ một nút, cùng hộp với Thu ngân / thẻ / hồ sơ khách (chị Lâm 11/11/2026): thẻ có dịch vụ thì hiện thẳng dịch vụ,
          // thẻ chưa gắn dịch vụ thì hiện chính thẻ và ẩn ô dịch vụ.
          <>{theKhach.map((tk) => {
            const dvTk = (lk ?? []).filter((x) => x.goi_id === tk.goi_id).map((x) => dvTen.get(x.dich_vu_id)).filter((d): d is { gia_tri: string; nhan: string } => !!d);
            const ten = tenGoiThe.get(tk.goi_id ?? "") ?? tk.ma ?? "Thẻ";
            return <NutBuoi key={tk.id} theId={tk.id ?? ""} lichId={l.id} nhan={theKhach.length > 1 ? `Gửi chuyên viên làm: ${ten}` : "Gửi chuyên viên làm"} nhanVien={nvLC} bacSi={bsLC}
              dichVu={dvTk.length || tk.goi_id ? dvTk : dvDuLich} goiId={tk.goi_id} tenThe={ten} buoiCon={Number(tk.so_buoi_con ?? 0)} buoiTong={tk.so_buoi_tong == null ? null : Number(tk.so_buoi_tong)}
              macDinh={{ dv: dvIds.find((d) => dvTk.some((x) => x.gia_tri === d)) ?? "", nv: nvDefault, bs: "" }} action={chuyenTriLieu} />;
          })}</>
        )}
        {!ngang && nutSua(l, k, dvIds, "chu")}
        {sua && ["da_xac_nhan", "cho_phuc_vu"].includes(l.trang_thai) && <NutNhanh nhan="Không đến" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "khong_den" }} />}
        {sua && ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"].includes(l.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ lịch hẹn" an={{ id: l.id, trang_thai: "huy" }} nhanLuu="Huỷ lịch" truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "chu", batBuoc: true, rong: true }]} action={doiTrangThaiLich} />}
        {(coQuyen(nd, "bc.bao") || coQuyen(nd, "kn.ghi")) && ["cho_phuc_vu", "dang_phuc_vu", "hoan_thanh"].includes(l.trang_thai) && (
          <NutHop kieu="chu" nguy nhan="Báo bất thường" tieuDe={`Báo bất thường: ${k?.ho_ten ?? ""}`} moTa="Thấy đỏ, rát, phồng, sưng, chóng mặt...: ngừng thao tác gây rủi ro, đưa khách đến bác sĩ rồi ghi vào đây. Bác sĩ và lãnh đạo nhận thông báo ngay." action={baoBienChung} an={{ khach_id: l.khach_id }} giaTri={{ dich_vu_id: dvIds.length === 1 ? dvIds[0] : "" }} rong nhanLuu="Báo ngay" truong={truongBBT} />
        )}
      </div>
    );
  };

  /** Khung chi tiết của lịch đang mở (tham số `lich`): đủ thông tin + nút thao tác + Sửa lịch hẹn + lịch sử sửa (quản lý). Lịch nằm trong ngày đang chọn vì bấm thẻ cũng chọn ngày của thẻ. */
  const chiTietMo = (() => {
    if (!lichMo) return null;
    const l = lichNgayRong.find((x) => x.id === lichMo);
    if (!l) return <p className="p-5 pr-12 text-[14px] text-muc-3">Không thấy lịch này trong ngày đang xem (có thể đã huỷ hoặc đổi ngày). Bấm lại thẻ trên lưới.</p>;
    const k = tenK.get(l.khach_id);
    const dvIds = ld.filter((x) => x.lich_id === l.id).map((x) => x.dich_vu_id);
    const hoaDon = hoaDonCua(l);
    const phut = Math.round((new Date(l.ket_thuc).getTime() - new Date(l.bat_dau).getTime()) / 60000);
    const phieu = ph.filter((p) => p.lich_hen_id === l.id).map((p) => `${p.ma}: ${NHAN_PHIEU[p.trang_thai]}`);
    const nguoiTao = l.nguoi_tao_ten ?? tenNv.get(l.tao_boi ?? "") ?? "";
    const maLich = l.ma_dat_lich ?? l.id.slice(0, 8).toUpperCase();
    const dvTen = dvIds.map((d) => tenDv.get(d)).filter(Boolean).join(", ") || l.dich_vu_ten || "";
    const dong: [string, React.ReactNode][] = [
      ["Giờ hẹn", `${gioVN(l.bat_dau)} ~ ${gioVN(l.ket_thuc)} · ${ngayVN(ngayCuaIso(l.bat_dau))}`],
      ["Thời lượng", `${phut} phút`],
      ["Dịch vụ", dvTen],
      ["Người thực hiện", l.nhan_vien_id ? tenNv.get(l.nhan_vien_id) ?? "" : "Chưa phân"],
      ["Phòng / giường", l.phong ?? "Chưa xếp chỗ"],
      ["Nguồn đặt", nhanNguon(l.nguon)],
      ["Khách đi cùng", nhomCua(l.id).length ? <ul key="kdc" className="space-y-0.5">{nhomCua(l.id).map((x) => <li key={x.thu_tu}><b className="font-medium">{x.ten}</b>{(x.dich_vu_ids ?? []).length ? `: ${(x.dich_vu_ids ?? []).map((d) => tenDv.get(d)).filter(Boolean).join(", ")}` : ""}{x.nhan_vien_id ? ` · ${tenNv.get(x.nhan_vien_id) ?? ""}` : ""}{x.phong ? ` · ${x.phong}` : ""}</li>)}</ul> : (l.so_khach ?? 1) > 1 ? `${l.so_khach} khách` : ""],
      ["Lặp", moTaLap(l)],
      ["Giờ đến", l.checkin_luc ? `${gioVN(l.checkin_luc)} ${ngayVN(ngayCuaIso(l.checkin_luc))}` : ""],
      ["Ghi chú", l.ghi_chu ?? ""],
      ["Lý do huỷ", l.trang_thai === "huy" ? l.ly_do_huy ?? "" : ""],
      ["Phiếu cấp", phieu.join(" · ")],
      ["Hoá đơn", hoaDon ? <Link key="hd" href={`/hoa-don/${hoaDon.id}`} className="font-medium text-nhan-dam hover:underline">#{hoaDon.sh_ma ?? hoaDon.ma}</Link> : ""],
      ["Tạo bởi", `${nguoiTao ? `${nguoiTao} · ` : ""}${gioVN(l.tao_luc)} ${ngayVN(ngayCuaIso(l.tao_luc))}`],
    ];
    return (
      <div key={l.id} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5 pr-10">
          <span className={`rounded-tag px-2 py-0.5 text-[12px] font-semibold ${MAU_TRANG_THAI[l.trang_thai]?.dac ?? "bg-giay-tram text-muc"}`}>{TT[l.trang_thai].nhan}</span>
          {l.loai_lich && <span className="rounded-tag border border-nhan px-2 py-0.5 text-[12px] font-medium text-nhan-dam">{nhanLoaiLich(l.loai_lich)}</span>}
          {l.khach_moi && <span className="rounded-tag bg-loi-nen px-2 py-0.5 text-[12px] font-medium text-loi">Khách mới</span>}
          <span className="text-[12px] text-muc-3">#{maLich}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Link href={`/khach-hang/${l.khach_id}`} className="min-w-0 truncate text-[17px] font-semibold uppercase text-nhan-dam hover:underline">{k?.ho_ten}</Link>
          <BieuTuongHang hang={k?.hang ?? ""} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[14px] text-muc-2">
          {k?.dien_thoai && <a href={`tel:${k.dien_thoai}`} className="inline-flex min-h-10 items-center font-medium tabular-nums text-nhan-dam hover:underline">{k.dien_thoai}</a>}
          {k?.ma && <span className="text-[13px] text-muc-3">{k.ma}</span>}
          <span className="text-[13px] text-muc-3">Hạng {k?.hang ?? "Thường"}</span>
        </div>
        <dl className="mt-3 grid grid-cols-[112px_1fr] gap-x-3 gap-y-1.5 border-t border-vien pt-3 text-[14px]">
          {dong.filter(([, v]) => v).map(([n, v]) => <div key={n} className="contents"><dt className="text-muc-3">{n}</dt><dd className="min-w-0 break-words tabular-nums text-muc">{v}</dd></div>)}
        </dl>
        <div className="mt-4 space-y-3 border-t border-vien pt-3">
          {sua && <div className="flex flex-wrap items-center gap-2.5">{nutSua(l, k, dvIds, "chinh")}<NutInLich tieuDe={`Lịch hẹn #${maLich}`} phu={cnLC.find((c) => c.gia_tri === l.chi_nhanh_id)?.nhan} dong={[["Khách hàng", k?.ho_ten ?? ""], ["Điện thoại", k?.dien_thoai ?? ""], ["Mã khách", k?.ma ?? ""], ["Trạng thái", TT[l.trang_thai].nhan], ["Loại lịch", nhanLoaiLich(l.loai_lich)],
            ...dong.map(([n, v]): [string, string] => [n, typeof v === "string" ? v : ""]), ...nhomCua(l.id).map((x): [string, string] => [x.ten, [(x.dich_vu_ids ?? []).map((d) => tenDv.get(d)).filter(Boolean).join(", "), x.nhan_vien_id ? tenNv.get(x.nhan_vien_id) ?? "" : "", x.phong ?? ""].filter(Boolean).join(" · ")]), ["Hoá đơn", hoaDon ? `#${hoaDon.sh_ma ?? hoaDon.ma}` : ""]].filter(([, v]) => v) as [string, string][]} /></div>}
          {hanhDong(l, k, dvIds, true)}
        </div>
        {quanLy && (
          <details className="mt-4 border-t border-vien pt-3" open={(lichSuMo ?? []).length > 0 && (lichSuMo ?? []).length <= 3}>
            <summary className="cursor-pointer text-[13px] font-semibold text-muc-2">Lịch sử sửa ({(lichSuMo ?? []).length})</summary>
            {(lichSuMo ?? []).length === 0 ? <p className="mt-2 text-[13px] text-muc-3">Chưa có lần sửa nào được ghi (ghi từ 10/11/2026).</p> : (
              <ol className="mt-2 space-y-2.5">
                {(lichSuMo ?? []).map((r) => (
                  <li key={r.id} className="border-l-2 border-vien-dam pl-2.5 text-[13px]">
                    <div className="text-muc-2"><b className="font-semibold text-muc">{r.nguoi_ten}</b> · {NHAN_HANH_DONG_SUA[r.hanh_dong] ?? r.hanh_dong} · <span className="tabular-nums">{gioVN(r.luc)} {ngayVN(ngayCuaIso(r.luc))}</span></div>
                    <ul className="mt-0.5 text-muc-3">{dongThayDoi(r.thay_doi, 90).map((d, i) => <li key={i}>{d.nhan}: {r.hanh_dong === "tao" || !d.cu ? <span className="text-muc">{d.moi || "(trống)"}</span> : <><span className="line-through decoration-muc-3/60">{d.cu}</span> → <span className="text-muc">{d.moi || "(trống)"}</span></>}</li>)}</ul>
                  </li>
                ))}
              </ol>
            )}
            <Link href={`/lich-hen/lich-su-sua?lich=${l.id}&cn=${cnId}`} className="mt-2 inline-block text-[13px] font-medium text-nhan-dam hover:underline">Xem toàn bộ lịch sử sửa</Link>
          </details>
        )}
      </div>
    );
  })();

  return (
    <>
      {/* Dòng đầu: tiêu đề + liên kết trang đặt lịch online; bên phải kiểu xem, sơ đồ chỗ, lịch sử, khoảng ngày, đặt lịch */}
      <TieuDeNoi tieuDe="Lịch hẹn" icon={CalendarDays} phu={<a href="/dat-lich" target="_blank" rel="noopener" className="font-medium text-nhan-dam hover:underline">Mở web đặt lịch online</a>}>
          <div className="flex overflow-hidden rounded-nho border border-vien-dam" role="group" aria-label="Kiểu xem lịch">
            {KIEU_XEM.map((k) => <Link key={k.ma} href={url({ kieu: k.ma })} aria-current={k.ma === kieu ? "true" : undefined} className={nutKieu(k.ma === kieu)}>{k.nhan}</Link>)}
          </div>
          <Link href={`/lich-hen/so-do-cho?cn=${cnId}`} className={nutPhu}>Sơ đồ chỗ</Link>
          <Link href={`/lich-hen/lich-su?cn=${cnId}`} className={nutPhu}>Lịch sử</Link>
          {quanLy && <Link href={`/lich-hen/lich-su-sua?cn=${cnId}`} className={nutPhu}>Lịch sử sửa</Link>}
          <ChonKhoang tu={tu} den={den} />
          {sua && <FormLichHen nhan="Đặt lịch" cho={choDm} khungGio={khungGioTrong} ttKhach={thongTinKhachDatLich} taoKhach={taoKhachDuoc ? { action: luuKhach, macDinhNv: nd.nhanVienId, nhom: (nhomKh ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })), ganNhom: ganNhomKhachMoi } : undefined} dichVu={dichVu} nhanVien={nvLC} chiNhanh={cnLC} tim={timKhach} action={luuLichHen} ban={{ khach: khachMoi, chiNhanhId: cnId }} mo={moFormMoi} homNay={ngay} />}
      </TieuDeNoi>
      <div className="the-noi the-noi-thap mb-4 flex flex-wrap items-center gap-3 px-4 py-3 text-[13px] text-muc-3">
        {!nd.chiNhanhId && (dsCn?.length ?? 0) > 1 && (dsCn ?? []).map((c) => <Link key={c.id} href={url({ cn: c.id })} className={`rounded-nho px-3 py-1.5 ${c.id === cnId ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}
        <span className="flex items-center gap-2"><span>Nhân viên</span><span className="w-[190px]"><LocNhieuNhanVien giaTri={nvLoc.join(",")} luaChon={nvLocLC} /></span></span>
        <span className="flex items-center gap-2"><span>Chỗ</span><span className="w-[140px]"><LocCho giaTri={sp.cho ?? ""} luaChon={[...new Set([...choCn.map((c) => c.ten), ...lich.map((l) => (l.phong ?? "").trim()).filter(Boolean)])].map((t) => ({ gia_tri: t, nhan: t }))} /></span></span>
        <span className="tabular-nums" aria-live="polite">{lich.filter(homLich).length} lịch đang hiệu lực{nvLoc.length || sp.cho || q || tt || nguon ? " theo bộ lọc" : ""} trong khoảng ngày</span>
        <span className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:ml-auto">
          <div className="w-[190px]"><LocLoaiLich giaTri={loai} /></div>
          <div className="mr-1 w-[190px]"><LocNguon giaTri={nguon} /></div>
          {coQuyen(nd, "lich.xuat") && <>
          <a href={xuat(ngay, ngay)} download className="text-nhan-dam hover:underline" aria-label={`Xuất Excel lịch hẹn ngày ${ngayVN(ngay)}`}>Xuất Excel ngày</a>
          <a href={xuat(dauThang, cuoiThang)} download className="text-nhan-dam hover:underline" aria-label={`Xuất Excel lịch hẹn tháng ${ngay.slice(5, 7)}/${ngay.slice(0, 4)}`}>Xuất cả tháng</a>
          </>}
        </span>
      </div>

      {(sua || coQuyen(nd, "lich.xem")) && (yeuCau ?? []).length > 0 && (
        <section aria-label="Yêu cầu đặt lịch online chờ duyệt" className="mb-4 rounded-hop border border-canh-bao bg-canh-bao-nen p-4">
          <h2 className="mb-2 text-[14px] font-semibold text-canh-bao">Yêu cầu đặt lịch online chờ duyệt ({(yeuCau ?? []).length})</h2>
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {(yeuCau ?? []).map((y) => (
              <li key={y.id} className="rounded-the border border-vien bg-giay-sang p-3 text-[13px] shadow-[0_1px_2px_rgb(10_43_38/0.07),0_4px_10px_-2px_rgb(10_43_38/0.07)]">
                <div className="font-semibold text-muc">{ngayVN(ngayCuaIso(y.bat_dau))} {gioVN(y.bat_dau)} · {y.thoi_luong_phut} phút</div>
                <div className="text-muc-2">{y.ho_ten} · <a href={`tel:${y.dien_thoai}`} className="text-nhan-dam hover:underline">{y.dien_thoai}</a></div>
                <div className="text-muc-3">{tenYeuCau(y.dich_vu_ids)}</div>
                {y.ghi_chu && <div className="text-muc-3">{y.ghi_chu}</div>}
                {sua && <div className="mt-1.5 flex items-center gap-3"><NutNhanh chinh nhan="Duyệt" action={duyetYeuCauOnline} du={{ id: y.id }} /><NutHop kieu="chu" nguy nhan="Từ chối" tieuDe="Từ chối yêu cầu đặt lịch" an={{ id: y.id }} nhanLuu="Từ chối" truong={[{ ten: "ly_do", nhan: "Lý do (ví dụ: đã gọi, khách đổi giờ)", loai: "chu", batBuoc: true, rong: true }]} action={tuChoiYeuCauOnline} /></div>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ───────── Lưới bên trái ───────── */}
        <KhungChiTietLich lichId={lichMo} chiTiet={chiTietMo}>
        <div className="min-w-0 overflow-x-auto rounded-hop border border-vien bg-giay-sang shadow-[inset_0_1px_0_rgb(255_255_255/0.95),0_1px_2px_rgb(10_43_38/0.06),0_8px_18px_-4px_rgb(10_43_38/0.11)]" tabIndex={0} aria-label="Lưới lịch hẹn, cuộn ngang để xem các ngày">
          <div className="grid min-w-max" style={{ gridTemplateColumns: cotLuoi }}>
            <div className="sticky left-0 z-10 flex items-center border-b border-r border-vien bg-giay-sang px-3 py-2">
              {kieu === "nv" ? <div className="w-full"><LocNhieuNhanVien giaTri={nvLoc.join(",")} luaChon={nvLocLC} /></div>
                : kieu === "cho" ? <div className="w-full"><LocCho giaTri={sp.cho ?? ""} luaChon={[...new Set([...choCn.map((c) => c.ten), ...lich.map((l) => (l.phong ?? "").trim()).filter(Boolean)])].map((t) => ({ gia_tri: t, nhan: t.toLocaleUpperCase("vi-VN") }))} /></div>
                : <span className="text-[13px] font-medium text-muc-2">Giờ</span>}
            </div>
            {cacNgay.map((d) => {
              const thu = thuCuaNgay(d);
              const mau = d === homNay ? "bg-sac-xanh text-white" : thu === 6 ? "bg-loi text-white" : thu === 0 ? "bg-giay-tram text-loi" : "bg-giay-sang text-muc";
              return <Link key={d} href={url({ ngay: d })} className={`border-b border-l border-vien px-3 py-2 text-center text-[13px] font-medium ${mau} ${d === ngay ? "underline underline-offset-4" : ""}`}>{nhanCotNgay(d, homNay)}</Link>;
            })}
            {hang.map((h) => (
              <div key={h.khoa || "_"} className="contents">
                <div title={[h.ten, h.phu].filter(Boolean).join(" · ")} className="sticky left-0 z-10 flex min-h-[44px] items-center gap-2 border-b border-r border-vien bg-giay-sang px-2.5 py-1">
                  {h.vong ? <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[50%] text-[10.5px] font-semibold ${MAU_VONG[h.mau ?? 0]}`} aria-hidden>{h.vong}</span>
                    : kieu === "gio" ? null : <span className="h-7 w-7 shrink-0 rounded-[50%] border border-dashed border-vien-dam" aria-hidden />}
                  <div className="min-w-0"><div className="truncate text-[12px] font-semibold leading-tight text-muc">{h.ten}</div></div>
                </div>
                {cacNgay.map((d) => {
                  const ds = o.get(`${h.khoa}|${d}`) ?? [];
                  return (
                    <div key={d} className="min-h-[44px] space-y-1 border-b border-l border-vien p-1">
                      {ds.slice(0, TOI_DA_THEO_O).map((l) => theLuoi(l, d))}
                      {ds.length > TOI_DA_THEO_O && <XemThemO so={ds.length - TOI_DA_THEO_O}>{ds.slice(TOI_DA_THEO_O).map((l) => theLuoi(l, d))}</XemThemO>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 border-t border-vien px-3 py-2 text-[12px] text-muc-3" aria-label="Chú thích màu thẻ lịch">
            {["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu", "dang_phuc_vu", "hoan_thanh"].map((m) => <li key={m} className="flex items-center gap-1.5"><span aria-hidden className={`h-3 w-3 rounded-[3px] ${MAU_TRANG_THAI[m].luoi.split(" ")[1]}`} />{TT[m].nhan}</li>)}
          </ul>
        </div>
        </KhungChiTietLich>

        {/* ───────── Cột phải: tìm, lọc, danh sách lịch của ngày ───────── */}
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-[96px]" aria-label="Lịch hẹn theo ngày">
          <TimVaLoc key={q} q={q} tt={tt} luaChonTt={LC_TT} />
          <Link href={url({ ngay: homNay, tu: homNay, den: congNgay(homNay, 7) })} className="flex items-center gap-2 text-[14px] text-muc-2 hover:underline">
            <CalendarDays className="h-4 w-4 text-muc-3" aria-hidden />
            <span>Hôm nay có <b className="text-[16px] font-semibold text-loi">{demHomNay ?? 0}</b> lịch hẹn. Bấm để xem</span>
          </Link>
          <Link href={url({ ngay: homNay })} className="nut-vang inline-flex h-10 items-center rounded-[50%] px-5 text-[13px] font-semibold uppercase">Hôm nay {homNay.slice(8, 10)}/{homNay.slice(5, 7)}</Link>
          <KhungNgay tieuDe={nhanNgayDai(ngay, homNay)} tong={`Tổng ${lichNgayHieuLuc} lịch / ${soHuy} huỷ`}>
            {lichNgay.length === 0 && <p className="rounded-nho border border-vien py-8 text-center text-[14px] text-muc-3">{nguon || q || tt ? "Không có lịch nào khớp bộ lọc trong ngày." : "Chưa có lịch hẹn nào trong ngày."}</p>}
            {lichNgay.map((l) => {
              const k = tenK.get(l.khach_id);
              const t = TT[l.trang_thai];
              const dvIds = ld.filter((x) => x.lich_id === l.id).map((x) => x.dich_vu_id);
              const phieu = ph.filter((p) => p.lich_hen_id === l.id).map((p) => `${p.ma}: ${NHAN_PHIEU[p.trang_thai]}`);
              const hoaDon = hoaDonCua(l);
              const phut = Math.round((new Date(l.ket_thuc).getTime() - new Date(l.bat_dau).getTime()) / 60000);
              const gioDen = gioVN(l.bat_dau);
              const nguoiTao = l.nguoi_tao_ten ?? tenNv.get(l.tao_boi ?? "") ?? "";
              const maLich = l.ma_dat_lich ?? l.id.slice(0, 8).toUpperCase();
              // Chi tiết một lịch: dùng chung cho hộp "Xem lịch" và phiếu "In lịch hẹn".
              const chiTiet: [string, string][] = [["Khách hàng", k?.ho_ten ?? ""], ["Điện thoại", k?.dien_thoai ?? ""], ["Mã khách", k?.ma ?? ""], ["Giờ hẹn", `${gioDen} ~ ${gioVN(l.ket_thuc)} ngày ${ngayVN(ngayCuaIso(l.bat_dau))} (${phut} phút)`], ["Trạng thái", t.nhan], ["Giờ đến", l.checkin_luc ? `${gioVN(l.checkin_luc)} ${ngayVN(ngayCuaIso(l.checkin_luc))}` : ""],
                            ["Dịch vụ", dvIds.map((d) => tenDv.get(d)).filter(Boolean).join(", ")], ["Người thực hiện", l.nhan_vien_id ? (tenNv.get(l.nhan_vien_id) ?? "") : ""], ["Chỗ", l.phong ?? ""], ...nhomCua(l.id).map((x): [string, string] => [x.ten, [(x.dich_vu_ids ?? []).map((d) => tenDv.get(d)).filter(Boolean).join(", "), x.nhan_vien_id ? tenNv.get(x.nhan_vien_id) ?? "" : "", x.phong ?? ""].filter(Boolean).join(" · ")]), ["Nguồn đặt lịch", nhanNguon(l.nguon)], ["Ghi chú", l.ghi_chu ?? ""],
                            ["Tạo bởi", `${nguoiTao ? `${nguoiTao} · ` : ""}${gioVN(l.tao_luc)} ${ngayVN(ngayCuaIso(l.tao_luc))}`], ["Sửa lần cuối", `${gioVN(l.cap_nhat_luc)} ${ngayVN(ngayCuaIso(l.cap_nhat_luc))}`]];
              return (
                <article key={l.id} className={`rounded-the border border-vien border-l-[3px] bg-giay-sang p-3 shadow-[0_1px_2px_rgb(10_43_38/0.07),0_4px_10px_-2px_rgb(10_43_38/0.07)] transition-shadow hover:shadow-[0_2px_4px_rgb(10_43_38/0.08),0_10px_22px_-6px_rgb(10_43_38/0.14)] ${MAU_TRANG_THAI[l.trang_thai]?.the.split(" ")[0] ?? ""} ${l.trang_thai === "huy" ? "opacity-70" : ""}`}>
                  <div className="flex gap-3">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[50%] border-2 border-nhan text-[13px] font-semibold tabular-nums text-nhan-dam">{gioDen}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-muc-3"><span className="font-medium text-muc-2">#{maLich}</span><span>{phut} phút</span></div>
                      <div className="text-[12px] text-muc-3">Tạo lúc {gioVN(l.tao_luc)} {ngayVN(ngayCuaIso(l.tao_luc))}{nguoiTao ? <> · bởi {nguoiTao}</> : null}</div>
                      <div className="text-[12px] text-muc-3">Sửa lần cuối lúc {gioVN(l.cap_nhat_luc)} {ngayVN(ngayCuaIso(l.cap_nhat_luc))}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Link href={`/khach-hang/${l.khach_id}`} className="min-w-0 truncate text-[14px] font-semibold uppercase text-nhan-dam hover:underline">{k?.ho_ten}</Link>
                        <BieuTuongHang hang={k?.hang ?? ""} />
                        <Link href={`/khach-hang/${l.khach_id}`} aria-label={`Thông tin khách ${k?.ho_ten ?? ""}`} className="text-muc-3 hover:text-nhan-dam"><Info className="h-4 w-4" aria-hidden /></Link>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {l.nguon && <span className="rounded-tag bg-giay-tram px-2 py-0.5 text-[12px] text-muc-2">{nhanNguon(l.nguon)}</span>}
                        <span className={`rounded-tag px-2 py-0.5 text-[12px] font-medium ${MAU_TRANG_THAI[l.trang_thai]?.chip ?? "bg-giay-tram text-muc-2"}`}>{t.nhan}</span>
                        {l.loai_lich && <span className="rounded-tag border border-nhan px-2 py-0.5 text-[12px] font-medium text-nhan-dam">{nhanLoaiLich(l.loai_lich)}</span>}
                        {l.khach_moi && <span className="rounded-tag bg-loi-nen px-2 py-0.5 text-[12px] font-medium text-loi">Khách mới</span>}
                        {(l.so_khach ?? 1) > 1 && <span className="rounded-tag bg-nhan-nhat px-2 py-0.5 text-[12px] font-medium text-nhan-dam">{l.so_khach} khách</span>}
                      </div>
                      {(dvIds.length > 0 || l.nhan_vien_id || l.phong) && <div className="mt-1 text-[12px] text-muc-3">{dvIds.map((d) => tenDv.get(d)).join(", ")}{l.nhan_vien_id ? ` · ${tenNv.get(l.nhan_vien_id)}` : ""}{l.phong ? ` · ${l.phong}` : ""}</div>}
                      {nhomCua(l.id).length > 0 && <ul className="mt-0.5 text-[12px] text-muc-3">{nhomCua(l.id).map((x) => <li key={x.thu_tu}><span className="font-medium text-muc-2">{x.ten}:</span> {(x.dich_vu_ids ?? []).map((d) => tenDv.get(d)).filter(Boolean).join(", ")}{x.nhan_vien_id ? ` · ${tenNv.get(x.nhan_vien_id) ?? ""}` : ""}{x.phong ? ` · ${x.phong}` : ""}</li>)}</ul>}
                      {moTaLap(l) && <div className="text-[12px] text-muc-3">{moTaLap(l)}</div>}
                      {l.ghi_chu && <div className="text-[12px] text-muc-3">{l.ghi_chu}</div>}
                      {phieu.length > 0 && <div className="text-[12px] text-dat-dam">{phieu.join(" · ")}</div>}
                      {hoaDon && <div className="mt-1 text-[12px]"><span className="text-muc-3">Có hoá đơn </span><Link href={`/hoa-don/${hoaDon.id}`} className="font-medium text-nhan-dam hover:underline">#{hoaDon.sh_ma ?? hoaDon.ma}</Link></div>}
                      <div className="mt-2 flex items-center gap-1.5">
                        <XemLich tieuDe={`Lịch hẹn #${maLich}`} dong={chiTiet} khachId={l.khach_id} hoaDon={hoaDon ? { id: hoaDon.id, ma: hoaDon.sh_ma ?? hoaDon.ma } : null} />
                        <NutInLich tieuDe={`Lịch hẹn #${maLich}`} phu={cnLC.find((c) => c.gia_tri === l.chi_nhanh_id)?.nhan}
                          dong={chiTiet} />
                        <details className="group relative">
                          <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-nho border border-vien-dam text-muc-2 hover:bg-giay-tram" aria-label="Thao tác với lịch hẹn"><ChevronDown className="h-4 w-4" aria-hidden /></summary>
                          <div className="absolute left-0 top-9 z-20 w-[240px] rounded-the border border-vien bg-giay-sang shadow-[0_14px_32px_rgba(5,40,36,0.18)]">{hanhDong(l, k, dvIds)}</div>
                        </details>
                                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </KhungNgay>
        </aside>
      </div>
      <p className="mt-3 text-[12px] text-muc-3">Mở ca chỉ được khi dịch vụ có vật tư nhóm A đã có phiếu cấp và Chuyên viên trị liệu bấm Đã nhận. Lưới chỉ hiện lịch còn hiệu lực; số huỷ nằm ở thanh ngày bên phải.</p>
    </>
  );
}
