import { kiemQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { docThamSo, khoaCnKhach, locKhach } from "@/lib/khach-danh-sach";

/** Danh sách khách cho cột trái màn Khách hàng: lọc/sắp xếp giống tệp Excel xuất, mỗi lần lấy `so` dòng từ vị trí `tu`. Chặn quyền ở máy chủ. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("khach.xem");
  if (!nd) return Response.json({ loi: "Không đủ quyền" }, { status: 403 });
  const u = new URL(req.url).searchParams;
  const tu = Math.max(0, Math.min(100_000, Number(u.get("tu")) || 0));
  const so = Math.max(1, Math.min(200, Number(u.get("so")) || 40));
  const kq = await locKhach(khoaCnKhach(docThamSo(u), nd), tu, so);
  if (!kq) return Response.json({ loi: "Không tải được danh sách khách. Thử lại." }, { status: 500 });
  // Cột trái chỉ cần vài trường: không gửi thông tin liên hệ thừa xuống trình duyệt.
  const ds = kq.ds.map((r) => ({ id: r.id, ma: r.ma, ho_ten: r.ho_ten, dien_thoai: coQuyen(nd, "khach.sdt") ? r.dien_thoai : "", trang_thai: r.trang_thai, hang: r.hang, diem: r.diem_so_du, ngay_sinh: r.ngay_sinh, nhom: r.nhom }));
  return Response.json({ ds, tong: kq.tong });
}
