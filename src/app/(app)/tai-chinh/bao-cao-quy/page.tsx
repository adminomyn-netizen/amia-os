import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { dungBaoCaoQuy, NHOM_CHI, NHOM_THU } from "@/lib/bao-cao-quy-ngay";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { datSoDuDauQuy } from "./actions";

type SP = { tu?: string; den?: string; cn?: string };
const so0 = (n: number) => (n ? soVN(n) : "–");

/** Báo cáo quỹ ngày — thay sheet "Báo cáo quỹ ngày" của kế toán trên Lark: mỗi ngày một dòng cho từng quỹ + dòng TỔNG CỘNG, tồn cuối ngày này là tồn đầu ngày sau (xuyên tháng). */
export default async function TrangBaoCaoQuy({ searchParams }: { searchParams: Promise<SP> }) {
  const nd = await yeuCauQuyen("quy.xem");
  const sp = await searchParams;
  const db = sb();
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const { data: dsCn } = await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma");
  const cn = nd.chiNhanhId ?? (sp.cn || dsCn?.[0]?.id);
  if (!cn) return <div className="text-muc-2">Chưa có chi nhánh.</div>;
  const { data: dsQuy } = await db.from("quy").select("*").eq("chi_nhanh_id", cn).eq("hoat_dong", true).order("loai", { ascending: false });
  const quy = dsQuy ?? [];
  const [{ data: dong }, tongDau] = await Promise.all([
    db.rpc("bao_cao_quy_ngay", { p_chi_nhanh: cn, p_tu: tu, p_den: den }),
    Promise.all(quy.map((q) => db.rpc("so_quy_tong", { p_quy: [q.id], p_tu: tu, p_den: den }))),
  ]);
  const dau = new Map(quy.map((q, i) => [q.id, Number(tongDau[i].data?.[0]?.dau ?? 0)]));
  const kq = dungBaoCaoQuy(quy.map((q) => ({ id: q.id, ten: q.ten.replace(/ · .*$/, ""), dau: dau.get(q.id) ?? 0 })), (dong ?? []).map((d) => ({ ...d, tien: Number(d.tien) })), tu, den);
  const tong = kq.filter((r) => r.tong || quy.length === 1);
  const sumTong = (f: (r: (typeof kq)[number]) => number) => tong.reduce((t, r) => t + f(r), 0);
  const tonDau = tong[0]?.dau ?? 0, tonCuoi = tong[tong.length - 1]?.cuoi ?? 0;
  const chuaNhap = quy.filter((q) => !q.da_nhap_so_du);
  const sua = coQuyen(nd, "ky.khoa");

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính" }} tieuDe="Báo cáo quỹ ngày" phu="Mỗi ngày một dòng cho từng quỹ và dòng tổng, chia theo bảy nhóm khoản thu / chi như sheet Báo cáo quỹ ngày của kế toán. Tồn cuối ngày này là tồn đầu ngày sau." />
      <LocBaoCao goc="/tai-chinh/bao-cao-quy" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={cn} />
      {chuaNhap.length > 0 && (
        <div className="mb-4 rounded-lg border border-vien bg-giay-tram px-4 py-3 text-[14px] text-muc-2">
          Chưa nhập <b>số dư đầu kỳ</b> cho: {chuaNhap.map((q) => q.ten).join(", ")}. Tồn quỹ đang tính từ 0 nên có thể lệch so với tiền thật.{sua ? " Nhập ở mục Số dư đầu kỳ cuối trang." : " Nhờ kế toán trưởng nhập."}
        </div>
      )}
      <HangChiSo muc={[{ nhan: "Tồn đầu kỳ", so: tienVN(tonDau) }, { nhan: "Tổng thu", so: tienVN(sumTong((r) => r.tongThu)) }, { nhan: "Tổng chi", so: tienVN(sumTong((r) => r.tongChi)) }, { nhan: "Tồn cuối kỳ", so: tienVN(tonCuoi) }]} />
      <div className="mt-5 overflow-x-auto rounded-lg border border-vien bg-nen">
        <table className="min-w-[1250px] w-full border-collapse text-[13px] tabular-nums">
          <thead>
            <tr className="bg-giay-tram text-left text-[12px] uppercase tracking-wide text-muc-3">
              <th className="px-2.5 py-2">Ngày</th><th className="px-2.5 py-2">Quỹ</th><th className="px-2.5 py-2 text-right">Tồn đầu</th>
              {NHOM_THU.map((n) => <th key={n} className="px-2.5 py-2 text-right">{n}</th>)}
              <th className="px-2.5 py-2 text-right">Tổng thu</th>
              {NHOM_CHI.map((n) => <th key={n} className="px-2.5 py-2 text-right">{n}</th>)}
              <th className="px-2.5 py-2 text-right">Tổng chi</th><th className="px-2.5 py-2 text-right">Chuyển quỹ</th><th className="px-2.5 py-2 text-right">Tồn cuối</th>
            </tr>
          </thead>
          <tbody>
            {kq.map((r, i) => (
              <tr key={`${r.ngay}-${r.quyId ?? "tong"}-${i}`} className={r.tong ? "border-t border-vien bg-giay-tram font-medium" : "border-t border-vien/60"}>
                <td className="whitespace-nowrap px-2.5 py-1.5">{ngayVN(r.ngay)}</td><td className="whitespace-nowrap px-2.5 py-1.5">{r.ten}</td>
                <td className="px-2.5 py-1.5 text-right">{so0(r.dau)}</td>
                {NHOM_THU.map((n) => <td key={n} className="px-2.5 py-1.5 text-right">{so0(r.thu[n])}</td>)}
                <td className="px-2.5 py-1.5 text-right font-medium">{so0(r.tongThu)}</td>
                {NHOM_CHI.map((n) => <td key={n} className="px-2.5 py-1.5 text-right">{so0(r.chi[n])}</td>)}
                <td className="px-2.5 py-1.5 text-right font-medium">{so0(r.tongChi)}</td>
                <td className="px-2.5 py-1.5 text-right">{so0(r.chuyen)}</td>
                <td className="px-2.5 py-1.5 text-right font-medium">{soVN(r.cuoi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="nhan-muc mb-2 mt-9">Số dư đầu kỳ của quỹ</h2>
      <p className="mb-3 text-[13px] text-muc-3">Tiền có sẵn trong quỹ trước khi bắt đầu ghi sổ trên phần mềm. Đổi số này làm đổi tồn quỹ mọi ngày sau, nên phải ghi lý do và được lưu nhật ký.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {quy.map((q) => (
          <div key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-vien bg-nen px-4 py-3">
            <div><div className="text-muc">{q.ten}</div><div className="mt-0.5 text-[13px] text-muc-3">{tienVN(q.so_du_dau)} · <NhanTrangThai kieu={q.da_nhap_so_du ? "tot" : "cho"}>{q.da_nhap_so_du ? "Đã nhập" : "Chưa nhập"}</NhanTrangThai></div></div>
            {sua && <NutHop kieu="chu" nhan="Đặt số dư" tieuDe={`Số dư đầu kỳ · ${q.ten}`} action={datSoDuDauQuy} an={{ id: q.id }} giaTri={{ so_du: q.so_du_dau }} nhanLuu="Lưu"
              truong={[{ ten: "so_du", nhan: "Số dư đầu kỳ (đ)", loai: "tien", batBuoc: true, rong: true }, { ten: "ly_do", nhan: "Lý do / căn cứ (biên bản kiểm quỹ, sao kê…)", loai: "nhieu_dong", batBuoc: true, rong: true }]} />}
          </div>
        ))}
      </div>
    </div>
  );
}
