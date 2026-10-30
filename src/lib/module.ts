// Khung chức năng theo từng mục lớn của menu (đối chiếu BeDental, cắt phần nha khoa).
// Mỗi mục lớn có trang tổng quan gồm các thẻ chức năng; thẻ có `duongDan` là đã dùng được, không có thì hiện nhãn trạng thái.
// Làm xong chức năng nào thì thêm `duongDan` + đổi trạng thái ở đây — menu và trang tổng quan tự theo.
import type { Quyen } from "@/lib/quyen";

export type TrangThaiThe = "san_sang" | "dang_lam" | "sap_co";
export type The = { ten: string; moTa: string; duongDan?: string; trangThai: TrangThaiThe; quyen?: Quyen[] };
export type NhomThe = { nhan: string; the: The[] };
export type Module = { ma: string; ten: string; duongDan: string; moTa: string; quyen: Quyen[] | null; nhom: NhomThe[] };

export const NHAN_TRANG_THAI: Record<TrangThaiThe, string> = { san_sang: "Sẵn sàng", dang_lam: "Đang hoàn thiện", sap_co: "Sắp có" };

export const MODULE: Module[] = [
  {
    ma: "noi-lam-viec", ten: "Nơi làm việc", duongDan: "/noi-lam-viec", quyen: ["noibo.dung", "lich.xem", "khach.xem", "the.xem", "phieu.xem", "ban.xem"],
    moTa: "Cổng làm việc hằng ngày: việc cần làm, chấm công, đề xuất và kiến thức nội bộ.",
    nhom: [
      { nhan: "Công việc & chấm công", the: [
        { ten: "Việc của tôi hôm nay", moTa: "Lịch, thẻ, phiếu vật tư và việc được giao cho tôi.", duongDan: "/trang-chu", trangThai: "san_sang" },
        { ten: "Việc cần hoàn thành", moTa: "Việc được giao cho tôi, việc tôi giao và việc quá hạn.", duongDan: "/noi-lam-viec/viec", trangThai: "san_sang" },
        { ten: "Bảng chấm công", moTa: "Chấm công và giờ làm thực tế.", duongDan: "/nhan-su/cham-cong", trangThai: "san_sang" },
        { ten: "Đơn nghỉ & phiếu nhân sự", moTa: "Xin nghỉ, tăng ca, đi trễ, điều chỉnh công; xem phép năm.", duongDan: "/nhan-su/ngay-nghi", trangThai: "san_sang" },
        { ten: "Hồ sơ của tôi", moTa: "Tự điền thông tin cá nhân, người thân, tải giấy tờ; xin nghỉ việc.", duongDan: "/nhan-su/ho-so-cua-toi", trangThai: "san_sang" },
        { ten: "Phiếu lương của tôi", moTa: "Lương các kỳ đã được duyệt.", duongDan: "/nhan-su/luong/phieu", trangThai: "san_sang" },
        { ten: "Báo cáo ngày", moTa: "Nhân viên nộp báo cáo công việc cuối ngày.", duongDan: "/noi-lam-viec/bao-cao-ngay", trangThai: "san_sang" },
      ] },
      { nhan: "Kiến thức nội bộ", the: [
        { ten: "Wiki công ty", moTa: "Quy định, quy trình và tài liệu đã ban hành.", duongDan: "/noi-lam-viec/wiki", trangThai: "san_sang" },
        { ten: "Quy trình & khung vận hành", moTa: "14 quy trình kinh doanh, checklist thao tác, kịch bản mẫu, biểu mẫu, KPI và kế hoạch triển khai.", duongDan: "/quy-trinh", trangThai: "san_sang" },
        { ten: "Khiếu nại, biến chứng & bảo hành", moTa: "Ghi nhận khiếu nại, xử lý theo QT-11/12, báo biến chứng cho bác sĩ, tra mốc bảo hành.", duongDan: "/khieu-nai", trangThai: "san_sang", quyen: ["kn.ghi", "kn.duyet", "bc.bao", "bc.xu_ly"] },
      ] },
      { nhan: "Đề xuất & phê duyệt", the: [
        { ten: "Trung tâm phê duyệt", moTa: "Một nơi duyệt đề xuất nội bộ và đơn mua hàng, rồi thực hiện ngay.", duongDan: "/noi-lam-viec/phe-duyet", trangThai: "san_sang" },
        { ten: "Đề xuất mua sắm", moTa: "Phiếu đề nghị mua hàng gửi quản lý duyệt.", duongDan: "/noi-lam-viec/de-xuat?tab=mua-sam", trangThai: "san_sang" },
        { ten: "Đề xuất thanh toán", moTa: "Đề xuất chi một khoản, gửi quản lý duyệt.", duongDan: "/noi-lam-viec/de-xuat?tab=thanh-toan", trangThai: "san_sang" },
        { ten: "Đề xuất tạm ứng lương", moTa: "Nhân viên xin tạm ứng lương.", duongDan: "/noi-lam-viec/de-xuat?tab=tam-ung", trangThai: "san_sang" },
      ] },
    ],
  },
  {
    ma: "tai-chinh", ten: "Tài chính - Kế toán", duongDan: "/tai-chinh", quyen: ["quy.xem", "baocao.tien", "no.thu", "ky.khoa"],
    moTa: "Sổ quỹ thu/chi, công nợ, hoá đơn và quyết toán.",
    nhom: [
      { nhan: "Thu / chi", the: [
        { ten: "Sổ quỹ", moTa: "Tiền mặt và ngân hàng: thu/chi, chuyển quỹ, số dư, xuất Excel.", duongDan: "/tai-chinh/so-quy", trangThai: "san_sang", quyen: ["quy.xem"] },
        { ten: "Khoản thu", moTa: "Ghi nhận khoản thu ngoài hoá đơn.", duongDan: "/tai-chinh/so-quy?moi=thu", trangThai: "san_sang", quyen: ["quy.ghi"] },
        { ten: "Khoản chi", moTa: "Ghi nhận khoản chi, chi phí.", duongDan: "/tai-chinh/so-quy?moi=chi", trangThai: "san_sang", quyen: ["quy.ghi"] },
      ] },
      { nhan: "Công nợ", the: [
        { ten: "Công nợ khách hàng", moTa: "Khách còn nợ theo 6 nhóm tuổi nợ, trạng thái nhắc và tranh chấp.", duongDan: "/tai-chinh/cong-no-khach", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Công nợ phải trả nhà cung cấp", moTa: "Công nợ và thanh toán nhà cung cấp.", duongDan: "/kho-mua-sam/cong-no", trangThai: "san_sang", quyen: ["mua.xem"] },
        { ten: "Ngân sách", moTa: "Ngân sách tháng theo phân loại chi, so với đã chi từ sổ quỹ.", duongDan: "/tai-chinh/ngan-sach", trangThai: "san_sang", quyen: ["quy.xem"] },
      ] },
      { nhan: "Hoá đơn", the: [
        { ten: "Danh sách hoá đơn", moTa: "Hoá đơn bán hàng, thu nợ, huỷ.", duongDan: "/hoa-don", trangThai: "san_sang", quyen: ["ban.xem"] },
        { ten: "Hoá đơn đầu vào", moTa: "Hoá đơn mua vào: theo dõi hoá đơn chưa về, đối chiếu với đơn mua.", duongDan: "/tai-chinh/hoa-don-dau-vao", trangThai: "san_sang", quyen: ["mua.xem"] },
        { ten: "Hoá đơn điện tử", moTa: "Kết nối hoá đơn điện tử (cần tài khoản nhà cung cấp).", trangThai: "sap_co" },
      ] },
      { nhan: "Quyết toán & kế toán", the: [
        { ten: "Quyết toán hoa hồng", moTa: "Hoa hồng theo tháng, so số hiện tại với số đã chốt trong bảng lương.", duongDan: "/tai-chinh/quyet-toan-hoa-hong", trangThai: "san_sang", quyen: ["luong.xem"] },
        { ten: "Đối soát bán hàng", moTa: "Sản phẩm bán so với xuất kho, giá vốn và doanh thu sau huỷ.", duongDan: "/tai-chinh/doi-soat", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Khoá kỳ kế toán", moTa: "Khoá/mở kỳ theo tháng, chặn ghi thêm sổ quỹ và công nợ của tháng đã chốt.", duongDan: "/tai-chinh/khoa-ky", trangThai: "san_sang", quyen: ["ky.khoa", "ky.mo_lai"] },
      ] },
    ],
  },
  {
    ma: "kho-mua-sam", ten: "Kho & Mua sắm", duongDan: "/kho-mua-sam", quyen: ["kho.xem", "phieu.xem"],
    moTa: "Kho, vật tư cấp theo ca, nhập hàng, mua hàng, điều chuyển và kiểm kê.",
    nhom: [
      { nhan: "Kho & tồn kho", the: [
        { ten: "Tồn kho", moTa: "Số tồn hiện tại theo chi nhánh và mặt hàng.", duongDan: "/kho", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Quản lý kho hàng bán", moTa: "Sản phẩm bán lẻ: tồn theo nhóm, còn hàng / sắp hết / hết / bị âm, tổng giá trị kho.", duongDan: "/kho/hang-ban", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Quản lý kho nội bộ", moTa: "Vật tư tiêu hao dùng trong phòng khám (chỉ xem).", duongDan: "/kho/noi-bo", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Sổ kho", moTa: "Sổ cái biến động nhập/xuất.", duongDan: "/kho?tab=so", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Định mức vật tư", moTa: "Vật tư dùng cho từng dịch vụ.", duongDan: "/dinh-muc", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Phiếu cấp vật tư", moTa: "Cấp vật tư trước ca, trả, đối chiếu.", duongDan: "/phieu-cap", trangThai: "san_sang", quyen: ["phieu.xem"] },
      ] },
      { nhan: "Nhập & mua hàng", the: [
        { ten: "Nhà cung cấp", moTa: "Danh mục nhà cung cấp, hạn thanh toán, công nợ.", duongDan: "/kho-mua-sam/nha-cung-cap", trangThai: "san_sang", quyen: ["mua.xem"] },
        { ten: "Mua hàng (đề nghị / đơn mua)", moTa: "Lập đơn, gửi duyệt, nhận hàng vào kho.", duongDan: "/kho-mua-sam/mua-hang", trangThai: "san_sang", quyen: ["mua.xem"] },
        { ten: "Công nợ nhà cung cấp", moTa: "Công nợ phải trả và thanh toán.", duongDan: "/kho-mua-sam/cong-no", trangThai: "san_sang", quyen: ["mua.xem"] },
      ] },
      { nhan: "Điều chỉnh & kiểm soát", the: [
        { ten: "Chuyển kho", moTa: "Chuyển hàng giữa các chi nhánh; kho nhận xác nhận trong 24 giờ.", duongDan: "/kho/chuyen-kho", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Kiểm kê kho", moTa: "Chụp tồn, hai người đếm, duyệt rồi mới ghi chênh lệch.", duongDan: "/kho/kiem-ke", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Xử lý vật tư & xuất khẩn cấp", moTa: "Huỷ, hao hụt, trả nhà cung cấp, điều chỉnh tồn có duyệt; xuất cấp cứu hậu kiểm 24 giờ.", duongDan: "/kho/xu-ly", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Lô & hạn dùng", moTa: "Lô sắp hết hạn trong 30, 60, 90 ngày và hàng quá hạn.", duongDan: "/kho?tab=han", trangThai: "san_sang", quyen: ["kho.xem"] },
      ] },
    ],
  },
  {
    ma: "nhan-su", ten: "Nhân sự", duongDan: "/nhan-su", quyen: ["nhanvien.quanly", "hr.hoso", "baocao.tien", "cong.xem", "cong.sua", "nghi.duyet", "luong.xem"],
    moTa: "Vòng đời nhân sự từ tuyển dụng tới nghỉ việc: tuyển, onboarding, hồ sơ, đào tạo, hiệu suất, thăng tiến, công lương, lịch.",
    nhom: [
      { nhan: "1 · Tuyển dụng", the: [
        { ten: "Quản lý ứng viên", moTa: "Yêu cầu tuyển, tin tuyển dụng, ứng viên theo từng bước, kênh đăng và chi phí.", duongDan: "/nhan-su/tuyen-dung", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Quản lý công việc tuyển dụng", moTa: "Việc cần làm của từng đợt tuyển: ai gọi, ai phỏng vấn, hạn nào.", duongDan: "/nhan-su/tuyen-dung/viec", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Báo cáo tuyển dụng", moTa: "Số CV, phỏng vấn, nhận việc theo kênh và theo tháng; chi phí mỗi người tuyển.", duongDan: "/nhan-su/tuyen-dung?tab=bao-cao", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Email tuyển dụng tự động", moTa: "Mẫu thư theo từng bước ứng viên, hàng đợi gửi, kết nối Gmail để gửi tự động.", duongDan: "/nhan-su/tuyen-dung/email", trangThai: "san_sang", quyen: ["hr.hoso"] },
      ] },
      { nhan: "2 · Onboarding và thử việc", the: [
        { ten: "Onboarding thử việc", moTa: "Các mốc 0, 3, 7, 30, 60 ngày cho nhân viên mới.", duongDan: "/nhan-su/onboarding", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Mục tiêu thử việc", moTa: "Mục tiêu 30 và 60 ngày của từng người, thống nhất với quản lý.", duongDan: "/nhan-su/thu-viec?tab=muc-tieu", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Đánh giá thử việc", moTa: "Mentor, quản lý, nhân sự đánh giá ở mốc 30 và 60 ngày; quyết định lên chính thức.", duongDan: "/nhan-su/thu-viec?tab=danh-gia", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Báo cáo onboarding", moTa: "Tiến độ lộ trình, tỉ lệ đạt thử việc, người sắp hết hạn thử việc.", duongDan: "/nhan-su/bao-cao?tab=onboarding", trangThai: "san_sang", quyen: ["hr.hoso"] },
      ] },
      { nhan: "3 · Hồ sơ nhân sự", the: [
        { ten: "Hồ sơ nhân sự", moTa: "Hồ sơ từng người: thông tin cá nhân, giấy tờ, người thân, lộ trình, công phép; thống kê quân số.", duongDan: "/nhan-su/ho-so", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Hợp đồng lao động", moTa: "Thử việc → HĐLĐ lần 1 → lần 2 → không xác định thời hạn; nhắc trước 45 ngày.", duongDan: "/nhan-su/hop-dong", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Tài sản cấp phát", moTa: "Điện thoại, thẻ, đồng phục, thiết bị cấp cho từng người; bàn giao và thu hồi.", duongDan: "/nhan-su/tai-san", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Phòng ban & chức danh", moTa: "Danh mục dùng cho hồ sơ và lộ trình thăng tiến.", duongDan: "/nhan-su/danh-muc", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Tài khoản & phân quyền", moTa: "Tài khoản đăng nhập, vai trò, quyền, đặt lại mật khẩu.", duongDan: "/nhan-vien", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
      ] },
      { nhan: "4 · Đào tạo", the: [
        { ten: "Lộ trình đào tạo theo vị trí", moTa: "Mỗi vị trí cần học gì trong 60 ngày đầu và theo từng cấp bậc.", duongDan: "/nhan-su/dao-tao?tab=lo-trinh", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Lịch học và kết quả", moTa: "Lịch từng buổi, người tham dự, điểm và chứng chỉ.", duongDan: "/nhan-su/dao-tao?tab=ket-qua", trangThai: "san_sang", quyen: ["hr.hoso"] },
      ] },
      { nhan: "5 · Hiệu suất", the: [
        { ten: "Đánh giá KPI tháng / quý", moTa: "KPI từng người, xếp hạng theo phòng và toàn công ty để thi đua.", duongDan: "/nhan-su/kpi", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Khen thưởng – kỷ luật", moTa: "Ghi nhận khen thưởng, nhắc nhở, kỷ luật kèm quyết định.", duongDan: "/nhan-su/khen-thuong-ky-luat", trangThai: "san_sang", quyen: ["hr.hoso"] },
      ] },
      { nhan: "6 · Thăng tiến", the: [
        { ten: "Khung cấp bậc", moTa: "Các cấp bậc, điều kiện thăng cấp và khung lương tương ứng.", duongDan: "/nhan-su/thang-tien?tab=cap-bac", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Lịch sử thăng chức, điều chuyển", moTa: "Mỗi lần đổi chức danh, phòng ban, cấp bậc của từng người.", duongDan: "/nhan-su/thang-tien?tab=lich-su", trangThai: "san_sang", quyen: ["hr.hoso"] },
      ] },
      { nhan: "7 · Công lương", the: [
        { ten: "Chấm công / giờ làm", moTa: "Chấm công vào/ra, bảng công và tổng hợp tháng.", duongDan: "/nhan-su/cham-cong", trangThai: "san_sang" },
        { ten: "Quản lý ca kíp", moTa: "Ca làm, lịch tuần, phân ca, ngày lễ.", duongDan: "/nhan-su/ca-kip", trangThai: "san_sang" },
        { ten: "Quỹ phép & ngày nghỉ", moTa: "Phiếu nghỉ, tăng ca, điều chỉnh công và quỹ phép năm.", duongDan: "/nhan-su/ngay-nghi", trangThai: "san_sang" },
        { ten: "Bảng lương", moTa: "Lương, phụ cấp và khoản khấu trừ.", duongDan: "/nhan-su/luong", trangThai: "san_sang", quyen: ["luong.xem"] },
        { ten: "Thưởng – hoa hồng", moTa: "Hoa hồng bán hàng theo kỳ.", duongDan: "/hoa-hong", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "BHXH và phụ cấp", moTa: "Mức đóng bảo hiểm, phụ cấp ăn ca, đi lại, điện thoại theo từng người.", duongDan: "/nhan-su/bhxh-phu-cap", trangThai: "san_sang", quyen: ["luong.xem"] },
        { ten: "Quản lý chi phí", moTa: "Chi phí nhân sự theo tháng: lương, bảo hiểm, thưởng, tuyển dụng, đào tạo.", duongDan: "/nhan-su/chi-phi", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Báo cáo công lương", moTa: "Tổng hợp công, lương và phụ cấp theo tháng, theo phòng.", duongDan: "/nhan-su/bao-cao?tab=cong-luong", trangThai: "san_sang", quyen: ["luong.xem"] },
      ] },
      { nhan: "8 · Lịch", the: [
        { ten: "Nhân viên đến hạn HĐLĐ", moTa: "Hợp đồng sắp hết hạn trong 45 ngày tới.", duongDan: "/nhan-su/lich?tab=hdld", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Sinh nhật nhân viên", moTa: "Sinh nhật trong 45 ngày tới.", duongDan: "/nhan-su/lich?tab=sinh-nhat", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Lịch nghỉ phép", moTa: "Ai nghỉ ngày nào, trong phòng nào.", duongDan: "/nhan-su/lich?tab=nghi-phep", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Hết hạn thử việc", moTa: "Người sắp kết thúc thử việc cần quyết định.", duongDan: "/nhan-su/lich?tab=thu-viec", trangThai: "san_sang", quyen: ["cong.xem"] },
        { ten: "Lịch đánh giá định kỳ", moTa: "Các kỳ đánh giá KPI và xét lương sắp tới.", duongDan: "/nhan-su/lich?tab=danh-gia", trangThai: "san_sang", quyen: ["cong.xem"] },
      ] },
      { nhan: "9 · Offboarding", the: [
        { ten: "Đơn nghỉ việc và duyệt", moTa: "Đơn xin nghỉ, duyệt, bàn giao, biên bản, khoá tài khoản.", duongDan: "/nhan-su/nghi-viec", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Checklist bàn giao", moTa: "Việc, tài sản, tài khoản phải bàn giao trước ngày nghỉ.", duongDan: "/nhan-su/offboarding?tab=ban-giao", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Chốt công, lương, BHXH", moTa: "Chốt công đến ngày cuối, quyết toán lương, trả sổ BHXH.", duongDan: "/nhan-su/offboarding?tab=chot", trangThai: "san_sang", quyen: ["hr.hoso"] },
        { ten: "Phỏng vấn thôi việc", moTa: "Lý do nghỉ, yếu tố giữ chân, góp ý cho công ty.", duongDan: "/nhan-su/offboarding?tab=phong-van", trangThai: "san_sang", quyen: ["hr.hoso"] },
      ] },
      { nhan: "10 · Báo cáo tổng", the: [
        { ten: "Báo cáo nhân sự", moTa: "Quân số, biến động, tuyển dụng, thử việc, nghỉ việc, chi phí trong một trang.", duongDan: "/nhan-su/bao-cao?tab=tong", trangThai: "san_sang", quyen: ["baocao.tien"] },
      ] },
    ],
  },
  {
    ma: "van-ban", ten: "Văn bản & Hợp đồng", duongDan: "/van-ban", quyen: ["vb.xem"],
    moTa: "Quản lý văn bản từ dự thảo, ký, hiệu lực đến hết hạn.",
    nhom: [
      { nhan: "Hồ sơ", the: [
        { ten: "Tất cả văn bản", moTa: "Hợp đồng, quyết định, quy định, biên bản… kèm hiệu lực và bản điện tử.", duongDan: "/van-ban/danh-sach", trangThai: "san_sang", quyen: ["vb.xem"] },
        { ten: "Cần xử lý", moTa: "Sắp hết hạn, thiếu bản điện tử, phụ lục dùng tạm đã hết hạn, chờ duyệt.", duongDan: "/van-ban/danh-sach?tab=can-xu-ly", trangThai: "san_sang", quyen: ["vb.xem"] },
        { ten: "Đồng ý dùng ảnh", moTa: "Đồng ý chụp để theo dõi điều trị và đồng ý dùng ảnh cho truyền thông (có hạn, rút lại được).", duongDan: "/van-ban/dong-y-anh", trangThai: "san_sang", quyen: ["vb.xem"] },
        { ten: "Đối tác", moTa: "Danh sách đối tác ký hợp đồng (nhà cung cấp).", duongDan: "/kho-mua-sam/nha-cung-cap", trangThai: "san_sang", quyen: ["mua.xem"] },
      ] },
    ],
  },
  {
    ma: "marketing", ten: "Marketing", duongDan: "/marketing", quyen: ["mkt.xem", "lead.xu_ly"],
    moTa: "Khách tiềm năng, chiến dịch, nội dung, nguồn giới thiệu và báo cáo phễu.",
    nhom: [
      { nhan: "Khách tiềm năng", the: [
        { ten: "Lead & phễu khách", moTa: "Nhận lead, ghi liên hệ, chuyển thành khách; không xoá lead.", duongDan: "/marketing/lead", trangThai: "san_sang", quyen: ["lead.xu_ly"] },
        { ten: "Hộp thư đa kênh", moTa: "Trả lời khách qua Zalo OA, Messenger (cần kết nối kênh).", trangThai: "sap_co" },
      ] },
      { nhan: "Chiến dịch & nội dung", the: [
        { ten: "Chiến dịch", moTa: "Một mục tiêu cho mỗi chiến dịch, có duyệt trước khi chạy.", duongDan: "/marketing/chien-dich", trangThai: "san_sang", quyen: ["mkt.xem"] },
        { ten: "Quảng cáo theo ngày", moTa: "Chi phí và số liệu quảng cáo từng ngày theo chiến dịch.", duongDan: "/marketing/quang-cao", trangThai: "san_sang", quyen: ["mkt.xem"] },
        { ten: "Nội dung", moTa: "Việc làm nội dung: người làm, hạn, duyệt, link bài đăng.", duongDan: "/marketing/noi-dung", trangThai: "san_sang", quyen: ["mkt.xem"] },
      ] },
      { nhan: "Giới thiệu & theo dõi", the: [
        { ten: "Nguồn giới thiệu / cộng tác viên", moTa: "Đối tác giới thiệu, mã giới thiệu và danh sách nguồn lead.", duongDan: "/marketing/doi-tac", trangThai: "san_sang", quyen: ["mkt.xem"] },
        { ten: "Link / mã QR theo dõi", moTa: "Link đếm lượt bấm và mã QR cho từng chiến dịch.", duongDan: "/marketing/link", trangThai: "san_sang", quyen: ["mkt.xem"] },
      ] },
      { nhan: "Báo cáo", the: [
        { ten: "Báo cáo marketing", moTa: "Phễu lead → khách đến → thực thu và giá mỗi lead theo nguồn.", duongDan: "/marketing/bao-cao", trangThai: "san_sang", quyen: ["mkt.xem"] },
      ] },
    ],
  },
  {
    ma: "cai-dat", ten: "Cài đặt", duongDan: "/cai-dat", quyen: ["danhmuc.xem", "nhanvien.quanly", "hethong.phanquyen", "baocao.tien"],
    moTa: "Thiết lập cửa hàng, danh mục, hoa hồng, phân quyền.",
    nhom: [
      { nhan: "Thông tin cửa hàng", the: [
        { ten: "Thông tin chung", moTa: "Tên, địa chỉ, pháp nhân, giờ làm việc.", duongDan: "/cai-dat/thong-tin-chung", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Chi nhánh", moTa: "Chi nhánh: địa chỉ, điện thoại, hiện ở web đặt lịch, giờ làm việc.", duongDan: "/cai-dat/chi-nhanh", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Giờ làm việc", moTa: "Giờ mở cửa và ngày nghỉ của từng chi nhánh.", duongDan: "/cai-dat/gio-lam-viec", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Ngày tháng & tiền tệ & thuế", moTa: "Định dạng ngày giờ, ngôn ngữ, đơn vị tiền, VAT, phụ phí, tiền tip.", duongDan: "/cai-dat/thiet-lap-khac", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Thiết lập in", moTa: "Khổ giấy, dòng hiện trên tờ in hoá đơn / lịch hẹn, nội dung cuối tờ, mã QR thanh toán.", duongDan: "/cai-dat/thiet-lap-in", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Tài khoản ngân hàng", moTa: "Tài khoản dùng khi thu tiền chuyển khoản và sổ quỹ.", duongDan: "/cai-dat/ngan-hang", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Bảng tin công ty", moTa: "Thông báo hiển thị cho toàn công ty.", duongDan: "/cai-dat/bang-tin", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
      ] },
      { nhan: "Sản phẩm & dịch vụ", the: [
        { ten: "Danh mục dịch vụ", moTa: "Dịch vụ, giá và nhóm dịch vụ.", duongDan: "/danh-muc?tab=dich-vu", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Danh mục sản phẩm", moTa: "Sản phẩm, vật tư, giá bán, hạn dùng.", duongDan: "/danh-muc?tab=san-pham", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Loại thẻ / gói liệu trình", moTa: "Gói buổi, giá trị, dịch vụ trong gói.", duongDan: "/danh-muc?tab=goi-the", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Voucher / thẻ giảm giá", moTa: "Mã giảm giá khách đưa ở quầy: hạn dùng, số lần, chi nhánh, áp dụng cho dịch vụ hay sản phẩm.", duongDan: "/cai-dat/voucher", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Cài đặt chi phí dịch vụ", moTa: "Công thức chi phí: vật tư và số lượng dùng cho từng dịch vụ, chi phí khấu hao mỗi ca.", duongDan: "/dinh-muc", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Quản lý kho hàng bán", moTa: "Tồn kho sản phẩm bán lẻ theo nhóm và tình trạng.", duongDan: "/kho/hang-ban", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Quản lý kho nội bộ", moTa: "Vật tư tiêu hao dùng trong phòng khám.", duongDan: "/kho/noi-bo", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Rà soát danh mục", moTa: "Sản phẩm thiếu mã, trùng tên, thiếu hạn dùng.", duongDan: "/danh-muc?tab=ra-soat", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
      ] },
      { nhan: "Nhân viên", the: [
        { ten: "Nhân viên phục vụ", moTa: "Người làm dịch vụ: chức danh, nhóm, chi nhánh, hiển thị ở trang đặt lịch.", duongDan: "/cai-dat/nhan-vien-phuc-vu", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Tài khoản đăng nhập", moTa: "Danh sách tài khoản theo vai trò và chi nhánh; thiết lập quyền.", duongDan: "/cai-dat/tai-khoan-dang-nhap", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
        { ten: "Tài khoản & phân quyền", moTa: "Tài khoản đăng nhập, vai trò, quyền riêng từng người.", duongDan: "/nhan-vien", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
        { ten: "Vai trò & quyền", moTa: "Bảng mỗi vai trò mặc định làm được những gì.", duongDan: "/cai-dat/vai-tro", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
        { ten: "Cấu hình hoa hồng", moTa: "Tỉ lệ hoa hồng theo loại và vai.", duongDan: "/hoa-hong", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Chính sách phê duyệt", moTa: "Thao tác nào cần duyệt, ai duyệt, ngưỡng tiền.", duongDan: "/cai-dat/chinh-sach-duyet", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
      ] },
      { nhan: "Khách hàng & đặt lịch", the: [
        { ten: "Điểm khách hàng", moTa: "Quy đổi tiền thành điểm, điểm thành tiền, mức điểm từng hạng khách.", duongDan: "/cai-dat/diem-thuong", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
        { ten: "Web đặt Lịch", moTa: "Trang đặt lịch online cho khách: đường dẫn, khoá trang, đặt trước tối thiểu, số ngày nhận, khung giờ, thông báo email.", duongDan: "/cai-dat/web-dat-lich", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Zalo OA / SMS", moTa: "Nhắn nhắc lịch, chăm sóc (cần tài khoản Zalo OA / nhà mạng).", trangThai: "sap_co" },
      ] },
      { nhan: "Các thiết lập khác", the: [
        { ten: "Quy tắc kho & hạn dùng", moTa: "Chặn bán khi hết tồn, bắt buộc hạn dùng khi nhập kho.", duongDan: "/cai-dat/quy-tac-kho", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Chấm công & ca làm", moTa: "Ca văn phòng / chi nhánh, ngày lễ, trừ công trễ sớm.", duongDan: "/nhan-su/ca-kip", trangThai: "san_sang" },
      ] },
    ],
  },
];

export const moduleTheoMa = (ma: string) => MODULE.find((m) => m.ma === ma);
