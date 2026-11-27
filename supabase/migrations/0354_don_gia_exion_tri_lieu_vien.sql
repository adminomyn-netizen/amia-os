-- PL02 mục III "EXION - trị liệu viên tự thực hiện": các dòng 9-12 chưa gắn dịch vụ nên ca EXION không được tính phí.
-- Gắn theo tên dịch vụ trong danh mục. Giảm mỡ bụng / Thon gọn tay không nằm trong PL02, để Giám đốc chi nhánh duyệt riêng.
update public.phi_tl_don_gia g set
  dich_vu_ids = (select coalesce(array_agg(d.id), '{}') from public.dich_vu d where lower(trim(d.ten)) = any(
    case g.stt
      when 9  then array['exion vùng mắt','exion vùng môi','exion vùng trán']
      when 10 then array['exion full face']
      when 11 then array['exion bikini vùng trong','exion bikini vùng ngoài']
      when 12 then array['exion bikini full'] end))
where g.doi_tuong = 'tri_lieu' and g.stt in (9,10,11,12) and cardinality(g.dich_vu_ids) = 0;
