"use client";

import { useState } from "react";
import Link from "next/link";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { homNayHCM } from "@/lib/dinh-dang";
import { chuyenNhieuThe, chuyenTriLieu } from "@/app/(app)/the/cho-lam/actions";
import { cheDoDvThe, dvTheoGoi } from "@/lib/don-nhieu-dich-vu";

export type KetQuaBuoi = { ok?: boolean; loi?: string; canhBao?: string; phieuId?: string; phieuMa?: string; xemPhieu?: boolean; phieuBacSi?: boolean; /** Đã chuyển cho chuyên viên trị liệu (chưa trừ buổi). */ chuyenCho?: string; luotId?: string };

/** Dòng báo sau khi bấm: đã chuyển cho chuyên viên trị liệu (chờ làm), hoặc phiếu vật tư vừa tạo cho buổi (có quyền xem phiếu thì là link). */
export function BaoPhieuBuoi({ phieu }: { phieu: KetQuaBuoi | null }) {
  if (phieu?.chuyenCho !== undefined) return (
    <span className="text-[12.5px] text-muc-3">
      Đã gửi chuyên viên trị liệu{phieu.chuyenCho ? ` (${phieu.chuyenCho})` : ""} — chờ Kết thúc (chưa trừ buổi) · <Link href="/the/cho-lam" className="font-medium text-nhan-dam hover:underline">Xem khách chờ làm</Link>
      {phieu.luotId && <> · <Link href={`/in/phieu-lam/${phieu.luotId}`} target="_blank" className="font-medium text-nhan-dam hover:underline">In phiếu làm dịch vụ</Link></>}
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

/** Các ô người làm + tư vấn + thông số ca, dùng chung cho hộp Gửi chuyên viên làm và hộp Kết thúc của chuyên viên (/the/cho-lam). */
export function truongBuoi({ nhanVien, bacSi, coNgay }: { nhanVien: LuaChon[]; bacSi: LuaChon[]; coNgay?: boolean }): Truong[] {
  return [
    { ten: "nv_ids", nhan: "Người làm (chuyên viên trị liệu)", loai: "nhieu", luaChon: luaChonNhieu(nhanVien, "Chuyên viên trị liệu"), batBuoc: true, rong: true, ghiChu: "Chọn được nhiều người (vd bác sĩ + chuyên viên cùng làm). Người chọn đầu tiên là người chính, doanh thu / hoa hồng buổi tính cho người chính." },
    { ten: "bac_si_id", nhan: "Bác sĩ", loai: "chon", luaChon: bacSi }, ...(coNgay ? [{ ten: "ngay", nhan: "Ngày làm", loai: "ngay" } as Truong] : []),
    { ten: "tu_van_ids", nhan: "Tư vấn viên", loai: "nhieu", luaChon: luaChonNhieu(nhanVien, "Tư vấn"), rong: true, ghiChu: "Người tư vấn cho khách trong buổi này (chọn được nhiều người)." },
    { ten: "tu_van_tinh_trang", nhan: "Tư vấn: tình trạng da", loai: "nhieu_dong", goiY: "Vd: da dầu, lỗ chân lông to vùng chữ T, thâm sau mụn" },
    { ten: "tu_van_de_xuat", nhan: "Tư vấn: khuyến nghị, sản phẩm / dịch vụ đề xuất", loai: "nhieu_dong", goiY: "Vd: dùng kem chống nắng hằng ngày, đề xuất thêm 3 buổi peel", ghiChu: "Có nội dung tư vấn thì lưu thành phiếu tư vấn của khách (người tư vấn đầu tiên đứng tên)." },
    { ten: "vung", nhan: "Vùng điều trị", loai: "chu", goiY: "Mặt, cổ, bụng..." },
    { ten: "shot", nhan: "Số shot thực tế", loai: "so" }, { ten: "line", nhan: "Số line thực tế", loai: "so" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" },
    { ten: "ke_tiep_ngay", nhan: "Hẹn buổi kế tiếp: ngày", loai: "ngay", ghiChu: "Không bắt buộc. Có ngày hẹn thì hệ thống ghi nhắc và hiện ở trang Nhắc tái khám. Không ảnh hưởng số buổi hay tiền." },
    { ten: "ke_tiep_noi_dung", nhan: "Hẹn buổi kế tiếp: nội dung", loai: "chu", goiY: "Vd: làm vùng cổ, kiểm tra sau 2 tuần" },
  ];
}

/** Nút "Gửi chuyên viên làm" dùng ở danh sách thẻ, hồ sơ thẻ, hồ sơ khách và Bán hàng (chị Thuý 10/11, chị Lâm 11/11/2026).
 *  Nút chính: khách vào hàng Chờ làm của chuyên viên trị liệu, CHƯA trừ buổi — chuyên viên bấm Kết thúc mới trừ.
 *  Nút phụ "Trừ buổi trực tiếp (chỉnh sửa)" CHỈ hiện khi `truTrucTiep` (Chủ / Kỹ thuật — duocTruBuoiTrucTiep), có hỏi lại trước khi trừ. */
export function NutBuoi({ theId, nhanVien, bacSi, dichVu, goiId, tenThe, buoiCon, buoiTong, action, truTrucTiep, lichId, nhan = "Gửi chuyên viên làm", onXong, macDinh }: {
  theId: string; nhanVien: LuaChon[]; bacSi: LuaChon[];
  /** CHỈ dịch vụ gắn với gói của thẻ (rỗng = gói chưa gắn dịch vụ → gửi chính thẻ, ẩn ô dịch vụ). Thẻ không có gói thì nơi gọi đưa cả danh mục. */ dichVu: LuaChon[];
  goiId?: string | null; tenThe?: string; buoiCon?: number; buoiTong?: number | null; action: (fd: FormData) => Promise<KetQuaBuoi>; lichId?: string; nhan?: string;
  /** Người đang xem được trừ buổi trực tiếp (duocTruBuoiTrucTiep). Máy chủ (thucHienBuoi) vẫn tự chặn. */ truTrucTiep?: boolean;
  /** Điền sẵn theo lần trước khách dùng thẻ (dịch vụ, người làm, bác sĩ). */ macDinh?: { dv?: string; nv?: string; bs?: string } | null;
  /** Nơi gọi tự hiện phiếu (vd màn Bán hàng, nút có thể biến mất khi thẻ hết buổi); có thì NutBuoi không tự hiện. */ onXong?: (kq: KetQuaBuoi) => void;
}) {
  const [phieu, setPhieu] = useState<KetQuaBuoi | null>(null);
  const xong = (r: KetQuaBuoi) => { if (onXong) onXong(r); else setPhieu(r.phieuId || r.chuyenCho !== undefined ? r : null); };
  // Thẻ chưa gắn dịch vụ: hiện chính thẻ, ẩn ô dịch vụ (máy chủ đổi sang dịch vụ mang tên gói); 1 dịch vụ: hiện thẳng; nhiều: chọn trong đúng các dịch vụ của thẻ.
  const cd = cheDoDvThe(dichVu, goiId);
  const con = buoiCon != null ? ` · còn ${buoiCon}${buoiTong != null && buoiTong < 999_999 ? `/${buoiTong}` : ""} buổi` : "";
  // Dòng thẻ / dịch vụ sẽ làm: khung nổi bật cho thu ngân nhận ra ngay (chị Lâm 11/11: "làm nổi bật cái này lên cho dễ nhận biết").
  const tieuDong = cd.kieu === "the" ? (tenThe || "Thẻ liệu trình") : cd.kieu === "mot" ? cd.ten : tenThe;
  const nhanDong = cd.kieu === "mot" ? "Dịch vụ" : "Thẻ";
  const phuDong = cd.kieu === "the" ? `1 buổi${con}` : cd.kieu === "mot" ? (tenThe ? `Thẻ ${tenThe}${con}` : "") : con.replace(/^ · /, "");
  const dongThe = tieuDong ? (
    <div className="rounded-the border-2 border-nhan bg-nhan/10 px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-nhan-dam">{nhanDong} sẽ làm</p>
      <p className="mt-0.5 text-[18px] font-bold leading-snug text-muc">{tieuDong}</p>
      {phuDong && <p className="mt-0.5 text-[15px] font-semibold text-nhan-dam">{phuDong}</p>}
      {cd.kieu === "the" && <p className="mt-1 text-[13px] text-muc-2">Thẻ chưa gắn dịch vụ: chuyên viên trị liệu làm theo thẻ.</p>}
    </div>
  ) : undefined;
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <NutHop kieu="chu" nhan={nhan} tieuDe="Gửi chuyên viên làm" rong
        moTa={`Khách vào danh sách Chờ làm của chuyên viên trị liệu, CHƯA trừ buổi. Chuyên viên bấm Bắt đầu làm, tích từng bước, bấm Kết thúc mới trừ 1 buổi, ghi doanh thu buổi và ra phiếu vật tư theo định mức.${truTrucTiep ? " Trừ buổi trực tiếp chỉ dùng để chỉnh sửa / ghi bù buổi đã làm (bỏ qua chuyên viên); nhập nhầm thì huỷ buổi để hoàn lại." : ""}`}
        nhanLuu="Gửi chuyên viên làm"
        xacNhan={dongThe}
        an={{ the_id: theId, ...(lichId ? { lich_id: lichId } : {}), ...(cd.kieu !== "chon" ? { dich_vu_id: cd.dvId } : {}) }}
        giaTri={{ ...(cd.kieu === "chon" ? { dich_vu_id: macDinh?.dv && dichVu.some((d) => d.gia_tri === macDinh.dv) ? macDinh.dv : "" } : {}), ngay: homNayHCM(),
          nv_ids: macDinh?.nv && nhanVien.some((n) => n.gia_tri === macDinh.nv) ? [macDinh.nv] : [], tu_van_ids: [], ...(macDinh?.bs && bacSi.some((n) => n.gia_tri === macDinh.bs) ? { bac_si_id: macDinh.bs } : {}) }}
        truong={[...(cd.kieu === "chon" ? [{ ten: "dich_vu_id", nhan: "Dịch vụ khách làm hôm nay", loai: "chon", luaChon: dichVu, batBuoc: true, rong: true, ghiChu: "Phiếu vật tư lấy định mức của dịch vụ này." } as Truong] : []), ...truongBuoi({ nhanVien, bacSi, coNgay: true })]}
        action={async (fd) => { const r: KetQuaBuoi = await chuyenTriLieu(fd); if (r.ok) xong({ ...r, chuyenCho: r.chuyenCho ?? "" }); return r; }}
        nutPhu={truTrucTiep ? { nhan: "Trừ buổi trực tiếp (chỉnh sửa)", action: async (fd) => {
          if (!window.confirm("Trừ 1 buổi NGAY, bỏ qua chuyên viên trị liệu? Chỉ dùng để chỉnh sửa / ghi bù buổi đã làm.")) return { loi: "Chưa trừ buổi." };
          const r = await action(fd); if (r.ok) xong(r); return r;
        } } : undefined} />
      {!onXong && <BaoPhieuBuoi phieu={phieu} />}
    </span>
  );
}

export type TheChuyen = { id: string; ten: string; ma: string; buoiCon: number; buoiTong: number | null; dichVu: LuaChon[]; /** Gói của thẻ: thẻ chưa gắn dịch vụ thì chọn được "làm theo thẻ". */ goiId?: string | null };
/** Lựa chọn dịch vụ của một thẻ trong "Làm nhiều thẻ": dịch vụ của gói, hoặc chính thẻ khi gói chưa gắn dịch vụ. */
const dvChonThe = (t: TheChuyen): LuaChon[] => t.dichVu.length ? t.dichVu : t.goiId ? [{ gia_tri: dvTheoGoi(t.goiId), nhan: `${t.ten} · 1 buổi (làm theo thẻ)` }] : [];

/** "Làm nhiều thẻ cùng lúc": khách làm nhiều dịch vụ ở nhiều thẻ trong một lần đến. Mỗi thẻ chọn dịch vụ (để trống = không làm),
 *  người làm / bác sĩ / tư vấn viên dùng chung; chuyển hết cho chuyên viên trị liệu một lần (chưa trừ buổi). */
export function NutNhieuThe({ the, nhanVien, bacSi, lichId, onXong }: { the: TheChuyen[]; nhanVien: LuaChon[]; bacSi: LuaChon[]; lichId?: string; onXong?: (kq: KetQuaBuoi) => void }) {
  const [phieu, setPhieu] = useState<KetQuaBuoi | null>(null);
  const ds = the.filter((t) => t.buoiCon > 0 && dvChonThe(t).length).slice(0, 10);
  if (ds.length < 2) return null;
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <NutHop kieu="phu" nhan={`Làm nhiều thẻ cùng lúc (${ds.length})`} tieuDe="Làm nhiều thẻ cùng lúc" rong
        moTa="Mỗi thẻ chọn dịch vụ khách làm hôm nay; thẻ nào không làm thì để trống. Người làm, bác sĩ, tư vấn viên dùng chung cho các thẻ. Bấm chuyển: mỗi thẻ thành một lượt Chờ làm của chuyên viên trị liệu, CHƯA trừ buổi."
        nhanLuu="Chuyển cho chuyên viên trị liệu"
        an={{ ...(lichId ? { lich_id: lichId } : {}), ...Object.fromEntries(ds.map((t) => [`ten__${t.id}`, t.ten])) }}
        giaTri={{ nv_ids: [], tu_van_ids: [], ...Object.fromEntries(ds.map((t) => [`dv__${t.id}`, ""])) }}
        truong={[
          ...ds.map((t): Truong => ({ ten: `dv__${t.id}`, nhan: `${t.ten}${t.ma ? ` (#${t.ma})` : ""} · còn ${t.buoiCon}${t.buoiTong != null && t.buoiTong < 999_999 ? `/${t.buoiTong}` : ""} buổi`, loai: "chon", rong: true,
            luaChon: [{ gia_tri: "", nhan: "Không làm thẻ này" }, ...dvChonThe(t)] })),
          ...truongBuoi({ nhanVien, bacSi }),
        ]}
        action={async (fd) => { const r: KetQuaBuoi = await chuyenNhieuThe(fd); if (r.ok) { const k = { ...r, chuyenCho: r.chuyenCho ?? "" }; if (onXong) onXong(k); else setPhieu(k); } return r; }} />
      {!onXong && <BaoPhieuBuoi phieu={phieu} />}
    </span>
  );
}
