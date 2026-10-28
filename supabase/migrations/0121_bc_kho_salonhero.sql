-- 0121 — SÁU BÁO CÁO KHO như SalonHero (K1, 29/10/2026). Chỉ thêm HÀM ĐỌC, không thêm bảng, không sửa dữ liệu.
--  bc_kho_nhap_xuat   "Nhập xuất kho hàng"   (mỗi sản phẩm bán lẻ một dòng: tồn đầu kỳ, nhập, xuất, chuyển kho, tồn cuối kỳ)
--  bc_kho_nhap        "Báo cáo nhập kho"     (chi tiết từng dòng nhập hoặc Tổng quan theo sản phẩm)
--  bc_kho_xuat        "Xuất kho bởi nhân viên"
--  bc_ban_san_pham    "Báo cáo bán sản phẩm" (chi tiết theo hoá đơn hoặc Tổng quan theo sản phẩm)
--  bc_ton_theo_lo     "Báo cáo tồn theo lô hàng"
--  bc_chi_phi_dich_vu + bc_chi_phi_dich_vu_ct  "Báo cáo chi phí dịch vụ" (vật tư dùng thật theo phiếu cấp đã làm)
-- Quy ước: dòng sổ kho có ghi chú "Tồn đầu kỳ…" (chuyển từ SalonHero) là SỐ DƯ ĐẦU, luôn nằm trong "tồn đầu kỳ", không tính là nhập.
-- Ngày tính theo giờ Việt Nam. Mỗi hàm có phân trang (p_so, p_tu_dong) và trả kèm tổng toàn bộ để vẽ ô tổng đầu trang.

create function public.bc_kho_nhap_xuat(p_tu date, p_den date, p_cn uuid default null, p_nhom text default null, p_tim text default null, p_so int default 10, p_tu_dong int default 0)
returns table (san_pham_id uuid, ma text, ten text, nhom text, gia_ban bigint, gia_von numeric, gia_nhap_tb numeric, dau numeric, nhap numeric, xuat numeric, nhap_cd numeric, xuat_cd numeric, cuoi numeric,
               tong_dong bigint, tong_dau numeric, tong_cuoi numeric, tong_nhap numeric, tong_xuat numeric)
language sql stable as $$
  with k as (
    select s.san_pham_id, s.loai, s.so_luong, s.don_gia,
           ((s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date) as ngay,
           coalesce(s.ghi_chu, '') like 'Tồn đầu kỳ%' as dau_ky
      from public.kho_so_cai s
     where (p_cn is null or s.chi_nhanh_id = p_cn)
       and (((s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date) <= p_den or coalesce(s.ghi_chu, '') like 'Tồn đầu kỳ%')
  ), g as (
    select p.id, p.ma, btrim(p.ten) as ten, p.nhom, p.gia_ban, p.gia_nhap_don_vi,
           coalesce(sum(k.so_luong) filter (where k.dau_ky or k.ngay < p_tu), 0) as dau,
           coalesce(sum(k.so_luong) filter (where not k.dau_ky and k.ngay >= p_tu and k.loai = 'nhap'), 0) as nhap,
           coalesce(-sum(k.so_luong) filter (where not k.dau_ky and k.ngay >= p_tu and k.loai not in ('nhap', 'chuyen_den', 'chuyen_di')), 0) as xuat,
           coalesce(sum(k.so_luong) filter (where not k.dau_ky and k.ngay >= p_tu and k.loai = 'chuyen_den'), 0) as nhap_cd,
           coalesce(-sum(k.so_luong) filter (where not k.dau_ky and k.ngay >= p_tu and k.loai = 'chuyen_di'), 0) as xuat_cd,
           (select sum(s2.so_luong * s2.don_gia) / nullif(sum(s2.so_luong), 0) from public.kho_so_cai s2
             where s2.san_pham_id = p.id and s2.loai = 'nhap' and coalesce(s2.don_gia, 0) > 0 and (p_cn is null or s2.chi_nhanh_id = p_cn)) as gia_nhap_tb
      from public.san_pham p left join k on k.san_pham_id = p.id
     where p.ban_le and (nullif(btrim(p_nhom), '') is null or p.nhom = btrim(p_nhom))
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(p.ten) ilike '%' || public.bo_dau(btrim(p_tim)) || '%')
     group by p.id
  ), t as (
    select g.*, g.dau + g.nhap + g.nhap_cd - g.xuat - g.xuat_cd as cuoi, count(*) over () as tong_dong,
           sum(g.dau) over () as tong_dau, sum(g.dau + g.nhap + g.nhap_cd - g.xuat - g.xuat_cd) over () as tong_cuoi, sum(g.nhap) over () as tong_nhap, sum(g.xuat) over () as tong_xuat
      from g)
  select t.id, t.ma, t.ten, t.nhom, t.gia_ban, t.gia_nhap_don_vi, round(t.gia_nhap_tb, 2), t.dau, t.nhap, t.xuat, t.nhap_cd, t.xuat_cd, t.cuoi, t.tong_dong, t.tong_dau, t.tong_cuoi, t.tong_nhap, t.tong_xuat
    from t order by t.ten, t.id limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_kho_nhap(p_tu date, p_den date, p_cn uuid default null, p_nguon text default null, p_ncc uuid default null, p_tim text default null, p_tong boolean default false, p_so int default 10, p_tu_dong int default 0)
returns table (khoa text, san_pham_id uuid, ma text, ten text, nhom text, lo text, han date, ma_phieu text, thoi_gian timestamptz, ncc text, gia_nhap numeric, so_luong numeric, giam_gia numeric, tong_tien numeric, tong_dong bigint, tong_chi_phi numeric)
language sql stable as $$
  with l as (
    select s.id as sid, s.san_pham_id, p.ma, btrim(p.ten) as ten, p.nhom, s.so_lo, s.han_dung, s.tao_luc,
           coalesce(dm.ma, substring(s.ghi_chu from 'Chuyển kho (CK\d+)'), 'NK' || lpad(s.id::text, 6, '0')) as ma_phieu, n.ten as ncc,
           coalesce(s.don_gia, 0) as gia_nhap, s.so_luong, round(s.so_luong * coalesce(s.don_gia, 0)) as tong_tien
      from public.kho_so_cai s join public.san_pham p on p.id = s.san_pham_id
      left join public.don_mua dm on dm.ma = substring(s.ghi_chu from '^Nhận hàng đơn (\S+)')
      left join public.nha_cung_cap n on n.id = dm.ncc_id
     where s.loai in ('nhap', 'chuyen_den') and coalesce(s.ghi_chu, '') not like 'Tồn đầu kỳ%'
       and ((s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date) between p_tu and p_den and (p_cn is null or s.chi_nhanh_id = p_cn)
       and (coalesce(p_nguon, '') = '' or (p_nguon = 'ncc' and s.loai = 'nhap') or (p_nguon = 'cn' and s.loai = 'chuyen_den'))
       and (p_ncc is null or dm.ncc_id = p_ncc)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(p.ten) ilike '%' || public.bo_dau(btrim(p_tim)) || '%')
  ), r as (
    select l.sid::text as khoa, l.san_pham_id, l.ma, l.ten, l.nhom, l.so_lo as lo, l.han_dung as han, l.ma_phieu, l.tao_luc as thoi_gian, l.ncc, l.gia_nhap, l.so_luong, 0::numeric as giam_gia, l.tong_tien
      from l where not p_tong
    union all
    select l.san_pham_id::text, l.san_pham_id, min(l.ma), l.ten, min(l.nhom), null, null, null, null, null, null, sum(l.so_luong), null, sum(l.tong_tien)
      from l where p_tong group by l.san_pham_id, l.ten
  ), t as (select r.*, count(*) over () as tong_dong, (select coalesce(sum(l.tong_tien), 0) from l) as tong_chi_phi from r)
  select t.khoa, t.san_pham_id, t.ma, t.ten, t.nhom, t.lo, t.han, t.ma_phieu, t.thoi_gian, t.ncc, t.gia_nhap, t.so_luong, t.giam_gia, t.tong_tien, t.tong_dong, t.tong_chi_phi
    from t order by t.thoi_gian desc nulls last, t.ten, t.khoa limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_kho_xuat(p_tu date, p_den date, p_cn uuid default null, p_loai text default null, p_tim text default null, p_tong boolean default false, p_so int default 10, p_tu_dong int default 0)
returns table (khoa text, san_pham_id uuid, ma text, ten text, nhom text, lo text, han date, ma_phieu text, thoi_gian timestamptz, nguoi_nhan text, phan_loai text, gia_von numeric, gia_tb numeric, so_luong numeric, tong_dong bigint)
language sql stable as $$
  with l as (
    select s.id as sid, s.san_pham_id, p.ma, btrim(p.ten) as ten, p.nhom, s.so_lo, s.han_dung, s.tao_luc,
           coalesce(pc.ma, 'PX' || lpad(s.id::text, 6, '0')) as ma_phieu, nv.ho_ten as nguoi_nhan,
           case s.loai when 'cap_ca' then 'tieu_hao' when 'tra_ca' then 'tieu_hao' when 'hao_hut' then 'huy' when 'tra_ncc' then 'tra_ncc' when 'kiem_ke' then 'can_bang' when 'dieu_chinh' then 'can_bang' else 'khac' end as loai_ma,
           coalesce(s.don_gia, p.gia_nhap_don_vi, 0) as gia_tb, -s.so_luong as so_luong
      from public.kho_so_cai s join public.san_pham p on p.id = s.san_pham_id
      left join public.phieu_cap pc on pc.id = s.phieu_cap_id left join public.nhan_vien nv on nv.id = pc.nhan_boi
     where s.loai in ('cap_ca', 'tra_ca', 'hao_hut', 'tra_ncc', 'xuat_khan', 'kiem_ke', 'dieu_chinh') and (s.loai in ('cap_ca', 'tra_ca', 'hao_hut', 'tra_ncc', 'xuat_khan') or s.so_luong < 0)
       and ((s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date) between p_tu and p_den and (p_cn is null or s.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(p.ten) ilike '%' || public.bo_dau(btrim(p_tim)) || '%')
  ), f as (select * from l where coalesce(p_loai, '') = '' or l.loai_ma = p_loai),
  r as (
    select f.sid::text as khoa, f.san_pham_id, f.ma, f.ten, f.nhom, f.so_lo as lo, f.han_dung as han, f.ma_phieu, f.tao_luc as thoi_gian, f.nguoi_nhan, f.loai_ma as phan_loai, round(f.gia_tb * f.so_luong) as gia_von, f.gia_tb, f.so_luong
      from f where not p_tong
    union all
    select f.san_pham_id::text, f.san_pham_id, min(f.ma), f.ten, min(f.nhom), null, null, null, null, null, null, null, null, sum(f.so_luong)
      from f where p_tong group by f.san_pham_id, f.ten
  ), t as (select r.*, count(*) over () as tong_dong from r)
  select t.khoa, t.san_pham_id, t.ma, t.ten, t.nhom, t.lo, t.han, t.ma_phieu, t.thoi_gian, t.nguoi_nhan, t.phan_loai, t.gia_von, t.gia_tb, t.so_luong, t.tong_dong
    from t order by t.thoi_gian desc nulls last, t.ten, t.khoa limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_ban_san_pham(p_tu date, p_den date, p_cn uuid default null, p_tim text default null, p_tong boolean default false, p_so int default 10, p_tu_dong int default 0)
returns table (khoa text, san_pham_id uuid, ma text, ten text, ma_hd text, hoa_don_id uuid, thoi_gian timestamptz, gia_1sp numeric, so_luong numeric, gia_sau numeric, doanh_thu numeric, gia_von numeric, loi_nhuan numeric,
               tong_dong bigint, tong_doanh_thu numeric, tong_nhap numeric)
language sql stable as $$
  with l as (
    select d.id as did, d.san_pham_id, p.ma, btrim(coalesce(p.ten, d.ten)) as ten, coalesce(h.sh_ma, h.ma) as ma_hd, h.id as hd, coalesce(h.chot_luc, h.tao_luc) as luc,
           d.don_gia::numeric as gia_1sp, d.so_luong::numeric as so_luong, round(v.doanh_so) as doanh_thu, coalesce(p.gia_nhap_don_vi, 0) as von_1sp
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id join public.v_doanh_so_dong v on v.dong_id = d.id
      left join public.san_pham p on p.id = d.san_pham_id
     where d.loai = 'san_pham' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(coalesce(p.ten, d.ten)) ilike '%' || public.bo_dau(btrim(p_tim)) || '%' or h.sh_ma ilike '%' || btrim(p_tim) || '%' or h.ma ilike '%' || btrim(p_tim) || '%')
  ), r as (
    select l.did::text as khoa, l.san_pham_id, l.ma, l.ten, l.ma_hd, l.hd as hoa_don_id, l.luc as thoi_gian, l.gia_1sp, l.so_luong, round(l.doanh_thu / nullif(l.so_luong, 0)) as gia_sau, l.doanh_thu, l.von_1sp as gia_von, l.doanh_thu - l.von_1sp * l.so_luong as loi_nhuan
      from l where not p_tong
    union all
    select coalesce(l.san_pham_id::text, l.ten), l.san_pham_id, min(l.ma), l.ten, null, null, null, null, sum(l.so_luong), null, sum(l.doanh_thu), null, sum(l.doanh_thu - l.von_1sp * l.so_luong)
      from l where p_tong group by l.san_pham_id, l.ten
  ), t as (select r.*, count(*) over () as tong_dong, (select coalesce(sum(l.doanh_thu), 0) from l) as tong_doanh_thu, (select coalesce(sum(l.von_1sp * l.so_luong), 0) from l) as tong_nhap from r)
  select t.khoa, t.san_pham_id, t.ma, t.ten, t.ma_hd, t.hoa_don_id, t.thoi_gian, t.gia_1sp, t.so_luong, t.gia_sau, t.doanh_thu, t.gia_von, t.loi_nhuan, t.tong_dong, t.tong_doanh_thu, t.tong_nhap
    from t order by t.thoi_gian desc nulls last, t.doanh_thu desc nulls last, t.ten, t.khoa limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_ton_theo_lo(p_cn uuid default null, p_tim text default null, p_tt text default null, p_han text default null, p_so int default 10, p_tu_dong int default 0)
returns table (khoa text, san_pham_id uuid, ma text, ten text, chi_nhanh text, lo text, han date, nhap numeric, xuat numeric, ton numeric, tong_dong bigint)
language sql stable as $$
  with l as (
    select (v.chi_nhanh_id::text || v.san_pham_id::text || v.so_lo || coalesce(v.han_dung::text, '')) as khoa, v.san_pham_id, p.ma, btrim(p.ten) as ten, c.ten as cn, nullif(v.so_lo, '') as lo, v.han_dung as han,
           v.nhap, v.nhap - v.con_lai as xuat, v.con_lai as ton, p.ton_toi_thieu
      from public.v_ton_lo v join public.san_pham p on p.id = v.san_pham_id join public.chi_nhanh c on c.id = v.chi_nhanh_id
     where (p_cn is null or v.chi_nhanh_id = p_cn)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(p.ten) ilike '%' || public.bo_dau(btrim(p_tim)) || '%' or v.so_lo ilike '%' || btrim(p_tim) || '%')
  ), f as (
    select l.* from l
     where (coalesce(p_tt, '') = '' or (position('con_ton' in p_tt) > 0 and l.ton > 0) or (position('sap_het' in p_tt) > 0 and l.ton > 0 and l.ton <= l.ton_toi_thieu) or (position('het_hang' in p_tt) > 0 and l.ton <= 0))
       and (coalesce(p_han, '') = '' or (position('con_han' in p_han) > 0 and (l.han is null or l.han >= (now() at time zone 'Asia/Ho_Chi_Minh')::date)) or (position('het_han' in p_han) > 0 and l.han < (now() at time zone 'Asia/Ho_Chi_Minh')::date))
  ), t as (select f.*, count(*) over () as tong_dong from f)
  select t.khoa, t.san_pham_id, t.ma, t.ten, t.cn, t.lo, t.han, t.nhap, t.xuat, t.ton, t.tong_dong
    from t order by t.ten, t.han nulls last, t.lo limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_chi_phi_dich_vu(p_tu date, p_den date, p_cn uuid default null, p_dv uuid default null, p_nv uuid default null, p_tim text default null, p_so int default 10, p_tu_dong int default 0)
returns table (san_pham_id uuid, chi_nhanh_id uuid, ma text, ten text, chi_nhanh text, so_luong numeric, so_lan bigint, chi_phi numeric, tong_dong bigint, tong_chi_phi numeric)
language sql stable as $$
  with l as (
    select d.san_pham_id, pc.chi_nhanh_id, count(distinct pc.id) as so_lan, sum(d.so_cap - d.so_tra) as so_luong, sum((d.so_cap - d.so_tra) * coalesce(d.don_gia, p.gia_nhap_don_vi, 0)) as chi_phi
      from public.phieu_cap pc join public.phieu_cap_dong d on d.phieu_id = pc.id join public.san_pham p on p.id = d.san_pham_id
     where pc.trang_thai in ('da_lam', 'da_doi_chieu') and ((pc.lam_xong_luc at time zone 'Asia/Ho_Chi_Minh')::date) between p_tu and p_den
       and (p_cn is null or pc.chi_nhanh_id = p_cn) and (p_dv is null or pc.dich_vu_id = p_dv) and (p_nv is null or pc.ktv_id = p_nv or pc.bac_si_id = p_nv)
       and (nullif(btrim(p_tim), '') is null or p.ma ilike '%' || btrim(p_tim) || '%' or public.bo_dau(p.ten) ilike '%' || public.bo_dau(btrim(p_tim)) || '%')
     group by d.san_pham_id, pc.chi_nhanh_id
  ), t as (select l.*, count(*) over () as tong_dong, sum(l.chi_phi) over () as tong_chi_phi from l)
  select t.san_pham_id, t.chi_nhanh_id, p.ma, btrim(p.ten), c.ten, t.so_luong, t.so_lan, round(t.chi_phi), t.tong_dong, round(t.tong_chi_phi)
    from t join public.san_pham p on p.id = t.san_pham_id join public.chi_nhanh c on c.id = t.chi_nhanh_id
   order by p.ten, c.ten limit least(coalesce(p_so, 10), 20000) offset greatest(coalesce(p_tu_dong, 0), 0)
$$;

create function public.bc_chi_phi_dich_vu_ct(p_tu date, p_den date, p_cn uuid, p_sp uuid, p_dv uuid default null, p_nv uuid default null)
returns table (phieu_id uuid, ma text, ngay date, dich_vu text, nguoi_lam text, so_luong numeric, chi_phi numeric)
language sql stable as $$
  select pc.id, pc.ma, (pc.lam_xong_luc at time zone 'Asia/Ho_Chi_Minh')::date, dv.ten, coalesce(kt.ho_ten, bs.ho_ten), d.so_cap - d.so_tra, round((d.so_cap - d.so_tra) * coalesce(d.don_gia, p.gia_nhap_don_vi, 0))
    from public.phieu_cap pc join public.phieu_cap_dong d on d.phieu_id = pc.id join public.san_pham p on p.id = d.san_pham_id join public.dich_vu dv on dv.id = pc.dich_vu_id
    left join public.nhan_vien kt on kt.id = pc.ktv_id left join public.nhan_vien bs on bs.id = pc.bac_si_id
   where d.san_pham_id = p_sp and pc.trang_thai in ('da_lam', 'da_doi_chieu') and ((pc.lam_xong_luc at time zone 'Asia/Ho_Chi_Minh')::date) between p_tu and p_den
     and (p_cn is null or pc.chi_nhanh_id = p_cn) and (p_dv is null or pc.dich_vu_id = p_dv) and (p_nv is null or pc.ktv_id = p_nv or pc.bac_si_id = p_nv)
   order by pc.lam_xong_luc desc limit 200
$$;

select public.khoa_tat_ca_bang();
