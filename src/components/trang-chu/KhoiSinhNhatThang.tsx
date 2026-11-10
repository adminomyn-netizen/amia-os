import Link from "next/link";
import { Cake } from "lucide-react";
import { MucTrang } from "@/components/ui/MucTrang";
import { laySinhNhatThang } from "@/lib/xep-hang";
import { cheSdt } from "@/lib/tin-nhan";
import { tienGon } from "@/lib/dinh-dang";

/** Khách sinh nhật trong tháng (như ô "Khách hàng sinh nhật tháng này" của SalonHero): đủ danh sách, sắp theo ngày, hôm nay nổi lên đầu nhóm,
 *  bấm tên mở hồ sơ. SĐT đầy đủ chỉ với quyền xem số (khach.sdt), không thì che; tổng chi 12 tháng chỉ với quyền xem tiền. */
export async function KhoiSinhNhatThang({ cn, tenCn, homNay, xemSdt, xemTien }: { cn: string | null; tenCn: string | null; homNay: string; xemSdt: boolean; xemTien: boolean }) {
  const ds = await laySinhNhatThang(cn, homNay.slice(0, 7));
  const thang = Number(homNay.slice(5, 7)), md = homNay.slice(5);
  const homNayDs = ds.filter((k) => k.ngaySinh.slice(5) === md);
  const sapToi = ds.filter((k) => k.ngaySinh.slice(5) > md);
  const daQua = ds.filter((k) => k.ngaySinh.slice(5) < md);
  const tuoi = (ns: string) => Number(homNay.slice(0, 4)) - Number(ns.slice(0, 4));
  const dong = (k: (typeof ds)[number], noi: boolean) => (
    <li key={k.id} className={`flex items-center gap-3 px-2 py-2 text-[13.5px] ${noi ? "rounded-nho bg-sac-hong-nen" : ""}`}>
      <span className={`w-12 shrink-0 text-center text-[12.5px] font-semibold tabular-nums ${noi ? "text-sac-hong" : "text-muc-3"}`}>{k.ngaySinh.slice(8)}/{k.ngaySinh.slice(5, 7)}</span>
      <div className="min-w-0 flex-1">
        <Link href={`/khach-hang/${k.id}`} className="block truncate font-semibold text-muc hover:text-nhan-dam hover:underline">{k.ten}</Link>
        <p className="truncate text-[12px] text-muc-3">
          {[k.ma, `${tuoi(k.ngaySinh)} tuổi`, k.hang && k.hang !== "Thường" ? `hạng ${k.hang}` : null, k.theDangDung > 0 ? `${k.theDangDung} thẻ đang dùng` : null].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {k.sdt && <p className="sdt-khach text-[12.5px] tabular-nums text-muc-2">{xemSdt ? k.sdt : cheSdt(k.sdt)}</p>}
        {xemTien && k.chi12 > 0 && <p className="text-[11.5px] tabular-nums text-muc-3">chi 12th {tienGon(k.chi12)}</p>}
      </div>
    </li>
  );
  return (
    <MucTrang noi tieuDe={`Khách sinh nhật tháng ${thang} (${ds.length.toLocaleString("vi-VN")})`}
      phai={<Link href="/khach-hang?sinh_nhat=thang" className="font-medium text-nhan-dam hover:underline">Mở ở Khách hàng</Link>}>
      <p className="-mt-1 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muc-3">
        <span className="inline-flex items-center gap-1.5 font-medium text-sac-hong"><Cake className="h-4 w-4" strokeWidth={1.8} aria-hidden />Hôm nay {homNayDs.length} khách</span>
        <span>sắp tới {sapToi.length} · đã qua {daQua.length}{tenCn ? ` · ${tenCn}` : ""}</span>
      </p>
      {ds.length === 0 ? <p className="py-4 text-center text-[14px] text-muc-3">Tháng này chưa có khách nào có ngày sinh.</p> : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          {homNayDs.length > 0 && <><h3 className="px-2 pb-1 text-[12px] font-semibold uppercase tracking-wide text-sac-hong">Hôm nay</h3><ul>{homNayDs.map((k) => dong(k, true))}</ul></>}
          {sapToi.length > 0 && <><h3 className="mt-2 px-2 pb-1 text-[12px] font-semibold uppercase tracking-wide text-muc-3">Sắp tới</h3><ul className="divide-y divide-vien">{sapToi.map((k) => dong(k, false))}</ul></>}
          {daQua.length > 0 && <><h3 className="mt-2 px-2 pb-1 text-[12px] font-semibold uppercase tracking-wide text-muc-3">Đã qua trong tháng</h3><ul className="divide-y divide-vien opacity-80">{daQua.map((k) => dong(k, false))}</ul></>}
        </div>
      )}
    </MucTrang>
  );
}
