import { sb } from "@/lib/db";
import { tenGonNv } from "@/lib/ten-nv";

const LICH_CON = ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"];

/** Thông tin phụ để hiện NGAY trên khối thẻ: lần làm gần nhất của từng thẻ, lịch hẹn kế tiếp + người phụ trách của từng khách.
 *  Mỗi thứ 1 câu hỏi theo lô id (danh sách ≤ 50–100 thẻ một trang). */
export async function layBoSungThe(the: { id: string; khach_id: string | null; loai: string | null }[], chiNhanhId: string | null) {
  const db = sb();
  const idsLan = the.filter((t) => t.loai === "lan").map((t) => t.id);
  const idsK = [...new Set(the.map((t) => t.khach_id).filter(Boolean))] as string[];
  let qLich = db.from("lich_hen").select("khach_id, bat_dau").in("khach_id", idsK.length ? idsK : ["00000000-0000-0000-0000-000000000000"]).gte("bat_dau", new Date().toISOString()).in("trang_thai", LICH_CON).order("bat_dau").limit(500);
  if (chiNhanhId) qLich = qLich.eq("chi_nhanh_id", chiNhanhId);
  const [{ data: buoi }, { data: lich }, { data: kh }] = await Promise.all([
    idsLan.length ? db.from("buoi_thuc_hien").select("the_id, ngay_lam, dich_vu_id, nv_thuc_hien_id, trang_thai").in("the_id", idsLan).neq("trang_thai", "huy").order("ngay_lam", { ascending: false }).order("tao_luc", { ascending: false }).limit(1000) : Promise.resolve({ data: [] }),
    idsK.length ? qLich : Promise.resolve({ data: [] }),
    idsK.length ? db.from("khach_hang").select("id, nguoi_phu_trach_id").in("id", idsK) : Promise.resolve({ data: [] }),
  ]);
  const cuoi = new Map<string, { ngay: string; dv: string; nv: string }>();
  for (const b of buoi ?? []) if (b.the_id && !cuoi.has(b.the_id)) cuoi.set(b.the_id, { ngay: b.ngay_lam, dv: b.dich_vu_id, nv: b.nv_thuc_hien_id });
  const lichToi = new Map<string, string>();
  for (const l of lich ?? []) if (!lichToi.has(l.khach_id)) lichToi.set(l.khach_id, l.bat_dau);
  const idsNv = [...new Set([...[...cuoi.values()].map((x) => x.nv), ...(kh ?? []).map((k) => k.nguoi_phu_trach_id)].filter(Boolean))] as string[];
  const idsDv = [...new Set([...cuoi.values()].map((x) => x.dv).filter(Boolean))];
  const [{ data: nv }, { data: dv }] = await Promise.all([
    idsNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idsNv) : Promise.resolve({ data: [] }),
    idsDv.length ? db.from("dich_vu").select("id, ten").in("id", idsDv) : Promise.resolve({ data: [] }),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, tenGonNv(n.ho_ten)])), tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const phuTrach = new Map((kh ?? []).map((k) => [k.id, k.nguoi_phu_trach_id ? tenNv.get(k.nguoi_phu_trach_id) ?? null : null]));
  return {
    lanGan: (theId: string) => { const c = cuoi.get(theId); return c ? { ngay: c.ngay, dv: tenDv.get(c.dv) ?? null, nv: tenNv.get(c.nv) ?? null } : null; },
    lichToi: (khachId: string | null) => (khachId ? lichToi.get(khachId) ?? null : null),
    phuTrach: (khachId: string | null) => (khachId ? phuTrach.get(khachId) ?? null : null),
  };
}
