-- 0013 — CHUYỂN DỮ LIỆU TỪ SALONHERO (chạy song song để trải nghiệm, rồi mới thay hẳn).
-- Mỗi bản ghi chuyển sang giữ mã gốc `sh_id` (unique) để chạy lại không nhân đôi.
-- Quy tắc kế toán của đợt chuyển: KHÔNG phát lại lịch sử hoá đơn (sẽ trừ kho, sinh hoa hồng, phình doanh thu).
-- Chỉ chuyển SỐ DƯ ĐẦU KỲ: thẻ còn buổi / còn tiền (sổ thẻ), công nợ (hoá đơn `la_so_du_dau`, không tính doanh thu), tồn kho (sổ kho).

alter table public.khach_hang
  add column sh_id bigint unique,
  add column hang_goc text references public.hang_khach (ten),   -- hạng khách ở SalonHero lúc chuyển; hạng hiển thị = cao hơn giữa hạng này và hạng tính theo chi 12 tháng
  add column diem_goc int,                                         -- điểm tích luỹ ở SalonHero (chưa có tính năng điểm)
  add column tong_chi_goc bigint,                                  -- tổng đã chi trọn đời ở SalonHero
  add column so_lan_den_goc int,
  add column lan_den_cuoi date;                                    -- lần ghé cuối ở SalonHero (để trạng thái khách không bị coi là "mất" oan)
alter table public.nhan_vien add column sh_id bigint unique;
alter table public.dich_vu   add column sh_id bigint unique;
alter table public.san_pham  add column sh_id bigint unique;
alter table public.goi_the   add column sh_id bigint unique;
alter table public.the_khach add column sh_id bigint unique;
alter table public.hoa_don   add column sh_id bigint unique,
                             add column la_so_du_dau boolean not null default false;   -- công nợ chuyển từ SalonHero: không tính doanh thu, chỉ để thu nợ

-- Hoá đơn công nợ đầu kỳ không có dòng hàng: giữ nguyên số phải thu, chỉ tính lại số đã thu theo thanh toán.
create or replace function public.tinh_lai_hoa_don(p_id uuid) returns void language plpgsql as $$
declare h public.hoa_don; v_hang bigint; v_vat bigint; v_thu bigint; v_phai bigint;
begin
  select * into h from public.hoa_don where id = p_id;
  if not found then return; end if;
  if h.la_so_du_dau then
    v_hang := h.tong_hang; v_vat := h.vat_tien; v_phai := h.tong_phai_thu;
  else
    select coalesce(sum(thanh_tien), 0) into v_hang from public.hoa_don_dong where hoa_don_id = p_id;
    v_vat := round((greatest(v_hang - h.giam_gia_don, 0)) * h.vat_pct / 100.0)::bigint;
    v_phai := greatest(v_hang - h.giam_gia_don, 0) + v_vat + h.phu_phi + h.tip;
  end if;
  select coalesce(sum(case loai when 'thu' then so_tien else -so_tien end), 0) into v_thu from public.thanh_toan where hoa_don_id = p_id;
  update public.hoa_don set tong_hang = v_hang, vat_tien = v_vat, tong_phai_thu = v_phai, da_thu = v_thu, con_no = v_phai - v_thu where id = p_id;
end $$;

create function public.trg_khong_huy_no_dau() returns trigger language plpgsql as $$
begin
  if old.la_so_du_dau and new.trang_thai = 'huy' and old.trang_thai <> 'huy' then
    raise exception 'Hoá đơn công nợ chuyển từ SalonHero không huỷ được; sai số thì ghi nhận bằng thanh toán điều chỉnh' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger hoa_don_khong_huy_no_dau before update on public.hoa_don for each row execute function public.trg_khong_huy_no_dau();

-- Báo cáo doanh thu ngày: bỏ hoá đơn công nợ đầu kỳ khỏi "đơn / doanh thu / nợ mới" (tiền thu nợ vẫn vào "thu nợ cũ").
create or replace function public.bc_doanh_thu_ngay(p_tu date, p_den date, p_cn uuid default null)
returns table (ngay date, so_don int, doanh_thu bigint, thu_don_moi bigint, thu_no_cu bigint, thuc_thu bigint, tien_mat bigint, chuyen_khoan bigint, quet_the bigint, tru_the_tien bigint, no_moi bigint, so_buoi int, doanh_thu_buoi bigint)
language sql stable as $$
  with ngay as (select generate_series(p_tu, p_den, interval '1 day')::date as d),
  don as (
    select h.ngay_hd as d, count(*)::int as so_don, coalesce(sum(greatest(h.tong_hang - h.giam_gia_don, 0)), 0)::bigint as doanh_thu
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by h.ngay_hd),
  tt as (
    select t.ngay as d,
      sum(case when t.phuong_thuc <> 'the_tien' and h.ngay_hd = t.ngay then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as thu_moi,
      sum(case when t.phuong_thuc <> 'the_tien' and h.ngay_hd < t.ngay then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as thu_no_cu,
      sum(case when t.phuong_thuc = 'tien_mat' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as tm,
      sum(case when t.phuong_thuc = 'chuyen_khoan' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as ck,
      sum(case when t.phuong_thuc = 'quet_the' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as qt,
      sum(case when t.phuong_thuc = 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::bigint as tt
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by t.ngay),
  nomoi as (
    select h.ngay_hd as d, sum(greatest(h.tong_phai_thu - coalesce((select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) from public.thanh_toan t where t.hoa_don_id = h.id and t.ngay = h.ngay_hd), 0), 0))::bigint as no_moi
      from public.hoa_don h where h.trang_thai = 'hoan_thanh' and not h.la_so_du_dau and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by h.ngay_hd),
  buoi as (
    select b.ngay_lam as d, count(*)::int as so_buoi, coalesce(sum(b.doanh_thu_buoi), 0)::bigint as dt
      from public.buoi_thuc_hien b where b.trang_thai = 'da_lam' and b.ngay_lam between p_tu and p_den and (p_cn is null or b.chi_nhanh_id = p_cn) group by b.ngay_lam)
  select n.d, coalesce(don.so_don, 0), coalesce(don.doanh_thu, 0), coalesce(tt.thu_moi, 0), coalesce(tt.thu_no_cu, 0), coalesce(tt.thu_moi, 0) + coalesce(tt.thu_no_cu, 0),
         coalesce(tt.tm, 0), coalesce(tt.ck, 0), coalesce(tt.qt, 0), coalesce(tt.tt, 0), coalesce(nomoi.no_moi, 0), coalesce(buoi.so_buoi, 0), coalesce(buoi.dt, 0)
    from ngay n left join don on don.d = n.d left join tt on tt.d = n.d left join nomoi on nomoi.d = n.d left join buoi on buoi.d = n.d order by n.d
$$;

-- View khách: hạng = cao hơn giữa hạng gốc SalonHero và hạng tính theo chi 12 tháng; trạng thái tính cả lần ghé cuối ở SalonHero; công nợ đầu kỳ không tính là chi tiêu.
drop view public.v_khach_hang;
drop view public.v_the_khach;
create view public.v_the_khach with (security_invoker = true) as
select t.*,
  coalesce(s.so_buoi, 0)::int as so_buoi_con,
  coalesce(s.so_tien, 0)::bigint as so_du_tien,
  case
    when t.trang_thai = 'thu_hoi' then 'thu_hoi'
    when t.trang_thai = 'khoa' then 'khoa'
    when t.han_dung is not null and t.han_dung < public.hom_nay() then 'het_han'
    when t.loai = 'lan' and coalesce(s.so_buoi, 0) <= 0 then 'hoan_thanh'
    when t.loai = 'tien' and coalesce(s.so_tien, 0) <= 0 then 'hoan_thanh'
    when t.loai = 'lan' and coalesce(s.so_buoi, 0) <= (select coalesce(gia_tri::int, 2) from public.cau_hinh where khoa = 'the_sap_het_buoi') then 'sap_het'
    else 'hoat_dong'
  end as tinh_trang
from public.the_khach t
left join lateral (select sum(so_buoi) as so_buoi, sum(so_tien) as so_tien from public.the_so_cai where the_id = t.id) s on true;

create view public.v_khach_hang with (security_invoker = true) as
select k.*,
  coalesce(c.chi_12_thang, 0)::bigint as chi_12_thang,
  (select h.ten from public.hang_khach h
    where h.tu_so_tien <= greatest(coalesce(c.chi_12_thang, 0), coalesce((select g.tu_so_tien from public.hang_khach g where g.ten = k.hang_goc), 0))
    order by h.tu_so_tien desc limit 1) as hang,
  coalesce(th.dang_dung, 0)::int as so_the_dang_dung,
  case
    when k.danh_dau_mat then 'mat'
    when coalesce(th.dang_dung, 0) > 0 then 'dang_lieu_trinh'
    when greatest(k.tao_luc::date, coalesce(k.lan_den_cuoi, k.tao_luc::date), coalesce(hd.cuoi, k.tao_luc::date), coalesce(lh.cuoi, k.tao_luc::date))
         < public.hom_nay() - (select coalesce(gia_tri::int, 180) from public.cau_hinh where khoa = 'ngay_mat_khach') then 'mat'
    when coalesce(th.da_tung, 0) > 0 then 'het_lieu_trinh'
    when hd.cuoi is not null or lh.cuoi is not null or k.lan_den_cuoi is not null then 'da_den'
    else 'lead'
  end as trang_thai
from public.khach_hang k
left join lateral (
  select sum(greatest(d.tong_hang - d.giam_gia_don, 0)) filter (where d.ngay_hd >= public.hom_nay() - 365) as chi_12_thang, max(d.ngay_hd) as cuoi
    from public.hoa_don d where d.khach_id = k.id and d.trang_thai = 'hoan_thanh' and not d.la_so_du_dau) c on true
left join lateral (
  select max(d.ngay_hd) as cuoi from public.hoa_don d where d.khach_id = k.id and d.trang_thai = 'hoan_thanh' and not d.la_so_du_dau) hd on true
left join lateral (
  select max(l.bat_dau::date) as cuoi from public.lich_hen l where l.khach_id = k.id and l.trang_thai = 'hoan_thanh') lh on true
left join lateral (
  select count(*) filter (where v.loai = 'lan' and v.tinh_trang in ('hoat_dong','sap_het')) as dang_dung,
         count(*) filter (where v.loai = 'lan') as da_tung
    from public.v_the_khach v where v.khach_id = k.id) th on true;

select public.khoa_tat_ca_bang();
