import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { chuanSdt, tienVN } from "@/lib/dinh-dang";
import { NHAN_NGUON, NGUON, TRANG_THAI_KHACH, TRANG_THAI_KHACH_LC, truongKhach } from "@/lib/khach";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { LocKhach } from "@/components/khach/LocKhach";
import { NhapExcelKhach } from "@/components/khach/NhapExcelKhach";
import { luuKhach, nhapKhachExcel } from "./actions";

const MOI_TRANG = 40;

export default async function TrangKhachHang({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const sp = await searchParams;
  const trang = Math.max(1, Number(sp.trang) || 1);
  const db = sb();
  let q = db.from("v_khach_hang").select("id, ma, ho_ten, dien_thoai, nguon, trang_thai, hang, nguoi_phu_trach_id, so_the_dang_dung, chi_12_thang, chi_nhanh_id", { count: "exact" }).order("tao_luc", { ascending: false }).range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1);
  const tuKhoa = (sp.q ?? "").trim();
  if (tuKhoa) {
    const so = chuanSdt(tuKhoa);
    const an = tuKhoa.replace(/[%,()]/g, " ");
    q = q.or([`ho_ten.ilike.%${an}%`, `ma.ilike.%${an}%`, so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean).join(","));
  }
  if (sp.trang_thai) q = q.eq("trang_thai", sp.trang_thai);
  if (sp.nguon) q = q.eq("nguon", sp.nguon);
  if (sp.phu_trach) q = q.eq("nguoi_phu_trach_id", sp.phu_trach);
  if (sp.hang) q = q.eq("hang", sp.hang);
  const [{ data: ds, count }, { data: nv }, { data: cn }, { data: dv }, { data: hang }] = await Promise.all([
    q,
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma"),
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("hang_khach").select("ten").order("thu_tu"),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const nvLC = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const truong = truongKhach({ dichVu: (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), nhanVien: nvLC, chiNhanh: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) });
  const tong = count ?? 0;
  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const lienKet = (t: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "trang") as [string, string][]);
    u.set("trang", String(t));
    return `/khach-hang?${u}`;
  };

  return (
    <>
      <TieuDeTrang tieuDe="Khách hàng" phu={`${tong.toLocaleString("vi-VN")} khách khớp bộ lọc`}>
        {coQuyen(nd, "khach.nhap") && <NhapExcelKhach nguon={NGUON} nhanVien={nvLC} chiNhanh={(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} action={nhapKhachExcel} macDinh={{ nguoi: nd.nhanVienId, cn: nd.chiNhanhId ?? cn?.[0]?.id ?? "" }} />}
        {coQuyen(nd, "khach.sua") && (
          <NutHop nhan="Thêm khách" tieuDe="Thêm khách hàng" moTa="Nguồn khách và người phụ trách là bắt buộc để tính hoa hồng và đánh giá quảng cáo." rong truong={truong}
            giaTri={{ chi_nhanh_id: nd.chiNhanhId ?? (cn?.[0]?.id ?? ""), nguoi_phu_trach_id: nd.nhanVienId, quan_tam: [] }} action={luuKhach} />
        )}
      </TieuDeTrang>
      <LocKhach nhanVien={nvLC} nguon={NGUON} trangThai={TRANG_THAI_KHACH_LC} hang={(hang ?? []).map((h) => ({ gia_tri: h.ten, nhan: h.ten }))} />
      <Bang duLieu={ds ?? []} khoa={(r) => r.id ?? ""} trong="Không có khách nào khớp. Thử bỏ bớt bộ lọc."
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { chinh: true, nhan: "Khách hàng", hienThi: (r) => <Link href={`/khach-hang/${r.id}`} className="font-medium text-nhan-dam underline-offset-4 hover:underline">{r.ho_ten}</Link> },
          { nhan: "Điện thoại", hienThi: (r) => r.dien_thoai }, { nhan: "Nguồn", hienThi: (r) => NHAN_NGUON[r.nguon ?? ""] ?? r.nguon },
          { nhan: "Trạng thái", hienThi: (r) => { const t = TRANG_THAI_KHACH[r.trang_thai ?? "lead"]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
          { nhan: "Hạng", hienThi: (r) => r.hang ?? "" }, { nhan: "Phụ trách", hienThi: (r) => tenNv.get(r.nguoi_phu_trach_id ?? "") ?? "" },
          { nhan: "Thẻ đang dùng", hienThi: (r) => r.so_the_dang_dung ?? 0, phai: true }, { nhan: "Chi 12 tháng", hienThi: (r) => tienVN(r.chi_12_thang), phai: true },
        ]} />
      {soTrang > 1 && (
        <nav className="mt-5 flex items-center justify-between text-[14px]" aria-label="Phân trang">
          <span className="text-muc-3">Trang {trang} / {soTrang}</span>
          <span className="flex gap-4">
            {trang > 1 && <Link href={lienKet(trang - 1)} className="font-medium text-nhan-dam hover:underline">Trang trước</Link>}
            {trang < soTrang && <Link href={lienKet(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
