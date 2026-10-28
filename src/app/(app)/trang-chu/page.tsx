import Link from "next/link";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { Suspense } from "react";
import { sb } from "@/lib/db";
import { chiNhanhHoatDong, tatCaChiNhanh } from "@/lib/chi-nhanh";
import { layCanhBao } from "@/lib/canh-bao";
import { congNgay, gioVN, homNayHCM, ngayVN, soVN, tienGon, tienVN } from "@/lib/dinh-dang";
import { coQuyen, NHAN_VAI_TRO, type VaiTro } from "@/lib/quyen";
import { DongHo } from "@/components/layout/DongHo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { BangHieuSuatApp } from "@/components/trang-chu/BangHieuSuatApp";
import { doHieuSuatApp, mocDo } from "@/lib/do-hieu-suat";
import { BangDieuHanh } from "@/components/trang-chu/BangDieuHanh";
import { BaoCaoSang } from "@/components/trang-chu/BaoCaoSang";
import type { SoLieu } from "@/components/trang-chu/BangSoLieu";

const LOI_TAT = [
  { href: "/nhan-su/cham-cong", nhan: "Chấm công", q: "noibo.dung" as const },
  { href: "/lich-hen", nhan: "Đặt lịch hẹn", q: "lich.sua" as const }, { href: "/ban-hang", nhan: "Bán hàng", q: "ban.tao" as const },
  { href: "/khach-hang", nhan: "Tìm khách", q: "khach.xem" as const }, { href: "/hoa-don", nhan: "Thu nợ", q: "no.thu" as const },
  { href: "/the", nhan: "Thẻ liệu trình", q: "the.thuchien" as const }, { href: "/phieu-cap", nhan: "Phiếu cấp vật tư", q: "phieu.xem" as const },
];

/** Mỗi vai trò thấy một câu "việc chính của tôi" ngay dưới lời chào, để biết mình cần nhìn gì trước. */
const VIEC_CHINH: Partial<Record<VaiTro, string>> = {
  chu: "Toàn cảnh cửa hàng hôm nay, việc cần Chủ duyệt và các thiết lập hệ thống.",
  ky_thuat: "Tình trạng hệ thống, tài khoản và các thiết lập cần xử lý.",
  quan_ly: "Doanh thu, lịch hẹn và các việc cần duyệt của chi nhánh.",
  le_tan: "Lịch hẹn hôm nay, khách đến và khách cần nhắc.",
  thu_ngan: "Hoá đơn hôm nay, thu nợ và đối chiếu quỹ.",
  tu_van: "Khách đang tư vấn, lịch hẹn và gói liệu trình đề xuất.",
  bac_si: "Lịch khám hôm nay và hồ sơ khách sắp tới.",
  ktv: "Các buổi liệu trình hôm nay và phiếu cấp vật tư.",
  thu_kho: "Tồn kho, hàng sắp hết hạn và phiếu chờ xử lý.",
  ke_toan: "Phiếu chờ duyệt, công nợ và sổ quỹ.",
  marketing: "Chiến dịch, khách mới và hiệu quả kênh.",
  nha_dau_tu: "Chỉ số kinh doanh tổng quan, chỉ xem.",
  nhan_vien: "Chấm công, đề xuất, lịch làm việc và phiếu lương của tôi.",
};

/** Trang chủ cá nhân của MỌI nhân viên (kể cả người không có dashboard): việc đang chờ, hiệu suất của tôi tháng này,
 *  lịch hôm nay, lối tắt theo quyền và toàn bộ chức năng. Dashboard điều hành nằm ở mục Tổng quan. */
export default async function TrangChu({ searchParams }: { searchParams: Promise<{ "khong-du-quyen"?: string; cn?: string }> }) {
  const batDau = mocDo();
  const nd = await layNguoiDungDangNhap();
  const sp = await searchParams;
  const db = sb(), homNay = homNayHCM(), dauThang = `${homNay.slice(0, 8)}01`;
  const dieuHanh = nd.vaiTro === "chu" || nd.vaiTro === "ky_thuat" || nd.vaiTro === "quan_ly";
  // Lãnh đạo không gắn chi nhánh được chọn xem từng chi nhánh (?cn=…) hoặc tất cả. Danh sách chi nhánh nhớ đệm; hỏi cùng lúc với bảng tin.
  const [dsCnTatCa, { data: dsTin }] = await Promise.all([
    dieuHanh && !nd.chiNhanhId ? chiNhanhHoatDong().catch(() => []) : Promise.resolve([]),
    db.from("bang_tin").select("id, tieu_de, noi_dung, hien_den").eq("hoat_dong", true).lte("hien_tu", homNay).order("ghim", { ascending: false }).order("hien_tu", { ascending: false }).limit(10),
  ]);
  const dsCn = dsCnTatCa.map((c) => ({ id: c.id, ten: c.ten }));
  const cn = nd.chiNhanhId ?? (dsCn.some((c) => c.id === sp.cn) ? sp.cn! : null);
  const tin = (dsTin ?? []).filter((t) => !t.hien_den || t.hien_den >= homNay).slice(0, 3);
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();

  const congThang = (ngay: string, n: number) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
  const coHieuSuat = nd.vaiTro !== "nhan_vien" && nd.vaiTro !== "nha_dau_tu";
  // Ô "Doanh số / hoa hồng tạm tính" chỉ hiện cho người được phép (xem phần tileNv bên dưới) → người khác không cần chạy báo cáo bc_nhan_vien (nặng nhất trang).
  const thayDoanhSo = coHieuSuat && (coQuyen(nd, "baocao.tien") || ["thu_ngan", "tu_van", "ktv", "bac_si"].includes(nd.vaiTro));
  // Lịch hôm nay của chi nhánh (cho lãnh đạo) và các số đếm của bảng điều hành: độc lập nhau → hỏi CÙNG LÚC với mọi thứ khác (trước đây nối đuôi 3 chặng).
  let lq = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).order("bat_dau").limit(500);
  let kq = db.from("khach_hang").select("nguon", { count: "exact" }).gte("tao_luc", new Date(`${dauThang}T00:00:00+07:00`).toISOString()).limit(2000);
  let tk = db.from("khach_hang").select("id", { count: "exact", head: true });
  let no = db.from("hoa_don").select("con_no").eq("trang_thai", "hoan_thanh").gt("con_no", 0).limit(3000);
  const tc = db.from("cham_cong").select("id", { count: "exact", head: true }).eq("ngay", homNay).not("vao", "is", null);
  let nvq = db.from("nhan_vien").select("id", { count: "exact", head: true }).eq("hoat_dong", true).eq("trang_thai_lam", "dang_lam");
  if (cn) { lq = lq.eq("chi_nhanh_id", cn); kq = kq.eq("chi_nhanh_id", cn); tk = tk.eq("chi_nhanh_id", cn); no = no.eq("chi_nhanh_id", cn); nvq = nvq.eq("chi_nhanh_id", cn); }
  const rong = Promise.resolve({ data: null, count: null });
  const [canhBao, { data: ban }, { data: buoi }, { data: lichToi }, { data: dtNgay }, tatCaLichKq, khMoiKq, tkKq, noKq, tcKq, nvKq, { data: topBan }, { data: topKh }, { data: ccThang }, { count: phieuCho }] = await Promise.all([
    layCanhBao(nd),
    dieuHanh || thayDoanhSo ? db.rpc("bc_nhan_vien", { p_tu: dauThang, p_den: homNay, p_cn: (cn ?? undefined) as string }) : Promise.resolve({ data: null }),
    !dieuHanh ? db.from("buoi_thuc_hien").select("khach_id, doanh_thu_buoi").eq("nv_thuc_hien_id", nd.nhanVienId).eq("trang_thai", "da_lam").gte("ngay_lam", dauThang).lte("ngay_lam", homNay).limit(1000) : Promise.resolve({ data: null }),
    !dieuHanh ? db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").eq("nhan_vien_id", nd.nhanVienId).gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(8) : Promise.resolve({ data: null }),
    dieuHanh && coQuyen(nd, "baocao.xem") ? db.rpc("bc_doanh_thu_ngay", { p_tu: `${congThang(dauThang, -1)}`, p_den: homNay, p_cn: (cn ?? undefined) as string }) : Promise.resolve({ data: null }),
    dieuHanh ? lq : rong, dieuHanh ? kq : rong, dieuHanh ? tk : rong, dieuHanh ? no : rong, dieuHanh ? tc : rong, dieuHanh ? nvq : rong,
    dieuHanh ? db.rpc("top_ban_thang", { p_tu: dauThang, ...(cn ? { p_cn: cn } : {}) }) : Promise.resolve({ data: null }),
    dieuHanh ? db.rpc("top_khach_chi_12_thang", { p_so: 10, ...(cn ? { p_cn: cn } : {}) }) : Promise.resolve({ data: null }),
    dieuHanh ? Promise.resolve({ data: null }) : db.from("cham_cong").select("ngay, vao, ra, cong, tre_phut").eq("nhan_vien_id", nd.nhanVienId).gte("ngay", dauThang).lte("ngay", homNay).limit(40),
    dieuHanh ? Promise.resolve({ count: 0 }) : db.from("phieu_hr").select("id", { count: "exact", head: true }).eq("nhan_vien_id", nd.nhanVienId).eq("trang_thai", "cho_duyet"),
  ]);
  const hn = (dtNgay ?? []).find((n) => n.ngay === homNay);
  let soLich = 0, dangCho = 0, khongDen = 0;
  let lichDs: { gio: string; ten: string; tt: string }[] = [];
  let top: { ten: string; phu?: string; doanhSo: number; hoaHong?: number; soDong?: number }[] = [];
  let soLieu: SoLieu | null = null;
  const NHAN_LICH: Record<string, string> = { chua_xac_nhan: "Chưa xác nhận", da_xac_nhan: "Đã xác nhận", dang_phuc_vu: "Đang phục vụ", hoan_thanh: "Hoàn thành" };
  if (dieuHanh) {
    const tatCaLich = tatCaLichKq.data ?? [];
    const ds = tatCaLich.filter((l) => l.trang_thai !== "huy" && l.trang_thai !== "khong_den");
    khongDen = tatCaLich.filter((l) => l.trang_thai === "khong_den").length;
    soLich = ds.length; dangCho = ds.filter((l) => l.trang_thai !== "hoan_thanh").length;
    const idsK = [...new Set(ds.slice(0, 6).map((l) => l.khach_id))];
    const xep = [...(ban ?? [])].filter((r) => Number(r.doanh_so) > 0).sort((a, b) => Number(b.doanh_so) - Number(a.doanh_so)).slice(0, 10);
    // Tên khách trong lịch hôm nay + tên nhân viên xếp hạng: hai truy vấn độc lập, hỏi cùng lúc (danh sách chi nhánh lấy từ bộ nhớ đệm).
    const [{ data: ksL }, { data: tenNv }, tatCaCn] = await Promise.all([
      idsK.length ? db.from("khach_hang").select("id, ho_ten").in("id", idsK) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
      xep.length ? db.from("nhan_vien").select("id, ho_ten, chuc_danh, chi_nhanh_id").in("id", xep.map((r) => r.nhan_vien_id)) : Promise.resolve({ data: [] as { id: string; ho_ten: string; chuc_danh: string | null; chi_nhanh_id: string | null }[] }),
      xep.length ? tatCaChiNhanh().catch(() => []) : Promise.resolve([]),
    ]);
    const tenKL = new Map((ksL ?? []).map((k) => [k.id, k.ho_ten]));
    lichDs = ds.slice(0, 6).map((l) => ({ gio: gioVN(l.bat_dau), ten: tenKL.get(l.khach_id) ?? "Khách", tt: NHAN_LICH[l.trang_thai] ?? l.trang_thai }));
    const rows = dtNgay ?? [], dauTruoc = congThang(dauThang, -1);
    const thangNay = rows.filter((r) => r.ngay >= dauThang), thangTruoc = rows.filter((r) => r.ngay >= dauTruoc && r.ngay < dauThang);
    const tong = (a: typeof rows, k: "doanh_thu" | "so_don" | "so_buoi" | "tien_mat" | "chuyen_khoan" | "quet_the") => a.reduce((x, r) => x + Number(r[k] ?? 0), 0);
    const { data: khMoi, count: nKhMoi } = khMoiKq, { count: nKh } = tkKq, { data: dsNo } = noKq, { count: nCc } = tcKq, { count: nNv } = nvKq;
    // 10 dịch vụ + 10 sản phẩm bán chạy tháng này: gộp ở CSDL (hàm top_ban_thang) thay vì tải tới 4000 dòng hoá đơn về gộp.
    const hangBan = (nhom: string) => (topBan ?? []).filter((r) => r.nhom === nhom).map((r) => ({ ten: r.ten, so: Number(r.so), tien: Number(r.tien) }));
    const dem = new Map<string, number>();
    for (const k of khMoi ?? []) dem.set(k.nguon || "Khác", (dem.get(k.nguon || "Khác") ?? 0) + 1);
    soLieu = {
      homNay, lichDs,
      ngay30: rows.filter((r) => r.ngay > congNgay(homNay, -30)).map((r) => ({ ngay: r.ngay, doanhThu: Number(r.doanh_thu), thucThu: Number(r.thuc_thu), noMoi: Number(r.no_moi) })).sort((a, b) => a.ngay.localeCompare(b.ngay)),
      ngay: rows.filter((r) => r.ngay > congNgay(homNay, -14)).map((r) => ({ ngay: r.ngay, doanhThu: Number(r.doanh_thu), soDon: Number(r.so_don), thucThu: Number(r.thuc_thu) })).sort((a, b) => a.ngay.localeCompare(b.ngay)),
      thang: { doanhThu: tong(thangNay, "doanh_thu"), thangTruoc: tong(thangTruoc, "doanh_thu"), donHang: tong(thangNay, "so_don"), buoi: tong(thangNay, "so_buoi"), khachMoi: nKhMoi ?? (khMoi ?? []).length, tongKhach: nKh ?? 0, congNo: (dsNo ?? []).reduce((x, r) => x + Number(r.con_no), 0), theSapHet: canhBao.filter((c) => c.ma === "the").reduce((x, c) => x + (Number(c.nhan.match(/^\d+/)?.[0]) || 0), 0) },
      coCauThu: { tienMat: tong(thangNay, "tien_mat"), chuyenKhoan: tong(thangNay, "chuyen_khoan"), quetThe: tong(thangNay, "quet_the") },
      nguon: [...dem].map(([ten, so]) => ({ ten, so })).sort((a, b) => b.so - a.so).slice(0, 5),
      lich: Object.entries(NHAN_LICH).map(([m, nhan]) => ({ nhan, so: ds.filter((l) => l.trang_thai === m).length })),
      chamCong: { da: nCc ?? 0, tong: nNv ?? 0 },
      topDichVu: hangBan("dich_vu"),
      topSanPham: hangBan("san_pham"),
      topKhach: (topKh ?? []).map((k) => ({ ten: k.ho_ten ?? "Khách", chi: Number(k.chi ?? 0) })),
    };
    if (xep.length) {
      const tenCnTop = new Map(tatCaCn.map((c) => [c.id, c.ten]));
      const phuNv = new Map((tenNv ?? []).map((n) => [n.id, [n.chi_nhanh_id ? tenCnTop.get(n.chi_nhanh_id) : "Mọi chi nhánh", n.chuc_danh].filter(Boolean).join(" · ")]));
      const ten = new Map((tenNv ?? []).map((n) => [n.id, n.ho_ten.replace(/^MSC[^.]*\.[^.]*\./, "")]));
      top = xep.map((r) => ({ ten: ten.get(r.nhan_vien_id) ?? "Nhân viên", phu: phuNv.get(r.nhan_vien_id), doanhSo: Number(r.doanh_so), hoaHong: Number(r.hoa_hong), soDong: Number(r.so_dong) }));
    }
  }
  let lich = lichToi ?? [], tieuDeLich = "Lịch của tôi hôm nay";
  let tenK = new Map<string, string>();
  // Lịch hôm nay + tên khách chỉ hiện ở trang chủ của nhân viên thường (lãnh đạo dùng bảng điều hành) → khỏi hỏi cho lãnh đạo.
  if (!dieuHanh) {
    if (lich.length === 0 && coQuyen(nd, "lich.xem")) {
      let q = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(6);
      if (cn) q = q.eq("chi_nhanh_id", cn);
      lich = (await q).data ?? []; tieuDeLich = "Lịch hôm nay của chi nhánh";
    }
    const ids = [...new Set(lich.map((l) => l.khach_id))];
    const { data: ks } = ids.length ? await db.from("khach_hang").select("id, ho_ten").in("id", ids) : { data: [] };
    tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));
  }

  const toi = (ban ?? []).filter((r) => r.nhan_vien_id === nd.nhanVienId);
  const doanhSo = toi.reduce((s, r) => s + Number(r.doanh_so), 0), hoaHong = toi.reduce((s, r) => s + Number(r.hoa_hong), 0);
  const soBuoi = (buoi ?? []).length, soKhach = new Set((buoi ?? []).map((b) => b.khach_id)).size;
  const ccHom = (ccThang ?? []).find((c) => c.ngay === homNay);
  const congThangNay = (ccThang ?? []).reduce((x, c) => x + Number(c.cong ?? 0), 0), lanTre = (ccThang ?? []).filter((c) => Number(c.tre_phut) > 0).length;
  const tileNv = [
    { nhan: "Chấm công hôm nay", so: ccHom?.vao ? `${gioVN(ccHom.vao)}${ccHom.ra ? ` – ${gioVN(ccHom.ra)}` : ""}` : "Chưa chấm", mau: ccHom?.vao ? "luc" : "cam", phu: ccHom?.vao ? (ccHom.ra ? "đã chấm vào và ra" : "nhớ chấm ra khi hết ca") : "bấm Chấm công để ghi giờ vào" },
    { nhan: "Công tháng này", so: `${soVN(congThangNay)} công`, mau: "xanh", phu: `${lanTre} lần đi trễ` },
    { nhan: "Phiếu của tôi chờ duyệt", so: soVN(phieuCho ?? 0), mau: "tim", phu: "nghỉ phép, điều chỉnh công, đề xuất" },
    { nhan: "Việc đang chờ", so: soVN(canhBao.length), mau: "hong", phu: canhBao.length ? "mở danh sách bên dưới" : "đã xong hết" },
    { nhan: tieuDeLich.includes("chi nhánh") ? "Lịch hôm nay của chi nhánh" : "Lịch của tôi hôm nay", so: soVN(lich.length), mau: "xanh", phu: "" },
    ...(coHieuSuat ? [
      { nhan: "Buổi đã thực hiện tháng này", so: soVN(soBuoi), mau: "luc", phu: `${soVN(soKhach)} khách đã phục vụ` },
      ...(coQuyen(nd, "baocao.tien") || ["thu_ngan", "tu_van", "ktv", "bac_si"].includes(nd.vaiTro) ? [{ nhan: "Doanh số / hoa hồng tạm tính", so: tienGon(doanhSo), mau: "tim", phu: `hoa hồng ${tienVN(hoaHong)}` }] : []),
    ] : []),
  ];
  const loiTat = LOI_TAT.filter((l) => coQuyen(nd, l.q));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-stretch justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="nhan-muc">{nd.vaiTro === "chu" ? "CHỦ · quản trị toàn hệ thống" : `${NHAN_VAI_TRO[nd.vaiTro]}${nd.chucDanh ? ` · ${nd.chucDanh}` : ""}`}</p>
          <h1 className="chu-tieu-de mt-1 text-[28px] leading-[1.15] text-muc lg:text-[34px]">Xin chào, {nd.hoTen}</h1>
          <p className="mt-1.5 text-[14px] text-muc-3">Hôm nay {ngayVN(homNay)}</p>
          {VIEC_CHINH[nd.vaiTro] && <p className="mt-2 max-w-xl text-[14px] text-muc-2">Việc chính của tôi: {VIEC_CHINH[nd.vaiTro]}</p>}
        </div>
        <DongHo />
      </div>
      {!dieuHanh && tin.length > 0 && (
        <section aria-label="Bảng tin công ty" className="space-y-2.5">
          {tin.map((t) => (
            <article key={t.id} className="the-noi the-noi-thap px-4 py-3.5">
              <h2 className="text-[15px] font-semibold text-muc">{t.tieu_de}</h2>
              <p className="mt-1 whitespace-pre-line text-[14px] text-muc-2">{t.noi_dung}</p>
            </article>
          ))}
        </section>
      )}
      {sp["khong-du-quyen"] && <p role="alert" className="rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">Vai trò của bạn không mở được trang vừa chọn.</p>}

      {dieuHanh && coQuyen(nd, "baocao.xem") && <Suspense fallback={<div aria-busy="true" aria-label="Đang tải báo cáo sáng" className="h-[236px] animate-pulse rounded-nho bg-giay-tram sm:h-[196px]" />}><BaoCaoSang cn={cn} tenCn={dsCn.find((c) => c.id === cn)?.ten ?? null} /></Suspense>}

      {dieuHanh ? (
        <BangDieuHanh canhBao={canhBao} tin={tin.map((t) => ({ id: t.id, tieu_de: t.tieu_de, noi_dung: t.noi_dung }))} top={top}
          so={{ lich: soLich, dangCho, khongDen, hoanThanh: Math.max(0, soLich - dangCho), choXacNhan: soLieu?.lich.find((x) => x.nhan === "Chưa xác nhận")?.so ?? 0, dangPhucVu: soLieu?.lich.find((x) => x.nhan === "Đang phục vụ")?.so ?? 0, thuChiTiet: hn ? `doanh thu ${tienVN(Number(hn.doanh_thu))}` : "", tongNo: soLieu?.thang.congNo ?? 0, khoThap: canhBao.filter((c) => c.ma === "kho").length, leadChua: 0, nhanCn: dsCn, cnDangChon: cn, thuHomNay: coQuyen(nd, "baocao.tien") ? Number(hn?.thuc_thu ?? 0) : null, noMoi: coQuyen(nd, "baocao.tien") ? Number(hn?.no_moi ?? 0) : null }} soLieu={soLieu} xemTien={coQuyen(nd, "baocao.tien")} />
      ) : (
        <>
          {canhBao.length > 0 && <p role="status" className="rounded-nho border border-loi/30 bg-loi-nen px-4 py-3 text-[14px] font-semibold text-loi">{canhBao.length} việc cần xử lý hôm nay</p>}
          <dl className={`grid grid-cols-2 gap-3 sm:gap-4 ${tileNv.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
            {tileNv.map((t) => (
              <div key={t.nhan} className="min-w-0 rounded-nho px-4 pb-4 pt-4 text-white shadow-sm" style={{ background: `linear-gradient(135deg, var(--sac-${t.mau}-1), var(--sac-${t.mau}-2))` }}>
                <dt className="text-[13px] opacity-90">{t.nhan}</dt>
                <dd className={`mt-2 font-semibold leading-none tabular-nums ${t.so.length > 11 ? "text-[19px]" : "text-[26px]"}`}>{t.so}</dd>
                {t.phu && <dd className="mt-2 text-[12px] opacity-85">{t.phu}</dd>}
              </div>
            ))}
          </dl>
        </>
      )}

      {nd.vaiTro === "ky_thuat" && <BangHieuSuatApp d={await doHieuSuatApp(batDau)} />}

      {!dieuHanh && (
        <>
      <div className="grid gap-6 lg:grid-cols-2">
        <MucTrang noi tieuDe={`Việc đang chờ${canhBao.length ? ` (${canhBao.length})` : ""}`}>
          {canhBao.length === 0 ? <p className="text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien">{canhBao.map((c) => <li key={c.href + c.nhan}><Link href={c.href} className="flex items-center justify-between gap-3 py-3 text-[14px] hover:text-nhan-dam"><span>{c.nhan}</span><span aria-hidden className="text-muc-3">›</span></Link></li>)}</ul>
          )}
        </MucTrang>
        {(coQuyen(nd, "lich.xem") || lich.length > 0) && (
          <MucTrang noi tieuDe={tieuDeLich} phai={<Link href="/lich-hen" className="font-medium text-nhan-dam hover:underline">Mở lịch</Link>}>
            {lich.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có lịch hẹn nào.</p> : (
              <ul className="divide-y divide-vien">{lich.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]"><span><span className="tabular-nums text-muc-3">{gioVN(l.bat_dau)}</span> · {tenK.get(l.khach_id)}</span>{l.trang_thai === "dang_phuc_vu" ? <NhanTrangThai kieu="tot">Đang phục vụ</NhanTrangThai> : l.trang_thai === "hoan_thanh" ? <NhanTrangThai kieu="tram">Xong</NhanTrangThai> : null}</li>)}</ul>
            )}
          </MucTrang>
        )}
      </div>

      {loiTat.length > 0 && (
        <section aria-label="Lối tắt nhanh">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Làm nhanh</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {loiTat.map((l) => <li key={l.href}><Link href={l.href} className="the-noi the-noi-nang block px-4 pb-4 pt-5 text-[14px] font-medium text-muc">{l.nhan}</Link></li>)}
          </ul>
        </section>
      )}

        </>
      )}

    </div>
  );
}
