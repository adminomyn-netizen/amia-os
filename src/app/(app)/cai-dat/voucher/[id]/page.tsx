import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { chuGiamGia } from "@/lib/voucher";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NUT_PHU } from "@/components/ui/dinh-dang";

/** Lịch sử sử dụng voucher (SalonHero: Lịch sử sử dụng): từng lượt dùng / hoàn (huỷ hoá đơn), hoá đơn, khách, mã, số tiền giảm. Chỉ đọc. */
export default async function LichSuVoucher({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = sb();
  const { data: v } = await db.from("voucher").select("*").eq("id", id).maybeSingle();
  if (!v || (nd.chiNhanhId && v.chi_nhanh_ids && !v.chi_nhanh_ids.includes(nd.chiNhanhId))) notFound();
  const [{ data: luot }, { data: ma }] = await Promise.all([
    db.from("voucher_luot_dung").select("*").eq("voucher_id", id).order("tao_luc", { ascending: false }).limit(2000),
    db.from("voucher_ma").select("id, ma").eq("voucher_id", id),
  ]);
  const idHd = [...new Set((luot ?? []).map((l) => l.hoa_don_id))], idKh = [...new Set((luot ?? []).map((l) => l.khach_id).filter((x): x is string => !!x))], idNv = [...new Set((luot ?? []).map((l) => l.nguoi_id).filter((x): x is string => !!x))];
  const [{ data: hd }, { data: kh }, { data: nv }] = await Promise.all([
    idHd.length ? db.from("hoa_don").select("id, ma").in("id", idHd.slice(0, 1000)) : Promise.resolve({ data: [] as { id: string; ma: string }[] }),
    idKh.length ? db.from("khach_hang").select("id, ho_ten, ma").in("id", idKh.slice(0, 1000)) : Promise.resolve({ data: [] as { id: string; ho_ten: string; ma: string }[] }),
    idNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
  ]);
  const mHd = new Map((hd ?? []).map((x) => [x.id, x.ma])), mKh = new Map((kh ?? []).map((x) => [x.id, x])), mNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten])), mMa = new Map((ma ?? []).map((x) => [x.id, x.ma]));
  const dung = (luot ?? []).filter((l) => l.loai === "dung"), hoan = (luot ?? []).filter((l) => l.loai === "hoan");
  const tienGiam = dung.reduce((s, l) => s + Number(l.so_tien), 0) - hoan.reduce((s, l) => s + Number(l.so_tien), 0);
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/cai-dat/voucher", nhan: "Voucher" }} tieuDe={`Lịch sử sử dụng: ${v.ten}`} phu={`${chuGiamGia(v)} · ${ngayVN(v.tu_ngay)} → ${ngayVN(v.den_ngay)}`}>
        <a href={`/api/xuat/voucher-ma?id=${id}`} className={`${NUT_PHU} inline-flex items-center`}>Xuất mã voucher</a>
      </TieuDeNoi>
      <HangChiSo muc={[{ nhan: "Lượt dùng", so: String(dung.length - hoan.length), ghiChu: hoan.length ? `${dung.length} lượt, ${hoan.length} lượt hoàn do huỷ đơn` : undefined }, { nhan: "Tổng tiền đã giảm", so: tienVN(tienGiam) }, { nhan: "Số lượng phát hành", so: String(v.so_luong) }]} />
      <div className="mt-4">
        <Bang noi duLieu={luot ?? []} khoa={(r) => String(r.id)} trong="Voucher chưa được dùng lần nào."
          cot={[
            { nhan: "Thời gian", hienThi: (r) => ngayGioVN(r.tao_luc) },
            { nhan: "Loại", hienThi: (r) => <NhanTrangThai kieu={r.loai === "dung" ? "tot" : "tram"}>{r.loai === "dung" ? "Dùng" : "Hoàn (huỷ đơn)"}</NhanTrangThai> },
            { nhan: "Mã", hienThi: (r) => <span className="tabular-nums">{mMa.get(r.ma_id) ?? ""}</span> },
            { nhan: "Hoá đơn", chinh: true, hienThi: (r) => <Link href={`/hoa-don/${r.hoa_don_id}`} className="text-muc hover:underline">{mHd.get(r.hoa_don_id) ?? "Hoá đơn"}</Link> },
            { nhan: "Khách hàng", hienThi: (r) => { const k = mKh.get(r.khach_id ?? ""); return k ? <Link href={`/khach-hang/${k.id}`} className="hover:underline">{k.ho_ten} · {k.ma}</Link> : "Khách lẻ"; } },
            { nhan: "Người thao tác", hienThi: (r) => mNv.get(r.nguoi_id ?? "") ?? "" },
            { nhan: "Tiền giảm", phai: true, hienThi: (r) => tienVN(r.so_tien) },
          ]} />
      </div>
    </div>
  );
}
