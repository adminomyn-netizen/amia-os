-- 0180 — CHUẨN HOÁ KHO VẬT TƯ (chị Lâm 30/10/2026, việc 61424/61425, BƯỚC 1/3).
--  (a) public.chuan_don_vi: gộp cách viết đồng nghĩa của đơn vị về một dạng chuẩn (cái/Cái, miếng/Miếng, Gr/g, shoot/Shot, ui/UI ...). CHỈ gộp cùng nghĩa,
--      không gộp Chai/Lọ/Hộp. Danh sách khớp src/lib/chuan-hoa-kho.ts (có test so khớp). Chỉ bảng san_pham lưu đơn vị nên số lượng trong sổ kho không đổi.
--  (b) trigger giữ đơn vị luôn ở dạng chuẩn khi thêm/sửa/nhập hàng loạt về sau; gộp ngay các dòng đang có.
--  (c) kiểm kê TỒN ĐẦU: phiếu loại 'ton_dau', dòng phiếu ghi được số lô + hạn dùng; khi duyệt, phần thực tế nhiều hơn sổ được ghi là dòng 'nhap' có ghi chú
--      "Tồn đầu kỳ ..." (các báo cáo kho coi là SỐ DƯ ĐẦU, đúng quy ước 0121); phần ít hơn vẫn là dòng 'kiem_ke' như thường.
--  (d) kho_ton_sh_tham_chieu: tồn cuối SalonHero chốt 28/10 (nạp bằng scripts/kho/nap-ton-salonhero.mjs) để trang /kho/chuan-hoa đối chiếu với sổ kho AMIA.
--      Chỉ đọc để đối chiếu, KHÔNG làm đổi tồn.

create function public.chuan_don_vi(p text) returns text language sql immutable set search_path = public, pg_temp as $$
  select case when p is null then null
         else coalesce((select v.chuan from (values
    ('gr','g'), ('GR','g'), ('Gr','g'), ('g','g'), ('G','g'), ('gram','g'),
    ('GRAM','g'), ('Gram','g'), ('gam','g'), ('GAM','g'), ('Gam','g'), ('ml','ml'),
    ('ML','ml'), ('Ml','ml'), ('mg','mg'), ('MG','mg'), ('Mg','mg'), ('ui','UI'),
    ('UI','UI'), ('Ui','UI'), ('iu','UI'), ('IU','UI'), ('Iu','UI'), ('shot','Shot'),
    ('SHOT','Shot'), ('Shot','Shot'), ('shoot','Shot'), ('SHOOT','Shot'), ('Shoot','Shot'), ('shots','Shot'),
    ('SHOTS','Shot'), ('Shots','Shot'), ('line','Line'), ('LINE','Line'), ('Line','Line'), ('lines','Line'),
    ('LINES','Line'), ('Lines','Line'), ('đầu','Đầu'), ('ĐẦU','Đầu'), ('Đầu','Đầu'), ('chai','Chai'),
    ('CHAI','Chai'), ('Chai','Chai'), ('lọ','Lọ'), ('LỌ','Lọ'), ('Lọ','Lọ'), ('hộp','Hộp'),
    ('HỘP','Hộp'), ('Hộp','Hộp'), ('tuýp','Tuýp'), ('TUÝP','Tuýp'), ('Tuýp','Tuýp'), ('gói','Gói'),
    ('GÓI','Gói'), ('Gói','Gói'), ('cái','Cái'), ('CÁI','Cái'), ('Cái','Cái'), ('miếng','Miếng'),
    ('MIẾNG','Miếng'), ('Miếng','Miếng'), ('viên','Viên'), ('VIÊN','Viên'), ('Viên','Viên'), ('vỉ','Vỉ'),
    ('VỈ','Vỉ'), ('Vỉ','Vỉ'), ('bộ','Bộ'), ('BỘ','Bộ'), ('Bộ','Bộ')
         ) as v(bien, chuan) where v.bien = btrim(regexp_replace(p, '\s+', ' ', 'g')) limit 1), btrim(regexp_replace(p, '\s+', ' ', 'g'))) end
$$;

create function public.trg_san_pham_chuan_don_vi() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.don_vi := public.chuan_don_vi(new.don_vi);
  new.don_vi_mua := public.chuan_don_vi(new.don_vi_mua);
  return new;
end $$;
create trigger san_pham_chuan_don_vi before insert or update of don_vi, don_vi_mua on public.san_pham
  for each row execute function public.trg_san_pham_chuan_don_vi();

-- Gộp các dòng đang có (chỉ đổi chữ đơn vị).
update public.san_pham set don_vi = public.chuan_don_vi(don_vi), don_vi_mua = public.chuan_don_vi(don_vi_mua)
 where don_vi is distinct from public.chuan_don_vi(don_vi) or don_vi_mua is distinct from public.chuan_don_vi(don_vi_mua);

-- Kiểm kê tồn đầu.
alter table public.phieu_kiem_ke drop constraint phieu_kiem_ke_loai_check;
alter table public.phieu_kiem_ke add constraint phieu_kiem_ke_loai_check check (loai in ('thang', 'dot_xuat', 'ton_dau'));
alter table public.phieu_kiem_ke_dong add column so_lo text, add column han_dung date;

create or replace function public.duyet_phieu_kiem_ke(p_phieu uuid, p_nguoi uuid, p_bo_qua_kiem boolean default false) returns void
language plpgsql set search_path = public, pg_temp as $$
declare p public.phieu_kiem_ke; d record; v_lech numeric; v_mo text;
begin
  select * into p from public.phieu_kiem_ke where id = p_phieu for update;
  if not found then raise exception 'Không tìm thấy phiếu kiểm kê.'; end if;
  if p.trang_thai <> 'cho_duyet' then raise exception 'Phiếu chưa gửi duyệt hoặc đã xử lý.'; end if;
  if not p_bo_qua_kiem and (p.nguoi_lap_id = p_nguoi or p.nguoi_dem_2_id = p_nguoi) then raise exception 'Người duyệt phải khác người đếm.'; end if;
  for d in select * from public.phieu_kiem_ke_dong where phieu_id = p.id and ton_thuc is not null loop
    v_lech := d.ton_thuc - d.ton_so;
    v_mo := 'sổ ' || trim(to_char(d.ton_so, 'FM999999990.###')) || ', thực tế ' || trim(to_char(d.ton_thuc, 'FM999999990.###'));
    if v_lech > 0 and p.loai = 'ton_dau' then
      insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, so_lo, han_dung, ghi_chu, nguoi_id)
        values (p.chi_nhanh_id, d.san_pham_id, 'nhap', v_lech, nullif(btrim(d.so_lo), ''), d.han_dung, 'Tồn đầu kỳ (kiểm kê ' || p.ma || '): ' || v_mo, p_nguoi);
    elsif v_lech <> 0 then
      insert into public.kho_so_cai (chi_nhanh_id, san_pham_id, loai, so_luong, ghi_chu, nguoi_id)
        values (p.chi_nhanh_id, d.san_pham_id, 'kiem_ke', v_lech, 'Kiểm kê ' || p.ma || ': ' || v_mo, p_nguoi);
    end if;
  end loop;
  update public.phieu_kiem_ke set trang_thai = 'da_duyet', nguoi_duyet_id = p_nguoi, duyet_luc = now() where id = p.id;
end $$;

-- Tồn cuối SalonHero (chốt 28/10) theo chi nhánh. sh_id = mã sản phẩm bên SalonHero (san_pham.sh_id).
create table public.kho_ton_sh_tham_chieu (
  chi_nhanh_id uuid not null references public.chi_nhanh (id),
  sh_id bigint not null,
  san_pham_id uuid references public.san_pham (id) on delete set null,
  ten_sh text not null,
  ton_cuoi numeric(14,3) not null,
  nguon text not null default 'SalonHero chốt 28/10/2026',
  nap_luc timestamptz not null default now(),
  primary key (chi_nhanh_id, sh_id)
);
create index kho_ton_sh_tham_chieu_sp_idx on public.kho_ton_sh_tham_chieu (san_pham_id);

select public.khoa_tat_ca_bang();
