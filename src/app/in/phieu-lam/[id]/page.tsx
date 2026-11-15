import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { NutIn } from "@/components/hoa-don/NutIn";
import { BE_NGANG, KHO_CUON } from "@/components/cai-dat/BanInHoaDon";
import { docIn } from "@/lib/thiet-lap-in";
import { CO_SO } from "@/lib/in-hoa-don";
import { nhanBuoiThu, soBuoiPhieu } from "@/lib/phieu-lam-dich-vu";

/** Phiếu làm dịch vụ (chị Diệu Thuý 10/11/2026 mục 11): thu ngân in khi chuyển khách cho chuyên viên trị liệu, hoặc in lại buổi đã làm.
 *  `id` = lượt Khách chờ làm (buoi_cho_lam) hoặc buổi đã làm (buoi_thuc_hien). Chỉ đọc. Khổ giấy theo Cài đặt › Thiết lập in (hoá đơn). */
export default async function InPhieuLam({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = sb();
  const [{ data: cho }, { data: b0 }] = await Promise.all([
    db.from("buoi_cho_lam").select("*").eq("id", id).maybeSingle(),
    db.from("buoi_thuc_hien").select("*").eq("id", id).maybeSingle(),
  ]);
  // Lượt chờ đã làm xong thì đánh số theo buổi thật của nó.
  const { data: bXong } = cho?.buoi_id ? await db.from("buoi_thuc_hien").select("*").eq("id", cho.buoi_id).maybeSingle() : { data: null };
  const buoi = b0 ?? bXong;
  const goc = cho ?? buoi;
  if (!goc || !goc.the_id || (nd.chiNhanhId && goc.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const ts = ((buoi?.tham_so ?? cho?.tham_so ?? {}) as Record<string, unknown>);
  const nvIds = cho?.nv_ids ?? [];
  const [{ data: t }, { data: k }, { data: dv }, { data: cn }, { data: ch }, { data: nguoiBuoi }, { data: sauDo }] = await Promise.all([
    db.from("v_the_khach").select("id, ma, goi_id, loai, so_buoi_con, so_buoi_tong, han_dung").eq("id", goc.the_id).maybeSingle(),
    db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("id", goc.khach_id).maybeSingle(),
    db.from("dich_vu").select("ten").eq("id", goc.dich_vu_id).maybeSingle(),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", goc.chi_nhanh_id).maybeSingle(),
    db.from("cau_hinh").select("khoa, gia_tri").like("khoa", "in.hoa_don.%"),
    buoi ? db.from("buoi_nhan_vien").select("nhan_vien_id, vai, thu_tu").eq("buoi_id", buoi.id).order("thu_tu") : Promise.resolve({ data: [] as { nhan_vien_id: string; vai: string; thu_tu: number }[] }),
    buoi && buoi.trang_thai === "da_lam" ? db.from("buoi_thuc_hien").select("id", { count: "exact", head: false }).eq("the_id", goc.the_id).eq("trang_thai", "da_lam").gt("tao_luc", buoi.tao_luc) : Promise.resolve({ data: [] as { id: string }[] }),
  ]);
  const { data: goi } = t?.goi_id ? await db.from("goi_the").select("ten").eq("id", t.goi_id).maybeSingle() : { data: null };
  const nguoiLam = (nguoiBuoi ?? []).filter((x) => x.vai === "thuc_hien").map((x) => x.nhan_vien_id);
  const tuVan = cho ? cho.tu_van_ids : (nguoiBuoi ?? []).filter((x) => x.vai === "tu_van").map((x) => x.nhan_vien_id);
  const lam = nvIds.length ? nvIds : nguoiLam.length ? nguoiLam : buoi ? [buoi.nv_thuc_hien_id] : [];
  const bacSi = cho?.bac_si_id ?? buoi?.bac_si_id ?? null;
  const idNv = [...new Set([...lam, ...tuVan, ...(bacSi ? [bacSi] : [])])];
  const { data: nv } = idNv.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : { data: [] };
  const tenNv = (ids: string[]) => ids.map((x) => (nv ?? []).find((n) => n.id === x)?.ho_ten).filter(Boolean).join(", ");

  const daTru = !!buoi && buoi.trang_thai === "da_lam";
  const so = soBuoiPhieu({ tong: t?.so_buoi_tong ?? null, con: t?.so_buoi_con ?? null, daTru, sauDo: (sauDo ?? []).length });
  const giay = docIn("hoa_don", ch ?? [], goc.chi_nhanh_id).cauHinh.khoGiay;
  const cuon = KHO_CUON(giay);
  const huy = buoi?.trang_thai === "huy" || cho?.trang_thai === "huy" || cho?.trang_thai === "tra_lai";
  const luc = buoi ? buoi.tao_luc : cho!.chuyen_luc;
  const hen = cho?.ke_tiep_ngay ? `${ngayVN(cho.ke_tiep_ngay)}${cho.ke_tiep_noi_dung ? ` · ${cho.ke_tiep_noi_dung}` : ""}` : "";
  const dong: [string, string][] = ([
    ["Khách hàng", k?.ho_ten ?? ""], ["Mã KH", k?.ma ?? ""], ["SĐT", coQuyen(nd, "khach.sdt") ? k?.dien_thoai ?? "" : ""],
    ["Thẻ", `${goi?.ten ?? (t?.loai === "tien" ? "Thẻ tiền" : "Thẻ liệu trình")}${t?.ma ? ` (#${t.ma})` : ""}`],
    ["Dịch vụ làm", dv?.ten ?? ""],
    ["Buổi", nhanBuoiThu(so) || (t?.so_buoi_tong != null && t.so_buoi_tong >= 999_999 ? "Thẻ không giới hạn buổi" : "")],
    ["Còn lại sau buổi này", so.conSau != null && so.tong != null ? `${so.conSau} buổi` : ""],
    ["Hạn thẻ", t?.han_dung ? ngayVN(t.han_dung) : ""],
    ["Chuyên viên trị liệu", tenNv(lam)], ["Bác sĩ", bacSi ? tenNv([bacSi]) : ""], ["Tư vấn viên", tenNv(tuVan)],
    ["Vùng điều trị", ts.vung == null ? "" : String(ts.vung)],
    ["Số shot / line", [ts.shot != null && ts.shot !== "" ? `${ts.shot} shot` : "", ts.line != null && ts.line !== "" ? `${ts.line} line` : ""].filter(Boolean).join(" · ")],
    ["Tình trạng da", cho?.tu_van_tinh_trang ?? ""], ["Ghi chú", (cho?.ghi_chu ?? buoi?.ghi_chu) ?? ""], ["Hẹn buổi kế tiếp", hen],
  ] as [string, string][]).filter(([, v]) => v);

  return (
    <main data-theme="light" className="mx-auto bg-white text-muc">
      <style>{`@media print{@page{size:${cuon ? `${giay.replace("mm", "")}mm auto` : giay};margin:${cuon ? "2mm" : "12mm"}}}`}</style>
      <div className="khong-in mx-auto mb-4 flex max-w-[760px] items-center justify-between gap-3 px-6 pt-8">
        <p className="text-[12.5px] text-muc-3">Phiếu làm dịch vụ · khổ giấy {giay} (đổi ở Cài đặt › Thiết lập in)</p>
        <NutIn kho={giay} />
      </div>
      <div className={`to-in mx-auto bg-white ${cuon ? "px-2 py-3 text-[11px]" : "px-6 py-8 text-[13px]"}`} style={{ width: "100%", maxWidth: BE_NGANG[giay] }}>
        <header className="text-center">
          <h1 className={`chu-tieu-de ${cuon ? "text-[15px]" : "text-[20px]"}`}>{CO_SO.ten}</h1>
          <p className="text-muc-2">{CO_SO.linhVuc} · Giấy phép {CO_SO.giayPhep}</p>
          {cn && <p className="text-muc-2">Chi nhánh: {cn.ten}{cn.dia_chi ? ` · ${cn.dia_chi}` : ""}</p>}
          <p className={`mt-3 font-bold uppercase tracking-wide ${cuon ? "text-[13px]" : "text-[16px]"}`}>Phiếu làm dịch vụ</p>
          <p className="text-muc-2">{ngayGioVN(luc)}{huy ? " · (Đã huỷ / trả lại)" : ""}</p>
        </header>
        <dl className="mt-3 grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: "auto 1fr" }}>
          {dong.map(([n, v]) => <div key={n} className="contents"><dt className="text-muc-2">{n}:</dt><dd className={`whitespace-pre-line [overflow-wrap:anywhere] ${n === "Khách hàng" || n === "Buổi" || n === "Dịch vụ làm" ? "font-semibold" : ""}`}>{v}</dd></div>)}
        </dl>
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div><p className="font-medium">Khách hàng</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>
          <div><p className="font-medium">Chuyên viên trị liệu</p><div className="h-12 border-b border-dashed border-vien-dam" /></div>
        </div>
      </div>
    </main>
  );
}
