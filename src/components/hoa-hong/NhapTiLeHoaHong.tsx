"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Bang } from "@/components/ui/Table";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHIEU_DONG } from "@/components/ui/dinh-dang";
import { NHAN_LOAI, NHAN_VAI, type DongNhap } from "@/lib/hoa-hong-nhap";
import type { KetQuaNhapTiLe } from "@/app/(app)/hoa-hong/actions";

const VIEC: Record<DongNhap["hanh_dong"], string> = { them: "Thêm mới", ghi_de: "Ghi đè", giu_nguyen: "Giữ nguyên", loi: "Lỗi" };
const so = (ti: number | null, tien: number | null) => [ti ? `${ti}%` : "", tien ? `${tien.toLocaleString("vi-VN")} đ` : ""].filter(Boolean).join(" + ") || "0%";
const TOI_DA_HIEN = 200;

/** Nhập cả bảng tỉ lệ hoa hồng: dán bảng từ Excel hoặc chọn tệp → xem trước từng dòng → áp dụng một lần. Còn dòng lỗi thì không cho áp dụng. */
export function NhapTiLeHoaHong({ xemTruoc, apDung }: { xemTruoc: (fd: FormData) => Promise<KetQuaNhapTiLe>; apDung: (fd: FormData) => Promise<KetQuaNhapTiLe> }) {
  const router = useRouter();
  const tepRef = useRef<HTMLInputElement>(null);
  const [mo, setMo] = useState(false);
  const [vanBan, setVanBan] = useState(""), [tenTep, setTenTep] = useState("");
  const [kq, setKq] = useState<KetQuaNhapTiLe | null>(null);
  const [xong, setXong] = useState("");
  const [dang, bat] = useTransition();
  const tong = kq?.tong;
  const sua = kq && !kq.ok && tong ? tong.them + tong.ghiDe : 0;
  const moi = () => { setMo(true); setKq(null); setXong(""); };
  const dungFd = () => { const f = new FormData(); const t = tepRef.current?.files?.[0]; if (t) f.set("tep", t); else f.set("van_ban", vanBan); return f; };
  const xem = () => { setXong(""); bat(async () => setKq(await xemTruoc(dungFd()))); };
  const ap = () => bat(async () => {
    const r = await apDung(dungFd());
    if (r.ok) { setXong(`Đã lưu: thêm ${r.tong?.them ?? 0}, ghi đè ${r.tong?.ghiDe ?? 0}, giữ nguyên ${r.tong?.giuNguyen ?? 0}.`); setKq(null); setVanBan(""); setTenTep(""); if (tepRef.current) tepRef.current.value = ""; router.refresh(); } else setKq(r);
  });
  const dong = kq?.dong ? [...kq.dong].sort((a, b) => Number(b.hanh_dong === "loi") - Number(a.hanh_dong === "loi") || a.dong - b.dong) : [];
  return (
    <>
      <button type="button" className={NUT_PHU} onClick={moi}>Nhập từ Excel</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Nhập tỉ lệ hoa hồng từ Excel" moTa="Dán bảng hoặc chọn tệp. Hệ thống cho xem từng dòng trước, bấm Áp dụng mới lưu. Có dòng lỗi thì chưa lưu dòng nào." rong="rong">
        <p className="mb-3 text-[13px] leading-relaxed text-muc-3">Cột theo thứ tự: Loại (dịch vụ, sản phẩm, gói thẻ) · Mã hoặc tên mục (để trống = mặc định cả loại) · Vai (phục vụ, tư vấn, bán, giới thiệu) · Tỉ lệ (%) · Số tiền cố định (không bắt buộc) · Đối tượng (để trống = mọi người; &quot;nhóm: tên chức danh&quot;; hoặc mã/tên nhân viên).</p>
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
          <a href="/api/xuat/bao-cao-khac?loai=mau-ti-le-hoa-hong" download className="font-medium text-nhan-dam underline-offset-4 hover:underline">Tải mẫu Excel</a>
          <a href="/api/xuat/bao-cao-khac?loai=ti-le-hoa-hong" download className="font-medium text-nhan-dam underline-offset-4 hover:underline">Xuất tỉ lệ hiện có để sửa</a>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="nh-tep" className={NHAN_O}>Chọn tệp (.xlsx hoặc .csv)</label>
            <input ref={tepRef} id="nh-tep" type="file" accept=".xlsx,.csv" onChange={(e) => { setTenTep(e.target.files?.[0]?.name ?? ""); if (e.target.files?.[0]) setVanBan(""); setKq(null); setXong(""); }} className="block w-full text-[14px] file:mr-3 file:rounded-nho file:border file:border-vien-dam file:bg-giay-sang file:px-3 file:py-2 file:text-[14px]" />
          </div>
          <div>
            <label htmlFor="nh-dan" className={NHAN_O}>Hoặc dán bảng từ Excel vào đây</label>
            <textarea id="nh-dan" value={vanBan} rows={6} disabled={!!tenTep} onChange={(e) => { setVanBan(e.target.value); setKq(null); setXong(""); }} placeholder={"Loại\tMã hoặc tên mục\tVai\tTỉ lệ (%)\tSố tiền cố định\tĐối tượng"} className={`${O_NHIEU_DONG} font-mono text-[13px] disabled:opacity-50`} />
            {tenTep && <p className="mt-1 text-[12px] text-muc-3">Đang dùng tệp {tenTep}. <button type="button" className="underline" onClick={() => { if (tepRef.current) tepRef.current.value = ""; setTenTep(""); setKq(null); }}>Bỏ tệp để dán bảng</button></p>}
          </div>
        </div>
        {kq?.loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{kq.loi}</div>}
        {xong && <div role="status" className="mt-4 rounded-nho border border-vien bg-giay-tram px-3 py-2.5 text-[14px] text-muc">{xong}</div>}
        {tong && (
          <div className="mt-5" aria-live="polite">
            <p className="mb-2 text-[13.5px] text-muc-2">Thêm mới {tong.them} · Ghi đè {tong.ghiDe} · Giữ nguyên {tong.giuNguyen}{tong.loi ? ` · ${tong.loi} dòng lỗi` : ""}</p>
            <Bang duLieu={dong.slice(0, TOI_DA_HIEN)} khoa={(r) => String(r.dong)} trong="Không có dòng nào."
              cot={[{ nhan: "Dòng", hienThi: (r) => r.dong, chinh: true },
                { nhan: "Mục", hienThi: (r) => (r.loai ? `${NHAN_LOAI[r.loai] ?? r.loai}: ${r.mucNhan}` : r.mucNhan) },
                { nhan: "Vai", hienThi: (r) => NHAN_VAI[r.vai] ?? "" }, { nhan: "Đối tượng", hienThi: (r) => r.doiTuongNhan },
                { nhan: "Tỉ lệ", phai: true, hienThi: (r) => (r.hanh_dong === "loi" ? "" : r.hanh_dong === "ghi_de" ? `${so(r.ti_le_cu, r.so_tien_cu)} → ${so(r.ti_le, r.so_tien)}` : so(r.ti_le, r.so_tien)) },
                { nhan: "Việc làm", hienThi: (r) => (r.hanh_dong === "loi" ? <span className="text-loi">{r.loi}</span> : VIEC[r.hanh_dong]) }]} />
            {dong.length > TOI_DA_HIEN && <p className="mt-2 text-[12px] text-muc-3">Đang hiện {TOI_DA_HIEN} dòng đầu (dòng lỗi xếp trước), còn {dong.length - TOI_DA_HIEN} dòng nữa. Tổng số ở trên là của cả bảng.</p>}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Đóng</button>
          <button type="button" className={sua > 0 && !tong?.loi ? NUT_PHU : NUT_CHINH} disabled={dang || (!vanBan.trim() && !tenTep)} onClick={xem}>{dang ? "Đang đọc" : "Xem trước"}</button>
          {sua > 0 && !tong?.loi && <button type="button" className={NUT_CHINH} disabled={dang} onClick={ap}>Áp dụng ({sua} dòng)</button>}
        </div>
      </Hop>
    </>
  );
}
