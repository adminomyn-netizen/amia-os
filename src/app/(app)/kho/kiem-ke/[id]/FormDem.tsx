"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { luuSoDem } from "../../actions";

type Dong = { san_pham_id: string; ten: string; don_vi: string; ton_so: number; ton_thuc: number | null; so_lo: string | null; han_dung: string | null };

/** Bảng nhập số đếm thực tế cho phiếu kiểm kê. Chênh lệch tính ngay trên màn hình; chỉ ghi sổ kho khi phiếu được duyệt. */
export function FormDem({ id, dong, sua, tonDau = false }: { id: string; dong: Dong[]; sua: boolean; tonDau?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(dong.map((d) => [d.san_pham_id, d.ton_thuc == null ? "" : String(d.ton_thuc)])));
  const [lo, setLo] = useState<Record<string, string>>(() => Object.fromEntries(dong.map((d) => [d.san_pham_id, d.so_lo ?? ""])));
  const [han, setHan] = useState<Record<string, string>>(() => Object.fromEntries(dong.map((d) => [d.san_pham_id, d.han_dung ?? ""])));
  const [loi, setLoi] = useState("");
  const [ok, setOk] = useState(false);
  const [dang, bat] = useTransition();
  const luu = () => {
    setLoi(""); setOk(false);
    const fd = new FormData();
    fd.set("id", id);
    for (const d of dong) {
      fd.set(`thuc_${d.san_pham_id}`, v[d.san_pham_id] ?? "");
      if (tonDau) { fd.set(`lo_${d.san_pham_id}`, lo[d.san_pham_id] ?? ""); fd.set(`han_${d.san_pham_id}`, han[d.san_pham_id] ?? ""); }
    }
    bat(async () => {
      const r = await luuSoDem(fd);
      if (r.loi) setLoi(r.loi); else { setOk(true); router.refresh(); }
    });
  };
  return (
    <div>
      <div className="overflow-x-auto rounded-the border border-vien">
        <table className="w-full text-[14px]">
          <thead className="bg-nen-2 text-left text-[12.5px] text-muc-3"><tr><th className="px-3 py-2">Vật tư</th><th className="px-3 py-2 text-right">Tồn sổ</th><th className="px-3 py-2 text-right">Đếm thực tế</th>{tonDau && <><th className="px-3 py-2">Số lô</th><th className="px-3 py-2">Hạn dùng (năm-tháng-ngày)</th></>}<th className="px-3 py-2 text-right">Chênh lệch</th></tr></thead>
          <tbody>
            {dong.map((d) => {
              const t = v[d.san_pham_id], lech = t === "" || t == null ? null : Number(t.replace(",", ".")) - d.ton_so;
              return (
                <tr key={d.san_pham_id} className="border-t border-vien">
                  <td className="px-3 py-2">{d.ten}</td>
                  <td className="px-3 py-2 text-right">{d.ton_so.toLocaleString("vi-VN")} {d.don_vi}</td>
                  <td className="px-3 py-2 text-right">
                    {sua ? <input inputMode="decimal" value={v[d.san_pham_id] ?? ""} onChange={(e) => setV((x) => ({ ...x, [d.san_pham_id]: e.target.value }))} aria-label={`Đếm thực tế ${d.ten}`} className="h-9 w-24 rounded-nho border border-vien px-2 text-right" /> : d.ton_thuc == null ? "–" : d.ton_thuc.toLocaleString("vi-VN")}
                  </td>
                  {tonDau && (
                    <>
                      <td className="px-3 py-2">{sua ? <input value={lo[d.san_pham_id] ?? ""} onChange={(e) => setLo((x) => ({ ...x, [d.san_pham_id]: e.target.value }))} aria-label={`Số lô ${d.ten}`} className="h-9 w-28 rounded-nho border border-vien px-2" /> : d.so_lo ?? ""}</td>
                      <td className="px-3 py-2">{sua ? <input value={han[d.san_pham_id] ?? ""} placeholder="2028-12-31" onChange={(e) => setHan((x) => ({ ...x, [d.san_pham_id]: e.target.value }))} aria-label={`Hạn dùng ${d.ten}`} className="h-9 w-32 rounded-nho border border-vien px-2" /> : d.han_dung ?? ""}</td>
                    </>
                  )}
                  <td className={`px-3 py-2 text-right ${lech ? "font-medium text-canh-bao" : "text-muc-3"}`}>{lech == null || Number.isNaN(lech) ? "" : lech === 0 ? "Khớp" : `${lech > 0 ? "+" : ""}${lech.toLocaleString("vi-VN", { maximumFractionDigits: 3 })}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sua && (
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={luu} disabled={dang} className="h-10 rounded-nho bg-nhan px-4 text-[14px] font-medium text-white disabled:opacity-60">{dang ? "Đang lưu…" : "Lưu số đếm"}</button>
          {loi && <span role="alert" className="text-[13px] text-loi">{loi}</span>}
          {ok && <span className="text-[13px] text-nhan-dam">Đã lưu.</span>}
        </div>
      )}
    </div>
  );
}
