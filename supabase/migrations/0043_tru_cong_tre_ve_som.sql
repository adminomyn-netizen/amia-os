-- 0043 — TRỪ CÔNG ĐI TRỄ / VỀ SỚM VÀO CÔNG TÍNH LƯƠNG (theo Quy định thời gian làm việc MSC Điều 6.4 và công thức "Công thực tế" của Lark 2.3)
-- Công trừ = (phút trễ + phút về sớm) / 480 mỗi ngày; có phiếu "Đi trễ / về sớm" đã duyệt thì trừ theo giờ trong phiếu. Tiền phạt vẫn chỉ gợi ý.
-- Bản Lark có thêm "/60/8" lần nữa (nhiều khả năng là lỗi của họ), AMIA không sao chép.
drop function public.tong_hop_cong(int, int, uuid);
create function public.tong_hop_cong(p_nam int, p_thang int, p_cn uuid default null)
returns table (nhan_vien_id uuid, khung text, cong_chuan numeric, cong_di_lam numeric, phep_co_luong numeric, nghi_le numeric, cong_tac numeric, nghi_khong_luong numeric,
               so_lan_tre int, phut_tre int, so_lan_ve_som int, phut_ve_som int, ngay_vang int, ot_gio numeric, cong_tru_tre numeric, cong_tinh_luong numeric)
language sql stable as $$
  with k as (select make_date(p_nam, p_thang, 1) as dau, (make_date(p_nam, p_thang, 1) + interval '1 month - 1 day')::date as cuoi),
  nv as (
    select n.id, n.khung_lam_viec as khung from public.nhan_vien n
     where n.hoat_dong and n.trang_thai_lam in ('dang_lam', 'tam_nghi') and n.vai_tro <> 'nha_dau_tu' and (p_cn is null or n.chi_nhanh_id = p_cn)
  ),
  cc as (
    select c.nhan_vien_id, sum(c.cong) as cong, count(*) filter (where c.tre_phut > 0) as lt, coalesce(sum(c.tre_phut), 0) as pt,
           count(*) filter (where c.ve_som_phut > 0) as lv, coalesce(sum(c.ve_som_phut), 0) as pv
      from public.cham_cong c, k where c.ngay between k.dau and k.cuoi group by 1
  ),
  ph as (
    select p.nhan_vien_id,
      sum(x.ov) filter (where p.loai = 'nghi' and p.loai_nghi in ('phep_nam', 'nghi_che_do', 'nghi_bu')) as phep,
      sum(x.ov) filter (where p.loai = 'nghi' and p.loai_nghi = 'nghi_khong_luong') as kl,
      sum(x.ov) filter (where p.loai in ('cong_tac', 'lam_online')) as ct,
      sum(p.so_gio) filter (where p.loai = 'lam_them' and p.tu_ngay between k.dau and k.cuoi) as ot
      from public.phieu_hr p, k,
      lateral (select greatest(0, least(p.den_ngay, k.cuoi) - greatest(p.tu_ngay, k.dau) + 1) * p.so_ngay / (p.den_ngay - p.tu_ngay + 1) as ov) x
     where p.trang_thai = 'da_duyet' and p.tu_ngay <= k.cuoi and p.den_ngay >= k.dau group by 1
  ),
  le as (select count(*)::numeric as so from public.ngay_le l, k where l.ngay between k.dau and k.cuoi and extract(dow from l.ngay) <> 0),
  tr as (
    -- Trừ công đi trễ / về sớm: (phút trễ + phút về sớm) / 480 (1 công = 8 giờ). Có phiếu "Đi trễ / về sớm" đã duyệt cho ngày đó thì chỉ trừ theo số giờ trong phiếu (không quá số phút thật).
    select c.nhan_vien_id, sum(case when p.gio is not null then least(c.tre_phut + c.ve_som_phut, round(p.gio * 60)::int) else c.tre_phut + c.ve_som_phut end)::numeric / 480 as cong
      from public.cham_cong c
      join k on c.ngay between k.dau and k.cuoi
      left join lateral (select max(h.so_gio) as gio from public.phieu_hr h where h.nhan_vien_id = c.nhan_vien_id and h.loai = 'di_tre_ve_som' and h.trang_thai = 'da_duyet' and c.ngay between h.tu_ngay and h.den_ngay) p on true
     where c.tre_phut > 0 or c.ve_som_phut > 0
     group by 1
  ),
  vg as (
    select pc.nhan_vien_id, count(*)::int as so
      from public.phan_ca pc, k
     where pc.ngay between k.dau and k.cuoi and pc.ngay <= (now() at time zone 'Asia/Ho_Chi_Minh')::date and not pc.nghi
       and not exists (select 1 from public.cham_cong c where c.nhan_vien_id = pc.nhan_vien_id and c.ngay = pc.ngay)
       and not exists (select 1 from public.phieu_hr p where p.nhan_vien_id = pc.nhan_vien_id and p.trang_thai = 'da_duyet' and p.loai in ('nghi', 'cong_tac', 'lam_online') and pc.ngay between p.tu_ngay and p.den_ngay)
       and not exists (select 1 from public.ngay_le l where l.ngay = pc.ngay)
     group by 1
  )
  select nv.id, nv.khung, public.cong_chuan_thang(nv.khung, p_nam, p_thang), coalesce(cc.cong, 0), coalesce(ph.phep, 0),
         case when nv.khung = 'khong_cham_cong' then 0 else (select so from le) end, coalesce(ph.ct, 0), coalesce(ph.kl, 0),
         coalesce(cc.lt, 0)::int, coalesce(cc.pt, 0)::int, coalesce(cc.lv, 0)::int, coalesce(cc.pv, 0)::int, coalesce(vg.so, 0), coalesce(ph.ot, 0), round(coalesce(tr.cong, 0), 3),
         greatest(0, round(coalesce(cc.cong, 0) + coalesce(ph.phep, 0) + coalesce(ph.ct, 0) + (case when nv.khung = 'khong_cham_cong' then 0 else (select so from le) end) - coalesce(tr.cong, 0), 3))
    from nv left join cc on cc.nhan_vien_id = nv.id left join ph on ph.nhan_vien_id = nv.id left join vg on vg.nhan_vien_id = nv.id left join tr on tr.nhan_vien_id = nv.id
$$;


revoke all on function public.tong_hop_cong(int, int, uuid) from public, anon, authenticated;
select public.khoa_tat_ca_bang();
