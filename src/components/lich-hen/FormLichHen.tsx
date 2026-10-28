"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { GioChon } from "@/components/ui/GioChon";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { ChonKhach, type KhachChon } from "@/components/khach/ChonKhach";
import type { timKhach } from "@/app/(app)/ban-hang/actions";
import { KIEU_LAP, laKieuLap, LUA_CHON_NGUON, nhanNguon, ngayLap, TOI_DA_BUOI_LAP } from "@/lib/lich-hen";
import { ngayVN } from "@/lib/dinh-dang";

type DV = { id: string; ma: string; ten: string; thoiLuong: number };
export type LichSua = { id: string; khach: KhachChon; ngay: string; gio: string; thoiLuong: number; nhanVienId: string; phong: string; nguon: string; ghiChu: string; dichVuIds: string[]; chiNhanhId: string };
const LUA_CHON_LAP = [{ gia_tri: "", nhan: "Không lặp" }, ...Object.entries(KIEU_LAP).map(([gia_tri, k]) => ({ gia_tri, nhan: k.nhan }))];

/** Đặt lịch / đổi lịch. Thời lượng tự cộng theo dịch vụ chọn nhưng sửa tay được. */
export function FormLichHen({ nhan, kieu = "chinh", dichVu, nhanVien, chiNhanh, tim, action, ban, sua, mo: moSan, homNay, cho = [] }: {
  nhan: string; kieu?: "chinh" | "chu"; dichVu: DV[]; nhanVien: LuaChon[]; chiNhanh: LuaChon[]; tim: typeof timKhach; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }>;
  ban?: { khach?: KhachChon | null; chiNhanhId: string }; sua?: LichSua; mo?: boolean; homNay: string;
  /** Danh mục chỗ (giường/phòng) của các chi nhánh; chi nhánh nào có chỗ thì ô "Phòng / giường" thành danh sách chọn. */
  cho?: { chiNhanhId: string; ten: string }[];
}) {
  const router = useRouter();
  const [mo, setMo] = useState(!!moSan);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const [khach, setKhach] = useState<KhachChon | null>(sua?.khach ?? ban?.khach ?? null);
  const [ngay, setNgay] = useState(sua?.ngay ?? homNay);
  const [gio, setGio] = useState(sua?.gio ?? "09:00");
  const [dvs, setDvs] = useState<string[]>(sua?.dichVuIds ?? []);
  const [phut, setPhut] = useState<string>(String(sua?.thoiLuong ?? 60));
  const [nv, setNv] = useState(sua?.nhanVienId ?? "");
  const [cn, setCn] = useState(sua?.chiNhanhId ?? ban?.chiNhanhId ?? "");
  const [phong, setPhong] = useState(sua?.phong ?? "");
  const [nguon, setNguon] = useState(sua?.nguon ?? "");
  const [ghiChu, setGhiChu] = useState(sua?.ghiChu ?? "");
  const [kieuLap, setKieuLap] = useState("");
  const [khoang, setKhoang] = useState("1");
  const [tongBuoi, setTongBuoi] = useState("4");
  // Nguồn cũ không thuộc danh sách (chữ nhập tay trước đây) vẫn hiện để không mất khi đổi lịch.
  const dsNguon = nguon && !LUA_CHON_NGUON.some((x) => x.gia_tri === nguon) ? [...LUA_CHON_NGUON, { gia_tri: nguon, nhan: nhanNguon(nguon) }] : LUA_CHON_NGUON;
  const xemLap = laKieuLap(kieuLap) && Number(tongBuoi) >= 2 ? ngayLap(ngay, kieuLap, Math.max(1, Number(khoang) || 1), Math.min(Number(tongBuoi), TOI_DA_BUOI_LAP)) : [];
  const choCuaCn = cho.filter((c) => c.chiNhanhId === cn).map((c) => c.ten);
  const [tim_, setTim] = useState("");
  const doiDv = (id: string) => {
    const moi = dvs.includes(id) ? dvs.filter((x) => x !== id) : [...dvs, id];
    setDvs(moi);
    setPhut(String(moi.reduce((s, d) => s + (dichVu.find((x) => x.id === d)?.thoiLuong ?? 0), 0) || 60));
  };
  const gui = () => {
    setLoi("");
    const fd = new FormData();
    if (sua) fd.set("id", sua.id);
    fd.set("khach_id", khach?.id ?? ""); fd.set("ngay", ngay); fd.set("gio", gio); fd.set("thoi_luong", phut); fd.set("nhan_vien_id", nv); fd.set("chi_nhanh_id", cn);
    fd.set("phong", phong); fd.set("nguon", nguon); fd.set("ghi_chu", ghiChu);
    if (!sua && kieuLap) { fd.set("kieu_lap", kieuLap); fd.set("lap_khoang", khoang || "1"); fd.set("lap_tong", tongBuoi); }
    dvs.forEach((d) => fd.append("dich_vu_ids", d));
    bat(async () => { const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else { setMo(false); router.refresh(); } });
  };
  const dsDv = dichVu.filter((d) => !tim_ || `${d.ma} ${d.ten}`.toLowerCase().includes(tim_.toLowerCase()));
  return (
    <>
      <button type="button" className={kieu === "chinh" ? NUT_CHINH : NUT_CHU} onClick={() => setMo(true)}>{nhan}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={sua ? "Đổi lịch hẹn" : "Đặt lịch hẹn"} rong="rong">
        <div className="space-y-4">
          <div><label className={NHAN_O}>Khách hàng <span className="text-loi">*</span></label><ChonKhach khach={khach} onDoi={setKhach} tim={tim} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className={NHAN_O}>Ngày</label><NgayChon giaTri={ngay} onDoi={setNgay} /></div>
            <div><label className={NHAN_O}>Giờ bắt đầu</label><GioChon ariaLabel="Giờ bắt đầu" giaTriMacDinh={gio} onDoi={setGio} /></div>
            <div><label htmlFor="lh-phut" className={NHAN_O}>Thời lượng (phút)</label><input id="lh-phut" inputMode="numeric" value={phut} onChange={(e) => setPhut(e.target.value.replace(/\D/g, ""))} className={`${O_NHAP} text-right`} /></div>
          </div>
          <div>
            <label className={NHAN_O}>Dịch vụ <span className="text-loi">*</span></label>
            <div className="rounded-nho border border-vien-dam">
              <input value={tim_} onChange={(e) => setTim(e.target.value)} placeholder="Tìm dịch vụ" aria-label="Tìm dịch vụ" className="h-10 w-full border-b border-vien bg-transparent px-3 text-[14px] outline-none" />
              <ul className="max-h-40 overflow-y-auto py-1">
                {dsDv.map((d) => { const bat_ = dvs.includes(d.id); return (
                  <li key={d.id}><button type="button" role="checkbox" aria-checked={bat_} onClick={() => doiDv(d.id)} className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[14px] hover:bg-giay-tram">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[11px] leading-none ${bat_ ? "border-nhan bg-nhan text-white" : "border-vien-dam"}`}>{bat_ ? "✓" : ""}</span><span className="truncate">{d.ma} · {d.ten}</span><span className="ml-auto text-[12px] text-muc-3">{d.thoiLuong} phút</span></button></li>); })}
                {dsDv.length === 0 && <li className="px-3 py-2 text-[13px] text-muc-3">Không có dịch vụ nào.</li>}
              </ul>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={NHAN_O}>Người thực hiện</label><Chon trong="Chưa phân" ariaLabel="Người thực hiện" giaTri={nv} onDoi={setNv} luaChon={[{ gia_tri: "", nhan: "Chưa phân" }, ...nhanVien]} /></div>
            <div><label className={NHAN_O}>Chi nhánh</label><Chon ariaLabel="Chi nhánh" giaTri={cn} onDoi={setCn} luaChon={chiNhanh} /></div>
            {choCuaCn.length > 0
              ? <div><label className={NHAN_O}>Phòng / giường</label><Chon trong="Chưa xếp chỗ" ariaLabel="Phòng / giường" giaTri={phong} onDoi={setPhong} luaChon={[{ gia_tri: "", nhan: "Chưa xếp chỗ" }, ...(phong && !choCuaCn.includes(phong) ? [phong] : []).concat(choCuaCn).map((t) => ({ gia_tri: t, nhan: t }))]} /></div>
              : <div><label htmlFor="lh-phong" className={NHAN_O}>Phòng / giường</label><input id="lh-phong" value={phong} onChange={(e) => setPhong(e.target.value)} className={O_NHAP} /></div>}
            <div><label className={NHAN_O}>Nguồn đặt lịch</label><Chon trong="Chọn nguồn" ariaLabel="Nguồn đặt lịch" giaTri={nguon} onDoi={setNguon} luaChon={[{ gia_tri: "", nhan: "Không ghi" }, ...dsNguon]} /></div>
          </div>
          {!sua && (
            <fieldset className="rounded-nho border border-vien px-3 pb-3 pt-1">
              <legend className="px-1 text-[13px] font-medium text-muc-2">Lặp định kì</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><label className={NHAN_O}>Kiểu lặp</label><Chon ariaLabel="Kiểu lặp" giaTri={kieuLap} onDoi={setKieuLap} luaChon={LUA_CHON_LAP} /></div>
                {laKieuLap(kieuLap) && <>
                  <div><label htmlFor="lh-khoang" className={NHAN_O}>Khoảng lặp ({KIEU_LAP[kieuLap].don_vi})</label><input id="lh-khoang" inputMode="numeric" value={khoang} onChange={(e) => setKhoang(e.target.value.replace(/\D/g, "").slice(0, 2))} className={`${O_NHAP} text-right`} /></div>
                  <div><label htmlFor="lh-tong" className={NHAN_O}>Tổng số buổi</label><input id="lh-tong" inputMode="numeric" value={tongBuoi} onChange={(e) => setTongBuoi(e.target.value.replace(/\D/g, "").slice(0, 2))} className={`${O_NHAP} text-right`} /></div>
                </>}
              </div>
              {xemLap.length > 1 && <p className="mt-2 text-[12px] text-muc-3" aria-live="polite">{xemLap.length} buổi: {xemLap.slice(0, 6).map(ngayVN).join(", ")}{xemLap.length > 6 ? ` … ${ngayVN(xemLap[xemLap.length - 1])}` : ""}</p>}
            </fieldset>
          )}
          <div><label htmlFor="lh-gc" className={NHAN_O}>Ghi chú</label><textarea id="lh-gc" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className={O_NHIEU_DONG} style={{ minHeight: 64 }} /></div>
        </div>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5"><button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button><button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>{dang ? "Đang lưu" : "Lưu lịch hẹn"}</button></div>
      </Hop>
    </>
  );
}
