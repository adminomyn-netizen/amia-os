import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { gioVN, homNayHCM, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { NUT_CHINH } from "@/components/ui/dinh-dang";
import { LOAI_VI, nhanKhoanThu, PHUONG_THUC_TIEN, VAI } from "@/lib/ban-hang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { dieuChinhNo, ghiNhanVat, huyHoaDon, huyLanTraNo, luuDanhGia, moLaiHoaDon, thuNo } from "../actions";
import { maPhieuThu } from "@/lib/phieu-thu";
import { luuDanhGiaSauDieuTri } from "../sau-dieu-tri-actions";
import { KET_QUA_DG, LY_DO_KHONG_HAI_LONG, truongSauDieuTri } from "@/lib/sau-dieu-tri";
import { DanhGiaNhanVien } from "@/components/hoa-don/DanhGiaNhanVien";
import { TRANG_THAI_HD } from "@/lib/loc-hoa-don";

export default async function ChiTietHoaDon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ moi?: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const { id } = await params;
  const { moi } = await searchParams;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("*").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: tt }, { data: nv }, { data: k }, { data: diem }, { data: lich }, { data: nguoiGt }, { data: cn }] = await Promise.all([
    db.from("hoa_don_dong").select("*").eq("hoa_don_id", id).order("tao_luc"),
    db.from("thanh_toan").select("*").eq("hoa_don_id", id).order("tao_luc"),
    db.from("nhan_vien").select("id, ho_ten"),
    h.khach_id ? db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
    // Điểm thưởng ghi cho hoá đơn này (đơn nhập từ SalonHero: sổ điểm tra theo mã đơn SalonHero).
    h.sh_id ? db.from("khach_diem_so").select("loai, so_diem").eq("hoa_don_sh_id", h.sh_id) : Promise.resolve({ data: [] }),
    h.lich_hen_id ? db.from("lich_hen").select("phong, ma_dat_lich").eq("id", h.lich_hen_id).maybeSingle() : Promise.resolve({ data: null }),
    h.nguoi_gioi_thieu_id ? db.from("khach_hang").select("id, ma, ho_ten").eq("id", h.nguoi_gioi_thieu_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("chi_nhanh").select("ten").eq("id", h.chi_nhanh_id).maybeSingle(),
  ]);
  // "Chỉnh sửa lần cuối" như SalonHero: thao tác ghi gần nhất trên hoá đơn (nhật ký; bỏ lượt xuất Excel vì không sửa gì), so với lúc chốt / huỷ, lấy mốc muộn nhất.
  const { data: nkCuoi } = await db.from("nhat_ky_truy_cap").select("nguoi_id, hanh_dong, luc").eq("doi_tuong", "hoa_don").eq("doi_tuong_id", id).neq("hanh_dong", "xuat_excel").order("luc", { ascending: false }).limit(1).maybeSingle();
  // Lịch sử nợ (như hộp "Nợ của khách" SalonHero): các lần trả nợ sau khi chốt đơn và các lần xoá nợ; chỉ dòng cuối còn hiệu lực được huỷ.
  const { data: lsNo } = h.trang_thai === "hoan_thanh" ? await db.rpc("lich_su_no_hoa_don", { p_id: id }) : { data: [] };
  const idsDong = (dong ?? []).map((d) => d.id);
  const { data: chia } = idsDong.length ? await db.from("dong_nhan_vien").select("*").in("dong_id", idsDong) : { data: [] };
  const tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
  // Đánh giá nhân viên: người đứng vai Phục vụ ở bất kỳ dòng nào của hoá đơn đã hoàn thành.
  const idPhucVu = [...new Set((chia ?? []).filter((c) => c.vai === "phuc_vu").map((c) => c.nhan_vien_id))];
  const { data: dgia } = h.trang_thai === "hoan_thanh" && idPhucVu.length ? await db.from("danh_gia_nhan_vien").select("nhan_vien_id, diem, y_kien").eq("hoa_don_id", id) : { data: [] };
  const dongDg = idPhucVu.map((nvId) => { const d = (dgia ?? []).find((x) => x.nhan_vien_id === nvId); return { nhanVienId: nvId, ten: tenNv.get(nvId) ?? "", diem: d?.diem ?? 0, yKien: d?.y_kien ?? "" }; }).sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  const duocGhiDg = coQuyen(nd, "ban.tao") || coQuyen(nd, "lich.sua");
  // Khách hài lòng sau điều trị (khác đánh giá sao từng nhân viên): chỉ cho đơn hoàn thành của một khách, có ít nhất một dịch vụ.
  const coDichVu = (dong ?? []).some((d) => d.loai === "dich_vu");
  const { data: dgSdt } = h.trang_thai === "hoan_thanh" && h.khach_id && coDichVu && !h.la_so_du_dau ? await db.from("danh_gia_sau_dieu_tri").select("*").eq("hoa_don_id", id).maybeSingle() : { data: null };
  const hienSdt = h.trang_thai === "hoan_thanh" && !!h.khach_id && coDichVu && !h.la_so_du_dau;
  const { data: lichDg } = hienSdt && !dgSdt && h.lich_hen_id ? await db.from("danh_gia_sau_dieu_tri").select("id").eq("lich_hen_id", h.lich_hen_id).maybeSingle() : { data: null };
  // Đơn nhập từ SalonHero: người lập là tài khoản hệ thống, người làm thật nằm ở tên thu ngân đã hoàn tất đơn. Đơn tạo ở AMIA: chốt ngay khi lập nên người hoàn thành là người lập.
  const nguoiLap = (h.la_lich_su ? h.thu_ngan_ten : tenNv.get(h.nguoi_lap_id)) ?? "";
  const diemCong = (diem ?? []).filter((x) => x.loai === "cong_hoa_don").reduce((s, x) => s + x.so_diem, 0);
  const diemTru = (diem ?? []).filter((x) => x.loai === "hoan_hoa_don").reduce((s, x) => s + x.so_diem, 0);
  const t = TRANG_THAI_HD[h.trang_thai as keyof typeof TRANG_THAI_HD];
  // Mốc sửa cuối: nhật ký (ai, lúc) / huỷ / chốt. Đơn SalonHero không có nhật ký AMIA → lúc chốt + tên thu ngân.
  const mocSua = ([
    nkCuoi ? { luc: nkCuoi.luc, ai: tenNv.get(nkCuoi.nguoi_id ?? "") ?? "" } : null,
    h.huy_luc ? { luc: h.huy_luc, ai: h.la_lich_su ? h.thu_ngan_ten ?? "" : "" } : null,
    h.chot_luc ? { luc: h.chot_luc, ai: nguoiLap } : null,
  ].filter(Boolean) as { luc: string; ai: string }[]).sort((a, b) => b.luc.localeCompare(a.luc))[0];
  // Tiền khách đưa / trả lại khách (lưu lúc thanh toán ở Thu ngân, migration 0213): trả lại = khách đưa − phần thu tiền mặt của đơn.
  const tienMatThu = (tt ?? []).filter((x) => x.phuong_thuc === "tien_mat").reduce((s, x) => s + (x.loai === "thu" ? Number(x.so_tien) : -Number(x.so_tien)), 0);
  const khachDua = h.khach_dua == null ? null : Number(h.khach_dua);
  const KHOA_SH = "Đơn chuyển từ SalonHero: sửa ở SalonHero tới 15/11 (đồng bộ đêm ghi đè).";
  type Muc = [string, React.ReactNode];
  const thongTin = ([
    ["Chi nhánh", cn?.ten],
    h.khach_moi ? ["Khách", <span key="km" className="rounded-tag bg-loi-nen px-2 py-0.5 text-[12px] font-medium text-loi">Khách mới</span>] : null, // như SalonHero: cờ khách mới của hoá đơn (0212)
    ["Tạo lúc", ngayGioVN(h.tao_luc)],
    h.chot_luc ? ["Hoàn thành lúc", ngayGioVN(h.chot_luc)] : null,
    h.chot_luc && nguoiLap ? ["Hoàn thành bởi", nguoiLap] : null,
    h.huy_luc ? ["Huỷ lúc", ngayGioVN(h.huy_luc)] : null,
    ["Giờ vào", h.gio_vao ? gioVN(h.gio_vao) : gioVN(h.tao_luc)],
    h.gio_ra || h.chot_luc ? ["Giờ ra", gioVN((h.gio_ra ?? h.chot_luc) as string)] : null,
    mocSua ? ["Chỉnh sửa lần cuối", `${ngayGioVN(mocSua.luc)}${mocSua.ai ? ` · ${mocSua.ai}` : ""}`] : null,
    khachDua != null ? ["Tiền khách đưa", tienVN(khachDua)] : null,
    khachDua != null ? ["Trả lại khách", tienVN(Math.max(khachDua - tienMatThu, 0))] : null,
    lich?.ma_dat_lich ? ["Lịch hẹn", lich.ma_dat_lich] : null,
    lich?.phong ? ["Vị trí / chỗ", lich.phong] : null,
    nguoiGt ? ["Người giới thiệu", <Link key="gt" href={`/khach-hang/${nguoiGt.id}`} className="font-medium text-nhan-dam hover:underline">{nguoiGt.ho_ten} · {nguoiGt.ma}</Link>] : null,
    diemCong || diemTru ? ["Điểm thưởng", `${diemCong > 0 ? `+${diemCong.toLocaleString("vi-VN")} điểm` : ""}${diemCong && diemTru ? " · " : ""}${diemTru ? `${diemTru.toLocaleString("vi-VN")} điểm (hoàn)` : ""}`] : null,
    Number(h.giam_diem) > 0 ? ["Đổi điểm", `giảm ${tienVN(h.giam_diem)}`] : null,
    Number(h.giam_voucher) > 0 ? ["Voucher", `giảm ${tienVN(h.giam_voucher)}`] : null,
  ] as (Muc | null)[]).filter((x): x is Muc => !!x && x[1] !== undefined && x[1] !== null && x[1] !== "");
  const coNo = h.trang_thai === "hoan_thanh" && Number(h.con_no) > 0;

  return (
    <>
      <TieuDeTrang tieuDe={h.ma} phu={<span className="flex flex-wrap items-center gap-2"><NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai><span>{ngayVN(h.ngay_hd)}{h.tao_luc ? ` ${gioVN(h.tao_luc)}` : ""} · lập bởi {nguoiLap}</span>{k && <Link href={`/khach-hang/${k.id}`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten} · {k.ma}</Link>}</span>}>
        <Link href={`/in/hoa-don/${id}`} target="_blank" className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">In hoá đơn</Link>
        {coNo && coQuyen(nd, "no.thu") && (
          <NutHop nhan="Thu nợ" tieuDe="Thu nợ" moTa={`Còn nợ ${tienVN(h.con_no)}. Mỗi lần thu được ghi vào sổ thu tiền, không sửa lại được.`} an={{ hoa_don_id: id }} giaTri={{ phuong_thuc: "tien_mat", so_tien: Number(h.con_no), ngay: homNayHCM() }}
            truong={[{ ten: "phuong_thuc", nhan: "Phương thức", loai: "chon", luaChon: PHUONG_THUC_TIEN, batBuoc: true }, { ten: "loai_vi", nhan: "Loại ví", loai: "chon", luaChon: LOAI_VI, batBuoc: true, hienKhi: { ten: "phuong_thuc", la: ["vi_dien_tu"] } }, { ten: "so_tien", nhan: "Số tiền thu", loai: "tien", batBuoc: true }, { ten: "ngay", nhan: "Ngày thu", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }]} action={thuNo} />
        )}
        {coNo && h.la_lich_su && coQuyen(nd, "no.xoa") && <button type="button" disabled title={KHOA_SH} className="h-10 cursor-not-allowed rounded-nho border border-vien px-4 text-[14px] font-medium text-muc-3">Điều chỉnh nợ (khoá)</button>}
        {coNo && !h.la_lich_su && coQuyen(nd, "no.xoa") && (
          <NutHop kieu="phu" nhan="Điều chỉnh nợ" tieuDe="Điều chỉnh nợ (xoá nợ)" moTa={`Nợ hiện tại ${tienVN(h.con_no)}. Nhập số nợ mới (nhỏ hơn nợ hiện tại; 0 = xoá hết). Phần chênh ghi là "Xoá nợ", không vào sổ quỹ.`} an={{ hoa_don_id: id }} giaTri={{ no_moi: 0 }} nhanLuu="Lưu điều chỉnh"
            truong={[{ ten: "no_moi", nhan: "Số nợ mới", loai: "tien", batBuoc: true }, { ten: "ly_do", nhan: "Lý do điều chỉnh nợ", loai: "nhieu_dong", batBuoc: true }]} action={dieuChinhNo} />
        )}
        {h.trang_thai === "hoan_thanh" && h.la_lich_su && !h.la_so_du_dau && coQuyen(nd, "ban.sua") && <button type="button" disabled title={KHOA_SH} className="h-10 cursor-not-allowed rounded-nho border border-vien px-4 text-[14px] font-medium text-muc-3">Sửa hoá đơn (khoá)</button>}
        {h.trang_thai === "hoan_thanh" && !h.la_lich_su && !h.la_so_du_dau && coQuyen(nd, "ban.sua") && (h.vat_hd_so || h.vat_hd_luc) && (
          <span className="self-center text-[13px] text-muc-3">Không sửa được: đã xuất hoá đơn điện tử{h.vat_hd_so ? ` số ${h.vat_hd_so}` : ""}. Xử lý hoá đơn điện tử (điều chỉnh/thay thế) và xoá số ở mục Hoá đơn VAT trước.</span>
        )}
        {h.trang_thai === "hoan_thanh" && !h.la_lich_su && !h.la_so_du_dau && coQuyen(nd, "ban.sua") && !h.vat_hd_so && !h.vat_hd_luc && (
          <NutHop kieu="phu" nhan="Sửa hoá đơn" tieuDe="Sửa hoá đơn đã chốt" moTa="Hoá đơn về Nháp rồi mở ở Thu ngân để sửa và thanh toán lại (giữ mã, giữ ngày). Khoản thu cũ được ghi đảo cùng ngày, thẻ đã bán (chưa dùng) bị thu hồi, sản phẩm trả kho; khi chốt lại sẽ ghi mới."
            an={{ hoa_don_id: id }} nhanLuu="Mở lại để sửa" truong={[{ ten: "ly_do", nhan: "Lý do sửa", loai: "nhieu_dong", batBuoc: true }]} action={moLaiHoaDon} />
        )}
        {h.trang_thai === "nhap" && h.mo_lai_luc && coQuyen(nd, "ban.tao") && (
          <Link href={`/ban-hang?sua=${id}`} className={`${NUT_CHINH} inline-flex items-center`}>Tiếp tục sửa ở Thu ngân</Link>
        )}
        {h.trang_thai !== "huy" && coQuyen(nd, "ban.huy") && (
          <NutHop kieu="phu" nhan="Huỷ hoá đơn" tieuDe="Huỷ hoá đơn" moTa="Huỷ sẽ hoàn lại các khoản đã thu (kể cả thẻ tiền), thu hồi thẻ đã bán và trả kho. Không huỷ được nếu thẻ đã được dùng." an={{ hoa_don_id: id }} nhanLuu="Huỷ hoá đơn"
            truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "nhieu_dong", batBuoc: true }]} action={huyHoaDon} />
        )}
      </TieuDeTrang>
      {h.la_lich_su && h.trang_thai === "hoan_thanh" && (coQuyen(nd, "ban.sua") || coQuyen(nd, "no.xoa") || coQuyen(nd, "no.thu")) && <p className="mb-5 rounded-nho bg-giay-tram px-3 py-2.5 text-[13px] text-muc-2">{KHOA_SH} Sửa hoá đơn, điều chỉnh nợ và huỷ lần trả nợ của đơn này làm ở SalonHero; từ 15/11 làm ngay tại đây.</p>}
      {moi === "1" && <p role="status" className="mb-5 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">Đã chốt đơn {h.ma}.</p>}
      {h.trang_thai === "huy" && <p className="mb-5 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Đã huỷ ngày {ngayGioVN(h.huy_luc)}. Lý do: {h.ly_do_huy}</p>}
      <HangChiSo muc={[{ nhan: "Tiền hàng", so: tienVN(h.tong_hang) }, { nhan: "Phải thu", so: tienVN(h.tong_phai_thu) }, { nhan: "Đã thu", so: tienVN(h.da_thu) }, { nhan: "Còn nợ", so: tienVN(h.trang_thai === "huy" ? 0 : h.con_no) }]} />
      <div className="mt-8 space-y-8">
        <MucTrang tieuDe="Thông tin hoá đơn">
          <dl className="grid gap-x-8 gap-y-2 text-[14px] sm:grid-cols-2 lg:grid-cols-3">
            {thongTin.map(([n, v]) => <div key={n} className="flex min-w-0 gap-2"><dt className="shrink-0 text-muc-3">{n}:</dt><dd className="min-w-0 break-words font-medium text-muc">{v}</dd></div>)}
          </dl>
        </MucTrang>
        <MucTrang tieuDe="Dòng hàng">
          <Bang duLieu={dong ?? []} khoa={(r) => r.id} cot={[
            { nhan: "Mục", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "SL", hienThi: (r) => r.so_luong, phai: true }, { nhan: "Đơn giá", hienThi: (r) => tienVN(r.don_gia), phai: true },
            { nhan: "Giảm", hienThi: (r) => (r.giam_gia ? tienVN(r.giam_gia) : ""), phai: true },
            { nhan: "% giảm", hienThi: (r) => (r.giam_gia && r.don_gia * r.so_luong > 0 ? `${Math.round((r.giam_gia * 10000) / (r.don_gia * r.so_luong)) / 100}%` : ""), phai: true }, { nhan: "Thành tiền", hienThi: (r) => tienVN(r.thanh_tien), phai: true },
            { nhan: "Người hưởng", hienThi: (r) => VAI.map((v) => { const ds = (chia ?? []).filter((c) => c.dong_id === r.id && c.vai === v.ma); return ds.length ? `${v.ten}: ${ds.map((c) => `${tenNv.get(c.nhan_vien_id)} ${Number(c.ti_le)}%`).join(", ")}` : null; }).filter(Boolean).join(" · ") },
          ]} />
          <dl className="ml-auto mt-3 w-full max-w-xs space-y-1 text-[14px]">
            {Number(h.giam_gia_don) > 0 && <div className="flex justify-between"><dt className="text-muc-3">Giảm giá cả đơn{Number(h.giam_diem) > 0 ? ` (gồm đổi điểm ${tienVN(h.giam_diem)})` : ""}</dt><dd className="tabular-nums">− {tienVN(h.giam_gia_don)}</dd></div>}
            {Number(h.vat_tien) > 0 && <div className="flex justify-between"><dt className="text-muc-3">VAT {Number(h.vat_pct)}%</dt><dd className="tabular-nums">{tienVN(h.vat_tien)}</dd></div>}
            {Number(h.phu_phi) > 0 && <div className="flex justify-between"><dt className="text-muc-3">Phụ phí</dt><dd className="tabular-nums">{tienVN(h.phu_phi)}</dd></div>}
            {Number(h.tip) > 0 && <div className="flex justify-between"><dt className="text-muc-3">Tip</dt><dd className="tabular-nums">{tienVN(h.tip)}</dd></div>}
          </dl>
        </MucTrang>
        <MucTrang tieuDe="Sổ thu tiền">
          <Bang duLieu={tt ?? []} khoa={(r) => r.id} trong="Chưa thu khoản nào." cot={[
            { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Số phiếu", hienThi: (r) => <span className="tabular-nums">{maPhieuThu(r.so_phieu)}</span> }, { nhan: "Loại", hienThi: (r) => (r.loai === "thu" ? "Thu" : r.dao_cua_id ? "Huỷ trả nợ" : "Hoàn") }, { nhan: "Phương thức", hienThi: (r) => nhanKhoanThu(r.phuong_thuc, r.loai_vi) },
            { nhan: "Ngân hàng nhận", hienThi: (r) => r.ngan_hang ?? "" }, { nhan: "Người thu", hienThi: (r) => tenNv.get(r.nguoi_id) ?? "" }, { nhan: "Ghi chú", hienThi: (r) => r.ghi_chu ?? "" },
            { nhan: "Số tiền", hienThi: (r) => <span className={r.loai === "hoan" ? "text-loi" : ""}>{r.loai === "hoan" ? "− " : ""}{tienVN(r.so_tien)}</span>, phai: true },
          ]} />
        </MucTrang>
        {(lsNo ?? []).length > 0 && (
          <MucTrang tieuDe="Lịch sử nợ">
            <Bang duLieu={lsNo ?? []} khoa={(r) => r.ref} cot={[
              { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) },
              { nhan: "Loại", hienThi: (r) => <span className={r.da_huy ? "text-muc-3 line-through" : "text-muc"}>{r.loai === "xoa_no" ? "Xoá nợ" : "Trả nợ"}</span> },
              { nhan: "Số phiếu", hienThi: (r) => (r.loai === "tra_no" ? <span className="tabular-nums">{maPhieuThu(r.so_phieu)}</span> : "") },
              { nhan: "Hình thức", hienThi: (r) => (r.phuong_thuc ? `${nhanKhoanThu(r.phuong_thuc, r.loai_vi)}${r.ngan_hang ? ` · ${r.ngan_hang}` : ""}` : "") },
              { nhan: "Người làm", hienThi: (r) => tenNv.get(r.nguoi_id) ?? "" },
              { nhan: "Ghi chú", hienThi: (r) => <span className="text-muc-2">{r.da_huy ? "Đã huỷ · " : ""}{r.ly_do ?? ""}</span> },
              { nhan: "Số tiền", phai: true, hienThi: (r) => <span className={r.da_huy ? "text-muc-3 line-through" : ""}>{tienVN(r.so_tien)}</span> },
              { nhan: "", hienThi: (r) => (
                <span className="flex flex-wrap justify-end gap-2">
                  {r.loai === "tra_no" && !r.da_huy && coQuyen(nd, "no.thu") && <Link href={`/in/phieu-thu/${r.ref}`} target="_blank" className="text-[13px] font-medium text-nhan-dam hover:underline">In phiếu thu</Link>}
                  {r.la_cuoi && h.la_lich_su && coQuyen(nd, "no.thu") && <span className="text-[12px] text-muc-3" title={KHOA_SH}>Huỷ: khoá tới 15/11</span>}
                  {r.la_cuoi && !h.la_lich_su && coQuyen(nd, "no.thu") && (
                    <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe={r.loai === "xoa_no" ? "Huỷ lần xoá nợ" : "Huỷ lần trả nợ"} an={{ hoa_don_id: id, ref: r.ref }} nhanLuu="Huỷ dòng này"
                      moTa={r.loai === "xoa_no" ? `Nợ ${tienVN(r.so_tien)} được tính lại cho khách.` : `Ghi dòng hoàn ${tienVN(r.so_tien)} cùng ngày ${ngayVN(r.ngay)}, cùng hình thức để sổ quỹ và báo cáo về như chưa thu. Dòng gốc vẫn còn trong sổ.`}
                      truong={[{ ten: "ly_do", nhan: "Lý do (không bắt buộc)", loai: "chu", rong: true }]} action={huyLanTraNo} />
                  )}
                </span>
              ) },
            ]} />
            {Number(h.no_da_xoa) > 0 && <p className="mt-2 text-[12px] text-muc-3">Đã xoá nợ {tienVN(h.no_da_xoa)} (không tính vào tiền đã thu).</p>}
          </MucTrang>
        )}
        {h.trang_thai === "hoan_thanh" && dongDg.length > 0 && (
          <MucTrang tieuDe="Đánh giá nhân viên">
            <DanhGiaNhanVien key={dongDg.map((x) => `${x.nhanVienId}${x.diem}${x.yKien}`).join("|")} hoaDonId={id} dong={dongDg} duocGhi={duocGhiDg} luu={luuDanhGia} />
          </MucTrang>
        )}
        {hienSdt && (
          <MucTrang tieuDe="Khách hài lòng sau điều trị">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <div className="min-w-0">
                {dgSdt ? (
                  <>
                    <NhanTrangThai kieu={KET_QUA_DG[dgSdt.ket_qua].kieu}>{KET_QUA_DG[dgSdt.ket_qua].ten}</NhanTrangThai>
                    {dgSdt.ly_do && <span className="ml-2 text-muc-2">{LY_DO_KHONG_HAI_LONG[dgSdt.ly_do]}</span>}
                    {dgSdt.ghi_chu && <p className="mt-1 text-[13px] text-muc-2">{dgSdt.ghi_chu}</p>}
                    <p className="mt-1 text-[12px] text-muc-3">{ngayGioVN(dgSdt.sua_luc ?? dgSdt.tao_luc)} · {tenNv.get(dgSdt.nguoi_ghi_id ?? "") ?? "—"}{dgSdt.khieu_nai_id && <> · <Link href={`/khieu-nai/${dgSdt.khieu_nai_id}`} className="font-medium text-nhan-dam hover:underline">Xem khiếu nại đã tạo</Link></>}</p>
                  </>
                ) : lichDg ? <p className="text-muc-3">Lần điều trị này đã được đánh giá ở lịch hẹn.</p> : <p className="text-muc-3">Chưa ghi khách hài lòng hay không.</p>}
              </div>
              {duocGhiDg && !lichDg && (
                <NutHop kieu="chu" nhan={dgSdt ? "Sửa đánh giá" : "Ghi đánh giá"} tieuDe="Khách hài lòng sau điều trị" moTa="Mỗi lần điều trị một đánh giá, sửa được (có nhật ký). Không hài lòng sẽ tự tạo khiếu nại." an={{ hoa_don_id: id }}
                  giaTri={{ ket_qua: dgSdt?.ket_qua ?? "hai_long", ly_do: dgSdt?.ly_do ?? "", ghi_chu: dgSdt?.ghi_chu ?? "" }} truong={truongSauDieuTri()} action={luuDanhGiaSauDieuTri} />
              )}
            </div>
          </MucTrang>
        )}
        {h.trang_thai === "hoan_thanh" && (
          <MucTrang tieuDe="Hoá đơn VAT">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <p className={h.vat_hd_luc ? "text-nhan-dam" : "text-muc-3"}>
                {h.vat_hd_luc ? `Đã có hoá đơn${h.vat_hd_so ? ` số ${h.vat_hd_so}` : ""}${h.vat_hd_ky_hieu ? `, ký hiệu ${h.vat_hd_ky_hieu}` : ""} · ghi nhận ${ngayGioVN(h.vat_hd_luc)}${h.vat_hd_nguoi_id ? ` bởi ${tenNv.get(h.vat_hd_nguoi_id) ?? ""}` : ""}` : "Chưa có hoá đơn VAT."}
              </p>
              {coQuyen(nd, "hd.vat") && (
                <NutHop kieu="chu" nhan={h.vat_hd_luc ? "Sửa thông tin HĐ VAT" : "Ghi nhận đã xuất HĐ VAT"} tieuDe="Hoá đơn VAT" moTa="Ghi số và ký hiệu hoá đơn VAT đã xuất cho đơn này. Xoá trống số hoá đơn rồi lưu nếu đã ghi nhầm." an={{ hoa_don_id: id }}
                  giaTri={{ vat_hd_so: h.vat_hd_so ?? "", vat_hd_ky_hieu: h.vat_hd_ky_hieu ?? "" }} truong={[{ ten: "vat_hd_so", nhan: "Số hoá đơn VAT", loai: "chu" }, { ten: "vat_hd_ky_hieu", nhan: "Ký hiệu hoá đơn", loai: "chu", goiY: "Ví dụ 1C26TAA" }]} action={ghiNhanVat} />
              )}
            </div>
          </MucTrang>
        )}
        {h.so_khach > 1 && (
          <MucTrang tieuDe="Số khách">
            <p className="text-[14px] text-muc-2">{h.so_khach} khách</p>
          </MucTrang>
        )}
        {h.ghi_chu && <MucTrang tieuDe="Ghi chú"><p className="whitespace-pre-line text-[14px] text-muc-2">{h.ghi_chu}</p></MucTrang>}
      </div>
    </>
  );
}
