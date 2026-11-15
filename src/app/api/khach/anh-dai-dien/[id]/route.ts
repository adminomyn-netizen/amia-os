import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { docAnhDaiDien, keoAnhSalonHero, loaiAnh } from "@/lib/anh-dai-dien-khach";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ảnh đại diện khách, đọc từ ổ hosting. Chưa có trên ổ mà khách có ảnh SalonHero thì kéo về một lần rồi giữ luôn. Đường có ?v= theo ảnh nên cho trình duyệt nhớ lâu. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await kiemQuyen("khach.xem"))) return new Response("Không đủ quyền", { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Yêu cầu không hợp lệ", { status: 400 });
  let buf = await docAnhDaiDien(id);
  if (!buf) {
    const { data } = await sb().from("khach_hang").select("anh_dai_dien_url").eq("id", id).maybeSingle();
    if (data?.anh_dai_dien_url) buf = await keoAnhSalonHero(id, data.anh_dai_dien_url);
  }
  if (!buf) return new Response("Chưa có ảnh", { status: 404, headers: { "Cache-Control": "private, max-age=300" } });
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": loaiAnh(buf) ?? "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" } });
}
