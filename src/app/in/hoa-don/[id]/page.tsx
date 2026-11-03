import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { nhanKhoanThu } from "@/lib/ban-hang";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BanInHoaDon, CHU_IN, KHO_CUON, PHUONG_THUC_EN, type DuLieuIn } from "@/components/cai-dat/BanInHoaDon";
import { docIn } from "@/lib/thiet-lap-in";
import { binNganHang, taoNoiDungVietQr } from "@/lib/vietqr";

/** Phiếu in hoá đơn: nằm ngoài khung ứng dụng để in sạch. Khổ giấy, dòng hiện/ẩn, bản sao, nội dung cuối tờ và mã QR lấy từ Cài đặt › Thiết lập in của chi nhánh. */
export default async function InHoaDon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nn?: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const { id } = await params;
  // ?nn=en: bản in tiếng Anh (Thu ngân "In hoá đơn sau khi hoàn thành" chọn Việt / Anh như SalonHero).
  // Không có ?nn thì theo ô "Ngôn ngữ" của Cài đặt › Thiết lập in (như SalonHero).
  const nnUrl = (await searchParams).nn;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("*").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: tt }, { data: cn }, { data: k }, { data: nl }, { data: ch }] = await Promise.all([
    db.from("hoa_don_dong").select("id, ten, loai, dich_vu_id, so_luong, don_gia, giam_gia, thanh_tien, ghi_chu").eq("hoa_don_id", id).order("tao_luc"),
    db.from("thanh_toan").select("loai, phuong_thuc, loai_vi, so_tien, ngay").eq("hoa_don_id", id).order("tao_luc"),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", h.chi_nhanh_id).maybeSingle(),
    h.khach_id ? db.from("khach_hang").select("ho_ten, dien_thoai, ma, gioi_tinh, ngay_sinh, diem_so_du").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    // Đơn chuyển từ SalonHero: người lập là tài khoản hệ thống "Dữ liệu SalonHero" → in tên thu ngân thật (thu_ngan_ten), như danh sách và trang chi tiết.
    db.from("nhan_vien").select("ho_ten").eq("id", h.nguoi_lap_id).maybeSingle(),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
  ]);
  const { cauHinh: cfg } = docIn("hoa_don", ch, h.chi_nhanh_id);
  const nn = nnUrl === "en" || nnUrl === "vi" ? nnUrl : cfg.ngonNgu;
  const chu = CHU_IN[nn];
  // "Hiển thị nhân viên phục vụ": người được gán trên từng dòng (dong_nhan_vien: phục vụ, rồi bán, rồi tư vấn), in "(NV: A, B)" như SalonHero.
  const nvTheoDong = new Map<string, string[]>();
  if (cfg.nhanVienPhucVu && (dong ?? []).length) {
    const { data: gan } = await db.from("dong_nhan_vien").select("dong_id, vai, nhan_vien(ho_ten)").in("dong_id", (dong ?? []).map((x) => x.id));
    const THU_TU: Record<string, number> = { phuc_vu: 0, ban: 1, tu_van: 2 };
    for (const g of [...(gan ?? [])].sort((a, b) => (THU_TU[a.vai] ?? 9) - (THU_TU[b.vai] ?? 9))) {
      const ten = g.nhan_vien?.ho_ten;
      if (!ten) continue;
      const ds = nvTheoDong.get(g.dong_id) ?? [];
      if (!ds.includes(ten)) ds.push(ten);
      nvTheoDong.set(g.dong_id, ds);
    }
  }
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
    loai: "hoa_don", cuaHang: { ten: cn?.ten ?? "AMIA", diaChi: cn?.dia_chi, dienThoai: cn?.dien_thoai }, tieuDe: chu.hoaDon, ma: h.ma, nn, ngay: h.ngay_hd, trangThai: h.trang_thai, thuNgan: h.la_lich_su ? h.thu_ngan_ten : nl?.ho_ten, ghiChu: h.ghi_chu, gioVaoRa: gioPhucVu.replace("–", " – ") || null,
    khach: k ? { ten: k.ho_ten, sdt: k.dien_thoai, gioiTinh: k.gioi_tinh, namSinh: k.ngay_sinh?.slice(0, 4) ?? null, diem: Number(k.diem_so_du) } : null,
    dong: (dong ?? []).map((x) => ({ ten: x.ten, ghiChu: x.ghi_chu, soLuong: Number(x.so_luong), donGia: Number(x.don_gia), giamGia: Number(x.giam_gia), thanhTien: Number(x.thanh_tien ?? 0), nhanVien: nvTheoDong.get(x.id), gioPhucVu: x.loai === "dich_vu" && x.dich_vu_id && dvCoGio.has(x.dich_vu_id) && gioPhucVu ? gioPhucVu : undefined })),
    tongHang: Number(h.tong_hang), giamDon: Number(h.giam_gia_don), vatPct: Number(h.vat_pct), vatTien: Number(h.vat_tien), phuPhi: Number(h.phu_phi), tip: Number(h.tip), phaiThu: Number(h.tong_phai_thu),
    thanhToan: (tt ?? []).map((t) => ({ nhan: `${t.loai === "thu" ? chu.daThu : chu.hoan} · ${nn === "en" ? PHUONG_THUC_EN[t.phuong_thuc] ?? t.phuong_thuc : nhanKhoanThu(t.phuong_thuc, t.loai_vi)}`, soTien: Number(t.so_tien) })),
    // Tiền khách đưa / trả lại (khi thu ngân nhập lúc chốt): trả lại = khách đưa − tiền mặt đã thu của đơn.
    khachDua: h.khach_dua, traLai: h.khach_dua != null ? Math.max(Number(h.khach_dua) - (tt ?? []).filter((t) => t.phuong_thuc === "tien_mat").reduce((a, t) => a + (t.loai === "thu" ? 1 : -1) * Number(t.so_tien), 0), 0) : null,
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
