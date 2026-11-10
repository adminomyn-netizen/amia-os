import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { boDau, congNgay, homNayHCM, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { LOAI_DOI_TAC, nhanMucHoaHong } from "@/lib/marketing";
import { HINH_THUC_RUT, TT_KHIEU_NAI, TT_RUT } from "@/lib/ctv";
import { LOAI_THU_CTV, TT_THU } from "@/lib/ctv-thu";
import { coCauHinhThu } from "@/lib/gui-thu";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { luuDoiTac, luuNguonLead } from "../actions";
import { daChiYeuCauRut, duyetYeuCauRut, luuCaiDatCtv, luuThongBaoCtv, tuChoiYeuCauRut, xuLyKhieuNaiCtv } from "./actions";
import { LocNguon } from "./LocNguon";
import { truongDoiTac } from "./truong";

const TAB = [{ ma: "nguon", ten: "Nguồn giới thiệu" }, { ma: "chi-tra", ten: "Chi trả hoa hồng" }, { ma: "khieu-nai", ten: "Khiếu nại đối soát" }, { ma: "thong-bao", ten: "Thông báo email" }, { ma: "nguon-lead", ten: "Nguồn lead" }];
const TAB_RUT = [{ ma: "cho", ten: "Cần xử lý", tt: ["cho_xu_ly", "dang_duyet_chi"] }, { ma: "da_chi", ten: "Đã chi", tt: ["da_chi"] }, { ma: "tu_choi", ten: "Từ chối", tt: ["tu_choi"] }, { ma: "tat_ca", ten: "Tất cả", tt: [] as string[] }];

export default async function TrangDoiTac({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string; q?: string; moi?: string; tt?: string; kn?: string }> }) {
  const nd = await yeuCauQuyen("mkt.xem");
  const sp = await searchParams;
  const tab = TAB.some((t) => t.ma === sp.tab) ? sp.tab! : "nguon";
  const sua = coQuyen(nd, "mkt.sua"), duyet = coQuyen(nd, "mkt.duyet"), chi = coQuyen(nd, "quy.ghi");
  const db = sb();
  // Lưới an toàn: đối chiếu sổ bút toán với hoá đơn (trigger đã ghi lúc chốt / huỷ; gọi lại không ghi trùng).
  await db.rpc("dong_bo_but_toan_hh_gt");
  const truong = truongDoiTac();
  const { data: ch } = await db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "ctv.%");
  const cfg = new Map((ch ?? []).map((x) => [x.khoa, x.gia_tri]));
  const truongCaiDat: Truong[] = [
    { ten: "toi_thieu_rut", nhan: "Tối thiểu để yêu cầu chi trả (đ)", loai: "tien", ghiChu: "0 = không đặt mức tối thiểu." },
    { ten: "tu_dang_ky_kieu", nhan: "Mức hoa hồng cho CTV tự đăng ký (cổng CTV)", loai: "chon", luaChon: [{ gia_tri: "phan_tram", nhan: "Theo phần trăm" }, { gia_tri: "tien", nhan: "Số tiền cố định" }] },
    { ten: "tu_dang_ky_gia_tri", nhan: "Giá trị", loai: "so", ghiChu: "% tính trên doanh số mỗi hoá đơn của khách được giới thiệu. Áp cho người đăng ký mới; người cũ giữ mức đã ghi." },
  ];
  const nutTren = (
    <>
      {duyet && <NutHop kieu="phu" nhan="Cài đặt chi trả" tieuDe="Cài đặt chi trả hoa hồng" truong={truongCaiDat} action={luuCaiDatCtv}
        moTa={`Sổ bút toán hoa hồng tính từ hoá đơn ngày ${ngayVN(cfg.get("ctv.but_toan_tu_ngay") ?? "2026-11-10")}. Hoa hồng thời SalonHero xem ở Hoa hồng › Nguồn giới thiệu.`}
        giaTri={{ toi_thieu_rut: Number(cfg.get("ctv.toi_thieu_rut") ?? 0), tu_dang_ky_kieu: cfg.get("ctv.tu_dang_ky_kieu") ?? "phan_tram", tu_dang_ky_gia_tri: Number(cfg.get("ctv.tu_dang_ky_gia_tri") ?? 10) }} />}
      {sua && <NutHop nhan="Thêm nguồn giới thiệu" tieuDe="Thêm nguồn giới thiệu" truong={truong} action={luuDoiTac} giaTri={{ loai: "ctv", hoat_dong: "1", hh_kieu: "phan_tram", hh_gia_tri: 0, gui_email: false }} rong />}
    </>
  );
  let noiDung: React.ReactNode = null;

  if (tab === "nguon") {
    const { tu, den } = khoangNgay(sp.tu, sp.den);
    const cn = nd.chiNhanhId ?? (sp.cn || undefined);
    const [{ data: ds }, { data: so, error }, { data: dsCn }] = await Promise.all([
      db.from("doi_tac_gt").select("*").order("tao_luc", { ascending: false }),
      db.rpc("bc_nguon_gioi_thieu", { p_tu: tu, p_den: den, ...(cn ? { p_cn: cn } : {}) }),
      db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
    ]);
    if (error) console.error("[doi-tac]", error.message);
    const soLieu = new Map((so ?? []).map((x) => [x.doi_tac_id, x]));
    const tuKhoa = boDau((sp.q ?? "").trim());
    const moi = sp.moi === "1";
    const moc7 = congNgay(homNayHCM(), -7);
    const dong = (ds ?? []).filter((r) => (!tuKhoa || boDau(`${r.ten} ${r.ten_hien_thi ?? ""} ${r.ma} ${r.ma_gioi_thieu} ${r.dien_thoai ?? ""}`).includes(tuKhoa)) && (!moi || r.tao_luc.slice(0, 10) >= moc7))
      .map((r) => ({ ...r, s: soLieu.get(r.id) }))
      .sort((a, b) => Number(b.s?.chua_thanh_toan ?? 0) - Number(a.s?.chua_thanh_toan ?? 0) || Number(b.s?.hoa_hong ?? 0) - Number(a.s?.hoa_hong ?? 0) || 0);
    const tong = (k: "hoa_hong" | "doanh_thu" | "chua_thanh_toan" | "dang_cho") => dong.reduce((t, r) => t + Number(r.s?.[k] ?? 0), 0);
    const tham = new URLSearchParams({ tu, den, ...(cn ? { cn } : {}), ...(sp.q ? { q: sp.q } : {}), ...(moi ? { moi: "1" } : {}) });
    noiDung = (
      <>
        <LocBaoCao goc="/marketing/doi-tac" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <LocNguon q={sp.q ?? ""} moi={moi} xuat={`/api/xuat/nguon-gioi-thieu?${tham}`} />
        <div className="mb-5"><HangChiSo muc={[
          { nhan: "Tổng hoa hồng (kỳ)", so: tienVN(tong("hoa_hong")) }, { nhan: "Doanh thu tính hoa hồng (kỳ)", so: tienVN(tong("doanh_thu")) },
          { nhan: "Chưa thanh toán", so: tienVN(tong("chua_thanh_toan")), ghiChu: "Mọi kỳ, trừ phần đã chi" }, { nhan: "Đang chờ chi", so: tienVN(tong("dang_cho")) },
        ]} /></div>
        <Bang noi duLieu={dong} khoa={(r) => r.id} trong={moi ? "Không có nguồn mới tạo trong 7 ngày." : "Chưa có nguồn giới thiệu."}
          cot={[
            { nhan: "Nguồn giới thiệu", chinh: true, hienThi: (r) => (
              <div>
                <Link href={`/marketing/doi-tac/${r.id}`} className="font-medium text-muc hover:text-nhan-dam">{r.ten}</Link>
                {r.ten_hien_thi && <div className="text-[12.5px] text-muc-3">Tên hiển thị: {r.ten_hien_thi}</div>}
                <div className="text-[12.5px] text-muc-3">{r.ma_gioi_thieu} · {nhanMucHoaHong(r.hh_kieu, Number(r.hh_gia_tri))}{r.tu_dang_ky ? " · Tự đăng ký qua cổng" : ""}{r.tao_luc.slice(0, 10) >= moc7 ? ` · Mới tạo ${ngayVN(r.tao_luc.slice(0, 10))}` : ""}{!r.hoat_dong ? " · Ngừng" : ""}</div>
              </div>) },
            { nhan: "Mã REF (SĐT)", hienThi: (r) => (r.ma_ref ? <code>{r.ma_ref}</code> : <span className="text-[12.5px] text-muc-3">Chưa có SĐT di động</span>) },
            { nhan: "Loại", hienThi: (r) => LOAI_DOI_TAC[r.loai] ?? r.loai },
            { nhan: "Số khách giới thiệu", phai: true, hienThi: (r) => <span className="tabular-nums">{r.s?.so_khach ?? 0}<span className="block text-[12px] text-muc-3">gắn nguồn: {r.s?.so_khach_gan ?? 0}</span></span> },
            { nhan: "Số đơn", phai: true, hienThi: (r) => r.s?.so_don ?? 0 },
            { nhan: "Doanh thu", phai: true, hienThi: (r) => <span className="tabular-nums">{tienVN(Number(r.s?.doanh_thu ?? 0))}</span> },
            { nhan: "Hoa hồng", phai: true, hienThi: (r) => <span className="tabular-nums">{tienVN(Number(r.s?.hoa_hong ?? 0))}</span> },
            { nhan: "Chưa thanh toán", phai: true, hienThi: (r) => <span className={`tabular-nums ${Number(r.s?.chua_thanh_toan ?? 0) > 0 ? "font-medium text-nhan-dam" : ""}`}>{tienVN(Number(r.s?.chua_thanh_toan ?? 0))}</span> },
            { nhan: "Lượt ghé · Lịch · Lead", phai: true, hienThi: (r) => <span className="tabular-nums text-[13px]">{r.s?.luot_ghe ?? 0} · {r.s?.so_lich ?? 0} · {r.s?.so_lead ?? 0}</span> },
            { nhan: "", hienThi: (r) => (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link href={`/marketing/doi-tac/${r.id}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Link / QR · Chi tiết</Link>
                {sua && <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa nguồn giới thiệu" truong={truong} action={luuDoiTac} rong
                  giaTri={{ id: r.id, ten: r.ten, loai: r.loai, dien_thoai: r.dien_thoai ?? "", ten_hien_thi: r.ten_hien_thi ?? "", email: r.email ?? "", gui_email: r.gui_email, hoat_dong: r.hoat_dong ? "1" : "0", hh_kieu: r.hh_kieu, hh_gia_tri: Number(r.hh_gia_tri), ghi_chu: r.ghi_chu ?? "" }} />}
              </div>) },
          ]} />
        <p className="mt-3 text-[12.5px] text-muc-3">Số đơn, doanh thu, hoa hồng lấy từ sổ bút toán (hoá đơn từ {ngayVN(cfg.get("ctv.but_toan_tu_ngay") ?? "2026-11-10")}; huỷ hoá đơn tự đảo). Số trước đó xem ở <Link className="underline" href="/hoa-hong?tab=nguon">Hoa hồng › Nguồn giới thiệu</Link>. Lượt ghé = số người mở trang đặt lịch bằng link REF (mỗi máy 1 lượt/ngày).</p>
      </>
    );
  } else if (tab === "chi-tra") {
    const tr = TAB_RUT.find((t) => t.ma === sp.tt) ?? TAB_RUT[0];
    const [{ data: ds }, { data: dt }, { data: nv }, { data: quy }, { data: dem }] = await Promise.all([
      (() => { let x = db.from("yeu_cau_rut_hh").select("*").order("tao_luc", { ascending: false }).limit(300); if (tr.tt.length) x = x.in("trang_thai", tr.tt); return x; })(),
      db.from("doi_tac_gt").select("id, ten, ma_ref"),
      db.from("nhan_vien").select("id, ho_ten"),
      (() => { let x = db.from("quy").select("id, ten, loai, chi_nhanh_id").eq("hoat_dong", true).order("ten"); if (nd.chiNhanhId) x = x.eq("chi_nhanh_id", nd.chiNhanhId); return x; })(),
      db.from("yeu_cau_rut_hh").select("trang_thai"),
    ]);
    const tenDt = new Map((dt ?? []).map((x) => [x.id, x])), tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
    const demTt = (tt: string[]) => (dem ?? []).filter((x) => !tt.length || tt.includes(x.trang_thai)).length;
    noiDung = (
      <>
        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
          {TAB_RUT.map((t) => <Link key={t.ma} role="tab" aria-selected={t.ma === tr.ma} href={`/marketing/doi-tac?tab=chi-tra&tt=${t.ma}`} scroll={false}
            className={`rounded-nho border px-3 py-1.5 text-[13px] ${t.ma === tr.ma ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{t.ten} ({demTt(t.tt)})</Link>)}
        </div>
        <p className="mb-3 text-[13px] text-muc-3">Tạo yêu cầu ở trang Chi tiết của nguồn. Người tạo không tự duyệt, người duyệt cần đủ hạn mức (Cài đặt › Chính sách phê duyệt) và không tự chi. Đã chi = ghi một phiếu chi &quot;Chi hoa hồng giới thiệu&quot; vào Sổ quỹ hôm nay. Từ chối thì tiền quay về số dư.</p>
        <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có yêu cầu."
          cot={[
            { nhan: "Ngày gửi", hienThi: (r) => <span>{ngayVN(r.tao_luc.slice(0, 10))}<span className="block text-[12px] text-muc-3">{r.ma}</span></span> },
            { nhan: "Đối tác", chinh: true, hienThi: (r) => <Link href={`/marketing/doi-tac/${r.doi_tac_id}`} className="hover:text-nhan-dam">{tenDt.get(r.doi_tac_id)?.ten ?? "?"}<span className="block text-[12px] text-muc-3">Tạo: {r.tu_cong_ctv ? "CTV tự gửi từ cổng" : tenNv.get(r.tao_boi ?? "") ?? ""}</span></Link> },
            { nhan: "Số tiền", phai: true, hienThi: (r) => <span className="tabular-nums font-medium">{tienVN(Number(r.so_tien))}</span> },
            { nhan: "Nhận qua", hienThi: (r) => <span>{HINH_THUC_RUT[r.hinh_thuc]}{r.hinh_thuc === "chuyen_khoan" && <span className="block text-[12px] text-muc-3">{r.ngan_hang} · {r.so_tk} · {r.ten_chu_tk}</span>}</span> },
            { nhan: "Trạng thái", hienThi: (r) => <span><NhanTrangThai kieu={TT_RUT[r.trang_thai].kieu}>{TT_RUT[r.trang_thai].ten}</NhanTrangThai>
              {r.duyet_boi && <span className="block text-[12px] text-muc-3">Duyệt: {tenNv.get(r.duyet_boi)}</span>}
              {r.chi_boi && <span className="block text-[12px] text-muc-3">Chi: {tenNv.get(r.chi_boi)} · {ngayVN((r.chi_luc ?? "").slice(0, 10))}</span>}
              {r.ly_do_tu_choi && <span className="block text-[12px] text-loi">Lý do: {r.ly_do_tu_choi}</span>}</span> },
            { nhan: "", hienThi: (r) => (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {r.trang_thai === "cho_xu_ly" && duyet && <NutHop kieu="chu" nhan="Duyệt chi" tieuDe={`Duyệt chi ${r.ma}`} moTa={`${tenDt.get(r.doi_tac_id)?.ten ?? ""} · ${tienVN(Number(r.so_tien))}`} giaTri={{ id: r.id }} action={duyetYeuCauRut} nhanLuu="Duyệt chi" xacNhan="Chuyển yêu cầu sang Đang duyệt chi?" />}
                {r.trang_thai === "dang_duyet_chi" && chi && <NutHop kieu="chu" nhan="Đánh dấu đã chi" tieuDe={`Đã chi ${r.ma}`} moTa={`${tenDt.get(r.doi_tac_id)?.ten ?? ""} · ${tienVN(Number(r.so_tien))} · ${HINH_THUC_RUT[r.hinh_thuc]}. Ghi một phiếu chi vào Sổ quỹ ngày hôm nay.`}
                  giaTri={{ id: r.id, quy_id: "" }} action={daChiYeuCauRut} nhanLuu="Ghi phiếu chi"
                  truong={[{ ten: "quy_id", nhan: "Chi từ quỹ", loai: "chon", batBuoc: true, luaChon: (quy ?? []).filter((q) => q.loai === (r.hinh_thuc === "chuyen_khoan" ? "ngan_hang" : "tien_mat")).map((q) => ({ gia_tri: q.id, nhan: q.ten })) }]} />}
                {(r.trang_thai === "cho_xu_ly" || r.trang_thai === "dang_duyet_chi") && (duyet || chi) && <NutHop kieu="chu" nguy nhan="Từ chối" tieuDe={`Từ chối ${r.ma}`} giaTri={{ id: r.id }} action={tuChoiYeuCauRut} nhanLuu="Từ chối"
                  truong={[{ ten: "ly_do", nhan: "Lý do từ chối", loai: "nhieu_dong", batBuoc: true, rong: true }]} />}
              </div>) },
          ]} />
      </>
    );
  } else if (tab === "khieu-nai") {
    const TAB_KN = [{ ma: "mo", ten: "Cần xử lý", tt: ["moi", "dang_xu_ly"] }, { ma: "dong", ten: "Đã đóng", tt: ["da_xu_ly", "tu_choi"] }, { ma: "tat_ca", ten: "Tất cả", tt: [] as string[] }];
    const tk = TAB_KN.find((t) => t.ma === sp.kn) ?? TAB_KN[0];
    const [{ data: ds }, { data: dt }, { data: nv }, { data: dem }] = await Promise.all([
      (() => { let x = db.from("ctv_khieu_nai").select("*").order("tao_luc", { ascending: false }).limit(300); if (tk.tt.length) x = x.in("trang_thai", tk.tt); return x; })(),
      db.from("doi_tac_gt").select("id, ten, ma_ref"),
      db.from("nhan_vien").select("id, ho_ten"),
      db.from("ctv_khieu_nai").select("trang_thai"),
    ]);
    const tenDt = new Map((dt ?? []).map((x) => [x.id, x])), tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
    const demTt = (tt: string[]) => (dem ?? []).filter((x) => !tt.length || tt.includes(x.trang_thai)).length;
    noiDung = (
      <>
        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
          {TAB_KN.map((t) => <Link key={t.ma} role="tab" aria-selected={t.ma === tk.ma} href={`/marketing/doi-tac?tab=khieu-nai&kn=${t.ma}`} scroll={false}
            className={`rounded-nho border px-3 py-1.5 text-[13px] ${t.ma === tk.ma ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{t.ten} ({demTt(t.tt)})</Link>)}
        </div>
        <p className="mb-3 text-[13px] text-muc-3">CTV gửi từ Cổng CTV › Đối soát (&quot;Nội dung sai lệch&quot;). Phản hồi hiện lại cho CTV trong cổng. Cần sửa số thì sửa hoá đơn / người giới thiệu ở hoá đơn — sổ bút toán tự điều chỉnh.</p>
        <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có khiếu nại."
          cot={[
            { nhan: "Ngày gửi", hienThi: (r) => <span>{ngayVN(r.tao_luc.slice(0, 10))}<span className="block text-[12px] text-muc-3">{r.ma}</span></span> },
            { nhan: "CTV", hienThi: (r) => <Link href={`/marketing/doi-tac/${r.doi_tac_id}`} className="hover:text-nhan-dam">{tenDt.get(r.doi_tac_id)?.ten ?? "?"}<span className="block text-[12px] text-muc-3">{tenDt.get(r.doi_tac_id)?.ma_ref ?? ""}</span></Link> },
            { nhan: "Kỳ / dòng", hienThi: (r) => <span className="text-[13px]">{ngayVN(r.ky_tu)} – {ngayVN(r.ky_den)}{r.ma_hd && <span className="block text-[12px] text-muc-3">HĐ {r.ma_hd}</span>}</span> },
            { nhan: "Nội dung", chinh: true, hienThi: (r) => <span className="whitespace-pre-line text-[13.5px]">{r.noi_dung}{r.phan_hoi && <span className="mt-1 block text-[12.5px] text-nhan-dam">Phản hồi: {r.phan_hoi}{r.xu_ly_boi ? ` · ${tenNv.get(r.xu_ly_boi) ?? ""}` : ""}</span>}</span> },
            { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_KHIEU_NAI[r.trang_thai]?.kieu}>{TT_KHIEU_NAI[r.trang_thai]?.ten ?? r.trang_thai}</NhanTrangThai> },
            { nhan: "", hienThi: (r) => (sua && (r.trang_thai === "moi" || r.trang_thai === "dang_xu_ly") ? (
              <NutHop kieu="chu" nhan="Xử lý" tieuDe={`Xử lý khiếu nại ${r.ma}`} moTa={r.noi_dung} giaTri={{ id: r.id, trang_thai: "da_xu_ly", phan_hoi: r.phan_hoi ?? "" }} action={xuLyKhieuNaiCtv} nhanLuu="Lưu"
                truong={[
                  { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "dang_xu_ly", nhan: "Đang xử lý" }, { gia_tri: "da_xu_ly", nhan: "Đã xử lý (đóng)" }, { gia_tri: "tu_choi", nhan: "Từ chối (đóng)" }] },
                  { ten: "phan_hoi", nhan: "Phản hồi cho CTV", loai: "nhieu_dong", rong: true, ghiChu: "CTV đọc được trong cổng. Không ghi tên dịch vụ hay thông tin khách." },
                ]} />) : null) },
          ]} />
      </>
    );
  } else if (tab === "thong-bao") {
    const [{ data: nk }, { data: dt }] = await Promise.all([
      db.from("ctv_thu").select("id, doi_tac_id, loai, den, trang_thai, ly_do, tao_luc, gui_luc").order("tao_luc", { ascending: false }).limit(200),
      db.from("doi_tac_gt").select("id, ten"),
    ]);
    const tenDt = new Map((dt ?? []).map((x) => [x.id, x.ten]));
    const tenLoai = new Map(LOAI_THU_CTV.map((l) => [l.ma, l.ten]));
    const coThu = coCauHinhThu();
    noiDung = (
      <>
        <div className={`mb-4 rounded-the border p-3 text-[13.5px] ${coThu ? "border-nhan/30 bg-nhan-nhat text-nhan-dam" : "border-loi/30 bg-loi-nen text-loi"}`}>
          {coThu ? "Máy chủ đã cấu hình gửi email (SMTP). Mã xác thực gửi ngay; thư sự kiện gửi theo lượt chạy /api/cron/ctv-thu."
            : "Chưa cấu hình gửi email: CTV chưa nhận được mã đăng ký / đăng nhập và thư thông báo. Cần khai SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM trên máy chủ (người phụ trách kỹ thuật)."}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {duyet && <NutHop kieu="phu" nhan="Bật / tắt loại thư" tieuDe="Thông báo email cho CTV" action={luuThongBaoCtv}
            moTa="Thư không ghi tên dịch vụ, tên khách được che. Loại tắt vẫn ghi nhật ký &quot;Bỏ qua · Loại thư đang tắt&quot;."
            giaTri={Object.fromEntries([["cong_mo", (cfg.get("ctv.cong_mo") ?? "1") === "1"], ...LOAI_THU_CTV.filter((l) => !l.sau).map((l) => [l.ma, (cfg.get(`ctv.email.${l.ma}`) ?? "0") === "1"])])}
            truong={[{ ten: "cong_mo", nhan: "Mở trang đăng ký CTV (/ctv/dang-ky)", loai: "gat" as const }, ...LOAI_THU_CTV.filter((l) => !l.sau).map((l) => ({ ten: l.ma, nhan: l.ten, loai: "gat" as const, ...(l.batBuoc ? { ghiChu: "Tắt thì CTV không đăng ký / đăng nhập / rút tiền được." } : {}) }))]} />}
          <a href="/ctv/dang-ky" target="_blank" className="text-[13px] text-nhan-dam underline">Mở trang đăng ký CTV</a>
          <a href="/ctv" target="_blank" className="text-[13px] text-nhan-dam underline">Mở Cổng CTV</a>
        </div>
        <ul className="mb-5 grid gap-1.5 text-[13.5px] sm:grid-cols-2">
          {LOAI_THU_CTV.map((l) => {
            const bat = !l.sau && (cfg.get(`ctv.email.${l.ma}`) ?? "0") === "1";
            return <li key={l.ma} className="flex items-center justify-between gap-2 rounded-nho border border-vien px-3 py-2"><span>{l.ten}</span>
              <NhanTrangThai kieu={l.sau ? "tram" : bat ? "tot" : "loi"}>{l.sau ? "Giai đoạn sau" : bat ? "Đang bật" : "Đang tắt"}</NhanTrangThai></li>;
          })}
        </ul>
        <h3 className="mb-2 text-[14px] font-semibold">Nhật ký gửi (200 thư gần nhất)</h3>
        <Bang noi duLieu={nk ?? []} khoa={(r) => r.id} trong="Chưa có thư nào."
          cot={[
            { nhan: "Thời gian", hienThi: (r) => <span className="text-[13px]">{ngayGioVN(r.tao_luc)}</span> },
            { nhan: "CTV", hienThi: (r) => (r.doi_tac_id ? tenDt.get(r.doi_tac_id) ?? "" : <span className="text-muc-3">Người đăng ký mới</span>) },
            { nhan: "Loại thư", chinh: true, hienThi: (r) => tenLoai.get(r.loai) ?? r.loai },
            { nhan: "Trạng thái", hienThi: (r) => <span><NhanTrangThai kieu={TT_THU[r.trang_thai]?.kieu}>{TT_THU[r.trang_thai]?.ten ?? r.trang_thai}</NhanTrangThai>{r.ly_do && <span className="block text-[12px] text-muc-3">{r.ly_do}</span>}</span> },
          ]} />
      </>
    );
  } else {
    const { data: nguon } = await db.from("nguon_lead").select("*").order("thu_tu");
    const truongNguon: Truong[] = [{ ten: "ten", nhan: "Tên nguồn", loai: "chu", batBuoc: true, rong: true }, { ten: "loai", nhan: "Loại", loai: "chon", luaChon: [{ gia_tri: "nguon_ngoai", nhan: "Nguồn ngoài" }, { gia_tri: "doi_tac", nhan: "Đối tác" }] }, { ten: "hoat_dong", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "1", nhan: "Đang dùng" }, { gia_tri: "0", nhan: "Ngừng" }] }];
    noiDung = (
      <>
        <p className="mb-3 text-[13px] text-muc-3">Danh sách nguồn dùng khi nhập lead và làm báo cáo. Nguồn đã có lead thì chỉ ngừng dùng, không xoá. Khách đặt lịch qua link giới thiệu tự vào lead nguồn &quot;Cộng tác viên / đối tác&quot; hoặc &quot;Khách cũ giới thiệu&quot;.</p>
        <div className="mb-3">{sua && <NutHop kieu="phu" nhan="Thêm nguồn" tieuDe="Thêm nguồn lead" truong={truongNguon} action={luuNguonLead} giaTri={{ hoat_dong: "1", loai: "nguon_ngoai" }} />}</div>
        <Bang noi duLieu={nguon ?? []} khoa={(r) => r.id} trong="Chưa có nguồn."
          cot={[
            { nhan: "Nguồn", chinh: true, hienThi: (r) => r.ten }, { nhan: "Loại", hienThi: (r) => (r.loai === "doi_tac" ? "Đối tác" : "Nguồn ngoài") },
            { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang dùng" : "Ngừng"}</NhanTrangThai> },
            { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa nguồn" truong={truongNguon} action={luuNguonLead} giaTri={{ id: r.id, ten: r.ten, loai: r.loai ?? "nguon_ngoai", hoat_dong: r.hoat_dong ? "1" : "0" }} /> : null) },
          ]} />
      </>
    );
  }

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Giới thiệu & CTV" phu="Nguồn giới thiệu có mã REF = SĐT di động, link đặt lịch + QR + poster, hoa hồng theo dịch vụ, sổ bút toán (huỷ hoá đơn tự đảo) và chi trả hoa hồng qua Sổ quỹ.">
        {nutTren}
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc="/marketing/doi-tac" />
      {noiDung}
    </div>
  );
}
