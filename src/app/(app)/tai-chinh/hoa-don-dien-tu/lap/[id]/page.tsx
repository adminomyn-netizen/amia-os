import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { HINH_THUC_TT, LOAI_NGUOI_MUA, soHienThi, THUE_SUAT, thieuNguoiBan } from "@/lib/hoa-don-gtgt";
import { layDuLieuGtgt } from "@/lib/hoa-don-gtgt-may-chu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { MauHoaDonGtgt } from "@/components/hoa-don/MauHoaDonGtgt";
import { huyGtgt, luuNhapGtgt, xuatGtgt } from "../../gtgt-actions";

const NUT = "h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram";

/** Lập MẪU HOÁ ĐƠN GTGT từ một hoá đơn bán đã chốt: nháp người mua → xem trước → Xuất (cấp số theo ký hiệu) → In / Lưu PDF, tải XML.
 *  Làm theo hộp "Khởi tạo hoá đơn điện tử" của SalonHero (Doanh nghiệp / Cá nhân / Khách lẻ, Tra cứu MST), nhưng chưa gửi nhà cung cấp nào. */
export default async function LapHoaDonGtgt({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("hd.vat");
  const { id } = await params;
  const d = await layDuLieuGtgt(nd, id);
  if (!d) notFound();
  const ghi = coQuyen(nd, "ban.sua_khoa");
  const x = d.dangXuat;
  const thieu = thieuNguoiBan(d.nguoiBanCd ?? undefined);
  const m = d.nguoiMua;
  const coVatRieng = Number(d.hd.vat_tien) > 0;
  const truong: Truong[] = [
    { ten: "loai", nhan: "Xuất hoá đơn cho", loai: "chon", batBuoc: true, luaChon: [...LOAI_NGUOI_MUA] },
    { ten: "mst", nhan: "Mã số thuế", loai: "chu", hienKhi: { ten: "loai", la: ["doanh_nghiep"] }, traCuuMst: { ten: "ten_don_vi", diaChi: "dia_chi" } },
    { ten: "cccd", nhan: "Số CCCD (nếu có)", loai: "chu", hienKhi: { ten: "loai", la: ["ca_nhan"] } },
    { ten: "ten_don_vi", nhan: "Tên doanh nghiệp", loai: "nhieu_dong", hienKhi: { ten: "loai", la: ["doanh_nghiep"] } },
    { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true },
    { ten: "ho_ten", nhan: "Tên người mua", loai: "chu" }, { ten: "dien_thoai", nhan: "Số điện thoại (nếu có)", loai: "chu" },
    { ten: "email", nhan: "Email (nhận hoá đơn điện tử)", loai: "chu", rong: true },
    ...(coVatRieng ? [] : [{ ten: "thue_suat", nhan: "Thuế suất GTGT", loai: "chon" as const, luaChon: [...THUE_SUAT], ghiChu: "Đơn không cộng VAT riêng: tiền khách trả coi là đã gồm thuế, hoá đơn tách ra tiền trước thuế + tiền thuế." }]),
    { ten: "hinh_thuc_tt", nhan: "Hình thức thanh toán", loai: "chon", luaChon: [...HINH_THUC_TT] },
    { ten: "ghi_chu", nhan: "Ghi chú trên hoá đơn", loai: "nhieu_dong" },
  ];
  const trangThai = x ? "da_xuat" : "nhap";
  return (
    <div>
      <Link href="/tai-chinh/hoa-don-dien-tu" className="text-[13px] text-muc-3 hover:text-muc">← Hoá đơn điện tử</Link>
      <TieuDeTrang tieuDe={`Hoá đơn GTGT · ${d.hd.ma}`} phu={`${d.tenChiNhanh} · Hoá đơn bán ngày ${ngayVN(d.hd.ngay_hd)} · Khách phải trả ${tienVN(Number(d.hd.tong_phai_thu))}`}>
        <span className="flex flex-wrap items-center gap-2">
          <a href={`/in/hoa-don-gtgt/${d.hd.id}`} target="_blank" rel="noopener" className={NUT}>In / Lưu PDF</a>
          {x?.xml && <a href={`/api/xuat/hoa-don-gtgt/${x.id}`} download className={NUT}>Tải XML</a>}
        </span>
      </TieuDeTrang>

      <section className="mb-5 flex flex-wrap items-center gap-3 text-[14px]">
        {x ? <NhanTrangThai kieu="tot">Đã xuất · số {soHienThi(x.so)} · ký hiệu {x.mau_so}{x.ky_hieu} · {ngayGioVN(x.xuat_luc)}</NhanTrangThai>
          : d.ghiSoTay ? <NhanTrangThai kieu="cho">Đã ghi số hoá đơn điện tử làm tay ({d.hd.vat_hd_ky_hieu ?? ""} {d.hd.vat_hd_so ?? ""}) — không lập trong app</NhanTrangThai>
          : <NhanTrangThai kieu="cho">Nháp{d.coNhap ? " (đã lưu thông tin người mua)" : ""}</NhanTrangThai>}
        {ghi && !x && !d.ghiSoTay && (
          <>
            <NutHop kieu="phu" nhan="Thông tin người mua" tieuDe="Khởi tạo hoá đơn GTGT" moTa="Như hộp tạo hoá đơn điện tử của SalonHero. Lưu nháp, chưa cấp số." truong={truong} action={luuNhapGtgt} an={{ hoa_don_id: d.hd.id }} rong nhanLuu="Lưu nháp"
              giaTri={{ loai: m.loai, mst: m.mst, cccd: m.cccd, ten_don_vi: m.ten_don_vi, dia_chi: m.dia_chi, ho_ten: m.ho_ten, dien_thoai: m.dien_thoai, email: m.email, thue_suat: d.thueSuat, hinh_thuc_tt: d.hinhThuc, ghi_chu: d.noiDung.ghi_chu }} />
            {thieu.length === 0 && d.noiDung.dong.some((r) => r.tinh_chat === 1) && (
              <NutHop nhan="Xuất hoá đơn (cấp số)" tieuDe="Xuất hoá đơn GTGT" an={{ hoa_don_id: d.hd.id }} action={xuatGtgt} nhanLuu="Xuất hoá đơn"
                xacNhan={`Cấp số tiếp theo của ký hiệu ${d.nguoiBanCd?.mau_so ?? "1"}${d.nguoiBanCd?.ky_hieu ?? ""} cho ${d.hd.ma}, ngày lập hôm nay. Sau khi xuất, nội dung hoá đơn được chốt, hoá đơn bán bị khoá sửa; số đã cấp không dùng lại (huỷ thì giữ số).`} />
            )}
          </>
        )}
        {ghi && x && <NutHop kieu="chu" nguy nhan="Huỷ hoá đơn GTGT" tieuDe="Huỷ hoá đơn GTGT" xacNhan={`Huỷ hoá đơn số ${soHienThi(x.so)}? Số này giữ nguyên (không cấp lại), hoá đơn bán quay về "Cần xuất" và mở khoá sửa.`} truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "nhieu_dong", batBuoc: true }]} action={huyGtgt} an={{ hoa_don_id: d.hd.id }} nhanLuu="Huỷ hoá đơn" />}
      </section>

      {!x && thieu.length > 0 && (
        <p className="mb-4 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[13.5px] text-canh-bao">
          Chưa xuất được: thiếu {thieu.join(", ")} của người bán. {nd.chiNhanhId ? "Nhờ kế toán văn phòng chung điền" : <Link href="/tai-chinh/hoa-don-dien-tu?tab=nguoi-ban" className="font-medium underline">Điền ở Thông tin người bán</Link>}. Xem trước và in bản nháp vẫn được.
        </p>
      )}
      {!x && d.noiDung.canh_bao.length > 0 && (
        <ul className="mb-4 space-y-1 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[13.5px] text-canh-bao">{d.noiDung.canh_bao.map((c) => <li key={c}>{c}</li>)}</ul>
      )}
      {(x ? x.noi_dung : d.noiDung).tru_the > 0 && <p className="mb-3 text-[13px] text-muc-3">Trong đơn có {tienVN((x ? x.noi_dung : d.noiDung).tru_the)} trả bằng thẻ tiền (vẫn tính trong tổng hoá đơn).</p>}
      {(x ? x.noi_dung : d.noiDung).tip > 0 && <p className="mb-3 text-[13px] text-muc-3">Tiền tip {tienVN((x ? x.noi_dung : d.noiDung).tip)} không đưa lên hoá đơn GTGT.</p>}

      {x ? <MauHoaDonGtgt mauSo={x.mau_so} kyHieu={x.ky_hieu} so={x.so} ngayLap={x.ngay_lap} ban={x.nguoi_ban} nd={x.noi_dung} trangThai="da_xuat" />
        : <MauHoaDonGtgt mauSo={d.nguoiBanCd?.mau_so ?? "1"} kyHieu={d.nguoiBanCd?.ky_hieu ?? ""} so={null} ngayLap={d.homNay} ban={d.nguoiBan} nd={d.noiDung} trangThai={trangThai} />}

      {d.daHuy.length > 0 && (
        <section className="mt-6 text-[13px] text-muc-3">
          <h2 className="mb-1 text-[14px] font-medium text-muc">Hoá đơn GTGT đã huỷ của đơn này</h2>
          <ul className="space-y-0.5">{d.daHuy.map((h) => <li key={h.id}>Số {soHienThi(h.so)} · {h.mau_so}{h.ky_hieu} · huỷ {h.huy_luc ? ngayGioVN(h.huy_luc) : ""}{h.ly_do_huy ? ` · ${h.ly_do_huy}` : ""}{h.xml ? <> · <a href={`/api/xuat/hoa-don-gtgt/${h.id}`} download className="text-nhan-dam hover:underline">XML</a></> : null}</li>)}</ul>
        </section>
      )}
      <p className="mt-6 text-[12.5px] text-muc-3">XML theo cấu trúc hoá đơn điện tử của Tổng cục Thuế (Thông tư 78/2021, QĐ 1450/QĐ-TCT), chưa ký số, chưa có mã của cơ quan thuế. Khi có nhà cung cấp hoá đơn điện tử, đẩy tệp này lên để ký và gửi.</p>
    </div>
  );
}
