import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { boDau, congNgay, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { chiNhanhXem } from "@/lib/cham-soc-khach";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { NHAN_TINH_TRANG } from "../../the/page";

const MOI_TRANG = 50;
const TINH_TRANG = [{ ma: "", nhan: "Tất cả" }, { ma: "sap_het", nhan: "Sắp hết tiền/lần" }, { ma: "tuan", nhan: "Hết hạn sau 1 tuần" }, { ma: "thang", nhan: "Hết hạn sau 1 tháng" }];
const LOAI = [{ ma: "", nhan: "Tất cả loại thẻ" }, { ma: "lan", nhan: "Thẻ liệu trình" }, { ma: "tien", nhan: "Thẻ tiền" }];

/** /khach-hang/dung-the — Danh sách khách dùng thẻ (như SalonHero): mọi thẻ đang dùng của khách, lọc Tình trạng (sắp hết tiền/lần, hết hạn sau 1 tuần/1 tháng), loại thẻ, chi nhánh, tìm theo khách hoặc mã thẻ. */
export default async function KhachDungThe({ searchParams }: { searchParams: Promise<{ cn?: string; tt?: string; loai?: string; q?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const { cn, ds: dsCn, khoa } = await chiNhanhXem(nd, sp.cn);
  const tt = TINH_TRANG.some((x) => x.ma === sp.tt) ? (sp.tt ?? "") : "";
  const loai = LOAI.some((x) => x.ma === sp.loai) ? (sp.loai ?? "") : "";
  const trang = Math.max(1, Math.min(Number(sp.trang) || 1, 2000));
  const hom = homNayHCM(), db = sb();
  const tuKhoa = (sp.q ?? "").trim().replace(/[%,()*\\]/g, " ").trim();

  let q = db.from("v_the_khach").select("*", { count: "exact" }).in("tinh_trang", ["hoat_dong", "sap_het", "khoa"]).order("ngay_cap", { ascending: false }).order("id");
  if (cn) q = q.eq("chi_nhanh_id", cn);
  if (loai) q = q.eq("loai", loai);
  if (tt === "sap_het") q = q.eq("tinh_trang", "sap_het");
  if (tt === "tuan" || tt === "thang") q = q.gte("han_dung", hom).lte("han_dung", congNgay(hom, tt === "tuan" ? 7 : 30));
  if (tuKhoa) {
    const { data: kt } = await db.from("khach_hang").select("id").or(`ho_ten_khong_dau.ilike.%${boDau(tuKhoa)}%,dien_thoai.ilike.%${tuKhoa.replace(/^0/, "")}%,ma.ilike.%${tuKhoa}%`).limit(300);
    const ids = (kt ?? []).map((k) => k.id);
    q = q.or(ids.length ? `ma.ilike.%${tuKhoa}%,khach_id.in.(${ids.join(",")})` : `ma.ilike.%${tuKhoa}%`);
  }
  const { data: the, count } = await q.range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1);
  const ds = the ?? [];
  const idsK = [...new Set(ds.map((t) => t.khach_id))].filter((x): x is string => !!x), idsG = [...new Set(ds.map((t) => t.goi_id))].filter((x): x is string => !!x);
  const [{ data: ks }, { data: gs }] = await Promise.all([
    idsK.length ? db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").in("id", idsK) : Promise.resolve({ data: [] as { id: string; ho_ten: string; ma: string; dien_thoai: string | null }[] }),
    idsG.length ? db.from("goi_the").select("id, ten").in("id", idsG) : Promise.resolve({ data: [] as { id: string; ten: string }[] }),
  ]);
  const khach = new Map((ks ?? []).map((k) => [k.id, k])), tenGoi = new Map((gs ?? []).map((g) => [g.id, g.ten]));
  const tong = count ?? 0, tenCn = new Map(dsCn.map((c) => [c.id, c.ten]));
  const gan = (t: number | undefined) => `/khach-hang/dung-the?${new URLSearchParams(Object.entries({ cn: cn && !khoa ? cn : undefined, tt: tt || undefined, loai: loai || undefined, q: tuKhoa || undefined, trang: t && t > 1 ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;

  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div>
        <h1 className="chu-tieu-de text-[22px] text-muc">Danh sách khách dùng thẻ</h1>
        <p className="text-[13px] text-muc-3">Các thẻ liệu trình và thẻ tiền khách đang dùng (gồm thẻ đang khoá). Thẻ đã dùng hết, hết hạn hoặc thu hồi xem ở mục Thẻ.</p>
      </div>
      <form method="get" className="flex flex-wrap items-end gap-3 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-56"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Tình trạng</span>
          <div className="w-52"><Chon ten="tt" ariaLabel="Tình trạng" giaTriMacDinh={tt} luaChon={TINH_TRANG.map((x) => ({ gia_tri: x.ma, nhan: x.nhan }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Loại thẻ</span>
          <div className="w-44"><Chon ten="loai" ariaLabel="Loại thẻ" giaTriMacDinh={loai} luaChon={LOAI.map((x) => ({ gia_tri: x.ma, nhan: x.nhan }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Tìm khách / mã thẻ</span>
          <input name="q" defaultValue={tuKhoa} placeholder="Tên, SĐT, mã khách, mã thẻ" className={`${O_NHAP} !h-10 !w-64`} /></label>
        <button type="submit" className={NUT_PHU}>Lọc</button>
      </form>
      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> thẻ đang dùng{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}</p>
      <Bang duLieu={ds} khoa={(r) => r.id ?? ""} trong="Không có thẻ nào với điều kiện này."
        cot={[
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => { const k = khach.get(r.khach_id ?? ""); return k ? <div><Link href={`/khach-hang/${k.id}`} className="font-medium text-muc hover:underline">{k.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{k.dien_thoai} · {k.ma}</div></div> : ""; } },
          { nhan: "Tên thẻ", hienThi: (r) => <div className="text-[13px]"><Link href={`/the/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link><div className="text-muc-3">{tenGoi.get(r.goi_id ?? "") ?? ""}</div></div> },
          { nhan: "Loại", hienThi: (r) => (r.loai === "tien" ? "Thẻ tiền" : "Thẻ liệu trình") },
          { nhan: "Ngày cấp", hienThi: (r) => <span className="tabular-nums">{ngayVN(r.ngay_cap)}</span> },
          { nhan: "Hết hạn", hienThi: (r) => <span className="tabular-nums">{r.han_dung && r.han_dung >= "2000-01-01" ? ngayVN(r.han_dung) : "Không hạn"}</span> },
          { nhan: "Còn lại", phai: true, hienThi: (r) => <span className="tabular-nums">{r.loai === "tien" ? tienVN(r.so_du_tien) : `${r.so_buoi_con ?? 0}/${r.so_buoi_tong ?? 0} buổi`}</span> },
          { nhan: "Tình trạng", hienThi: (r) => { const t = NHAN_TINH_TRANG[r.tinh_trang ?? "hoat_dong"]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
        ]} />
      <ThanhTrang trang={trang} tong={tong} moi={MOI_TRANG} gan={gan} don="thẻ" />
    </div>
  );
}
