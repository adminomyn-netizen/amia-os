import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { apLocKhach } from "@/lib/khach-danh-sach";

const COT = "id, ma, ho_ten, dien_thoai, trang_thai, hang" as const;

/** Danh sách khách cho cột trái màn Khách hàng: lọc/sắp xếp giống tệp Excel xuất, mỗi lần lấy `so` dòng từ vị trí `tu`. Chặn quyền ở máy chủ. */
export async function GET(req: Request) {
  if (!(await kiemQuyen("khach.xem"))) return Response.json({ loi: "Không đủ quyền" }, { status: 403 });
  const u = new URL(req.url).searchParams;
  const tu = Math.max(0, Math.min(100_000, Number(u.get("tu")) || 0));
  const so = Math.max(1, Math.min(200, Number(u.get("so")) || 40));
  const tham = { q: u.get("q") ?? "", trang_thai: u.get("trang_thai") ?? "", nguon: u.get("nguon") ?? "", hang: u.get("hang") ?? "", phu_trach: u.get("phu_trach") ?? "", sx: u.get("sx") ?? "ten" };
  const { data, count, error } = await apLocKhach(sb().from("v_khach_hang").select(COT, { count: "exact" }), tham).range(tu, tu + so - 1);
  if (error) return Response.json({ loi: "Không tải được danh sách khách. Thử lại." }, { status: 500 });
  return Response.json({ ds: data ?? [], tong: count ?? 0 });
}
