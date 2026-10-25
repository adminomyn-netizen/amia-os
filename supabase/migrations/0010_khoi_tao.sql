-- 0010 — Dữ liệu khởi tạo: 2 chi nhánh AMIA và 11 nhóm dịch vụ (theo màn Thu ngân đang dùng).
insert into public.chi_nhanh (ma, ten, dia_chi) values
  ('VINH', 'AMIA Vinh', '39A Lê Hồng Phong, TP. Vinh'),
  ('DALAT', 'AMIA Đà Lạt', null);

insert into public.dich_vu_nhom (ten, thu_tu) values
  ('Chăm sóc da cơ bản', 1), ('Trị liệu da CNC', 2), ('Peel da', 3), ('Tiêm', 4), ('Thủ thuật nội khoa', 5),
  ('Triệt lông', 6), ('Body', 7), ('Phun xăm thẩm mỹ', 8), ('Sức khoẻ chủ động', 9), ('Khoá học', 10), ('Thẻ tiền', 11);
select public.khoa_tat_ca_bang();
