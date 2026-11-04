import { HandCoins, Receipt } from "lucide-react";
import type { BangThang, DongNv } from "@/lib/cs-hoa-hong-tai";
import { NHOM_HH } from "@/lib/cs-hoa-hong-tai";
import { phanTram, The, tien } from "./KhoiCs";

/** Bảng từng khoản hoa hồng / thưởng / phí trị liệu của một người trong tháng, kèm các ca tính phí. Dùng ở màn tính thử và trang thu nhập cá nhân. */
export function ChiTietNguoi({ r, b, toiDaCa = 300 }: { r: DongNv; b: BangThang; toiDaCa?: number }) {
  const ca = b.phi.ca.filter((c) => c.nv === r.id);
  return (
    <>
      <The icon={HandCoins} tieuDe="Các khoản theo chính sách" moTa={<>{r.nhom ? NHOM_HH[r.nhom] : "Chưa xếp nhóm hưởng"}{r.chucDanh ? ` · ${r.chucDanh}` : ""}{r.dsBan ? ` · doanh số cá nhân ${tien(r.dsBan)}` : ""}{r.chiTieu ? ` · chỉ tiêu ${tien(r.chiTieu)}` : ""}</>}
        phai={<div className="text-right"><p className="text-[12px] text-muc-3">Tổng {b.tamTinh ? "tạm tính" : "tháng"}</p><p className="text-[22px] font-bold tabular-nums text-nhan-dam">{tien(r.tong)}</p></div>}>
        {r.khoan.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13.5px]">
              <thead><tr className="nhan-muc border-b border-vien text-left"><th className="py-2.5 pr-3 font-medium">Khoản</th><th className="py-2.5 pr-3 text-right font-medium">Căn cứ</th><th className="py-2.5 pr-3 text-right font-medium">Mức</th><th className="py-2.5 text-right font-medium">Thành tiền</th></tr></thead>
              <tbody className="divide-y divide-vien">
                {r.khoan.map((k, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-2.5 pr-3"><p className="text-muc">{k.nhan}</p>{k.ghiChu && <p className="mt-0.5 text-[12px] text-muc-3">{k.ghiChu}</p>}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-muc-2">{k.ds != null ? tien(k.ds) : ""}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-muc-2">{k.ma === "phi_tl" ? (k.tl != null && k.tl < 1 ? `× ${k.tl.toFixed(4)}` : "theo ca") : k.tl != null ? phanTram(k.tl) : ""}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-muc">{tien(k.tien)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-vien-dam"><td colSpan={3} className="py-2.5 pr-3 font-semibold text-muc">Cộng</td><td className="py-2.5 text-right text-[15px] font-bold tabular-nums text-nhan-dam">{tien(r.tong)}</td></tr></tfoot>
            </table>
          </div>
        ) : <p className="text-[13.5px] text-muc-3">Tháng này chưa phát sinh khoản nào.</p>}
      </The>
      {ca.length > 0 && (
        <The icon={Receipt} mau="xanh" tieuDe={`Ca tính phí trị liệu (${ca.length})`} moTa="Số đơn vị × đơn giá theo PL01 / PL02, chưa nhân hệ số trần (nếu vượt trần)">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead className="sticky top-0 bg-giay-sang"><tr className="nhan-muc border-b border-vien text-left"><th className="py-2 pr-3 font-medium">Ngày</th><th className="py-2 pr-3 font-medium">Dịch vụ</th><th className="py-2 pr-3 font-medium">Dòng đơn giá</th><th className="py-2 pr-3 text-right font-medium">SL</th><th className="py-2 text-right font-medium">Tiền</th></tr></thead>
              <tbody className="divide-y divide-vien">
                {ca.slice(0, toiDaCa).map((c) => (
                  <tr key={c.dongId + c.nv}>
                    <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-muc-3">{c.ngay.slice(8, 10)}/{c.ngay.slice(5, 7)}</td>
                    <td className="py-2 pr-3 text-muc">{c.ten}<span className="block text-[11.5px] text-muc-3">{c.maHd} · {c.khach}</span></td>
                    <td className="py-2 pr-3 text-muc-2">{c.dongGia}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.soDv}</td>
                    <td className="py-2 text-right font-medium tabular-nums">{tien(c.tien)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ca.length > toiDaCa && <p className="mt-2 text-[12px] text-muc-3">Hiện {toiDaCa} / {ca.length} ca gần nhất.</p>}
        </The>
      )}
    </>
  );
}
