import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauNoiBo } from "@/lib/auth";
import { sb } from "@/lib/db";
import { NHAN_PHU, PHU_BUOC, type TrangThaiPhu } from "@/lib/khung-kd-phu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

const KIEU: Record<TrangThaiPhu, "tot" | "cho" | "loi" | "tram"> = { co: "tot", mot_phan: "cho", thieu: "loi", ngoai: "tram" };

/** Một quy trình: mục đích, phạm vi, đầu vào/ra, rồi từng bước (ai làm gì, tiêu chuẩn, đầu ra, biểu mẫu) kèm "làm ở màn hình nào" của hệ thống. */
export default async function TrangMotQuyTrinh({ params }: { params: Promise<{ ma: string }> }) {
  const [{ ma }, ] = await Promise.all([params, yeuCauNoiBo()]);
  const maQt = decodeURIComponent(ma).toUpperCase();
  if (!/^QT-\d{2}$/.test(maQt)) notFound();
  const db = sb();
  const [{ data: qt }, { data: buoc }, { data: ds }] = await Promise.all([
    db.from("kd_quy_trinh").select("*").eq("ma", maQt).maybeSingle(), db.from("kd_qt_buoc").select("*").eq("qt_ma", maQt).order("thu_tu"), db.from("kd_quy_trinh").select("ma, ten").order("thu_tu"),
  ]);
  if (!qt) notFound();
  const i = (ds ?? []).findIndex((x) => x.ma === maQt), truoc = (ds ?? [])[i - 1], sau = (ds ?? [])[i + 1];
  const thong: [string, string | null][] = [["Mục đích", qt.muc_dich], ["Phạm vi áp dụng", qt.pham_vi], ["Đầu vào", qt.dau_vao], ["Đầu ra", qt.dau_ra], ["Người liên quan", qt.nguoi_lien_quan], ["Biểu mẫu / tài liệu", qt.bieu_mau], ["KPI kiểm soát", qt.kpi], ["Tham chiếu khung", qt.tham_chieu]];
  return (
    <div>
      <Link href="/quy-trinh" className="text-[13px] text-muc-3 hover:text-muc">← 14 quy trình</Link>
      <TieuDeTrang tieuDe={`${qt.ma} · ${qt.ten}`} phu={`Chủ trì: ${qt.chu_tri ?? ""}`} />
      <dl className="the-noi the-noi-thap mb-6 grid gap-x-8 gap-y-3 p-4 sm:grid-cols-2 sm:p-5">
        {thong.map(([k, v]) => v ? <div key={k} className={k === "Mục đích" || k === "Phạm vi áp dụng" ? "sm:col-span-2" : ""}><dt className="text-[12px] text-muc-3">{k}</dt><dd className="mt-0.5 text-[14px] text-muc">{v}</dd></div> : null)}
      </dl>
      <Bang duLieu={buoc ?? []} khoa={(r) => r.buoc} cot={[
        { nhan: "Bước", chinh: true, hienThi: (r) => <span className="font-medium text-muc">{r.buoc}</span> },
        { nhan: "Người thực hiện", hienThi: (r) => r.nguoi },
        { nhan: "Hành động chi tiết", hienThi: (r) => <span className="text-[13.5px] leading-snug">{r.hanh_dong}</span> },
        { nhan: "Tiêu chuẩn / điều kiện", hienThi: (r) => <span className="text-[13.5px] leading-snug text-muc-2">{r.tieu_chuan}</span> },
        { nhan: "Đầu ra · biểu mẫu", hienThi: (r) => <div className="text-[13px]">{r.dau_ra}<div className="text-muc-3">{r.bieu_mau}</div></div> },
        { nhan: "Làm ở đâu trên hệ thống", hienThi: (r) => { const p = PHU_BUOC[`${r.qt_ma}.${r.buoc}`]; return p ? <div><NhanTrangThai kieu={KIEU[p.tt]}>{NHAN_PHU[p.tt]}</NhanTrangThai><div className="mt-1 text-[12.5px] text-muc-3">{p.ghi}</div>{p.link && <Link href={p.link} className="mt-1 inline-block text-[13px] text-nhan-dam hover:underline">Mở →</Link>}</div> : null; } },
      ]} />
      <div className="mt-6 flex justify-between gap-3 text-[13.5px]">
        {truoc ? <Link href={`/quy-trinh/${truoc.ma}`} className="text-nhan-dam hover:underline">← {truoc.ma} {truoc.ten}</Link> : <span />}
        {sau ? <Link href={`/quy-trinh/${sau.ma}`} className="text-right text-nhan-dam hover:underline">{sau.ma} {sau.ten} →</Link> : <span />}
      </div>
    </div>
  );
}
