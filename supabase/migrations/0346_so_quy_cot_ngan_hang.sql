-- 23/11 (Vân Anh): sổ quỹ ngân hàng cần nhìn ra khách chuyển vào ngân hàng nào (Techcombank / VCB / OCB).
-- Thêm cột ngan_hang vào cuối v_so_quy: lấy theo tài khoản nhận của khoản thanh toán (tai_khoan_id), không có thì theo chữ ngân hàng đã ghi.
-- Tiền mặt và phiếu thu/chi ghi tay: để trống.
create or replace view public.v_so_quy with (security_invoker=true) as
 SELECT (s.id)::text AS id,
    s.ma,
    s.ngay,
    s.quy_id,
    q.chi_nhanh_id,
    q.loai AS loai_quy,
    s.loai,
    s.so_tien,
        CASE
            WHEN (s.loai = ANY (ARRAY['thu'::text, 'nap'::text])) THEN s.so_tien
            ELSE (- s.so_tien)
        END AS bien_dong,
    lt.ten AS loai_thu_chi,
    s.noi_dung,
    s.doi_tuong,
    s.nguon,
    s.nguoi_id,
    s.tao_luc,
    s.phieu_goc_id,
    (EXISTS ( SELECT 1
           FROM so_quy d
          WHERE (d.phieu_goc_id = s.id))) AS da_dao,
    true AS sua_duoc,
    s.sh_id,
    s.sh_nguoi_tao AS nguoi_ten,
    NULL::uuid AS khach_id,
    NULL::text AS khach_ten,
    COALESCE(NULLIF(btrim(s.nguoi_nhan), ''::text), nn.ten,
        CASE
            WHEN ((s.sh_id IS NULL) AND (s.loai = ANY (ARRAY['chi'::text, 'rut'::text]))) THEN NULLIF(btrim(s.doi_tuong), ''::text)
            ELSE NULL::text
        END) AS nguoi_nhan,
    NULL::text AS ngan_hang
   FROM (((so_quy s
     JOIN quy q ON ((q.id = s.quy_id)))
     LEFT JOIN loai_thu_chi lt ON ((lt.id = s.loai_thu_chi_id)))
     LEFT JOIN so_quy_nguoi_nhan_sh nn ON ((nn.sh_id = s.sh_id)))
UNION ALL
 SELECT (t.id)::text AS id,
    h.ma,
    t.ngay,
    q.id AS quy_id,
    h.chi_nhanh_id,
    q.loai AS loai_quy,
        CASE t.loai
            WHEN 'thu'::text THEN 'thu'::text
            ELSE 'chi'::text
        END AS loai,
    t.so_tien,
        CASE t.loai
            WHEN 'thu'::text THEN t.so_tien
            ELSE (- t.so_tien)
        END AS bien_dong,
        CASE t.loai
            WHEN 'thu'::text THEN 'Bán hàng'::text
            ELSE 'Hoàn tiền khách'::text
        END AS loai_thu_chi,
    (
        CASE t.loai
            WHEN 'thu'::text THEN 'Thu tiền hoá đơn '::text
            ELSE 'Hoàn tiền hoá đơn '::text
        END || h.ma) AS noi_dung,
    NULL::text AS doi_tuong,
    'ban_hang'::text AS nguon,
    t.nguoi_id,
    t.tao_luc,
    NULL::uuid AS phieu_goc_id,
    false AS da_dao,
    false AS sua_duoc,
    NULL::bigint AS sh_id,
    COALESCE(NULLIF(btrim("substring"(t.ghi_chu, 'SalonHero PAYMENT(?:_DEBT)? · (.*)$'::text)), ''::text),
        CASE
            WHEN (t.nhap_dot ~~ 'SH-%'::text) THEN ''::text
            ELSE NULL::text
        END) AS nguoi_ten,
    h.khach_id,
    k.ho_ten AS khach_ten,
    NULL::text AS nguoi_nhan,
    (CASE WHEN t.phuong_thuc = 'tien_mat' THEN NULL ELSE NULLIF(btrim(regexp_replace(COALESCE(tk.ngan_hang, t.ngan_hang, ''), '^Ng[âa]n h[àa]ng\s+', '', 'i')), '') END) AS ngan_hang
   FROM ((((thanh_toan t
     JOIN hoa_don h ON ((h.id = t.hoa_don_id)))
     JOIN quy q ON (((q.chi_nhanh_id = h.chi_nhanh_id) AND (q.loai =
        CASE t.phuong_thuc
            WHEN 'tien_mat'::text THEN 'tien_mat'::text
            ELSE 'ngan_hang'::text
        END))))
     LEFT JOIN khach_hang k ON ((k.id = h.khach_id)))
     LEFT JOIN tai_khoan_ngan_hang tk ON ((tk.id = t.tai_khoan_id)))
  WHERE (t.phuong_thuc <> ALL (ARRAY['the_tien'::text, 'ship_cod'::text]));
