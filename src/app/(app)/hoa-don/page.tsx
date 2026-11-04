import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { gioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { apLocHoaDon, docLocHoaDon, GIOI_HAN_TONG, tongToanKy, traCuuLoc } from "@/lib/loc-hoa-don";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { BangHoaDon, type DongHoaDon } from "@/components/hoa-don/BangHoaDon";
import { huyHoaDon, moLaiHoaDon } from "./actions";
import { ChonCoTrang, LocHoaDon } from "@/components/hoa-don/LocHoaDon";

export default async function TrangHoaDon({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const sp = await searchParams;
  const trang = Math.max(1, Number(sp.trang) || 1);
  const loc = docLocHoaDon(sp);
  const { tu, den } = loc;
  const db = sb();
  // SalonHero pos.readByLoc: không có quyền xem toàn cơ sở thì chỉ thấy hoá đơn do chính mình lập.
  const toanCoSo = coQuyen(nd, "ban.toan_co_so");
  const tra = await traCuuLoc(db, loc);
  const moiTrang = loc.n;
  const COT = "id, ma, sh_ma, ngay_hd, tao_luc, trang_thai, tong_phai_thu, da_thu, con_no, khach_id, nguoi_lap_id, thu_ngan_ten, la_lich_su, la_so_du_dau, chi_nhanh_id, vat_hd_luc, vat_hd_so";
  const goiHan = <Q extends { eq(c: string, v: string): Q }>(x: Q) => (toanCoSo ? x : x.eq("nguoi_lap_id", nd.nhanVienId ?? ""));
  const q = goiHan(apLocHoaDon(db.from("v_hoa_don_loc").select(COT, { count: "exact" }), loc, nd.chiNhanhId, tra)).order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).order("id").range((trang - 1) * moiTrang, trang * moiTrang - 1);
  const { data: ds, count } = await q;
  const idsK = [...new Set((ds ?? []).map((d) => d.khach_id).filter(Boolean))] as string[];
  const [{ data: k }, { data: nv }, { data: cn }, tongKy] = await Promise.all([
    idsK.length ? db.from("khach_hang").select("id, ho_ten, ma").in("id", idsK) : Promise.resolve({ data: [] }),
    db.from("nhan_vien").select("id, ho_ten"),
    nd.chiNhanhId ? Promise.resolve({ data: null }) : db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ten"),
    // Tổng toàn kỳ: cộng trên MỌI hoá đơn đang lọc (không chỉ trang này).
    tongToanKy((tu0, den0) => goiHan(apLocHoaDon(db.from("v_hoa_don_loc").select("trang_thai, tong_phai_thu, con_no"), loc, nd.chiNhanhId, tra)).order("ngay_hd").order("id").range(tu0, den0), count ?? 0),
  ]);
  const tenK = new Map((k ?? []).map((x) => [x.id, x]));
  const tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
  // Danh sách chọn nhân viên cho bộ lọc (bỏ tài khoản hệ thống chứa dữ liệu nhập từ SalonHero).
  const dsNv = (nv ?? []).filter((x) => !x.ho_ten.startsWith("Dữ liệu SalonHero")).sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, "vi")).map((x) => ({ gia_tri: x.id, nhan: x.ho_ten }));
  const dsCn = cn ? cn.map((x) => ({ gia_tri: x.id, nhan: x.ten })) : null;
  const soTrang = Math.max(1, Math.ceil((count ?? 0) / moiTrang));
  const lienKet = (t: number) => { const u = new URLSearchParams(Object.entries(sp).filter(([kk, v]) => v && kk !== "trang") as [string, string][]); u.set("trang", String(t)); return `/hoa-don?${u}`; };
  const thamSo = new URLSearchParams(Object.entries(sp).filter(([kk, v]) => v && kk !== "trang") as [string, string][]);
  thamSo.set("tu", tu); thamSo.set("den", den);
  thamSo.delete("ids");
  const dongBang: DongHoaDon[] = (ds ?? []).map((r) => ({
    id: r.id ?? "", ma: r.ma ?? "", khach: r.khach_id ? tenK.get(r.khach_id)?.ho_ten ?? "" : "Khách lẻ", ngay: ngayVN(r.ngay_hd), gio: r.tao_luc ? gioVN(r.tao_luc) : "",
    nguoiLap: (r.la_lich_su ? r.thu_ngan_ten ?? "" : tenNv.get(r.nguoi_lap_id ?? "") ?? ""), phaiThu: tienVN(r.tong_phai_thu), daThu: tienVN(r.da_thu),
    conNo: r.trang_thai === "hoan_thanh" && Number(r.con_no) > 0 ? tienVN(r.con_no) : "", trangThai: (r.trang_thai ?? "nhap") as DongHoaDon["trangThai"],
    vat: r.trang_thai !== "hoan_thanh" ? "" : r.vat_hd_luc ? "co" : "chua", vatSo: r.vat_hd_so ?? "",
    laLichSu: !!r.la_lich_su, coHddt: !!(r.vat_hd_so || r.vat_hd_luc), laSoDuDau: !!r.la_so_du_dau,
  }));

  return (
    <>
      <TieuDeNoi tieuDe="Hoá đơn" phu={`${(count ?? 0).toLocaleString("vi-VN")} hoá đơn từ ${ngayVN(tu)} đến ${ngayVN(den)}`}>
        {(count ?? 0) > 0 && <a href={`/api/xuat/hoa-don?${thamSo}`} download className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram" aria-label={`Xuất Excel ${(count ?? 0).toLocaleString("vi-VN")} hoá đơn đang lọc`}>Xuất Excel</a>}
      </TieuDeNoi>
      <LocHoaDon tu={tu} den={den} chiNhanh={dsCn} nhanVien={dsNv} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] text-muc-2">
        {tongKy ? (
          <p role="status">Hoàn thành <b className="tabular-nums">{tongKy.hoanThanh.don.toLocaleString("vi-VN")}</b> đơn · phải thu <b className="tabular-nums">{tienVN(tongKy.hoanThanh.phaiThu)}</b> · còn nợ <b className={`tabular-nums ${tongKy.hoanThanh.conNo > 0 ? "text-canh-bao" : ""}`}>{tienVN(tongKy.hoanThanh.conNo)}</b>{tongKy.huy.don > 0 ? ` · đã huỷ ${tongKy.huy.don.toLocaleString("vi-VN")} đơn` : ""}{tongKy.nhap.don > 0 ? ` · nháp ${tongKy.nhap.don.toLocaleString("vi-VN")} đơn` : ""}</p>
        ) : (count ?? 0) > GIOI_HAN_TONG ? <p className="text-muc-3">Quá {GIOI_HAN_TONG.toLocaleString("vi-VN")} hoá đơn, chọn khoảng ngày ngắn hơn để xem tổng.</p> : <span />}
        <ChonCoTrang n={moiTrang} />
      </div>
      <BangHoaDon dong={dongBang} thamSo={thamSo.toString()} choSua={coQuyen(nd, "ban.sua")} choHuy={coQuyen(nd, "ban.huy")} suaAction={moLaiHoaDon} huyAction={huyHoaDon} />
      {soTrang > 1 && (
        <nav className="mt-5 flex items-center justify-between text-[14px]" aria-label="Phân trang"><span className="text-muc-3">Trang {trang} / {soTrang}</span>
          <span className="flex gap-4">{trang > 1 && <Link href={lienKet(trang - 1)} className="font-medium text-nhan-dam hover:underline">Trang trước</Link>}{trang < soTrang && <Link href={lienKet(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau</Link>}</span></nav>
      )}
    </>
  );
}
