-- 0342 — GỢI Ý LỊCH HẸN SẮP ĐẾN THEO DỊCH VỤ (chị Diệu Thuý qua chị Lâm 18/11/2026: "liệu trình exion cách nhau 7 ngày, chăm sóc da 7 ngày, Mfu 5 tháng,
--        peel cách nhau 30 ngày nhưng phải tái khám chăm sóc sau 1 tuần … hiện thông báo sắp tới lịch, lọc được để nhắc khách đi đúng liệu trình, phần này cho chị set").
-- • dich_vu.khoang_cach_ngay: số ngày tới BUỔI KẾ TIẾP của liệu trình; dich_vu.tai_kham_sau_ngay: số ngày tới lần TÁI KHÁM / chăm sóc sau làm.
--   Một dịch vụ có thể đặt cả hai (peel: buổi kế 30 ngày + tái khám 7 ngày) → một lần làm sinh hai gợi ý.
-- • Lần làm gần nhất của (khách, dịch vụ) = muộn nhất của: lượt chờ làm đã xong (buoi_cho_lam), buổi thực hiện thẻ (buoi_thuc_hien),
--   lịch hẹn hoàn thành có dịch vụ đó, dòng dịch vụ trên hoá đơn (kể cả lịch sử SalonHero: dòng không có mã dịch vụ thì khớp theo TÊN dịch vụ,
--   hoặc theo tên gói thẻ chỉ gồm đúng một dịch vụ).
-- • Tái khám: chỉ gợi ý tới max(số ngày tái khám, 7) ngày sau hạn, và bỏ khi khách đã quay lại sau lần làm.
-- • Chi nhánh = chi nhánh hồ sơ khách (Đà Lạt đã đóng, khách đã chuyển về Vinh), thiếu thì lấy nơi làm gần nhất.
-- • lich_goi_y_xu_ly: đã gọi / đã hẹn / bỏ qua theo (khách, dịch vụ, loại, lần làm). Khách làm lại buổi mới thì lần làm đổi nên gợi ý mới tự mở.
-- Chỉ THÊM cột/bảng/hàm. Không đụng tiền, thẻ, kho; không gửi tin cho khách.
set lock_timeout = '4s';

alter table public.dich_vu add column if not exists khoang_cach_ngay int check (khoang_cach_ngay is null or khoang_cach_ngay between 1 and 730);
alter table public.dich_vu add column if not exists tai_kham_sau_ngay int check (tai_kham_sau_ngay is null or tai_kham_sau_ngay between 1 and 365);
comment on column public.dich_vu.khoang_cach_ngay is 'Số ngày từ lần làm tới buổi kế tiếp của liệu trình (gợi ý lịch hẹn, 0342)';
comment on column public.dich_vu.tai_kham_sau_ngay is 'Số ngày từ lần làm tới lần tái khám / chăm sóc sau làm (gợi ý lịch hẹn, 0342)';

insert into public.cau_hinh (khoa, gia_tri, ghi_chu) values
  ('goi_y_lich_bao_truoc_ngay', '3', 'Gợi ý lịch hẹn: hiện khách khi còn ≤ số ngày này tới ngày nên hẹn'),
  ('goi_y_lich_tre_toi_da_ngay', '60', 'Gợi ý lịch hẹn: quá ngày nên hẹn quá số ngày này thì thôi gợi ý')
on conflict (khoa) do nothing;

create table if not exists public.lich_goi_y_xu_ly (
  khach_id uuid not null references public.khach_hang (id),
  dich_vu_id uuid not null references public.dich_vu (id),
  loai text not null check (loai in ('buoi_ke', 'tai_kham')),
  lan_cuoi date not null,
  trang_thai text check (trang_thai is null or trang_thai in ('da_goi', 'da_hen', 'bo_qua')),
  ghi_chu text check (ghi_chu is null or char_length(ghi_chu) <= 300),
  nhac_id uuid references public.khach_nhac (id),
  nguoi_id uuid references public.nhan_vien (id),
  tao_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now(),
  primary key (khach_id, dich_vu_id, loai, lan_cuoi)
);
alter table public.lich_goi_y_xu_ly enable row level security;
alter table public.lich_goi_y_xu_ly force row level security;
drop policy if exists chan_het on public.lich_goi_y_xu_ly;
create policy chan_het on public.lich_goi_y_xu_ly for all to anon, authenticated using (false) with check (false);
revoke all on public.lich_goi_y_xu_ly from anon, authenticated;

-- p_tt: 'can' (chưa xử lý + đã gọi, mặc định) · 'da_hen' · 'bo_qua' · 'tat_ca'. p_loai: null | 'buoi_ke' | 'tai_kham'.
create or replace function public.ds_goi_y_lich(p_cn uuid default null, p_dich_vu uuid default null, p_loai text default null, p_bao_truoc int default null,
  p_tre_toi_da int default null, p_tt text default 'can', p_khach uuid default null, p_gioi_han int default 500, p_nhom uuid default null)
returns table (tong bigint, khach_id uuid, ma text, ho_ten text, dien_thoai text, dich_vu_id uuid, ten_dich_vu text, loai text, so_ngay int, lan_cuoi date,
               den_han date, so_ngay_con int, ke_tiep_ngay date, lich_sap_toi date, trang_thai text, ghi_chu text, nhac_id uuid, chi_nhanh_id uuid)
language sql stable as $$
  with cfg as (
    select public.hom_nay() hn,
           coalesce(p_bao_truoc, public.cau_hinh_so('goi_y_lich_bao_truoc_ngay', 3)) bt,
           coalesce(p_tre_toi_da, public.cau_hinh_so('goi_y_lich_tre_toi_da_ngay', 60)) tt),
  dv as (
    select d.id, d.ten, d.khoang_cach_ngay kc, d.tai_kham_sau_ngay tk
      from public.dich_vu d
     where (d.khoang_cach_ngay is not null or d.tai_kham_sau_ngay is not null)
       and (p_dich_vu is null or d.id = p_dich_vu) and (p_nhom is null or d.nhom_id = p_nhom)),
  moc as (select cfg.hn - (select coalesce(max(greatest(coalesce(dv.kc, 0), coalesce(dv.tk, 0))), 0) from dv) - cfg.tt - 1 tu from cfg),
  -- Tên → dịch vụ (dòng hoá đơn lịch sử không có mã): ưu tiên dịch vụ đã đặt khoảng cách, rồi đang hoạt động.
  ten_dv as (
    select distinct on (lower(btrim(d.ten))) lower(btrim(d.ten)) k, d.id
      from public.dich_vu d
     order by lower(btrim(d.ten)), (d.khoang_cach_ngay is not null or d.tai_kham_sau_ngay is not null) desc, d.hoat_dong desc, d.id),
  ten_goi as (
    select lower(btrim(g.ten)) k, (array_agg(distinct gd.dich_vu_id))[1] id
      from public.goi_the g join public.goi_the_dich_vu gd on gd.goi_id = g.id
     group by 1 having count(distinct gd.dich_vu_id) = 1),
  su as (
    select b.khach_id, b.dich_vu_id, b.ngay, b.chi_nhanh_id, b.ke_tiep_ngay
      from public.buoi_cho_lam b, moc where b.trang_thai = 'xong' and b.ngay >= moc.tu
    union all
    select b.khach_id, b.dich_vu_id, b.ngay_lam, b.chi_nhanh_id, null::date
      from public.buoi_thuc_hien b, moc where b.huy_luc is null and b.ngay_lam >= moc.tu
    union all
    select l.khach_id, x.dich_vu_id, (l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date, l.chi_nhanh_id, null::date
      from public.lich_hen l join public.lich_hen_dich_vu x on x.lich_id = l.id, moc
     where l.trang_thai = 'hoan_thanh' and l.bat_dau >= (moc.tu::timestamp at time zone 'Asia/Ho_Chi_Minh')
    union all
    select h.khach_id, coalesce(d.dich_vu_id, td.id, tg.id), h.ngay_hd, h.chi_nhanh_id, null::date
      from public.hoa_don_dong d join public.hoa_don h on h.id = d.hoa_don_id
      cross join moc
      left join ten_dv td on d.dich_vu_id is null and td.k = lower(btrim(d.ten))
      left join ten_goi tg on d.dich_vu_id is null and td.id is null and tg.k = lower(btrim(d.ten))
     where h.trang_thai = 'hoan_thanh' and d.loai = 'dich_vu' and h.ngay_hd >= moc.tu and h.khach_id is not null),
  cuoi as (
    select su.khach_id, su.dich_vu_id, max(su.ngay) lc,
           (array_agg(su.chi_nhanh_id order by su.ngay desc) filter (where su.chi_nhanh_id is not null))[1] cn,
           (array_agg(su.ke_tiep_ngay order by su.ngay desc, su.ke_tiep_ngay desc nulls last))[1] kt
      from su join dv on dv.id = su.dich_vu_id
     where su.khach_id is not null and (p_khach is null or su.khach_id = p_khach)
     group by 1, 2),
  dong as (
    select c.*, dv.ten, 'buoi_ke'::text loai, dv.kc so_ngay, c.lc + dv.kc den from cuoi c join dv on dv.id = c.dich_vu_id where dv.kc is not null
    union all
    select c.*, dv.ten, 'tai_kham'::text, dv.tk, c.lc + dv.tk from cuoi c join dv on dv.id = c.dich_vu_id where dv.tk is not null),
  loc as (
    select d.*, k.ma, k.ho_ten, k.dien_thoai, coalesce(k.chi_nhanh_id, d.cn) cn2, x.trang_thai, x.ghi_chu, x.nhac_id,
           (select min((l.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date) from public.lich_hen l
             where l.khach_id = d.khach_id and l.bat_dau >= now() and l.trang_thai in ('chua_xac_nhan', 'da_xac_nhan', 'cho_phuc_vu', 'dang_phuc_vu')) lich_sap_toi
      from dong d cross join cfg
      join public.khach_hang k on k.id = d.khach_id and (p_khach is not null or not k.an_sh_xoa)
      left join public.lich_goi_y_xu_ly x on x.khach_id = d.khach_id and x.dich_vu_id = d.dich_vu_id and x.loai = d.loai and x.lan_cuoi = d.lc
     where d.den <= cfg.hn + cfg.bt and d.den >= cfg.hn - cfg.tt
       and (p_loai is null or d.loai = p_loai)
       -- Tái khám chỉ có ý nghĩa gần ngày: trễ quá max(số ngày tái khám, 7) thì thôi; khách đã quay lại sau lần làm thì coi như đã tái khám.
       and (d.loai <> 'tai_kham' or (d.den >= cfg.hn - greatest(d.so_ngay, 7)
            and coalesce(k.lan_den_cuoi, d.lc) <= d.lc
            and not exists (select 1 from public.lich_hen l where l.khach_id = d.khach_id and l.trang_thai = 'hoan_thanh'
                             and l.bat_dau >= ((d.lc + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh') and l.bat_dau < now())))
       -- Đã có lịch hẹn sắp tới gồm đúng dịch vụ này → coi như đã hẹn, không gợi ý nữa.
       and not exists (select 1 from public.lich_hen l join public.lich_hen_dich_vu x2 on x2.lich_id = l.id
                        where l.khach_id = d.khach_id and x2.dich_vu_id = d.dich_vu_id and l.bat_dau >= now()
                          and l.trang_thai in ('chua_xac_nhan', 'da_xac_nhan', 'cho_phuc_vu', 'dang_phuc_vu'))
       and (case coalesce(p_tt, 'can') when 'tat_ca' then true when 'can' then x.trang_thai is null or x.trang_thai = 'da_goi' else x.trang_thai = p_tt end))
  select count(*) over ()::bigint, l.khach_id, l.ma, l.ho_ten, l.dien_thoai, l.dich_vu_id, l.ten, l.loai, l.so_ngay, l.lc, l.den, (l.den - cfg.hn)::int,
         l.kt, l.lich_sap_toi, l.trang_thai, l.ghi_chu, l.nhac_id, l.cn2
    from loc l cross join cfg
   where (p_cn is null or l.cn2 = p_cn)
   -- Gọi trước: đến hạn hôm nay / sắp đến (gần nhất trước), rồi tới quá hạn (mới quá trước, quá lâu xuống cuối).
   order by (l.den < cfg.hn), abs(l.den - cfg.hn), l.ho_ten, l.khach_id, l.loai
   limit least(greatest(coalesce(p_gioi_han, 500), 1), 2000);
$$;

revoke all on function public.ds_goi_y_lich(uuid, uuid, text, int, int, text, uuid, int, uuid) from public, anon, authenticated;

-- Chuông: mục mới "goiy" (khách đến hạn liệu trình) phải bấm "đã đọc" được.
alter table public.thong_bao_trang_thai drop constraint if exists thong_bao_trang_thai_ma_check;
alter table public.thong_bao_trang_thai add constraint thong_bao_trang_thai_ma_check
  check (ma in ('lich', 'phieu', 'the', 'no', 'kho', 'han', 'chuyen', 'xuatkhan', 'hdv', 'vb', 'hdld', 'ccvao', 'ccra', 'ccquen', 'luong', 'ccnguoi', 'cckhoa', 'ccnghi', 'klduyet', 'klhan', 'tomtat_tuan', 'tomtat_thang', 'tomtat_nam', 'tonam', 'tdyc', 'tduv', 'tdtin', 'knai', 'bchung', 'lead', 'leadnhac', 'buoicho', 'lichonl', 'phieu-buoi', 'buoidl', 'buoithieu', 'goiy'));

reset lock_timeout;
