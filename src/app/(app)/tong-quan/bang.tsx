import { unstable_cache } from "next/cache";
import Link from "next/link";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN, soVN, tienGon, tienVN } from "@/lib/dinh-dang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { BieuDoTron } from "@/components/bieu-do/BieuDoTron";
import { CotNgang } from "@/components/bieu-do/CotNgang";
import { CotDung } from "@/components/bieu-do/CotDung";
import { DuongMien } from "@/components/bieu-do/DuongMien";
import { VongTienDo } from "@/components/bieu-do/VongTienDo";
import { NHAN_VAI_TRO, VAI_TRO } from "@/lib/quyen";
import { kyTruoc, soNgayGom, type KyDt } from "@/lib/ky-xep-hang";

/** Các bảng điều hành (mỗi tab một bảng, vẽ bằng SVG ở máy chủ). Số liệu gom ở DB; `cn` = chi nhánh của người xem (null = mọi chi nhánh). */
const cnArg = (cn: string | null) => (cn ?? undefined) as string;
const DAY = <T extends { nhan: string; gia_tri: number }>(dl: T[]) => dl.sort((a, b) => b.gia_tri - a.gia_tri);

type PhanBo = { nhom: string; nhan: string; so: number; tien: number };
/** Chỉ tính nhóm tab cần (0318): tab Thẻ/Kho không phải chờ quét v_khach_hang. */
const docPhanBo = async (cn: string | null, dsNhom: string[]) => {
  const { data, error } = await sb().rpc("bc_phan_bo_nhom", { p_cn: cnArg(cn), p_nhom: dsNhom });
  if (error) throw new Error(`bc_phan_bo_nhom: ${error.code} ${error.message}`); // lỗi thì không nhớ lại
  return (data ?? []) as PhanBo[];
};
// Nhóm số liệu khách chỉ là SỐ ĐẾM (không có tiền) nhưng phải quét v_khach_hang ~1,5s: nhớ 5 phút như Thống kê khách.
const NHOM_KHACH = ["hang", "trang_thai", "nguon", "khach_moi", "phu_trach"];
const docPhanBoKhach = unstable_cache((cn: string | null) => docPhanBo(cn, NHOM_KHACH), ["tq-phan-bo-khach"], { revalidate: 300 });
async function layPhanBo(cn: string | null, dsNhom: string[]) {
  const ds = dsNhom.every((n) => NHOM_KHACH.includes(n)) ? await docPhanBoKhach(cn) : await docPhanBo(cn, dsNhom);
  const nhom = (n: string) => ds.filter((r) => r.nhom === n);
  return { nhom, so: (n: string) => nhom(n).map((r) => ({ nhan: r.nhan, gia_tri: Number(r.so) })), tien: (n: string) => nhom(n).map((r) => ({ nhan: r.nhan, gia_tri: Number(r.tien) })) };
}
const doiNhan = <T extends { nhan: string; gia_tri: number }>(dl: T[], bang: Record<string, string>) => dl.map((d) => ({ ...d, nhan: bang[d.nhan] ?? d.nhan }));

const NHAN_TRANG_THAI_KHACH = { dang_lieu_trinh: "Đang liệu trình", het_lieu_trinh: "Hết liệu trình", da_den: "Đã đến", lead: "Khách tiềm năng", mat: "Lâu không đến" };
const NHAN_NGUON = { mkt: "Marketing", telesale: "Telesale", tu_van: "Tư vấn", khach_cu_gioi_thieu: "Khách cũ giới thiệu", khac: "Khác / chưa rõ" };
const NHAN_THE = { hoat_dong: "Đang dùng", sap_het: "Sắp hết", het_han: "Hết hạn", hoan_thanh: "Đã dùng hết", thu_hoi: "Thu hồi", khoa: "Khoá" };
const NHAN_PHIEU = { cho_cap: "Chờ kho cấp", da_cap: "Đã cấp", da_nhan: "Chuyên viên trị liệu đã nhận", da_lam: "Đã làm", da_doi_chieu: "Đã đối chiếu", huy: "Huỷ" };
const NHAN_LOAI_BAN = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Gói thẻ" };

const luoi = "grid gap-6 lg:grid-cols-2";
const ngayNganVN = (d: string) => d.slice(8) + "/" + d.slice(5, 7);

/** % thay đổi so với kỳ trước, gọn cho dòng ghi chú ô số ("▲ 12% so với kỳ trước (560,8 tr)"); kỳ trước nêu ở dòng "Kỳ đang xem" phía trên. */
function soSanh(nay: number, truoc: number, dd: (n: number) => string) {
  if (!truoc) return nay ? "kỳ trước chưa có" : "kỳ trước cũng 0";
  const p = Math.round(((nay - truoc) / Math.abs(truoc)) * 100);
  return `${p > 0 ? "▲" : p < 0 ? "▼" : "="} ${Math.abs(p)}% so với kỳ trước (${dd(truoc)})`;
}

/** Tab Doanh thu: MỌI ô / biểu đồ đi theo kỳ đang chọn (chị Lâm 11/11/2026). Số lấy từ đúng các hàm báo cáo mà Tổng quan và Báo cáo › Doanh thu
 *  dùng (bc_doanh_thu_ngay, bc_doanh_thu_ngay_vi, bc_muc_ban, bc_nhan_vien — vốn nhận khoảng ngày, gồm hai đầu) nên cùng kỳ ra cùng số. */
export async function BangDoanhThu({ cn, ky, khoang, homNay }: { cn: string | null; ky: KyDt; khoang: { tu: string; den: string; nhan: string; catBot?: boolean }; homNay: string }) {
  const db = sb();
  const { tu, den, nhan } = khoang;
  const truoc = kyTruoc(ky, tu, den);
  const motNgay = tu === den;
  // Biểu đồ: kỳ một ngày thì vẽ 14 ngày đến ngày đó (một cột thì không xem được xu hướng) — cùng một lần gọi với các ô số.
  const tuBd = motNgay ? congNgay(den, -13) : tu;
  const [rNgay, rTruoc, rMuc, rNv, rVi] = await Promise.all([
    db.rpc("bc_doanh_thu_ngay", { p_tu: tuBd, p_den: den, p_cn: cnArg(cn) }),
    db.rpc("bc_doanh_thu_ngay", { p_tu: truoc.tu, p_den: truoc.den, p_cn: cnArg(cn) }),
    db.rpc("bc_muc_ban", { p_tu: tu, p_den: den, p_cn: cnArg(cn) }),
    db.rpc("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: cnArg(cn) }),
    db.rpc("bc_doanh_thu_ngay_vi", { p_tu: tu, p_den: den, p_cn: cnArg(cn) }),
  ]);
  for (const r of [rNgay, rTruoc, rMuc, rNv, rVi]) if (r.error) throw new Error(`Doanh thu: ${r.error.message}`);
  const ngayBd = rNgay.data ?? [];
  const ngayKy = ngayBd.filter((r) => r.ngay >= tu && r.ngay <= den);
  const mucBan = rMuc.data ?? [], nv = rNv.data ?? [], viKy = rVi.data ?? [];
  // Ví điện tử (Momo, VNPay, Shopee Pay, GrabPay, ví khác) và Ship COD — hình thức thu như SalonHero (0199).
  const tVi = viKy.reduce((s, r) => s + Number(r.momo) + Number(r.vnpay) + Number(r.shopee) + Number(r.grab) + Number(r.vi_khac), 0);
  const tCod = viKy.reduce((s, r) => s + Number(r.ship_cod), 0);
  type K = "doanh_thu" | "thuc_thu" | "so_don" | "so_buoi" | "no_moi" | "tien_mat" | "chuyen_khoan" | "quet_the" | "tru_the_tien" | "doanh_thu_buoi";
  const cong = (ds: typeof ngayBd, k: K) => ds.reduce((s, r) => s + Number(r[k]), 0);
  const t = (k: K) => cong(ngayKy, k), tt = (k: K) => cong(rTruoc.data ?? [], k);
  const ids = [...new Set(nv.map((r) => r.nhan_vien_id).filter((x): x is string => !!x))];
  const { data: ten } = ids.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", ids) : { data: [] };
  const tenNv = new Map((ten ?? []).map((x) => [x.id, x.ho_ten]));
  const theoNv = new Map<string, number>();
  for (const r of nv) theoNv.set(r.nhan_vien_id, (theoNv.get(r.nhan_vien_id) ?? 0) + Number(r.doanh_so));
  const theoLoai = new Map<string, number>();
  for (const r of mucBan) theoLoai.set(r.loai, (theoLoai.get(r.loai) ?? 0) + Number(r.doanh_so));
  const bc = (tab: string) => `/bao-cao?tab=${tab}&tu=${tu}&den=${den}`;
  const tr = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr` : tienVN(n));
  const khoangChu = tu === den ? ngayVN(tu) : `${ngayNganVN(tu)}–${ngayNganVN(den)}`;
  const nhanTruoc = truoc.tu === truoc.den ? ngayNganVN(truoc.tu) : `${ngayNganVN(truoc.tu)}–${ngayNganVN(truoc.den)}`;
  const kyChu = `(${nhan})`;
  // Biểu đồ: tới 92 ngày vẽ từng ngày; dài hơn (tùy chỉnh, tối đa 366 ngày) gom theo tháng cho dễ đọc.
  const theoThang = soNgayGom(tuBd, den) > 92;
  const diem = theoThang
    ? [...ngayBd.reduce((m, r) => { const k = r.ngay.slice(0, 7), c = m.get(k) ?? { tu: r.ngay, den: r.ngay, dt: 0, tt: 0 }; c.den = r.ngay; c.dt += Number(r.doanh_thu); c.tt += Number(r.thuc_thu); return m.set(k, c); }, new Map<string, { tu: string; den: string; dt: number; tt: number }>())]
        .map(([k, c]) => ({ nhan: `${k.slice(5)}/${k.slice(0, 4)}`, tu: c.tu, den: c.den, dt: c.dt, tt: c.tt }))
    : ngayBd.map((r) => ({ nhan: ngayNganVN(r.ngay), tu: r.ngay, den: r.ngay, dt: Number(r.doanh_thu), tt: Number(r.thuc_thu) }));
  const tieuDeBd = motNgay ? `Doanh thu 14 ngày đến ${ngayNganVN(den)}` : `Doanh thu ${theoThang ? "theo tháng" : "theo ngày"} ${khoangChu}`;
  return (
    <div className="space-y-6">
      {khoang.catBot && <p role="status" className="text-[12px] text-muc-3">Khoảng tùy chỉnh dài quá 366 ngày nên chỉ tính 366 ngày cuối ({ngayVN(tu)} – {ngayVN(den)}).</p>}
      <p className="text-[13px] text-muc-3">Kỳ đang xem: <span className="font-medium text-muc">{khoangChu}</span>{den === homNay && !motNgay ? " (đến hôm nay)" : ""} · so với {nhanTruoc}</p>
      <HangChiSo muc={[
        { nhan: `Doanh thu ${nhan}`, so: tienVN(t("doanh_thu")), ghiChu: `${soVN(t("so_don"))} đơn · ${soSanh(t("doanh_thu"), tt("doanh_thu"), tr)}` },
        { nhan: `Thực thu ${nhan}`, so: tienVN(t("thuc_thu")), ghiChu: soSanh(t("thuc_thu"), tt("thuc_thu"), tr) },
        { nhan: `Công nợ mới ${nhan}`, so: tienVN(t("no_moi")), ghiChu: soSanh(t("no_moi"), tt("no_moi"), tr) },
        { nhan: `Buổi đã làm ${nhan}`, so: soVN(t("so_buoi")), ghiChu: `doanh thu buổi ${tienVN(t("doanh_thu_buoi"))} · kỳ trước ${soVN(tt("so_buoi"))}` },
      ]} />
      <MucTrang noi tieuDe={tieuDeBd} phai={<Link href={bc("doanh-thu")} className="font-medium text-nhan-dam hover:underline">Báo cáo chi tiết</Link>}>
        <DuongMien ten={tieuDeBd} nhan={diem.map((d) => d.nhan)} lienKet={diem.map((d) => `/hoa-don?tu=${d.tu}&den=${d.den}&tt=hoan_thanh`)} dinhDang={tienVN} dinhDangTruc={tienGon}
          chuoi={[{ ten: "Doanh thu", gia_tri: diem.map((d) => d.dt), mau: "var(--sac-luc-mau)" }, { ten: "Thực thu", gia_tri: diem.map((d) => d.tt), mau: "var(--dat)" }]} />
      </MucTrang>
      <div className={luoi}>
        <MucTrang noi tieuDe={`Thực thu theo hình thức ${kyChu}`}><BieuDoTron ten="Thực thu theo hình thức" kieu="vong" nhanTam="đồng" dinhDang={tienVN} dinhDangGon={tr} dinhDangTam={tienGon} duLieu={[{ nhan: "Tiền mặt", gia_tri: t("tien_mat"), href: bc("thu-ngan") }, { nhan: "Chuyển khoản", gia_tri: t("chuyen_khoan"), href: bc("thu-ngan") }, { nhan: "Quẹt thẻ", gia_tri: t("quet_the"), href: bc("thu-ngan") }, ...(tVi ? [{ nhan: "Ví điện tử", gia_tri: tVi }] : []), ...(tCod ? [{ nhan: "Ship COD", gia_tri: tCod }] : []), { nhan: "Trừ thẻ tiền", gia_tri: t("tru_the_tien"), href: bc("thu-ngan") }]} /></MucTrang>
        <MucTrang noi tieuDe={`Cơ cấu doanh số ${kyChu}`}>
          <BieuDoTron ten="Cơ cấu doanh số" kieu="banh" dinhDang={tienVN} dinhDangGon={tr} duLieu={[...theoLoai].filter(([, v]) => v !== 0).map(([k, v]) => ({ nhan: NHAN_LOAI_BAN[k as keyof typeof NHAN_LOAI_BAN] ?? k, gia_tri: v, href: bc("dich-vu") }))} />
          {t("tru_the_tien") > 0 && <p className="mt-2 text-[12px] text-muc-3">Doanh số tính cả phần khách trả bằng thẻ tiền ({tr(t("tru_the_tien"))}); ô Doanh thu đã trừ phần này.</p>}
        </MucTrang>
        <MucTrang noi tieuDe={`Top dịch vụ / sản phẩm bán chạy ${kyChu}`}><CotNgang dinhDang={tr} duLieu={mucBan.slice(0, 8).map((r) => ({ nhan: r.ten, gia_tri: Number(r.doanh_so), href: bc("dich-vu") }))} trong="Kỳ này chưa có đơn nào." /></MucTrang>
        <MucTrang noi tieuDe={`Doanh số theo nhân viên ${kyChu}`}><CotNgang mau="var(--sac-xanh-mau)" dinhDang={tr} duLieu={DAY([...theoNv].map(([id, v]) => ({ nhan: tenNv.get(id) ?? "Không rõ", gia_tri: v, href: bc("nhan-vien") }))).slice(0, 8)} trong="Kỳ này chưa có doanh số theo nhân viên." /></MucTrang>
      </div>
    </div>
  );
}

export async function BangKhach({ cn }: { cn: string | null }) {
  const [pb, { data: dsNv }] = await Promise.all([layPhanBo(cn, NHOM_KHACH), sb().from("nhan_vien").select("id, ho_ten")]);
  // Bấm vào cột/miếng biểu đồ là mở danh sách khách đã lọc đúng nhóm đó (chị Lâm 10/11: "bấm vào có chi tiết là ai").
  const lk = (k: string, v: string | null | undefined) => (v ? `/khach-hang?${k}=${encodeURIComponent(v)}` : undefined);
  const demTen = new Map<string, number>();
  for (const n of dsNv ?? []) demTen.set(n.ho_ten, (demTen.get(n.ho_ten) ?? 0) + 1);
  const idTheoTen = new Map((dsNv ?? []).filter((n) => demTen.get(n.ho_ten) === 1).map((n) => [n.ho_ten, n.id as string]));
  const ganLk = (dl: { nhan: string; gia_tri: number }[], k: string, bo: string[] = []) => dl.map((d) => ({ ...d, href: bo.includes(d.nhan) ? undefined : lk(k, d.nhan) }));
  const tong = pb.so("trang_thai").reduce((s, d) => s + d.gia_tri, 0);
  const g = (k: string) => pb.so("trang_thai").find((d) => d.nhan === k)?.gia_tri ?? 0;
  const homNay = homNayHCM();
  const thangNay = homNay.slice(0, 7);
  const moi = pb.so("khach_moi").find((d) => d.nhan === thangNay)?.gia_tri ?? 0;
  const cuoiThang = (ym: string) => { const d = new Date(`${ym}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
  const thang = pb.so("khach_moi").sort((a, b) => a.nhan.localeCompare(b.nhan)).map((d) => ({ nhan: `T${Number(d.nhan.slice(5))}`, gia_tri: d.gia_tri, href: `/khach-hang?tao_tu=${d.nhan}-01&tao_den=${cuoiThang(d.nhan)}&sx=moi` }));
  return (
    <div className="space-y-6">
      <HangChiSo muc={[
        { nhan: "Tổng số khách", so: soVN(tong) }, { nhan: "Đang liệu trình", so: soVN(g("dang_lieu_trinh")), ghiChu: `${tong ? ((g("dang_lieu_trinh") / tong) * 100).toFixed(1) : 0}% tổng khách` },
        { nhan: "Lâu không đến", so: soVN(g("mat")), ghiChu: "cần chăm sóc lại" }, { nhan: "Khách mới tháng này", so: soVN(moi) },
      ]} />
      <div className={luoi}>
        <MucTrang noi tieuDe="Khách theo hạng"><BieuDoTron ten="Khách theo hạng" kieu="vong" nhanTam="khách" duLieu={DAY(ganLk(pb.so("hang"), "hang", ["Chưa xếp"]))} /></MucTrang>
        <MucTrang noi tieuDe="Khách theo trạng thái"><BieuDoTron ten="Khách theo trạng thái" kieu="banh" duLieu={DAY(doiNhan(ganLk(pb.so("trang_thai"), "trang_thai"), NHAN_TRANG_THAI_KHACH))} /></MucTrang>
        <MucTrang noi tieuDe="Khách theo nguồn"><BieuDoTron ten="Khách theo nguồn" kieu="vong" nhanTam="khách" duLieu={DAY(doiNhan(ganLk(pb.so("nguon"), "nguon"), NHAN_NGUON))} /></MucTrang>
        <MucTrang noi tieuDe="Khách mới 6 tháng gần nhất"><CotDung ten="Khách mới theo tháng" duLieu={thang} /></MucTrang>
        <MucTrang noi tieuDe="Khách theo người phụ trách"><CotNgang mau="var(--dat)" duLieu={DAY(pb.so("phu_trach").map((d) => ({ ...d, href: lk("phu_trach", idTheoTen.get(d.nhan)) })))} /></MucTrang>
      </div>
    </div>
  );
}

export async function BangTheNo({ cn, xemTien }: { cn: string | null; xemTien: boolean }) {
  const db = sb();
  const [pb, { data: du }, { data: no }] = await Promise.all([
    layPhanBo(cn, ["no_tuoi", "the_lan", "the_tien"]),
    db.rpc("bc_the_con_du", { p_cn: cnArg(cn) }),
    xemTien ? (() => { let q = db.from("hoa_don").select("id, ma, khach_id, con_no, ngay_hd").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("con_no", { ascending: false }).limit(8); if (cn) q = q.eq("chi_nhanh_id", cn); return q; })() : Promise.resolve({ data: [] }),
  ]);
  const d = du?.[0];
  const idsK = [...new Set((no ?? []).map((r) => r.khach_id).filter((x): x is string => !!x))];
  const { data: ks } = idsK.length ? await db.from("khach_hang").select("id, ho_ten").in("id", idsK) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));
  const tongNo = pb.tien("no_tuoi").reduce((s, x) => s + x.gia_tri, 0), soHd = pb.so("no_tuoi").reduce((s, x) => s + x.gia_tri, 0);
  const dangDung = pb.so("the_lan").find((x) => x.nhan === "hoat_dong")?.gia_tri ?? 0, tongLan = pb.so("the_lan").reduce((s, x) => s + x.gia_tri, 0);
  const tuoiThu: Record<string, number> = { "0-30 ngày": 0, "31-90 ngày": 1, "Trên 90 ngày": 2 };
  const tuoi = pb.tien("no_tuoi").sort((a, b) => tuoiThu[a.nhan] - tuoiThu[b.nhan]);
  return (
    <div className="space-y-6">
      <HangChiSo muc={[
        { nhan: "Thẻ liệu trình đang dùng", so: soVN(dangDung), ghiChu: `trên ${soVN(tongLan)} thẻ đã cấp` },
        { nhan: "Buổi còn lại (thẻ có giới hạn)", so: soVN(d?.so_buoi), ghiChu: `${soVN(d?.so_the_lan)} thẻ · ${soVN(d?.so_the_khong_gioi_han)} thẻ không giới hạn` },
        ...(xemTien ? [{ nhan: "Giá trị buổi chưa dùng", so: tienVN(d?.gia_tri_buoi) }, { nhan: "Số dư thẻ tiền", so: tienVN(d?.du_tien), ghiChu: `${soVN(d?.so_the_tien)} thẻ` }] : []),
      ]} />
      <div className={luoi}>
        <MucTrang noi tieuDe="Thẻ liệu trình theo tình trạng"><BieuDoTron ten="Thẻ liệu trình theo tình trạng" kieu="vong" nhanTam="thẻ" duLieu={DAY(doiNhan(pb.so("the_lan"), NHAN_THE))} /></MucTrang>
        <MucTrang noi tieuDe="Thẻ tiền theo tình trạng"><BieuDoTron ten="Thẻ tiền theo tình trạng" kieu="banh" duLieu={DAY(doiNhan(pb.so("the_tien"), NHAN_THE))} /></MucTrang>
        {xemTien && (
          <>
            <MucTrang noi tieuDe="Công nợ theo tuổi nợ" phai={<Link href="/bao-cao?tab=no" className="font-medium text-nhan-dam hover:underline">Xem chi tiết</Link>}>
              <div className="mb-4 flex items-end justify-between gap-4"><div><div className="text-[26px] font-medium leading-none tabular-nums">{tienVN(tongNo)}</div><div className="mt-1.5 text-[13px] text-muc-3">{soVN(soHd)} hoá đơn còn nợ</div></div>
                <VongTienDo tyLe={tongNo ? ((tuoi.find((x) => x.nhan === "Trên 90 ngày")?.gia_tri ?? 0) / tongNo) * 100 : 0} nhan="nợ quá 90 ngày" so="" /></div>
              <CotNgang mau="var(--sac-hong-mau)" dinhDang={(n) => `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`} duLieu={tuoi} />
            </MucTrang>
            <MucTrang noi tieuDe="Khách nợ nhiều nhất">
              {(no ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Không có công nợ.</p> : (
                <ul className="divide-y divide-vien">{(no ?? []).map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-[14px]"><Link href={r.khach_id ? `/khach-hang/${r.khach_id}` : "/hoa-don"} className="min-w-0 truncate hover:text-nhan-dam">{tenK.get(r.khach_id ?? "") ?? "Khách"} <span className="text-muc-3">· {ngayVN(r.ngay_hd)}</span></Link><span className="shrink-0 tabular-nums text-muc">{tienVN(r.con_no)}</span></li>)}</ul>
              )}
            </MucTrang>
          </>
        )}
      </div>
    </div>
  );
}

export async function BangKho({ cn }: { cn: string | null }) {
  const db = sb();
  let q = db.from("v_ton_kho").select("san_pham_id, ma, ten, ton, ton_toi_thieu, don_vi, duoi_muc_toi_thieu");
  if (cn) q = q.eq("chi_nhanh_id", cn);
  const [pb, { data }] = await Promise.all([layPhanBo(cn, ["phieu"]), q]);
  const ds = data ?? [];
  const thieu = ds.filter((r) => r.duoi_muc_toi_thieu);
  return (
    <div className="space-y-6">
      <HangChiSo muc={[{ nhan: "Mặt hàng đang theo dõi", so: soVN(ds.length) }, { nhan: "Dưới mức tồn tối thiểu", so: soVN(thieu.length), ghiChu: thieu.length ? "cần nhập thêm" : "kho đủ" }, { nhan: "Phiếu cấp đang chờ", so: soVN(pb.so("phieu").filter((p) => p.nhan === "cho_cap" || p.nhan === "da_cap").reduce((s, p) => s + p.gia_tri, 0)) }]} />
      <div className={luoi}>
        <MucTrang noi tieuDe="Tình trạng tồn kho"><BieuDoTron ten="Tình trạng tồn kho" kieu="vong" nhanTam="mặt hàng" duLieu={[{ nhan: "Đủ hàng", gia_tri: ds.length - thieu.length }, { nhan: "Dưới mức tối thiểu", gia_tri: thieu.length }]} /></MucTrang>
        <MucTrang noi tieuDe="Phiếu cấp vật tư theo trạng thái"><BieuDoTron ten="Phiếu cấp theo trạng thái" kieu="banh" duLieu={DAY(doiNhan(pb.so("phieu"), NHAN_PHIEU))} /></MucTrang>
        <MucTrang noi tieuDe="Mặt hàng cần nhập" phai={<Link href="/kho?thieu=1" className="font-medium text-nhan-dam hover:underline">Mở kho</Link>}>
          {thieu.length === 0 ? <p className="text-[14px] text-muc-3">Không có mặt hàng nào dưới mức tối thiểu.</p> : <CotNgang mau="var(--sac-hong-mau)" duLieu={thieu.slice(0, 8).map((r) => ({ nhan: `${r.ten}`, gia_tri: Number(r.ton) }))} dinhDang={(n) => soVN(n)} />}
        </MucTrang>
      </div>
    </div>
  );
}

export async function BangHeThong() {
  const { data: nv } = await sb().from("nhan_vien").select("vai_tro, user_id, hoat_dong, phai_doi_mat_khau, quyen_rieng");
  const ds = nv ?? [];
  const coTk = ds.filter((n) => n.user_id);
  const daDoi = coTk.filter((n) => !n.phai_doi_mat_khau).length;
  return (
    <div className="space-y-6">
      <div className={luoi}>
        <MucTrang noi tieuDe="Hồ sơ nhân viên theo vai trò"><BieuDoTron ten="Hồ sơ theo vai trò" kieu="vong" nhanTam="hồ sơ" duLieu={VAI_TRO.map((v) => ({ nhan: NHAN_VAI_TRO[v], gia_tri: ds.filter((n) => n.vai_tro === v).length })).filter((x) => x.gia_tri > 0).sort((a, b) => b.gia_tri - a.gia_tri)} /></MucTrang>
        <MucTrang noi tieuDe="An toàn tài khoản">
          <div className="space-y-5">
            <VongTienDo tyLe={coTk.length ? (daDoi / coTk.length) * 100 : 0} nhan="tài khoản đã đổi mật khẩu mặc định" so={`${daDoi}/${coTk.length}`} />
            <VongTienDo tyLe={ds.length ? (coTk.length / ds.length) * 100 : 0} nhan="hồ sơ đã có tài khoản đăng nhập" so={`${coTk.length}/${ds.length}`} />
          </div>
        </MucTrang>
      </div>
    </div>
  );
}
