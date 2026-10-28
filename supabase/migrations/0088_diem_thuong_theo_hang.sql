-- 0088 — QUY ĐỔI ĐIỂM THƯỞNG THEO HẠNG KHÁCH (Thường / Bạc / Vàng / Bạch kim / Kim cương): CHỈ CẤU HÌNH + HÀM TÍNH.
-- • tien_moi_diem: chi tiêu bao nhiêu đồng thì được 1 điểm (làm tròn xuống);
-- • tien_doi_moi_diem: 1 điểm đổi được bao nhiêu đồng giảm giá.
-- Mặc định theo số liệu SalonHero đã chuyển sang (mọi hạng: ~100.000đ = 1 điểm, vd 360.000đ → 3 điểm, 1.500.000đ → 15 điểm; 1 điểm = 10.000đ như cài đặt diem.doi_tien).
-- ĐANG CHỜ CHỊ LÂM CHỐT LUẬT theo từng hạng: app CHƯA tự tích điểm cho hoá đơn mới (điểm hiện do SalonHero nhập sang); thu ngân và công tắc đổi điểm (diem.doi_*) KHÔNG đọc bảng này.

create table public.hang_diem_cau_hinh (
  hang text primary key references public.hang_khach (ten) on update cascade,
  tien_moi_diem bigint not null check (tien_moi_diem between 1000 and 1000000000),
  tien_doi_moi_diem bigint not null check (tien_doi_moi_diem between 0 and 10000000),
  cap_nhat_luc timestamptz not null default now(),
  cap_nhat_boi uuid references public.nhan_vien (id)
);
insert into public.hang_diem_cau_hinh (hang, tien_moi_diem, tien_doi_moi_diem) select ten, 100000, 10000 from public.hang_khach;

-- Số điểm tích được khi chi p_so_tien đồng ở hạng p_hang. Hạng chưa có cấu hình hoặc số tiền ≤ 0 → 0.
create function public.diem_tich_duoc(p_hang text, p_so_tien bigint) returns int
language sql stable as $$
  select coalesce((select floor(p_so_tien::numeric / c.tien_moi_diem)::int from public.hang_diem_cau_hinh c where c.hang = p_hang and p_so_tien > 0), 0)
$$;

-- Số tiền giảm giá khi đổi p_diem điểm ở hạng p_hang. Hạng chưa có cấu hình hoặc điểm ≤ 0 → 0.
create function public.diem_ra_tien(p_hang text, p_diem int) returns bigint
language sql stable as $$
  select coalesce((select p_diem::bigint * c.tien_doi_moi_diem from public.hang_diem_cau_hinh c where c.hang = p_hang and p_diem > 0), 0)
$$;

-- Điểm DỰ KIẾN của một hoá đơn theo hạng hiện tại của khách (chỉ để xem, không ghi sổ điểm). Cơ sở tính: tổng đơn (tong_phai_thu) — tự giả định, chờ chốt.
create function public.diem_du_kien_hoa_don(p_hoa_don uuid) returns table (hang text, so_tien bigint, diem int)
language sql stable as $$
  select k.hang, h.tong_phai_thu, public.diem_tich_duoc(k.hang, h.tong_phai_thu)
    from public.hoa_don h join public.v_khach_hang k on k.id = h.khach_id where h.id = p_hoa_don
$$;

select public.khoa_tat_ca_bang();
