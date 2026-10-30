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
  const tu = new Date(Date.parse(`${homNayHCM()}T00:00:00Z`) - 20 * 864e5).toISOString().slice(0, 10);
  const [{ data: ds }, { data: cd }, { data: gan }] = await Promise.all([
    db.from("chi_phi_qc_ngay").select("*").order("ngay", { ascending: false }).limit(300), db.from("chien_dich").select("id, ten, ma").order("tao_luc", { ascending: false }),
    db.from("chi_phi_qc_ngay").select("ngay, chien_dich_id, chi_phi, tin_nhan_moi, lead_so").gte("ngay", tu).limit(5000),
  ]);
  // Tổng theo ngày: chi phí cộng các chiến dịch Meta; tin nhắn/lead lấy từ số đo thực ở Pancake (chiến dịch giả pancake-hoi-thoai).
  const idPancake = (cd ?? []).find((c) => c.ma === "pancake-hoi-thoai")?.id;
  const theoNgay = new Map<string, { ngay: string; chi: number; tin: number; lead: number }>();
  for (const r of gan ?? []) {
    const o = theoNgay.get(r.ngay) ?? { ngay: r.ngay, chi: 0, tin: 0, lead: 0 };
    if (r.chien_dich_id === idPancake) { o.tin += r.tin_nhan_moi; o.lead += r.lead_so; } else o.chi += Number(r.chi_phi);
    theoNgay.set(r.ngay, o);
  }
  const tong = [...theoNgay.values()].sort((a, b) => b.ngay.localeCompare(a.ngay));
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
      <h2 className="mb-2 mt-4 text-[14px] font-medium">Tổng theo ngày (21 ngày gần nhất)</h2>
      <p className="mb-2 text-[12px] text-muc-3">Chi phí: cộng các chiến dịch Meta. Tin nhắn và lead: số đếm thực ở Pancake (hội thoại inbox mới; lead = có số điện thoại), không phải số Meta tự báo.</p>
      <Bang duLieu={tong} khoa={(r) => r.ngay} trong="Chưa có số liệu."
        cot={[
          { nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Chi phí", phai: true, hienThi: (r) => tienVN(r.chi) },
          { nhan: "Tin nhắn (Pancake)", phai: true, hienThi: (r) => soVN(r.tin) }, { nhan: "Giá / tin nhắn", phai: true, hienThi: (r) => (r.tin > 0 ? tienVN(Math.round(r.chi / r.tin)) : "—") },
          { nhan: "Lead (có SĐT)", phai: true, hienThi: (r) => soVN(r.lead) },
        ]} />
      <h2 className="mb-2 mt-6 text-[14px] font-medium">Chi tiết theo chiến dịch</h2>
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
