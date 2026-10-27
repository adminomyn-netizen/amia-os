import { createClient } from "@supabase/supabase-js";

/** Máy khách riêng cho đặt lại mật khẩu: đổi token_hash trong thư ra phiên tạm, không lưu phiên, nên link mở ở trình duyệt/máy nào cũng dùng được. */
export function mayKhachDatLai() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
