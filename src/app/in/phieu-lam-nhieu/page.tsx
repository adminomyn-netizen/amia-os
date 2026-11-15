import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BE_NGANG, KHO_CUON } from "@/components/cai-dat/BanInHoaDon";
import { docIn } from "@/lib/thiet-lap-in";
import { CO_SO } from "@/lib/in-hoa-don";
import { nhanBuoiThu, soBuoiPhieu, KHONG_GIOI_HAN } from "@/lib/phieu-lam-dich-vu";

/** Một phiếu làm dịch vụ chung cho nhiều dịch vụ của CÙNG một khách (chị Diệu Thuý 15/11/2026:
 *  "1 hoá đơn có thể nhiều dịch vụ, khách làm nhiều dịch vụ cùng 1 lúc, hiện tại một khách 1 dịch vụ 1 lần in").
 *  `?ids=` = các lượt Khách chờ làm (buoi_cho_lam), cách nhau dấu phẩy. Chỉ đọc. Khổ giấy theo Cài đặt › Thiết lập in (hoá đơn). */
export default async function InPhieuLamNhieu({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const ids = [...new Set(((await searchParams).ids ?? "").split(",").map((x) => x.trim()).filter((x) => /^[0-9a-f-]{36}$/i.test(x)))].slice(0, 30);
  if (!ids.length) notFound();
  const db = sb();
  const { data: dsCho } = await db.from("buoi_cho_lam").select("*").in("id", ids).order("chuyen_luc");
  const ds = (dsCho ?? []).filter((r) => !nd.chiNhanhId || r.chi_nhanh_id === nd.chiNhanhId);
  if (!ds.length) notFound();
  // Chỉ in chung cho một khách: lấy khách của lượt đầu, bỏ lượt của khách khác (link sai).
  const khachId = ds[0].khach_id;
  const luot = ds.filter((r) => r.khach_id === khachId);
  const theIds = [...new Set(luot.map((r) => r.the_id).filter((x): x is string => !!x))];
  const hdIds = [...new Set(luot.map((r) => r.hoa_don_id).filter((x): x is string => !!x))];
  const dvIds = [...new Set(luot.map((r) => r.dich_vu_id).filter((x): x is string => !!x))];
  const nvIds = [...new Set(luot.flatMap((r) => [...(r.nv_ids ?? []), ...(r.tu_van_ids ?? []), ...(r.bac_si_id ? [r.bac_si_id] : [])]))];
  const [{ data: k }, { data: dsThe }, { data: dsDv }, { data: dsHd }, { data: nv }, { data: cn }, { data: ch }] = await Promise.all([
    db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("id", khachId).maybeSingle(),
    theIds.length ? db.from("v_the_khach").select("id, ma, goi_id, loai, so_buoi_con, so_buoi_tong, han_dung").in("id", theIds) : Promise.resolve({ data: [] as { id: string; ma: string | null; goi_id: string | null; loai: string | null; so_buoi_con: number | null; so_buoi_tong: number | null; han_dung: string | null }[] }),
    dvIds.length ? db.from("dich_vu").select("id, ten").in("id", dvIds) : Promise.resolve({ data: [] as { id: string; ten: string }[] }),
    hdIds.length ? db.from("hoa_don").select("id, ma").in("id", hdIds) : Promise.resolve({ data: [] as { id: string; ma: string | null }[] }),
    nvIds.length ? db.from("nhan_vien").select("id, ho_ten").in("id", nvIds) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", luot[0].chi_nhanh_id).maybeSingle(),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
  ]);
  const goiIds = [...new Set((dsThe ?? []).map((t) => t.goi_id).filter((x): x is string => !!x))];
  const { data: dsGoi } = goiIds.length ? await db.from("goi_the").select("id, ten").in("id", goiIds) : { data: [] as { id: string; ten: string }[] };
  const tenNv = (x: string[]) => x.map((i) => (nv ?? []).find((n) => n.id === i)?.ho_ten).filter(Boolean).join(", ");

  // Cùng một thẻ có nhiều lượt chờ: lượt sau đánh số tiếp theo lượt trước.
  const daXep = new Map<string, number>();
  const dong = luot.map((r) => {
    const t = (dsThe ?? []).find((x) => x.id === r.the_id);
    const sl = Math.max(1, r.so_luong ?? 1);
    let buoi = "", con = "";
    const huy = r.trang_thai === "huy" || r.trang_thai === "tra_lai";
    if (t) {
      const truoc = daXep.get(r.the_id!) ?? 0;
      if (!huy) daXep.set(r.the_id!, truoc + sl);
      const conTruoc = t.so_buoi_con == null ? null : Math.max(0, t.so_buoi_con - truoc);
      const so = soBuoiPhieu({ tong: t.so_buoi_tong, con: conTruoc, daTru: false });
      buoi = nhanBuoiThu(so) || (t.so_buoi_tong != null && t.so_buoi_tong >= KHONG_GIOI_HAN ? "Không giới hạn" : "");
      if (sl > 1 && so.thu != null) buoi = `Buổi ${so.thu}–${Math.min(so.tong ?? so.thu + sl - 1, so.thu + sl - 1)}${so.tong != null ? `/${so.tong}` : ""}`;
      if (conTruoc != null && t.so_buoi_tong != null && t.so_buoi_tong < KHONG_GIOI_HAN) con = `${Math.max(0, conTruoc - sl)} buổi`;
    }
    const goi = t?.goi_id ? (dsGoi ?? []).find((g) => g.id === t.goi_id)?.ten : null;
    const hd = r.hoa_don_id ? (dsHd ?? []).find((h) => h.id === r.hoa_don_id)?.ma : null;
    return {
      id: r.id, huy,
      dv: `${(dsDv ?? []).find((d) => d.id === r.dich_vu_id)?.ten ?? ""}${sl > 1 ? ` × ${sl} ${t ? "buổi" : "lượt"}` : ""}`,
      nguon: t ? `${goi ?? (t.loai === "tien" ? "Thẻ tiền" : "Thẻ liệu trình")}${t.ma ? ` (#${t.ma})` : ""}${t.han_dung ? ` · hạn ${ngayVN(t.han_dung)}` : ""}` : `Hoá đơn${hd ? ` ${hd}` : ""} (dịch vụ lẻ)`,
      buoi, con,
      lam: tenNv(r.nv_ids ?? []), bacSi: r.bac_si_id ? tenNv([r.bac_si_id]) : "", tuVan: tenNv(r.tu_van_ids ?? []),
      ts: (r.tham_so ?? {}) as Record<string, unknown>, ghiChu: r.ghi_chu ?? "",
    };
  });
  const tinhTrang = [...new Set(luot.map((r) => r.tu_van_tinh_trang).filter(Boolean))].join("\n");
  const hen = luot.filter((r) => r.ke_tiep_ngay).map((r) => `${ngayVN(r.ke_tiep_ngay!)}${r.ke_tiep_noi_dung ? ` · ${r.ke_tiep_noi_dung}` : ""}`);
  const giay = docIn("hoa_don", ch ?? [], luot[0].chi_nhanh_id).cauHinh.khoGiay;
  const cuon = KHO_CUON(giay);
  const dau: [string, string][] = ([
    ["Khách hàng", k?.ho_ten ?? ""], ["Mã KH", k?.ma ?? ""], ["SĐT", coQuyen(nd, "khach.sdt") ? k?.dien_thoai ?? "" : ""],
    ["Số dịch vụ", `${dong.filter((d) => !d.huy).length}`],
  ] as [string, string][]).filter(([, v]) => v);

  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${cuon ? `${giay.replace("mm", "")}mm auto` : giay};margin:${cuon ? "2mm" : "8mm 8mm 8mm 14mm"}}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">Phiếu làm dịch vụ (chung {dong.length} dịch vụ) · khổ giấy {giay} (đổi ở Cài đặt › Thiết lập in)</p>
        <NutIn kho={giay} />
      </div>
      <div className={`to-in mx-auto bg-white ${cuon ? "px-2 py-3 text-[11px]" : "px-6 py-8 text-[13px]"}`} style={{ width: "100%", maxWidth: BE_NGANG[giay] }}>
        <header className="text-center">
          <h1 className={`chu-tieu-de ${cuon ? "text-[15px]" : "text-[20px]"}`}>{CO_SO.ten}</h1>
          <p className="text-muc-2">{CO_SO.linhVuc} · Giấy phép {CO_SO.giayPhep}</p>
          {cn && <p className="text-muc-2">Chi nhánh: {cn.ten}{cn.dia_chi ? ` · ${cn.dia_chi}` : ""}</p>}
          <p className={`mt-3 font-bold uppercase tracking-wide ${cuon ? "text-[13px]" : "text-[16px]"}`}>Phiếu làm dịch vụ</p>
          <p className="text-muc-2">{ngayGioVN(luot[0].chuyen_luc)}</p>
        </header>
        <dl className="mt-3 grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: "auto 1fr" }}>
          {dau.map(([n, v]) => <div key={n} className="contents"><dt className="text-muc-2">{n}:</dt><dd className={`[overflow-wrap:anywhere] ${n === "Khách hàng" ? "font-semibold" : ""}`}>{v}</dd></div>)}
        </dl>
        <ol className="mt-3 grid gap-2">
          {dong.map((d, i) => {
            const thongSo = [d.ts.vung != null && d.ts.vung !== "" ? `Vùng: ${d.ts.vung}` : "", d.ts.shot != null && d.ts.shot !== "" ? `${d.ts.shot} shot` : "", d.ts.line != null && d.ts.line !== "" ? `${d.ts.line} line` : ""].filter(Boolean).join(" · ");
            return (
              <li key={d.id} className={`border-t border-dashed border-vien-dam pt-2 ${d.huy ? "line-through opacity-60" : ""}`}>
                <p className="font-semibold">{i + 1}. {d.dv}{d.huy ? " (không làm)" : ""}</p>
                <p className="text-muc-2 [overflow-wrap:anywhere]">{d.nguon}</p>
                {(d.buoi || d.con) && <p>{d.buoi && <b className="font-semibold">{d.buoi}</b>}{d.buoi && d.con ? " · " : ""}{d.con && `còn lại sau buổi này: ${d.con}`}</p>}
                {d.lam && <p>Chuyên viên trị liệu: {d.lam}</p>}
                {d.bacSi && <p>Bác sĩ: {d.bacSi}</p>}
                {d.tuVan && <p>Tư vấn viên: {d.tuVan}</p>}
                {thongSo && <p>{thongSo}</p>}
                {d.ghiChu && <p className="whitespace-pre-line">Ghi chú: {d.ghiChu}</p>}
              </li>
            );
          })}
        </ol>
        {(tinhTrang || hen.length > 0) && (
          <dl className="mt-3 grid gap-x-2 gap-y-1 border-t border-dashed border-vien-dam pt-2" style={{ gridTemplateColumns: "auto 1fr" }}>
            {tinhTrang && <div className="contents"><dt className="text-muc-2">Tình trạng da:</dt><dd className="whitespace-pre-line">{tinhTrang}</dd></div>}
            {hen.length > 0 && <div className="contents"><dt className="text-muc-2">Hẹn buổi kế tiếp:</dt><dd className="whitespace-pre-line">{hen.join("\n")}</dd></div>}
          </dl>
        )}
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div><p className="font-medium">Khách hàng</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>
          <div><p className="font-medium">Chuyên viên trị liệu</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>
        </div>
      </div>
    </main>
  );
}
