"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NutHop } from "@/components/ui/BieuMau";
import type { LuaChon } from "@/components/ui/Chon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { BaoPhieuBuoi, truongBuoi, type KetQuaBuoi } from "@/components/the/NutBuoi";
import { batDauLam, huyLuotCho, suaLuotCho, traLaiThuNgan, xongBuoiCho } from "@/app/(app)/the/cho-lam/actions";
import type { BuoiCho, QuyTrinhKhach } from "@/lib/buoi-cho-lam";
import { BuocQuyTrinh } from "@/components/the/BuocQuyTrinh";

const NHAN: Record<string, { chu: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_lam: { chu: "Chờ làm", kieu: "cho" }, dang_lam: { chu: "Đang làm", kieu: "tot" }, xong: { chu: "Đã làm xong", kieu: "tram" },
  tra_lai: { chu: "Trả lại thu ngân", kieu: "loi" }, huy: { chu: "Khách không làm", kieu: "loi" },
};
const gio = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "");
const phut = (tu: string, den?: string | null) => Math.max(0, Math.round(((den ? new Date(den).getTime() : Date.now()) - new Date(tu).getTime()) / 60000));

/** Nút "Bắt đầu làm": mở hộp nhận vật tư — quy trình chị Lâm chốt 17/11/2026: vật tư cấp TRƯỚC khi làm, chưa tích "Đã nhận đủ vật tư" thì không bắt đầu được. */
function NutBatDau({ id, qt, onDoi }: { id: string; qt?: QuyTrinhKhach; onDoi?: () => Promise<void> | void }) {
  const vatTu = [...new Set((qt?.buoc ?? []).flatMap((b) => b.goiY).map((x) => x.trim()).filter(Boolean))];
  return (
    <NutHop nhan="Bắt đầu làm" tieuDe="Nhận vật tư trước khi làm" nhanLuu="Bắt đầu làm" an={{ id }}
      moTa={vatTu.length ? `Vật tư cho khách này theo quy trình: ${vatTu.join("; ")}. Nhận đủ ở kho rồi tích xác nhận mới bắt đầu làm được.` : "Dịch vụ này chưa có danh sách vật tư theo quy trình. Nhận đủ vật tư cần dùng ở kho rồi tích xác nhận mới bắt đầu làm được."}
      truong={[{ ten: "da_nhan_vat_tu", nhan: "Em đã nhận đủ vật tư cho buổi này", loai: "gat" }]}
      action={async (fd) => { const k = await batDauLam(fd); if (k.ok) await onDoi?.(); return k; }} />
  );
}

/** Một khách chờ làm: thông tin thu ngân chuyển + các nút của chuyên viên trị liệu. */
function TheKhach({ r, nhanVien, bacSi, thaoTac, ketThuc, coLienKetThe, qt, hienQt, dvCuaThe, onDoi, anKhach, inChung }: { r: BuoiCho; nhanVien: LuaChon[]; bacSi: LuaChon[]; thaoTac: boolean; /** Bấm được Kết thúc (chỉ chuyên viên trị liệu / Chủ). */ ketThuc: boolean; coLienKetThe: boolean; /** Quy trình hôm nay của khách (gộp mọi lượt). */ qt?: QuyTrinhKhach; /** Lượt này hiện khối quy trình (chỉ một lượt mỗi khách). */ hienQt?: boolean;
  /** Dịch vụ đổi được của thẻ: có thì hiện nút "Sửa dịch vụ / người làm". */ dvCuaThe?: (theId: string) => LuaChon[]; onDoi?: () => Promise<void> | void; /** Ẩn tên khách (đã biết khách, vd Hoá đơn dịch vụ). */ anKhach?: boolean; /** Các lượt của khách để in chung một phiếu (chỉ lượt đại diện, khách có từ 2 dịch vụ). */ inChung?: string[] }) {
  const [kq, setKq] = useState<KetQuaBuoi | null>(null);
  const mo = r.trangThai === "cho_lam" || r.trangThai === "dang_lam";
  const nhanGoc = NHAN[r.trangThai] ?? { chu: r.trangThai, kieu: "tram" as const };
  // Thu ngân nhìn trạng thái sống: "Đang làm · bước 2/5" (chị Lâm 11/11/2026).
  const thieuBuoc = r.trangThai === "xong" && r.buocTong != null && r.buocXong != null && r.buocXong < r.buocTong;
  const nhan = r.trangThai === "dang_lam" && qt?.buoc.length ? { ...nhanGoc, chu: `${nhanGoc.chu} · bước ${qt.buoc.filter((b) => b.daTich).length}/${qt.buoc.length}` }
    : thieuBuoc ? { chu: `Xong · THIẾU BƯỚC ${r.buocXong}/${r.buocTong}`, kieu: "loi" as const }
    : r.trangThai === "xong" && r.buocTong ? { ...nhanGoc, chu: `${nhanGoc.chu} · đủ ${r.buocTong}/${r.buocTong} bước` } : nhanGoc;
  return (
    <li className={`rounded-hop border bg-giay-sang px-4 py-3.5 ${r.trangThai === "dang_lam" ? "border-nhan" : "border-vien"} ${mo ? "" : "opacity-80"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!anKhach && <p className="truncate text-[16px] font-semibold text-muc">{r.khachTen}{r.khachMa && <span className="ml-1.5 text-[12.5px] font-normal text-muc-3">{r.khachMa}</span>}</p>}
          <p className={anKhach ? "text-[15px] font-semibold text-muc" : "mt-0.5 text-[14.5px] text-muc-2"}>{r.dichVuTen}{r.soLuong > 1 && <span className="ml-1.5 rounded-tag bg-nhan-nhat px-1.5 py-0.5 text-[12.5px] font-semibold text-nhan-dam">× {r.soLuong} {r.theId ? "buổi" : "lượt"}</span>}</p>
        </div>
        <NhanTrangThai kieu={nhan.kieu}>{nhan.chu}</NhanTrangThai>
      </div>
      <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13.5px]">
        {r.theId ? <>
          <dt className="text-muc-3">{anKhach ? "Trừ thẻ" : "Thẻ"}</dt>
          <dd className="min-w-0 text-muc-2">
            {coLienKetThe ? <Link href={`/the/${r.theId}`} className="font-medium text-nhan-dam hover:underline">{r.theMa}</Link> : r.theMa}
            {r.goiTen && ` · ${r.goiTen}`}{r.conBuoi != null && <> · còn <b className="font-semibold text-muc">{r.conBuoi}</b>{r.tongBuoi != null && `/${r.tongBuoi}`} buổi</>}
          </dd>
        </> : <>
          <dt className="text-muc-3">Hoá đơn</dt>
          <dd className="min-w-0 text-muc-2">
            {r.hoaDonId ? <Link href={`/hoa-don/${r.hoaDonId}`} className="font-medium text-nhan-dam hover:underline">{r.hoaDonMa || "Xem hoá đơn"}</Link> : "Dịch vụ lẻ"} · dịch vụ lẻ đã thu tiền, không trừ thẻ
          </dd>
        </>}
        <dt className="text-muc-3">{anKhach ? "Chuyên viên" : "Người làm"}</dt><dd className="text-muc-2">{r.nvTen.join(", ")}</dd>
        {r.tuVanTen.length > 0 && <><dt className="text-muc-3">Tư vấn</dt><dd className="text-muc-2">{r.tuVanTen.join(", ")}</dd></>}
        <dt className="text-muc-3">Chuyển lúc</dt>
        <dd className="text-muc-2">{gio(r.chuyenLuc)}{r.chuyenBoiTen && ` · ${r.chuyenBoiTen}`}{r.trangThai === "cho_lam" && <span suppressHydrationWarning className="text-canh-bao"> · chờ {phut(r.chuyenLuc)} phút</span>}</dd>
        {r.batDauLuc && <><dt className="text-muc-3">Bắt đầu</dt><dd suppressHydrationWarning className="text-muc-2">{gio(r.batDauLuc)}{r.trangThai === "dang_lam" ? ` · đang làm ${phut(r.batDauLuc)} phút` : r.xongLuc ? ` · xong ${gio(r.xongLuc)} (${phut(r.batDauLuc, r.xongLuc)} phút)` : ""}</dd></>}
        {r.ghiChu && <><dt className="text-muc-3">Ghi chú</dt><dd className="whitespace-pre-line text-muc">{r.ghiChu}</dd></>}
        {r.tuVanTinhTrang && <><dt className="text-muc-3">Tình trạng da</dt><dd className="whitespace-pre-line text-muc-2">{r.tuVanTinhTrang}</dd></>}
        {r.lyDo && <><dt className="text-muc-3">Lý do</dt><dd className="text-loi">{r.lyDo}</dd></>}
      </dl>
      {mo && qt && hienQt && <BuocQuyTrinh khachId={r.khachId} qt={qt} thaoTac={thaoTac} onDoi={onDoi} />}
      {mo && thaoTac && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {r.trangThai === "cho_lam" && <NutBatDau id={r.id} qt={qt} onDoi={onDoi} />}
          {ketThuc ? <NutHop kieu={r.trangThai === "dang_lam" ? "chinh" : "phu"} nhan="Kết thúc (trả khách)" tieuDe={`Kết thúc · ${r.khachTen}`} rong nhanLuu={r.theId ? `Kết thúc, trừ ${r.soLuong} buổi` : "Kết thúc, xác nhận đã làm"}
            moTa={`${r.theId ? `${r.dichVuTen} · thẻ ${r.theMa}. Bấm khi đã làm xong và trả khách: trừ ${r.soLuong} buổi của thẻ${r.soLuong > 1 ? ` (${r.soLuong} lần / người cùng làm)` : ""}, ghi doanh thu của buổi và ra phiếu vật tư theo định mức (tính là đã xác nhận, không phải bấm lại; dùng khác định mức thì mở phiếu sửa).` : `${r.dichVuTen}${r.hoaDonMa ? ` · hoá đơn ${r.hoaDonMa}` : ""}. Bấm khi đã làm xong và trả khách để xác nhận đã làm dịch vụ của hoá đơn. Không trừ thẻ, không đổi tiền.`}${qt && qt.buoc.some((b) => !b.daTich) ? ` Còn ${qt.buoc.filter((b) => !b.daTich).length} bước quy trình chưa tích.` : ""}`}
            an={{ id: r.id }} truong={truongBuoi({ nhanVien, bacSi })}
            giaTri={{ nv_ids: r.nvIds, bac_si_id: r.bacSiId ?? "", tu_van_ids: r.tuVanIds, tu_van_tinh_trang: r.tuVanTinhTrang ?? "", tu_van_de_xuat: r.tuVanDeXuat ?? "", vung: r.vung, shot: r.shot, line: r.line,
              ghi_chu: r.ghiChu ?? "", ke_tiep_ngay: r.keTiepNgay ?? "", ke_tiep_noi_dung: r.keTiepNoiDung ?? "" }}
            action={async (fd) => { const k = await xongBuoiCho(fd); if (k.ok) { setKq(k); await onDoi?.(); } return k; }} />
            : <span className="text-[13px] text-muc-3">Chuyên viên trị liệu bấm Kết thúc khi trả khách.</span>}
          {dvCuaThe && (() => { const dv = r.theId ? dvCuaThe(r.theId) : []; const ds = dv.some((d) => d.gia_tri === r.dichVuId) ? dv : [{ gia_tri: r.dichVuId, nhan: r.dichVuTen }, ...dv]; return (
            <NutHop kieu="chu" nhan="Sửa dịch vụ / chuyên viên" tieuDe={`Sửa · ${r.dichVuTen}`} rong nhanLuu="Lưu"
              moTa={r.theId ? "Đổi dịch vụ (trong thẻ), chuyên viên trị liệu hoặc bác sĩ trước khi làm. Chưa trừ buổi; Kết thúc mới trừ buổi theo nội dung đã sửa." : "Lượt theo hoá đơn: chỉ đổi chuyên viên trị liệu / bác sĩ, dịch vụ giữ theo hoá đơn. Không đổi tiền."}
              an={{ id: r.id }} giaTri={{ dich_vu_id: r.dichVuId, nv_ids: r.nvIds, bac_si_id: r.bacSiId ?? "" }}
              truong={[{ ten: "dich_vu_id", nhan: "Dịch vụ", loai: "chon", luaChon: ds, batBuoc: true, rong: true }, ...truongBuoi({ nhanVien, bacSi }).filter((t) => t.ten === "nv_ids" || t.ten === "bac_si_id")]}
              action={async (fd) => { const k = await suaLuotCho(fd); if (k.ok) await onDoi?.(); return k; }} />
          ); })()}
          <div className="flex items-center gap-4 sm:ml-auto">
            <NutHop kieu="chu" nhan="Trả lại thu ngân" tieuDe="Trả lại thu ngân" moTa="Khách chưa làm, trả về thu ngân (vd đổi dịch vụ, đổi người làm). Không trừ buổi." an={{ id: r.id }} nhanLuu="Trả lại"
              truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true, goiY: "Vd: khách muốn đổi sang dịch vụ khác" }]} action={async (fd) => { const k = await traLaiThuNgan(fd); if (k.ok) await onDoi?.(); return k; }} />
            <NutHop kieu="chu" nguy nhan="Khách không làm" tieuDe="Khách không làm" moTa="Đóng lượt này. Không trừ buổi, thẻ giữ nguyên." an={{ id: r.id }} nhanLuu="Xác nhận"
              truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true, goiY: "Vd: khách về sớm, khách đổi lịch" }]} action={async (fd) => { const k = await huyLuotCho(fd); if (k.ok) await onDoi?.(); return k; }} />
          </div>
        </div>
      )}
      {(r.theId || (inChung && !anKhach)) && <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {r.theId && <Link href={`/in/phieu-lam/${r.id}`} target="_blank" className="text-[13px] font-medium text-nhan-dam hover:underline">In phiếu làm dịch vụ</Link>}
        {inChung && !anKhach && <Link href={`/in/phieu-lam-nhieu?ids=${inChung.join(",")}`} target="_blank" className="text-[13px] font-semibold text-nhan-dam hover:underline">In 1 phiếu chung ({inChung.length} dịch vụ)</Link>}
      </p>}
      {kq && <p className="mt-2"><BaoPhieuBuoi phieu={kq} /></p>}
    </li>
  );
}

/** Danh sách khách thu ngân đã chuyển cho chuyên viên trị liệu. `thaoTac(r)` = người đang xem bấm được nút của dòng đó. */
export function KhachChoLam({ ds, nhanVien, bacSi, thaoTacIds, ketThuc, coLienKetThe = true, trong, quyTrinh, dvCuaThe, onDoi, gon }: {
  ds: BuoiCho[]; nhanVien: LuaChon[]; bacSi: LuaChon[]; /** id các lượt người đang xem thao tác được. */ thaoTacIds: string[]; /** Người đang xem bấm được Kết thúc (duocKetThucBuoi). */ ketThuc: boolean; coLienKetThe?: boolean; trong?: string;
  /** Quy trình hôm nay theo khách (0322). */ quyTrinh?: Record<string, QuyTrinhKhach>;
  /** Hoá đơn dịch vụ ở Thu ngân: sửa dòng, tải lại sau mỗi thao tác, một cột, ẩn tên khách. */ dvCuaThe?: (theId: string) => LuaChon[]; onDoi?: () => Promise<void> | void; gon?: boolean;
}) {
  if (!ds.length) return <p className="rounded-hop border border-dashed border-vien-dam px-4 py-6 text-center text-[14px] text-muc-3">{trong ?? "Chưa có khách nào được chuyển."}</p>;
  const cho = new Set(thaoTacIds);
  // Khối quy trình hiện ở MỘT lượt mỗi khách (ưu tiên lượt đang làm): khách làm nhiều thẻ thì bước chung không lặp.
  const hienO = new Map<string, string>();
  for (const r of [...ds].sort((a, b) => Number(b.trangThai === "dang_lam") - Number(a.trangThai === "dang_lam"))) if (!hienO.has(r.khachId)) hienO.set(r.khachId, r.id);
  // Khách làm nhiều dịch vụ cùng lúc: in MỘT phiếu chung (chị Diệu Thuý 15/11/2026). Gom lượt chưa huỷ / trả lại theo khách.
  const theoKhach = new Map<string, string[]>();
  for (const r of ds) if (r.trangThai !== "huy" && r.trangThai !== "tra_lai") theoKhach.set(r.khachId, [...(theoKhach.get(r.khachId) ?? []), r.id]);
  const chung = (khachId: string) => { const x = theoKhach.get(khachId); return x && x.length > 1 ? x : undefined; };
  const gonChung = gon ? chung(ds[0].khachId) : undefined;
  return <>
    {gonChung && <Link href={`/in/phieu-lam-nhieu?ids=${gonChung.join(",")}`} target="_blank" className="nut-vang mb-3 flex h-10 items-center justify-center rounded-nho px-4 text-[14px] font-medium">In 1 phiếu chung cho {gonChung.length} dịch vụ</Link>}
    <ul className={gon ? "grid gap-3" : "grid gap-3 lg:grid-cols-2"}>{ds.map((r) => <TheKhach key={r.id} r={r} nhanVien={nhanVien} bacSi={bacSi} thaoTac={cho.has(r.id)} ketThuc={ketThuc} coLienKetThe={coLienKetThe} qt={quyTrinh?.[r.khachId]} hienQt={hienO.get(r.khachId) === r.id} dvCuaThe={dvCuaThe} onDoi={onDoi} anKhach={gon} inChung={hienO.get(r.khachId) === r.id ? chung(r.khachId) : undefined} />)}</ul>
  </>;
}
