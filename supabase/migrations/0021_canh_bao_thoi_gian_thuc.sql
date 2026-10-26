-- Chuông thông báo cập nhật tức thời: mỗi khi dữ liệu có thể làm đổi "việc đang chờ" thay đổi, DB bắn MỘT tín hiệu rỗng
-- vào kênh Realtime công khai 'canh-bao'. Tín hiệu không mang dữ liệu nào; trình duyệt nghe thấy thì tự gọi lại /api/canh-bao
-- (có kiểm quyền) để lấy danh sách của riêng người đó. Trình duyệt vẫn không chạm bảng nào.
-- AN TOÀN GIAO DỊCH: nếu Realtime lỗi/chưa bật thì nuốt lỗi, tuyệt đối không làm hỏng việc ghi dữ liệu nghiệp vụ.
create function public.bao_canh_bao_doi() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform realtime.send('{}'::jsonb, 'doi', 'canh-bao', false);
  exception when others then
    null;
  end;
  return null;
end $$;
revoke all on function public.bao_canh_bao_doi() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['lich_hen', 'phieu_cap', 'the_khach', 'the_so_cai', 'hoa_don', 'thanh_toan', 'kho_so_cai', 'buoi_thuc_hien']
  loop
    execute format('create trigger bao_canh_bao_doi after insert or update or delete on public.%I for each statement execute function public.bao_canh_bao_doi()', t);
  end loop;
end $$;

select public.khoa_tat_ca_bang();
