import Link from "next/link";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayGioVN } from "@/lib/dinh-dang";
import { NHAN_TRANG_THAI_LICH } from "@/lib/khach";
import { Bang } from "@/components/ui/Table";

/** Tab Lịch hẹn trong hồ sơ khách (SalonHero: "Xem lịch hẹn cũ 6 tháng"): lịch sắp tới + lịch 6 tháng gần nhất (?lh=tat-ca để xem hết). Chỉ đọc. */
export async function LichHenKhach({ khachId, tatCa }: { khachId: string; tatCa: boolean }) {
  const db = sb();
  const tu = congNgay(homNayHCM(), -183);
  let q = db.from("lich_hen").select("id, bat_dau, trang_thai, ghi_chu, nhan_vien_id, chi_nhanh_id, ly_do_huy").eq("khach_id", khachId).order("bat_dau", { ascending: false }).limit(500);
  if (!tatCa) q = q.gte("bat_dau", `${tu}T00:00:00+07:00`);
  const { data: ds } = await q;
  const ids = (ds ?? []).map((l) => l.id), idNv = [...new Set((ds ?? []).map((l) => l.nhan_vien_id).filter((x): x is string => !!x))];
  const [{ data: ldv }, { data: nv }, { data: cn }] = await Promise.all([
    ids.length ? db.from("lich_hen_dich_vu").select("lich_id, dich_vu:dich_vu_id(ten)").in("lich_id", ids) : Promise.resolve({ data: [] as { lich_id: string; dich_vu: { ten: string } | null }[] }),
    idNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
    db.from("chi_nhanh").select("id, ten"),
  ]);
  const dv = new Map<string, string[]>();
  for (const x of (ldv ?? []) as { lich_id: string; dich_vu: { ten: string } | { ten: string }[] | null }[]) {
    const t = Array.isArray(x.dich_vu) ? x.dich_vu[0]?.ten : x.dich_vu?.ten;
    if (t) dv.set(x.lich_id, [...(dv.get(x.lich_id) ?? []), t]);
  }
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-medium text-muc">{tatCa ? "Toàn bộ lịch hẹn" : "Lịch hẹn 6 tháng gần nhất và sắp tới"} · {(ds ?? []).length} lịch</h3>
        <Link href={`/khach-hang/${khachId}?tab=lich-hen${tatCa ? "" : "&lh=tat-ca"}`} scroll={false} className="text-[13px] font-medium text-nhan-dam hover:underline">{tatCa ? "Chỉ 6 tháng gần nhất" : "Xem toàn bộ lịch hẹn"}</Link>
      </div>
      <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong={tatCa ? "Khách chưa có lịch hẹn." : "Không có lịch hẹn trong 6 tháng gần nhất."}
        cot={[
          { nhan: "Thời gian", chinh: true, hienThi: (r) => <span className="tabular-nums text-muc">{ngayGioVN(r.bat_dau)}</span> },
          { nhan: "Dịch vụ", hienThi: (r) => (dv.get(r.id) ?? []).join(", ") },
          { nhan: "Chuyên viên trị liệu", hienThi: (r) => tenNv.get(r.nhan_vien_id ?? "") ?? "" },
          { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id ?? "") ?? "" },
          { nhan: "Trạng thái", hienThi: (r) => NHAN_TRANG_THAI_LICH[r.trang_thai] ?? r.trang_thai },
          { nhan: "Ghi chú", hienThi: (r) => [r.ghi_chu, r.ly_do_huy].filter(Boolean).join(" · ") },
        ]} />
    </>
  );
}
