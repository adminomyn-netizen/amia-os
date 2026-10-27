# Lộ trình và việc chưa làm

Thứ tự theo chỉ đạo của chị Lâm (25/10): làm đúng việc đang dùng hằng ngày trước, chạy song song với SalonHero một chi nhánh, số khớp rồi mới thay.

## Đã xong và đã thử trong trình duyệt thật
Giai đoạn 1 (khách, danh mục, lịch hẹn, bán hàng, thực hiện buổi, báo cáo ngày), giai đoạn 2 (định mức, phiếu cấp trước ca, kho), hoa hồng, nhập Excel khách, xuất Excel doanh thu, đổi mật khẩu.

## Chưa làm, theo thứ tự đề xuất
1. **Dữ liệu SalonHero**: ĐÃ chuyển khách, thẻ còn giá trị, công nợ, danh mục, tồn kho (25/10/2026, xem `scripts/nhap-salonhero/README.md`). CHƯA chuyển, theo lệnh chị Lâm 25/10: ảnh khách (260.000 ảnh ≈ 430 GB, tạm không lưu), lịch sử hoá đơn, lịch hẹn, định mức vật tư. Việc còn lại trước khi tắt SalonHero: rà SĐT trùng/trống, chuyển lần cuối khi dừng SalonHero, đối chiếu từng khách mẫu.
2. Sổ quỹ thu/chi, đối soát chuyển khoản với sao kê ngân hàng.
3. Phí thực hiện theo buổi cho KTV/bác sĩ, hoa hồng giới thiệu, chấm công và bảng lương.
4. Hoá đơn điện tử (Viettel/Misa), SMS/Zalo OA nhắc lịch, voucher, điểm thưởng, web đặt lịch.
5. Kho nâng cao: trừ theo lô/hạn dùng (FEFO), chuyển kho giữa 2 chi nhánh, cảnh báo cận hạn.
6. Báo cáo: giá vốn/buổi và lãi gộp từng dịch vụ từ dữ liệu phiếu cấp thật, khách rời bỏ, nguồn quảng cáo ra doanh thu.
7. Nối Pancake/quảng cáo (nguồn khách → doanh thu), bot cảnh báo.

## Làm theo BeDental (chị Lâm 27/10/2026: "làm hết tất cả app Amia theo bên BeDental")
Tài liệu nghiệp vụ đọc từ bản demo BeDental nằm ở `docs/bedental/` (mỗi mục lớn một tệp, có mục "Đề xuất cho AMIA"). Khung menu và trang thẻ chức năng: `src/lib/module.ts` (thẻ có `duongDan` là đã dùng được).
- Đã xong: khung 12 mục lớn; Cài đặt (thông tin chung, tài khoản ngân hàng, bảng tin ở Trang chủ); Sổ quỹ thu/chi (tiền mặt, ngân hàng, chuyển quỹ, đảo phiếu, xuất Excel); Mua hàng (đơn mua có duyệt, nhận hàng vào kho), Nhà cung cấp, Công nợ nhà cung cấp; Nơi làm việc (việc cần hoàn thành, báo cáo ngày, wiki công ty, đề xuất mua sắm/thanh toán/tạm ứng, Trung tâm phê duyệt: duyệt rồi chi sổ quỹ hoặc lập đơn mua ngay tại đó); trang /dang-ky gửi yêu cầu tài khoản, Kỹ thuật duyệt trong Nhân viên. **Cập nhật 27/10 (đợt 2 → 5):** Nơi làm việc (việc, báo cáo ngày, wiki, đề xuất + Trung tâm phê duyệt, hạn mức duyệt, hoàn ứng); Nhân sự (ca, chấm công, phiếu nghỉ/OT, phép năm, tổng hợp công, lương, hợp đồng lao động); đăng ký tự do vai trò Nhân viên; Marketing (lead, chiến dịch, quảng cáo ngày, nội dung, đối tác, link/QR, báo cáo phễu); Kho nâng cao (chuyển kho 24 giờ, kiểm kê có duyệt, xử lý vật tư, xuất khẩn cấp, lô/hạn dùng FEFO) và Khoá kỳ kế toán; Văn bản & Hợp đồng (sổ văn bản, đồng ý dùng ảnh); Tài chính (hoá đơn đầu vào, đối soát bán hàng, quyết toán hoa hồng).
- Còn lại theo thứ tự: Nhân sự (chấm công, ca, nghỉ phép, lương; lấy từ `hrm-omyn`), Điều chuyển kho / lô-hạn dùng, Marketing (lead, nguồn giới thiệu/CTV, link/QR), Văn bản & Hợp đồng, Khoá kỳ kế toán, chính sách phê duyệt, báo cáo bổ sung. Bảng chấm công ở Nơi làm việc sẽ nối khi Nhân sự có chấm công.
- Không làm (BeDental cũng ghi "Sắp có" hoặc cần tài khoản bên thứ ba): hoá đơn điện tử, Zalo OA/SMS, Web đặt lịch, Zalo Mini App, API keys, Facebook, landing page, automation.
- Dữ liệu thử khi kiểm: bảng sổ cái chỉ thêm dòng (sổ quỹ, kho, công nợ NCC) nên dọn bằng `supabase db query --linked` trong MỘT giao dịch (tắt trigger, xoá đúng dòng của mình, bật lại, kiểm trigger đã bật).

## Còn lại sau 27/10/2026
- **Chờ chị Lâm xác nhận** (đang để thành tham số, không cứng): ngưỡng ký 100 triệu của Giám đốc chi nhánh; ngưỡng 10 triệu "chờ xác nhận"; biểu thuế TNCN và giảm trừ; lương thử việc 85%; ăn ca 35.000; bảng phạt trễ; công chuẩn 26 ngày; nhắc hợp đồng lao động trước 45 ngày. Chính sách hoa hồng giới thiệu/CTV chưa có văn bản nên chưa tính tự động.
- **Chưa làm vì cần tài khoản bên thứ ba**: hoá đơn điện tử, Zalo OA/SMS, hộp thư đa kênh, web đặt lịch.
- **Đã làm thêm (27/10 tối):** báo giá nhiều nhà cung cấp trên đơn mua (từ 20 triệu cần 2, từ 30 triệu cần 3, thiếu thì ghi ngoại lệ), ngân sách tháng, công nợ khách 6 nhóm tuổi nợ, onboarding thử việc, cảnh báo trên chuông (lô hết hạn, chuyển kho quá 24 giờ, xuất khẩn chờ hậu kiểm, hoá đơn chưa về, văn bản, hợp đồng lao động).
- **Đã làm thêm (27/10 đêm):** thanh menu ngang trên máy tính thay sidebar, gom 4 nhóm Hằng ngày / Vận hành / Phát triển / Hệ thống, mỗi nhóm thả xuống mục lớn + chức năng con, bỏ chữ chi nhánh trên thanh (điện thoại giữ nguyên); thẻ chức năng có biểu tượng; chặn khoản chi theo đề xuất khi vượt ngân sách tháng (chỉ người có quyền Khoá kỳ hoặc Kỹ thuật được tick "chấp nhận vượt"); chỉnh mốc onboarding ngay trên giao diện; chấm công theo kiểu Lark Attendance (hai khung giờ vào / giờ ra xếp dọc, mỗi khung có nút riêng, báo trễ / về sớm theo thời gian thực); quên mật khẩu qua thư (cần cấu hình SMTP: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM trên Vercel).
- **Chưa làm, có thể làm tiếp**: sổ quỹ hai tầng (chưa rõ nghiệp vụ), kế hoạch vật tư theo tháng.
