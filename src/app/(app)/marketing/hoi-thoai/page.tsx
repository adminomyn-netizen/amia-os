import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, soVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NgayChon } from "@/components/ui/NgayChon";
import { HangChiSo } from "@/components/ui/HangChiSo";

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const ti = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");
const NHOM = [
  { loai: "the_dich_vu", tieuDe: "Theo dịch vụ khách hỏi", cot: "Dịch vụ" },
  { loai: "nguon", tieuDe: "Theo nguồn", cot: "Nguồn" },
  { loai: "giai_doan", tieuDe: "Theo giai đoạn chăm sóc", cot: "Giai đoạn" },
  { loai: "nhan_vien", tieuDe: "Theo nhân viên tư vấn", cot: "Nhân viên" },
] as const;

type Dong = { khoa: string; hoi_thoai: number; co_sdt: number; tg: number | null; tgN: number; bo_lo: number | null };

export default async function TrangHoiThoaiMkt({ searchParams }: { searchParams: Promise<{ tu?: string; den?: string }> }) {
  await yeuCauQuyen("mkt.xem");
  const sp = await searchParams, hom = homNayHCM();
  const den = sp.den && NGAY.test(sp.den) ? sp.den : hom, tu = sp.tu && NGAY.test(sp.tu) ? sp.tu : congNgay(den, -29);
  const db = sb();
  const [{ data: chat }, { data: cd }] = await Promise.all([
    db.from("mkt_chat_ngay").select("ngay, loai, khoa, hoi_thoai, co_sdt, phan_hoi_trung_vi_giay, bo_lo").gte("ngay", tu).lte("ngay", den).limit(20000),
    db.from("chien_dich").select("id").eq("ma", "pancake-hoi-thoai").maybeSingle(),
  ]);
  const { data: tong } = cd?.id
    ? await db.from("chi_phi_qc_ngay").select("tin_nhan_moi, lead_so").eq("chien_dich_id", cd.id).gte("ngay", tu).lte("ngay", den).limit(5000)
    : { data: [] as { tin_nhan_moi: number; lead_so: number }[] };
  const tongHT = (tong ?? []).reduce((a, r) => a + Number(r.tin_nhan_moi), 0), tongSdt = (tong ?? []).reduce((a, r) => a + Number(r.lead_so), 0);

  const theo = new Map<string, Map<string, Dong>>();
  for (const r of chat ?? []) {
    const m = theo.get(r.loai) ?? new Map<string, Dong>();
    const d = m.get(r.khoa) ?? { khoa: r.khoa, hoi_thoai: 0, co_sdt: 0, tg: null, tgN: 0, bo_lo: null };
    d.hoi_thoai += Number(r.hoi_thoai); d.co_sdt += Number(r.co_sdt);
    if (r.phan_hoi_trung_vi_giay != null) { d.tg = (d.tg ?? 0) + Number(r.phan_hoi_trung_vi_giay) * Number(r.hoi_thoai); d.tgN += Number(r.hoi_thoai); }
    if (r.bo_lo != null) d.bo_lo = (d.bo_lo ?? 0) + Number(r.bo_lo);
    m.set(r.khoa, d); theo.set(r.loai, m);
  }
  const phut = (s: number) => (s < 90 ? `${Math.round(s)} giây` : `${Math.round(s / 60)} phút`);

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Hội thoại theo ngày" phu="Số hội thoại mới trong hộp thư Pancake, chia theo dịch vụ, nguồn, giai đoạn và nhân viên. Chỉ đếm, không có số điện thoại.">
        <form className="flex flex-wrap items-end gap-2" action="/marketing/hoi-thoai">
          <label className="text-[12.5px] text-muc-3">Từ<NgayChon ten="tu" giaTriMacDinh={tu} tuNam={2024} denNam={2035} ariaLabel="Từ ngày" /></label>
          <label className="text-[12.5px] text-muc-3">Đến<NgayChon ten="den" giaTriMacDinh={den} tuNam={2024} denNam={2035} ariaLabel="Đến ngày" /></label>
          <button className="rounded bg-nhan px-3 py-1.5 text-[14px] text-white">Xem</button>
        </form>
      </TieuDeNoi>
      <HangChiSo muc={[
        { nhan: "Hội thoại mới", so: soVN(tongHT), ghiChu: "trong khoảng đã chọn" },
        { nhan: "Có số điện thoại", so: soVN(tongSdt), ghiChu: ti(tongSdt, tongHT) },
      ]} />
      {NHOM.map((n) => {
        const dong = [...(theo.get(n.loai)?.values() ?? [])].sort((a, b) => b.hoi_thoai - a.hoi_thoai);
        const coTg = dong.some((d) => d.tgN > 0), coBoLo = dong.some((d) => d.bo_lo != null);
        return (
          <section key={n.loai} className="mt-6">
            <h2 className="mb-2 text-[15px] font-medium">{n.tieuDe}</h2>
            <Bang duLieu={dong} khoa={(r) => r.khoa} trong="Chưa có số liệu trong khoảng này."
              cot={[
                { nhan: n.cot, chinh: true, hienThi: (r) => r.khoa },
                { nhan: "Hội thoại", phai: true, hienThi: (r) => soVN(r.hoi_thoai) },
                { nhan: "Tỉ lệ", phai: true, hienThi: (r) => ti(r.hoi_thoai, tongHT) },
                { nhan: "Có SĐT", phai: true, hienThi: (r) => <>{soVN(r.co_sdt)} <span className="text-muc-3">({ti(r.co_sdt, r.hoi_thoai)})</span></> },
                ...(coTg ? [{ nhan: "Phản hồi đầu", phai: true, hienThi: (r: Dong) => (r.tgN > 0 ? phut(r.tg! / r.tgN) : "") }] : []),
                ...(coBoLo ? [{ nhan: "Bỏ lỡ", phai: true, hienThi: (r: Dong) => (r.bo_lo != null ? soVN(r.bo_lo) : "") }] : []),
              ]} />
          </section>
        );
      })}
      <p className="mt-4 text-[13px] text-muc-3">
        Thẻ lấy theo trạng thái hiện tại của hội thoại, ngày tính theo giờ Việt Nam. Một hội thoại có thể có nhiều thẻ nên cộng các dòng trong một bảng có thể lớn hơn tổng. Phản hồi đầu và Bỏ lỡ sẽ hiện khi có số liệu.
      </p>
    </div>
  );
}
