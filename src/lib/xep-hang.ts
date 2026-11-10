import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";
import { chiNhanhHoatDong } from "@/lib/chi-nhanh";
import { locKhach } from "@/lib/khach-danh-sach";

// Bảng xếp hạng + sinh nhật của Dashboard (chị Lâm 10/11/2026). Mọi số TÍNH TRONG CSDL bằng đúng các hàm báo cáo đã có
// (cùng số với Báo cáo › Theo nhân viên / Theo sản phẩm, dịch vụ / Theo khách hàng — cách SalonHero), không tự chế công thức:
//   bc_nhan_vien_sh (0117: phục vụ / bán SP / bán thẻ / tư vấn, dịch vụ làm bằng thẻ lấy giá một buổi của thẻ, chia theo tỉ lệ người hưởng)
//   bc_san_pham_dich_vu (0118) · bc_theo_khach_hang · bc_cham_diem_nv · xh_the_gia_han (0325, mua lại đúng gói thẻ đã có).
// Giữ 2 phút dùng chung cho mọi người xem cùng chi nhánh/kỳ. Lỗi thì ném ra để KHÔNG bị lưu đệm.

/** Chủ / Kỹ thuật không gắn chi nhánh: nếu chỉ còn MỘT chi nhánh đang hoạt động (Vinh; Đà Lạt đã đóng) thì xếp hạng + sinh nhật lấy theo chi nhánh đó. */
export async function cnXepHang(cn: string | null): Promise<{ id: string | null; ten: string | null }> {
  if (cn) return { id: cn, ten: null };
  const ds = await chiNhanhHoatDong().catch(() => []);
  return ds.length === 1 ? { id: ds[0].id, ten: ds[0].ten } : { id: null, ten: null };
}

export type MucXh = { ten: string; so: number; tien: number; phu?: string; chiTiet?: { nhan: string; gt: number; tien?: boolean }[] };
export type XepHang = {
  nhanVien: MucXh[];      // tổng doanh số (phục vụ + bán SP + bán thẻ + tư vấn) như Báo cáo › Theo nhân viên
  banHang: MucXh[];       // bán thẻ + bán sản phẩm (vai Bán) — ai bán được nhiều nhất
  chuyenVien: MucXh[];    // số lượt phục vụ dịch vụ — chuyên viên trị liệu làm nhiều nhất (kèm điểm đánh giá nếu có)
  dichVu: MucXh[];        // dịch vụ làm nhiều nhất (bán lẻ + dùng thẻ), theo số lượt
  the: MucXh[];           // thẻ bán chạy, theo doanh thu
  giaHan: MucXh[];        // thẻ được mua lại (gia hạn) nhiều nhất
  sanPham: MucXh[];       // sản phẩm bán chạy, theo doanh thu
  khach: MucXh[];         // khách chi tiêu nhiều nhất trong kỳ
};

const boMa = (ten: string) => ten.replace(/^MSC[^.]*\.[^.]*\./, "").trim();

async function tinhXepHang(tu: string, den: string, cn: string | null): Promise<XepHang> {
  const db = sb(), c = (cn ?? undefined) as string;
  const [nv, spdv, kh, gh, dg] = await Promise.all([
    db.rpc("bc_nhan_vien_sh", { p_tu: tu, p_den: den, p_cn: c }),
    db.rpc("bc_san_pham_dich_vu", { p_tu: tu, p_den: den, p_cn: c }),
    db.rpc("bc_theo_khach_hang", { p_tu: tu, p_den: den, p_cn: c, p_so: 10, p_tu_dong: 0 }),
    db.rpc("xh_the_gia_han", { p_tu: tu, p_den: den, p_cn: c, p_so: 10 }),
    db.rpc("bc_cham_diem_nv", { p_tu: tu, p_den: den, p_cn: c }),
  ]);
  const loi = [nv, spdv, kh, gh, dg].find((r) => r.error)?.error;
  if (loi) throw new Error(loi.message);

  const ds = (nv.data ?? []).map((r) => {
    const x = { id: r.nhan_vien_id, ten: boMa(r.ho_ten ?? "Nhân viên"), soPv: Number(r.so_phuc_vu), dv: Number(r.ds_dich_vu), soSp: Number(r.so_san_pham), sp: Number(r.ds_san_pham), soThe: Number(r.so_the), the: Number(r.ds_the), soTv: Number(r.so_tu_van), tv: Number(r.ds_tu_van) };
    return { ...x, tong: x.dv + x.sp + x.the + x.tv };
  });
  const chiTietNv = (x: (typeof ds)[number]) => [
    { nhan: `Phục vụ (${x.soPv} lượt)`, gt: x.dv, tien: true }, { nhan: `Bán thẻ (${x.soThe})`, gt: x.the, tien: true },
    { nhan: `Bán sản phẩm (${x.soSp})`, gt: x.sp, tien: true }, { nhan: `Tư vấn (${x.soTv})`, gt: x.tv, tien: true },
  ];
  const diem = new Map((dg.data ?? []).map((r) => [r.nhan_vien_id, r]));
  const top = <T,>(a: T[], k: (x: T) => number, n = 10) => a.filter((x) => k(x) > 0).sort((p, q) => k(q) - k(p)).slice(0, n);

  // Dịch vụ: gộp bán lẻ + dùng thẻ theo tên (dòng dùng thẻ 0đ nên xếp theo SỐ LƯỢT, tiền là phần bán lẻ).
  const theoDv = new Map<string, { so: number; tien: number; le: number; the: number }>();
  for (const r of spdv.data ?? []) {
    if (r.loai !== "dich_vu" && r.loai !== "dung_the") continue;
    const m = theoDv.get(r.ten) ?? { so: 0, tien: 0, le: 0, the: 0 };
    const sl = Number(r.so_luong);
    m.so += sl; m.tien += Number(r.sau);
    if (r.loai === "dich_vu") m.le += sl; else m.the += sl;
    theoDv.set(r.ten, m);
  }
  // Thẻ: bỏ khoản tiền đặt cọc (thẻ tiền cọc) — không phải thẻ bán ra.
  const hangLoai = (loai: string) => top((spdv.data ?? []).filter((r) => r.loai === loai && !(loai === "ban_the" && /c[ọo]c/i.test(r.ten))), (r) => Number(r.sau))
    .map((r) => ({ ten: r.ten, so: Number(r.so_luong), tien: Number(r.sau) }));

  return {
    nhanVien: top(ds, (x) => x.tong).map((x) => ({ ten: x.ten, so: x.soPv + x.soThe + x.soSp, tien: x.tong, chiTiet: chiTietNv(x) })),
    banHang: top(ds, (x) => x.the + x.sp).map((x) => ({ ten: x.ten, so: x.soThe + x.soSp, tien: x.the + x.sp, chiTiet: [{ nhan: `Bán thẻ (${x.soThe})`, gt: x.the, tien: true }, { nhan: `Bán sản phẩm (${x.soSp})`, gt: x.sp, tien: true }] })),
    chuyenVien: top(ds, (x) => x.soPv).map((x) => {
      const d = diem.get(x.id);
      return { ten: x.ten, so: x.soPv, tien: x.dv, phu: d ? `${d.diem_tb} điểm · ${d.so_luot} đánh giá` : undefined, chiTiet: [{ nhan: "Lượt phục vụ", gt: x.soPv }, { nhan: "Doanh số phục vụ", gt: x.dv, tien: true }, ...(d ? [{ nhan: "Điểm đánh giá TB", gt: Number(d.diem_tb) }, { nhan: "Số đánh giá", gt: d.so_luot }] : [])] };
    }),
    dichVu: top([...theoDv].map(([ten, m]) => ({ ten, ...m })), (x) => x.so).map((x) => ({ ten: x.ten, so: x.so, tien: x.tien, chiTiet: [{ nhan: "Tổng lượt", gt: x.so }, { nhan: "Làm bằng thẻ", gt: x.the }, { nhan: "Bán lẻ", gt: x.le }, { nhan: "Doanh thu bán lẻ", gt: x.tien, tien: true }] })),
    the: hangLoai("ban_the"),
    sanPham: hangLoai("san_pham"),
    giaHan: (gh.data ?? []).map((r) => ({ ten: r.ten, so: Number(r.so_lan), tien: Number(r.tien), chiTiet: [{ nhan: "Lần mua lại", gt: Number(r.so_lan) }, { nhan: "Số khách", gt: Number(r.so_khach) }, { nhan: "Doanh thu", gt: Number(r.tien), tien: true }] })),
    khach: (kh.data ?? []).filter((r) => r.khach_id && Number(r.doanh_thu) > 0).map((r) => ({ ten: r.ho_ten, so: r.so_don, tien: Number(r.doanh_thu), phu: r.hang ?? undefined, chiTiet: [{ nhan: "Số đơn", gt: r.so_don }, { nhan: "Doanh thu", gt: Number(r.doanh_thu), tien: true }, { nhan: "Thực thu", gt: Number(r.thuc_thu), tien: true }] })),
  };
}
export const layXepHang = unstable_cache(tinhXepHang, ["xep-hang-dashboard-v1"], { revalidate: 120 });

export type KhachSinhNhat = { id: string; ma: string; ten: string; sdt: string; ngaySinh: string; hang: string | null; chi12: number; theDangDung: number };

/** Khách sinh nhật trong tháng `thang` (yyyy-mm, theo ngày Việt Nam) bằng hàm loc_khach — cùng bộ lọc "Sinh nhật tháng N" ở màn Khách hàng — sắp theo ngày. */
async function tinhSinhNhatThang(cn: string | null, thang: string): Promise<KhachSinhNhat[]> {
  const ra: KhachSinhNhat[] = [];
  // loc_khach trả tối đa 1.000 dòng/lần: đọc theo trang tới khi đủ (một tháng thường ~450–550 khách).
  for (let tu = 0; tu < 5000; tu += 1000) {
    const kq = await locKhach({ sinh_nhat: String(Number(thang.slice(5, 7))), sx: "ten", ...(cn ? { chi_nhanh: cn } : {}) }, tu, 1000);
    if (!kq) throw new Error("Không đọc được danh sách sinh nhật");
    for (const k of kq.ds) if (k.ngay_sinh) ra.push({ id: k.id, ma: k.ma, ten: k.ho_ten, sdt: k.dien_thoai ?? "", ngaySinh: k.ngay_sinh, hang: k.hang, chi12: Number(k.chi_12_thang ?? 0), theDangDung: Number(k.so_the_dang_dung ?? 0) });
    if (kq.ds.length < 1000) break;
  }
  return ra.sort((a, b) => a.ngaySinh.slice(5).localeCompare(b.ngaySinh.slice(5)) || a.ten.localeCompare(b.ten, "vi"));
}
/** Khoá theo tháng (yyyy-mm) để sang tháng mới không đọc nhầm bản đệm cũ. */
const sinhNhatDem = unstable_cache(tinhSinhNhatThang, ["sinh-nhat-thang-v1"], { revalidate: 300 });
export const laySinhNhatThang = (cn: string | null, thang: string) => sinhNhatDem(cn, thang);
