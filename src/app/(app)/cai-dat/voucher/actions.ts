"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so, soHoacNull } from "@/lib/form";
import { chuanMaVoucher } from "@/lib/voucher";
import { GIOI_HAN_VOUCHER } from "@/lib/ban-hang";

type KQ = { ok?: true; loi?: string };
const CHU_MA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // bỏ chữ dễ nhầm (O, 0, I, 1)
const maNgauNhien = (tienTo: string) => tienTo + Array.from({ length: 6 }, () => CHU_MA[Math.floor(Math.random() * CHU_MA.length)]).join("");

/** "Tạo voucher" / sửa voucher (quyền sửa danh mục), các trường như SalonHero. Mỗi lần tạo hoặc sửa đều ghi nhật ký kèm giá trị cũ và mới.
 *  Loại "1 mã dùng nhiều lần": Mã voucher = chính mã khách đọc. Loại "Nhiều mã (mỗi mã 1 lần)": hệ thống tạo đúng "Số lượng phát hành" mã, Mã voucher (nếu nhập) là tiền tố. */
export async function luuVoucher(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const loaiMa = chuoi(fd, "loai_ma");
  const ma = chuanMaVoucher(chuoi(fd, "ma"));
  const cn = mang(fd, "chi_nhanh_ids");
  const row = {
    ten: chuoi(fd, "ten"), tu_ngay: chuoi(fd, "tu_ngay"), den_ngay: chuoi(fd, "den_ngay"), loai_giam: chuoi(fd, "loai_giam"), gia_tri: so(fd, "gia_tri"),
    giam_toi_da: chuoi(fd, "loai_giam") === "phan_tram" ? soHoacNull(fd, "giam_toi_da") : null, so_luong: so(fd, "so_luong"), loai_ma: loaiMa,
    gioi_han: chuoi(fd, "gioi_han") || "tong_don", don_toi_thieu: so(fd, "don_toi_thieu"), so_lan_toi_da_khach: soHoacNull(fd, "so_lan_toi_da_khach"),
    hang_khach: mang(fd, "hang_khach").length ? mang(fd, "hang_khach") : null, khach_moi_cu: chuoiHoacNull(fd, "khach_moi_cu"),
    // Người gắn chi nhánh chỉ tạo/sửa voucher cho chi nhánh mình.
    chi_nhanh_ids: nd.chiNhanhId ? [nd.chiNhanhId] : cn.length ? cn : null,
    ngay_trong_tuan: mang(fd, "ngay_trong_tuan").length ? mang(fd, "ngay_trong_tuan").map(Number) : null,
    // 4 điều kiện thêm (migration 0175): dịch vụ "Tùy chọn", nhóm khách, loại lịch hẹn, khung giờ sử dụng.
    dich_vu_ids: chuoi(fd, "gioi_han") === "tuy_chon" && mang(fd, "dich_vu_ids").length ? mang(fd, "dich_vu_ids") : null,
    nhom_khach_ids: mang(fd, "nhom_khach_ids").length ? mang(fd, "nhom_khach_ids") : null,
    loai_lich_hen: mang(fd, "loai_lich_hen").length ? mang(fd, "loai_lich_hen") : null,
    gio_tu: chuoiHoacNull(fd, "gio_tu"), gio_den: chuoiHoacNull(fd, "gio_den"),
    hien_thi_tim_kiem: chuoi(fd, "hien_thi_tim_kiem") || "co", mo_ta: chuoiHoacNull(fd, "mo_ta"), bi_khoa: bat(fd, "bi_khoa"),
  };
  if (!row.ten) return { loi: "Nhập tên voucher." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.tu_ngay) || !/^\d{4}-\d{2}-\d{2}$/.test(row.den_ngay)) return { loi: "Chọn thời gian sử dụng (từ ngày, đến ngày)." };
  if (row.tu_ngay > row.den_ngay) return { loi: "Ngày bắt đầu không được sau ngày kết thúc." };
  if (!["tien", "phan_tram"].includes(row.loai_giam)) return { loi: "Chọn giá trị voucher theo Tiền hay Phần trăm." };
  if (!(row.gia_tri > 0)) return { loi: "Giá trị voucher phải lớn hơn 0." };
  if (row.loai_giam === "phan_tram" && row.gia_tri > 100) return { loi: "Giảm theo phần trăm không quá 100%." };
  if (row.loai_giam === "tien" && !Number.isInteger(row.gia_tri)) return { loi: "Giảm theo tiền phải là số đồng nguyên." };
  if (row.giam_toi_da !== null && !(row.giam_toi_da > 0)) return { loi: "Số tiền giảm tối đa phải lớn hơn 0 (bỏ trống nếu không giới hạn)." };
  if (!(Number.isInteger(row.so_luong) && row.so_luong > 0 && row.so_luong <= 100000)) return { loi: "Số lượng phát hành phải là số nguyên từ 1 đến 100.000." };
  if (!["mot_ma", "nhieu_ma"].includes(loaiMa)) return { loi: "Chọn loại mã khuyến mại." };
  if (loaiMa === "nhieu_ma" && row.so_luong > 500) return { loi: "Loại nhiều mã tạo tối đa 500 mã mỗi voucher. Cần nhiều hơn thì tạo thêm voucher." };
  if (!GIOI_HAN_VOUCHER.some((g) => g.gia_tri === row.gioi_han)) return { loi: "Chọn giới hạn dịch vụ áp dụng." };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (row.gioi_han === "tuy_chon" && !row.dich_vu_ids) return { loi: "Giới hạn Tùy chọn: chọn ít nhất một dịch vụ." };
  if ([...(row.dich_vu_ids ?? []), ...(row.nhom_khach_ids ?? [])].some((x) => !UUID.test(x))) return { loi: "Lựa chọn dịch vụ hoặc nhóm khách không hợp lệ." };
  if (row.loai_lich_hen && row.loai_lich_hen.some((x) => !/^[A-Z0-9_]{2,20}$/.test(x))) return { loi: "Loại lịch hẹn không hợp lệ." };
  if (!!row.gio_tu !== !!row.gio_den) return { loi: "Khung giờ sử dụng cần nhập cả giờ bắt đầu và giờ kết thúc (hoặc bỏ trống cả hai)." };
  if (row.gio_tu && row.gio_den && (!/^\d{2}:\d{2}(:\d{2})?$/.test(row.gio_tu) || !/^\d{2}:\d{2}(:\d{2})?$/.test(row.gio_den) || row.gio_tu >= row.gio_den)) return { loi: "Giờ bắt đầu phải trước giờ kết thúc trong cùng một ngày." };
  if (row.don_toi_thieu < 0) return { loi: "Giá trị đơn hàng tối thiểu không được âm." };
  if (row.so_lan_toi_da_khach !== null && !(Number.isInteger(row.so_lan_toi_da_khach) && row.so_lan_toi_da_khach > 0)) return { loi: "Số lần dùng tối đa cho 1 khách phải là số nguyên lớn hơn 0 (bỏ trống nếu không giới hạn)." };
  if (row.khach_moi_cu && !["moi", "cu"].includes(row.khach_moi_cu)) return { loi: "Chọn khách cũ hoặc mới." };
  if (!["co", "khong", "tu_dong"].includes(row.hien_thi_tim_kiem)) return { loi: "Chọn cách hiển thị trên tìm kiếm thu ngân." };
  if (ma && !/^[A-Z0-9]{3,30}$/.test(ma)) return { loi: "Mã voucher chỉ gồm chữ cái không dấu và chữ số (3–30 ký tự)." };
  if (!id && loaiMa === "mot_ma" && !ma) return { loi: "Nhập mã voucher." };
  if (!id && loaiMa === "nhieu_ma" && ma.length > 10) return { loi: "Với loại nhiều mã, phần nhập ở Mã voucher là tiền tố, tối đa 10 ký tự." };

  const db = sb();
  let idLuu = id;
  let truoc: Record<string, unknown> | null = null;
  if (id) {
    const { data: cu } = await db.from("voucher").select("*").eq("id", id).maybeSingle();
    if (!cu || (nd.chiNhanhId && cu.chi_nhanh_ids && !cu.chi_nhanh_ids.includes(nd.chiNhanhId))) return { loi: "Không tìm thấy voucher." };
    truoc = cu;
    // Đã có lượt dùng: giá trị, loại giảm, giới hạn áp dụng, loại mã là gốc của các hoá đơn cũ — không đổi; số lượng phát hành không thấp hơn số đã dùng.
    const { data: l } = await db.from("voucher_luot_dung").select("loai").eq("voucher_id", id);
    const da = (l ?? []).reduce((s, x) => s + (x.loai === "dung" ? 1 : -1), 0);
    if ((l ?? []).length > 0 && (cu.loai_giam !== row.loai_giam || Number(cu.gia_tri) !== row.gia_tri || cu.gioi_han !== row.gioi_han || cu.loai_ma !== row.loai_ma))
      return { loi: "Voucher đã có lượt dùng nên không đổi loại giảm, giá trị, giới hạn áp dụng hay loại mã. Khoá voucher này và tạo voucher mới." };
    if (row.so_luong < da) return { loi: `Số lượng phát hành không được nhỏ hơn số lượt đã dùng (${da}).` };
    if (cu.loai_ma === "nhieu_ma") row.so_luong = cu.so_luong;   // số mã đã tạo, không đổi khi sửa
    if (cu.loai_ma === "mot_ma" && ma && (l ?? []).length === 0) {
      const { error: em } = await db.from("voucher_ma").update({ ma }).eq("voucher_id", id);
      if (em) return { loi: em.code === "23505" ? `Mã ${ma} đã có voucher khác dùng.` : thongBaoLoi(em) };
    }
    const { error } = await db.from("voucher").update({ ...row, sua_luc: new Date().toISOString() }).eq("id", id);
    if (error) return { loi: thongBaoLoi(error) };
  } else {
    const { data: v, error } = await db.from("voucher").insert({ ...row, tao_boi: nd.nhanVienId }).select("id").single();
    if (error || !v) return { loi: thongBaoLoi(error) };
    // Tạo mã. Trùng mã (hiếm) thì thử lại; lỗi thì gỡ voucher vừa tạo (chưa có lượt dùng nên xoá được).
    let loiMa = "";
    if (loaiMa === "mot_ma") {
      const { error: em } = await db.from("voucher_ma").insert({ voucher_id: v.id, ma });
      if (em) loiMa = em.code === "23505" ? `Mã ${ma} đã có voucher khác dùng.` : thongBaoLoi(em);
    } else {
      let con = row.so_luong;
      for (let lan = 0; lan < 5 && con > 0; lan++) {
        const dsMa = [...new Set(Array.from({ length: con }, () => maNgauNhien(ma)))];
        const { data: them, error: em } = await db.from("voucher_ma").upsert(dsMa.map((m) => ({ voucher_id: v.id, ma: m })), { onConflict: "ma", ignoreDuplicates: true }).select("id");
        if (em) { loiMa = thongBaoLoi(em); break; }
        con -= them?.length ?? 0;
      }
      if (!loiMa && con > 0) loiMa = "Không tạo đủ mã, thử lại.";
    }
    if (loiMa) {
      await db.from("voucher_ma").delete().eq("voucher_id", v.id);
      await db.from("voucher").delete().eq("id", v.id);
      return { loi: loiMa };
    }
    idLuu = v.id;
  }
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: id ? "sua_voucher" : "tao_voucher", doi_tuong: "voucher", doi_tuong_id: idLuu, chi_tiet: JSON.parse(JSON.stringify({ truoc, sau: { ...row, ma: ma || null } })) });
  revalidatePath("/cai-dat/voucher");
  return { ok: true };
}

/** Khoá / Mở khoá voucher nhanh (SalonHero: Khoá voucher / Mở khoá voucher). Ghi nhật ký. */
export async function khoaVoucher(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), khoa = chuoi(fd, "khoa") === "1";
  const db = sb();
  const { data: v } = await db.from("voucher").select("id, bi_khoa, chi_nhanh_ids").eq("id", id).maybeSingle();
  if (!v || (nd.chiNhanhId && v.chi_nhanh_ids && !v.chi_nhanh_ids.includes(nd.chiNhanhId))) return { loi: "Không tìm thấy voucher." };
  if (v.bi_khoa === khoa) return { loi: khoa ? "Voucher đang khoá rồi." : "Voucher đang mở." };
  const { error } = await db.from("voucher").update({ bi_khoa: khoa, sua_luc: new Date().toISOString() }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: khoa ? "khoa_voucher" : "mo_khoa_voucher", doi_tuong: "voucher", doi_tuong_id: id });
  revalidatePath("/cai-dat/voucher");
  return { ok: true };
}

/** Gia hạn voucher (SalonHero: Gia hạn voucher): chỉ đổi ngày kết thúc, không đổi giá trị hay điều kiện. Ghi nhật ký cũ → mới. */
export async function giaHanVoucher(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), den = chuoi(fd, "den_ngay");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(den)) return { loi: "Chọn ngày kết thúc mới." };
  const db = sb();
  const { data: v } = await db.from("voucher").select("id, tu_ngay, den_ngay, chi_nhanh_ids").eq("id", id).maybeSingle();
  if (!v || (nd.chiNhanhId && v.chi_nhanh_ids && !v.chi_nhanh_ids.includes(nd.chiNhanhId))) return { loi: "Không tìm thấy voucher." };
  if (den < v.tu_ngay) return { loi: "Ngày kết thúc không được trước ngày bắt đầu." };
  const { error } = await db.from("voucher").update({ den_ngay: den, sua_luc: new Date().toISOString() }).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "gia_han_voucher", doi_tuong: "voucher", doi_tuong_id: id, chi_tiet: { truoc: v.den_ngay, sau: den } });
  revalidatePath("/cai-dat/voucher");
  return { ok: true };
}
