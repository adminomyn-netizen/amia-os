import { Settings2 } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { O_NHAP, NUT_CHINH } from "@/components/ui/dinh-dang";
import { luuKhoangCachDichVu } from "../actions";

const LOI: Record<string, string> = { quyen: "Bạn chưa có quyền sửa danh mục.", so: "Số ngày phải là số nguyên: buổi kế tiếp 1–730, tái khám 1–365. Chưa lưu.", ghi: "Lưu chưa được, thử lại." };

/** /lich-hen/goi-y/cai-dat — đặt khoảng cách gợi ý lịch hẹn cho từng dịch vụ (chị Diệu Thuý tự đặt, 18/11/2026). */
export default async function CaiDatGoiY({ searchParams }: { searchParams: Promise<{ da_luu?: string; loi?: string; tim?: string }> }) {
  await yeuCauQuyen("danhmuc.sua");
  const sp = await searchParams;
  const db = sb();
  const [{ data: dv }, { data: nhom }] = await Promise.all([
    db.from("dich_vu").select("id, ten, nhom_id, khoang_cach_ngay, tai_kham_sau_ngay").eq("hoat_dong", true).not("ten", "ilike", "[thử%").order("ten").limit(600),
    db.from("dich_vu_nhom").select("id, ten").order("ten"),
  ]);
  const theoNhom = new Map<string, NonNullable<typeof dv>>();
  for (const d of dv ?? []) { const k = d.nhom_id ?? ""; theoNhom.set(k, [...(theoNhom.get(k) ?? []), d]); }
  const dsNhom = [...(nhom ?? []).filter((n) => theoNhom.has(n.id)), ...(theoNhom.has("") ? [{ id: "", ten: "Chưa xếp nhóm" }] : [])];
  const daDat = (dv ?? []).filter((d) => d.khoang_cach_ngay != null || d.tai_kham_sau_ngay != null).length;
  const oSo = `${O_NHAP} h-9 w-24 text-right tabular-nums`;

  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Khoảng cách gợi ý lịch hẹn" icon={Settings2} quayLai={{ href: "/lich-hen/goi-y", nhan: "Gợi ý lịch hẹn" }} quayLaiDienThoai
        phu={<>Mỗi dịch vụ: <b>Buổi kế tiếp</b> = bao nhiêu ngày sau lần làm thì khách nên làm buổi tiếp; <b>Tái khám</b> = bao nhiêu ngày sau thì hẹn khách quay lại kiểm tra / chăm sóc sau làm. Để trống = không gợi ý. Đang đặt {daDat} dịch vụ. Gợi ý: 5 tháng = 150 ngày, 1 tuần = 7 ngày.</>} />
      {sp.da_luu !== undefined && <p role="status" className="the-noi the-noi-thap px-4 py-3 text-[13.5px] text-tot">Đã lưu {sp.da_luu} dịch vụ có thay đổi. Danh sách gợi ý cập nhật ngay.</p>}
      {sp.loi && <p role="alert" className="the-noi the-noi-thap px-4 py-3 text-[13.5px] text-loi">{LOI[sp.loi] ?? "Có lỗi, thử lại."}</p>}
      <form action={luuKhoangCachDichVu} className="space-y-4">
        {dsNhom.map((n) => (
          <details key={n.id || "khac"} open={(theoNhom.get(n.id) ?? []).some((d) => d.khoang_cach_ngay != null || d.tai_kham_sau_ngay != null)} className="the-noi the-noi-thap px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-medium text-muc">{n.ten} <span className="font-normal text-muc-3">({(theoNhom.get(n.id) ?? []).length} dịch vụ)</span></summary>
            <div className="mt-2 divide-y divide-vien">
              <div className="hidden grid-cols-[1fr_auto_auto] gap-3 pb-1 text-[12px] font-medium text-muc-3 sm:grid"><span>Dịch vụ</span><span className="w-24 text-right">Buổi kế tiếp (ngày)</span><span className="w-24 text-right">Tái khám (ngày)</span></div>
              {(theoNhom.get(n.id) ?? []).map((d) => (
                <div key={d.id} className="grid grid-cols-1 items-center gap-2 py-2 sm:grid-cols-[1fr_auto_auto] sm:gap-3">
                  <input type="hidden" name="id" value={d.id} />
                  <span className="text-[13.5px] text-muc">{d.ten}</span>
                  <label className="flex items-center gap-2 text-[12.5px] text-muc-3 sm:block"><span className="sm:hidden">Buổi kế tiếp</span>
                    <input name={`kc_${d.id}`} type="number" inputMode="numeric" min={1} max={730} defaultValue={d.khoang_cach_ngay ?? ""} aria-label={`Buổi kế tiếp ${d.ten}`} className={oSo} /></label>
                  <label className="flex items-center gap-2 text-[12.5px] text-muc-3 sm:block"><span className="sm:hidden">Tái khám</span>
                    <input name={`tk_${d.id}`} type="number" inputMode="numeric" min={1} max={365} defaultValue={d.tai_kham_sau_ngay ?? ""} aria-label={`Tái khám ${d.ten}`} className={oSo} /></label>
                </div>
              ))}
            </div>
          </details>
        ))}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-vien bg-giay px-4 py-3 sm:mx-0 sm:rounded-nho sm:border">
          <button type="submit" className={NUT_CHINH}>Lưu khoảng cách</button>
        </div>
      </form>
    </div>
  );
}
