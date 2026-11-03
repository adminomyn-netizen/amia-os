import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Store } from "lucide-react";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuDoiDiem, luuThongTinChung } from "../actions";
import { cauHinhDiem } from "@/lib/diem-thuong";
import { tienVN } from "@/lib/dinh-dang";

const NGAY = [{ gia_tri: "t2", nhan: "Thứ hai" }, { gia_tri: "t3", nhan: "Thứ ba" }, { gia_tri: "t4", nhan: "Thứ tư" }, { gia_tri: "t5", nhan: "Thứ năm" }, { gia_tri: "t6", nhan: "Thứ sáu" }, { gia_tri: "t7", nhan: "Thứ bảy" }, { gia_tri: "cn", nhan: "Chủ nhật" }];
type Gio = { mo?: string; dong?: string; nghi?: string[] };

export default async function TrangThongTinChung() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const [{ data: ch }, diem] = await Promise.all([sb().from("cua_hang").select("*").eq("id", 1).single(), cauHinhDiem(sb())]);
  const gio = (ch?.gio_lam_viec ?? {}) as Gio;
  const nghi = (gio.nghi ?? []).map((n) => NGAY.find((x) => x.gia_tri === n)?.nhan).filter(Boolean).join(", ");
  const truong: Truong[] = [
    { ten: "ten_thuong_hieu", nhan: "Tên thương hiệu", loai: "chu", batBuoc: true }, { ten: "ten_phap_nhan", nhan: "Tên pháp nhân", loai: "chu", goiY: "Tên công ty trên giấy phép" },
    { ten: "ma_so_thue", nhan: "Mã số thuế", loai: "chu" }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" },
    { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true }, { ten: "email", nhan: "Email", loai: "email" }, { ten: "website", nhan: "Website", loai: "chu" },
    { ten: "gio_mo", nhan: "Giờ mở cửa", loai: "gio", batBuoc: true, denGio: "23:30" }, { ten: "gio_dong", nhan: "Giờ đóng cửa", loai: "gio", batBuoc: true, denGio: "23:30" },
    { ten: "nghi", nhan: "Ngày nghỉ cố định trong tuần", loai: "nhieu", luaChon: NGAY },
  ];
  const dong: [string, string | null | undefined][] = [
    ["Tên thương hiệu", ch?.ten_thuong_hieu], ["Tên pháp nhân", ch?.ten_phap_nhan], ["Mã số thuế", ch?.ma_so_thue], ["Địa chỉ", ch?.dia_chi], ["Điện thoại", ch?.dien_thoai],
    ["Email", ch?.email], ["Website", ch?.website], ["Giờ làm việc", `${gio.mo ?? "08:00"} – ${gio.dong ?? "20:00"}${nghi ? ` · nghỉ ${nghi}` : ""}`],
  ];
  return (
    <div>
      <TieuDeNoi icon={Store} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Thông tin chung" phu="Thông tin cửa hàng và pháp nhân, giờ làm việc chung.">
        {coQuyen(nd, "danhmuc.sua") && (
          <NutHop nhan="Sửa thông tin" tieuDe="Sửa thông tin chung" truong={truong} action={luuThongTinChung} rong
            giaTri={{ id: "1", ten_thuong_hieu: ch?.ten_thuong_hieu ?? "", ten_phap_nhan: ch?.ten_phap_nhan ?? "", ma_so_thue: ch?.ma_so_thue ?? "", dia_chi: ch?.dia_chi ?? "", dien_thoai: ch?.dien_thoai ?? "", email: ch?.email ?? "", website: ch?.website ?? "", gio_mo: gio.mo ?? "08:00", gio_dong: gio.dong ?? "20:00", nghi: gio.nghi ?? [] }} />
        )}
      </TieuDeNoi>
      <dl className="the-noi the-noi-thap divide-y divide-vien p-2 sm:p-4">
        {dong.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
            <dt className="text-[13px] text-muc-3">{k}</dt>
            <dd className="text-[14.5px] text-muc">{v || <span className="text-muc-3">Chưa nhập</span>}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-8" aria-labelledby="tt-diem">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="tt-diem" className="text-[16px] font-semibold text-muc">Điểm thưởng</h2>
          {coQuyen(nd, "hethong.phanquyen") && (
            <NutHop kieu="chu" nhan="Sửa" tieuDe="Đổi điểm thưởng thành giảm giá" moTa="Theo SalonHero: 1 điểm = 10.000đ, đang tắt. Bật thì Thu ngân thấy ô đổi điểm khi chọn khách có điểm." action={luuDoiDiem}
              giaTri={{ bat: diem.bat, tien_moi_diem: diem.tienMoiDiem }} truong={[{ ten: "bat", nhan: "Cho đổi điểm ở Thu ngân", loai: "gat" }, { ten: "tien_moi_diem", nhan: "Số tiền giảm cho 1 điểm", loai: "tien", batBuoc: true }]} />
          )}
        </div>
        <dl className="the-noi the-noi-thap divide-y divide-vien p-2 sm:p-4">
          <div className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4"><dt className="text-[13px] text-muc-3">Đổi điểm thành giảm giá</dt><dd className="text-[14.5px] text-muc">{diem.bat ? "Đang bật" : "Đang tắt"} · 1 điểm = {tienVN(diem.tienMoiDiem)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
