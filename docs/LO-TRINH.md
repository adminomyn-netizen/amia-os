# Lộ trình và việc chưa làm

Thứ tự theo chỉ đạo của chị Lâm (25/10): làm đúng việc đang dùng hằng ngày trước, chạy song song với SalonHero một chi nhánh, số khớp rồi mới thay.

## Đã xong và đã thử trong trình duyệt thật
Giai đoạn 1 (khách, danh mục, lịch hẹn, bán hàng, thực hiện buổi, báo cáo ngày), giai đoạn 2 (định mức, phiếu cấp trước ca, kho), hoa hồng, nhập Excel khách, xuất Excel doanh thu, đổi mật khẩu.

## Chưa làm, theo thứ tự đề xuất
1. **Dữ liệu SalonHero**: ĐÃ chuyển khách, thẻ còn giá trị, công nợ, danh mục, tồn kho (25/10/2026, xem `scripts/nhap-salonhero/README.md`). CHƯA chuyển: ảnh khách (~250.000 ảnh, cần kho trả phí), lịch sử hoá đơn, lịch hẹn, định mức vật tư. Việc còn lại trước khi tắt SalonHero: rà SĐT trùng/trống, chuyển lần cuối khi dừng SalonHero, đối chiếu từng khách mẫu.
2. Sổ quỹ thu/chi, đối soát chuyển khoản với sao kê ngân hàng.
3. Phí thực hiện theo buổi cho KTV/bác sĩ, hoa hồng giới thiệu, chấm công và bảng lương.
4. Hoá đơn điện tử (Viettel/Misa), SMS/Zalo OA nhắc lịch, voucher, điểm thưởng, web đặt lịch.
5. Kho nâng cao: trừ theo lô/hạn dùng (FEFO), chuyển kho giữa 2 chi nhánh, cảnh báo cận hạn.
6. Báo cáo: giá vốn/buổi và lãi gộp từng dịch vụ từ dữ liệu phiếu cấp thật, khách rời bỏ, nguồn quảng cáo ra doanh thu.
7. Nối Pancake/quảng cáo (nguồn khách → doanh thu), bot cảnh báo.
