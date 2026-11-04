import Link from "next/link";
import { BadgePercent, Briefcase, ClipboardList, Crown, HandCoins, Headphones, LayoutGrid, Megaphone, Stethoscope, Table2, UserRound, Users, Wallet } from "lucide-react";
import { lienKetCs } from "@/components/hoa-hong/cs/lien-ket";
import { yeuCauNoiBo } from "@/lib/auth";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { docCauHinh, dongThamKhao, type Bac } from "@/lib/cs-hoa-hong";
import { GIA_DINH_THAM_KHAO, MOC_THAM_KHAO, PL05, PL06, QD_PHI_TRI_LIEU } from "@/lib/cs-hoa-hong-van-ban";
import { BangMuc, DaiLienKet, DanhSachDoan, OSo, phanTram, The, tien, tyDong } from "@/components/hoa-hong/cs/KhoiCs";

const TAB = [{ ma: "tom-tat", ten: "Tóm tắt" }, { ma: "nhan-vien", ten: "PL05 · Nhân viên" }, { ma: "quan-ly", ten: "PL06 · Quản lý" }, { ma: "phi-tri-lieu", ten: "Phí trị liệu" }, { ma: "tham-khao", ten: "Bảng tham khảo" }];

const bacChu = (bac: Bac) => bac.map(([tren], i) => (i === 0 ? `đến ${tyDong(tren ?? 0)}` : tren == null ? `trên ${tyDong(bac[i - 1][0] ?? 0)}` : `${tyDong(bac[i - 1][0] ?? 0)} – ${tyDong(tren)}`));

/** Toàn văn chính sách hoa hồng & phí trị liệu áp dụng từ 01/11/2026 — mọi nhân viên đều xem được. Tỉ lệ, đơn giá đọc từ cài đặt nên luôn khớp số đang tính. */
export default async function TrangChinhSach({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [nd, sp] = await Promise.all([yeuCauNoiBo(), searchParams]);
  const tab = TAB.some((t) => t.ma === sp.tab) ? (sp.tab as string) : "tom-tat";
  const db = sb();
  const [{ data: cs }, { data: dg }, { data: dm }] = await Promise.all([
    db.from("cs_hoa_hong").select("ten, hieu_luc_tu, cau_hinh").order("hieu_luc_tu", { ascending: false }).limit(1).maybeSingle(),
    db.from("phi_tl_don_gia").select("doi_tuong, nhom, stt, ten, dvt, don_gia").order("doi_tuong").order("stt"),
    db.from("cs_hh_danh_muc").select("ten, gia_khuyen_mai").order("thu_tu"),
  ]);
  const c = docCauHinh(cs?.cau_hinh);
  const t = c.tv;
  const bangDonGia = (doiTuong: "bac_si" | "tri_lieu") => {
    const ds = (dg ?? []).filter((x) => x.doi_tuong === doiTuong);
    const nhom = [...new Set(ds.map((x) => x.nhom))];
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13.5px]">
          <thead><tr className="nhan-muc border-b border-vien"><th className="w-12 py-2.5 pr-3 font-medium">STT</th><th className="py-2.5 pr-3 font-medium">Dịch vụ</th><th className="py-2.5 pr-3 font-medium">ĐVT</th><th className="py-2.5 text-right font-medium">Đơn giá</th></tr></thead>
          {nhom.map((n) => (
            <tbody key={n} className="divide-y divide-vien">
              <tr><td colSpan={4} className="bg-giay-tram px-2 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-muc-3">{n}</td></tr>
              {ds.filter((x) => x.nhom === n).map((x) => (
                <tr key={x.stt}><td className="py-2 pr-3 tabular-nums text-muc-3">{x.stt}</td><td className="py-2 pr-3 text-muc">{x.ten}</td><td className="py-2 pr-3 text-muc-3">{x.dvt}</td><td className="py-2 text-right font-semibold tabular-nums text-nhan-dam">{Number(x.don_gia) ? tien(Number(x.don_gia)) : "Không tính"}</td></tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    );
  };

  return (
    <div>
      <TieuDeNoi icon={BadgePercent} tieuDe="Chính sách hoa hồng & phí trị liệu" so="Từ 01/11/2026"
        phu={<>Hoa hồng nhân viên (PL05), hoa hồng quản lý (PL06) và phí trị liệu bác sĩ, trị liệu viên (Quy định + PL01, PL02). Thay thế Phụ lục 05, 06 Quý II/2026 và phần phí trị liệu Phụ lục 07. Số tiền thực nhận theo số Kế toán chốt hằng tháng.</>}>
        <Link href="/thu-nhap-cua-toi" className="nut-vang flex h-10 items-center gap-2 rounded-nho px-4 text-[14px]"><Wallet className="h-4 w-4" />Thu nhập tạm tính của tôi</Link>
      </TieuDeNoi>
      <DaiLienKet muc={lienKetCs(nd)} dang="/hoa-hong/chinh-sach" />
      <Tab muc={TAB} dang={tab} goc="/hoa-hong/chinh-sach" />

      {tab === "tom-tat" && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <OSo toi nhan="Tư vấn, trị liệu viên" so={`${phanTram(t.san)} – ${phanTram(t.goi_km)}`} phu="theo giá bán; mỹ phẩm, khách tự khai thác 3%" />
            <OSo nhan="Telesale" so={`${phanTram(c.telesale.bac[0][1])} – ${phanTram(c.telesale.bac[2][1])}`} phu="tỷ lệ tháng theo doanh số chi nhánh" />
            <OSo nhan="Giám đốc chi nhánh" so={`${phanTram(c.gd.bac[0][1])} – ${phanTram(c.gd.bac[2][1])}`} phu="lũy tiến trên doanh số tính hoa hồng" />
            <OSo nhan="Phí trị liệu" so={`Trần ${phanTram(c.phi_tl.tran_bs)} · ${phanTram(c.phi_tl.tran_tlv)}`} phu="bác sĩ · trị liệu viên, theo ca thực tế" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <The icon={Users} tieuDe="Tư vấn, trị liệu viên" moTa="Tính trên doanh thu thực thu của đơn do mình chốt">
              <BangMuc cot={["Khoản", "Mức"]} dong={[
                ["Bán dịch vụ từ giá khuyến mại trở lên", phanTram(t.km)], ["Bán dịch vụ giá sàn", phanTram(t.san)],
                ["Gói, thẻ trong danh mục – từ giá khuyến mại", phanTram(t.goi_km)], ["Gói, thẻ trong danh mục – dưới giá khuyến mại", phanTram(t.goi_duoi_km)],
                ["Mỹ phẩm", phanTram(t.my_pham)], ["Khách mới tự khai thác (đơn đầu, thay các mức trên)", phanTram(t.khach_moi_tu_khai_thac)], ["Vượt chỉ tiêu cá nhân (tư vấn)", phanTram(t.vuot_chi_tieu)],
              ]} />
            </The>
            <The icon={Headphones} mau="xanh" tieuDe="Telesale" moTa={`Doanh số khách mang về trong ${c.telesale.so_ngay} ngày kể từ lịch hẹn do telesale đặt`}>
              <BangMuc cot={["Phần doanh số chi nhánh", "Tỷ lệ"]} dong={bacChu(c.telesale.bac).map((b, i) => [b, phanTram(c.telesale.bac[i][1])])} />
            </The>
            <The icon={Briefcase} mau="tim" tieuDe="Khối gián tiếp" moTa="Đủ công, đạt KPI, không vi phạm kỷ luật trong tháng">
              <BangMuc cot={["Doanh số chi nhánh tháng", "Nhân viên", "Quản lý"]} dong={[["Dưới " + tyDong(c.gian_tiep.moc[0]?.tu ?? 0), "Không thưởng", "Không thưởng"], ...c.gian_tiep.moc.map((m) => [`Từ ${tyDong(m.tu)}`, tien(m.nv), tien(m.ql)] as [string, string, string])]} />
            </The>
            <The icon={Crown} mau="dat" tieuDe="Quản lý (PL06)" moTa="Lũy tiến theo từng phần doanh số">
              <BangMuc cot={["Phần doanh số", "Giám đốc chi nhánh", "Trưởng phòng Marketing"]} dong={bacChu(c.gd.bac).map((b, i) => [b, phanTram(c.gd.bac[i][1]), phanTram(c.mkt.bac[i]?.[1])])} />
              <p className="mt-3 text-[12.5px] text-muc-3">Giám đốc: tính trên doanh số chi nhánh − {phanTram(c.gd.tru_gia_san, 0)} doanh thu bán giá sàn. Marketing: chi phí quảng cáo vượt {phanTram(c.mkt.tran_qc, 0)} doanh số chi nhánh thì không hưởng.</p>
            </The>
          </div>
        </>
      )}

      {tab === "nhan-vien" && (
        <>
          <The icon={ClipboardList} tieuDe={PL05.ten} moTa={PL05.apDung}><h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muc-3">I. Định nghĩa</h3><DanhSachDoan doan={PL05.dinhNghia} /><h3 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-muc-3">II. Quy định chung</h3><DanhSachDoan doan={PL05.quyDinh} /></The>
          <The icon={Users} tieuDe="A. Tư vấn, trị liệu viên">
            <BangMuc dong={[
              ["Bán dịch vụ từ giá khuyến mại trở lên", phanTram(t.km), "Doanh thu thực thu × mức"], ["Bán dịch vụ giá sàn", phanTram(t.san), "Doanh thu thực thu × mức"],
              ["Bán gói, thẻ trong Danh mục – từ giá khuyến mại của gói", phanTram(t.goi_km), "Liệu trình nhiều buổi của một dịch vụ không phải gói: tính như bán dịch vụ"],
              ["Bán gói, thẻ trong Danh mục – dưới giá khuyến mại của gói", phanTram(t.goi_duoi_km), "Doanh thu thực thu × mức"], ["Bán mỹ phẩm", phanTram(t.my_pham), "Doanh thu mỹ phẩm × mức"],
              ["Khách mới tự khai thác", phanTram(t.khach_moi_tu_khai_thac), "Đơn đầu tiên của khách. Thay cho các mức trên, không cộng thêm"],
              ["Thưởng vượt chỉ tiêu cá nhân (tư vấn)", phanTram(t.vuot_chi_tieu), "(Doanh số cá nhân − Chỉ tiêu) × mức. Chỉ tiêu giao bằng văn bản trước ngày 05"],
            ]} />
            <h3 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-muc-3">Danh mục gói, thẻ</h3>
            <BangMuc cot={["Gói, thẻ", "Giá khuyến mại của gói"]} dong={(dm ?? []).map((x) => [x.ten, tien(Number(x.gia_khuyen_mai))])} />
            <p className="mt-2 text-[12.5px] text-muc-3">Bán từ giá khuyến mại trở lên: {phanTram(t.goi_km)}; thấp hơn: {phanTram(t.goi_duoi_km)}. Gói, thẻ không có trong danh mục tính như bán dịch vụ thường.</p>
            <div className="mt-4 rounded-the bg-giay-tram p-3 text-[13px] leading-relaxed text-muc-2"><b className="text-muc">Ví dụ cả tháng.</b> {PL05.viDuTuVan}</div>
          </The>
          <The icon={Headphones} mau="xanh" tieuDe="B. Telesale" moTa={PL05.telesale}>
            <BangMuc cot={["Phần doanh số chi nhánh", "Tỷ lệ"]} dong={bacChu(c.telesale.bac).map((b, i) => [b, phanTram(c.telesale.bac[i][1])])} />
            <div className="mt-3"><DanhSachDoan so={false} doan={PL05.viDuTelesale} /></div>
          </The>
          <The icon={Briefcase} mau="tim" tieuDe="C. Khối gián tiếp" moTa={PL05.gianTiep}>
            <BangMuc cot={["Doanh số chi nhánh tháng", "Nhân viên", "Quản lý"]} dong={[["Dưới " + tyDong(c.gian_tiep.moc[0]?.tu ?? 0), "Không thưởng", "Không thưởng"], ...c.gian_tiep.moc.map((m, i) => [`Mốc ${i + 1}: từ ${tyDong(m.tu)}`, `${tien(m.nv)} / người`, `${tien(m.ql)} / người`] as [string, string, string])]} />
          </The>
          <The icon={ClipboardList} tieuDe="IV. Điều khoản thi hành"><DanhSachDoan doan={PL05.thiHanh} /></The>
        </>
      )}

      {tab === "quan-ly" && (
        <>
          <The icon={Crown} mau="dat" tieuDe={PL06.ten} moTa={PL06.apDung}><h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muc-3">I. Định nghĩa</h3><DanhSachDoan doan={PL06.dinhNghia} /><h3 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-muc-3">II. Quy định chung</h3><DanhSachDoan doan={PL06.quyDinh} /></The>
          <The icon={Table2} tieuDe="III. Bảng hoa hồng">
            <BangMuc cot={["Phần doanh số", "Giám đốc chi nhánh", "Trưởng phòng Marketing"]} dong={bacChu(c.gd.bac).map((b, i) => [b, phanTram(c.gd.bac[i][1]), phanTram(c.mkt.bac[i]?.[1])])} />
            <p className="mt-3 text-[12.5px] text-muc-3">Giám đốc chi nhánh tính trên Doanh số tính hoa hồng. Trưởng phòng Marketing: Tỷ lệ tháng = tổng lũy tiến ÷ doanh số chi nhánh; Hoa hồng = Doanh số Marketing mang về × Tỷ lệ tháng; chi phí quảng cáo vượt {phanTram(c.mkt.tran_qc, 0)} doanh số chi nhánh thì không hưởng.</p>
          </The>
          <The icon={Megaphone} mau="hong" tieuDe="IV. Ví dụ">
            <BangMuc cot={["", "Chi nhánh 1,5 tỷ (giá sàn 150 tr, MKT 700 tr)", "Chi nhánh 3,2 tỷ (giá sàn 320 tr, MKT 1,6 tỷ)"]} dong={PL06.viDu.map((d) => [d[0], <span key="a" className="font-normal text-muc-2">{d[1]}</span>, d[2]])} />
          </The>
          <The icon={ClipboardList} tieuDe="V. Điều khoản thi hành"><DanhSachDoan doan={PL06.thiHanh} /></The>
        </>
      )}

      {tab === "phi-tri-lieu" && (
        <>
          <The icon={Stethoscope} tieuDe={QD_PHI_TRI_LIEU.ten} moTa={QD_PHI_TRI_LIEU.hieuLuc}>
            {QD_PHI_TRI_LIEU.muc.map((m) => <div key={m.tieuDe} className="mb-4 last:mb-0"><h3 className="mb-2 text-[14px] font-semibold text-muc">{m.tieuDe}</h3><DanhSachDoan doan={m.doan} /></div>)}
          </The>
          <The icon={ClipboardList} mau="xanh" tieuDe="Điều 5. Quy trình và trách nhiệm">
            <div className="grid gap-3 sm:grid-cols-5">
              {QD_PHI_TRI_LIEU.quyTrinh.map(([b, ten, nd2, ai, han]) => (
                <div key={b} className="rounded-the border border-vien bg-giay p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-nho text-[13px] font-bold text-espresso" style={{ background: "var(--gradient-vang)" }}>{b}</span>
                  <p className="mt-2 text-[14px] font-semibold text-muc">{ten}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muc-3">{nd2}</p>
                  <p className="mt-2 text-[12px] font-medium text-nhan-dam">{ai} · {han}</p>
                </div>
              ))}
            </div>
          </The>
          <div className="grid gap-5 xl:grid-cols-2">
            <The icon={Stethoscope} mau="dat" tieuDe="Phụ lục 01 – Đơn giá bác sĩ" moTa={`Áp dụng chung cho bác sĩ chính thức. Trần chi ${phanTram(c.phi_tl.tran_bs, 0)} doanh số dịch vụ thực thu.`}>{bangDonGia("bac_si")}</The>
            <The icon={HandCoins} mau="xanh" tieuDe="Phụ lục 02 – Đơn giá trị liệu viên" moTa={`Phụ bác sĩ ${tien(c.phi_tl.phu_bs)}/ca. Trần chi ${phanTram(c.phi_tl.tran_tlv, 0)} doanh số dịch vụ thực thu.`}>{bangDonGia("tri_lieu")}</The>
          </div>
        </>
      )}

      {tab === "tham-khao" && (
        <The icon={LayoutGrid} tieuDe="Bảng tham khảo theo doanh số chi nhánh" moTa="Số minh họa theo giả định của phụ lục (giá sàn 10%, Marketing mang về 50%, telesale 30%, quảng cáo 12%, một tư vấn 25% với chỉ tiêu 22%, một trị liệu viên 3%). Hoa hồng thực tế theo số Kế toán chốt.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-right text-[13px] tabular-nums">
              <thead><tr className="nhan-muc border-b border-vien"><th className="py-2.5 pr-3 text-left font-medium">Doanh số chi nhánh</th>{MOC_THAM_KHAO.map((m) => <th key={m} className="py-2.5 pr-3 font-medium">{tyDong(m)}</th>)}</tr></thead>
              <tbody className="divide-y divide-vien">
                {([["Tư vấn", "tuVan"], ["Trị liệu viên", "triLieu"], ["Telesale", "telesale"], ["Gián tiếp – nhân viên", "gianTiepNv"], ["Gián tiếp – quản lý", "gianTiepQl"], ["Giám đốc chi nhánh", "giamDoc"], ["Trưởng phòng Marketing", "marketing"]] as const).map(([ten, k]) => (
                  <tr key={k}><td className="py-2 pr-3 text-left text-muc">{ten}</td>{MOC_THAM_KHAO.map((m) => <td key={m} className="py-2 pr-3 text-muc-2">{tien(dongThamKhao(m, GIA_DINH_THAM_KHAO, c)[k])}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </The>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muc-3"><UserRound className="h-3.5 w-3.5" />{cs?.ten ?? "Chính sách mặc định"}{cs?.hieu_luc_tu ? ` · hiệu lực từ ${cs.hieu_luc_tu.split("-").reverse().join("/")}` : ""}</p>
    </div>
  );
}
