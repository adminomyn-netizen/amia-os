"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { kiemDuLieuSua } from "@/lib/chuan-hoa-kho";

type KQ = { ok?: true; loi?: string; id?: string };

/** Người sửa chuẩn hoá: kho.duyet hoặc danhmuc.sua; người gắn một chi nhánh chỉ XEM (danh mục vật tư là của cả hệ thống, không thuộc riêng chi nhánh nào). */
async function nguoiSua() {
  const nd = (await kiemQuyen("kho.duyet")) ?? (await kiemQuyen("danhmuc.sua"));
  if (!nd) return { loi: KHONG_DU_QUYEN } as const;
  if (nd.chiNhanhId) return { loi: "Tài khoản gắn một chi nhánh chỉ được xem trang này." } as const;
  return { nd } as const;
}

/** Lưu MỘT dòng vật tư: đơn vị, đơn vị mua, hệ số, giá nhập, nhóm cấp, cờ tiêu hao. Ghi nhật ký truy cập giá trị trước và sau. */
export async function luuChuanHoaVatTu(fd: FormData): Promise<KQ> {
  const r = await nguoiSua();
  if ("loi" in r) return { loi: r.loi };
  const id = chuoi(fd, "id");
  const kiem = kiemDuLieuSua({ don_vi: chuoi(fd, "don_vi"), don_vi_mua: chuoi(fd, "don_vi_mua"), he_so: chuoi(fd, "he_so_quy_doi"), gia_nhap: chuoi(fd, "gia_nhap_don_vi"), nhom_cap: chuoi(fd, "nhom_cap"), tieu_hao: bat(fd, "tieu_hao") });
  if ("loi" in kiem) return { loi: kiem.loi };
  const db = sb();
  const { data: cu } = await db.from("san_pham").select("id, ma, don_vi, don_vi_mua, he_so_quy_doi, gia_nhap_don_vi, nhom_cap, tieu_hao").eq("id", id).maybeSingle();
  if (!cu) return { loi: "Không tìm thấy mặt hàng này." };
  const { error } = await db.from("san_pham").update(kiem.ok).eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: r.nd.nhanVienId, hanh_dong: "chuan_hoa_vat_tu", doi_tuong: "san_pham", doi_tuong_id: id, chi_tiet: { ma: cu.ma, truoc: { ...cu, id: undefined }, sau: kiem.ok } });
  revalidatePath("/kho/chuan-hoa");
  revalidatePath("/dinh-muc");
  return { ok: true };
}

/** Tạo phiếu kiểm kê TỒN ĐẦU cho một chi nhánh: chụp tồn sổ, người đếm nhập số thực tế + số lô + hạn dùng, người khác duyệt thì phần thừa mới vào sổ kho dưới dạng "Tồn đầu kỳ". Không tự sửa sổ hàng loạt. */
export async function taoKiemKeTonDau(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("kho.nhap");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const cn = nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id");
  if (!cn) return { loi: "Chọn chi nhánh." };
  const { data, error } = await (sb().rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: string | null; error: { message: string; code?: string } | null }>)("tao_phieu_kiem_ke", {
    p_cn: cn, p_ngay: homNayHCM(), p_loai: "ton_dau", p_nguoi: nd.nhanVienId, p_nguoi_2: chuoi(fd, "nguoi_dem_2_id") || null, p_ghi_chu: "Chốt tồn đầu khi chuẩn hoá kho vật tư (đối chiếu SalonHero 28/10).",
  });
  if (error) return { loi: thongBaoLoi(error as never) };
  revalidatePath("/kho/kiem-ke");
  revalidatePath("/kho/chuan-hoa");
  return { ok: true, id: String(data) };
}
