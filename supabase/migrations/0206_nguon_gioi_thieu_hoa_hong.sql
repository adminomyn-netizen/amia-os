-- 0206 — NGUỒN GIỚI THIỆU + MỨC HOA HỒNG MẶC ĐỊNH (câu 20, đợt 2, 03/11/2026). CHỈ THÊM cột vào doi_tac_gt + nạp 78 nguồn SalonHero + sửa hàm báo cáo giới thiệu.
-- SalonHero: mỗi "nguồn giới thiệu" (tên, mã, SĐT, loại Đối tác / Nhân viên / Khách hàng) có "Mức hoa hồng mặc định" Theo phần trăm / Theo tiền / Theo điểm (mặc định %).
--   78 nguồn đọc chỉ-đọc ngày 03/11/2026 (ReferralService GET /referral/getList): 70 khách 0%, 3 khách 10%, 3 khách theo tiền (20.000 / 39.000 / 109.000), 1 khách tiền 0, 1 khác 0%; không nguồn nào theo điểm.
-- AMIA: nguồn giới thiệu = bảng doi_tac_gt (đã có, đang 0 dòng). Loại: Khách hàng → khach_cu, Đối tác → ctv, Nhân viên / Khác → khac (loai_sh giữ nguyên chữ SalonHero).
--   Ghép khách: customer_id SalonHero → khach_hang.sh_id; không có thì theo số điện thoại khi chỉ đúng 1 khách có số đó.
-- Hoa hồng giới thiệu tính theo nguồn: hoá đơn có người giới thiệu là khách (hoa_don.nguoi_gioi_thieu_id) mà khách đó là một nguồn →
--   phần trăm: doanh số dòng (sau giảm giá) × %; theo tiền: số tiền × số lượng; theo điểm: 0 đồng (điểm không phải tiền).
--   Khách chưa là nguồn → như cũ (tỉ lệ vai Giới thiệu đang cài, chưa cài = 0). Số SalonHero đã tính sẵn (dong_hoa_hong_goc) giữ đúng số cũ, nay hiện tên nguồn thay vì "SalonHero #id".

alter table public.doi_tac_gt
  add column if not exists sh_id bigint unique,
  add column if not exists loai_sh text,
  add column if not exists khach_id uuid references public.khach_hang (id),
  add column if not exists hh_kieu text not null default 'phan_tram' check (hh_kieu in ('phan_tram', 'tien', 'diem')),
  add column if not exists hh_gia_tri numeric not null default 0 check (hh_gia_tri >= 0),
  add constraint doi_tac_gt_hh_phan_tram check (hh_kieu <> 'phan_tram' or hh_gia_tri <= 100);
create index if not exists doi_tac_gt_khach_idx on public.doi_tac_gt (khach_id) where khach_id is not null;

insert into public.doi_tac_gt (ma, ten, loai, dien_thoai, ma_gioi_thieu, ghi_chu, sh_id, loai_sh, khach_id, hh_kieu, hh_gia_tri)
select 'SH' || x.sh, x.ten, x.loai, x.dt, coalesce(x.ma, 'GT' || x.sh), 'Nguồn giới thiệu SalonHero', x.sh, x.loai_sh,
       coalesce((select k.id from public.khach_hang k where k.sh_id = x.cid),
                (select min(k.id::text)::uuid from public.khach_hang k where x.dt is not null and k.dien_thoai = x.dt having count(*) = 1)),
       x.kieu, x.gt
  from (values
(3683,'Nguyễn Thị Trang',null,'0912026964','khach_cu','CUSTOMER',1829410,'phan_tram',10),
(3685,'Nguyễn Thị Xuân',null,'0988679317','khach_cu','CUSTOMER',1828797,'tien',20000),
(3686,'Phan Diễm Hằng',null,'0975851390','khach_cu','CUSTOMER',1829342,'tien',39000),
(3688,'Phan Diễm Hằng',null,'0975851390','khach_cu','CUSTOMER',1829342,'tien',109000),
(3734,'Nguyễn Thị Thảo',null,'0975555686','khach_cu','CUSTOMER',null,'phan_tram',0),
(3735,'Nguyễn Thị Thùy Dung',null,'0977302721','khach_cu','CUSTOMER',null,'phan_tram',10),
(3736,'Nguyễn Thị Thuỳ Dung',null,'0977302721','khach_cu','CUSTOMER',null,'phan_tram',0),
(3740,'Phan Thị Phương Ca',null,'0944363464','khach_cu','CUSTOMER',null,'phan_tram',0),
(3742,'Thái Thị Hương',null,'0911171878','khach_cu','CUSTOMER',null,'phan_tram',0),
(3743,'Nguyễn Thị Ngọc Châu',null,'097926373','khach_cu','CUSTOMER',null,'phan_tram',0),
(3754,'Nguyễn Thùy Linh',null,'0904419333','khach_cu','CUSTOMER',null,'phan_tram',0),
(3755,'Lê Thị Thanh Tâm',null,'091 676 545','khach_cu','CUSTOMER',null,'phan_tram',0),
(3767,'Nguyễn THị Vân Anh',null,'0973956181','khach_cu','CUSTOMER',null,'phan_tram',0),
(3776,'Hoàng Thị Huyền',null,'0967176666','khach_cu','CUSTOMER',null,'phan_tram',0),
(3779,'Lê Thị Thanh Hương',null,'0975840019','khach_cu','CUSTOMER',null,'phan_tram',0),
(3786,'Vy Thị Thái An',null,'0918807404','khach_cu','CUSTOMER',null,'phan_tram',0),
(3789,'Nguyễn Thị Vân Anh',null,'0973956181','khach_cu','CUSTOMER',null,'phan_tram',0),
(3794,'Hồ Mai Phương',null,'0913646362','khach_cu','CUSTOMER',null,'phan_tram',0),
(3795,'Nguyễn Thị Trang',null,'0355678709','khach_cu','CUSTOMER',null,'phan_tram',0),
(3798,'Nguyễn Thị Thiệp',null,'0978281451','khach_cu','CUSTOMER',null,'phan_tram',0),
(3811,'Đặng Vân Anh',null,'0976056879','khach_cu','CUSTOMER',null,'phan_tram',0),
(3812,'Chế Thị Hoài Phương',null,'0975035678','khach_cu','CUSTOMER',null,'phan_tram',0),
(3815,'Nguyễn Thị Kim Thoa',null,'0945011011','khach_cu','CUSTOMER',null,'phan_tram',0),
(3816,'Đặng Thu Trà',null,'0942112888','khach_cu','CUSTOMER',null,'phan_tram',0),
(3817,'Nguyễn Thị Phương',null,'0395208988','khach_cu','CUSTOMER',null,'phan_tram',0),
(3818,'Alex Cho',null,'0339526225','khach_cu','CUSTOMER',null,'phan_tram',0),
(3819,'Dương Thảo Sương',null,'0828999333','khach_cu','CUSTOMER',null,'phan_tram',0),
(3823,'Nguyễn Thị THanh Hương',null,'0977452012','khac','OTHER',null,'phan_tram',0),
(3829,'Đặng Thị Việt Dung',null,'098636139','khach_cu','CUSTOMER',null,'phan_tram',0),
(3830,'Lê Thị Thanh Huyền',null,'0389232686','khach_cu','CUSTOMER',null,'phan_tram',10),
(3831,'Đậu Thuỳ Linh',null,'0852881388','khach_cu','CUSTOMER',null,'phan_tram',0),
(3833,'Lê Thị Thuỷ',null,'0918023566','khach_cu','CUSTOMER',null,'phan_tram',0),
(3834,'Nguyễn Thị Hà',null,'096897633','khach_cu','CUSTOMER',null,'phan_tram',0),
(3835,'Hoàng Thị Hải Quỳnh',null,'0962761567','khach_cu','CUSTOMER',null,'phan_tram',0),
(3841,'Nguyễn Thị Lan',null,'0985012738','khach_cu','CUSTOMER',null,'phan_tram',0),
(3843,'Nguyễn Thị Xuyên',null,'0914447976','khach_cu','CUSTOMER',null,'phan_tram',0),
(3844,'Đào Thị Lam',null,'0941736226','khach_cu','CUSTOMER',null,'phan_tram',0),
(3848,'Trần Ngọc Mai',null,'0981268826','khach_cu','CUSTOMER',null,'phan_tram',0),
(3849,'Nguyễn Thị Bạch Xoan',null,'0984887838','khach_cu','CUSTOMER',null,'phan_tram',0),
(3851,'Nguyễn Thị Khánh Hoài',null,'0977458375','khach_cu','CUSTOMER',null,'phan_tram',0),
(3852,'Nguyễn Thị Huế',null,'0978877140','khach_cu','CUSTOMER',null,'phan_tram',0),
(3854,'Nguyễn Thị Tân',null,'0858600169','khach_cu','CUSTOMER',null,'phan_tram',0),
(3862,'Phạm phương Chi',null,'0941172889','khach_cu','CUSTOMER',null,'phan_tram',0),
(3866,'Mộc Miên',null,'0888449447','khach_cu','CUSTOMER',null,'phan_tram',0),
(3867,'Hoàng Huyền Trang',null,'0949799779','khach_cu','CUSTOMER',null,'phan_tram',0),
(3888,'Nguyễn Phương Linh',null,'0982838594','khach_cu','CUSTOMER',null,'phan_tram',0),
(3891,'Lê Tường Vy',null,'0325913764','khach_cu','CUSTOMER',null,'phan_tram',0),
(3895,'Jean Garcia',null,'033615544','khach_cu','CUSTOMER',null,'phan_tram',0),
(3897,'Đặng Thị Vân Anh',null,'0868652256','khach_cu','CUSTOMER',null,'phan_tram',0),
(3903,'Nguyễn Thị Thu Hằng',null,'0915214909','khach_cu','CUSTOMER',null,'phan_tram',0),
(3909,'Lê Thùy Dung',null,'0963015737','khach_cu','CUSTOMER',null,'phan_tram',0),
(3918,'Phan Thị Thủy',null,'0988472535','khach_cu','CUSTOMER',null,'phan_tram',0),
(3925,'Lê Thị Linh Chi',null,'0964058388','khach_cu','CUSTOMER',null,'phan_tram',0),
(4020,'Nguyễn LAn Phương',null,'0976145668','khach_cu','CUSTOMER',null,'phan_tram',0),
(4022,'Nguyễn Huyền Minh','Nguyễn Huyền Minh','0983629185','khach_cu','CUSTOMER',null,'phan_tram',0),
(4025,'Nguyễn Nhật Quân',null,'0925066403','khach_cu','CUSTOMER',null,'phan_tram',0),
(4032,'Nguyễn Thị Tú Anh',null,'352636769','khach_cu','CUSTOMER',null,'phan_tram',0),
(4067,'Trần Thị Thanh Hà',null,'0983856433','khach_cu','CUSTOMER',null,'phan_tram',0),
(4082,'Đào Thị Thanh Hiền',null,'0975191914','khach_cu','CUSTOMER',null,'phan_tram',0),
(4083,'Bùi Thị Trang',null,'0982581188','khach_cu','CUSTOMER',null,'phan_tram',0),
(4093,'Phan Ngọc Bích',null,'0948151191','khach_cu','CUSTOMER',null,'phan_tram',0),
(4094,'Nguyễn Thị Lý',null,'0967288777','khach_cu','CUSTOMER',null,'phan_tram',0),
(4112,'Trần Ngọc Hoa',null,'0965372525','khach_cu','CUSTOMER',null,'phan_tram',0),
(4113,'Trần Ngọc Hoa',null,'0965372525','khach_cu','CUSTOMER',null,'phan_tram',0),
(4120,'Lê Thị Thuỳ Dương',null,'0822612761','khach_cu','CUSTOMER',null,'phan_tram',0),
(4121,'Trần Thị Lương',null,'979224990','khach_cu','CUSTOMER',null,'phan_tram',0),
(4122,'Phan Quỳnh Như',null,'0949899229','khach_cu','CUSTOMER',null,'phan_tram',0),
(4124,'Đặng Thị Thuỷ',null,'0385075566','khach_cu','CUSTOMER',null,'phan_tram',0),
(4132,'Lê Thị Huyền Trang',null,'352636636','khach_cu','CUSTOMER',null,'phan_tram',0),
(4199,'Phan Thị Phương Ca','0944363464','0944363464','khach_cu','CUSTOMER',null,'phan_tram',0),
(4203,'Nguyễn Kim Tuyến',null,'0942165555','khach_cu','CUSTOMER',null,'phan_tram',0),
(4220,'Nguyễn Thị Thảo',null,'0982521081','khach_cu','CUSTOMER',null,'phan_tram',0),
(4861,'Trương Thị Vĩnh Thương',null,'094 590 467','khach_cu','CUSTOMER',null,'phan_tram',0),
(4864,'Bùi Thuỳ Linh',null,'123456789','khach_cu','CUSTOMER',null,'phan_tram',0),
(4865,'Bùi Thuỳ Linh',null,'23 456 7890','khach_cu','CUSTOMER',null,'phan_tram',0),
(4866,'Bùi Thuỳ Linh',null,'123 456 789','khach_cu','CUSTOMER',null,'phan_tram',0),
(4940,'Nguyễn Thị Hồng Thắm',null,'0942201256','khach_cu','CUSTOMER',null,'phan_tram',0),
(6051,'Nguyễn Lê Hân',null,'0942236323','khach_cu','CUSTOMER',5414002,'tien',0)
  ) as x(sh, ten, ma, dt, loai, loai_sh, cid, kieu, gt)
on conflict (sh_id) do nothing;

create or replace function public.bc_hoa_hong_gioi_thieu(p_tu date, p_den date, p_cn uuid default null)
returns table (nguon text, nguoi_khoa text, nguoi_ten text, nguoi_ma text, nguoi_dt text, so_hd int, doanh_so bigint, hoa_hong bigint)
language sql stable as $$
  select 'khach', k.id::text, k.ho_ten, k.ma, k.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint,
         round(sum(case when dt.id is null then public.hh_tinh(v.doanh_so, v.so_luong, v.loai, 'gioi_thieu', v.muc_id, null)
                        when dt.hh_kieu = 'phan_tram' then v.doanh_so * dt.hh_gia_tri / 100
                        when dt.hh_kieu = 'tien' then dt.hh_gia_tri * v.so_luong
                        else 0 end))::bigint
    from public.hoa_don h join public.v_doanh_so_dong v on v.hoa_don_id = h.id join public.khach_hang k on k.id = h.nguoi_gioi_thieu_id
    left join lateral (select d.id, d.hh_kieu, d.hh_gia_tri from public.doi_tac_gt d where d.khach_id = k.id order by d.hoat_dong desc, d.tao_luc limit 1) dt on true
   where h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by k.id, k.ho_ten, k.ma, k.dien_thoai
  union all
  select 'salonhero', coalesce(n.id::text, 'sh:' || coalesce(g.sh_nhan_vien_id::text, g.ten_nguoi, '?')),
         coalesce(n.ho_ten, dt.ten, g.ten_nguoi, 'SalonHero #' || coalesce(g.sh_nhan_vien_id::text, '?') || ' (chưa ghép)'),
         coalesce(n.ma_nv, dt.ma_gioi_thieu), dt.dien_thoai, count(distinct h.id)::int, round(sum(v.doanh_so))::bigint, round(sum(g.gia_tri))::bigint
    from public.dong_hoa_hong_goc g join public.v_doanh_so_dong v on v.dong_id = g.dong_id join public.hoa_don h on h.id = v.hoa_don_id left join public.nhan_vien n on n.id = g.nhan_vien_id
    left join public.doi_tac_gt dt on dt.sh_id = g.sh_nhan_vien_id and n.id is null
   where g.vai = 'gioi_thieu' and h.ngay_hd between p_tu and p_den and (p_cn is null or h.chi_nhanh_id = p_cn)
   group by 2, 3, 4, 5
$$;

select public.khoa_tat_ca_bang();
notify pgrst, 'reload schema';
