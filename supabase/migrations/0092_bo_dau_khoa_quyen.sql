-- 0092 — Khoá quyền hàm bo_dau (0090 quên): anon/authenticated/PUBLIC không được gọi hàm nào trong public (test "cổng cấu trúc"). Máy chủ dùng service_role nên không ảnh hưởng.
revoke all on function public.bo_dau(text) from public, anon, authenticated;
