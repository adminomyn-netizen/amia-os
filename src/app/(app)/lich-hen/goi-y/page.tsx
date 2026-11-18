import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, soVN } from "@/lib/dinh-dang";
import { chiNhanhXem, soTrongKhoang } from "@/lib/cham-soc-khach";
import { docGoiYLich, docNguongGoiY, docSoNgay, NHAN_LOAI_GOI_Y } from "@/lib/goi-y-lich";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { datTrangThaiGoiY, ghiNhacGoiY } from "./actions";

const NHAN_TT: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  da_goi: { nhan: "Đã gọi", kieu: "cho" }, da_hen: { nhan: "Đã hẹn", kieu: "tot" }, bo_qua: { nhan: "Bỏ qua", kieu: "tram" },
};
const TRUONG_TT: Truong[] = [
  { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "da_goi", nhan: "Đã gọi (chưa chốt lịch)" }, { gia_tri: "da_hen", nhan: "Đã hẹn" }, { gia_tri: "bo_qua", nhan: "Bỏ qua (khách không làm tiếp)" }] },
  { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" },
];
const BAO_TRUOC = [0, 1, 3, 7, 14, 30], TRE = [7, 14, 30, 60, 90, 180];
const MOI_TRANG = 50;
const TT = [{ gia_tri: "can", nhan: "Cần nhắc (chưa xử lý, đã gọi)" }, { gia_tri: "da_hen", nhan: "Đã hẹn" }, { gia_tri: "bo_qua", nhan: "Bỏ qua" }, { gia_tri: "tat_ca", nhan: "Tất cả" }];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SP = { cn?: string; dv?: string; nhom?: string; loai?: string; truoc?: string; tre?: string; tt?: string; trang?: string };

/** /lich-hen/goi-y — Gợi ý lịch hẹn sắp đến theo dịch vụ (chị Diệu Thuý 18/11/2026): khách nên quay lại buổi kế tiếp / tái khám theo khoảng cách đặt cho từng dịch vụ.
 *  Khác "Nhắc tái khám" (theo gói thẻ còn buổi): trang này tính theo DỊCH VỤ khách đã làm, cả khách lẻ không có thẻ. Không gửi SMS/Zalo cho khách. */
export default async function GoiYLichHen({ searchParams }: { searchParams: Promise<SP> }) {
  const nd = await yeuCauQuyen("lich.xem");
  const sp = await searchParams;
  const [ng, { cn, ds: dsCn, khoa }] = await Promise.all([docNguongGoiY(), chiNhanhXem(nd, sp.cn)]);
  const truoc = soTrongKhoang(sp.truoc, 0, 60, ng.baoTruoc)!, tre = soTrongKhoang(sp.tre, 1, 365, ng.treToiDa)!;
  const loai = sp.loai === "buoi_ke" || sp.loai === "tai_kham" ? sp.loai : undefined;
  const tt = TT.some((t) => t.gia_tri === sp.tt) ? sp.tt! : "can";
  const dv = sp.dv && UUID.test(sp.dv) ? sp.dv : undefined, nhom = sp.nhom && UUID.test(sp.nhom) ? sp.nhom : undefined;
  const trang = Math.max(1, Math.min(Number(sp.trang) || 1, Math.ceil(2000 / MOI_TRANG)));
  const db = sb();
  const [dsDau, { data: dsDv }, { data: dsNhom }] = await Promise.all([
    docGoiYLich({ cn, dichVu: dv, nhom, loai, baoTruoc: truoc, treToiDa: tre, tt, gioiHan: Math.min(trang * MOI_TRANG, 2000) }),
    db.from("dich_vu").select("id, ten, nhom_id, khoang_cach_ngay, tai_kham_sau_ngay").or("khoang_cach_ngay.not.is.null,tai_kham_sau_ngay.not.is.null").order("ten"),
    db.from("dich_vu_nhom").select("id, ten").order("ten"),
  ]);
  const tong = dsDau[0]?.tong ?? 0;
  const ds = dsDau.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const nhomCo = new Set((dsDv ?? []).map((d) => d.nhom_id));
  const gan = (t: number | undefined) => `/lich-hen/goi-y?${new URLSearchParams(Object.entries({ cn: cn ?? undefined, dv, nhom, loai, truoc: sp.truoc, tre: sp.tre, tt: tt === "can" ? undefined : tt, trang: t && t > 1 ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const suaLich = coQuyen(nd, "lich.sua"), suaKhach = coQuyen(nd, "khach.sua");
  const homNay = ds.filter((r) => r.so_ngay_con === 0).length;

  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Gợi ý lịch hẹn sắp đến" icon={CalendarHeart} quayLai={{ href: "/lich-hen", nhan: "Lịch hẹn" }} quayLaiDienThoai
        phu={<>Khách nên quay lại theo liệu trình của từng dịch vụ (buổi kế tiếp, tái khám) mà chưa có lịch hẹn dịch vụ đó. Nhắc theo thẻ còn buổi xem ở <Link href="/khach-hang/tai-kham" className="font-medium text-nhan-dam hover:underline">Nhắc tái khám</Link>.</>}>
        {coQuyen(nd, "danhmuc.sua") && <Link href="/lich-hen/goi-y/cai-dat" className={NUT_PHU}>Cài khoảng cách theo dịch vụ ({dsDv?.length ?? 0})</Link>}
      </TieuDeNoi>

      <form method="get" className="the-noi the-noi-thap flex flex-wrap items-end gap-3 px-4 pb-3.5 pt-4 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-48"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Nhóm dịch vụ</span>
          <div className="w-52"><Chon ten="nhom" ariaLabel="Nhóm dịch vụ" giaTriMacDinh={nhom ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả nhóm" }, ...(dsNhom ?? []).filter((n) => nhomCo.has(n.id)).map((n) => ({ gia_tri: n.id, nhan: n.ten }))]} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Dịch vụ</span>
          <div className="w-64"><Chon ten="dv" ariaLabel="Dịch vụ" giaTriMacDinh={dv ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả dịch vụ" }, ...(dsDv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }))]} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Loại hẹn</span>
          <div className="w-48"><Chon ten="loai" ariaLabel="Loại hẹn" giaTriMacDinh={loai ?? ""} luaChon={[{ gia_tri: "", nhan: "Cả hai" }, { gia_tri: "buoi_ke", nhan: "Buổi kế tiếp" }, { gia_tri: "tai_kham", nhan: "Tái khám / chăm sóc sau" }]} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Sắp đến trong</span>
          <div className="w-36"><Chon ten="truoc" ariaLabel="Sắp đến trong" giaTriMacDinh={String(truoc)} luaChon={[...new Set([...BAO_TRUOC, truoc])].sort((a, b) => a - b).map((n) => ({ gia_tri: String(n), nhan: n === 0 ? "Chỉ hôm nay" : `${n} ngày tới` }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Quá hạn tối đa</span>
          <div className="w-32"><Chon ten="tre" ariaLabel="Quá hạn tối đa" giaTriMacDinh={String(tre)} luaChon={[...new Set([...TRE, tre])].sort((a, b) => a - b).map((n) => ({ gia_tri: String(n), nhan: `${n} ngày` }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Trạng thái</span>
          <div className="w-56"><Chon ten="tt" ariaLabel="Trạng thái" giaTriMacDinh={tt} luaChon={TT} /></div></label>
        <button type="submit" className={NUT_PHU}>Lọc</button>
      </form>

      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> gợi ý{homNay > 0 ? <> · <b className="tabular-nums">{homNay}</b> đến hạn hôm nay (trang này)</> : null}</p>

      <Bang noi duLieu={ds} khoa={(r) => `${r.khach_id}-${r.dich_vu_id}-${r.loai}`} trong={(dsDv?.length ?? 0) === 0 ? "Chưa dịch vụ nào được đặt khoảng cách. Bấm “Cài khoảng cách theo dịch vụ” để đặt." : "Không có khách nào cần nhắc với điều kiện này."}
        cot={[
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => <div><Link href={`/khach-hang/${r.khach_id}`} className="font-medium text-muc hover:underline">{r.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{r.ma}{r.dien_thoai ? ` · ${r.dien_thoai}` : ""}</div></div> },
          { nhan: "Dịch vụ", hienThi: (r) => <div className="text-[13px]"><div className="font-medium text-muc">{r.ten_dich_vu}</div><div className="text-muc-3">{NHAN_LOAI_GOI_Y[r.loai]} · cách {docSoNgay(r.so_ngay)}</div></div> },
          { nhan: "Làm gần nhất", hienThi: (r) => <span className="text-[13px] tabular-nums">{ngayVN(r.lan_cuoi)}</span> },
          { nhan: "Nên hẹn ngày", hienThi: (r) => <div className="text-[13px] tabular-nums"><b>{ngayVN(r.den_han)}</b><div className={r.so_ngay_con < 0 ? "text-loi" : r.so_ngay_con === 0 ? "font-medium text-nhan-dam" : "text-muc-3"}>{r.so_ngay_con < 0 ? `Quá ${-r.so_ngay_con} ngày` : r.so_ngay_con === 0 ? "Hôm nay" : `Còn ${r.so_ngay_con} ngày`}</div>{r.ke_tiep_ngay && <div className="text-muc-3">Chuyên viên trị liệu hẹn: {ngayVN(r.ke_tiep_ngay)}</div>}</div> },
          { nhan: "Trạng thái", hienThi: (r) => <div className="text-[13px]">{r.trang_thai ? <NhanTrangThai kieu={NHAN_TT[r.trang_thai].kieu}>{NHAN_TT[r.trang_thai].nhan}</NhanTrangThai> : <span className="text-muc-3">Chưa xử lý</span>}{r.lich_sap_toi && <div className="mt-0.5 text-muc-3">Có lịch khác ngày {ngayVN(r.lich_sap_toi)}</div>}{r.nhac_id && <div className="mt-0.5 text-muc-3">Đã ghi nhắc</div>}{r.ghi_chu && <div className="mt-0.5 text-muc-3">{r.ghi_chu}</div>}</div> },
          { nhan: "", hienThi: (r) => {
            const an = { khach_id: r.khach_id, dich_vu_id: r.dich_vu_id, loai: r.loai, lan_cuoi: r.lan_cuoi };
            return (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {suaLich && <Link href={`/lich-hen?khach=${r.khach_id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Đặt lịch</Link>}
                {suaLich && <NutHop kieu="chu" nhan="Cập nhật" tieuDe={`${r.ho_ten} · ${r.ten_dich_vu}`} truong={TRUONG_TT} an={an} giaTri={{ trang_thai: r.trang_thai ?? "da_goi", ghi_chu: r.ghi_chu ?? "" }} action={datTrangThaiGoiY} />}
                {suaKhach && !r.nhac_id && <NutHop kieu="chu" nhan="Ghi nhắc" tieuDe="Ghi nhắc lịch hẹn" xacNhan={`Ghi nhắc ${r.ten_dich_vu} (nên hẹn ${ngayVN(r.den_han)}) vào mục nhắc chăm sóc của ${r.ho_ten}? (Không gửi tin nhắn cho khách.)`} nhanLuu="Ghi nhắc" an={{ ...an, den_han: r.den_han, ten_dich_vu: r.ten_dich_vu, chi_nhanh_id: r.chi_nhanh_id ?? "" }} action={ghiNhacGoiY} />}
              </span>);
          } },
        ]} />
      <ThanhTrang trang={trang} tong={Math.min(tong, 2000)} moi={MOI_TRANG} gan={gan} don="gợi ý" />
    </div>
  );
}
