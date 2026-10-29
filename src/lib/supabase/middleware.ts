import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /api/cron/* tự kiểm CRON_SECRET trong từng route (Vercel Cron không có phiên đăng nhập); /api/chat-agent/cong-cu tự kiểm mã thông hành của từng tin chat.
// /dat-lich: khách tự gửi yêu cầu đặt lịch (không đăng nhập) — trang chỉ đọc danh mục công khai và ghi vào bảng yêu cầu riêng qua hàm có giới hạn.
const DUONG_DAN_CONG_KHAI = ["/dang-nhap", "/dang-ky", "/quen-mat-khau", "/dat-lai-mat-khau", "/api/cron", "/api/chat-agent/cong-cu", "/l/", "/dat-lich"];

export async function capNhatPhien(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() kiểm chữ ký JWT ngay tại máy chủ (không gọi mạng) nên cổng chặn gần như tức thì.
  // Quyền thật (vai trò, còn hoạt động) do hàm bảo vệ trong từng trang/hành động quyết định, hỏi DB mỗi yêu cầu.
  const { data: dataClaims, error: loiClaims } = await supabase.auth.getClaims();
  const coPhien = !!dataClaims?.claims;
  // Auth chậm/quá tải khi làm mới token (504, mất kết nối) không phải hết phiên: giữ nguyên, để trang tự báo "đang chậm" thay vì đá ra đăng nhập.
  const authLoiTamThoi = !!loiClaims && (loiClaims.name === "AuthRetryableFetchError" || ((loiClaims as { status?: number }).status ?? 0) >= 500);
  const laTrangCongKhai = DUONG_DAN_CONG_KHAI.some((d) => request.nextUrl.pathname.startsWith(d));

  if (!coPhien && !laTrangCongKhai && !authLoiTamThoi) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    return NextResponse.redirect(url);
  }
  // Đã đăng nhập mà vào /dang-nhap: KHÔNG đẩy đi ở đây (JWT còn hạn chưa chắc phiên còn sống → dễ lặp chuyển trang).
  // dang-nhap/layout.tsx hỏi máy chủ Auth thật rồi mới đẩy.

  return supabaseResponse;
}
