import Link from "next/link";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { capNhatXuLyNo } from "./actions";

/** 6 nhóm tuổi nợ và người phụ trách theo quy trình thu nợ (tuổi nợ tính từ ngày kế tiếp ngày đến hạn). */
const NHOM = [
  { ma: "chua", ten: "Chưa đến hạn", chu: "Theo dõi", den: 0 }, { ma: "1-7", ten: "1–7 ngày", chu: "Tư vấn nhắc", den: 7 }, { ma: "8-15", ten: "8–15 ngày", chu: "Trưởng bộ phận cùng nhắc", den: 15 },
  { ma: "16-30", ten: "16–30 ngày", chu: "Giám đốc chi nhánh cam kết phương án", den: 30 }, { ma: "31-60", ten: "31–60 ngày", chu: "Kế toán trưởng kiểm soát", den: 60 }, { ma: "60+", ten: "Trên 60 ngày", chu: "Ban Giám đốc quyết định thu hồi / dự phòng", den: 99999 },
] as const;
const TT: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = { dang_nhac: { ten: "Đang nhắc", kieu: "cho" }, da_cam_ket: { ten: "Đã cam kết", kieu: "tot" }, tranh_chap: { ten: "Đang tranh chấp", kieu: "loi" } };

export default async function TrangCongNoKhach() {
  const nd = await yeuCauQuyen("baocao.tien");
  const sua = coQuyen(nd, "no.thu");
  const db = sb(), hom = homNayHCM();
  let q = db.from("hoa_don").select("id, ma, khach_id, chi_nhanh_id, ngay_hd, con_no, tong_phai_thu").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("ngay_hd").limit(1000);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: hd }, { data: xl }, { data: ch }, { data: nv }] = await Promise.all([q, db.from("cong_no_khach_xu_ly").select("*"), db.from("cau_hinh").select("gia_tri").eq("khoa", "no_khach.han_ngay").maybeSingle(), db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten")]);
  const han = Number(ch?.gia_tri ?? 20);
  const ids = [...new Set((hd ?? []).map((h) => h.khach_id).filter(Boolean))] as string[];
  const { data: khach } = ids.length ? await db.from("khach_hang").select("id, ma, ho_ten").in("id", ids) : { data: [] as { id: string; ma: string; ho_ten: string }[] };
  const tenKhach = new Map((khach ?? []).map((k) => [k.id, k])), xuLy = new Map((xl ?? []).map((x) => [x.hoa_don_id, x])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const dong = (hd ?? []).map((h) => {
    const denHan = congNgay(h.ngay_hd, han), tuoi = hom > denHan ? Math.round((new Date(`${hom}T00:00:00Z`).getTime() - new Date(`${denHan}T00:00:00Z`).getTime()) / 86400000) : 0;
    const nhom = tuoi === 0 ? NHOM[0] : NHOM.find((n, i) => i > 0 && tuoi <= n.den) ?? NHOM[5];
    return { ...h, denHan, tuoi, nhom, xl: xuLy.get(h.id) };
  }).sort((a, b) => b.tuoi - a.tuoi);
  const tongTheo = (ma: string) => dong.filter((d) => d.nhom.ma === ma && d.xl?.trang_thai !== "tranh_chap").reduce((s, d) => s + Number(d.con_no), 0);
  const tranhChap = dong.filter((d) => d.xl?.trang_thai === "tranh_chap");
  const truong: Truong[] = [
    { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", batBuoc: true, luaChon: Object.entries(TT).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten })) },
    { ten: "nguoi_phu_trach_id", nhan: "Người phụ trách", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] },
    { ten: "hen_tra", nhan: "Hẹn trả (bắt buộc khi đã cam kết)", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú (bắt buộc khi tranh chấp)", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính" }} tieuDe="Công nợ khách hàng" phu={<>Hạn tất toán {han} ngày kể từ ngày hoá đơn (đang chờ xác nhận). Tuổi nợ tính từ ngày kế tiếp ngày đến hạn. Khách khiếu nại thì chuyển “tranh chấp”, không tự xoá hay giảm nợ.</>}>
        <NutXuatExcel loai="cong-no-khach" ten="công nợ khách hàng" />
      </TieuDeNoi>
      <HangChiSo muc={NHOM.map((n) => ({ nhan: n.ten, so: tienVN(tongTheo(n.ma)), ghiChu: n.chu }))} />
      {tranhChap.length > 0 && <p className="mt-3 text-[13.5px] text-canh-bao">{tranhChap.length} hoá đơn đang tranh chấp, tổng {tienVN(tranhChap.reduce((s, d) => s + Number(d.con_no), 0))} (không tính vào các nhóm trên).</p>}
      <div className="mt-6" />
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Không có hoá đơn nào còn nợ."
        cot={[
          { nhan: "Hoá đơn", chinh: true, hienThi: (r) => <div><Link href={`/hoa-don/${r.id}`} className="text-nhan-dam hover:underline">{r.ma}</Link><div className="text-[12.5px] text-muc-3">{ngayVN(r.ngay_hd)}</div></div> },
          { nhan: "Khách", hienThi: (r) => (r.khach_id ? <Link href={`/khach-hang/${r.khach_id}`} className="text-nhan-dam hover:underline">{tenKhach.get(r.khach_id)?.ho_ten}</Link> : "Khách lẻ") },
          { nhan: "Còn nợ", phai: true, hienThi: (r) => tienVN(r.con_no) },
          { nhan: "Đến hạn / tuổi nợ", hienThi: (r) => <div>{ngayVN(r.denHan)}<div className={`text-[12.5px] ${r.tuoi > 30 ? "text-canh-bao" : "text-muc-3"}`}>{r.tuoi === 0 ? "Chưa đến hạn" : `Quá ${r.tuoi} ngày · ${r.nhom.ten}`}</div></div> },
          { nhan: "Xử lý", hienThi: (r) => (r.xl ? <div><NhanTrangThai kieu={TT[r.xl.trang_thai].kieu}>{TT[r.xl.trang_thai].ten}</NhanTrangThai><div className="mt-1 text-[12.5px] text-muc-3">{r.xl.nguoi_phu_trach_id && `${tenNv.get(r.xl.nguoi_phu_trach_id)} · `}{r.xl.hen_tra && `hẹn ${ngayVN(r.xl.hen_tra)}`}</div>{r.xl.ghi_chu && <div className="text-[12.5px] text-muc-3">{r.xl.ghi_chu}</div>}</div> : <span className="text-[12.5px] text-muc-3">{r.nhom.chu}</span>) },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Cập nhật xử lý" tieuDe={`Xử lý nợ ${r.ma}`} truong={truong} action={capNhatXuLyNo} an={{ hoa_don_id: r.id }} giaTri={{ trang_thai: r.xl?.trang_thai ?? "dang_nhac", nguoi_phu_trach_id: r.xl?.nguoi_phu_trach_id ?? "", hen_tra: r.xl?.hen_tra ?? "", ghi_chu: r.xl?.ghi_chu ?? "" }} /> : null) },
        ]} />
    </div>
  );
}
