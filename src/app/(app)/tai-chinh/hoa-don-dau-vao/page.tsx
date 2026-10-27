import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { doiChieuHoaDon, ghiHoaDonDauVao, huyHoaDonDauVao, taoKhoanChoHoaDon } from "./actions";

const TAB = [{ ma: "cho", ten: "Chưa về / cần đối chiếu" }, { ma: "tat-ca", ten: "Tất cả" }];
const TT: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_hoa_don: { ten: "Chờ hoá đơn", kieu: "cho" }, da_nhan: { ten: "Đã nhận, chờ đối chiếu", kieu: "cho" }, da_doi_chieu: { ten: "Đã đối chiếu", kieu: "tot" }, sai_lech: { ten: "Sai lệch", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};

export default async function TrangHoaDonDauVao({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const ghi = coQuyen(nd, "quy.ghi");
  const { tab: t } = await searchParams;
  const tab = t === "tat-ca" ? "tat-ca" : "cho";
  const db = sb(), hom = homNayHCM();
  const [{ data: all }, { data: ncc }, { data: don }] = await Promise.all([
    db.from("hoa_don_dau_vao").select("*").order("tao_luc", { ascending: false }).limit(500), db.from("nha_cung_cap").select("id, ten").order("ten"),
    db.from("don_mua").select("id, ma, ncc_id").in("trang_thai", ["dang_nhan", "da_nhan"]).order("ngay_dat", { ascending: false }).limit(200),
  ]);
  const tenNcc = new Map((ncc ?? []).map((n) => [n.id, n.ten])), maDon = new Map((don ?? []).map((d) => [d.id, d.ma]));
  const ds = (all ?? []).filter((h) => tab === "tat-ca" || ["cho_hoa_don", "da_nhan", "sai_lech"].includes(h.trang_thai));
  const luaNcc = (ncc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })), luaDon = [{ gia_tri: "", nhan: "Không gắn đơn mua" }, ...(don ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${tenNcc.get(d.ncc_id) ?? ""}` }))];
  const truongHd = (an: boolean): Truong[] => [
    ...(an ? [] : [{ ten: "ncc_id", nhan: "Nhà cung cấp", loai: "chon" as const, batBuoc: true, rong: true, luaChon: luaNcc }, { ten: "don_mua_id", nhan: "Đơn mua liên quan", loai: "chon" as const, rong: true, luaChon: luaDon }]),
    { ten: "so_hd", nhan: "Số hoá đơn", loai: "chu", batBuoc: true }, { ten: "ky_hieu", nhan: "Ký hiệu", loai: "chu" }, { ten: "ngay_hd", nhan: "Ngày hoá đơn", loai: "ngay", batBuoc: true },
    { ten: "tien_hang", nhan: "Tiền hàng (chưa thuế)", loai: "tien", batBuoc: true }, { ten: "thue_gtgt", nhan: "Thuế GTGT", loai: "tien" },
    { ten: "link_file", nhan: "Link file hoá đơn (https://…)", loai: "chu", rong: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  const truongCho: Truong[] = [
    { ten: "ncc_id", nhan: "Nhà cung cấp", loai: "chon", batBuoc: true, rong: true, luaChon: luaNcc }, { ten: "don_mua_id", nhan: "Đơn mua liên quan", loai: "chon", rong: true, luaChon: luaDon },
    { ten: "tien_hang", nhan: "Số tiền dự kiến", loai: "tien" }, { ten: "han_nhan", nhan: "Hạn nhận hoá đơn", loai: "ngay", batBuoc: true },
    { ten: "muc_dich", nhan: "Mục đích (trả trước cho gì, hàng nào đã nhận)", loai: "nhieu_dong", batBuoc: true, rong: true },
  ];
  return (
    <div>
      <Link href="/tai-chinh" className="text-[13px] text-muc-3 hover:text-muc">← Tài chính</Link>
      <TieuDeTrang tieuDe="Hoá đơn đầu vào" phu="Khoản trả trước hoặc hàng đã nhận mà hoá đơn chưa về phải có hạn nhận; quá hạn thì chưa đóng được hồ sơ. Hoá đơn về thì người khác đối chiếu với đơn mua.">
        {ghi && <NutHop nhan="Ghi hoá đơn đã về" tieuDe="Ghi hoá đơn đầu vào" truong={truongHd(false)} action={ghiHoaDonDauVao} giaTri={{ ncc_id: "", don_mua_id: "", ngay_hd: hom }} rong />}
        {ghi && <NutHop kieu="phu" nhan="Khoản chờ hoá đơn" tieuDe="Khoản chờ hoá đơn" truong={truongCho} action={taoKhoanChoHoaDon} giaTri={{ ncc_id: "", don_mua_id: "" }} rong />}
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/tai-chinh/hoa-don-dau-vao" />
      <Bang duLieu={ds} khoa={(r) => r.id} trong="Không có hoá đơn nào."
        cot={[
          { nhan: "Mã", chinh: true, hienThi: (r) => <div>{r.ma}<div className="text-[12.5px] text-muc-3">{tenNcc.get(r.ncc_id)}{r.don_mua_id && ` · ${maDon.get(r.don_mua_id) ?? "đơn mua"}`}</div></div> },
          { nhan: "Hoá đơn", hienThi: (r) => (r.so_hd ? <div>{r.so_hd}{r.ky_hieu && ` / ${r.ky_hieu}`}<div className="text-[12.5px] text-muc-3">{ngayVN(r.ngay_hd)}{r.link_file && <> · <a href={r.link_file} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">file</a></>}</div></div> : <span className="text-muc-3">{r.muc_dich}</span>) },
          { nhan: "Tiền hàng", phai: true, hienThi: (r) => tienVN(r.tien_hang) }, { nhan: "Tổng (gồm thuế)", phai: true, hienThi: (r) => tienVN(r.tong_tien) },
          { nhan: "Trạng thái", hienThi: (r) => {
            const qua = r.trang_thai === "cho_hoa_don" && r.han_nhan && r.han_nhan < hom;
            return <div><NhanTrangThai kieu={qua ? "loi" : TT[r.trang_thai].kieu}>{qua ? "Hoá đơn chưa về quá hạn" : TT[r.trang_thai].ten}</NhanTrangThai>{r.trang_thai === "cho_hoa_don" && r.han_nhan && <div className="mt-1 text-[12.5px] text-muc-3">Hạn {ngayVN(r.han_nhan)}</div>}{r.trang_thai === "sai_lech" && r.ghi_chu && <div className="mt-1 text-[12.5px] text-canh-bao">{r.ghi_chu}</div>}</div>;
          } },
          { nhan: "", hienThi: (r) => (ghi ? (
            <div className="flex flex-wrap justify-end gap-2">
              {r.trang_thai === "cho_hoa_don" && <NutHop kieu="chu" nhan="Hoá đơn đã về" tieuDe={`Ghi hoá đơn cho ${r.ma}`} truong={truongHd(true)} action={ghiHoaDonDauVao} an={{ id: r.id }} giaTri={{ ngay_hd: hom, tien_hang: Number(r.tien_hang) }} rong />}
              {["da_nhan", "sai_lech"].includes(r.trang_thai) && (r.nguoi_id !== nd.nhanVienId || nd.vaiTro === "ky_thuat") && <NutHop kieu="chu" nhan="Đối chiếu" tieuDe={`Đối chiếu ${r.ma}`} moTa={r.don_mua_id ? "Hệ thống so tiền hàng với giá trị hàng đã nhận của đơn mua. Lệch thì cần giải trình." : "Không gắn đơn mua: xác nhận đã kiểm tra hoá đơn với chứng từ giao hàng."} truong={[{ ten: "ghi_chu", nhan: "Giải trình / ghi chú", loai: "nhieu_dong", rong: true }]} action={doiChieuHoaDon} an={{ id: r.id }} nhanLuu="Xác nhận" />}
              {["cho_hoa_don", "da_nhan", "sai_lech"].includes(r.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={huyHoaDonDauVao} an={{ id: r.id }} nhanLuu="Huỷ" />}
            </div>
          ) : null) },
        ]} />
    </div>
  );
}
