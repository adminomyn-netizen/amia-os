import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { buoiConLai, ngayGioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { svgMaVach } from "@/lib/ma-vach";
import { ngaySinhVN } from "@/lib/ngay-sinh";
import { InNgay } from "@/components/khach/InNgay";

/** Trang in của khách, nằm ngoài /khach-hang để không dính khung hai cột.
 *  • Mặc định: tem mã khách — QR + mã vạch Code 128 + mã + tên. QR/mã vạch chỉ chứa MÃ KHÁCH, không chứa số điện thoại hay thông tin khác.
 *  • ?kieu=phieu: phiếu thông tin khách (A5/A4) để đưa khách hoặc kẹp hồ sơ giấy: liên hệ, nhóm, hạng, điểm, thẻ đang dùng. Không in ghi chú điều trị. */
export default async function TrangInMaKhach({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kieu?: string }> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const { id } = await params;
  const { kieu } = await searchParams;
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("ma, ho_ten, dien_thoai, ngay_sinh, dia_chi, tinh_thanh, quan_huyen, diem_so_du, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!k || (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const qr = await QRCode.toString(k.ma, { type: "svg", margin: 1, width: 180 });
  let maVach = "";
  try { maVach = svgMaVach(k.ma, { cao: 56, mo: 2 }); } catch { /* mã có ký tự ngoài Code 128 B: chỉ in QR */ }
  const KieuIn = <style>{"@media print{#noi-dung-chinh ~ *{display:none !important}}"}</style>; // khi in ẩn nút chat nổi, thanh tab dưới
  const nutChuyen = (
    <div className="khong-in flex w-full items-center justify-between gap-3">
      <Link href={kieu === "phieu" ? `/in-ma-khach/${id}` : `/in-ma-khach/${id}?kieu=phieu`} className="text-[13px] font-medium text-nhan-dam hover:underline">{kieu === "phieu" ? "In tem mã" : "In phiếu thông tin"}</Link>
      <InNgay />
    </div>
  );

  if (kieu !== "phieu") {
    return (
      <>
        {KieuIn}
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-8 text-center">
          {nutChuyen}
          <div aria-label={`Mã QR của khách ${k.ma}`} role="img" className="h-[180px] w-[180px]" dangerouslySetInnerHTML={{ __html: qr }} />
          {maVach && <div aria-label={`Mã vạch của khách ${k.ma}`} role="img" className="max-w-full overflow-hidden [&>svg]:h-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: maVach }} />}
          <p className="text-[20px] font-bold uppercase tracking-wide text-muc">{k.ma}</p>
          <p className="text-[14px] uppercase text-muc-2">{k.ho_ten}</p>
        </div>
      </>
    );
  }

  const [{ data: cn }, { data: nhom }, { data: vk }, { data: the }] = await Promise.all([
    k.chi_nhanh_id ? db.from("chi_nhanh").select("ten").eq("id", k.chi_nhanh_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("khach_nhom").select("nhom_khach(ten)").eq("khach_id", id),
    db.from("v_khach_hang").select("hang").eq("id", id).maybeSingle(),
    db.from("v_the_khach").select("id, ma, loai, so_buoi_con, so_buoi_tong, so_du_tien, han_dung, tinh_trang, goi_the(ten)").eq("khach_id", id).in("tinh_trang", ["hoat_dong", "sap_het"]).order("ngay_cap", { ascending: false }),
  ]);
  const tenNhom = (nhom ?? []).map((x) => (x.nhom_khach as unknown as { ten: string } | null)?.ten).filter(Boolean).join(", ");
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "in_phieu_khach", doi_tuong: "khach_hang", doi_tuong_id: id });
  const dong: [string, string][] = [
    ["Mã khách", k.ma], ["Họ tên", k.ho_ten], ["Điện thoại", k.dien_thoai], ["Ngày sinh", ngaySinhVN(k.ngay_sinh)],
    ["Địa chỉ", [k.dia_chi, ...[k.quan_huyen, k.tinh_thanh].filter((x) => x && !(k.dia_chi ?? "").includes(x))].filter(Boolean).join(", ")], ["Chi nhánh", cn?.ten ?? ""],
    ["Hạng", vk?.hang ?? ""], ["Nhóm khách", tenNhom], ["Điểm thưởng", soVN(k.diem_so_du)],
  ];
  return (
    <>
      {KieuIn}
      <div className="mx-auto max-w-[640px] px-4 py-6 text-[13px] text-muc">
        {nutChuyen}
        <div className="mt-4 flex items-start justify-between gap-4 border-b border-vien pb-3">
          <div>
            <p className="chu-tieu-de text-[18px] font-bold">AMIA · Phiếu thông tin khách hàng</p>
            <p className="text-muc-3">In lúc {ngayGioVN(new Date().toISOString())}</p>
          </div>
          <div aria-label={`Mã QR của khách ${k.ma}`} role="img" className="h-[88px] w-[88px] shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
        <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5">
          {dong.map(([a, b]) => (<div key={a} className="contents"><dt className="text-muc-3">{a}</dt><dd className="[overflow-wrap:anywhere]">{b || "—"}</dd></div>))}
        </dl>
        <h2 className="mt-5 mb-2 text-[14px] font-semibold">Thẻ đang dùng</h2>
        {(the ?? []).length === 0 ? <p className="text-muc-3">Không có thẻ đang dùng.</p> : (
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-vien text-muc-3"><th className="py-1 pr-2 font-normal">Mã thẻ</th><th className="py-1 pr-2 font-normal">Gói</th><th className="py-1 pr-2 text-right font-normal">Còn lại</th><th className="py-1 font-normal">Hạn</th></tr></thead>
            <tbody>
              {(the ?? []).map((t) => (
                <tr key={t.id} className="border-b border-vien align-top">
                  <td className="py-1 pr-2 tabular-nums">{t.ma}</td>
                  <td className="py-1 pr-2">{(t.goi_the as unknown as { ten: string } | null)?.ten ?? ""}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{t.loai === "lan" ? buoiConLai(t.so_buoi_con, t.so_buoi_tong) : tienVN(t.so_du_tien)}</td>
                  <td className="py-1">{ngayVN(t.han_dung) || "Không hạn"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {maVach && <div aria-label={`Mã vạch của khách ${k.ma}`} role="img" className="mt-5 flex justify-center [&>svg]:h-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: maVach }} />}
      </div>
    </>
  );
}
