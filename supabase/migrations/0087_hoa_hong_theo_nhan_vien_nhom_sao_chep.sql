-- 0087 — CÀI ĐẶT HOA HỒNG THEO NHÂN VIÊN / NHÓM (CHỨC DANH) + SAO CHÉP CÀI ĐẶT.
-- Mở rộng tối thiểu bảng hoa_hong_ti_le: thêm khoá "áp dụng cho" (nhan_vien_id hoặc nhom_chuc_danh; để trống = chung mọi người) và so_tien (hoa hồng cố định mỗi đơn vị hàng).
-- Thứ tự ưu tiên khi tính (người đầu thắng): nhân viên + mục cụ thể > nhân viên + cả loại > nhóm + mục cụ thể > nhóm + cả loại > chung + mục cụ thể > chung + cả loại > 0.
-- KHÔNG đổi cách tính hoá đơn đã có: khi chưa có dòng riêng theo nhân viên/nhóm và so_tien trống thì kết quả bc_nhan_vien giống hệt cũ (có test đối chiếu).
-- Hoa hồng một dòng hàng cho một người = (doanh số dòng × tỉ lệ% + so_tien × số lượng) × tỉ lệ chia người.
-- Nhóm = chức danh viết thường, bỏ khoảng trắng thừa (nhan_vien.chuc_danh là chữ tự do, nhiều cách viết nên chuẩn hoá khi so khớp).

alter table public.hoa_hong_ti_le
  add column nhan_vien_id uuid references public.nhan_vien (id) on delete cascade,
  add column nhom_chuc_danh text,
  add column so_tien bigint check (so_tien is null or so_tien >= 0),
  add constraint hoa_hong_chi_mot_doi_tuong check (nhan_vien_id is null or nhom_chuc_danh is null);
alter table public.hoa_hong_ti_le drop constraint hoa_hong_ti_le_loai_muc_id_vai_key;
alter table public.hoa_hong_ti_le add constraint hoa_hong_ti_le_khoa_key unique nulls not distinct (loai, muc_id, vai, nhan_vien_id, nhom_chuc_danh);
create index hoa_hong_ti_le_nv_idx on public.hoa_hong_ti_le (nhan_vien_id) where nhan_vien_id is not null;

-- Dòng cài đặt thắng cho (loại, vai, mục, nhân viên). Trả tối đa 1 dòng.
create or replace function public.hh_cai(p_loai text, p_vai text, p_muc uuid, p_nv uuid default null) returns table (ti_le numeric, so_tien bigint)
language sql stable as $$
  select r.ti_le, r.so_tien from public.hoa_hong_ti_le r
   where r.loai = p_loai and r.vai = p_vai and (r.muc_id = p_muc or r.muc_id is null)
     and ((p_nv is not null and r.nhan_vien_id = p_nv)
          or (p_nv is not null and r.nhom_chuc_danh is not null and r.nhom_chuc_danh = (select lower(btrim(n.chuc_danh)) from public.nhan_vien n where n.id = p_nv))
          or (r.nhan_vien_id is null and r.nhom_chuc_danh is null))
   order by case when r.nhan_vien_id is not null then 0 when r.nhom_chuc_danh is not null then 1 else 2 end, (r.muc_id is null)
   limit 1
$$;

-- Hoa hồng của CẢ dòng hàng (trước khi chia theo tỉ lệ chia người): doanh số × % + số tiền cố định × số lượng.
create or replace function public.hh_tinh(p_doanh_so numeric, p_so_luong numeric, p_loai text, p_vai text, p_muc uuid, p_nv uuid default null) returns numeric
language sql stable as $$
  select coalesce((select p_doanh_so * c.ti_le / 100 + coalesce(c.so_tien, 0) * p_so_luong from public.hh_cai(p_loai, p_vai, p_muc, p_nv) c), 0)
$$;

-- Giữ hàm tỉ lệ % (0085) cho tương thích: giờ cũng theo thứ tự ưu tiên mới.
create or replace function public.hh_ti_le(p_loai text, p_vai text, p_muc uuid, p_nv uuid default null) returns numeric
language sql stable as $$
  select coalesce((select c.ti_le from public.hh_cai(p_loai, p_vai, p_muc, p_nv) c), 0)
$$;

create or replace function public.bc_nhan_vien(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, so_dong int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select c.nhan_vien_id, c.vai, count(*)::int, round(sum(v.doanh_so * c.ti_le / 100))::bigint,
         round(sum(c.ti_le / 100 * public.hh_tinh(v.doanh_so, v.so_luong, v.loai, c.vai, v.muc_id, c.nhan_vien_id)))::bigint
    from public.dong_nhan_vien c join public.v_doanh_so_dong v on v.dong_id = c.dong_id
   where v.ngay_hd between p_tu and p_den and (p_cn is null or v.chi_nhanh_id = p_cn)
   group by c.nhan_vien_id, c.vai
$$;

create or replace function public.bc_hoa_hong_thuc_thu(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, chi_nhanh_id uuid, nguon text, so_hd int, doanh_so_tien bigint, hoa_hong_tien bigint, doanh_so_the bigint, hoa_hong_the bigint)
language sql stable as $$
  with tt as (
    select t.hoa_don_id,
           sum(case when t.phuong_thuc <> 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as tien,
           sum(case when t.phuong_thuc = 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as the
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by t.hoa_don_id)
  select c.nhan_vien_id, c.vai, h.chi_nhanh_id, case when h.ngay_hd < p_tu then 'cu' else 'moi' end, count(distinct h.id)::int,
         round(sum(v.doanh_so * c.ti_le / 100 * tt.tien / h.tong_phai_thu))::bigint,
         round(sum(c.ti_le / 100 * tt.tien / h.tong_phai_thu * public.hh_tinh(v.doanh_so, v.so_luong, v.loai, c.vai, v.muc_id, c.nhan_vien_id)))::bigint,
         round(sum(v.doanh_so * c.ti_le / 100 * tt.the / h.tong_phai_thu))::bigint,
         round(sum(c.ti_le / 100 * tt.the / h.tong_phai_thu * public.hh_tinh(v.doanh_so, v.so_luong, v.loai, c.vai, v.muc_id, c.nhan_vien_id)))::bigint
    from tt join public.hoa_don h on h.id = tt.hoa_don_id
    join public.v_doanh_so_dong v on v.hoa_don_id = h.id
    join public.dong_nhan_vien c on c.dong_id = v.dong_id
   group by c.nhan_vien_id, c.vai, h.chi_nhanh_id, 4
$$;

create or replace function public.bc_hoa_hong_doi_chieu(p_tu date, p_den date, p_cn uuid default null)
returns table (theo_hoa_don bigint, thuc_thu_don_moi bigint, tru_the_don_moi bigint, con_no_cuoi_ky bigint, thu_no_cu bigint, tru_the_no_cu bigint, khac bigint)
language sql stable as $$
  with a as (select coalesce(sum(x.hoa_hong), 0)::bigint as v from public.bc_nhan_vien(p_tu, p_den, p_cn) x),
  b as (select coalesce(sum(x.hoa_hong_tien) filter (where x.nguon = 'moi'), 0)::bigint as moi_tien, coalesce(sum(x.hoa_hong_the) filter (where x.nguon = 'moi'), 0)::bigint as moi_the,
               coalesce(sum(x.hoa_hong_tien) filter (where x.nguon = 'cu'), 0)::bigint as cu_tien, coalesce(sum(x.hoa_hong_the) filter (where x.nguon = 'cu'), 0)::bigint as cu_the
          from public.bc_hoa_hong_thuc_thu(p_tu, p_den, p_cn) x),
  n as (
    select coalesce(round(sum(c.ti_le / 100 * public.hh_tinh(v.doanh_so, v.so_luong, v.loai, c.vai, v.muc_id, c.nhan_vien_id)
                              * greatest(h.tong_phai_thu - coalesce(p.da, 0), 0)::numeric / h.tong_phai_thu)), 0)::bigint as v
      from public.hoa_don h
      join public.v_doanh_so_dong v on v.hoa_don_id = h.id
      join public.dong_nhan_vien c on c.dong_id = v.dong_id
      left join lateral (select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) as da from public.thanh_toan t where t.hoa_don_id = h.id and t.ngay <= p_den) p on true
     where h.ngay_hd between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn))
  select a.v, b.moi_tien, b.moi_the, n.v, b.cu_tien, b.cu_the, a.v - b.moi_tien - b.moi_the - n.v from a, b, n
$$;

create or replace function public.bc_hoa_hong_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon text, nguoi_khoa text, nguoi_ten text, nguoi_ma text, nguoi_dt text, so_hd int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select 'khach', k.id::text, k.ho_ten, k.ma, k.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint,
         round(sum(public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)))::bigint
    from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.khach_hang k on k.id = h.nguoi_gioi_thieu_id
   where h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by k.id, k.ho_ten, k.ma, k.dien_thoai
  union all
  select 'salonhero', coalesce(n.id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')), coalesce(n.ho_ten, g.ten_nguoi, 'SalonHero #' || coalesce(g.sh_nhan_vien_id::text, '?') || ' (chưa ghép)'),
         n.ma_nv, null, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint, round(sum(g.gia_tri))::bigint
    from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = g.nhan_vien_id
   where g.vai = 'gioi_thieu' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 2, 3, n.ma_nv
$$;

-- ───────── Sao chép cài đặt từ A sang B ─────────
-- Đối tượng: kieu 'nhan_vien' (khoa = id nhân viên), 'nhom' (khoa = chức danh đã chuẩn hoá) hoặc 'chung' (khoa trống).
-- Xem trước: mỗi dòng của A so với dòng cùng (loại, vai, mục) của B → 'them' (B chưa có) | 'ghi_de' (B có, khác số) | 'giu_nguyen' (B đã đúng số đó).
create or replace function public.hh_xem_truoc_sao_chep(p_nguon_kieu text, p_nguon_khoa text, p_dich_kieu text, p_dich_khoa text)
returns table (loai text, vai text, muc_id uuid, ti_le numeric, so_tien bigint, ti_le_cu numeric, so_tien_cu bigint, hanh_dong text)
language plpgsql stable as $$
declare v_nn uuid; v_gn text; v_nd uuid; v_gd text;
begin
  if p_nguon_kieu not in ('nhan_vien', 'nhom', 'chung') or p_dich_kieu not in ('nhan_vien', 'nhom', 'chung') then raise exception 'Kiểu đối tượng không hợp lệ' using errcode = 'P0001'; end if;
  if p_nguon_kieu = 'nhan_vien' then v_nn := p_nguon_khoa::uuid; elsif p_nguon_kieu = 'nhom' then v_gn := lower(btrim(p_nguon_khoa)); end if;
  if p_dich_kieu = 'nhan_vien' then v_nd := p_dich_khoa::uuid; elsif p_dich_kieu = 'nhom' then v_gd := lower(btrim(p_dich_khoa)); end if;
  if p_nguon_kieu = p_dich_kieu and v_nn is not distinct from v_nd and v_gn is not distinct from v_gd then raise exception 'Nguồn và đích là một' using errcode = 'P0001'; end if;
  return query
    select a.loai, a.vai, a.muc_id, a.ti_le, a.so_tien, b.ti_le, b.so_tien,
           case when b.id is null then 'them' when b.ti_le = a.ti_le and coalesce(b.so_tien, 0) = coalesce(a.so_tien, 0) then 'giu_nguyen' else 'ghi_de' end
      from public.hoa_hong_ti_le a
      left join public.hoa_hong_ti_le b on b.loai = a.loai and b.vai = a.vai and b.muc_id is not distinct from a.muc_id and b.nhan_vien_id is not distinct from v_nd and b.nhom_chuc_danh is not distinct from v_gd
     where a.nhan_vien_id is not distinct from v_nn and a.nhom_chuc_danh is not distinct from v_gn
     order by a.loai, a.vai, a.muc_id nulls first;
end $$;

-- Áp dụng trong MỘT giao dịch. p_ghi_de = false: chỉ thêm mục B chưa có, không đụng mục B đã có. Trả số dòng từng loại.
create or replace function public.hh_sao_chep(p_nguon_kieu text, p_nguon_khoa text, p_dich_kieu text, p_dich_khoa text, p_ghi_de boolean default true)
returns table (them int, ghi_de int, giu_nguyen int)
language plpgsql as $$
declare v_nd uuid; v_gd text; x record; n_them int := 0; n_de int := 0; n_giu int := 0;
begin
  if p_dich_kieu = 'nhan_vien' then v_nd := p_dich_khoa::uuid; elsif p_dich_kieu = 'nhom' then v_gd := lower(btrim(p_dich_khoa)); end if;
  for x in select * from public.hh_xem_truoc_sao_chep(p_nguon_kieu, p_nguon_khoa, p_dich_kieu, p_dich_khoa) loop
    if x.hanh_dong = 'giu_nguyen' then n_giu := n_giu + 1;
    elsif x.hanh_dong = 'them' then
      insert into public.hoa_hong_ti_le (loai, vai, muc_id, ti_le, so_tien, nhan_vien_id, nhom_chuc_danh) values (x.loai, x.vai, x.muc_id, x.ti_le, x.so_tien, v_nd, v_gd);
      n_them := n_them + 1;
    elsif p_ghi_de then
      update public.hoa_hong_ti_le set ti_le = x.ti_le, so_tien = x.so_tien
       where loai = x.loai and vai = x.vai and muc_id is not distinct from x.muc_id and nhan_vien_id is not distinct from v_nd and nhom_chuc_danh is not distinct from v_gd;
      n_de := n_de + 1;
    end if;
  end loop;
  return query select n_them, n_de, n_giu;
end $$;

select public.khoa_tat_ca_bang();
