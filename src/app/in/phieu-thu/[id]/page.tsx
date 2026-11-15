import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { nhanKhoanThu } from "@/lib/ban-hang";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { docSoTien, maPhieuThu } from "@/lib/phieu-thu";
import { NutIn } from "@/components/hoa-don/NutIn";
import { khoGiayIn } from "@/components/in/ToInChung";
import { BE_NGANG, KHO_CUON } from "@/components/cai-dat/BanInHoaDon";

/** Phiếu thu một lần trả nợ (như SalonHero print_payment_debt): số phiếu = số tự tăng của dòng thanh toán, mã hoá đơn, ngày, số tiền, bằng chữ, nợ còn lại, chữ ký. */
export default async function InPhieuThu({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("no.thu");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = sb();
  const { data: t } = await db.from("thanh_toan").select("*").eq("id", id).maybeSingle();
  if (!t || t.loai !== "thu" || t.phuong_thuc === "the_tien") notFound();
  const { data: h } = await db.from("hoa_don").select("id, ma, sh_ma, chi_nhanh_id, khach_id, con_no, tong_phai_thu").eq("id", t.hoa_don_id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: cn }, { data: k }, { data: nv }, { data: dao }] = await Promise.all([
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", h.chi_nhanh_id).maybeSingle(),
    h.khach_id ? db.from("khach_hang").select("ho_ten, ma, dien_thoai, dia_chi").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("nhan_vien").select("ho_ten").eq("id", t.nguoi_id).maybeSingle(),
    db.from("thanh_toan").select("id").eq("dao_cua_id", id).maybeSingle(),
  ]);
  const so = Number(t.so_tien);
  // Khổ giấy theo Cài đặt › Thiết lập in (hoá đơn) của chi nhánh, không khoá cứng A5 (rà 15/11/2026).
  const giay = await khoGiayIn(h.chi_nhanh_id), cuon = KHO_CUON(giay);
  const dong: [string, string][] = [
    ["Khách hàng", k ? `${k.ho_ten} · ${k.ma}` : "Khách lẻ"], ...(k?.dien_thoai ? [["Điện thoại", k.dien_thoai] as [string, string]] : []),
    ["Thu nợ hoá đơn", h.sh_ma ? `${h.ma} (SalonHero ${h.sh_ma})` : h.ma], ["Hình thức", `${nhanKhoanThu(t.phuong_thuc, t.loai_vi)}${t.ngan_hang ? ` · ${t.ngan_hang}` : ""}`],
    ["Số tiền", tienVN(so)], ["Bằng chữ", docSoTien(so)], ["Nợ còn lại", tienVN(Math.max(Number(h.con_no), 0))], ...(t.ghi_chu ? [["Ghi chú", t.ghi_chu] as [string, string]] : []),
  ];
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${cuon ? `${giay.replace("mm", "")}mm auto` : giay};margin:${cuon ? "2mm" : "10mm"}}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[640px] items-center justify-between gap-3 px-6 pt-8"><p className="text-[12.5px] text-muc-3">Khổ giấy {giay} (đổi ở Cài đặt › Thiết lập in)</p><NutIn kho={giay} /></div>
      <section className={`to-in mx-auto pb-10 ${cuon ? "px-2 text-[11px]" : "px-6 text-[14px]"}`} style={{ width: "100%", maxWidth: Math.min(BE_NGANG[giay], 640) }}>
        <header className="text-center">
          <p className="font-semibold">{cn?.ten ?? "AMIA"}</p>
          {cn?.dia_chi && <p className="text-[12.5px] text-muc-2">{cn.dia_chi}</p>}
          {cn?.dien_thoai && <p className="text-[12.5px] text-muc-2">ĐT: {cn.dien_thoai}</p>}
          <h1 className="mt-4 text-[20px] font-bold tracking-wide">PHIẾU THU</h1>
          <p className="text-[13px] text-muc-2">Số: <span className="tabular-nums">{maPhieuThu(t.so_phieu)}</span> · Ngày {ngayVN(t.ngay)}</p>
          {dao && <p className="mt-1 text-[13px] font-medium text-loi">Lần trả nợ này đã bị huỷ.</p>}
        </header>
        <dl className="mt-5 space-y-1.5">
          {dong.map(([n, v]) => <div key={n} className="flex gap-2"><dt className={`${cuon ? "w-[90px]" : "w-[130px]"} shrink-0 text-muc-3`}>{n}:</dt><dd className="min-w-0 break-words font-medium">{v}</dd></div>)}
        </dl>
        <div className="mt-10 grid grid-cols-2 gap-6 text-center text-[13px]">
          <div><p className="font-semibold">Người nộp tiền</p><p className="text-muc-3">(Ký, ghi rõ họ tên)</p></div>
          <div><p className="font-semibold">Người thu tiền</p><p className="text-muc-3">(Ký, ghi rõ họ tên)</p><p className="mt-14 font-medium">{nv?.ho_ten ?? ""}</p></div>
        </div>
        <p className="mt-8 text-center text-[11.5px] text-muc-3">In lúc {ngayGioVN(new Date().toISOString())}</p>
      </section>
    </main>
  );
}
