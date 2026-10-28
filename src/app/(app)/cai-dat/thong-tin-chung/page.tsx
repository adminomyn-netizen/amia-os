import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuThongTinChung } from "../actions";

const NGAY = [{ gia_tri: "t2", nhan: "Thứ hai" }, { gia_tri: "t3", nhan: "Thứ ba" }, { gia_tri: "t4", nhan: "Thứ tư" }, { gia_tri: "t5", nhan: "Thứ năm" }, { gia_tri: "t6", nhan: "Thứ sáu" }, { gia_tri: "t7", nhan: "Thứ bảy" }, { gia_tri: "cn", nhan: "Chủ nhật" }];
type Gio = { mo?: string; dong?: string; nghi?: string[] };

export default async function TrangThongTinChung() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { data: ch } = await sb().from("cua_hang").select("*").eq("id", 1).single();
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
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Thông tin chung" phu="Thông tin cửa hàng và pháp nhân, giờ làm việc chung.">
        {coQuyen(nd, "danhmuc.sua") && (
          <NutHop nhan="Sửa thông tin" tieuDe="Sửa thông tin chung" truong={truong} action={luuThongTinChung} rong
            giaTri={{ id: "1", ten_thuong_hieu: ch?.ten_thuong_hieu ?? "", ten_phap_nhan: ch?.ten_phap_nhan ?? "", ma_so_thue: ch?.ma_so_thue ?? "", dia_chi: ch?.dia_chi ?? "", dien_thoai: ch?.dien_thoai ?? "", email: ch?.email ?? "", website: ch?.website ?? "", gio_mo: gio.mo ?? "08:00", gio_dong: gio.dong ?? "20:00", nghi: gio.nghi ?? [] }} />
        )}
      </TieuDeTrang>
      <dl className="the-noi the-noi-thap divide-y divide-vien p-2 sm:p-4">
        {dong.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
            <dt className="text-[13px] text-muc-3">{k}</dt>
            <dd className="text-[14.5px] text-muc">{v || <span className="text-muc-3">Chưa nhập</span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
