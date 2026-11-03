// Chữ trên trang đặt lịch công khai, hai ngôn ngữ như SalonHero ("Ngôn ngữ hiện thị" + nút VI / EN). Lời lẽ lấy theo trang SalonHero của AMIA (đọc 03/11/2026).
export type NgonNgu = "vi" | "en";

export const CHU = {
  vi: {
    datLich: "Đặt lịch", chiNhanh: "Chi nhánh", dichVu: "Dịch vụ", gioMoCua: "Giờ mở cửa hôm nay", nghiHomNay: "Hôm nay nghỉ",
    b1: "Thông tin khách đặt lịch", sdt: "Số điện thoại", hoTen: "Họ và tên", chi: "Chị", anh: "Anh", diNhom: "Đi theo nhóm?", khach: "khách",
    b2: "Chọn địa điểm", tatCaKhuVuc: "Tất cả khu vực", khuVucKhac: "Khu vực khác", bDv: "Chọn dịch vụ", bNv: "Chọn người làm", batKy: "Bất kỳ ai", batKyMoTa: "Phòng khám sắp xếp",
    timDv: "Tìm dịch vụ", khongThayDv: "Không tìm thấy dịch vụ phù hợp", b3: "Thời gian đặt lịch", homNay: "Hôm nay", chonKhung: "Chọn khung giờ phục vụ",
    sang: "Buổi sáng", chieu: "Buổi chiều", toi: "Buổi tối", conCho: "Còn chỗ", hetCho: "Hết chỗ", dangTai: "Đang tải khung giờ…", khongCoGio: "Phòng khám không thể phục vụ thời điểm này. Quý khách vui lòng chọn ngày khác.",
    taiLoi: "Không tải được khung giờ. Vui lòng thử lại.", thuLai: "Thử lại", gioPhuThuoc: "Khung giờ còn trống phụ thuộc vào người làm đã chọn.",
    b4: "Ghi chú", lichCuaBan: "Lịch hẹn của quý khách", chuaChonGio: "Chưa chọn giờ hẹn", chuaChonDv: "Chưa chọn dịch vụ", nguoiDat: "Người đặt lịch",
    tongThoiGian: "Tổng thời gian dịch vụ (dự kiến)", tongGia: "Tổng giá tiền dịch vụ (tạm tính)", phut: "phút", nutDat: "Đặt lịch hẹn", dangGui: "Đang đặt lịch",
    thieuTT: "Vui lòng nhập đủ thông tin bắt buộc", chonGio: "Vui lòng chọn thời gian đặt lịch", loiDat: "Chưa đặt được lịch",
    thanhCong: "Đặt lịch thành công!", camOn: "Cảm ơn quý khách đã lựa chọn dịch vụ của chúng tôi! Rất mong quý khách đến đúng giờ.",
    thoiGian: "Thời gian đặt lịch", nguoiLam: "Người làm", diaChi: "Địa chỉ", sdtDat: "Số ĐT người đặt", datKhac: "Đặt lịch khác",
    datTaiDay: "Đặt lịch tại đây", chiDuong: "Chỉ đường", lienHeDv: "Xin vui lòng liên hệ phòng khám để biết thông tin về các dịch vụ.", chuaNhanOnline: "Chưa nhận đặt online",
    khoa: "Đặt lịch online hiện chưa mở.", goi: (s: string) => `Vui lòng gọi ${s} để đặt lịch.`, lienHe: "Vui lòng liên hệ trực tiếp phòng khám để đặt lịch.",
    thu: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"], buocTruoc: "Ngày trước", buocSau: "Ngày sau", tu: "Từ",
  },
  en: {
    datLich: "Booking", chiNhanh: "Locations", dichVu: "Services", gioMoCua: "Open today", nghiHomNay: "Closed today",
    b1: "Your information", sdt: "Phone number", hoTen: "Full name", chi: "Ms", anh: "Mr", diNhom: "Coming as a group?", khach: "guest(s)",
    b2: "Choose a location", tatCaKhuVuc: "All regions", khuVucKhac: "Other regions", bDv: "Choose services", bNv: "Choose a specialist", batKy: "Anyone", batKyMoTa: "The clinic will assign",
    timDv: "Search services", khongThayDv: "No matching service", b3: "Booking time", homNay: "Today", chonKhung: "Choose a time slot",
    sang: "Morning", chieu: "Afternoon", toi: "Evening", conCho: "Available", hetCho: "Full", dangTai: "Loading time slots…", khongCoGio: "The clinic cannot serve at this time. Please choose another day.",
    taiLoi: "Could not load time slots. Please try again.", thuLai: "Retry", gioPhuThuoc: "Available slots depend on the specialist you choose.",
    b4: "Note", lichCuaBan: "Your appointment", chuaChonGio: "No time selected", chuaChonDv: "No service selected", nguoiDat: "Booked by",
    tongThoiGian: "Total duration (estimated)", tongGia: "Total price (estimated)", phut: "min", nutDat: "Book now", dangGui: "Booking",
    thieuTT: "Please fill in all required fields", chonGio: "Please choose a booking time", loiDat: "Booking failed",
    thanhCong: "Booking confirmed!", camOn: "Thank you for choosing us! We look forward to seeing you on time.",
    thoiGian: "Booking time", nguoiLam: "Specialist", diaChi: "Address", sdtDat: "Phone", datKhac: "Make another booking",
    datTaiDay: "Book here", chiDuong: "Directions", lienHeDv: "Please contact the clinic for information about our services.", chuaNhanOnline: "Online booking unavailable",
    khoa: "Online booking is currently closed.", goi: (s: string) => `Please call ${s} to book.`, lienHe: "Please contact the clinic directly to book.",
    thu: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], buocTruoc: "Previous days", buocSau: "Next days", tu: "From",
  },
} as const;

export type Chu = (typeof CHU)[NgonNgu];
