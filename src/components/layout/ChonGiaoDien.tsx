"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Che = "sang" | "toi";
const KHOA = "amia_giao_dien", SU_KIEN = "amia-giao-dien";
const LUA_CHON: { ma: Che; nhan: string; Icon: typeof Sun }[] = [{ ma: "sang", nhan: "Sáng", Icon: Sun }, { ma: "toi", nhan: "Tối", Icon: Moon }];

// Mặc định luôn sáng; chỉ khi người dùng đã chọn Tối mới tối (giá trị cũ "may" của bản trước coi như sáng).
const doc = (): Che => { try { return localStorage.getItem(KHOA) === "toi" ? "toi" : "sang"; } catch { return "sang"; } };
const theoDoi = (xong: () => void) => { window.addEventListener(SU_KIEN, xong); window.addEventListener("storage", xong); return () => { window.removeEventListener(SU_KIEN, xong); window.removeEventListener("storage", xong); }; };

function dat(che: Che) {
  try { localStorage.setItem(KHOA, che); } catch { /* chế độ riêng tư: vẫn áp cho lần xem này */ }
  document.documentElement.dataset.theme = che === "toi" ? "dark" : "light";
  window.dispatchEvent(new Event(SU_KIEN));
}

/** Nút tròn trên thanh đầu trang: một chạm đổi qua lại giữa Sáng và Tối (hiện cả trên điện thoại). */
export function NutGiaoDien() {
  const che = useSyncExternalStore(theoDoi, doc, () => "sang" as Che);
  const toi = che === "toi";
  return (
    <button type="button" onClick={() => dat(toi ? "sang" : "toi")} aria-pressed={toi} aria-label="Chế độ tối" title={toi ? "Đang tối. Bấm để chuyển sang sáng" : "Đang sáng. Bấm để chuyển sang tối"}
      className="nut-nguoi flex h-10 w-10 shrink-0 items-center justify-center rounded-nho text-muc-2">
      {toi ? <Sun strokeWidth={1.7} className="h-[21px] w-[21px]" aria-hidden /> : <Moon strokeWidth={1.7} className="h-[21px] w-[21px]" aria-hidden />}
    </button>
  );
}

/** Nút chọn giao diện Sáng / Tối trong menu tài khoản (dùng được cả trên điện thoại); lưu ở trình duyệt của người dùng. */
export function ChonGiaoDien() {
  const che = useSyncExternalStore(theoDoi, doc, () => "sang" as Che);
  return (
    <div className="border-t border-vien px-5 py-3.5">
      <div className="nhan-muc mb-2">Giao diện</div>
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Giao diện">
        {LUA_CHON.map(({ ma, nhan, Icon }) => (
          <button key={ma} type="button" onClick={() => dat(ma)} aria-pressed={che === ma}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-nho border text-[13px] ${che === ma ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>
            <Icon strokeWidth={1.7} className="h-4 w-4" aria-hidden />{nhan}
          </button>
        ))}
      </div>
    </div>
  );
}
