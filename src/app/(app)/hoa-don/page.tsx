import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { LocHoaDon } from "@/components/hoa-don/LocHoaDon";

const MOI_TRANG = 40;
export const TRANG_THAI_HD = { nhap: { nhan: "Nháp", kieu: "tram" }, hoan_thanh: { nhan: "Hoàn thành", kieu: "tot" }, huy: { nhan: "Đã huỷ", kieu: "loi" } } as const;

export default async function TrangHoaDon({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const sp = await searchParams;
  const trang = Math.max(1, Number(sp.trang) || 1);
  const tu = sp.tu || homNayHCM().slice(0, 8) + "01";
  const den = sp.den || homNayHCM();
  const db = sb();
  let q = db.from("hoa_don").select("id, ma, ngay_hd, trang_thai, tong_phai_thu, da_thu, con_no, khach_id, nguoi_lap_id, chi_nhanh_id", { count: "exact" })
    .gte("ngay_hd", tu).lte("ngay_hd", den).order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (sp.tt) q = q.eq("trang_thai", sp.tt);
  if (sp.no === "1") q = q.gt("con_no", 0).eq("trang_thai", "hoan_thanh");
  if (sp.q) {
    const { data: ks } = await db.from("khach_hang").select("id").or(`ho_ten.ilike.%${sp.q.replace(/[%,()]/g, " ")}%,dien_thoai.like.%${sp.q.replace(/\D/g, "") || "~"}%`).limit(50);
    q = q.or([`ma.ilike.%${sp.q.replace(/[%,()]/g, " ")}%`, (ks?.length ? `khach_id.in.(${ks.map((k) => k.id).join(",")})` : "")].filter(Boolean).join(","));
  }
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
  const tong = (ds ?? []).filter((d) => d.trang_thai === "hoan_thanh").reduce((s, d) => s + Number(d.tong_phai_thu), 0);

  return (
    <>
      <TieuDeTrang tieuDe="Hoá đơn" phu={`${(count ?? 0).toLocaleString("vi-VN")} hoá đơn từ ${ngayVN(tu)} đến ${ngayVN(den)}${trang === 1 ? ` · trang này phải thu ${tienVN(tong)}` : ""}`} />
      <LocHoaDon tu={tu} den={den} />
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Không có hoá đơn trong khoảng này."
        cot={[
          { nhan: "Mã", hienThi: (r) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
          { nhan: "Khách hàng", hienThi: (r) => (r.khach_id ? tenK.get(r.khach_id)?.ho_ten ?? "" : "Khách lẻ") }, { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_hd) },
          { nhan: "Người lập", hienThi: (r) => tenNv.get(r.nguoi_lap_id) ?? "" },
          { nhan: "Phải thu", hienThi: (r) => tienVN(r.tong_phai_thu), phai: true }, { nhan: "Đã thu", hienThi: (r) => tienVN(r.da_thu), phai: true },
          { nhan: "Còn nợ", hienThi: (r) => (r.trang_thai === "hoan_thanh" && Number(r.con_no) > 0 ? <span className="font-medium text-canh-bao">{tienVN(r.con_no)}</span> : ""), phai: true },
          { nhan: "Trạng thái", hienThi: (r) => { const t = TRANG_THAI_HD[r.trang_thai as keyof typeof TRANG_THAI_HD]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
        ]} />
      {soTrang > 1 && (
        <nav className="mt-5 flex items-center justify-between text-[14px]" aria-label="Phân trang"><span className="text-muc-3">Trang {trang} / {soTrang}</span>
          <span className="flex gap-4">{trang > 1 && <Link href={lienKet(trang - 1)} className="font-medium text-nhan-dam hover:underline">Trang trước</Link>}{trang < soTrang && <Link href={lienKet(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau</Link>}</span></nav>
      )}
    </>
  );
}
