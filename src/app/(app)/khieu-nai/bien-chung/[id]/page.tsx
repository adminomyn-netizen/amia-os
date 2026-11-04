import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauMotTrong } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN } from "@/lib/dinh-dang";
import { BUOC_BC, TT_BC } from "@/lib/khieu-nai";
import { truongCamKet, truongDongBc, truongKham } from "@/lib/khieu-nai-form";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { TienDo } from "@/components/khieu-nai/TienDo";
import { camKetBienChung, dongBienChung, khamBienChung } from "../../actions";

const Khoi = ({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) => (
  <section className="border-b border-vien py-4"><h2 className="nhan-muc mb-2">{tieuDe}</h2><div className="whitespace-pre-line text-[14.5px] text-muc">{children}</div></section>
);

/** Ca biến chứng (BM18, QT-12): bác sĩ chủ trì. Chẩn đoán, phương án, cam kết là dữ liệu sức khoẻ: chỉ người có quyền xem hồ sơ điều trị mới thấy, và mỗi lần xem đều được ghi vết. */
export default async function ChiTietBienChung({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauMotTrong(["bc.bao", "bc.xu_ly", "kn.duyet", "kn.ghi"]);
  const { id } = await params;
  const db = sb();
  const { data: b } = await db.from("bien_chung").select("*").eq("id", id).maybeSingle();
  if (!b || (nd.chiNhanhId && b.chi_nhanh_id && b.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const xemYKhoa = coQuyen(nd, "hoso.xem");
  const [{ data: kh }, { data: nv }, { data: dv }] = await Promise.all([
    db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").eq("id", b.khach_id).maybeSingle(),
    db.from("nhan_vien").select("id, ho_ten"),
    b.dich_vu_id ? db.from("dich_vu").select("ten").eq("id", b.dich_vu_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (xemYKhoa && b.chan_doan) await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "xem_bien_chung", doi_tuong: "bien_chung", doi_tuong_id: id });
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tt = TT_BC[b.trang_thai], bacSi = coQuyen(nd, "bc.xu_ly");
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/khieu-nai?tab=bien-chung", nhan: "Khiếu nại & biến chứng" }} tieuDe={`Biến chứng ${b.ma}`} phu={<span className="flex flex-wrap items-center gap-2"><NhanTrangThai kieu={tt.kieu}>{tt.ten}</NhanTrangThai><span>ưu tiên cao nhất: y tế trước, thương mại sau</span></span>}>
        {bacSi && ["moi", "dang_xu_ly"].includes(b.trang_thai) && <NutHop nhan={b.trang_thai === "moi" ? "Khám & lập phương án" : "Sửa phần khám"} tieuDe="Khám, chẩn đoán, phương án (BM18)" action={khamBienChung} an={{ id: b.id }} giaTri={{ chan_doan: b.chan_doan ?? "", phuong_an: b.phuong_an ?? "" }} rong truong={truongKham()} />}
        {bacSi && b.trang_thai === "dang_xu_ly" && <NutHop kieu="phu" nhan="Cam kết với khách" tieuDe="Cam kết mức khắc phục" action={camKetBienChung} an={{ id: b.id }} rong truong={truongCamKet()} />}
        {bacSi && b.trang_thai === "da_cam_ket" && <NutHop nhan="Đóng ca" tieuDe="Đóng ca biến chứng" moTa="Ghi nguyên nhân gốc và hành động phòng ngừa để không lặp lại." action={dongBienChung} an={{ id: b.id }} rong truong={truongDongBc()} nhanLuu="Đóng" />}
      </TieuDeNoi>
      {b.trang_thai === "moi" && !bacSi && <p role="status" className="mb-4 rounded-nho border border-loi/30 bg-loi-nen px-4 py-3 text-[14px] text-loi">Đã báo bác sĩ và lãnh đạo lúc {ngayGioVN(b.bao_lanh_dao_luc)}. Đưa khách đến bác sĩ ngay, không tự xử lý.</p>}
      <TienDo buoc={BUOC_BC} hienTai={tt.buoc} />
      <div className="max-w-3xl">
        <Khoi tieuDe="Khách">{kh ? <Link href={`/khach-hang/${kh.id}?tab=khieu-nai`} className="font-medium text-nhan-dam hover:underline">{kh.ho_ten}</Link> : ""}{kh ? ` · ${kh.ma} · ${kh.dien_thoai}` : ""}{dv ? ` · dịch vụ ${dv.ten}` : ""}</Khoi>
        <Khoi tieuDe="Dấu hiệu bất thường">{`${b.dau_hieu}\n(báo bởi ${ten.get(b.nguoi_bao_id) ?? ""}, ${ngayGioVN(b.bao_luc)}; đã báo lãnh đạo ${ngayGioVN(b.bao_lanh_dao_luc)})`}</Khoi>
        {b.khieu_nai_id && <Khoi tieuDe="Nguồn">Chuyển từ <Link href={`/khieu-nai/${b.khieu_nai_id}`} className="text-nhan-dam underline">khiếu nại y khoa</Link></Khoi>}
        {b.chan_doan && (xemYKhoa ? (
          <>
            <Khoi tieuDe={`Chẩn đoán · bác sĩ ${ten.get(b.bac_si_id ?? "") ?? ""}`}>{b.chan_doan}</Khoi>
            <Khoi tieuDe="Phương án khắc phục">{b.phuong_an}</Khoi>
            {b.cam_ket && <Khoi tieuDe="Cam kết với khách">{b.cam_ket}</Khoi>}
            {b.trang_thai === "dong" && <Khoi tieuDe="Nguyên nhân gốc & phòng ngừa">{`${b.nguyen_nhan_goc}\nPhòng ngừa: ${b.phong_ngua}`}</Khoi>}
          </>
        ) : <Khoi tieuDe="Phần chuyên môn">Bác sĩ đã ghi chẩn đoán và phương án. Nội dung này là dữ liệu sức khoẻ, chỉ người được xem hồ sơ điều trị mới đọc được.</Khoi>)}
      </div>
    </div>
  );
}
