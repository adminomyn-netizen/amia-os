import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { GIOI_HAN_VOUCHER } from "@/lib/ban-hang";
import { chuGiamGia, NHAN_THU, nhanGioiHan } from "@/lib/voucher";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NgayChon } from "@/components/ui/NgayChon";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { luuVoucher } from "./actions";

/** "Quản lý voucher/thẻ giảm giá" theo SalonHero (Cài đặt › Thẻ giảm giá): ô Tìm kiếm, Lọc theo Kết thúc, nhóm Tất Cả / Sẵn sàng / Hết mã / Hết hạn / Bị khoá, nút Tạo voucher,
 *  cột Tên voucher · Bắt đầu · Kết thúc · Giá trị voucher · Số lượng mã · Mô tả · Trạng thái · Mã voucher · Giới hạn áp dụng. Xem: danhmuc.xem; tạo, sửa, khoá: danhmuc.sua. */
const TT = [{ ma: "", ten: "Tất Cả" }, { ma: "san_sang", ten: "Sẵn sàng" }, { ma: "het_ma", ten: "Hết mã" }, { ma: "het_han", ten: "Hết hạn" }, { ma: "khoa", ten: "Bị khoá" }] as const;
const KIEU_TT = { san_sang: "tot", het_ma: "cho", het_han: "loi", khoa: "tram" } as const;
const HANG = ["Thường", "Bạc", "Vàng", "Bạch kim", "Kim cương"];

export default async function TrangVoucher({ searchParams }: { searchParams: Promise<{ q?: string; tt?: string; ktu?: string; kden?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sp = await searchParams;
  const sua = coQuyen(nd, "danhmuc.sua");
  const db = sb();
  const [{ data: tatCa }, { data: cn }, { data: maDs }, { data: luot }] = await Promise.all([
    db.from("voucher").select("*").order("tao_luc", { ascending: false }),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("voucher_ma").select("voucher_id, ma").order("ma").limit(5000),
    db.from("voucher_luot_dung").select("voucher_id, loai").limit(20000),
  ]);
  const nay = homNayHCM();
  const dung = new Map<string, number>();
  for (const l of luot ?? []) dung.set(l.voucher_id, (dung.get(l.voucher_id) ?? 0) + (l.loai === "dung" ? 1 : -1));
  const ma = new Map<string, string[]>();
  for (const m of maDs ?? []) ma.set(m.voucher_id, [...(ma.get(m.voucher_id) ?? []), m.ma]);
  type V = NonNullable<typeof tatCa>[number];
  const tinhTrang = (v: V) => (v.bi_khoa ? "khoa" : v.den_ngay < nay ? "het_han" : (dung.get(v.id) ?? 0) >= v.so_luong ? "het_ma" : "san_sang") as keyof typeof KIEU_TT;
  const thay = (tatCa ?? []).filter((v) => !nd.chiNhanhId || !v.chi_nhanh_ids || v.chi_nhanh_ids.includes(nd.chiNhanhId));
  const tuKhoa = (sp.q ?? "").trim().toLowerCase();
  const loc = thay.filter((v) => (!tuKhoa || v.ten.toLowerCase().includes(tuKhoa) || (ma.get(v.id) ?? []).some((m) => m.toLowerCase().includes(tuKhoa)))
    && (!sp.ktu || v.den_ngay >= sp.ktu) && (!sp.kden || v.den_ngay <= sp.kden));
  const dem = (t: string) => loc.filter((v) => !t || tinhTrang(v) === t).length;
  const ds = loc.filter((v) => !sp.tt || tinhTrang(v) === sp.tt);
  const ganTT = (t: string) => `/cai-dat/voucher?${new URLSearchParams({ ...(t ? { tt: t } : {}), ...(sp.q ? { q: sp.q } : {}), ...(sp.ktu ? { ktu: sp.ktu } : {}), ...(sp.kden ? { kden: sp.kden } : {}) }).toString()}`;

  const truong: Truong[] = [
    { ten: "ten", nhan: "Tên voucher", loai: "chu", batBuoc: true, rong: true },
    { ten: "tu_ngay", nhan: "Thời gian sử dụng: từ ngày", loai: "ngay", batBuoc: true }, { ten: "den_ngay", nhan: "Đến hết ngày", loai: "ngay", batBuoc: true },
    { ten: "loai_giam", nhan: "Giá trị voucher", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "tien", nhan: "Tiền (₫)" }, { gia_tri: "phan_tram", nhan: "Phần trăm (%)" }] },
    { ten: "gia_tri", nhan: "Giá trị", loai: "so", batBuoc: true, ghiChu: "Nhập số tiền (vd 200000) hoặc số phần trăm (vd 10, hoặc 12,5) theo loại bên cạnh." },
    { ten: "giam_toi_da", nhan: "Số tiền giảm tối đa (₫)", loai: "tien", hienKhi: { ten: "loai_giam", la: ["phan_tram"] }, ghiChu: "Chỉ khi giảm theo %. Bỏ trống = không giới hạn." },
    { ten: "so_luong", nhan: "Số lượng phát hành", loai: "so", batBuoc: true, ghiChu: "Loại 1 mã: số lượt dùng. Loại nhiều mã: số mã được tạo (tối đa 500)." },
    { ten: "loai_ma", nhan: "Loại mã khuyến mại", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "mot_ma", nhan: "1 mã dùng nhiều lần" }, { gia_tri: "nhieu_ma", nhan: "Nhiều mã (mỗi mã 1 lần)" }] },
    { ten: "ma", nhan: "Mã voucher", loai: "chu", goiY: "Chỉ chữ cái không dấu và chữ số", ghiChu: "Loại nhiều mã: nhập tiền tố (tối đa 10 ký tự, có thể bỏ trống), hệ thống tự tạo các mã." },
    { ten: "gioi_han", nhan: "Giới hạn dịch vụ áp dụng", loai: "chon", batBuoc: true, luaChon: GIOI_HAN_VOUCHER.map((g) => ({ gia_tri: g.gia_tri, nhan: g.nhan })), rong: true },
    { ten: "don_toi_thieu", nhan: "Giá trị đơn hàng tối thiểu áp dụng (₫)", loai: "tien" },
    { ten: "so_lan_toi_da_khach", nhan: "Số lần dùng tối đa cho 1 khách", loai: "so", ghiChu: "Bỏ trống = không giới hạn." },
    { ten: "hang_khach", nhan: "Hạng khách hàng áp dụng", loai: "nhieu", luaChon: HANG.map((h) => ({ gia_tri: h, nhan: `Hạng ${h}` })), ghiChu: "Không chọn = mọi hạng." },
    { ten: "khach_moi_cu", nhan: "Áp dụng cho khách cũ/mới", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chọn tất cả" }, { gia_tri: "cu", nhan: "Khách quay lại" }, { gia_tri: "moi", nhan: "Khách mới" }] },
    { ten: "chi_nhanh_ids", nhan: "Áp dụng cho chi nhánh nào?", loai: "nhieu", luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })), ghiChu: "Không chọn = mọi chi nhánh." },
    { ten: "ngay_trong_tuan", nhan: "Áp dụng cho các ngày nào trong tuần?", loai: "nhieu", luaChon: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ gia_tri: String(n), nhan: NHAN_THU[n] })), ghiChu: "Không chọn = mọi ngày." },
    { ten: "hien_thi_tim_kiem", nhan: "Hiển thị trên tìm kiếm thu ngân", loai: "chon", luaChon: [{ gia_tri: "co", nhan: "Có" }, { gia_tri: "khong", nhan: "Không" }, { gia_tri: "tu_dong", nhan: "Tự động chọn" }] },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", rong: true }, { ten: "bi_khoa", nhan: "Khoá voucher (Bị khoá)", loai: "gat" },
  ];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Quản lý voucher/thẻ giảm giá" phu="Khách đưa mã, thu ngân bấm Chọn thẻ ở màn Bán hàng. Máy chủ tự kiểm hạn, lượt dùng, chi nhánh, hạng khách và tính tiền giảm; huỷ hoá đơn thì hoàn lại lượt.">
        {sua && <NutHop nhan="Tạo voucher" tieuDe="Thông tin voucher" nhanLuu="Lưu thông tin" truong={truong} action={luuVoucher}
          giaTri={{ loai_giam: "tien", loai_ma: "mot_ma", gioi_han: "tong_don", don_toi_thieu: 0, hien_thi_tim_kiem: "co", khach_moi_cu: "", chi_nhanh_ids: nd.chiNhanhId ? [nd.chiNhanhId] : [], hang_khach: [], ngay_trong_tuan: [] }} />}
      </TieuDeTrang>
      <form method="get" className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        {sp.tt && <input type="hidden" name="tt" value={sp.tt} />}
        <label className="block text-[13px] text-muc-2"><span className="mb-1 block">Tìm kiếm</span><input name="q" defaultValue={sp.q ?? ""} placeholder="Tên voucher hoặc mã" className={O_NHAP} /></label>
        <div className="block text-[13px] text-muc-2"><span className="mb-1 block">Lọc theo: Kết thúc từ</span><NgayChon ten="ktu" giaTriMacDinh={sp.ktu ?? ""} ariaLabel="Kết thúc từ ngày" /></div>
        <div className="block text-[13px] text-muc-2"><span className="mb-1 block">đến</span><NgayChon ten="kden" giaTriMacDinh={sp.kden ?? ""} ariaLabel="Kết thúc đến ngày" /></div>
        <button type="submit" className={`${NUT_PHU} h-10`}>Tìm</button>
      </form>
      <nav aria-label="Lọc theo trạng thái" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TT.map((t) => (
          <Link key={t.ma} href={ganTT(t.ma)} aria-current={(sp.tt ?? "") === t.ma ? "page" : undefined}
            className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${(sp.tt ?? "") === t.ma ? NUT_CHINH : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{t.ten} ({dem(t.ma)})</Link>
        ))}
      </nav>
      <Bang duLieu={ds} khoa={(r) => r.id} trong="Không tìm thấy kết quả nào"
        cot={[
          { nhan: "Tên voucher", chinh: true, hienThi: (r) => <span className="font-medium text-muc">{r.ten}</span> },
          { nhan: "Bắt đầu", hienThi: (r) => ngayVN(r.tu_ngay) },
          { nhan: "Kết thúc", hienThi: (r) => ngayVN(r.den_ngay) },
          { nhan: "Giá trị voucher", phai: true, hienThi: (r) => chuGiamGia(r) },
          { nhan: "Số lượng mã", phai: true, hienThi: (r) => `${dung.get(r.id) ?? 0} / ${r.so_luong}` },
          { nhan: "Mô tả", hienThi: (r) => r.mo_ta ?? "" },
          { nhan: "Trạng thái", hienThi: (r) => { const t = tinhTrang(r); return <NhanTrangThai kieu={KIEU_TT[t]}>{TT.find((x) => x.ma === t)?.ten}</NhanTrangThai>; } },
          { nhan: "Mã voucher", hienThi: (r) => { const m = ma.get(r.id) ?? []; return m.length <= 1 ? <span className="font-medium text-muc">{m[0]}</span> : <details><summary className="cursor-pointer text-muc">{m.length} mã</summary><p className="mt-1 max-h-40 overflow-y-auto break-all text-[12px] leading-5">{m.join(", ")}</p></details>; } },
          { nhan: "Giới hạn áp dụng", hienThi: (r) => `${nhanGioiHan(r.gioi_han)}${Number(r.don_toi_thieu) > 0 ? ` · đơn từ ${Number(r.don_toi_thieu).toLocaleString("vi-VN")} ₫` : ""}` },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Thông tin voucher" nhanLuu="Lưu thông tin" truong={truong} action={luuVoucher}
            giaTri={{ id: r.id, ten: r.ten, tu_ngay: r.tu_ngay, den_ngay: r.den_ngay, loai_giam: r.loai_giam, gia_tri: Number(r.gia_tri), giam_toi_da: r.giam_toi_da == null ? "" : Number(r.giam_toi_da), so_luong: r.so_luong, loai_ma: r.loai_ma,
              ma: r.loai_ma === "mot_ma" ? (ma.get(r.id) ?? [])[0] ?? "" : "", gioi_han: r.gioi_han, don_toi_thieu: Number(r.don_toi_thieu), so_lan_toi_da_khach: r.so_lan_toi_da_khach ?? "", hang_khach: r.hang_khach ?? [], khach_moi_cu: r.khach_moi_cu ?? "",
              chi_nhanh_ids: r.chi_nhanh_ids ?? [], ngay_trong_tuan: (r.ngay_trong_tuan ?? []).map(String), hien_thi_tim_kiem: r.hien_thi_tim_kiem, mo_ta: r.mo_ta ?? "", bi_khoa: r.bi_khoa }} /> : null) },
        ]} />
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">
        Tiền giảm của voucher được cộng vào &quot;Giảm giá cả đơn&quot; của hoá đơn (hiện riêng ở dòng Thẻ giảm giá/voucher), nên khi tính giá trị buổi thẻ và doanh số nhân viên nó được chia theo tỉ lệ cho mọi dòng của đơn, giống giảm giá cả đơn nhập tay.
        Mỗi hoá đơn dùng một voucher. Voucher đã có lượt dùng thì không đổi giá trị, loại giảm, giới hạn áp dụng; muốn khác thì khoá và tạo voucher mới. Chưa có: giới hạn &quot;Tùy chọn&quot; từng dịch vụ, nhóm khách hàng, loại lịch hẹn, khung giờ sử dụng.
      </p>
    </div>
  );
}
