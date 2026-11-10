"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NutHop } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { BaoPhieuBuoi, truongBuoi, type KetQuaBuoi } from "@/components/the/NutBuoi";
import { batDauLam, huyLuotCho, traLaiThuNgan, xongBuoiCho } from "@/app/(app)/the/cho-lam/actions";
import type { BuoiCho } from "@/lib/buoi-cho-lam";

const NHAN: Record<string, { chu: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_lam: { chu: "Chờ làm", kieu: "cho" }, dang_lam: { chu: "Đang làm", kieu: "tot" }, xong: { chu: "Đã làm xong", kieu: "tram" },
  tra_lai: { chu: "Trả lại thu ngân", kieu: "loi" }, huy: { chu: "Khách không làm", kieu: "loi" },
};
const gio = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "");
const phut = (tu: string, den?: string | null) => Math.max(0, Math.round(((den ? new Date(den).getTime() : Date.now()) - new Date(tu).getTime()) / 60000));

/** Nút "Bắt đầu làm" to, dễ bấm trên điện thoại. */
function NutBatDau({ id }: { id: string }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  return (
    <span className="flex flex-col">
      <button type="button" disabled={dang} className="nut-vang h-11 w-full rounded-nho px-4 text-[15px] font-medium disabled:opacity-60 sm:w-auto"
        onClick={() => { setLoi(""); bat(async () => { const fd = new FormData(); fd.set("id", id); const kq = await batDauLam(fd); if (kq.loi) setLoi(kq.loi); else router.refresh(); }); }}>
        {dang ? "Đang lưu" : "Bắt đầu làm"}
      </button>
      {loi && <span role="alert" className="mt-1 text-[12.5px] text-loi">{loi}</span>}
    </span>
  );
}

/** Một khách chờ làm: thông tin thu ngân chuyển + các nút của chuyên viên trị liệu. */
function TheKhach({ r, nhanVien, bacSi, thaoTac, coLienKetThe }: { r: BuoiCho; nhanVien: LuaChon[]; bacSi: LuaChon[]; thaoTac: boolean; coLienKetThe: boolean }) {
  const [kq, setKq] = useState<KetQuaBuoi | null>(null);
  const mo = r.trangThai === "cho_lam" || r.trangThai === "dang_lam";
  const nhan = NHAN[r.trangThai] ?? { chu: r.trangThai, kieu: "tram" as const };
  return (
    <li className={`rounded-hop border bg-giay-sang px-4 py-3.5 ${r.trangThai === "dang_lam" ? "border-nhan" : "border-vien"} ${mo ? "" : "opacity-80"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-muc">{r.khachTen}{r.khachMa && <span className="ml-1.5 text-[12.5px] font-normal text-muc-3">{r.khachMa}</span>}</p>
          <p className="mt-0.5 text-[14.5px] text-muc-2">{r.dichVuTen}</p>
        </div>
        <NhanTrangThai kieu={nhan.kieu}>{nhan.chu}</NhanTrangThai>
      </div>
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
        <dt className="text-muc-3">Thẻ</dt>
        <dd className="min-w-0 text-muc-2">
          {coLienKetThe ? <Link href={`/the/${r.theId}`} className="font-medium text-nhan-dam hover:underline">{r.theMa}</Link> : r.theMa}
          {r.goiTen && ` · ${r.goiTen}`}{r.conBuoi != null && <> · còn <b className="font-semibold text-muc">{r.conBuoi}</b>{r.tongBuoi != null && `/${r.tongBuoi}`} buổi</>}
        </dd>
        <dt className="text-muc-3">Người làm</dt><dd className="text-muc-2">{r.nvTen.join(", ")}</dd>
        {r.tuVanTen.length > 0 && <><dt className="text-muc-3">Tư vấn</dt><dd className="text-muc-2">{r.tuVanTen.join(", ")}</dd></>}
        <dt className="text-muc-3">Chuyển lúc</dt>
        <dd className="text-muc-2">{gio(r.chuyenLuc)}{r.chuyenBoiTen && ` · ${r.chuyenBoiTen}`}{r.trangThai === "cho_lam" && <span suppressHydrationWarning className="text-canh-bao"> · chờ {phut(r.chuyenLuc)} phút</span>}</dd>
        {r.batDauLuc && <><dt className="text-muc-3">Bắt đầu</dt><dd suppressHydrationWarning className="text-muc-2">{gio(r.batDauLuc)}{r.trangThai === "dang_lam" ? ` · đang làm ${phut(r.batDauLuc)} phút` : r.xongLuc ? ` · xong ${gio(r.xongLuc)} (${phut(r.batDauLuc, r.xongLuc)} phút)` : ""}</dd></>}
        {r.ghiChu && <><dt className="text-muc-3">Ghi chú</dt><dd className="whitespace-pre-line text-muc">{r.ghiChu}</dd></>}
        {r.tuVanTinhTrang && <><dt className="text-muc-3">Tình trạng da</dt><dd className="whitespace-pre-line text-muc-2">{r.tuVanTinhTrang}</dd></>}
        {r.lyDo && <><dt className="text-muc-3">Lý do</dt><dd className="text-loi">{r.lyDo}</dd></>}
      </dl>
      {mo && thaoTac && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {r.trangThai === "cho_lam" && <NutBatDau id={r.id} />}
          <NutHop kieu={r.trangThai === "dang_lam" ? "chinh" : "phu"} nhan="Đã làm xong" tieuDe={`Đã làm xong · ${r.khachTen}`} rong nhanLuu="Đã làm xong, trừ 1 buổi"
            moTa={`${r.dichVuTen} · thẻ ${r.theMa}. Bấm lưu là trừ 1 buổi của thẻ, ghi doanh thu của buổi và ra phiếu vật tư theo định mức để chuyên viên kiểm.`}
            an={{ id: r.id }} truong={truongBuoi({ nhanVien, bacSi })}
            giaTri={{ nv_ids: r.nvIds, bac_si_id: r.bacSiId ?? "", tu_van_ids: r.tuVanIds, tu_van_tinh_trang: r.tuVanTinhTrang ?? "", tu_van_de_xuat: r.tuVanDeXuat ?? "", vung: r.vung, shot: r.shot, line: r.line,
              ghi_chu: r.ghiChu ?? "", ke_tiep_ngay: r.keTiepNgay ?? "", ke_tiep_noi_dung: r.keTiepNoiDung ?? "" }}
            action={async (fd) => { const k = await xongBuoiCho(fd); if (k.ok) setKq(k); return k; }} />
          <div className="flex items-center gap-4 sm:ml-auto">
            <NutHop kieu="chu" nhan="Trả lại thu ngân" tieuDe="Trả lại thu ngân" moTa="Khách chưa làm, trả về thu ngân (vd đổi dịch vụ, đổi người làm). Không trừ buổi." an={{ id: r.id }} nhanLuu="Trả lại"
              truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true, goiY: "Vd: khách muốn đổi sang dịch vụ khác" }]} action={traLaiThuNgan} />
            <NutHop kieu="chu" nguy nhan="Khách không làm" tieuDe="Khách không làm" moTa="Đóng lượt này. Không trừ buổi, thẻ giữ nguyên." an={{ id: r.id }} nhanLuu="Xác nhận"
              truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true, goiY: "Vd: khách về sớm, khách đổi lịch" }]} action={huyLuotCho} />
          </div>
        </div>
      )}
      <p className="mt-2"><Link href={`/in/phieu-lam/${r.id}`} target="_blank" className="text-[13px] font-medium text-nhan-dam hover:underline">In phiếu làm dịch vụ</Link></p>
      {kq && <p className="mt-2"><BaoPhieuBuoi phieu={kq} /></p>}
    </li>
  );
}

/** Danh sách khách thu ngân đã chuyển cho chuyên viên trị liệu. `thaoTac(r)` = người đang xem bấm được nút của dòng đó. */
export function KhachChoLam({ ds, nhanVien, bacSi, thaoTacIds, coLienKetThe = true, trong }: {
  ds: BuoiCho[]; nhanVien: LuaChon[]; bacSi: LuaChon[]; /** id các lượt người đang xem thao tác được. */ thaoTacIds: string[]; coLienKetThe?: boolean; trong?: string;
}) {
  if (!ds.length) return <p className="rounded-hop border border-dashed border-vien-dam px-4 py-6 text-center text-[14px] text-muc-3">{trong ?? "Chưa có khách nào được chuyển."}</p>;
  const cho = new Set(thaoTacIds);
  return <ul className="grid gap-3 lg:grid-cols-2">{ds.map((r) => <TheKhach key={r.id} r={r} nhanVien={nhanVien} bacSi={bacSi} thaoTac={cho.has(r.id)} coLienKetThe={coLienKetThe} />)}</ul>;
}
