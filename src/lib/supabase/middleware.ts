import { createServerClient } from "@supabase/ssr";
import { fetchAuthCoHan, KHOA_JWT } from "@/lib/supabase/khoa-jwt";
import { NextResponse, type NextRequest } from "next/server";

// /api/cron/* và /api/mkt/so-lieu-ngay (luồng AnyCross đọc số liệu MKT) tự kiểm CRON_SECRET trong từng route (Vercel Cron không có phiên đăng nhập); /api/chat-agent/cong-cu tự kiểm mã thông hành của từng tin chat.
// /ctv: cổng CTV công khai — KHÔNG dùng phiên nhân viên; tự kiểm phiên CTV riêng (cookie amia_ctv ký HMAC, src/lib/ctv-phien.ts) trong từng trang/hành động.
// /dat-lich: khách tự gửi yêu cầu đặt lịch (không đăng nhập) — trang chỉ đọc danh mục công khai và ghi vào bảng yêu cầu riêng qua hàm có giới hạn.
const DUONG_DAN_CONG_KHAI = ["/dang-nhap", "/dang-ky", "/quen-mat-khau", "/dat-lai-mat-khau", "/api/cron", "/api/mkt/so-lieu-ngay", "/api/chat-agent/cong-cu", "/l/", "/dat-lich", "/blog", "/ctv"];

export async function capNhatPhien(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchAuthCoHan },
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

  // getClaims() kiểm chữ ký JWT ngay tại máy chủ bằng khoá công khai nhúng sẵn (KHOA_JWT, không gọi mạng) nên cổng chặn gần như tức thì.
  // Quyền thật (vai trò, còn hoạt động) do hàm bảo vệ trong từng trang/hành động quyết định, hỏi DB mỗi yêu cầu.
  const { data: dataClaims, error: loiClaims } = await supabase.auth.getClaims(undefined, KHOA_JWT);
  const coPhien = !!dataClaims?.claims;
  // Auth chậm/quá tải khi làm mới token (504, mất kết nối) không phải hết phiên: giữ nguyên, để trang tự báo "đang chậm" thay vì đá ra đăng nhập.
  const authLoiTamThoi = !!loiClaims && (loiClaims.name === "AuthRetryableFetchError" || ((loiClaims as { status?: number }).status ?? 0) >= 500);
  const laTrangCongKhai = DUONG_DAN_CONG_KHAI.some((d) => request.nextUrl.pathname.startsWith(d));

  if (!coPhien && !laTrangCongKhai && !authLoiTamThoi) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    return NextResponse.redirect(url);
  }
  // Vai "Chỉ xem": chặn mọi yêu cầu GHI vào /api (lưới thứ hai; Server Action chặn ở auth.ts). Chỉ tra DB khi là yêu cầu ghi.
  if (coPhien && !laTrangCongKhai && !["GET", "HEAD", "OPTIONS"].includes(request.method) && request.nextUrl.pathname.startsWith("/api/")) {
    const sub = String(dataClaims?.claims?.sub ?? "").replace(/[^a-f0-9-]/gi, "");
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/nhan_vien?select=vai_tro&user_id=eq.${sub}&limit=1`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` }, cache: "no-store" });
      const j = (await r.json()) as { vai_tro?: string }[];
      if (j?.[0]?.vai_tro === "chi_xem") return NextResponse.json({ loi: "Tài khoản này chỉ được xem, không thao tác được." }, { status: 403 });
    } catch { /* không tra được thì để route tự kiểm quyền như cũ */ }
  }
  // Đã đăng nhập mà vào /dang-nhap: KHÔNG đẩy đi ở đây (JWT còn hạn chưa chắc phiên còn sống → dễ lặp chuyển trang).
  // dang-nhap/layout.tsx hỏi máy chủ Auth thật rồi mới đẩy.

  return supabaseResponse;
}
