import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { diemRaTien, diemTichDuoc, docCauHinhHang } from "@/lib/diem-hang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuDiemHang } from "./actions";

/** Quy đổi điểm thưởng theo hạng khách: chi bao nhiêu đồng được 1 điểm, 1 điểm giảm bao nhiêu đồng. Chỉ cấu hình; app chưa tự tích điểm cho hoá đơn mới. */
export default async function TrangDiemThuongTheoHang() {
  await yeuCauQuyen("hethong.phanquyen");
  const db = sb();
  const [ch, { data: dem }] = await Promise.all([docCauHinhHang(db), db.rpc("thong_ke_khach")]);
  const soKhach = ((dem ?? {}) as unknown as { hang?: Record<string, number> }).hang ?? {};
  const truong: Truong[] = [
    { ten: "tien_moi_diem", nhan: "Chi bao nhiêu đồng thì được 1 điểm", loai: "tien", batBuoc: true, ghiChu: "Điểm làm tròn xuống. Ví dụ 100.000đ: hoá đơn 360.000đ được 3 điểm." },
    { ten: "tien_doi_moi_diem", nhan: "1 điểm đổi được bao nhiêu đồng giảm giá", loai: "tien", batBuoc: true },
  ];
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Điểm thưởng theo hạng khách" phu="Tỉ lệ tích điểm và giá trị quy đổi điểm thành tiền cho từng hạng: Thường, Bạc, Vàng, Bạch kim, Kim cương." />
      <p role="status" className="mb-5 rounded-nho border border-vien px-4 py-3 text-[13px] leading-relaxed text-muc-2">Đây mới là phần cài đặt. App chưa tự tích điểm cho hoá đơn mới (điểm hiện do SalonHero chuyển sang) và màn Thu ngân vẫn đổi điểm theo cài đặt chung ở Thông tin chung. Số mặc định lấy theo điểm SalonHero đã tích (khoảng 100.000đ = 1 điểm, mọi hạng); chờ chị Lâm chốt luật theo từng hạng rồi mới bật tự tích điểm.</p>
      <Bang duLieu={ch} khoa={(r) => r.hang} trong="Chưa có cấu hình hạng nào."
        cot={[
          { nhan: "Hạng", chinh: true, hienThi: (r) => <span className="text-muc">{r.hang}</span> }, { nhan: "Số khách", phai: true, hienThi: (r) => soVN(soKhach[r.hang] ?? 0) },
          { nhan: "Chi để được 1 điểm", phai: true, hienThi: (r) => tienVN(r.tienMoiDiem) }, { nhan: "1 điểm giảm", phai: true, hienThi: (r) => tienVN(r.tienDoiMoiDiem) },
          { nhan: "Ví dụ: chi 5.000.000đ", phai: true, hienThi: (r) => `${soVN(diemTichDuoc(ch, r.hang, 5_000_000))} điểm` }, { nhan: "Ví dụ: 100 điểm", phai: true, hienThi: (r) => tienVN(diemRaTien(ch, r.hang, 100)) },
          { nhan: "", hienThi: (r) => <NutHop kieu="chu" nhan="Sửa" tieuDe={`Điểm thưởng hạng ${r.hang}`} truong={truong} an={{ hang: r.hang }} giaTri={{ tien_moi_diem: r.tienMoiDiem, tien_doi_moi_diem: r.tienDoiMoiDiem }} action={luuDiemHang} /> },
        ]} />
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Hàm tính dùng chung: <code>diem_tich_duoc(hạng, số tiền)</code> và <code>diem_ra_tien(hạng, số điểm)</code> trong cơ sở dữ liệu, <code>diem_du_kien_hoa_don(hoá đơn)</code> cho điểm dự kiến của một hoá đơn theo hạng hiện tại của khách (chỉ để xem, không ghi sổ điểm). Tự thiết kế, chưa đối chiếu SalonHero.</p>
    </div>
  );
}
