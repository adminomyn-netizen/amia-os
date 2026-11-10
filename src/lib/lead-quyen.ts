import "server-only";
import { sb } from "@/lib/db";

type NguoiLead = { nhanVienId: string; quyen: readonly string[]; chiNhanhId: string | null };
const LA_UUID = /^[0-9a-f-]{36}$/i;

/** Lead người này XEM được: cùng chi nhánh nếu người đó gắn một chi nhánh. */
export async function layLeadDuocXem(id: string, nd: NguoiLead) {
  if (!LA_UUID.test(id)) return null;
  const { data } = await sb().from("lead").select("*").eq("id", id).maybeSingle();
  if (!data || (nd.chiNhanhId && data.chi_nhanh_id !== nd.chiNhanhId)) return null;
  return data;
}

/** Lead người này được SỬA: xem được và là người phụ trách, người hỗ trợ hoặc người có quyền duyệt marketing. */
export async function layLeadChoXuLy(id: string, nd: NguoiLead) {
  if (!LA_UUID.test(id)) return null;
  const db = sb();
  const [lead, { data: ht }] = await Promise.all([
    layLeadDuocXem(id, nd),
    db.from("lead_nguoi_ho_tro").select("nhan_vien_id").eq("lead_id", id).eq("nhan_vien_id", nd.nhanVienId).maybeSingle(),
  ]);
  if (!lead) return null;
  return lead.owner_id === nd.nhanVienId || !!ht || nd.quyen.includes("mkt.duyet") ? lead : null;
}

/** Người phụ trách + người hỗ trợ của lead (chỉ giao tác vụ / nhắc cho những người này). */
export async function nguoiCuaLead(id: string, ownerId: string | null) {
  const { data } = await sb().from("lead_nguoi_ho_tro").select("nhan_vien_id").eq("lead_id", id);
  return [...new Set([...(ownerId ? [ownerId] : []), ...(data ?? []).map((x) => x.nhan_vien_id)])];
}
