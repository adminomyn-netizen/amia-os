import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { docSoTien } from "@/lib/phieu-thu";
import { BangIn, khoGiayIn, ToInChung } from "@/components/in/ToInChung";

/** Phiếu nhập kho còn nợ nhà cung cấp (SalonHero mẫu in phiếu nhập có công nợ NCC): theo một đơn mua — hàng đã nhận, giá trị nhận, công nợ NCC hiện tại. Chỉ đọc. */
export default async function InPhieuNhapNcc({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = sb();
  const { data: don } = await db.from("don_mua").select("*").eq("id", id).maybeSingle();
  if (!don || (nd.chiNhanhId && don.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: ncc }, { data: no }, { data: cn }, { data: soCai }, giay] = await Promise.all([
    db.from("don_mua_dong").select("*").eq("don_mua_id", id).order("id"),
    db.from("nha_cung_cap").select("ten, ma, dien_thoai, dia_chi").eq("id", don.ncc_id).maybeSingle(),
    db.from("v_cong_no_ncc").select("con_no").eq("ncc_id", don.ncc_id).maybeSingle(),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", don.chi_nhanh_id).maybeSingle(),
    db.from("ncc_so_cai").select("loai, so_tien").eq("don_mua_id", id),
    khoGiayIn(don.chi_nhanh_id),
  ]);
  const idSp = [...new Set((dong ?? []).map((d) => d.san_pham_id))];
  const { data: sp } = idSp.length ? await db.from("san_pham").select("id, ten, ma, don_vi").in("id", idSp) : { data: [] as { id: string; ten: string; ma: string; don_vi: string }[] };
  const tenSp = new Map((sp ?? []).map((s) => [s.id, s]));
  const nhan = (dong ?? []).filter((d) => Number(d.da_nhan) > 0);
  const giaTri = nhan.reduce((s, d) => s + Math.round(Number(d.da_nhan) * Number(d.don_gia)), 0);
  const ghiNo = (soCai ?? []).filter((x) => x.loai === "hoa_don").reduce((s, x) => s + Number(x.so_tien), 0);
  const daTra = -(soCai ?? []).filter((x) => x.loai === "thanh_toan").reduce((s, x) => s + Number(x.so_tien), 0);
  const conNoDon = Math.max(ghiNo - daTra, 0);
  return (
    <ToInChung giay={giay} tieuDe="Phiếu nhập kho" chiNhanh={cn} kyTen={["Người giao hàng", "Thủ kho", "Kế toán"]}
      phu={<p>Theo đơn mua {don.ma} · ngày đặt {ngayVN(don.ngay_dat)}</p>}>
      <dl className="mb-3 grid gap-x-2 gap-y-0.5" style={{ gridTemplateColumns: "auto 1fr" }}>
        <dt className="text-muc-2">Nhà cung cấp:</dt><dd className="font-semibold">{ncc?.ten ?? ""}{ncc?.ma ? ` (${ncc.ma})` : ""}</dd>
        {ncc?.dien_thoai && <><dt className="text-muc-2">Điện thoại:</dt><dd>{ncc.dien_thoai}</dd></>}
        {ncc?.dia_chi && <><dt className="text-muc-2">Địa chỉ:</dt><dd>{ncc.dia_chi}</dd></>}
        {don.ghi_chu && <><dt className="text-muc-2">Ghi chú:</dt><dd className="whitespace-pre-line">{don.ghi_chu}</dd></>}
      </dl>
      <BangIn cot={[{ nhan: "Hàng" }, { nhan: "SL nhận", phai: true }, { nhan: "Đơn giá", phai: true }, { nhan: "Thành tiền", phai: true }]}
        dong={nhan.map((d) => { const s = tenSp.get(d.san_pham_id); return [`${s?.ten ?? ""}${s?.ma ? ` · ${s.ma}` : ""}`, `${soVN(d.da_nhan)} ${s?.don_vi ?? ""}`, soVN(d.don_gia), soVN(Math.round(Number(d.da_nhan) * Number(d.don_gia)))]; })}
        cuoi={["Tổng giá trị nhận", "", "", soVN(giaTri)]} />
      {nhan.length === 0 && <p className="py-4 text-center text-muc-3">Đơn chưa nhận hàng.</p>}
      <dl className="mt-3 grid gap-x-2 gap-y-0.5" style={{ gridTemplateColumns: "auto 1fr" }}>
        <dt className="text-muc-2">Bằng chữ:</dt><dd>{docSoTien(giaTri)}</dd>
        <dt className="text-muc-2">Đã trả cho đơn này:</dt><dd className="text-right tabular-nums">{tienVN(daTra)}</dd>
        <dt className="text-muc-2">Còn nợ theo đơn này:</dt><dd className="text-right font-bold tabular-nums">{tienVN(conNoDon)}</dd>
        <dt className="text-muc-2">Tổng nợ NCC hiện tại:</dt><dd className="text-right tabular-nums">{tienVN(Number(no?.con_no ?? 0))}</dd>
      </dl>
    </ToInChung>
  );
}
