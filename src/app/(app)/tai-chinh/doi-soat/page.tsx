import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NgayChon } from "@/components/ui/NgayChon";

const NGAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function TrangDoiSoat({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  const nd = await yeuCauQuyen("baocao.tien");
  const sp = await searchParams, hom = homNayHCM();
  const den = sp.den && NGAY.test(sp.den) ? sp.den : hom, tu = sp.tu && NGAY.test(sp.tu) ? sp.tu : congNgay(den, -29);
  const { data } = await sb().rpc("bc_doi_soat_san_pham", { p_tu: tu, p_den: den, p_cn: nd.chiNhanhId ?? undefined });
  const ds = data ?? [];
  const tong = (k: "sl_ban" | "doanh_thu" | "gia_von") => ds.reduce((a, r) => a + Number(r[k]), 0);
  const lech = ds.filter((r) => Number(r.chenh_lech) !== 0);
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính" }} tieuDe="Đối soát bán hàng" phu="Số sản phẩm bán trên hoá đơn so với số xuất kho theo hoá đơn, kèm giá vốn và doanh thu sau giảm giá. Hoá đơn huỷ được hoàn kho nên không tính vào số bán. Giá vốn tính theo giá nhập gần nhất của sản phẩm.">
        <form className="flex flex-wrap items-end gap-2" action="/tai-chinh/doi-soat">
          <label className="text-[12.5px] text-muc-3">Từ<NgayChon ten="tu" giaTriMacDinh={tu} tuNam={2024} denNam={2035} ariaLabel="Từ ngày" /></label>
          <label className="text-[12.5px] text-muc-3">Đến<NgayChon ten="den" giaTriMacDinh={den} tuNam={2024} denNam={2035} ariaLabel="Đến ngày" /></label>
          <button className="rounded bg-nhan px-3 py-1.5 text-[14px] text-white">Xem</button>
          <NutXuatExcel loai="doi-soat" ten="đối soát bán hàng theo khoảng ngày đang chọn" tham={{ tu, den }} />
        </form>
      </TieuDeNoi>
      <HangChiSo muc={[
        { nhan: "Số sản phẩm đã bán", so: soVN(tong("sl_ban")) }, { nhan: "Doanh thu sản phẩm", so: tienVN(tong("doanh_thu")) },
        { nhan: "Giá vốn ước tính", so: tienVN(tong("gia_von")), ghiChu: tong("doanh_thu") > 0 ? `Lãi gộp ${tienVN(tong("doanh_thu") - tong("gia_von"))}` : "" },
        { nhan: "Mặt hàng lệch kho", so: soVN(lech.length), ghiChu: lech.length ? "cần soát" : "khớp" },
      ]} />
      <div className="mt-6" />
      <Bang noi duLieu={ds} khoa={(r) => r.san_pham_id} trong="Không có sản phẩm nào được bán trong khoảng này."
        cot={[
          { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <div>{r.ten}<div className="text-[12.5px] text-muc-3">{r.ma}</div></div> },
          { nhan: "Bán", phai: true, hienThi: (r) => `${soVN(r.sl_ban)} ${r.don_vi}` }, { nhan: "Doanh thu", phai: true, hienThi: (r) => tienVN(r.doanh_thu) },
          { nhan: "Đã huỷ", phai: true, hienThi: (r) => (Number(r.sl_huy) ? soVN(r.sl_huy) : "") }, { nhan: "Xuất kho", phai: true, hienThi: (r) => soVN(r.sl_xuat_kho) },
          { nhan: "Giá vốn", phai: true, hienThi: (r) => tienVN(r.gia_von) },
          { nhan: "Chênh lệch", phai: true, hienThi: (r) => (Number(r.chenh_lech) === 0 ? <span className="text-muc-3">Khớp</span> : <span className="font-medium text-canh-bao">{Number(r.chenh_lech) > 0 ? "+" : ""}{soVN(r.chenh_lech)}</span>) },
        ]} />
    </div>
  );
}
