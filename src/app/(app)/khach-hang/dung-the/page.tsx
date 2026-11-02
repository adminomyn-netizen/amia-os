import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { dieuKienTim, ganLoc, LOAI_DUNG_THE as LOAI, TINH_TRANG_DUNG_THE as TINH_TRANG } from "@/lib/khach-dung-the";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { chiNhanhXem } from "@/lib/cham-soc-khach";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { NHAN_TINH_TRANG } from "../../the/page";

const MOI_TRANG = 50;

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

  const loc = { cn, tt, loai, tuKhoa, hom };
  const nen = () => db.from("v_the_khach").select("*", { count: "exact" }).in("tinh_trang", ["hoat_dong", "sap_het", "khoa"]);
  const tim = await dieuKienTim(tuKhoa);
  const q = ganLoc(nen().order("ngay_cap", { ascending: false }).order("id"), loc, tim);
  // Ba ô tổng của SalonHero (tính trong DB, cùng điều kiện lọc; không áp ô tìm theo tên nên ẩn khi đang tìm).
  const [{ data: the, count }, tongRaw] = await Promise.all([
    q.range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1),
    tuKhoa ? Promise.resolve(null) : db.rpc("tong_khach_dung_the", { p_cn: cn ?? undefined, p_loai: loai, p_tt: tt, p_hom: hom }).then((r) => r.data as { so_khach: number; tong_tien: number; tong_lan: number } | null),
  ]);
  const tatCa = tongRaw, soKhach = tongRaw?.so_khach ?? null, tongTien = tongRaw ? Number(tongRaw.tong_tien) : null, tongLan = tongRaw ? Number(tongRaw.tong_lan) : null;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> thẻ đang dùng{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}</p>
        <NutXuatExcel loai="khach-dung-the" ten="khách dùng thẻ" tham={{ cn: cn ?? undefined, tt: tt || undefined, loai: loai || undefined, q: tuKhoa || undefined }} />
      </div>
      {tatCa && (
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-nho border border-vien px-4 py-3"><dt className="text-[12px] text-muc-3">Số khách đang dùng thẻ</dt><dd className="mt-1 text-[20px] font-medium tabular-nums text-muc">{soVN(soKhach ?? 0)}</dd></div>
          <div className="rounded-nho border border-vien px-4 py-3"><dt className="text-[12px] text-muc-3">Tổng số dư thẻ tiền</dt><dd className="mt-1 text-[20px] font-medium tabular-nums text-muc">{tienVN(tongTien ?? 0)}</dd></div>
          <div className="rounded-nho border border-vien px-4 py-3"><dt className="text-[12px] text-muc-3">Giá trị buổi còn lại (thẻ liệu trình, không tính thẻ không giới hạn)</dt><dd className="mt-1 text-[20px] font-medium tabular-nums text-muc">{tienVN(tongLan ?? 0)}</dd></div>
        </dl>
      )}
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
