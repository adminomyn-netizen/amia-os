import "server-only";
import QRCode from "qrcode";
import type { sb } from "@/lib/db";
import { nhanKhoanThu } from "@/lib/ban-hang";
import { docSoTien } from "@/lib/phieu-thu";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { CHU_IN, PHUONG_THUC_EN, type DuLieuIn, type NgonNguIn } from "@/components/cai-dat/BanInHoaDon";
import { docIn, type CauHinhIn } from "@/lib/thiet-lap-in";
import { binNganHang, taoNoiDungVietQr } from "@/lib/vietqr";
import { CO_SO, moTaThe, nhanTrangThaiHd, tenDongIn, tienTruThe } from "@/lib/in-hoa-don";
import type { Tables } from "@/lib/supabase/database.types";

type Db = ReturnType<typeof sb>;
export type ToIn = { id: string; cfg: CauHinhIn; d: DuLieuIn | null };

const gioHcm = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }) : "");
const KHONG_CO = ["00000000-0000-0000-0000-000000000000"];
const coId = (ids: string[]) => (ids.length ? ids : KHONG_CO);

/** Dựng dữ liệu tờ in cho một hoặc nhiều hoá đơn (trang /in/hoa-don/[id] và /in/hoa-don-nhieu dùng chung), đọc theo lô.
 *  Theo mẫu SalonHero: đầu tờ (cơ sở, chi nhánh, địa chỉ, giấy phép), tình trạng thanh toán, dòng "(N. viên: …)", "Sử dụng <dịch vụ>",
 *  thanh toán theo hình thức, số tiền bằng chữ, tiền trừ thẻ và tình trạng thẻ. Chỉ đọc. `nnEp` = ngôn ngữ ép theo ?nn (không có thì theo Thiết lập in). */
export async function dungToInHoaDon(db: Db, hds: Tables<"hoa_don">[], nnEp?: NgonNguIn): Promise<ToIn[]> {
  const idsHd = hds.map((h) => h.id);
  const idsKh = [...new Set(hds.map((h) => h.khach_id).filter((x): x is string => !!x))];
  const idsCn = [...new Set(hds.map((h) => h.chi_nhanh_id))];
  const idsNl = [...new Set(hds.map((h) => h.nguoi_lap_id).filter((x): x is string => !!x))];
  const idsLich = [...new Set(hds.filter((h) => h.lich_hen_id && !h.gio_vao).map((h) => h.lich_hen_id as string))];
  const [{ data: dong }, { data: tt }, { data: cn }, { data: kh }, { data: nl }, { data: ch }, { data: lich }, { data: ch1 }, { data: soCai }] = await Promise.all([
    db.from("hoa_don_dong").select("id, hoa_don_id, ten, loai, dich_vu_id, goi_id, so_luong, don_gia, giam_gia, thanh_tien, ghi_chu, the_khach_sh_id").in("hoa_don_id", coId(idsHd)).order("tao_luc"),
    db.from("thanh_toan").select("hoa_don_id, loai, phuong_thuc, loai_vi, so_tien, the_id").in("hoa_don_id", coId(idsHd)).order("tao_luc"),
    db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai").in("id", coId(idsCn)),
    db.from("khach_hang").select("id, ho_ten, dien_thoai, gioi_tinh, ngay_sinh, diem_so_du").in("id", coId(idsKh)),
    db.from("nhan_vien").select("id, ho_ten").in("id", coId(idsNl)),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
    db.from("lich_hen").select("id, bat_dau, ket_thuc").in("id", coId(idsLich)),
    db.from("cua_hang").select("ten_phap_nhan, dien_thoai").eq("id", 1).maybeSingle(),
    db.from("the_so_cai").select("hoa_don_id, the_id").in("hoa_don_id", coId(idsHd)),
  ]);
  const dsDong = dong ?? [], dsTt = tt ?? [];
  const idsDv = [...new Set(dsDong.filter((x) => x.loai === "dich_vu" && x.dich_vu_id).map((x) => x.dich_vu_id as string))];
  const idsDong = dsDong.map((x) => x.id);
  const shThe = [...new Set(dsDong.map((x) => x.the_khach_sh_id).filter((x): x is number => x != null))];

  // Thẻ dính tới đơn: thẻ trả bằng thẻ tiền (thanh_toan.the_id), sổ cái thẻ ghi số đơn, thẻ cấp từ dòng của đơn, thẻ dùng buổi trên dòng SalonHero (the_khach_sh_id).
  // Đơn SalonHero có tiền trừ thẻ nhưng không ghi thẻ nào, và thẻ bán trên đơn SalonHero (không nối dòng) → đối chiếu thẻ của khách: thẻ tiền cấp trước/đúng ngày đơn, thẻ cùng gói cấp đúng ngày đơn.
  const THE_COT = "id, ma, loai, goi_id, khach_id, ngay_cap, so_buoi_con, so_buoi_tong, so_du_tien, hoa_don_dong_id, sh_id";
  const [{ data: dvIn }, { data: theTheoId }, { data: theTheoSh }, { data: theCuaKhach }] = await Promise.all([
    idsDv.length ? db.from("dich_vu").select("id").in("id", idsDv).eq("in_gio_phuc_vu", true) : Promise.resolve({ data: [] as { id: string }[] }),
    db.from("v_the_khach").select(THE_COT).in("id", coId([...new Set([...dsTt.map((t) => t.the_id), ...(soCai ?? []).map((x) => x.the_id)].filter((x): x is string => !!x))])),
    shThe.length ? db.from("v_the_khach").select(THE_COT).in("sh_id", shThe) : Promise.resolve({ data: [] }),
    idsKh.length && hds.some((h) => h.la_lich_su) ? db.from("v_the_khach").select(THE_COT).in("khach_id", idsKh).lte("ngay_cap", hds.reduce((a, h) => (h.ngay_hd > a ? h.ngay_hd : a), "")) : Promise.resolve({ data: [] }),
  ]);
  // Thẻ cấp từ dòng của đơn: đọc theo lô 300 dòng (in nhiều đơn một lần).
  const theTheoDong: NonNullable<typeof theTheoId> = [];
  for (let i = 0; i < idsDong.length; i += 300) {
    const { data } = await db.from("v_the_khach").select(THE_COT).in("hoa_don_dong_id", idsDong.slice(i, i + 300));
    theTheoDong.push(...(data ?? []));
  }
  const tatCaThe = [...(theTheoId ?? []), ...(theTheoSh ?? []), ...(theCuaKhach ?? []), ...theTheoDong];
  const idsGoi = [...new Set(tatCaThe.map((t) => t.goi_id).filter((x): x is string => !!x))];
  const { data: goi } = idsGoi.length ? await db.from("goi_the").select("id, ten").in("id", idsGoi) : { data: [] as { id: string; ten: string }[] };
  const tenGoi = new Map((goi ?? []).map((g) => [g.id, g.ten]));

  // "Hiển thị nhân viên phục vụ": người gán trên từng dòng (dong_nhan_vien: phục vụ, rồi bán, rồi tư vấn). Đọc theo lô 500 dòng.
  const nvTheoDong = new Map<string, string[]>();
  const THU_TU: Record<string, number> = { phuc_vu: 0, ban: 1, tu_van: 2 };
  for (let i = 0; i < idsDong.length; i += 500) {
    const { data: gan } = await db.from("dong_nhan_vien").select("dong_id, vai, nhan_vien(ho_ten)").in("dong_id", idsDong.slice(i, i + 500));
    for (const g of [...(gan ?? [])].sort((a, b) => (THU_TU[a.vai] ?? 9) - (THU_TU[b.vai] ?? 9))) {
      const ten = g.nhan_vien?.ho_ten;
      if (!ten) continue;
      const ds = nvTheoDong.get(g.dong_id) ?? [];
      if (!ds.includes(ten)) ds.push(ten);
      nvTheoDong.set(g.dong_id, ds);
    }
  }
  const dvCoGio = new Set((dvIn ?? []).map((x) => x.id));
  const mCn = new Map((cn ?? []).map((x) => [x.id, x]));
  const mKh = new Map((kh ?? []).map((x) => [x.id, x]));
  const mNl = new Map((nl ?? []).map((x) => [x.id, x.ho_ten]));
  const mLich = new Map((lich ?? []).map((x) => [x.id, x]));
  const homNay = homNayHCM();

  return Promise.all(hds.map(async (h): Promise<ToIn> => {
    const { cauHinh: cfg } = docIn("hoa_don", ch, h.chi_nhanh_id);
    if (cfg.chiInHoanThanh && h.trang_thai !== "hoan_thanh") return { id: h.id, cfg, d: null };
    const nn = nnEp ?? cfg.ngonNgu, chu = CHU_IN[nn];
    const c = mCn.get(h.chi_nhanh_id), k = h.khach_id ? mKh.get(h.khach_id) : undefined;
    const li = h.lich_hen_id ? mLich.get(h.lich_hen_id) : undefined;
    const gioPhucVu = h.gio_vao ? [gioHcm(h.gio_vao), gioHcm(h.gio_ra)].filter(Boolean).join("–") : li ? `${gioHcm(li.bat_dau)}–${gioHcm(li.ket_thuc)}` : "";
    let qrAnh: string | null = null;
    if (cfg.qr) {
      const bin = binNganHang(cfg.qrNganHang);
      const noiDung = cfg.qrNoiDung.trim() || (bin && cfg.qrSoTk ? taoNoiDungVietQr({ bin, soTk: cfg.qrSoTk, soTien: Number(h.con_no) > 0 ? Number(h.con_no) : 0, ghiChu: cfg.qrGhiChu || undefined }) : "");
      if (noiDung) qrAnh = await QRCode.toDataURL(noiDung, { margin: 1, width: 240 });
    }
    const dongHd = dsDong.filter((x) => x.hoa_don_id === h.id);
    const ttHd = dsTt.filter((t) => t.hoa_don_id === h.id);
    const truThe = tienTruThe(h.la_lich_su, h.tien_tru_the, ttHd);
    const daThu = ttHd.filter((t) => t.phuong_thuc !== "the_tien").reduce((a, t) => a + (t.loai === "thu" ? 1 : -1) * Number(t.so_tien), 0);

    // Thẻ của đơn này (giữ thứ tự: dùng buổi → trừ tiền → cấp mới), mỗi thẻ một lần.
    const idsDongHd = new Set(dongHd.map((x) => x.id));
    const shHd = new Set(dongHd.map((x) => x.the_khach_sh_id).filter((x) => x != null));
    const idTheTt = new Set([...ttHd.map((t) => t.the_id), ...(soCai ?? []).filter((x) => x.hoa_don_id === h.id).map((x) => x.the_id)].filter(Boolean));
    const goiBan = new Set(dongHd.filter((x) => x.loai === "goi_the" && x.goi_id).map((x) => x.goi_id));
    const cuaKhach = h.la_lich_su && h.khach_id ? tatCaThe.filter((t) => t.khach_id === h.khach_id && t.ngay_cap && t.ngay_cap <= h.ngay_hd) : [];
    const theHd = [
      ...tatCaThe.filter((t) => t.sh_id != null && shHd.has(t.sh_id)),
      ...tatCaThe.filter((t) => t.id && idTheTt.has(t.id)),
      // Đơn SalonHero trừ tiền thẻ mà không ghi thẻ nào: thẻ tiền của khách cấp trước/đúng ngày đơn.
      ...(truThe > 0 && !ttHd.some((t) => t.the_id) ? cuaKhach.filter((t) => t.loai === "tien") : []),
      ...tatCaThe.filter((t) => t.hoa_don_dong_id && idsDongHd.has(t.hoa_don_dong_id)),
      ...cuaKhach.filter((t) => t.ngay_cap === h.ngay_hd && t.goi_id && goiBan.has(t.goi_id)),
    ];
    const daCo = new Set<string>();
    const tinhTrang = theHd.filter((t) => t.id && !daCo.has(t.id) && daCo.add(t.id)).map((t) => moTaThe({ ten: tenGoi.get(t.goi_id ?? "") ?? "Thẻ", ma: t.ma ?? "", loai: t.loai ?? "lan", buoiCon: Number(t.so_buoi_con ?? 0), buoiTong: t.so_buoi_tong == null ? null : Number(t.so_buoi_tong), soDu: Number(t.so_du_tien ?? 0) }, nn));

    const d: DuLieuIn = {
      loai: "hoa_don", nn, ma: h.ma, ngay: h.ngay_hd, gio: gioHcm(h.tao_luc), tieuDe: chu.hoaDon, trangThai: h.trang_thai,
      trangThaiNhan: nhanTrangThaiHd(h.trang_thai, Number(h.con_no), daThu, nn),
      cuaHang: { ten: c?.ten ?? "AMIA", tenCoSo: ch1?.ten_phap_nhan || CO_SO.ten, phu: `${CO_SO.linhVuc} · ${nn === "en" ? "License" : "Giấy phép"} ${CO_SO.giayPhep}`, diaChi: c?.dia_chi, dienThoai: c?.dien_thoai ?? ch1?.dien_thoai },
      // Đơn chuyển từ SalonHero: in tên thu ngân thật (thu_ngan_ten), không phải tài khoản hệ thống.
      thuNgan: h.la_lich_su ? h.thu_ngan_ten : mNl.get(h.nguoi_lap_id ?? ""), ghiChu: h.ghi_chu, gioVaoRa: gioPhucVu.replace("–", " – ") || null,
      khach: k ? { ten: k.ho_ten, sdt: k.dien_thoai, gioiTinh: k.gioi_tinh, namSinh: k.ngay_sinh?.slice(0, 4) ?? null, diem: Number(k.diem_so_du) } : null,
      dong: dongHd.map((x) => ({ ten: tenDongIn(x.ten, x.loai === "dich_vu" && x.the_khach_sh_id != null, nn), ghiChu: x.ghi_chu, soLuong: Number(x.so_luong), donGia: Number(x.don_gia), giamGia: Number(x.giam_gia), thanhTien: Number(x.thanh_tien ?? 0), nhanVien: nvTheoDong.get(x.id),
        gioPhucVu: x.loai === "dich_vu" && x.dich_vu_id && dvCoGio.has(x.dich_vu_id) && gioPhucVu ? gioPhucVu : undefined })),
      tongHang: Number(h.tong_hang), giamDon: Number(h.giam_gia_don), vatPct: Number(h.vat_pct), vatTien: Number(h.vat_tien), phuPhi: Number(h.phu_phi), tip: Number(h.tip), phaiThu: Number(h.tong_phai_thu),
      // Tiền trừ thẻ tiền in ở dòng "Tổng tiền trừ vào thẻ" như SalonHero, không lặp ở danh sách thanh toán.
      thanhToan: ttHd.filter((t) => t.phuong_thuc !== "the_tien").map((t) => ({ nhan: `${t.loai === "thu" ? chu.thanhToan : chu.hoan} - ${nn === "en" ? PHUONG_THUC_EN[t.phuong_thuc] ?? t.phuong_thuc : nhanKhoanThu(t.phuong_thuc, t.loai_vi)}`, soTien: Number(t.so_tien) })),
      // Tiền khách đưa / trả lại (khi thu ngân nhập lúc chốt): trả lại = khách đưa − tiền mặt đã thu của đơn.
      khachDua: h.khach_dua, traLai: h.khach_dua != null ? Math.max(Number(h.khach_dua) - ttHd.filter((t) => t.phuong_thuc === "tien_mat").reduce((a, t) => a + (t.loai === "thu" ? 1 : -1) * Number(t.so_tien), 0), 0) : null,
      conNo: h.trang_thai === "hoan_thanh" ? Number(h.con_no) : 0, qrAnh,
      bangChu: nn === "vi" ? docSoTien(Number(h.tong_phai_thu)) : null,
      tienTruThe: truThe, theSauTt: tinhTrang,
      // Không có ảnh chụp số dư lúc thanh toán (sổ cái chưa ghi số đơn) → in số dư hiện tại; đơn cũ ghi rõ "đến ngày in".
      nhanTheSauTt: h.ngay_hd >= homNay ? chu.theSauTt : `${chu.theDenNgay} ${ngayVN(homNay)}:`,
    };
    return { id: h.id, cfg, d };
  }));
}
