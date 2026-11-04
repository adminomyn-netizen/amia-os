import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM } from "@/lib/dinh-dang";
import { KET_QUA_TV, truongPhieuTuVan } from "@/lib/tu-van";
import { NutHop } from "@/components/ui/BieuMau";
import { DanhSachPhieuTuVan, gomNhuCau } from "@/components/khach/PhieuTuVan";
import { luuPhieuTuVan } from "./actions";

const MOI_LAN = 300;

/** /khach-hang/tu-van — sổ phiếu tư vấn theo phễu: lọc theo kết quả; mỗi phiếu mở được để cập nhật. Báo cáo tỉ lệ chốt ở Báo cáo › Tỉ lệ chốt tư vấn. */
export default async function SoTuVan({ searchParams }: { searchParams: Promise<{ kq?: string }> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const { kq: k0 } = await searchParams;
  const kq = k0 && k0 in KET_QUA_TV ? k0 : "";
  const db = sb();
  let q = db.from("phieu_tu_van").select("*").order("ngay_tu_van", { ascending: false }).order("tao_luc", { ascending: false }).limit(MOI_LAN);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (kq) q = q.eq("ket_qua", kq);
  const [{ data: ds }, { data: nv }, { data: dv }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"), db.from("dich_vu").select("id, ma, ten").order("ma")]);
  const ids = (ds ?? []).map((p) => p.id), khIds = [...new Set((ds ?? []).map((p) => p.khach_id))];
  const [{ data: nc }, { data: kh }] = await Promise.all([
    ids.length ? db.from("phieu_tu_van_nhu_cau").select("phieu_id, noi_dung").in("phieu_id", ids).order("tao_luc") : Promise.resolve({ data: [] as { phieu_id: string; noi_dung: string }[] }),
    khIds.length ? db.from("khach_hang").select("id, ho_ten, ma").in("id", khIds) : Promise.resolve({ data: [] as { id: string; ho_ten: string; ma: string }[] }),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const nvLc = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten })), dvLc = (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` }));
  const sua = coQuyen(nd, "khach.sua");
  const cho = (ds ?? []).filter((p) => p.ket_qua === "cho_chot").length;
  const nut = (k: string, t: string) => <Link key={k} href={k ? `/khach-hang/tu-van?kq=${k}` : "/khach-hang/tu-van"} aria-current={kq === k ? "page" : undefined}
    className={`shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${kq === k ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`}>{t}</Link>;
  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Tư vấn khách hàng" icon={MessagesSquare} quayLai={{ href: "/khach-hang", nhan: "Danh sách khách" }} quayLaiDienThoai phu={<>Mỗi lần tư vấn là một phiếu: đặt vấn đề → phân tích → chứng minh → kết quả. Phiếu chỉ sửa, không xoá; mọi sửa đều có nhật ký.</>}>
        {sua && <NutHop nhan="Ghi phiếu tư vấn" tieuDe="Ghi phiếu tư vấn" rong action={luuPhieuTuVan} truong={truongPhieuTuVan(nvLc, dvLc, true)}
          giaTri={{ tu_van_vien_id: nd.nhanVienId, ngay_tu_van: homNayHCM(), ket_qua: "cho_chot" }} />}
      </TieuDeNoi>
      <nav aria-label="Lọc theo kết quả" className="flex gap-2 overflow-x-auto pb-1">
        {nut("", "Tất cả")}{Object.entries(KET_QUA_TV).map(([k, v]) => nut(k, v.ten))}
      </nav>
      {!kq && cho > 0 && <p className="text-[13px] text-muc-2">{cho} phiếu đang chờ chốt trong {MOI_LAN} phiếu mới nhất.</p>}
      <DanhSachPhieuTuVan phieu={ds ?? []} nhuCau={gomNhuCau(nc ?? [])} tenNv={tenNv} tenDv={tenDv} khach={new Map((kh ?? []).map((x) => [x.id, x]))} hienKhach
        truong={truongPhieuTuVan(nvLc, dvLc, false)} duocSua={sua} luu={luuPhieuTuVan} />
      {(ds ?? []).length >= MOI_LAN && <p className="text-[12px] text-muc-3">Chỉ hiện {MOI_LAN} phiếu mới nhất; lọc theo kết quả hoặc xem trong hồ sơ từng khách để tìm phiếu cũ hơn.</p>}
    </div>
  );
}
