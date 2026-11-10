import { NutHop } from "@/components/ui/BieuMau";
import { suaThe } from "@/app/(app)/the/actions";

/** Nút "Sửa thẻ" (hạn, chủ thẻ, giá 1 buổi, ghi chú — KHÔNG đổi số buổi / số dư) dùng chung ở hồ sơ thẻ, danh sách /the và hồ sơ khách.
 *  Nơi gọi tự kiểm quyền the.dieuchinh + thẻ chưa thu hồi; server action suaThe kiểm lại quyền + chi nhánh và ghi Lịch sử sửa. */
export function NutSuaThe({ t, maKhach, kieu = "chu", nhan = "Sửa thẻ" }: {
  t: { id: string; ma: string; loai: string; han_dung: string | null; gia_tri_buoi: number | null; ghi_chu: string | null }; maKhach: string; kieu?: "chinh" | "phu" | "chu"; nhan?: string;
}) {
  return <NutHop nhan={nhan} kieu={kieu} tieuDe={`Sửa thẻ ${t.ma}`} rong
          moTa="Như SalonHero: sửa hạn thẻ, đổi chủ thẻ, giá 1 buổi làm dịch vụ, ghi chú. Không đổi số buổi / số dư (muốn cộng trừ thì dùng Điều chỉnh số dư). Mỗi lần sửa ghi vào Lịch sử thẻ: ai sửa, lúc nào, cũ → mới."
          an={{ the_id: t.id }} giaTri={{ han_dung: t.han_dung ?? "", khach: maKhach, gia_tri_buoi: t.loai === "lan" ? Number(t.gia_tri_buoi ?? 0) : "", ghi_chu: t.ghi_chu ?? "" }}
          truong={[{ ten: "han_dung", nhan: "Hạn thẻ", loai: "ngay", ghiChu: "Để trống = thẻ không hạn." }, { ten: "khach", nhan: "Chủ thẻ (mã khách hoặc số điện thoại)", loai: "chu", batBuoc: true, rong: true, ghiChu: "Đổi sang khách khác cùng chi nhánh để chuyển chủ thẻ." },
            ...(t.loai === "lan" ? [{ ten: "gia_tri_buoi", nhan: "Giá 1 buổi làm dịch vụ", loai: "tien" as const, ghiChu: "Doanh thu ghi cho mỗi buổi làm từ nay về sau; buổi đã làm giữ nguyên." }] : []),
            { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true }, { ten: "ly_do", nhan: "Lý do sửa (không bắt buộc)", loai: "chu", rong: true }]} action={suaThe} />
}
