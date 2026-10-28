"use client";

import { useState, useTransition } from "react";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import type { KqXemTruoc } from "@/app/(app)/khach-hang/nhom/actions";

/**
 * Gán / bỏ một nhóm cho mọi khách khớp bộ lọc đang chọn ở cột trái. Luôn xem trước số khách bị tác động rồi mới áp dụng.
 * `boLoc` là chuỗi địa chỉ của bộ lọc; máy chủ đọc lại và kiểm quyền, trình duyệt không quyết định gì.
 */
export function GanNhomHangLoat({ nhomMacDinh = "", nhom, boLoc, soDieuKien, action }: { nhomMacDinh?: string; nhom: LuaChon[]; boLoc: string; soDieuKien: number; action: (fd: FormData) => Promise<KqXemTruoc> }) {
  const [id, setId] = useState(nhomMacDinh);
  const [che, setChe] = useState<"gan" | "bo">("gan");
  const [xem, setXem] = useState<KqXemTruoc | null>(null);
  const [xacNhan, setXacNhan] = useState(false);
  const [dang, bat] = useTransition();
  const doi = () => { setXem(null); setXacNhan(false); };
  const tenNhom = nhom.find((n) => n.gia_tri === id)?.nhan ?? "";
  const fd = (apDung: boolean) => {
    const f = new FormData();
    f.set("nhom", id); f.set("che_do", che); f.set("bo_loc", boLoc); f.set("ap_dung", apDung ? "1" : "");
    if (apDung && xem?.thayDoi != null) f.set("du_kien", String(xem.thayDoi));
    return f;
  };
  const chayXem = () => bat(async () => { setXacNhan(false); setXem(await action(fd(false))); });
  const chayAp = () => bat(async () => { setXem(await action(fd(true))); setXacNhan(false); });
  const khongLoc = soDieuKien === 0;
  const choAp = !!xem && !xem.loi && !xem.daApDung && (xem.thayDoi ?? 0) > 0 && (!khongLoc || xacNhan);

  return (
    <section className="rounded-the border border-vien bg-giay-sang p-4" aria-labelledby="gan-hang-loat">
      <h2 id="gan-hang-loat" className="text-[15px] font-semibold text-muc">Thêm khách vào nhóm theo bộ lọc</h2>
      <p className="mt-1 text-[13px] text-muc-3">
        Dùng bộ lọc ở cột bên trái ({soDieuKien > 0 ? `đang có ${soDieuKien} điều kiện lọc` : "đang không lọc gì, tức là tất cả khách"}). Hệ thống cho xem trước số khách bị tác động; chỉ thêm / bớt nhãn nhóm, không xoá hay sửa dữ liệu khách.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Chon ariaLabel="Nhóm cần gán" luaChon={nhom} giaTri={id} onDoi={(v) => { setId(v); doi(); }} trong="Chọn nhóm" />
        <div role="radiogroup" aria-label="Thao tác" className="flex h-11 overflow-hidden rounded-nho border border-vien-dam text-[14px]">
          {([["gan", "Gán nhóm"], ["bo", "Bỏ nhóm"]] as const).map(([v, nhan]) => (
            <button key={v} type="button" role="radio" aria-checked={che === v} onClick={() => { setChe(v); doi(); }} className={`px-4 font-medium ${che === v ? "bg-nhan text-white" : "text-muc-2 hover:bg-giay-tram"}`}>{nhan}</button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button type="button" disabled={!id || dang} onClick={chayXem} className={NUT_PHU}>{dang && !xem ? "Đang đếm…" : "Xem trước"}</button>
        {choAp && <button type="button" disabled={dang} onClick={chayAp} className={NUT_CHINH}>{dang ? "Đang áp dụng…" : `${che === "gan" ? "Gán" : "Bỏ"} cho ${(xem!.thayDoi ?? 0).toLocaleString("vi-VN")} khách`}</button>}
      </div>
      {xem?.loi && <p role="alert" className="mt-3 text-[13px] text-loi">{xem.loi}</p>}
      {xem && !xem.loi && !xem.daApDung && (
        <div className="mt-3 space-y-2 text-[13px] text-muc" aria-live="polite">
          <p>
            Bộ lọc khớp <b className="tabular-nums">{(xem.tong ?? 0).toLocaleString("vi-VN")}</b> khách.{" "}
            {che === "gan" ? "Sẽ thêm nhóm" : "Sẽ bỏ nhóm"} <b>{tenNhom}</b> {che === "gan" ? "cho" : "khỏi"} <b className="tabular-nums">{(xem.thayDoi ?? 0).toLocaleString("vi-VN")}</b> khách
            {(xem.tong ?? 0) > (xem.thayDoi ?? 0) ? ` (${((xem.tong ?? 0) - (xem.thayDoi ?? 0)).toLocaleString("vi-VN")} khách ${che === "gan" ? "đã có nhóm này" : "không có nhóm này"}, bỏ qua)` : ""}.
          </p>
          {khongLoc && (xem.thayDoi ?? 0) > 0 && (
            <label className="flex items-start gap-2 rounded-nho bg-canh-bao-nen px-3 py-2 text-canh-bao">
              <input type="checkbox" checked={xacNhan} onChange={(e) => setXacNhan(e.target.checked)} className="mt-0.5 h-4 w-4" />
              <span>Chưa chọn bộ lọc nào: thao tác sẽ tác động tới TẤT CẢ khách. Tôi đã kiểm tra và muốn tiếp tục.</span>
            </label>
          )}
          {(xem.thayDoi ?? 0) === 0 && <p className="text-muc-3">Không có khách nào cần thay đổi.</p>}
        </div>
      )}
      {xem?.daApDung && !xem.loi && <p role="status" className="mt-3 text-[13px] font-medium text-nhan-dam">Đã {che === "gan" ? "gán" : "bỏ"} nhóm {tenNhom} cho {(xem.thayDoi ?? 0).toLocaleString("vi-VN")} khách. Đã ghi nhật ký.</p>}
    </section>
  );
}
