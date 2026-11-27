import "server-only";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/db";
import { congNgay } from "@/lib/dinh-dang";
import {
  docCauHinh, doanhSoTelesale, doanhThuGiaSan, heSoTran, hoaHongGiamDoc, hoaHongMarketing, khoaTen, NHAN_KHOAN_BAN, phanLoaiDong, thuongGianTiep,
  thuongVuotChiTieu, tiLeKhoanBan, tiLeThang, tinhHoaHongBan, tinhPhiTriLieu,
  type CaDichVu, type CauHinhHh, type DongDoanhSo, type DongDonGia, type KhoanBan, type NguCanhGia,
} from "@/lib/cs-hoa-hong";

/** Bảng tính hoa hồng + phí trị liệu một tháng theo chính sách từ 01/11/2026. Một nguồn cho: màn tính tháng của kế toán, màn tính thử từng người,
 *  trang "Thu nhập tạm tính của tôi" và nút Chốt (đổ vào bảng lương). Số tạm tính tới `den` (mặc định hôm nay nếu tháng chưa hết). */

export const NHOM_HH = {
  tu_van: "Tư vấn", tri_lieu: "Trị liệu viên", bac_si: "Bác sĩ", telesale: "Telesale", gian_tiep_nv: "Gián tiếp – nhân viên", gian_tiep_ql: "Gián tiếp – quản lý",
  gd_chi_nhanh: "Giám đốc chi nhánh", tp_marketing: "Trưởng phòng Marketing", khong: "Không hưởng",
} as const;
export type NhomHh = keyof typeof NHOM_HH;

export type Khoan = { ma: string; nhan: string; ds?: number; tl?: number; tien: number; ghiChu?: string };
export type DongNv = { id: string; ten: string; chucDanh: string; nhom: NhomHh | null; cn: string | null; khoan: Khoan[]; tong: number; dsBan: number; chiTieu: number | null; datDk: boolean };
export type CaPhi = { dongId: string; ngay: string; maHd: string; khach: string; ten: string; soDv: number; nv: string; tenNv: string; doiTuong: "bac_si" | "tri_lieu"; laPhuBs: boolean; dongGia: string; donGia: number; tien: number };
export type SoCn = { id: string; ten: string; ds: number; dsPm: number; dsDv: number; dsDvPm: number; dsGiaSan: number; dsMkt: number; chiPhiQc: number; ghiDe: { ds: number | null; dsDv: number | null; qc: number | null } };
export type BangThang = {
  nam: number; thang: number; tu: string; den: string; tamTinh: boolean; cauHinh: CauHinhHh; tenCs: string;
  cn: SoCn[]; tong: SoCn;
  nhanVien: DongNv[];
  khongThuocDien: { id: string; ten: string; chucDanh: string; ds: number }[];
  phi: { bs: { tong: number; tran: number; heSo: number }; tlv: { tong: number; tran: number; heSo: number }; ca: CaPhi[];
    chuaDonGia: { ten: string; doiTuong: "bac_si" | "tri_lieu"; soCa: number; dvId: string | null }[]; loaiTru: { dongId: string; ngay: string; maHd: string; ten: string; lyDo: string }[];
    caChuaNguoiLam: number; caNguoiKhac: number };
  canhBao: { dongChuaGia: number; dsChuaGia: number; nguoiDatChuaKhop: [string, number][] };
  chot: { luc: string; soNguoi: number; tong: number } | null;
};

const n = (v: unknown) => Number(v ?? 0);
const ngayVn = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);

async function tinh(nam: number, thang: number, den: string): Promise<BangThang> {
  const db = sb();
  const tu = `${nam}-${String(thang).padStart(2, "0")}-01`;
  const cuoi = congNgay(thang === 12 ? `${nam + 1}-01-01` : `${nam}-${String(thang + 1).padStart(2, "0")}-01`, -1);
  const toi = den < cuoi ? den : cuoi;
  const [cs, dongKq, caKq, dmKq, nvKq, cnKq, tcnKq, tnvKq, qcKq, dgKq, chotKq] = await Promise.all([
    db.from("cs_hoa_hong").select("ten, cau_hinh").lte("hieu_luc_tu", tu).order("hieu_luc_tu", { ascending: false }).limit(1).maybeSingle(),
    db.rpc("bc_cs_hh_dong", { p_tu: tu, p_den: toi }),
    db.rpc("bc_phi_tl_ca", { p_tu: tu, p_den: toi }),
    db.from("cs_hh_danh_muc").select("id, ten, gia_khuyen_mai, goi_id, dich_vu_id").order("thu_tu"),
    db.from("nhan_vien").select("id, ho_ten, chuc_danh, nhom_hh, chi_nhanh_id, hoat_dong"),
    db.from("chi_nhanh").select("id, ten"),
    db.from("cs_hh_thang_cn").select("chi_nhanh_id, doanh_so_chot, doanh_so_dv_chot, chi_phi_qc").eq("nam", nam).eq("thang", thang),
    db.from("cs_hh_thang_nv").select("nhan_vien_id, chi_tieu, dat_dieu_kien").eq("nam", nam).eq("thang", thang),
    db.from("chi_phi_qc_ngay").select("chi_phi").gte("ngay", tu).lte("ngay", toi),
    db.from("phi_tl_don_gia").select("id, doi_tuong, stt, ten, dvt, don_gia, dich_vu_ids, ten_ghep"),
    db.from("cs_hh_chot").select("so_tien, chot_luc, nhan_vien_id").eq("nam", nam).eq("thang", thang),
  ]);
  for (const r of [dongKq, caKq]) if (r.error) throw new Error(r.error.message);
  const cfg = docCauHinh(cs.data?.cau_hinh);
  const nv = new Map((nvKq.data ?? []).map((x) => [x.id, x]));
  const tenNv = (id: string) => nv.get(id)?.ho_ten.replace(/^MSC[.\-A-Z0-9]*\.\s*/, "") ?? "(đã xoá)";
  const nhomNv = (id: string) => (nv.get(id)?.nhom_hh as NhomHh | null) ?? null;

  // Giá khuyến mại / tối thiểu của các mục xuất hiện trong tháng
  const dong: DongDoanhSo[] = (dongKq.data ?? []).map((r) => ({
    dongId: r.dong_id, cn: r.chi_nhanh_id, khachId: r.khach_id, khachNguon: r.khach_nguon, khachMoi: r.khach_moi, loai: r.loai, dvId: r.dich_vu_id, goiId: r.goi_id,
    giaRong: r.gia_rong == null ? null : n(r.gia_rong), tt: n(r.tt), nguoi: ((r.nguoi as { nv: string; vai: string; tl: number }[] | null) ?? []).map((p) => ({ nv: p.nv, vai: p.vai, tl: n(p.tl) })),
  }));
  const dvIds = [...new Set(dong.map((d) => d.dvId).filter((x): x is string => !!x))], goiIds = [...new Set(dong.map((d) => d.goiId).filter((x): x is string => !!x))];
  const [dvGia, goiGia] = await Promise.all([
    dvIds.length ? db.from("dich_vu").select("id, gia_khuyen_mai, gia_toi_thieu").in("id", dvIds) : Promise.resolve({ data: [] as { id: string; gia_khuyen_mai: number | null; gia_toi_thieu: number | null }[] }),
    goiIds.length ? db.from("goi_the").select("id, gia_khuyen_mai, gia_toi_thieu").in("id", goiIds) : Promise.resolve({ data: [] as { id: string; gia_khuyen_mai: number | null; gia_toi_thieu: number | null }[] }),
  ]);
  const muc = (x: { gia_khuyen_mai: number | null; gia_toi_thieu: number | null }) => ({ km: x.gia_khuyen_mai == null ? null : n(x.gia_khuyen_mai), toiThieu: x.gia_toi_thieu == null ? null : n(x.gia_toi_thieu) });
  const g: NguCanhGia = {
    dichVu: new Map((dvGia.data ?? []).map((x) => [x.id, muc(x)])), goi: new Map((goiGia.data ?? []).map((x) => [x.id, muc(x)])),
    danhMuc: (dmKq.data ?? []).map((x) => ({ id: x.id, ten: x.ten, km: n(x.gia_khuyen_mai), goiId: x.goi_id, dvId: x.dich_vu_id })),
  };

  // Số chi nhánh: phần mềm tính, kế toán ghi đè được bằng số chốt
  const ghiDe = new Map((tcnKq.data ?? []).map((x) => [x.chi_nhanh_id, x]));
  const qcTong = (qcKq.data ?? []).reduce((s, x) => s + n(x.chi_phi), 0);
  const cnIds = [...new Set([...dong.map((d) => d.cn), ...ghiDe.keys()])];
  const tenCn = new Map((cnKq.data ?? []).map((x) => [x.id, x.ten]));
  const soCn = (ds: DongDoanhSo[], id: string, ten: string, gd?: { doanh_so_chot: number | null; doanh_so_dv_chot: number | null; chi_phi_qc: number | null }, qcMacDinh = 0): SoCn => {
    const dsPm = ds.reduce((s, d) => s + d.tt, 0), dsDvPm = ds.filter((d) => d.loai !== "san_pham").reduce((s, d) => s + d.tt, 0);
    const go = { ds: gd?.doanh_so_chot == null ? null : n(gd.doanh_so_chot), dsDv: gd?.doanh_so_dv_chot == null ? null : n(gd.doanh_so_dv_chot), qc: gd?.chi_phi_qc == null ? null : n(gd.chi_phi_qc) };
    return { id, ten, dsPm, dsDvPm, ds: go.ds ?? dsPm, dsDv: go.dsDv ?? dsDvPm, dsGiaSan: doanhThuGiaSan(ds, g), dsMkt: ds.filter((d) => d.khachNguon === "mkt").reduce((s, d) => s + d.tt, 0), chiPhiQc: go.qc ?? qcMacDinh, ghiDe: go };
  };
  const cn = cnIds.map((id) => soCn(dong.filter((d) => d.cn === id), id, tenCn.get(id) ?? "", ghiDe.get(id) ?? undefined, cnIds.length === 1 ? qcTong : 0));
  const tong: SoCn = cn.length === 1 ? { ...cn[0], id: "", ten: "Toàn hệ thống" } : {
    id: "", ten: "Toàn hệ thống", ds: cn.reduce((s, c) => s + c.ds, 0), dsPm: cn.reduce((s, c) => s + c.dsPm, 0), dsDv: cn.reduce((s, c) => s + c.dsDv, 0), dsDvPm: cn.reduce((s, c) => s + c.dsDvPm, 0),
    dsGiaSan: cn.reduce((s, c) => s + c.dsGiaSan, 0), dsMkt: cn.reduce((s, c) => s + c.dsMkt, 0), chiPhiQc: Math.max(qcTong, cn.reduce((s, c) => s + c.chiPhiQc, 0)), ghiDe: { ds: null, dsDv: null, qc: null },
  };
  const soCuaNv = (id: string) => cn.find((c) => c.id === nv.get(id)?.chi_nhanh_id) ?? tong;

  const tnv = new Map((tnvKq.data ?? []).map((x) => [x.nhan_vien_id, x]));
  const ketQua = new Map<string, DongNv>();
  const lay = (id: string) => {
    const x = ketQua.get(id);
    if (x) return x;
    const t = tnv.get(id), r: DongNv = { id, ten: tenNv(id), chucDanh: nv.get(id)?.chuc_danh ?? "", nhom: nhomNv(id), cn: nv.get(id)?.chi_nhanh_id ?? null, khoan: [], tong: 0, dsBan: 0, chiTieu: t?.chi_tieu == null ? null : n(t.chi_tieu), datDk: t?.dat_dieu_kien ?? true };
    ketQua.set(id, r); return r;
  };
  const them = (id: string, k: Khoan) => { const r = lay(id); r.khoan.push({ ...k, tien: Math.round(k.tien) }); r.tong += Math.round(k.tien); };

  // PL05 A: tư vấn, trị liệu viên
  const ban = tinhHoaHongBan(dong, g, cfg);
  const khongThuocDien: BangThang["khongThuocDien"] = [];
  for (const [id, r] of ban) {
    const nh = nhomNv(id);
    if (nh !== "tu_van" && nh !== "tri_lieu") { khongThuocDien.push({ id, ten: tenNv(id), chucDanh: nv.get(id)?.chuc_danh ?? "", ds: Math.round(r.ds) }); continue; }
    const x = lay(id); x.dsBan = r.ds;
    for (const [k, v] of Object.entries(r.theoKhoan) as [KhoanBan, { ds: number; hh: number }][])
      if (v.ds) them(id, { ma: `ban.${k}`, nhan: NHAN_KHOAN_BAN[k], ds: v.ds, tl: tiLeKhoanBan(k, cfg), tien: v.hh });
  }
  for (const [id, x] of ketQua) if (x.nhom === "tu_van" && x.chiTieu) {
    const t = thuongVuotChiTieu(x.dsBan, x.chiTieu, cfg);
    them(id, { ma: "vuot_chi_tieu", nhan: "Thưởng vượt chỉ tiêu cá nhân", ds: Math.max(0, x.dsBan - x.chiTieu), tl: cfg.tv.vuot_chi_tieu, tien: t, ghiChu: `Chỉ tiêu ${x.chiTieu.toLocaleString("vi-VN")}đ` });
  }

  // PL05 B: telesale
  const telesale = [...nv.values()].filter((x) => x.nhom_hh === "telesale").map((x) => ({ id: x.id, ten: x.ho_ten }));
  let nguoiDatChuaKhop: [string, number][] = [];
  {
    const theoHd = new Map<string, { hoaDonId: string; khachId: string | null; ngay: string; tien: number }>();
    for (const r of dongKq.data ?? []) { const h = theoHd.get(r.hoa_don_id) ?? { hoaDonId: r.hoa_don_id, khachId: r.khach_id, ngay: r.ngay_hd, tien: 0 }; h.tien += n(r.tt); theoHd.set(r.hoa_don_id, h); }
    const { data: lh } = await db.from("lich_hen").select("khach_id, bat_dau, nguoi_tao_ten").gte("bat_dau", `${congNgay(tu, -cfg.telesale.so_ngay)}T00:00:00+07:00`).lte("bat_dau", `${toi}T23:59:59+07:00`).not("nguoi_tao_ten", "is", null).not("khach_id", "is", null).limit(20000);
    const r = doanhSoTelesale([...theoHd.values()], (lh ?? []).map((l) => ({ khachId: l.khach_id as string, ngay: ngayVn(l.bat_dau), nguoiTao: l.nguoi_tao_ten as string })), telesale, cfg.telesale.so_ngay);
    nguoiDatChuaKhop = r.nguoiDatChuaKhop;
    for (const t of telesale) {
      const so = soCuaNv(t.id), tl = tiLeThang(so.ds, cfg.telesale.bac), ds = r.theoNv.get(t.id)?.ds ?? 0;
      them(t.id, { ma: "telesale", nhan: "Doanh số telesale mang về", ds, tl, tien: ds * tl, ghiChu: `${r.theoNv.get(t.id)?.soHd ?? 0} hoá đơn trong ${cfg.telesale.so_ngay} ngày kể từ lịch hẹn` });
    }
  }

  // PL05 C: khối gián tiếp; PL06: Giám đốc chi nhánh, Trưởng phòng Marketing
  for (const x of nv.values()) {
    if (!x.hoat_dong) continue;
    const so = soCuaNv(x.id);
    if (x.nhom_hh === "gian_tiep_nv" || x.nhom_hh === "gian_tiep_ql") {
      const dk = tnv.get(x.id)?.dat_dieu_kien ?? true, muc = thuongGianTiep(so.ds, x.nhom_hh === "gian_tiep_ql" ? "ql" : "nv", cfg);
      them(x.id, { ma: "gian_tiep", nhan: "Thưởng khối gián tiếp theo mốc doanh số", ds: so.ds, tien: dk ? muc : 0, ghiChu: dk ? undefined : "Chưa đạt điều kiện (đủ công, KPI, kỷ luật)" });
    } else if (x.nhom_hh === "gd_chi_nhanh") {
      const r = hoaHongGiamDoc(so.ds, so.dsGiaSan, cfg);
      them(x.id, { ma: "gd_chi_nhanh", nhan: "Hoa hồng Giám đốc chi nhánh", ds: r.dsTinh, tien: r.hh, ghiChu: `Doanh số ${Math.round(so.ds).toLocaleString("vi-VN")}đ − ${cfg.gd.tru_gia_san * 100}% bán giá sàn ${Math.round(so.dsGiaSan).toLocaleString("vi-VN")}đ` });
    } else if (x.nhom_hh === "tp_marketing") {
      const r = hoaHongMarketing(so.ds, so.dsMkt, so.chiPhiQc, cfg);
      them(x.id, { ma: "tp_marketing", nhan: "Hoa hồng Trưởng phòng Marketing", ds: so.dsMkt, tl: r.tl, tien: r.hh, ghiChu: r.vuotQc ? `Chi phí quảng cáo ${Math.round(so.chiPhiQc).toLocaleString("vi-VN")}đ vượt ${cfg.mkt.tran_qc * 100}% doanh số: không hưởng` : undefined });
    }
  }

  // Phí trị liệu
  const donGia: DongDonGia[] = (dgKq.data ?? []).map((x) => ({ id: x.id, doiTuong: x.doi_tuong as "bac_si" | "tri_lieu", stt: x.stt, ten: x.ten, dvt: x.dvt, donGia: n(x.don_gia), dvIds: new Set(x.dich_vu_ids), tenGhep: new Set(x.ten_ghep) }));
  const caDs: CaDichVu[] = (caKq.data ?? []).map((r) => ({ dongId: r.dong_id, ngay: r.ngay_hd, maHd: r.ma_hd, khach: r.khach, dvId: r.dich_vu_id, ten: r.ten, soLuong: n(r.so_luong) || 1, nguoi: ((r.nguoi as { nv: string; tl: number }[] | null) ?? []).map((p) => ({ nv: p.nv, tl: n(p.tl) })), loaiTru: r.loai_tru }));
  const caChuaNguoiLam = caDs.filter((c) => !c.nguoi.length && !c.loaiTru).length;
  const phi = tinhPhiTriLieu(caDs.filter((c) => c.nguoi.length || c.loaiTru), donGia, nhomNv, cfg);
  const tongBs = phi.dong.filter((d) => d.doiTuong === "bac_si").reduce((s, d) => s + d.tien, 0), tongTlv = phi.dong.filter((d) => d.doiTuong === "tri_lieu").reduce((s, d) => s + d.tien, 0);
  const bs = { tong: tongBs, ...heSoTran(tongBs, tong.dsDv, cfg.phi_tl.tran_bs) }, tlv = { tong: tongTlv, ...heSoTran(tongTlv, tong.dsDv, cfg.phi_tl.tran_tlv) };
  const phiNv = new Map<string, { tien: number; soCa: number; doiTuong: "bac_si" | "tri_lieu" }>();
  for (const d of phi.dong) { const x = phiNv.get(d.nv) ?? { tien: 0, soCa: 0, doiTuong: d.doiTuong }; x.tien += d.tien; x.soCa += 1; phiNv.set(d.nv, x); }
  for (const [id, x] of phiNv) {
    const hs = x.doiTuong === "bac_si" ? bs.heSo : tlv.heSo;
    them(id, { ma: "phi_tl", nhan: x.doiTuong === "bac_si" ? "Phí trị liệu bác sĩ (PL01)" : "Phí trị liệu trị liệu viên (PL02)", ds: x.tien, tl: hs, tien: x.tien * hs, ghiChu: `${x.soCa} ca${hs < 1 ? ` · vượt trần, nhân hệ số ${hs.toFixed(4)}` : ""}` });
  }
  const chuaDonGia = new Map<string, { ten: string; doiTuong: "bac_si" | "tri_lieu"; soCa: number; dvId: string | null }>();
  for (const c of phi.chuaDonGia) { const k = `${c.doiTuong}|${khoaTen(c.ca.ten)}`; const x = chuaDonGia.get(k) ?? { ten: c.ca.ten.trim(), doiTuong: c.doiTuong, soCa: 0, dvId: c.ca.dvId }; x.soCa += 1; chuaDonGia.set(k, x); }

  const chuaGia = dong.filter((d) => phanLoaiDong(d, g).khoan === "dv_chua_gia");
  const chot = (chotKq.data ?? []).length ? { luc: (chotKq.data ?? []).map((x) => x.chot_luc).sort().at(-1) as string, soNguoi: new Set((chotKq.data ?? []).map((x) => x.nhan_vien_id)).size, tong: (chotKq.data ?? []).reduce((s, x) => s + n(x.so_tien), 0) } : null;

  return {
    nam, thang, tu, den: toi, tamTinh: toi < cuoi, cauHinh: cfg, tenCs: cs.data?.ten ?? "Mặc định",
    cn, tong,
    nhanVien: [...ketQua.values()].sort((a, b) => b.tong - a.tong),
    khongThuocDien: khongThuocDien.sort((a, b) => b.ds - a.ds),
    phi: {
      bs, tlv, caChuaNguoiLam, caNguoiKhac: phi.nguoiKhac.length,
      ca: phi.dong.map((d) => ({ dongId: d.ca.dongId, ngay: d.ca.ngay, maHd: d.ca.maHd, khach: d.ca.khach ?? "Khách lẻ", ten: d.ca.ten, soDv: d.soDv, nv: d.nv, tenNv: tenNv(d.nv), doiTuong: d.doiTuong, laPhuBs: d.laPhuBs, dongGia: d.laPhuBs ? "Phụ bác sĩ" : d.dong?.ten ?? "", donGia: d.donGia, tien: d.tien })).sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : a.maHd < b.maHd ? 1 : a.maHd > b.maHd ? -1 : 0)),
      chuaDonGia: [...chuaDonGia.values()].sort((a, b) => b.soCa - a.soCa),
      loaiTru: phi.loaiTru.map((c) => ({ dongId: c.dongId, ngay: c.ngay, maHd: c.maHd, ten: c.ten, lyDo: c.loaiTru ?? "" })),
    },
    canhBao: { dongChuaGia: chuaGia.length, dsChuaGia: chuaGia.reduce((s, d) => s + d.tt, 0), nguoiDatChuaKhop },
    chot,
  };
}

/** Giữ 5 phút dùng chung cho mọi người xem (trang cá nhân của từng nhân viên chỉ lọc lại, không tính lại). Lưu / chốt thì gọi revalidateTag. */
const tinhNho = unstable_cache(tinh, ["cs-hh-thang-v1"], { revalidate: 300, tags: ["cs-hh-thang"] });

export async function layBangThang(nam: number, thang: number, homNay: string, moi = false) {
  return moi ? tinh(nam, thang, homNay) : tinhNho(nam, thang, homNay);
}

/** Tháng mặc định: tháng hiện tại; định dạng YYYY-MM. Trước 11/2026 không áp chính sách mới. */
export function chonThang(q: string | undefined, homNay: string) {
  const ok = q && /^\d{4}-(0[1-9]|1[0-2])$/.test(q) && q >= "2026-11" ? q : homNay.slice(0, 7) < "2026-11" ? "2026-11" : homNay.slice(0, 7);
  const [nam, thang] = ok.split("-").map(Number);
  return { nam, thang, khoa: ok };
}
