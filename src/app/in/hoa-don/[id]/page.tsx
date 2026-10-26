import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { NHAN_PHUONG_THUC } from "@/lib/ban-hang";
import { NutIn } from "@/components/hoa-don/NutIn";

/** Phiếu in hoá đơn khổ A5/A4: nằm ngoài khung ứng dụng để in sạch. */
export default async function InHoaDon({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const { id } = await params;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("*").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: tt }, { data: cn }, { data: k }, { data: nl }] = await Promise.all([
    db.from("hoa_don_dong").select("ten, so_luong, don_gia, giam_gia, thanh_tien").eq("hoa_don_id", id).order("tao_luc"),
    db.from("thanh_toan").select("loai, phuong_thuc, so_tien, ngay").eq("hoa_don_id", id).order("tao_luc"),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", h.chi_nhanh_id).maybeSingle(),
    h.khach_id ? db.from("khach_hang").select("ho_ten, dien_thoai, ma").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("nhan_vien").select("ho_ten").eq("id", h.nguoi_lap_id).maybeSingle(),
  ]);
  return (
    <main data-theme="light" className="mx-auto max-w-[560px] bg-white px-6 py-8 text-[13px] text-muc">
      <div className="khong-in mb-4 flex justify-end"><NutIn /></div>
      <header className="text-center">
        <h1 className="chu-tieu-de text-[22px]">{cn?.ten ?? "AMIA"}</h1>
        {cn?.dia_chi && <p className="text-muc-2">{cn.dia_chi}</p>}{cn?.dien_thoai && <p className="text-muc-2">Điện thoại: {cn.dien_thoai}</p>}
        <p className="mt-3 text-[15px] font-semibold uppercase tracking-wide">Hoá đơn {h.ma}</p>
        <p className="text-muc-2">{ngayVN(h.ngay_hd)} · Thu ngân: {nl?.ho_ten}</p>
        {k && <p className="text-muc-2">Khách: {k.ho_ten} · {k.dien_thoai}</p>}
      </header>
      <table className="mt-4 w-full text-left">
        <thead><tr className="border-b border-muc"><th className="py-1.5 font-medium">Mục</th><th className="py-1.5 text-right font-medium">SL</th><th className="py-1.5 text-right font-medium">Đơn giá</th><th className="py-1.5 text-right font-medium">Thành tiền</th></tr></thead>
        <tbody>{(dong ?? []).map((d, i) => (<tr key={i} className="border-b border-vien align-top"><td className="py-1.5 pr-2">{d.ten}{d.giam_gia ? <span className="block text-[12px] text-muc-3">Giảm {tienVN(d.giam_gia)}</span> : null}</td><td className="py-1.5 text-right tabular-nums">{d.so_luong}</td><td className="py-1.5 text-right tabular-nums">{tienVN(d.don_gia)}</td><td className="py-1.5 text-right tabular-nums">{tienVN(d.thanh_tien)}</td></tr>))}</tbody>
      </table>
      <dl className="ml-auto mt-3 w-full max-w-[260px] space-y-1">
        <div className="flex justify-between"><dt>Tiền hàng</dt><dd className="tabular-nums">{tienVN(h.tong_hang)}</dd></div>
        {Number(h.giam_gia_don) > 0 && <div className="flex justify-between"><dt>Giảm giá</dt><dd className="tabular-nums">− {tienVN(h.giam_gia_don)}</dd></div>}
        {Number(h.vat_tien) > 0 && <div className="flex justify-between"><dt>VAT {Number(h.vat_pct)}%</dt><dd className="tabular-nums">{tienVN(h.vat_tien)}</dd></div>}
        {Number(h.phu_phi) > 0 && <div className="flex justify-between"><dt>Phụ phí</dt><dd className="tabular-nums">{tienVN(h.phu_phi)}</dd></div>}
        {Number(h.tip) > 0 && <div className="flex justify-between"><dt>Tip</dt><dd className="tabular-nums">{tienVN(h.tip)}</dd></div>}
        <div className="flex justify-between border-t border-muc pt-1 text-[15px] font-semibold"><dt>Phải thu</dt><dd className="tabular-nums">{tienVN(h.tong_phai_thu)}</dd></div>
        {(tt ?? []).map((t, i) => (<div key={i} className="flex justify-between text-muc-2"><dt>{t.loai === "thu" ? "Đã thu" : "Hoàn"} · {NHAN_PHUONG_THUC[t.phuong_thuc]}</dt><dd className="tabular-nums">{tienVN(t.so_tien)}</dd></div>))}
        {Number(h.con_no) > 0 && h.trang_thai === "hoan_thanh" && <div className="flex justify-between font-semibold"><dt>Còn nợ</dt><dd className="tabular-nums">{tienVN(h.con_no)}</dd></div>}
      </dl>
      <p className="mt-6 text-center text-[12px] text-muc-3">Cảm ơn quý khách đã tin tưởng AMIA.</p>
    </main>
  );
}
