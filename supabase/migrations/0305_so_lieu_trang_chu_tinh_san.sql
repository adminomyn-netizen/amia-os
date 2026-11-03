-- 0305 — TỐC ĐỘ TRANG CHỦ: số liệu nặng tính sẵn bằng pg_cron, trang chỉ đọc bảng (03/11/2026, chị Lâm: "vào trang chủ vẫn load chậm ghê").
-- Trước: mỗi lần máy chủ Vercel nguội hoặc hết 45 giây đệm, trang chủ gọi trực tiếp bao_cao_sang_tinh, top_ban_thang, top_khach_chi_12_thang,
--   bc_nhan_vien, bc_doanh_thu_ngay(_vi), loc_khach (sinh nhật) — lúc máy CSDL bận đo được 3–28 s mỗi hàm → trang trắng hàng chục giây.
-- Sau: hàm lam_moi_so_lieu_trang_chu() gọi ĐÚNG các hàm đó với ĐÚNG tham số trang chủ dùng (mọi chi nhánh + từng chi nhánh đang hoạt động),
--   lưu nguyên kết quả (jsonb) vào so_lieu_tinh_san; pg_cron chạy 2 phút/lần. Trang đọc 1 dòng theo (hàm, tham số) — vài ms.
--   Không có dòng khớp hoặc dòng cũ quá 10 phút (vd vừa qua nửa đêm, cron chưa chạy) thì trang tự gọi hàm trực tiếp như cũ.
-- Con số: là kết quả của chính hàm cũ, chỉ chậm tối đa ~2 phút so với lúc tính (trước đây đệm 45 giây/5 phút).

create table if not exists public.so_lieu_tinh_san (
  ham text not null,
  tham_so jsonb not null,
  ket_qua jsonb not null,
  luc timestamptz not null default now(),
  primary key (ham, tham_so)
);
comment on table public.so_lieu_tinh_san is 'Kết quả tính sẵn của các hàm báo cáo nặng trang chủ (pg_cron 2 phút/lần, lam_moi_so_lieu_trang_chu). Chỉ để đọc nhanh.';

create or replace function public.lam_moi_so_lieu_trang_chu() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d date := public.hom_nay();
  dau date := date_trunc('month', public.hom_nay())::date;
  dau_truoc date := (date_trunc('month', public.hom_nay()) - interval '1 month')::date;
  cn uuid; n int := 0; kq jsonb; ts jsonb; muc record;
begin
  -- Khoá tư vấn: 2 lần cron chồng nhau (lần trước chạy lâu) thì lần sau bỏ qua.
  if not pg_try_advisory_xact_lock(hashtext('lam_moi_so_lieu_trang_chu')) then return -1; end if;
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
  return n;
end $$;
revoke all on function public.lam_moi_so_lieu_trang_chu() from public, anon, authenticated;

select public.lam_moi_so_lieu_trang_chu();

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'so-lieu-trang-chu';
    perform cron.schedule('so-lieu-trang-chu', '*/2 * * * *', 'select public.lam_moi_so_lieu_trang_chu()');
  end if;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
