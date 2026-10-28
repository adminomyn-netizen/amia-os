import { docTrangAnh } from "@/lib/anh-khach-doc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayGioVN, ngayVN, soVN, tienVN, buoiConLai } from "@/lib/dinh-dang";
import { NHAN_NGUON, TRANG_THAI_KHACH, truongKhach } from "@/lib/khach";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { TaiAnh } from "@/components/khach/TaiAnh";
import { AnhCuLuuTru } from "@/components/khach/AnhCuLuuTru";
import { LuoiAnh } from "@/components/khach/LuoiAnh";
import { NhanNhom } from "@/components/khach/DanhSachKhach";
import { LichSuGiaoDich, type ThamSoLichSu } from "@/components/khach/LichSuGiaoDich";
import { thamSoBaoHanh, thangTron, tinhBaoHanh, LOAI_KN, TT_BC, TT_KN } from "@/lib/khieu-nai";
import { truongBaoBatThuong, truongKhieuNai } from "@/lib/khieu-nai-form";
import { baoBienChung, ghiBaoHanh, ghiKhieuNai } from "../../khieu-nai/actions";
import { ganNhomChoKhach } from "../nhom/actions";
import { docTaiKham, docTheSapHet } from "@/lib/cham-soc-khach";
import { danhDauMat, luuGhiChu, luuKhach, luuNguoiThan, xoaKhach, xoaNguoiThan } from "../actions";

/** Sự kiện vừa xảy ra trong vòng `ms` mili giây qua? */
const moiXayRa = (iso: string, ms: number) => Date.now() - new Date(iso).getTime() < ms;
const TAB = [{ ma: "thong-tin", ten: "Thông tin" }, { ma: "ghi-chu", ten: "Ghi chú" }, { ma: "nguoi-than", ten: "Người thân" }, { ma: "lich-su", ten: "Lịch sử giao dịch" }, { ma: "diem-thuong", ten: "Điểm thưởng" }, { ma: "nhac-nho", ten: "Nhắc nhở" }, { ma: "anh", ten: "Ảnh khách hàng" }, { ma: "khieu-nai", ten: "Khiếu nại & bảo hành" }];

/** Mỗi trang lịch sử điểm thưởng. */
const DIEM_MOI_TRANG = 50;
const LOAI_DIEM: Record<string, string> = { cong_hoa_don: "Cộng theo hoá đơn", hoan_hoa_don: "Trừ do huỷ/hoàn hoá đơn", sua_tay: "Sửa tay", dieu_chinh_dau: "Điều chỉnh đầu kỳ", dieu_chinh: "Điều chỉnh", doi_diem: "Đổi điểm" };

export default async function HoSoKhach({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; trang?: string } & ThamSoLichSu> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const { id } = await params;
  const sp = await searchParams;
  const { tab: t, trang: trangDiem } = sp;
  const xemSucKhoe = coQuyen(nd, "hoso.xem");
  const kn4 = (["kn.ghi", "kn.duyet", "bc.bao", "bc.xu_ly"] as const).some((q) => coQuyen(nd, q));
  const tabHopLe0 = TAB.filter((x) => (x.ma !== "ghi-chu" || xemSucKhoe) && (x.ma !== "anh" || coQuyen(nd, "anh.xem")) && (x.ma !== "lich-su" || coQuyen(nd, "ban.xem")) && (x.ma !== "khieu-nai" || kn4));
  const tab = tabHopLe0.some((x) => x.ma === t) ? t! : "thong-tin";
  const db = sb();
  const { data: k, error: loiDoc } = await db.from("v_khach_hang").select("*").eq("id", id).maybeSingle();
  // Lỗi đọc (mạng, CSDL quá tải) ≠ không có khách: báo lỗi để thử lại, không hiện "không tìm thấy".
  if (loiDoc) { console.error("[ho-so-khach]", loiDoc.code, loiDoc.message); throw new Error("Không đọc được hồ sơ khách, thử lại."); }
  if (!k) notFound();
  const xemAnh = coQuyen(nd, "anh.xem");
  const sua0 = coQuyen(nd, "khach.sua");
  const [{ data: nv }, { data: cn }, { data: dv }, { data: qt }, { data: no }, { data: the }, { data: nguoiGt }, soAnhTab, { data: kx }, { data: nhomKh }, taiKham, theSapHet, { data: moiNhom }] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("khach_quan_tam").select("dich_vu_id").eq("khach_id", id),
    db.from("hoa_don").select("con_no").eq("khach_id", id).eq("trang_thai", "hoan_thanh").gt("con_no", 0),
    db.from("v_the_khach").select("*").eq("khach_id", id).order("ngay_cap", { ascending: false }),
    k.nguoi_gioi_thieu_id ? db.from("khach_hang").select("ma, ho_ten").eq("id", k.nguoi_gioi_thieu_id).maybeSingle() : Promise.resolve({ data: null }),
    xemAnh ? demAnhKhach(id) : Promise.resolve(0),
    // Trường chuyển từ SalonHero (0055/0065) chưa có trong v_khach_hang: đọc thẳng bảng khách.
    db.from("khach_hang").select("nghe_nghiep, cong_ty, facebook, website, chieu_cao_cm, can_nang_kg, ma_so_thue, tinh_thanh, quan_huyen, quoc_gia, sdt_phu, ma_the_giay, co_so_goc, diem_so_du, tong_dat_lich_goc, tong_checkin_goc, tong_huy_lich_goc, lan_den_cuoi").eq("id", id).maybeSingle(),
    db.from("khach_nhom").select("nhom_khach!inner(id, ten, mau)").eq("khach_id", id).eq("nhom_khach.hoat_dong", true),
    coQuyen(nd, "the.xem") ? docTaiKham(null, undefined, undefined, id, 1).catch(() => []) : Promise.resolve([]),
    coQuyen(nd, "the.xem") ? docTheSapHet(null, undefined, undefined, id, 5).catch(() => []) : Promise.resolve([]),
    sua0 ? db.from("nhom_khach").select("id, ten").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] }),
  ]);
  const nhom = (nhomKh ?? []).map((x) => x.nhom_khach as unknown as { id: string; ten: string; mau: string | null } | null).filter((x): x is { id: string; ten: string; mau: string | null } => !!x).sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  const coSo = (kx?.co_so_goc ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  // Số ảnh trên nhãn tab: ảnh đã có trong kho + ảnh cũ còn ở kho lưu trữ (con số không đổi khi nhân viên bấm lấy ảnh cũ về xem).
  const tabHopLe = tabHopLe0.map((x) => (x.ma === "anh" ? { ...x, ten: `Ảnh khách hàng (${soAnhTab.toLocaleString("vi-VN")})` } : x));
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const nvLC = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const truong = truongKhach({ dichVu: (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), nhanVien: nvLC, chiNhanh: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) });
  const tongNo = (no ?? []).reduce((s, r) => s + Number(r.con_no), 0);
  const tt = TRANG_THAI_KHACH[k.trang_thai ?? "lead"];
  const sua = coQuyen(nd, "khach.sua");
  const giaTriSua = { tinh_thanh: kx?.tinh_thanh ?? "", quan_huyen: kx?.quan_huyen ?? "", quoc_gia: kx?.quoc_gia ?? "", sdt_phu: kx?.sdt_phu ?? "", facebook: kx?.facebook ?? "", website: kx?.website ?? "",
    nghe_nghiep: kx?.nghe_nghiep ?? "", cong_ty: kx?.cong_ty ?? "", ma_so_thue: kx?.ma_so_thue ?? "", ma_the_giay: kx?.ma_the_giay ?? "", id: k.id, ho_ten: k.ho_ten, dien_thoai: k.dien_thoai, zalo: k.zalo ?? "", email: k.email ?? "", gioi_tinh: k.gioi_tinh ?? "", ngay_sinh: k.ngay_sinh ?? "", dia_chi: k.dia_chi ?? "", chi_nhanh_id: k.chi_nhanh_id, nguon: k.nguon, nguon_chi_tiet: k.nguon_chi_tiet ?? "", nguoi_gioi_thieu: nguoiGt?.ma ?? "", nguoi_phu_trach_id: k.nguoi_phu_trach_id, ghi_chu: k.ghi_chu ?? "", dong_y_dung_hinh: k.dong_y_dung_hinh, quan_tam: (qt ?? []).map((x) => x.dich_vu_id) };

  // Dữ liệu sức khoẻ: ghi vết mỗi lần mở tab ghi chú hoặc ảnh.
  if (tab === "ghi-chu" || tab === "anh") await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: `xem_${tab}`, doi_tuong: "khach_hang", doi_tuong_id: id });

  let noiDung: React.ReactNode = null;
  if (tab === "thong-tin") {
    const hang: [string, React.ReactNode][] = [
      ["Điện thoại", k.dien_thoai], ["Số điện thoại phụ", kx?.sdt_phu ?? ""], ["Zalo", k.zalo ?? ""], ["Email", k.email ?? ""], ["Giới tính", k.gioi_tinh ? k.gioi_tinh.charAt(0).toUpperCase() + k.gioi_tinh.slice(1) : ""], ["Ngày sinh", ngayVN(k.ngay_sinh) || "Chưa có"],
      ["Địa chỉ", k.dia_chi ?? ""], ["Tỉnh/thành → Quận/huyện", [kx?.tinh_thanh, kx?.quan_huyen].filter(Boolean).join(" → ")],
      ["Facebook", kx?.facebook ? (/^https?:\/\//i.test(kx.facebook) ? <a href={kx.facebook} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-nhan-dam underline underline-offset-2">{kx.facebook.replace(/^https?:\/\/(www\.)?/i, "")}</a> : kx.facebook) : ""],
      ["Website", kx?.website ?? ""], ["Nghề nghiệp", kx?.nghe_nghiep ?? ""], ["Công ty", kx?.cong_ty ?? ""], ["Mã số thuế", kx?.ma_so_thue ?? ""],
      ["Chiều cao / cân nặng", [kx?.chieu_cao_cm != null ? `${soVN(Number(kx.chieu_cao_cm))} cm` : "", kx?.can_nang_kg != null ? `${soVN(Number(kx.can_nang_kg))} kg` : ""].filter(Boolean).join(" · ")],
      ["Chi nhánh khách đã đến", coSo.length > 1 ? <span>{coSo.join(", ")} <span className="nhan-nho ml-1">Nhiều chi nhánh</span></span> : coSo.join("")],
      ["Mã thẻ giấy", kx?.ma_the_giay ?? ""],
      ["Nguồn khách", NHAN_NGUON[k.nguon ?? ""] ?? k.nguon], ["Chi tiết nguồn", k.nguon_chi_tiet ?? ""], ["Người giới thiệu", nguoiGt ? `${nguoiGt.ho_ten} (${nguoiGt.ma})` : k.nguon === "khach_cu_gioi_thieu" ? "Chưa nối người giới thiệu (dữ liệu SalonHero)" : ""], ["Người phụ trách", tenNv.get(k.nguoi_phu_trach_id ?? "") ?? ""],
      ["Đồng ý dùng hình ảnh", k.dong_y_dung_hinh ? `Có${k.dong_y_dung_hinh_luc ? ` (${ngayVN(k.dong_y_dung_hinh_luc)})` : ""}` : "Chưa"], ["Ghi chú chung", k.ghi_chu ?? ""],
    ];
    noiDung = (
      <>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {hang.map(([a, b]) => (<div key={a} className="border-b border-vien pb-3"><dt className="nhan-muc">{a}</dt><dd className="mt-1 text-[13px] text-muc">{b || "—"}</dd></div>))}
        </dl>
        <h3 className="mb-3 mt-8 text-[14px] font-medium text-muc">Thẻ của khách</h3>
        <Bang duLieu={the ?? []} khoa={(r) => r.id ?? ""} trong="Khách chưa có thẻ nào."
          cot={[
            { nhan: "Mã thẻ", chinh: true, hienThi: (r) => <Link className="font-medium text-nhan-dam underline underline-offset-2" href={`/the/${r.id}`}>{r.ma}</Link> }, { nhan: "Loại", hienThi: (r) => (r.loai === "lan" ? "Liệu trình" : "Thẻ tiền") },
            { nhan: "Còn lại", hienThi: (r) => (r.loai === "lan" ? buoiConLai(r.so_buoi_con, r.so_buoi_tong) : tienVN(r.so_du_tien)), phai: true },
            { nhan: "Hạn", hienThi: (r) => ngayVN(r.han_dung) || "Không hạn" },
            { nhan: "Tình trạng", hienThi: (r) => <NhanTrangThai kieu={r.tinh_trang === "hoat_dong" ? "tot" : r.tinh_trang === "sap_het" ? "cho" : "tram"}>{({ hoat_dong: "Đang dùng", sap_het: "Sắp hết", het_han: "Hết hạn", hoan_thanh: "Đã dùng hết", khoa: "Đang khoá", thu_hoi: "Đã thu hồi" } as Record<string, string>)[r.tinh_trang ?? ""]}</NhanTrangThai> },
          ]} />
      </>
    );
  } else if (tab === "ghi-chu") {
    const { data: gc } = await db.from("khach_ghi_chu").select("*").eq("khach_id", id).order("tao_luc", { ascending: false });
    const tr: Truong[] = [
      { ten: "tinh_trang", nhan: "Tình trạng", loai: "nhieu_dong" }, { ten: "yeu_cau", nhan: "Yêu cầu của khách", loai: "nhieu_dong" },
      { ten: "phuong_an", nhan: "Phương án điều trị", loai: "nhieu_dong" }, { ten: "ket_qua", nhan: "Kết quả", loai: "nhieu_dong" },
    ];
    noiDung = (
      <>
        <h3 className="mb-3 text-[14px] font-medium text-muc">Ghi chú điều trị</h3>
        {coQuyen(nd, "hoso.sua") && <div className="mb-5"><NutHop nhan="Thêm ghi chú" tieuDe="Thêm ghi chú điều trị" moTa="Ghi chú chỉ thêm, không sửa hay xoá để giữ lịch sử hồ sơ." rong truong={tr} an={{ khach_id: id }} action={luuGhiChu} /></div>}
        {(gc ?? []).length === 0 && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Chưa có ghi chú điều trị.</p>}
        <ol className="space-y-5">
          {(gc ?? []).map((g) => (
            <li key={g.id} className="border-l-2 border-dat pl-4">
              <div className="text-[12px] text-muc-3">{ngayGioVN(g.tao_luc)} · {tenNv.get(g.tao_boi ?? "") ?? "—"}</div>
              <dl className="mt-1.5 grid gap-x-6 gap-y-2 sm:grid-cols-2 text-[14px]">
                {([["Tình trạng", g.tinh_trang], ["Yêu cầu", g.yeu_cau], ["Phương án", g.phuong_an], ["Kết quả", g.ket_qua]] as const).map(([a, b]) => b && (<div key={a}><dt className="nhan-muc">{a}</dt><dd className="mt-0.5 whitespace-pre-line text-muc">{b}</dd></div>))}
              </dl>
            </li>
          ))}
        </ol>
      </>
    );
  } else if (tab === "nguoi-than") {
    const { data: nt } = await db.from("khach_nguoi_than").select("*").eq("khach_id", id).order("ho_ten");
    const tr: Truong[] = [{ ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "quan_he", nhan: "Quan hệ", loai: "chu", goiY: "Mẹ, chồng, bạn..." }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" }];
    noiDung = (
      <>
        {sua && <div className="mb-5"><NutHop nhan="Thêm người thân" tieuDe="Thêm người thân" truong={tr} an={{ khach_id: id }} action={luuNguoiThan} /></div>}
        <Bang duLieu={nt ?? []} khoa={(r) => r.id} trong="Chưa có người thân nào." cot={[
          { nhan: "Họ tên", hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> }, { nhan: "Quan hệ", hienThi: (r) => r.quan_he ?? "" }, { nhan: "Điện thoại", hienThi: (r) => r.dien_thoai ?? "" },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof nt>[number]) => (
            <span className="flex gap-4">
              <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ho_ten}`} truong={tr} an={{ khach_id: id }} giaTri={{ ...r, quan_he: r.quan_he ?? "", dien_thoai: r.dien_thoai ?? "" }} action={luuNguoiThan} />
              <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá người thân" xacNhan={`Xoá ${r.ho_ten} khỏi danh sách người thân?`} an={{ id: r.id, khach_id: id }} nhanLuu="Xoá" action={xoaNguoiThan} />
            </span>) }] : []),
        ]} />
      </>
    );
  } else if (tab === "lich-su") {
    noiDung = <LichSuGiaoDich khachId={id} t={sp} />;
  } else if (tab === "khieu-nai") {
    const xemKn = coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet");
    const [{ data: kns }, { data: bcs }, { data: bhs }, { data: buoiDa }, { data: dvAll }, { data: chBh }] = await Promise.all([
      xemKn ? db.from("khieu_nai").select("id, ma, loai, noi_dung, trang_thai, tiep_nhan_luc").eq("khach_id", id).order("tiep_nhan_luc", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
      db.from("bien_chung").select("id, ma, dau_hieu, trang_thai, bao_luc").eq("khach_id", id).order("bao_luc", { ascending: false }).limit(30),
      xemKn ? db.from("bao_hanh_lan").select("id, dich_vu_id, ngay_lam_lai, moc, ty_le_giam").eq("khach_id", id).order("ngay_lam_lai", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
      db.from("buoi_thuc_hien").select("dich_vu_id, ngay_lam").eq("khach_id", id).eq("trang_thai", "da_lam").order("ngay_lam", { ascending: false }).limit(500),
      db.from("dich_vu").select("id, ma, ten, dich_vu_nhom(kieu_bao_hanh)"),
      db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "bh_%"),
    ]);
    const dvMap = new Map((dvAll ?? []).map((d) => [d.id, d as unknown as { id: string; ma: string; ten: string; dich_vu_nhom: { kieu_bao_hanh: string } | null }]));
    const cuoi = new Map<string, string>();
    for (const b of buoiDa ?? []) if (!cuoi.has(b.dich_vu_id)) cuoi.set(b.dich_vu_id, b.ngay_lam);
    const ts = thamSoBaoHanh(chBh ?? []), homNay = homNayHCM();
    const dongBh = [...cuoi.entries()].map(([dvId, ngay]) => ({ dvId, ngay, kq: tinhBaoHanh(ngay, homNay, dvMap.get(dvId)?.dich_vu_nhom?.kieu_bao_hanh ?? "chuan", ts), thang: thangTron(ngay, homNay) })).sort((a, b) => (a.ngay < b.ngay ? 1 : -1));
    const dvLc = (dvAll ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` }));
    const MOC: Record<string, string> = { duoi_moc_1: "Dưới mốc đầu", moc_1: "Mốc 3–6 tháng", moc_2: "Mốc 6–12 tháng", tren_moc_3: "Trên 12 tháng", nam_mot_lan: "Triệt lông 1 năm/lần" };
    noiDung = (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {coQuyen(nd, "kn.ghi") && <NutHop nhan="Ghi khiếu nại" tieuDe={`Ghi nhận khiếu nại: ${k.ho_ten}`} action={ghiKhieuNai} an={{ khach_id: id }} giaTri={{ kenh: "truc_tiep", loai: "dich_vu" }} rong truong={truongKhieuNai(dvLc, false)} nhanLuu="Ghi nhận" />}
          {(coQuyen(nd, "bc.bao") || coQuyen(nd, "kn.ghi")) && <NutHop kieu="phu" nhan="Báo dấu hiệu bất thường" tieuDe={`Báo bất thường: ${k.ho_ten}`} moTa="Ngừng thao tác gây rủi ro, đưa khách đến bác sĩ rồi mới ghi. Bác sĩ và lãnh đạo nhận thông báo ngay." action={baoBienChung} an={{ khach_id: id }} rong truong={truongBaoBatThuong(dvLc, false)} nhanLuu="Báo ngay" />}
        </div>
        <section><h3 className="mb-1 text-[15px] font-semibold text-muc">Bảo hành theo dịch vụ</h3>
          <p className="mb-3 text-[13px] text-muc-3">Tính từ buổi cuối của từng dịch vụ (Khung nghiệp vụ 4.4.2). Chỉ bấm “Ghi làm lại” khi khách thật sự được làm lại theo bảo hành.</p>
          <Bang duLieu={dongBh} khoa={(r) => r.dvId} trong="Khách chưa có buổi nào đã làm nên chưa có mốc bảo hành." cot={[
            { nhan: "Dịch vụ", chinh: true, hienThi: (r) => dvMap.get(r.dvId)?.ten ?? "" },
            { nhan: "Buổi cuối", hienThi: (r) => <div className="text-[13px]">{ngayVN(r.ngay)}<div className="text-muc-3">cách {r.thang} tháng</div></div> },
            { nhan: "Mốc hiện tại", hienThi: (r) => <div className="text-[13px]"><span className="font-medium text-muc">{r.kq.nhan}</span><div className="text-muc-3">{r.kq.chiTiet}</div></div> },
            ...(coQuyen(nd, "kn.ghi") ? [{ nhan: "", hienThi: (r: (typeof dongBh)[number]) => <NutHop kieu="chu" nhan="Ghi làm lại" tieuDe={`Làm lại theo bảo hành: ${dvMap.get(r.dvId)?.ten ?? ""}`} moTa={`${r.kq.nhan}: ${r.kq.chiTiet} Mốc và % ưu đãi do hệ thống tính, lưu lại như lúc này.`} action={ghiBaoHanh} an={{ khach_id: id, dich_vu_id: r.dvId }} truong={[{ ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true }]} nhanLuu="Ghi nhận" /> }] : []),
          ]} /></section>
        {xemKn && <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Khiếu nại</h3>
          <Bang duLieu={kns ?? []} khoa={(r) => r.id} trong="Khách chưa có khiếu nại nào." cot={[
            { nhan: "Mã", chinh: true, hienThi: (r) => <Link className="font-medium text-nhan-dam hover:underline" href={`/khieu-nai/${r.id}`}>{r.ma}</Link> },
            { nhan: "Loại", hienThi: (r) => LOAI_KN[r.loai]?.replace(" (chuyển biến chứng)", "") }, { nhan: "Nội dung", hienThi: (r) => <span className="line-clamp-2 text-[13px]">{r.noi_dung}</span> },
            { nhan: "Ngày", hienThi: (r) => ngayGioVN(r.tiep_nhan_luc) }, { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_KN[r.trang_thai].kieu}>{TT_KN[r.trang_thai].ten}</NhanTrangThai> },
          ]} /></section>}
        <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Biến chứng</h3>
          <Bang duLieu={bcs ?? []} khoa={(r) => r.id} trong="Khách chưa có ca biến chứng nào." cot={[
            { nhan: "Mã", chinh: true, hienThi: (r) => <Link className="font-medium text-nhan-dam hover:underline" href={`/khieu-nai/bien-chung/${r.id}`}>{r.ma}</Link> },
            { nhan: "Dấu hiệu", hienThi: (r) => <span className="line-clamp-2 text-[13px]">{r.dau_hieu}</span> }, { nhan: "Báo lúc", hienThi: (r) => ngayGioVN(r.bao_luc) },
            { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_BC[r.trang_thai].kieu}>{TT_BC[r.trang_thai].ten}</NhanTrangThai> },
          ]} /></section>
        {xemKn && (bhs ?? []).length > 0 && <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Đã làm lại theo bảo hành</h3>
          <Bang duLieu={bhs ?? []} khoa={(r) => r.id} trong="" cot={[
            { nhan: "Dịch vụ", chinh: true, hienThi: (r) => dvMap.get(r.dich_vu_id)?.ten ?? "" }, { nhan: "Ngày làm lại", hienThi: (r) => ngayVN(r.ngay_lam_lai) },
            { nhan: "Mốc", hienThi: (r) => `${MOC[r.moc]}${r.ty_le_giam != null ? ` · ưu đãi ${Number(r.ty_le_giam)}%` : ""}` },
          ]} /></section>}
      </div>
    );
  } else if (tab === "nhac-nho") {
    // Nhắc nhở chuyển từ SalonHero (60 nghìn dòng): đang nhắc lên trước, rồi theo ngày nhắc mới nhất.
    const trang = Math.max(1, Math.min(10_000, Number(trangDiem) || 1));
    const { data: ds, count } = await db.from("khach_nhac").select("id, ngay_nhac, noi_dung, ghi_chu, trang_thai, dich_vu_ten, kieu_lap, so_lan_lap, hoan_thanh_luc, nguoi_tao_ten, nguoi_phu_trach_ten", { count: "exact" })
      .eq("khach_id", id).order("trang_thai", { ascending: true }).order("ngay_nhac", { ascending: false, nullsFirst: false }).range((trang - 1) * DIEM_MOI_TRANG, trang * DIEM_MOI_TRANG - 1);
    const soTrang = Math.max(1, Math.ceil((count ?? 0) / DIEM_MOI_TRANG));
    const lk = (n: number) => `/khach-hang/${id}?tab=nhac-nho&trang=${n}`;
    const NHAN_NHAC: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = { dang_nhac: { nhan: "Chưa thực hiện", kieu: "cho" }, da_xong: { nhan: "Đã xong", kieu: "tot" }, huy: { nhan: "Đã huỷ", kieu: "tram" } };
    const KIEU_LAP: Record<string, string> = { DAY: "Hằng ngày", WEEK: "Hằng tuần", MONTH: "Hằng tháng" };
    noiDung = (
      <>
        <p className="mb-4 text-[13px] text-muc-3">{soVN(count ?? 0)} nhắc nhở (chưa thực hiện xếp trước).</p>
        <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Khách chưa có nhắc nhở nào." cot={[
          { nhan: "Ngày nhắc", chinh: true, hienThi: (r) => (r.ngay_nhac ? ngayGioVN(r.ngay_nhac) : "") },
          { nhan: "Trạng thái", hienThi: (r) => { const n = NHAN_NHAC[r.trang_thai] ?? NHAN_NHAC.dang_nhac; return <NhanTrangThai kieu={n.kieu}>{n.nhan}</NhanTrangThai>; } },
          { nhan: "Nội dung", hienThi: (r) => <span className="line-clamp-3 whitespace-pre-line text-[13px]">{r.noi_dung ?? ""}{r.ghi_chu ? ` — ${r.ghi_chu}` : ""}</span> },
          { nhan: "Dịch vụ", hienThi: (r) => r.dich_vu_ten ?? "" },
          { nhan: "Lặp", hienThi: (r) => (r.kieu_lap && r.kieu_lap !== "SINGLE" ? `${KIEU_LAP[r.kieu_lap] ?? r.kieu_lap}${r.so_lan_lap ? ` · ${r.so_lan_lap} lần` : ""}` : "") },
          { nhan: "Người tạo", hienThi: (r) => r.nguoi_tao_ten ?? "" },
          { nhan: "Phụ trách", hienThi: (r) => r.nguoi_phu_trach_ten ?? "" },
        ]} />
        {soTrang > 1 && (
          <nav aria-label="Trang nhắc nhở" className="mt-4 flex items-center justify-between gap-3 text-[13px]">
            {trang > 1 ? <Link scroll={false} href={lk(trang - 1)} className="font-medium text-nhan-dam hover:underline">← Trang trước</Link> : <span />}
            <span className="tabular-nums">Trang {trang}/{soTrang}</span>
            {trang < soTrang ? <Link scroll={false} href={lk(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau →</Link> : <span />}
          </nav>
        )}
      </>
    );
  } else if (tab === "diem-thuong") {
    const trang = Math.max(1, Math.min(10_000, Number(trangDiem) || 1));
    const { data: ds, count } = await db.from("khach_diem_so").select("id, tao_luc, loai, so_diem, so_du_sau_sh, ly_do, ma_hoa_don_sh, hoa_don_sh_id, nguoi_tao_ten, chi_nhanh_id", { count: "exact" })
      .eq("khach_id", id).order("tao_luc", { ascending: false }).order("id", { ascending: false }).range((trang - 1) * DIEM_MOI_TRANG, trang * DIEM_MOI_TRANG - 1);
    const shIds = [...new Set((ds ?? []).map((r) => r.hoa_don_sh_id).filter((x): x is number => x != null))];
    const { data: hdLk } = shIds.length ? await db.from("hoa_don").select("id, sh_id").in("sh_id", shIds) : { data: [] };
    const hdTheoSh = new Map((hdLk ?? []).map((h) => [h.sh_id, h.id]));
    const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
    const soTrang = Math.max(1, Math.ceil((count ?? 0) / DIEM_MOI_TRANG));
    const lk = (n: number) => `/khach-hang/${id}?tab=diem-thuong&trang=${n}`;
    noiDung = (
      <>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p><span className="text-[13px] text-muc-3">Số dư điểm hiện tại </span><span className="text-[20px] font-medium tabular-nums text-muc">{soVN(kx?.diem_so_du ?? 0)}</span></p>
          <p className="text-[13px] text-muc-3">{soVN(count ?? 0)} lần cộng/trừ điểm</p>
        </div>
        <Bang duLieu={ds ?? []} khoa={(r) => String(r.id)} trong="Khách chưa có lịch sử điểm thưởng." cot={[
          { nhan: "Thời gian", chinh: true, hienThi: (r) => ngayGioVN(r.tao_luc) },
          { nhan: "Loại", hienThi: (r) => LOAI_DIEM[r.loai] ?? r.loai },
          { nhan: "Điểm", phai: true, hienThi: (r) => <span className={`tabular-nums font-medium ${r.so_diem < 0 ? "text-loi" : "text-muc"}`}>{r.so_diem > 0 ? "+" : ""}{soVN(r.so_diem)}</span> },
          { nhan: "Số dư sau", phai: true, hienThi: (r) => (r.so_du_sau_sh != null ? soVN(r.so_du_sau_sh) : "") },
          { nhan: "Hoá đơn", hienThi: (r) => { const hd = r.hoa_don_sh_id != null ? hdTheoSh.get(r.hoa_don_sh_id) : undefined; return hd ? <Link className="font-medium text-nhan-dam hover:underline" href={`/hoa-don/${hd}`}>{r.ma_hoa_don_sh}</Link> : (r.ma_hoa_don_sh ?? ""); } },
          { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id ?? "") ?? "" },
          { nhan: "Người tạo", hienThi: (r) => r.nguoi_tao_ten ?? "" },
          { nhan: "Lý do", hienThi: (r) => <span className="line-clamp-2 text-[13px]">{r.ly_do ?? ""}</span> },
        ]} />
        {soTrang > 1 && (
          <nav aria-label="Trang lịch sử điểm" className="mt-4 flex items-center justify-between gap-3 text-[13px]">
            {trang > 1 ? <Link scroll={false} href={lk(trang - 1)} className="font-medium text-nhan-dam hover:underline">← Trang trước</Link> : <span />}
            <span className="tabular-nums">Trang {trang}/{soTrang}</span>
            {trang < soTrang ? <Link scroll={false} href={lk(trang + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau →</Link> : <span />}
          </nav>
        )}
      </>
    );
  } else {
    // Chỉ lấy + ký link cho trang đầu; phần còn lại LuoiAnh xin thêm khi cuộn tới (khách có thể có hàng nghìn ảnh).
    const [trangDau, { count: tongAnh }, { count: soTam }] = await Promise.all([
      docTrangAnh(id, 0),
      db.from("khach_anh").select("id", { count: "exact", head: true }).eq("khach_id", id),
      db.from("khach_anh").select("id", { count: "exact", head: true }).eq("khach_id", id).not("het_han", "is", null),
    ]);
    // Ảnh cũ ở kho lưu trữ (Lark): số ảnh, ảnh đang mở xem tạm, và yêu cầu lấy ảnh gần nhất.
    const [{ data: lt }, { data: yc }] = await Promise.all([
      db.from("khach_anh_luu_tru").select("so_anh").eq("khach_id", id).maybeSingle(),
      db.from("yeu_cau_lay_anh").select("trang_thai, tao_luc, so_anh_lay").eq("khach_id", id).order("tao_luc", { ascending: false }).limit(1).maybeSingle(),
    ]);
    // Còn ảnh cũ chưa về → tự xếp yêu cầu lấy (mỗi lần tối đa 300 ảnh, xong lượt này tới lượt sau). Lần trước lỗi trong 10 phút qua thì chưa thử lại.
    const conLaiCu = Math.max(0, (lt?.so_anh ?? 0) - (soTam ?? 0));
    const dangLayCu = yc?.trang_thai === "cho" || yc?.trang_thai === "dang_lay";
    const loiGanDay = (yc?.trang_thai === "loi" && moiXayRa(yc.tao_luc, 10 * 60_000)) || (yc?.trang_thai === "xong" && yc.so_anh_lay === 0); // lượt trước không lấy thêm được ảnh nào: không lặp mãi
    noiDung = (
      <>
        {coQuyen(nd, "anh.them") && <TaiAnh khachId={id} />}
        {lt && lt.so_anh > 0 && coQuyen(nd, "anh.xem") && <AnhCuLuuTru khachId={id} canLay={conLaiCu > 0 && !dangLayCu && !loiGanDay} dangLay={dangLayCu} />}
        {!k.dong_y_dung_hinh && <p className="mb-4 rounded-nho bg-canh-bao-nen px-3 py-2 text-[13px] text-canh-bao">Khách chưa đồng ý bằng văn bản cho dùng hình ảnh: ảnh chỉ lưu hồ sơ điều trị, không dùng cho quảng cáo.</p>}
        {(tongAnh ?? 0) === 0 && !dangLayCu && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Chưa có ảnh nào.</p>}
        <LuoiAnh khachId={id} banDau={trangDau} tong={tongAnh ?? 0} quyenXoa={coQuyen(nd, "anh.them") ? { tatCa: coQuyen(nd, "hoso.sua"), nhanVienId: nd.nhanVienId } : null} />
      </>
    );
  }

  const NUT_LIEN_KET = "flex h-9 items-center rounded-nho border border-vien-dam px-3.5 text-[13px] font-medium text-muc-2 hover:bg-giay-tram";
  const chiSo: [string, string][] = [
    ["Chi 12 tháng gần nhất", tienVN(k.chi_12_thang)], ["Thẻ đang dùng", soVN(k.so_the_dang_dung)], ["Còn nợ", tienVN(tongNo)], ["Điểm thưởng", soVN(kx?.diem_so_du ?? 0)], ["Tạo hồ sơ", ngayVN(k.tao_luc)],
  ];
  // Như đầu hồ sơ SalonHero: ghé thăm lần cuối + 3 số đếm đặt / đến / huỷ (chỉ khách có số từ SalonHero; "đặt từ app" SalonHero không xuất nên không có).
  const soDem: [string, string][] = [
    ...(kx?.lan_den_cuoi ? [["Ghé thăm lần cuối", ngayVN(kx.lan_den_cuoi)] as [string, string]] : []),
    ...(kx?.tong_dat_lich_goc != null ? [["Tổng số lần đặt trước", `${soVN(kx.tong_dat_lich_goc)} lần`], ["Tổng số lần đến trực tiếp", `${soVN(kx.tong_checkin_goc ?? 0)} lần`], ["Tổng số lần hủy đặt / không đến", `${soVN(kx.tong_huy_lich_goc ?? 0)} lần`]] as [string, string][] : []),
  ];
  return (
    <>
      <Link href="/khach-hang" className="mb-3 inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div className="rounded-the border border-vien bg-giay-sang p-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="chu-tieu-de text-[20px] font-bold uppercase leading-tight text-muc [overflow-wrap:anywhere]">{k.ho_ten}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-muc-3"><span className="tabular-nums">{k.ma}</span><NhanTrangThai kieu={tt.kieu}>{tt.nhan}</NhanTrangThai><NhanTrangThai kieu="tram">Hạng {k.hang}</NhanTrangThai>
              {theSapHet.length > 0 && <Link href="/khach-hang/the-sap-het" title={theSapHet.map((t) => t.ten_goi).join(", ")}><NhanTrangThai kieu="cho">Thẻ sắp hết{theSapHet.length > 1 ? ` (${theSapHet.length})` : ""}</NhanTrangThai></Link>}
              {taiKham.length > 0 && <Link href="/khach-hang/tai-kham" title={`Hẹn tái khám ${ngayVN(taiKham[0].den_han)}`}><NhanTrangThai kieu="cho">{taiKham[0].so_ngay_tre > 0 ? `Quá hẹn tái khám ${taiKham[0].so_ngay_tre} ngày` : "Đến hẹn tái khám"}</NhanTrangThai></Link>}</div>
            {(nhom.length > 0 || sua) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1" aria-label="Nhóm khách">
                {nhom.map((n) => <NhanNhom key={n.id} ten={n.ten} mau={n.mau} />)}
                {sua && <NutHop kieu="chu" nhan={nhom.length ? "Đổi nhóm" : "Gán nhóm"} tieuDe={`Nhóm của ${k.ho_ten}`} moTa="Một khách có thể thuộc nhiều nhóm." truong={[{ ten: "nhom", nhan: "Nhóm khách", loai: "nhieu", luaChon: (moiNhom ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })) }]} an={{ khach_id: id }} giaTri={{ nhom: nhom.map((n) => n.id) }} action={ganNhomChoKhach} />}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sua && <NutHop kieu="phu" nhan="Sửa" tieuDe="Sửa hồ sơ khách" rong truong={truong} giaTri={giaTriSua} action={luuKhach} />}
            {coQuyen(nd, "lich.sua") && <Link href={`/lich-hen?khach=${id}`} className={NUT_LIEN_KET}>Đặt lịch</Link>}
            {coQuyen(nd, "ban.tao") && <Link href={`/ban-hang?khach=${id}`} className="nut-vang flex h-9 items-center rounded-nho px-3.5 text-[13px]">Tạo đơn</Link>}
            <Link href={`/in-ma-khach/${id}`} target="_blank" className={NUT_LIEN_KET}>In mã</Link>
            <Link href={`/in-ma-khach/${id}?kieu=phieu`} target="_blank" className={NUT_LIEN_KET}>In phiếu</Link>
            {sua && <NutHop kieu="phu" nhan={k.danh_dau_mat ? "Bỏ đánh dấu mất" : "Đánh dấu đã mất"} tieuDe="Đánh dấu khách" xacNhan={k.danh_dau_mat ? "Đưa khách trở lại luồng chăm sóc?" : "Khách không còn quay lại? Trạng thái sẽ là 'Đã mất' cho tới khi bỏ đánh dấu."} an={{ id, mat: k.danh_dau_mat ? "0" : "1" }} nhanLuu="Xác nhận" action={danhDauMat} />}
            {coQuyen(nd, "khach.nhap") && <NutHop kieu="phu" nguy nhan="Xoá" tieuDe={`Xoá khách ${k.ho_ten}`} xacNhan="Chỉ xoá được khách nhập nhầm (chưa có hoá đơn, lịch, thẻ, ảnh, ghi chú điều trị). Xoá rồi không khôi phục được. Tiếp tục?" an={{ id }} nhanLuu="Xoá khách" action={xoaKhach} />}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-vien pt-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
          {chiSo.map(([a, b]) => (<div key={a}><dt className="text-[12px] text-muc-3">{a}</dt><dd className="mt-0.5 text-[16px] font-medium tabular-nums text-muc">{b}</dd></div>))}
        </dl>
        {soDem.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-vien pt-3 sm:grid-cols-4">
            {soDem.map(([a, b]) => (<div key={a}><dt className="text-[12px] text-muc-3">{a}</dt><dd className="mt-0.5 text-[14px] font-medium tabular-nums text-muc">{b}</dd></div>))}
          </dl>
        )}
      </div>
      <div role="tablist" className="tab-khach mt-4 mb-4">
        {tabHopLe.map((m) => (
          <Link key={m.ma} href={`/khach-hang/${id}?tab=${m.ma}`} role="tab" aria-selected={tab === m.ma} scroll={false}>{m.ten}</Link>
        ))}
      </div>
      {noiDung}
    </>
  );
}

/** Số ảnh của khách cho nhãn tab: ảnh đã có trong kho riêng + ảnh cũ còn ở kho lưu trữ chưa lấy về. */
async function demAnhKhach(id: string) {
  const db = sb();
  const [{ count: coSan }, { count: tam }, { data: luuTru }] = await Promise.all([
    db.from("khach_anh").select("id", { count: "exact", head: true }).eq("khach_id", id),
    db.from("khach_anh").select("id", { count: "exact", head: true }).eq("khach_id", id).not("het_han", "is", null),
    db.from("khach_anh_luu_tru").select("so_anh").eq("khach_id", id).maybeSingle(),
  ]);
  return (coSan ?? 0) + Math.max(0, (luuTru?.so_anh ?? 0) - (tam ?? 0));
}
