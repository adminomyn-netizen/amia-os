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
    khauHieu: "AMIA · Phòng khám da liễu · Tiên phong công nghệ cao", tieuDe: "Đặt lịch hẹn online",
    moTa: "Chọn dịch vụ, ngày và khung giờ còn trống chỉ trong vài phút. Lễ tân AMIA gọi lại xác nhận trước giờ hẹn.",
    giayPhep: "Giấy phép hoạt động", goiNgay: "Gọi phòng khám", dvOnline: "dịch vụ đặt online", ngayToiDa: "ngày đặt trước tối đa", phutKhung: "phút mỗi khung giờ",
    daChon: "Đã chọn", toiDaDv: "tối đa 5 dịch vụ", tatCa: "Tất cả", tienDo: "Tiến độ đặt lịch", buocXong: (a: number, b: number) => `${a}/${b} bước`,
    quyTrinh: "Đặt lịch trong 3 bước", qt: [["Chọn dịch vụ và giờ", "Xem khung giờ còn trống theo thời gian thực, chọn dịch vụ quan tâm."], ["Lễ tân xác nhận", "Phòng khám gọi lại số điện thoại quý khách để xác nhận lịch."], ["Đến phòng khám", "Quý khách đến đúng giờ, bác sĩ và kỹ thuật viên đã sẵn sàng."]],
    hoiDap: "Câu hỏi thường gặp", thongTin: "Thông tin phòng khám", gioTuan: "Giờ mở cửa trong tuần", nghi: "Nghỉ", hotline: "Hotline", xemBanDo: "Xem bản đồ",
    lamLai: "Làm lại từ đầu", hoiLamLai: "Xoá toàn bộ thông tin đã chọn và nhập lại từ đầu?",
    thuDu: ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"],
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
    khauHieu: "AMIA · Dermatology clinic · Pioneering high-tech care", tieuDe: "Book an appointment online",
    moTa: "Choose services, a date and an open time slot in minutes. AMIA reception will call to confirm before your visit.",
    giayPhep: "Operating licence", goiNgay: "Call the clinic", dvOnline: "services bookable online", ngayToiDa: "days ahead at most", phutKhung: "minutes per slot",
    daChon: "Selected", toiDaDv: "up to 5 services", tatCa: "All", tienDo: "Booking progress", buocXong: (a: number, b: number) => `${a}/${b} steps`,
    quyTrinh: "Book in 3 steps", qt: [["Pick services and time", "See open slots in real time and choose the services you need."], ["Reception confirms", "The clinic calls your phone number to confirm the booking."], ["Visit the clinic", "Arrive on time; our doctors and specialists will be ready."]],
    hoiDap: "Frequently asked questions", thongTin: "Clinic information", gioTuan: "Opening hours", nghi: "Closed", hotline: "Hotline", xemBanDo: "Open map",
    lamLai: "Start over", hoiLamLai: "Clear everything you have entered and start again?",
    thuDu: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    thu: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], buocTruoc: "Previous days", buocSau: "Next days", tu: "From",
  },
} as const;

export type Chu = (typeof CHU)[NgonNgu];

export type ThongTinHoiDap = { ten: string; diaChi: string; sdt: string; soNgay: number; baoTruocPhut: number; khungPhut: number; giayPhep: string; gioHomNay: string | null };

/** Hỏi đáp hiện trên trang và đưa vào dữ liệu có cấu trúc FAQPage (cho Google và trợ lý AI trích dẫn). Chỉ nêu điều đúng với cách trang đang chạy. */
export function hoiDapDatLich(nn: NgonNgu, o: ThongTinHoiDap): [string, string][] {
  const goi = o.sdt ? (nn === "vi" ? ` hoặc gọi ${o.sdt}` : ` or call ${o.sdt}`) : "";
  if (nn === "en") return [
    [`How do I book an appointment at ${o.ten}?`, `Choose a location, services, a date and an open time slot on this page, enter your name and phone number, then press "Book now"${goi}.`],
    ["Is online booking free?", "Yes. Booking online costs nothing; service prices shown are estimates and are settled at the clinic."],
    ["How far ahead can I book?", `Up to ${o.soNgay} days ahead, at least ${o.baoTruocPhut} minutes before the slot, in ${o.khungPhut}-minute slots.`],
    ["How is my booking confirmed?", "Your request goes straight to reception, who call your phone number to confirm."],
    ["How do I change or cancel?", o.sdt ? `Call ${o.sdt} and reception will update your booking.` : "Contact the clinic and reception will update your booking."],
    [`Where is ${o.ten} and when is it open?`, `${o.diaChi}.${o.gioHomNay ? ` Open today ${o.gioHomNay}.` : ""}`],
    [`Is ${o.ten} licensed?`, `Yes, the dermatology clinic operates under licence no. ${o.giayPhep}.`],
  ];
  return [
    [`Đặt lịch tại ${o.ten} như thế nào?`, `Chọn địa điểm, dịch vụ, ngày và khung giờ còn trống ngay trên trang này, nhập họ tên và số điện thoại rồi bấm "Đặt lịch hẹn"${goi}.`],
    ["Đặt lịch online có mất phí không?", "Không. Đặt lịch online hoàn toàn miễn phí; giá dịch vụ hiển thị là giá tạm tính, thanh toán tại phòng khám."],
    ["Có thể đặt trước bao lâu?", `Tối đa ${o.soNgay} ngày tới, đặt trước giờ hẹn ít nhất ${o.baoTruocPhut} phút, mỗi khung giờ ${o.khungPhut} phút.`],
    ["Sau khi đặt, phòng khám xác nhận thế nào?", "Lịch hẹn được chuyển ngay tới lễ tân; lễ tân gọi lại số điện thoại quý khách đã nhập để xác nhận."],
    ["Muốn đổi hoặc huỷ lịch thì làm sao?", o.sdt ? `Quý khách gọi ${o.sdt}, lễ tân sẽ đổi hoặc huỷ lịch giúp.` : "Quý khách liên hệ phòng khám, lễ tân sẽ đổi hoặc huỷ lịch giúp."],
    [`${o.ten} ở đâu, mở cửa giờ nào?`, `${o.diaChi}.${o.gioHomNay ? ` Hôm nay mở cửa ${o.gioHomNay}.` : ""}`],
    [`${o.ten} có giấy phép hoạt động không?`, `Có. Phòng khám da liễu hoạt động theo giấy phép số ${o.giayPhep}.`],
  ];
}
