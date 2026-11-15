import "server-only";
import { sb } from "@/lib/db";
import { tenGonNv } from "@/lib/lua-chon-nhan-vien";
import { gopBuoc, type BuocGop } from "@/lib/quy-trinh-buoc";

/** Trạng thái lượt khách thu ngân chuyển cho chuyên viên trị liệu (0321). */
export const TRANG_THAI_CHO: Record<string, { nhan: string; kieu: "cho" | "dang" | "xong" | "tat" }> = {
  cho_lam: { nhan: "Chờ làm", kieu: "cho" }, dang_lam: { nhan: "Đang làm", kieu: "dang" }, xong: { nhan: "Đã làm xong", kieu: "xong" },
  tra_lai: { nhan: "Trả lại thu ngân", kieu: "tat" }, huy: { nhan: "Khách không làm", kieu: "tat" },
};

export type BuoiCho = {
  id: string; trangThai: string; khachId: string; khachTen: string; khachMa: string;
  /** null = lượt từ hoá đơn dịch vụ (khách trả tiền, không trừ thẻ — 0333). */ theId: string | null; theMa: string;
  /** Số buổi trừ khi Kết thúc (nhiều người cùng làm trên một thẻ); lượt hoá đơn = số lượng của dòng. */ soLuong: number;
  hoaDonId: string | null; hoaDonMa: string; goiTen: string; conBuoi: number | null; tongBuoi: number | null;
  dichVuId: string; dichVuTen: string; nvIds: string[]; nvTen: string[]; bacSiId: string | null; tuVanIds: string[]; tuVanTen: string[]; tuVanTinhTrang: string | null; tuVanDeXuat: string | null;
  ghiChu: string | null; vung: string; shot: string; line: string; keTiepNgay: string | null; keTiepNoiDung: string | null;
  chuyenLuc: string; chuyenBoiTen: string; batDauLuc: string | null; xongLuc: string | null; lyDo: string | null; lichHenId: string | null; chuyenBoi: string | null;
};

/** Lượt chờ làm trong ngày của chi nhánh (hoặc chỉ của một chuyên viên). `chiMo` = chỉ lượt còn chờ / đang làm. */
export async function docBuoiCho(o: { chiNhanhId: string | null; ngay: string; nvId?: string; khachId?: string; chiMo?: boolean; gioiHan?: number }): Promise<BuoiCho[]> {
  const db = sb();
  let q = db.from("buoi_cho_lam").select("*").order("chuyen_luc", { ascending: true }).limit(o.gioiHan ?? 200);
  // Lượt còn mở thì hiện cả khi chuyển từ hôm trước (quên bấm); lượt đã đóng chỉ hiện trong ngày.
  q = o.chiMo ? q.in("trang_thai", ["cho_lam", "dang_lam"]) : q.or(`ngay.eq.${o.ngay},trang_thai.in.(cho_lam,dang_lam)`);
  if (o.chiNhanhId) q = q.eq("chi_nhanh_id", o.chiNhanhId);
  if (o.nvId) q = q.contains("nv_ids", [o.nvId]);
  if (o.khachId) q = q.eq("khach_id", o.khachId);
  const { data, error } = await q;
  if (error) console.error("docBuoiCho:", error.message); // lỗi truy vấn đừng giả làm "không có khách"
  const ds = data ?? [];
  if (!ds.length) return [];
  const idsNv = [...new Set(ds.flatMap((r) => [...r.nv_ids, ...r.tu_van_ids, ...(r.chuyen_boi ? [r.chuyen_boi] : [])]))];
  const [{ data: kh }, { data: the }, { data: dv }, { data: nv }] = await Promise.all([
    db.from("khach_hang").select("id, ho_ten, ma").in("id", [...new Set(ds.map((r) => r.khach_id))]),
    db.from("v_the_khach").select("id, ma, goi_id, so_buoi_con, so_buoi_tong").in("id", [...new Set(ds.map((r) => r.the_id).filter((x): x is string => !!x))]),
    db.from("dich_vu").select("id, ten").in("id", [...new Set(ds.map((r) => r.dich_vu_id))]),
    db.from("nhan_vien").select("id, ho_ten").in("id", idsNv),
  ]);
  const goiIds = [...new Set((the ?? []).map((t) => t.goi_id).filter((x): x is string => !!x))];
  const hdIds = [...new Set(ds.map((r) => r.hoa_don_id).filter((x): x is string => !!x))];
  const [{ data: goi }, { data: hd }] = await Promise.all([
    goiIds.length ? db.from("goi_the").select("id, ten").in("id", goiIds) : Promise.resolve({ data: [] as { id: string; ten: string }[] }),
    hdIds.length ? db.from("hoa_don").select("id, ma").in("id", hdIds) : Promise.resolve({ data: [] as { id: string; ma: string }[] }),
  ]);
  const mH = new Map((hd ?? []).map((h) => [h.id, h.ma]));
  const mK = new Map((kh ?? []).map((k) => [k.id, k])), mT = new Map((the ?? []).map((t) => [t.id, t])), mD = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const mN = new Map((nv ?? []).map((n) => [n.id, tenGonNv(n.ho_ten)])), mG = new Map((goi ?? []).map((g) => [g.id, g.ten]));
  return ds.map((r) => {
    const t = r.the_id ? mT.get(r.the_id) : undefined, ts = (r.tham_so ?? {}) as Record<string, unknown>;
    return {
      id: r.id, trangThai: r.trang_thai, khachId: r.khach_id, khachTen: mK.get(r.khach_id)?.ho_ten ?? "Khách", khachMa: mK.get(r.khach_id)?.ma ?? "",
      theId: r.the_id, theMa: t?.ma ?? "", soLuong: Math.max(1, r.so_luong ?? 1), hoaDonId: r.hoa_don_id, hoaDonMa: (r.hoa_don_id && mH.get(r.hoa_don_id)) || "", goiTen: (t?.goi_id && mG.get(t.goi_id)) || "", conBuoi: t?.so_buoi_con ?? null, tongBuoi: t?.so_buoi_tong ?? null,
      dichVuId: r.dich_vu_id, dichVuTen: mD.get(r.dich_vu_id) ?? "", nvIds: r.nv_ids, nvTen: r.nv_ids.map((x) => mN.get(x) ?? "?"), bacSiId: r.bac_si_id,
      tuVanIds: r.tu_van_ids, tuVanTen: r.tu_van_ids.map((x) => mN.get(x) ?? "?"), tuVanTinhTrang: r.tu_van_tinh_trang, tuVanDeXuat: r.tu_van_de_xuat,
      ghiChu: r.ghi_chu, vung: ts.vung == null ? "" : String(ts.vung), shot: ts.shot == null ? "" : String(ts.shot), line: ts.line == null ? "" : String(ts.line),
      keTiepNgay: r.ke_tiep_ngay, keTiepNoiDung: r.ke_tiep_noi_dung, chuyenLuc: r.chuyen_luc, chuyenBoiTen: (r.chuyen_boi && mN.get(r.chuyen_boi)) || "", chuyenBoi: r.chuyen_boi,
      batDauLuc: r.bat_dau_luc, xongLuc: r.xong_luc, lyDo: r.ly_do, lichHenId: r.lich_hen_id,
    };
  });
}

export type QuyTrinhKhach = { buoc: BuocGop[]; dvChuaCo: string[] };

/** Quy trình hôm nay của từng khách có lượt đang mở (0322): gộp bước của mọi dịch vụ khách đang làm + bước đã tích hôm nay.
 *  Bảng 0322 chưa áp thì trả rỗng (trang vẫn chạy như trước). */
export async function docQuyTrinh(ds: BuoiCho[], ngay: string): Promise<Record<string, QuyTrinhKhach>> {
  const mo = ds.filter((r) => r.trangThai === "cho_lam" || r.trangThai === "dang_lam");
  if (!mo.length) return {};
  const db = sb();
  const idsDv = [...new Set(mo.map((r) => r.dichVuId))], idsKh = [...new Set(mo.map((r) => r.khachId))];
  const [{ data: lk, error: e1 }, { data: tich, error: e2 }] = await Promise.all([
    db.from("dich_vu_buoc").select("dich_vu_id, buoc_id, thu_tu, goi_y_vat_tu").in("dich_vu_id", idsDv),
    db.from("luot_buoc").select("khach_id, buoc_id").in("khach_id", idsKh).eq("ngay", ngay),
  ]);
  if (e1 || e2) { console.error("docQuyTrinh:", (e1 ?? e2)?.message); return {}; }
  const idsBuoc = [...new Set((lk ?? []).map((x) => x.buoc_id))];
  const { data: bc } = idsBuoc.length ? await db.from("buoc_quy_trinh").select("id, ten, goi_y_vat_tu").in("id", idsBuoc).eq("hoat_dong", true) : { data: [] };
  const mB = new Map((bc ?? []).map((b) => [b.id, b]));
  const ra: Record<string, QuyTrinhKhach> = {};
  for (const kh of idsKh) {
    const dv = [...new Map(mo.filter((r) => r.khachId === kh).map((r) => [r.dichVuId, r.dichVuTen])).entries()].map(([id, ten]) => ({
      ten, buoc: (lk ?? []).filter((x) => x.dich_vu_id === id && mB.has(x.buoc_id)).map((x) => ({ buocId: x.buoc_id, ten: mB.get(x.buoc_id)!.ten, thuTu: x.thu_tu, goiY: x.goi_y_vat_tu ?? mB.get(x.buoc_id)!.goi_y_vat_tu })),
    }));
    ra[kh] = gopBuoc(dv, new Set((tich ?? []).filter((t) => t.khach_id === kh).map((t) => t.buoc_id)));
  }
  return ra;
}
