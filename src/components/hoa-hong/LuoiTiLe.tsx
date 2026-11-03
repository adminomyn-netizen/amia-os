import { tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { NutHop, type Truong } from "@/components/ui/BieuMau";

/** Lưới cài đặt hoa hồng kiểu SalonHero: nhân viên × sản phẩm / dịch vụ / thẻ, 3 cột HH tư vấn / bán hàng / làm dịch vụ.
 *  Mỗi ô hiện tỉ lệ ĐANG ÁP DỤNG cho người–mục đó theo đúng thứ tự thắng của hàm tính (nhân viên → nhóm chức danh → chung; mục cụ thể → cả loại),
 *  ô lấy từ cấp trên thì ghi rõ "theo …". Bấm Sửa = ghi dòng riêng cho đúng người/nhóm + mục đó (cùng hàm luuTiLe với danh sách). */

export type DongTl = { id: string; loai: string; vai: string; muc_id: string | null; nhan_vien_id: string | null; nhom_chuc_danh: string | null; ti_le: number; so_tien: number | null };
export type Muc = { id: string; ten: string; ma: string; loai: "dich_vu" | "san_pham" | "goi_the" };
export type DoiTuong = { ma: string; ten: string; nhom: string | null };

const VAI3 = [["tu_van", "HH tư vấn"], ["ban", "HH bán hàng"], ["phuc_vu", "HH làm dịch vụ"]] as const;
const NHAN_LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Thẻ / liệu trình" };
const TRUONG: Truong[] = [{ ten: "ti_le", nhan: "Tỉ lệ hoa hồng (%)", loai: "so" }, { ten: "so_tien", nhan: "Hoặc cộng số tiền cố định mỗi lượt (đồng)", loai: "tien", ghiChu: "Nhân với số lượng trên hoá đơn; có thể dùng cùng tỉ lệ." }];

/** Tỉ lệ đang áp dụng cho (đối tượng, mục, vai): trả dòng thắng + cấp nguồn. dt = "" (chung) | "nhom:<k>" | "nv:<id>". */
export function tiLeApDung(tl: DongTl[], dt: string, nhomCuaNv: string | null, muc: Muc, vai: string) {
  const kieu = dt.startsWith("nv:") ? "nv" : dt.startsWith("nhom:") ? "nhom" : "chung";
  const khoa = dt.slice(dt.indexOf(":") + 1);
  const nhom = kieu === "nhom" ? khoa : kieu === "nv" ? nhomCuaNv : null;
  const cap: { la: (r: DongTl) => boolean; ten: string }[] = [];
  if (kieu === "nv") cap.push({ la: (r) => r.nhan_vien_id === khoa, ten: "riêng" });
  if (nhom) cap.push({ la: (r) => !r.nhan_vien_id && r.nhom_chuc_danh === nhom, ten: kieu === "nhom" ? "riêng" : "nhóm" });
  cap.push({ la: (r) => !r.nhan_vien_id && !r.nhom_chuc_danh, ten: kieu === "chung" ? "riêng" : "chung" });
  for (const c of cap) {
    const cung = tl.filter((r) => r.vai === vai && r.loai === muc.loai && c.la(r));
    const theoMuc = cung.find((r) => r.muc_id === muc.id);
    if (theoMuc) return { dong: theoMuc, nguon: c.ten === "riêng" ? "" : `theo ${c.ten}` };
    const theoLoai = cung.find((r) => !r.muc_id);
    if (theoLoai) return { dong: theoLoai, nguon: c.ten === "riêng" ? "mặc định loại" : `theo ${c.ten}, mặc định loại` };
  }
  return null;
}

function O({ tl, dt, nhomNv, muc, vai, sua, luu }: { tl: DongTl[]; dt: string; nhomNv: string | null; muc: Muc; vai: string; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  const a = tiLeApDung(tl, dt, nhomNv, muc, vai);
  const so = a ? [Number(a.dong.ti_le) ? `${Number(a.dong.ti_le).toLocaleString("vi-VN")}%` : "", a.dong.so_tien ? tienVN(a.dong.so_tien) : ""].filter(Boolean).join(" + ") || "0%" : "0%";
  const rieng = !!a && a.nguon === "";
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className={`tabular-nums ${rieng ? "font-medium text-muc" : "text-muc-2"}`}>{so}</span>
      {a?.nguon ? <span className="text-[11px] text-muc-3">{a.nguon}</span> : !a ? <span className="text-[11px] text-muc-3">chưa cài</span> : null}
      {sua && <NutHop kieu="chu" nhan="Sửa" tieuDe={`Hoa hồng ${VAI3.find((v) => v[0] === vai)?.[1].slice(3) ?? ""} — ${muc.ten}`} truong={TRUONG} action={luu}
        an={{ doi_tuong: dt, loai: muc.loai, vai, muc_id: muc.id }} giaTri={{ ti_le: rieng ? Number(a!.dong.ti_le) : 0, so_tien: rieng ? a!.dong.so_tien ?? 0 : 0 }} />}
    </span>
  );
}

/** Lưới theo nhân viên/nhóm: hàng = mục (đã lọc), cột = 3 vai. */
export function LuoiTheoNhanVien({ tl, dt, nhomNv, muc, sua, luu }: { tl: DongTl[]; dt: string; nhomNv: string | null; muc: Muc[]; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  return (
    <Bang duLieu={muc} khoa={(r) => r.id} trong="Không có sản phẩm, dịch vụ, thẻ nào khớp bộ lọc."
      cot={[{ nhan: "Tên", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{r.ten}</span><span className="block text-[12px] text-muc-3">{[r.ma, NHAN_LOAI[r.loai]].filter(Boolean).join(" · ")}</span></span> },
        ...VAI3.map(([v, t]) => ({ nhan: t, phai: true, hienThi: (r: Muc) => <O tl={tl} dt={dt} nhomNv={nhomNv} muc={r} vai={v} sua={sua} luu={luu} /> }))]} />
  );
}

/** Lưới theo sản phẩm: hàng = đối tượng (chung, nhóm, nhân viên), cột = 3 vai của một mục. */
export function LuoiTheoSanPham({ tl, muc, doiTuong, sua, luu }: { tl: DongTl[]; muc: Muc; doiTuong: DoiTuong[]; sua: boolean; luu: (fd: FormData) => Promise<{ ok?: true; loi?: string }> }) {
  return (
    <Bang duLieu={doiTuong} khoa={(r) => r.ma || "chung"} trong="Không có nhân viên nào khớp bộ lọc."
      cot={[{ nhan: "Nhân viên / nhóm", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
        ...VAI3.map(([v, t]) => ({ nhan: t, phai: true, hienThi: (r: DoiTuong) => <O tl={tl} dt={r.ma} nhomNv={r.nhom} muc={muc} vai={v} sua={sua} luu={luu} /> }))]} />
  );
}
