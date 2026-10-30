import "server-only";
import { sb } from "@/lib/db";
import { coQuyen } from "@/lib/quyen";
import type { NguoiDung } from "@/lib/auth";
import { docLocHoaDon, khachKhopTim } from "@/lib/loc-hoa-don";
import { canXuatHddt, type LocHddt } from "@/lib/hoa-don-dien-tu";
import { khopNhomLoc, tenTaiKhoan, tomTatThu, type TomTatThu } from "@/lib/hoa-don-dien-tu-ngan-hang";

export const COT_HDDT = "id, ma, ngay_hd, trang_thai, tong_phai_thu, khach_id, chi_nhanh_id, nguoi_lap_id, vat_pct, vat_tien, vat_hd_luc, vat_hd_so, vat_hd_ngay, vat_hd_ky_hieu, vat_hd_mau_so, vat_hd_tra_cuu, vat_hd_nguoi_id, la_so_du_dau, tao_luc";
export const TOI_DA_DONG = 200;
/** Ngăn "Cần xuất" lọc theo ngân hàng nên phải xem nhiều hơn số dòng hiện: quét tối đa chừng này hoá đơn trong khoảng ngày rồi mới cắt TOI_DA_DONG. */
export const TOI_DA_QUET = 900; // dưới 1000 (mức tối đa một lượt của PostgREST) để biết chắc khi nào bị cắt
/** Cột thêm cho Excel hoá đơn đã chọn. */
export const COT_XUAT = "id, ma, ngay_hd, trang_thai, tong_phai_thu, khach_id, chi_nhanh_id, nguoi_lap_id, vat_pct, vat_tien, la_so_du_dau, giam_gia_don, phu_phi, tip, tong_hang";

/** Lấy hết kết quả một truy vấn có thể vượt 1000 dòng (PostgREST cắt mỗi lượt ở 1000): đọc từng trang theo thứ tự ổn định. */
export async function layHet<T>(trang: (tu: number, den: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const ra: T[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data, error } = await trang(tu, tu + 999);
    if (error) throw new Error(error.message);
    ra.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return ra;
  }
}

/** Thanh toán của các hoá đơn, gom theo hoá đơn → nơi nhận tiền (ngân hàng / tiền mặt / thẻ tiền). Lấy theo lô để đường dẫn không quá dài. */
export async function layThuTheoDon(ids: string[], taiKhoan: string[] = []): Promise<Map<string, TomTatThu>> {
  const db = sb(), theo = new Map<string, { loai: string; phuong_thuc: string; so_tien: number; ngan_hang: string | null }[]>();
  for (let i = 0; i < ids.length; i += 50) {
    const lo = ids.slice(i, i + 50);
    const dong = await layHet((tu, den) => db.from("thanh_toan").select("hoa_don_id, loai, phuong_thuc, so_tien, ngan_hang").in("hoa_don_id", lo).order("id").range(tu, den));
    for (const t of dong) (theo.get(t.hoa_don_id) ?? theo.set(t.hoa_don_id, []).get(t.hoa_don_id)!).push(t);
  }
  return new Map(ids.map((id) => [id, tomTatThu(theo.get(id) ?? [], taiKhoan)]));
}

/** Khách có mã số thuế (khách yêu cầu hoá đơn công ty). Số này nhỏ nên lấy hết một lần rồi đưa vào điều kiện lọc. */
async function khachCoMst(): Promise<string[]> {
  const { data } = await sb().from("khach_hang").select("id").not("ma_so_thue", "is", null).neq("ma_so_thue", "").limit(1000);
  return (data ?? []).map((k) => k.id);
}

/** Danh sách hoá đơn cho hai tab. Phạm vi lấy ở MÁY CHỦ từ người dùng: gắn chi nhánh thì chỉ thấy chi nhánh mình; không có quyền xem toàn cơ sở thì chỉ thấy hoá đơn mình lập (như /hoa-don). */
export async function layHoaDonHddt(nd: Pick<NguoiDung, "chiNhanhId" | "nhanVienId" | "quyen" | "vaiTro">, loc: LocHddt, kieu: "can" | "da", toiDa = TOI_DA_DONG) {
  const db = sb();
  const mst = kieu === "can" ? await khachCoMst() : [];
  let q = db.from("hoa_don").select(COT_HDDT).eq("trang_thai", "hoan_thanh").gte("ngay_hd", loc.tu).lte("ngay_hd", loc.den);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (!coQuyen(nd, "ban.toan_co_so")) q = q.eq("nguoi_lap_id", nd.nhanVienId ?? "");
  if (kieu === "can") q = q.is("vat_hd_luc", null).eq("la_so_du_dau", false).or(["vat_pct.gt.0", "vat_tien.gt.0", mst.length ? `khach_id.in.(${mst.join(",")})` : ""].filter(Boolean).join(","));
  else q = q.not("vat_hd_luc", "is", null);
  if (loc.q) {
    const khachIds = await khachKhopTim(db, docLocHoaDon({ q: loc.q }));
    const an = loc.q.replace(/[%,()]/g, " ");
    q = q.or([`ma.ilike.%${an}%`, kieu === "da" ? `vat_hd_so.ilike.%${an}%` : "", khachIds.length ? `khach_id.in.(${khachIds.join(",")})` : ""].filter(Boolean).join(","));
  }
  const gioiHan = kieu === "can" ? Math.max(toiDa, TOI_DA_QUET) : toiDa;
  const { data, error } = await q.order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).order("id").limit(gioiHan + 1);
  if (error) throw new Error(error.message);
  const dong = data ?? [];
  const khachMst = new Set(mst);
  let loc2 = kieu === "can" ? dong.filter((h) => canXuatHddt(h, !!h.khach_id && khachMst.has(h.khach_id))) : dong;
  // Ngăn "Cần xuất": gắn nơi nhận tiền của từng hoá đơn và lọc theo ngân hàng (loc.nh; null = không lọc).
  let thu = new Map<string, TomTatThu>();
  if (kieu === "can") {
    thu = await layThuTheoDon(loc2.map((h) => h.id), loc.taiKhoan);
    loc2 = loc2.filter((h) => khopNhomLoc(thu.get(h.id)!, loc.nh));
  }
  return { dong: loc2.slice(0, toiDa), conNua: loc2.length > toiDa || dong.length > gioiHan, thu };
}

/** Các hoá đơn người dùng đã chọn để xuất Excel. Id từ trình duyệt KHÔNG được tin: chỉ lấy hoá đơn hoàn thành nằm trong phạm vi người này được xem
 *  (khoá chi nhánh, không có quyền xem toàn cơ sở thì chỉ đơn mình lập, bỏ số dư đầu kỳ); id ngoài phạm vi bị bỏ im lặng và được đếm trong `boQua`. */
export async function layHoaDonTheoIds(nd: Pick<NguoiDung, "chiNhanhId" | "nhanVienId" | "quyen" | "vaiTro">, ids: string[]) {
  const db = sb(), ra: (Awaited<ReturnType<typeof layHoaDonXuatLo>>)[number][] = [];
  for (let i = 0; i < ids.length; i += 100) ra.push(...(await layHoaDonXuatLo(db, nd, ids.slice(i, i + 100))));
  const thuTu = new Map(ids.map((id, i) => [id, i]));
  ra.sort((a, b) => a.ngay_hd.localeCompare(b.ngay_hd) || a.ma.localeCompare(b.ma) || (thuTu.get(a.id) ?? 0) - (thuTu.get(b.id) ?? 0));
  return { dong: ra, boQua: ids.length - ra.length };
}
async function layHoaDonXuatLo(db: ReturnType<typeof sb>, nd: Pick<NguoiDung, "chiNhanhId" | "nhanVienId" | "quyen" | "vaiTro">, ids: string[]) {
  let q = db.from("hoa_don").select(COT_XUAT).in("id", ids).eq("trang_thai", "hoan_thanh").eq("la_so_du_dau", false);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (!coQuyen(nd, "ban.toan_co_so")) q = q.eq("nguoi_lap_id", nd.nhanVienId ?? "");
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Các hoá đơn đã có tên sửa riêng cho bảng xuất (người mua hoặc ít nhất một dòng hàng): để hiện nhãn "đã sửa tên" ở danh sách. */
export async function layDaSuaTen(ids: string[]): Promise<Set<string>> {
  const db = sb(), co = new Set<string>();
  for (let i = 0; i < ids.length; i += 50) {
    const lo = ids.slice(i, i + 50);
    const [tc, dong] = await Promise.all([
      layHet((tu, den) => db.from("hoa_don_xuat_tuy_chinh").select("hoa_don_id").in("hoa_don_id", lo).order("hoa_don_id").range(tu, den)),
      layHet((tu, den) => db.from("hoa_don_dong").select("id, hoa_don_id").in("hoa_don_id", lo).order("id").range(tu, den)),
    ]);
    for (const x of tc) co.add(x.hoa_don_id);
    const chuHd = new Map(dong.map((x) => [x.id, x.hoa_don_id])), idsDong = dong.map((x) => x.id);
    for (let j = 0; j < idsDong.length; j += 100) {
      const sua = await layHet((tu, den) => db.from("hoa_don_xuat_dong").select("hoa_don_dong_id").in("hoa_don_dong_id", idsDong.slice(j, j + 100)).order("hoa_don_dong_id").range(tu, den));
      for (const x of sua) { const h = chuHd.get(x.hoa_don_dong_id); if (h) co.add(h); }
    }
  }
  return co;
}

/** Danh sách tài khoản nhận tiền đang hoạt động (Cài đặt › Tài khoản Ngân Hàng): tên ngắn, tài khoản mặc định lên đầu. Người gắn chi nhánh chỉ thấy tài khoản chung và của chi nhánh mình. */
export async function layTaiKhoanNhan(nd: Pick<NguoiDung, "chiNhanhId">): Promise<string[]> {
  let q = sb().from("tai_khoan_ngan_hang").select("ngan_hang, chi_nhanh_id").eq("hoat_dong", true).order("mac_dinh", { ascending: false }).order("tao_luc");
  if (nd.chiNhanhId) q = q.or(`chi_nhanh_id.is.null,chi_nhanh_id.eq.${nd.chiNhanhId}`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return tenTaiKhoan(data ?? []);
}
