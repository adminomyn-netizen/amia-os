import "server-only";
import { sb } from "@/lib/db";
import { chuanSdt } from "@/lib/dinh-dang";

/** Tìm đúng MỘT khách theo mã hoặc số điện thoại (bỏ ký tự làm hỏng điều kiện lọc PostgREST). Trùng số nhiều khách thì bắt nhập mã. */
export async function timKhachMaSdt(nhap: string): Promise<{ k?: { id: string; chi_nhanh_id: string | null; ho_ten: string; ma: string }; loi?: string }> {
  const ma = nhap.trim().toUpperCase().replace(/[^A-Z0-9._-]/g, ""), sdt = chuanSdt(nhap);
  const dk = [ma ? `ma.eq.${ma}` : "", sdt.length >= 9 ? `dien_thoai.eq.${sdt}` : ""].filter(Boolean);
  if (!dk.length) return { loi: "Nhập mã khách hoặc số điện thoại." };
  const { data } = await sb().from("khach_hang").select("id, chi_nhanh_id, ho_ten, ma").or(dk.join(",")).limit(3);
  const ds = data ?? [];
  const dungMa = ds.filter((x) => x.ma?.toUpperCase() === ma);
  if (dungMa.length === 1) return { k: dungMa[0] };
  if (ds.length > 1) return { loi: "Có nhiều khách trùng số điện thoại này. Nhập mã khách." };
  return ds.length ? { k: ds[0] } : { loi: "Không tìm thấy khách theo mã hoặc số điện thoại đó." };
}
