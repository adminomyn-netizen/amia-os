import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Máy chủ đọc/ghi bằng service_role (bỏ qua RLS) — MỌI trang/hành động phải đã qua hàm bảo vệ quyền trước khi gọi. */
export const sb = () => createAdminClient();

/** Lỗi từ hàm Postgres (RAISE EXCEPTION, errcode P0001) là thông báo tiếng Việt dành cho người dùng; lỗi khác thì ẩn chi tiết kỹ thuật. */
export function thongBaoLoi(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return "";
  if (e.code === "P0001") return e.message ?? "Thao tác bị từ chối.";
  if (e.code === "23505") return "Dữ liệu bị trùng (đã tồn tại).";
  if (e.code === "23503") return "Dữ liệu đang được dùng ở nơi khác nên không xoá/đổi được.";
  if (e.code === "23514" || e.code === "23502") return "Dữ liệu chưa hợp lệ hoặc còn thiếu trường bắt buộc.";
  console.error("[db]", e.code, e.message);
  return "Hệ thống gặp lỗi khi lưu. Thử lại, nếu vẫn lỗi báo người phụ trách kỹ thuật.";
}
export type KetQua<T = object> = ({ ok: true } & T) | { ok?: false; loi: string };

/** Tham số tuỳ chọn của hàm Postgres: chuỗi rỗng → NULL (kiểu sinh tự động chưa cho phép null cho tham số hàm). */
export const tuyChon = (v: string | null | undefined) => (v ? v : null) as unknown as string;
