-- Dung lượng kho ảnh khách (MB) cho công cụ chuyển ảnh hàng loạt biết mà dừng trước khi đầy kho.
-- Viết bằng plpgsql (không phải sql) để bảng storage.objects chỉ được kiểm khi chạy, không phải lúc tạo hàm.
create or replace function public.dung_luong_kho_anh_mb() returns numeric language plpgsql stable security definer set search_path = '' as $$
begin
  return (select coalesce(round(sum((metadata ->> 'size')::bigint) / 1e6), 0) from storage.objects where bucket_id = 'khach-anh');
end $$;
revoke all on function public.dung_luong_kho_anh_mb() from public, anon, authenticated;
select public.khoa_tat_ca_bang();
