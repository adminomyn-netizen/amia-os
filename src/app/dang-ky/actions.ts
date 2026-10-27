"use server";

import { sb } from "@/lib/db";
import { coSdtHopLe, chuanSdt } from "@/lib/dinh-dang";

type KQ = { ok?: true; loi?: string } | undefined;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOI_DA_CHO = 100;

/** Trang công khai: chỉ GHI MỘT YÊU CẦU chờ duyệt, không tạo tài khoản, không cấp quyền. Chống spam: ô bẫy ẩn, giới hạn số yêu cầu đang chờ, trùng email thì không thêm. */
export async function guiYeuCauTaiKhoan(_: KQ, fd: FormData): Promise<KQ> {
  if (String(fd.get("website") ?? "") !== "") return { ok: true };
  const hoTen = String(fd.get("ho_ten") ?? "").trim(), email = String(fd.get("email") ?? "").trim().toLowerCase();
  const sdt = chuanSdt(String(fd.get("dien_thoai") ?? "")), cn = String(fd.get("chi_nhanh_id") ?? ""), viTri = String(fd.get("vi_tri") ?? "").trim();
  if (hoTen.length < 2 || hoTen.length > 100) return { loi: "Nhập họ tên (2 đến 100 ký tự)." };
  if (!EMAIL.test(email) || email.length > 160) return { loi: "Email chưa đúng định dạng." };
  if (!coSdtHopLe(sdt)) return { loi: "Số điện thoại chưa đúng (bắt đầu bằng 0, đủ 10 hoặc 11 số)." };
  if (viTri.length > 100) return { loi: "Vị trí công việc tối đa 100 ký tự." };
  const db = sb();
  const { data: c } = await db.from("chi_nhanh").select("id").eq("id", cn).eq("hoat_dong", true).maybeSingle();
  if (!c) return { loi: "Chọn chi nhánh làm việc." };
  const [{ count }, { data: daCo }, { data: nv }] = await Promise.all([
    db.from("yeu_cau_tai_khoan").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet"),
    db.from("yeu_cau_tai_khoan").select("id").eq("trang_thai", "cho_duyet").ilike("email", email).maybeSingle(),
    db.from("nhan_vien").select("id").ilike("email", email).maybeSingle(),
  ]);
  if ((count ?? 0) >= TOI_DA_CHO) return { loi: "Hiện có quá nhiều yêu cầu đang chờ. Vui lòng nhắn bộ phận Kỹ thuật." };
  // Không tiết lộ email nào đã có tài khoản: luôn báo đã nhận.
  if (daCo || nv) return { ok: true };
  const { error } = await db.from("yeu_cau_tai_khoan").insert({ ho_ten: hoTen, email, dien_thoai: sdt, chi_nhanh_id: c.id, vi_tri: viTri || null });
  if (error) return { loi: "Chưa gửi được yêu cầu. Vui lòng thử lại sau." };
  return { ok: true };
}
