import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NgayChon } from "@/components/ui/NgayChon";
import { HangChiSo } from "@/components/ui/HangChiSo";

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const ti = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");

export default async function TrangBaoCaoMkt({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  const nd = await yeuCauQuyen("mkt.xem");
  const sp = await searchParams, hom = homNayHCM();
  const den = sp.den && NGAY.test(sp.den) ? sp.den : hom, tu = sp.tu && NGAY.test(sp.tu) ? sp.tu : congNgay(den, -29);
  const db = sb();
  const [{ data: kq }, { data: nguon }, { data: cp }, { data: cd }] = await Promise.all([
    db.rpc("bc_phieu_marketing", { p_tu: tu, p_den: den, p_cn: nd.chiNhanhId ?? undefined }), db.from("nguon_lead").select("id, ten").order("thu_tu"),
    db.from("chi_phi_qc_ngay").select("chi_phi, chien_dich_id").gte("ngay", tu).lte("ngay", den), db.from("chien_dich").select("id, nguon_id"),
  ]);
  const ten = new Map((nguon ?? []).map((n) => [n.id, n.ten])), nguonCua = new Map((cd ?? []).map((c) => [c.id, c.nguon_id]));
  const chiTheoNguon = new Map<string, number>();
  let chiChung = 0;
  for (const c of cp ?? []) { const n = nguonCua.get(c.chien_dich_id); if (n) chiTheoNguon.set(n, (chiTheoNguon.get(n) ?? 0) + Number(c.chi_phi)); else chiChung += Number(c.chi_phi); }
  const dong = (kq ?? []).filter((r) => r.so_lead > 0 || chiTheoNguon.has(r.nguon_id));
  const tong = (k: "so_lead" | "hop_le" | "da_lien_he" | "da_dat_lich" | "khach_den" | "co_hoa_don" | "thuc_thu") => (kq ?? []).reduce((a, r) => a + Number(r[k]), 0);
  const tongChi = [...chiTheoNguon.values()].reduce((a, b) => a + b, 0) + chiChung;
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Báo cáo marketing" phu="Phễu từ lead tới thực thu. Khách đến và doanh thu lấy từ lịch hẹn, hoá đơn và thanh toán, không phải số nhập tay.">
        <form className="flex flex-wrap items-end gap-2" action="/marketing/bao-cao">
          <label className="text-[12.5px] text-muc-3">Từ<NgayChon ten="tu" giaTriMacDinh={tu} tuNam={2024} denNam={2035} ariaLabel="Từ ngày" /></label>
          <label className="text-[12.5px] text-muc-3">Đến<NgayChon ten="den" giaTriMacDinh={den} tuNam={2024} denNam={2035} ariaLabel="Đến ngày" /></label>
          <button className="rounded bg-nhan px-3 py-1.5 text-[14px] text-white">Xem</button>
          <NutXuatExcel loai="marketing" ten="báo cáo marketing theo khoảng ngày đang chọn" tham={{ tu, den }} />
        </form>
      </TieuDeNoi>
      <HangChiSo muc={[
        { nhan: "Lead", so: soVN(tong("so_lead")), ghiChu: `${soVN(tong("hop_le"))} hợp lệ` },
        { nhan: "Đã liên hệ", so: soVN(tong("da_lien_he")), ghiChu: ti(tong("da_lien_he"), tong("hop_le")) },
        { nhan: "Khách đến", so: soVN(tong("khach_den")), ghiChu: ti(tong("khach_den"), tong("hop_le")) },
        { nhan: "Chi phí quảng cáo", so: tienVN(tongChi), ghiChu: tong("hop_le") > 0 ? `${tienVN(Math.round(tongChi / tong("hop_le")))} / lead hợp lệ` : "chưa có lead" },
        { nhan: "Thực thu từ lead", so: tienVN(tong("thuc_thu")), ghiChu: tongChi > 0 ? `${(tong("thuc_thu") / tongChi).toFixed(1)} lần chi phí` : "" },
      ]} />
      <div className="mt-6" />
      <Bang noi duLieu={dong} khoa={(r) => r.nguon_id} trong="Chưa có lead trong khoảng này."
        cot={[
          { nhan: "Nguồn", chinh: true, hienThi: (r) => ten.get(r.nguon_id) ?? "" }, { nhan: "Lead", phai: true, hienThi: (r) => soVN(r.so_lead) }, { nhan: "Hợp lệ", phai: true, hienThi: (r) => soVN(r.hop_le) },
          { nhan: "Đã liên hệ", phai: true, hienThi: (r) => <>{soVN(r.da_lien_he)} <span className="text-muc-3">({ti(r.da_lien_he, r.hop_le)})</span></> },
          { nhan: "Đặt lịch", phai: true, hienThi: (r) => <>{soVN(r.da_dat_lich)} <span className="text-muc-3">({ti(r.da_dat_lich, r.hop_le)})</span></> },
          { nhan: "Khách đến", phai: true, hienThi: (r) => <>{soVN(r.khach_den)} <span className="text-muc-3">({ti(r.khach_den, r.hop_le)})</span></> },
          { nhan: "Có hoá đơn", phai: true, hienThi: (r) => soVN(r.co_hoa_don) },
          { nhan: "Chi phí QC", phai: true, hienThi: (r) => (chiTheoNguon.has(r.nguon_id) ? tienVN(chiTheoNguon.get(r.nguon_id)) : "") },
          { nhan: "Giá / lead", phai: true, hienThi: (r) => (chiTheoNguon.has(r.nguon_id) && r.hop_le > 0 ? tienVN(Math.round(chiTheoNguon.get(r.nguon_id)! / r.hop_le)) : "") },
          { nhan: "Thực thu", phai: true, hienThi: (r) => tienVN(r.thuc_thu) },
        ]} />
      {chiChung > 0 && <p className="mt-3 text-[13px] text-muc-3">Có {tienVN(chiChung)} chi phí của chiến dịch chưa gắn nguồn lead nên chỉ tính vào tổng.</p>}
    </div>
  );
}
