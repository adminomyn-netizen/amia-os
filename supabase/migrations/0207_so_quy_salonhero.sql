-- 0207 — Sổ quỹ y SalonHero (câu 16, chị Lâm chốt 03/11/2026: "SalonHero làm sao thì làm y vậy"). Chỉ THÊM cột/chỉ mục/hàm; view thêm cột ở cuối.
-- SalonHero: KHÔNG có số dư đầu nhập tay; tồn quỹ = cộng dồn mọi dòng sổ từ ngày đầu. Tiền khách trả tự vào sổ (AMIA: view v_so_quy lấy từ thanh_toan, đã khớp SalonHero).
-- Kế toán giữ số dư thật bằng dòng tay: Thu, Chi, Chuyển quỹ (tiền mặt ↔ ngân hàng), Nạp tiền, Rút tiền. Các dòng tay đó được kéo sang so_quy, có mã nguồn sh_id để không nhập trùng.
-- Bảng mã loại của SalonHero (Config.COST_TYPE) → AMIA:
--   1 Thu tiền mặt → thu (quỹ TM)        5 Thu ngân hàng → thu (quỹ NH)
--   2 Chi tiền mặt → chi (quỹ TM)        6 Chi ngân hàng → chi (quỹ NH)
--   3 Chuyển TM sang NH → rut TM + nap NH (chuyen_quy, cùng nhom_chuyen)
--   4 Chuyển NH sang TM → rut NH + nap TM (chuyen_quy, cùng nhom_chuyen)
--   7 Rút tiền TM → rut (TM)  8 Rút tiền NH → rut (NH)  9 Nạp tiền TM → nap (TM)  10 Nạp tiền NH → nap (NH)   (thu_cong, không nhom_chuyen)

alter table public.so_quy
  add column if not exists sh_id bigint,
  add column if not exists sh_ma text,
  add column if not exists sh_nguoi_tao text,
  add column if not exists sh_cap_nhat timestamptz;
comment on column public.so_quy.sh_id is 'Mã dòng sổ quỹ ở SalonHero (cost.id). Một dòng SalonHero = 1 dòng AMIA, riêng chuyển quỹ = 2 dòng (rut + nap).';
comment on column public.so_quy.sh_cap_nhat is 'updatedAt của dòng SalonHero lúc kéo sang; SalonHero sửa dòng thì AMIA đảo dòng cũ và ghi dòng mới (không sửa sổ cái).';
-- Một phiên bản (sh_id, sh_cap_nhat) chỉ nhập một lần cho mỗi chiều rut/nap.
create unique index if not exists so_quy_sh_mot_lan on public.so_quy (sh_id, loai, sh_cap_nhat) where sh_id is not null;

-- View: thêm 2 cột cuối (sh_id, nguoi_ten = tên người tạo ở SalonHero) cho trang Sổ quỹ hiện "Người thu / chi" của dòng cũ.
create or replace view public.v_so_quy with (security_invoker = true) as
  select s.id::text as id, s.ma, s.ngay, s.quy_id, q.chi_nhanh_id, q.loai as loai_quy, s.loai, s.so_tien,
         case when s.loai in ('thu', 'nap') then s.so_tien else -s.so_tien end as bien_dong,
         lt.ten as loai_thu_chi, s.noi_dung, s.doi_tuong, s.nguon, s.nguoi_id, s.tao_luc, s.phieu_goc_id,
         exists (select 1 from public.so_quy d where d.phieu_goc_id = s.id) as da_dao, true as sua_duoc,
         s.sh_id, s.sh_nguoi_tao as nguoi_ten
    from public.so_quy s
    join public.quy q on q.id = s.quy_id
    left join public.loai_thu_chi lt on lt.id = s.loai_thu_chi_id
  union all
  select t.id::text, h.ma, t.ngay, q.id, h.chi_nhanh_id, q.loai,
         case t.loai when 'thu' then 'thu' else 'chi' end, t.so_tien,
         case t.loai when 'thu' then t.so_tien else -t.so_tien end,
         case t.loai when 'thu' then 'Bán hàng' else 'Hoàn tiền khách' end,
         case t.loai when 'thu' then 'Thu tiền hoá đơn ' else 'Hoàn tiền hoá đơn ' end || h.ma, null, 'ban_hang', t.nguoi_id, t.tao_luc, null, false, false,
         null::bigint, null::text
    from public.thanh_toan t
    join public.hoa_don h on h.id = t.hoa_don_id
    join public.quy q on q.chi_nhanh_id = h.chi_nhanh_id
     and q.loai = case t.phuong_thuc when 'tien_mat' then 'tien_mat' else 'ngan_hang' end
   where t.phuong_thuc <> 'the_tien';

-- Nhập dòng tay của SalonHero (1 giao dịch, khoá tư vấn để 2 lần chạy không đè nhau). Idempotent: phiên bản (sh_id, sh_cap_nhat) đã có thì bỏ qua.
-- p_dong: mảng {sh_id, type, cn ('VINH'|'DALAT'), so_tien, tao_luc, cap_nhat, noi_dung, doi_tuong, ma_sh, nguoi_tao}. Trả về số phiếu SalonHero đã nhập mới.
create or replace function public.so_quy_nhap_sh(p_dong jsonb, p_nguoi uuid)
returns int language plpgsql as $$
declare
  x record; v_tm uuid; v_nh uuid; v_ngay date; v_ma text; v_nhom uuid; n int := 0;
  v_thu_khac uuid; v_chi_khac uuid; v_nd text;
begin
  perform pg_advisory_xact_lock(hashtext('so_quy_nhap_sh'));
  select id into v_thu_khac from public.loai_thu_chi where ten = 'Thu khác';
  select id into v_chi_khac from public.loai_thu_chi where ten = 'Chi phí khác';
  for x in select * from jsonb_to_recordset(p_dong) as r(sh_id bigint, type int, cn text, so_tien bigint, tao_luc timestamptz, cap_nhat timestamptz, noi_dung text, doi_tuong text, ma_sh text, nguoi_tao text) loop
    if x.sh_id is null or x.cap_nhat is null or x.tao_luc is null then raise exception 'Dòng sổ quỹ SalonHero thiếu mã, ngày tạo hoặc ngày cập nhật'; end if;
    if x.so_tien is null or x.so_tien <= 0 then continue; end if; -- dòng 0 đồng không đổi số dư, sổ AMIA không nhận số 0
    if exists (select 1 from public.so_quy where sh_id = x.sh_id and sh_cap_nhat = x.cap_nhat) then continue; end if;
    select q.id into v_tm from public.quy q join public.chi_nhanh c on c.id = q.chi_nhanh_id where c.ma = x.cn and q.loai = 'tien_mat';
    select q.id into v_nh from public.quy q join public.chi_nhanh c on c.id = q.chi_nhanh_id where c.ma = x.cn and q.loai = 'ngan_hang';
    if v_tm is null or v_nh is null then raise exception 'Không tìm thấy quỹ của chi nhánh %', x.cn; end if;
    v_ngay := (x.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date;
    v_ma := 'SH' || x.sh_id;
    if exists (select 1 from public.so_quy where sh_id = x.sh_id) then v_ma := v_ma || '-' || to_char(x.cap_nhat at time zone 'Asia/Ho_Chi_Minh', 'YYMMDDHH24MISS'); end if;
    v_nd := coalesce(nullif(btrim(x.noi_dung), ''), case x.type when 1 then 'Thu' when 5 then 'Thu' when 2 then 'Chi' when 6 then 'Chi'
              when 3 then 'Chuyển sang quỹ ngân hàng' when 4 then 'Chuyển sang quỹ tiền mặt' when 7 then 'Rút tiền' when 8 then 'Rút tiền' else 'Nạp tiền' end);
    if x.type in (3, 4) then
      v_nhom := gen_random_uuid();
      insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, noi_dung, doi_tuong, nguon, nhom_chuyen, nguoi_id, tao_luc, sh_id, sh_ma, sh_nguoi_tao, sh_cap_nhat) values
        (v_ma || '-R', v_ngay, case x.type when 3 then v_tm else v_nh end, 'rut', x.so_tien, v_nd, nullif(x.doi_tuong, ''), 'chuyen_quy', v_nhom, p_nguoi, x.tao_luc, x.sh_id, nullif(x.ma_sh, ''), nullif(x.nguoi_tao, ''), x.cap_nhat),
        (v_ma || '-N', v_ngay, case x.type when 3 then v_nh else v_tm end, 'nap', x.so_tien, v_nd, nullif(x.doi_tuong, ''), 'chuyen_quy', v_nhom, p_nguoi, x.tao_luc, x.sh_id, nullif(x.ma_sh, ''), nullif(x.nguoi_tao, ''), x.cap_nhat);
    elsif x.type in (1, 2, 5, 6, 7, 8, 9, 10) then
      insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguon, nguoi_id, tao_luc, sh_id, sh_ma, sh_nguoi_tao, sh_cap_nhat) values
        (v_ma, v_ngay, case when x.type in (1, 2, 7, 9) then v_tm else v_nh end,
         case when x.type in (1, 5) then 'thu' when x.type in (2, 6) then 'chi' when x.type in (7, 8) then 'rut' else 'nap' end,
         x.so_tien, case when x.type in (1, 5) then v_thu_khac when x.type in (2, 6) then v_chi_khac end,
         v_nd, nullif(x.doi_tuong, ''), 'thu_cong', p_nguoi, x.tao_luc, x.sh_id, nullif(x.ma_sh, ''), nullif(x.nguoi_tao, ''), x.cap_nhat);
    else
      raise exception 'Loại phiếu SalonHero % chưa biết (sh_id %)', x.type, x.sh_id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Đảo các dòng đã nhập từ SalonHero (SalonHero xoá hoặc sửa dòng đó). Không sửa/xoá dòng cũ: ghi dòng ngược chiều CÙNG NGÀY với dòng gốc
-- để tồn quỹ theo ngày giống SalonHero (dòng biến mất khỏi ngày đó).
create or replace function public.so_quy_dao_sh(p_sh_ids bigint[], p_ly_do text, p_nguoi uuid)
returns int language plpgsql as $$
declare d record; n int := 0;
begin
  if coalesce(btrim(p_ly_do), '') = '' then raise exception 'Cần lý do đảo phiếu'; end if;
  perform pg_advisory_xact_lock(hashtext('so_quy_nhap_sh'));
  for d in select s.* from public.so_quy s
            where s.sh_id = any (p_sh_ids) and s.nguon <> 'dao_phieu'
              and not exists (select 1 from public.so_quy r where r.phieu_goc_id = s.id)
            order by s.ma for update loop
    insert into public.so_quy (ma, ngay, quy_id, loai, so_tien, loai_thu_chi_id, noi_dung, doi_tuong, nguon, phieu_goc_id, nguoi_id)
    values ('DP' || d.ma, d.ngay, d.quy_id, case d.loai when 'thu' then 'chi' when 'chi' then 'thu' when 'nap' then 'rut' else 'nap' end,
            d.so_tien, d.loai_thu_chi_id, 'Đảo phiếu ' || d.ma || ': ' || p_ly_do, d.doi_tuong, 'dao_phieu', d.id, p_nguoi);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.so_quy_nhap_sh(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.so_quy_dao_sh(bigint[], text, uuid) from public, anon, authenticated;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
