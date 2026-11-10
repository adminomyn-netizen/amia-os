"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NUT_CHINH, O_NHAP } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";

const KIEU = [{ gia_tri: "phan_tram", nhan: "Phần trăm" }, { gia_tri: "tien", nhan: "Tiền / đơn vị" }];

export type MucHh = { loai: "dich_vu" | "san_pham" | "goi_the"; id: string; ten: string; nhom: string; kieu?: "phan_tram" | "tien"; giaTri?: number };
const NHOM: Record<MucHh["loai"], string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Thẻ / liệu trình" };
const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

/** Tab "Hoa hồng theo dịch vụ" của một nguồn: mỗi dịch vụ / sản phẩm / thẻ một mức riêng (% hoặc số tiền mỗi đơn vị); để trống = mức chung của nguồn. */
export function HhTheoMuc({ doiTacId, mucChung, muc, sua, luu }: { doiTacId: string; mucChung: string; muc: MucHh[]; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loai, setLoai] = useState<MucHh["loai"]>("dich_vu");
  const [tim, setTim] = useState("");
  const [sau, setSau] = useState<Record<string, { kieu: "phan_tram" | "tien"; giaTri: string }>>({});
  const [tb, setTb] = useState<{ ok?: boolean; chu: string } | null>(null);
  const khoa = (m: MucHh) => `${m.loai}:${m.id}`;
  const hienTai = (m: MucHh) => sau[khoa(m)] ?? { kieu: m.kieu ?? "phan_tram", giaTri: m.giaTri != null ? String(m.giaTri) : "" };
  const ds = useMemo(() => { const t = boDau(tim.trim()); return muc.filter((m) => m.loai === loai && (!t || boDau(`${m.ten} ${m.nhom}`).includes(t))); }, [muc, loai, tim]);
  const soRieng = muc.filter((m) => m.kieu).length;
  const gui = () => {
    const fd = new FormData();
    fd.set("doi_tac_id", doiTacId);
    for (const [k, v] of Object.entries(sau)) fd.set(`muc:${k}`, `${v.kieu}|${v.giaTri.trim()}`);
    if (Object.keys(sau).length === 0) return setTb({ chu: "Chưa đổi mức nào." });
    bat(async () => { const kq = await luu(fd); if (kq.loi) setTb({ chu: kq.loi }); else { setTb({ ok: true, chu: "Đã lưu." }); setSau({}); router.refresh(); } });
  };
  return (
    <div>
      <p className="mb-3 text-[13px] text-muc-3">Mức chung của nguồn: <b className="text-muc">{mucChung}</b>. Ô để trống = dùng mức chung. Đang có {soRieng} mục đặt mức riêng. Mức riêng áp cho hoá đơn mới (thu ngân chọn nguồn ở dòng hàng thì tự điền); bút toán đã ghi không đổi.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(Object.keys(NHOM) as MucHh["loai"][]).map((l) => <button key={l} type="button" aria-pressed={loai === l} onClick={() => setLoai(l)} className={`rounded-nho border px-3 py-1.5 text-[13px] ${loai === l ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2"}`}>{NHOM[l]} ({muc.filter((m) => m.loai === l).length})</button>)}
        <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm tên" aria-label="Tìm mục" className={`${O_NHAP} max-w-[260px]`} />
      </div>
      <div className="the-noi overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead><tr className="border-b border-vien text-left text-[12.5px] text-muc-3"><th className="px-3 py-2 font-medium">Tên</th><th className="px-3 py-2 font-medium">Nhóm</th><th className="px-3 py-2 font-medium">Kiểu</th><th className="px-3 py-2 text-right font-medium">Mức riêng</th></tr></thead>
          <tbody>
            {ds.slice(0, 400).map((m) => {
              const v = hienTai(m);
              const dat = (p: Partial<typeof v>) => setSau((x) => ({ ...x, [khoa(m)]: { ...v, ...p } }));
              return (
                <tr key={khoa(m)} className={`border-b border-vien last:border-0 ${sau[khoa(m)] ? "bg-nhan-nhat/40" : ""}`}>
                  <td className="px-3 py-2">{m.ten}</td><td className="px-3 py-2 text-muc-3">{m.nhom}</td>
                  <td className="px-3 py-2">
                    <div className="w-[150px]"><Chon nho voHieu={!sua} ariaLabel={`Kiểu hoa hồng ${m.ten}`} giaTri={v.kieu} luaChon={KIEU} onDoi={(x) => dat({ kieu: x === "tien" ? "tien" : "phan_tram" })} /></div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input disabled={!sua} inputMode="decimal" aria-label={`Mức hoa hồng ${m.ten}`} placeholder="Mức chung" value={v.giaTri} onChange={(e) => dat({ giaTri: e.target.value.replace(/[^\d.,]/g, "") })} className={`${O_NHAP} h-9 w-[130px] text-right`} />
                  </td>
                </tr>
              );
            })}
            {ds.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muc-3">Không có mục.</td></tr>}
          </tbody>
        </table>
      </div>
      {ds.length > 400 && <p className="mt-2 text-[12.5px] text-muc-3">Hiện 400 dòng đầu, gõ tên để tìm.</p>}
      {sua && <div className="mt-4 flex items-center gap-3"><button type="button" disabled={dang} onClick={gui} className={NUT_CHINH}>{dang ? "Đang lưu…" : `Lưu ${Object.keys(sau).length || ""} thay đổi`}</button>{tb && <span role="status" className={`text-[13.5px] ${tb.ok ? "text-nhan-dam" : "text-loi"}`}>{tb.chu}</span>}</div>}
    </div>
  );
}
