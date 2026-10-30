-- 0174 — Email tự động trong tuyển dụng: mẫu thư theo bước ứng viên, hàng đợi gửi, và kết nối Gmail (mật khẩu ứng dụng, lưu đã mã hoá).
-- Chỉ máy chủ (khoá service) đọc/ghi, FORCE RLS như các bảng khác (cuối tệp).

create table public.tuyen_dung_mau_thu (
  ma text primary key check (ma in ('nhan_cv', 'moi_phong_van', 'de_nghi', 'chao_mung', 'cam_on')),
  buoc text not null check (buoc in ('Mới nộp', 'Hẹn phỏng vấn', 'Đề nghị', 'Nhận việc', 'Không đạt')),
  ten text not null,
  tieu_de text not null check (char_length(tieu_de) between 2 and 200),
  noi_dung text not null check (char_length(noi_dung) between 2 and 5000),
  tu_gui boolean not null default false,
  hoat_dong boolean not null default true,
  sua_luc timestamptz not null default now()
);
insert into public.tuyen_dung_mau_thu (ma, buoc, ten, tieu_de, noi_dung) values
  ('nhan_cv', 'Mới nộp', 'Đã nhận hồ sơ', 'AMIA đã nhận hồ sơ ứng tuyển vị trí {{vi_tri}}',
   E'Chào anh/chị {{ten}},\n\nAMIA đã nhận được hồ sơ ứng tuyển vị trí {{vi_tri}} của anh/chị. Bộ phận nhân sự sẽ xem hồ sơ và liên hệ lại với anh/chị trong thời gian sớm nhất.\n\nCảm ơn anh/chị đã quan tâm đến AMIA.\n\nTrân trọng,\nBộ phận nhân sự AMIA'),
  ('moi_phong_van', 'Hẹn phỏng vấn', 'Mời phỏng vấn', 'AMIA mời anh/chị phỏng vấn vị trí {{vi_tri}}',
   E'Chào anh/chị {{ten}},\n\nSau khi xem hồ sơ, AMIA mời anh/chị tham gia buổi phỏng vấn vị trí {{vi_tri}} vào ngày {{ngay_phong_van}}.\n\nAnh/chị vui lòng trả lời thư này để xác nhận có tham gia được hay không. Nếu cần đổi lịch, anh/chị cho AMIA biết sớm để sắp xếp.\n\nTrân trọng,\nBộ phận nhân sự AMIA'),
  ('de_nghi', 'Đề nghị', 'Thư đề nghị nhận việc', 'AMIA gửi anh/chị thư đề nghị nhận việc vị trí {{vi_tri}}',
   E'Chào anh/chị {{ten}},\n\nCảm ơn anh/chị đã dành thời gian phỏng vấn. AMIA rất vui được đề nghị anh/chị nhận việc ở vị trí {{vi_tri}}. Bộ phận nhân sự sẽ trao đổi chi tiết về mức lương, thời gian thử việc và ngày bắt đầu.\n\nAnh/chị vui lòng phản hồi thư này để AMIA tiếp tục các bước tiếp theo.\n\nTrân trọng,\nBộ phận nhân sự AMIA'),
  ('chao_mung', 'Nhận việc', 'Chào mừng nhận việc', 'Chào mừng anh/chị đến với AMIA',
   E'Chào anh/chị {{ten}},\n\nAMIA rất vui được đón anh/chị vào vị trí {{vi_tri}}, bắt đầu từ ngày {{ngay_nhan_viec}}. Bộ phận nhân sự sẽ gửi anh/chị danh sách giấy tờ cần chuẩn bị và lịch làm việc ngày đầu.\n\nHẹn gặp anh/chị.\n\nTrân trọng,\nBộ phận nhân sự AMIA'),
  ('cam_on', 'Không đạt', 'Cảm ơn ứng viên', 'Cảm ơn anh/chị đã ứng tuyển tại AMIA',
   E'Chào anh/chị {{ten}},\n\nCảm ơn anh/chị đã quan tâm và dành thời gian ứng tuyển vị trí {{vi_tri}} tại AMIA. Sau khi cân nhắc, lần này AMIA chưa phù hợp để cùng anh/chị tiếp tục. AMIA xin lưu hồ sơ và sẽ liên hệ khi có vị trí phù hợp hơn.\n\nChúc anh/chị nhiều thành công.\n\nTrân trọng,\nBộ phận nhân sự AMIA');

create table public.tuyen_dung_hang_doi_thu (
  id uuid primary key default gen_random_uuid(),
  ung_vien_id uuid references public.ung_vien (id) on delete set null,
  mau_ma text not null references public.tuyen_dung_mau_thu (ma),
  den_email text not null check (char_length(den_email) between 5 and 200),
  tieu_de text not null,
  noi_dung text not null,
  trang_thai text not null default 'cho_gui' check (trang_thai in ('cho_gui', 'da_gui', 'loi', 'huy')),
  loi text,
  nguoi_tao_id uuid references public.nhan_vien (id) on delete set null,
  tao_luc timestamptz not null default now(),
  gui_luc timestamptz
);
create index tuyen_dung_hang_doi_thu_tt_idx on public.tuyen_dung_hang_doi_thu (trang_thai, tao_luc desc);

-- Kết nối Gmail: một dòng duy nhất. Mật khẩu ứng dụng lưu dạng đã mã hoá (AES-256-GCM, khoá suy ra từ khoá máy chủ), không bao giờ trả về trình duyệt.
create table public.thu_ket_noi (
  id boolean primary key default true check (id),
  email text not null check (char_length(email) between 5 and 200),
  mat_khau_ma_hoa text not null,
  nguoi_id uuid references public.nhan_vien (id) on delete set null,
  sua_luc timestamptz not null default now()
);

select public.khoa_tat_ca_bang();
