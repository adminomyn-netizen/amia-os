import type { sb } from "@/lib/db";

/** Dữ liệu dùng chung cho tab Báo cáo "Hoa hồng thực thu" / "Hoa hồng giới thiệu" và nút Xuất Excel (một nguồn → số trên màn hình và trong tệp luôn khớp). */
type Db = ReturnType<typeof sb>;

export const VAI_HH = ["phuc_vu", "tu_van", "ban"] as const;
export type VaiHh = (typeof VAI_HH)[number];
export const NHAN_VAI_HH: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng", gioi_thieu: "Giới thiệu" };
export const LUA_CHON_VAI = [{ gia_tri: "", nhan: "Mọi vai" }, ...VAI_HH.map((v) => ({ gia_tri: v, nhan: NHAN_VAI_HH[v] }))];
export const LUA_CHON_THE = [{ gia_tri: "", nhan: "Chỉ tiền thật (mặt, chuyển khoản, quẹt thẻ)" }, { gia_tri: "1", nhan: "Gồm cả phần trừ thẻ tiền" }];

const n = (v: unknown) => Number(v ?? 0);

export type DongNv = { id: string; ten: string; theoVai: Partial<Record<VaiHh, { doanhSo: number; hoaHong: number }>>; doanhSo: number; hoaHong: number; doanhSoNoCu: number; soHd: number };
export type DongCn = { id: string; ten: string; doanhSo: number; hoaHong: number };

export async function layHoaHongThucThu(db: Db, o: { tu: string; den: string; cn?: string; vai?: string; gomThe: boolean }) {
  const [{ data, error }, { data: dc, error: e2 }, { data: nv }, { data: cns }, { count: soTiLe }] = await Promise.all([
    db.rpc("bc_hoa_hong_thuc_thu", { p_tu: o.tu, p_den: o.den, p_cn: o.cn as string }),
    db.rpc("bc_hoa_hong_doi_chieu", { p_tu: o.tu, p_den: o.den, p_cn: o.cn as string }),
    db.from("nhan_vien").select("id, ho_ten"),
    db.from("chi_nhanh").select("id, ten"),
    db.from("hoa_hong_ti_le").select("id", { count: "exact", head: true }),
  ]);
  if (error) throw new Error(error.message);
  if (e2) throw new Error(e2.message);
  const tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
  const tenCn = new Map((cns ?? []).map((x) => [x.id, x.ten]));
  const vaiLoc = VAI_HH.find((v) => v === o.vai);
  const dong = (data ?? []).filter((r) => !vaiLoc || r.vai === vaiLoc).map((r) => ({
    nv: r.nhan_vien_id, vai: r.vai as VaiHh, cn: r.chi_nhanh_id, nguon: r.nguon, soHd: n(r.so_hd),
    doanhSo: n(r.doanh_so_tien) + (o.gomThe ? n(r.doanh_so_the) : 0), hoaHong: n(r.hoa_hong_tien) + (o.gomThe ? n(r.hoa_hong_the) : 0),
  }));
  const theoNv = new Map<string, DongNv>();
  for (const r of dong) {
    const g = theoNv.get(r.nv) ?? { id: r.nv, ten: tenNv.get(r.nv) ?? "(nhân viên đã xoá)", theoVai: {}, doanhSo: 0, hoaHong: 0, doanhSoNoCu: 0, soHd: 0 };
    const v = g.theoVai[r.vai] ?? { doanhSo: 0, hoaHong: 0 };
    v.doanhSo += r.doanhSo; v.hoaHong += r.hoaHong; g.theoVai[r.vai] = v;
    g.doanhSo += r.doanhSo; g.hoaHong += r.hoaHong; g.soHd += r.soHd;
    if (r.nguon === "cu") g.doanhSoNoCu += r.doanhSo;
    theoNv.set(r.nv, g);
  }
  const nhanVien = [...theoNv.values()].sort((a, b) => b.hoaHong - a.hoaHong || b.doanhSo - a.doanhSo);
  const theoCn = new Map<string, DongCn>();
  for (const r of dong) { const g = theoCn.get(r.cn) ?? { id: r.cn, ten: tenCn.get(r.cn) ?? "", doanhSo: 0, hoaHong: 0 }; g.doanhSo += r.doanhSo; g.hoaHong += r.hoaHong; theoCn.set(r.cn, g); }
  const theoVai = VAI_HH.map((v) => ({ vai: v, doanhSo: dong.filter((r) => r.vai === v).reduce((s, r) => s + r.doanhSo, 0), hoaHong: dong.filter((r) => r.vai === v).reduce((s, r) => s + r.hoaHong, 0) })).filter((r) => !vaiLoc || r.vai === vaiLoc);
  const d = dc?.[0];
  const doiChieu = { theoHoaDon: n(d?.theo_hoa_don), thucThuDonMoi: n(d?.thuc_thu_don_moi), truTheDonMoi: n(d?.tru_the_don_moi), conNoCuoiKy: n(d?.con_no_cuoi_ky), thuNoCu: n(d?.thu_no_cu), truTheNoCu: n(d?.tru_the_no_cu), khac: n(d?.khac) };
  return {
    nhanVien, chiNhanh: [...theoCn.values()].sort((a, b) => b.hoaHong - a.hoaHong), theoVai, doiChieu,
    tong: { doanhSo: dong.reduce((s, r) => s + r.doanhSo, 0), hoaHong: dong.reduce((s, r) => s + r.hoaHong, 0), doanhSoNoCu: dong.filter((r) => r.nguon === "cu").reduce((s, r) => s + r.doanhSo, 0) },
    chuaCaiTiLe: (soTiLe ?? 0) === 0,
  };
}

/** Phần diễn giải đối chiếu: từ hoa hồng theo hoá đơn đến hoa hồng theo thực thu (đã tính theo lựa chọn có/không gồm thẻ tiền). Chỉ đúng khi không lọc theo vai (đối chiếu tính cả ba vai). */
export function dongDoiChieu(d: Awaited<ReturnType<typeof layHoaHongThucThu>>["doiChieu"], gomThe: boolean) {
  const rows: { nhan: string; so: number; ghiChu: string }[] = [
    { nhan: "Hoa hồng theo hoá đơn lập trong kỳ", so: d.theoHoaDon, ghiChu: "tính cả phần khách chưa trả (tab Theo nhân viên, Hoa hồng)" },
    { nhan: "Trừ: phần hoá đơn kỳ này chưa thu đến hết kỳ", so: -d.conNoCuoiKy, ghiChu: "khách còn nợ hoặc trả sau kỳ" },
  ];
  if (!gomThe) rows.push({ nhan: "Trừ: phần trả bằng thẻ tiền", so: -d.truTheDonMoi, ghiChu: "tiền đã vào lúc bán thẻ" });
  rows.push({ nhan: "Cộng: thu nợ của hoá đơn lập trước kỳ", so: d.thuNoCu + (gomThe ? d.truTheNoCu : 0), ghiChu: "tính vào kỳ có ngày thu" });
  rows.push({ nhan: "Khác (làm tròn, khoản thu có ngày trước ngày hoá đơn)", so: -d.khac, ghiChu: "" });
  const ket = rows.reduce((s, r) => s + r.so, 0);
  return { rows, ket };
}

export async function layHoaHongGioiThieu(db: Db, o: { tu: string; den: string; cn?: string; xemSdt: boolean }) {
  const [{ data, error }, { count: soTiLe }] = await Promise.all([
    db.rpc("bc_hoa_hong_gioi_thieu", { p_tu: o.tu, p_den: o.den, p_cn: o.cn as string }),
    db.from("hoa_hong_ti_le").select("id", { count: "exact", head: true }).eq("vai", "gioi_thieu"),
  ]);
  if (error) throw new Error(error.message);
  const dong = (data ?? []).map((r) => ({ nguon: r.nguon, khoa: r.nguoi_khoa, ten: r.nguoi_ten, ma: r.nguoi_ma ?? "", dt: o.xemSdt ? r.nguoi_dt ?? "" : r.nguoi_dt ? "•••" : "", soHd: n(r.so_hd), doanhSo: n(r.doanh_so), hoaHong: n(r.hoa_hong) }))
    .sort((a, b) => b.hoaHong - a.hoaHong || b.doanhSo - a.doanhSo);
  const khach = dong.filter((r) => r.nguon === "khach"), sh = dong.filter((r) => r.nguon === "salonhero");
  const tong = (ds: typeof dong, k: "doanhSo" | "hoaHong" | "soHd") => ds.reduce((s, r) => s + r[k], 0);
  return { khach, sh, tongKhach: { doanhSo: tong(khach, "doanhSo"), hoaHong: tong(khach, "hoaHong"), soHd: tong(khach, "soHd") }, tongSh: { doanhSo: tong(sh, "doanhSo"), hoaHong: tong(sh, "hoaHong"), soHd: tong(sh, "soHd") }, chuaCaiTiLeGt: (soTiLe ?? 0) === 0 };
}
