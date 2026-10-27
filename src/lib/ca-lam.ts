import { sb } from "@/lib/db";

export type Ca = { id: string; ten: string; gio_vao: string; gio_ra: string; dung_sai_phut: number };
const COT = "id, ten, gio_vao, gio_ra, dung_sai_phut";
/** Ca của một người trong một ngày: theo lịch phân ca; không có thì ca mặc định theo khung làm việc. Ngày nghỉ được xếp hoặc không phải chấm công thì null. */
export async function caCuaNgay(nv: string, ngay: string): Promise<Ca | null> {
  const db = sb();
  const { data: pc } = await db.from("phan_ca").select("nghi, ca_id").eq("nhan_vien_id", nv).eq("ngay", ngay).maybeSingle();
  if (pc?.nghi) return null;
  if (pc?.ca_id) { const { data } = await db.from("ca_lam").select(COT).eq("id", pc.ca_id).maybeSingle(); return data; }
  const { data: n } = await db.from("nhan_vien").select("khung_lam_viec").eq("id", nv).maybeSingle();
  if (!n || n.khung_lam_viec === "khong_cham_cong") return null;
  const { data } = await db.from("ca_lam").select(COT).eq("ma", n.khung_lam_viec === "van_phong" ? "VP_HC" : "CN_DAI").maybeSingle();
  return data;
}
