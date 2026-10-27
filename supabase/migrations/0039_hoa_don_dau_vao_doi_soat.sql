-- 0039 — HOÁ ĐƠN ĐẦU VÀO + ĐỐI SOÁT BÁN SẢN PHẨM (theo FIN-PROC-01/06/07/08, COS-FIN-03 của MSC).
--  * Hoá đơn đầu vào: khoản trả trước / hàng đã nhận mà hoá đơn chưa về có hạn nhận ("Hoá đơn chưa về quá hạn"); khi về thì ghi số hoá đơn và đối chiếu với đơn mua.
--  * Đối soát bán sản phẩm: số bán trên hoá đơn so với số xuất kho, giá vốn và doanh thu sau huỷ/hoàn, theo sản phẩm.

create table public.hoa_don_dau_vao (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ncc_id uuid not null references public.nha_cung_cap (id),
  don_mua_id uuid references public.don_mua (id),
  trang_thai text not null default 'cho_hoa_don' check (trang_thai in ('cho_hoa_don', 'da_nhan', 'da_doi_chieu', 'sai_lech', 'huy')),
  so_hd text,
  ky_hieu text,
  ngay_hd date,
  tien_hang bigint not null check (tien_hang >= 0),
  thue_gtgt bigint not null default 0 check (thue_gtgt >= 0),
  tong_tien bigint generated always as (tien_hang + thue_gtgt) stored,
  han_nhan date,
  muc_dich text,
  link_file text check (link_file is null or link_file ~ '^https?://'),
  ghi_chu text,
  doi_chieu_boi uuid references public.nhan_vien (id),
  doi_chieu_luc timestamptz,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  check (trang_thai <> 'cho_hoa_don' or han_nhan is not null),
  check (trang_thai in ('cho_hoa_don', 'huy') or (so_hd is not null and ngay_hd is not null))
);
create unique index hoa_don_dau_vao_so_idx on public.hoa_don_dau_vao (ncc_id, so_hd, coalesce(ky_hieu, '')) where so_hd is not null and trang_thai <> 'huy';
create index hoa_don_dau_vao_tt_idx on public.hoa_don_dau_vao (trang_thai, tao_luc desc);

-- Đối soát theo sản phẩm: bán (hoá đơn hoàn thành) ↔ xuất kho theo hoá đơn. Giá vốn tính theo giá nhập gần nhất của sản phẩm (xấp xỉ).
create function public.bc_doi_soat_san_pham(p_tu date, p_den date, p_cn uuid default null)
returns table (san_pham_id uuid, ma text, ten text, don_vi text, sl_ban bigint, doanh_thu bigint, sl_huy bigint, sl_xuat_kho bigint, gia_von bigint, chenh_lech bigint)
language sql stable as $$
  with ban as (
    select v.muc_id as sp, sum(v.so_luong)::bigint as sl, round(sum(v.doanh_so))::bigint as dt
      from public.v_doanh_so_dong v where v.loai = 'san_pham' and v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn) group by v.muc_id
  ), huy as (
    select d.san_pham_id as sp, sum(d.so_luong)::bigint as sl
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
     where d.loai = 'san_pham' and h.trang_thai = 'huy' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by d.san_pham_id
  ), kho as (
    select k.san_pham_id as sp, (-sum(k.so_luong))::bigint as sl
      from public.kho_so_cai k join public.hoa_don h on h.id = k.hoa_don_id
     where k.loai = 'xuat_ban' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn) group by k.san_pham_id
  )
  select s.id, s.ma, s.ten, s.don_vi, coalesce(ban.sl, 0), coalesce(ban.dt, 0), coalesce(huy.sl, 0), coalesce(kho.sl, 0),
         round(coalesce(kho.sl, 0) * coalesce(s.gia_nhap_don_vi, 0))::bigint, coalesce(ban.sl, 0) - coalesce(kho.sl, 0)
    from public.san_pham s
    left join ban on ban.sp = s.id left join huy on huy.sp = s.id left join kho on kho.sp = s.id
   where ban.sp is not null or huy.sp is not null or kho.sp is not null
   order by 5 desc
$$;
revoke all on function public.bc_doi_soat_san_pham(date, date, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
