"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Che = "sang" | "toi" | "may";
const KHOA = "amia_giao_dien", SU_KIEN = "amia-giao-dien";
const LUA_CHON: { ma: Che; nhan: string; Icon: typeof Sun }[] = [{ ma: "sang", nhan: "Sáng", Icon: Sun }, { ma: "toi", nhan: "Tối", Icon: Moon }, { ma: "may", nhan: "Theo máy", Icon: Monitor }];

const doc = (): Che => { try { const g = localStorage.getItem(KHOA); return g === "sang" || g === "toi" ? g : "may"; } catch { return "may"; } };
const theoDoi = (xong: () => void) => { window.addEventListener(SU_KIEN, xong); window.addEventListener("storage", xong); return () => { window.removeEventListener(SU_KIEN, xong); window.removeEventListener("storage", xong); }; };

function ap(che: Che) {
  const toi = che === "toi" || (che === "may" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = toi ? "dark" : "light";
}
function dat(che: Che) {
  try { localStorage.setItem(KHOA, che); } catch { /* chế độ riêng tư: vẫn áp cho lần xem này */ }
  ap(che);
  window.dispatchEvent(new Event(SU_KIEN));
}

/** Chọn giao diện Sáng / Tối / Theo máy; lưu ở trình duyệt của người dùng. Có trong menu tài khoản nên dùng được cả trên điện thoại. */
export function ChonGiaoDien() {
  const che = useSyncExternalStore(theoDoi, doc, () => "may" as Che);
  return (
    <div className="border-t border-vien px-5 py-3.5">
      <div className="nhan-muc mb-2">Giao diện</div>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Giao diện">
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
