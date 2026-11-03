"use client";

import { useState, useTransition } from "react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import type { ganNhomKhachMoi } from "@/app/(app)/lich-hen/actions";
import type { KhachChon } from "@/components/khach/ChonKhach";
import type { timKhach } from "@/app/(app)/ban-hang/actions";
import { NGUON } from "@/lib/khach";

// "Khách cũ giới thiệu" cần nhập người giới thiệu nên không có ở đây: chọn hồ sơ đầy đủ ở màn Khách hàng.
const NGUON_NHANH = NGUON.filter((n) => n.gia_tri !== "khach_cu_gioi_thieu");

const GIOI_TINH = [{ gia_tri: "", nhan: "Không ghi" }, { gia_tri: "nữ", nhan: "Nữ" }, { gia_tri: "nam", nhan: "Nam" }];

/** Tạo khách ngay trong hộp Đặt lịch (SalonHero: "Tạo khách hàng mới" trong form). Bốn ô bắt buộc của hồ sơ khách + phần "Thêm thông tin" như SalonHero (giới tính, email, địa chỉ,
 *  tỉnh/thành, quận/huyện, nhóm khách hàng); ghi qua đúng hàm lưu khách của màn Khách hàng nên giữ nguyên mọi kiểm tra (số điện thoại hợp lệ, không trùng số, chi nhánh). */
export function TaoKhachNhanh({ chiNhanhId, nhanVien, macDinhNv, tim, action, onXong, onDong, nhom = [], ganNhom }: {
  chiNhanhId: string; nhanVien: LuaChon[]; macDinhNv: string; tim: typeof timKhach; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string; id?: string }>;
  onXong: (k: KhachChon) => void; onDong: () => void;
  /** Nhóm khách hàng chọn được (bảng nhom_khach đang dùng); trống thì ẩn ô nhóm. */ nhom?: LuaChon[]; ganNhom?: typeof ganNhomKhachMoi;
}) {
  const [them, setThem] = useState(false);
  const [gioiTinh, setGioiTinh] = useState("");
  const [email, setEmail] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [tinh, setTinh] = useState("");
  const [quan, setQuan] = useState("");
  const [nhomChon, setNhomChon] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [nguon, setNguon] = useState("");
  const [pt, setPt] = useState(nhanVien.some((n) => n.gia_tri === macDinhNv) ? macDinhNv : "");
  const [loi, setLoi] = useState("");
  const [dang, bat] = useTransition();
  const luu = () => {
    setLoi("");
    if (!chiNhanhId) { setLoi("Chọn chi nhánh trước khi tạo khách."); return; }
    const fd = new FormData();
    fd.set("ho_ten", hoTen.trim()); fd.set("dien_thoai", sdt.trim()); fd.set("nguon", nguon); fd.set("nguoi_phu_trach_id", pt); fd.set("chi_nhanh_id", chiNhanhId);
    // Ô thêm: chỉ gửi khi có nhập (hàm lưu khách bỏ qua ô không gửi).
    if (gioiTinh) fd.set("gioi_tinh", gioiTinh);
    if (email.trim()) fd.set("email", email.trim());
    if (diaChi.trim()) fd.set("dia_chi", diaChi.trim());
    if (tinh.trim()) fd.set("tinh_thanh", tinh.trim());
    if (quan.trim()) fd.set("quan_huyen", quan.trim());
    bat(async () => {
      try {
        const kq = await action(fd);
        if (kq.loi || !kq.id) { setLoi(kq.loi ?? "Chưa tạo được khách."); return; }
        if (nhomChon && ganNhom) {
          const g = await ganNhom(kq.id, [nhomChon]).catch(() => ({ loi: "mất kết nối" }));
          if (g.loi) window.alert(`Đã tạo khách nhưng chưa gán được nhóm (${g.loi}). Gán nhóm sau ở hồ sơ khách.`);
        }
        // Lấy lại hồ sơ vừa tạo để có mã khách; nếu tài khoản không tra được thì dùng tạm số liệu vừa nhập.
        const ds = (await tim(sdt.trim()).catch(() => [])) as KhachChon[];
        onXong(ds.find((k) => k.id === kq.id) ?? { id: kq.id, ma: "", ho_ten: hoTen.trim(), dien_thoai: sdt.trim(), nguoi_phu_trach_id: pt });
      } catch {
        // Máy chủ quá tải / mất mạng: giữ nguyên các ô đã nhập để bấm lại. Khách có thể đã được tạo: tìm theo số điện thoại trước khi bấm lại.
        setLoi("Hệ thống đang chậm, chưa biết khách đã được tạo chưa. Tìm khách theo số điện thoại trước, chưa thấy thì bấm Tạo khách lại.");
      }
    });
  };
  return (
    <fieldset className="rounded-the border border-vien bg-giay-sang p-3" aria-label="Tạo khách mới">
      <legend className="px-1 text-[13px] font-medium text-muc-2">Tạo khách mới</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="tk-ten" className={NHAN_O}>Họ tên <span className="text-loi">*</span></label><input id="tk-ten" value={hoTen} onChange={(e) => setHoTen(e.target.value)} maxLength={100} className={O_NHAP} autoComplete="off" /></div>
        <div><label htmlFor="tk-sdt" className={NHAN_O}>Số điện thoại <span className="text-loi">*</span></label><input id="tk-sdt" inputMode="tel" value={sdt} onChange={(e) => setSdt(e.target.value.replace(/[^\d+\s]/g, ""))} maxLength={16} className={O_NHAP} autoComplete="off" /></div>
        <div><label className={NHAN_O}>Nguồn khách <span className="text-loi">*</span></label><Chon trong="Chọn nguồn" ariaLabel="Nguồn khách" giaTri={nguon} onDoi={setNguon} luaChon={NGUON_NHANH} /></div>
        <div><label className={NHAN_O}>Người phụ trách <span className="text-loi">*</span></label><Chon trong="Chọn người phụ trách" ariaLabel="Người phụ trách" giaTri={pt} onDoi={setPt} luaChon={nhanVien} /></div>
      </div>
      <button type="button" className={`mt-3 text-[13px] ${NUT_CHU}`} aria-expanded={them} onClick={() => setThem(!them)}>{them ? "Ẩn thông tin thêm" : "Thêm thông tin (giới tính, email, địa chỉ, nhóm)"}</button>
      {them && (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div><label className={NHAN_O}>Giới tính</label><Chon ariaLabel="Giới tính" giaTri={gioiTinh} onDoi={setGioiTinh} luaChon={GIOI_TINH} /></div>
          <div><label htmlFor="tk-email" className={NHAN_O}>Email</label><input id="tk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} className={O_NHAP} autoComplete="off" /></div>
          <div className="sm:col-span-2"><label htmlFor="tk-dc" className={NHAN_O}>Địa chỉ</label><input id="tk-dc" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} maxLength={200} className={O_NHAP} autoComplete="off" /></div>
          <div><label htmlFor="tk-tinh" className={NHAN_O}>Tỉnh / thành phố</label><input id="tk-tinh" value={tinh} onChange={(e) => setTinh(e.target.value)} maxLength={80} className={O_NHAP} autoComplete="off" /></div>
          <div><label htmlFor="tk-quan" className={NHAN_O}>Quận / huyện</label><input id="tk-quan" value={quan} onChange={(e) => setQuan(e.target.value)} maxLength={80} className={O_NHAP} autoComplete="off" /></div>
          {nhom.length > 0 && ganNhom && <div className="sm:col-span-2"><label className={NHAN_O}>Nhóm khách hàng</label><Chon ariaLabel="Nhóm khách hàng" trong="Không chọn nhóm" giaTri={nhomChon} onDoi={setNhomChon} luaChon={[{ gia_tri: "", nhan: "Không chọn nhóm" }, ...nhom]} /></div>}
        </div>
      )}
      {loi && <div role="alert" className="mt-3 rounded-nho bg-loi-nen px-3 py-2 text-[13px] text-loi">{loi}</div>}
      <div className="mt-3 flex justify-end gap-2.5">
        <button type="button" className={NUT_PHU} onClick={onDong}>Thôi</button>
        <button type="button" className={NUT_CHINH} disabled={dang || !hoTen.trim() || !sdt.trim() || !nguon || !pt} onClick={luu}>{dang ? "Đang tạo" : "Tạo khách"}</button>
      </div>
    </fieldset>
  );
}
