-- 03/11/2026: CSDL đang ở mức Nano (0,5 GB RAM, CPU dùng chung). Tối 03/11 tác vụ tính sẵn 2 phút/lần chạy chồng lúc máy bận,
-- cùng đồng bộ chiều + trình duyệt đo bỏ quên → CPU 99%, hết quota đọc/ghi đĩa, sập ~18:40–20:17. Chị Lâm giữ Nano, không nâng.
-- Nên: thưa ra 10 phút/lần, mỗi lần tối đa 90 giây (quá thì huỷ, không đè máy). App chấp nhận số tính sẵn cũ tới 25 phút.
do $$
declare j bigint;
begin
  if to_regclass('cron.job') is null then return; end if;
  execute $q$select jobid from cron.job where jobname = 'so-lieu-trang-chu'$q$ into j;
  if j is not null then
    perform cron.alter_job(j, schedule := '*/10 * * * *',
      command := $c$set statement_timeout = '90s'; select public.lam_moi_so_lieu_trang_chu()$c$, active := true);
  end if;
end $$;
