import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayGioVN, soVN } from "@/lib/dinh-dang";
import { chiNhanhXem } from "@/lib/cham-soc-khach";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";
import { moTaLapNhac, NHAN_TRANG_THAI_NHAC } from "@/lib/nhac-cham-soc";
import { dichVuChoNhac } from "@/lib/nhac-cham-soc-may-chu";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { HopTaoNhac, type DichVuNhac } from "@/components/khach/HopTaoNhac";
import { NutTrangThaiNhac } from "@/components/khach/NutTrangThaiNhac";
import { taoNhacTay } from "./actions";

const DAT = /^\d{4}-\d{2}-\d{2}$/;
const MOI_TRANG = 50;
const TT = [{ gia_tri: "dang_nhac", nhan: "Chưa thực hiện" }, { gia_tri: "da_xong", nhan: "Đã thực hiện" }, { gia_tri: "huy", nhan: "Đã huỷ" }, { gia_tri: "tat_ca", nhan: "Mọi trạng thái" }];

/** /khach-hang/nhac-nho — Lịch nhắc chăm sóc (SalonHero: biểu tượng đồng hồ): nhắc tạo tay + nhắc chuyển từ SalonHero, lọc theo ngày nhắc (nhắc lặp xét từng lần),
 *  trạng thái, người phụ trách; tạo nhắc có lặp + người phụ trách; bấm Đã thực hiện / Huỷ. Danh sách gọi TỰ SINH vẫn ở Chăm sóc khách. */
export default async function LichNhacChamSoc({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const sp = await searchParams;
  const hom = homNayHCM();
  const { cn, ds: dsCn, khoa } = await chiNhanhXem(nd, sp.cn);
  const tu = DAT.test(sp.tu ?? "") ? sp.tu! : hom;
  let den = DAT.test(sp.den ?? "") ? sp.den! : congNgay(hom, 7);
  if (den < tu) den = tu;
  if (den > congNgay(tu, 366)) den = congNgay(tu, 366);
  const tt = TT.some((x) => x.gia_tri === sp.tt) ? sp.tt! : "dang_nhac";
  const pt = sp.pt === "toi" ? nd.nhanVienId : sp.pt && /^[0-9a-f-]{36}$/i.test(sp.pt) ? sp.pt : null;
  const trang = Math.max(1, Math.min(2000, Number(sp.trang) || 1));
  const q = (sp.q ?? "").trim().slice(0, 60);
  const db = sb();
  const sua = coQuyen(nd, "khach.sua"), xemSdt = coQuyen(nd, "khach.sdt");

  const [{ data: dong, error }, { data: nv }, dv] = await Promise.all([
    db.rpc("nhac_cham_soc_loc", { p_cn: cn ?? undefined, p_tu: tu, p_den: den, p_tt: tt === "tat_ca" ? undefined : tt, p_phu_trach: pt ?? undefined, p_lim: MOI_TRANG, p_off: (trang - 1) * MOI_TRANG, ...(q ? { p_q: q } : {}) }),
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    sua ? dichVuChoNhac() : Promise.resolve([] as DichVuNhac[]),
  ]);
  if (error) console.error("[nhac-nho]", error.code, error.message);
  const ds = dong ?? [];
  const tong = Number(ds[0]?.tong ?? 0);
  const ids = ds.map((r) => r.id), idsK = [...new Set(ds.map((r) => r.khach_id))];
  const [{ data: nhac }, { data: ks }] = await Promise.all([
    ids.length ? db.from("khach_nhac").select("id, noi_dung, ghi_chu, trang_thai, dich_vu_ten, kieu_lap, lap_khoang, so_lan_lap, cac_ngay_nhac, nguoi_phu_trach_ten, nguoi_tao_ten, chi_nhanh_id").in("id", ids) : Promise.resolve({ data: [] }),
    idsK.length ? db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").in("id", idsK) : Promise.resolve({ data: [] }),
  ]);
  const theoId = new Map((nhac ?? []).map((n) => [n.id, n])), khach = new Map((ks ?? []).map((k) => [k.id, k]));
  const nvLC = luaChonNhanVien((nv ?? []).filter((n) => n.vai_tro !== "nha_dau_tu"));
  const tenCn = new Map(dsCn.map((c) => [c.id, c.ten]));
  const gan = (t?: number) => {
    const u = new URLSearchParams({ ...(cn && !khoa ? { cn } : {}), tu, den, ...(tt !== "dang_nhac" ? { tt } : {}), ...(sp.pt ? { pt: sp.pt } : {}), ...(q ? { q } : {}), ...(t && t > 1 ? { trang: String(t) } : {}) });
    return `/khach-hang/nhac-nho?${u}`;
  };

  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="chu-tieu-de text-[22px] text-muc">Lịch nhắc chăm sóc</h1>
          <p className="text-[13px] text-muc-3">Nhắc tạo tay (có lặp, người phụ trách) và nhắc chuyển từ SalonHero. Nhắc lặp hiện khi một lần nhắc rơi vào khoảng ngày đang xem. Danh sách gọi tự tính ở <Link href="/khach-hang/cham-soc" className="underline underline-offset-2">Chăm sóc khách</Link>.</p>
        </div>
        {sua && <HopTaoNhac dichVu={dv} nhanVien={nvLC} phuTrachMacDinh={nd.nhanVienId} homNay={hom} action={taoNhacTay} />}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-x-3 gap-y-3 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-52"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        <div className="block"><span className="mb-1 block font-medium text-muc-2">Ngày nhắc</span>
          <div className="flex items-center gap-1.5"><NgayChon ten="tu" giaTriMacDinh={tu} tuNam={2018} denNam={2035} ariaLabel="Nhắc từ ngày" className="w-36" /><span aria-hidden className="text-muc-3">–</span><NgayChon ten="den" giaTriMacDinh={den} tuNam={2018} denNam={2035} ariaLabel="Nhắc đến ngày" className="w-36" /></div></div>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Trạng thái</span>
          <div className="w-44"><Chon ten="tt" ariaLabel="Trạng thái nhắc" giaTriMacDinh={tt} luaChon={TT} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Người phụ trách</span>
          <div className="w-56"><Chon ten="pt" ariaLabel="Người phụ trách" giaTriMacDinh={sp.pt ?? ""} luaChon={[{ gia_tri: "", nhan: "Mọi người" }, { gia_tri: "toi", nhan: "Tôi phụ trách" }, ...nvLC]} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Khách hàng</span>
          <input name="q" defaultValue={q} placeholder="Tên, SĐT hoặc mã khách" aria-label="Tìm khách hàng" className={`${O_NHAP} !h-10 w-56 !text-[13px]`} /></label>
        <button type="submit" className={NUT_PHU}>Lọc</button>
      </form>

      {error && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Chưa tải được lịch nhắc (hệ thống đang chậm). Tải lại trang để thử lại.</p>}
      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> nhắc{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}</p>
      <Bang duLieu={ds} khoa={(r) => r.id} trong="Không có nhắc nào trong khoảng ngày này."
        cot={[
          { chinh: true, nhan: "Ngày nhắc", hienThi: (r) => <span className="whitespace-nowrap tabular-nums">{ngayGioVN(r.ngay)}</span> },
          { nhan: "Khách hàng", hienThi: (r) => { const k = khach.get(r.khach_id); return k ? <div><Link href={`/khach-hang/${k.id}?tab=nhac-nho`} className="font-medium text-muc hover:underline">{k.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{xemSdt && k.dien_thoai ? `${k.dien_thoai} · ` : ""}{k.ma}</div></div> : ""; } },
          { nhan: "Nội dung", hienThi: (r) => { const n = theoId.get(r.id); return <div className="max-w-[320px] text-[13px]">{n?.dich_vu_ten && <div className="font-medium text-muc-2">{n.dich_vu_ten}</div>}<div className="line-clamp-3 whitespace-pre-line text-muc-3">{n?.noi_dung}{n?.ghi_chu ? ` — ${n.ghi_chu}` : ""}</div></div>; } },
          { nhan: "Lặp", hienThi: (r) => <span className="text-[13px]">{moTaLapNhac(theoId.get(r.id) ?? {}) || "Không lặp"}</span> },
          { nhan: "Phụ trách", hienThi: (r) => <span className="text-[13px]">{theoId.get(r.id)?.nguoi_phu_trach_ten ?? "—"}</span> },
          { nhan: "Trạng thái", hienThi: (r) => { const t = NHAN_TRANG_THAI_NHAC[theoId.get(r.id)?.trang_thai ?? "dang_nhac"] ?? NHAN_TRANG_THAI_NHAC.dang_nhac; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
          { nhan: "", hienThi: (r) => { const n = theoId.get(r.id); if (!sua || !n) return null; return <NutTrangThaiNhac id={r.id} tt={n.trang_thai} />; } },
        ]} />
      <ThanhTrang trang={trang} tong={tong} moi={MOI_TRANG} gan={gan} don="nhắc" />
    </div>
  );
}
