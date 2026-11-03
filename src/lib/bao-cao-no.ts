import type { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";

type Db = ReturnType<typeof sb>;

/** Một hoá đơn còn nợ, kèm số lần thanh toán và ngày trả nợ cuối (cùng cách đếm với cột của SalonHero). */
export type DongNo = {
  id: string; ma: string; maSh: string | null; khachId: string | null; khach: string; dienThoai: string; chiNhanh: string;
  ngay: string; tong: number; daThu: number; conNo: number; soLan: number; ngayCuoi: string;
};

/** Danh sách hoá đơn còn nợ (mặc định mọi ngày; chỉ lọc ngày lập hoá đơn khi người dùng chọn ngày). Tìm theo tên khách, số điện thoại, mã hoá đơn (cả mã SalonHero).
 *  Số lần thanh toán = số khoản thu ghi trên hoá đơn, tối thiểu 1; ngày trả nợ cuối = ngày khoản thu gần nhất, nếu chưa thu đồng nào thì lấy ngày lập hoá đơn (đúng cách SalonHero hiện cột này). */
export async function layDanhSachNo(db: Db, l: { cn?: string; tu?: string; den?: string; q?: string }): Promise<DongNo[]> {
  const hd: { id: string; ma: string; sh_ma: string | null; ngay_hd: string; tong_phai_thu: number; da_thu: number; con_no: number; khach_id: string | null; chi_nhanh_id: string }[] = [];
  for (let i = 0; ; i += 1000) {
    let q = db.from("hoa_don").select("id, ma, sh_ma, ngay_hd, tong_phai_thu, da_thu, con_no, khach_id, chi_nhanh_id").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("ngay_hd").order("ma").range(i, i + 999);
    if (l.cn) q = q.eq("chi_nhanh_id", l.cn);
    if (l.tu) q = q.gte("ngay_hd", l.tu);
    if (l.den) q = q.lte("ngay_hd", l.den);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    hd.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const khachIds = [...new Set(hd.map((h) => h.khach_id).filter((x): x is string => !!x))];
  const khach = new Map<string, { ho_ten: string; dien_thoai: string | null }>();
  for (let i = 0; i < khachIds.length; i += 300) {
    const { data } = await db.from("khach_hang").select("id, ho_ten, dien_thoai").in("id", khachIds.slice(i, i + 300));
    for (const k of data ?? []) khach.set(k.id, k);
  }
  const thu = new Map<string, { n: number; cuoi: string }>();
  for (let i = 0; i < hd.length; i += 150) {
    const { data } = await db.from("thanh_toan").select("hoa_don_id, ngay").eq("loai", "thu").in("hoa_don_id", hd.slice(i, i + 150).map((h) => h.id));
    for (const t of data ?? []) { const c = thu.get(t.hoa_don_id) ?? { n: 0, cuoi: "" }; c.n += 1; if (t.ngay > c.cuoi) c.cuoi = t.ngay; thu.set(t.hoa_don_id, c); }
  }
  const { data: cn } = await db.from("chi_nhanh").select("id, ten");
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const tuKhoa = boDau((l.q ?? "").trim()), laSo = /^[\d\s.]+$/.test(tuKhoa) && tuKhoa.replace(/\D/g, "").length >= 3, soKhoa = tuKhoa.replace(/\D/g, "");
  return hd.map((h) => {
    const k = h.khach_id ? khach.get(h.khach_id) : undefined, t = thu.get(h.id);
    return { id: h.id, ma: h.ma, maSh: h.sh_ma, khachId: h.khach_id, khach: k?.ho_ten ?? "Khách lẻ", dienThoai: k?.dien_thoai ?? "", chiNhanh: tenCn.get(h.chi_nhanh_id) ?? "", ngay: h.ngay_hd,
      tong: Number(h.tong_phai_thu), daThu: Number(h.da_thu), conNo: Number(h.con_no), soLan: Math.max(1, t?.n ?? 0), ngayCuoi: t?.cuoi || h.ngay_hd };
  }).filter((r) => !tuKhoa || boDau(`${r.khach} ${r.dienThoai} ${r.ma} ${r.maSh ?? ""}`).includes(tuKhoa) || (laSo && r.dienThoai.replace(/\D/g, "").includes(soKhoa)));
}
