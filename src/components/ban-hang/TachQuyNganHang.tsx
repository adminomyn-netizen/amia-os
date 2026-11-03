import { sb } from "@/lib/db";
import { nhanKhoanThu } from "@/lib/ban-hang";
import { tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";

/** Quỹ ngân hàng tách theo tài khoản nhận và loại ví (như SalonHero): tiền khách trả trong kỳ theo từng hình thức + ngân hàng / ví. Chỉ đọc. */
export async function TachQuyNganHang({ chiNhanhIds, tu, den }: { chiNhanhIds: string[]; tu: string; den: string }) {
  if (!chiNhanhIds.length) return null;
  const { data, error } = await sb().rpc("quy_ngan_hang_tach", { p_cn: chiNhanhIds, p_tu: tu, p_den: den });
  if (error) return <p role="alert" className="mt-4 text-[13px] text-loi">Chưa tách được quỹ ngân hàng theo tài khoản. Tải lại trang.</p>;
  const ds = (data ?? []).map((r) => ({ ...r, khoa: `${r.phuong_thuc}|${r.ngan_hang ?? ""}|${r.loai_vi ?? ""}`, rong: Number(r.thu) - Number(r.hoan),
    ten: r.phuong_thuc === "vi_dien_tu" ? nhanKhoanThu(r.phuong_thuc, r.loai_vi) : r.ngan_hang ? `${r.ngan_hang} · ${nhanKhoanThu(r.phuong_thuc)}` : `${nhanKhoanThu(r.phuong_thuc)} · chưa ghi ngân hàng` }))
    .filter((r) => r.rong !== 0 || Number(r.thu) !== 0).sort((a, b) => b.rong - a.rong);
  if (!ds.length) return null;
  return (
    <details className="mt-4 rounded-nho border border-vien px-3.5 py-2.5 text-[14px]">
      <summary className="cursor-pointer font-medium text-muc">Tiền khách trả vào quỹ ngân hàng theo tài khoản / loại ví ({tienVN(ds.reduce((s, r) => s + r.rong, 0))})</summary>
      <div className="mt-2">
        <Bang duLieu={ds} khoa={(r) => r.khoa} cot={[
          { nhan: "Tài khoản / ví", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Thu", phai: true, hienThi: (r) => tienVN(Number(r.thu)) },
          { nhan: "Hoàn", phai: true, hienThi: (r) => (Number(r.hoan) ? `− ${tienVN(Number(r.hoan))}` : "") },
          { nhan: "Còn vào quỹ", phai: true, hienThi: (r) => <span className="font-medium">{tienVN(r.rong)}</span> },
        ]} />
        <p className="mt-2 text-[12px] text-muc-3">Chỉ gồm tiền khách trả trong kỳ (bán hàng, trả nợ); Ship COD không vào quỹ như SalonHero. Phiếu thu/chi ghi tay và chuyển quỹ chưa gắn tài khoản nên không tách ở đây.</p>
      </div>
    </details>
  );
}
