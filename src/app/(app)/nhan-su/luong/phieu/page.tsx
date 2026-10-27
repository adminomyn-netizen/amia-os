import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";

/** Phiếu lương của chính tôi: chỉ các kỳ đã duyệt hoặc đã chi, chỉ dòng của mình. */
export default async function TrangPhieuLuong() {
  const nd = await yeuCauNoiBo();
  const db = sb();
  const { data: dong } = await db.from("bang_luong_dong").select("*").eq("nhan_vien_id", nd.nhanVienId);
  const ids = (dong ?? []).map((d) => d.ky_id);
  const { data: ky } = ids.length ? await db.from("ky_luong").select("id, nam, thang, trang_thai").in("id", ids).in("trang_thai", ["da_duyet", "da_chi"]).order("nam", { ascending: false }).order("thang", { ascending: false }) : { data: [] };
  const theoKy = new Map((dong ?? []).map((d) => [d.ky_id, d]));
  return (
    <div>
      <Link href="/noi-lam-viec" className="text-[13px] text-muc-3 hover:text-muc">← Nơi làm việc</Link>
      <TieuDeTrang tieuDe="Phiếu lương của tôi" phu="Chỉ hiện các kỳ lương đã được duyệt. Có thắc mắc, báo bộ phận nhân sự trong 1 ngày làm việc kể từ khi nhận." />
      <Bang duLieu={ky ?? []} khoa={(r) => r.id} trong="Chưa có phiếu lương nào được duyệt."
        cot={[
          { nhan: "Kỳ", chinh: true, hienThi: (r) => `Tháng ${String(r.thang).padStart(2, "0")}/${r.nam}` },
          { nhan: "Công", phai: true, hienThi: (r) => `${soVN(theoKy.get(r.id)?.cong_tinh)}/${soVN(theoKy.get(r.id)?.cong_chuan)}` },
          { nhan: "Tổng thu nhập", phai: true, hienThi: (r) => tienVN(theoKy.get(r.id)?.gross) }, { nhan: "BHXH + thuế", phai: true, hienThi: (r) => tienVN(Number(theoKy.get(r.id)?.bhxh_nld) + Number(theoKy.get(r.id)?.thue_tncn)) },
          { nhan: "Trừ khác, tạm ứng", phai: true, hienThi: (r) => tienVN(Number(theoKy.get(r.id)?.tru_khac) + Number(theoKy.get(r.id)?.tru_vi_pham) + Number(theoKy.get(r.id)?.tam_ung)) },
          { nhan: "Thực nhận", phai: true, hienThi: (r) => <b>{tienVN(theoKy.get(r.id)?.thuc_tra)}</b> },
          { nhan: "Trạng thái", hienThi: (r) => (r.trang_thai === "da_chi" ? "Đã chi" : "Đã duyệt, chờ chi") },
        ]} />
    </div>
  );
}
