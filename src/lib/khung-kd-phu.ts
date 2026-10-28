// Sinh tự động bởi scripts/sinh-khung-kd.py — KHÔNG sửa tay. Bản đồ phủ: mỗi bước quy trình / biểu mẫu đang được làm ở màn nào của AMIA OS.
export type TrangThaiPhu = "co" | "mot_phan" | "thieu" | "ngoai";
export type Phu = { tt: TrangThaiPhu; link: string; ghi: string };
export const NHAN_PHU: Record<TrangThaiPhu, string> = { co: "Đã có trên hệ thống", mot_phan: "Có một phần", thieu: "Chưa có, cần xây", ngoai: "Thao tác con người" };
export const PHU_BM: Record<string, Phu> = {
  "BM01": {
    "tt": "mot_phan",
    "link": "/khach-hang",
    "ghi": "Hồ sơ khách và lead có nguồn, dịch vụ quan tâm, người phụ trách, hạng. Thiếu: phân khúc/tầng khách."
  },
  "BM02": {
    "tt": "thieu",
    "link": "/khach-hang",
    "ghi": "Chưa có bản khai tiền sử và chống chỉ định có cấu trúc (dị ứng, thuốc đang dùng, thai kỳ); hiện chỉ có Ghi chú điều trị gõ tự do."
  },
  "BM03": {
    "tt": "mot_phan",
    "link": "/khach-hang",
    "ghi": "Tab Ghi chú điều trị (tình trạng, yêu cầu, phương án, kết quả, bác sĩ). Chưa có chỉ định phác đồ theo số buổi và khoảng cách."
  },
  "BM04": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có phiếu tư vấn (nhu cầu, gói đề xuất, phản đối, kết quả chốt)."
  },
  "BM05": {
    "tt": "co",
    "link": "/van-ban/danh-sach",
    "ghi": "Văn bản loại Hợp đồng mua dịch vụ / gói / thẻ, có hiệu lực và bản điện tử."
  },
  "BM06": {
    "tt": "mot_phan",
    "link": "/van-ban/danh-sach",
    "ghi": "Có loại văn bản phụ lục; chưa có lịch từng buổi và khoảng cách theo phác đồ."
  },
  "BM07": {
    "tt": "co",
    "link": "/van-ban/dong-y-anh",
    "ghi": "Đồng ý chụp ảnh theo dõi điều trị và đồng ý dùng ảnh cho truyền thông (có hạn, rút lại được)."
  },
  "BM08": {
    "tt": "mot_phan",
    "link": "/ban-hang",
    "ghi": "Có đơn bán và công nợ; chưa có phiếu chốt đơn / đặt cọc riêng và kiểm tra tỷ lệ cọc."
  },
  "BM09": {
    "tt": "co",
    "link": "/hoa-don",
    "ghi": "Hoá đơn, phiếu thu, thanh toán nhiều phương thức."
  },
  "BM10": {
    "tt": "co",
    "link": "/tai-chinh/cong-no-khach",
    "ghi": "Công nợ khách chia 6 nhóm tuổi nợ."
  },
  "BM11": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có phiếu bàn giao Tư vấn → KTV (hiện có lịch hẹn và phiếu cấp vật tư)."
  },
  "BM12": {
    "tt": "co",
    "link": "/the",
    "ghi": "Buổi thực hiện theo thẻ liệu trình: KTV, bác sĩ, tham số buổi."
  },
  "BM13": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Tab Ảnh của khách: kho riêng tư, ghi vết mỗi lần xem."
  },
  "BM14": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có phiếu hướng dẫn chăm sóc tại nhà."
  },
  "BM15": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Có lịch hẹn và thông báo đẩy nội bộ; nhắc lịch gửi tới khách (Zalo, SMS) cần tài khoản bên thứ ba."
  },
  "BM16": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có khảo sát hài lòng."
  },
  "BM17": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Phiếu tiếp nhận khiếu nại: khách, kênh, loại, nội dung, người và giờ tiếp nhận, phương án, duyệt, khách xác nhận đóng. Số giờ SLA tiếp nhận chờ chị chốt."
  },
  "BM18": {
    "tt": "mot_phan",
    "link": "/khieu-nai?tab=bien-chung",
    "ghi": "Biên bản biến chứng: dấu hiệu, chẩn đoán, phương án, cam kết, nguyên nhân gốc, báo lãnh đạo; chẩn đoán chỉ người xem hồ sơ điều trị đọc được. Chưa có chữ ký khách trên biên bản."
  },
  "BM19": {
    "tt": "mot_phan",
    "link": "/khach-hang",
    "ghi": "Tab Khiếu nại & bảo hành tính mốc từ buổi cuối (3–6 tháng 50%, 6–12 tháng 40%, quá 12 tháng giá mới, triệt lông 1 năm/lần) và ghi từng lần làm lại. Chưa in phiếu điều kiện bảo hành từng dịch vụ."
  },
  "BM20": {
    "tt": "co",
    "link": "/the",
    "ghi": "Thẻ khách: liệu trình / giá trị, số dư, hạn dùng."
  },
  "BM21": {
    "tt": "mot_phan",
    "link": "/the",
    "ghi": "Có điều chỉnh và cấp thẻ tay; chưa có phiếu chuyển đổi / chuyển nhượng thẻ."
  },
  "BM22": {
    "tt": "mot_phan",
    "link": "/marketing/doi-tac",
    "ghi": "Khách có người giới thiệu; đối tác/CTV có mã giới thiệu. Chưa có thưởng referral."
  },
  "BM23": {
    "tt": "co",
    "link": "/quy-trinh?tab=kich-ban",
    "ghi": "Bộ kịch bản mẫu KB1–KB10 nằm trong Quy trình; kịch bản theo từng dịch vụ viết thêm ở Wiki công ty."
  },
  "BM24": {
    "tt": "co",
    "link": "/bao-cao",
    "ghi": "Báo cáo doanh thu, nhân viên, phễu; báo cáo ngày ở Nơi làm việc."
  },
  "BM25": {
    "tt": "thieu",
    "link": "/nhan-su",
    "ghi": "Chưa có phiếu đánh giá TVV (BSC/KPI nhân sự đang làm tiếp)."
  },
  "BM26": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có bộ câu hỏi khai thác nhu cầu; sẽ gắn vào phiếu tư vấn BM04."
  }
};
export const PHU_BUOC: Record<string, Phu> = {
  "QT-01.B1": {
    "tt": "co",
    "link": "/marketing/lead",
    "ghi": "Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận."
  },
  "QT-01.B2": {
    "tt": "co",
    "link": "/marketing/lead",
    "ghi": "Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận."
  },
  "QT-01.B3": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Chuẩn bị tâm thế và xem ghi chú trước khi gọi."
  },
  "QT-01.B4": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Cuộc gọi, theo kịch bản KB1."
  },
  "QT-01.B5": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có bộ câu hỏi khai thác BM26."
  },
  "QT-01.B6": {
    "tt": "co",
    "link": "/marketing/lead",
    "ghi": "Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận."
  },
  "QT-01.B7": {
    "tt": "co",
    "link": "/marketing/lead",
    "ghi": "Lead có nguồn, phân bổ owner, trạng thái liên hệ, cảnh báo chưa nhận."
  },
  "QT-01.B8": {
    "tt": "co",
    "link": "/marketing/lead",
    "ghi": "Lead quá hạn lên cảnh báo trên chuông."
  },
  "QT-02.B1": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn."
  },
  "QT-02.B2": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có bộ câu hỏi khai thác BM26."
  },
  "QT-02.B3": {
    "tt": "mot_phan",
    "link": "/quy-trinh?tab=kich-ban",
    "ghi": "Có kịch bản KB3; chưa có kho minh chứng trước/sau gắn câu tư vấn."
  },
  "QT-02.B4": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn."
  },
  "QT-02.B5": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Tư vấn bằng lời và chat; ghi kết quả ở lead / lịch hẹn."
  },
  "QT-02.B6": {
    "tt": "co",
    "link": "/lich-hen",
    "ghi": "Đặt lịch khám / soi da."
  },
  "QT-02.B7": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có phiếu tư vấn BM04."
  },
  "QT-03.B1": {
    "tt": "co",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ."
  },
  "QT-03.B2": {
    "tt": "co",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ."
  },
  "QT-03.B3": {
    "tt": "co",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ."
  },
  "QT-03.B4": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Chưa nhắc lịch tới khách tự động (cần Zalo / SMS)."
  },
  "QT-03.B5": {
    "tt": "co",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn kiểm trùng lịch, đồng bộ cho chi nhánh, nhắc nội bộ."
  },
  "QT-04.B1": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Tác phong đón khách trong 30 giây."
  },
  "QT-04.B2": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người."
  },
  "QT-04.B3": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Bố trí phòng chờ sạch, riêng tư."
  },
  "QT-04.B4": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người."
  },
  "QT-04.B5": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Cho xem ảnh trước/sau (kho minh chứng có đồng ý của khách)."
  },
  "QT-04.B6": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn có trạng thái đến / đang phục vụ; tác phong tiếp đón là thao tác con người."
  },
  "QT-05.B1": {
    "tt": "mot_phan",
    "link": "/khach-hang",
    "ghi": "Ghi chú điều trị có phương án; chưa có phụ lục phác đồ số buổi."
  },
  "QT-05.B2": {
    "tt": "co",
    "link": "/the",
    "ghi": "Gói và thẻ liệu trình có giá và hạn dùng."
  },
  "QT-05.B3": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Xử lý phản đối bằng lời (KB4–KB6)."
  },
  "QT-05.B4": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Câu chốt (KB7)."
  },
  "QT-05.B5": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có phiếu chốt / đặt cọc BM08."
  },
  "QT-05.B6": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có hạn mức chiết khấu theo cấp và quy trình duyệt vượt hạn mức."
  },
  "QT-06.B1": {
    "tt": "co",
    "link": "/van-ban/danh-sach",
    "ghi": "Hợp đồng và phụ lục."
  },
  "QT-06.B2": {
    "tt": "co",
    "link": "/van-ban/dong-y-anh",
    "ghi": "Cam kết chụp ảnh và bảo mật hình ảnh."
  },
  "QT-06.B3": {
    "tt": "mot_phan",
    "link": "/van-ban/danh-sach",
    "ghi": "Có ngưỡng ký theo tham số; chờ chị Lâm chốt ngưỡng."
  },
  "QT-06.B4": {
    "tt": "mot_phan",
    "link": "/ban-hang",
    "ghi": "Thu tiền và phiếu thu có; chưa kiểm tỷ lệ cọc."
  },
  "QT-06.B5": {
    "tt": "co",
    "link": "/tai-chinh/cong-no-khach",
    "ghi": "Ghi nhận doanh thu và công nợ."
  },
  "QT-06.B6": {
    "tt": "co",
    "link": "/van-ban/danh-sach",
    "ghi": "Lưu hợp đồng, phân quyền, đồng bộ hồ sơ khách."
  },
  "QT-07.B1": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có phiếu bàn giao BM11."
  },
  "QT-07.B2": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Tab Ảnh của khách."
  },
  "QT-07.B3": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Quy trình vô khuẩn và kiểm tra máy."
  },
  "QT-07.B4": {
    "tt": "co",
    "link": "/the",
    "ghi": "Buổi thực hiện theo thẻ."
  },
  "QT-07.B5": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Bác sĩ giám sát tại chỗ."
  },
  "QT-07.B6": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Ảnh sau và kết quả."
  },
  "QT-08.B1": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng."
  },
  "QT-08.B2": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng."
  },
  "QT-08.B3": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Lịch hẹn có; nhắc tới khách cần Zalo / SMS."
  },
  "QT-08.B4": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng."
  },
  "QT-08.B5": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có theo dõi sau điều trị, hướng dẫn chăm sóc tại nhà, khảo sát hài lòng."
  },
  "QT-09.B1": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có lịch chăm sóc sinh nhật, dịp lễ, theo nhóm khách."
  },
  "QT-09.B2": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH."
  },
  "QT-09.B3": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH."
  },
  "QT-09.B4": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có lịch chăm sóc (sinh nhật, nhắc lịch, tri ân) cho CSKH."
  },
  "QT-10.B1": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Ảnh trước/sau và lịch sử giao dịch."
  },
  "QT-10.B2": {
    "tt": "mot_phan",
    "link": "/khach-hang",
    "ghi": "Khách có người giới thiệu; chưa có thưởng referral và ma trận bán chéo."
  },
  "QT-10.B3": {
    "tt": "mot_phan",
    "link": "/khach-hang",
    "ghi": "Khách có người giới thiệu; chưa có thưởng referral và ma trận bán chéo."
  },
  "QT-10.B4": {
    "tt": "thieu",
    "link": "",
    "ghi": "Chưa có thưởng referral BM22."
  },
  "QT-10.B5": {
    "tt": "co",
    "link": "/marketing/lead",
    "ghi": "Lead nguồn Khách cũ giới thiệu."
  },
  "QT-11.B1": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Tiếp nhận, phân loại, phương án, duyệt (người ghi/đề xuất không tự duyệt), khách xác nhận mới đóng, nguyên nhân gốc. SLA tiếp nhận và hạn mức tự xử lý chờ chốt."
  },
  "QT-11.B2": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Tiếp nhận, phân loại, phương án, duyệt (người ghi/đề xuất không tự duyệt), khách xác nhận mới đóng, nguyên nhân gốc. SLA tiếp nhận và hạn mức tự xử lý chờ chốt."
  },
  "QT-11.B3": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Ghi nguyên nhân đã xác minh và phương án ngay trên phiếu."
  },
  "QT-11.B4": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Phương án có chi phí chờ Quản lý duyệt (thông báo đẩy); người ghi/đề xuất không tự duyệt."
  },
  "QT-11.B5": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Tiếp nhận, phân loại, phương án, duyệt (người ghi/đề xuất không tự duyệt), khách xác nhận mới đóng, nguyên nhân gốc. SLA tiếp nhận và hạn mức tự xử lý chờ chốt."
  },
  "QT-11.B6": {
    "tt": "co",
    "link": "/khieu-nai",
    "ghi": "Tiếp nhận, phân loại, phương án, duyệt (người ghi/đề xuất không tự duyệt), khách xác nhận mới đóng, nguyên nhân gốc. SLA tiếp nhận và hạn mức tự xử lý chờ chốt."
  },
  "QT-12.B1": {
    "tt": "mot_phan",
    "link": "/lich-hen",
    "ghi": "Nút Báo bất thường trên lịch hẹn và hồ sơ khách; ngừng thao tác và đưa khách tới bác sĩ vẫn là việc con người."
  },
  "QT-12.B2": {
    "tt": "co",
    "link": "/khieu-nai?tab=bien-chung",
    "ghi": "Bác sĩ ghi chẩn đoán và phương án bằng văn bản trên ca."
  },
  "QT-12.B3": {
    "tt": "co",
    "link": "/khieu-nai?tab=bien-chung",
    "ghi": "Báo dấu hiệu bất thường, bác sĩ khám và lập phương án, cam kết, báo lãnh đạo tự động 100% ca, nguyên nhân gốc và phòng ngừa."
  },
  "QT-12.B4": {
    "tt": "co",
    "link": "/khieu-nai?tab=bien-chung",
    "ghi": "Báo dấu hiệu bất thường, bác sĩ khám và lập phương án, cam kết, báo lãnh đạo tự động 100% ca, nguyên nhân gốc và phòng ngừa."
  },
  "QT-12.B5": {
    "tt": "co",
    "link": "/khieu-nai?tab=bien-chung",
    "ghi": "Báo dấu hiệu bất thường, bác sĩ khám và lập phương án, cam kết, báo lãnh đạo tự động 100% ca, nguyên nhân gốc và phòng ngừa."
  },
  "QT-13.B1": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Form thông tin khách chuẩn."
  },
  "QT-13.B2": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Dữ liệu khách tập trung, phân quyền, ghi vết xem dữ liệu sức khoẻ."
  },
  "QT-13.B3": {
    "tt": "mot_phan",
    "link": "/marketing/lead",
    "ghi": "Lead chuyển thành khách; chuyển giao giữa các bộ phận chưa có xác nhận nhận bàn giao."
  },
  "QT-13.B4": {
    "tt": "co",
    "link": "/khach-hang",
    "ghi": "Dữ liệu khách tập trung, phân quyền, ghi vết xem dữ liệu sức khoẻ."
  },
  "QT-13.B5": {
    "tt": "mot_phan",
    "link": "/cai-dat/vai-tro",
    "ghi": "Phân quyền và ghi vết có; báo cáo tuân thủ chưa có."
  },
  "QT-14.B1": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Người phát hiện báo ngay đầu mối."
  },
  "QT-14.B2": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng)."
  },
  "QT-14.B3": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng)."
  },
  "QT-14.B4": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng)."
  },
  "QT-14.B5": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng)."
  },
  "QT-14.B6": {
    "tt": "ngoai",
    "link": "",
    "ghi": "Phát ngôn và xử lý khủng hoảng là việc của Ban Lãnh đạo; hệ thống chỉ lưu vụ việc liên quan (khiếu nại, biến chứng)."
  }
};
