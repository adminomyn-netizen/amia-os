import Link from "next/link";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { boDau, chuanSdt, congNgay, gioVN, homNayHCM, ngayCuaIso, ngayVN } from "@/lib/dinh-dang";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { BoLocSuaLich } from "@/components/lich-hen/LocSuaLich";
import { laQuanLyLich } from "@/lib/lich-hen-sua";
import { dongThayDoi, NHAN_HANH_DONG_SUA } from "@/lib/lich-hen-lich-su";

const DAT = /^\d{4}-\d{2}-\d{2}$/;
const MOI = 50;
type Sp = { tu?: string; den?: string; cn?: string; nguoi?: string; khach?: string; hd?: string; lich?: string; trang?: string };
const sach = (t: string | undefined) => (t ?? "").trim().replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").slice(0, 60);

/** Lịch sử sửa lịch hẹn (chị Lâm 10/11/2026): mọi lần tạo / sửa / đổi lịch / đổi trạng thái / huỷ — ai, lúc nào, trường nào từ gì sang gì.
 *  Chỉ Chủ, Kỹ thuật, Quản lý / Leader xem. Dữ liệu ghi bằng trigger DB (bảng chỉ thêm, không sửa xoá được). */
export default async function TrangLichSuSuaLich({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("lich.xem");
  if (!laQuanLyLich(nd.vaiTro)) redirect("/lich-hen");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const tu = DAT.test(sp.tu ?? "") ? sp.tu! : congNgay(homNay, -6);
  let den = DAT.test(sp.den ?? "") ? sp.den! : homNay;
  if (den < tu) den = tu;
  if (den > congNgay(tu, 92)) den = congNgay(tu, 92);
  const nguoi = sach(sp.nguoi), khach = sach(sp.khach);
  const hd = NHAN_HANH_DONG_SUA[sp.hd ?? ""] ? sp.hd! : "";
  const lich = /^[0-9a-f-]{36}$/i.test(sp.lich ?? "") ? sp.lich! : "";
  const trang = Math.max(1, Math.min(2000, Math.floor(Number(sp.trang)) || 1));
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cnId = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  const url = (doi: Record<string, string> = {}) => `/lich-hen/lich-su-sua?${new URLSearchParams(Object.entries({ tu, den, cn: cnId, nguoi, khach, hd, lich, ...doi }).filter(([, v]) => v))}`;

  let idsKhach: string[] | null = null;
  if (khach) {
    const so = chuanSdt(khach);
    const { data } = await db.from("khach_hang").select("id").eq("chi_nhanh_id", cnId)
      .or([`ho_ten_khong_dau.ilike.%${boDau(khach)}%`, `ma.ilike.%${khach}%`, so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean).join(",")).limit(200);
    idsKhach = (data ?? []).map((k) => k.id);
  }
  let q = db.from("lich_hen_lich_su").select("id, lich_id, khach_id, luc, nguoi_ten, hanh_dong, thay_doi", { count: "exact" }).eq("chi_nhanh_id", cnId);
  if (lich) q = q.eq("lich_id", lich);
  else q = q.gte("luc", new Date(`${tu}T00:00:00+07:00`).toISOString()).lt("luc", new Date(`${congNgay(den, 1)}T00:00:00+07:00`).toISOString());
  if (hd) q = q.eq("hanh_dong", hd);
  if (nguoi) q = q.ilike("nguoi_ten", `%${nguoi}%`);
  if (idsKhach) q = q.in("khach_id", idsKhach.length ? idsKhach : ["00000000-0000-0000-0000-000000000000"]);
  const { data: dong, count, error } = await q.order("luc", { ascending: false }).order("id", { ascending: false }).range((trang - 1) * MOI, trang * MOI - 1);
  const idsK = [...new Set((dong ?? []).map((r) => r.khach_id).filter((x): x is string => !!x))];
  const idsL = [...new Set((dong ?? []).map((r) => r.lich_id))];
  const [{ data: ks }, { data: ls }] = await Promise.all([
    idsK.length ? db.from("khach_hang").select("id, ho_ten, ma").in("id", idsK) : Promise.resolve({ data: [] as { id: string; ho_ten: string; ma: string | null }[] }),
    idsL.length ? db.from("lich_hen").select("id, bat_dau, ma_dat_lich, chi_nhanh_id").in("id", idsL) : Promise.resolve({ data: [] as { id: string; bat_dau: string; ma_dat_lich: string | null; chi_nhanh_id: string }[] }),
  ]);
  const tenK = new Map((ks ?? []).map((k) => [k.id, k]));
  const lichCua = new Map((ls ?? []).map((l) => [l.id, l]));

  return (
    <>
      <TieuDeNoi tieuDe="Lịch sử sửa lịch hẹn" icon={History} quayLai={{ href: `/lich-hen?cn=${cnId}`, nhan: "Lưới lịch hẹn" }}>
        {!nd.chiNhanhId && (dsCn?.length ?? 0) > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">{(dsCn ?? []).map((c) => <Link key={c.id} href={url({ cn: c.id, trang: "" })} className={`rounded-nho px-3 py-1.5 ${c.id === cnId ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}</div>
        )}
      </TieuDeNoi>
      <BoLocSuaLich tu={tu} den={den} nguoi={nguoi} khach={khach} hd={hd} />
      {lich && <p className="mb-3 text-[13px] text-muc-2">Đang xem một lịch hẹn. <Link href={url({ lich: "" })} className="font-medium text-nhan-dam hover:underline">Xem mọi lịch</Link></p>}
      {error && <p role="alert" className="mb-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Không tải được lịch sử sửa. Thử lại sau ít phút.</p>}
      <div className="the-noi overflow-x-auto">
        {(dong ?? []).length === 0 ? <p className="px-4 py-10 text-center text-[14px] text-muc-3">Chưa có lần sửa nào khớp bộ lọc (lịch sử bắt đầu ghi từ 10/11/2026).</p> : (
          <table className="w-full min-w-[760px] text-[13.5px]">
            <thead><tr className="border-b border-vien text-left text-[12.5px] text-muc-3">
              <th className="px-4 py-2.5 font-medium">Lúc</th><th className="px-3 py-2.5 font-medium">Người sửa</th><th className="px-3 py-2.5 font-medium">Hành động</th><th className="px-3 py-2.5 font-medium">Khách · lịch hẹn</th><th className="px-3 py-2.5 font-medium">Thay đổi</th>
            </tr></thead>
            <tbody>
              {(dong ?? []).map((r) => {
                const k = r.khach_id ? tenK.get(r.khach_id) : undefined, l = lichCua.get(r.lich_id);
                const ngayL = l ? ngayCuaIso(l.bat_dau) : "";
                return (
                  <tr key={r.id} className="border-b border-vien align-top last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muc-2">{gioVN(r.luc)} {ngayVN(ngayCuaIso(r.luc))}</td>
                    <td className="px-3 py-2.5 font-medium text-muc">{r.nguoi_ten}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muc-2">{NHAN_HANH_DONG_SUA[r.hanh_dong] ?? r.hanh_dong}</td>
                    <td className="px-3 py-2.5">
                      {k ? <Link href={`/khach-hang/${r.khach_id}`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten}</Link> : "—"}
                      {l && <div className="text-[12px] text-muc-3"><Link href={`/lich-hen?tu=${ngayL}&den=${ngayL}&ngay=${ngayL}&cn=${l.chi_nhanh_id}&lich=${l.id}`} className="hover:underline">Lịch {gioVN(l.bat_dau)} {ngayVN(ngayL)}{l.ma_dat_lich ? ` · #${l.ma_dat_lich}` : ""}</Link></div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <ul className="space-y-0.5">{dongThayDoi(r.thay_doi).map((d, i) => (
                        <li key={i}><span className="text-muc-3">{d.nhan}:</span> {r.hanh_dong === "tao" || !d.cu ? <span className="text-muc">{d.moi || "(trống)"}</span> : <><span className="text-muc-3 line-through">{d.cu}</span> → <span className="text-muc">{d.moi || "(trống)"}</span></>}</li>
                      ))}</ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <ThanhTrang trang={trang} tong={count ?? 0} moi={MOI} don="dòng" luonHien gan={(t) => url({ trang: t ? String(t) : "" })} />
      <p className="mt-3 text-[12px] text-muc-3">Chỉ Chủ, Kỹ thuật, Quản lý / Leader xem được trang này. Lịch sử không sửa, không xoá được. Thay đổi do đồng bộ đêm từ SalonHero ghi người là “Đồng bộ SalonHero”.</p>
    </>
  );
}
