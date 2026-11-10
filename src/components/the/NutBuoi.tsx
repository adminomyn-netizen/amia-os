"use client";

import { useState } from "react";
import Link from "next/link";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { homNayHCM } from "@/lib/dinh-dang";
import { chuyenTriLieu } from "@/app/(app)/the/cho-lam/actions";

export type KetQuaBuoi = { ok?: boolean; loi?: string; canhBao?: string; phieuId?: string; phieuMa?: string; xemPhieu?: boolean; phieuBacSi?: boolean; /** Đã chuyển cho chuyên viên trị liệu (chưa trừ buổi). */ chuyenCho?: string };

/** Dòng báo sau khi bấm: đã chuyển cho chuyên viên trị liệu (chờ làm), hoặc phiếu vật tư vừa tạo cho buổi (có quyền xem phiếu thì là link). */
export function BaoPhieuBuoi({ phieu }: { phieu: KetQuaBuoi | null }) {
  if (phieu?.chuyenCho !== undefined) return (
    <span className="text-[12.5px] text-muc-3">
      Đã chuyển cho {phieu.chuyenCho || "chuyên viên trị liệu"}, chờ làm (chưa trừ buổi) · <Link href="/the/cho-lam" className="font-medium text-nhan-dam hover:underline">Xem khách chờ làm</Link>
    </span>
  );
  if (!phieu?.phieuId) return null;
  return (
    <span className="text-[12.5px] text-muc-3">
      {phieu.phieuBacSi ? `Ca này đã có phiếu bác sĩ chỉ định ${phieu.phieuMa}` : `Phiếu vật tư ${phieu.phieuMa} chờ chuyên viên trị liệu kiểm`}
      {phieu.xemPhieu && <> · <Link href={`/phieu-cap/${phieu.phieuId}`} target="_blank" className="font-medium text-nhan-dam hover:underline">Mở phiếu vật tư</Link></>}
    </span>
  );
}

/** Lựa chọn nhiều người: tên kèm nhóm vai trò (ô chọn nhiều không chia nhóm). `uuTien` = nhóm đưa lên đầu. */
export const luaChonNhieu = (ds: LuaChon[], uuTien?: string): LuaChon[] =>
  [...ds].filter((n) => n.gia_tri).sort((a, b) => Number(b.nhom === uuTien) - Number(a.nhom === uuTien)).map((n) => ({ gia_tri: n.gia_tri, nhan: n.nhom ? `${n.nhan} · ${n.nhom}` : n.nhan }));

/** Các ô người làm + tư vấn + thông số ca, dùng chung cho hộp Thực hiện buổi và hộp Đã làm xong của chuyên viên (/the/cho-lam). */
export function truongBuoi({ nhanVien, bacSi, coNgay }: { nhanVien: LuaChon[]; bacSi: LuaChon[]; coNgay?: boolean }): Truong[] {
  return [
    { ten: "nv_ids", nhan: "Người thực hiện", loai: "nhieu", luaChon: luaChonNhieu(nhanVien, "Chuyên viên trị liệu"), batBuoc: true, rong: true, ghiChu: "Chọn được nhiều người (vd bác sĩ + chuyên viên cùng làm). Người chọn đầu tiên là người chính, doanh thu / hoa hồng buổi tính cho người chính." },
    { ten: "bac_si_id", nhan: "Bác sĩ chỉ định", loai: "chon", luaChon: bacSi }, ...(coNgay ? [{ ten: "ngay", nhan: "Ngày làm", loai: "ngay" } as Truong] : []),
    { ten: "tu_van_ids", nhan: "Tư vấn", loai: "nhieu", luaChon: luaChonNhieu(nhanVien, "Tư vấn"), rong: true, ghiChu: "Người tư vấn cho khách trong buổi này (chọn được nhiều người)." },
    { ten: "tu_van_tinh_trang", nhan: "Tư vấn: tình trạng da", loai: "nhieu_dong", goiY: "Vd: da dầu, lỗ chân lông to vùng chữ T, thâm sau mụn" },
    { ten: "tu_van_de_xuat", nhan: "Tư vấn: khuyến nghị, sản phẩm / dịch vụ đề xuất", loai: "nhieu_dong", goiY: "Vd: dùng kem chống nắng hằng ngày, đề xuất thêm 3 buổi peel", ghiChu: "Có nội dung tư vấn thì lưu thành phiếu tư vấn của khách (người tư vấn đầu tiên đứng tên)." },
    { ten: "vung", nhan: "Vùng làm", loai: "chu", goiY: "Mặt, cổ, bụng..." },
    { ten: "shot", nhan: "Số shot thực tế", loai: "so" }, { ten: "line", nhan: "Số line thực tế", loai: "so" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" },
    { ten: "ke_tiep_ngay", nhan: "Hẹn buổi kế tiếp: ngày", loai: "ngay", ghiChu: "Không bắt buộc. Có ngày hẹn thì hệ thống ghi nhắc và hiện ở trang Nhắc tái khám. Không ảnh hưởng số buổi hay tiền." },
    { ten: "ke_tiep_noi_dung", nhan: "Hẹn buổi kế tiếp: nội dung", loai: "chu", goiY: "Vd: làm vùng cổ, kiểm tra sau 2 tuần" },
  ];
}

/** Nút "Thực hiện buổi" dùng ở danh sách thẻ, hồ sơ thẻ, hồ sơ khách và Bán hàng.
 *  Nút chính: "Chuyển cho chuyên viên trị liệu" (khách vào hàng Chờ làm, CHƯA trừ buổi). Nút phụ: "Đã làm xong" (trừ buổi ngay như cũ). */
export function NutBuoi({ theId, nhanVien, bacSi, dichVu, action, lichId, nhan = "Thực hiện buổi", onXong, macDinh }: {
  theId: string; nhanVien: LuaChon[]; bacSi: LuaChon[]; dichVu: LuaChon[]; action: (fd: FormData) => Promise<KetQuaBuoi>; lichId?: string; nhan?: string;
  /** Điền sẵn theo lần trước khách dùng thẻ (dịch vụ, người làm, bác sĩ). */ macDinh?: { dv?: string; nv?: string; bs?: string } | null;
  /** Nơi gọi tự hiện phiếu (vd màn Bán hàng, nút có thể biến mất khi thẻ hết buổi); có thì NutBuoi không tự hiện. */ onXong?: (kq: KetQuaBuoi) => void;
}) {
  const [phieu, setPhieu] = useState<KetQuaBuoi | null>(null);
  const xong = (r: KetQuaBuoi) => { if (onXong) onXong(r); else setPhieu(r.phieuId || r.chuyenCho !== undefined ? r : null); };
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <NutHop kieu="chu" nhan={nhan} tieuDe="Thực hiện buổi" rong
        moTa="Chuyển cho chuyên viên trị liệu: khách vào danh sách Chờ làm của chuyên viên, CHƯA trừ buổi. Chuyên viên bấm Đã làm xong mới trừ 1 buổi, ghi doanh thu buổi và ra phiếu vật tư theo định mức. Khách đã làm xong rồi thì bấm Đã làm xong ngay tại đây. Nhập nhầm thì huỷ buổi để hoàn lại."
        nhanLuu="Chuyển cho chuyên viên trị liệu"
        an={{ the_id: theId, ...(lichId ? { lich_id: lichId } : {}) }} giaTri={{ dich_vu_id: dichVu.length === 1 ? dichVu[0].gia_tri : macDinh?.dv && dichVu.some((d) => d.gia_tri === macDinh.dv) ? macDinh.dv : "", ngay: homNayHCM(),
          nv_ids: macDinh?.nv && nhanVien.some((n) => n.gia_tri === macDinh.nv) ? [macDinh.nv] : [], tu_van_ids: [], ...(macDinh?.bs && bacSi.some((n) => n.gia_tri === macDinh.bs) ? { bac_si_id: macDinh.bs } : {}) }}
        truong={[{ ten: "dich_vu_id", nhan: "Dịch vụ khách làm hôm nay", loai: "chon", luaChon: dichVu, batBuoc: true, rong: true, ghiChu: "Phiếu vật tư lấy định mức của dịch vụ này." }, ...truongBuoi({ nhanVien, bacSi, coNgay: true })]}
        action={async (fd) => { const r: KetQuaBuoi = await chuyenTriLieu(fd); if (r.ok) xong({ ...r, chuyenCho: r.chuyenCho ?? "" }); return r; }}
        nutPhu={{ nhan: "Đã làm xong", action: async (fd) => { const r = await action(fd); if (r.ok) xong(r); return r; } }} />
      {!onXong && <BaoPhieuBuoi phieu={phieu} />}
    </span>
  );
}
