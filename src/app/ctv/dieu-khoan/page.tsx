import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Điều khoản đối tác giới thiệu · AMIA", robots: { index: true, follow: true } };

/** Điều khoản chương trình đối tác giới thiệu + chính sách bảo mật (bản tóm tắt; phòng khám chỉnh nội dung khi cần). */
export default function TrangDieuKhoanCtv() {
  const Muc = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <section className="space-y-1.5"><h2 className="text-[15.5px] font-semibold text-muc">{t}</h2><div className="space-y-1.5 text-[14px] leading-relaxed text-muc-2">{children}</div></section>
  );
  return (
    <article className="space-y-5 rounded-the border border-vien bg-giay-sang p-4 sm:p-6">
      <h1 className="text-[20px] font-semibold">Điều khoản chương trình đối tác giới thiệu &amp; Chính sách bảo mật</h1>
      <Muc t="1. Đối tác giới thiệu">
        <p>Đối tác giới thiệu (CTV) là cá nhân đăng ký tại Cổng CTV của AMIA · Phòng khám da liễu · Tiên phong công nghệ cao. Mã giới thiệu là số điện thoại di động đã đăng ký.</p>
      </Muc>
      <Muc t="2. Ghi nhận hoa hồng">
        <p>Hoa hồng được tính theo mức phòng khám công bố tại thời điểm đăng ký, trên số tiền khách thực trả của hoá đơn mà người được giới thiệu sử dụng dịch vụ (lịch hẹn đặt qua link / mã QR, hoặc khách báo mã giới thiệu với lễ tân).</p>
        <p>Hoá đơn bị huỷ, hoàn tiền hoặc điều chỉnh thì hoa hồng được điều chỉnh tương ứng.</p>
      </Muc>
      <Muc t="3. Thanh toán">
        <p>Đối tác gửi yêu cầu thanh toán trong Cổng CTV khi số dư đạt mức tối thiểu; mỗi lúc một yêu cầu. Phòng khám duyệt và chi bằng chuyển khoản hoặc tiền mặt tại phòng khám, thông báo qua email khi đã chi.</p>
        <p>Nếu thấy số liệu chưa đúng, đối tác gửi khiếu nại đối soát trong cổng; phòng khám kiểm tra và phản hồi.</p>
      </Muc>
      <Muc t="4. Trách nhiệm khi giới thiệu">
        <p>Đối tác giới thiệu trung thực, không hứa hẹn kết quả điều trị, không tự đưa ra giá hay ưu đãi khác với thông tin của phòng khám, không dùng hình ảnh khách hàng khi chưa được đồng ý.</p>
        <p>Phòng khám có thể tạm ngưng tài khoản đối tác vi phạm; hoa hồng hợp lệ đã ghi nhận trước đó vẫn được thanh toán.</p>
      </Muc>
      <Muc t="5. Bảo mật thông tin">
        <p>AMIA chỉ dùng họ tên, số điện thoại, email của đối tác để vận hành chương trình (ghi nhận, thông báo, thanh toán hoa hồng) và không cung cấp cho bên thứ ba.</p>
        <p>Thông tin của người được giới thiệu luôn được che (tên, số điện thoại) và không hiển thị dịch vụ đã sử dụng trong Cổng CTV hay email gửi đối tác.</p>
        <p>Đối tác có thể tắt email thông báo trong mục Hồ sơ, hoặc liên hệ phòng khám để ngừng tham gia.</p>
      </Muc>
      <p className="text-[13px] text-muc-3">Phòng khám có thể cập nhật điều khoản; thay đổi được đăng tại trang này. <Link href="/ctv/dang-ky" className="underline">Quay lại đăng ký</Link></p>
    </article>
  );
}
