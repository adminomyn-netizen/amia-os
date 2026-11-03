import QRCode from "qrcode";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { nhanKhoanThu } from "@/lib/ban-hang";
import { docIds } from "@/lib/loc-hoa-don";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BanInHoaDon, KHO_CUON, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { docIn, type CauHinhIn } from "@/lib/thiet-lap-in";
import { binNganHang, taoNoiDungVietQr } from "@/lib/vietqr";

/** In NHIỀU hoá đơn một lần (ô chọn nhiều ở danh sách hoá đơn, như SalonHero). Mỗi hoá đơn một tờ, cùng mẫu với /in/hoa-don/[id]
 *  (khổ giấy, dòng hiện/ẩn, bản sao, QR theo Thiết lập in của chi nhánh từng đơn). Người gắn chi nhánh chỉ in được đơn chi nhánh mình. */
export default async function InNhieuHoaDon({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const ids = docIds((await searchParams).ids);
  const db = sb();
  let qh = db.from("hoa_don").select("*").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  if (nd.chiNhanhId) qh = qh.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data: hds } = await qh.order("ngay_hd").order("tao_luc");
  const ds = hds ?? [];
  const idsHd = ds.map((h) => h.id);
  const idsKh = [...new Set(ds.map((h) => h.khach_id).filter((x): x is string => !!x))];
  const idsCn = [...new Set(ds.map((h) => h.chi_nhanh_id))];
  const idsNl = [...new Set(ds.map((h) => h.nguoi_lap_id).filter((x): x is string => !!x))];
  const idsLich = [...new Set(ds.filter((h) => h.lich_hen_id && !h.gio_vao).map((h) => h.lich_hen_id as string))];
  const [{ data: dong }, { data: tt }, { data: cn }, { data: kh }, { data: nl }, { data: ch }, { data: lich }] = await Promise.all([
    idsHd.length ? db.from("hoa_don_dong").select("hoa_don_id, ten, loai, dich_vu_id, so_luong, don_gia, giam_gia, thanh_tien").in("hoa_don_id", idsHd).order("tao_luc") : Promise.resolve({ data: [] }),
    idsHd.length ? db.from("thanh_toan").select("hoa_don_id, loai, phuong_thuc, loai_vi, so_tien").in("hoa_don_id", idsHd).order("tao_luc") : Promise.resolve({ data: [] }),
    idsCn.length ? db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai").in("id", idsCn) : Promise.resolve({ data: [] }),
    idsKh.length ? db.from("khach_hang").select("id, ho_ten, dien_thoai, gioi_tinh, ngay_sinh, diem_so_du").in("id", idsKh) : Promise.resolve({ data: [] }),
    idsNl.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idsNl) : Promise.resolve({ data: [] }),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
    idsLich.length ? db.from("lich_hen").select("id, bat_dau, ket_thuc").in("id", idsLich) : Promise.resolve({ data: [] }),
  ]);
  const idsDv = [...new Set((dong ?? []).filter((x) => x.loai === "dich_vu" && x.dich_vu_id).map((x) => x.dich_vu_id as string))];
  const { data: dvIn } = idsDv.length ? await db.from("dich_vu").select("id").in("id", idsDv).eq("in_gio_phuc_vu", true) : { data: [] as { id: string }[] };
  const dvCoGio = new Set((dvIn ?? []).map((x) => x.id));
  const mCn = new Map((cn ?? []).map((x) => [x.id, x]));
  const mKh = new Map((kh ?? []).map((x) => [x.id, x]));
  const mNl = new Map((nl ?? []).map((x) => [x.id, x.ho_ten]));
  const mLich = new Map((lich ?? []).map((x) => [x.id, x]));
  const gioHcm = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }) : "");

  const to: { id: string; cfg: CauHinhIn; d: DuLieuIn | null }[] = await Promise.all(ds.map(async (h) => {
    const { cauHinh: cfg } = docIn("hoa_don", ch, h.chi_nhanh_id);
    if (cfg.chiInHoanThanh && h.trang_thai !== "hoan_thanh") return { id: h.id, cfg, d: null };
    const c = mCn.get(h.chi_nhanh_id), k = h.khach_id ? mKh.get(h.khach_id) : undefined;
    const li = h.lich_hen_id ? mLich.get(h.lich_hen_id) : undefined;
    const gioPhucVu = h.gio_vao ? [gioHcm(h.gio_vao), gioHcm(h.gio_ra)].filter(Boolean).join("–") : li ? `${gioHcm(li.bat_dau)}–${gioHcm(li.ket_thuc)}` : "";
    let qrAnh: string | null = null;
    if (cfg.qr) {
      const bin = binNganHang(cfg.qrNganHang);
      const noiDung = cfg.qrNoiDung.trim() || (bin && cfg.qrSoTk ? taoNoiDungVietQr({ bin, soTk: cfg.qrSoTk, soTien: Number(h.con_no) > 0 ? Number(h.con_no) : 0, ghiChu: cfg.qrGhiChu || undefined }) : "");
      if (noiDung) qrAnh = await QRCode.toDataURL(noiDung, { margin: 1, width: 240 });
    }
    const d: DuLieuIn = {
      loai: "hoa_don", cuaHang: { ten: c?.ten ?? "AMIA", diaChi: c?.dia_chi, dienThoai: c?.dien_thoai }, tieuDe: "Hoá đơn", ma: h.ma, ngay: h.ngay_hd, trangThai: h.trang_thai,
      // Đơn chuyển từ SalonHero: in tên thu ngân thật (thu_ngan_ten), không phải tài khoản hệ thống.
      thuNgan: h.la_lich_su ? h.thu_ngan_ten : mNl.get(h.nguoi_lap_id ?? ""), ghiChu: h.ghi_chu,
      khach: k ? { ten: k.ho_ten, sdt: k.dien_thoai, gioiTinh: k.gioi_tinh, namSinh: k.ngay_sinh?.slice(0, 4) ?? null, diem: Number(k.diem_so_du) } : null,
      dong: (dong ?? []).filter((x) => x.hoa_don_id === h.id).map((x) => ({ ten: x.ten, soLuong: Number(x.so_luong), donGia: Number(x.don_gia), giamGia: Number(x.giam_gia), thanhTien: Number(x.thanh_tien ?? 0),
        gioPhucVu: x.loai === "dich_vu" && x.dich_vu_id && dvCoGio.has(x.dich_vu_id) && gioPhucVu ? gioPhucVu : undefined })),
      tongHang: Number(h.tong_hang), giamDon: Number(h.giam_gia_don), vatPct: Number(h.vat_pct), vatTien: Number(h.vat_tien), phuPhi: Number(h.phu_phi), tip: Number(h.tip), phaiThu: Number(h.tong_phai_thu),
      thanhToan: (tt ?? []).filter((t) => t.hoa_don_id === h.id).map((t) => ({ nhan: `${t.loai === "thu" ? "Đã thu" : "Hoàn"} · ${nhanKhoanThu(t.phuong_thuc, t.loai_vi)}`, soTien: Number(t.so_tien) })),
      conNo: h.trang_thai === "hoan_thanh" ? Number(h.con_no) : 0, qrAnh,
    };
    return { id: h.id, cfg, d };
  }));
  const coIn = to.filter((x) => x.d);
  const boQua = to.length - coIn.length;
  const giay = coIn[0]?.cfg.khoGiay ?? "A5";
  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${KHO_CUON(giay) ? `${giay.replace("mm", "")}mm auto` : giay};margin:${KHO_CUON(giay) ? "2mm" : "12mm"}}.ban-in+.ban-in{break-before:page}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">{coIn.length} hoá đơn · khổ giấy {giay}{boQua > 0 ? ` · bỏ qua ${boQua} đơn chưa hoàn thành (Thiết lập in chỉ cho in đơn hoàn thành)` : ""}{ids.length > ds.length ? ` · ${ids.length - ds.length} đơn không xem được` : ""}</p>
        {coIn.length > 0 && <NutIn />}
      </div>
      {coIn.length === 0 ? <p className="mx-auto max-w-[560px] px-6 py-10 text-center text-[14px] text-muc-2">Chưa có hoá đơn nào để in. Quay lại danh sách hoá đơn và chọn đơn cần in.</p>
        : coIn.flatMap((x) => Array.from({ length: 1 + x.cfg.banSao }, (_, i) => <div key={`${x.id}-${i}`} className="ban-in"><BanInHoaDon cfg={x.cfg} d={x.d as DuLieuIn} /></div>))}
    </main>
  );
}
