import { sb } from "@/lib/db";
import { coQuyen } from "@/lib/quyen";
import type { NguoiDung } from "@/lib/auth";
import { THUE_SUAT, nhanThueSuat, thieuNguoiBan } from "@/lib/hoa-don-gtgt";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { luuNguoiBan } from "./gtgt-actions";

const TRUONG: Truong[] = [
  { ten: "ma_so_thue", nhan: "Mã số thuế", loai: "chu", goiY: "10 số, hoặc 0123456789-001", traCuuMst: { ten: "ten_don_vi", diaChi: "dia_chi" } },
  { ten: "ten_don_vi", nhan: "Tên đơn vị bán (đúng tên đăng ký thuế)", loai: "nhieu_dong" },
  { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true },
  { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" }, { ten: "email", nhan: "Email", loai: "chu" },
  { ten: "so_tai_khoan", nhan: "Số tài khoản", loai: "chu" }, { ten: "ngan_hang", nhan: "Ngân hàng", loai: "chu" },
  { ten: "mau_so", nhan: "Mẫu số", loai: "chon", luaChon: [{ gia_tri: "1", nhan: "1 — Hoá đơn GTGT" }, { gia_tri: "2", nhan: "2 — Hoá đơn bán hàng" }] },
  { ten: "ky_hieu", nhan: "Ký hiệu hoá đơn", loai: "chu", goiY: "Ví dụ C26TAA", ghiChu: "6 ký tự đã đăng ký với cơ quan thuế (Thông tư 78): C/K, 2 số năm, loại T/D/L/M/N/B/G/H, 2 ký tự tự đặt." },
  { ten: "thue_suat", nhan: "Thuế suất mặc định", loai: "chon", luaChon: [...THUE_SUAT], ghiChu: "Dùng khi đơn không cộng VAT riêng (tiền khách trả coi là đã gồm thuế)." },
];

/** Thông tin người bán in trên hoá đơn GTGT, mỗi chi nhánh một bộ (Vinh, Đà Lạt có thể là đơn vị/MST khác nhau). Để trống cho chị điền, app không tự điền. */
export async function NguoiBanTheoChiNhanh({ nd }: { nd: NguoiDung }) {
  const sua = !nd.chiNhanhId && coQuyen(nd, "ky.khoa");
  const db = sb();
  let qCn = db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma");
  if (nd.chiNhanhId) qCn = qCn.eq("id", nd.chiNhanhId);
  const [{ data: cn }, { data: nb }, { data: ds }] = await Promise.all([qCn, db.from("hddt_nguoi_ban").select("*"), db.from("hddt_day_so").select("*")]);
  const theoCn = new Map((nb ?? []).map((x) => [x.chi_nhanh_id, x]));
  return (
    <section className="max-w-3xl space-y-5">
      <p className="text-[13.5px] text-muc-3">Thông tin này in lên phần người bán của hoá đơn GTGT lập trong app. Số hoá đơn tự tăng theo từng bộ mã số thuế + mẫu số + ký hiệu, không dùng lại số đã cấp.</p>
      {(cn ?? []).map((c) => {
        const b = theoCn.get(c.id);
        const thieu = thieuNguoiBan(b);
        const dem = b?.ma_so_thue && b.ky_hieu ? (ds ?? []).find((x) => x.ma_so_thue === b.ma_so_thue && x.mau_so === b.mau_so && x.ky_hieu === b.ky_hieu)?.so_cuoi ?? 0 : null;
        const dong: [string, string][] = [["Tên đơn vị", b?.ten_don_vi ?? ""], ["Mã số thuế", b?.ma_so_thue ?? ""], ["Địa chỉ", b?.dia_chi ?? ""], ["Điện thoại", b?.dien_thoai ?? ""], ["Email", b?.email ?? ""],
          ["Tài khoản", [b?.so_tai_khoan, b?.ngan_hang].filter(Boolean).join(" · ")], ["Mẫu số · Ký hiệu", b?.ky_hieu ? `${b.mau_so} · ${b.mau_so}${b.ky_hieu}` : ""], ["Thuế suất mặc định", nhanThueSuat(b?.thue_suat ?? "10")]];
        return (
          <div key={c.id} className="the-noi the-noi-thap px-4 pb-4 pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-medium text-muc">{c.ten}</h2>
              <span className="flex flex-wrap items-center gap-3">
                {thieu.length ? <NhanTrangThai kieu="cho">Thiếu: {thieu.join(", ")}</NhanTrangThai> : <NhanTrangThai kieu="tot">Đủ để xuất{dem != null ? ` · đã cấp tới số ${dem}` : ""}</NhanTrangThai>}
                {sua && <NutHop kieu="phu" nhan="Sửa" tieuDe={`Thông tin người bán · ${c.ten}`} truong={TRUONG} action={luuNguoiBan} an={{ chi_nhanh_id: c.id }} rong
                  giaTri={{ ten_don_vi: b?.ten_don_vi ?? "", ma_so_thue: b?.ma_so_thue ?? "", dia_chi: b?.dia_chi ?? "", dien_thoai: b?.dien_thoai ?? "", email: b?.email ?? "", so_tai_khoan: b?.so_tai_khoan ?? "", ngan_hang: b?.ngan_hang ?? "", mau_so: b?.mau_so ?? "1", ky_hieu: b?.ky_hieu ?? "", thue_suat: b?.thue_suat ?? "10" }} />}
              </span>
            </div>
            <dl className="divide-y divide-vien text-[14px]">
              {dong.map(([n, v]) => <div key={n} className="flex flex-wrap justify-between gap-2 py-2"><dt className="text-muc-3">{n}</dt><dd className="break-words text-right">{v || <span className="text-muc-3">chưa điền</span>}</dd></div>)}
            </dl>
          </div>
        );
      })}
      {!sua && <p className="text-[13px] text-muc-3">Chỉ kế toán ở văn phòng chung (không gắn chi nhánh, có quyền khoá kỳ) sửa được phần này.</p>}
    </section>
  );
}
