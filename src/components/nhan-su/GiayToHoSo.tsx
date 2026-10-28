"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { createClient } from "@/lib/supabase/client";
import { doiTrangThaiTaiLieu, goTaiLieu, xacNhanTaiLen, xinLinkTaiLen } from "@/app/(app)/nhan-su/ho-so/actions";
import { GIAY_TO_BAT_BUOC, KICH_THUOC_TOI_DA, LOAI_TAI_LIEU, MIME_CHO_PHEP, giayToConThieu, kiemTraTep } from "@/lib/ho-so";
import { ngayVN } from "@/lib/dinh-dang";

const KHO = "ho-so-nhan-vien";
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const kieuTl = (t: string) => (t === "Đã xác nhận" ? "tot" : t === "Cần bổ sung" ? "loi" : "cho");

export type TaiLieu = { id: string; loai: string; ten_tep: string; kich_thuoc: number; trang_thai: string; ghi_chu: string | null; tao_luc: string; da_go: boolean; mime: string };
type HopMo = { id: string; kieu: "bo-sung" | "go"; ten: string };

/** Giấy tờ đính kèm của hồ sơ nhân sự: tải thẳng lên kho riêng tư, HCNS xác nhận / yêu cầu bổ sung / gỡ. Nhân viên chỉ thấy và gỡ được giấy tờ của chính mình. */
export function GiayToHoSo({ nhanVienId, taiLieu, quanTri }: { nhanVienId: string; taiLieu: TaiLieu[]; quanTri: boolean }) {
  const router = useRouter();
  const [loi, setLoi] = useState<string | undefined>();
  const [thongBao, setThongBao] = useState<string | undefined>();
  const [hop, setHop] = useState<HopMo | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [loaiTep, setLoaiTep] = useState<string>("CCCD mặt trước");
  const [dang, bat] = useTransition();
  const [dangTai, setDangTai] = useState(false);
  const inputTep = useRef<HTMLInputElement>(null);
  const thieu = giayToConThieu(taiLieu);

  const dong = () => { setHop(null); setLoi(undefined); setLyDo(""); };
  const chay = (fn: (fd: FormData) => Promise<{ loi?: string }>, fd: FormData, sau?: () => void) =>
    bat(async () => {
      const kq = await fn(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setLoi(undefined); sau?.(); router.refresh(); }
    });

  const taiLen = async () => {
    const tep = inputTep.current?.files?.[0];
    setLoi(undefined); setThongBao(undefined);
    if (!tep) return setLoi("Chọn tệp cần tải (PDF, JPG hoặc PNG, tối đa 10 MB).");
    const sai = kiemTraTep(tep.type, tep.size);
    if (sai) return setLoi(sai);
    setDangTai(true);
    try {
      const fd = new FormData();
      fd.set("nhan_vien_id", nhanVienId); fd.set("loai", loaiTep); fd.set("mime", tep.type); fd.set("kich_thuoc", String(tep.size));
      const b1 = await xinLinkTaiLen(fd) as { loi?: string; duongDan?: string; token?: string };
      if (b1.loi || !b1.duongDan || !b1.token) return setLoi(b1.loi ?? "Chưa mở được kho tệp.");
      const { error } = await createClient().storage.from(KHO).uploadToSignedUrl(b1.duongDan, b1.token, tep, { contentType: tep.type });
      if (error) return setLoi("Tải tệp lên chưa được. Kiểm tra mạng rồi thử lại.");
      const f2 = new FormData();
      f2.set("nhan_vien_id", nhanVienId); f2.set("duong_dan", b1.duongDan); f2.set("loai", loaiTep); f2.set("ten_tep", tep.name);
      const b2 = await xacNhanTaiLen(f2);
      if (b2.loi) return setLoi(b2.loi);
      if (inputTep.current) inputTep.current.value = "";
      setThongBao(quanTri ? "Đã tải lên." : "Đã tải lên. HCNS sẽ xác nhận giấy tờ.");
      router.refresh();
    } finally { setDangTai(false); }
  };

  const xacNhan = (id: string) => { const fd = new FormData(); fd.set("id", id); fd.set("den", "Đã xác nhận"); chay(doiTrangThaiTaiLieu, fd); };
  const gui = () => {
    if (!hop) return;
    const fd = new FormData(); fd.set("id", hop.id);
    if (hop.kieu === "bo-sung") { fd.set("den", "Cần bổ sung"); fd.set("ghi_chu", lyDo); chay(doiTrangThaiTaiLieu, fd, dong); }
    else { fd.set("ly_do", lyDo); chay(goTaiLieu, fd, dong); }
  };

  return (
    <div>
      <p className="mb-4 text-[13px] text-muc-3">PDF, JPG hoặc PNG, tối đa {KICH_THUOC_TOI_DA / 1024 / 1024} MB. Giấy tờ lưu trong kho riêng tư; chỉ HCNS và chính chủ mở được, mỗi lần mở đều được ghi lại.</p>
      <ul className="mb-5 flex flex-wrap gap-2">
        {GIAY_TO_BAT_BUOC.map((l) => <li key={l}><NhanTrangThai kieu={thieu.includes(l) ? "cho" : "tot"}>{thieu.includes(l) ? `Thiếu: ${l}` : `Có: ${l}`}</NhanTrangThai></li>)}
      </ul>
      {loi && !hop && <div role="alert" className="mb-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
      {thongBao && <div role="status" className="mb-4 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">{thongBao}</div>}
      <div className="the-noi the-noi-thap mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1 sm:flex-none"><label htmlFor="h-loai" className={NHAN_O}>Loại giấy tờ</label><Chon id="h-loai" giaTri={loaiTep} onDoi={setLoaiTep} luaChon={LOAI_TAI_LIEU.map((l) => ({ gia_tri: l, nhan: l }))} /></div>
        <div className="min-w-[200px] flex-1"><label htmlFor="h-tep" className={NHAN_O}>Tệp</label><input ref={inputTep} id="h-tep" type="file" accept={MIME_CHO_PHEP.join(",")} className="block h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 py-2 text-[13px]" /></div>
        <button type="button" className={NUT_CHINH} disabled={dangTai} onClick={taiLen}>{dangTai ? "Đang tải lên" : "Tải lên"}</button>
      </div>
      {taiLieu.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có giấy tờ nào.</p> : (
        <ul className="the-noi the-noi-thap divide-y divide-vien overflow-hidden">
          {taiLieu.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-[13px]">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2"><strong className="font-semibold text-muc">{t.loai}</strong><NhanTrangThai kieu={kieuTl(t.trang_thai)}>{t.trang_thai}</NhanTrangThai></span>
                <span className="mt-0.5 block truncate text-muc-3">{t.ten_tep} · {kb(t.kich_thuoc)} · {ngayVN(t.tao_luc.slice(0, 10))}</span>
                {t.ghi_chu && <span className="mt-0.5 block text-loi">{t.ghi_chu}</span>}
              </span>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <a href={`/api/tai-lieu/${t.id}`} target="_blank" rel="noopener noreferrer" className={NUT_CHU}>Xem</a>
                {quanTri && t.trang_thai !== "Đã xác nhận" && <button type="button" disabled={dang} className={NUT_CHU} onClick={() => xacNhan(t.id)}>Xác nhận</button>}
                {quanTri && t.trang_thai !== "Cần bổ sung" && <button type="button" className={NUT_CHU} onClick={() => setHop({ id: t.id, kieu: "bo-sung", ten: t.loai })}>Yêu cầu bổ sung</button>}
                {(quanTri || t.trang_thai !== "Đã xác nhận") && <button type="button" className={NUT_CHU_NGUY} onClick={() => setHop({ id: t.id, kieu: "go", ten: t.loai })}>Gỡ</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Hop mo={!!hop} dong={dong} tieuDe={hop?.kieu === "go" ? "Gỡ giấy tờ" : "Yêu cầu bổ sung"} moTa={hop?.ten}>
        {hop && (
          <div className="space-y-4">
            <div><label htmlFor="h-ly-do" className={NHAN_O}>{hop.kieu === "go" ? "Lý do gỡ *" : "Cần bổ sung gì? *"}</label><textarea id="h-ly-do" value={lyDo} onChange={(e) => setLyDo(e.target.value)} className={O_NHIEU_DONG} /></div>
            {hop.kieu === "go" && <p className="text-[12px] text-muc-3">Giấy tờ chỉ được gỡ khỏi hồ sơ, tệp vẫn được giữ trong kho để truy vết.</p>}
            {loi && <div role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
            <div className="flex justify-end gap-2 border-t border-vien pt-4"><button type="button" className={NUT_PHU} onClick={dong}>Đóng</button><button type="button" className={NUT_CHINH} disabled={dang} onClick={gui}>Xong</button></div>
          </div>
        )}
      </Hop>
    </div>
  );
}
