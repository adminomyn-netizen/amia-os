"use server";

import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { boDau, chuanSdt, homNayHCM } from "@/lib/dinh-dang";
import { kiemGiaDong, kiemGioiThieuDong, kiemNgayLui, kiemNoDong, lamSachDongNhap, loaiViKhoanThu, nganHangKhoanThu, PHUONG_THUC, tinhDon, GIA_SUA_TOI_DA, TOI_DA_NGUOI_HUONG, type DonBan, type DongDon } from "@/lib/ban-hang";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { cauHinhDiem } from "@/lib/diem-thuong";
import { chuanMaVoucher, dsVoucherThuNgan, giamTheoDong, timVoucher, type VoucherTim } from "@/lib/voucher";

export async function timKhach(q: string) {
  const nd = await kiemQuyen("khach.xem");
  if (!nd) return [];
  const an = q.trim().replace(/[%,()]/g, " ");
  if (an.length < 2) return [];
  const so = chuanSdt(an);
  let q2 = sb().from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, ngay_sinh")
    .or([`ho_ten_khong_dau.ilike.%${boDau(an)}%`, `ma.ilike.%${an}%`, so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean).join(",")).order("ho_ten").limit(8);
  if (nd.chiNhanhId) q2 = q2.eq("chi_nhanh_id", nd.chiNhanhId);  // luật 29/10: chỉ khách của chi nhánh được gán
  const { data } = await q2;
  // Không có quyền xem SĐT thì ô gợi ý cũng không được lộ số (SalonHero: customer.phone).
  return (data ?? []).map((k) => (coQuyen(nd, "khach.sdt") ? k : { ...k, dien_thoai: "" }));
}

export async function layTheTien(khachId: string) {
  const nd = await kiemQuyen("ban.tao");
  if (!nd || !(await khachTrongPhamVi(nd.chiNhanhId, khachId))) return [];
  const { data } = await sb().from("v_the_khach").select("id, ma, so_du_tien, han_dung, tinh_trang").eq("khach_id", khachId).eq("loai", "tien").in("tinh_trang", ["hoat_dong", "sap_het"]);
  return (data ?? []).filter((t) => Number(t.so_du_tien) > 0).map((t) => ({ id: t.id as string, ma: t.ma as string, soDu: Number(t.so_du_tien) }));
}

/** Người gắn chi nhánh chỉ lấy được thẻ/điểm của khách cùng chi nhánh (khoá ở máy chủ, không tin id từ trình duyệt). */
async function khachTrongPhamVi(chiNhanhId: string | null, khachId: string) {
  if (!chiNhanhId) return true;
  const { data } = await sb().from("khach_hang").select("chi_nhanh_id").eq("id", khachId).maybeSingle();
  return !!data && data.chi_nhanh_id === chiNhanhId;
}

/** Cột "Thẻ khách đang có" + hạng khách của màn Thu ngân (như SalonHero): thẻ liệu trình và thẻ tiền còn dùng được, kèm buổi/số dư/hạn. Người bị khoá chi nhánh chỉ xem khách cùng chi nhánh. */
export async function layTheKhach(khachId: string) {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return null;
  const db = sb();
  const [{ data: k }, { data: the }] = await Promise.all([
    db.from("v_khach_hang").select("hang, chi_nhanh_id").eq("id", khachId).maybeSingle(),
    db.from("v_the_khach").select("id, ma, loai, goi_id, so_buoi_con, so_buoi_tong, so_du_tien, han_dung, tinh_trang").eq("khach_id", khachId).in("tinh_trang", ["hoat_dong", "sap_het"]).order("ngay_cap", { ascending: false }).limit(30),
  ]);
  if (!k || (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId)) return null;
  const ids = [...new Set((the ?? []).map((t) => t.goi_id as string))];
  const [{ data: goi }, { data: lk }] = ids.length
    ? await Promise.all([db.from("goi_the").select("id, ten").in("id", ids), db.from("goi_the_dich_vu").select("goi_id, dich_vu_id").in("goi_id", ids)])
    : [{ data: [] }, { data: [] }];
  const ten = new Map((goi ?? []).map((g) => [g.id as string, g.ten as string]));
  const dvGoi = new Map<string, string[]>();
  for (const l of lk ?? []) dvGoi.set(l.goi_id as string, [...(dvGoi.get(l.goi_id as string) ?? []), l.dich_vu_id as string]);
  return {
    hang: (k.hang as string | null) ?? "",
    the: (the ?? []).map((t) => ({
      id: t.id as string, ma: t.ma as string, loai: t.loai as "lan" | "tien", ten: ten.get(t.goi_id as string) ?? "Thẻ",
      buoiCon: Number(t.so_buoi_con ?? 0), buoiTong: t.so_buoi_tong == null ? null : Number(t.so_buoi_tong), soDu: Number(t.so_du_tien ?? 0), han: (t.han_dung as string | null) ?? null,
      /** Dịch vụ của gói (nút "Dùng buổi" chọn sẵn); rỗng = gói không gắn dịch vụ, thu ngân chọn trong cả danh mục. */
      dichVu: dvGoi.get(t.goi_id as string) ?? [],
    })),
  };
}

/** Số dư điểm thưởng của khách + cấu hình đổi điểm (cho màn Thu ngân). */
export async function layDiemKhach(khachId: string) {
  const nd = await kiemQuyen("ban.tao");
  if (!nd || !(await khachTrongPhamVi(nd.chiNhanhId, khachId))) return null;
  const db = sb();
  // Tỉ lệ đổi điểm theo HẠNG khách (màn Điểm khách hàng, như SalonHero).
  const [{ data: k }, { data: vk }] = await Promise.all([db.from("khach_hang").select("diem_so_du").eq("id", khachId).maybeSingle(), db.from("v_khach_hang").select("hang").eq("id", khachId).maybeSingle()]);
  if (!k) return null;
  const ch = await cauHinhDiem(db, vk?.hang ?? null);
  return { soDu: Number(k.diem_so_du ?? 0), ...ch };
}

/** Hộp "Áp dụng voucher" ở màn Bán hàng. "Kiểm tra mã": kiểm mã (có, không khoá, trong hạn, đúng chi nhánh/ngày/hạng khách, còn lượt) rồi trả định nghĩa để màn hình tự tính theo dòng hàng. Máy chủ tính lại và DB kiểm lại khi chốt. */
export async function layVoucher(ma: string, chiNhanhId: string, khachId: string | null, lichId: string | null = null): Promise<{ ok: true; v: VoucherTim } | { ok: false; loi: string }> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return { ok: false, loi: KHONG_DU_QUYEN };
  return timVoucher(sb(), ma, { chiNhanhId: nd.chiNhanhId ?? chiNhanhId, khachId, lichId });
}
/** Danh sách voucher hiện sẵn trong hộp "Áp dụng voucher" (SalonHero: "Hiển thị trên tìm kiếm thu ngân"). */
export async function dsVoucher(chiNhanhId: string, khachId: string | null, lichId: string | null = null): Promise<VoucherTim[]> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd || !(nd.chiNhanhId ?? chiNhanhId)) return [];
  return dsVoucherThuNgan(sb(), { chiNhanhId: nd.chiNhanhId ?? chiNhanhId, khachId, lichId });
}

type KQ = { ok: true; id: string; ma: string } | { ok?: false; loi: string };

/** Tạo hoá đơn + dòng + người hưởng + thanh toán rồi chốt. Giá lấy từ DB (không tin giá gửi lên). Lỗi trước khi có thanh toán thì xoá nháp; sau đó thì huỷ có hoàn tiền. */
export async function chotDonBanHang(json: string): Promise<KQ> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  let don: DonBan;
  try { don = JSON.parse(json) as DonBan; } catch { return { loi: "Dữ liệu đơn không đọc được." }; }
  if (!don.dong?.length) return { loi: "Đơn chưa có dòng hàng nào." };
  // Theo SalonHero: giảm giá và tip là quyền riêng, chặn ở máy chủ chứ không chỉ ẩn ô nhập.
  if (!coQuyen(nd, "ban.giamgia") && (don.giamDon > 0 || don.dong.some((d) => d.giam > 0))) return { loi: "Tài khoản này chưa có quyền giảm giá." };
  if (!coQuyen(nd, "ban.tip") && don.tip > 0) return { loi: "Tài khoản này chưa có quyền nhập tip." };
  const db = sb();
  if (nd.chiNhanhId && don.khachId) {
    const { data: kc } = await db.from("khach_hang").select("chi_nhanh_id").eq("id", don.khachId).maybeSingle();
    if (!kc || kc.chi_nhanh_id !== nd.chiNhanhId) return { loi: "Khách này thuộc chi nhánh khác." };
  }
  // Người có chi nhánh cố định chỉ bán ở chi nhánh của mình; người xem mọi chi nhánh phải chọn rõ, không tự rơi về chi nhánh đầu.
  if (nd.chiNhanhId) don.chiNhanhId = nd.chiNhanhId;
  else if (!don.chiNhanhId || !(await db.from("chi_nhanh").select("id").eq("id", don.chiNhanhId).eq("hoat_dong", true).maybeSingle()).data) return { loi: "Chọn chi nhánh bán trước khi chốt đơn." };

  const idsDv = don.dong.filter((d) => d.loai === "dich_vu").map((d) => d.ref);
  const idsGoi = don.dong.filter((d) => d.loai === "goi_the").map((d) => d.ref);
  const idsSp = don.dong.filter((d) => d.loai === "san_pham").map((d) => d.ref);
  const [dv, goi, sp] = await Promise.all([
    idsDv.length ? db.from("dich_vu").select("id, ten, gia, hoat_dong, cho_sua_gia").in("id", idsDv) : Promise.resolve({ data: [] }),
    idsGoi.length ? db.from("goi_the").select("id, ten, gia, hoat_dong, cho_sua_gia").in("id", idsGoi) : Promise.resolve({ data: [] }),
    idsSp.length ? db.from("san_pham").select("id, ten, gia_ban, hoat_dong, ban_le, cho_sua_gia").in("id", idsSp) : Promise.resolve({ data: [] }),
  ]);
  const gia = new Map<string, { ten: string; gia: number; ok: boolean; choSuaGia: boolean }>();
  for (const x of dv.data ?? []) gia.set(`dich_vu:${x.id}`, { ten: x.ten, gia: x.gia, ok: x.hoat_dong, choSuaGia: x.cho_sua_gia });
  for (const x of goi.data ?? []) gia.set(`goi_the:${x.id}`, { ten: x.ten, gia: x.gia, ok: x.hoat_dong, choSuaGia: x.cho_sua_gia });
  for (const x of sp.data ?? []) gia.set(`san_pham:${x.id}`, { ten: x.ten, gia: x.gia_ban, ok: x.hoat_dong && x.ban_le, choSuaGia: x.cho_sua_gia });
  // Đơn giá từng dòng: giá danh mục, hoặc giá thu ngân sửa khi mục bật "Sửa giá khi thanh toán" (kiểm lại cờ ở đây, không tin trình duyệt).
  const donGia: number[] = [];

  let hang = 0;
  for (const d of don.dong) {
    const m = gia.get(`${d.loai}:${d.ref}`);
    if (!m || !m.ok) return { loi: "Có mục trong đơn đã ngừng bán hoặc không tồn tại. Tải lại trang rồi chọn lại." };
    const kg = kiemGiaDong(d, m);
    if (!kg.ok) return { loi: kg.loi };
    donGia.push(kg.gia);
    if (!Number.isInteger(d.sl) || d.sl < 1 || d.sl > 999) return { loi: `Số lượng của "${m.ten}" chưa hợp lệ.` };
    if (!Number.isInteger(d.giam) || d.giam < 0 || d.giam > kg.gia * d.sl) return { loi: `Giảm giá của "${m.ten}" chưa hợp lệ.` };
    for (const vai of ["phuc_vu", "tu_van", "ban"] as const) {
      const ds = d.nv?.[vai] ?? [];
      if (ds.length > TOI_DA_NGUOI_HUONG) return { loi: `"${m.ten}": mỗi vai chỉ có tối đa ${TOI_DA_NGUOI_HUONG} người hưởng.` };
      if (ds.length && Math.abs(ds.reduce((s, x) => s + Number(x.ti), 0) - 100) > 0.01) return { loi: `"${m.ten}": phần chia cho vai ${vai === "phuc_vu" ? "Phục vụ" : vai === "tu_van" ? "Tư vấn" : "Bán hàng"} phải cộng đủ 100%.` };
      if (new Set(ds.map((x) => x.id)).size !== ds.length) return { loi: `"${m.ten}": một người không được xuất hiện hai lần trong cùng một vai.` };
    }
    hang += kg.gia * d.sl - d.giam;
  }
  for (const v of [don.giamDon, don.phuPhi, don.tip]) if (!Number.isInteger(v) || v < 0) return { loi: "Giảm giá, phụ phí hoặc tip chưa hợp lệ." };
  // Đổi điểm: máy chủ tự tính tiền theo cấu hình, cộng vào giảm giá cả đơn; trừ điểm cùng giao dịch với chốt đơn (chot_hoa_don_doi_diem).
  const diem = don.doiDiem ?? 0;
  if (!Number.isInteger(diem) || diem < 0) return { loi: "Số điểm đổi chưa hợp lệ." };
  let tienDiem = 0;
  if (diem > 0) {
    if (!don.khachId) return { loi: "Đổi điểm phải chọn khách hàng." };
    const { data: vk } = await db.from("v_khach_hang").select("hang").eq("id", don.khachId).maybeSingle();
    const ch = await cauHinhDiem(db, vk?.hang ?? null);
    if (!ch.bat) return { loi: "Đổi điểm thưởng đang tắt (Cài đặt › Thông tin chung / Điểm khách hàng)." };
    const { data: k } = await db.from("khach_hang").select("diem_so_du").eq("id", don.khachId).maybeSingle();
    if ((k?.diem_so_du ?? 0) < diem) return { loi: `Khách chỉ còn ${k?.diem_so_du ?? 0} điểm.` };
    tienDiem = diem * ch.tienMoiDiem;
  }
  // Voucher: máy chủ tự tính tiền giảm từ giá trong DB (không tin số gửi lên), cộng vào giảm giá cả đơn như đổi điểm; DB kiểm lại lúc chốt.
  const maVoucher = chuanMaVoucher(don.voucher);
  let tienVoucher = 0;
  if (maVoucher) {
    const t = await timVoucher(db, maVoucher, { chiNhanhId: don.chiNhanhId, khachId: don.khachId, lichId: don.lichId });
    if (!t.ok) return { loi: t.loi };
    const g = giamTheoDong(t.v, don.dong.map((d, i) => ({ loai: d.loai, ref: d.ref, thanh: donGia[i] * d.sl - d.giam })));
    if (!g.ok) return { loi: g.loi };
    tienVoucher = g.tien;
  }
  if (don.giamDon + tienDiem + tienVoucher > hang) return { loi: tienVoucher ? "Giảm giá cả đơn, voucher và tiền đổi điểm cộng lại lớn hơn tiền hàng." : tienDiem ? "Giảm giá cả đơn cộng tiền đổi điểm lớn hơn tiền hàng." : "Giảm giá cả đơn lớn hơn tiền hàng." };
  if (!(don.vatPct >= 0 && don.vatPct <= 100)) return { loi: "VAT chưa hợp lệ." };
  const { phai } = tinhDon(hang, don.giamDon + tienDiem + tienVoucher, don.vatPct, don.phuPhi, don.tip);
  const tongThu = (don.thu ?? []).reduce((s, t) => s + t.so_tien, 0);
  if ((don.thu ?? []).some((t) => !Number.isInteger(t.so_tien) || t.so_tien <= 0 || !PHUONG_THUC.some((p) => p.gia_tri === t.phuong_thuc))) return { loi: "Có khoản thu chưa hợp lệ." };
  if ((don.thu ?? []).some((t) => loaiViKhoanThu(t.phuong_thuc, t.loai_vi) === undefined)) return { loi: "Khoản thu bằng ví điện tử phải chọn loại ví." };
  if (tongThu > phai) return { loi: "Tổng các khoản thu lớn hơn số phải thu." };
  if (tongThu < phai && !don.khachId) return { loi: "Còn nợ thì phải chọn khách hàng." };
  // Chia nợ theo dòng ("Xác nhận các mục còn nợ" của SalonHero): các phần cộng đúng số còn nợ.
  const kn = kiemNoDong(don.dong.map((d) => d.no), phai - tongThu);
  if (!kn.ok) return { loi: kn.loi };
  // Người giới thiệu theo dòng: nguồn phải có trong danh sách nguồn giới thiệu đang dùng.
  const idsGt = [...new Set(don.dong.map((d) => d.gt?.id).filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)))];
  const { data: gtCo } = idsGt.length ? await db.from("doi_tac_gt").select("id").in("id", idsGt).eq("hoat_dong", true) : { data: [] as { id: string }[] };
  const coGt = new Set((gtCo ?? []).map((x) => x.id));
  const gtDong: ({ id: string; kieu: "phan_tram" | "tien"; giaTri: number } | null)[] = [];
  for (const d of don.dong) {
    const g = kiemGioiThieuDong(d.gt, (id) => coGt.has(id));
    if (!g.ok) return { loi: g.loi };
    gtDong.push(g.gt);
  }
  const khachDua = Number.isInteger(don.khachDua) && (don.khachDua ?? 0) > 0 && (don.khachDua ?? 0) <= GIA_SUA_TOI_DA ? don.khachDua! : null;
  if (don.dong.some((d) => d.loai === "goi_the") && !don.khachId) return { loi: "Bán thẻ phải chọn khách hàng." };

  if (don.khachId) {
    const { data: k } = await db.from("khach_hang").select("id, ngay_sinh").eq("id", don.khachId).maybeSingle();
    if (!k) return { loi: "Không tìm thấy khách hàng." };
    const { count } = await db.from("hoa_don").select("id", { count: "exact", head: true }).eq("khach_id", k.id).eq("trang_thai", "hoan_thanh");
    if (!k.ngay_sinh && (count ?? 0) === 0) return { loi: "Khách mua lần đầu: cần nhập ngày sinh trong hồ sơ khách trước khi chốt đơn." };
  }

  // Sửa hoá đơn đã chốt (đã mở lại về nháp bằng mo_lai_hoa_don, quyền ban.sua): chốt lại vào chính hoá đơn đó, giữ mã + ngày; không lùi ngày.
  let suaCu: { id: string; ma: string; ngay_hd: string } | null = null;
  if (don.hoaDonId) {
    if (!/^[0-9a-f-]{36}$/i.test(don.hoaDonId)) return { loi: "Hoá đơn đang sửa không hợp lệ." };
    const { data: hs } = await db.from("hoa_don").select("id, ma, chi_nhanh_id, trang_thai, mo_lai_luc, la_lich_su, ngay_hd").eq("id", don.hoaDonId).maybeSingle();
    if (!hs || hs.trang_thai !== "nhap" || !hs.mo_lai_luc || hs.la_lich_su) return { loi: "Hoá đơn đang sửa không còn ở trạng thái nháp (có thể đã chốt ở máy khác). Tải lại trang." };
    if (hs.chi_nhanh_id !== don.chiNhanhId) return { loi: "Hoá đơn đang sửa thuộc chi nhánh khác, không đổi chi nhánh khi sửa." };
    suaCu = { id: hs.id, ma: hs.ma, ngay_hd: hs.ngay_hd };
    don.ngayHd = "";
  }
  // Lùi ngày hoá đơn (SalonHero: ai vào được Thu ngân là dùng được, chỉ lùi). Doanh thu và các khoản thu của đơn ghi về ngày lùi, như SalonHero (không thành "thu nợ cũ").
  // Tháng đã khoá sổ kế toán thì không lùi vào được.
  const lui = kiemNgayLui(don.ngayHd);
  if (!lui.ok) return { loi: lui.loi };
  if (lui.lui) {
    const { data: ky } = await db.from("ky_ke_toan").select("trang_thai").eq("thang", lui.lui.ngay.slice(0, 7)).maybeSingle();
    if (ky?.trang_thai === "da_khoa") return { loi: `Tháng ${lui.lui.ngay.slice(5, 7)}/${lui.lui.ngay.slice(0, 4)} đã khoá sổ, không lùi ngày hoá đơn vào tháng này được.` };
  }
  const ngayDon = suaCu?.ngay_hd ?? lui.lui?.ngay ?? homNayHCM();
  // Ngày ghi các khoản thu: ngày lùi, hoặc ngày hoá đơn cũ khi sửa (khoản thu cũ đã đảo về đúng ngày đó); trống = hôm nay.
  const ngayThu = lui.lui?.ngay ?? suaCu?.ngay_hd ?? null;
  // Giờ vào / ra (HH:MM giờ Việt Nam, trong ngày của hoá đơn) và số khách; sai định dạng hoặc ra trước vào thì báo lỗi, không đoán.
  const gioDon = (g: string | undefined) => (g ? new Date(`${ngayDon}T${g}:00+07:00`) : null);
  if ((don.gioVao && !/^([01]\d|2[0-3]):[0-5]\d$/.test(don.gioVao)) || (don.gioRa && !/^([01]\d|2[0-3]):[0-5]\d$/.test(don.gioRa))) return { loi: "Giờ vào hoặc giờ ra chưa đúng." };
  const gioVao = gioDon(don.gioVao), gioRa = gioDon(don.gioRa);
  if (gioVao && gioRa && gioRa < gioVao) return { loi: "Giờ ra phải sau giờ vào." };
  const soKhach = Math.min(99, Math.max(1, Math.floor(Number(don.soKhach) || 1)));

  const dauDon = { khach_id: don.khachId, lich_hen_id: don.lichId, giam_gia_don: don.giamDon + tienDiem + tienVoucher, vat_pct: don.vatPct, phu_phi: don.phuPhi, tip: don.tip,
    nguoi_gioi_thieu_id: don.nguoiGioiThieu || null, ghi_chu: don.ghiChu?.trim() || null, gio_vao: gioVao?.toISOString() ?? null, gio_ra: gioRa?.toISOString() ?? null, so_khach: soKhach, khach_dua: khachDua };
  let h: { id: string };
  let ma: string;
  if (suaCu) {
    // Dòng cũ xoá được vì hoá đơn đang nháp (thẻ đã bán đã được gỡ khỏi dòng khi mở lại). Người hưởng xoá TRƯỚC: xoá dây chuyền theo dòng thì trigger
    // dong_nhan_vien không còn thấy hoá đơn (dòng đã mất) và chặn nhầm.
    const { data: dongCu } = await db.from("hoa_don_dong").select("id").eq("hoa_don_id", suaCu.id);
    const idsCu = (dongCu ?? []).map((x) => x.id);
    if (idsCu.length) {
      const { error: env } = await db.from("dong_nhan_vien").delete().in("dong_id", idsCu);
      if (env) return { loi: thongBaoLoi(env) };
    }
    const { error: exd } = await db.from("hoa_don_dong").delete().eq("hoa_don_id", suaCu.id);
    if (exd) return { loi: thongBaoLoi(exd) };
    const { data: hu, error: eu } = await db.from("hoa_don").update(dauDon).eq("id", suaCu.id).eq("trang_thai", "nhap").select("id").maybeSingle();
    if (eu || !hu) return { loi: eu ? thongBaoLoi(eu) : "Hoá đơn đang sửa không còn ở trạng thái nháp. Tải lại trang." };
    h = hu; ma = suaCu.ma;
  } else {
    ma = "HD" + String(Number((await db.rpc("so_tiep_theo", { p_khoa: "hoa_don" })).data ?? 0)).padStart(6, "0");
    const { data: hm, error: eh } = await db.from("hoa_don").insert({
      ma, chi_nhanh_id: don.chiNhanhId, nguoi_lap_id: nd.nhanVienId, ...dauDon,
      ...(lui.lui ? { ngay_hd: lui.lui.ngay, tao_luc: lui.lui.iso } : {}),
    }).select("id").single();
    if (eh || !hm) return { loi: thongBaoLoi(eh) };
    h = hm;
  }
  // Lỗi giữa chừng: đơn mới thì xoá nháp; đơn đang sửa thì GIỮ nháp (sửa tiếp được), khoản thu mới ghi dở thì đảo lại từng dòng.
  const thuMoi: { id: string; phuong_thuc: string; so_tien: number; the_id: string | null; ngan_hang: string | null; loai_vi: string | null; ngay: string }[] = [];
  const huyNhap = async () => { if (!suaCu) await db.from("hoa_don").delete().eq("id", h.id); };
  const goDo = async (lyDo: string) => {
    if (!suaCu) {
      const daCo = await db.from("thanh_toan").select("id", { count: "exact", head: true }).eq("hoa_don_id", h.id);
      if ((daCo.count ?? 0) === 0) await huyNhap(); else await db.rpc("huy_hoa_don", { p_id: h.id, p_ly_do: lyDo, p_nguoi: nd.nhanVienId });
      return;
    }
    for (const t of thuMoi) await db.from("thanh_toan").insert({ hoa_don_id: h.id, loai: "hoan", phuong_thuc: t.phuong_thuc, so_tien: t.so_tien, the_id: t.the_id, ngan_hang: t.ngan_hang, loai_vi: t.loai_vi, ngay: t.ngay, nguoi_id: nd.nhanVienId, ghi_chu: lyDo, dao_cua_id: t.id });
  };

  const ghiChuThe: { dongId: string; ghiChu: string }[] = [];
  for (const [i, d] of don.dong.entries()) {
    const m = gia.get(`${d.loai}:${d.ref}`)!;
    const row: TablesInsert<"hoa_don_dong"> = { hoa_don_id: h.id, loai: d.loai, ten: m.ten, so_luong: d.sl, don_gia: donGia[i], giam_gia: d.giam,
      dich_vu_id: d.loai === "dich_vu" ? d.ref : null, goi_id: d.loai === "goi_the" ? d.ref : null, san_pham_id: d.loai === "san_pham" ? d.ref : null,
      ghi_chu: typeof d.ghiChu === "string" && d.ghiChu.trim() ? d.ghiChu.trim().slice(0, 500) : null,
      gt_doi_tac_id: gtDong[i]?.id ?? null, gt_kieu: gtDong[i]?.kieu ?? null, gt_gia_tri: gtDong[i]?.giaTri ?? null, no_dong: kn.no ? kn.no[i] : null };
    const { data: dg, error: ed } = await db.from("hoa_don_dong").insert(row).select("id").single();
    if (ed || !dg) { await huyNhap(); return { loi: thongBaoLoi(ed) }; }
    if (row.ghi_chu && d.loai === "goi_the") ghiChuThe.push({ dongId: dg.id, ghiChu: row.ghi_chu });
    const chia = (["phuc_vu", "tu_van", "ban"] as const).flatMap((vai) => (d.nv?.[vai] ?? []).map((x) => ({ dong_id: dg.id, nhan_vien_id: x.id, vai, ti_le: x.ti })));
    if (chia.length) {
      const { error: ec } = await db.from("dong_nhan_vien").insert(chia);
      if (ec) { await huyNhap(); return { loi: thongBaoLoi(ec) }; }
    }
  }

  for (const t of don.thu ?? []) {
    const { data: tm, error: et } = await db.from("thanh_toan").insert({ hoa_don_id: h.id, loai: "thu", phuong_thuc: t.phuong_thuc, so_tien: t.so_tien, the_id: t.phuong_thuc === "the_tien" ? t.the_id ?? null : null, ngan_hang: nganHangKhoanThu(t.phuong_thuc, t.ngan_hang), loai_vi: loaiViKhoanThu(t.phuong_thuc, t.loai_vi), nguoi_id: nd.nhanVienId, ...(ngayThu ? { ngay: ngayThu } : {}) })
      .select("id, phuong_thuc, so_tien, the_id, ngan_hang, loai_vi, ngay").single();
    if (et || !tm) {
      await goDo("Tự huỷ do lỗi khi tạo đơn");
      return { loi: thongBaoLoi(et) };
    }
    thuMoi.push(tm);
  }
  const { error: ex } = maVoucher
    ? await db.rpc("chot_hoa_don_voucher", { p_id: h.id, p_nguoi: nd.nhanVienId, p_ma: maVoucher, p_tien_voucher: tienVoucher, p_diem: diem, p_tien_diem: tienDiem })
    : diem > 0
      ? await db.rpc("chot_hoa_don_doi_diem", { p_id: h.id, p_nguoi: nd.nhanVienId, p_diem: diem, p_tien: tienDiem })
      : await db.rpc("chot_hoa_don", { p_id: h.id, p_nguoi: nd.nhanVienId });
  if (ex) {
    await goDo("Tự huỷ do lỗi khi chốt đơn");
    return { loi: thongBaoLoi(ex) };
  }
  // Ghi chú dòng bán thẻ → ghi chú của thẻ vừa cấp (SalonHero: ghi chú thẻ dịch vụ / liệu trình). Thẻ do chot_hoa_don cấp theo hoa_don_dong_id.
  for (const g of ghiChuThe) await db.from("the_khach").update({ ghi_chu: g.ghiChu }).eq("hoa_don_dong_id", g.dongId).is("ghi_chu", null);
  if (suaCu) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "chot_lai_hoa_don_sua", doi_tuong: "hoa_don", doi_tuong_id: h.id, chi_tiet: { ma, ngay_hd: suaCu.ngay_hd, bam_luc: new Date().toISOString() } });
  if (lui.lui) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "lui_ngay_hoa_don", doi_tuong: "hoa_don", doi_tuong_id: h.id, chi_tiet: { ma, ngay_hd: lui.lui.ngay, tao_luc: lui.lui.iso, bam_luc: new Date().toISOString() } });
  if (don.lichId) await db.from("lich_hen").update({ trang_thai: "hoan_thanh" }).eq("id", don.lichId).eq("chi_nhanh_id", don.chiNhanhId).in("trang_thai", ["cho_phuc_vu", "dang_phuc_vu", "da_xac_nhan", "chua_xac_nhan"]);
  return { ok: true, id: h.id, ma };
}

// ─── Đơn nháp (như SalonHero DRAFT) ─────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOI_DA_NHAP = 30;
export type DonNhapRut = { id: string; tieuDe: string; khach: { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string } | null; dong: DongDon[]; capNhat: string };

/** Lưu (hoặc cập nhật) đơn nháp của chính mình: khách + các dòng hàng. Không đụng doanh thu, kho hay công nợ. */
export async function luuDonNhap(p: { id?: string | null; khachId: string | null; chiNhanhId: string; tieuDe: string; dong: DongDon[] }): Promise<{ ok: true; id: string } | { ok?: false; loi: string }> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const dong = lamSachDongNhap(p.dong);
  if (!dong.length) return { loi: "Đơn chưa có dòng hàng nào để lưu nháp." };
  const db = sb();
  const cn = nd.chiNhanhId ?? p.chiNhanhId;
  if (!cn || !UUID_RE.test(cn)) return { loi: "Chọn chi nhánh trước khi lưu nháp." };
  if (p.khachId) {
    if (!UUID_RE.test(p.khachId) || !(await khachTrongPhamVi(nd.chiNhanhId, p.khachId))) return { loi: "Khách này thuộc chi nhánh khác." };
  }
  const tieuDe = (p.tieuDe ?? "").trim().slice(0, 80) || null;
  if (p.id) {
    if (!UUID_RE.test(p.id)) return { loi: "Đơn nháp không hợp lệ." };
    // Đơn chờ thanh toán dùng chung trong chi nhánh như SalonHero: ai mở đơn nháp của chi nhánh cũng lưu tiếp được vào chính đơn đó.
    let qu = db.from("don_nhap").update({ khach_id: p.khachId, tieu_de: tieuDe, dong: dong as unknown as TablesInsert<"don_nhap">["dong"], chi_nhanh_id: cn, cap_nhat_luc: new Date().toISOString() }).eq("id", p.id);
    qu = nd.chiNhanhId ? qu.eq("chi_nhanh_id", nd.chiNhanhId) : qu;
    const { data, error } = await qu.select("id").maybeSingle();
    if (error) return { loi: thongBaoLoi(error) };
    if (data) return { ok: true, id: data.id };
  }
  const { count } = await db.from("don_nhap").select("id", { count: "exact", head: true }).eq("nguoi_lap_id", nd.nhanVienId);
  if ((count ?? 0) >= TOI_DA_NHAP) return { loi: `Đã có ${TOI_DA_NHAP} đơn nháp. Xoá bớt đơn nháp cũ rồi lưu lại.` };
  const { data, error } = await db.from("don_nhap").insert({ chi_nhanh_id: cn, nguoi_lap_id: nd.nhanVienId, khach_id: p.khachId, tieu_de: tieuDe, dong: dong as unknown as TablesInsert<"don_nhap">["dong"] }).select("id").single();
  if (error) return { loi: thongBaoLoi(error) };
  return { ok: true, id: data.id };
}

/** Các đơn nháp của chính mình (mới sửa trước). */
export async function dsDonNhap(): Promise<DonNhapRut[]> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return [];
  const { data } = await sb().from("don_nhap").select("id, tieu_de, dong, cap_nhat_luc, khach_hang(id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id)").eq("nguoi_lap_id", nd.nhanVienId).order("cap_nhat_luc", { ascending: false }).limit(TOI_DA_NHAP);
  const xemSdt = coQuyen(nd, "khach.sdt");
  return (data ?? []).map((r) => {
    const k = r.khach_hang as unknown as { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string; chi_nhanh_id: string | null } | null;
    // Khoá chi nhánh như màn Bán hàng: khách chi nhánh khác không hiện; không có quyền xem SĐT thì bỏ số.
    const khach = k && !(nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId) ? { id: k.id, ma: k.ma, ho_ten: k.ho_ten, dien_thoai: xemSdt ? k.dien_thoai : "", nguoi_phu_trach_id: k.nguoi_phu_trach_id } : null;
    return { id: r.id, tieuDe: r.tieu_de ?? "", khach, dong: lamSachDongNhap(r.dong), capNhat: r.cap_nhat_luc };
  });
}

/** Xoá đơn nháp của chính mình (sau khi chốt đơn hoặc bỏ nháp). */
export async function xoaDonNhap(id: string): Promise<{ ok: true } | { ok?: false; loi: string }> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  if (!UUID_RE.test(id)) return { loi: "Đơn nháp không hợp lệ." };
  // Xoá được đơn nháp của mình; đơn của người khác trong cùng chi nhánh (mở từ "Chờ thanh toán") cũng xoá được khi đã chốt thành hoá đơn.
  let q = sb().from("don_nhap").delete().eq("id", id);
  q = nd.chiNhanhId ? q.eq("chi_nhanh_id", nd.chiNhanhId) : q;
  const { error } = await q;
  if (error) return { loi: thongBaoLoi(error) };
  return { ok: true };
}

export type DonCho = { id: string; loai: "nhap" | "sua"; khach: string; soDong: number; nguoiLap: string; capNhat: string; ma?: string; nhap?: DonNhapRut };
/** "Chờ thanh toán" như SalonHero: các đơn đang xử lý (chưa thanh toán) của chi nhánh — đơn nháp của mọi thu ngân + hoá đơn đã mở lại để sửa. */
export async function dsDonCho(chiNhanhId: string): Promise<DonCho[]> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return [];
  const cn = nd.chiNhanhId ?? (UUID_RE.test(chiNhanhId) ? chiNhanhId : null);
  const db = sb();
  let qn = db.from("don_nhap").select("id, tieu_de, dong, cap_nhat_luc, nguoi_lap_id, chi_nhanh_id, khach_hang(id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, chi_nhanh_id)").order("cap_nhat_luc", { ascending: false }).limit(100);
  let qh = db.from("hoa_don").select("id, ma, mo_lai_luc, nguoi_lap_id, khach_hang!hoa_don_khach_id_fkey(ho_ten)").eq("trang_thai", "nhap").not("mo_lai_luc", "is", null).eq("la_lich_su", false).order("mo_lai_luc", { ascending: false }).limit(50);
  if (cn) { qn = qn.eq("chi_nhanh_id", cn); qh = qh.eq("chi_nhanh_id", cn); }
  const [{ data: n }, { data: h }, { data: nv }] = await Promise.all([qn, qh, db.from("nhan_vien").select("id, ho_ten")]);
  const ten = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
  const xemSdt = coQuyen(nd, "khach.sdt");
  return [
    ...(n ?? []).map((r) => {
      const k = r.khach_hang as unknown as { id: string; ma: string; ho_ten: string; dien_thoai: string; nguoi_phu_trach_id: string } | null;
      const khach = k ? { id: k.id, ma: k.ma, ho_ten: k.ho_ten, dien_thoai: xemSdt ? k.dien_thoai : "", nguoi_phu_trach_id: k.nguoi_phu_trach_id } : null;
      const dong = lamSachDongNhap(r.dong);
      return { id: r.id, loai: "nhap" as const, khach: k?.ho_ten ?? "Khách lẻ", soDong: dong.length, nguoiLap: ten.get(r.nguoi_lap_id) ?? "", capNhat: r.cap_nhat_luc, nhap: { id: r.id, tieuDe: r.tieu_de ?? "", khach, dong, capNhat: r.cap_nhat_luc } };
    }),
    ...(h ?? []).map((r) => ({ id: r.id, loai: "sua" as const, khach: (r.khach_hang as unknown as { ho_ten: string } | null)?.ho_ten ?? "Khách lẻ", soDong: 0, nguoiLap: ten.get(r.nguoi_lap_id ?? "") ?? "", capNhat: r.mo_lai_luc ?? "", ma: r.ma })),
  ];
}
