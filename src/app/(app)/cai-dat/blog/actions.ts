"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const KHO_ANH = "blog-anh";
const KIEU_ANH: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const TOI_DA_ANH = 5 * 1024 * 1024;
/** Chỉ Chủ và Kỹ thuật (nắm quyền hệ thống) quản lý Blog. */
const QUYEN = "hethong.phanquyen" as const;

function lamMoi() {
  revalidatePath("/cai-dat/blog");
  revalidatePath("/blog");
}

export async function luuChuyenMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen(QUYEN))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { tieu_de: chuoi(fd, "tieu_de"), mo_ta: chuoiHoacNull(fd, "mo_ta"), thu_tu: Math.trunc(so(fd, "thu_tu")) || 0, hoat_dong: bat(fd, "hoat_dong"), cap_nhat_luc: new Date().toISOString() };
  if (!row.tieu_de) return { loi: "Nhập tiêu đề chuyên mục." };
  if (row.tieu_de.length > 120) return { loi: "Tiêu đề chuyên mục tối đa 120 chữ." };
  const { error } = id ? await sb().from("blog_chuyen_muc").update(row).eq("id", id) : await sb().from("blog_chuyen_muc").insert(row);
  if (error) return { loi: error.code === "23505" ? "Đã có chuyên mục trùng tên." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function xoaChuyenMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen(QUYEN))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const { count } = await sb().from("blog_bai_viet").select("id", { count: "exact", head: true }).eq("chuyen_muc_id", id);
  if ((count ?? 0) > 0) return { loi: `Chuyên mục còn ${count} bài viết. Chuyển hoặc xoá các bài trước, hoặc chỉ cần tắt kích hoạt.` };
  const { error } = await sb().from("blog_chuyen_muc").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function luuBaiViet(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen(QUYEN);
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const tieuDe = chuoi(fd, "tieu_de"), cm = chuoi(fd, "chuyen_muc_id"), noiDung = chuoi(fd, "noi_dung");
  if (!tieuDe) return { loi: "Nhập tiêu đề bài viết." };
  if (!cm) return { loi: "Chọn chuyên mục." };
  if (!noiDung) return { loi: "Nhập nội dung bài viết." };
  const moTa = chuoiHoacNull(fd, "mo_ta_ngan");
  if (moTa && moTa.length > 600) return { loi: "Mô tả ngắn tối đa 600 chữ." };

  const row: Record<string, unknown> = { tieu_de: tieuDe, chuyen_muc_id: cm, mo_ta_ngan: moTa, noi_dung: noiDung, tieu_bieu: bat(fd, "tieu_bieu"), hoat_dong: bat(fd, "hoat_dong"), cap_nhat_luc: new Date().toISOString() };

  let anhMoi: string | null = null;
  const tep = fd.get("anh");
  if (tep instanceof File && tep.size > 0) {
    const duoi = KIEU_ANH[tep.type];
    if (!duoi) return { loi: "Ảnh phải là JPG, PNG hoặc WebP." };
    if (tep.size > TOI_DA_ANH) return { loi: "Ảnh tối đa 5 MB." };
    anhMoi = `bai/${randomUUID()}.${duoi}`;
    const { error: loiTai } = await sb().storage.from(KHO_ANH).upload(anhMoi, Buffer.from(await tep.arrayBuffer()), { contentType: tep.type, upsert: false });
    if (loiTai) return { loi: "Không tải được ảnh, thử lại." };
    row.anh = anhMoi;
  } else if (bat(fd, "go_anh")) {
    row.anh = null;
  }

  let anhCu: string | null = null;
  if (id && (anhMoi || bat(fd, "go_anh"))) {
    const { data } = await sb().from("blog_bai_viet").select("anh").eq("id", id).maybeSingle();
    anhCu = data?.anh ?? null;
  }
  const { error } = id
    ? await sb().from("blog_bai_viet").update(row as never).eq("id", id)
    : await sb().from("blog_bai_viet").insert({ ...(row as { tieu_de: string; chuyen_muc_id: string; noi_dung: string }), tao_boi: nd.nhanVienId });
  if (error) {
    if (anhMoi) await sb().storage.from(KHO_ANH).remove([anhMoi]);
    return { loi: thongBaoLoi(error) };
  }
  if (anhCu) await sb().storage.from(KHO_ANH).remove([anhCu]);
  lamMoi();
  return { ok: true };
}

export async function doiTrangThaiBai(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen(QUYEN))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("blog_bai_viet").update({ hoat_dong: bat(fd, "hoat_dong"), cap_nhat_luc: new Date().toISOString() }).eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function xoaBaiViet(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen(QUYEN))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const { data } = await sb().from("blog_bai_viet").select("anh").eq("id", id).maybeSingle();
  const { error } = await sb().from("blog_bai_viet").delete().eq("id", id);
  if (error) return { loi: thongBaoLoi(error) };
  if (data?.anh) await sb().storage.from(KHO_ANH).remove([data.anh]);
  lamMoi();
  return { ok: true };
}
