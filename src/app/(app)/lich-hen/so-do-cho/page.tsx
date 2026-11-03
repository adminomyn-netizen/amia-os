import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM } from "@/lib/dinh-dang";
import { MAU_TRANG_THAI, NHAN_TRANG_THAI, tenNvHoa } from "@/lib/lich-hen";
import type { Tables } from "@/lib/supabase/database.types";

type Sp = { cn?: string };
/** Trạng thái còn đang diễn ra trong ngày: hiện trên sơ đồ. Đã xong / huỷ / không đến thì không chiếm chỗ. */
const CON_HIEU_LUC = ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu", "dang_phuc_vu"];

/** Sơ đồ chỗ (chỉ xem): mỗi giường/phòng của chi nhánh là một ô, cho biết hôm nay ai đang nằm, ai đã đến đang chờ và các lịch sắp tới. Chưa chia khu / tầng (danh mục chỗ hiện chỉ có tên và thứ tự). */
export default async function TrangSoDoCho({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("lich.xem");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cnId = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  const dauNgay = new Date(`${homNay}T00:00:00+07:00`).toISOString(), cuoiNgay = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  const [{ data: cho }, { data: lichTho }, { data: nv }] = await Promise.all([
    db.from("cho_lam").select("id, ten, thu_tu, khu, suc_chua").eq("chi_nhanh_id", cnId).eq("hoat_dong", true).order("thu_tu").order("ten"),
    db.from("lich_hen").select("*").eq("chi_nhanh_id", cnId).gte("bat_dau", dauNgay).lt("bat_dau", cuoiNgay).in("trang_thai", CON_HIEU_LUC).order("bat_dau").limit(1000),
    db.from("nhan_vien").select("id, ho_ten"),
  ]);
  const lich = (lichTho ?? []) as Tables<"lich_hen">[];
  const ids = lich.map((l) => l.id), idsK = [...new Set(lich.map((l) => l.khach_id))];
  const [{ data: ks }, { data: ldv }] = await Promise.all([
    idsK.length ? db.rpc("khach_cho_lich", { p_ids: idsK }) : Promise.resolve({ data: [] as { id: string; ho_ten: string; hang: string | null }[] }),
    ids.length ? db.from("lich_hen_dich_vu").select("lich_id, dich_vu(ten)").in("lich_id", ids) : Promise.resolve({ data: [] as { lich_id: string; dich_vu: { ten: string } | null }[] }),
  ]);
  const tenK = new Map((ks ?? []).map((k) => [k.id as string, k]));
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const dv = new Map<string, string[]>();
  for (const x of (ldv ?? []) as { lich_id: string; dich_vu: { ten: string } | null }[]) if (x.dich_vu?.ten) dv.set(x.lich_id, [...(dv.get(x.lich_id) ?? []), x.dich_vu.ten]);

  const khoa = (t: string | null) => (t ?? "").trim().toLowerCase();
  const trongDm = new Set((cho ?? []).map((c) => khoa(c.ten)));
  const o: { khoa: string; ten: string; ngoaiDm: boolean; khu: string; sucChua: number | null }[] = (cho ?? []).map((c) => ({ khoa: khoa(c.ten), ten: c.ten, ngoaiDm: false, khu: c.khu ?? "", sucChua: c.suc_chua }));
  // Chỗ chỉ có trong chữ ghi ở lịch (lịch nhập tay / lịch cũ) vẫn hiện để không bỏ sót người đang nằm.
  for (const t of [...new Set(lich.map((l) => (l.phong ?? "").trim()).filter(Boolean))]) if (!trongDm.has(khoa(t))) o.push({ khoa: khoa(t), ten: t, ngoaiDm: true, khu: "", sucChua: null });
  const chuaXep = lich.filter((l) => !(l.phong ?? "").trim());
  const quanLyCho = coQuyen(nd, "danhmuc.xem");

  const dongLich = (l: Tables<"lich_hen">) => {
    const k = tenK.get(l.khach_id);
    return (
      <li key={l.id} className={`rounded-nho border border-vien border-l-[3px] px-2.5 py-1.5 text-[13px] ${MAU_TRANG_THAI[l.trang_thai]?.the ?? "border-l-nhan bg-giay-sang"}`}>
        <div className="flex items-baseline justify-between gap-2">
          <Link href={`/khach-hang/${l.khach_id}`} className="min-w-0 truncate font-semibold uppercase text-nhan-dam hover:underline">{k?.ho_ten ?? "—"}</Link>
          <span className="shrink-0 tabular-nums text-muc-2">{gioVN(l.bat_dau)} ~ {gioVN(l.ket_thuc)}</span>
        </div>
        <div className="text-[12px] font-medium text-muc-2">{NHAN_TRANG_THAI[l.trang_thai]}</div>
        <div className="truncate text-[12px] text-muc-3">{[(dv.get(l.id) ?? []).join(", "), l.nhan_vien_id ? tenNvHoa(tenNv.get(l.nhan_vien_id) ?? "") : ""].filter(Boolean).join(" · ") || "Chưa ghi dịch vụ"}</div>
      </li>
    );
  };
  const oCho = (ten: string, ds: Tables<"lich_hen">[], ghi?: string, chuaXepCho = false, sucChua: number | null = null) => {
    const dang = ds.filter((l) => l.trang_thai === "dang_phuc_vu");
    const chuaDen = ds.filter((l) => l.trang_thai !== "dang_phuc_vu");
    const tt = dang.length ? "dang_phuc_vu" : ds.some((l) => l.trang_thai === "cho_phuc_vu") ? "cho_phuc_vu" : "";
    return (
      <section key={ten} aria-label={ten} className="rounded-the border border-vien bg-giay-sang p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="min-w-0 break-words text-[14px] font-semibold uppercase text-muc">{ten}{sucChua != null && <span className="ml-1.5 text-[12px] font-medium normal-case tabular-nums text-muc-2">{dang.length}/{sucChua} giường</span>}{ghi && <span className="ml-1.5 text-[11px] font-normal normal-case text-muc-3">{ghi}</span>}</h2>
          <span className={`shrink-0 rounded-tag px-2 py-0.5 text-[12px] font-medium ${tt ? MAU_TRANG_THAI[tt].chip : "bg-giay-tram text-muc-2"}`}>{chuaXepCho ? "Cần xếp chỗ" : tt ? (tt === "dang_phuc_vu" ? "Đang có khách" : "Khách chờ") : ds.length ? "Trống lúc này" : "Trống"}</span>
        </div>
        {ds.length === 0 ? <p className="text-[13px] text-muc-3">Hôm nay chưa có lịch.</p> : (
          <ul className="space-y-1.5">{[...dang, ...chuaDen].map(dongLich)}</ul>
        )}
      </section>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <h1 className="chu-tieu-de text-[28px] leading-[1.15] text-muc lg:text-[34px]">Sơ đồ chỗ</h1>
          <Link href={`/lich-hen?cn=${cnId}`} className="text-[14px] font-medium text-nhan-dam hover:underline">← Về lưới lịch hẹn</Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          {!nd.chiNhanhId && (dsCn?.length ?? 0) > 1 && (dsCn ?? []).map((c) => <Link key={c.id} href={`/lich-hen/so-do-cho?cn=${c.id}`} className={`rounded-nho px-3 py-1.5 ${c.id === cnId ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}
          <Link href={`/lich-hen/so-do-cho?cn=${cnId}`} className="rounded-nho border border-vien-dam bg-giay-sang px-3.5 py-2 font-medium text-muc-2 hover:bg-giay-tram">Làm mới</Link>
        </div>
      </div>
      <p className="mb-4 text-[13px] text-muc-3">Hôm nay {homNay.slice(8, 10)}/{homNay.slice(5, 7)}/{homNay.slice(0, 4)}. Chỗ chia theo khu như SalonHero, mỗi ô là một phòng kèm số giường đang có khách / sức chứa; chỉ hiện lịch còn hiệu lực (chưa xác nhận, đã xác nhận, chờ phục vụ, đang phục vụ).</p>
      {o.length === 0 && chuaXep.length === 0 ? (
        <div className="rounded-the border border-vien py-12 text-center">
          <p className="chu-tieu-de text-[22px] text-muc-3">Chi nhánh này chưa có chỗ nào.</p>
          {quanLyCho && <p className="mt-2 text-[14px] text-muc-3">Thêm giường, phòng ở <Link href="/danh-muc?tab=cho-lam" className="font-medium text-nhan-dam hover:underline">Danh mục, mục Chỗ / giường</Link> rồi quay lại đây.</p>}
        </div>
      ) : (
        <div className="space-y-5">
          {[...new Set(o.map((c) => c.khu))].map((khu) => (
            <div key={khu || "-"}>
              {(khu || o.some((c) => c.khu)) && <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muc-3">{khu || "Chưa đặt khu"}</h2>}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {o.filter((c) => c.khu === khu).map((c) => oCho(c.ten, lich.filter((l) => khoa(l.phong) === c.khoa), c.ngoaiDm ? "(chỉ có trong lịch)" : undefined, false, c.sucChua))}
              </div>
            </div>
          ))}
          {chuaXep.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{oCho("Chưa xếp chỗ", chuaXep, undefined, true)}</div>}
        </div>
      )}
    </>
  );
}
