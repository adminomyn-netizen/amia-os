"use client";

import { NutHop } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { homNayHCM } from "@/lib/dinh-dang";

/** Nút "Thực hiện buổi" dùng ở danh sách thẻ, hồ sơ thẻ và lịch hẹn. */
export function NutBuoi({ theId, nhanVien, bacSi, dichVu, action, lichId, nhan = "Thực hiện buổi" }: {
  theId: string; nhanVien: LuaChon[]; bacSi: LuaChon[]; dichVu: LuaChon[]; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }>; lichId?: string; nhan?: string;
}) {
  return (
    <NutHop kieu="chu" nhan={nhan} tieuDe="Thực hiện buổi" moTa="Bấm Đã làm xong là trừ 1 buổi của thẻ và ghi doanh thu của buổi. Nhập nhầm thì huỷ buổi để hoàn lại." rong nhanLuu="Đã làm xong"
      an={{ the_id: theId, ...(lichId ? { lich_id: lichId } : {}) }} giaTri={{ dich_vu_id: dichVu.length === 1 ? dichVu[0].gia_tri : "", ngay: homNayHCM() }}
      truong={[
        { ten: "dich_vu_id", nhan: "Dịch vụ đã làm", loai: "chon", luaChon: dichVu, batBuoc: true, rong: true }, { ten: "nv_id", nhan: "Người thực hiện", loai: "chon", luaChon: nhanVien, batBuoc: true },
        { ten: "bac_si_id", nhan: "Bác sĩ chỉ định", loai: "chon", luaChon: bacSi }, { ten: "ngay", nhan: "Ngày làm", loai: "ngay" }, { ten: "vung", nhan: "Vùng làm", loai: "chu", goiY: "Mặt, cổ, bụng..." },
        { ten: "shot", nhan: "Số shot thực tế", loai: "so" }, { ten: "line", nhan: "Số line thực tế", loai: "so" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" },
        { ten: "ke_tiep_ngay", nhan: "Hẹn buổi kế tiếp: ngày", loai: "ngay", ghiChu: "Không bắt buộc. Có ngày hẹn thì hệ thống ghi nhắc và hiện ở trang Nhắc tái khám. Không ảnh hưởng số buổi hay tiền." },
        { ten: "ke_tiep_noi_dung", nhan: "Hẹn buổi kế tiếp: nội dung", loai: "chu", goiY: "Vd: làm vùng cổ, kiểm tra sau 2 tuần" },
      ]} action={action} />
  );
}
