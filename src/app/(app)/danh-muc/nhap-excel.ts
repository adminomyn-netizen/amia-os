"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuanHoaTen, khoaTen, loiMa, loiTen, tienToTheoNhom } from "@/lib/san-pham";
import { chuoi } from "@/lib/form";
import { DON_VI_DUNG_TICH } from "@/lib/danh-muc";
import { boHuongDan, docExcelDanhMuc, laCo, soTuChu } from "@/lib/nhap-excel-danh-muc";
import type { TablesInsert } from "@/lib/supabase/database.types";

/** Kết quả nhập Excel: tóm tắt + danh sách dòng bị bỏ (kèm lý do). Chỉ THÊM dòng mới, không sửa/xoá dòng đang có. */
export type KQNhap = { ok?: boolean; loi?: string; them?: number; boQua?: string[] };
const CHUNK = 200;

async function layTep(fd: FormData): Promise<Buffer | { loi: string }> {
  const f = fd.get("tep");
  if (!(f instanceof File) || f.size === 0) return { loi: "Chọn tệp Excel (.xlsx) cần nhập." };
  return Buffer.from(await f.arrayBuffer());
}
const ghiVet = async (nguoi: string, doiTuong: string, them: number, boQua: number) => {
  await sb().from("nhat_ky_truy_cap").insert({ nguoi_id: nguoi, hanh_dong: "nhap_excel_danh_muc", doi_tuong: doiTuong, chi_tiet: { them, bo_qua: boQua } });
};
const soMa = async (khoa: string) => Number((await sb().rpc("so_tiep_theo", { p_khoa: khoa })).data ?? 0);

export async function nhapExcelDichVu(fd: FormData): Promise<KQNhap> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nhomId = chuoi(fd, "nhom_id");
  if (!nhomId) return { loi: "Chọn nhóm dịch vụ sẽ nhận các dịch vụ nhập vào." };
  const buf = await layTep(fd); if (!Buffer.isBuffer(buf)) return buf;
  const db = sb();
  const { data: n } = await db.from("dich_vu_nhom").select("id").eq("id", nhomId).maybeSingle();
  if (!n) return { loi: "Nhóm dịch vụ không còn tồn tại." };
  const kq = await docExcelDanhMuc(buf, ["service_name", "sku", "description", "default_price", "service_duration", "edit_price_in_order", "import_price", "english_name"], 2);
  if ("loi" in kq) return kq;
  if (kq.thieu.includes("service_name") || kq.thieu.includes("default_price")) return { loi: "Tệp thiếu cột Tên dịch vụ (service_name) hoặc Giá bán (default_price). Dùng tệp mẫu." };
  const co = new Set(((await db.from("dich_vu").select("ma")).data ?? []).map((x) => x.ma));
  const boQua: string[] = [], rows: TablesInsert<"dich_vu">[] = [];
  for (const { so, o } of kq.dong) {
    const ten = chuanHoaTen(o.service_name), gia = soTuChu(o.default_price), von = o.import_price ? soTuChu(o.import_price) : 0, phut = o.service_duration ? Math.round(soTuChu(o.service_duration)) : 60;
    if (!ten) { boQua.push(`Dòng ${so}: thiếu tên dịch vụ.`); continue; }
    if (!(gia >= 0)) { boQua.push(`Dòng ${so} (${ten}): giá bán không hợp lệ.`); continue; }
    if (!(von >= 0)) { boQua.push(`Dòng ${so} (${ten}): giá vốn không hợp lệ.`); continue; }
    if (!(phut > 0 && phut <= 1440)) { boQua.push(`Dòng ${so} (${ten}): số phút phải từ 1 đến 1440.`); continue; }
    if ((o.description ?? "").length > 2000 || ten.length > 200 || (o.english_name ?? "").length > 200) { boQua.push(`Dòng ${so} (${ten}): chữ quá dài.`); continue; }
    let ma = boHuongDan(o.sku ?? "").toUpperCase().replace(/\s+/g, "");
    if (ma && !/^[A-Z0-9][A-Z0-9._-]{0,39}$/.test(ma)) { boQua.push(`Dòng ${so} (${ten}): mã "${ma}" có ký tự không hợp lệ.`); continue; }
    if (!ma) do { ma = `DV-${String(await soMa("dv_nhap_excel")).padStart(4, "0")}`; } while (co.has(ma));
    if (co.has(ma)) { boQua.push(`Dòng ${so} (${ten}): mã ${ma} đã có.`); continue; }
    co.add(ma);
    rows.push({ ma, nhom_id: nhomId, ten, gia, gia_von: von, thoi_luong_phut: phut, don_vi_tinh: "buổi", hoat_dong: true, cho_sua_gia: laCo(o.edit_price_in_order ?? ""), ten_en: boHuongDan(o.english_name ?? "") || null, mo_ta: boHuongDan(o.description ?? "") || null });
  }
  let them = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from("dich_vu").insert(rows.slice(i, i + CHUNK));
    if (error) { boQua.push(`Các dòng ${i + 1}–${Math.min(i + CHUNK, rows.length)} chưa lưu được: ${thongBaoLoi(error)}`); } else them += Math.min(CHUNK, rows.length - i);
  }
  await ghiVet(nd.nhanVienId, "dich_vu", them, boQua.length);
  revalidatePath("/danh-muc");
  return { ok: true, them, boQua };
}

export async function nhapExcelSanPham(fd: FormData): Promise<KQNhap> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nhom = chuoi(fd, "nhom") || null;
  const buf = await layTep(fd); if (!Buffer.isBuffer(buf)) return buf;
  const kq = await docExcelDanhMuc(buf, ["product_name", "sku", "description", "default_price", "brand_name", "import_price", "edit_price_in_order", "unit_1", "capacity", "unit_2", "english_name"], 2);
  if ("loi" in kq) return kq;
  if (kq.thieu.includes("product_name") || kq.thieu.includes("unit_1")) return { loi: "Tệp thiếu cột Tên sản phẩm (product_name) hoặc Đơn vị sản phẩm (unit_1). Dùng tệp mẫu." };
  const db = sb();
  const { data: ds } = await db.from("san_pham").select("ma, ten");
  const maCo = new Set((ds ?? []).map((x) => x.ma)), tenCo = new Set((ds ?? []).map((x) => khoaTen(x.ten)));
  const boQua: string[] = [], rows: TablesInsert<"san_pham">[] = [];
  const tienTo = tienToTheoNhom(nhom);
  for (const { so, o } of kq.dong) {
    const ten = chuanHoaTen(o.product_name), gia = o.default_price ? soTuChu(o.default_price) : 0, von = o.import_price ? soTuChu(o.import_price) : null;
    const donVi = (o.unit_1 ?? "").trim(), dv2 = (o.unit_2 ?? "").trim(), dungTich = o.capacity ? soTuChu(o.capacity) : null;
    if (!ten) { boQua.push(`Dòng ${so}: thiếu tên sản phẩm.`); continue; }
    const lt = loiTen(ten); if (lt) { boQua.push(`Dòng ${so} (${ten}): ${lt}`); continue; }
    if (!donVi || donVi.length > 20) { boQua.push(`Dòng ${so} (${ten}): thiếu đơn vị sản phẩm.`); continue; }
    if (!(gia >= 0) || (von != null && !(von >= 0)) || (dungTich != null && !(dungTich >= 0))) { boQua.push(`Dòng ${so} (${ten}): giá hoặc dung tích không hợp lệ.`); continue; }
    if (dv2 && !DON_VI_DUNG_TICH.some((x) => x.gia_tri === dv2)) { boQua.push(`Dòng ${so} (${ten}): đơn vị dung tích "${dv2}" không có trong danh sách.`); continue; }
    if (tenCo.has(khoaTen(ten))) { boQua.push(`Dòng ${so} (${ten}): tên trùng sản phẩm đã có.`); continue; }
    let ma = boHuongDan(o.sku ?? "").toUpperCase().replace(/\s+/g, "");
    if (ma && loiMa(ma)) { boQua.push(`Dòng ${so} (${ten}): mã "${ma}" sai quy ước (chữ in hoa, số, . _ -, 3–24 ký tự).`); continue; }
    if (!ma) do { ma = `${tienTo}-${String(await soMa(`sp_${tienTo}`)).padStart(4, "0")}`; } while (maCo.has(ma));
    if (maCo.has(ma)) { boQua.push(`Dòng ${so} (${ten}): mã ${ma} đã có.`); continue; }
    maCo.add(ma); tenCo.add(khoaTen(ten));
    rows.push({ ma, ten, nhom, don_vi: donVi, gia_ban: gia, gia_nhap_don_vi: von, ban_le: gia > 0, hoat_dong: true, cho_sua_gia: laCo(o.edit_price_in_order ?? ""), nhan_hieu: boHuongDan(o.brand_name ?? "") || null, ten_en: boHuongDan(o.english_name ?? "") || null, mo_ta: boHuongDan(o.description ?? "") || null, dung_tich: dungTich, dung_tich_dv: dungTich == null ? null : dv2 || null });
  }
  let them = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from("san_pham").insert(rows.slice(i, i + CHUNK));
    if (error) { boQua.push(`Các dòng ${i + 1}–${Math.min(i + CHUNK, rows.length)} chưa lưu được: ${thongBaoLoi(error)}`); } else them += Math.min(CHUNK, rows.length - i);
  }
  await ghiVet(nd.nhanVienId, "san_pham", them, boQua.length);
  revalidatePath("/danh-muc");
  return { ok: true, them, boQua };
}

export async function nhapExcelGoiThe(fd: FormData): Promise<KQNhap> {
  const nd = await kiemQuyen("danhmuc.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const buf = await layTep(fd); if (!Buffer.isBuffer(buf)) return buf;
  const kq = await docExcelDanhMuc(buf, ["card_name", "card_type", "card_description", "use_limit", "sale_price", "use_price", "default_account_balance", "expired_from", "time_limit", "edit_price_in_order"], 3);
  if ("loi" in kq) return kq;
  if (kq.thieu.includes("card_name") || kq.thieu.includes("card_type")) return { loi: "Tệp thiếu cột Tên thẻ (card_name) hoặc Loại thẻ (card_type). Dùng tệp mẫu." };
  const db = sb();
  const co = new Set(((await db.from("goi_the").select("ma")).data ?? []).map((x) => x.ma));
  const boQua: string[] = [], rows: TablesInsert<"goi_the">[] = [];
  for (const { so, o } of kq.dong) {
    const ten = chuanHoaTen(o.card_name), loaiChu = (o.card_type ?? "").trim().toLowerCase();
    if (!ten) { boQua.push(`Dòng ${so}: thiếu tên thẻ.`); continue; }
    const loai = /^(lần|lan)/.test(loaiChu) ? "lan" : /^(tiền|tien)/.test(loaiChu) ? "tien" : null;
    if (!loai) { boQua.push(`Dòng ${so} (${ten}): Loại thẻ phải là "Lần" hoặc "Tiền".`); continue; }
    const soBuoi = Math.round(soTuChu(o.use_limit ?? "")), gia = o.sale_price ? soTuChu(o.sale_price) : NaN, soDu = o.default_account_balance ? Math.round(soTuChu(o.default_account_balance)) : NaN, thang = o.time_limit ? soTuChu(o.time_limit) : 0;
    if (loai === "lan" && !(soBuoi > 0)) { boQua.push(`Dòng ${so} (${ten}): thẻ lần cần Số lần sử dụng lớn hơn 0.`); continue; }
    if (loai === "tien" && !(soDu > 0)) { boQua.push(`Dòng ${so} (${ten}): thẻ tiền cần Số tiền trong thẻ lớn hơn 0.`); continue; }
    const giaBan = Number.isFinite(gia) ? gia : loai === "tien" ? soDu : NaN;
    if (!(giaBan >= 0)) { boQua.push(`Dòng ${so} (${ten}): thiếu Giá bán.`); continue; }
    if (!(thang >= 0 && thang <= 600)) { boQua.push(`Dòng ${so} (${ten}): thời hạn (tháng) không hợp lệ.`); continue; }
    let ma = ""; do { ma = `T-${String(await soMa("goi_the_nhap_excel")).padStart(4, "0")}`; } while (co.has(ma));
    co.add(ma);
    const tuNgay = /^(tạo|tao)/i.test((o.expired_from ?? "").trim()) ? "ngay_tao" : "ngay_cap", gt1 = o.use_price ? soTuChu(o.use_price) : NaN;
    rows.push({ ma, ten, loai, gia: giaBan, so_buoi: loai === "lan" ? soBuoi : null, gia_tri_the: loai === "tien" ? soDu : null, han_dung_thang: Math.trunc(thang) || null, han_dung_ngay: Math.round((thang - Math.trunc(thang)) * 30) || null, han_tinh_tu: tuNgay, hoat_dong: true, mo_ta: boHuongDan(o.card_description ?? "") || null, cho_sua_gia: laCo(o.edit_price_in_order ?? ""), gia_tri_1_lan: loai === "lan" && gt1 >= 0 ? Math.round(gt1) : null });
  }
  let them = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from("goi_the").insert(rows.slice(i, i + CHUNK));
    if (error) { boQua.push(`Các dòng ${i + 1}–${Math.min(i + CHUNK, rows.length)} chưa lưu được: ${thongBaoLoi(error)}`); } else them += Math.min(CHUNK, rows.length - i);
  }
  await ghiVet(nd.nhanVienId, "goi_the", them, boQua.length);
  revalidatePath("/danh-muc");
  return { ok: true, them, boQua };
}
