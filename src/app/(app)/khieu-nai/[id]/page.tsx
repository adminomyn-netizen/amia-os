import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauMotTrong } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, tienVN } from "@/lib/dinh-dang";
import { BUOC_KN, CACH_XAC_NHAN, KENH_KN, LOAI_KN, TT_KN, gioTroi, soDuongHoacNull } from "@/lib/khieu-nai";
import { truongDeXuat, truongDong } from "@/lib/khieu-nai-form";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { TienDo } from "@/components/khieu-nai/TienDo";
import { deXuatPhuongAn, dongKhieuNai, duyetKhieuNai } from "../actions";

const Khoi = ({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) => (
  <section className="border-b border-vien py-4"><h2 className="nhan-muc mb-2">{tieuDe}</h2><div className="whitespace-pre-line text-[14.5px] text-muc">{children}</div></section>
);

/** Một khiếu nại (BM17) theo từng bước của QT-11: ai làm gì tiếp theo hiện ngay trên đầu trang. */
export default async function ChiTietKhieuNai({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauMotTrong(["kn.ghi", "kn.duyet"]);
  const { id } = await params;
  const db = sb();
  const { data: k } = await db.from("khieu_nai").select("*").eq("id", id).maybeSingle();
  if (!k || (nd.chiNhanhId && k.chi_nhanh_id && k.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: kh }, { data: nv }, { data: dv }, { data: ch }] = await Promise.all([
    db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").eq("id", k.khach_id).maybeSingle(),
    db.from("nhan_vien").select("id, ho_ten"),
    k.dich_vu_id ? db.from("dich_vu").select("ten").eq("id", k.dich_vu_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("cau_hinh").select("gia_tri").eq("khoa", "kn_sla_tiep_nhan_gio").maybeSingle(),
  ]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tt = TT_KN[k.trang_thai], sla = soDuongHoacNull(ch?.gia_tri), gio = gioTroi(k.tiep_nhan_luc);
  const lamDuoc = coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet");
  const duyetDuoc = coQuyen(nd, "kn.duyet") && k.nguoi_tiep_nhan_id !== nd.nhanVienId && k.nguoi_de_xuat_id !== nd.nhanVienId;
  return (
    <div>
      <Link href="/khieu-nai" className="text-[13px] text-muc-3 hover:text-muc">← Khiếu nại & biến chứng</Link>
      <TieuDeTrang tieuDe={`Khiếu nại ${k.ma}`} phu={<span className="flex flex-wrap items-center gap-2"><NhanTrangThai kieu={tt.kieu}>{tt.ten}</NhanTrangThai>{k.trang_thai === "moi" && <span>đã {gio} giờ{sla ? ` (hạn tiếp nhận ${sla} giờ)` : ""}</span>}</span>}>
        {lamDuoc && k.trang_thai === "moi" && <NutHop nhan="Đề xuất phương án" tieuDe="Xác minh và đề xuất phương án" moTa="Phân loại lại nếu cần, ghi nguyên nhân đã xác minh và phương án. Có chi phí thì chờ Quản lý duyệt." action={deXuatPhuongAn} an={{ id: k.id }} giaTri={{ loai: k.loai, nguyen_nhan: k.nguyen_nhan ?? "", phuong_an: k.phuong_an ?? "", co_chi_phi: k.co_chi_phi, chi_phi: k.chi_phi || "" }} rong truong={truongDeXuat()} />}
        {k.trang_thai === "cho_duyet" && duyetDuoc && (
          <>
            <NutHop kieu="chu" nhan="Duyệt" tieuDe="Duyệt phương án" xacNhan={`Duyệt phương án${k.chi_phi ? ` (chi phí ${tienVN(k.chi_phi)})` : ""}?`} action={duyetKhieuNai} an={{ id: k.id, quyet: "duyet" }} nhanLuu="Duyệt" />
            <NutHop kieu="chu" nguy nhan="Trả lại" tieuDe="Trả lại phương án" action={duyetKhieuNai} an={{ id: k.id, quyet: "tra_lai" }} truong={[{ ten: "ly_do", nhan: "Cần sửa gì", loai: "nhieu_dong", batBuoc: true, rong: true }]} nhanLuu="Trả lại" />
          </>
        )}
        {k.trang_thai === "da_duyet" && lamDuoc && <NutHop nhan="Khách xác nhận, đóng" tieuDe="Đóng khiếu nại" moTa="Chỉ đóng khi khách đã đồng ý với cách xử lý. Ghi nguyên nhân gốc để phòng ngừa." action={dongKhieuNai} an={{ id: k.id }} giaTri={{ cach_xac_nhan: "goi" }} rong truong={truongDong()} nhanLuu="Đóng" />}
      </TieuDeTrang>
      {k.trang_thai === "cho_duyet" && !duyetDuoc && <p role="status" className="mb-4 rounded-nho border border-vien bg-giay-tram px-4 py-3 text-[14px] text-muc-2">{coQuyen(nd, "kn.duyet") ? "Bạn là người ghi nhận hoặc đề xuất nên không tự duyệt. Nhờ một Quản lý khác." : "Đang chờ Quản lý duyệt phương án."}</p>}
      {k.ly_do_tra_lai && k.trang_thai === "moi" && <p role="status" className="mb-4 rounded-nho border border-loi/30 bg-loi-nen px-4 py-3 text-[14px] text-loi">Quản lý trả lại: {k.ly_do_tra_lai}</p>}
      {k.trang_thai === "chuyen_bc" && k.bien_chung_id && <p role="status" className="mb-4 rounded-nho border border-vien bg-giay-tram px-4 py-3 text-[14px] text-muc-2">Khiếu nại y khoa đã chuyển cho bác sĩ. <Link href={`/khieu-nai/bien-chung/${k.bien_chung_id}`} className="font-medium text-nhan-dam underline">Mở ca biến chứng</Link></p>}
      <TienDo buoc={BUOC_KN} hienTai={tt.buoc} />
      <div className="max-w-3xl">
        <Khoi tieuDe="Khách">{kh ? <Link href={`/khach-hang/${kh.id}?tab=khieu-nai`} className="font-medium text-nhan-dam hover:underline">{kh.ho_ten}</Link> : ""}{kh ? ` · ${kh.ma} · ${kh.dien_thoai}` : ""}</Khoi>
        <Khoi tieuDe="Tiếp nhận">{`${ngayGioVN(k.tiep_nhan_luc)} · ${ten.get(k.nguoi_tiep_nhan_id) ?? ""} · qua ${KENH_KN[k.kenh] ?? k.kenh} · loại ${LOAI_KN[k.loai]?.replace(" (chuyển biến chứng)", "")}${dv ? ` · dịch vụ ${dv.ten}` : ""}`}</Khoi>
        <Khoi tieuDe="Khách phản ánh">{k.noi_dung}</Khoi>
        {k.nguyen_nhan && <Khoi tieuDe="Nguyên nhân đã xác minh">{k.nguyen_nhan}</Khoi>}
        {k.phuong_an && <Khoi tieuDe={`Phương án${k.co_chi_phi ? ` · chi phí ${tienVN(k.chi_phi)}${k.can_duyet ? " · cần duyệt" : ""}` : ""}`}>{`${k.phuong_an}\n(đề xuất bởi ${ten.get(k.nguoi_de_xuat_id ?? "") ?? ""}, ${ngayGioVN(k.de_xuat_luc)})`}</Khoi>}
        {k.nguoi_duyet_id && <Khoi tieuDe="Duyệt">{`${ten.get(k.nguoi_duyet_id) ?? ""} · ${ngayGioVN(k.duyet_luc)}`}</Khoi>}
        {k.trang_thai === "dong" && <Khoi tieuDe="Đóng vụ việc">{`Khách đồng ý: ${CACH_XAC_NHAN[k.cach_xac_nhan ?? ""] ?? ""} · ${ngayGioVN(k.dong_luc)}\nNguyên nhân gốc: ${k.nguyen_nhan_goc}\nPhòng ngừa: ${k.phong_ngua}`}</Khoi>}
      </div>
    </div>
  );
}
