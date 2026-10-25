"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU } from "@/components/ui/dinh-dang";
import type { KetQuaNhap } from "@/app/(app)/khach-hang/actions";

export function NhapExcelKhach({ nguon, nhanVien, chiNhanh, action, macDinh }: { nguon: LuaChon[]; nhanVien: LuaChon[]; chiNhanh: LuaChon[]; action: (fd: FormData) => Promise<KetQuaNhap>; macDinh: { nguoi: string; cn: string } }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [mo, setMo] = useState(false);
  const [dang, bat] = useTransition();
  const [ng, setNg] = useState("khac"), [nv, setNv] = useState(macDinh.nguoi), [cn, setCn] = useState(macDinh.cn);
  const [kq, setKq] = useState<KetQuaNhap | null>(null);
  const [ten, setTen] = useState("");
  const chay = (che: "xem" | "nhap") => {
    const f = ref.current?.files?.[0];
    if (!f) { setKq({ loi: "Chưa chọn file." }); return; }
    const fd = new FormData();
    fd.set("tep", f); fd.set("nguon", ng); fd.set("nguoi_phu_trach_id", nv); fd.set("chi_nhanh_id", cn); fd.set("che_do", che);
    bat(async () => { const r = await action(fd); setKq(r); if (che === "nhap" && r.ok) router.refresh(); });
  };
  return (
    <>
      <button type="button" className={NUT_PHU} onClick={() => { setMo(true); setKq(null); }}>Nhập từ Excel</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe="Nhập khách từ Excel" moTa="Dòng đầu là tiêu đề. Bắt buộc có cột Họ tên và Số điện thoại; tuỳ chọn: Zalo, Email, Ngày sinh, Giới tính, Địa chỉ, Ghi chú. Khách trùng số điện thoại bị bỏ qua, không ghi đè." rong="rong">
        <div className="space-y-4">
          <div>
            <label className={NHAN_O} htmlFor="tep-khach">File Excel (.xlsx)</label>
            <input ref={ref} id="tep-khach" type="file" accept=".xlsx" onChange={(e) => { setTen(e.target.files?.[0]?.name ?? ""); setKq(null); }} className="block w-full text-[14px] file:mr-3 file:rounded-nho file:border file:border-vien-dam file:bg-giay-sang file:px-3 file:py-2 file:text-[14px]" />
            {ten && <p className="mt-1 text-[12px] text-muc-3">{ten}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className={NHAN_O}>Nguồn áp cho cả file</label><Chon ariaLabel="Nguồn" giaTri={ng} onDoi={setNg} luaChon={nguon} /></div>
            <div><label className={NHAN_O}>Người phụ trách</label><Chon ariaLabel="Người phụ trách" giaTri={nv} onDoi={setNv} luaChon={nhanVien} /></div>
            <div><label className={NHAN_O}>Chi nhánh</label><Chon ariaLabel="Chi nhánh" giaTri={cn} onDoi={setCn} luaChon={chiNhanh} /></div>
          </div>
        </div>
        {kq?.loi && <div role="alert" className="mt-4 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{kq.loi}</div>}
        {kq && !kq.loi && (
          <div role="status" className="mt-4 rounded-nho bg-nhan-nhat px-3 py-3 text-[14px] text-nhan-dam">
            {kq.daNhap !== undefined ? <p className="font-medium">Đã nhập {kq.daNhap} khách mới.</p> : <p className="font-medium">Kiểm tra xong, chưa ghi gì.</p>}
            <p>{kq.tongDong} dòng có dữ liệu · {kq.hopLe} hợp lệ · {kq.daCo} đã có trong hệ thống (bỏ qua) · {kq.dongLoi?.length ?? 0} dòng lỗi.</p>
            {(kq.dongLoi?.length ?? 0) > 0 && <ul className="mt-2 list-disc pl-5 text-[13px] text-loi">{kq.dongLoi!.slice(0, 10).map((l) => <li key={l.dong}>Dòng {l.dong}: {l.viec}</li>)}</ul>}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Đóng</button>
          <button type="button" className={NUT_PHU} disabled={dang} onClick={() => chay("xem")}>{dang ? "Đang đọc" : "Kiểm tra trước"}</button>
          <button type="button" className={NUT_CHINH} disabled={dang || !kq || !!kq.loi || kq.daNhap !== undefined} onClick={() => chay("nhap")}>Nhập vào hệ thống</button>
        </div>
      </Hop>
    </>
  );
}
