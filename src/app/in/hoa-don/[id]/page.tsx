import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_PHUONG_THUC } from "@/lib/ban-hang";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BanInHoaDon, KHO_CUON, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { docIn } from "@/lib/thiet-lap-in";
import { binNganHang, taoNoiDungVietQr } from "@/lib/vietqr";

/** Phiếu in hoá đơn: nằm ngoài khung ứng dụng để in sạch. Khổ giấy, dòng hiện/ẩn, bản sao, nội dung cuối tờ và mã QR lấy từ Cài đặt › Thiết lập in của chi nhánh. */
export default async function InHoaDon({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const { id } = await params;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("*").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: tt }, { data: cn }, { data: k }, { data: nl }, { data: ch }] = await Promise.all([
    db.from("hoa_don_dong").select("ten, loai, dich_vu_id, so_luong, don_gia, giam_gia, thanh_tien").eq("hoa_don_id", id).order("tao_luc"),
    db.from("thanh_toan").select("loai, phuong_thuc, so_tien, ngay").eq("hoa_don_id", id).order("tao_luc"),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", h.chi_nhanh_id).maybeSingle(),
    h.khach_id ? db.from("khach_hang").select("ho_ten, dien_thoai, ma, gioi_tinh, ngay_sinh, diem_so_du").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("nhan_vien").select("ho_ten").eq("id", h.nguoi_lap_id).maybeSingle(),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
  ]);
  const { cauHinh: cfg } = docIn("hoa_don", ch, h.chi_nhanh_id);
  // "In giờ phục vụ trên hoá đơn" (cờ của từng dịch vụ, Danh mục): chỉ hiển thị. Nguồn giờ: giờ vào/ra ghi trên hoá đơn → giờ của lịch hẹn gắn với đơn → không có thì không in.
  const idsDvIn = [...new Set((dong ?? []).filter((x) => x.loai === "dich_vu" && x.dich_vu_id).map((x) => x.dich_vu_id as string))];
  const [{ data: dvIn }, { data: lichIn }] = await Promise.all([
    idsDvIn.length ? db.from("dich_vu").select("id").in("id", idsDvIn).eq("in_gio_phuc_vu", true) : Promise.resolve({ data: [] as { id: string }[] }),
    h.lich_hen_id && !h.gio_vao ? db.from("lich_hen").select("bat_dau, ket_thuc").eq("id", h.lich_hen_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const dvCoGio = new Set((dvIn ?? []).map((x) => x.id));
  const gioHcm = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }) : "");
  const gioPhucVu = h.gio_vao ? [gioHcm(h.gio_vao), gioHcm(h.gio_ra)].filter(Boolean).join("–") : lichIn ? `${gioHcm(lichIn.bat_dau)}–${gioHcm(lichIn.ket_thuc)}` : "";
  let qrAnh: string | null = null;
  if (cfg.qr) {
    const bin = binNganHang(cfg.qrNganHang);
    const noiDung = cfg.qrNoiDung.trim() || (bin && cfg.qrSoTk ? taoNoiDungVietQr({ bin, soTk: cfg.qrSoTk, soTien: Number(h.con_no) > 0 ? Number(h.con_no) : 0, ghiChu: cfg.qrGhiChu || undefined }) : "");
    if (noiDung) qrAnh = await QRCode.toDataURL(noiDung, { margin: 1, width: 240 });
  }
  const d: DuLieuIn = {
    loai: "hoa_don", cuaHang: { ten: cn?.ten ?? "AMIA", diaChi: cn?.dia_chi, dienThoai: cn?.dien_thoai }, tieuDe: "Hoá đơn", ma: h.ma, ngay: h.ngay_hd, trangThai: h.trang_thai, thuNgan: nl?.ho_ten, ghiChu: h.ghi_chu,
    khach: k ? { ten: k.ho_ten, sdt: k.dien_thoai, gioiTinh: k.gioi_tinh, namSinh: k.ngay_sinh?.slice(0, 4) ?? null, diem: Number(k.diem_so_du) } : null,
    dong: (dong ?? []).map((x) => ({ ten: x.ten, soLuong: Number(x.so_luong), donGia: Number(x.don_gia), giamGia: Number(x.giam_gia), thanhTien: Number(x.thanh_tien ?? 0), gioPhucVu: x.loai === "dich_vu" && x.dich_vu_id && dvCoGio.has(x.dich_vu_id) && gioPhucVu ? gioPhucVu : undefined })),
    tongHang: Number(h.tong_hang), giamDon: Number(h.giam_gia_don), vatPct: Number(h.vat_pct), vatTien: Number(h.vat_tien), phuPhi: Number(h.phu_phi), tip: Number(h.tip), phaiThu: Number(h.tong_phai_thu),
    thanhToan: (tt ?? []).map((t) => ({ nhan: `${t.loai === "thu" ? "Đã thu" : "Hoàn"} · ${NHAN_PHUONG_THUC[t.phuong_thuc]}`, soTien: Number(t.so_tien) })),
    conNo: h.trang_thai === "hoan_thanh" ? Number(h.con_no) : 0, qrAnh,
  };
  const chuaIn = cfg.chiInHoanThanh && h.trang_thai !== "hoan_thanh";
  const giay = cfg.khoGiay;
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${KHO_CUON(giay) ? `${giay.replace("mm", "")}mm auto` : giay};margin:${KHO_CUON(giay) ? "2mm" : "12mm"}}.ban-in+.ban-in{break-before:page}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">Khổ giấy {giay}{cfg.banSao > 0 ? ` · in ${cfg.banSao + 1} bản` : ""} (đổi ở Cài đặt › Thiết lập in)</p>
        {!chuaIn && <NutIn />}
      </div>
      {chuaIn ? <p className="mx-auto max-w-[560px] px-6 py-10 text-center text-[14px] text-muc-2">Thiết lập in đang chỉ cho in hoá đơn đã hoàn thành. Hoá đơn này chưa hoàn thành nên chưa in được.</p>
        : Array.from({ length: 1 + cfg.banSao }, (_, i) => <div key={i} className="ban-in"><BanInHoaDon cfg={cfg} d={d} /></div>)}
    </main>
  );
}
