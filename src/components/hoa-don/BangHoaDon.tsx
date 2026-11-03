"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bang } from "@/components/ui/Table";
import { NutHop, type KetQuaHD } from "@/components/ui/BieuMau";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { TRANG_THAI_HD } from "@/lib/loc-hoa-don";

export type DongHoaDon = {
  id: string; ma: string; khach: string; ngay: string; gio: string; nguoiLap: string; phaiThu: string; daThu: string; conNo: string;
  trangThai: keyof typeof TRANG_THAI_HD; vat: "" | "co" | "chua"; vatSo: string;
  /** Đơn chuyển từ SalonHero (đồng bộ đêm còn ghi đè tới 15/11). */ laLichSu: boolean;
  /** Đã xuất hoá đơn điện tử: không sửa được (như trang chi tiết). */ coHddt: boolean; laSoDuDau: boolean;
};
const O_TICK = "h-4 w-4 cursor-pointer accent-[var(--nhan)]";
const NUT_NHO = `${NUT_PHU} inline-flex h-9 items-center px-3 text-[13px]`;

/** Danh sách hoá đơn như SalonHero: ô chọn nhiều (in / xuất Excel các đơn đã chọn) và nút Sửa / Huỷ ngay trên dòng (cùng điều kiện và hộp xác nhận như trang chi tiết). */
export function BangHoaDon({ dong, thamSo, choSua, choHuy, suaAction, huyAction }: {
  dong: DongHoaDon[]; /** Bộ lọc đang xem (để xuất Excel đúng các đơn đã chọn trong bộ lọc này). */ thamSo: string;
  choSua: boolean; choHuy: boolean; suaAction: (fd: FormData) => Promise<KetQuaHD | void>; huyAction: (fd: FormData) => Promise<KetQuaHD | void>;
}) {
  const [chon, setChon] = useState<Set<string>>(new Set());
  const hienCo = useMemo(() => new Set(dong.map((d) => d.id)), [dong]);
  const ids = dong.filter((d) => chon.has(d.id)).map((d) => d.id);
  const hetChua = dong.length > 0 && ids.length === dong.length;
  const doi = (id: string) => setChon((c) => { const m = new Set([...c].filter((x) => hienCo.has(x))); if (m.has(id)) m.delete(id); else m.add(id); return m; });
  const chonHet = () => setChon(hetChua ? new Set() : new Set(dong.map((d) => d.id)));
  const ds = ids.join(",");
  return (
    <>
      {dong.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[14px] text-muc-2">
            <input type="checkbox" className={O_TICK} checked={hetChua} onChange={chonHet} aria-label="Chọn tất cả hoá đơn trên trang này" />
            Chọn tất cả trang này ({dong.length})
          </label>
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muc-3" aria-live="polite">{ids.length ? `Đã chọn ${ids.length} đơn` : "Chưa chọn đơn nào"}</span>
            {ids.length ? (
              <>
                <a href={`/in/hoa-don-nhieu?ids=${ds}`} target="_blank" rel="noopener" className={NUT_NHO}>In các đơn đã chọn</a>
                <a href={`/api/xuat/hoa-don?${thamSo}${thamSo ? "&" : ""}ids=${ds}`} download className={NUT_NHO}>Xuất Excel đã chọn</a>
                <button type="button" onClick={() => setChon(new Set())} className="h-9 px-2 text-[13px] font-medium text-nhan-dam hover:underline">Bỏ chọn</button>
              </>
            ) : null}
          </span>
        </div>
      )}
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Không có hoá đơn trong khoảng này."
        cot={[
          { nhan: "Chọn", hienThi: (r) => <input type="checkbox" className={O_TICK} checked={chon.has(r.id)} onChange={() => doi(r.id)} aria-label={`Chọn hoá đơn ${r.ma}`} /> },
          { nhan: "Mã", hienThi: (r) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => r.khach },
          { nhan: "Ngày", hienThi: (r) => <span className="whitespace-nowrap">{r.ngay}{r.gio ? <span className="text-muc-3"> {r.gio}</span> : null}</span> },
          { nhan: "Người lập", hienThi: (r) => r.nguoiLap },
          { nhan: "Phải thu", hienThi: (r) => r.phaiThu, phai: true }, { nhan: "Đã thu", hienThi: (r) => r.daThu, phai: true },
          { nhan: "Còn nợ", hienThi: (r) => (r.conNo ? <span className="font-medium text-canh-bao">{r.conNo}</span> : ""), phai: true },
          { nhan: "HĐ VAT", hienThi: (r) => (r.vat === "co" ? <span className="text-nhan-dam" title={r.vatSo ? `Số ${r.vatSo}` : undefined}>Đã có hoá đơn</span> : r.vat === "chua" ? <span className="text-muc-3">Chưa có hoá đơn</span> : "") },
          { nhan: "Trạng thái", hienThi: (r) => { const t = TRANG_THAI_HD[r.trangThai]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
          { nhan: "", hienThi: (r) => <ThaoTacDong r={r} choSua={choSua} choHuy={choHuy} suaAction={suaAction} huyAction={huyAction} /> },
        ]} />
    </>
  );
}

function ThaoTacDong({ r, choSua, choHuy, suaAction, huyAction }: { r: DongHoaDon; choSua: boolean; choHuy: boolean; suaAction: (fd: FormData) => Promise<KetQuaHD | void>; huyAction: (fd: FormData) => Promise<KetQuaHD | void> }) {
  const xong = r.trangThai === "hoan_thanh" && !r.laSoDuDau;
  return (
    <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 whitespace-nowrap">
      {choSua && xong && r.laLichSu && <span className="text-[12px] text-muc-3" title="Đơn chuyển từ SalonHero: sửa ở SalonHero tới 15/11 (đồng bộ đêm ghi đè)">Sửa ở SalonHero</span>}
      {choSua && xong && !r.laLichSu && r.coHddt && <span className="text-[12px] text-muc-3" title="Đã xuất hoá đơn điện tử: xử lý điều chỉnh/thay thế và xoá số ở mục Hoá đơn VAT trước">Đã xuất HĐĐT</span>}
      {choSua && xong && !r.laLichSu && !r.coHddt && (
        <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa hoá đơn ${r.ma}`} moTa="Hoá đơn về Nháp rồi mở ở Thu ngân để sửa và thanh toán lại (giữ mã, giữ ngày). Khoản thu cũ được ghi đảo cùng ngày, thẻ đã bán (chưa dùng) bị thu hồi, sản phẩm trả kho; khi chốt lại sẽ ghi mới."
          an={{ hoa_don_id: r.id }} nhanLuu="Mở lại để sửa" truong={[{ ten: "ly_do", nhan: "Lý do sửa", loai: "nhieu_dong", batBuoc: true }]} action={suaAction} />
      )}
      {r.trangThai === "nhap" && <Link href={`/hoa-don/${r.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Mở</Link>}
      {choHuy && r.trangThai !== "huy" && (
        <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe={`Huỷ hoá đơn ${r.ma}`} moTa="Huỷ sẽ hoàn lại các khoản đã thu (kể cả thẻ tiền), thu hồi thẻ đã bán và trả kho. Không huỷ được nếu thẻ đã được dùng." an={{ hoa_don_id: r.id }} nhanLuu="Huỷ hoá đơn"
          truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "nhieu_dong", batBuoc: true }]} action={huyAction} />
      )}
    </span>
  );
}
