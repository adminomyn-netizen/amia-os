-- 0085 — HOA HỒNG THEO THỰC THU + HOA HỒNG GIỚI THIỆU (báo cáo; không đổi cách tính hoa hồng theo hoá đơn của bc_nhan_vien).
--
-- Hoa hồng theo THỰC THU: hoa hồng chỉ tính trên phần tiền khách ĐÃ TRẢ THẬT, theo NGÀY THU của từng khoản thanh toán (không phải ngày hoá đơn):
--   • mỗi khoản thu (+) / hoàn (−) trong kỳ lấy phần  so_tien ÷ tong_phai_thu  của hoá đơn, nhân doanh số từng dòng × tỉ lệ chia người × tỉ lệ hoa hồng;
--   • hoá đơn thanh toán đủ trong kỳ → đúng bằng hoa hồng theo hoá đơn; còn nợ thì chỉ tính phần đã thu, phần thu sau (thu nợ) tính vào kỳ có ngày thu;
--   • "tiền thật" = tiền mặt + chuyển khoản + quẹt thẻ (cùng định nghĩa Thực thu của báo cáo doanh thu); phần trả bằng thẻ tiền khách nạp trước
--     được tách ra cột riêng (hoa_hong_the) để màn hình cho chọn gộp hoặc không.
-- Nguồn khoản thu: thanh_toan (loai thu/hoan); người hưởng: dong_nhan_vien (vai phục vụ / tư vấn / bán); doanh số dòng: v_doanh_so_dong (đã chia giảm giá cả đơn).
-- Hoa hồng GIỚI THIỆU: (1) hoá đơn có người giới thiệu là khách (hoa_don.nguoi_gioi_thieu_id) × tỉ lệ vai 'gioi_thieu' đang cài (chưa cài = 0);
--   (2) số tiền SalonHero đã tính cho người giới thiệu (dong_hoa_hong_goc vai gioi_thieu) giữ ĐÚNG số cũ.

-- Tỉ lệ hoa hồng dùng chung một chỗ (bước sau mở rộng theo nhân viên/nhóm chỉ cần sửa hàm này). p_nv hiện chưa dùng.
create function public.hh_ti_le(p_loai text, p_vai text, p_muc uuid, p_nv uuid default null) returns numeric
language sql stable as $$
  select coalesce(
    (select r.ti_le from public.hoa_hong_ti_le r where r.loai = p_loai and r.vai = p_vai and r.muc_id = p_muc),
    (select r.ti_le from public.hoa_hong_ti_le r where r.loai = p_loai and r.vai = p_vai and r.muc_id is null), 0)
$$;

-- Cho phép cài tỉ lệ cho vai 'gioi_thieu' (dong_nhan_vien không có vai này nên bc_nhan_vien không bị ảnh hưởng).
alter table public.hoa_hong_ti_le drop constraint hoa_hong_ti_le_vai_check;
alter table public.hoa_hong_ti_le add constraint hoa_hong_ti_le_vai_check check (vai in ('phuc_vu', 'tu_van', 'ban', 'gioi_thieu'));

create function public.bc_hoa_hong_thuc_thu(p_tu date, p_den date, p_cn uuid default null)
returns table (nhan_vien_id uuid, vai text, chi_nhanh_id uuid, nguon text, so_hd int, doanh_so_tien bigint, hoa_hong_tien bigint, doanh_so_the bigint, hoa_hong_the bigint)
language sql stable as $$
  with tt as (
    select t.hoa_don_id,
           sum(case when t.phuong_thuc <> 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as tien,
           sum(case when t.phuong_thuc = 'the_tien' then (case t.loai when 'thu' then t.so_tien else -t.so_tien end) else 0 end)::numeric as the
      from public.thanh_toan t join public.hoa_don h on h.id = t.hoa_don_id
     where t.ngay between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn)
     group by t.hoa_don_id)
  select c.nhan_vien_id, c.vai, h.chi_nhanh_id, case when h.ngay_hd < p_tu then 'cu' else 'moi' end, count(distinct h.id)::int,
         round(sum(v.doanh_so * c.ti_le / 100 * tt.tien / h.tong_phai_thu))::bigint,
         round(sum(v.doanh_so * c.ti_le / 100 * tt.tien / h.tong_phai_thu * public.hh_ti_le(v.loai, c.vai, v.muc_id, c.nhan_vien_id) / 100))::bigint,
         round(sum(v.doanh_so * c.ti_le / 100 * tt.the / h.tong_phai_thu))::bigint,
         round(sum(v.doanh_so * c.ti_le / 100 * tt.the / h.tong_phai_thu * public.hh_ti_le(v.loai, c.vai, v.muc_id, c.nhan_vien_id) / 100))::bigint
    from tt join public.hoa_don h on h.id = tt.hoa_don_id
    join public.v_doanh_so_dong v on v.hoa_don_id = h.id
    join public.dong_nhan_vien c on c.dong_id = v.dong_id
   group by c.nhan_vien_id, c.vai, h.chi_nhanh_id, 4
$$;

-- Đối chiếu hoa hồng theo hoá đơn (bc_nhan_vien, ngày hoá đơn) với hoa hồng theo thực thu, giải thích phần lệch. Một dòng.
--   theo_hoa_don = hoa hồng của mọi hoá đơn LẬP trong kỳ (như tab Theo nhân viên)
--   thuc_thu_don_moi / tru_the_don_moi = phần đã thu trong kỳ của chính các hoá đơn lập trong kỳ
--   con_no_cuoi_ky = phần chưa thu tính đến hết kỳ của các hoá đơn lập trong kỳ (nợ + khoản thu sau kỳ)
--   thu_no_cu / tru_the_no_cu = khoản thu trong kỳ của hoá đơn lập TRƯỚC kỳ (thu nợ sau)
--   khac = phần còn lại (làm tròn, khoản thu có ngày trước ngày hoá đơn) = theo_hoa_don − thuc_thu_don_moi − tru_the_don_moi − con_no_cuoi_ky
create function public.bc_hoa_hong_doi_chieu(p_tu date, p_den date, p_cn uuid default null)
returns table (theo_hoa_don bigint, thuc_thu_don_moi bigint, tru_the_don_moi bigint, con_no_cuoi_ky bigint, thu_no_cu bigint, tru_the_no_cu bigint, khac bigint)
language sql stable as $$
  with a as (select coalesce(sum(x.hoa_hong), 0)::bigint as v from public.bc_nhan_vien(p_tu, p_den, p_cn) x),
  b as (select coalesce(sum(x.hoa_hong_tien) filter (where x.nguon = 'moi'), 0)::bigint as moi_tien, coalesce(sum(x.hoa_hong_the) filter (where x.nguon = 'moi'), 0)::bigint as moi_the,
               coalesce(sum(x.hoa_hong_tien) filter (where x.nguon = 'cu'), 0)::bigint as cu_tien, coalesce(sum(x.hoa_hong_the) filter (where x.nguon = 'cu'), 0)::bigint as cu_the
          from public.bc_hoa_hong_thuc_thu(p_tu, p_den, p_cn) x),
  n as (
    select coalesce(round(sum(v.doanh_so * c.ti_le / 100 * public.hh_ti_le(v.loai, c.vai, v.muc_id, c.nhan_vien_id) / 100
                              * greatest(h.tong_phai_thu - coalesce(p.da, 0), 0)::numeric / h.tong_phai_thu)), 0)::bigint as v
      from public.hoa_don h
      join public.v_doanh_so_dong v on v.hoa_don_id = h.id
      join public.dong_nhan_vien c on c.dong_id = v.dong_id
      left join lateral (select sum(case t.loai when 'thu' then t.so_tien else -t.so_tien end) as da from public.thanh_toan t where t.hoa_don_id = h.id and t.ngay <= p_den) p on true
     where h.ngay_hd between p_tu and p_den and h.trang_thai = 'hoan_thanh' and h.tong_phai_thu > 0 and not h.la_so_du_dau and (p_cn is null or h.chi_nhanh_id = p_cn))
  select a.v, b.moi_tien, b.moi_the, n.v, b.cu_tien, b.cu_the, a.v - b.moi_tien - b.moi_the - n.v from a, b, n
$$;

-- Hoa hồng giới thiệu theo người giới thiệu. nguon = 'khach' (khách giới thiệu ghi trên hoá đơn, tính theo tỉ lệ vai gioi_thieu đang cài)
-- hoặc 'salonhero' (số SalonHero đã tính, giữ nguyên). nguoi_khoa: khach_hang.id / nhan_vien.id / 'sh:<mã SalonHero chưa ghép được>'.
create function public.bc_hoa_hong_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon text, nguoi_khoa text, nguoi_ten text, nguoi_ma text, nguoi_dt text, so_hd int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select 'khach', k.id::text, k.ho_ten, k.ma, k.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint,
         round(sum(v.doanh_so * public.hh_ti_le(v.loai, 'gioi_thieu', v.muc_id, null) / 100))::bigint
    from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.khach_hang k on k.id = h.nguoi_gioi_thieu_id
   where h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by k.id, k.ho_ten, k.ma, k.dien_thoai
  union all
  select 'salonhero', coalesce(n.id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')), coalesce(n.ho_ten, g.ten_nguoi, 'SalonHero #' || coalesce(g.sh_nhan_vien_id::text, '?') || ' (chưa ghép)'),
         n.ma_nv, null, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint, round(sum(g.gia_tri))::bigint
    from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = g.nhan_vien_id
   where g.vai = 'gioi_thieu' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 2, 3, n.ma_nv
$$;

select public.khoa_tat_ca_bang();
