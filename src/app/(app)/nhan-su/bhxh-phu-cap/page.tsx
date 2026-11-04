import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, tienVN } from "@/lib/dinh-dang";
import { dsNvTrongPham } from "@/lib/hr-pham-vi";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

/** BHXH và phụ cấp hiện hành của từng người, đọc từ điều kiện lương mới nhất (sửa ở Cài đặt lương cơ bản). Chỉ xem, không có số riêng để khỏi lệch với bảng lương. */
export default async function TrangBhxhPhuCap() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "luong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem BHXH và phụ cấp.</p>;
  const db = sb(), hom = homNayHCM();
  const nv = await dsNvTrongPham(nd.chiNhanhId, true);
  const ids = nv.map((n) => n.id);
  const [{ data: dk }, { data: ch }] = await Promise.all([
    ids.length ? db.from("dieu_kien_luong").select("nhan_vien_id, hieu_luc_tu, tinh_trang, dong_bh, luong_dong_bh, an_ca_ngay, dong_phuc_cap, nha_o_cap, so_npt").in("nhan_vien_id", ids).lte("hieu_luc_tu", hom).order("hieu_luc_tu", { ascending: false }) : { data: [] },
    db.from("cau_hinh").select("gia_tri").eq("khoa", "luong.bhxh_nld_pct").maybeSingle(),
  ]);
  const moiNhat = new Map<string, NonNullable<typeof dk>[number]>();
  for (const d of dk ?? []) if (!moiNhat.has(d.nhan_vien_id)) moiNhat.set(d.nhan_vien_id, d);
  const pct = Number(ch?.gia_tri ?? 10.5);
  const dong = nv.map((n) => ({ n, d: moiNhat.get(n.id) })).filter((r) => r.d);
  const dongBh = dong.filter((r) => r.d!.dong_bh);
  const tongBh = dongBh.reduce((s, r) => s + Math.round((Number(r.d!.luong_dong_bh) * pct) / 100), 0);
  const tongPc = dong.reduce((s, r) => s + Number(r.d!.dong_phuc_cap) + Number(r.d!.nha_o_cap), 0);
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="BHXH và phụ cấp" phu={`${dongBh.length} người đang đóng BHXH, phần người lao động ${pct}% khoảng ${tienVN(tongBh)} mỗi tháng. Phụ cấp đồng phục và nhà ở cộng lại ${tienVN(tongPc)} mỗi tháng.`}>
        {coQuyen(nd, "luong.sua") && <Link href="/nhan-su/luong/dieu-kien" className="text-[14px] text-nhan-dam hover:underline">Sửa ở Cài đặt lương cơ bản</Link>}
      </TieuDeNoi>
      <Bang duLieu={dong} khoa={(r) => r.n.id} trong="Chưa có điều kiện lương nào."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{r.n.ho_ten}<div className="text-[12.5px] text-muc-3">{r.n.ma_nv}</div></div> },
          { nhan: "BHXH", hienThi: (r) => (r.d!.dong_bh ? <NhanTrangThai kieu="tot">Đóng</NhanTrangThai> : <NhanTrangThai kieu="tram">Không đóng</NhanTrangThai>) },
          { nhan: "Lương đóng BH", phai: true, hienThi: (r) => (r.d!.dong_bh ? tienVN(r.d!.luong_dong_bh) : "—") },
          { nhan: "BH người lao động", phai: true, hienThi: (r) => (r.d!.dong_bh ? tienVN(Math.round((Number(r.d!.luong_dong_bh) * pct) / 100)) : "—") },
          { nhan: "Ăn ca / ngày", phai: true, hienThi: (r) => tienVN(r.d!.an_ca_ngay) }, { nhan: "Đồng phục", phai: true, hienThi: (r) => tienVN(r.d!.dong_phuc_cap) },
          { nhan: "Nhà ở", phai: true, hienThi: (r) => tienVN(r.d!.nha_o_cap) }, { nhan: "Người phụ thuộc", phai: true, hienThi: (r) => r.d!.so_npt },
        ]} />
    </div>
  );
}
