import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { chonThang, layBangThang, NHOM_HH, type NhomHh } from "@/lib/cs-hoa-hong-tai";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { ChiTietNguoi } from "@/components/hoa-hong/cs/ChiTietNguoi";

/** Tính thử hoa hồng + phí trị liệu của một người trong tháng (kế toán xem từng khoản trước khi chốt). */
export default async function TrangTinhThuNguoi({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thang?: string }> }) {
  const [nd, { id }, sp] = await Promise.all([yeuCauNoiBo(), params, searchParams]);
  if (!coQuyen(nd, "luong.xem") && id !== nd.nhanVienId) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem hoa hồng của người khác.</p>;
  const hom = homNayHCM(), { nam, thang, khoa } = chonThang(sp.thang, hom);
  const [b, { data: nv }] = await Promise.all([layBangThang(nam, thang, hom), sb().from("nhan_vien").select("id, ho_ten, chuc_danh, nhom_hh, chi_nhanh_id").eq("id", id).maybeSingle()]);
  if (!nv) notFound();
  const r = b.nhanVien.find((x) => x.id === id) ?? { id, ten: nv.ho_ten, chucDanh: nv.chuc_danh ?? "", nhom: (nv.nhom_hh as NhomHh | null) ?? null, cn: nv.chi_nhanh_id, khoan: [], tong: 0, dsBan: 0, chiTieu: null, datDk: true };
  return (
    <div>
      <TieuDeNoi icon={UserRound} quayLai={{ href: `/hoa-hong/thang?thang=${khoa}`, nhan: "Bảng tính tháng" }} tieuDe={r.ten} so={`${String(thang).padStart(2, "0")}/${nam}${b.tamTinh ? " · tạm tính" : ""}`}
        phu={`${r.nhom ? NHOM_HH[r.nhom] : "Chưa xếp nhóm hưởng"}. Tính thử theo chính sách từ 01/11/2026 với số liệu đến ${b.den.split("-").reverse().join("/")}.`} />
      <ChiTietNguoi r={r} b={b} />
    </div>
  );
}
