import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";

const VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng", gioi_thieu: "Giới thiệu" };
const LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ / liệu trình" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "Chi tiết" hoa hồng của một nhân viên: từng dòng hoá đơn tạo ra doanh số và hoa hồng trong khoảng ngày (tối đa 2.000 dòng gần nhất). */
export default async function TrangChiTietHoaHong({ searchParams }: { searchParams: Promise<{ nv?: string; tu?: string; den?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("baocao.tien");
  const sp = await searchParams;
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const cn = nd.chiNhanhId ?? (sp.cn && UUID.test(sp.cn) ? sp.cn : undefined);
  const quayLai = `/hoa-hong?tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`;
  if (!sp.nv || !UUID.test(sp.nv)) return <div><Link href={quayLai} className="text-[13px] text-muc-3 hover:text-muc">← Hoa hồng</Link><p className="mt-6 text-muc-2">Không tìm thấy nhân viên.</p></div>;
  const db = sb();
  const [{ data, error }, { data: nv }] = await Promise.all([db.rpc("bc_hoa_hong_nv_chi_tiet", { p_nv: sp.nv, p_tu: tu, p_den: den, p_cn: cn as string, p_gioi_han: 2000 }), db.from("nhan_vien").select("ho_ten, chuc_danh").eq("id", sp.nv).maybeSingle()]);
  if (error) {
    console.error("[hoa-hong/chi-tiet]", error.message);
    return <div><Link href={quayLai} className="text-[13px] text-muc-3 hover:text-muc">← Hoa hồng</Link><div role="alert" className="mt-6 rounded-nho bg-loi-nen px-3.5 py-3 text-[14px] text-loi">Chưa tải được chi tiết vì hệ thống đang chậm. Chờ vài giây rồi tải lại trang.</div></div>;
  }
  const ds = data ?? [];
  const tong = Number(ds[0]?.tong_dong ?? 0);
  return (
    <div>
      <Link href={quayLai} className="text-[13px] text-muc-3 hover:text-muc">← Hoa hồng</Link>
      <TieuDeTrang tieuDe={`Chi tiết hoa hồng: ${nv?.ho_ten ?? "nhân viên"}`} phu={`${ngayVN(tu)} – ${ngayVN(den)}${nv?.chuc_danh ? ` · ${nv.chuc_danh}` : ""}`} />
      <HangChiSo muc={[{ nhan: "Số dòng", so: soVN(tong) }, { nhan: "Doanh số", so: tienVN(ds.reduce((t, r) => t + Number(r.doanh_so), 0)) }, { nhan: "Hoa hồng", so: tienVN(ds.reduce((t, r) => t + Number(r.hoa_hong), 0)) }]} />
      <div className="mt-6" />
      <Bang duLieu={ds} khoa={(r) => `${r.hoa_don_id}-${r.ten_dong}-${r.vai}-${r.doanh_so}`} trong="Không có dòng nào trong khoảng này."
        cot={[
          { nhan: "Hoá đơn", chinh: true, hienThi: (r) => <span className="block"><Link href={`/hoa-don/${r.hoa_don_id}`} className="font-medium text-nhan-dam hover:underline">{r.ma_hd}</Link><span className="block text-[12px] text-muc-3">{ngayVN(r.ngay_hd)}</span></span> },
          { nhan: "Khách", hienThi: (r) => r.khach }, { nhan: "Mặt hàng", hienThi: (r) => <span className="block"><span className="text-muc">{r.ten_dong}</span><span className="block text-[12px] text-muc-3">{LOAI[r.loai] ?? r.loai}</span></span> },
          { nhan: "Vai", hienThi: (r) => VAI[r.vai] ?? r.vai }, { nhan: "Số lượng", phai: true, hienThi: (r) => soVN(r.so_luong) },
          { nhan: "Doanh số", phai: true, hienThi: (r) => tienVN(r.doanh_so) }, { nhan: "Hoa hồng", phai: true, hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoa_hong)}</span> },
        ]} />
      {tong > ds.length && <p className="mt-3 text-[12px] text-muc-3">Hiện {soVN(ds.length)} dòng gần nhất trong {soVN(tong)} dòng; thu hẹp khoảng ngày để xem đủ.</p>}
    </div>
  );
}

