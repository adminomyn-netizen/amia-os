import "server-only";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";

// Bộ lọc Hộp Lead (đọc từ địa chỉ trang) áp lên view v_lead_ds (0313). Dùng chung cho Kanban, Bảng.
export type LocLeadMay = { q?: string; gd?: string; kq?: string; cn?: string; pt?: string; ht?: string; dt?: string; ng?: string; tv?: string; nh?: string; cs?: string };
type Q<T> = {
  eq: (c: string, v: string) => T; is: (c: string, v: null) => T; or: (f: string) => T; contains: (c: string, v: string[]) => T;
  gt: (c: string, v: string | number) => T; gte: (c: string, v: string) => T; lt: (c: string, v: string) => T; lte: (c: string, v: string) => T;
};
const LA_UUID = /^[0-9a-f-]{36}$/i;
const dauNgay = (ngay: string) => new Date(`${ngay}T00:00:00+07:00`).toISOString();

export function apDungLoc<T extends Q<T>>(q: T, loc: LocLeadMay, nd: { nhanVienId: string; chiNhanhId: string | null }): T {
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  else if (loc.cn && LA_UUID.test(loc.cn)) q = q.eq("chi_nhanh_id", loc.cn);
  const tim = (loc.q ?? "").replace(/[,()*%\\:"']/g, " ").trim().slice(0, 60);
  if (tim) {
    const so = tim.replace(/\D/g, "");
    q = q.or([`ho_ten.ilike.*${tim}*`, `ma.ilike.*${tim}*`, `email.ilike.*${tim}*`, ...(so.length >= 3 ? [`sdt.ilike.*${so}*`] : [])].join(","));
  }
  if (loc.gd && LA_UUID.test(loc.gd)) q = q.eq("giai_doan_id", loc.gd);
  if (loc.kq && ["open", "won", "lost"].includes(loc.kq)) q = q.eq("ket_qua", loc.kq);
  if (loc.pt === "toi") q = q.eq("owner_id", nd.nhanVienId);
  else if (loc.pt === "chua") q = q.is("owner_id", null);
  else if (loc.pt && LA_UUID.test(loc.pt)) q = q.eq("owner_id", loc.pt);
  if (loc.ht === "toi") q = q.contains("ho_tro_ids", [nd.nhanVienId]);
  else if (loc.ht && LA_UUID.test(loc.ht)) q = q.contains("ho_tro_ids", [loc.ht]);
  if (loc.dt === "co") q = q.or("doi_tac_id.not.is.null");
  else if (loc.dt && LA_UUID.test(loc.dt)) q = q.eq("doi_tac_id", loc.dt);
  if (loc.ng && LA_UUID.test(loc.ng)) q = q.eq("nguon_id", loc.ng);
  if (loc.tv === "mo") q = q.gt("so_tac_vu_mo", 0);
  else if (loc.tv === "khong") q = q.eq("so_tac_vu_mo", "0");
  const bay = new Date().toISOString(), homNay = homNayHCM(), mai = dauNgay(congNgay(homNay, 1));
  if (loc.nh === "qua_han") q = q.lt("nhac_som_nhat", bay);
  else if (loc.nh === "hom_nay") q = q.gte("nhac_som_nhat", bay).lt("nhac_som_nhat", mai);
  else if (loc.nh === "sap_toi") q = q.gte("nhac_som_nhat", mai);
  else if (loc.nh === "khong") q = q.eq("so_nhac_cho", "0");
  // Mức chăm sóc theo số ngày (lịch VN) từ lần cập nhật: 0–7 · 8–14 · 15–29 · từ 30.
  const moc = (n: number) => dauNgay(congNgay(homNay, -n));
  if (loc.cs === "moi") q = q.gte("cap_nhat_luc", moc(7));
  else if (loc.cs === "chu_y") q = q.gte("cap_nhat_luc", moc(14)).lt("cap_nhat_luc", moc(7));
  else if (loc.cs === "lau") q = q.gte("cap_nhat_luc", moc(29)).lt("cap_nhat_luc", moc(14));
  else if (loc.cs === "bo_quen") q = q.lt("cap_nhat_luc", moc(29));
  return q;
}
