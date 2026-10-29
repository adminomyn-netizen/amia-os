import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { linkAnh } from "@/lib/kho-anh";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tải về một ảnh khách (tệp gốc, tên theo mã khách + ngày chụp). Chặn quyền xem ảnh ở máy chủ và ghi nhật ký mỗi lần tải. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const nd = await kiemQuyen("anh.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Yêu cầu không hợp lệ", { status: 400 });
  const db = sb();
  const { data: a } = await db.from("khach_anh").select("khach_id, duong_dan, ngay_chup, loai, khach_hang(ma, chi_nhanh_id)").eq("id", id).maybeSingle();
  if (!a || (nd.chiNhanhId && (a.khach_hang as unknown as { chi_nhanh_id: string | null } | null)?.chi_nhanh_id !== nd.chiNhanhId)) return new Response("Không tìm thấy ảnh", { status: 404 });
  const url = (await linkAnh([a.duong_dan], 120)).get(a.duong_dan);
  const r = url ? await fetch(url) : null;
  if (!r?.ok || !r.body) return new Response("Không lấy được ảnh từ kho, thử lại.", { status: 502 });
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "tai_anh", doi_tuong: "khach_hang", doi_tuong_id: a.khach_id, chi_tiet: { anh_id: id } });
  const ma = (a.khach_hang as unknown as { ma: string } | null)?.ma ?? "khach";
  const duoi = a.duong_dan.split(".").pop() ?? "jpg";
  return new Response(r.body, { headers: { "Content-Type": r.headers.get("content-type") ?? "image/jpeg", "Content-Disposition": `attachment; filename="${ma}-${a.ngay_chup}-${a.loai}-${id.slice(0, 8)}.${duoi}"`, "Cache-Control": "private, no-store" } });
}
