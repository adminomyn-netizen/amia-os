"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { linkAnhMoi, trangAnh } from "@/app/(app)/khach-hang/actions";
import type { AnhKhach } from "@/lib/anh-khach";
import { ngayVN } from "@/lib/dinh-dang";

const LOAI_ANH: Record<string, string> = { truoc: "Trước", sau: "Sau", khac: "Khác" };

const gop = (cu: Map<string, AnhKhach>, moi: AnhKhach[]) => {
  const ra = new Map(cu);
  for (const a of moi) if (!ra.has(a.id)) ra.set(a.id, a); // ảnh đã có giữ nguyên link cũ → làm mới trang không tải lại ảnh
  return ra;
};

/** Lưới ảnh khách: server chỉ gửi trang đầu; cuộn gần tới cuối mới lấy tiếp. Ảnh nạp lười, ô giữ chỗ đúng tỉ lệ nên không giật bố cục. */
export function LuoiAnh({ khachId, banDau, tong }: { khachId: string; banDau: AnhKhach[]; tong: number }) {
  const [ds, setDs] = useState(() => gop(new Map(), banDau));
  const [truoc, setTruoc] = useState(banDau);
  const [viTri, setViTri] = useState(banDau.length); // số ảnh đã xin từ server (không phụ thuộc trùng lặp)
  const [het, setHet] = useState(false); // server trả trang rỗng: tạm hết ảnh; mở lại khi tổng số ảnh đổi (ảnh cũ đang về dần)
  const [tongTruoc, setTongTruoc] = useState(tong);
  const [dangTai, setDangTai] = useState(false);
  const [loiTai, setLoiTai] = useState(false);
  const day = useRef<HTMLDivElement>(null);
  const daThuLai = useRef(new Set<string>());
  if (banDau !== truoc) { setTruoc(banDau); setDs(gop(ds, banDau)); } // trang được làm mới (ảnh cũ mới về): gộp ảnh mới vào, giữ phần đã cuộn

  if (tong !== tongTruoc) { setTongTruoc(tong); setHet(false); }

  const conNua = !het && !loiTai && viTri < tong;
  useEffect(() => {
    const el = day.current;
    if (!el || !conNua || dangTai) return;
    const quanSat = new IntersectionObserver((e) => {
      if (!e[0]?.isIntersecting) return;
      quanSat.disconnect();
      setDangTai(true);
      void trangAnh(khachId, viTri).then((r) => {
        if (r.loi) setLoiTai(true);
        else { setDs((c) => gop(c, r.ds)); setViTri((v) => v + r.ds.length); if (r.ds.length === 0) setHet(true); }
      }).catch(() => setLoiTai(true)).finally(() => setDangTai(false));
    }, { rootMargin: "900px 0px" });
    quanSat.observe(el);
    return () => quanSat.disconnect();
  }, [conNua, dangTai, khachId, viTri]);

  // Link ký chỉ sống 1 giờ: ảnh báo lỗi thì xin link mới đúng một lần.
  const thuLai = (id: string) => {
    if (daThuLai.current.has(id)) return;
    daThuLai.current.add(id);
    void linkAnhMoi(khachId, [id]).then((r) => { const a = r.ds[0]; if (a?.url) setDs((c) => new Map(c).set(id, a)); });
  };

  const theoNgay = useMemo(() => {
    const xep = [...ds.values()].sort((x, y) => y.ngay.localeCompare(x.ngay) || y.taoLuc.localeCompare(x.taoLuc));
    const m = new Map<string, AnhKhach[]>();
    for (const a of xep) m.set(a.ngay, [...(m.get(a.ngay) ?? []), a]);
    return [...m.entries()];
  }, [ds]);

  return (
    <>
      {theoNgay.map(([ngay, anh]) => (
        <section key={ngay} className="mb-6 [content-visibility:auto] [contain-intrinsic-size:auto_480px]">
          <h3 className="mb-2 text-[14px] font-semibold text-muc">{ngayVN(ngay)}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {anh.map((a) => (
              <figure key={a.id} className="overflow-hidden rounded-nho border border-vien bg-giay-tram">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url ?? undefined} alt={`Ảnh ${LOAI_ANH[a.loai] ?? ""} điều trị ngày ${ngayVN(a.ngay)}`} loading="lazy" decoding="async" onError={() => thuLai(a.id)} className="aspect-[3/4] w-full object-cover" />
                <figcaption className="px-2 py-1.5 text-[12px] text-muc-2">{LOAI_ANH[a.loai]}{a.ghiChu ? ` · ${a.ghiChu}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      {conNua && <div ref={day} className="h-10" aria-hidden />}
      {dangTai && <p role="status" className="py-3 text-center text-[13px] text-muc-3">Đang tải thêm ảnh…</p>}
      {loiTai && <button type="button" onClick={() => setLoiTai(false)} className="mx-auto block rounded-nho border border-vien-dam px-4 py-2 text-[13px] text-muc-2 hover:bg-giay-tram">Chưa tải được thêm ảnh. Bấm để thử lại</button>}
    </>
  );
}
