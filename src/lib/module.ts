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
    ma: "noi-lam-viec", ten: "Nơi làm việc", duongDan: "/noi-lam-viec", quyen: ["lich.xem", "khach.xem", "the.xem", "phieu.xem", "ban.xem"],
    moTa: "Cổng làm việc hằng ngày: việc cần làm, chấm công, đề xuất và kiến thức nội bộ.",
    nhom: [
      { nhan: "Công việc & chấm công", the: [
        { ten: "Việc của tôi hôm nay", moTa: "Lịch, thẻ, phiếu vật tư và việc được giao cho tôi.", duongDan: "/trang-chu", trangThai: "san_sang" },
        { ten: "Việc cần hoàn thành", moTa: "Việc được giao cho tôi, việc tôi giao và việc quá hạn.", trangThai: "sap_co" },
        { ten: "Bảng chấm công", moTa: "Chấm công và giờ làm thực tế.", trangThai: "sap_co" },
        { ten: "Báo cáo ngày", moTa: "Nhân viên nộp báo cáo công việc cuối ngày.", trangThai: "sap_co" },
      ] },
      { nhan: "Kiến thức nội bộ", the: [
        { ten: "Wiki công ty", moTa: "Quy định, quy trình và tài liệu đã ban hành.", trangThai: "sap_co" },
      ] },
      { nhan: "Đề xuất & phê duyệt", the: [
        { ten: "Trung tâm phê duyệt", moTa: "Một nơi duyệt nghỉ phép, đề xuất nội bộ và thao tác nhạy cảm.", trangThai: "sap_co" },
        { ten: "Đề xuất mua sắm", moTa: "Phiếu đề nghị mua hàng gửi quản lý duyệt.", trangThai: "sap_co" },
        { ten: "Đề xuất thanh toán", moTa: "Đề xuất chi một khoản, gửi quản lý duyệt.", trangThai: "sap_co" },
        { ten: "Đề xuất tạm ứng lương", moTa: "Nhân viên xin tạm ứng lương.", trangThai: "sap_co" },
      ] },
    ],
  },
  {
    ma: "tai-chinh", ten: "Tài chính - Kế toán", duongDan: "/tai-chinh", quyen: ["quy.xem", "baocao.tien", "no.thu"],
    moTa: "Sổ quỹ thu/chi, công nợ, hoá đơn và quyết toán.",
    nhom: [
      { nhan: "Thu / chi", the: [
        { ten: "Sổ quỹ", moTa: "Tiền mặt và ngân hàng: thu/chi, chuyển quỹ, số dư, xuất Excel.", duongDan: "/tai-chinh/so-quy", trangThai: "san_sang", quyen: ["quy.xem"] },
        { ten: "Khoản thu", moTa: "Ghi nhận khoản thu ngoài hoá đơn.", duongDan: "/tai-chinh/so-quy?moi=thu", trangThai: "san_sang", quyen: ["quy.ghi"] },
        { ten: "Khoản chi", moTa: "Ghi nhận khoản chi, chi phí.", duongDan: "/tai-chinh/so-quy?moi=chi", trangThai: "san_sang", quyen: ["quy.ghi"] },
      ] },
      { nhan: "Công nợ", the: [
        { ten: "Công nợ khách hàng", moTa: "Khách còn nợ và thu nợ.", duongDan: "/bao-cao?tab=no", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Công nợ phải trả nhà cung cấp", moTa: "Công nợ và thanh toán nhà cung cấp.", trangThai: "sap_co" },
      ] },
      { nhan: "Hoá đơn", the: [
        { ten: "Danh sách hoá đơn", moTa: "Hoá đơn bán hàng, thu nợ, huỷ.", duongDan: "/hoa-don", trangThai: "san_sang", quyen: ["ban.xem"] },
        { ten: "Hoá đơn đầu vào", moTa: "Hoá đơn mua vào từ nhà cung cấp.", trangThai: "sap_co" },
        { ten: "Hoá đơn điện tử", moTa: "Kết nối hoá đơn điện tử (cần tài khoản nhà cung cấp).", trangThai: "sap_co" },
      ] },
      { nhan: "Quyết toán & kế toán", the: [
        { ten: "Quyết toán hoa hồng", moTa: "Chốt đợt hoa hồng cho nhân viên và cộng tác viên.", trangThai: "sap_co" },
        { ten: "Đối soát bán hàng", moTa: "Số lượng, giá vốn, doanh thu sau hoàn/trả theo sản phẩm.", trangThai: "sap_co" },
        { ten: "Khoá kỳ kế toán", moTa: "Khoá/mở kỳ theo tháng và chi nhánh, chặn sửa số đã chốt.", trangThai: "sap_co" },
      ] },
    ],
  },
  {
    ma: "kho-mua-sam", ten: "Kho & Mua sắm", duongDan: "/kho-mua-sam", quyen: ["kho.xem", "phieu.xem"],
    moTa: "Kho, vật tư cấp theo ca, nhập hàng, mua hàng, điều chuyển và kiểm kê.",
    nhom: [
      { nhan: "Kho & tồn kho", the: [
        { ten: "Tồn kho", moTa: "Số tồn hiện tại theo chi nhánh và mặt hàng.", duongDan: "/kho", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Sổ kho", moTa: "Sổ cái biến động nhập/xuất.", duongDan: "/kho?tab=so", trangThai: "san_sang", quyen: ["kho.xem"] },
        { ten: "Định mức vật tư", moTa: "Vật tư dùng cho từng dịch vụ.", duongDan: "/dinh-muc", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Phiếu cấp vật tư", moTa: "Cấp vật tư trước ca, trả, đối chiếu.", duongDan: "/phieu-cap", trangThai: "san_sang", quyen: ["phieu.xem"] },
      ] },
      { nhan: "Nhập & mua hàng", the: [
        { ten: "Nhà cung cấp", moTa: "Danh mục nhà cung cấp.", trangThai: "sap_co" },
        { ten: "Mua hàng (đề nghị / đơn mua)", moTa: "Đề nghị mua, duyệt, đơn mua, nhận hàng.", trangThai: "sap_co" },
        { ten: "Công nợ nhà cung cấp", moTa: "Công nợ phải trả và thanh toán.", trangThai: "sap_co" },
      ] },
      { nhan: "Điều chỉnh & kiểm soát", the: [
        { ten: "Điều chuyển kho", moTa: "Chuyển hàng giữa các kho / chi nhánh.", trangThai: "sap_co" },
        { ten: "Điều chỉnh tồn", moTa: "Tăng, giảm hoặc đặt lại số tồn, có lý do.", trangThai: "sap_co" },
        { ten: "Kiểm kê kho", moTa: "Kiểm kê và soát lệch tồn.", trangThai: "sap_co" },
      ] },
    ],
  },
  {
    ma: "nhan-su", ten: "Nhân sự", duongDan: "/nhan-su", quyen: ["nhanvien.quanly", "baocao.tien"],
    moTa: "Hồ sơ, chấm công, ca, nghỉ phép, hoa hồng và lương.",
    nhom: [
      { nhan: "Hồ sơ", the: [
        { ten: "Hồ sơ nhân viên", moTa: "Thông tin, vai trò, chi nhánh, trạng thái.", duongDan: "/nhan-vien", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
        { ten: "Hợp đồng & pháp lý", moTa: "Hợp đồng lao động và hồ sơ pháp lý.", trangThai: "sap_co" },
      ] },
      { nhan: "Chấm công", the: [
        { ten: "Chấm công / giờ làm", moTa: "Chấm công và giờ làm thực tế.", trangThai: "sap_co" },
        { ten: "Quản lý ca kíp", moTa: "Ca làm, lịch trực, phân ca.", trangThai: "sap_co" },
        { ten: "Quản lý ngày nghỉ", moTa: "Phép, nghỉ và duyệt vắng mặt.", trangThai: "sap_co" },
      ] },
      { nhan: "Lương & hoa hồng", the: [
        { ten: "Hoa hồng nhân viên", moTa: "Hoa hồng bán hàng theo kỳ.", duongDan: "/hoa-hong", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Bảng lương tổng hợp", moTa: "Lương, phụ cấp và khoản khấu trừ.", trangThai: "sap_co" },
      ] },
    ],
  },
  {
    ma: "van-ban", ten: "Văn bản & Hợp đồng", duongDan: "/van-ban", quyen: ["nhanvien.quanly"],
    moTa: "Quản lý văn bản từ dự thảo, ký, hiệu lực đến hết hạn.",
    nhom: [
      { nhan: "Hồ sơ", the: [
        { ten: "Tất cả văn bản", moTa: "Hợp đồng, quyết định, quy định, biên bản… kèm hiệu lực.", trangThai: "sap_co" },
        { ten: "Đối tác", moTa: "Danh sách đối tác ký hợp đồng.", trangThai: "sap_co" },
      ] },
    ],
  },
  {
    ma: "marketing", ten: "Marketing", duongDan: "/marketing", quyen: ["khach.sua"],
    moTa: "Khách tiềm năng, nguồn giới thiệu và theo dõi chiến dịch.",
    nhom: [
      { nhan: "Khách tiềm năng", the: [
        { ten: "Hộp khách tiềm năng", moTa: "Khách tiềm năng theo các bước chăm sóc.", trangThai: "sap_co" },
        { ten: "Hộp thư đa kênh", moTa: "Trả lời khách qua Zalo OA, Messenger (cần kết nối kênh).", trangThai: "sap_co" },
      ] },
      { nhan: "Giới thiệu & cộng tác viên", the: [
        { ten: "Nguồn giới thiệu / cộng tác viên", moTa: "Nguồn khách, cộng tác viên và hoa hồng giới thiệu.", trangThai: "sap_co" },
        { ten: "Link / mã QR theo dõi", moTa: "Link theo dõi nguồn khách cho từng chiến dịch.", trangThai: "sap_co" },
      ] },
    ],
  },
  {
    ma: "cai-dat", ten: "Cài đặt", duongDan: "/cai-dat", quyen: ["danhmuc.xem", "nhanvien.quanly", "hethong.phanquyen", "baocao.tien"],
    moTa: "Thiết lập cửa hàng, danh mục, hoa hồng, phân quyền.",
    nhom: [
      { nhan: "Cửa hàng", the: [
        { ten: "Thông tin chung", moTa: "Tên, địa chỉ, pháp nhân, giờ làm việc.", duongDan: "/cai-dat/thong-tin-chung", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Chi nhánh", moTa: "Chi nhánh và phân quyền vận hành.", duongDan: "/danh-muc?tab=chi-nhanh", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Tài khoản ngân hàng", moTa: "Tài khoản dùng khi thu tiền chuyển khoản và sổ quỹ.", duongDan: "/cai-dat/ngan-hang", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Bảng tin công ty", moTa: "Thông báo hiển thị cho toàn công ty.", duongDan: "/cai-dat/bang-tin", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
      ] },
      { nhan: "Sản phẩm / dịch vụ", the: [
        { ten: "Danh mục dịch vụ", moTa: "Dịch vụ, giá và nhóm dịch vụ.", duongDan: "/danh-muc?tab=dich-vu", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Danh mục sản phẩm", moTa: "Sản phẩm, vật tư, giá bán.", duongDan: "/danh-muc?tab=san-pham", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
        { ten: "Loại thẻ / gói liệu trình", moTa: "Gói buổi, giá trị, dịch vụ trong gói.", duongDan: "/danh-muc?tab=goi-the", trangThai: "san_sang", quyen: ["danhmuc.xem"] },
      ] },
      { nhan: "Hoa hồng & phân quyền", the: [
        { ten: "Cấu hình hoa hồng", moTa: "Tỉ lệ hoa hồng theo loại và vai.", duongDan: "/hoa-hong", trangThai: "san_sang", quyen: ["baocao.tien"] },
        { ten: "Tài khoản & phân quyền", moTa: "Tài khoản đăng nhập, vai trò, quyền riêng.", duongDan: "/nhan-vien", trangThai: "san_sang", quyen: ["hethong.phanquyen"] },
        { ten: "Chính sách phê duyệt", moTa: "Thao tác nào cần duyệt, ai duyệt, ngưỡng tiền.", trangThai: "sap_co" },
      ] },
      { nhan: "Kết nối", the: [
        { ten: "Web đặt lịch", moTa: "Trang đặt lịch online cho khách.", trangThai: "sap_co" },
        { ten: "Zalo OA / SMS", moTa: "Nhắn nhắc lịch, chăm sóc (cần tài khoản Zalo OA / nhà mạng).", trangThai: "sap_co" },
      ] },
    ],
  },
];

export const moduleTheoMa = (ma: string) => MODULE.find((m) => m.ma === ma);
