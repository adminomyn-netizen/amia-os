-- Kho (đợt 3, 03/11/2026) — làm y SalonHero:
--   • Kho nội bộ: nút "Nhập từ kho hàng bán" (SalonHero #/internal_stock) và "Xuất sang kho nội bộ" ở Phiếu xuất.
--     AMIA giữ sổ kho chính kho_so_cai theo (chi nhánh, sản phẩm). Đưa sản phẩm bán lẻ sang dùng nội bộ =
--       1 dòng kho_so_cai loại 'xuat_noi_bo' (âm, kho hàng bán giảm) + 1 dòng sổ kho nội bộ kho_noi_bo_so_cai (dương),
--     trong MỘT hàm, khoá theo (chi nhánh, sản phẩm) như gui_chuyen_kho. Sổ kho nội bộ chỉ thêm dòng (trigger chi_them_dong).
--     Tiêu dùng phần đã đưa sang = dòng âm 'tieu_dung' (không sửa/xoá).
--   • bc_phieu_kho: danh sách PHIẾU nhập / PHIẾU xuất (gom dòng sổ kho theo mã phiếu) có lọc chi nhánh, khoảng ngày,
--     tình trạng, người tạo, phân loại, tìm mã/tên — dùng cho màn Phiếu nhập, Phiếu xuất và Xuất Excel.
-- Không đụng bảng đồng bộ đêm (dong-bo-dem.mjs không ghi kho_so_cai).

alter table public.kho_so_cai drop constraint kho_so_cai_loai_check;
alter table public.kho_so_cai add constraint kho_so_cai_loai_check check (loai = any (array['nhap', 'xuat_ban', 'cap_ca', 'tra_ca', 'kiem_ke', 'dieu_chinh', 'chuyen_di', 'chuyen_den', 'hao_hut', 'xuat_khan', 'tra_ncc', 'xuat_noi_bo'])) not valid;
alter table public.kho_so_cai validate constraint kho_so_cai_loai_check;

create table public.kho_noi_bo_so_cai (
  id bigint generated always as identity primary key,
  ma text not null,
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  san_pham_id uuid not null references public.san_pham (id),
  loai text not null check (loai in ('nhap_tu_hang_ban', 'tieu_dung')),
  so_luong numeric not null check (so_luong <> 0),
  don_gia numeric,
  ghi_chu text,
  nguoi_id uuid not null references public.nhan_vien (id),
  tao_luc timestamptz not null default now()
);
create index kho_noi_bo_so_cai_cn_sp_idx on public.kho_noi_bo_so_cai (chi_nhanh_id, san_pham_id);
create index kho_noi_bo_so_cai_tao_luc_idx on public.kho_noi_bo_so_cai (tao_luc desc);
create index kho_noi_bo_so_cai_nguoi_idx on public.kho_noi_bo_so_cai (nguoi_id);
create index kho_noi_bo_so_cai_sp_idx on public.kho_noi_bo_so_cai (san_pham_id);
create trigger kho_noi_bo_so_cai_chi_them before update or delete on public.kho_noi_bo_so_cai for each row execute function public.chi_them_dong();

create view public.v_ton_kho_noi_bo with (security_invoker = true) as
  select s.chi_nhanh_id, s.san_pham_id, sum(s.so_luong)::numeric(14, 3) as ton, max(s.tao_luc) as cap_nhat_luc
    from public.kho_noi_bo_so_cai s group by s.chi_nhanh_id, s.san_pham_id;

create function public.kho_nhap_noi_bo(p_cn uuid, p_sp uuid, p_sl numeric, p_ghi_chu text, p_nguoi uuid) returns text
language plpgsql set search_path = public, pg_temp as $$
declare v_sp public.san_pham; v_ton numeric; v_ma text;
begin
  if p_sl is null or p_sl <= 0 then raise exception 'Số lượng nhập phải lớn hơn 0.' using errcode = 'P0001'; end if;
  select * into v_sp from public.san_pham where id = p_sp;
  if not found then raise exception 'Không tìm thấy sản phẩm.' using errcode = 'P0001'; end if;
  if not v_sp.ban_le then raise exception '"%" không phải hàng bán lẻ, không nằm trong kho hàng bán.', v_sp.ten using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext(p_cn::text || p_sp::text));
  v_ton := public.ton_kho(p_cn, p_sp);
  if v_ton < p_sl then
    raise exception 'Kho hàng bán chỉ còn % %, không nhập sang kho nội bộ được %.', trim(to_char(v_ton, 'FM999999990.###')), v_sp.don_vi, trim(to_char(p_sl, 'FM999999990.###')) using errcode = 'P0001';
  end if;
  v_ma := 'NB' || lpad(public.so_tiep_theo('nhap_noi_bo')::text, 6, '0');
  insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, ghi_chu, nguoi_id)
    values (p_cn, p_sp, 'xuat_noi_bo', -p_sl, v_sp.gia_nhap_don_vi, 'Xuất sang kho nội bộ ' || v_ma || coalesce(': ' || nullif(btrim(p_ghi_chu), ''), ''), p_nguoi);
  insert into public.kho_noi_bo_so_cai (ma, chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, ghi_chu, nguoi_id)
    values (v_ma, p_cn, p_sp, 'nhap_tu_hang_ban', p_sl, v_sp.gia_nhap_don_vi, nullif(btrim(p_ghi_chu), ''), p_nguoi);
  return v_ma;
end $$;

create function public.kho_tieu_dung_noi_bo(p_cn uuid, p_sp uuid, p_sl numeric, p_ghi_chu text, p_nguoi uuid) returns text
language plpgsql set search_path = public, pg_temp as $$
declare v_ton numeric; v_ma text; v_dv text;
begin
  if p_sl is null or p_sl <= 0 then raise exception 'Số lượng xuất phải lớn hơn 0.' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_ghi_chu), '') = '' then raise exception 'Ghi nội dung xuất tiêu dùng (dùng cho việc gì).' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('noi_bo' || p_cn::text || p_sp::text));
  select coalesce(sum(so_luong), 0) into v_ton from public.kho_noi_bo_so_cai where chi_nhanh_id = p_cn and san_pham_id = p_sp;
  select don_vi into v_dv from public.san_pham where id = p_sp;
  if v_ton < p_sl then
    raise exception 'Kho nội bộ chỉ còn % %, không xuất được %.', trim(to_char(v_ton, 'FM999999990.###')), coalesce(v_dv, ''), trim(to_char(p_sl, 'FM999999990.###')) using errcode = 'P0001';
  end if;
  v_ma := 'TD' || lpad(public.so_tiep_theo('tieu_dung_noi_bo')::text, 6, '0');
  insert into public.kho_noi_bo_so_cai (ma, chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, ghi_chu, nguoi_id)
    values (v_ma, p_cn, p_sp, 'tieu_dung', -p_sl, (select gia_nhap_don_vi from public.san_pham where id = p_sp), btrim(p_ghi_chu), p_nguoi);
  return v_ma;
end $$;

-- Danh sách phiếu nhập / phiếu xuất (SalonHero #/inventory › Phiếu nhập / Phiếu xuất).
-- Một phiếu = các dòng sổ kho cùng mã: mã SalonHero PN…/PX… trong ghi chú (dữ liệu chuyển sang), mã AMIA XL…/XK…/NB… (xử lý vật tư,
-- xuất khẩn cấp, xuất sang kho nội bộ); dòng nhập tay không có mã thì mỗi dòng là một phiếu "NK<số dòng>". Dòng "Tồn đầu kỳ" không phải phiếu.
-- Phiếu xử lý vật tư chưa ghi sổ (chờ duyệt / bị từ chối / đã huỷ) cũng hiện ở Phiếu xuất với tình trạng tương ứng.
create function public.bc_phieu_kho(p_huong text, p_tu date, p_den date, p_cn uuid default null, p_tt text default null, p_nguoi uuid default null,
  p_pl text default null, p_tim text default null, p_so int default 20, p_tu_dong int default 0)
returns table (ma text, thoi_gian timestamptz, nguoi_id uuid, nguoi text, ncc text, phan_loai text, tinh_trang text, chi_nhanh_id uuid, chi_nhanh text,
  so_mat_hang bigint, mat_hang text, tong_sl numeric, tong_tien numeric, ghi_chu text, tong_dong bigint, tong_tien_tat_ca numeric)
language sql stable set search_path = public, pg_temp as $$
  with d as (
    select s.id, s.chi_nhanh_id, s.san_pham_id, s.loai, s.so_luong, s.tao_luc, s.nguoi_id, s.ghi_chu,
           coalesce(s.don_gia, p.gia_nhap_don_vi, 0) as gia, p.ten as ten_sp, p.ma as ma_sp,
           coalesce(substring(s.ghi_chu from '((?:PN|PX)\d+)'), substring(s.ghi_chu from '^(?:Xử lý vật tư|Xuất khẩn cấp|Xuất sang kho nội bộ) ((?:XL|XK|NB)\d+)'), 'NK' || s.id) as ma_phieu,
           case
             when s.ghi_chu ~ 'IM_BUY' then 'Nhập mua hàng'
             when s.ghi_chu ~ '· EX_[A-Z_]+ ' then btrim(substring(s.ghi_chu from '· EX_[A-Z_]+ (.*)$'))
             when s.loai = 'nhap' then 'Nhập mua hàng'
             when s.loai = 'tra_ncc' then 'Xuất trả hàng NCC'
             when s.loai = 'hao_hut' then 'Xuất huỷ'
             when s.loai = 'xuat_khan' then 'Xuất khẩn cấp'
             when s.loai = 'xuat_noi_bo' then 'Xuất sang kho nội bộ'
             when s.loai in ('cap_ca', 'tra_ca') then 'Xuất tiêu hao'
             when s.loai = 'dieu_chinh' then 'Xuất điều chỉnh'
             else 'Xuất khác' end as pl
      from public.kho_so_cai s join public.san_pham p on p.id = s.san_pham_id
     where (s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den
       and (p_cn is null or s.chi_nhanh_id = p_cn)
       and case when p_huong = 'nhap' then s.loai = 'nhap' and coalesce(s.ghi_chu, '') !~ '^Tồn đầu kỳ'
                else s.loai in ('tra_ncc', 'hao_hut', 'xuat_khan', 'xuat_noi_bo', 'cap_ca') or (s.loai = 'dieu_chinh' and s.so_luong < 0) end
       and not (p_huong = 'xuat' and s.loai = 'cap_ca' and coalesce(s.ghi_chu, '') !~ 'PX\d')  -- cấp theo phiếu cấp của AMIA xem ở Phiếu cấp
  ), g as (
    select d.ma_phieu as ma, min(d.tao_luc) as thoi_gian, (array_agg(d.nguoi_id order by d.id))[1] as nguoi_id, null::text as ncc, min(d.pl) as phan_loai,
           'Hoàn thành'::text as tinh_trang, d.chi_nhanh_id, count(distinct d.san_pham_id) as so_mat_hang,
           string_agg(distinct d.ten_sp, ', ') as mat_hang, sum(abs(d.so_luong)) as tong_sl, round(sum(abs(d.so_luong) * d.gia)) as tong_tien,
           min(d.ghi_chu) as ghi_chu, string_agg(d.ma_sp, ' ') as ma_sp
      from d group by d.ma_phieu, d.chi_nhanh_id
    union all
    select x.ma, x.tao_luc, x.nguoi_lap_id, null, case x.loai when 'tra_ncc' then 'Xuất trả hàng NCC' when 'huy' then 'Xuất huỷ' when 'hao_hut' then 'Xuất huỷ' else 'Xuất điều chỉnh' end,
           case x.trang_thai when 'cho_duyet' then 'Chờ duyệt' when 'tu_choi' then 'Bị từ chối' else 'Đã huỷ' end, x.chi_nhanh_id, 1, p.ten, x.so_luong,
           round(x.so_luong * coalesce(p.gia_nhap_don_vi, 0)), x.ly_do, p.ma
      from public.xu_ly_vat_tu x join public.san_pham p on p.id = x.san_pham_id
     where p_huong = 'xuat' and x.trang_thai <> 'da_duyet' and x.loai <> 'dieu_chinh_tang'
       and (x.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den and (p_cn is null or x.chi_nhanh_id = p_cn)
  ), f as (
    select g.*, coalesce(nc.ten, g.ncc) as ncc_ten, n.ho_ten, c.ten as cn_ten
      from g
      left join public.xu_ly_vat_tu xv on xv.ma = g.ma
      left join public.nha_cung_cap nc on nc.id = xv.ncc_id
      left join public.nhan_vien n on n.id = g.nguoi_id
      left join public.chi_nhanh c on c.id = g.chi_nhanh_id
     where (nullif(p_tt, '') is null or g.tinh_trang = p_tt)
       and (p_nguoi is null or g.nguoi_id = p_nguoi)
       and (nullif(p_pl, '') is null or g.phan_loai = p_pl)
       and (nullif(btrim(p_tim), '') is null or g.ma ilike '%' || btrim(p_tim) || '%' or g.ma_sp ilike '%' || btrim(p_tim) || '%'
            or public.bo_dau(g.mat_hang) ilike '%' || public.bo_dau(btrim(p_tim)) || '%')
  )
  select f.ma, f.thoi_gian, f.nguoi_id, f.ho_ten, f.ncc_ten, f.phan_loai, f.tinh_trang, f.chi_nhanh_id, f.cn_ten, f.so_mat_hang, f.mat_hang, f.tong_sl, f.tong_tien, f.ghi_chu,
         count(*) over (), sum(f.tong_tien) over ()
    from f order by f.thoi_gian desc, f.ma desc
   limit least(coalesce(p_so, 20), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

revoke all on function public.kho_nhap_noi_bo(uuid, uuid, numeric, text, uuid), public.kho_tieu_dung_noi_bo(uuid, uuid, numeric, text, uuid),
  public.bc_phieu_kho(text, date, date, uuid, text, uuid, text, text, int, int) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
