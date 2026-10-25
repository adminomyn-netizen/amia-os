import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, tienVN, buoiConLai } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { NutBuoi } from "@/components/the/NutBuoi";
import { capTheTay, thucHienBuoi } from "./actions";

export const NHAN_TINH_TRANG: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  hoat_dong: { nhan: "Đang dùng", kieu: "tot" }, sap_het: { nhan: "Sắp hết", kieu: "cho" }, het_han: { nhan: "Hết hạn", kieu: "loi" },
  hoan_thanh: { nhan: "Đã dùng hết", kieu: "tram" }, khoa: { nhan: "Đang khoá", kieu: "cho" }, thu_hoi: { nhan: "Đã thu hồi", kieu: "loi" },
};
const TAB = [{ ma: "lan", ten: "Thẻ liệu trình" }, { ma: "tien", ten: "Thẻ tiền" }];

export default async function TrangThe({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; het?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const tab = sp.tab === "tien" ? "tien" : "lan";
  const db = sb();
  let q = db.from("v_the_khach").select("*").eq("loai", tab).order("ngay_cap", { ascending: false }).limit(200);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (sp.het !== "1") q = q.in("tinh_trang", ["hoat_dong", "sap_het", "khoa"]);
  const [{ data: the }, { data: goi }, { data: nv }, { data: dv }, { data: lk }] = await Promise.all([
    q, db.from("goi_the").select("id, ten, loai, so_buoi, gia_tri_the").eq("hoat_dong", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"), db.from("dich_vu").select("id, ten").eq("hoat_dong", true).order("ten"),
    db.from("goi_the_dich_vu").select("goi_id, dich_vu_id"),
  ]);
  const idsK = [...new Set((the ?? []).map((t) => t.khach_id))] as string[];
  const { data: ks } = idsK.length ? await db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").in("id", idsK) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k]));
  const tenGoi = new Map((goi ?? []).map((g) => [g.id, g.ten]));
  let ds = the ?? [];
  if (sp.q) { const t = sp.q.toLowerCase(); ds = ds.filter((x) => { const k = tenK.get(x.khach_id ?? ""); return (x.ma ?? "").toLowerCase().includes(t) || k?.ho_ten.toLowerCase().includes(t) || k?.dien_thoai.includes(t) || k?.ma.toLowerCase().includes(t); }); }
  const nvLC = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const bacSiLC = [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];

  return (
    <>
      <TieuDeTrang tieuDe="Thẻ liệu trình" phu="Mỗi lần khách làm: bấm Thực hiện buổi để trừ 1 buổi và ghi doanh thu của buổi. Mọi thay đổi đều có dòng lịch sử, không sửa số trực tiếp.">
        {coQuyen(nd.vaiTro, "the.dieuchinh") && (
          <NutHop kieu="phu" nhan="Cấp thẻ tay" tieuDe="Cấp thẻ tay" moTa="Dùng khi tặng thẻ hoặc chuyển thẻ còn buổi từ phần mềm cũ. Thẻ cấp tay không tính doanh thu." rong
            truong={[{ ten: "khach", nhan: "Khách (mã hoặc số điện thoại)", loai: "chu", batBuoc: true, rong: true }, { ten: "goi_id", nhan: "Gói thẻ", loai: "chon", batBuoc: true, rong: true, luaChon: (goi ?? []).map((g) => ({ gia_tri: g.id, nhan: `${g.ten} (${g.loai === "lan" ? `${g.so_buoi} buổi` : "thẻ tiền"})` })) },
              { ten: "so_buoi", nhan: "Số buổi còn lại (nếu khác gói)", loai: "so" }, { ten: "so_tien", nhan: "Số dư (thẻ tiền, nếu khác gói)", loai: "tien" }, { ten: "han_dung", nhan: "Hạn dùng", loai: "ngay" }, { ten: "ly_do", nhan: "Lý do cấp tay", loai: "chu", rong: true, batBuoc: true }]} action={capTheTay} />
        )}
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/the" />
      <div className="mb-4 flex flex-wrap items-center gap-4 text-[14px]">
        <form className="flex-1" action="/the"><input type="hidden" name="tab" value={tab} /><input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm mã thẻ, tên, SĐT khách (Enter)" aria-label="Tìm thẻ" className="h-11 w-full max-w-md rounded-nho border border-vien-dam bg-giay-sang px-3 text-[15px] outline-none focus:border-nhan" /></form>
        <Link href={`/the?tab=${tab}${sp.het === "1" ? "" : "&het=1"}`} className="font-medium text-nhan-dam hover:underline">{sp.het === "1" ? "Chỉ thẻ còn dùng" : "Hiện cả thẻ đã hết/hết hạn/thu hồi"}</Link>
      </div>
      <Bang duLieu={ds} khoa={(r) => r.id ?? ""} trong="Chưa có thẻ nào."
        cot={[
          { nhan: "Mã thẻ", hienThi: (r) => <Link href={`/the/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
          { nhan: "Khách", hienThi: (r) => { const k = tenK.get(r.khach_id ?? ""); return k ? <Link href={`/khach-hang/${k.id}`} className="text-muc hover:underline">{k.ho_ten}</Link> : ""; } },
          { nhan: "Gói", hienThi: (r) => tenGoi.get(r.goi_id ?? "") ?? "" },
          { nhan: "Còn lại", hienThi: (r) => (r.loai === "lan" ? buoiConLai(r.so_buoi_con, r.so_buoi_tong) : tienVN(r.so_du_tien)), phai: true },
          { nhan: "Hạn", hienThi: (r) => ngayVN(r.han_dung) || "Không hạn" },
          { nhan: "Tình trạng", hienThi: (r) => { const t = NHAN_TINH_TRANG[r.tinh_trang ?? "hoat_dong"]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
          ...(tab === "lan" && coQuyen(nd.vaiTro, "the.thuchien") ? [{ nhan: "", hienThi: (r: NonNullable<typeof the>[number]) => (r.tinh_trang === "hoat_dong" || r.tinh_trang === "sap_het") ? (
            <NutBuoi theId={r.id ?? ""} nhanVien={nvLC} bacSi={bacSiLC} dichVu={(lk ?? []).some((l) => l.goi_id === r.goi_id) ? (dv ?? []).filter((d) => (lk ?? []).some((l) => l.goi_id === r.goi_id && l.dich_vu_id === d.id)).map((d) => ({ gia_tri: d.id, nhan: d.ten })) : (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }))} action={thucHienBuoi} />) : null }] : []),
        ]} />
    </>
  );
}
