-- 0350 — BÁO CÁO QUỸ NGÀY (thay sheet MSC.26_BTCCU.KT.QUY của kế toán trên Lark): ngày × quỹ × 7 nhóm khoản thu/chi, tồn đầu và tồn cuối chạy xuyên tháng.
-- Mô hình quỹ của AMIA giữ nguyên (mỗi chi nhánh 1 quỹ tiền mặt + 1 quỹ ngân hàng; tài khoản ngân hàng nằm ở cột "ngân hàng" của từng dòng), nên KHÔNG đổi ràng buộc quỹ.
alter table public.loai_thu_chi add column nhom text check (nhom is null or nhom in
  ('Thu từ khách', 'Thu nội bộ', 'Thu từ đối tác - NCC', 'Thu tài chính', 'Chi cho khách', 'Chi đối tác - NCC', 'Chi nội bộ'));
update public.loai_thu_chi set nhom = case ten
  when 'Bán hàng' then 'Thu từ khách' when 'Thu khác' then 'Thu nội bộ'
  when 'Hoàn tiền khách' then 'Chi cho khách'
  when 'Marketing (quảng cáo, in ấn)' then 'Chi đối tác - NCC' when 'Vật tư, nguyên vật liệu, hàng hoá' then 'Chi đối tác - NCC'
  when 'Chi nhà cung cấp' then 'Chi đối tác - NCC' when 'Chi hoa hồng giới thiệu' then 'Chi đối tác - NCC'
  else case huong when 'thu' then 'Thu nội bộ' else 'Chi nội bộ' end end;

-- Số tiền theo (ngày, quỹ, nhóm, hướng). Phiếu đã đảo và dòng đảo bù trừ nhau nên bỏ ra, như so_quy_tong. Viết thẳng trên so_quy + thanh_toan (không qua view) cho nhanh.
create function public.bao_cao_quy_ngay(p_chi_nhanh uuid, p_tu date, p_den date)
returns table (ngay date, quy_id uuid, nhom text, huong text, tien bigint)
language sql stable set search_path = public, pg_temp as $$
  with q as (select id, loai from public.quy where chi_nhanh_id = p_chi_nhanh and hoat_dong)
  select s.ngay, s.quy_id, coalesce(lt.nhom, case when s.loai = 'thu' then 'Thu nội bộ' when s.loai = 'chi' then 'Chi nội bộ' else null end), s.loai, sum(s.so_tien)::bigint
    from public.so_quy s join q on q.id = s.quy_id left join public.loai_thu_chi lt on lt.id = s.loai_thu_chi_id
   where s.ngay between p_tu and p_den and s.nguon <> 'dao_phieu' and not exists (select 1 from public.so_quy g where g.phieu_goc_id = s.id)
   group by 1, 2, 3, 4
  union all
  select t.ngay, q.id, case t.loai when 'thu' then 'Thu từ khách' else 'Chi cho khách' end, case t.loai when 'thu' then 'thu' else 'chi' end, sum(t.so_tien)::bigint
    from public.thanh_toan t
    join public.hoa_don h on h.id = t.hoa_don_id and h.chi_nhanh_id = p_chi_nhanh
    join q on q.loai = case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end
   where t.ngay between p_tu and p_den and t.phuong_thuc <> all (array['the_tien', 'ship_cod'])
   group by 1, 2, 3, 4
$$;
revoke all on function public.bao_cao_quy_ngay(uuid, date, date) from public, anon, authenticated;

-- Nhật ký đổi số dư đầu kỳ của quỹ (đổi số dư đầu làm đổi mọi tồn quỹ sau đó nên phải có lý do và người đổi).
create table public.quy_so_du_nhat_ky (
  id uuid primary key default gen_random_uuid(),
  luc timestamptz not null default now(),
  quy_id uuid not null references public.quy (id),
  nguoi_id uuid not null references public.nhan_vien (id),
  truoc bigint not null,
  sau bigint not null,
  ly_do text not null
);

select public.khoa_tat_ca_bang();
