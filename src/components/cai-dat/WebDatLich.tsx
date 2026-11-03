"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, Check, Code2, Copy, ExternalLink, ImagePlus, Link2, Palette, Save, Trash2 } from "lucide-react";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { CHON_HET, NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { DAT_TRUOC, DOI_TUONG, GIOI_HAN_NGAY, KHUNG_GIO, NGON_NGU, THOI_LUONG, THU_WEB, TRANG_THAI, type GioiHan, type LuaChonWeb, type WebDatLich } from "@/lib/web-dat-lich";

const Hang = ({ nhan, phu, children }: { nhan: string; phu?: string; children: React.ReactNode }) => (
  <div className="grid gap-2 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_minmax(0,230px)] sm:items-center sm:gap-5">
    <div><span className="block text-[14px] font-medium text-muc">{nhan}</span>{phu && <p className="mt-0.5 text-[12.5px] leading-snug text-muc-3">{phu}</p>}</div>
    <div className="sm:justify-self-end sm:text-right [&>*]:sm:ml-auto">{children}</div>
  </div>
);
/** Đầu mỗi nhóm cài đặt: ô biểu tượng + tên + một dòng mô tả. */
const DauNhom = ({ icon: Icon, ten, moTa, id }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; ten: string; moTa: string; id: string }) => (
  <div className="mb-4 flex items-start gap-3 border-b border-vien pb-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-the bg-nhan-nhat text-nhan-dam"><Icon strokeWidth={1.7} className="h-5 w-5" /></span>
    <div><h2 id={id} className="text-[16px] font-semibold text-muc">{ten}</h2><p className="mt-0.5 text-[13px] text-muc-3">{moTa}</p></div>
  </div>
);
/** Danh sách lựa chọn; giá trị đang lưu không có trong danh sách (VD đặt trước 90 phút từ nút cũ) vẫn được hiện để không bị đổi ngầm. */
const them = (ds: LuaChonWeb[], v: number, dv: string): LuaChonWeb[] => (ds.some((d) => d.gia_tri === String(v)) ? ds : [...ds, { gia_tri: String(v), nhan: `${v} ${dv}` }].sort((a, b) => Number(a.gia_tri) - Number(b.gia_tri)));

/** Bố cục như SalonHero "Web đặt Lịch": đường dẫn + nút Sao chép / Xem trang / Mã nhúng website; trái các tuỳ chọn, phải Thông báo đặt lịch bằng Email. */
const NHAN_THU: Record<string, string> = { t2: "T2", t3: "T3", t4: "T4", t5: "T5", t6: "T6", t7: "T7", cn: "CN" };

export function WebDatLichForm({ dau, sua, duongDan, luu, chiNhanh, anhBiaUrl }: { dau: WebDatLich; sua: boolean; duongDan: string; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }>; chiNhanh: { id: string; ten: string }[]; anhBiaUrl: string | null }) {
  const router = useRouter();
  const [t, setT] = useState(dau);
  const [email, setEmail] = useState(dau.emailNhan.join(", "));
  const [loi, setLoi] = useState(""), [ok, setOk] = useState(false), [nhung, setNhung] = useState(false), [daChep, setDaChep] = useState(false);
  const [dang, bat] = useTransition();
  const [gh, setGh] = useState<GioiHan[]>(dau.gioiHanRieng), [moGh, setMoGh] = useState(false);
  const [anh, setAnh] = useState<File | null>(null), [goAnh, setGoAnh] = useState(false);
  const xemAnh = useMemo(() => (anh ? URL.createObjectURL(anh) : null), [anh]);
  const suaGh = (i: number, p: Partial<GioiHan>) => { setGh(gh.map((g, j) => (j === i ? { ...g, ...p } : g))); setOk(false); };
  const dat = (p: Partial<WebDatLich>) => { setT({ ...t, ...p }); setOk(false); };
  const maNhung = `<iframe src="${duongDan}" title="Đặt lịch AMIA" width="100%" height="720" style="border:0"></iframe>`;
  const gui = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    const so = (k: string, v: number) => fd.set(k, String(v)), cb = (k: string, v: boolean) => fd.set(k, v ? "1" : "0");
    so("bao_truoc_phut", t.baoTruocPhut); so("toi_da_ngay", t.toiDaNgay); cb("khoa_trang", t.khoaTrang);
    cb("chon_ktv", t.chonKtv); cb("hien_dv_sp", t.hienDvSp); cb("hien_buoi", t.hienBuoi); cb("hien_gia", t.hienGia); fd.set("doi_tuong", t.doiTuong);
    so("khung_phut", t.khungPhut); so("toi_da_luot", t.toiDaLuot); so("thoi_luong_phut", t.thoiLuongPhut); fd.set("trang_thai", t.trangThai); fd.set("ngon_ngu", t.ngonNgu);
    fd.set("mau", t.mau); cb("mac_dinh_mau", t.macDinhMau); cb("tat_thong_bao", t.tatThongBao); cb("gui_email_nv", t.guiEmailNv); cb("am_thanh", t.amThanh); fd.set("email_nhan", email);
    fd.set("gioi_han", JSON.stringify(gh)); cb("go_anh_bia", goAnh); if (anh) fd.set("anh_bia", anh);
    bat(async () => { const kq = await luu(fd); if (kq.loi) setLoi(kq.loi); else { setOk(true); setAnh(null); setGoAnh(false); router.refresh(); } });
  };
  const chep = async (s: string) => { try { await navigator.clipboard.writeText(s); setDaChep(true); setTimeout(() => setDaChep(false), 2000); } catch { setLoi("Trình duyệt không cho sao chép, hãy bôi đen và sao chép tay."); } };
  const lc = (ten: string, ds: LuaChonWeb[], v: string, f: (x: string) => void) => <Chon ariaLabel={ten} luaChon={ds} giaTri={v} onDoi={f} voHieu={!sua} />;
  const bt = (nhan: string, v: boolean, f: (x: boolean) => void) => (sua ? <Gat nhan={nhan} giaTriMacDinh={v} onDoi={f} /> : <span className="text-[14px] text-muc-2">{nhan}: {v ? "bật" : "tắt"}</span>);
  const dangMo = !t.khoaTrang;
  const coAnh = !goAnh && (anh || anhBiaUrl);
  return (
    <div className="pb-24">
      {loi && <div role="alert" className="mb-4 rounded-the border border-loi/30 bg-loi-nen px-4 py-3 text-[14px] text-loi">{loi}</div>}

      {/* Thẻ trạng thái: mở/đóng trang + đường dẫn */}
      <section className="nen-toi relative mb-5 overflow-hidden rounded-hop text-white" aria-label="Trạng thái web đặt lịch">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-nho px-2.5 py-1 text-[12.5px] font-semibold ${dangMo ? "bg-nhan text-white" : "bg-white/10 text-menu-chu"}`}>
                <span className={`h-2 w-2 rounded-[2px] ${dangMo ? "bg-menu-nhan" : "bg-menu-chu-phu"}`} aria-hidden />{dangMo ? "Đang nhận đặt lịch online" : "Đang đóng với khách"}
              </span>
              {sua && <span className="[&_*]:!text-white">{bt("Mở web đặt lịch cho khách", dangMo, (v) => dat({ khoaTrang: !v }))}</span>}
            </div>
            <h2 className="mt-3 text-[22px] font-bold leading-tight">Trang đặt lịch của AMIA</h2>
            <p className="mt-1 text-[13.5px] text-menu-chu">Khách tự chọn dịch vụ, ngày và giờ còn trống; lịch về màn Lịch hẹn để lễ tân xác nhận.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-nho border border-white/15 bg-white/5 px-3">
                <Link2 className="h-4 w-4 shrink-0 text-menu-nhan" aria-hidden />
                <input readOnly value={duongDan} aria-label="Đường dẫn đặt lịch" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => chep(duongDan)} className="inline-flex h-11 items-center gap-1.5 rounded-nho border border-white/20 px-3.5 text-[13.5px] font-medium hover:bg-white/10">{daChep ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{daChep ? "Đã chép" : "Sao chép"}</button>
                <a href="/dat-lich" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-nho bg-white px-3.5 text-[13.5px] font-semibold text-espresso hover:bg-white/90"><ExternalLink className="h-4 w-4" aria-hidden />Xem trang</a>
              </div>
            </div>
            <button type="button" aria-expanded={nhung} onClick={() => setNhung(!nhung)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-menu-nhan hover:underline"><Code2 className="h-4 w-4" aria-hidden />Mã nhúng vào website</button>
            {nhung && (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
                <textarea readOnly rows={3} value={maNhung} aria-label="Mã nhúng website" className="min-h-[72px] w-full rounded-nho border border-white/15 bg-white/5 px-3 py-2 font-mono text-[12.5px] text-menu-chu outline-none" />
                <button type="button" onClick={() => chep(maNhung)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-nho border border-white/20 px-3 text-[13px] hover:bg-white/10"><Copy className="h-4 w-4" aria-hidden />Sao chép mã</button>
              </div>
            )}
          </div>
          {/* Xem nhanh đầu trang khách thấy */}
          <div className="hidden overflow-hidden rounded-the border border-white/15 bg-white/5 lg:block" aria-hidden>
            {coAnh
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={xemAnh ?? (anhBiaUrl as string)} alt="" className="aspect-[2048/777] w-full object-cover" />
              : <div className="aspect-[2048/777] w-full" style={{ background: `linear-gradient(120deg, ${t.macDinhMau ? "var(--nhan-dam)" : t.mau}, var(--espresso))` }} />}
            <div className="space-y-1.5 p-3">
              <div className="h-2.5 w-2/3 rounded-[3px] bg-white/30" /><div className="h-2 w-1/2 rounded-[3px] bg-white/15" />
              <div className="mt-2 flex gap-1.5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className={`h-6 flex-1 rounded-[4px] ${i === 1 ? "" : "bg-white/10"}`} style={i === 1 ? { background: t.macDinhMau ? "var(--nhan)" : t.mau } : undefined} />)}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="the-noi the-noi-thap p-5 sm:p-6" aria-labelledby="nhom-giao-dien">
          <DauNhom icon={Palette} id="nhom-giao-dien" ten="Giao diện trang" moTa="Ảnh bìa, màu, ngôn ngữ và những gì khách nhìn thấy." />
          <div className="mb-5">
            <p className="mb-2 text-[14px] font-medium text-muc">Ảnh bìa trang đặt lịch</p>
            <div className="relative overflow-hidden rounded-the border border-dashed border-vien-dam bg-giay-tram/60">
              {coAnh
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={xemAnh ?? (anhBiaUrl as string)} alt="Ảnh bìa trang đặt lịch" className="aspect-[2048/777] w-full object-cover" />
                : <div className="flex aspect-[2048/777] w-full flex-col items-center justify-center gap-2 text-muc-3"><ImagePlus className="h-8 w-8" aria-hidden /><span className="text-[13px]">Chưa có ảnh bìa, trang dùng nền màu thương hiệu</span></div>}
              {sua && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-nho bg-giay-sang px-3 text-[13px] font-medium text-muc shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-giay-tram">
                    <ImagePlus className="h-4 w-4" aria-hidden />{coAnh ? "Đổi ảnh" : "Tải ảnh lên"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && f.size > 5 * 1024 * 1024) { setLoi("Ảnh bìa tối đa 5 MB."); return; } setAnh(f); setGoAnh(false); setOk(false); }} />
                  </label>
                  {coAnh && <button type="button" aria-label="Bỏ ảnh bìa" className="inline-flex h-9 items-center gap-1.5 rounded-nho bg-giay-sang px-3 text-[13px] font-medium text-loi shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-loi-nen" onClick={() => { setAnh(null); setGoAnh(!!anhBiaUrl); setOk(false); }}><Trash2 className="h-4 w-4" aria-hidden />Bỏ</button>}
                </div>
              )}
            </div>
            <p className="mt-1.5 text-[12.5px] text-muc-3">Nên dùng ảnh ngang tỉ lệ như ảnh bìa Facebook (2048 × 777), tối đa 5 MB.</p>
          </div>
          <div className="divide-y divide-vien">
            <Hang nhan="Màu nhấn của trang" phu="Bật Mặc định để dùng màu thương hiệu AMIA.">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <input type="color" aria-label="Chọn màu" disabled={!sua || t.macDinhMau} value={t.mau} onChange={(e) => dat({ mau: e.target.value })} className="h-10 w-12 rounded-nho border border-vien-dam bg-giay-sang p-1 disabled:opacity-40" />
                <input aria-label="Mã màu" disabled={!sua || t.macDinhMau} value={t.mau} onChange={(e) => dat({ mau: e.target.value })} className={`${O_NHAP} !h-10 !w-24 font-mono text-[13px]`} />
                {bt("Mặc định", t.macDinhMau, (v) => dat({ macDinhMau: v }))}
              </div>
            </Hang>
            <Hang nhan="Ngôn ngữ mặc định">{lc("Ngôn ngữ hiện thị", NGON_NGU, t.ngonNgu, (v) => dat({ ngonNgu: v }))}</Hang>
            <Hang nhan="Dành cho khách hàng">{lc("Dành cho khách hàng", DOI_TUONG, t.doiTuong, (v) => dat({ doiTuong: v }))}</Hang>
            <Hang nhan="Hiện danh sách dịch vụ" phu="Khách chọn dịch vụ ngay khi đặt.">{bt("Hiện", t.hienDvSp, (v) => dat({ hienDvSp: v }))}</Hang>
            <Hang nhan="Hiện giá dịch vụ">{bt("Hiện", t.hienGia, (v) => dat({ hienGia: v }))}</Hang>
            <Hang nhan="Cho khách chọn chuyên viên" phu="Chỉ hiện chuyên viên trị liệu được bật hiển thị.">{bt("Cho phép", t.chonKtv, (v) => dat({ chonKtv: v }))}</Hang>
            <Hang nhan="Chia khung giờ theo buổi" phu="Sáng / Chiều / Tối khi khung giờ dưới 30 phút.">{bt("Chia buổi", t.hienBuoi, (v) => dat({ hienBuoi: v }))}</Hang>
          </div>
        </section>

        <div className="space-y-5">
          <section className="the-noi the-noi-thap p-5 sm:p-6" aria-labelledby="nhom-lich">
            <DauNhom icon={CalendarClock} id="nhom-lich" ten="Lịch và khung giờ" moTa="Khách được đặt trước bao lâu, mỗi khung bao nhiêu phút, nhận bao nhiêu lượt." />
            <div className="divide-y divide-vien">
              <Hang nhan="Thời gian của 1 khung giờ" phu="Ví dụ 15 phút: 8:15, 8:30, 8:45.">{lc("Thời gian của 1 khung giờ", KHUNG_GIO, String(t.khungPhut), (v) => dat({ khungPhut: Number(v) }))}</Hang>
              <Hang nhan="Đặt trước giờ hẹn ít nhất">{lc("Cho phép đặt lịch trước giờ bắt đầu", them(DAT_TRUOC, t.baoTruocPhut, "phút"), String(t.baoTruocPhut), (v) => dat({ baoTruocPhut: Number(v) }))}</Hang>
              <Hang nhan="Đặt xa nhất">{lc("Giới hạn số ngày đặt lịch trước", them(GIOI_HAN_NGAY, t.toiDaNgay, "ngày"), String(t.toiDaNgay), (v) => dat({ toiDaNgay: Number(v) }))}</Hang>
              <Hang nhan="Thời lượng mặc định 1 lịch hẹn" phu="Dùng khi khách chưa chọn dịch vụ.">{lc("Thời gian mặc định làm dịch vụ", THOI_LUONG, String(t.thoiLuongPhut), (v) => dat({ thoiLuongPhut: Number(v) }))}</Hang>
              <Hang nhan="Số lượt khách tối đa mỗi khung giờ">
                <div className="flex items-center justify-end gap-3">
                  <button type="button" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline" aria-expanded={moGh} onClick={() => setMoGh(!moGh)}>Tùy chỉnh{gh.length ? ` (${gh.length})` : ""}</button>
                  <input aria-label="Số lượt khách đặt tối đa cho 1 khung giờ" inputMode="numeric" {...CHON_HET} disabled={!sua} value={String(t.toiDaLuot)} onChange={(e) => dat({ toiDaLuot: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${O_NHAP} !w-20 text-right tabular-nums`} />
                </div>
              </Hang>
          {moGh && (
            <div className="rounded-nho border border-vien p-3" role="group" aria-label="Tùy chọn giới hạn số lịch đặt">
              <p className="mb-1 text-[14px] font-semibold text-muc">Tùy chọn giới hạn số lịch đặt</p>
              <p className="mb-3 text-[12px] text-muc-3">Khung giờ bắt đầu trong khoảng này (đúng thứ, đúng chi nhánh) chỉ nhận tối đa số lịch ghi ở đây, thay cho mức chung. Số lịch 0 = không nhận đặt online giờ đó. Lịch hết sức chứa chỗ làm vẫn báo Hết chỗ.</p>
              {gh.length === 0 && <p className="mb-2 text-[13px] text-muc-3">Chưa có dòng nào.</p>}
              <div className="space-y-3">
                {gh.map((g, i) => (
                  <div key={i} className="space-y-2 border-b border-vien pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <input aria-label={`Giờ bắt đầu dòng ${i + 1}`} placeholder="08:00" disabled={!sua} value={g.tu} onChange={(e) => suaGh(i, { tu: e.target.value.slice(0, 5) })} className={`${O_NHAP} !w-20 tabular-nums`} />
                      <span className="text-muc-3">–</span>
                      <input aria-label={`Giờ kết thúc dòng ${i + 1}`} placeholder="10:00" disabled={!sua} value={g.den} onChange={(e) => suaGh(i, { den: e.target.value.slice(0, 5) })} className={`${O_NHAP} !w-20 tabular-nums`} />
                      <input aria-label={`Số lịch dòng ${i + 1}`} inputMode="numeric" {...CHON_HET} disabled={!sua} value={String(g.so)} onChange={(e) => suaGh(i, { so: Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 0 })} className={`${O_NHAP} !w-16 text-right tabular-nums`} />
                      <span className="text-[13px] text-muc-3">lịch</span>
                      {sua && <button type="button" className="ml-auto text-[13px] font-medium text-loi underline-offset-4 hover:underline" onClick={() => { setGh(gh.filter((_, j) => j !== i)); setOk(false); }}>Xoá</button>}
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Thứ áp dụng dòng ${i + 1}`}>
                      {THU_WEB.map((t) => {
                        const co = g.thu.includes(t);
                        return <button key={t} type="button" disabled={!sua} aria-pressed={co} onClick={() => suaGh(i, { thu: co ? g.thu.filter((x) => x !== t) : [...g.thu, t] })} className={`h-9 min-w-10 rounded-nho border px-2 text-[13px] ${co ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam text-muc-2"}`}>{NHAN_THU[t]}</button>;
                      })}
                      <span className="self-center text-[12px] text-muc-3">{g.thu.length ? "" : "(không chọn = mọi ngày)"}</span>
                    </div>
                    <Chon ariaLabel={`Tại chi nhánh dòng ${i + 1}`} voHieu={!sua} giaTri={g.cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả chi nhánh" }, ...chiNhanh.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} onDoi={(v) => suaGh(i, { cn: v || null })} />
                  </div>
                ))}
              </div>
              {sua && <button type="button" className={`${NUT_PHU} mt-3`} disabled={gh.length >= 30} onClick={() => { setGh([...gh, { tu: "08:00", den: "10:00", so: 1, thu: [], cn: null }]); setOk(false); }}>Thêm mới</button>}
              <p className="mt-2 text-[12px] text-muc-3">Bấm “Lưu thông tin” ở thanh dưới cùng để lưu bảng này.</p>
            </div>
          )}
              <Hang nhan="Trạng thái khi khách đặt từ web">{lc("Trạng thái mặc định", TRANG_THAI, t.trangThai, (v) => dat({ trangThai: v }))}</Hang>
              <Hang nhan="Ngày nghỉ của cửa hàng"><Link href="/cai-dat/gio-lam-viec" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Mở giờ làm việc</Link></Hang>
            </div>
          </section>

          <section className="the-noi the-noi-thap p-5 sm:p-6" aria-labelledby="tb-email">
            <DauNhom icon={Bell} id="tb-email" ten="Thông báo khi có lịch mới" moTa="Báo cho lễ tân và chuyên viên ngay khi khách đặt." />
            <div className="divide-y divide-vien">
              <Hang nhan="Tắt tất cả thông báo lịch hẹn">{bt("Tắt tất cả", t.tatThongBao, (v) => dat({ tatThongBao: v }))}</Hang>
              <Hang nhan="Gửi email cho chuyên viên của lịch hẹn">{bt("Gửi email", t.guiEmailNv, (v) => dat({ guiEmailNv: v }))}</Hang>
              <Hang nhan="Phát âm thanh khi có lịch mới">{bt("Cho phép", t.amThanh, (v) => dat({ amThanh: v }))}</Hang>
              <div className="pt-3.5">
                <label htmlFor="email-nhan" className={NHAN_O}>Gửi thêm tới các email</label>
                <input id="email-nhan" placeholder="le-tan@amia.vn, quan-ly@amia.vn" disabled={!sua} value={email} onChange={(e) => { setEmail(e.target.value); setOk(false); }} className={O_NHAP} autoComplete="off" />
                <p className="mt-1 text-[12.5px] text-muc-3">Nhiều email cách nhau bằng dấu phẩy.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Thanh lưu nổi */}
      {sua && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-vien bg-giay-sang/95 px-4 py-3 shadow-[0_-6px_20px_rgba(6,26,23,0.08)]">
          <div className="mx-auto flex max-w-[1200px] items-center justify-end gap-3">
            <span role="status" className={`text-[13.5px] ${ok ? "flex items-center gap-1.5 font-medium text-nhan-dam" : "text-muc-3"}`}>{ok ? <><Check className="h-4 w-4" aria-hidden />Đã lưu thông tin</> : "Thay đổi chỉ có hiệu lực sau khi lưu"}</span>
            <button type="button" className={`${NUT_CHINH} inline-flex items-center gap-2`} disabled={dang} onClick={gui}><Save className="h-4 w-4" aria-hidden />{dang ? "Đang lưu" : "Lưu thông tin"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
