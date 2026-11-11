import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen, duocTruBuoiTrucTiep } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { KhoiThe, LuoiThe } from "@/components/the/KhoiThe";
import { layBoSungThe } from "@/lib/the-bo-sung";
import { NutSuaThe } from "@/components/the/NutSuaThe";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutBuoi } from "@/components/the/NutBuoi";
import { capTheTay, duKienHanThe, thucHienBuoi } from "./actions";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";

/** Các ô của hộp Cấp thẻ tay (SalonHero "Cấp thẻ mới"): số lần / số tiền trong thẻ + đã dùng ban đầu, ngày cấp, hạn (trống = tự tính theo loại thẻ), số lượng cấp, lý do.
 *  Dùng chung ở /the và Khách dùng thẻ. Ô "Tại chi nhánh" cần danh sách chi nhánh nên thêm bằng truongCapThe(chiNhanh). */
export const TRUONG_CAP_THE: Truong[] = [
  { ten: "so_buoi", nhan: "Số lần (thẻ lần, nếu khác gói)", loai: "so" }, { ten: "da_dung_buoi", nhan: "Số lần đã dùng ban đầu", loai: "so", ghiChu: "Thẻ chuyển sang đang dùng dở: số lần khách đã làm." },
  { ten: "so_tien", nhan: "Số tiền trong thẻ (thẻ tiền, nếu khác gói)", loai: "tien" }, { ten: "da_dung_tien", nhan: "Số tiền đã dùng ban đầu", loai: "tien" },
  { ten: "ngay_cap", nhan: "Ngày cấp", loai: "ngay", ghiChu: "Bỏ trống = hôm nay." }, { ten: "han_dung", nhan: "Thời hạn thẻ (ngày hết hạn)", loai: "ngay", ghiChu: "Bỏ trống = tự tính: ngày cấp + số tháng, số ngày của loại thẻ." },
  { ten: "so_luong", nhan: "Số lượng cấp", loai: "so", goiY: "1", ghiChu: "Cấp nhiều thẻ giống nhau cho cùng khách (tối đa 20)." },
  { ten: "ly_do", nhan: "Lý do cấp tay", loai: "chu", rong: true, batBuoc: true },
];
/** Hộp Cấp thẻ đủ như SalonHero: các ô chung + "Tại chi nhánh" (bỏ trống = chi nhánh của khách). */
export function truongCapThe(chiNhanh: { id: string; ten: string }[]): Truong[] {
  const i = TRUONG_CAP_THE.findIndex((t) => t.ten === "so_luong");
  return [...TRUONG_CAP_THE.slice(0, i + 1), { ten: "chi_nhanh_id", nhan: "Tại chi nhánh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chi nhánh của khách" }, ...chiNhanh.map((c) => ({ gia_tri: c.id, nhan: c.ten }))] }, ...TRUONG_CAP_THE.slice(i + 1)];
}
const TAB = [{ ma: "lan", ten: "Thẻ liệu trình" }, { ma: "tien", ten: "Thẻ tiền" }];

export default async function TrangThe({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; het?: string; so?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const tab = sp.tab === "tien" ? "tien" : "lan";
  const db = sb();
  // Hiện TỪNG PHẦN: 50 thẻ mới nhất trước, bấm "Xem thêm" lấy thêm 50 (tối đa 1.000) — trang nhẹ, mở ngay.
  const so = Math.min(1000, Math.max(50, Math.floor(Number(sp.so) / 50) * 50 || 50));
  let q = db.from("v_the_khach").select("*").eq("loai", tab).order("ngay_cap", { ascending: false }).order("id").limit(so + 1);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  // Tìm ở máy chủ trên TOÀN BỘ thẻ (mã thẻ, mã/tên/SĐT khách), không lọc trên 200 thẻ mới nhất.
  const tuKhoa = (sp.q ?? "").trim().replace(/[%,()*\\]/g, " ").trim();
  if (tuKhoa) {
    const { data: kt } = await db.from("khach_hang").select("id").or(`ho_ten_khong_dau.ilike.%${boDau(tuKhoa)}%,dien_thoai.ilike.%${tuKhoa.replace(/^0/, "")}%,ma.ilike.%${tuKhoa}%`).limit(300);
    const ids = (kt ?? []).map((k) => k.id);
    q = q.or(ids.length ? `ma.ilike.%${tuKhoa}%,khach_id.in.(${ids.join(",")})` : `ma.ilike.%${tuKhoa}%`);
  }
  if (sp.het !== "1") q = q.in("tinh_trang", ["hoat_dong", "sap_het", "khoa"]);
  const [{ data: the }, { data: goi }, { data: nv }, { data: dv }, { data: lk }, { data: cnCap }] = await Promise.all([
    q, db.from("goi_the").select("id, ten, loai, so_buoi, gia_tri_the").eq("hoat_dong", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"), db.from("dich_vu").select("id, ten").eq("hoat_dong", true).order("ten"),
    db.from("goi_the_dich_vu").select("goi_id, dich_vu_id"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
  ]);
  const idsK = [...new Set((the ?? []).map((t) => t.khach_id))] as string[];
  const { data: ks } = idsK.length ? await db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").in("id", idsK) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k]));
  const tenGoi = new Map((goi ?? []).map((g) => [g.id, g.ten]));
  const conNua = (the ?? []).length > so, ds = (the ?? []).slice(0, so);
  const suaDuoc = coQuyen(nd, "the.dieuchinh");
  const bs = await layBoSungThe(ds.map((r) => ({ id: r.id ?? "", khach_id: r.khach_id, loai: r.loai })), nd.chiNhanhId);
  const lienKetThem = `/the?${new URLSearchParams({ tab, ...(sp.q ? { q: sp.q } : {}), ...(sp.het === "1" ? { het: "1" } : {}), so: String(so + 50) })}`;
  const nvLC = luaChonNhanVien(nv ?? []);
  const bacSiLC = [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  // Danh sách dịch vụ cho nút "Gửi chuyên viên làm": dựng MỘT lần cho mỗi gói (gói không gắn dịch vụ thì dùng chung một danh sách đủ) và dùng lại
  // đúng mảng đó cho mọi dòng — trước đây mỗi dòng dựng mảng mới ~230 dịch vụ × 200 thẻ, làm trang nặng ~5 MB.
  const dvDu = (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten })), dvTheoGoi = new Map<string, typeof dvDu>();
  for (const l of lk ?? []) { const d = (dv ?? []).find((x) => x.id === l.dich_vu_id); if (d) dvTheoGoi.set(l.goi_id, [...(dvTheoGoi.get(l.goi_id) ?? []), { gia_tri: d.id, nhan: d.ten }]); }
  // Thẻ có gói: CHỈ dịch vụ của gói (rỗng = gói chưa gắn dịch vụ → hộp gửi chính thẻ, chị Lâm 11/11/2026). Thẻ không có gói mới dùng cả danh mục.
  const KHONG_DV: typeof dvDu = [];
  const dvCuaGoi = (goiId: string | null) => (goiId ? dvTheoGoi.get(goiId) ?? KHONG_DV : dvDu);

  return (
    <>
      <TieuDeNoi tieuDe="Thẻ liệu trình" phu="Mỗi lần khách làm: bấm Gửi chuyên viên làm; chuyên viên trị liệu bấm Bắt đầu làm, tích bước, bấm Kết thúc mới trừ 1 buổi và ghi doanh thu của buổi. Mọi thay đổi đều có dòng lịch sử, không sửa số trực tiếp.">
        <Link href="/the/cho-lam" className="inline-flex h-10 items-center rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc-2 hover:bg-giay-tram">Khách chờ làm</Link>
        {coQuyen(nd, "the.dieuchinh") && (
          <NutHop kieu="phu" nhan="Cấp thẻ tay" tieuDe="Cấp thẻ tay" moTa="Dùng khi tặng thẻ hoặc chuyển thẻ còn buổi từ phần mềm cũ. Cấp thẻ tại màn hình này không tính vào doanh thu của chi nhánh; muốn tính doanh thu thì bán thẻ ở Thu ngân." rong
            thongTin={{ theoDoi: ["goi_id", "ngay_cap", "han_dung"], lay: duKienHanThe }}
            truong={[{ ten: "khach", nhan: "Khách (mã hoặc số điện thoại)", loai: "chu", batBuoc: true, rong: true }, { ten: "goi_id", nhan: "Gói thẻ", loai: "chon", batBuoc: true, rong: true, luaChon: (goi ?? []).map((g) => ({ gia_tri: g.id, nhan: `${g.ten} (${g.loai === "lan" ? `${g.so_buoi} buổi` : "thẻ tiền"})` })) },
              ...truongCapThe((cnCap ?? []).filter((c) => !nd.chiNhanhId || c.id === nd.chiNhanhId))]} action={capTheTay} />
        )}
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc="/the" />
      <div className="mb-4 flex flex-wrap items-center gap-4 text-[14px]">
        <form className="flex-1" action="/the"><input type="hidden" name="tab" value={tab} /><input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm mã thẻ, tên, SĐT khách (Enter)" aria-label="Tìm thẻ" className="h-11 w-full max-w-md rounded-nho border border-vien-dam bg-giay-sang px-3 text-[15px] outline-none focus:border-nhan" /></form>
        <Link href={`/the?tab=${tab}${sp.het === "1" ? "" : "&het=1"}`} className="font-medium text-nhan-dam hover:underline">{sp.het === "1" ? "Chỉ thẻ còn dùng" : "Hiện cả thẻ đã hết/hết hạn/thu hồi"}</Link>
      </div>
      {ds.length === 0 ? <p className="py-10 text-center text-[14px] text-muc-3">Chưa có thẻ nào.</p> : (
        <LuoiThe>
          {ds.map((r) => { const k = tenK.get(r.khach_id ?? ""); return (
            <KhoiThe key={r.id} t={{ id: r.id ?? "", ma: r.ma ?? "", ten: tenGoi.get(r.goi_id ?? "") ?? (r.loai === "tien" ? "Thẻ tiền" : "Thẻ liệu trình"), loai: r.loai ?? "lan", tinhTrang: r.tinh_trang,
              buoiCon: Number(r.so_buoi_con ?? 0), buoiTong: r.so_buoi_tong == null ? null : Number(r.so_buoi_tong), soDu: Number(r.so_du_tien ?? 0), tongTien: r.tong_tien == null ? null : Number(r.tong_tien),
              ngayCap: r.ngay_cap, han: r.han_dung, khach: k ? { id: k.id, ten: k.ho_ten, ma: k.ma } : null, lanGan: bs.lanGan(r.id ?? ""), lichToi: bs.lichToi(r.khach_id), phuTrach: bs.phuTrach(r.khach_id) }}
              nut={<>{tab === "lan" && coQuyen(nd, "the.thuchien") && (r.tinh_trang === "hoat_dong" || r.tinh_trang === "sap_het") ? <NutBuoi theId={r.id ?? ""} nhanVien={nvLC} bacSi={bacSiLC} dichVu={dvCuaGoi(r.goi_id)} goiId={r.goi_id} tenThe={tenGoi.get(r.goi_id ?? "") ?? r.ma ?? ""} buoiCon={Number(r.so_buoi_con ?? 0)} buoiTong={r.so_buoi_tong == null ? null : Number(r.so_buoi_tong)} action={thucHienBuoi} truTrucTiep={duocTruBuoiTrucTiep(nd)} /> : null}
              {suaDuoc && r.trang_thai !== "thu_hoi" && <NutSuaThe t={{ id: r.id ?? "", ma: r.ma ?? "", loai: r.loai ?? "lan", han_dung: r.han_dung, gia_tri_buoi: r.gia_tri_buoi, ghi_chu: r.ghi_chu }} maKhach={k?.ma ?? ""} nhan="Sửa" />}</>} />
          ); })}
        </LuoiThe>
      )}
      {conNua && <p className="mt-4 text-center text-[14px]"><Link href={lienKetThem} scroll={false} className="font-medium text-nhan-dam hover:underline">Xem thêm 50 thẻ</Link></p>}
    </>
  );
}
