import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { LOAI_NGHI } from "@/lib/nhan-su";
import { GIAI_DOAN_HD, THU_TU_HD, tinhHieuLuc } from "@/lib/van-ban";
import { kyDanhGiaSapToi, sinhNhatTiep, soNgayGiua, tuoiSapToi } from "@/lib/lich-hr";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

const TAB = [
  { ma: "hdld", ten: "HĐLĐ đến hạn" },
  { ma: "sinh-nhat", ten: "Sinh nhật" },
  { ma: "nghi-phep", ten: "Lịch nghỉ phép" },
  { ma: "thu-viec", ten: "Hết hạn thử việc" },
  { ma: "danh-gia", ten: "Đánh giá định kỳ" },
] as const;
const THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const thuCua = (d: string) => THU[new Date(`${d}T00:00:00Z`).getUTCDay()];
const conLai = (n: number) => (n === 0 ? "Hôm nay" : n === 1 ? "Ngày mai" : n < 0 ? `Quá ${-n} ngày` : `Còn ${n} ngày`);

/** Lịch nhân sự: những ngày cần để ý trong 45 ngày tới. Tính từ dữ liệu hợp đồng, hồ sơ, phiếu nghỉ, ngày vào làm; khoá theo chi nhánh người xem. */
export default async function TrangLichNhanSu({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "cong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem lịch nhân sự.</p>;
  const tabYeuCau = (await searchParams).tab;
  const tab = TAB.find((t) => t.ma === tabYeuCau)?.ma ?? "hdld";
  const db = sb(), hom = homNayHCM();
  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, ngay_vao_lam, ngay_vao_chinh_thuc").eq("hoat_dong", true).order("ho_ten");
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data: nvAll } = await qn;
  const nv = nvAll ?? [], ids = nv.map((n) => n.id), ten = new Map(nv.map((n) => [n.id, n]));
  const ten1 = (id: string) => ten.get(id);

  let noiDung: React.ReactNode = null;
  if (tab === "hdld") {
    const [{ data: hd }, { data: ch }] = await Promise.all([db.from("hd_lao_dong").select("nhan_vien_id, giai_doan, so_hd, tu_ngay, den_ngay").in("nhan_vien_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]), db.from("cau_hinh").select("gia_tri").eq("khoa", "hd.nhac_truoc_ngay").maybeSingle()]);
    const truoc = Number(ch?.gia_tri ?? 45);
    const moiNhat = new Map<string, NonNullable<typeof hd>[number]>();
    for (const h of hd ?? []) { const c = moiNhat.get(h.nhan_vien_id); if (!c || THU_TU_HD.indexOf(h.giai_doan as never) > THU_TU_HD.indexOf(c.giai_doan as never)) moiNhat.set(h.nhan_vien_id, h); }
    const dong = [...moiNhat.values()].filter((h) => h.giai_doan !== "kxd" && h.den_ngay && tinhHieuLuc(h.den_ngay, hom, congNgay, truoc) !== "con").map((h) => ({ h, n: soNgayGiua(hom, h.den_ngay!) })).sort((a, b) => a.n - b.n);
    noiDung = <Bang duLieu={dong} khoa={(r) => r.h.nhan_vien_id} trong={`Không có hợp đồng nào hết hạn trong ${truoc} ngày tới.`} cot={[
      { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{ten1(r.h.nhan_vien_id)?.ho_ten}<div className="text-[12.5px] text-muc-3">{ten1(r.h.nhan_vien_id)?.ma_nv}</div></div> },
      { nhan: "Hợp đồng", hienThi: (r) => `${GIAI_DOAN_HD[r.h.giai_doan] ?? r.h.giai_doan}${r.h.so_hd ? ` · ${r.h.so_hd}` : ""}` },
      { nhan: "Hết hạn", hienThi: (r) => `${ngayVN(r.h.den_ngay)} (${thuCua(r.h.den_ngay!)})` },
      { nhan: "Tình trạng", hienThi: (r) => <NhanTrangThai kieu={r.n < 0 ? "loi" : "cho"}>{conLai(r.n)}</NhanTrangThai> },
      { nhan: "", hienThi: () => <Link href="/nhan-su/hop-dong" className="text-[13px] font-medium text-nhan-dam hover:underline">Gia hạn / thêm HĐ</Link> },
    ]} />;
  } else if (tab === "sinh-nhat") {
    const { data: hs } = await db.from("nhan_vien_ho_so").select("nhan_vien_id, ngay_sinh").in("nhan_vien_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).not("ngay_sinh", "is", null);
    const dong = (hs ?? []).map((h) => { const t = sinhNhatTiep(h.ngay_sinh!, hom); return { id: h.nhan_vien_id, ngaySinh: h.ngay_sinh!, tiep: t, n: soNgayGiua(hom, t), tuoi: tuoiSapToi(h.ngay_sinh!, hom) }; }).filter((r) => r.n <= 45).sort((a, b) => a.n - b.n);
    noiDung = <Bang duLieu={dong} khoa={(r) => r.id} trong="Không có sinh nhật trong 45 ngày tới (hoặc chưa ai điền ngày sinh trong hồ sơ)." cot={[
      { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{ten1(r.id)?.ho_ten}<div className="text-[12.5px] text-muc-3">{ten1(r.id)?.ma_nv}</div></div> },
      { nhan: "Ngày", hienThi: (r) => `${ngayVN(r.tiep).slice(0, 5)} (${thuCua(r.tiep)})` },
      { nhan: "Tuổi", phai: true, hienThi: (r) => `${r.tuoi}` },
      { nhan: "", hienThi: (r) => <NhanTrangThai kieu={r.n === 0 ? "tot" : "tram"}>{conLai(r.n)}</NhanTrangThai> },
    ]} />;
  } else if (tab === "nghi-phep") {
    const den = congNgay(hom, 30);
    const { data: ph } = await db.from("phieu_hr").select("id, nhan_vien_id, loai_nghi, tu_ngay, den_ngay, so_ngay").eq("loai", "nghi").eq("trang_thai", "da_duyet").lte("tu_ngay", den).gte("den_ngay", hom).in("nhan_vien_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).order("tu_ngay");
    noiDung = <Bang duLieu={ph ?? []} khoa={(r) => r.id} trong="Không ai nghỉ trong 30 ngày tới (phiếu đã duyệt)." cot={[
      { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{ten1(r.nhan_vien_id)?.ho_ten}<div className="text-[12.5px] text-muc-3">{ten1(r.nhan_vien_id)?.ma_nv}</div></div> },
      { nhan: "Loại nghỉ", hienThi: (r) => LOAI_NGHI[r.loai_nghi ?? ""] ?? "Nghỉ" },
      { nhan: "Từ – đến", hienThi: (r) => (r.tu_ngay === r.den_ngay ? ngayVN(r.tu_ngay) : `${ngayVN(r.tu_ngay)} – ${ngayVN(r.den_ngay)}`) },
      { nhan: "Số ngày", phai: true, hienThi: (r) => `${r.so_ngay}` },
      { nhan: "", hienThi: (r) => (r.tu_ngay <= hom ? <NhanTrangThai kieu="cho">Đang nghỉ</NhanTrangThai> : <NhanTrangThai kieu="tram">{conLai(soNgayGiua(hom, r.tu_ngay))}</NhanTrangThai>) },
    ]} />;
  } else if (tab === "thu-viec") {
    const { data: hd } = await db.from("hd_lao_dong").select("nhan_vien_id, den_ngay").eq("giai_doan", "thu_viec").in("nhan_vien_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const hdTv = new Map((hd ?? []).map((h) => [h.nhan_vien_id, h.den_ngay]));
    // Đang thử việc = chưa có ngày chính thức. Ngày hết hạn: theo HĐ thử việc nếu có, không thì 60 ngày từ ngày vào làm.
    const dong = nv.filter((n) => n.ngay_vao_lam && !n.ngay_vao_chinh_thuc).map((n) => { const het = hdTv.get(n.id) ?? congNgay(n.ngay_vao_lam!, 60); return { n, het, d: soNgayGiua(hom, het) }; }).filter((r) => r.d <= 45 && r.d >= -30).sort((a, b) => a.d - b.d);
    noiDung = <Bang duLieu={dong} khoa={(r) => r.n.id} trong="Không ai sắp hết hạn thử việc trong 45 ngày tới." cot={[
      { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{r.n.ho_ten}<div className="text-[12.5px] text-muc-3">{r.n.ma_nv}</div></div> },
      { nhan: "Vào làm", hienThi: (r) => ngayVN(r.n.ngay_vao_lam) },
      { nhan: "Hết thử việc", hienThi: (r) => `${ngayVN(r.het)} (${thuCua(r.het)})` },
      { nhan: "Tình trạng", hienThi: (r) => <NhanTrangThai kieu={r.d < 0 ? "loi" : r.d <= 7 ? "cho" : "tram"}>{conLai(r.d)}</NhanTrangThai> },
      { nhan: "", hienThi: () => <Link href="/nhan-su/onboarding" className="text-[13px] font-medium text-nhan-dam hover:underline">Onboarding</Link> },
    ]} />;
  } else {
    const ky = kyDanhGiaSapToi(hom, 8).map((k) => ({ ...k, n: soNgayGiua(hom, k.ngay) }));
    noiDung = <Bang duLieu={ky} khoa={(r) => r.ngay} cot={[
      { nhan: "Kỳ", chinh: true, hienThi: (r) => r.nhan },
      { nhan: "Chốt vào", hienThi: (r) => `${ngayVN(r.ngay)} (${thuCua(r.ngay)})` },
      { nhan: "Việc cần làm", hienThi: (r) => (r.loai === "quy" ? "Chốt KPI quý, xếp hạng phòng và cá nhân, xét thưởng quý" : "Chốt KPI tháng, xếp hạng phòng và cá nhân") },
      { nhan: "", hienThi: (r) => <NhanTrangThai kieu={r.n <= 3 ? "cho" : "tram"}>{conLai(r.n)}</NhanTrangThai> },
    ]} />;
  }

  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Lịch nhân sự" phu="Những ngày cần để ý: hợp đồng sắp hết hạn, sinh nhật, người nghỉ phép, hết thử việc và kỳ đánh giá." />
      <nav aria-label="Các lịch" className="mb-5 flex flex-wrap gap-2">
        {TAB.map((t) => (
          <Link key={t.ma} href={`/nhan-su/lich?tab=${t.ma}`} aria-current={t.ma === tab ? "page" : undefined}
            className={`rounded-nho border px-3.5 py-2 text-[14px] transition-colors ${t.ma === tab ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>
        ))}
      </nav>
      {noiDung}
    </div>
  );
}
