import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DUONG_DAN_CONG_KHAI = ["/dang-nhap"];

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
  const { data: dataClaims } = await supabase.auth.getClaims();
  const coPhien = !!dataClaims?.claims;
  const laTrangCongKhai = DUONG_DAN_CONG_KHAI.some((d) => request.nextUrl.pathname.startsWith(d));

  if (!coPhien && !laTrangCongKhai) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    return NextResponse.redirect(url);
  }
  // Đã đăng nhập mà vào /dang-nhap: KHÔNG đẩy đi ở đây (JWT còn hạn chưa chắc phiên còn sống → dễ lặp chuyển trang).
  // dang-nhap/layout.tsx hỏi máy chủ Auth thật rồi mới đẩy.

  return supabaseResponse;
}
