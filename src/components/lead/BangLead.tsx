"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chon, type LuaChon } from "@/components/ui/Chon";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { suaOLead } from "@/app/(app)/marketing/lead/actions";
import { taoLead } from "@/app/(app)/marketing/actions";
import { useDoiGiaiDoan, type CotNho } from "./DoiGiaiDoan";

export type DongLead = {
  id: string; ma: string; ho_ten: string; sdt: string; email: string | null; chi_nhanh: string; giai_doan_id: string; phu_trach: string | null;
  gia_tri: number; nguon_id: string; ket_qua: string; cap_nhat: string; qua_sla: boolean; sua: boolean;
};
const KQ: Record<string, { ten: string; kieu: "tot" | "cho" | "tram" }> = { open: { ten: "Đang mở", kieu: "cho" }, won: { ten: "Thắng", kieu: "tot" }, lost: { ten: "Thua", kieu: "tram" } };
const O = "h-9 w-full min-w-0 rounded-nho border border-transparent bg-transparent px-2 text-[13.5px] text-muc outline-none hover:border-vien focus:border-nhan focus:bg-giay-sang focus:ring-2 focus:ring-nhan/25 disabled:hover:border-transparent";
const O_MOI = "h-9 w-full min-w-0 rounded-nho border border-nhan/40 bg-giay-sang px-2 text-[13.5px] text-muc outline-none placeholder:text-muc-3 focus:border-nhan focus:ring-2 focus:ring-nhan/25";

/** Ô sửa tại chỗ: rời ô (hoặc Enter) là lưu nếu giá trị đổi. */
function OSua({ id, truong, giaTri, sua, so, nhan }: { id: string; truong: string; giaTri: string; sua: boolean; so?: boolean; nhan: string }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const hienThi = so && giaTri !== "" ? Number(giaTri).toLocaleString("vi-VN") : giaTri;
  const luu = (v: string, o: HTMLInputElement) => {
    if (v.trim() === giaTri) return;
    setLoi("");
    // Bị từ chối thì trả ô về giá trị đang lưu, kèm dòng lỗi (không để số sai nằm trong ô như đã lưu).
    bat(async () => { const fd = new FormData(); fd.set("id", id); fd.set("truong", truong); fd.set("gia_tri", v.trim()); const kq = await suaOLead(fd); if (kq.loi) { setLoi(kq.loi); o.value = hienThi; } else router.refresh(); });
  };
  return (
    <div>
      <input key={giaTri} defaultValue={hienThi} disabled={!sua || dang} aria-label={nhan} inputMode={so ? "numeric" : undefined}
        onBlur={(e) => luu(so ? e.target.value.replace(/[^\d]/g, "") || "0" : e.target.value, e.currentTarget)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className={`${O} ${so ? "text-right tabular-nums" : ""}`} />
      {loi && <p role="alert" className="px-2 text-[12px] leading-snug text-loi">{loi}</p>}
    </div>
  );
}

/** Chế độ Bảng như Excel: dòng xanh đầu bảng gõ rồi Enter để tạo lead; sửa ô rồi rời ô là lưu. Bảng cuộn ngang trong khung trên màn hẹp. */
export function BangLead({ dong, cot, lyDoThua, nguon, nguonMoi, chiNhanh, ghi, them }: {
  dong: DongLead[]; cot: CotNho[]; lyDoThua: LuaChon[]; nguon: LuaChon[]; nguonMoi: LuaChon[]; chiNhanh: LuaChon[] | null; ghi: boolean; them: string;
}) {
  const router = useRouter();
  const gd = useDoiGiaiDoan(cot, lyDoThua);
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const oTen = useRef<HTMLInputElement>(null);
  const trong = { ho_ten: "", sdt: "", email: "", gia_tri_du_kien: "", nguon_id: nguonMoi[0]?.gia_tri ?? "", chi_nhanh_id: chiNhanh?.[0]?.gia_tri ?? "" };
  const [moi, setMoi] = useState(trong);
  const [nguonSua, setNguonSua] = useState<Record<string, string>>({});
  const tao = () => {
    if (!moi.ho_ten.trim() || !moi.sdt.trim()) { setLoi("Dòng mới cần ít nhất họ tên và số điện thoại."); return; }
    setLoi("");
    bat(async () => {
      const fd = new FormData();
      Object.entries(moi).forEach(([k, v]) => fd.set(k, k === "gia_tri_du_kien" ? v.replace(/[^\d]/g, "") : v));
      fd.set("nhan_ngay", "0");
      const kq = await taoLead(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setMoi({ ...trong, nguon_id: moi.nguon_id, chi_nhanh_id: moi.chi_nhanh_id }); oTen.current?.focus(); router.refresh(); }
    });
  };
  const enter = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); tao(); } };
  const doiNguon = (id: string, v: string) => {
    setNguonSua((s) => ({ ...s, [id]: v }));
    bat(async () => { const fd = new FormData(); fd.set("id", id); fd.set("truong", "nguon_id"); fd.set("gia_tri", v); const kq = await suaOLead(fd); if (kq.loi) { setLoi(kq.loi); setNguonSua((s) => { const c = { ...s }; delete c[id]; return c; }); } else router.refresh(); });
  };
  const TH = "px-2 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muc-3";
  return (
    <div>
      {(loi || gd.loi) && <div role="alert" className="mb-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">{loi || gd.loi}</div>}
      <div className="khung-bang overflow-x-auto">
        <table className="w-full min-w-[1180px] text-[13.5px]">
          <thead>
            <tr className="border-b border-vien">
              <th className={TH}>Mã</th><th className={TH}>Họ tên</th><th className={TH}>SĐT</th><th className={TH}>Email</th><th className={TH}>Chi nhánh</th>
              <th className={TH}>Giai đoạn</th><th className={TH}>Phụ trách</th><th className={`${TH} text-right`}>Giá trị dự kiến</th><th className={TH}>Nguồn</th><th className={TH}>Trạng thái</th><th className={TH}>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {ghi && (
              <tr className="border-b border-vien bg-nhan-nhat/40" aria-label="Dòng nhập nhanh">
                <td className="px-2 py-1.5 text-[12px] text-nhan-dam">Mới</td>
                <td className="px-1 py-1.5"><input ref={oTen} value={moi.ho_ten} onChange={(e) => setMoi({ ...moi, ho_ten: e.target.value })} onKeyDown={enter} placeholder="Họ tên" aria-label="Họ tên lead mới" className={O_MOI} /></td>
                <td className="px-1 py-1.5"><input value={moi.sdt} onChange={(e) => setMoi({ ...moi, sdt: e.target.value })} onKeyDown={enter} placeholder="Số điện thoại" inputMode="tel" aria-label="SĐT lead mới" className={O_MOI} /></td>
                <td className="px-1 py-1.5"><input value={moi.email} onChange={(e) => setMoi({ ...moi, email: e.target.value })} onKeyDown={enter} placeholder="Email" type="email" aria-label="Email lead mới" className={O_MOI} /></td>
                <td className="px-1 py-1.5">{chiNhanh ? <Chon nho ariaLabel="Chi nhánh lead mới" luaChon={chiNhanh} giaTri={moi.chi_nhanh_id} onDoi={(v) => setMoi({ ...moi, chi_nhanh_id: v })} /> : <span className="px-2 text-muc-3">—</span>}</td>
                <td className="px-2 py-1.5 text-muc-3">{cot[0]?.ten}</td>
                <td className="px-2 py-1.5 text-muc-3">—</td>
                <td className="px-1 py-1.5"><input value={moi.gia_tri_du_kien} onChange={(e) => setMoi({ ...moi, gia_tri_du_kien: e.target.value })} onKeyDown={enter} placeholder="0" inputMode="numeric" aria-label="Giá trị dự kiến lead mới" className={`${O_MOI} text-right`} /></td>
                <td className="px-1 py-1.5"><Chon nho ariaLabel="Nguồn lead mới" luaChon={nguonMoi} giaTri={moi.nguon_id} onDoi={(v) => setMoi({ ...moi, nguon_id: v })} /></td>
                <td className="px-1 py-1.5" colSpan={2}><button type="button" disabled={dang} onClick={tao} className="nut-vang h-9 rounded-nho px-3 text-[13px] disabled:opacity-60">{dang ? "Đang lưu" : "Tạo (Enter)"}</button></td>
              </tr>
            )}
            {dong.map((r) => (
              <tr key={r.id} className="border-b border-vien hover:bg-giay-tram/40">
                <td className="whitespace-nowrap px-2 py-1.5"><Link href={`/marketing/lead/${r.id}${them}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link></td>
                <td className="min-w-[160px] px-1 py-1.5"><OSua id={r.id} truong="ho_ten" giaTri={r.ho_ten} sua={r.sua} nhan={`Họ tên ${r.ma}`} /></td>
                <td className="min-w-[120px] px-1 py-1.5"><OSua id={r.id} truong="sdt" giaTri={r.sdt} sua={r.sua} nhan={`SĐT ${r.ma}`} /></td>
                <td className="min-w-[160px] px-1 py-1.5"><OSua id={r.id} truong="email" giaTri={r.email ?? ""} sua={r.sua} nhan={`Email ${r.ma}`} /></td>
                <td className="whitespace-nowrap px-2 py-1.5 text-muc-2">{r.chi_nhanh}</td>
                <td className="min-w-[150px] px-1 py-1.5"><Chon nho ariaLabel={`Giai đoạn ${r.ma}`} luaChon={cot.map((c) => ({ gia_tri: c.id, nhan: c.ten }))} giaTri={r.giai_doan_id} voHieu={!r.sua || gd.dang} onDoi={(v) => v !== r.giai_doan_id && gd.doi(r.id, v)} /></td>
                <td className="whitespace-nowrap px-2 py-1.5">{r.phu_trach ?? <span className="text-canh-bao">Chưa nhận</span>}</td>
                <td className="min-w-[120px] px-1 py-1.5"><OSua id={r.id} truong="gia_tri_du_kien" giaTri={String(r.gia_tri)} sua={r.sua} so nhan={`Giá trị dự kiến ${r.ma}`} /></td>
                <td className="min-w-[150px] px-1 py-1.5"><Chon nho ariaLabel={`Nguồn ${r.ma}`} luaChon={nguon} giaTri={nguonSua[r.id] ?? r.nguon_id} voHieu={!r.sua} onDoi={(v) => v !== r.nguon_id && doiNguon(r.id, v)} /></td>
                <td className="px-2 py-1.5"><NhanTrangThai kieu={KQ[r.ket_qua]?.kieu}>{KQ[r.ket_qua]?.ten ?? r.ket_qua}</NhanTrangThai></td>
                <td className={`whitespace-nowrap px-2 py-1.5 text-[12.5px] ${r.qua_sla ? "font-medium text-canh-bao" : "text-muc-3"}`}>{r.qua_sla ? "Quá SLA · " : ""}{r.cap_nhat}</td>
              </tr>
            ))}
            {dong.length === 0 && <tr><td colSpan={11} className="px-3 py-8 text-center text-muc-3">Không có lead khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
      {gd.hop}
    </div>
  );
}
