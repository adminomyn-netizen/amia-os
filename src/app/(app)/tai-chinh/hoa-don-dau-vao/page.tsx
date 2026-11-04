import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { khoangNgay } from "@/lib/bao-cao";
import { locHddv, nhanThueSuat, THUE_SUAT, tongHddv } from "@/lib/hoa-don-dau-vao";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { TepHoaDonDauVao } from "@/components/tai-chinh/TepHoaDonDauVao";
import { doiChieuHoaDon, ghiHoaDonDauVao, huyHoaDonDauVao, taoKhoanChoHoaDon } from "./actions";

const TAB = [{ ma: "tat-ca", ten: "Tất cả" }, { ma: "cho", ten: "Chưa về / cần đối chiếu" }];
const TT: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_hoa_don: { ten: "Chờ hoá đơn", kieu: "cho" }, da_nhan: { ten: "Đã nhận, chờ đối chiếu", kieu: "cho" }, da_doi_chieu: { ten: "Đã đối chiếu", kieu: "tot" }, sai_lech: { ten: "Sai lệch", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};

type SP = { tab?: string; tu?: string; den?: string; cn?: string; q?: string };

export default async function TrangHoaDonDauVao({ searchParams }: { searchParams: Promise<SP> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const ghi = coQuyen(nd, "quy.ghi");
  const sp = await searchParams;
  const tab = sp.tab === "cho" ? "cho" : "tat-ca";
  const db = sb(), hom = homNayHCM();
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  const [{ data: all }, { data: ncc }, { data: don }, { data: dsCn }] = await Promise.all([
    db.from("hoa_don_dau_vao").select("*").order("ngay_hd", { ascending: false, nullsFirst: true }).order("tao_luc", { ascending: false }).limit(2000), db.from("nha_cung_cap").select("id, ten, ma_so_thue").order("ten"),
    db.from("don_mua").select("id, ma, ncc_id").in("trang_thai", ["dang_nhan", "da_nhan"]).order("ngay_dat", { ascending: false }).limit(200),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
  ]);
  const nccMap = new Map((ncc ?? []).map((n) => [n.id, n])), maDon = new Map((don ?? []).map((d) => [d.id, d.ma])), tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  const coNcc = (all ?? []).map((h) => ({ ...h, ten_ncc: nccMap.get(h.ncc_id)?.ten ?? "", ma_so_thue: nccMap.get(h.ncc_id)?.ma_so_thue ?? null }));
  const loc = locHddv(coNcc, { cn, tu, den, q: sp.q });
  const ds = loc.filter((h) => tab === "tat-ca" || ["cho_hoa_don", "da_nhan", "sai_lech"].includes(h.trang_thai));
  const tong = tongHddv(loc);
  const luaNcc = [{ gia_tri: "", nhan: "Nhập tên / MST bên dưới" }, ...(ncc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ma_so_thue ? `${n.ten} · ${n.ma_so_thue}` : n.ten }))];
  const luaDon = [{ gia_tri: "", nhan: "Không gắn đơn mua" }, ...(don ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${nccMap.get(d.ncc_id)?.ten ?? ""}` }))];
  const luaCn = (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  // Form y SalonHero: Ngày HĐ, Tại chi nhánh, Ký hiệu, Số HĐ, MST, Nhà cung cấp, Địa chỉ, SĐT, Email, Tổng số tiền, Tiền thuế, Thuế suất, Mã tra cứu, Link tra cứu, Ghi chú (+ đơn mua của AMIA). Tệp tải ở cột Tải về sau khi lưu.
  const truongHd = (an: boolean): Truong[] => [
    { ten: "ngay_hd", nhan: "Ngày hoá đơn", loai: "ngay", batBuoc: true },
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Tại chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: luaCn }]),
    { ten: "ky_hieu", nhan: "Ký hiệu hoá đơn", loai: "chu" }, { ten: "so_hd", nhan: "Số hoá đơn", loai: "chu", batBuoc: true },
    ...(an ? [] : [
      { ten: "ncc_id", nhan: "Nhà cung cấp đã có", loai: "chon" as const, rong: true, luaChon: luaNcc },
      { ten: "ma_so_thue", nhan: "Mã số thuế", loai: "chu" as const, hienKhi: { ten: "ncc_id", la: [""] }, traCuuMst: { ten: "ten_ncc", diaChi: "dia_chi" } },
      { ten: "ten_ncc", nhan: "Nhà cung cấp", loai: "chu" as const, hienKhi: { ten: "ncc_id", la: [""] } },
      { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu" as const, rong: true, hienKhi: { ten: "ncc_id", la: [""] } },
      { ten: "dien_thoai", nhan: "Số điện thoại", loai: "chu" as const, hienKhi: { ten: "ncc_id", la: [""] } }, { ten: "email", nhan: "Email", loai: "email" as const, hienKhi: { ten: "ncc_id", la: [""] } },
      { ten: "don_mua_id", nhan: "Đơn mua liên quan", loai: "chon" as const, rong: true, luaChon: luaDon },
    ]),
    { ten: "tong_tien", nhan: "Tổng số tiền (gồm thuế)", loai: "tien", batBuoc: true }, { ten: "thue_gtgt", nhan: "Tiền thuế", loai: "tien" },
    { ten: "thue_suat", nhan: "Thuế suất", loai: "chon", luaChon: [...THUE_SUAT] }, { ten: "ma_tra_cuu", nhan: "Mã tra cứu", loai: "chu" },
    { ten: "link_tra_cuu", nhan: "Link tra cứu (https://…)", loai: "chu", rong: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  const truongCho: Truong[] = [
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Tại chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: luaCn }]),
    { ten: "ncc_id", nhan: "Nhà cung cấp", loai: "chon", batBuoc: true, rong: true, luaChon: luaNcc.slice(1) }, { ten: "don_mua_id", nhan: "Đơn mua liên quan", loai: "chon", rong: true, luaChon: luaDon },
    { ten: "tien_hang", nhan: "Số tiền dự kiến", loai: "tien" }, { ten: "han_nhan", nhan: "Hạn nhận hoá đơn", loai: "ngay", batBuoc: true },
    { ten: "muc_dich", nhan: "Mục đích (trả trước cho gì, hàng nào đã nhận)", loai: "nhieu_dong", batBuoc: true, rong: true },
  ];
  const goc = "/tai-chinh/hoa-don-dau-vao";
  const them = `${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`;
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính" }} tieuDe="Hoá đơn đầu vào" phu="Hoá đơn mua vào của nhà cung cấp: mã số thuế, ký hiệu/số, mã tra cứu, thuế suất, tệp PDF/XML/Zip. Khoản trả trước mà hoá đơn chưa về phải có hạn nhận; hoá đơn về thì người khác đối chiếu với đơn mua.">
        {ghi && <NutHop nhan="Thêm hoá đơn" tieuDe="Thông tin hoá đơn" truong={truongHd(false)} action={ghiHoaDonDauVao} giaTri={{ ncc_id: "", don_mua_id: "", ngay_hd: hom, chi_nhanh_id: cn ?? luaCn[0]?.gia_tri ?? "", thue_suat: "8" }} nhanLuu="Lưu thông tin" rong />}
        {ghi && <NutHop kieu="phu" nhan="Khoản chờ hoá đơn" tieuDe="Khoản chờ hoá đơn" truong={truongCho} action={taoKhoanChoHoaDon} giaTri={{ ncc_id: "", don_mua_id: "", chi_nhanh_id: cn ?? luaCn[0]?.gia_tri ?? "" }} rong />}
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc={goc} them={them} />
      <HangChiSo muc={[{ nhan: "Tổng tiền thuế VAT", so: tienVN(tong.vat) }, { nhan: "Tổng tiền hoá đơn", so: tienVN(tong.tong) }]} />
      <div className="mt-5">
        <LocBaoCao goc={goc} tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : luaCn} cn={sp.cn} />
        <form method="get" action={goc} className="mb-5 flex gap-2">
          {sp.tab && <input type="hidden" name="tab" value={sp.tab} />}<input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />
          {sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm tên công ty, mã số thuế, số hoá đơn" aria-label="Tìm tên công ty, mã số thuế, số hoá đơn" className={`${O_NHAP} max-w-md`} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
        </form>
      </div>
      <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Không tìm thấy kết quả nào."
        cot={[
          { nhan: "Ngày hoá đơn", hienThi: (r) => (r.ngay_hd ? ngayVN(r.ngay_hd) : <span className="text-muc-3">Chưa về</span>) },
          { nhan: "Nhà cung cấp", chinh: true, hienThi: (r) => <div className="text-muc">{r.ten_ncc}<div className="text-[12.5px] text-muc-3">{r.ma}{r.chi_nhanh_id && !cn && ` · ${tenCn.get(r.chi_nhanh_id) ?? ""}`}{r.don_mua_id && ` · ${maDon.get(r.don_mua_id) ?? "đơn mua"}`}</div></div> },
          { nhan: "Mã số thuế", hienThi: (r) => <span className="tabular-nums">{r.ma_so_thue ?? ""}</span> },
          { nhan: "Ký hiệu/Số hoá đơn", hienThi: (r) => (r.so_hd ? `${r.ky_hieu ? `${r.ky_hieu}/` : ""}${r.so_hd}` : "") },
          { nhan: "Mã tra cứu", hienThi: (r) => (r.link_tra_cuu ? <a href={r.link_tra_cuu} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">{r.ma_tra_cuu || "Tra cứu"}</a> : r.ma_tra_cuu ?? "") },
          { nhan: "Tổng số tiền", phai: true, hienThi: (r) => tienVN(r.tong_tien ?? 0) }, { nhan: "Tiền thuế", phai: true, hienThi: (r) => tienVN(r.thue_gtgt) },
          { nhan: "Thuế suất", hienThi: (r) => nhanThueSuat(r.thue_suat) },
          { nhan: "Ghi chú", hienThi: (r) => {
            const qua = r.trang_thai === "cho_hoa_don" && r.han_nhan && r.han_nhan < hom;
            return <div className="min-w-40"><NhanTrangThai kieu={qua ? "loi" : TT[r.trang_thai].kieu}>{qua ? "Hoá đơn chưa về quá hạn" : TT[r.trang_thai].ten}</NhanTrangThai>{r.trang_thai === "cho_hoa_don" && r.han_nhan && <div className="mt-1 text-[12.5px] text-muc-3">Hạn {ngayVN(r.han_nhan)}</div>}{(r.ghi_chu || r.muc_dich) && <div className={`mt-1 text-[12.5px] ${r.trang_thai === "sai_lech" ? "text-canh-bao" : "text-muc-3"}`}>{r.ghi_chu ?? r.muc_dich}</div>}</div>;
          } },
          { nhan: "Ngày cập nhật", hienThi: (r) => <span className="text-[13px] text-muc-3">{ngayGioVN(r.cap_nhat_luc)}</span> },
          { nhan: "Tải về", hienThi: (r) => (r.tep_duong_dan || r.link_file || (ghi && r.trang_thai !== "huy") ? <div>{r.link_file && <a href={r.link_file} target="_blank" rel="noreferrer noopener" className="text-[13px] text-nhan-dam hover:underline">Link file</a>}<TepHoaDonDauVao id={r.id} tenTep={r.tep_duong_dan ? r.tep_ten ?? "hoa-don" : null} ghi={ghi && r.trang_thai !== "huy"} /></div> : null) },
          { nhan: "", hienThi: (r) => (ghi ? (
            <div className="flex flex-wrap justify-end gap-2">
              {r.trang_thai === "cho_hoa_don" && <NutHop kieu="chu" nhan="Hoá đơn đã về" tieuDe={`Ghi hoá đơn cho ${r.ma}`} truong={truongHd(true)} action={ghiHoaDonDauVao} an={{ id: r.id }} giaTri={{ ngay_hd: hom, chi_nhanh_id: cn ?? luaCn[0]?.gia_tri ?? "", tong_tien: Number(r.tien_hang), thue_suat: "8" }} nhanLuu="Lưu thông tin" rong />}
              {["da_nhan", "sai_lech"].includes(r.trang_thai) && <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa hoá đơn ${r.ma}`} truong={truongHd(true)} action={ghiHoaDonDauVao} an={{ id: r.id }} giaTri={{ ngay_hd: r.ngay_hd ?? hom, chi_nhanh_id: r.chi_nhanh_id ?? "", ky_hieu: r.ky_hieu ?? "", so_hd: r.so_hd ?? "", tong_tien: Number(r.tong_tien ?? 0), thue_gtgt: Number(r.thue_gtgt), thue_suat: r.thue_suat ?? "", ma_tra_cuu: r.ma_tra_cuu ?? "", link_tra_cuu: r.link_tra_cuu ?? "", ghi_chu: r.ghi_chu ?? "" }} nhanLuu="Lưu thông tin" rong />}
              {["da_nhan", "sai_lech"].includes(r.trang_thai) && (r.nguoi_id !== nd.nhanVienId || nd.vaiTro === "ky_thuat") && <NutHop kieu="chu" nhan="Đối chiếu" tieuDe={`Đối chiếu ${r.ma}`} moTa={r.don_mua_id ? "Hệ thống so tiền hàng với giá trị hàng đã nhận của đơn mua. Lệch thì cần giải trình." : "Không gắn đơn mua: xác nhận đã kiểm tra hoá đơn với chứng từ giao hàng."} truong={[{ ten: "ghi_chu", nhan: "Giải trình / ghi chú", loai: "nhieu_dong", rong: true }]} action={doiChieuHoaDon} an={{ id: r.id }} nhanLuu="Xác nhận" />}
              {["cho_hoa_don", "da_nhan", "sai_lech"].includes(r.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={huyHoaDonDauVao} an={{ id: r.id }} nhanLuu="Huỷ" />}
            </div>
          ) : null) },
        ]} />
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Lọc theo ngày hoá đơn (khoản chưa có hoá đơn tính theo ngày tạo). Hai ô tổng bỏ khoản chờ hoá đơn và hoá đơn đã huỷ. Tiền hàng = Tổng số tiền − Tiền thuế. Tệp PDF, XML, Zip tối đa 10 MB, lưu kho riêng tư.</p>
    </div>
  );
}
