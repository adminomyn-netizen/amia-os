import Link from "next/link";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { NHAN_TRANG_THAI_LICH } from "@/lib/khach";
import { PHUONG_THUC_VN } from "@/lib/bao-cao-gap";
import { maPhieuThu } from "@/lib/phieu-thu";
import { Bang } from "@/components/ui/Table";
import { NgayChon } from "@/components/ui/NgayChon";

const MOI_TRANG = 20;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const VAI: Record<string, string> = { phuc_vu: "phục vụ", tu_van: "tư vấn", ban: "bán" };
export type ThamSoLichSu = { tu?: string; den?: string; hd?: string; the?: string; lh?: string; bt?: string; tt?: string };

/** Trang hiện tại (1…) của một mục, lấy từ địa chỉ. */
const soTrang = (v?: string) => Math.max(1, Math.min(10_000, Number(v) || 1));

/** Tab "Lịch sử giao dịch" của hồ sơ khách: hoá đơn, lịch sử dùng thẻ, buổi đã thực hiện, lịch hẹn.
 *  Dùng thẻ = dòng dịch vụ trên hoá đơn SalonHero có mã thẻ (the_khach_sh_id, giá 0 — trừ vào thẻ) hoặc loại gốc "SERVICE:USING" (có dòng không ghi mã thẻ).
 *  Mỗi mục phân trang riêng (20 dòng), chung một khoảng ngày. Chỉ đọc. */
export async function LichSuGiaoDich({ khachId, t }: { khachId: string; t: ThamSoLichSu }) {
  const db = sb();
  const tu = t.tu && NGAY.test(t.tu) ? t.tu : "";
  const den = t.den && NGAY.test(t.den) ? t.den : "";
  const [pHd, pThe, pLh, pBt, pTt] = [soTrang(t.hd), soTrang(t.the), soTrang(t.lh), soTrang(t.bt), soTrang(t.tt)];
  const r = (p: number) => [(p - 1) * MOI_TRANG, p * MOI_TRANG - 1] as const;

  let qHd = db.from("hoa_don").select("id, ma, sh_ma, ngay_hd, trang_thai, tong_phai_thu, da_thu, con_no", { count: "exact" }).eq("khach_id", khachId);
  let qBt = db.from("buoi_thuc_hien").select("id, ngay_lam, dich_vu_id, the_id, nv_thuc_hien_id, trang_thai, doanh_thu_buoi", { count: "exact" }).eq("khach_id", khachId);
  let qLh = db.from("lich_hen").select("id, bat_dau, trang_thai, dich_vu_ten, nhan_vien_ten, lich_hen_dich_vu(dich_vu_id)", { count: "exact" }).eq("khach_id", khachId);
  // Dùng thẻ: lấy mã các hoá đơn (không huỷ) của khách trong khoảng ngày trước (tối đa ~200/khách), rồi mới lọc dòng —
  // lọc thẳng qua bảng cha làm CSDL quét cả ~70 nghìn dòng hoá đơn và hết giờ chờ.
  let qIdHd = db.from("hoa_don").select("id").eq("khach_id", khachId).neq("trang_thai", "huy");
  if (tu) { qHd = qHd.gte("ngay_hd", tu); qIdHd = qIdHd.gte("ngay_hd", tu); qBt = qBt.gte("ngay_lam", tu); qLh = qLh.gte("bat_dau", `${tu}T00:00:00+07:00`); }
  if (den) { qHd = qHd.lte("ngay_hd", den); qIdHd = qIdHd.lte("ngay_hd", den); qBt = qBt.lte("ngay_lam", den); qLh = qLh.lte("bat_dau", `${den}T23:59:59.999+07:00`); }

  const { data: idHd } = await qIdHd.limit(1000);
  const dsIdHd = (idHd ?? []).map((x) => x.id);
  const qThe = db.from("hoa_don_dong").select("id, ten, the_khach_sh_id, hoa_don(id, ma, sh_ma, ngay_hd), dong_nhan_vien(vai, nhan_vien_id)", { count: "exact" })
    .in("hoa_don_id", dsIdHd.length ? dsIdHd : ["00000000-0000-0000-0000-000000000000"]).neq("loai", "san_pham").or("the_khach_sh_id.not.is.null,loai_goc.eq.SERVICE:USING");
  // Các lần trả tiền (như mục "Thanh toán" trong hồ sơ SalonHero): từng phiếu thu của các hoá đơn của khách, kể cả dòng đảo khi huỷ/sửa.
  const qTt = db.from("thanh_toan").select("id, ngay, tao_luc, la_lich_su, so_tien, phuong_thuc, ngan_hang, so_phieu, dao_cua_id, ghi_chu, nguoi_id, hoa_don(id, ma, sh_ma)", { count: "exact" })
    .in("hoa_don_id", dsIdHd.length ? dsIdHd : ["00000000-0000-0000-0000-000000000000"]);
  const [hd, the, bt, lh, { data: dvAll }, tt] = await Promise.all([
    qHd.order("ngay_hd", { ascending: false }).order("id").range(...r(pHd)),
    // Sắp theo ngày hoá đơn (bảng cha, quan hệ nhiều-một) — PostgREST cho phép order=hoa_don(ngay_hd).
    qThe.order("hoa_don(ngay_hd)", { ascending: false }).order("id").range(...r(pThe)),
    qBt.order("ngay_lam", { ascending: false }).order("id").range(...r(pBt)),
    qLh.order("bat_dau", { ascending: false }).order("id").range(...r(pLh)),
    db.from("dich_vu").select("id, ten"),
    qTt.order("ngay", { ascending: false }).order("tao_luc", { ascending: false }).order("id").range(...r(pTt)),
  ]);
  for (const [ten, kq] of [["hoa_don", hd], ["dung_the", the], ["buoi", bt], ["lich_hen", lh], ["thanh_toan", tt]] as const) if (kq.error) console.error("[lich-su-khach]", ten, kq.error.code, kq.error.message);
  const loiDoc = [hd, the, bt, lh, tt].some((x) => x.error);
  type DongTt = { id: string; ngay: string; tao_luc: string; la_lich_su: boolean; so_tien: number; phuong_thuc: string; ngan_hang: string | null; so_phieu: number; dao_cua_id: string | null; ghi_chu: string | null; nguoi_id: string; hoa_don: { id: string; ma: string; sh_ma: string | null } };
  const dongTt = (tt.data ?? []) as unknown as DongTt[];
  type DongThe = { id: string; ten: string; the_khach_sh_id: number | null; hoa_don: { id: string; ma: string; sh_ma: string | null; ngay_hd: string }; dong_nhan_vien: { vai: string; nhan_vien_id: string }[] };
  const dongThe = (the.data ?? []) as unknown as DongThe[];

  // Người làm nhiều người của buổi (0321): buổi cũ không có dòng thì dùng người chính.
  const idBt = (bt.data ?? []).map((b) => b.id);
  const { data: bnv } = idBt.length ? await db.from("buoi_nhan_vien").select("buoi_id, nhan_vien_id, thu_tu").eq("vai", "thuc_hien").in("buoi_id", idBt).order("thu_tu") : { data: [] as { buoi_id: string; nhan_vien_id: string; thu_tu: number }[] };
  const nguoiBt = (b: { id: string; nv_thuc_hien_id: string }) => { const ds = (bnv ?? []).filter((x) => x.buoi_id === b.id).map((x) => x.nhan_vien_id); return ds.length ? ds : [b.nv_thuc_hien_id]; };
  // Tên nhân viên (kể cả người đã nghỉ) và mã thẻ của đúng các dòng đang hiện.
  const idNv = [...new Set([...dongThe.flatMap((d) => d.dong_nhan_vien.map((n) => n.nhan_vien_id)), ...(bt.data ?? []).flatMap((b) => nguoiBt(b)), ...dongTt.map((x) => x.nguoi_id)])];
  const shThe = [...new Set(dongThe.map((d) => d.the_khach_sh_id).filter((x): x is number => x != null))];
  const [{ data: nv }, { data: theKh }] = await Promise.all([
    idNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
    shThe.length ? db.from("the_khach").select("id, ma, sh_id").in("sh_id", shThe) : Promise.resolve({ data: [] as { id: string; ma: string; sh_id: number | null }[] }),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const theTheoSh = new Map((theKh ?? []).map((x) => [x.sh_id, x]));
  const tenDv = new Map((dvAll ?? []).map((d) => [d.id, d.ten]));

  /** Địa chỉ giữ nguyên khoảng ngày + trang các mục khác, chỉ đổi trang của mục `muc`. */
  const lk = (muc: keyof ThamSoLichSu, p: number) => {
    const u = new URLSearchParams({ tab: "lich-su" });
    for (const [k, v] of Object.entries({ tu, den, hd: String(pHd), the: String(pThe), lh: String(pLh), bt: String(pBt), tt: String(pTt), [muc]: String(p) })) if (v && v !== "1") u.set(k, v);
    return `/khach-hang/${khachId}?${u}`;
  };
  const phanTrang = (muc: keyof ThamSoLichSu, p: number, tong: number | null, nhan: string) => {
    const n = Math.max(1, Math.ceil((tong ?? 0) / MOI_TRANG));
    if (n <= 1) return null;
    return (
      <nav aria-label={`Trang ${nhan}`} className="mt-3 flex items-center justify-between gap-3 text-[13px]">
        {p > 1 ? <Link scroll={false} href={lk(muc, p - 1)} className="font-medium text-nhan-dam hover:underline">← Trang trước</Link> : <span />}
        <span className="tabular-nums">Trang {p}/{n} · {(tong ?? 0).toLocaleString("vi-VN")} dòng</span>
        {p < n ? <Link scroll={false} href={lk(muc, p + 1)} className="font-medium text-nhan-dam hover:underline">Trang sau →</Link> : <span />}
      </nav>
    );
  };

  return (
    <div className="space-y-8">
      <form method="get" className="flex flex-wrap items-end gap-2.5" aria-label="Lọc lịch sử theo ngày">
        <input type="hidden" name="tab" value="lich-su" />
        <label className="grid gap-1 text-[12px] text-muc-3">Từ ngày<NgayChon ten="tu" giaTriMacDinh={tu} ariaLabel="Từ ngày" tuNam={2015} className="w-[150px]" /></label>
        <label className="grid gap-1 text-[12px] text-muc-3">Đến ngày<NgayChon ten="den" giaTriMacDinh={den} ariaLabel="Đến ngày" tuNam={2015} className="w-[150px]" /></label>
        <button type="submit" className="nut-vang h-9 rounded-nho px-4 text-[13px]">Lọc</button>
        {(tu || den) && <Link scroll={false} href={`/khach-hang/${khachId}?tab=lich-su`} className="flex h-9 items-center text-[13px] font-medium text-nhan-dam hover:underline">Bỏ lọc ngày</Link>}
      </form>

      {loiDoc && <p role="alert" className="rounded-nho bg-canh-bao-nen px-3 py-2 text-[13px] text-canh-bao">Có mục chưa tải được (hệ thống đang chậm). Tải lại trang để thử lại.</p>}
      <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Hoá đơn</h3>
        <Bang duLieu={hd.data ?? []} khoa={(x) => x.id} trong="Không có hoá đơn trong khoảng này." cot={[
          { nhan: "Mã", chinh: true, hienThi: (x) => <Link className="font-medium text-nhan-dam hover:underline" href={`/hoa-don/${x.id}`}>{x.sh_ma ?? x.ma}</Link> }, { nhan: "Ngày", hienThi: (x) => ngayVN(x.ngay_hd) },
          { nhan: "Trạng thái", hienThi: (x) => ({ nhap: "Nháp", hoan_thanh: "Hoàn thành", huy: "Đã huỷ" } as Record<string, string>)[x.trang_thai] },
          { nhan: "Phải thu", hienThi: (x) => tienVN(x.tong_phai_thu), phai: true }, { nhan: "Đã thu", hienThi: (x) => tienVN(x.da_thu), phai: true }, { nhan: "Còn nợ", hienThi: (x) => (x.trang_thai === "hoan_thanh" ? tienVN(x.con_no) : ""), phai: true },
        ]} />
        {phanTrang("hd", pHd, hd.count, "hoá đơn")}</section>

      <section><h3 className="mb-1 text-[15px] font-semibold text-muc">Các lần trả tiền</h3>
        <p className="mb-2 text-[13px] text-muc-3">Mỗi dòng là một phiếu thu của hoá đơn (trả lần đầu, trả nợ, trả bằng thẻ tiền); dòng số âm là phiếu đảo khi huỷ hoặc sửa hoá đơn.</p>
        <Bang duLieu={dongTt} khoa={(x) => x.id} trong="Không có lần trả tiền nào trong khoảng này." cot={[
          // Phiếu chuyển từ SalonHero: giờ tạo là lúc chuyển dữ liệu, nên chỉ hiện ngày thu gốc.
          { nhan: "Thời gian", chinh: true, hienThi: (x) => <span className="tabular-nums">{x.la_lich_su ? ngayVN(x.ngay) : ngayGioVN(x.tao_luc)}</span> },
          { nhan: "Phiếu", hienThi: (x) => <span className="tabular-nums">{maPhieuThu(x.so_phieu)}</span> },
          { nhan: "Hoá đơn", hienThi: (x) => <Link className="text-nhan-dam hover:underline" href={`/hoa-don/${x.hoa_don.id}`}>{x.hoa_don.sh_ma ?? x.hoa_don.ma}</Link> },
          { nhan: "Hình thức", hienThi: (x) => [PHUONG_THUC_VN[x.phuong_thuc] ?? x.phuong_thuc, x.ngan_hang].filter(Boolean).join(" · ") + (x.dao_cua_id ? " (đảo)" : "") },
          { nhan: "Người thu", hienThi: (x) => tenNv.get(x.nguoi_id) ?? "" },
          { nhan: "Số tiền", hienThi: (x) => tienVN(x.so_tien), phai: true },
        ]} />
        {phanTrang("tt", pTt, tt.count, "lần trả tiền")}</section>

      <section><h3 className="mb-1 text-[15px] font-semibold text-muc">Lịch sử dùng thẻ</h3>
        <p className="mb-2 text-[13px] text-muc-3">Mỗi dòng là một lần trừ buổi trên thẻ, lấy từ hoá đơn sử dụng dịch vụ.</p>
        <Bang duLieu={dongThe} khoa={(x) => x.id} trong="Không có lần dùng thẻ nào trong khoảng này." cot={[
          { nhan: "Ngày", chinh: true, hienThi: (x) => ngayVN(x.hoa_don.ngay_hd) },
          { nhan: "Dịch vụ", hienThi: (x) => x.ten },
          { nhan: "Thẻ", hienThi: (x) => { const th = x.the_khach_sh_id != null ? theTheoSh.get(x.the_khach_sh_id) : undefined; return th ? <Link className="font-medium text-nhan-dam hover:underline" href={`/the/${th.id}`}>{th.ma}</Link> : "Chưa rõ thẻ"; } },
          { nhan: "Nhân viên", hienThi: (x) => <span className="text-[13px]">{x.dong_nhan_vien.map((n) => `${tenNv.get(n.nhan_vien_id) ?? "—"} (${VAI[n.vai] ?? n.vai})`).join(", ")}</span> },
          { nhan: "Hoá đơn", hienThi: (x) => <Link className="text-nhan-dam hover:underline" href={`/hoa-don/${x.hoa_don.id}`}>{x.hoa_don.sh_ma ?? x.hoa_don.ma}</Link> },
        ]} />
        {phanTrang("the", pThe, the.count, "dùng thẻ")}</section>

      {((bt.count ?? 0) > 0 || pBt > 1) && <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Buổi đã thực hiện</h3>
        <Bang duLieu={bt.data ?? []} khoa={(x) => x.id} trong="Không có buổi nào trong khoảng này." cot={[
          { nhan: "Ngày", hienThi: (x) => ngayVN(x.ngay_lam) }, { nhan: "Dịch vụ", hienThi: (x) => tenDv.get(x.dich_vu_id) ?? "" }, { nhan: "Người làm", hienThi: (x) => nguoiBt(x).map((n) => tenNv.get(n) ?? "").filter(Boolean).join(", ") },
          { nhan: "Trạng thái", hienThi: (x) => (x.trang_thai === "da_lam" ? "Đã làm" : "Đã huỷ") }, { nhan: "Doanh thu buổi", hienThi: (x) => tienVN(x.doanh_thu_buoi), phai: true },
        ]} />
        {phanTrang("bt", pBt, bt.count, "buổi")}</section>}

      <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Lịch hẹn</h3>
        <Bang duLieu={lh.data ?? []} khoa={(x) => x.id} trong="Không có lịch hẹn trong khoảng này." cot={[
          { nhan: "Giờ hẹn", chinh: true, hienThi: (x) => ngayGioVN(x.bat_dau) },
          { nhan: "Dịch vụ", hienThi: (x) => (x.lich_hen_dich_vu ?? []).map((d) => tenDv.get(d.dich_vu_id) ?? "").filter(Boolean).join(", ") || (x.dich_vu_ten ?? "") },
          { nhan: "Nhân viên", hienThi: (x) => x.nhan_vien_ten ?? "" },
          { nhan: "Trạng thái", hienThi: (x) => NHAN_TRANG_THAI_LICH[x.trang_thai] ?? x.trang_thai },
        ]} />
        {phanTrang("lh", pLh, lh.count, "lịch hẹn")}</section>
    </div>
  );
}
