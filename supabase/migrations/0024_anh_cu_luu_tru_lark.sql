-- 0024 — Ảnh cũ SalonHero (≈255 nghìn ảnh) nằm ở kho lưu trữ Lark; ứng dụng chỉ giữ TẠM ảnh của khách đang được mở xem.
-- Luồng: nhân viên bấm "Lấy ảnh cũ về xem" → bảng yeu_cau_lay_anh → tiến trình trên máy chủ nhà (scripts/lay-anh-cu.mjs) chép ảnh của khách đó
-- vào kho ảnh + bảng khach_anh với het_han = +3 ngày; quá hạn thì tự dọn (ảnh vẫn còn ở Lark). Ảnh có het_han null là ảnh vĩnh viễn.
alter table public.khach_anh add column het_han timestamptz;
create index khach_anh_het_han_idx on public.khach_anh (het_han) where het_han is not null;

-- Mỗi khách có bao nhiêu ảnh cũ ở kho lưu trữ (để hiện nút lấy ảnh; không chứa dữ liệu cá nhân).
create table public.khach_anh_luu_tru (
  khach_id uuid primary key references public.khach_hang (id) on delete cascade,
  so_anh int not null check (so_anh >= 0),
  cap_nhat_luc timestamptz not null default now()
);

create table public.yeu_cau_lay_anh (
  id uuid primary key default gen_random_uuid(),
  khach_id uuid not null references public.khach_hang (id) on delete cascade,
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'dang_lay', 'xong', 'loi')),
  so_anh_lay int,
  loi text,
  tao_boi uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  xong_luc timestamptz
);
-- Mỗi khách chỉ có một yêu cầu đang chạy tại một thời điểm (bấm nhiều lần không sinh thêm việc).
create unique index yeu_cau_lay_anh_dang_chay on public.yeu_cau_lay_anh (khach_id) where trang_thai in ('cho', 'dang_lay');
create index yeu_cau_lay_anh_cho on public.yeu_cau_lay_anh (tao_luc) where trang_thai in ('cho', 'dang_lay');

select public.khoa_tat_ca_bang();
