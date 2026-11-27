-- Dòng đơn giá bác sĩ "HA Volumax các loại" (500.000đ/cc) chưa gắn dịch vụ nào nên mọi ca filler bị coi là "chưa có đơn giá" và không hiện ở danh sách ca tính phí.
-- Gắn 2 dịch vụ của gói HA Volumax (Korea = Cấy Ha collagen Châu Á - Hàn, VIP = Cấy Ha collagen Pháp - juvederm) và tên dòng SalonHero cũ (HA Volumax …).
-- Giả định: mỗi buổi/dòng = 1 cc (ca chưa ghi số cc); khi ghi được số cc thì số lượng theo cc.
update public.phi_tl_don_gia
   set dich_vu_ids = (select array_agg(id) from public.dich_vu where id in ('0df4903d-7873-420f-a10e-594f93c2174a', '592434c6-954b-41ea-9dd7-f1fdae1e8cd7')),
       ten_ghep = array['ha volumax korea', 'ha volumax vip', 'ha volumax vip pro', 'ha volumax premium']
 where doi_tuong = 'bac_si' and ten = 'HA Volumax các loại' and cardinality(dich_vu_ids) = 0 and cardinality(ten_ghep) = 0;
