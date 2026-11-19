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
import { capTheTay, duKienHanThe, giaHanNhieuThe, thucHienBuoi } from "./actions";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";
import { docLocThe, goiTheoDichVu, TT_THE, tinhTrangCuaLoc } from "@/lib/the-loc";

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

export default async function TrangThe({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; het?: string; so?: string; tt?: string; dv?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const loc = docLocThe(sp);
  const tab = loc.tab;
  const db = sb();
  // Hiện TỪNG PHẦN: 50 thẻ mới nhất trước, bấm "Xem thêm" lấy thêm 50 (tối đa 1.000) — trang nhẹ, mở ngay.
  const so = Math.min(1000, Math.max(50, Math.floor(Number(sp.so) / 50) * 50 || 50));
  const goiIds = await goiTheoDichVu(loc.dv);
  let q = db.from("v_the_khach").select("*").eq("loai", tab).order("ngay_cap", { ascending: false }).order("id").limit(so + 1);
  if (nd.chiNhanhId || loc.cn) q = q.eq("chi_nhanh_id", nd.chiNhanhId ?? loc.cn);
  if (goiIds) q = q.in("goi_id", goiIds);
  // Tìm ở máy chủ trên TOÀN BỘ thẻ (mã thẻ, mã/tên/SĐT khách), không lọc trên 200 thẻ mới nhất.
  const tuKhoa = loc.q;
  if (tuKhoa) {
    const { data: kt } = await db.from("khach_hang").select("id").or(`ho_ten_khong_dau.ilike.%${boDau(tuKhoa)}%,dien_thoai.ilike.%${tuKhoa.replace(/^0/, "")}%,ma.ilike.%${tuKhoa}%`).limit(300);
    const ids = (kt ?? []).map((k) => k.id);
    q = q.or(ids.length ? `ma.ilike.%${tuKhoa}%,khach_id.in.(${ids.join(",")})` : `ma.ilike.%${tuKhoa}%`);
  }
  q = q.in("tinh_trang", tinhTrangCuaLoc(loc.tt));
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
  const thamLoc = { tab, tt: loc.tt, ...(loc.q ? { q: loc.q } : {}), ...(loc.dv ? { dv: loc.dv } : {}), ...(loc.cn ? { cn: loc.cn } : {}) };
  const lienKetThem = `/the?${new URLSearchParams({ ...thamLoc, so: String(so + 50) })}`;
  const lienKetXuat = `/api/xuat/the?${new URLSearchParams(thamLoc)}`;
  const { data: dsCn } = nd.chiNhanhId ? { data: [] as { id: string; ten: string }[] } : await db.from("chi_nhanh").select("id, ten").order("thu_tu").order("ma");
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
      <form action="/the" className="mb-2 flex flex-wrap items-end gap-3 text-[14px]">
        <input type="hidden" name="tab" value={tab} />
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-[12.5px] text-muc-3">Tìm khách / mã thẻ<input name="q" defaultValue={loc.q} placeholder="Mã thẻ, tên, SĐT khách" aria-label="Tìm thẻ" className="h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 text-[15px] text-muc outline-none focus:border-nhan" /></label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-[12.5px] text-muc-3">Dịch vụ / tên thẻ<input name="dv" defaultValue={loc.dv} placeholder="Vd: chăm sóc da, MFU" aria-label="Lọc theo dịch vụ hoặc tên thẻ" className="h-11 w-full rounded-nho border border-vien-dam bg-giay-sang px-3 text-[15px] text-muc outline-none focus:border-nhan" /></label>
        <label className="flex flex-col gap-1 text-[12.5px] text-muc-3">Tình trạng<select name="tt" defaultValue={loc.tt} aria-label="Tình trạng thẻ" className="h-11 rounded-nho border border-vien-dam bg-giay-sang px-3 text-[15px] text-muc">{TT_THE.map((t) => <option key={t.ma} value={t.ma}>{t.nhan}</option>)}</select></label>
        {!nd.chiNhanhId && (dsCn ?? []).length > 1 && <label className="flex flex-col gap-1 text-[12.5px] text-muc-3">Chi nhánh<select name="cn" defaultValue={loc.cn} aria-label="Chi nhánh" className="h-11 rounded-nho border border-vien-dam bg-giay-sang px-3 text-[15px] text-muc"><option value="">Tất cả</option>{(dsCn ?? []).map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select></label>}
        <button type="submit" className="nut-vang h-11 rounded-nho px-5 text-[14px] font-medium">Lọc</button>
        <a href={lienKetXuat} className="inline-flex h-11 items-center rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc-2 hover:bg-giay-tram">Xuất Excel</a>
      </form>
      <p className="mb-4 text-[12.5px] text-muc-3">Xuất Excel lấy đúng bộ lọc đang chọn, đủ mọi thẻ khớp (không giới hạn 50 thẻ): tên thẻ, dịch vụ, khách, SĐT, đã dùng/tổng buổi, lần dùng gần nhất, hạn dùng.</p>
      {ds.length === 0 ? <p className="py-10 text-center text-[14px] text-muc-3">Chưa có thẻ nào.</p> : (
        <LuoiThe>
          {ds.map((r) => { const k = tenK.get(r.khach_id ?? ""); return (
            <KhoiThe key={r.id} t={{ id: r.id ?? "", ma: r.ma ?? "", ten: tenGoi.get(r.goi_id ?? "") ?? (r.loai === "tien" ? "Thẻ tiền" : "Thẻ liệu trình"), loai: r.loai ?? "lan", tinhTrang: r.tinh_trang,
              buoiCon: Number(r.so_buoi_con ?? 0), buoiTong: r.so_buoi_tong == null ? null : Number(r.so_buoi_tong), soDu: Number(r.so_du_tien ?? 0), tongTien: r.tong_tien == null ? null : Number(r.tong_tien),
              ngayCap: r.ngay_cap, han: r.han_dung, khach: k ? { id: k.id, ten: k.ho_ten, ma: k.ma } : null, lanGan: bs.lanGan(r.id ?? ""), lichToi: bs.lichToi(r.khach_id), phuTrach: bs.phuTrach(r.khach_id) }}
              nut={<>{tab === "lan" && coQuyen(nd, "the.thuchien") && (r.tinh_trang === "hoat_dong" || r.tinh_trang === "sap_het") ? <NutBuoi theId={r.id ?? ""} nhanVien={nvLC} bacSi={bacSiLC} dichVu={dvCuaGoi(r.goi_id)} goiId={r.goi_id} tenThe={tenGoi.get(r.goi_id ?? "") ?? r.ma ?? ""} buoiCon={Number(r.so_buoi_con ?? 0)} buoiTong={r.so_buoi_tong == null ? null : Number(r.so_buoi_tong)} action={thucHienBuoi} truTrucTiep={duocTruBuoiTrucTiep(nd)} /> : null}
              {suaDuoc && r.trang_thai !== "thu_hoi" && <NutHop kieu="chu" nhan="Gia hạn" tieuDe={`Gia hạn thẻ ${r.ma ?? ""}`} moTa="Đặt ngày hết hạn mới cho thẻ. Không đổi số buổi / số dư / tiền. Ghi vào Lịch sử thẻ." an={{ ids: r.id ?? "" }} giaTri={{ han_moi: r.han_dung ?? "" }} truong={[{ ten: "han_moi", nhan: "Ngày hết hạn mới", loai: "ngay", batBuoc: true }, { ten: "ly_do", nhan: "Lý do (không bắt buộc)", loai: "chu", rong: true }]} nhanLuu="Gia hạn thẻ" action={giaHanNhieuThe} />}
              {suaDuoc && r.trang_thai !== "thu_hoi" && <NutSuaThe t={{ id: r.id ?? "", ma: r.ma ?? "", loai: r.loai ?? "lan", han_dung: r.han_dung, gia_tri_buoi: r.gia_tri_buoi, ghi_chu: r.ghi_chu }} maKhach={k?.ma ?? ""} nhan="Sửa" />}</>} />
          ); })}
        </LuoiThe>
      )}
      {conNua && <p className="mt-4 text-center text-[14px]"><Link href={lienKetThem} scroll={false} className="font-medium text-nhan-dam hover:underline">Xem thêm 50 thẻ</Link></p>}
    </>
  );
}
