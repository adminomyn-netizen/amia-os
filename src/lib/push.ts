import "server-only";
import webpush from "web-push";
import { sb } from "@/lib/db";
import { quyenHieuLuc, laVaiTro, type Quyen } from "@/lib/quyen";

export type Tin = { tieuDe: string; noiDung: string; url: string; tag?: string };
export type KetQuaGui = { thietBi: number; thanhCong: number; daGo: number };

let daCauHinh: boolean | null = null;
function cauHinh() {
  if (daCauHinh !== null) return daCauHinh;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, pri = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !pri) { console.warn("[push] thiếu khoá VAPID, bỏ qua gửi thông báo"); return (daCauHinh = false); }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:adminomyn@gmail.com", pub, pri);
  return (daCauHinh = true);
}

/** Gửi một thông báo tới mọi thiết bị đã đăng ký của các nhân viên. Thiết bị hết hạn (404/410) tự bị gỡ. Không bao giờ ném lỗi ra ngoài: thông báo hỏng không được làm hỏng nghiệp vụ. */
export async function guiChoNhanVien(nhanVienIds: string[], tin: Tin): Promise<KetQuaGui> {
  const ra: KetQuaGui = { thietBi: 0, thanhCong: 0, daGo: 0 };
  const ids = [...new Set(nhanVienIds.filter(Boolean))];
  if (ids.length === 0 || !cauHinh()) return ra;
  try {
    const db = sb();
    const { data: ds } = await db.from("dang_ky_thong_bao").select("id, endpoint, p256dh, auth").in("nhan_vien_id", ids);
    ra.thietBi = ds?.length ?? 0;
    const goi = JSON.stringify({ tieuDe: tin.tieuDe.slice(0, 80), noiDung: tin.noiDung.slice(0, 420), url: tin.url, tag: tin.tag });
    const hong: string[] = [], tot: string[] = [];
    await Promise.all((ds ?? []).map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, goi, { TTL: 60 * 60 * 12, urgency: "normal" });
        tot.push(d.id);
      } catch (e) {
        const ma = (e as { statusCode?: number }).statusCode;
        if (ma === 404 || ma === 410) hong.push(d.id); else console.error("[push] gửi lỗi", ma);
      }
    }));
    ra.thanhCong = tot.length; ra.daGo = hong.length;
    if (hong.length) await db.from("dang_ky_thong_bao").delete().in("id", hong);
    if (tot.length) await db.from("dang_ky_thong_bao").update({ gui_cuoi_luc: new Date().toISOString() }).in("id", tot);
  } catch (e) {
    console.error("[push] lỗi", (e as Error).message);
  }
  return ra;
}

/** Nhân viên đang làm việc, có quyền `quyen` (theo quyền thật: vai trò + danh sách riêng) và thuộc chi nhánh đó (hoặc phụ trách mọi chi nhánh). */
export async function nguoiCoQuyen(quyen: Quyen, chiNhanhId: string | null): Promise<string[]> {
  const { data } = await sb().from("nhan_vien").select("id, vai_tro, quyen_rieng, chi_nhanh_id").eq("hoat_dong", true);
  return (data ?? []).filter((n) => laVaiTro(n.vai_tro) && quyenHieuLuc(n.vai_tro, n.quyen_rieng).includes(quyen) && (!chiNhanhId || !n.chi_nhanh_id || n.chi_nhanh_id === chiNhanhId)).map((n) => n.id);
}
