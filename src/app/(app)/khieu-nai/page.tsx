import Link from "next/link";
import { yeuCauMotTrong } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN } from "@/lib/dinh-dang";
import { KN_DANG_XU_LY, LOAI_KN, TT_BC, TT_KN, gioTroi, soDuongHoacNull } from "@/lib/khieu-nai";
import { truongBaoBatThuong, truongKhieuNai } from "@/lib/khieu-nai-form";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { baoBienChung, ghiKhieuNai } from "./actions";

const TAB = [{ ma: "dang-xu-ly", ten: "Đang xử lý" }, { ma: "bien-chung", ten: "Biến chứng" }, { ma: "lich-su", ten: "Lịch sử" }, { ma: "bao-hanh", ten: "Đã làm lại bảo hành" }];
const MOC: Record<string, string> = { duoi_moc_1: "Dưới mốc đầu", moc_1: "Mốc 3–6 tháng", moc_2: "Mốc 6–12 tháng", tren_moc_3: "Trên 12 tháng", nam_mot_lan: "Triệt lông 1 năm/lần" };

/** Sổ khiếu nại, biến chứng và bảo hành (QT-11, QT-12, BM17–19): một nơi để tiếp nhận, theo dõi đến khi khách xác nhận xong. */
export default async function TrangKhieuNai({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauMotTrong(["kn.ghi", "kn.duyet", "bc.bao", "bc.xu_ly"]);
  const { tab: t } = await searchParams;
  const xemKn = coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet");
  // Người chỉ có quyền báo/xử lý biến chứng (bác sĩ, Chuyên viên trị liệu) không thấy nội dung khiếu nại của khách.
  const tabHopLe = xemKn ? TAB : TAB.filter((x) => x.ma === "bien-chung");
  const tab = tabHopLe.some((x) => x.ma === t) ? t! : tabHopLe[0].ma;
  const db = sb(), cn = nd.chiNhanhId;
  const rong = Promise.resolve({ data: [] as never[] });
  const locCn = <T extends { eq: (c: string, v: string) => T }>(q: T) => (cn ? q.eq("chi_nhanh_id", cn) : q);
  const [{ data: kn }, { data: bc }, { data: bh }, { data: dv }, { data: ch }] = await Promise.all([
    xemKn ? locCn(db.from("khieu_nai").select("*").order("tiep_nhan_luc", { ascending: false }).limit(300)) : rong,
    locCn(db.from("bien_chung").select("id, ma, khach_id, dich_vu_id, trang_thai, bao_luc, dau_hieu, nguoi_bao_id").order("bao_luc", { ascending: false }).limit(300)),
    xemKn ? db.from("bao_hanh_lan").select("*").order("ngay_lam_lai", { ascending: false }).limit(200) : rong,
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("cau_hinh").select("gia_tri").eq("khoa", "kn_sla_tiep_nhan_gio").maybeSingle(),
  ]);
  const khIds = [...new Set([...(kn ?? []).map((x) => x.khach_id), ...(bc ?? []).map((x) => x.khach_id), ...(bh ?? []).map((x) => x.khach_id)])];
  const [{ data: khach }, { data: nv }] = await Promise.all([
    khIds.length ? db.from("khach_hang").select("id, ho_ten, ma, chi_nhanh_id").in("id", khIds) : Promise.resolve({ data: [] as { id: string; ho_ten: string; ma: string; chi_nhanh_id: string }[] }),
    db.from("nhan_vien").select("id, ho_ten"),
  ]);
  const tenK = new Map((khach ?? []).map((k) => [k.id, k])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const sla = soDuongHoacNull(ch?.gia_tri);
  const dangXuLy = (kn ?? []).filter((x) => KN_DANG_XU_LY.includes(x.trang_thai));
  const lichSu = (kn ?? []).filter((x) => !KN_DANG_XU_LY.includes(x.trang_thai));
  const bcMo = (bc ?? []).filter((x) => x.trang_thai !== "dong");
  const quaSla = sla ? dangXuLy.filter((x) => x.trang_thai === "moi" && gioTroi(x.tiep_nhan_luc) >= sla).length : 0;
  const dvLc = (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` }));
  const KhachCell = ({ id }: { id: string }) => <Link href={`/khach-hang/${id}?tab=khieu-nai`} className="font-medium hover:underline">{tenK.get(id)?.ho_ten ?? ""}<div className="text-[12.5px] font-normal text-muc-3">{tenK.get(id)?.ma}</div></Link>;
  return (
    <div>
      <TieuDeTrang tieuDe="Khiếu nại & biến chứng" phu="Tiếp nhận → phân loại → phương án → duyệt → khách xác nhận mới đóng. Dấu hiệu y khoa luôn chuyển bác sĩ trước, thương mại sau.">
        {coQuyen(nd, "kn.ghi") && <NutHop nhan="Ghi khiếu nại" tieuDe="Ghi nhận khiếu nại (BM17)" action={ghiKhieuNai} giaTri={{ kenh: "truc_tiep", loai: "dich_vu" }} rong truong={truongKhieuNai(dvLc, true)} nhanLuu="Ghi nhận" />}
        {(coQuyen(nd, "bc.bao") || coQuyen(nd, "kn.ghi")) && <NutHop kieu="phu" nhan="Báo dấu hiệu bất thường" tieuDe="Báo dấu hiệu bất thường (QT-12)" moTa="Ngừng thao tác gây rủi ro, đưa khách đến bác sĩ rồi mới ghi. Bác sĩ và lãnh đạo nhận thông báo ngay." action={baoBienChung} rong truong={truongBaoBatThuong(dvLc, true)} nhanLuu="Báo ngay" />}
      </TieuDeTrang>
      <HangChiSo muc={[
        ...(xemKn ? [{ nhan: "Khiếu nại đang xử lý", so: String(dangXuLy.length), ghiChu: `${dangXuLy.filter((x) => x.trang_thai === "cho_duyet").length} chờ duyệt` }] : []),
        { nhan: "Biến chứng chưa đóng", so: String(bcMo.length), ghiChu: bcMo.filter((x) => x.trang_thai === "moi").length ? `${bcMo.filter((x) => x.trang_thai === "moi").length} chờ bác sĩ` : "bác sĩ đã nhận hết" },
        ...(xemKn ? [{ nhan: "Quá hạn tiếp nhận", so: sla ? String(quaSla) : "—", ghiChu: sla ? `quá ${sla} giờ chưa có phương án` : "chờ chốt số giờ (Cài đặt)" }] : []),
      ]} />
      <div className="mt-6" />
      <Tab muc={tabHopLe.map((x) => (x.ma === "dang-xu-ly" ? { ...x, ten: `Đang xử lý (${dangXuLy.length})` } : x.ma === "bien-chung" ? { ...x, ten: `Biến chứng (${bcMo.length})` } : x))} dang={tab} goc="/khieu-nai" />
      {tab === "bien-chung" ? (
        <Bang duLieu={bc ?? []} khoa={(r) => r.id} trong="Chưa có ca biến chứng nào."
          cot={[
            { nhan: "Mã", chinh: true, hienThi: (r) => <Link href={`/khieu-nai/bien-chung/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
            { nhan: "Khách", hienThi: (r) => <KhachCell id={r.khach_id} /> },
            { nhan: "Dấu hiệu", hienThi: (r) => <span className="line-clamp-2 text-[13px]">{r.dau_hieu}</span> },
            { nhan: "Dịch vụ", hienThi: (r) => (r.dich_vu_id ? tenDv.get(r.dich_vu_id) ?? "" : "") },
            { nhan: "Báo lúc", hienThi: (r) => <div className="text-[13px]">{ngayGioVN(r.bao_luc)}<div className="text-muc-3">{tenNv.get(r.nguoi_bao_id)}</div></div> },
            { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_BC[r.trang_thai].kieu}>{TT_BC[r.trang_thai].ten}</NhanTrangThai> },
          ]} />
      ) : tab === "bao-hanh" ? (
        <Bang duLieu={bh ?? []} khoa={(r) => r.id} trong="Chưa ghi lần làm lại bảo hành nào."
          cot={[
            { nhan: "Khách", chinh: true, hienThi: (r) => <KhachCell id={r.khach_id} /> },
            { nhan: "Dịch vụ", hienThi: (r) => tenDv.get(r.dich_vu_id) ?? "" },
            { nhan: "Buổi cuối", hienThi: (r) => r.ngay_dich_vu_cuoi.split("-").reverse().join("/") },
            { nhan: "Làm lại", hienThi: (r) => r.ngay_lam_lai.split("-").reverse().join("/") },
            { nhan: "Mốc", hienThi: (r) => <div className="text-[13px]">{MOC[r.moc]}{r.ty_le_giam != null && <div className="text-muc-3">ưu đãi {Number(r.ty_le_giam)}%</div>}</div> },
            { nhan: "Người ghi", hienThi: (r) => tenNv.get(r.nguoi_ghi_id) ?? "" },
          ]} />
      ) : (
        <Bang duLieu={tab === "dang-xu-ly" ? dangXuLy : lichSu} khoa={(r) => r.id} trong={tab === "dang-xu-ly" ? "Không có khiếu nại nào đang xử lý." : "Chưa có khiếu nại nào."}
          cot={[
            { nhan: "Mã", chinh: true, hienThi: (r) => <Link href={`/khieu-nai/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
            { nhan: "Khách", hienThi: (r) => <KhachCell id={r.khach_id} /> },
            { nhan: "Loại", hienThi: (r) => LOAI_KN[r.loai]?.replace(" (chuyển biến chứng)", "") },
            { nhan: "Nội dung", hienThi: (r) => <span className="line-clamp-2 text-[13px]">{r.noi_dung}</span> },
            { nhan: "Tiếp nhận", hienThi: (r) => <div className="text-[13px]">{ngayGioVN(r.tiep_nhan_luc)}<div className="text-muc-3">{tenNv.get(r.nguoi_tiep_nhan_id)}</div></div> },
            { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={sla && r.trang_thai === "moi" && gioTroi(r.tiep_nhan_luc) >= sla ? "loi" : TT_KN[r.trang_thai].kieu}>{TT_KN[r.trang_thai].ten}</NhanTrangThai> },
          ]} />
      )}
    </div>
  );
}
