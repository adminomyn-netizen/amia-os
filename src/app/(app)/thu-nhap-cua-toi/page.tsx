import Link from "next/link";
import { CalendarDays, Info, Wallet } from "lucide-react";
import { yeuCauNoiBo } from "@/lib/auth";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { chonThang, layBangThang, NHOM_HH, type NhomHh } from "@/lib/cs-hoa-hong-tai";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { ChiTietNguoi } from "@/components/hoa-hong/cs/ChiTietNguoi";
import { DaiLienKet, OSo, The, tien } from "@/components/hoa-hong/cs/KhoiCs";
import { lienKetCs } from "@/components/hoa-hong/cs/lien-ket";

/** Thu nhập tạm tính của chính mình trong tháng (dự thảo, cập nhật theo số liệu hằng ngày): lương theo công đến hôm nay + hoa hồng, thưởng, phí trị liệu theo chính sách.
 *  Chỉ là ước tính trước thuế và BHXH; số thực nhận theo bảng lương Kế toán chốt. */
export default async function TrangThuNhapCuaToi({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const [nd, sp] = await Promise.all([yeuCauNoiBo(), searchParams]);
  const hom = homNayHCM(), { nam, thang, khoa } = chonThang(sp.thang, hom);
  const cuoi = new Date(Date.UTC(nam, thang, 0)).toISOString().slice(0, 10);
  const db = sb();
  const [b, { data: nv }, { data: dk }, { data: ky }, cong] = await Promise.all([
    layBangThang(nam, thang, hom),
    db.from("nhan_vien").select("ho_ten, chuc_danh, nhom_hh, chi_nhanh_id").eq("id", nd.nhanVienId).maybeSingle(),
    db.from("dieu_kien_luong").select("luong_co_ban, tinh_trang, ty_le_thu_viec, an_ca_ngay, dong_phuc_cap, nha_o_cap, hieu_luc_tu").eq("nhan_vien_id", nd.nhanVienId).lte("hieu_luc_tu", cuoi).order("hieu_luc_tu", { ascending: false }).limit(1).maybeSingle(),
    db.from("ky_luong").select("cong_chuan, trang_thai").eq("nam", nam).eq("thang", thang).maybeSingle(),
    db.rpc("tong_hop_cong", { p_nam: nam, p_thang: thang }).then((r) => (r.data ?? []).find((x) => x.nhan_vien_id === nd.nhanVienId) ?? null, () => null),
  ]);
  const r = b.nhanVien.find((x) => x.id === nd.nhanVienId) ?? { id: nd.nhanVienId, ten: nv?.ho_ten ?? nd.hoTen, chucDanh: nv?.chuc_danh ?? "", nhom: (nv?.nhom_hh as NhomHh | null) ?? null, cn: nv?.chi_nhanh_id ?? null, khoan: [], tong: 0, dsBan: 0, chiTieu: null, datDk: true };
  const chuan = Number(ky?.cong_chuan ?? 26), soCong = Math.min(Number(cong?.cong_tinh_luong ?? 0), chuan);
  const lcb = Number(dk?.luong_co_ban ?? 0), heSoTv = dk?.tinh_trang === "thu_viec" ? Number(dk.ty_le_thu_viec ?? 100) / 100 : 1;
  const luongCong = Math.round(lcb * soCong / chuan * heSoTv), anCa = Math.ceil(soCong * Number(dk?.an_ca_ngay ?? 0) / 1000) * 1000;
  const phuCap = Math.round(Number(dk?.dong_phuc_cap ?? 0) / chuan * soCong) + Math.round(Number(dk?.nha_o_cap ?? 0) / chuan * soCong);
  const tong = luongCong + anCa + phuCap + r.tong;
  return (
    <div>
      <TieuDeNoi icon={Wallet} tieuDe="Thu nhập tạm tính của tôi" so={`${String(thang).padStart(2, "0")}/${nam}`}
        phu={<>Dự thảo cập nhật theo số liệu đến {b.den.split("-").reverse().join("/")}: lương theo công đã chấm + hoa hồng, thưởng, phí trị liệu theo chính sách. Chưa trừ thuế, BHXH, tạm ứng. Số thực nhận theo bảng lương Kế toán chốt.</>}>
        <div className="flex gap-1">
          {(() => { const tr = thang === 1 ? `${nam - 1}-12` : `${nam}-${String(thang - 1).padStart(2, "0")}`; return tr >= "2026-11" ? <Link href={`/thu-nhap-cua-toi?thang=${tr}`} className="flex h-10 items-center rounded-nho border border-vien-dam px-3 text-[13.5px] hover:bg-giay-tram">Tháng trước</Link> : null; })()}
          {khoa < hom.slice(0, 7) && <Link href="/thu-nhap-cua-toi" className="flex h-10 items-center rounded-nho border border-vien-dam px-3 text-[13.5px] hover:bg-giay-tram">Tháng này</Link>}
        </div>
      </TieuDeNoi>
      <DaiLienKet muc={lienKetCs(nd)} dang="/thu-nhap-cua-toi" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OSo toi nhan="Tổng tạm tính (trước thuế, BHXH)" so={tien(tong)} phu={b.tamTinh ? "tăng dần theo ngày công và doanh số" : "đủ tháng"} />
        <OSo nhan="Lương theo công" so={tien(luongCong)} phu={dk ? `${soCong.toLocaleString("vi-VN")} / ${chuan} công${heSoTv < 1 ? ` · thử việc ${Math.round(heSoTv * 100)}%` : ""}` : "chưa có điều kiện lương"} />
        <OSo nhan="Ăn ca, phụ cấp" so={tien(anCa + phuCap)} phu="theo công đến hôm nay" />
        <OSo nhan="Hoa hồng, thưởng, phí trị liệu" so={tien(r.tong)} phu={r.nhom ? NHOM_HH[r.nhom] : "chưa xếp nhóm hưởng"} />
      </div>
      <ChiTietNguoi r={r} b={b} />
      <The icon={Info} mau="dat" tieuDe="Cách đọc số này">
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-muc-2">
          <li className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muc-3" />Số tự cập nhật khi có thêm ngày công, hoá đơn và ca dịch vụ (trễ tối đa vài phút).</li>
          <li>· Hoa hồng tính trên tiền thực thu; đơn chưa thu đủ chỉ tính phần đã thu. Dịch vụ chưa có giá khuyến mại đang tạm tính mức giá khuyến mại.</li>
          <li>· Doanh số chi nhánh, chỉ tiêu, điều kiện thưởng và ca không tính phí theo số Kế toán, Giám đốc chi nhánh chốt — số cuối tháng có thể khác.</li>
          <li>· Thấy sai lệch: báo Phòng HCNS trong 02 ngày làm việc kể từ khi nhận bảng phí (Quy định phí trị liệu, Điều 5).</li>
          <li>· Xem toàn văn: <Link href="/hoa-hong/chinh-sach" className="text-nhan-dam underline">Chính sách hoa hồng & phí trị liệu</Link>.</li>
        </ul>
      </The>
    </div>
  );
}
