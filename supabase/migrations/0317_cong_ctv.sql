-- 0317 — CỔNG CTV CÔNG KHAI (M5, docs/bedental/DOI-CHIEU-10-11.md mục 1.7 + 1.4; màn BeDental ở docs/bedental/marketing.md mục 5.7–5.9 + 6).
-- Chỉ THÊM bảng/cột/hàm; thay 2 hàm (rut_hh_tao tách lõi dùng chung, trg_yeu_cau_rut_hh so sánh null-an-toàn). Không xoá dữ liệu.
--   doi_tac_gt.tu_dang_ky / dong_y_luc / phien_ver / vao_cong_luc   CTV tự đăng ký qua /ctv/dang-ky; phiên bản phiên (tăng = "Đăng xuất mọi thiết bị")
--   ctv_ma_xac_thuc         mã 6 số (chỉ lưu HMAC băm, máy chủ giữ khoá) cho đăng ký / đăng nhập / yêu cầu chi trả; hết hạn, tối đa 5 lần nhập,
--                           giới hạn gửi theo SĐT, email, IP băm và tổng toàn hệ thống
--   ctv_ma_tao / ctv_ma_thu / ctv_ma_dung   tạo mã (chặn gửi dồn), lấy mã để so (mỗi lần lấy = 1 lần thử, khoá hàng chống đoán song song), đánh dấu đã dùng (1 lần)
--   ctv_tu_dang_ky          tạo nguồn giới thiệu từ mã đăng ký ĐÃ xác thực: REF = SĐT, mức hoa hồng lấy từ cau_hinh ctv.tu_dang_ky_*; chặn SĐT đã là đối tác
--   ctv_thu                 hàng đợi + nhật ký thư gửi CTV (10 loại, công tắc ctv.email.<loai>); không ghi dịch vụ, tên khách đã che
--   ctv_khieu_nai           khiếu nại đối soát CTV gửi từ cổng; nhân viên xử lý ở Giới thiệu & CTV › Khiếu nại đối soát
--   yeu_cau_rut_hh.tu_cong_ctv   yêu cầu chi trả CTV tự gửi từ cổng (tao_boi = null); cùng quy tắc rut_hh_tao (khoá, đối chiếu sổ, tối thiểu, một yêu cầu mở)
--   ctv_tong_quan / ctv_da_gioi_thieu / ctv_doi_soat   số liệu cổng, LUÔN theo một p_dt (máy chủ lấy từ phiên đã ký), tên + SĐT khách đã che, không có tên dịch vụ
-- Để sau: tuyến dưới / 2 cấp, chiến dịch + poster riêng của CTV, e-voucher.
-- Chạy lại nhiều lần không hỏng.
set lock_timeout = '4s';

-- 1. Cột mới ──────────────────────────────────────────────────────────────
alter table public.doi_tac_gt
  add column if not exists tu_dang_ky boolean not null default false,
  add column if not exists dong_y_luc timestamptz,
  add column if not exists phien_ver int not null default 1,
  add column if not exists vao_cong_luc timestamptz;

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('ctv.cong_mo', '1', 'Cổng CTV /ctv/dang-ky nhận đăng ký mới (1 = mở, 0 = tạm đóng; CTV đã có vẫn đăng nhập được)'),
  ('ctv.email.ma_dang_nhap', '1', 'Thư CTV: mã đăng nhập / xác thực (tắt thì CTV không nhận được mã)'),
  ('ctv.email.chao_mung', '1', 'Thư CTV: chào mừng đối tác mới'),
  ('ctv.email.da_dat_hen', '1', 'Thư CTV: người được giới thiệu đã đặt hẹn'),
  ('ctv.email.da_su_dung', '1', 'Thư CTV: người được giới thiệu đã sử dụng dịch vụ'),
  ('ctv.email.da_huy', '1', 'Thư CTV: người được giới thiệu đã huỷ hẹn'),
  ('ctv.email.da_thanh_toan_hh', '1', 'Thư CTV: đã thanh toán hoa hồng'),
  ('ctv.email.cap_nhat_hh', '1', 'Thư CTV: cập nhật hoa hồng (gộp, gửi 20:00)'),
  ('ctv.email.thay_doi_tuyen_tren', '0', 'Thư CTV: thay đổi quan hệ tuyến trên (giai đoạn sau)'),
  ('ctv.email.loi_moi_tuyen_duoi', '0', 'Thư CTV: lời mời làm tuyến dưới (giai đoạn sau)'),
  ('ctv.email.khach_dang_ky_doi_tac', '0', 'Thư CTV: khách được giới thiệu đã đăng ký đối tác (giai đoạn sau)')
on conflict (khoa) do nothing;

-- Che tên / SĐT khách cho CTV: "Nguyễn Thị Lan" → "N*** T** L**", "0912345678" → "091****678".
create or replace function public.ctv_che_ten(p text) returns text language sql immutable set search_path = public, pg_temp as $$
  select coalesce(nullif(string_agg(left(w, 1) || repeat('*', least(greatest(length(w) - 1, 2), 3)), ' '), ''), '***')
    from regexp_split_to_table(btrim(coalesce(p, '')), '\s+') w where w <> ''
$$;
create or replace function public.ctv_che_sdt(p text) returns text language sql immutable set search_path = public, pg_temp as $$
  select case when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) >= 7
    then left(regexp_replace(p, '\D', '', 'g'), 3) || '****' || right(regexp_replace(p, '\D', '', 'g'), 3) else '***' end
$$;

-- 2. Mã xác thực ──────────────────────────────────────────────────────────
create table if not exists public.ctv_ma_xac_thuc (
  id uuid primary key default gen_random_uuid(),
  muc_dich text not null check (muc_dich in ('dang_ky', 'dang_nhap', 'rut_hh')),
  sdt text not null check (sdt ~ '^0(3|5|7|8|9)[0-9]{8}$'),
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  doi_tac_id uuid references public.doi_tac_gt (id),
  ma_bam text not null check (length(ma_bam) between 32 and 128),
  du_lieu jsonb not null default '{}'::jsonb,
  ip_bam text,
  co_gui boolean not null default true,      -- false: SĐT chưa đăng ký (đăng nhập) → không gửi thư, nhưng vẫn tính vào giới hạn để không lộ SĐT nào đã đăng ký
  so_lan int not null default 0,
  het_han timestamptz not null,
  huy boolean not null default false,
  da_dung timestamptz,
  da_dang_ky boolean not null default false,
  tao_luc timestamptz not null default now()
);
create index if not exists ctv_ma_xac_thuc_sdt_idx on public.ctv_ma_xac_thuc (sdt, muc_dich, tao_luc desc);
create index if not exists ctv_ma_xac_thuc_ip_idx on public.ctv_ma_xac_thuc (ip_bam, tao_luc desc);
create index if not exists ctv_ma_xac_thuc_tao_idx on public.ctv_ma_xac_thuc (tao_luc);

-- Tạo mã: chặn gửi dồn (cùng SĐT 60 giây, 5 mã/giờ; cùng email 5/giờ; cùng IP 10/giờ; toàn hệ thống 300/giờ). Mã cũ chưa dùng của cùng SĐT + mục đích bị huỷ.
-- Đăng nhập: tra SĐT → nguồn đang hợp tác có email; không có thì vẫn ghi dòng co_gui=false (cùng câu trả lời, cùng giới hạn).
create or replace function public.ctv_ma_tao(p_muc_dich text, p_sdt text, p_email text, p_ma_bam text, p_ip_bam text, p_du_lieu jsonb default '{}'::jsonb, p_dt uuid default null)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v_sdt text := public.chuan_ma_ref(p_sdt); v_email text := lower(nullif(btrim(p_email), '')); d public.doi_tac_gt; v_id uuid; v_gui boolean := true;
        v_qua text := 'Anh/chị đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau ít phút.';
begin
  if p_muc_dich not in ('dang_ky', 'dang_nhap', 'rut_hh') then raise exception 'Mục đích không hợp lệ.' using errcode = 'P0001'; end if;
  if v_sdt is null then raise exception 'Số điện thoại di động gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('ctv_ma:' || v_sdt));
  -- Trần toàn hệ thống chỉ tính mã ĐĂNG KÝ (loại duy nhất gửi tới email bất kỳ): IP có thể giả nên không để kẻ phá làm nghẽn mã đăng nhập / rút tiền của CTV thật.
  if p_muc_dich = 'dang_ky' and (select count(*) from public.ctv_ma_xac_thuc where muc_dich = 'dang_ky' and tao_luc > now() - interval '1 hour') >= 300 then
    raise exception '%', v_qua using errcode = 'P0001';
  end if;
  if exists (select 1 from public.ctv_ma_xac_thuc where sdt = v_sdt and muc_dich = p_muc_dich and tao_luc > now() - interval '60 seconds') then
    raise exception 'Vui lòng đợi 60 giây rồi gửi lại mã.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.ctv_ma_xac_thuc where sdt = v_sdt and tao_luc > now() - interval '1 hour') >= 5 then raise exception '%', v_qua using errcode = 'P0001'; end if;
  if p_ip_bam is not null and (select count(*) from public.ctv_ma_xac_thuc where ip_bam = p_ip_bam and tao_luc > now() - interval '1 hour') >= 10 then raise exception '%', v_qua using errcode = 'P0001'; end if;

  if p_muc_dich = 'dang_ky' then
    if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 120 then raise exception 'Email chưa đúng.' using errcode = 'P0001'; end if;
    if coalesce((select gia_tri from public.cau_hinh where khoa = 'ctv.cong_mo'), '1') <> '1' then
      raise exception 'Phòng khám đang tạm dừng nhận đăng ký đối tác. Vui lòng liên hệ phòng khám.' using errcode = 'P0001';
    end if;
  elsif p_muc_dich = 'dang_nhap' then
    select * into d from public.doi_tac_gt where ma_ref = v_sdt and hoat_dong and email is not null;
    v_email := lower(d.email); v_gui := d.id is not null;
  else
    select * into d from public.doi_tac_gt where id = p_dt and hoat_dong and ma_ref = v_sdt and email is not null;
    if d.id is null then raise exception 'Tài khoản đối tác chưa có email nhận mã. Vui lòng liên hệ phòng khám.' using errcode = 'P0001'; end if;
    v_email := lower(d.email);
  end if;
  if v_email is not null and (select count(*) from public.ctv_ma_xac_thuc where email = v_email and tao_luc > now() - interval '1 hour') >= 5 then raise exception '%', v_qua using errcode = 'P0001'; end if;

  update public.ctv_ma_xac_thuc set huy = true where sdt = v_sdt and muc_dich = p_muc_dich and not huy and da_dung is null;
  insert into public.ctv_ma_xac_thuc (muc_dich, sdt, email, doi_tac_id, ma_bam, du_lieu, ip_bam, co_gui, het_han)
  values (p_muc_dich, v_sdt, v_email, d.id, p_ma_bam, coalesce(p_du_lieu, '{}'::jsonb), p_ip_bam, v_gui,
          now() + case when p_muc_dich = 'rut_hh' then interval '5 minutes' else interval '10 minutes' end)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'gui', v_gui, 'email', case when v_gui then v_email end, 'doi_tac_id', d.id);
end $$;

-- Lấy mã đang hiệu lực để máy chủ so (hằng thời gian). Mỗi lần gọi = 1 lần thử (tối đa 5), khoá hàng nên đoán song song không vượt được giới hạn.
create or replace function public.ctv_ma_thu(p_muc_dich text, p_sdt text)
returns table (id uuid, ma_bam text, doi_tac_id uuid, email text, du_lieu jsonb) language plpgsql set search_path = public, pg_temp as $$
declare r public.ctv_ma_xac_thuc;
begin
  select * into r from public.ctv_ma_xac_thuc m
   where m.sdt = public.chuan_ma_ref(p_sdt) and m.muc_dich = p_muc_dich and not m.huy and m.da_dung is null and m.het_han > now()
   order by m.tao_luc desc limit 1 for update;
  if r.id is null or r.so_lan >= 5 or not r.co_gui then
    if r.id is not null then update public.ctv_ma_xac_thuc set so_lan = so_lan + 1 where ctv_ma_xac_thuc.id = r.id; end if;
    return;
  end if;
  update public.ctv_ma_xac_thuc set so_lan = so_lan + 1 where ctv_ma_xac_thuc.id = r.id;
  return query select r.id, r.ma_bam, r.doi_tac_id, r.email, r.du_lieu;
end $$;

-- Đánh dấu mã đã dùng (chỉ một lần). Trả về false nếu đã dùng / hết hạn / bị huỷ.
create or replace function public.ctv_ma_dung(p_id uuid) returns boolean language plpgsql set search_path = public, pg_temp as $$
declare n int;
begin
  update public.ctv_ma_xac_thuc set da_dung = now() where id = p_id and da_dung is null and not huy and het_han > now() and co_gui;
  get diagnostics n = row_count;
  if n = 1 then
    update public.doi_tac_gt set vao_cong_luc = now() where id = (select doi_tac_id from public.ctv_ma_xac_thuc where id = p_id);
  end if;
  return n = 1;
end $$;

-- 3. Hàng đợi / nhật ký thư CTV ───────────────────────────────────────────
create table if not exists public.ctv_thu (
  id uuid primary key default gen_random_uuid(),
  doi_tac_id uuid references public.doi_tac_gt (id),
  loai text not null check (loai in ('ma_dang_nhap', 'chao_mung', 'da_dat_hen', 'da_su_dung', 'da_huy', 'da_thanh_toan_hh', 'cap_nhat_hh',
                                     'thay_doi_tuyen_tren', 'loi_moi_tuyen_duoi', 'khach_dang_ky_doi_tac')),
  den text,
  du_lieu jsonb not null default '{}'::jsonb,   -- chỉ tên khách đã che, ngày, số tiền, mã; KHÔNG có dịch vụ, KHÔNG có mã xác thực
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'da_gui', 'bo_qua', 'chua_cau_hinh', 'loi')),
  ly_do text,
  khoa_trung text unique,
  so_lan_gui int not null default 0,
  tao_luc timestamptz not null default now(),
  gui_luc timestamptz
);
create index if not exists ctv_thu_tt_idx on public.ctv_thu (trang_thai, tao_luc);
create index if not exists ctv_thu_dt_idx on public.ctv_thu (doi_tac_id, tao_luc desc);

-- Xếp một thư vào hàng: loại đang tắt / đối tác không nhận email → ghi "Bỏ qua" kèm lý do (nhật ký như BeDental). Trùng khoá thì thôi.
create or replace function public.ctv_thu_xep(p_dt uuid, p_loai text, p_du_lieu jsonb, p_khoa text default null) returns void language plpgsql set search_path = public, pg_temp as $$
declare d public.doi_tac_gt; v_tt text := 'cho'; v_ly text;
begin
  select * into d from public.doi_tac_gt where id = p_dt;
  if d.id is null then return; end if;
  if coalesce((select gia_tri from public.cau_hinh where khoa = 'ctv.email.' || p_loai), '0') <> '1' then v_tt := 'bo_qua'; v_ly := 'Loại thư đang tắt';
  elsif d.email is null or not d.gui_email then v_tt := 'bo_qua'; v_ly := 'Đối tác chưa bật nhận email';
  end if;
  insert into public.ctv_thu (doi_tac_id, loai, den, du_lieu, trang_thai, ly_do, khoa_trung)
  values (p_dt, p_loai, case when v_tt = 'cho' then lower(d.email) end, coalesce(p_du_lieu, '{}'::jsonb), v_tt, v_ly, p_khoa)
  on conflict (khoa_trung) do nothing;
end $$;

-- Sự kiện lịch hẹn của khách được giới thiệu: đặt hẹn / đã đến (hoàn thành) / huỷ. Lỗi ở đây không được làm hỏng thao tác lịch hẹn.
create or replace function public.trg_lich_hen_ctv_thu() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_ten text; v_ngay text;
begin
  if new.doi_tac_id is null then return null; end if;
  -- Lịch nhập / đồng bộ từ SalonHero (sh_id, la_lich_su) và lịch trước ngày bắt đầu sổ hoa hồng: không gửi thư (tránh báo CTV những lịch cũ được đồng bộ lại).
  if new.sh_id is not null or coalesce(new.la_lich_su, false)
     or (new.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date < coalesce((select nullif(gia_tri, '')::date from public.cau_hinh where khoa = 'ctv.but_toan_tu_ngay'), date '2026-11-10') then
    return null;
  end if;
  begin
    select public.ctv_che_ten(k.ho_ten) into v_ten from public.khach_hang k where k.id = new.khach_id;
    v_ngay := to_char(new.bat_dau at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY');
    if tg_op = 'INSERT' then
      perform public.ctv_thu_xep(new.doi_tac_id, 'da_dat_hen', jsonb_build_object('ten', v_ten, 'ngay', v_ngay), 'da_dat_hen:' || new.id);
    elsif new.trang_thai is distinct from old.trang_thai and new.trang_thai = 'huy' then
      perform public.ctv_thu_xep(new.doi_tac_id, 'da_huy', jsonb_build_object('ten', v_ten, 'ngay', v_ngay), 'da_huy:' || new.id);
    elsif new.trang_thai is distinct from old.trang_thai and new.trang_thai = 'hoan_thanh' then
      perform public.ctv_thu_xep(new.doi_tac_id, 'da_su_dung', jsonb_build_object('ten', v_ten, 'ngay', v_ngay), 'da_su_dung:' || new.id);
    end if;
  exception when others then
    raise warning 'ctv_thu lich_hen %: %', new.id, sqlerrm;
  end;
  return null;
end $$;
drop trigger if exists lich_hen_ctv_thu on public.lich_hen;
create trigger lich_hen_ctv_thu after insert or update of trang_thai on public.lich_hen for each row execute function public.trg_lich_hen_ctv_thu();

-- Đã chi hoa hồng → thư "Đã thanh toán hoa hồng".
create or replace function public.trg_rut_hh_ctv_thu() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.trang_thai = 'da_chi' and old.trang_thai is distinct from 'da_chi' then
    begin
      perform public.ctv_thu_xep(new.doi_tac_id, 'da_thanh_toan_hh', jsonb_build_object('ma', new.ma, 'so_tien', new.so_tien, 'hinh_thuc', new.hinh_thuc), 'da_thanh_toan_hh:' || new.id);
    exception when others then raise warning 'ctv_thu rut_hh %: %', new.id, sqlerrm;
    end;
  end if;
  return null;
end $$;
drop trigger if exists yeu_cau_rut_hh_ctv_thu on public.yeu_cau_rut_hh;
create trigger yeu_cau_rut_hh_ctv_thu after update of trang_thai on public.yeu_cau_rut_hh for each row execute function public.trg_rut_hh_ctv_thu();

-- Thư gộp 20:00: mỗi nguồn có bút toán ghi trong ngày p_ngay → 1 thư "Cập nhật hoa hồng" (số dòng, tổng hoa hồng trong ngày). Gọi lại không gửi trùng.
create or replace function public.ctv_thu_tong_hop(p_ngay date) returns int language plpgsql set search_path = public, pg_temp as $$
declare r record; n int := 0;
begin
  for r in select b.doi_tac_id, count(distinct b.hoa_don_id)::int so_don, sum(b.so_tien)::bigint tien from public.but_toan_hh_gt b
            where (b.ghi_luc at time zone 'Asia/Ho_Chi_Minh')::date = p_ngay group by 1 loop
    perform public.ctv_thu_xep(r.doi_tac_id, 'cap_nhat_hh', jsonb_build_object('ngay', to_char(p_ngay, 'DD/MM/YYYY'), 'so_don', r.so_don, 'so_tien', r.tien),
                               'cap_nhat_hh:' || r.doi_tac_id || ':' || p_ngay);
    n := n + 1;
  end loop;
  return n;
end $$;

-- 4. Tự đăng ký ───────────────────────────────────────────────────────────
-- Chỉ nhận mã đăng ký ĐÃ xác thực (ctv_ma_dung) và chưa dùng để đăng ký. Dữ liệu (họ tên, email, đồng ý) lấy từ dòng mã, không từ form lần hai.
create or replace function public.ctv_tu_dang_ky(p_ma_id uuid) returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare m public.ctv_ma_xac_thuc; v_id uuid; v_ten text; v_kieu text; v_gt numeric; v_ma text; v_gt_ma text;
begin
  select * into m from public.ctv_ma_xac_thuc where id = p_ma_id for update;
  if m.id is null or m.muc_dich <> 'dang_ky' or m.da_dung is null or m.da_dang_ky or m.da_dung < now() - interval '15 minutes' then
    raise exception 'Mã xác thực không còn hiệu lực. Vui lòng gửi lại mã.' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtext('ctv_dk:' || m.sdt));
  if exists (select 1 from public.doi_tac_gt where ma_ref = m.sdt or public.chuan_ma_ref(dien_thoai) = m.sdt)
     or exists (select 1 from public.doi_tac_ref_cu where ma_ref = m.sdt and het_han_luc > now()) then
    raise exception 'Số điện thoại này đã là đối tác của AMIA. Anh/chị vui lòng đăng nhập ở trang Cổng CTV.' using errcode = 'P0001';
  end if;
  v_ten := left(regexp_replace(btrim(coalesce(m.du_lieu ->> 'ho_ten', '')), '\s+', ' ', 'g'), 80);
  if length(v_ten) < 2 then raise exception 'Thiếu họ tên.' using errcode = 'P0001'; end if;
  v_kieu := case when (select gia_tri from public.cau_hinh where khoa = 'ctv.tu_dang_ky_kieu') = 'tien' then 'tien' else 'phan_tram' end;
  v_gt := coalesce((select nullif(gia_tri, '')::numeric from public.cau_hinh where khoa = 'ctv.tu_dang_ky_gia_tri' and gia_tri ~ '^[0-9]+(\.[0-9]+)?$'), 0);
  if v_kieu = 'phan_tram' then v_gt := least(v_gt, 100); end if;
  v_ma := 'DT' || lpad(public.so_tiep_theo('doi_tac')::text, 4, '0');
  loop
    v_gt_ma := 'GT' || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    exit when not exists (select 1 from public.doi_tac_gt where ma_gioi_thieu = v_gt_ma);
  end loop;
  insert into public.doi_tac_gt (ma, ten, loai, dien_thoai, ma_gioi_thieu, hh_kieu, hh_gia_tri, email, gui_email, ten_hien_thi, tu_dang_ky, dong_y_luc, vao_cong_luc, ghi_chu)
  values (v_ma, v_ten, 'ctv', m.sdt, v_gt_ma, v_kieu, v_gt, m.email, true, left(v_ten, 80), true, coalesce((m.du_lieu ->> 'dong_y_luc')::timestamptz, now()), now(), 'Tự đăng ký qua cổng CTV')
  returning id into v_id;
  update public.ctv_ma_xac_thuc set da_dang_ky = true, doi_tac_id = v_id where id = m.id;
  perform public.ctv_thu_xep(v_id, 'chao_mung', jsonb_build_object('ten', v_ten), 'chao_mung:' || v_id);
  return jsonb_build_object('id', v_id, 'ma_ref', m.sdt, 'phien_ver', 1);
end $$;

-- 5. Chi trả từ cổng ──────────────────────────────────────────────────────
alter table public.yeu_cau_rut_hh alter column tao_boi drop not null;
alter table public.yeu_cau_rut_hh add column if not exists tu_cong_ctv boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'yeu_cau_rut_hh_nguoi_tao') then
    alter table public.yeu_cau_rut_hh add constraint yeu_cau_rut_hh_nguoi_tao check (tao_boi is not null or tu_cong_ctv);
  end if;
end $$;

create or replace function public.trg_yeu_cau_rut_hh() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then raise exception 'Yêu cầu chi trả hoa hồng không xoá được (từ chối thay vì xoá).' using errcode = 'P0001'; end if;
  if new.so_tien <> old.so_tien or new.doi_tac_id <> old.doi_tac_id or new.tao_boi is distinct from old.tao_boi or new.ma <> old.ma or new.hinh_thuc <> old.hinh_thuc
     or new.tu_cong_ctv is distinct from old.tu_cong_ctv then
    raise exception 'Không sửa số tiền, nguồn hay hình thức của yêu cầu đã gửi.' using errcode = 'P0001';
  end if;
  if old.trang_thai in ('da_chi', 'tu_choi') then raise exception 'Yêu cầu đã kết thúc, không sửa được.' using errcode = 'P0001'; end if;
  if new.trang_thai is distinct from old.trang_thai and not (
       (old.trang_thai = 'cho_xu_ly' and new.trang_thai in ('dang_duyet_chi', 'tu_choi')) or
       (old.trang_thai = 'dang_duyet_chi' and new.trang_thai in ('da_chi', 'tu_choi'))) then
    raise exception 'Không chuyển được yêu cầu từ % sang %.', old.trang_thai, new.trang_thai using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Lõi chung: khoá theo nguồn, một yêu cầu mở, đối chiếu sổ, số dư, tối thiểu. p_nguoi = nhân viên tạo; null chỉ khi p_cong (CTV tự gửi từ cổng).
create or replace function public.rut_hh_tao_chung(p_dt uuid, p_so_tien bigint, p_hinh_thuc text, p_ngan_hang text, p_so_tk text, p_ten_chu_tk text, p_ghi_chu text, p_nguoi uuid, p_cong boolean)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_id uuid; v_min bigint; s record;
begin
  if p_nguoi is null and not coalesce(p_cong, false) then raise exception 'Thiếu người tạo.' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.doi_tac_gt where id = p_dt and (not coalesce(p_cong, false) or hoat_dong)) then raise exception 'Không tìm thấy nguồn giới thiệu.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('rut_hh:' || p_dt));
  if exists (select 1 from public.yeu_cau_rut_hh where doi_tac_id = p_dt and trang_thai in ('cho_xu_ly', 'dang_duyet_chi')) then
    raise exception 'Đang có một yêu cầu chi trả chưa xử lý xong.' using errcode = 'P0001';
  end if;
  perform public.ghi_but_toan_hh_gt(x.hd) from (
    select distinct d.hoa_don_id hd from public.hoa_don_dong d where d.gt_doi_tac_id = p_dt
    union select distinct b.hoa_don_id from public.but_toan_hh_gt b where b.doi_tac_id = p_dt) x;
  select * into s from public.so_du_hh_gt(p_dt);
  v_min := coalesce((select nullif(gia_tri, '')::bigint from public.cau_hinh where khoa = 'ctv.toi_thieu_rut'), 0);
  if p_so_tien is null or p_so_tien <= 0 then raise exception 'Số tiền phải lớn hơn 0.' using errcode = 'P0001'; end if;
  if s.kha_dung <= 0 then raise exception 'Chưa có hoa hồng chưa thanh toán.' using errcode = 'P0001'; end if;
  if p_so_tien > s.kha_dung then raise exception 'Số tiền vượt số dư được rút (% đ).', s.kha_dung using errcode = 'P0001'; end if;
  if p_so_tien < v_min then raise exception 'Chưa đạt mức tối thiểu được rút (% đ).', v_min using errcode = 'P0001'; end if;
  insert into public.yeu_cau_rut_hh (ma, doi_tac_id, so_tien, hinh_thuc, ngan_hang, so_tk, ten_chu_tk, ghi_chu, tao_boi, tu_cong_ctv)
  values ('RH' || lpad(public.so_tiep_theo('rut_hh')::text, 5, '0'), p_dt, p_so_tien, p_hinh_thuc, nullif(btrim(p_ngan_hang), ''), nullif(btrim(p_so_tk), ''), nullif(btrim(p_ten_chu_tk), ''),
          nullif(btrim(p_ghi_chu), ''), p_nguoi, coalesce(p_cong, false))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.rut_hh_tao(p_dt uuid, p_so_tien bigint, p_hinh_thuc text, p_ngan_hang text, p_so_tk text, p_ten_chu_tk text, p_ghi_chu text, p_nguoi uuid)
returns uuid language sql set search_path = public, pg_temp as $$
  select public.rut_hh_tao_chung(p_dt, p_so_tien, p_hinh_thuc, p_ngan_hang, p_so_tk, p_ten_chu_tk, p_ghi_chu, p_nguoi, false)
$$;
create or replace function public.rut_hh_tao_ctv(p_dt uuid, p_so_tien bigint, p_hinh_thuc text, p_ngan_hang text, p_so_tk text, p_ten_chu_tk text, p_ghi_chu text)
returns uuid language sql set search_path = public, pg_temp as $$
  select public.rut_hh_tao_chung(p_dt, p_so_tien, p_hinh_thuc, p_ngan_hang, p_so_tk, p_ten_chu_tk, p_ghi_chu, null, true)
$$;

-- 6. Khiếu nại đối soát ───────────────────────────────────────────────────
create table if not exists public.ctv_khieu_nai (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  doi_tac_id uuid not null references public.doi_tac_gt (id),
  ky_tu date not null,
  ky_den date not null,
  ma_hd text check (ma_hd is null or length(ma_hd) <= 40),
  noi_dung text not null check (length(btrim(noi_dung)) between 5 and 1000),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'dang_xu_ly', 'da_xu_ly', 'tu_choi')),
  phan_hoi text check (phan_hoi is null or length(phan_hoi) <= 1000),
  xu_ly_boi uuid references public.nhan_vien (id),
  xu_ly_luc timestamptz,
  tao_luc timestamptz not null default now(),
  check (ky_den >= ky_tu)
);
create index if not exists ctv_khieu_nai_tt_idx on public.ctv_khieu_nai (trang_thai, tao_luc desc);
create index if not exists ctv_khieu_nai_dt_idx on public.ctv_khieu_nai (doi_tac_id, tao_luc desc);

create or replace function public.ctv_khieu_nai_gui(p_dt uuid, p_tu date, p_den date, p_ma_hd text, p_noi_dung text) returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.doi_tac_gt where id = p_dt and hoat_dong) then raise exception 'Không tìm thấy tài khoản đối tác.' using errcode = 'P0001'; end if;
  if p_tu is null or p_den is null or p_den < p_tu or p_den - p_tu > 400 then raise exception 'Kỳ đối soát không hợp lệ.' using errcode = 'P0001'; end if;
  if length(btrim(coalesce(p_noi_dung, ''))) < 5 then raise exception 'Vui lòng ghi rõ nội dung sai lệch.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('ctv_kn:' || p_dt));
  if (select count(*) from public.ctv_khieu_nai where doi_tac_id = p_dt and trang_thai in ('moi', 'dang_xu_ly')) >= 3 then
    raise exception 'Anh/chị đang có 3 khiếu nại chờ xử lý. Phòng khám sẽ phản hồi trước khi nhận thêm.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.ctv_khieu_nai where doi_tac_id = p_dt and tao_luc > now() - interval '1 day') >= 5 then
    raise exception 'Đã gửi nhiều khiếu nại trong ngày. Vui lòng thử lại ngày mai.' using errcode = 'P0001';
  end if;
  insert into public.ctv_khieu_nai (ma, doi_tac_id, ky_tu, ky_den, ma_hd, noi_dung)
  values ('KNDS' || lpad(public.so_tiep_theo('ctv_khieu_nai')::text, 5, '0'), p_dt, p_tu, p_den, nullif(left(btrim(coalesce(p_ma_hd, '')), 40), ''), left(btrim(p_noi_dung), 1000))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.ctv_khieu_nai_xu_ly(p_id uuid, p_nguoi uuid, p_trang_thai text, p_phan_hoi text) returns void language plpgsql set search_path = public, pg_temp as $$
declare r public.ctv_khieu_nai;
begin
  select * into r from public.ctv_khieu_nai where id = p_id for update;
  if r.id is null then raise exception 'Không tìm thấy khiếu nại.' using errcode = 'P0001'; end if;
  if r.trang_thai in ('da_xu_ly', 'tu_choi') then raise exception 'Khiếu nại đã đóng.' using errcode = 'P0001'; end if;
  if p_trang_thai not in ('dang_xu_ly', 'da_xu_ly', 'tu_choi') then raise exception 'Trạng thái không hợp lệ.' using errcode = 'P0001'; end if;
  if p_trang_thai in ('da_xu_ly', 'tu_choi') and length(btrim(coalesce(p_phan_hoi, ''))) < 2 then raise exception 'Nhập phản hồi cho đối tác.' using errcode = 'P0001'; end if;
  update public.ctv_khieu_nai set trang_thai = p_trang_thai, phan_hoi = coalesce(nullif(left(btrim(coalesce(p_phan_hoi, '')), 1000), ''), phan_hoi), xu_ly_boi = p_nguoi, xu_ly_luc = now() where id = p_id;
end $$;

-- 7. Số liệu cổng (luôn theo MỘT nguồn) ───────────────────────────────────
-- Tổng quan theo kỳ: hoa hồng + doanh số tính HH (theo ngày hoá đơn), số đặt hẹn / đã đến (theo ngày hẹn), lượt quét (lượt ghé trang đặt lịch bằng REF); số dư mọi kỳ.
create or replace function public.ctv_tong_quan(p_dt uuid, p_tu date, p_den date)
returns table (hoa_hong bigint, doanh_so bigint, so_dat_hen int, so_da_den int, luot_quet int, tong_hh bigint, da_chi bigint, dang_cho bigint, kha_dung bigint)
language sql stable set search_path = public, pg_temp as $$
  select
    (select coalesce(sum(b.so_tien), 0)::bigint from public.but_toan_hh_gt b where b.doi_tac_id = p_dt and b.ngay_hd between p_tu and p_den),
    (select coalesce(sum(b.doanh_so), 0)::bigint from public.but_toan_hh_gt b where b.doi_tac_id = p_dt and b.ngay_hd between p_tu and p_den),
    (select count(*)::int from public.lich_hen l where l.doi_tac_id = p_dt and (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den),
    (select count(*)::int from public.lich_hen l where l.doi_tac_id = p_dt and l.trang_thai in ('cho_phuc_vu', 'dang_phuc_vu', 'hoan_thanh')
        and (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date between p_tu and p_den),
    (select count(*)::int from public.luot_ghe_ref g where g.doi_tac_id = p_dt and g.ngay between p_tu and p_den),
    s.tong_hh, s.da_chi, s.dang_cho, s.kha_dung
  from public.so_du_hh_gt(p_dt) s
$$;

-- Tôi đã giới thiệu: mỗi lịch hẹn mang REF của nguồn + mỗi hoá đơn có hoa hồng của nguồn mà không gắn lịch hẹn nào ở trên.
-- Trạng thái thanh toán HH: tiền đã chi (da_chi) trả dần cho dòng cũ trước (FIFO theo thời điểm phát sinh) → Đã thanh toán / Thanh toán một phần / Chưa thanh toán.
-- p_loc: '' | 'da_den' | 'khong_den' | 'da_huy' | 'co_hoa_don'. Tên + SĐT khách đã che; không có dịch vụ.
create or replace function public.ctv_da_gioi_thieu(p_dt uuid, p_tu date, p_den date, p_loc text default '')
returns table (khoa text, ngay date, ten_che text, sdt_che text, tinh_trang text, co_hoa_don boolean, hoa_hong bigint, da_tra bigint, tt_thanh_toan text)
language sql stable set search_path = public, pg_temp as $$
  with hh_hd as (
    select b.hoa_don_id, sum(b.so_tien)::bigint st, min(b.ghi_luc) dau from public.but_toan_hh_gt b where b.doi_tac_id = p_dt group by 1
  ), lich as (
    select l.id, l.khach_id, l.bat_dau, l.trang_thai,
           (select coalesce(sum(h2.st), 0) from public.hoa_don h join hh_hd h2 on h2.hoa_don_id = h.id where h.lich_hen_id = l.id)::bigint st,
           exists (select 1 from public.hoa_don h where h.lich_hen_id = l.id and h.trang_thai = 'hoan_thanh') co_hd,
           coalesce((select min(h2.dau) from public.hoa_don h join hh_hd h2 on h2.hoa_don_id = h.id where h.lich_hen_id = l.id), l.bat_dau) moc
      from public.lich_hen l where l.doi_tac_id = p_dt
  ), le as (
    select h.id, h.khach_id, h.ngay_hd, h2.st, h2.dau from hh_hd h2 join public.hoa_don h on h.id = h2.hoa_don_id
     where h.lich_hen_id is null or not exists (select 1 from public.lich_hen l where l.id = h.lich_hen_id and l.doi_tac_id = p_dt)
  ), tat_ca as (
    select 'L' || l.id khoa, (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date ngay, l.khach_id,
           case when l.trang_thai = 'huy' then 'da_huy' when l.trang_thai = 'khong_den' then 'khong_den'
                when l.trang_thai in ('cho_phuc_vu', 'dang_phuc_vu', 'hoan_thanh') then 'da_den' else 'cho_den' end tt, l.co_hd, l.st, l.moc
      from lich l
    union all
    select 'H' || e.id, e.ngay_hd, e.khach_id, 'hoa_don', true, e.st, e.dau from le e
  ), fifo as (
    select t.*, coalesce(sum(greatest(t.st, 0)) over (order by t.moc, t.khoa rows between unbounded preceding and 1 preceding), 0) truoc from tat_ca t
  ), chi as (select coalesce(sum(so_tien) filter (where trang_thai = 'da_chi'), 0)::bigint v from public.yeu_cau_rut_hh where doi_tac_id = p_dt)
  select f.khoa, f.ngay, public.ctv_che_ten(k.ho_ten), public.ctv_che_sdt(k.dien_thoai), f.tt, f.co_hd, f.st,
         least(greatest(chi.v - f.truoc, 0), greatest(f.st, 0))::bigint,
         case when f.st <= 0 then '' when chi.v - f.truoc >= f.st then 'da_tt' when chi.v - f.truoc > 0 then 'mot_phan' else 'chua_tt' end
    from fifo f cross join chi left join public.khach_hang k on k.id = f.khach_id
   where f.ngay between p_tu and p_den
     and (coalesce(p_loc, '') = '' or (p_loc = 'co_hoa_don' and f.co_hd) or (p_loc = f.tt) or (p_loc = 'da_den' and f.tt = 'hoa_don'))
   order by f.ngay desc, f.khoa
   limit 2000
$$;

-- Đối soát: bút toán của nguồn trong kỳ (theo ngày hoá đơn), gộp theo hoá đơn + loại bút toán + ngày ghi; không có tên dịch vụ.
create or replace function public.ctv_doi_soat(p_dt uuid, p_tu date, p_den date)
returns table (ngay_hd date, ngay_ghi date, ma_hd text, ten_che text, loai text, doanh_so bigint, ty_le text, hoa_hong bigint)
language sql stable set search_path = public, pg_temp as $$
  select b.ngay_hd, (b.ghi_luc at time zone 'Asia/Ho_Chi_Minh')::date, max(b.ma_hd), public.ctv_che_ten(max(k.ho_ten)), b.loai,
         sum(b.doanh_so)::bigint,
         case when count(distinct coalesce(b.kieu, '') || ':' || coalesce(b.gia_tri::text, '')) = 1 then
           case max(b.kieu) when 'phan_tram' then (case when max(b.gia_tri) = trunc(max(b.gia_tri)) then trunc(max(b.gia_tri))::text else rtrim(max(b.gia_tri)::text, '0') end) || '%' when 'tien' then to_char(max(b.gia_tri), 'FM999G999G999') || ' đ' else '' end
         else 'Nhiều mức' end,
         sum(b.so_tien)::bigint
    from public.but_toan_hh_gt b left join public.hoa_don h on h.id = b.hoa_don_id left join public.khach_hang k on k.id = h.khach_id
   where b.doi_tac_id = p_dt and b.ngay_hd between p_tu and p_den
   group by b.hoa_don_id, b.ngay_hd, (b.ghi_luc at time zone 'Asia/Ho_Chi_Minh')::date, b.loai
   order by b.ngay_hd desc, 2 desc
   limit 5000
$$;

-- Dọn mã xác thực cũ (hơn 30 ngày) để bảng không phình; gọi từ cron gửi thư.
create or replace function public.ctv_don_ma_cu() returns int language plpgsql set search_path = public, pg_temp as $$
declare n int;
begin
  delete from public.ctv_ma_xac_thuc where tao_luc < now() - interval '30 days';
  get diagnostics n = row_count;
  return n;
end $$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
