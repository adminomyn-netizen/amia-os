import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuQuangCao } from "../actions";

export default async function TrangQuangCao() {
  const nd = await yeuCauQuyen("mkt.xem");
  const sua = coQuyen(nd, "mkt.sua");
  const db = sb();
  const [{ data: ds }, { data: cd }] = await Promise.all([
    db.from("chi_phi_qc_ngay").select("*").order("ngay", { ascending: false }).limit(300), db.from("chien_dich").select("id, ten, ma").order("tao_luc", { ascending: false }),
  ]);
  const ten = new Map((cd ?? []).map((c) => [c.id, `${c.ma} · ${c.ten}`]));
  const truong: Truong[] = [
    { ten: "chien_dich_id", nhan: "Chiến dịch", loai: "chon", batBuoc: true, rong: true, luaChon: (cd ?? []).map((c) => ({ gia_tri: c.id, nhan: `${c.ma} · ${c.ten}` })) },
    { ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "chi_phi", nhan: "Chi phí", loai: "tien", batBuoc: true },
    { ten: "hien_thi", nhan: "Lượt hiển thị", loai: "so" }, { ten: "tiep_can", nhan: "Tiếp cận", loai: "so" }, { ten: "click", nhan: "Lượt click", loai: "so" },
    { ten: "tin_nhan_moi", nhan: "Tin nhắn mới", loai: "so" }, { ten: "lead_so", nhan: "Lead (theo nền tảng)", loai: "so" },
  ];
  return (
    <div>
      <Link href="/marketing" className="text-[13px] text-muc-3 hover:text-muc">← Marketing</Link>
      <TieuDeTrang tieuDe="Quảng cáo theo ngày" phu="Nhập số liệu từng ngày theo chiến dịch. Nhập lại cùng ngày và chiến dịch sẽ ghi đè số cũ. Chiến dịch có mã meta-… được hệ thống tự kéo từ Meta lúc 5:30 mỗi sáng (3 ngày gần nhất), không nhập tay.">
        {sua && <NutHop nhan="Nhập số liệu" tieuDe="Nhập số liệu quảng cáo" truong={truong} action={luuQuangCao} giaTri={{ ngay: homNayHCM(), chien_dich_id: "" }} rong />}
      </TieuDeTrang>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có số liệu."
        cot={[
          { nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Chiến dịch", hienThi: (r) => ten.get(r.chien_dich_id) ?? "" },
          { nhan: "Chi phí", phai: true, hienThi: (r) => tienVN(r.chi_phi) }, { nhan: "Hiển thị", phai: true, hienThi: (r) => soVN(r.hien_thi) },
          { nhan: "Tiếp cận", phai: true, hienThi: (r) => soVN(r.tiep_can) }, { nhan: "Click", phai: true, hienThi: (r) => soVN(r.click) },
          { nhan: "Tin nhắn", phai: true, hienThi: (r) => soVN(r.tin_nhan_moi) }, { nhan: "Lead", phai: true, hienThi: (r) => soVN(r.lead_so) },
        ]} />
    </div>
  );
}
