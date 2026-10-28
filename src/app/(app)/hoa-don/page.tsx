import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { apLocHoaDon, docLocHoaDon, khachKhopTim, TRANG_THAI_HD } from "@/lib/loc-hoa-don";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { LocHoaDon } from "@/components/hoa-don/LocHoaDon";

const MOI_TRANG = 40;

export default async function TrangHoaDon({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const sp = await searchParams;
  const trang = Math.max(1, Number(sp.trang) || 1);
  const loc = docLocHoaDon(sp);
  const { tu, den } = loc;
  const db = sb();
  const q = apLocHoaDon(db.from("hoa_don").select("id, ma, ngay_hd, trang_thai, tong_phai_thu, da_thu, con_no, khach_id, nguoi_lap_id, chi_nhanh_id, vat_hd_luc, vat_hd_so", { count: "exact" }), loc, nd.chiNhanhId, await khachKhopTim(db, loc))
    .order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1);
  const { data: ds, count } = await q;
  const idsK = [...new Set((ds ?? []).map((d) => d.khach_id).filter(Boolean))] as string[];
  const [{ data: k }, { data: nv }] = await Promise.all([
    idsK.length ? db.from("khach_hang").select("id, ho_ten, ma").in("id", idsK) : Promise.resolve({ data: [] }),
    db.from("nhan_vien").select("id, ho_ten"),
  ]);
  const tenK = new Map((k ?? []).map((x) => [x.id, x]));
  const tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
  const soTrang = Math.max(1, Math.ceil((count ?? 0) / MOI_TRANG));
  const lienKet = (t: number) => { const u = new URLSearchParams(Object.entries(sp).filter(([kk, v]) => v && kk !== "trang") as [string, string][]); u.set("trang", String(t)); return `/hoa-don?${u}`; };
  const thamSo = new URLSearchParams(Object.entries(sp).filter(([kk, v]) => v && kk !== "trang") as [string, string][]);
  thamSo.set("tu", tu); thamSo.set("den", den);
  const tong = (ds ?? []).filter((d) => d.trang_thai === "hoan_thanh").reduce((s, d) => s + Number(d.tong_phai_thu), 0);

  return (
    <>
      <TieuDeTrang tieuDe="Hoá đơn" phu={`${(count ?? 0).toLocaleString("vi-VN")} hoá đơn từ ${ngayVN(tu)} đến ${ngayVN(den)}${trang === 1 ? ` · trang này phải thu ${tienVN(tong)}` : ""}`}>
        {(count ?? 0) > 0 && <a href={`/api/xuat/hoa-don?${thamSo}`} download className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram" aria-label={`Xuất Excel ${(count ?? 0).toLocaleString("vi-VN")} hoá đơn đang lọc`}>Xuất Excel</a>}
      </TieuDeTrang>
      <LocHoaDon tu={tu} den={den} />
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Không có hoá đơn trong khoảng này."
        cot={[
          { nhan: "Mã", hienThi: (r) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => (r.khach_id ? tenK.get(r.khach_id)?.ho_ten ?? "" : "Khách lẻ") }, { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_hd) },
          { nhan: "Người lập", hienThi: (r) => tenNv.get(r.nguoi_lap_id) ?? "" },
          { nhan: "Phải thu", hienThi: (r) => tienVN(r.tong_phai_thu), phai: true }, { nhan: "Đã thu", hienThi: (r) => tienVN(r.da_thu), phai: true },
          { nhan: "Còn nợ", hienThi: (r) => (r.trang_thai === "hoan_thanh" && Number(r.con_no) > 0 ? <span className="font-medium text-canh-bao">{tienVN(r.con_no)}</span> : ""), phai: true },
          { nhan: "HĐ VAT", hienThi: (r) => (r.trang_thai !== "hoan_thanh" ? "" : r.vat_hd_luc ? <span className="text-nhan-dam" title={r.vat_hd_so ? `Số ${r.vat_hd_so}` : undefined}>Đã có hoá đơn</span> : <span className="text-muc-3">Chưa có hoá đơn</span>) },
          { nhan: "Trạng thái", hienThi: (r) => { const t = TRANG_THAI_HD[r.trang_thai as keyof typeof TRANG_THAI_HD]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
        ]} />
      {soTrang > 1 && (
        <nav className="mt-5 flex items-center justify-between text-[14px]" aria-label="Phân trang"><span className="text-muc-3">Trang {trang} / {soTrang}</span>
          <span className="flex gap-4">{trang > 1 && <Link href={lienKet(trang - 1)} className="font-medium text-nhan-dam hover:underline">Trang trước</Link>}{trang < soTrang && <Link href={lienKet(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau</Link>}</span></nav>
      )}
    </>
  );
}
