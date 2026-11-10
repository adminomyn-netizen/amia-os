import Link from "next/link";
import { sb } from "@/lib/db";
import { boDau, congNgay, gioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { LocKho } from "@/components/bao-cao/LocKho";
import type { LuaChon } from "@/components/ui/Chon";
import { layThoiGianDichVu, type DongBaoCaoThoiGian } from "@/lib/qua-gio-du-lieu";
import { nhanPhut } from "@/lib/qua-gio";

const TOI_DA_NGAY = 31, MOI_TRANG = 30;
const href = (goc: Record<string, string | undefined>) => `/bao-cao?${new URLSearchParams(Object.entries(goc).filter((e): e is [string, string] => !!e[1])).toString()}`;
const TieuDeMuc = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 mt-6 text-[15px] font-medium text-muc">{children}</h2>;
const chip = (dang: boolean) => `shrink-0 rounded-nho px-3 py-1.5 text-[13px] ${dang ? "bg-nhan text-white" : "border border-vien-dam text-muc-2 hover:bg-giay-tram"}`;

/** Ô "Quá giờ": đỏ khi quá, "Đúng giờ" khi không quá, "—" khi thiếu mốc. */
function OQua({ r }: { r: DongBaoCaoThoiGian }) {
  if (r.qua === null) return <span className="text-muc-3">—</span>;
  if (r.qua === 0) return <span className="text-muc-2">{r.dangLam ? "Chưa quá" : "Đúng giờ"}</span>;
  return <span className="font-semibold text-loi">{nhanPhut(r.qua)}</span>;
}

/** Báo cáo Thời gian dịch vụ (chị Lâm + chị Thuý 10/11/2026): mỗi ca đang làm / đã xong trong khoảng ngày, giờ bắt đầu – kết thúc thực tế,
 *  thời lượng chuẩn (theo danh mục dịch vụ) và số phút quá giờ; tổng hợp ca quá giờ theo chuyên viên trị liệu. */
export async function BaoCaoThoiGianDv({ tu, den, cn, chiNhanh, nv, dv, q, chiQua, trang }: {
  tu: string; den: string; cn?: string; chiNhanh?: LuaChon[]; nv?: string; dv?: string; q?: string; chiQua: boolean; trang: number;
}) {
  const quaDai = congNgay(tu, TOI_DA_NGAY - 1) < den, tuDung = quaDai ? congNgay(den, -(TOI_DA_NGAY - 1)) : tu;
  const db = sb();
  let qNv = db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten");
  if (cn) qNv = qNv.eq("chi_nhanh_id", cn);
  const [tatCa, { data: dsNv }, { data: dsDv }] = await Promise.all([
    layThoiGianDichVu({ tu: tuDung, den, cn, nv, dv }),
    qNv,
    db.from("dich_vu").select("id, ten").eq("hoat_dong", true).order("ten"),
  ]);
  const tim = q?.trim() ? boDau(q.trim()) : "";
  const theoTim = tim ? tatCa.filter((r) => boDau(`${r.khach} ${r.dichVu} ${r.nguoiLam}`).includes(tim)) : tatCa;
  const duGio = theoTim.filter((r) => r.qua !== null);
  const caQua = duGio.filter((r) => (r.qua ?? 0) > 0);
  const tongQua = caQua.reduce((s, r) => s + (r.qua ?? 0), 0);
  const ds = chiQua ? caQua : theoTim;
  const soTrang = Math.max(1, Math.ceil(ds.length / MOI_TRANG)), t = Math.min(trang, soTrang);
  const hien = ds.slice((t - 1) * MOI_TRANG, t * MOI_TRANG);

  // Tổng hợp theo chuyên viên trị liệu: chỉ tính ca có đủ giờ bắt đầu + kết thúc.
  const theoNv = new Map<string, { ten: string; ca: number; qua: number; phut: number; lonNhat: number }>();
  for (const r of duGio) {
    const k = r.nguoiLamId ?? `ten:${r.nguoiLam}`;
    const g = theoNv.get(k) ?? { ten: r.nguoiLam, ca: 0, qua: 0, phut: 0, lonNhat: 0 };
    g.ca++; if ((r.qua ?? 0) > 0) { g.qua++; g.phut += r.qua ?? 0; g.lonNhat = Math.max(g.lonNhat, r.qua ?? 0); }
    theoNv.set(k, g);
  }
  const bangNv = [...theoNv.entries()].map(([k, g]) => ({ k, ...g })).sort((a, b) => b.qua - a.qua || b.phut - a.phut);
  const goc = { tab: "thoi-gian-dv", tu, den, cn, nv, dv, q, qg: chiQua ? "1" : undefined };
  return (
    <>
      <LocKho tu={tu} den={den} chiNhanh={chiNhanh} cn={cn} q={q} nhanTim="Tìm theo khách / dịch vụ / chuyên viên"
        loc={[{ khoa: "nv", nhan: "Lọc theo chuyên viên trị liệu", giaTri: nv ?? "", luaChon: [{ gia_tri: "", nhan: "Tất cả chuyên viên" }, ...(dsNv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] },
          { khoa: "dv", nhan: "Lọc theo dịch vụ", giaTri: dv ?? "", luaChon: [{ gia_tri: "", nhan: "Tất cả dịch vụ" }, ...(dsDv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }))] }]} />
      {quaDai && <p role="status" className="mb-3 text-[12px] text-muc-3">Khoảng dài hơn {TOI_DA_NGAY} ngày nên chỉ tính {TOI_DA_NGAY} ngày cuối ({ngayVN(tuDung)} – {ngayVN(den)}).</p>}
      <HangChiSo muc={[
        { nhan: "Số ca", so: soVN(theoTim.length), ghiChu: `${soVN(theoTim.filter((r) => r.dangLam).length)} ca đang làm` },
        { nhan: "Ca có đủ giờ bắt đầu – kết thúc", so: soVN(duGio.length) },
        { nhan: "Ca quá giờ", so: soVN(caQua.length), ghiChu: duGio.length ? `${Math.round((caQua.length / duGio.length) * 100)}% số ca có đủ giờ` : undefined },
        { nhan: "Tổng thời gian quá giờ", so: nhanPhut(tongQua), ghiChu: caQua.length ? `trung bình ${nhanPhut(tongQua / caQua.length)} mỗi ca` : undefined },
      ]} />

      <TieuDeMuc>Theo chuyên viên trị liệu</TieuDeMuc>
      <Bang duLieu={bangNv} khoa={(r) => r.k} trong="Chưa có ca nào đủ giờ bắt đầu – kết thúc trong khoảng này."
        cot={[{ nhan: "Chuyên viên trị liệu", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Số ca", hienThi: (r) => soVN(r.ca), phai: true },
          { nhan: "Ca quá giờ", hienThi: (r) => <span className={r.qua ? "font-semibold text-loi" : ""}>{soVN(r.qua)}</span>, phai: true },
          { nhan: "Tổng quá", hienThi: (r) => (r.phut ? nhanPhut(r.phut) : "—"), phai: true },
          { nhan: "Quá lâu nhất", hienThi: (r) => (r.lonNhat ? nhanPhut(r.lonNhat) : "—"), phai: true }]} />

      <TieuDeMuc>Từng ca</TieuDeMuc>
      <nav aria-label="Lọc ca" className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Link href={href({ ...goc, qg: undefined })} scroll={false} aria-current={!chiQua ? "page" : undefined} className={chip(!chiQua)}>Tất cả ca</Link>
        <Link href={href({ ...goc, qg: "1" })} scroll={false} aria-current={chiQua ? "page" : undefined} className={chip(chiQua)}>Chỉ ca quá giờ ({soVN(caQua.length)})</Link>
      </nav>
      <Bang duLieu={hien} khoa={(r) => r.id} trong={chiQua ? "Không có ca nào quá giờ." : "Không có ca nào trong khoảng này."}
        cot={[
          { nhan: "Ngày", hienThi: (r) => <span className="block tabular-nums">{ngayVN(r.ngay)}<span className="block text-[12px] text-muc-3">hẹn {gioVN(r.gioHen)}</span></span> },
          { nhan: "Khách · dịch vụ", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{r.khach}</span><span className="block text-[12px] text-muc-3">{r.dichVu}</span></span> },
          { nhan: "Chuyên viên trị liệu", hienThi: (r) => r.nguoiLam },
          { nhan: "Bắt đầu", hienThi: (r) => (r.batDauLam ? <span className="tabular-nums">{gioVN(r.batDauLam)}</span> : <span className="text-muc-3">Chưa ghi</span>) },
          { nhan: "Kết thúc", hienThi: (r) => (r.dangLam ? <span className="text-sac-luc">Đang làm</span> : r.ketThucLam ? <span className="tabular-nums">{gioVN(r.ketThucLam)}</span> : <span className="text-muc-3">Chưa ghi</span>) },
          { nhan: "Chuẩn", hienThi: (r) => nhanPhut(r.chuanPhut), phai: true },
          { nhan: "Thực tế", hienThi: (r) => (r.thucTe === null ? <span className="text-muc-3">—</span> : nhanPhut(r.thucTe)), phai: true },
          { nhan: "Quá giờ", hienThi: (r) => <OQua r={r} />, phai: true },
        ]} />
      <ThanhTrang trang={t} tong={ds.length} moi={MOI_TRANG} gan={(x) => href({ ...goc, trang: x ? String(x) : undefined })} don="ca" />
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">
        Chuẩn = tổng thời lượng các dịch vụ của lịch trong danh mục dịch vụ (theo bảng quy trình); dịch vụ chưa có thời lượng thì lấy khoảng giờ đã đặt lịch.
        Bắt đầu = lúc bấm “Đang phục vụ”; kết thúc = lúc lịch chuyển “Hoàn thành” (bấm Hoàn thành hoặc thanh toán xong hoá đơn của lịch), nên thanh toán muộn sẽ làm thực tế dài hơn.
        Ca đang làm tính thực tế tới bây giờ. Lịch chuyển thẳng sang Hoàn thành mà không mở ca, và lịch cũ từ SalonHero không có giờ bắt đầu, hiện “Chưa ghi” và không tính vào ca quá giờ.
        Mỗi lần xem tối đa {TOI_DA_NGAY} ngày, tính theo ngày hẹn.
      </p>
    </>
  );
}
