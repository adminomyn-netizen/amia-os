"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { LOAI_VI, PHUONG_THUC_TIEN } from "@/lib/ban-hang";
import { TOI_DA_DON_THU_NO } from "@/lib/thu-no";
import { thuNoNhieuDon } from "@/app/(app)/hoa-don/actions";

export type DongNoKhach = { id: string; ma: string; maSh: string | null; khachId: string | null; khach: string; dienThoai: string; chiNhanh: string; ngay: string; tong: number; daThu: number; conNo: number; soLan: number; ngayCuoi: string };

/** Danh sách khách hàng còn nợ. Mặc định gom theo khách (dòng khách có tổng, bên dưới là từng hoá đơn kèm số lần thanh toán và ngày trả nợ cuối); `gom=false` thì mỗi hoá đơn một dòng.
 *  Có quyền thu nợ thì mỗi hoá đơn có ô chọn và nút "Trả nợ" (như SalonHero): thu nốt toàn bộ số còn nợ của các hoá đơn đã chọn,
 *  ghi vào sổ thu tiền qua đúng hàm thu nợ của màn hoá đơn. */
export function BangNoKhach({ dong, choPhepThu, homNay, gom = true, coChiNhanh = false }: { dong: DongNoKhach[]; choPhepThu: boolean; homNay: string; gom?: boolean; coChiNhanh?: boolean }) {
  const router = useRouter();
  const [chon, setChon] = useState<Set<string>>(new Set());
  const [mo, setMo] = useState(false);
  const [pt, setPt] = useState("tien_mat");
  const [vi, setVi] = useState("");
  const [ngay, setNgay] = useState(homNay);
  const [loi, setLoi] = useState("");
  const [thanhCong, setThanhCong] = useState("");
  const [dang, bat] = useTransition();
  const dsChon = dong.filter((d) => chon.has(d.id));
  const tongChon = dsChon.reduce((s, d) => s + d.conNo, 0);
  const soCoTheChon = Math.min(dong.length, TOI_DA_DON_THU_NO);
  const hetTrang = soCoTheChon > 0 && dsChon.length === soCoTheChon;
  const doi = (id: string) => setChon((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const nhomKhach = useMemo(() => {
    const m = new Map<string, { khoa: string; khachId: string | null; khach: string; dienThoai: string; dong: DongNoKhach[]; tong: number; daThu: number; conNo: number }>();
    for (const d of dong) {
      const khoa = d.khachId ?? `le-${d.id}`;
      const g = m.get(khoa) ?? { khoa, khachId: d.khachId, khach: d.khach, dienThoai: d.dienThoai, dong: [], tong: 0, daThu: 0, conNo: 0 };
      g.dong.push(d); g.tong += d.tong; g.daThu += d.daThu; g.conNo += d.conNo; m.set(khoa, g);
    }
    return [...m.values()].sort((a, b) => b.conNo - a.conNo);
  }, [dong]);
  const doiNhom = (ids: string[]) => setChon((c) => {
    const n = new Set(c), du = ids.every((i) => n.has(i));
    for (const i of ids) { if (du) n.delete(i); else if (n.size < TOI_DA_DON_THU_NO) n.add(i); }
    return n;
  });

  const thu = () => {
    setLoi("");
    const fd = new FormData();
    for (const d of dsChon) fd.append("hoa_don_id", d.id);
    fd.set("phuong_thuc", pt); fd.set("ngay", ngay); if (pt === "vi_dien_tu") fd.set("loai_vi", vi);
    bat(async () => {
      const kq = await thuNoNhieuDon(fd);
      if (kq.loi) { setLoi(kq.loi); return; }
      setMo(false); setChon(new Set());
      setThanhCong(`Đã thu nợ ${kq.soDon} hoá đơn, tổng ${tienVN(kq.tong)}.`);
      router.refresh();
    });
  };

  return (
    <>
      {choPhepThu && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex min-h-10 items-center gap-2 text-[14px] text-muc-2"><input type="checkbox" checked={hetTrang} onChange={() => setChon(hetTrang ? new Set() : new Set(dong.slice(0, TOI_DA_DON_THU_NO).map((d) => d.id)))} className="h-4 w-4 accent-[var(--nhan)]" />{dong.length > TOI_DA_DON_THU_NO ? `Chọn ${TOI_DA_DON_THU_NO} hoá đơn đầu (tối đa mỗi lần)` : "Chọn tất cả"}</label>
          <button type="button" className={NUT_CHINH} disabled={dsChon.length === 0} onClick={() => { setLoi(""); setThanhCong(""); setPt("tien_mat"); setNgay(homNay); setMo(true); }}>Trả nợ</button>
          {dsChon.length > 0 && <span className="text-[13px] text-muc-3">Đã chọn {dsChon.length} hoá đơn · còn nợ {tienVN(tongChon)}</span>}
          {thanhCong && <span role="status" className="text-[13px] text-nhan-dam">{thanhCong}</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="bang-the w-full min-w-[780px] text-left text-[14px]">
          <thead>
            <tr className="nhan-muc border-b border-vien">
              {choPhepThu && <th className="py-3 pr-4 font-medium">Chọn</th>}
              {!gom && <th className="py-3 pr-4 font-medium">Khách</th>}
              <th className="py-3 pr-4 font-medium">Mã đơn hàng</th>
              {coChiNhanh && <th className="py-3 pr-4 font-medium">Chi nhánh</th>}
              <th className="py-3 pr-4 font-medium">Ngày lập hoá đơn</th>
              <th className="py-3 pr-4 text-right font-medium">Số lần thanh toán</th>
              <th className="py-3 pr-4 font-medium">Ngày trả nợ cuối</th>
              <th className="py-3 pr-4 text-right font-medium">Tổng số tiền hoá đơn</th>
              <th className="py-3 pr-4 text-right font-medium">Tổng tiền đã thanh toán</th>
              <th className="py-3 pr-4 text-right font-medium">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {nhomKhach.map((g) => (
              <Fragment key={g.khoa}>
                {gom && (
                  <tr className="border-b border-vien bg-giay-tram/60">
                    <td colSpan={4 + (choPhepThu ? 1 : 0) + (coChiNhanh ? 1 : 0)} data-chinh data-label="Khách" className="py-3 pr-4 font-medium text-muc">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {choPhepThu && <input type="checkbox" aria-label={`Chọn mọi hoá đơn của ${g.khach}`} checked={g.dong.every((d) => chon.has(d.id))} onChange={() => doiNhom(g.dong.map((d) => d.id))} className="h-4 w-4 accent-[var(--nhan)]" />}
                        {g.khachId ? <Link href={`/khach-hang/${g.khachId}`} className="hover:underline">{g.khach}</Link> : <span>{g.khach}</span>}
                        <span className="text-[13px] font-normal text-muc-3">{g.dienThoai}{g.dienThoai ? " · " : ""}{g.dong.length} hoá đơn</span>
                      </span>
                    </td>
                    <td data-label="Tổng số tiền hoá đơn" className="py-3 pr-4 text-right tabular-nums text-muc-2">{tienVN(g.tong)}</td>
                    <td data-label="Tổng tiền đã thanh toán" className="py-3 pr-4 text-right tabular-nums text-muc-2">{tienVN(g.daThu)}</td>
                    <td data-label="Còn nợ" className="py-3 pr-4 text-right tabular-nums font-medium text-canh-bao">{tienVN(g.conNo)}</td>
                  </tr>
                )}
                {g.dong.map((r) => (
                  <tr key={r.id} className="h-[52px] border-b border-vien transition-colors hover:bg-giay-tram/60">
                    {choPhepThu && <td data-label="Chọn" className="py-2 pr-4"><input type="checkbox" aria-label={`Chọn hoá đơn ${r.ma}`} checked={chon.has(r.id)} disabled={!chon.has(r.id) && chon.size >= TOI_DA_DON_THU_NO} onChange={() => doi(r.id)} className="h-4 w-4 accent-[var(--nhan)]" /></td>}
                    {!gom && <td data-label="Khách" data-chinh className="py-2 pr-4 text-muc-2">{r.khachId ? <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> : r.khach}<span className="block text-[12.5px] text-muc-3">{r.dienThoai}</span></td>}
                    <td data-label="Mã đơn hàng" {...(gom ? { "data-chinh": "" } : {})} className="py-2 pr-4 text-muc-2"><Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.maSh ? `#${r.maSh}` : r.ma}</Link></td>
                    {coChiNhanh && <td data-label="Chi nhánh" className="py-2 pr-4 text-muc-2">{r.chiNhanh}</td>}
                    <td data-label="Ngày lập hoá đơn" className="py-2 pr-4 tabular-nums text-muc-2">{ngayVN(r.ngay)}</td>
                    <td data-label="Số lần thanh toán" className="py-2 pr-4 text-right tabular-nums text-muc-2">{r.soLan} lần</td>
                    <td data-label="Ngày trả nợ cuối" className="py-2 pr-4 tabular-nums text-muc-2">{ngayVN(r.ngayCuoi)}</td>
                    <td data-label="Tổng số tiền hoá đơn" className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(r.tong)}</td>
                    <td data-label="Tổng tiền đã thanh toán" className="py-2 pr-4 text-right tabular-nums text-muc-2">{tienVN(r.daThu)}</td>
                    <td data-label="Còn nợ" className="py-2 pr-4 text-right tabular-nums"><span className="font-medium text-canh-bao">{tienVN(r.conNo)}</span></td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        {dong.length === 0 && <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">Không có khách nào còn nợ.</p>}
      </div>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Cảnh báo" moTa={`Bạn đã chọn ${dsChon.length} hoá đơn còn nợ. Bạn có chắc chắn muốn thanh toán toàn bộ số nợ còn lại của các hoá đơn đã được chọn không?`}>
        <p className="mb-4 text-[14px] text-muc-2">Tổng sẽ thu: <span className="font-medium text-muc tabular-nums">{tienVN(tongChon)}</span>. Mỗi hoá đơn được ghi một khoản thu vào sổ thu tiền, không sửa lại được.</p>
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <div><label htmlFor="no-pt" className={NHAN_O}>Phương thức</label><Chon id="no-pt" luaChon={PHUONG_THUC_TIEN} giaTri={pt} onDoi={setPt} /></div>
          {pt === "vi_dien_tu" && <div><label htmlFor="no-vi" className={NHAN_O}>Loại ví</label><Chon id="no-vi" trong="Chọn ví" luaChon={LOAI_VI} giaTri={vi} onDoi={setVi} /></div>}
          <div><label htmlFor="no-ngay" className={NHAN_O}>Ngày thu</label><NgayChon id="no-ngay" giaTri={ngay} onDoi={setNgay} /></div>
        </div>
        {loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi}</div>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Không</button>
          <button type="button" className={NUT_CHINH} disabled={dang} onClick={thu}>{dang ? "Đang thu" : "Có"}</button>
        </div>
      </Hop>
    </>
  );
}
