import Link from "next/link";
import { AlertTriangle, Calculator, ChevronLeft, ChevronRight, Database, Lock, Stethoscope, Users } from "lucide-react";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { homNayHCM } from "@/lib/dinh-dang";
import { chonThang, layBangThang, NHOM_HH } from "@/lib/cs-hoa-hong-tai";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { NutHop } from "@/components/ui/BieuMau";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { DaiLienKet, OSo, phanTram, The, tien } from "@/components/hoa-hong/cs/KhoiCs";
import { lienKetCs } from "@/components/hoa-hong/cs/lien-ket";
import { boChotThang, chotThang, datCaKhongTinh, luuSoChiNhanh, luuSoNhanVien } from "../chinh-sach/actions";

const TAB = [{ ma: "nguoi", ten: "Theo người" }, { ma: "phi", ten: "Phí trị liệu" }, { ma: "dau-vao", ten: "Số liệu đầu vào" }, { ma: "canh-bao", ten: "Cần rà soát" }];
const LY_DO = ["Ca bảo hành", "Ca làm lại (lỗi kỹ thuật, thao tác)", "Ca tặng / dịch vụ đi kèm tặng", "Ca dùng thử", "Không có phiếu dịch vụ hoặc chữ ký khách", "Phục vụ Marketing (KOL, KOC, quay chụp)"].map((x) => ({ gia_tri: x, nhan: x }));

/** Bảng tính hoa hồng + phí trị liệu theo tháng (chính sách từ 11/2026): tính thử từng người, nhập số Kế toán chốt, đánh dấu ca không tính phí, rồi Chốt để đổ vào bảng lương. */
export default async function TrangHoaHongThang({ searchParams }: { searchParams: Promise<{ thang?: string; tab?: string }> }) {
  const [nd, sp] = await Promise.all([yeuCauNoiBo(), searchParams]);
  if (!coQuyen(nd, "luong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem bảng tính hoa hồng tháng.</p>;
  const sua = coQuyen(nd, "luong.sua");
  const hom = homNayHCM(), { nam, thang, khoa } = chonThang(sp.thang, hom);
  const tab = TAB.some((t) => t.ma === sp.tab) ? (sp.tab as string) : "nguoi";
  const b = await layBangThang(nam, thang, hom);
  const tr = thang === 1 ? `${nam - 1}-12` : `${nam}-${String(thang - 1).padStart(2, "0")}`, sau = thang === 12 ? `${nam + 1}-01` : `${nam}-${String(thang + 1).padStart(2, "0")}`;
  const them = `&thang=${khoa}`;
  const tongChi = b.nhanVien.reduce((s, r) => s + r.tong, 0);
  const soCanhBao = (b.canhBao.dongChuaGia ? 1 : 0) + (b.phi.chuaDonGia.length ? 1 : 0) + (b.phi.caChuaNguoiLam ? 1 : 0) + (b.canhBao.nguoiDatChuaKhop.length ? 1 : 0) + (b.khongThuocDien.length ? 1 : 0);
  const an = { nam: String(nam), thang: String(thang) };

  return (
    <div>
      <TieuDeNoi icon={Calculator} tieuDe={`Hoa hồng & phí trị liệu ${String(thang).padStart(2, "0")}/${nam}`} so={b.tamTinh ? `Tạm tính đến ${b.den.split("-").reverse().join("/")}` : "Đủ tháng"}
        phu="Tính theo PL05, PL06 và Quy định phí trị liệu từ doanh thu thực thu, ca dịch vụ trên phần mềm và số Kế toán chốt. Bấm tên một người để xem tính thử từng khoản. Chốt tháng thì bảng lương lấy số đã chốt.">
        <div className="flex items-center gap-1">
          {tr >= "2026-11" && <Link href={`/hoa-hong/thang?thang=${tr}&tab=${tab}`} aria-label="Tháng trước" className="flex h-10 w-10 items-center justify-center rounded-nho border border-vien-dam hover:bg-giay-tram"><ChevronLeft className="h-4 w-4" /></Link>}
          {sau <= hom.slice(0, 7) && <Link href={`/hoa-hong/thang?thang=${sau}&tab=${tab}`} aria-label="Tháng sau" className="flex h-10 w-10 items-center justify-center rounded-nho border border-vien-dam hover:bg-giay-tram"><ChevronRight className="h-4 w-4" /></Link>}
        </div>
        {sua && <NutHop nhan={b.chot ? "Chốt lại" : "Chốt tháng"} tieuDe={`Chốt hoa hồng tháng ${thang}/${nam}`} moTa={`Ghi số của ${b.nhanVien.filter((r) => r.tong).length} người, tổng ${tien(tongChi)} vào sổ chốt. Bảng lương tháng này sẽ lấy số đã chốt. Chốt lại thì thay số cũ (chỉ khi kỳ lương còn đang lập).`}
          truong={b.tamTinh ? [{ ten: "chot_som", nhan: "Chốt dù tháng chưa hết", loai: "gat" }] : []} an={an} action={chotThang} nhanLuu="Chốt" />}
        {sua && b.chot && <NutHop kieu="phu" nhan="Bỏ chốt" tieuDe="Bỏ chốt tháng" moTa="Xoá số đã chốt; bảng lương tính lại sẽ dùng cách tính cũ cho tới khi chốt lại." an={an} action={boChotThang} nhanLuu="Bỏ chốt" nguy />}
      </TieuDeNoi>
      <DaiLienKet muc={lienKetCs(nd)} dang="/hoa-hong/thang" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OSo toi nhan="Tổng chi theo chính sách" so={tien(tongChi)} phu={`${b.nhanVien.filter((r) => r.tong).length} người có khoản`} nhan2={b.chot ? `Đã chốt ${tien(b.chot.tong)}` : undefined} />
        <OSo nhan="Doanh số chi nhánh" so={tien(b.tong.ds)} phu={b.tong.ghiDe.ds != null ? "theo số Kế toán chốt" : "phần mềm tính (thực thu)"} />
        <OSo nhan="Phí bác sĩ / trần" so={`${tien(b.phi.bs.tong)}`} phu={`trần ${tien(b.phi.bs.tran)}${b.phi.bs.heSo < 1 ? ` · hệ số ${b.phi.bs.heSo.toFixed(3)}` : ""}`} />
        <OSo nhan="Phí trị liệu viên / trần" so={`${tien(b.phi.tlv.tong)}`} phu={`trần ${tien(b.phi.tlv.tran)}${b.phi.tlv.heSo < 1 ? ` · hệ số ${b.phi.tlv.heSo.toFixed(3)}` : ""}`} />
      </div>
      {b.chot && <p className="mb-4 flex items-center gap-2 rounded-the border border-nhan/30 bg-nhan-nhat px-3 py-2 text-[13px] text-nhan-dam"><Lock className="h-4 w-4" />Đã chốt lúc {new Date(b.chot.luc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {b.chot.soNguoi} người · {tien(b.chot.tong)}. Số bên dưới là số tính lại hiện tại.</p>}

      <Tab muc={TAB.map((t) => (t.ma === "canh-bao" && soCanhBao ? { ...t, ten: `${t.ten} (${soCanhBao})` } : t))} dang={tab} goc="/hoa-hong/thang" them={them} />

      {tab === "nguoi" && (
        <The icon={Users} tieuDe="Theo người" moTa="Bấm tên để xem tính thử từng khoản">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-[13.5px]">
              <thead><tr className="nhan-muc border-b border-vien text-left"><th className="py-2.5 pr-3 font-medium">Nhân viên</th><th className="py-2.5 pr-3 font-medium">Nhóm</th><th className="py-2.5 pr-3 text-right font-medium">Doanh số cá nhân</th><th className="py-2.5 pr-3 font-medium">Các khoản</th><th className="py-2.5 text-right font-medium">Tổng</th></tr></thead>
              <tbody className="divide-y divide-vien">
                {b.nhanVien.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-giay-tram/60">
                    <td className="py-2.5 pr-3"><Link href={`/hoa-hong/thang/${r.id}?thang=${khoa}`} className="font-medium text-nhan-dam hover:underline">{r.ten}</Link><span className="block text-[12px] text-muc-3">{r.chucDanh}</span></td>
                    <td className="py-2.5 pr-3 text-muc-2">{r.nhom ? NHOM_HH[r.nhom] : "—"}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-muc-2">{r.dsBan ? tien(r.dsBan) : ""}</td>
                    <td className="py-2.5 pr-3 text-[12.5px] text-muc-3">{r.khoan.filter((k) => k.tien).map((k) => k.nhan).join(" · ") || "—"}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-muc">{tien(r.tong)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-vien-dam"><td colSpan={4} className="py-2.5 font-semibold">Cộng</td><td className="py-2.5 text-right font-bold tabular-nums text-nhan-dam">{tien(tongChi)}</td></tr></tfoot>
            </table>
          </div>
          {!b.nhanVien.length && <p className="py-6 text-center text-[13.5px] text-muc-3">Chưa có số liệu tháng này.</p>}
        </The>
      )}

      {tab === "phi" && (
        <The icon={Stethoscope} mau="xanh" tieuDe={`Ca tính phí trị liệu (${b.phi.ca.length})`} moTa={`Giám đốc chi nhánh rà soát và đánh dấu ca không tính phí (Điều 4). ${b.phi.loaiTru.length} ca đã đánh dấu không tính.`}>
          <div className="overflow-x-auto lg:max-h-[640px] lg:overflow-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="sticky top-0 z-10 bg-giay-sang"><tr className="nhan-muc border-b border-vien text-left"><th className="py-2 pr-3 font-medium">Ngày</th><th className="py-2 pr-3 font-medium">Dịch vụ · khách</th><th className="py-2 pr-3 font-medium">Người tính</th><th className="py-2 pr-3 font-medium">Dòng đơn giá</th><th className="py-2 pr-3 text-right font-medium">Tiền</th>{sua && <th className="py-2" />}</tr></thead>
              <tbody className="divide-y divide-vien">
                {b.phi.ca.slice(0, 600).map((c) => (
                  <tr key={c.dongId + c.nv} className="align-top">
                    <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-muc-3">{c.ngay.slice(8, 10)}/{c.ngay.slice(5, 7)}</td>
                    <td className="py-2 pr-3 text-muc">{c.ten}<span className="block text-[11.5px] text-muc-3">{c.maHd} · {c.khach}</span></td>
                    <td className="py-2 pr-3 text-muc-2">{c.tenNv}<span className="block text-[11.5px] text-muc-3">{c.doiTuong === "bac_si" ? "Bác sĩ" : "Trị liệu viên"}</span></td>
                    <td className="py-2 pr-3 text-muc-2">{c.dongGia} · {c.soDv} × {tien(c.donGia)}</td>
                    <td className="py-2 pr-3 text-right font-medium tabular-nums">{tien(c.tien)}</td>
                    {sua && <td className="py-2 text-right">{!c.laPhuBs && <NutHop kieu="chu" nhan="Không tính" tieuDe="Đánh dấu ca không tính phí" moTa={`${c.ten} · ${c.maHd} · ${c.khach}`} truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chon", luaChon: LY_DO, batBuoc: true }]} an={{ dong_id: c.dongId }} action={datCaKhongTinh} />}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.phi.ca.length > 600 && <p className="mt-2 text-[12px] text-muc-3">Hiện 600 / {b.phi.ca.length} ca. Xem theo từng người ở tab Theo người.</p>}
          {b.phi.loaiTru.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muc-3">Ca không tính phí</h3>
              <ul className="divide-y divide-vien text-[13px]">
                {b.phi.loaiTru.map((c) => (
                  <li key={c.dongId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-muc">{c.ngay.slice(8, 10)}/{c.ngay.slice(5, 7)} · {c.ten} · {c.maHd} <NhanTrangThai kieu="cho">{c.lyDo}</NhanTrangThai></span>
                    {sua && <NutHop kieu="chu" nhan="Tính lại" tieuDe="Bỏ đánh dấu không tính" moTa={c.ten} an={{ dong_id: c.dongId, ly_do: "" }} action={datCaKhongTinh} nhanLuu="Bỏ đánh dấu" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </The>
      )}

      {tab === "dau-vao" && (
        <>
          <The icon={Database} tieuDe="Số chi nhánh" moTa="Để trống = dùng số phần mềm tính. Nhập số Kế toán chốt để hoa hồng tính đúng như chính sách.">
            <div className="grid gap-3 md:grid-cols-2">
              {b.cn.map((c) => (
                <div key={c.id} className="rounded-the border border-vien bg-giay p-4">
                  <div className="mb-3 flex items-center justify-between gap-2"><p className="font-semibold text-muc">{c.ten}</p>
                    {sua && <NutHop kieu="phu" nhan="Nhập số chốt" tieuDe={`Số chốt tháng ${thang}/${nam} · ${c.ten}`} an={{ ...an, chi_nhanh_id: c.id }} action={luuSoChiNhanh}
                      giaTri={{ doanh_so_chot: c.ghiDe.ds ?? "", doanh_so_dv_chot: c.ghiDe.dsDv ?? "", chi_phi_qc: c.ghiDe.qc ?? "" }}
                      truong={[{ ten: "doanh_so_chot", nhan: "Doanh số chi nhánh (thực thu)", loai: "tien", ghiChu: `Phần mềm: ${tien(c.dsPm)}` }, { ten: "doanh_so_dv_chot", nhan: "Doanh số dịch vụ thực thu (tính trần phí)", loai: "tien", ghiChu: `Phần mềm: ${tien(c.dsDvPm)}` }, { ten: "chi_phi_qc", nhan: "Chi phí quảng cáo tháng", loai: "tien", ghiChu: "Để trống = lấy từ Marketing › chi phí quảng cáo theo ngày" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }]} />}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    <dt className="text-muc-3">Doanh số chi nhánh</dt><dd className="text-right font-medium tabular-nums">{tien(c.ds)}{c.ghiDe.ds != null && <span className="ml-1 text-[11px] text-dat-dam">chốt</span>}</dd>
                    <dt className="text-muc-3">Doanh số dịch vụ</dt><dd className="text-right font-medium tabular-nums">{tien(c.dsDv)}</dd>
                    <dt className="text-muc-3">Bán giá sàn</dt><dd className="text-right font-medium tabular-nums">{tien(c.dsGiaSan)}</dd>
                    <dt className="text-muc-3">Marketing mang về</dt><dd className="text-right font-medium tabular-nums">{tien(c.dsMkt)}</dd>
                    <dt className="text-muc-3">Chi phí quảng cáo</dt><dd className="text-right font-medium tabular-nums">{tien(c.chiPhiQc)} <span className="text-[11px] text-muc-3">({c.ds ? phanTram(c.chiPhiQc / c.ds, 1) : "–"})</span></dd>
                  </dl>
                </div>
              ))}
              {!b.cn.length && <p className="text-[13.5px] text-muc-3">Chưa có doanh thu tháng này.</p>}
            </div>
          </The>
          <The icon={Users} mau="tim" tieuDe="Chỉ tiêu và điều kiện từng người" moTa="Chỉ tiêu tư vấn giao trước ngày 05. Khối gián tiếp: bỏ tick nếu không đủ công, không đạt KPI hoặc vi phạm kỷ luật.">
            <ul className="divide-y divide-vien">
              {b.nhanVien.filter((r) => r.nhom === "tu_van" || r.nhom === "gian_tiep_nv" || r.nhom === "gian_tiep_ql").map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13.5px]">
                  <span><span className="font-medium text-muc">{r.ten}</span> <span className="text-muc-3">· {r.nhom ? NHOM_HH[r.nhom] : ""}</span></span>
                  <span className="flex items-center gap-3">
                    {r.nhom === "tu_van" ? <span className="tabular-nums text-muc-2">{r.chiTieu ? `Chỉ tiêu ${tien(r.chiTieu)}` : "Chưa giao chỉ tiêu"}</span> : <NhanTrangThai kieu={r.datDk ? "tot" : "loi"}>{r.datDk ? "Đạt điều kiện" : "Không đạt"}</NhanTrangThai>}
                    {sua && <NutHop kieu="chu" nhan="Sửa" tieuDe={`${r.ten} · tháng ${thang}/${nam}`} an={{ ...an, nhan_vien_id: r.id }} action={luuSoNhanVien}
                      giaTri={{ chi_tieu: r.chiTieu ?? "", dat_dieu_kien: r.datDk }}
                      truong={[...(r.nhom === "tu_van" ? [{ ten: "chi_tieu", nhan: "Chỉ tiêu doanh số tháng", loai: "tien" as const }] : []), { ten: "dat_dieu_kien", nhan: "Đạt điều kiện (đủ công, KPI, không vi phạm kỷ luật)", loai: "gat" as const }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu" as const, rong: true }]} />}
                  </span>
                </li>
              ))}
            </ul>
          </The>
        </>
      )}

      {tab === "canh-bao" && (
        <The icon={AlertTriangle} mau="cam" tieuDe="Cần rà soát trước khi chốt" moTa="Những chỗ phần mềm chưa đủ dữ liệu để tính đúng chính sách">
          <ul className="space-y-3 text-[13.5px]">
            {b.canhBao.dongChuaGia > 0 && <li className="rounded-the border border-vien bg-giay p-3"><b className="text-muc">{b.canhBao.dongChuaGia} dòng bán ({tien(b.canhBao.dsChuaGia)}) chưa có giá khuyến mại</b><p className="mt-1 text-muc-3">Đang tạm tính mức giá khuyến mại {phanTram(b.cauHinh.tv.km)}. Nhập giá khuyến mại và giá tối thiểu (Bảng giá khách hàng PL02, Chính sách giá PL03) ở <Link className="text-nhan-dam underline" href="/hoa-hong/chinh-sach/cai-dat?tab=gia">Cài đặt chính sách › Giá khuyến mại</Link> để tách đúng giá sàn.</p></li>}
            {b.phi.chuaDonGia.length > 0 && <li className="rounded-the border border-vien bg-giay p-3"><b className="text-muc">{b.phi.chuaDonGia.reduce((s, x) => s + x.soCa, 0)} ca chưa có đơn giá phí trị liệu ({b.phi.chuaDonGia.length} dịch vụ)</b><p className="mt-1 text-muc-3">Dịch vụ chưa có trong PL01/PL02 chỉ tính khi Giám đốc chi nhánh duyệt đơn giá bổ sung. Ghép vào dòng đơn giá ở <Link className="text-nhan-dam underline" href="/hoa-hong/chinh-sach/cai-dat?tab=phi">Cài đặt › Đơn giá phí trị liệu</Link>.</p>
              <ul className="mt-2 grid gap-1 text-[12.5px] text-muc-2 sm:grid-cols-2">{b.phi.chuaDonGia.slice(0, 30).map((x) => <li key={x.doiTuong + x.ten}>· {x.ten} <span className="text-muc-3">({x.doiTuong === "bac_si" ? "bác sĩ" : "trị liệu viên"}, {x.soCa} ca)</span></li>)}</ul></li>}
            {b.phi.caChuaNguoiLam > 0 && <li className="rounded-the border border-vien bg-giay p-3"><b className="text-muc">{b.phi.caChuaNguoiLam} ca dịch vụ chưa ghi người thực hiện</b><p className="mt-1 text-muc-3">Lễ tân bổ sung người làm trên hoá đơn để tính phí (Điều 5, bước 1).</p></li>}
            {b.phi.caNguoiKhac > 0 && <li className="rounded-the border border-vien bg-giay p-3"><b className="text-muc">{b.phi.caNguoiKhac} ca do người không thuộc nhóm bác sĩ / trị liệu viên thực hiện</b><p className="mt-1 text-muc-3">Kiểm tra nhóm hưởng của người làm ở <Link className="text-nhan-dam underline" href="/hoa-hong/chinh-sach/cai-dat?tab=nhom">Cài đặt › Nhóm hưởng</Link>.</p></li>}
            {b.canhBao.nguoiDatChuaKhop.length > 0 && <li className="rounded-the border border-vien bg-giay p-3"><b className="text-muc">Người đặt lịch chưa khớp nhân viên telesale</b><p className="mt-1 text-muc-3">Lịch hẹn ghi người đặt bằng tên. Tên dưới đây không trùng nhân viên nào thuộc nhóm Telesale nên chưa tính doanh số telesale mang về.</p>
              <ul className="mt-2 grid gap-1 text-[12.5px] text-muc-2 sm:grid-cols-2">{b.canhBao.nguoiDatChuaKhop.slice(0, 20).map(([t, so]) => <li key={t}>· {t} <span className="text-muc-3">({so} lịch)</span></li>)}</ul></li>}
            {b.khongThuocDien.length > 0 && <li className="rounded-the border border-vien bg-giay p-3"><b className="text-muc">Doanh số của người không thuộc diện PL05</b><p className="mt-1 text-muc-3">Có doanh số chốt đơn nhưng không thuộc nhóm Tư vấn / Trị liệu viên (VD quản lý tự bán — PL06 mục II.1), nên không tính hoa hồng nhân viên.</p>
              <ul className="mt-2 grid gap-1 text-[12.5px] text-muc-2 sm:grid-cols-2">{b.khongThuocDien.map((x) => <li key={x.id}>· {x.ten} <span className="text-muc-3">({x.chucDanh || "chưa có chức danh"}, {tien(x.ds)})</span></li>)}</ul></li>}
            {!soCanhBao && !b.phi.caNguoiKhac && <li className="text-muc-3">Không có gì cần rà soát.</li>}
          </ul>
        </The>
      )}
    </div>
  );
}
