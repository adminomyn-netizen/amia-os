import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { layHoaDonTheoIds } from "@/lib/hoa-don-dien-tu-truy-van";
import { tenTepXml } from "@/lib/hoa-don-gtgt";

/** Tải XML hoá đơn GTGT đã xuất trong app (đúng tệp lưu lúc xuất). Phạm vi xem như trang Hoá đơn điện tử (chi nhánh, quyền xem toàn cơ sở). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const nd = await kiemQuyen("hd.vat");
  if (!nd) return new Response("Không đủ quyền.", { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Không tìm thấy.", { status: 404 });
  const { data: g } = await sb().from("hoa_don_gtgt").select("hoa_don_id, chi_nhanh_id, mau_so, ky_hieu, so, ma_so_thue_ban, xml").eq("id", id).maybeSingle();
  if (!g?.xml) return new Response("Không tìm thấy hoá đơn hoặc chưa có XML.", { status: 404 });
  if (nd.chiNhanhId && g.chi_nhanh_id !== nd.chiNhanhId) return new Response("Không tìm thấy.", { status: 404 });
  if (g.hoa_don_id && !(await layHoaDonTheoIds(nd, [g.hoa_don_id])).dong.length) return new Response("Không tìm thấy.", { status: 404 });
  return new Response(g.xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="${tenTepXml(g, g.ma_so_thue_ban)}"`, "Cache-Control": "no-store" } });
}
