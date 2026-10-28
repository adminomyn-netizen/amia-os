-- 0042 — NHẮC CHẤM CÔNG VÀ CÔNG LƯƠNG
-- Bám các nhắc MSC đang chạy trên Lark (base HRM-HRIS-01): báo cáo chấm công 09:00 cho BOD (10.8), nhắc đăng ký lịch nghỉ tuần ngày 25 (8.10),
-- gửi phiếu lương cho từng người (8.15). Thêm nhắc chấm công vào/ra của từng người (Lark Attendance nhắc trên điện thoại, AMIA nhắc bằng thông báo đẩy).
--  · Chuông (thong_bao_trang_thai) nhận thêm các loại nhắc mới.
--  · nhac_da_gui: mỗi người, mỗi ngày, mỗi loại nhắc chỉ gửi đúng một lần (cron lặp 5 phút/lần không gửi trùng).
--  · pg_cron + pg_net gọi /api/cron/nhac-cham-cong mỗi 5 phút từ 07:00 đến 23:00 (giờ VN). Vercel gói thường không chạy cron theo phút nên lịch đặt ở Supabase.
--  · Mã bí mật của lịch nằm trong Supabase Vault (cron_nhac_token); trang chỉ nhận khi mã khớp (hàm kiem_token_cron).

alter table public.thong_bao_trang_thai drop constraint thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan'));

create table public.nhac_da_gui (
  nhan_vien_id uuid not null references public.nhan_vien (id) on delete cascade,
  ngay date not null,
  loai text not null,
  gui_luc timestamptz not null default now(),
  primary key (nhan_vien_id, ngay, loai)
);

-- Phần lịch và mã bí mật chỉ chạy trên Supabase thật (có Vault, pg_cron, pg_net); cơ sở dữ liệu thử cục bộ không có thì bỏ qua.
do $mig$
begin
  if not exists (select 1 from pg_available_extensions where name in ('supabase_vault', 'pg_cron', 'pg_net') having count(*) = 3) then
    raise notice 'Bỏ qua lịch nhắc: máy này không có supabase_vault, pg_cron, pg_net.';
    return;
  end if;
  create extension if not exists supabase_vault;
  create extension if not exists pg_net;
  create extension if not exists pg_cron;

  perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'cron_nhac_token', 'Mã bí mật để lịch Supabase gọi /api/cron/nhac-cham-cong');

  execute $f$
    create or replace function public.kiem_token_cron(p text) returns boolean language sql security definer set search_path = '' as $b$
      select exists (select 1 from vault.decrypted_secrets where name = 'cron_nhac_token' and decrypted_secret = p)
    $b$ $f$;
  revoke all on function public.kiem_token_cron(text) from public, anon, authenticated;
  grant execute on function public.kiem_token_cron(text) to service_role;

  -- 00:00–16:55 UTC = 07:00–23:55 giờ Việt Nam, mỗi 5 phút.
  perform cron.schedule('nhac-cham-cong', '*/5 0-16 * * *', $cron$
    select net.http_get(
      url := 'https://amia-os-neon.vercel.app/api/cron/nhac-cham-cong',
      headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_nhac_token')),
      timeout_milliseconds := 25000
    )
  $cron$);
end
$mig$;

select public.khoa_tat_ca_bang();
