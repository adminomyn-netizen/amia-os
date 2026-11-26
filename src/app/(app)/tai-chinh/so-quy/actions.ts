"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string };
const TOI_DA = 100_000_000_000;
const xong = (): KQ => { revalidatePath("/tai-chinh/so-quy"); return { ok: true }; };
const ma = async (tien: string) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: `so_quy_${tien}` })).data ?? 0)).padStart(6, "0")}`;
const ngayHopLe = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= homNayHCM();

/** Quỹ phải đang dùng và nằm trong chi nhánh của người ghi (người gắn chi nhánh chỉ ghi quỹ của chi nhánh mình). */
async function layQuy(id: string, chiNhanhId: string | null) {
  const { data } = await sb().from("quy").select("id, chi_nhanh_id, ten").eq("id", id).eq("hoat_dong", true).maybeSingle();
  if (!data || (chiNhanhId && data.chi_nhanh_id !== chiNhanhId)) return null;
  return data;
}

export async function ghiThuChi(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const huong = chuoi(fd, "huong") === "thu" ? "thu" : "chi";
  const tien = so(fd, "so_tien"), ngay = chuoi(fd, "ngay") || homNayHCM(), noiDung = chuoi(fd, "noi_dung");
  if (!Number.isInteger(tien) || tien <= 0 || tien > TOI_DA) return { loi: "Số tiền phải là số đồng lớn hơn 0 và không quá 100 tỷ." };
  if (!ngayHopLe(ngay)) return { loi: "Ngày ghi không được ở tương lai." };
  if (!noiDung) return { loi: "Nhập nội dung khoản " + (huong === "thu" ? "thu." : "chi.") };
  const quy = await layQuy(chuoi(fd, "quy_id"), nd.chiNhanhId);
  if (!quy) return { loi: "Chọn quỹ hợp lệ." };
  const { data: lt } = await sb().from("loai_thu_chi").select("id, huong, he_thong").eq("id", chuoi(fd, "loai_thu_chi_id")).eq("hoat_dong", true).maybeSingle();
  if (!lt || lt.huong !== huong || lt.he_thong) return { loi: "Chọn phân loại đúng với khoản " + (huong === "thu" ? "thu." : "chi.") };
  const { error } = await sb().from("so_quy").insert({ ma: await ma(huong === "thu" ? "PT" : "PC"), ngay, quy_id: quy.id, loai: huong, so_tien: tien, loai_thu_chi_id: lt.id, noi_dung: noiDung, doi_tuong: chuoiHoacNull(fd, "doi_tuong"), nguoi_nhan: chuoiHoacNull(fd, "nguoi_nhan"), nguoi_id: nd.nhanVienId });
  return error ? { loi: thongBaoLoi(error) } : xong();
}

/** Nạp tiền / Rút tiền (SalonHero: Nạp tiền, Rút tiền ở sổ tiền mặt và sổ ngân hàng): tiền vào/ra một quỹ, không phải thu/chi kinh doanh, không phải chuyển giữa 2 quỹ. */
export async function ghiNapRut(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const huong = chuoi(fd, "huong") === "nap" ? "nap" : "rut";
  const tien = so(fd, "so_tien"), ngay = chuoi(fd, "ngay") || homNayHCM(), noiDung = chuoi(fd, "noi_dung");
  if (!Number.isInteger(tien) || tien <= 0 || tien > TOI_DA) return { loi: "Số tiền phải là số đồng lớn hơn 0 và không quá 100 tỷ." };
  if (!ngayHopLe(ngay)) return { loi: "Ngày ghi không được ở tương lai." };
  if (!noiDung) return { loi: huong === "nap" ? "Nhập nội dung khoản nạp tiền." : "Nhập nội dung khoản rút tiền." };
  const quy = await layQuy(chuoi(fd, "quy_id"), nd.chiNhanhId);
  if (!quy) return { loi: "Chọn quỹ hợp lệ." };
  const { error } = await sb().from("so_quy").insert({ ma: await ma(huong === "nap" ? "NT" : "RT"), ngay, quy_id: quy.id, loai: huong, so_tien: tien, noi_dung: noiDung, doi_tuong: chuoiHoacNull(fd, "doi_tuong"), nguoi_nhan: chuoiHoacNull(fd, "nguoi_nhan"), nguoi_id: nd.nhanVienId });
  return error ? { loi: thongBaoLoi(error) } : xong();
}

export async function chuyenQuy(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const tien = so(fd, "so_tien"), ngay = chuoi(fd, "ngay") || homNayHCM(), noiDung = chuoi(fd, "noi_dung") || "Chuyển quỹ";
  if (!Number.isInteger(tien) || tien <= 0 || tien > TOI_DA) return { loi: "Số tiền phải là số đồng lớn hơn 0 và không quá 100 tỷ." };
  if (!ngayHopLe(ngay)) return { loi: "Ngày chuyển không được ở tương lai." };
  const tu = chuoi(fd, "quy_tu"), den = chuoi(fd, "quy_den");
  if (!tu || !den || tu === den) return { loi: "Chọn hai quỹ khác nhau." };
  const [qTu, qDen] = await Promise.all([layQuy(tu, nd.chiNhanhId), layQuy(den, nd.chiNhanhId)]);
  if (!qTu || !qDen) return { loi: "Chọn quỹ hợp lệ." };
  const nhom = crypto.randomUUID(), m = await ma("CQ");
  const chung = { ngay, so_tien: tien, noi_dung: noiDung, nguon: "chuyen_quy" as const, nhom_chuyen: nhom, nguoi_id: nd.nhanVienId };
  const { error } = await sb().from("so_quy").insert([{ ...chung, ma: `${m}-R`, quy_id: tu, loai: "rut" }, { ...chung, ma: `${m}-N`, quy_id: den, loai: "nap" }]);
  return error ? { loi: thongBaoLoi(error) } : xong();
}

/** Đảo phiếu: không sửa/xoá dòng cũ (sổ cái), ghi thêm dòng ngược chiều trỏ về phiếu gốc; chuyển quỹ đảo cả hai dòng. */
export async function daoPhieu(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.dao"); // như SalonHero cost.delete: chỉ Kế toán và Chủ
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: goc } = await db.from("so_quy").select("*").eq("id", chuoi(fd, "id")).maybeSingle();
  if (!goc || goc.nguon === "dao_phieu") return { loi: "Không tìm thấy phiếu để đảo." };
  if (goc.sh_id != null) return { loi: "Phiếu này lấy từ SalonHero: sửa hoặc xoá ở SalonHero, đồng bộ đêm sẽ tự đảo theo." };
  const nhomDong = goc.nhom_chuyen ? (await db.from("so_quy").select("*").eq("nhom_chuyen", goc.nhom_chuyen)).data ?? [goc] : [goc];
  const { data: quy } = await db.from("quy").select("id, chi_nhanh_id").in("id", nhomDong.map((d) => d.quy_id));
  if (nd.chiNhanhId && (quy ?? []).some((q) => q.chi_nhanh_id !== nd.chiNhanhId)) return { loi: KHONG_DU_QUYEN };
  const nguoc = { thu: "chi", chi: "thu", nap: "rut", rut: "nap" } as const;
  const ly = chuoi(fd, "ly_do");
  if (!ly) return { loi: "Nhập lý do đảo phiếu." };
  const ngay = homNayHCM();
  const dong = [];
  for (const d of nhomDong) dong.push({ ma: `DP${d.ma}`, ngay, quy_id: d.quy_id, loai: nguoc[d.loai as keyof typeof nguoc], so_tien: d.so_tien, loai_thu_chi_id: d.loai_thu_chi_id, noi_dung: `Đảo phiếu ${d.ma}: ${ly}`, doi_tuong: d.doi_tuong, nguon: "dao_phieu" as const, phieu_goc_id: d.id, nguoi_id: nd.nhanVienId });
  const { error } = await db.from("so_quy").insert(dong);
  return error ? { loi: error.code === "23505" ? "Phiếu này đã được đảo rồi." : thongBaoLoi(error) } : xong();
}

export async function luuLoaiThuChi(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("quy.ghi"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), ten = chuoi(fd, "ten");
  if (!ten) return { loi: "Nhập tên phân loại." };
  const db = sb();
  if (id) {
    const { data: cu } = await db.from("loai_thu_chi").select("he_thong").eq("id", id).maybeSingle();
    if (!cu || cu.he_thong) return { loi: "Phân loại của hệ thống không sửa được." };
    const { error } = await db.from("loai_thu_chi").update({ ten, hoat_dong: bat(fd, "hoat_dong"), nhom: chuoi(fd, "nhom") || null }).eq("id", id);
    return error ? { loi: error.code === "23505" ? "Đã có phân loại trùng tên." : thongBaoLoi(error) } : xong();
  }
  const huong = chuoi(fd, "huong") === "thu" ? "thu" : "chi";
  const { error } = await db.from("loai_thu_chi").insert({ ten, huong, thu_tu: 50, nhom: chuoi(fd, "nhom") || (huong === "thu" ? "Thu nội bộ" : "Chi nội bộ") });
  return error ? { loi: error.code === "23505" ? "Đã có phân loại trùng tên." : thongBaoLoi(error) } : xong();
}
