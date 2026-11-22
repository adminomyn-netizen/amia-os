import Link from "next/link";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";

type Dong = { khoa: string; ngay: string; dv: string; nguoi: string; ghiChu: string; nguon: "buoi" | "lich"; the?: string | null };

/** Tab "Lịch sử làm dịch vụ" trong hồ sơ khách: mọi buổi khách ĐÃ làm (ngày, dịch vụ, ai làm, ghi chú) để chuyên viên chăm đúng liệu trình.
 *  Gộp 2 nguồn: buổi đã làm trên AMIA OS (trừ thẻ/ghi nhận) và lịch hẹn đã hoàn thành (kể cả lịch chuyển từ SalonHero). Lịch đã có buổi thì chỉ hiện buổi, không trùng. Chỉ đọc. */
export async function LichSuLamDichVu({ khachId, tatCa }: { khachId: string; tatCa: boolean }) {
  const db = sb();
  const [{ data: buoi }, { data: lich }] = await Promise.all([
    db.from("buoi_thuc_hien").select("id, ngay_lam, dich_vu_id, nv_thuc_hien_id, bac_si_id, ghi_chu, the_id, lich_hen_id").eq("khach_id", khachId).eq("trang_thai", "da_lam").order("ngay_lam", { ascending: false }).limit(1000),
    db.from("lich_hen").select("id, bat_dau, nhan_vien_id, nhan_vien_ten, dich_vu_ten, ghi_chu").eq("khach_id", khachId).eq("trang_thai", "hoan_thanh").order("bat_dau", { ascending: false }).limit(1000),
  ]);
  const lichCoBuoi = new Set((buoi ?? []).map((b) => b.lich_hen_id).filter((x): x is string => !!x));
  const lichRieng = (lich ?? []).filter((l) => !lichCoBuoi.has(l.id));
  const idLich = lichRieng.map((l) => l.id);
  const idDv = [...new Set((buoi ?? []).map((b) => b.dich_vu_id))];
  const idNv = [...new Set([...(buoi ?? []).flatMap((b) => [b.nv_thuc_hien_id, b.bac_si_id]), ...lichRieng.map((l) => l.nhan_vien_id)].filter((x): x is string => !!x))];
  const idThe = [...new Set((buoi ?? []).map((b) => b.the_id).filter((x): x is string => !!x))];
  const [{ data: dvs }, { data: nvs }, { data: ldv }, { data: the }] = await Promise.all([
    idDv.length ? db.from("dich_vu").select("id, ten").in("id", idDv) : Promise.resolve({ data: [] as { id: string; ten: string }[] }),
    idNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
    idLich.length ? db.from("lich_hen_dich_vu").select("lich_id, dich_vu:dich_vu_id(ten)").in("lich_id", idLich) : Promise.resolve({ data: [] as { lich_id: string; dich_vu: { ten: string } | { ten: string }[] | null }[] }),
    idThe.length ? db.from("v_the_khach").select("id, ma").in("id", idThe) : Promise.resolve({ data: [] as { id: string; ma: string }[] }),
  ]);
  const tenDv = new Map((dvs ?? []).map((d) => [d.id, d.ten])), tenNv = new Map((nvs ?? []).map((n) => [n.id, n.ho_ten])), maThe = new Map((the ?? []).map((t) => [t.id, t.ma]));
  const dvLich = new Map<string, string[]>();
  for (const x of (ldv ?? []) as { lich_id: string; dich_vu: { ten: string } | { ten: string }[] | null }[]) {
    const t = Array.isArray(x.dich_vu) ? x.dich_vu[0]?.ten : x.dich_vu?.ten;
    if (t) dvLich.set(x.lich_id, [...(dvLich.get(x.lich_id) ?? []), t]);
  }
  const homNay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const tatCaDong: Dong[] = [
    ...(buoi ?? []).map((b): Dong => ({
      khoa: `b${b.id}`, ngay: b.ngay_lam, dv: tenDv.get(b.dich_vu_id) ?? "", nguon: "buoi", the: b.the_id ? maThe.get(b.the_id) ?? null : null,
      nguoi: [...new Set([tenNv.get(b.nv_thuc_hien_id ?? ""), tenNv.get(b.bac_si_id ?? "")].filter(Boolean))].join(", "), ghiChu: b.ghi_chu ?? "",
    })),
    ...lichRieng.map((l): Dong => ({
      khoa: `l${l.id}`, ngay: homNay(l.bat_dau), nguon: "lich",
      dv: (dvLich.get(l.id) ?? []).join(", ") || l.dich_vu_ten || "", nguoi: tenNv.get(l.nhan_vien_id ?? "") ?? l.nhan_vien_ten ?? "", ghiChu: l.ghi_chu ?? "",
    })),
  ].sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : 0));
  const dong = tatCa ? tatCaDong : tatCaDong.slice(0, 100);
  return (
    <>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-medium text-muc">Lịch sử làm dịch vụ · {tatCaDong.length} lần</h3>
        {tatCaDong.length > 100 && <Link href={`/khach-hang/${khachId}?tab=lich-su-lam${tatCa ? "" : "&ls=tat-ca"}`} scroll={false} className="text-[13px] font-medium text-nhan-dam hover:underline">{tatCa ? "Chỉ 100 lần gần nhất" : `Xem đủ ${tatCaDong.length} lần`}</Link>}
      </div>
      <p className="mb-3 text-[13px] text-muc-3">Những lần khách đã làm dịch vụ, mới nhất ở trên. Lịch cũ chuyển từ SalonHero có thể thiếu tên người làm.</p>
      <Bang noi duLieu={dong} khoa={(r) => r.khoa} trong="Khách chưa có lần làm dịch vụ nào."
        cot={[
          { nhan: "Ngày", chinh: true, hienThi: (r) => <span className="tabular-nums text-muc">{ngayVN(r.ngay)}</span> },
          { nhan: "Dịch vụ", hienThi: (r) => <div>{r.dv}{r.the && <div className="text-[12px] text-muc-3">Trừ thẻ {r.the}</div>}</div> },
          { nhan: "Người làm", hienThi: (r) => r.nguoi },
          { nhan: "Ghi chú", hienThi: (r) => <span className="text-[13px]">{r.ghiChu}</span> },
        ]} />
    </>
  );
}
