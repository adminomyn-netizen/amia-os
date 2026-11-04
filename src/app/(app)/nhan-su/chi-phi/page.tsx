import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, tienVN } from "@/lib/dinh-dang";
import { dsNvTrongPham } from "@/lib/hr-pham-vi";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";

/** Chi phí nhân sự 6 tháng gần nhất: lương thực trả, BHXH người lao động, thưởng chi, phạt thu, chi phí đăng tin tuyển dụng. Lấy từ bảng lương, sổ khen thưởng–kỷ luật và kênh đăng tin; khoá theo chi nhánh. */
export default async function TrangChiPhiNhanSu() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "baocao.tien")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem chi phí nhân sự.</p>;
  const db = sb(), hom = homNayHCM();
  const nam0 = Number(hom.slice(0, 4)), thang0 = Number(hom.slice(5, 7));
  const thangs = Array.from({ length: 6 }, (_, i) => { const t = thang0 - i; return t >= 1 ? { nam: nam0, thang: t } : { nam: nam0 - 1, thang: t + 12 }; });
  const nv = await dsNvTrongPham(nd.chiNhanhId, false), ids = nv.map((n) => n.id);
  const KHONG = ["00000000-0000-0000-0000-000000000000"];
  const tu = `${thangs[5].nam}-${String(thangs[5].thang).padStart(2, "0")}-01`;
  const [{ data: ky }, { data: tp }, { data: kenh }, { data: tin }] = await Promise.all([
    db.from("ky_luong").select("id, nam, thang").gte("nam", thangs[5].nam),
    ids.length ? db.from("hr_thuong_phat").select("nam, thang, khoan_chi, khoan_thu").in("nhan_vien_id", ids).gte("nam", thangs[5].nam) : { data: [] },
    db.from("dang_tin_kenh").select("tin_id, chi_phi, ngay_dang").gte("ngay_dang", tu),
    nd.chiNhanhId ? db.from("tin_tuyen_dung").select("id").eq("chi_nhanh_id", nd.chiNhanhId) : db.from("tin_tuyen_dung").select("id"),
  ]);
  const kyIds = (ky ?? []).map((k) => k.id);
  const { data: dong } = kyIds.length && ids.length ? await db.from("bang_luong_dong").select("ky_id, thuc_tra, bhxh_nld").in("ky_id", kyIds).in("nhan_vien_id", ids.length ? ids : KHONG) : { data: [] };
  const tinOk = new Set((tin ?? []).map((t) => t.id));
  const hang = thangs.map(({ nam, thang }) => {
    const k = (ky ?? []).find((x) => x.nam === nam && x.thang === thang);
    const l = (dong ?? []).filter((d) => d.ky_id === k?.id);
    const t = (tp ?? []).filter((x) => x.nam === nam && x.thang === thang);
    const pre = `${nam}-${String(thang).padStart(2, "0")}`;
    return {
      ky: `${String(thang).padStart(2, "0")}/${nam}`, coKy: !!k,
      luong: l.reduce((s, d) => s + Number(d.thuc_tra), 0), bhxh: l.reduce((s, d) => s + Number(d.bhxh_nld), 0),
      thuong: t.reduce((s, x) => s + Number(x.khoan_chi ?? 0), 0), phat: t.reduce((s, x) => s + Number(x.khoan_thu ?? 0), 0),
      tuyen: (kenh ?? []).filter((x) => x.ngay_dang.startsWith(pre) && tinOk.has(x.tin_id)).reduce((s, x) => s + Number(x.chi_phi), 0),
    };
  });
  const tong = hang.reduce((s, h) => s + h.luong + h.thuong + h.tuyen, 0);
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Chi phí nhân sự" phu={`6 tháng gần nhất. Tổng lương thực trả, thưởng chi và chi phí tuyển dụng: ${tienVN(tong)}. Tháng chưa lập kỳ lương thì cột lương để "—".`} />
      <Bang duLieu={hang} khoa={(r) => r.ky} cot={[
        { nhan: "Tháng", chinh: true, hienThi: (r) => r.ky }, { nhan: "Lương thực trả", phai: true, hienThi: (r) => (r.coKy ? tienVN(r.luong) : "—") },
        { nhan: "BHXH người lao động", phai: true, hienThi: (r) => (r.coKy ? tienVN(r.bhxh) : "—") }, { nhan: "Thưởng chi", phai: true, hienThi: (r) => tienVN(r.thuong) },
        { nhan: "Phạt thu", phai: true, hienThi: (r) => tienVN(r.phat) }, { nhan: "Chi phí tuyển dụng", phai: true, hienThi: (r) => tienVN(r.tuyen) },
      ]} />
    </div>
  );
}
