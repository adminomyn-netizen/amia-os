import Link from "next/link";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";

/** Hướng dẫn chi tiết phần Marketing (chị Lâm 18/11/2026): video thuyết minh có Mia hướng dẫn + ảnh chụp màn hình thật từng bước.
 *  Ảnh và video ở public/huong-dan/marketing (dựng bằng ~/tools/hd-mkt: Playwright quay app, giọng VieNeu-TTS). */
const G = "/huong-dan/marketing";
type Muc = { id: string; ten: string; href: string; moTa: string; buoc: string[]; anh: { f: string; chu: string }[] };
const MUC: Muc[] = [
  { id: "hop-thu", ten: "1. Hộp thư: tin nhắn fanpage", href: "/marketing/hop-thu", moTa: "Tin khách nhắn vào fanpage AMIA (Messenger, lấy qua Pancake) tự về đây sau khoảng 15–30 giây, trang tự làm mới.",
    buoc: ["Vào Marketing › Hộp thư. Hội thoại mới nhất nằm trên cùng, nhãn “… mới” là số tin chưa đọc.", "Bấm tên khách để đọc cả cuộc trò chuyện. Khách đã để lại SĐT thì số hiện dưới tên.", "Trả lời: bấm “Trả lời trên Pancake” (mở đúng hội thoại trên Pancake). Tin mình trả lời tự hiện lại ở đây sau vài giây.", "Không trả lời ngay trong app: app chỉ xem, để không bị hai nơi trả lời chồng nhau."],
    anh: [{ f: "02-danh-sach", chu: "Danh sách hội thoại, mới nhất trên cùng" }, { f: "02-hoi-thoai", chu: "Bấm một khách để đọc cả cuộc trò chuyện" }, { f: "02-tra-loi", chu: "Nút Trả lời trên Pancake" }] },
  { id: "lead", ten: "2. Hộp Lead: khách để lại SĐT", href: "/marketing/lead", moTa: "Khách để lại số điện thoại trên fanpage tự thành lead ở cột Mới (10 phút/lần). Số đã là khách cũ thì không tạo; số đang có lead mở thì không tạo trùng.",
    buoc: ["Vào Marketing › Hộp Lead. Lead mới nằm ở cột “Mới”, cần nhận trong 15 phút; thẻ ghi “Quá SLA” là đã trễ, gọi trước.", "Bấm vào thẻ lead để xem chi tiết: Nhu cầu / ghi chú có tin nhắn gần nhất và link mở thẳng hội thoại Pancake.", "Gọi khách xong: kéo thẻ sang cột Đang liên hệ → Tiềm năng → Đã đặt lịch. Không chốt được thì kéo sang Thua/Đóng và chọn lý do.", "Lead không bao giờ bị xoá; mọi thay đổi đều ghi lại ở dòng thời gian của lead."],
    anh: [{ f: "03-cot-moi", chu: "Cột Mới: lead tự đổ từ Pancake" }, { f: "03-chi-tiet", chu: "Chi tiết lead: nhu cầu + link Pancake" }, { f: "03-keo-tha", chu: "Kéo thẻ sang cột tiếp theo" }] },
  { id: "bao-cao", ten: "3. Báo cáo marketing (dashboard)", href: "/marketing/bao-cao", moTa: "Bảng điều hành marketing: chi phí, tin nhắn, lead, phễu tới doanh thu, biểu đồ và xếp hạng.",
    buoc: ["Chọn kỳ ở hàng nút trên cùng: Hôm nay, Hôm qua, 7 ngày qua, Tuần này, Tháng này, Tháng trước hoặc Tuỳ chọn.", "Các ô số: chi phí quảng cáo, tin nhắn mới (Pancake), lead, giá/tin, giá/lead, đặt lịch, khách đến, có hoá đơn, thực thu, ROAS. Mũi tên ▲▼ là so với kỳ trước.", "Kéo xuống: biểu đồ xu hướng theo ngày, phễu lead → hoá đơn, cơ cấu theo nguồn và theo dịch vụ.", "Cuối trang: xếp hạng chiến dịch, dịch vụ được hỏi nhiều, nhân viên trực page, người phụ trách lead. Bấm Xuất Excel để tải về."],
    anh: [{ f: "04-chon-ky", chu: "Chọn kỳ xem" }, { f: "04-o-so", chu: "Các ô số và so kỳ trước" }, { f: "04-bieu-do", chu: "Biểu đồ" }, { f: "04-xep-hang", chu: "Bảng xếp hạng" }] },
  { id: "so-lieu", ten: "4. Hội thoại & Quảng cáo theo ngày", href: "/marketing/hoi-thoai", moTa: "Số liệu gốc mỗi ngày: hội thoại Pancake và chi phí quảng cáo Meta.",
    buoc: ["Hội thoại theo ngày: số khách nhắn mới mỗi ngày trên Pancake, chia theo thẻ dịch vụ, nguồn, giai đoạn và nhân viên trực page.", "Quảng cáo theo ngày: chi phí từng chiến dịch Meta, đặt cạnh số tin nhắn thật (Pancake) để tính giá mỗi tin."],
    anh: [{ f: "05-hoi-thoai", chu: "Hội thoại theo ngày" }, { f: "05-quang-cao", chu: "Quảng cáo theo ngày" }] },
  { id: "chien-dich", ten: "5. Chiến dịch", href: "/marketing/chien-dich", moTa: "Mỗi chiến dịch chỉ một mục tiêu: Branding, Slogan, Khuyến mãi hoặc Thông điệp; phải duyệt trước khi chạy.",
    buoc: ["Bấm Tạo chiến dịch, điền Tên, Mục tiêu (chỉ chọn một), Kênh, Nguồn lead, Chi nhánh, Ngân sách, Bắt đầu – Kết thúc, Người phụ trách.", "Bấm Gửi duyệt; người có quyền bấm Duyệt rồi Bắt đầu chạy. Có thể Tạm dừng, Chạy lại, Kết thúc.", "Cột Ngân sách so với số đã chi thật; chi vượt ngân sách thì số đổi màu cảnh báo. Chiến dịch Meta tự tạo chưa có ngân sách thì ghi “Chưa đặt ngân sách”."],
    anh: [{ f: "06-danh-sach", chu: "Danh sách chiến dịch (hiện tên dễ đọc)" }, { f: "06-tao", chu: "Form Tạo chiến dịch" }, { f: "06-ngan-sach", chu: "Ngân sách và đã chi" }] },
  { id: "noi-dung", ten: "6. Nội dung", href: "/marketing/noi-dung", moTa: "Kế hoạch bài đăng của đội content: ai làm, hạn nào, duyệt chưa, đăng ở đâu.",
    buoc: ["Bấm Thêm nội dung, ghi Tiêu đề, Loại, Kênh đăng, Chiến dịch (nếu có), Người làm, Hạn hoàn thành.", "Làm xong bấm Nộp duyệt. Người duyệt bấm Duyệt hoặc Chưa đạt (kèm góp ý).", "Đăng xong: bấm Sửa, điền Ngày đăng và Link bài đã đăng để theo dõi."],
    anh: [{ f: "07-them", chu: "Form Thêm nội dung" }] },
];

export default async function HuongDanMarketing() {
  await layNguoiDungDangNhap();
  return (
    <div className="space-y-6">
      <TieuDeNoi quayLai={{ href: "/huong-dan", nhan: "Hướng dẫn sử dụng" }} tieuDe="Hướng dẫn Marketing" phu="Video thuyết minh 2 phút 40 giây và ảnh từng bước: Hộp thư, Hộp Lead, Báo cáo, Chiến dịch, Nội dung." />
      <section className="the-noi overflow-hidden p-0">
        <video controls preload="metadata" poster={`${G}/bia.jpg`} className="block aspect-video w-full bg-black" src={`${G}/video.mp4`}>
          Trình duyệt chưa phát được video. <a href={`${G}/video.mp4`}>Tải video</a>.
        </video>
        <div className="flex flex-wrap items-center gap-3 p-4 text-[13.5px] text-muc-3">
          <span>Mia hướng dẫn toàn bộ phần Marketing. Xem trên điện thoại thì xoay ngang cho rõ.</span>
          <a href={`${G}/video.mp4`} download className="ml-auto text-nhan-dam underline">Tải video về máy</a>
        </div>
      </section>
      <section className="the-noi p-5">
        <h2 className="nhan-muc">Mỗi ngày làm gì</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] text-muc-2">
          <li>Mở <Link href="/marketing/hop-thu" className="text-nhan-dam underline">Hộp thư</Link> xem khách nhắn mới, trả lời trên Pancake.</li>
          <li>Mở <Link href="/marketing/lead" className="text-nhan-dam underline">Hộp Lead</Link>: nhận lead mới trong 15 phút, gọi, kéo sang đúng cột.</li>
          <li>Cuối ngày xem <Link href="/marketing/bao-cao" className="text-nhan-dam underline">Báo cáo marketing</Link> kỳ Hôm nay, so với Hôm qua.</li>
        </ol>
      </section>
      <nav aria-label="Mục lục" className="flex flex-wrap gap-2">
        {MUC.map((m) => <a key={m.id} href={`#${m.id}`} className="rounded-nho border border-vien px-3 py-1.5 text-[13.5px] text-muc-2 hover:bg-giay-tram">{m.ten}</a>)}
      </nav>
      {MUC.map((m) => (
        <section key={m.id} id={m.id} className="the-noi scroll-mt-24 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[18px] font-medium text-muc">{m.ten}</h2>
            <Link href={m.href} className="text-[13.5px] text-nhan-dam underline">Mở màn này →</Link>
          </div>
          <p className="mt-1 text-[14px] text-muc-3">{m.moTa}</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] text-muc-2">{m.buoc.map((b) => <li key={b}>{b}</li>)}</ol>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {m.anh.map((a) => (
              <figure key={a.f} className="overflow-hidden rounded-nho border border-vien">
                <a href={`${G}/${a.f}.jpg`} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${G}/${a.f}.jpg`} alt={a.chu} loading="lazy" className="block h-auto w-full" />
                </a>
                <figcaption className="px-3 py-2 text-[12.5px] text-muc-3">{a.chu} (bấm ảnh để phóng to)</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
