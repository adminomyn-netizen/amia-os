-- 0331 — Danh sách khách trả thêm ảnh đại diện ('anh' = khach_hang.anh_dai_dien_url) để cột trái hiện avatar như SalonHero (chị Lâm 14/11/2026).
-- Vá đúng một chỗ trong bản loc_khach đang chạy (0330), không chép lại cả hàm. Chạy lại nhiều lần vẫn an toàn.
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.loc_khach(jsonb,integer,integer)'::regprocedure);
  if position('''anh'', x.anh_dai_dien_url' in d) = 0 then
    if position('''co_so_goc'', x.co_so_goc,' in d) = 0 then raise exception 'loc_khach: không thấy chỗ vá'; end if;
    execute replace(d, '''co_so_goc'', x.co_so_goc,', '''co_so_goc'', x.co_so_goc, ''anh'', x.anh_dai_dien_url,');
  end if;
end $do$;
