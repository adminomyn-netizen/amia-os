# Bản đồ phủ: Khung kinh doanh MSC → AMIA OS

Sinh tự động từ `scripts/sinh-khung-kd.py`. Đây là danh sách nghiệm thu: mỗi bước quy trình và mỗi biểu mẫu đang được làm ở màn nào, hay còn thiếu.

- **Biểu mẫu BM01–BM26:** 9 có · 7 một phần · 10 thiếu.
- **Bước quy trình (80 bước, 14 quy trình):** 23 có · 13 một phần · 23 thiếu · 21 là thao tác con người (không đưa vào phần mềm).

## Biểu mẫu

| Mã | Tên | Trạng thái | Làm ở | Ghi chú |
|---|---|---|---|---|
| BM01 | Phiếu thông tin khách hàng | MỘT PHẦN | /khach-hang | Hồ sơ khách và lead có nguồn, dịch vụ quan tâm, người phụ trách, hạng. Thiếu: phân khúc/tầng khách. |
| BM02 | Bản khai tiền sử & chống chỉ định | THIẾU | /khach-hang | Chưa có bản khai tiền sử và chống chỉ định có cấu trúc (dị ứng, thuốc đang dùng, thai kỳ); hiện chỉ có Ghi chú điều trị gõ tự do. |
| BM03 | Phiếu khám & chỉ định phác đồ | MỘT PHẦN | /khach-hang | Tab Ghi chú điều trị (tình trạng, yêu cầu, phương án, kết quả, bác sĩ). Chưa có chỉ định phác đồ theo số buổi và khoảng cách. |
| BM04 | Phiếu tư vấn | THIẾU | — | Chưa có phiếu tư vấn (nhu cầu, gói đề xuất, phản đối, kết quả chốt). |
| BM05 | Hợp đồng dịch vụ | CÓ | /van-ban/danh-sach | Văn bản loại Hợp đồng mua dịch vụ / gói / thẻ, có hiệu lực và bản điện tử. |
| BM06 | Phụ lục phác đồ & lịch buổi | MỘT PHẦN | /van-ban/danh-sach | Có loại văn bản phụ lục; chưa có lịch từng buổi và khoảng cách theo phác đồ. |
| BM07 | Bản cam kết chụp ảnh & bảo mật | CÓ | /van-ban/dong-y-anh | Đồng ý chụp ảnh theo dõi điều trị và đồng ý dùng ảnh cho truyền thông (có hạn, rút lại được). |
| BM08 | Phiếu chốt đơn / đặt cọc | MỘT PHẦN | /ban-hang | Có đơn bán và công nợ; chưa có phiếu chốt đơn / đặt cọc riêng và kiểm tra tỷ lệ cọc. |
| BM09 | Phiếu thu / hóa đơn | CÓ | /hoa-don | Hoá đơn, phiếu thu, thanh toán nhiều phương thức. |
| BM10 | Phiếu theo dõi công nợ | CÓ | /tai-chinh/cong-no-khach | Công nợ khách chia 6 nhóm tuổi nợ. |
| BM11 | Phiếu bàn giao trị liệu (TV→KTV) | THIẾU | — | Chưa có phiếu bàn giao Tư vấn → KTV (hiện có lịch hẹn và phiếu cấp vật tư). |
| BM12 | Phiếu theo dõi buổi trị liệu | CÓ | /the | Buổi thực hiện theo thẻ liệu trình: KTV, bác sĩ, tham số buổi. |
| BM13 | Phiếu ảnh trước/sau | CÓ | /khach-hang | Tab Ảnh của khách: kho riêng tư, ghi vết mỗi lần xem. |
| BM14 | Phiếu hướng dẫn chăm sóc tại nhà | THIẾU | — | Chưa có phiếu hướng dẫn chăm sóc tại nhà. |
| BM15 | Phiếu nhắc lịch | MỘT PHẦN | /lich-hen | Có lịch hẹn và thông báo đẩy nội bộ; nhắc lịch gửi tới khách (Zalo, SMS) cần tài khoản bên thứ ba. |
| BM16 | Phiếu khảo sát hài lòng | THIẾU | — | Chưa có khảo sát hài lòng. |
| BM17 | Phiếu tiếp nhận khiếu nại | THIẾU | — | Chưa có phiếu tiếp nhận khiếu nại. |
| BM18 | Biên bản xử lý biến chứng | THIẾU | — | Chưa có biên bản xử lý biến chứng. |
| BM19 | Phiếu bảo hành dịch vụ | THIẾU | — | Chưa có phiếu bảo hành dịch vụ. |
| BM20 | Thẻ khách hàng | CÓ | /the | Thẻ khách: liệu trình / giá trị, số dư, hạn dùng. |
| BM21 | Phiếu chuyển đổi / chuyển nhượng thẻ | MỘT PHẦN | /the | Có điều chỉnh và cấp thẻ tay; chưa có phiếu chuyển đổi / chuyển nhượng thẻ. |
| BM22 | Phiếu giới thiệu (referral) | MỘT PHẦN | /marketing/doi-tac | Khách có người giới thiệu; đối tác/CTV có mã giới thiệu. Chưa có thưởng referral. |
| BM23 | Kịch bản bán theo dịch vụ | CÓ | /quy-trinh?tab=kich-ban | Bộ kịch bản mẫu KB1–KB10 nằm trong Quy trình; kịch bản theo từng dịch vụ viết thêm ở Wiki công ty. |
| BM24 | Báo cáo bán hàng ngày/tuần/tháng | CÓ | /bao-cao | Báo cáo doanh thu, nhân viên, phễu; báo cáo ngày ở Nơi làm việc. |
| BM25 | Phiếu đánh giá TVV | THIẾU | /nhan-su | Chưa có phiếu đánh giá TVV (BSC/KPI nhân sự đang làm tiếp). |
| BM26 | Bộ câu hỏi khai thác nhu cầu | THIẾU | — | Chưa có bộ câu hỏi khai thác nhu cầu; sẽ gắn vào phiếu tư vấn BM04. |

## Bước quy trình

### QT-01 QUY TRÌNH TIẾP CẬN & KHAI THÁC DỮ LIỆU KHÁCH HÀNG

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | Marketing | Bàn giao lead lên CRM kèm ghi chú nguồn, dịch vụ KH quan tâm. | CÓ | /marketing/lead · Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận. |
| B2 | Trưởng BP TV | Phân bổ lead cho TVV theo tải & phân khúc. | CÓ | /marketing/lead · Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận. |
| B3 | TVV | Chuẩn bị trước gọi: xem ghi chú, mở CRM, nắm dịch vụ liên quan, tâm thế. | NGOÀI PHẦN MỀM | Chuẩn bị tâm thế và xem ghi chú trước khi gọi. |
| B4 | TVV | Gọi/nhắn tiếp cận: chào–xưng danh–xác nhận đúng người–xin phép tư vấn. | NGOÀI PHẦN MỀM | Cuộc gọi, theo kịch bản KB1. |
| B5 | TVV | Khai thác sơ bộ: hiện trạng, mong đợi, đã từng điều trị, ràng buộc y khoa/ngân sách. | THIẾU | Chưa có bộ câu hỏi khai thác BM26. |
| B6 | TVV | Phân loại KH (tiềm năng/chưa/từ chối) & đề xuất bước tiếp (đặt lịch/gọi lại). | CÓ | /marketing/lead · Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận. |
| B7 | TVV | Cập nhật CRM đầy đủ nội dung, trạng thái, người phụ trách, hẹn kế. | CÓ | /marketing/lead · Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận. |
| B8 | Trưởng BP TV | Rà lead quá hạn chưa liên hệ, đôn đốc xử lý. | CÓ | /marketing/lead · Lead quá hạn lên cảnh báo trên chuông. |

### QT-02 QUY TRÌNH TƯ VẤN KHÁCH HÀNG (TRỰC TUYẾN)

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | TVV | Chọn thời điểm gọi phù hợp; nhận diện KH qua giao tiếp. | NGOÀI PHẦN MỀM | Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn. |
| B2 | TVV | Khai thác sâu nhu cầu & mong đợi bằng bộ câu hỏi mở. | THIẾU | Chưa có bộ câu hỏi khai thác BM26. |
| B3 | TVV | Giới thiệu giá trị/EVP: bác sĩ trực tiếp, máy chính hãng, minh chứng trước/sau. | MỘT PHẦN | /quy-trinh?tab=kich-ban · Có kịch bản KB3; chưa có kho minh chứng trước/sau gắn câu tư vấn. |
| B4 | TVV | Tư vấn hướng giải pháp sơ bộ (không chỉ định y khoa); gợi ý khám bác sĩ. | NGOÀI PHẦN MỀM | Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn. |
| B5 | TVV | Xử lý phản đối (đắt/nghi ngờ/do dự) theo sổ tay. | NGOÀI PHẦN MỀM | Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn. |
| B6 | TVV | Chốt bước tiếp: đặt lịch khám/soi da tại cơ sở (ưu tiên) hoặc chốt online. | CÓ | /lich-hen · Đặt lịch khám / soi da. |
| B7 | TVV | Cập nhật phiếu tư vấn & CRM. | THIẾU | Chưa có phiếu tư vấn BM04. |

### QT-03 QUY TRÌNH ĐẶT & ĐIỀU PHỐI LỊCH HẸN

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | TVV/CSKH | Trao đổi & chốt khung giờ theo nhu cầu KH & lịch trống cơ sở. | CÓ | /lich-hen · Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ. |
| B2 | CSKH | Kiểm tra xung đột nguồn lực (bác sĩ/KTV/máy/phòng) & xác nhận. | CÓ | /lich-hen · Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ. |
| B3 | CSKH | Ghi lịch lên hệ thống & thông báo bộ phận liên quan. | CÓ | /lich-hen · Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ. |
| B4 | CSKH | Nhắc lịch trước ≥1 tuần & trước 1 ngày; xác nhận lại KH. | MỘT PHẦN | /lich-hen · Chưa nhắc lịch tới khách tự động (cần Zalo / SMS). |
| B5 | CSKH | Xử lý dời/hủy: ghi nhận lý do, xếp lại lịch, giải phóng slot. | CÓ | /lich-hen · Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ. |

### QT-04 QUY TRÌNH ĐÓN TIẾP KHÁCH HÀNG TẠI CƠ SỞ

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | Lễ tân | Chào đón, gọi tên, mời ngồi/nước trong 30 giây. | NGOÀI PHẦN MỀM | Tác phong đón khách trong 30 giây. |
| B2 | Lễ tân/CSKH | Xác nhận lịch & dịch vụ quan tâm; cập nhật check-in. | MỘT PHẦN | /lich-hen · Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người. |
| B3 | CSKH | Bố trí tiện ích: phòng chờ/soi da sạch, riêng tư, yên tĩnh. | NGOÀI PHẦN MỀM | Bố trí phòng chờ sạch, riêng tư. |
| B4 | CSKH | Chuyển KH sang bác sĩ soi da/khám & chỉ định phác đồ. | MỘT PHẦN | /lich-hen · Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người. |
| B5 | TVV | Trong lúc chờ: cải thiện cảm nhận (ảnh trước/sau, giới thiệu máy). | NGOÀI PHẦN MỀM | Cho xem ảnh trước/sau (kho minh chứng có đồng ý của khách). |
| B6 | CSKH | Nếu KH chưa vào tư vấn: tặng quà nhỏ/ưu đãi & chốt lịch quay lại. | MỘT PHẦN | /lich-hen · Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người. |

### QT-05 QUY TRÌNH TƯ VẤN BÁN & CHỐT TẠI CƠ SỞ

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | TVV | Trình phác đồ: dịch vụ, số buổi, khoảng cách, kết quả kỳ vọng, rủi ro. | MỘT PHẦN | /khach-hang · Ghi chú điều trị có phương án; chưa có phụ lục phác đồ số buổi. |
| B2 | TVV | Trình 2–3 phương án gói/giá theo ngân sách; nêu giá trị & ưu đãi/thẻ. | CÓ | /the · Gói và thẻ liệu trình có giá và hạn dùng. |
| B3 | TVV | Xử lý phản đối theo sổ tay; đề xuất trả góp nếu cần. | NGOÀI PHẦN MỀM | Xử lý phản đối bằng lời (KB4–KB6). |
| B4 | TVV | Chốt bằng câu chốt giả định thuận; ghi nhận cam kết KH. | NGOÀI PHẦN MỀM | Câu chốt (KB7). |
| B5 | TVV | Lập phiếu chốt/đặt cọc; chuyển sang giao kết hợp đồng & thanh toán. | THIẾU | Chưa có phiếu chốt / đặt cọc BM08. |
| B6 | Trưởng BP TV | Duyệt trường hợp vượt hạn mức chiết khấu/ngoại lệ. | THIẾU | Chưa có hạn mức chiết khấu theo cấp và quy trình duyệt vượt hạn mức. |

### QT-06 QUY TRÌNH GIAO KẾT HỢP ĐỒNG & THANH TOÁN

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | TVV | Lập hợp đồng + phụ lục phác đồ; đọc rõ quyền lợi–trách nhiệm cho KH. | CÓ | /van-ban/danh-sach · Hợp đồng và phụ lục. |
| B2 | TVV | Cho KH ký cam kết chụp 6 ảnh trước/sau & điều khoản bảo mật hình ảnh. | CÓ | /van-ban/dong-y-anh · Cam kết chụp ảnh và bảo mật hình ảnh. |
| B3 | TVV/KH | Ký hợp đồng đúng thẩm quyền theo giá trị đơn. | MỘT PHẦN | /van-ban/danh-sach · Có ngưỡng ký theo tham số; chờ chị Lâm chốt ngưỡng. |
| B4 | Kế toán | Áp chính sách đặt cọc/thẻ; thu tiền & xuất phiếu thu/hóa đơn. | MỘT PHẦN | /ban-hang · Thu tiền và phiếu thu có; chưa kiểm tỷ lệ cọc. |
| B5 | Kế toán | Ghi nhận doanh thu & công nợ; đối chiếu với TVV. | CÓ | /tai-chinh/cong-no-khach · Ghi nhận doanh thu và công nợ. |
| B6 | Kiểm soát NB | Lưu trữ hợp đồng theo phân quyền; đồng bộ CRM. | CÓ | /van-ban/danh-sach · Lưu hợp đồng, phân quyền, đồng bộ hồ sơ khách. |

### QT-07 QUY TRÌNH BÀN GIAO & THỰC HIỆN TRỊ LIỆU

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | TVV | Bàn giao hồ sơ, phác đồ, lưu ý y khoa cho KTV. | THIẾU | Chưa có phiếu bàn giao BM11. |
| B2 | KTV | Chụp 6 ảnh trước chuẩn góc/ánh sáng; lưu hồ sơ. | CÓ | /khach-hang · Tab Ảnh của khách. |
| B3 | KTV | Tuân thủ quy trình vô khuẩn; kiểm tra máy trước khi dùng. | NGOÀI PHẦN MỀM | Quy trình vô khuẩn và kiểm tra máy. |
| B4 | KTV | Thực hiện đúng phác đồ; theo dõi phản ứng của KH. | CÓ | /the · Buổi thực hiện theo thẻ. |
| B5 | Bác sĩ | Giám sát/hỗ trợ khi cần; xử lý ngay nếu có dấu hiệu bất thường. | NGOÀI PHẦN MỀM | Bác sĩ giám sát tại chỗ. |
| B6 | KTV | Chụp ảnh sau; ghi nhận kết quả & cập nhật hồ sơ. | CÓ | /khach-hang · Ảnh sau và kết quả. |

### QT-08 QUY TRÌNH THEO DÕI & CHĂM SÓC SAU ĐIỀU TRỊ

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | KTV/CSKH | Hướng dẫn chăm sóc tại nhà & sản phẩm dưỡng sau buổi. | THIẾU | Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng. |
| B2 | CSKH | Theo dõi tình trạng sau buổi (gọi/nhắn); phát hiện bất thường. | THIẾU | Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng. |
| B3 | CSKH | Nhắc lịch buổi kế trước ≥1 tuần; xác nhận khung giờ. | MỘT PHẦN | /lich-hen · Lịch hẹn có; nhắc tới khách cần Zalo / SMS. |
| B4 | CSKH | Khảo sát hài lòng sau liệu trình/định kỳ. | THIẾU | Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng. |
| B5 | CSKH/TVV | Đánh giá chuyển biến → chuyển cơ hội tái bán (QT-10). | THIẾU | Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng. |

### QT-09 QUY TRÌNH CHĂM SÓC KHÁCH HÀNG (DUY TRÌ KẾT NỐI)

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | CSKH | Lập lịch chăm sóc: nhắc lịch, gọi sinh nhật, dịp lễ, theo nhóm KH. | THIẾU | Chưa có lịch chăm sóc sinh nhật, dịp lễ, theo nhóm khách. |
| B2 | CSKH | Thực hiện chăm sóc theo kịch bản (nhắc/hỏi thăm/tri ân). | THIẾU | Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH. |
| B3 | CSKH | Ghi nhận phản hồi & nhu cầu mới; cập nhật CRM. | THIẾU | Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH. |
| B4 | CSKH | Chuyển cơ hội (tái bán/khiếu nại/ưu đãi) sang tuyến phù hợp. | THIẾU | Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH. |

### QT-10 QUY TRÌNH TÁI BÁN & XIN GIỚI THIỆU

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | CSKH/TVV | Đánh giá chuyển biến (so ảnh trước/sau); nhận diện nhu cầu mới. | CÓ | /khach-hang · Ảnh trước/sau và lịch sử giao dịch. |
| B2 | TVV | Tư vấn bán thêm/nâng cấp/duy trì theo ma trận bán chéo. | MỘT PHẦN | /khach-hang · Khách có người giới thiệu; chưa có thưởng referral và ma trận bán chéo. |
| B3 | CSKH | Khi KH hài lòng: xin lời giới thiệu, nêu ưu đãi referral. | MỘT PHẦN | /khach-hang · Khách có người giới thiệu; chưa có thưởng referral và ma trận bán chéo. |
| B4 | CSKH | Ghi nhận nguồn giới thiệu & áp thưởng cho KH giới thiệu. | THIẾU | Chưa có thưởng referral BM22. |
| B5 | TVV | Tiếp nhận KH mới từ giới thiệu → nhập QT-01. | CÓ | /marketing/lead · Lead nguồn Khách cũ giới thiệu. |

### QT-11 QUY TRÌNH XỬ LÝ KHIẾU NẠI KHÁCH HÀNG

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | CSKH | Tiếp nhận & lắng nghe; xin lỗi khách; ghi nhận đầy đủ. | THIẾU | Chưa có phiếu khiếu nại, SLA và đóng khiếu nại. |
| B2 | CSKH | Phân loại (dịch vụ/thái độ/tài chính/y khoa) & chuyển đúng tuyến. | THIẾU | Chưa có phiếu khiếu nại, SLA và đóng khiếu nại. |
| B3 | Bộ phận liên quan | Xác minh nguyên nhân; đề xuất phương án khắc phục. | NGOÀI PHẦN MỀM | Xác minh nguyên nhân là việc của người phụ trách. |
| B4 | Trưởng BP/LĐ | Duyệt phương án; vượt thẩm quyền báo lãnh đạo. | THIẾU | Chưa có luồng duyệt phương án và báo lãnh đạo. |
| B5 | CSKH | Thực hiện khắc phục & phản hồi KH; xác nhận đồng ý. | THIẾU | Chưa có phiếu khiếu nại, SLA và đóng khiếu nại. |
| B6 | CSKH | Lưu hồ sơ; rà nguyên nhân gốc để phòng ngừa lặp lại. | THIẾU | Chưa có phiếu khiếu nại, SLA và đóng khiếu nại. |

### QT-12 QUY TRÌNH XỬ LÝ BIẾN CHỨNG (PHỐI HỢP BÁC SĨ)

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | KTV/CSKH | Phát hiện dấu hiệu bất thường → ngừng thao tác gây rủi ro, đưa KH đến bác sĩ ngay. | NGOÀI PHẦN MỀM | Ngừng thao tác, đưa khách tới bác sĩ. |
| B2 | Bác sĩ | Khám, chẩn đoán, lập phương án khắc phục bằng văn bản. | NGOÀI PHẦN MỀM | Bác sĩ khám và đánh giá; biên bản BM18 chưa có trên hệ thống. |
| B3 | Bác sĩ/CSKH | Cam kết mức khắc phục với KH; áp chính sách bảo hành biến chứng. | THIẾU | Chưa có biên bản biến chứng, bảo hành và báo cáo lãnh đạo. |
| B4 | CSKH | Báo cáo lãnh đạo; vượt xử lý → xin ý kiến lãnh đạo. | THIẾU | Chưa có biên bản biến chứng, bảo hành và báo cáo lãnh đạo. |
| B5 | Bác sĩ/BLĐ | Lưu hồ sơ đầy đủ; rà nguyên nhân gốc → hành động phòng ngừa. | THIẾU | Chưa có biên bản biến chứng, bảo hành và báo cáo lãnh đạo. |

### QT-13 QUY TRÌNH QUẢN LÝ & CHUYỂN GIAO THÔNG TIN KHÁCH HÀNG

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | Người tiếp xúc KH | Thu thập thông tin theo form chuẩn (gồm thông tin lâm sàng cần thiết). | CÓ | /khach-hang · Form thông tin khách chuẩn. |
| B2 | Người phụ trách | Nhập/cập nhật CRM kịp thời khi có thay đổi. | CÓ | /khach-hang · Dữ liệu khách tập trung, phân quyền, ghi vết xem dữ liệu sức khoẻ. |
| B3 | Bộ phận bàn giao | Chuyển giao KH giữa Marketing→TV→Bác sĩ/Trị liệu→CSKH bằng phần mềm. | MỘT PHẦN | /marketing/lead · Lead chuyển thành khách; chuyển giao giữa các bộ phận chưa có xác nhận nhận bàn giao. |
| B4 | Toàn khối | Truy cập & sử dụng dữ liệu theo phân quyền, đúng mục đích. | CÓ | /khach-hang · Dữ liệu khách tập trung, phân quyền, ghi vết xem dữ liệu sức khoẻ. |
| B5 | Kiểm soát NB | Giám sát tuân thủ bảo mật & xử lý vi phạm. | MỘT PHẦN | /cai-dat/vai-tro · Phân quyền và ghi vết có; báo cáo tuân thủ chưa có. |

### QT-14 QUY TRÌNH XỬ LÝ KHỦNG HOẢNG TRUYỀN THÔNG

| Bước | Người làm | Việc | Trạng thái | Làm ở / ghi chú |
|---|---|---|---|---|
| B1 | Người phát hiện | Báo ngay đầu mối (Tiếp thị/BLĐ); không tự ý phản hồi công khai. | NGOÀI PHẦN MỀM | Người phát hiện báo ngay đầu mối. |
| B2 | BLĐ | Lập tổ xử lý; đánh giá mức độ & nguyên nhân (dịch vụ/hiểu nhầm/biến chứng). | NGOÀI PHẦN MỀM | Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng). |
| B3 | CSKH/Bác sĩ | Xử lý gốc với KH (theo QT-11/12); ưu tiên giải quyết thực chất. | NGOÀI PHẦN MỀM | Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng). |
| B4 | Tiếp thị | Phản hồi công khai nhất quán, minh bạch, đúng mực (nếu cần). | NGOÀI PHẦN MỀM | Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng). |
| B5 | BLĐ/Pháp lý | Đánh giá rủi ro pháp lý; hành động bảo vệ thương hiệu. | NGOÀI PHẦN MỀM | Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng). |
| B6 | BLĐ | Rút kinh nghiệm; cập nhật quy trình phòng ngừa. | NGOÀI PHẦN MỀM | Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng). |
