import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuNganSach, xoaNganSach } from "./actions";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function TrangNganSach({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const nd = await yeuCauQuyen("quy.xem");
  const sua = coQuyen(nd, "ky.khoa");
  const sp = await searchParams, hom = homNayHCM();
  const thang = sp.thang && THANG.test(sp.thang) ? sp.thang : hom.slice(0, 7);
  const [y, m] = thang.split("-").map(Number);
  const dau = `${thang}-01`, cuoi = congNgay(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`, -1);
  const truoc = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`, sau = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const db = sb();
  const [{ data: ns }, { data: chi }, { data: quy }, { data: loai }, { data: cn }] = await Promise.all([
    db.from("ngan_sach_ky").select("*").eq("thang", thang), db.from("so_quy").select("loai_thu_chi_id, so_tien, quy_id").eq("loai", "chi").gte("ngay", dau).lte("ngay", cuoi).not("loai_thu_chi_id", "is", null).limit(5000),
    db.from("quy").select("id, chi_nhanh_id"), db.from("loai_thu_chi").select("id, ten").eq("huong", "chi").eq("hoat_dong", true).eq("he_thong", false).order("ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma"),
  ]);
  const cnCuaQuy = new Map((quy ?? []).map((q) => [q.id, q.chi_nhanh_id])), tenLoai = new Map((loai ?? []).map((l) => [l.id, l.ten])), tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const daChi = (loaiId: string, chiNhanh: string | null) => (chi ?? []).filter((c) => c.loai_thu_chi_id === loaiId && (!chiNhanh || cnCuaQuy.get(c.quy_id) === chiNhanh)).reduce((s, c) => s + Number(c.so_tien), 0);
  const dong = (ns ?? []).filter((n) => !nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId).map((n) => ({ ...n, chi: daChi(n.loai_thu_chi_id, n.chi_nhanh_id) }));
  const tongNs = dong.reduce((s, d) => s + Number(d.so_tien), 0), tongChi = dong.reduce((s, d) => s + d.chi, 0), vuot = dong.filter((d) => d.chi > Number(d.so_tien));
  const truong: Truong[] = [
    { ten: "loai_thu_chi_id", nhan: "Phân loại chi", loai: "chon", batBuoc: true, rong: true, luaChon: (loai ?? []).map((l) => ({ gia_tri: l.id, nhan: l.ten })) },
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, luaChon: [{ gia_tri: "", nhan: "Toàn công ty" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] }]),
    { ten: "so_tien", nhan: "Ngân sách tháng này", loai: "tien", batBuoc: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  return (
    <div>
      <Link href="/tai-chinh" className="text-[13px] text-muc-3 hover:text-muc">← Tài chính</Link>
      <TieuDeTrang tieuDe={`Ngân sách ${String(m).padStart(2, "0")}/${y}`} phu="Ngân sách theo phân loại chi và chi nhánh. Đã chi lấy từ sổ quỹ. Chỉ cảnh báo khi đã chi vượt ngân sách, không cảnh báo mốc 80%.">
        <div className="flex items-center gap-3 text-[14px]"><Link href={`/tai-chinh/ngan-sach?thang=${truoc}`} className="text-nhan-dam hover:underline">← Tháng trước</Link><Link href={`/tai-chinh/ngan-sach?thang=${sau}`} className="text-nhan-dam hover:underline">Tháng sau →</Link></div>
        {sua && <NutHop nhan="Đặt ngân sách" tieuDe="Đặt ngân sách" moTa="Đặt lại cho cùng phân loại và chi nhánh sẽ ghi đè số cũ." truong={truong} action={luuNganSach} an={{ thang }} giaTri={{ loai_thu_chi_id: "", chi_nhanh_id: "" }} />}
      </TieuDeTrang>
      <HangChiSo muc={[{ nhan: "Tổng ngân sách", so: tienVN(tongNs) }, { nhan: "Đã chi", so: tienVN(tongChi), ghiChu: tongNs > 0 ? `${Math.round((tongChi / tongNs) * 100)}% ngân sách` : "" }, { nhan: "Còn lại", so: tienVN(tongNs - tongChi) }, { nhan: "Khoản vượt", so: String(vuot.length), ghiChu: vuot.length ? "cần giải trình" : "không có" }]} />
      <div className="mt-6" />
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Chưa đặt ngân sách cho tháng này."
        cot={[
          { nhan: "Phân loại chi", chinh: true, hienThi: (r) => <div>{tenLoai.get(r.loai_thu_chi_id)}<div className="text-[12.5px] text-muc-3">{r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) : "Toàn công ty"}{r.ghi_chu && ` · ${r.ghi_chu}`}</div></div> },
          { nhan: "Ngân sách", phai: true, hienThi: (r) => tienVN(r.so_tien) }, { nhan: "Đã chi", phai: true, hienThi: (r) => tienVN(r.chi) },
          { nhan: "Còn lại", phai: true, hienThi: (r) => <span className={r.chi > Number(r.so_tien) ? "font-medium text-canh-bao" : ""}>{tienVN(Number(r.so_tien) - r.chi)}</span> },
          { nhan: "", hienThi: (r) => (r.chi > Number(r.so_tien) ? <NhanTrangThai kieu="loi">Vượt ngân sách</NhanTrangThai> : null) },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá ngân sách" xacNhan="Xoá dòng ngân sách này?" action={xoaNganSach} an={{ id: r.id }} nhanLuu="Xoá" /> : null) },
        ]} />
    </div>
  );
}
