-- 0307 — Số liệu trang chủ tính sẵn: BỎ QUA lần chạy khi dữ liệu không đổi (03/11/2026).
-- Đo 03/11 18:18: trong lúc cron so-lieu-trang-chu chạy (6–24 s mỗi 2 phút), /trang-chu tải trọn 5,3 s và /lich-hen 2,6 s (lúc rảnh 0,8–0,9 s);
-- trình duyệt có lần chờ 10–15 s. 10 giờ gần nhất chỉ ~8% khung 2 phút có ghi hoá đơn/thanh toán/lịch → phần lớn lần chạy là thừa.
-- Giữ nguyên lịch 2 phút, cách tính và khoá dòng; thêm dấu vân dữ liệu (xem chú thích trong hàm). Số liệu đọc ra không đổi.

create or replace function public.lam_moi_so_lieu_trang_chu() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d date := public.hom_nay();
  dau date := date_trunc('month', public.hom_nay())::date;
  dau_truoc date := (date_trunc('month', public.hom_nay()) - interval '1 month')::date;
  cn uuid; n int := 0; kq jsonb; ts jsonb; muc record;
  dv text; cu jsonb;
begin
  -- Khoá tư vấn: 2 lần cron chồng nhau (lần trước chạy lâu) thì lần sau bỏ qua.
  if not pg_try_advisory_xact_lock(hashtext('lam_moi_so_lieu_trang_chu')) then return -1; end if;
  -- Dấu vân dữ liệu: tổng số dòng đã thêm/sửa/xoá (thống kê sẵn của Postgres, gần như miễn phí) trên các bảng mà 7 hàm đọc + ngày hôm nay.
  -- Không đổi và lần tính đủ gần nhất chưa quá 8 phút → chỉ làm mới mốc thời gian, không tính lại (trước đây mỗi 2 phút tốn 6–24 s CPU
  -- của máy CSDL dùng chung, làm mọi trang khác chậm 3–10 lần trong lúc chạy). Có ghi mới thì tính lại ngay ở lần chạy kế tiếp (≤ 2 phút).
  -- Tính đủ ít nhất 8 phút/lần để phần phụ thuộc giờ trong ngày không lệch quá mức app chấp nhận (10 phút).
  select d::text || ':' || coalesce(sum(s.n_tup_ins + s.n_tup_upd + s.n_tup_del), 0)::text into dv
    from pg_stat_user_tables s
   where s.schemaname = 'public' and s.relname = any (array['buoi_thuc_hien', 'cau_hinh', 'chi_nhanh', 'danh_gia_nhan_vien', 'dich_vu', 'dong_nhan_vien', 'goi_the',
     'hang_khach', 'hoa_don', 'hoa_don_dong', 'hoa_hong_cai_dat', 'hoa_hong_ti_le', 'khach_hang', 'khach_nhac', 'khach_nhom', 'lich_hen', 'nhan_vien', 'nhom_khach',
     'san_pham', 'tai_kham_xu_ly', 'thanh_toan', 'the_khach', 'the_so_cai', 'the_so_du']);
  select ket_qua into cu from public.so_lieu_tinh_san where ham = '_dau_van' and tham_so = '{}'::jsonb;
  if cu->>'dv' = dv and (cu->>'luc_du')::timestamptz > now() - interval '8 minutes' then
    update public.so_lieu_tinh_san set luc = now() where ham <> '_dau_van' and luc >= (cu->>'luc_du')::timestamptz;
    update public.so_lieu_tinh_san set luc = now() where ham = '_dau_van' and tham_so = '{}'::jsonb;
    return 0;
  end if;
  for cn in select null::uuid union all select id from public.chi_nhanh where hoat_dong loop
    for muc in select * from (values ('bc_nhan_vien'), ('bc_doanh_thu_ngay'), ('bc_doanh_thu_ngay_vi'), ('top_ban_thang'), ('top_khach_chi_12_thang'), ('bao_cao_sang_tinh'), ('sinh_nhat_hom_nay')) v(ham) loop
      begin
        if muc.ham = 'bc_nhan_vien' then
          ts := jsonb_build_object('p_tu', dau, 'p_den', d, 'p_cn', cn);
          select coalesce(jsonb_agg(to_jsonb(r)), '[]') into kq from public.bc_nhan_vien(dau, d, cn) r;
        elsif muc.ham = 'bc_doanh_thu_ngay' then
          ts := jsonb_build_object('p_tu', dau_truoc, 'p_den', d, 'p_cn', cn);
          select coalesce(jsonb_agg(to_jsonb(r)), '[]') into kq from public.bc_doanh_thu_ngay(dau_truoc, d, cn) r;
        elsif muc.ham = 'bc_doanh_thu_ngay_vi' then
          ts := jsonb_build_object('p_tu', dau, 'p_den', d, 'p_cn', cn);
          select coalesce(jsonb_agg(to_jsonb(r)), '[]') into kq from public.bc_doanh_thu_ngay_vi(dau, d, cn) r;
        elsif muc.ham = 'top_ban_thang' then
          ts := jsonb_build_object('p_tu', dau, 'p_cn', cn);
          select coalesce(jsonb_agg(to_jsonb(r)), '[]') into kq from public.top_ban_thang(dau, cn) r;
        elsif muc.ham = 'top_khach_chi_12_thang' then
          ts := jsonb_build_object('p_so', 10, 'p_cn', cn);
          select coalesce(jsonb_agg(to_jsonb(r)), '[]') into kq from public.top_khach_chi_12_thang(cn, 10) r;
        elsif muc.ham = 'bao_cao_sang_tinh' then
          ts := jsonb_build_object('p_cn', cn, 'ngay', d);
          kq := public.bao_cao_sang_tinh(null, cn);
        else -- sinh nhật hôm nay (hộp trong Báo cáo ngày): đúng tham số locKhach({sinh_nhat:'hom_nay', sx:'ten', chi_nhanh}, 0, 200)
          ts := jsonb_build_object('p_cn', cn, 'ngay', d);
          select coalesce(jsonb_agg(to_jsonb(r)), '[]') into kq
            from public.loc_khach(jsonb_build_object('sinh_nhat', 'hom_nay', 'sx', 'ten') || case when cn is null then '{}'::jsonb else jsonb_build_object('chi_nhanh', cn) end, 0, 200) r;
        end if;
        insert into public.so_lieu_tinh_san (ham, tham_so, ket_qua, luc) values (muc.ham, ts, kq, now())
          on conflict (ham, tham_so) do update set ket_qua = excluded.ket_qua, luc = excluded.luc;
        n := n + 1;
      exception when others then
        raise warning 'lam_moi_so_lieu_trang_chu: % (cn %) lỗi: %', muc.ham, cn, sqlerrm;
      end;
    end loop;
  end loop;
  -- Dọn dòng của ngày/tháng cũ.
  delete from public.so_lieu_tinh_san where luc < now() - interval '1 day';
  -- dv lấy TRƯỚC khi tính: ghi mới xen giữa lúc đang tính sẽ làm lần sau tính lại.
  insert into public.so_lieu_tinh_san (ham, tham_so, ket_qua, luc) values ('_dau_van', '{}'::jsonb, jsonb_build_object('dv', dv, 'luc_du', now()), now())
    on conflict (ham, tham_so) do update set ket_qua = excluded.ket_qua, luc = excluded.luc;
  return n;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
