"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bang } from "@/components/ui/Table";
import { NutHop, type KetQuaHD, type Truong } from "@/components/ui/BieuMau";
import { NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";

export type DongCanXuat = {
  id: string; ma: string; ngay: string; khach: string; mst: string; lyDo: string; phaiThu: string;
  /** Mỗi mục một dòng, ví dụ "Techcombank 2.000.000". */
  thu: string[];
};
const O_TICK = "h-4 w-4 cursor-pointer accent-[var(--nhan)]";

/** Ngăn "Cần xuất": tick từng đơn hoặc tất cả rồi "Xuất Excel" các đơn đã chọn. Vẫn thủ công: ghi số hoá đơn điện tử sau khi xuất ở phần mềm nhà cung cấp. */
export function BangCanXuat({ dong, duocGhi, truongGhi, ngayHomNay, ghiAction, conNua }: {
  dong: DongCanXuat[]; duocGhi: boolean; truongGhi: Truong[]; ngayHomNay: string; ghiAction: (fd: FormData) => Promise<KetQuaHD | void>; conNua: boolean;
}) {
  const [chon, setChon] = useState<Set<string>>(new Set());
  const hienCo = useMemo(() => new Set(dong.map((d) => d.id)), [dong]);
  const ids = dong.filter((d) => chon.has(d.id)).map((d) => d.id);
  const hetChua = dong.length > 0 && ids.length === dong.length;
  const doi = (id: string) => setChon((c) => { const m = new Set([...c].filter((x) => hienCo.has(x))); if (m.has(id)) m.delete(id); else m.add(id); return m; });
  const chonHet = () => setChon(hetChua ? new Set() : new Set(dong.map((d) => d.id)));
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-muc-2">
          <input type="checkbox" className={O_TICK} checked={hetChua} onChange={chonHet} disabled={dong.length === 0} aria-label="Chọn tất cả hoá đơn đang hiện" />
          Chọn tất cả{dong.length > 0 && ` (${dong.length})`}
        </label>
        <span className="flex items-center gap-3">
          <span className="text-[13px] text-muc-3" aria-live="polite">{ids.length ? `Đã chọn ${ids.length} đơn` : "Chưa chọn đơn nào"}</span>
          {ids.length ? <a href={`/api/xuat/hoa-don-dien-tu?ids=${ids.join(",")}`} download className={`${NUT_CHINH} inline-block leading-10`}>Xuất Excel</a> : <button type="button" disabled className={NUT_PHU}>Xuất Excel</button>}
        </span>
      </div>
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Không có hoá đơn nào cần xuất với bộ lọc này."
        cot={[
          { nhan: "Chọn", hienThi: (r) => <input type="checkbox" className={O_TICK} checked={chon.has(r.id)} onChange={() => doi(r.id)} aria-label={`Chọn hoá đơn ${r.ma}`} /> },
          { nhan: "Hoá đơn bán", chinh: true, hienThi: (r) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}<span className="block text-[12.5px] font-normal text-muc-3">{r.ngay}</span></Link> },
          { nhan: "Khách hàng", hienThi: (r) => <div>{r.khach}{r.mst && <div className="text-[12.5px] text-muc-3">MST {r.mst}</div>}</div> },
          { nhan: "Tiền thu vào", hienThi: (r) => (r.thu.length ? <div>{r.thu.map((t) => <div key={t}>{t}</div>)}</div> : <span className="text-muc-3">Chưa thu</span>) },
          { nhan: "Vì sao cần xuất", hienThi: (r) => r.lyDo },
          { nhan: "Phải thu", phai: true, hienThi: (r) => r.phaiThu },
          { nhan: "", hienThi: (r) => (duocGhi ? (
            <div className="flex flex-wrap justify-end gap-2">
              <NutHop kieu="chu" nhan="Ghi số hoá đơn điện tử" tieuDe={`Ghi số hoá đơn điện tử cho ${r.ma}`} moTa="Nhập số hoá đơn đã xuất ở phần mềm của nhà cung cấp." truong={truongGhi} action={ghiAction} an={{ hoa_don_id: r.id, moi: "1" }} giaTri={{ vat_hd_ngay: ngayHomNay }} />
            </div>
          ) : null) },
        ]} />
      {conNua && <p className="mt-3 text-[13px] text-muc-3">Chỉ hiện 200 hoá đơn mới nhất. Thu hẹp khoảng ngày hoặc đổi bộ lọc để xem phần còn lại.</p>}
    </>
  );
}
