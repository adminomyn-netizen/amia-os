-- 0271 — Đặt lịch online: lịch đã bị lễ tân huỷ / khách không đến KHÔNG còn tính vào giới hạn "3 lịch online sắp tới" và "trùng giờ" của một SĐT
-- (0270 đếm theo yeu_cau_dat_lich nên lịch đã huỷ vẫn chặn khách đặt lại). Chỉ thay hàm dat_lich_online, không đổi bảng.
create or replace function public.dat_lich_online(p_cn uuid, p_dv uuid[], p_bat_dau timestamptz, p_ho_ten text, p_sdt text, p_gioi_tinh text,
  p_so_khach int, p_nv uuid, p_ghi_chu text, p_ip_bam text) returns jsonb language plpgsql as $$
declare
  tc jsonb := public.web_dat_lich_tuy_chon();
  v_ten text := regexp_replace(btrim(coalesce(p_ho_ten, '')), '\s+', ' ', 'g');
  v_ghi text := nullif(regexp_replace(btrim(coalesce(p_ghi_chu, '')), '\s+', ' ', 'g'), '');
  v_sdt text := regexp_replace(coalesce(p_sdt, ''), '\D', '', 'g');
  v_dv uuid[] := coalesce(p_dv, '{}'::uuid[]);
  v_sk int := coalesce(p_so_khach, 1);
  v_nv uuid; v_gt text; v_phut int; v_n int; v_ngay date; v_kt timestamptz; v_khach uuid; v_ten_k text; v_pt uuid; v_moi boolean := false;
  v_tt text; v_lich uuid; v_ma text; v_toi_da int;
begin
  if coalesce((select gia_tri from public.cau_hinh where khoa = 'dat_online.mo'), '0') <> '1' then raise exception 'Đặt lịch online hiện chưa mở. Vui lòng gọi điện cho phòng khám.'; end if;
  if p_ip_bam is null or length(p_ip_bam) < 8 or length(p_ip_bam) > 128 then raise exception 'Chưa gửi được. Vui lòng thử lại.'; end if;
  perform pg_advisory_xact_lock(hashtext('gui_yeu_cau_dat_lich'));

  if v_sdt ~ '^84\d{9}$' then v_sdt := '0' || substr(v_sdt, 3); end if;
  if length(v_ten) < 2 or length(v_ten) > 100 or v_ten ~ '[<>]' or v_ten ~* '(https?:|www\.)' then raise exception 'Nhập họ tên (2 đến 100 ký tự, không chứa liên kết).'; end if;
  if v_sdt !~ '^0\d{9,10}$' then raise exception 'Số điện thoại chưa đúng (bắt đầu bằng 0, đủ 10 hoặc 11 số).'; end if;
  if v_ghi is not null and (length(v_ghi) > 300 or v_ghi ~ '[<>]' or v_ghi ~* '(https?:|www\.)') then raise exception 'Ghi chú tối đa 300 ký tự và không chứa liên kết.'; end if;
  if v_sk < 1 or v_sk > 20 then raise exception 'Số người đi cùng nhóm từ 1 đến 20.'; end if;
  -- "Dành cho khách hàng": chỉ nữ / chỉ nam thì giới tính theo cài đặt; cả hai thì theo khách chọn (Chị / Anh).
  v_gt := case coalesce(tc ->> 'doiTuong', 'ca') when 'nu' then 'nữ' when 'nam' then 'nam' else case when p_gioi_tinh in ('nam', 'nữ') then p_gioi_tinh else 'nữ' end end;
  if not exists (select 1 from public.chi_nhanh where id = p_cn and hoat_dong and hien_dat_lich) then raise exception 'Chọn chi nhánh.'; end if;

  -- Dịch vụ: chỉ khi bật "Hiện thị thông tin dịch vụ & sản phẩm"; tắt thì bỏ qua và dùng thời lượng mặc định.
  if (tc -> 'hienDvSp') is distinct from 'true'::jsonb then v_dv := '{}'; end if;
  if cardinality(v_dv) > 5 then raise exception 'Chọn tối đa 5 dịch vụ.'; end if;
  if (select count(distinct x) from unnest(v_dv) x) <> cardinality(v_dv) then raise exception 'Dịch vụ bị chọn trùng.'; end if;
  if cardinality(v_dv) > 0 then
    select count(*), coalesce(sum(thoi_luong_phut), 0) into v_n, v_phut from public.dich_vu
     where id = any (v_dv) and hoat_dong and dat_online and noi_hien_thi in ('tat_ca', 'dat_lich')
       and (chi_nhanh_ids is null or chi_nhanh_ids = '{}' or p_cn = any (chi_nhanh_ids));
    if v_n <> cardinality(v_dv) then raise exception 'Có dịch vụ chưa nhận đặt online ở chi nhánh này. Vui lòng chọn lại.'; end if;
    if v_phut > 240 then raise exception 'Các dịch vụ đã chọn quá dài cho một lần đặt. Vui lòng chọn ít hơn hoặc gọi phòng khám.'; end if;
    v_phut := greatest(v_phut, 5);
  else
    v_phut := case when (tc ->> 'thoiLuongPhut') ~ '^\d{1,3}$' and (tc ->> 'thoiLuongPhut')::int between 5 and 480 then (tc ->> 'thoiLuongPhut')::int else 30 end;
  end if;
  -- Người làm: chỉ khi bật "Cho phép chọn stylist lúc đặt lịch".
  v_nv := case when (tc -> 'chonKtv') = 'true'::jsonb then p_nv end;

  if p_bat_dau is null then raise exception 'Chọn ngày và giờ hẹn.'; end if;
  if p_bat_dau < now() then raise exception 'Khung giờ quý khách chọn đã qua. Vui lòng chọn khung giờ khác.'; end if;
  v_ngay := (p_bat_dau at time zone 'Asia/Ho_Chi_Minh')::date;
  v_toi_da := coalesce((select nullif(gia_tri, '')::int from public.cau_hinh where khoa = 'dat_online.toi_da_ngay'), 60);
  if v_ngay > ((now() at time zone 'Asia/Ho_Chi_Minh')::date + v_toi_da) then raise exception 'Chỉ đặt được trong vòng % ngày tới.', v_toi_da; end if;
  if not exists (select 1 from public.khung_gio_online(p_cn, v_ngay, v_phut, v_sk, v_nv) k
                  where k.gio = to_char(p_bat_dau at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI') and k.con_cho) then
    raise exception 'Khung giờ này đã hết chỗ. Vui lòng chọn giờ khác.';
  end if;
  v_kt := p_bat_dau + make_interval(mins => v_phut);

  -- Chống spam (chỉ đếm lần đặt online, không lộ lịch do nhân viên tạo).
  if (select count(*) from public.yeu_cau_dat_lich y where y.dien_thoai = v_sdt and y.bat_dau > now() and ((y.lich_id is null and y.trang_thai = 'cho') or exists (select 1 from public.lich_hen l where l.id = y.lich_id and l.trang_thai not in ('huy', 'khong_den')))) >= 3 then
    raise exception 'Số điện thoại này đã có nhiều lịch đặt online sắp tới. Vui lòng gọi điện cho phòng khám để đặt thêm.';
  end if;
  if exists (select 1 from public.yeu_cau_dat_lich y where y.dien_thoai = v_sdt and ((y.lich_id is null and y.trang_thai = 'cho') or exists (select 1 from public.lich_hen l where l.id = y.lich_id and l.trang_thai not in ('huy', 'khong_den'))) and y.bat_dau < v_kt and y.bat_dau + make_interval(mins => y.thoi_luong_phut) > p_bat_dau) then
    raise exception 'Số điện thoại này đã đặt lịch vào khung giờ đó.';
  end if;
  if (select count(*) from public.yeu_cau_dat_lich where dien_thoai = v_sdt and tao_luc > now() - interval '1 day') >= 5 then
    raise exception 'Số điện thoại này đặt quá nhiều lần trong ngày. Vui lòng gọi điện cho phòng khám.';
  end if;
  if (select count(*) from public.yeu_cau_dat_lich where ip_bam = p_ip_bam and tao_luc > now() - interval '1 hour') >= 10 then
    raise exception 'Quý khách gửi quá nhiều lần trong một giờ. Vui lòng thử lại sau hoặc gọi điện cho phòng khám.';
  end if;
  if (select count(*) from public.yeu_cau_dat_lich where tao_luc > now() - interval '1 hour') >= 60 then
    raise exception 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau hoặc gọi điện cho phòng khám.';
  end if;

  -- Khách: SĐT đã có thì gắn vào khách cũ (không sửa hồ sơ); chưa có thì tạo khách nguồn "Đặt lịch online".
  select id, ho_ten into v_khach, v_ten_k from public.khach_hang where dien_thoai = v_sdt order by tao_luc limit 1;
  if v_khach is null then
    select nullif(gia_tri, '')::uuid into v_pt from public.cau_hinh where khoa = 'dat_online.phu_trach' and gia_tri ~ '^[0-9a-f-]{36}$';
    if v_pt is null or not exists (select 1 from public.nhan_vien where id = v_pt and hoat_dong) then
      select id into v_pt from public.nhan_vien where hoat_dong and vai_tro in ('quan_ly', 'le_tan', 'chu') and (chi_nhanh_id = p_cn or chi_nhanh_id is null)
       order by (chi_nhanh_id = p_cn) desc nulls last, case vai_tro when 'quan_ly' then 1 when 'le_tan' then 2 else 3 end, tao_luc limit 1;
    end if;
    if v_pt is null then raise exception 'Chưa đặt được lịch. Vui lòng gọi điện cho phòng khám.'; end if;
    insert into public.khach_hang (ma, ho_ten, dien_thoai, gioi_tinh, chi_nhanh_id, nguon, nguon_chi_tiet, nguoi_phu_trach_id)
    values ('KH' || lpad(public.so_tiep_theo('khach')::text, 6, '0'), v_ten, v_sdt, v_gt, p_cn, 'mkt', 'Đặt lịch online', v_pt) returning id into v_khach;
    v_ten_k := v_ten; v_moi := true;
  end if;

  v_tt := case when tc ->> 'trangThai' = 'da_xac_nhan' then 'da_xac_nhan' else 'chua_xac_nhan' end;
  v_ma := 'W' || upper(substr(md5(gen_random_uuid()::text), 1, 7));
  insert into public.lich_hen (khach_id, chi_nhanh_id, bat_dau, ket_thuc, trang_thai, xac_nhan_luc, nguon, so_khach, nhan_vien_id, ma_dat_lich, ghi_chu)
  values (v_khach, p_cn, p_bat_dau, v_kt, v_tt, case when v_tt = 'da_xac_nhan' then now() end, 'ONLINE', v_sk, v_nv, v_ma,
          'Khách tự đặt online' || case when v_sk > 1 then ' · nhóm ' || v_sk || ' khách' else '' end || coalesce(' · ' || v_ghi, '')
            || case when not v_moi and v_ten <> v_ten_k then ' · Tên khách ghi: ' || v_ten else '' end)
  returning id into v_lich;
  if cardinality(v_dv) > 0 then insert into public.lich_hen_dich_vu (lich_id, dich_vu_id) select v_lich, unnest(v_dv); end if;
  insert into public.yeu_cau_dat_lich (chi_nhanh_id, dich_vu_ids, bat_dau, thoi_luong_phut, ho_ten, dien_thoai, ghi_chu, ip_bam, trang_thai, lich_id, xu_ly_luc, gioi_tinh, so_khach, nhan_vien_id)
  values (p_cn, v_dv, p_bat_dau, v_phut, v_ten, v_sdt, v_ghi, p_ip_bam, 'da_duyet', v_lich, now(), v_gt, v_sk, v_nv);
  return jsonb_build_object('lich_id', v_lich, 'ma', v_ma, 'phut', v_phut, 'trang_thai', v_tt);
end $$;

revoke all on function public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text) from public, anon, authenticated;
grant execute on function public.dat_lich_online(uuid, uuid[], timestamptz, text, text, text, int, uuid, text, text) to service_role;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
