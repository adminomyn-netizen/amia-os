import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { layTiLeChot, phanTram } from "@/lib/tu-van";

/** Báo cáo tỉ lệ chốt tư vấn theo từng tư vấn viên (phiếu tư vấn, migration 0105). Khoảng ngày lọc theo NGÀY TƯ VẤN. Cột tiền chỉ hiện cho người có quyền xem số tiền. */
export async function BaoCaoTiLeChot({ loc, xemTien }: { loc: { tu: string; den: string; cn?: string }; xemTien: boolean }) {
  const ds = await layTiLeChot(sb(), loc.tu, loc.den, loc.cn);
  const t = ds.reduce((s, r) => ({ so: s.so + r.soPhieu, chot: s.chot + r.chot, cho: s.cho + r.choChot, khong: s.khong + r.khongChot, gt: s.gt + r.tongBaoGiaChot }), { so: 0, chot: 0, cho: 0, khong: 0, gt: 0 });
  return (
    <>
      <HangChiSo muc={[
        { nhan: "Số phiếu tư vấn", so: soVN(t.so), ghiChu: `${soVN(t.cho)} chờ chốt` },
        { nhan: "Số phiếu chốt", so: soVN(t.chot), ghiChu: `${soVN(t.khong)} không chốt` },
        { nhan: "Tỉ lệ chốt", so: t.so ? phanTram((t.chot / t.so) * 100) : "—", ghiChu: "chốt / tổng phiếu" },
        ...(xemTien ? [{ nhan: "Giá trị báo giá đã chốt", so: tienVN(t.gt) }] : []),
      ]} />
      <div className="mt-6">
        <Bang duLieu={ds} khoa={(r) => r.tuVanVienId} trong="Chưa có phiếu tư vấn nào trong khoảng này."
          cot={[
            { nhan: "Tư vấn viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
            { nhan: "Số phiếu", phai: true, hienThi: (r) => soVN(r.soPhieu) },
            { nhan: "Chờ chốt", phai: true, hienThi: (r) => soVN(r.choChot) },
            { nhan: "Chốt", phai: true, hienThi: (r) => soVN(r.chot) },
            { nhan: "Không chốt", phai: true, hienThi: (r) => soVN(r.khongChot) },
            { nhan: "Tỉ lệ chốt", phai: true, hienThi: (r) => <span className="font-medium text-muc">{phanTram(r.tiLe)}</span> },
            ...(xemTien ? [{ nhan: "Tổng báo giá chốt", phai: true, hienThi: (r: (typeof ds)[number]) => tienVN(r.tongBaoGiaChot) }] : []),
          ]} />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Tính theo ngày tư vấn ghi trên phiếu. Tỉ lệ chốt = số phiếu chốt / TỔNG số phiếu của tư vấn viên (phiếu còn chờ chốt tính vào tổng). Tổng báo giá chốt = cộng báo giá dự kiến của các phiếu đã chốt (không phải tiền đã thu). Phiếu ghi ở Khách hàng › Tư vấn.</p>
    </>
  );
}
