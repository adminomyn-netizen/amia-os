import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { NHAN_PHUONG_THUC, PHUONG_THUC, VAI } from "@/lib/ban-hang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { huyHoaDon, thuNo } from "../actions";
import { TRANG_THAI_HD } from "../page";

export default async function ChiTietHoaDon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ moi?: string }> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const { id } = await params;
  const { moi } = await searchParams;
  const db = sb();
  const { data: h } = await db.from("hoa_don").select("*").eq("id", id).maybeSingle();
  if (!h || (nd.chiNhanhId && h.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: tt }, { data: nv }, { data: k }] = await Promise.all([
    db.from("hoa_don_dong").select("*").eq("hoa_don_id", id).order("tao_luc"),
    db.from("thanh_toan").select("*").eq("hoa_don_id", id).order("tao_luc"),
    db.from("nhan_vien").select("id, ho_ten"),
    h.khach_id ? db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("id", h.khach_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const idsDong = (dong ?? []).map((d) => d.id);
  const { data: chia } = idsDong.length ? await db.from("dong_nhan_vien").select("*").in("dong_id", idsDong) : { data: [] };
  const tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
  const t = TRANG_THAI_HD[h.trang_thai as keyof typeof TRANG_THAI_HD];
  const coNo = h.trang_thai === "hoan_thanh" && Number(h.con_no) > 0;

  return (
    <>
      <TieuDeTrang tieuDe={h.ma} phu={<span className="flex flex-wrap items-center gap-2"><NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai><span>{ngayVN(h.ngay_hd)} · lập bởi {tenNv.get(h.nguoi_lap_id)}</span>{k && <Link href={`/khach-hang/${k.id}`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten} · {k.ma}</Link>}</span>}>
        <Link href={`/in/hoa-don/${id}`} target="_blank" className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">In hoá đơn</Link>
        {coNo && coQuyen(nd.vaiTro, "no.thu") && (
          <NutHop nhan="Thu nợ" tieuDe="Thu nợ" moTa={`Còn nợ ${tienVN(h.con_no)}. Mỗi lần thu được ghi vào sổ thu tiền, không sửa lại được.`} an={{ hoa_don_id: id }} giaTri={{ phuong_thuc: "tien_mat", so_tien: Number(h.con_no), ngay: homNayHCM() }}
            truong={[{ ten: "phuong_thuc", nhan: "Phương thức", loai: "chon", luaChon: PHUONG_THUC.filter((p) => p.gia_tri !== "the_tien"), batBuoc: true }, { ten: "so_tien", nhan: "Số tiền thu", loai: "tien", batBuoc: true }, { ten: "ngay", nhan: "Ngày thu", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }]} action={thuNo} />
        )}
        {h.trang_thai !== "huy" && coQuyen(nd.vaiTro, "ban.huy") && (
          <NutHop kieu="phu" nhan="Huỷ hoá đơn" tieuDe="Huỷ hoá đơn" moTa="Huỷ sẽ hoàn lại các khoản đã thu (kể cả thẻ tiền), thu hồi thẻ đã bán và trả kho. Không huỷ được nếu thẻ đã được dùng." an={{ hoa_don_id: id }} nhanLuu="Huỷ hoá đơn"
            truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "nhieu_dong", batBuoc: true }]} action={huyHoaDon} />
        )}
      </TieuDeTrang>
      {moi === "1" && <p role="status" className="mb-5 rounded-nho bg-nhan-nhat px-3 py-2.5 text-[14px] text-nhan-dam">Đã chốt đơn {h.ma}.</p>}
      {h.trang_thai === "huy" && <p className="mb-5 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Đã huỷ ngày {ngayGioVN(h.huy_luc)}. Lý do: {h.ly_do_huy}</p>}
      <HangChiSo muc={[{ nhan: "Tiền hàng", so: tienVN(h.tong_hang) }, { nhan: "Phải thu", so: tienVN(h.tong_phai_thu) }, { nhan: "Đã thu", so: tienVN(h.da_thu) }, { nhan: "Còn nợ", so: tienVN(h.trang_thai === "huy" ? 0 : h.con_no) }]} />
      <div className="mt-8 space-y-8">
        <MucTrang tieuDe="Dòng hàng">
          <Bang duLieu={dong ?? []} khoa={(r) => r.id} cot={[
            { nhan: "Mục", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "SL", hienThi: (r) => r.so_luong, phai: true }, { nhan: "Đơn giá", hienThi: (r) => tienVN(r.don_gia), phai: true },
            { nhan: "Giảm", hienThi: (r) => (r.giam_gia ? tienVN(r.giam_gia) : ""), phai: true }, { nhan: "Thành tiền", hienThi: (r) => tienVN(r.thanh_tien), phai: true },
            { nhan: "Người hưởng", hienThi: (r) => VAI.map((v) => { const ds = (chia ?? []).filter((c) => c.dong_id === r.id && c.vai === v.ma); return ds.length ? `${v.ten}: ${ds.map((c) => `${tenNv.get(c.nhan_vien_id)} ${Number(c.ti_le)}%`).join(", ")}` : null; }).filter(Boolean).join(" · ") },
          ]} />
          <dl className="ml-auto mt-3 w-full max-w-xs space-y-1 text-[14px]">
            {Number(h.giam_gia_don) > 0 && <div className="flex justify-between"><dt className="text-muc-3">Giảm giá cả đơn</dt><dd className="tabular-nums">− {tienVN(h.giam_gia_don)}</dd></div>}
            {Number(h.vat_tien) > 0 && <div className="flex justify-between"><dt className="text-muc-3">VAT {Number(h.vat_pct)}%</dt><dd className="tabular-nums">{tienVN(h.vat_tien)}</dd></div>}
            {Number(h.phu_phi) > 0 && <div className="flex justify-between"><dt className="text-muc-3">Phụ phí</dt><dd className="tabular-nums">{tienVN(h.phu_phi)}</dd></div>}
            {Number(h.tip) > 0 && <div className="flex justify-between"><dt className="text-muc-3">Tip</dt><dd className="tabular-nums">{tienVN(h.tip)}</dd></div>}
          </dl>
        </MucTrang>
        <MucTrang tieuDe="Sổ thu tiền">
          <Bang duLieu={tt ?? []} khoa={(r) => r.id} trong="Chưa thu khoản nào." cot={[
            { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Loại", hienThi: (r) => (r.loai === "thu" ? "Thu" : "Hoàn") }, { nhan: "Phương thức", hienThi: (r) => NHAN_PHUONG_THUC[r.phuong_thuc] },
            { nhan: "Người thu", hienThi: (r) => tenNv.get(r.nguoi_id) ?? "" }, { nhan: "Ghi chú", hienThi: (r) => r.ghi_chu ?? "" },
            { nhan: "Số tiền", hienThi: (r) => <span className={r.loai === "hoan" ? "text-loi" : ""}>{r.loai === "hoan" ? "− " : ""}{tienVN(r.so_tien)}</span>, phai: true },
          ]} />
        </MucTrang>
        {h.ghi_chu && <MucTrang tieuDe="Ghi chú"><p className="whitespace-pre-line text-[14px] text-muc-2">{h.ghi_chu}</p></MucTrang>}
      </div>
    </>
  );
}
