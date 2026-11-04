import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { gioVN, ngayGioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { chiNhanhXem, demChamSoc, docChamSoc, docNguongCSKH, soTrongKhoang } from "@/lib/cham-soc-khach";
import { CHI_TIET_GOI, DONG_MOI_TRANG, HANG, MOC_SAU_DIEU_TRI, TRANG_THAI_GOI, laMaHang, nhanHang, nhanTrangThaiGoi, sdtHienThi, sdtTel, type MaHang } from "@/lib/cham-soc-hang-doi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { ghiKetQuaGoi, luuNguongSauDieuTri } from "./goi-actions";

const NHAN_LICH: Record<string, string> = { chua_xac_nhan: "Chưa xác nhận", da_xac_nhan: "Đã xác nhận" };

/** Biểu mẫu "Ghi kết quả": chi tiết đổi theo kết quả đã chọn; ngày gọi lại hoặc "không cần gọi lại". */
const TRUONG_GOI: Truong[] = [
  { ten: "trang_thai", nhan: "Kết quả", loai: "chon", batBuoc: true, rong: true, luaChon: TRANG_THAI_GOI.map((t) => ({ gia_tri: t.ma, nhan: t.nhan })) },
  ...TRANG_THAI_GOI.map((t): Truong => ({ ten: `ct_${t.ma}`, nhan: "Chi tiết", loai: "chon", rong: true, hienKhi: { ten: "trang_thai", la: [t.ma] }, luaChon: [{ gia_tri: "", nhan: "Không chọn" }, ...CHI_TIET_GOI[t.ma].map((c) => ({ gia_tri: c, nhan: c }))] })),
  { ten: "noi_dung", nhan: "Nội dung trao đổi", loai: "nhieu_dong", goiY: "Khách nói gì, đã tư vấn gì..." },
  { ten: "ngay_goi_lai", nhan: "Ngày gọi lại", loai: "ngay", ghiChu: "Để trống nếu không hẹn. Đúng ngày, khách tự hiện lại ở hàng Hẹn gọi lại." },
  { ten: "khong_can_goi_lai", nhan: "Không cần gọi lại", loai: "gat", hienKhi: { ten: "trang_thai", la: ["da_lien_lac", "khong_nghe_may", "tu_choi", "da_dat_lich"] } },
];

/** /khach-hang/cham-soc — Danh sách chăm sóc TỰ SINH cho CSKH: các hàng đợi gọi/nhắn tính từ lịch hẹn, hoá đơn, buổi thẻ, ngày sinh (không lưu thêm dữ liệu), kèm ghi kết quả gọi. Tự thiết kế, chưa đối chiếu SalonHero. */
export default async function ChamSocKhach({ searchParams }: { searchParams: Promise<{ loai?: string; cn?: string; n?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const sp = await searchParams;
  const ng = await docNguongCSKH();
  const { cn, ds: dsCn, khoa } = await chiNhanhXem(nd, sp.cn);
  const loai: MaHang = laMaHang(sp.loai) ? sp.loai : "nhac_lich";
  const sauDt = soTrongKhoang(sp.n, 0, 60, ng.sauDieuTriNgay)!;
  const trang = Math.max(1, Math.min(10_000, Number(sp.trang) || 1));
  const [dem, ds] = await Promise.all([demChamSoc(cn, sauDt), docChamSoc(loai, cn, sauDt, trang)]);
  const tong = ds[0]?.tong ?? dem[loai] ?? 0;
  const soTrang = Math.max(1, Math.ceil(tong / DONG_MOI_TRANG));
  const sua = coQuyen(nd, "khach.sua"), xemSdt = coQuyen(nd, "khach.sdt"), datLich = coQuyen(nd, "lich.sua");
  const tenCn = new Map(dsCn.map((c) => [c.id, c.ten]));
  const mota = HANG.find((h) => h.ma === loai)!.mota;
  const lk = (o: { loai?: string; trang?: number }) => {
    const q = new URLSearchParams();
    q.set("loai", o.loai ?? loai);
    if (cn && !khoa) q.set("cn", cn);
    if (sp.n !== undefined && (o.loai ?? loai) === "sau_dieu_tri") q.set("n", String(sauDt));
    if (o.trang && o.trang > 1) q.set("trang", String(o.trang));
    return `/khach-hang/cham-soc?${q.toString()}`;
  };

  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Chăm sóc khách hàng" icon={PhoneCall} quayLai={{ href: "/khach-hang", nhan: "Danh sách khách" }} quayLaiDienThoai phu={<>Danh sách gọi/nhắn tự tính từ lịch hẹn, hoá đơn và ngày sinh. Gọi xong bấm Ghi kết quả: khách đã xử lý hôm nay tự ẩn, khách hẹn gọi lại tự hiện lại đúng ngày.</>} />

      <nav aria-label="Loại chăm sóc" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {HANG.map((h) => (
          <Link key={h.ma} href={lk({ loai: h.ma })} scroll={false} aria-current={h.ma === loai ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-nho border px-3 text-[13px] font-medium ${h.ma === loai ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam text-muc-2 hover:border-nhan"}`}>
            {h.nhan}<span className="tabular-nums text-muc-3">{soVN(dem[h.ma] ?? 0)}</span>
          </Link>
        ))}
      </nav>

      <form method="get" className="the-noi the-noi-thap flex flex-wrap items-end gap-3 px-4 pb-3.5 pt-4 text-[13px]">
        <input type="hidden" name="loai" value={loai} />
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-52"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        {loai === "sau_dieu_tri" && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Sau điều trị</span>
            <div className="w-44"><Chon ten="n" ariaLabel="Số ngày sau điều trị" giaTriMacDinh={String(sauDt)} luaChon={[...new Set([...MOC_SAU_DIEU_TRI, sauDt])].sort((a, b) => a - b).map((n) => ({ gia_tri: String(n), nhan: `${n} ngày sau` }))} /></div></label>
        )}
        <button type="submit" className={NUT_PHU}>Lọc</button>
        {loai === "sau_dieu_tri" && coQuyen(nd, "danhmuc.sua") && (
          <NutHop kieu="phu" nhan="Đặt mặc định" tieuDe="Số ngày sau điều trị (mặc định)" moTa="Khách hoàn thành dịch vụ cách đây từng ấy ngày (và 2 ngày sau đó) sẽ vào danh sách. Áp cho mọi người."
            truong={[{ ten: "ngay", nhan: "Số ngày (0–60)", loai: "so", batBuoc: true }]} giaTri={{ ngay: ng.sauDieuTriNgay }} action={luuNguongSauDieuTri} />
        )}
      </form>

      <p className="text-[13px] text-muc-3">{mota}</p>
      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> khách ở hàng «{nhanHang(loai)}»{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}{loai === "sau_dieu_tri" ? ` · ${sauDt} ngày sau điều trị` : ""}</p>

      <Bang noi duLieu={ds} khoa={(r) => `${r.khach_id}-${r.loai}-${r.ngay_goc}`} trong="Hàng này đang trống: chưa có khách cần gọi."
        cot={[
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => <div><Link href={`/khach-hang/${r.khach_id}?tab=nhac-nho`} className="font-medium text-muc hover:underline">{r.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{sdtHienThi(r.dien_thoai, xemSdt)} · {r.ma}</div></div> },
          { nhan: "Lý do gọi", hienThi: (r) => <div className="text-[13px]">
              {r.hang === "hen_goi_lai" && <div className="mb-0.5"><NhanTrangThai kieu="cho">Hẹn gọi lại{r.hen_ngay ? ` ${ngayVN(r.hen_ngay)}` : ""}</NhanTrangThai></div>}
              <div className="font-medium text-muc-2">{r.hang === "hen_goi_lai" ? nhanHang(r.loai) : mocLyDo(r)}</div>
              <div className="tabular-nums text-muc-3">{r.gio ? `${gioVN(r.gio)} ${ngayVN(r.ngay_goc)}` : ngayVN(r.ngay_goc)}{r.lich_tt && NHAN_LICH[r.lich_tt] ? ` · ${NHAN_LICH[r.lich_tt]}` : ""}</div>
              {r.dich_vu && <div className="line-clamp-2 text-muc-3">{r.dich_vu}</div>}
            </div> },
          { nhan: "Chi nhánh", hienThi: (r) => <span className="text-[13px]">{tenCn.get(r.chi_nhanh_id ?? "") ?? ""}</span> },
          { nhan: "Lần gọi trước", hienThi: (r) => (r.goi_tt ? (
              <div className="text-[13px]">
                {nhanTrangThaiGoi(r.goi_tt) && <NhanTrangThai kieu={nhanTrangThaiGoi(r.goi_tt)!.kieu}>{nhanTrangThaiGoi(r.goi_tt)!.nhan}</NhanTrangThai>}
                <div className="mt-0.5 tabular-nums text-muc-3">{ngayGioVN(r.goi_luc)}{r.goi_nguoi ? ` · ${r.goi_nguoi}` : ""}{r.so_lan_goi > 1 ? ` · ${r.so_lan_goi} lần` : ""}</div>
                {(r.goi_chi_tiet || r.goi_noi_dung) && <div className="line-clamp-2 text-muc-3">{[r.goi_chi_tiet, r.goi_noi_dung].filter(Boolean).join(" — ")}</div>}
              </div>) : <span className="text-[13px] text-muc-3">Chưa gọi</span>) },
          { nhan: "", hienThi: (r) => (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {xemSdt && r.dien_thoai && <a href={`tel:${sdtTel(r.dien_thoai)}`} className="rounded-nho border border-vien-dam px-2.5 py-1 text-[13px] font-medium text-nhan-dam hover:border-nhan">Gọi</a>}
              {sua && <NutHop kieu="chu" nhan="Ghi kết quả" tieuDe={`Kết quả gọi: ${r.ho_ten}`} moTa={`${nhanHang(r.loai)} · ${ngayVN(r.ngay_goc)}`} truong={TRUONG_GOI} nhanLuu="Lưu kết quả"
                an={{ khach_id: r.khach_id, loai: r.loai, ngay_goc: r.ngay_goc, chi_nhanh_id: r.chi_nhanh_id ?? "" }} giaTri={{ trang_thai: "da_lien_lac" }} action={ghiKetQuaGoi} />}
              {datLich && <Link href={`/lich-hen?khach=${r.khach_id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Đặt lịch</Link>}
            </span>) },
        ]} />

      {soTrang > 1 && (
        <nav aria-label="Trang" className="flex items-center justify-between gap-3 text-[13px]">
          {trang > 1 ? <Link scroll={false} href={lk({ trang: trang - 1 })} className="font-medium text-nhan-dam hover:underline">← Trang trước</Link> : <span />}
          <span className="tabular-nums">Trang {trang}/{soTrang}</span>
          {trang < soTrang ? <Link scroll={false} href={lk({ trang: trang + 1 })} className="font-medium text-nhan-dam hover:underline">Trang sau →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}

/** Dòng mô tả sự kiện theo loại (định kỳ ghi rõ mốc tháng). */
function mocLyDo(r: { loai: string; moc: number | null }) {
  if (r.loai === "dinh_ky" && r.moc) return `Định kỳ ${r.moc} tháng sau lần đến cuối`;
  if (r.loai === "sinh_nhat") return "Sinh nhật";
  return nhanHang(r.loai);
}
