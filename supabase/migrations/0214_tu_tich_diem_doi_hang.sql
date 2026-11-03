-- 0214 — TỰ CỘNG ĐIỂM KHI CHỐT ĐƠN + TỰ ĐỔI HẠNG THEO ĐIỂM như SalonHero (đợt 3, 03/11/2026, mục 222/223/224).
-- SalonHero (sổ điểm ORDER_REWARD_POINT đã chuyển sang): điểm = floor(tiền đơn / tiền cho 1 điểm của hạng khách) — 100.000đ = 1 điểm ở cả 5 hạng,
--   tính trên TỔNG ĐƠN (đơn 34.520.000 còn nợ 15.000.000 vẫn cộng 345 điểm), mọi loại dòng (dịch vụ, sản phẩm, thẻ).
-- AMIA: đọc đúng cài đặt màn "Điểm khách hàng" (trước đây lưu được nhưng chưa có hiệu lực):
--   diem.tich_bat (áp dụng tích điểm, mặc định bật), diem.tich_dv / tich_sp / tich_the (loại dòng được tính), tiền cho 1 điểm theo hạng = hang_diem_cau_hinh.tien_moi_diem
--   (hạng chưa cấu hình → diem.tich_tien → 100.000đ). Cơ sở = tiền các dòng được tính, trừ phần giảm giá cả đơn chia theo tỉ lệ.
-- CHỈ đơn lập ở AMIA: bỏ qua la_lich_su / sh_id / số dư đầu → đồng bộ đêm (ghi đơn SalonHero hoan_thanh mỗi đêm) KHÔNG sinh điểm.
-- Chốt lại sau khi sửa (mo_lai_hoa_don → chốt): chỉ ghi phần CHÊNH so với điểm đã cộng cho đơn đó; đổi khách khi sửa thì trừ lại điểm của khách cũ.
-- Huỷ đơn: trg_hoan_diem_khi_huy nay hoàn cả điểm đã cộng (trước chỉ hoàn điểm đã đổi). Sổ điểm vẫn chỉ-thêm.
-- Tự đổi hạng (diem.tu_dong_hang, mặc định bật): điểm tích luỹ (mọi dòng sổ trừ dòng đổi điểm) đạt ngưỡng diem.nguong_* thì nâng hang_goc lên hạng đó
--   (chỉ nâng, không hạ; hạng hiển thị vẫn = cao hơn giữa hạng này và hạng theo chi 12 tháng ở v_khach_hang). Đồng bộ đêm vẫn ghi đè hang_goc của khách SalonHero
--   bằng hạng SalonHero (đúng: SalonHero cũng tự đổi hạng).

create or replace function public.diem_cong_hoa_don(p_id uuid) returns void language plpgsql as $$
declare
  h public.hoa_don; v_ch jsonb; v_hang text; v_tien bigint; v_tong numeric; v_co numeric; v_base numeric; v_muc int; v_da int; r record;
begin
  select * into h from public.hoa_don where id = p_id;
  if h.id is null or h.la_lich_su or h.sh_id is not null or coalesce(h.la_so_du_dau, false) or h.trang_thai <> 'hoan_thanh' then return; end if;
  -- Đổi khách khi sửa hoá đơn: trừ lại điểm đã cộng cho khách cũ.
  for r in select khach_id, sum(so_diem)::int s from public.khach_diem_so
            where hoa_don_id = p_id and loai = 'cong_hoa_don' and khach_id is distinct from h.khach_id group by khach_id having sum(so_diem) <> 0 loop
    insert into public.khach_diem_so (khach_id, loai, so_diem, ly_do, hoa_don_id, chi_nhanh_id)
      values (r.khach_id, 'cong_hoa_don', -r.s, 'Trừ điểm hoá đơn ' || h.ma || ' (hoá đơn đã đổi sang khách khác)', p_id, h.chi_nhanh_id);
  end loop;
  if h.khach_id is null then return; end if;
  select coalesce(jsonb_object_agg(khoa, gia_tri), '{}'::jsonb) into v_ch from public.cau_hinh where khoa like 'diem.%';
  v_muc := 0;
  if coalesce(v_ch ->> 'diem.tich_bat', '1') = '1' then
    select k.hang into v_hang from public.v_khach_hang k where k.id = h.khach_id;
    select c.tien_moi_diem into v_tien from public.hang_diem_cau_hinh c where c.hang = coalesce(v_hang, 'Thường');
    v_tien := coalesce(v_tien, nullif(v_ch ->> 'diem.tich_tien', '')::bigint, 100000);
    select coalesce(sum(d.thanh_tien), 0),
           coalesce(sum(d.thanh_tien) filter (where (d.loai = 'dich_vu' and coalesce(v_ch ->> 'diem.tich_dv', '1') = '1')
                                                 or (d.loai = 'san_pham' and coalesce(v_ch ->> 'diem.tich_sp', '1') = '1')
                                                 or (d.loai = 'goi_the' and coalesce(v_ch ->> 'diem.tich_the', '1') = '1')), 0)
      into v_tong, v_co from public.hoa_don_dong d where d.hoa_don_id = p_id;
    v_base := case when v_tong > 0 then greatest(v_co - h.giam_gia_don * v_co / v_tong, 0) else 0 end;
    if v_tien > 0 then v_muc := floor(v_base / v_tien)::int; end if;
  end if;
  select coalesce(sum(so_diem), 0)::int into v_da from public.khach_diem_so where hoa_don_id = p_id and loai = 'cong_hoa_don' and khach_id = h.khach_id;
  if v_muc <> v_da then
    insert into public.khach_diem_so (khach_id, loai, so_diem, ly_do, hoa_don_id, chi_nhanh_id)
      values (h.khach_id, 'cong_hoa_don', v_muc - v_da,
              case when v_da = 0 then 'Cộng điểm hoá đơn ' || h.ma else 'Điều chỉnh điểm hoá đơn ' || h.ma || ' sau khi sửa (' || v_da || ' → ' || v_muc || ')' end, p_id, h.chi_nhanh_id);
  end if;
end $$;

create or replace function public.trg_diem_khi_chot() returns trigger language plpgsql as $$
begin
  perform public.diem_cong_hoa_don(new.id);
  return null;
end $$;
drop trigger if exists hoa_don_cong_diem on public.hoa_don;
create trigger hoa_don_cong_diem after update of trang_thai on public.hoa_don
  for each row when (new.trang_thai = 'hoan_thanh' and old.trang_thai is distinct from 'hoan_thanh' and not new.la_lich_su and new.sh_id is null)
  execute function public.trg_diem_khi_chot();

-- Huỷ: hoàn lại MỌI điểm của hoá đơn (điểm đã đổi lẫn điểm đã cộng), đúng một lần.
create or replace function public.trg_hoan_diem_khi_huy() returns trigger language plpgsql as $$
declare r record;
begin
  if new.trang_thai = 'huy' and old.trang_thai <> 'huy' then
    for r in select khach_id, sum(so_diem)::int s from public.khach_diem_so where hoa_don_id = new.id group by khach_id having sum(so_diem) <> 0 loop
      insert into public.khach_diem_so (khach_id, loai, so_diem, ly_do, hoa_don_id, chi_nhanh_id, nguoi_id)
        values (r.khach_id, 'hoan_hoa_don', -r.s, 'Hoàn điểm do huỷ hoá đơn ' || new.ma, new.id, new.chi_nhanh_id, null);
    end loop;
  end if;
  return null;
end $$;

-- mo_lai_hoa_don (0210) chặn sửa đơn "có đổi điểm" bằng sum(so_diem) < 0 — nay đơn còn có điểm CỘNG nên chỉ xét dòng đổi điểm.
do $$
declare v_def text; v_moi text;
begin
  select pg_get_functiondef('public.mo_lai_hoa_don(uuid, text, uuid)'::regprocedure) into v_def;
  v_moi := replace(v_def, 'from public.khach_diem_so where hoa_don_id = p_id), 0) < 0', 'from public.khach_diem_so where hoa_don_id = p_id and loai = ''doi_diem''), 0) < 0');
  if v_moi = v_def then raise exception '0214: không tìm thấy đoạn kiểm đổi điểm trong mo_lai_hoa_don'; end if;
  execute v_moi;
end $$;

-- Tự đổi hạng theo điểm tích luỹ.
create or replace function public.trg_diem_doi_hang() returns trigger language plpgsql as $$
declare v_ch jsonb;
begin
  select coalesce(jsonb_object_agg(khoa, gia_tri), '{}'::jsonb) into v_ch from public.cau_hinh where khoa like 'diem.%';
  if coalesce(v_ch ->> 'diem.tu_dong_hang', '1') <> '1' then return null; end if;
  with kh as (select distinct khach_id from moi where sh_id is null and not la_lich_su and nhap_dot is null),
  tich as (select s.khach_id, sum(s.so_diem) filter (where s.loai <> 'doi_diem') d from public.khach_diem_so s join kh using (khach_id) group by s.khach_id),
  nguong as (select * from (values ('Bạc', coalesce(nullif(v_ch ->> 'diem.nguong_bac', '')::bigint, 200)), ('Vàng', coalesce(nullif(v_ch ->> 'diem.nguong_vang', '')::bigint, 350)),
                                   ('Bạch kim', coalesce(nullif(v_ch ->> 'diem.nguong_bach_kim', '')::bigint, 500)), ('Kim cương', coalesce(nullif(v_ch ->> 'diem.nguong_kim_cuong', '')::bigint, 1000))) x(hang, diem)),
  dat as (select t.khach_id, (select hk.ten from nguong n join public.hang_khach hk on hk.ten = n.hang where n.diem <= t.d order by hk.thu_tu desc limit 1) hang from tich t)
  update public.khach_hang k set hang_goc = dat.hang
    from dat join public.hang_khach moi_h on moi_h.ten = dat.hang
   where k.id = dat.khach_id and dat.hang is not null
     and moi_h.thu_tu > coalesce((select c.thu_tu from public.hang_khach c where c.ten = k.hang_goc), 0);
  return null;
end $$;
drop trigger if exists khach_diem_so_doi_hang on public.khach_diem_so;
create trigger khach_diem_so_doi_hang after insert on public.khach_diem_so
  referencing new table as moi for each statement execute function public.trg_diem_doi_hang();

update public.cau_hinh set ghi_chu = '1 = áp dụng quy đổi tiền thành điểm: tự cộng điểm khi chốt hoá đơn lập ở AMIA (0214)' where khoa = 'diem.tich_bat';
update public.cau_hinh set ghi_chu = '1 = tự nâng hạng khách khi điểm tích luỹ đạt ngưỡng (0214)' where khoa = 'diem.tu_dong_hang';

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
