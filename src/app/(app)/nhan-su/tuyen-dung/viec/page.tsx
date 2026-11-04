import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { soNgayGiua } from "@/lib/lich-hr";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

type Viec = { khoa: string; viec: string; doiTuong: string; han: string; ai: string };

/** Việc cần làm của các đợt tuyển, tự suy ra từ ứng viên, tin và yêu cầu (không nhập tay): gọi sàng lọc, phỏng vấn, chốt đề nghị, xử lý tin quá hạn, tiếp nhận yêu cầu. Quá hạn xếp trước. */
export default async function TrangViecTuyenDung() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem việc tuyển dụng.</p>;
  const db = sb(), hom = homNayHCM();
  const trongPham = (cn: string | null) => !nd.chiNhanhId || !cn || cn === nd.chiNhanhId;
  const [{ data: tinAll }, { data: ycAll }] = await Promise.all([db.from("tin_tuyen_dung").select("id, vi_tri, chi_nhanh_id, han_nop, trang_thai"), db.from("yeu_cau_tuyen_dung").select("id, vi_tri, chi_nhanh_id, trang_thai, tao_luc")]);
  const tins = (tinAll ?? []).filter((t) => trongPham(t.chi_nhanh_id)), tin = new Map(tins.map((t) => [t.id, t]));
  const { data: uvAll } = tins.length ? await db.from("ung_vien").select("id, tin_id, ho_ten, trang_thai, ngay_nhan_ho_so, ngay_phong_van, tao_luc").in("tin_id", tins.map((t) => t.id)).in("trang_thai", ["Mới nộp", "Hẹn phỏng vấn", "Vòng 1", "Vòng 2", "Đề nghị"]) : { data: [] };
  const ds: Viec[] = [];
  for (const u of uvAll ?? []) {
    const vt = tin.get(u.tin_id)?.vi_tri ?? "";
    if (u.trang_thai === "Mới nộp") ds.push({ khoa: u.id, viec: "Gọi sàng lọc ứng viên mới", doiTuong: `${u.ho_ten} · ${vt}`, han: congNgay(u.ngay_nhan_ho_so, 2), ai: "Nhân sự tuyển dụng" });
    else if (u.trang_thai === "Hẹn phỏng vấn") ds.push({ khoa: u.id, viec: "Phỏng vấn", doiTuong: `${u.ho_ten} · ${vt}`, han: u.ngay_phong_van ?? congNgay(u.ngay_nhan_ho_so, 3), ai: "Người phỏng vấn" });
    else if (u.trang_thai === "Đề nghị") ds.push({ khoa: u.id, viec: "Chốt đề nghị nhận việc", doiTuong: `${u.ho_ten} · ${vt}`, han: congNgay(u.tao_luc.slice(0, 10), 3), ai: "Nhân sự tuyển dụng" });
    else ds.push({ khoa: u.id, viec: `Đánh giá sau ${u.trang_thai}`, doiTuong: `${u.ho_ten} · ${vt}`, han: congNgay(u.tao_luc.slice(0, 10), 5), ai: "Người phỏng vấn" });
  }
  for (const t of tins) if (t.trang_thai !== "Đã đóng" && t.han_nop && t.han_nop < hom) ds.push({ khoa: t.id, viec: "Tin quá hạn nộp: đóng hoặc gia hạn", doiTuong: t.vi_tri, han: t.han_nop, ai: "Nhân sự tuyển dụng" });
  for (const y of (ycAll ?? []).filter((x) => trongPham(x.chi_nhanh_id) && x.trang_thai === "Chờ tiếp nhận")) ds.push({ khoa: y.id, viec: "Tiếp nhận yêu cầu tuyển", doiTuong: y.vi_tri, han: congNgay(y.tao_luc.slice(0, 10), 1), ai: "Hành chính nhân sự" });
  ds.sort((a, b) => a.han.localeCompare(b.han));
  const qua = ds.filter((d) => d.han < hom).length;
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su/tuyen-dung", nhan: "Tuyển dụng" }} tieuDe="Công việc tuyển dụng" phu={`${ds.length} việc cần làm, ${qua} việc đã quá hạn. Danh sách tự cập nhật theo bước của ứng viên, không cần nhập tay.`} />
      <Bang noi duLieu={ds} khoa={(r) => r.khoa} trong="Không có việc nào đang chờ."
        cot={[
          { nhan: "Việc", chinh: true, hienThi: (r) => r.viec }, { nhan: "Đối tượng", hienThi: (r) => r.doiTuong }, { nhan: "Ai làm", hienThi: (r) => r.ai },
          { nhan: "Hạn", hienThi: (r) => ngayVN(r.han) },
          { nhan: "", hienThi: (r) => { const n = soNgayGiua(hom, r.han); return <NhanTrangThai kieu={n < 0 ? "loi" : n <= 1 ? "cho" : "tram"}>{n < 0 ? `Quá ${-n} ngày` : n === 0 ? "Hôm nay" : `Còn ${n} ngày`}</NhanTrangThai>; } },
        ]} />
    </div>
  );
}
