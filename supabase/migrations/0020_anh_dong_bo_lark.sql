-- Hàng đợi bền đồng bộ ảnh khách sang Base Lark "AMIA - Kho ảnh khách".
-- App ghi ảnh vào kho hiện tại (nhanh) và đánh dấu 'cho'; tiến trình nền trên máy chạy lark-cli đẩy sang Lark rồi đánh dấu 'xong'.
-- Máy tắt thì hàng đợi vẫn nằm đây, bật lại tự đuổi kịp. Ảnh cũ mặc định 'cho' nên được đẩy bù tự động.
alter table public.khach_anh
  add column lark_trang_thai text not null default 'cho' check (lark_trang_thai in ('cho','dang_gui','xong','loi')),
  add column lark_record_id text,
  add column lark_file_token text,
  add column lark_loi text,
  add column lark_so_lan int not null default 0,
  add column lark_xong_luc timestamptz;
create index khach_anh_lark_idx on public.khach_anh (lark_trang_thai, tao_luc) where lark_trang_thai <> 'xong';
select public.khoa_tat_ca_bang();
