# AMIA OS

Phần mềm vận hành phòng khám AMIA (thay SalonHero). Tiếng Việt, giao diện riêng, chạy Vercel Singapore + Supabase Singapore.

- Sản phẩm: https://amia-os-neon.vercel.app (Vercel project `amia-os`, tự deploy khi push `main`)
- Mã nguồn: https://github.com/adminomyn-netizen/amia-os (private)
- CSDL: Supabase project `odhbmsjfbfefczienpda`, vùng `ap-southeast-1` (Singapore). Hàm Vercel chạy `sin1` (đặt trong `vercel.json`).

## Đã có (giai đoạn 1 + 2 + một phần 3)
| Khối | Nội dung |
|---|---|
| Khách hàng | 5 trường bắt buộc tách riêng: nguồn · trạng thái (tự đổi) · dịch vụ quan tâm · hạng (tự tính 12 tháng) · người phụ trách. Ghi chú điều trị có cấu trúc, người thân, ảnh trước/sau (kho riêng tư + nhật ký truy cập), nhập Excel |
| Danh mục | Dịch vụ, nhóm, gói thẻ (liệu trình bắt buộc số buổi / thẻ tiền), sản phẩm và vật tư (nhóm cấp A/B/C, đơn vị mua → dùng), chi nhánh |
| Lịch hẹn | Đặt/đổi/huỷ, timeline theo nhân viên, trạng thái 5 bước, chặn trùng giờ nhân viên, **khoá mở ca nếu thiếu phiếu cấp** |
| Thu ngân | Dịch vụ/thẻ/sản phẩm, 3 vai chia % (phục vụ, tư vấn, bán), giảm giá, VAT, phụ phí, tip, thanh toán nhiều lần (tiền mặt, CK, quẹt thẻ, trừ thẻ tiền), ghi nợ, thu nợ, huỷ có hoàn tiền, in hoá đơn |
| Thẻ | Sổ cái thẻ (chỉ thêm dòng), thực hiện buổi (trừ 1 buổi + doanh thu buổi = giá thực trả ÷ số buổi), huỷ buổi, điều chỉnh, khoá, cấp tay |
| Phiếu cấp vật tư | Định mức × chỉ định bác sĩ → kho cấp → KTV nhận (số đếm máy trước) → làm xong, trả thừa (số đếm sau) → đối chiếu; vượt định mức quá ngưỡng bắt buộc lý do + bác sĩ xác nhận |
| Kho | Sổ kho (nhập có lô/hạn, cấp theo phiếu, trả, bán lẻ, kiểm kê), tồn, cảnh báo dưới mức tối thiểu |
| Báo cáo | Doanh thu theo ngày (đơn mới, thu đơn mới, thu nợ cũ, từng phương thức, nợ mới, buổi đã làm), theo nhân viên, theo dịch vụ/sản phẩm, khách nợ, thẻ còn dư; xuất Excel |
| Hoa hồng | Doanh số theo vai × tỉ lệ cài đặt (mặc định theo loại, riêng theo mục) |
| Phân quyền | 11 vai trò, kiểm ở trang và ở từng Server Action (xem `src/lib/quyen.ts`) |

## Dữ liệu đã chuyển từ SalonHero (25/10/2026)
Xem `scripts/nhap-salonhero/README.md`: 13.633 khách, 12.757 thẻ còn giá trị, 150 đơn công nợ (1.343.642.500đ), 247 dịch vụ, 423 sản phẩm, 25 nhân viên, tồn kho đầu kỳ. Đang chạy song song để trải nghiệm.

## Chưa có (xem `docs/LO-TRINH.md`)
Lương và chấm công, sổ quỹ + đối soát ngân hàng, hoá đơn điện tử, SMS/Zalo OA, voucher, điểm thưởng, web đặt lịch, chuyển dữ liệu thật từ SalonHero, phí thực hiện theo buổi cho KTV, hoa hồng giới thiệu.

## Chạy máy
```
npm install
# .env.local cần: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (lấy bằng: supabase projects api-keys --project-ref odhbmsjfbfefczienpda)
npm run dev
npm run kiem-tra        # eslint + tsc + 36 bài test nghiệp vụ trên Postgres thật (PGlite) + quét thiết kế + tương phản màu
```

## Nguyên tắc dữ liệu (không đổi tuỳ tiện)
1. Tiền là số nguyên đồng (`bigint`). Không dùng số thực cho tiền.
2. Sổ cái chỉ thêm dòng (`the_so_cai`, `thanh_toan`, `kho_so_cai`, `nhat_ky_truy_cap`): trigger chặn sửa/xoá. Số dư = tổng dòng. Sai thì ghi dòng điều chỉnh có lý do.
3. Trình duyệt không chạm thẳng DB: anon/authenticated bị thu hồi mọi quyền, mọi bảng bật RLS + FORCE RLS + policy chặn. App đọc/ghi bằng `service_role` ở server, có hàm bảo vệ theo vai trò. Migration mới phải gọi `select public.khoa_tat_ca_bang();` ở cuối (test cổng cấu trúc bắt nếu quên).
4. Nghiệp vụ quan trọng (chốt đơn, huỷ đơn, thực hiện buổi, cấp phiếu…) là hàm Postgres chạy trong 1 giao dịch, có khoá dòng. Thông báo lỗi từ `RAISE EXCEPTION ... errcode 'P0001'` là tiếng Việt và hiện nguyên văn cho người dùng.
5. Form dùng `type="button"` + gom `FormData` rồi gọi Server Action (không `<form>` submit trên trang đã đăng nhập) — kế thừa bài học của dự án HRM.

## Vận hành
- Thêm migration: tạo `supabase/migrations/00NN_ten.sql` → `npm run kiem-tra` → `supabase db push --yes` (mật khẩu DB lấy từ Keychain mục `amia-os-db-password`, truyền qua `SUPABASE_DB_PASSWORD`) → `supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts`.
- Tạo tài khoản: trong app, mục Nhân viên (chỉ vai trò Kỹ thuật). Dòng lệnh: `node scripts/tao-tai-khoan.mjs <email> <mật khẩu> <họ tên> <vai_tro> [VINH|DALAT]`.
- Sao lưu: `node scripts/sao-luu.mjs` (file JSON trong `sao-luu/`, không vào git). Gói Supabase miễn phí KHÔNG có sao lưu tự động theo thời điểm: cần lịch sao lưu riêng hoặc nâng gói trước khi chạy thật.
- Commit phải dùng email `adminomyn@gmail.com` (Vercel chặn deploy nếu không tìm thấy tài khoản Git của tác giả).
