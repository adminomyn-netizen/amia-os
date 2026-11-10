"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { GioChon } from "@/components/ui/GioChon";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { ChonKhach, type KhachChon } from "@/components/khach/ChonKhach";
import type { timKhach } from "@/app/(app)/ban-hang/actions";
import type { ganNhomKhachMoi, khungGioTrong, thongTinKhachDatLich } from "@/app/(app)/lich-hen/actions";
import { TaoKhachNhanh } from "@/components/lich-hen/TaoKhachNhanh";
import { KhachDiCungO } from "@/components/lich-hen/KhachDiCung";
import { ChonNhieuDichVu } from "@/components/lich-hen/ChonNhieuDichVu";
import type { KhachDiCung } from "@/lib/lich-hen-nhom";
import { KIEU_LAP, laKieuLap, LUA_CHON_NGUON, LUA_CHON_TRANG_THAI_DAT, nhanNguon, ngayLap, TOI_DA_BUOI_LAP } from "@/lib/lich-hen";
import { ngayVN } from "@/lib/dinh-dang";
import { coOChiNhanh } from "@/lib/ban-hang";
import { goiYLoaiLich, LOAI_LICH, LUA_CHON_LOAI_LICH, type KhoaSua } from "@/lib/lich-hen-sua";

type DV = { id: string; ma: string; ten: string; thoiLuong: number; /** "Nơi hiển thị" = chỉ thu ngân / ẩn. */ an?: boolean; /** "Địa điểm cung cấp": null = mọi chi nhánh. */ chiNhanhIds?: string[] | null };
export type LichSua = { id: string; khach: KhachChon; ngay: string; gio: string; thoiLuong: number; nhanVienId: string; phong: string; nguon: string; ghiChu: string; dichVuIds: string[]; chiNhanhId: string; /** Khách 2, 3… của lịch nhiều khách. */ khachDiCung?: KhachDiCung[];
  /** Loại lịch đang ghi (null với lịch cũ). */ loaiLich?: string;
  /** Trường bị khoá theo trạng thái / hoá đơn (máy chủ tính, máy chủ cũng giữ nguyên các trường này). */ khoa?: KhoaSua;
  /** Tên dịch vụ dạng chữ của lịch chuyển từ SalonHero chưa có dòng dịch vụ. */ dichVuTen?: string;
  /** Tên chi nhánh / tên dịch vụ để hiện khi trường bị khoá. */ tenDichVu?: string };
const LUA_CHON_LAP = [{ gia_tri: "", nhan: "Không lặp" }, ...Object.entries(KIEU_LAP).map(([gia_tri, k]) => ({ gia_tri, nhan: k.nhan }))];

/** Ngày giờ hiện tại theo giờ Việt Nam, làm tròn lên 5 phút. */
function bayGioLamTron() {
  const d = new Date(Math.ceil(Date.now() / 300000) * 300000);
  return { ngay: d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }), gio: d.toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }) };
}

/** Đặt lịch / đổi lịch. Thời lượng tự cộng theo dịch vụ chọn nhưng sửa tay được. */
export function FormLichHen({ nhan, kieu = "chinh", dichVu, nhanVien, chiNhanh, tim, action, ban, sua, mo: moSan, homNay, cho = [], khungGio, taoKhach, ttKhach }: {
  nhan: string; kieu?: "chinh" | "chu"; dichVu: DV[]; nhanVien: LuaChon[]; chiNhanh: LuaChon[]; tim: typeof timKhach; action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string }>;
  ban?: { khach?: KhachChon | null; chiNhanhId: string }; sua?: LichSua; mo?: boolean; homNay: string;
  /** Danh mục chỗ (giường/phòng) của các chi nhánh; chi nhánh nào có chỗ thì ô "Phòng / giường" thành danh sách chọn. */
  cho?: { chiNhanhId: string; ten: string }[];
  /** Gợi ý khung giờ trống (máy chủ tính theo giờ mở cửa, lịch của người thực hiện hoặc số chỗ). */
  khungGio?: typeof khungGioTrong;
  /** Có thì hiện nút "Tạo khách mới" ngay trong hộp (hàm lưu khách của màn Khách hàng; cần quyền nhập khách). */
  taoKhach?: { action: (fd: FormData) => Promise<{ ok?: boolean; loi?: string; id?: string }>; macDinhNv: string; nhom?: LuaChon[]; ganNhom?: typeof ganNhomKhachMoi };
  /** Dòng "Khách mới / Khách quay lại · được giới thiệu bởi · mã thẻ" khi đã chọn khách (như SalonHero). */
  ttKhach?: typeof thongTinKhachDatLich;
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
  const [diCung, setDiCung] = useState<KhachDiCung[]>(sua?.khachDiCung ?? []);
  const [kieuLap, setKieuLap] = useState("");
  const [trangThai, setTrangThai] = useState("chua_xac_nhan");
  // Loại lịch (chị Lâm 10/11): bắt buộc khi đặt mới; tự gợi ý theo khách (còn thẻ liệu trình → Khách liệu trình; chưa từng có hoá đơn → Tư vấn khách mới) đến khi người dùng tự chọn.
  const [loaiLich, setLoaiLich] = useState(sua?.loaiLich ?? "");
  const [loaiGoiY, setLoaiGoiY] = useState(false);
  const loaiTay = useRef(!!sua);
  const khoa = sua?.khoa;
  const [ttk, setTtk] = useState<{ khachId: string; soLanDen: number; gioiThieu: string; maThe: string[]; coTheLieuTrinh: boolean } | null>(null);
  useEffect(() => {
    if (!mo || !khach || !ttKhach) return;
    let huy = false;
    ttKhach(khach.id).then((r) => {
      if (huy || !r) return;
      setTtk({ khachId: khach.id, ...r });
      if (!loaiTay.current) { const g = goiYLoaiLich(r); setLoaiLich(g); setLoaiGoiY(!!g); }
    }).catch(() => undefined);
    return () => { huy = true; };
  }, [mo, khach, ttKhach]);
  const chonLoai = (v: string) => { loaiTay.current = true; setLoaiGoiY(false); setLoaiLich(v); };
  const thongTinKhach = khach && ttk?.khachId === khach.id ? ttk : null;
  const [khoang, setKhoang] = useState("1");
  const [tongBuoi, setTongBuoi] = useState("4");
  // Nguồn cũ không thuộc danh sách (chữ nhập tay trước đây) vẫn hiện để không mất khi đổi lịch.
  const dsNguon = nguon && !LUA_CHON_NGUON.some((x) => x.gia_tri === nguon) ? [...LUA_CHON_NGUON, { gia_tri: nguon, nhan: nhanNguon(nguon) }] : LUA_CHON_NGUON;
  const xemLap = laKieuLap(kieuLap) && Number(tongBuoi) >= 2 ? ngayLap(ngay, kieuLap, Math.max(1, Number(khoang) || 1), Math.min(Number(tongBuoi), TOI_DA_BUOI_LAP)) : [];
  const choCuaCn = cho.filter((c) => c.chiNhanhId === cn).map((c) => c.ten);
  const [loai, setLoai] = useState<"truoc" | "den">("truoc");
  const [moTaoKhach, setMoTaoKhach] = useState(false);
  const [gioKey, setGioKey] = useState(0);
  const [goiY, setGoiY] = useState<{ gio: string[]; ghiChu?: string; loi?: string } | null>(null);
  // Gợi ý giờ trống: hỏi máy chủ mỗi khi đổi ngày / người thực hiện / chi nhánh / thời lượng (chờ 350 ms sau lần gõ cuối).
  useEffect(() => {
    if (!mo || !khungGio) return;
    let huy = false;
    const t = setTimeout(async () => {
      const kq = await khungGio({ ngay, chiNhanhId: cn, nhanVienId: nv, phut: Number(phut) || 60, boQuaLichId: sua?.id }).catch(() => ({ gio: [] as string[], loi: "Chưa lấy được giờ trống lúc này, vẫn chọn giờ tay được." }));
      if (!huy) setGoiY(kq);
    }, 350);
    return () => { huy = true; clearTimeout(t); };
  }, [mo, khungGio, ngay, cn, nv, phut, sua?.id]);
  const chonGio = (g: string) => { setGio(g); setGioKey((k) => k + 1); };
  /** "Đến trực tiếp": khách đang có mặt, lấy ngày giờ hiện tại (làm tròn lên 5 phút) và nguồn "Đến trực tiếp"; vẫn sửa được. "Đặt trước": giữ nguyên các ô đang nhập. */
  const doiLoai = (l: "truoc" | "den") => {
    setLoai(l);
    if (l !== "den") return;
    const bay = bayGioLamTron();
    setNgay(bay.ngay);
    chonGio(bay.gio);
    setNguon("WALKIN");
    setTrangThai("cho_phuc_vu");
  };
  const doiDvs = (moi: string[]) => {
    setDvs(moi);
    setPhut(String(moi.reduce((s, d) => s + (dichVu.find((x) => x.id === d)?.thoiLuong ?? 0), 0) || 60));
  };
  const gui = () => {
    setLoi("");
    if (!sua && !loaiLich) { setLoi("Chọn loại lịch: tư vấn khách mới, khách liệu trình, dịch vụ lẻ, tái khám hay bảo hành."); return; }
    const fd = new FormData();
    if (sua) fd.set("id", sua.id);
    fd.set("khach_id", khach?.id ?? ""); fd.set("ngay", ngay); fd.set("gio", gio); fd.set("thoi_luong", phut); fd.set("nhan_vien_id", nv); fd.set("chi_nhanh_id", cn);
    fd.set("phong", phong); fd.set("nguon", nguon); fd.set("ghi_chu", ghiChu); fd.set("loai_lich", loaiLich);
    if (!sua) fd.set("trang_thai", trangThai);
    if (!sua && kieuLap) { fd.set("kieu_lap", kieuLap); fd.set("lap_khoang", khoang || "1"); fd.set("lap_tong", tongBuoi); }
    dvs.forEach((d) => fd.append("dich_vu_ids", d));
    fd.set("khach_di_cung", JSON.stringify(diCung));
    bat(async () => { const kq = await action(fd); if (kq.loi) setLoi(kq.loi); else { setMo(false); router.refresh(); } });
  };
  // Dịch vụ ẩn ở đặt lịch hoặc không cung cấp ở chi nhánh đang chọn thì không hiện để chọn mới; dịch vụ đã có trong lịch vẫn hiện để bỏ chọn được.
  const dsDv = dichVu.filter((d) => (dvs.includes(d.id) || (!d.an && coOChiNhanh(d.chiNhanhIds, cn))));
  return (
    <>
      <button type="button" className={kieu === "chinh" ? NUT_CHINH : NUT_CHU} onClick={() => setMo(true)}>{nhan}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={sua ? "Sửa lịch hẹn" : "Đặt lịch hẹn"} rong="rong">
        <div className="space-y-4">
          {khoa && khoa.lyDo.length > 0 && (
            <div className="rounded-nho border border-canh-bao/40 bg-canh-bao-nen px-3 py-2.5 text-[13px] leading-snug text-canh-bao" role="note">
              <p className="font-semibold">Một số trường đang khoá</p>
              <ul className="mt-0.5 list-disc pl-4">{khoa.lyDo.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="mt-0.5">Vẫn sửa được: người thực hiện, phòng / giường, nguồn, loại lịch, ghi chú.</p>
            </div>
          )}
          {!sua && (
            <div className="flex overflow-hidden rounded-nho border border-vien-dam" role="group" aria-label="Loại đặt lịch">
              {([["truoc", "Đặt lịch trước"], ["den", "Đến trực tiếp"]] as const).map(([ma, chu]) => (
                <button key={ma} type="button" aria-pressed={loai === ma} onClick={() => doiLoai(ma)} className={`flex-1 px-3.5 py-2 text-[13px] font-medium ${loai === ma ? "bg-nhan text-white" : "bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{chu}</button>
              ))}
            </div>
          )}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3"><label className="block text-[13px] font-medium text-muc-2">Khách hàng <span className="text-loi">*</span></label>
              {taoKhach && !khach && !sua && <button type="button" className={NUT_CHU} onClick={() => setMoTaoKhach(!moTaoKhach)} aria-expanded={moTaoKhach}>{moTaoKhach ? "Đóng ô tạo khách" : "Tạo khách mới"}</button>}</div>
            {khoa?.khach ? <p className="rounded-nho border border-vien bg-giay-tram px-3 py-2 text-[14px] text-muc">{khach?.ho_ten}{khach?.ma ? ` · ${khach.ma}` : ""} <span className="text-[12px] text-muc-3">(khoá)</span></p> : <ChonKhach khach={khach} onDoi={setKhach} tim={tim} />}
            {thongTinKhach && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muc-2" aria-live="polite">
                {thongTinKhach.soLanDen > 0
                  ? <span className="rounded-tag bg-nhan-nhat px-2 py-0.5 text-[12px] font-medium text-nhan-dam">Khách quay lại · đã đến {thongTinKhach.soLanDen} lần</span>
                  : <span className="rounded-tag bg-loi-nen px-2 py-0.5 text-[12px] font-medium text-loi">Khách mới</span>}
                {thongTinKhach.gioiThieu && <span>Được giới thiệu bởi <b className="font-medium text-muc">{thongTinKhach.gioiThieu}</b></span>}
                {thongTinKhach.maThe.length > 0 && <span>Mã thẻ: <b className="font-medium tabular-nums text-muc">{thongTinKhach.maThe.join(", ")}</b></span>}
              </p>
            )}
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-muc-2">Loại lịch {!sua && <span className="text-loi">*</span>}{loaiGoiY && <span className="ml-2 text-[12px] font-normal text-muc-3">đã chọn sẵn theo khách, đổi được</span>}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Loại lịch">
              {LUA_CHON_LOAI_LICH.map((l) => (
                <button key={l.gia_tri} type="button" role="radio" aria-checked={loaiLich === l.gia_tri} onClick={() => chonLoai(l.gia_tri)}
                  className={`min-h-10 rounded-nho border px-3 py-2 text-[13px] font-medium ${loaiLich === l.gia_tri ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{l.nhan}</button>
              ))}
            </div>
            {loaiLich === "lieu_trinh" && <p className="mt-1 text-[12px] text-muc-3">{LOAI_LICH.lieu_trinh.nhan}: làm buổi theo thẻ liệu trình của khách.</p>}
          </fieldset>
          {taoKhach && !khach && !sua && moTaoKhach && (
            <TaoKhachNhanh chiNhanhId={cn} nhanVien={nhanVien} macDinhNv={taoKhach.macDinhNv} tim={tim} action={taoKhach.action} nhom={taoKhach.nhom} ganNhom={taoKhach.ganNhom} onDong={() => setMoTaoKhach(false)} onXong={(k) => { setKhach(k); setMoTaoKhach(false); }} />
          )}
          {khoa?.gio ? <p className="rounded-nho border border-vien bg-giay-tram px-3 py-2 text-[14px] text-muc">Giờ hẹn: <b className="font-medium">{gio} ngày {ngayVN(ngay)}</b> · {phut} phút <span className="text-[12px] text-muc-3">(khoá)</span></p> : <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className={NHAN_O}>Ngày</label><NgayChon giaTri={ngay} onDoi={setNgay} /></div>
            <div><label className={NHAN_O}>Giờ bắt đầu</label><GioChon key={gioKey} ariaLabel="Giờ bắt đầu" giaTriMacDinh={gio} onDoi={setGio} /></div>
            <div><label htmlFor="lh-phut" className={NHAN_O}>Thời lượng (phút)</label><input id="lh-phut" inputMode="numeric" value={phut} onChange={(e) => setPhut(e.target.value.replace(/\D/g, ""))} className={`${O_NHAP} text-right`} /></div>
          </div>
          {khungGio && (
            <div aria-live="polite">
              <p className="mb-1.5 text-[13px] font-medium text-muc-2">Chọn tham khảo các khung giờ sau:</p>
              {goiY?.gio.length ? (
                <ul className="flex max-h-[84px] flex-wrap gap-1.5 overflow-y-auto">
                  {goiY.gio.map((g) => <li key={g}><button type="button" aria-pressed={gio === g} onClick={() => chonGio(g)} className={`h-8 rounded-nho border px-2.5 text-[13px] tabular-nums ${gio === g ? "border-nhan bg-nhan text-white" : "border-vien-dam bg-giay-sang text-muc-2 hover:bg-giay-tram"}`}>{g}</button></li>)}
                </ul>
              ) : <p className="text-[13px] text-muc-3">{goiY ? (goiY.loi ?? goiY.ghiChu ?? "Không có khung giờ trống.") : "Đang tìm giờ trống…"}</p>}
              {goiY?.gio.length && goiY.ghiChu ? <p className="mt-1.5 text-[12px] text-muc-3">{goiY.ghiChu}</p> : null}
            </div>
          )}
          </>}
          <div>
            <label className={NHAN_O}>Dịch vụ <span className="text-loi">*</span></label>
            {khoa?.dichVu
              ? <p className="rounded-nho border border-vien bg-giay-tram px-3 py-2 text-[14px] text-muc">{dvs.map((d) => dichVu.find((x) => x.id === d)?.ten).filter(Boolean).join(", ") || sua?.dichVuTen || "Chưa ghi dịch vụ"} <span className="text-[12px] text-muc-3">(khoá)</span></p>
              : <>{sua?.dichVuTen && dvs.length === 0 && <p className="mb-1.5 text-[12px] text-muc-3">Lịch chuyển từ SalonHero ghi: {sua.dichVuTen}</p>}<ChonNhieuDichVu ds={dsDv} tatCa={dichVu} chon={dvs} onDoi={doiDvs} /></>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={NHAN_O}>Người thực hiện</label><Chon trong="Chưa phân" ariaLabel="Người thực hiện" giaTri={nv} onDoi={setNv} luaChon={[{ gia_tri: "", nhan: "Chưa phân" }, ...nhanVien]} /></div>
            <div><label className={NHAN_O}>Chi nhánh</label>{khoa?.khach ? <p className="rounded-nho border border-vien bg-giay-tram px-3 py-2 text-[14px] text-muc">{chiNhanh.find((c) => c.gia_tri === cn)?.nhan ?? "—"}</p> : <Chon ariaLabel="Chi nhánh" giaTri={cn} onDoi={setCn} luaChon={chiNhanh} />}</div>
            {choCuaCn.length > 0
              ? <div><label className={NHAN_O}>Phòng / giường</label><Chon trong="Chưa xếp chỗ" ariaLabel="Phòng / giường" giaTri={phong} onDoi={setPhong} luaChon={[{ gia_tri: "", nhan: "Chưa xếp chỗ" }, ...(phong && !choCuaCn.includes(phong) ? [phong] : []).concat(choCuaCn).map((t) => ({ gia_tri: t, nhan: t }))]} /></div>
              : <div><label htmlFor="lh-phong" className={NHAN_O}>Phòng / giường</label><input id="lh-phong" value={phong} onChange={(e) => setPhong(e.target.value)} className={O_NHAP} /></div>}
            {!sua && <div><label className={NHAN_O}>Trạng thái</label><Chon ariaLabel="Trạng thái lúc tạo" giaTri={trangThai} onDoi={setTrangThai} luaChon={LUA_CHON_TRANG_THAI_DAT} /></div>}
            <div><label className={NHAN_O}>Nguồn đặt lịch</label><Chon trong="Chọn nguồn" ariaLabel="Nguồn đặt lịch" giaTri={nguon} onDoi={setNguon} luaChon={[{ gia_tri: "", nhan: "Không ghi" }, ...dsNguon]} /></div>
          </div>
          {khoa?.diCung ? (diCung.length > 0 && <p className="text-[13px] text-muc-3">Khách đi cùng (khoá): {diCung.map((k) => k.ten).join(", ")}</p>) : <KhachDiCungO ds={diCung} onDoi={setDiCung} dichVu={dichVu.filter((d) => !d.an && coOChiNhanh(d.chiNhanhIds, cn) || diCung.some((k) => k.dichVuIds.includes(d.id)))} nhanVien={nhanVien} />}
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
