import Link from "next/link";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { coMotQuyen, locMenu } from "@/lib/nav";
import { NHAN_VAI_TRO, type Quyen } from "@/lib/quyen";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { MucTrang } from "@/components/ui/MucTrang";

type Bai = { href: string; ten: string; quyen: Quyen[] | null; moTa: string; buoc: string[] };

/** Hướng dẫn ngắn theo từng mục lớn; người dùng chỉ thấy những mục mình có quyền dùng. */
const BAI: Bai[] = [
  { href: "/trang-chu", ten: "Trang chủ", quyen: null, moTa: "Màn hình đầu tiên mỗi ngày: việc cần làm, hiệu suất và lối tắt.", buoc: ["Đọc ô cảnh báo màu đỏ trước: đó là việc cần xử lý gấp hôm nay.", "Bấm một dòng trong “Việc cần hoàn thành của tôi” để mở đúng chỗ cần làm.", "Bấm ô tìm kiếm trên đầu trang để tìm khách, hoá đơn, sản phẩm hoặc một chức năng."] },
  { href: "/lich-hen", ten: "Lịch hẹn", quyen: ["lich.xem"], moTa: "Đặt, đổi, huỷ lịch cho khách.", buoc: ["Chọn ngày, bấm vào khung giờ trống để đặt lịch.", "Chọn khách (hoặc tạo khách mới), dịch vụ và người thực hiện.", "Khi khách đến, đổi trạng thái sang Đang phục vụ, xong thì Hoàn thành."] },
  { href: "/ban-hang", ten: "Bán hàng", quyen: ["ban.tao"], moTa: "Lập hoá đơn dịch vụ, thẻ liệu trình, sản phẩm.", buoc: ["Chọn khách, thêm dịch vụ / thẻ / sản phẩm vào giỏ.", "Nhập người thực hiện và giảm giá nếu có.", "Chọn hình thức thu (tiền mặt, chuyển khoản, quẹt thẻ), bấm Chốt hoá đơn."] },
  { href: "/hoa-don", ten: "Hoá đơn & thu nợ", quyen: ["ban.xem"], moTa: "Xem hoá đơn, thu nợ, huỷ khi cần.", buoc: ["Lọc theo ngày hoặc tìm theo mã hoá đơn.", "Hoá đơn còn nợ: mở hoá đơn, bấm Thu nợ.", "Huỷ hoá đơn cần quyền riêng và phải ghi lý do."] },
  { href: "/khach-hang", ten: "Khách hàng", quyen: ["khach.xem"], moTa: "Hồ sơ khách, ghi chú điều trị, ảnh.", buoc: ["Tìm theo tên, mã hoặc số điện thoại.", "Mở hồ sơ để xem thẻ đang dùng, lịch sử và ghi chú.", "Ảnh khách chỉ đăng khi khách đã đồng ý bằng văn bản."] },
  { href: "/the", ten: "Thẻ liệu trình", quyen: ["the.xem"], moTa: "Thẻ lần, thẻ tiền, thực hiện từng buổi.", buoc: ["Mở thẻ của khách, bấm Thực hiện buổi.", "Chọn người thực hiện và vật tư đã dùng.", "Thẻ sắp hết buổi sẽ hiện trong Việc cần làm để nhắc khách mua tiếp."] },
  { href: "/kho-mua-sam", ten: "Kho & Mua sắm", quyen: ["kho.xem", "phieu.xem"], moTa: "Tồn kho, nhập hàng, cấp vật tư, kiểm kê.", buoc: ["Nhập kho: mỗi lô phải có hạn dùng nếu sản phẩm bắt buộc.", "Cấp vật tư theo phiếu; hàng hết hạn hoặc không đủ tồn sẽ bị chặn.", "Kiểm kê định kỳ, chênh lệch cần người khác duyệt."] },
  { href: "/tai-chinh", ten: "Tài chính - Kế toán", quyen: ["quy.xem", "baocao.tien", "no.thu"], moTa: "Sổ quỹ, công nợ, hoá đơn đầu vào, quyết toán.", buoc: ["Ghi thu chi vào đúng quỹ và đúng loại thu chi.", "Đối chiếu hoá đơn đầu vào: người đối chiếu phải khác người ghi.", "Kỳ khoá sổ xong không sửa được số cũ."] },
  { href: "/van-ban", ten: "Văn bản & Hợp đồng", quyen: ["vb.xem"], moTa: "Hợp đồng, quyết định, quy định.", buoc: ["Soạn văn bản rồi gửi duyệt.", "Người duyệt phải khác người soạn.", "Văn bản đã duyệt tra cứu được trong danh sách."] },
  { href: "/marketing", ten: "Marketing", quyen: ["mkt.xem", "lead.xu_ly"], moTa: "Khách tiềm năng, nguồn giới thiệu, chiến dịch.", buoc: ["Khách tiềm năng mới hiện ở danh sách, nhận xử lý để không ai bị bỏ sót.", "Ghi rõ nguồn để biết kênh nào hiệu quả."] },
  { href: "/bao-cao", ten: "Báo cáo", quyen: ["baocao.xem"], moTa: "Doanh thu, nhân viên, nợ, vật tư.", buoc: ["Chọn khoảng ngày và chi nhánh.", "Bấm Xuất Excel để tải số liệu."] },
  { href: "/cai-dat", ten: "Cài đặt", quyen: ["danhmuc.xem", "nhanvien.quanly", "hethong.phanquyen", "baocao.tien"], moTa: "Thiết lập cửa hàng, danh mục, hoa hồng, phân quyền.", buoc: ["Bấm avatar góc phải, chọn Cài đặt hệ thống để thấy mọi thiết lập theo nhóm.", "Phân quyền: Tài khoản & phân quyền, mỗi người chỉnh quyền riêng; bảng Vai trò & quyền cho biết mặc định.", "Danh mục sản phẩm: mỗi sản phẩm cần mã đúng quy ước và không trùng tên."] },
];

export default async function HuongDan() {
  const nd = await layNguoiDungDangNhap();
  const thay = new Set(locMenu(nd).map((m) => m.duong_dan));
  const ds = BAI.filter((b) => (b.quyen === null || coMotQuyen(nd, b.quyen) || thay.has(b.href)));
  return (
    <div className="space-y-6">
      <TieuDeNoi tieuDe="Hướng dẫn sử dụng" phu={`Những việc thường làm của vai trò ${NHAN_VAI_TRO[nd.vaiTro]}, từng bước ngắn gọn.`} />
      <nav aria-label="Mục lục" className="flex flex-wrap gap-2">
        {ds.map((b) => <a key={b.href} href={`#${b.href.replace(/\W+/g, "-")}`} className="rounded-nho border border-vien px-3 py-1.5 text-[13.5px] text-muc-2 hover:bg-giay-tram">{b.ten}</a>)}
      </nav>
      <div className="grid gap-5 lg:grid-cols-2">
        {ds.map((b) => (
          <div key={b.href} id={b.href.replace(/\W+/g, "-")} className="scroll-mt-24">
            <MucTrang noi tieuDe={b.ten} phai={<Link href={b.href} className="font-medium text-nhan-dam hover:underline">Mở</Link>}>
              <p className="mb-3 text-[14px] text-muc-2">{b.moTa}</p>
              <ol className="list-decimal space-y-1.5 pl-5 text-[14px] text-muc marker:text-muc-3">{b.buoc.map((x) => <li key={x}>{x}</li>)}</ol>
            </MucTrang>
          </div>
        ))}
      </div>
    </div>
  );
}
