"use client";

import { useState } from "react";
import Link from "next/link";
import { NutHop } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { homNayHCM } from "@/lib/dinh-dang";

export type KetQuaBuoi = { ok?: boolean; loi?: string; canhBao?: string; phieuId?: string; phieuMa?: string; xemPhieu?: boolean };

/** Dòng báo phiếu vật tư vừa tạo cho buổi: có quyền xem phiếu thì là link "Mở phiếu vật tư", không thì chỉ báo mã phiếu. */
export function BaoPhieuBuoi({ phieu }: { phieu: KetQuaBuoi | null }) {
  if (!phieu?.phieuId) return null;
  return (
    <span className="text-[12.5px] text-muc-3">
      Phiếu vật tư {phieu.phieuMa} chờ chuyên viên trị liệu kiểm
      {phieu.xemPhieu && <> · <Link href={`/phieu-cap/${phieu.phieuId}`} target="_blank" className="font-medium text-nhan-dam hover:underline">Mở phiếu vật tư</Link></>}
    </span>
  );
}

/** Nút "Thực hiện buổi" dùng ở danh sách thẻ, hồ sơ thẻ và lịch hẹn. Trừ buổi xong hiện phiếu vật tư của buổi (nếu đã tạo được). */
export function NutBuoi({ theId, nhanVien, bacSi, dichVu, action, lichId, nhan = "Thực hiện buổi", onXong }: {
  theId: string; nhanVien: LuaChon[]; bacSi: LuaChon[]; dichVu: LuaChon[]; action: (fd: FormData) => Promise<KetQuaBuoi>; lichId?: string; nhan?: string;
  /** Nơi gọi tự hiện phiếu (vd màn Bán hàng, nút có thể biến mất khi thẻ hết buổi); có thì NutBuoi không tự hiện. */ onXong?: (kq: KetQuaBuoi) => void;
}) {
  const [phieu, setPhieu] = useState<KetQuaBuoi | null>(null);
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <NutHop kieu="chu" nhan={nhan} tieuDe="Thực hiện buổi" moTa="Bấm Đã làm xong là trừ 1 buổi của thẻ, ghi doanh thu của buổi và ra phiếu vật tư theo định mức để chuyên viên trị liệu kiểm. Nhập nhầm thì huỷ buổi để hoàn lại." rong nhanLuu="Đã làm xong"
        an={{ the_id: theId, ...(lichId ? { lich_id: lichId } : {}) }} giaTri={{ dich_vu_id: dichVu.length === 1 ? dichVu[0].gia_tri : "", ngay: homNayHCM() }}
        truong={[
          { ten: "dich_vu_id", nhan: "Dịch vụ khách làm hôm nay", loai: "chon", luaChon: dichVu, batBuoc: true, rong: true, ghiChu: "Phiếu vật tư lấy định mức của dịch vụ này." }, { ten: "nv_id", nhan: "Người thực hiện", loai: "chon", luaChon: nhanVien, batBuoc: true },
          { ten: "bac_si_id", nhan: "Bác sĩ chỉ định", loai: "chon", luaChon: bacSi }, { ten: "ngay", nhan: "Ngày làm", loai: "ngay" }, { ten: "vung", nhan: "Vùng làm", loai: "chu", goiY: "Mặt, cổ, bụng..." },
          { ten: "shot", nhan: "Số shot thực tế", loai: "so" }, { ten: "line", nhan: "Số line thực tế", loai: "so" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" },
          { ten: "ke_tiep_ngay", nhan: "Hẹn buổi kế tiếp: ngày", loai: "ngay", ghiChu: "Không bắt buộc. Có ngày hẹn thì hệ thống ghi nhắc và hiện ở trang Nhắc tái khám. Không ảnh hưởng số buổi hay tiền." },
          { ten: "ke_tiep_noi_dung", nhan: "Hẹn buổi kế tiếp: nội dung", loai: "chu", goiY: "Vd: làm vùng cổ, kiểm tra sau 2 tuần" },
        ]} action={async (fd) => { const r = await action(fd); if (r.ok) { if (onXong) onXong(r); else setPhieu(r.phieuId ? r : null); } return r; }} />
      {!onXong && <BaoPhieuBuoi phieu={phieu} />}
    </span>
  );
}
