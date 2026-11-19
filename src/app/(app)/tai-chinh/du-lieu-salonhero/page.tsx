import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NgayChon } from "@/components/ui/NgayChon";

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
type Dong = { ngay: string; cn: string; shHd: number; shTien: number; shThu: number; shNo: number; appHd: number; appTien: number; quyThu: number; quyChi: number; quyDong: number };

/** Đọc hết các trang (PostgREST giới hạn 1000 dòng/lần). */
async function docHet<T>(lay: (a: number, b: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const ra: T[] = [];
  for (let i = 0; i < 40; i++) { const { data } = await lay(i * 1000, i * 1000 + 999); ra.push(...(data ?? [])); if ((data?.length ?? 0) < 1000) break; }
  return ra;
}

/** /tai-chinh/du-lieu-salonhero — dữ liệu tài chính cũ của SalonHero (hoá đơn + sổ quỹ) theo ngày, để Kế toán / Quản lý đối chiếu với AMIA OS. */
export default async function TrangDuLieuSalonHero({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  await yeuCauQuyen("hd.ke_toan");
  const sp = await searchParams, hom = homNayHCM(), db = sb();
  const den = sp.den && NGAY.test(sp.den) ? sp.den : hom;
  let tu = sp.tu && NGAY.test(sp.tu) ? sp.tu : congNgay(den, -30);
  if (tu < congNgay(den, -92)) tu = congNgay(den, -92);

  const { data: dsCn } = await db.from("chi_nhanh").select("id, ten");
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  const [hd, quy, cuoi] = await Promise.all([
    docHet<{ ngay_hd: string; chi_nhanh_id: string | null; la_lich_su: boolean; tong_phai_thu: number; da_thu: number; con_no: number }>((a, b) =>
      db.from("hoa_don").select("ngay_hd, chi_nhanh_id, la_lich_su, tong_phai_thu, da_thu, con_no").eq("trang_thai", "hoan_thanh").eq("la_so_du_dau", false).gte("ngay_hd", tu).lte("ngay_hd", den).order("id").range(a, b)),
    docHet<{ ngay: string | null; chi_nhanh_id: string | null; loai: string | null; so_tien: number | null; nguon: string | null; sh_id: number | null; da_dao: boolean | null }>((a, b) =>
      db.from("v_so_quy").select("ngay, chi_nhanh_id, loai, so_tien, nguon, sh_id, da_dao").not("sh_id", "is", null).gte("ngay", tu).lte("ngay", den).order("id").range(a, b)),
    db.from("hoa_don").select("ngay_hd").eq("la_lich_su", true).not("sh_id", "is", null).eq("trang_thai", "hoan_thanh").order("ngay_hd", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const m = new Map<string, Dong>();
  const dong = (n: string, c: string | null) => { const k = `${n}|${c ?? ""}`; let d = m.get(k); if (!d) { d = { ngay: n, cn: tenCn.get(c ?? "") ?? "—", shHd: 0, shTien: 0, shThu: 0, shNo: 0, appHd: 0, appTien: 0, quyThu: 0, quyChi: 0, quyDong: 0 }; m.set(k, d); } return d; };
  for (const r of hd) {
    const d = dong(r.ngay_hd.slice(0, 10), r.chi_nhanh_id);
    if (r.la_lich_su) { d.shHd++; d.shTien += Number(r.tong_phai_thu); d.shThu += Number(r.da_thu); d.shNo += Number(r.con_no); }
    else { d.appHd++; d.appTien += Number(r.tong_phai_thu); }
  }
  for (const r of quy) {
    if (r.da_dao) continue;
    const d = dong(String(r.ngay ?? "").slice(0, 10), r.chi_nhanh_id); d.quyDong++;
    if (r.loai === "nap") d.quyThu += Number(r.so_tien ?? 0); else d.quyChi += Number(r.so_tien ?? 0);
  }
  const ds = [...m.values()].sort((a, b) => (a.ngay === b.ngay ? a.cn.localeCompare(b.cn) : a.ngay < b.ngay ? 1 : -1));
  const t = (k: keyof Dong) => ds.reduce((a, r) => a + Number(r[k]), 0);
  const ngayCuoi = cuoi.data?.ngay_hd?.slice(0, 10) ?? null;

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính" }} tieuDe="Dữ liệu tài chính SalonHero (cũ)"
        phu={<>Hoá đơn và sổ quỹ đã chuyển từ SalonHero, gom theo ngày, đặt cạnh số đang ghi trên AMIA OS để Kế toán và Quản lý đối chiếu. Chỉ xem, không sửa. Dữ liệu SalonHero hiện có tới ngày <b>{ngayCuoi ? ngayVN(ngayCuoi) : "—"}</b>; các ngày sau đó chỉ có số của AMIA OS.</>}>
        <form className="flex flex-wrap items-end gap-2" action="/tai-chinh/du-lieu-salonhero">
          <label className="text-[12.5px] text-muc-3">Từ<NgayChon ten="tu" giaTriMacDinh={tu} tuNam={2018} denNam={2035} ariaLabel="Từ ngày" /></label>
          <label className="text-[12.5px] text-muc-3">Đến<NgayChon ten="den" giaTriMacDinh={den} tuNam={2018} denNam={2035} ariaLabel="Đến ngày" /></label>
          <button className="rounded bg-nhan px-3 py-1.5 text-[14px] text-white">Xem</button>
        </form>
      </TieuDeNoi>
      <HangChiSo muc={[
        { nhan: "Hoá đơn SalonHero", so: soVN(t("shHd")), ghiChu: `Doanh thu ${tienVN(t("shTien"))}` },
        { nhan: "Đã thu / còn nợ (SalonHero)", so: tienVN(t("shThu")), ghiChu: `Còn nợ ${tienVN(t("shNo"))}` },
        { nhan: "Hoá đơn AMIA OS", so: soVN(t("appHd")), ghiChu: `Doanh thu ${tienVN(t("appTien"))}` },
        { nhan: "Phiếu quỹ SalonHero", so: soVN(t("quyDong")), ghiChu: `Thu ${tienVN(t("quyThu"))} · chi ${tienVN(t("quyChi"))}` },
      ]} />
      <p className="mt-2 text-[12.5px] text-muc-3">Tối đa 93 ngày mỗi lần xem. Muốn xem từng hoá đơn của một ngày: mở <a className="underline" href={`/hoa-don?tu=${tu}&den=${den}`}>Hoá đơn</a> rồi chọn đúng ngày (hoá đơn từ SalonHero có nhãn lịch sử).</p>
      <div className="mt-4" />
      <Bang noi duLieu={ds} khoa={(r) => `${r.ngay}|${r.cn}`} trong="Không có dữ liệu trong khoảng này."
        cot={[
          { nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) },
          { nhan: "Chi nhánh", hienThi: (r) => r.cn },
          { nhan: "HĐ SalonHero", phai: true, hienThi: (r) => (r.shHd ? soVN(r.shHd) : "") },
          { nhan: "Doanh thu SH", phai: true, hienThi: (r) => (r.shHd ? tienVN(r.shTien) : "") },
          { nhan: "Đã thu SH", phai: true, hienThi: (r) => (r.shHd ? tienVN(r.shThu) : "") },
          { nhan: "Còn nợ SH", phai: true, hienThi: (r) => (r.shNo ? tienVN(r.shNo) : "") },
          { nhan: "HĐ AMIA OS", phai: true, hienThi: (r) => (r.appHd ? soVN(r.appHd) : "") },
          { nhan: "Doanh thu AMIA OS", phai: true, hienThi: (r) => (r.appHd ? tienVN(r.appTien) : "") },
          { nhan: "Quỹ SH thu", phai: true, hienThi: (r) => (r.quyThu ? tienVN(r.quyThu) : "") },
          { nhan: "Quỹ SH chi", phai: true, hienThi: (r) => (r.quyChi ? tienVN(r.quyChi) : "") },
        ]} />
    </div>
  );
}
