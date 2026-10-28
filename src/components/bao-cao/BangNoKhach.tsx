"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bang } from "@/components/ui/Table";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { PHUONG_THUC } from "@/lib/ban-hang";
import { TOI_DA_DON_THU_NO } from "@/lib/thu-no";
import { thuNoNhieuDon } from "@/app/(app)/hoa-don/actions";

export type DongNoKhach = { id: string; ma: string; khachId: string | null; khach: string; dienThoai: string; ngay: string; tong: number; daThu: number; conNo: number };

/** Danh sách khách hàng còn nợ. Có quyền thu nợ thì mỗi hoá đơn có ô chọn và nút "Trả nợ" (như SalonHero): thu nốt toàn bộ số còn nợ của các hoá đơn đã chọn,
 *  ghi vào sổ thu tiền qua đúng hàm thu nợ của màn hoá đơn. */
export function BangNoKhach({ dong, choPhepThu, homNay }: { dong: DongNoKhach[]; choPhepThu: boolean; homNay: string }) {
  const router = useRouter();
  const [chon, setChon] = useState<Set<string>>(new Set());
  const [mo, setMo] = useState(false);
  const [pt, setPt] = useState("tien_mat");
  const [ngay, setNgay] = useState(homNay);
  const [loi, setLoi] = useState("");
  const [thanhCong, setThanhCong] = useState("");
  const [dang, bat] = useTransition();
  const dsChon = dong.filter((d) => chon.has(d.id));
  const tongChon = dsChon.reduce((s, d) => s + d.conNo, 0);
  const soCoTheChon = Math.min(dong.length, TOI_DA_DON_THU_NO);
  const hetTrang = soCoTheChon > 0 && dsChon.length === soCoTheChon;
  const doi = (id: string) => setChon((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const thu = () => {
    setLoi("");
    const fd = new FormData();
    for (const d of dsChon) fd.append("hoa_don_id", d.id);
    fd.set("phuong_thuc", pt); fd.set("ngay", ngay);
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
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Không có khách nào còn nợ."
        cot={[
          ...(choPhepThu ? [{ nhan: "Chọn", hienThi: (r: DongNoKhach) => <input type="checkbox" aria-label={`Chọn hoá đơn ${r.ma}`} checked={chon.has(r.id)} disabled={!chon.has(r.id) && chon.size >= TOI_DA_DON_THU_NO} onChange={() => doi(r.id)} className="h-4 w-4 accent-[var(--nhan)]" /> }] : []),
          { nhan: "Khách", chinh: true, hienThi: (r: DongNoKhach) => <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> },
          { nhan: "Điện thoại", hienThi: (r: DongNoKhach) => r.dienThoai },
          { nhan: "Hoá đơn", hienThi: (r: DongNoKhach) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> }, { nhan: "Ngày", hienThi: (r: DongNoKhach) => ngayVN(r.ngay) },
          { nhan: "Tổng", hienThi: (r: DongNoKhach) => tienVN(r.tong), phai: true }, { nhan: "Đã thu", hienThi: (r: DongNoKhach) => tienVN(r.daThu), phai: true }, { nhan: "Còn nợ", hienThi: (r: DongNoKhach) => <span className="font-medium text-canh-bao">{tienVN(r.conNo)}</span>, phai: true },
        ]} />
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Cảnh báo" moTa={`Bạn đã chọn ${dsChon.length} hoá đơn còn nợ. Bạn có chắc chắn muốn thanh toán toàn bộ số nợ còn lại của các hoá đơn đã được chọn không?`}>
        <p className="mb-4 text-[14px] text-muc-2">Tổng sẽ thu: <span className="font-medium text-muc tabular-nums">{tienVN(tongChon)}</span>. Mỗi hoá đơn được ghi một khoản thu vào sổ thu tiền, không sửa lại được.</p>
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <div><label htmlFor="no-pt" className={NHAN_O}>Phương thức</label><Chon id="no-pt" luaChon={PHUONG_THUC.filter((p) => p.gia_tri !== "the_tien")} giaTri={pt} onDoi={setPt} /></div>
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
