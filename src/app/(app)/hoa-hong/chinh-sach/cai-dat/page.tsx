import Link from "next/link";
import { BadgePercent, Layers, Search, Settings2, Stethoscope, Tags, Users } from "lucide-react";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau, congNgay, homNayHCM } from "@/lib/dinh-dang";
import { docCauHinh } from "@/lib/cs-hoa-hong";
import { chonThang, layBangThang, NHOM_HH } from "@/lib/cs-hoa-hong-tai";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { DaiLienKet, phanTram, The, tien } from "@/components/hoa-hong/cs/KhoiCs";
import { lienKetCs } from "@/components/hoa-hong/cs/lien-ket";
import { ghepTenDonGia, luuDanhMuc, luuDonGia, luuGiaMuc, luuNhomHh, luuTiLeCs, xoaDanhMuc } from "../actions";

const TAB = [{ ma: "ti-le", ten: "Tỉ lệ" }, { ma: "danh-muc", ten: "Danh mục gói, thẻ" }, { ma: "nhom", ten: "Nhóm hưởng" }, { ma: "phi", ten: "Đơn giá phí trị liệu" }, { ma: "gia", ten: "Giá khuyến mại" }];
const p100 = (x: number) => Math.round(x * 100_000) / 1000;

/** Cài đặt chính sách hoa hồng từ 11/2026: tỉ lệ, danh mục gói thẻ, nhóm hưởng từng nhân viên, đơn giá phí trị liệu (ghép dịch vụ), giá khuyến mại / tối thiểu. */
export default async function TrangCaiDatCs({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; tat_ca?: string }> }) {
  const [nd, sp] = await Promise.all([yeuCauNoiBo(), searchParams]);
  if (!coQuyen(nd, "hethong.phanquyen")) return <p className="text-[14px] text-muc-3">Bạn không có quyền sửa chính sách hoa hồng.</p>;
  const tab = TAB.some((t) => t.ma === sp.tab) ? (sp.tab as string) : "ti-le";
  const db = sb(), hom = homNayHCM();
  const [{ data: cs }, { data: dm }, { data: nv }, { data: dg }, { data: dv }, { data: goi }] = await Promise.all([
    db.from("cs_hoa_hong").select("id, ten, hieu_luc_tu, cau_hinh").order("hieu_luc_tu", { ascending: false }).limit(1).maybeSingle(),
    db.from("cs_hh_danh_muc").select("id, thu_tu, ten, gia_khuyen_mai, goi_id, dich_vu_id").order("thu_tu"),
    tab === "nhom" ? db.from("nhan_vien").select("id, ho_ten, chuc_danh, nhom_hh").eq("hoat_dong", true).order("ho_ten") : Promise.resolve({ data: [] as { id: string; ho_ten: string; chuc_danh: string | null; nhom_hh: string | null }[] }),
    db.from("phi_tl_don_gia").select("id, doi_tuong, nhom, stt, ten, dvt, don_gia, dich_vu_ids, ten_ghep").order("doi_tuong").order("stt"),
    db.from("dich_vu").select("id, ma, ten, gia, gia_khuyen_mai, gia_toi_thieu").eq("hoat_dong", true).order("ten"),
    db.from("goi_the").select("id, ma, ten, gia, gia_khuyen_mai, gia_toi_thieu").eq("hoat_dong", true).order("ten"),
  ]);
  const c = docCauHinh(cs?.cau_hinh);
  const chonDv = (dv ?? []).map((x) => ({ gia_tri: x.id, nhan: x.ten }));
  const chonGoi = [{ gia_tri: "", nhan: "Không" }, ...(goi ?? []).map((x) => ({ gia_tri: x.id, nhan: `${x.ten} (${x.ma})` }))];
  const tenDv = new Map((dv ?? []).map((x) => [x.id, x.ten])), tenGoi = new Map((goi ?? []).map((x) => [x.id, x.ten]));

  let ban: Set<string> | null = null, chuaGhep: { ten: string; doiTuong: string; soCa: number }[] = [];
  if (tab === "gia" && !sp.tat_ca) {
    const { data } = await db.rpc("bc_cs_hh_dong", { p_tu: congNgay(hom, -180), p_den: hom });
    ban = new Set((data ?? []).flatMap((r) => [r.dich_vu_id, r.goi_id]).filter((x): x is string => !!x));
  }
  if (tab === "phi") { const { nam, thang } = chonThang(undefined, hom); chuaGhep = (await layBangThang(nam, thang, hom)).phi.chuaDonGia; }
  const q = boDau((sp.q ?? "").trim());
  const loc = <T extends { ten: string; id: string }>(ds: T[]) => ds.filter((x) => (!ban || ban.has(x.id)) && (!q || boDau(x.ten).includes(q)));

  const truongTiLe: Truong[] = [
    { ten: "tv_km", nhan: "Dịch vụ từ giá KM (%)", loai: "so" }, { ten: "tv_san", nhan: "Dịch vụ giá sàn (%)", loai: "so" }, { ten: "tv_goi_km", nhan: "Gói danh mục từ giá KM (%)", loai: "so" }, { ten: "tv_goi_duoi_km", nhan: "Gói danh mục dưới giá KM (%)", loai: "so" },
    { ten: "tv_my_pham", nhan: "Mỹ phẩm (%)", loai: "so" }, { ten: "tv_kmtkt", nhan: "Khách mới tự khai thác (%)", loai: "so" }, { ten: "tv_vct", nhan: "Vượt chỉ tiêu (%)", loai: "so" }, { ten: "ts_so_ngay", nhan: "Telesale: số ngày tính từ lịch hẹn", loai: "so" },
    ...(["ts", "gd", "mkt"] as const).flatMap((k) => [1, 2, 3].map((i) => ({ ten: `${k}_${i}`, nhan: `${{ ts: "Telesale", gd: "Giám đốc CN", mkt: "TP Marketing" }[k]} – bậc ${i} (%)`, loai: "so" as const, ghiChu: ["đến 1,8 tỷ", "1,8 – 2,8 tỷ", "trên 2,8 tỷ"][i - 1] }))),
    { ten: "gd_tru", nhan: "GĐ: trừ % doanh thu giá sàn", loai: "so" }, { ten: "mkt_tran", nhan: "MKT: trần chi phí quảng cáo (%)", loai: "so" },
    { ten: "gt_moc1", nhan: "Gián tiếp mốc 1 (doanh số từ)", loai: "tien" }, { ten: "gt_nv1", nhan: "Mốc 1 – nhân viên", loai: "tien" }, { ten: "gt_ql1", nhan: "Mốc 1 – quản lý", loai: "tien" },
    { ten: "gt_moc2", nhan: "Gián tiếp mốc 2 (doanh số từ)", loai: "tien" }, { ten: "gt_nv2", nhan: "Mốc 2 – nhân viên", loai: "tien" }, { ten: "gt_ql2", nhan: "Mốc 2 – quản lý", loai: "tien" },
    { ten: "phi_tran_bs", nhan: "Trần phí bác sĩ (% DS dịch vụ)", loai: "so" }, { ten: "phi_tran_tlv", nhan: "Trần phí trị liệu viên (%)", loai: "so" }, { ten: "phi_phu_bs", nhan: "Phụ bác sĩ (đồng/ca)", loai: "tien" },
  ];
  const giaTriTiLe = {
    tv_km: p100(c.tv.km), tv_san: p100(c.tv.san), tv_goi_km: p100(c.tv.goi_km), tv_goi_duoi_km: p100(c.tv.goi_duoi_km), tv_my_pham: p100(c.tv.my_pham), tv_kmtkt: p100(c.tv.khach_moi_tu_khai_thac), tv_vct: p100(c.tv.vuot_chi_tieu), ts_so_ngay: c.telesale.so_ngay,
    ...Object.fromEntries((["ts", "gd", "mkt"] as const).flatMap((k) => { const b = { ts: c.telesale.bac, gd: c.gd.bac, mkt: c.mkt.bac }[k]; return [1, 2, 3].map((i) => [`${k}_${i}`, p100(b[i - 1]?.[1] ?? 0)]); })),
    gd_tru: p100(c.gd.tru_gia_san), mkt_tran: p100(c.mkt.tran_qc),
    gt_moc1: c.gian_tiep.moc[0]?.tu ?? 0, gt_nv1: c.gian_tiep.moc[0]?.nv ?? 0, gt_ql1: c.gian_tiep.moc[0]?.ql ?? 0, gt_moc2: c.gian_tiep.moc[1]?.tu ?? 0, gt_nv2: c.gian_tiep.moc[1]?.nv ?? 0, gt_ql2: c.gian_tiep.moc[1]?.ql ?? 0,
    phi_tran_bs: p100(c.phi_tl.tran_bs), phi_tran_tlv: p100(c.phi_tl.tran_tlv), phi_phu_bs: c.phi_tl.phu_bs,
  };
  const timKiem = (
    <form className="mb-4 flex flex-wrap items-center gap-2" action="/hoa-hong/chinh-sach/cai-dat">
      <input type="hidden" name="tab" value={tab} />{sp.tat_ca && <input type="hidden" name="tat_ca" value="1" />}
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-nho border border-vien-dam bg-giay-sang px-3 text-[14px]"><Search className="h-4 w-4 text-muc-3" /><input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm theo tên" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
      {tab === "gia" && <Link href={`/hoa-hong/chinh-sach/cai-dat?tab=gia${sp.tat_ca ? "" : "&tat_ca=1"}`} className="flex h-10 items-center rounded-nho border border-vien-dam px-3 text-[13.5px] hover:bg-giay-tram">{sp.tat_ca ? "Chỉ mục đã bán 6 tháng" : "Hiện tất cả"}</Link>}
    </form>
  );

  return (
    <div>
      <TieuDeNoi icon={Settings2} quayLai={{ href: "/hoa-hong/chinh-sach", nhan: "Chính sách" }} tieuDe="Cài đặt chính sách hoa hồng" so={cs?.hieu_luc_tu ? `Hiệu lực ${cs.hieu_luc_tu.split("-").reverse().join("/")}` : undefined}
        phu="Sửa ở đây là đổi số tính cho mọi tháng dùng bộ chính sách này (tháng đã chốt không đổi cho tới khi chốt lại). Phòng HCNS rà soát đơn giá 6 tháng một lần." />
      <DaiLienKet muc={lienKetCs(nd)} dang="/hoa-hong/chinh-sach/cai-dat" />
      <Tab muc={TAB} dang={tab} goc="/hoa-hong/chinh-sach/cai-dat" />

      {tab === "ti-le" && cs && (
        <The icon={BadgePercent} tieuDe={cs.ten} moTa="Nhập theo phần trăm, ví dụ 1,5 nghĩa là 1,5%." phai={<NutHop nhan="Sửa tỉ lệ" tieuDe="Sửa tỉ lệ chính sách" truong={truongTiLe} giaTri={giaTriTiLe} an={{ id: cs.id }} action={luuTiLeCs} rong />}>
          <dl className="grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2 lg:grid-cols-3">
            {truongTiLe.map((t) => <div key={t.ten} className="flex justify-between gap-3 border-b border-vien py-1.5"><dt className="text-muc-3">{t.nhan.replace(" (%)", "")}{t.ghiChu ? ` · ${t.ghiChu}` : ""}</dt><dd className="font-semibold tabular-nums text-muc">{t.loai === "tien" ? tien(Number(giaTriTiLe[t.ten as keyof typeof giaTriTiLe])) : t.ten === "ts_so_ngay" ? `${giaTriTiLe.ts_so_ngay} ngày` : `${Number(giaTriTiLe[t.ten as keyof typeof giaTriTiLe]).toLocaleString("vi-VN")}%`}</dd></div>)}
          </dl>
        </The>
      )}

      {tab === "danh-muc" && (
        <The icon={Layers} mau="dat" tieuDe="Danh mục gói, thẻ hưởng 2% / 1%" moTa={`Bán từ giá khuyến mại của gói: ${phanTram(c.tv.goi_km)}; thấp hơn: ${phanTram(c.tv.goi_duoi_km)}. Ghép đúng gói/dịch vụ trong phần mềm để hệ thống nhận ra đơn bán.`}
          phai={<NutHop nhan="Thêm gói" tieuDe="Thêm gói vào danh mục" action={luuDanhMuc} truong={[{ ten: "ten", nhan: "Tên trong chính sách", loai: "chu", batBuoc: true, rong: true }, { ten: "gia_khuyen_mai", nhan: "Giá khuyến mại của gói", loai: "tien", batBuoc: true }, { ten: "thu_tu", nhan: "Thứ tự", loai: "so" }, { ten: "goi_id", nhan: "Gói / thẻ trong phần mềm", loai: "chon", luaChon: chonGoi, rong: true }, { ten: "dich_vu_id", nhan: "Hoặc dịch vụ", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không" }, ...chonDv], rong: true }]} />}>
          <ul className="divide-y divide-vien">
            {(dm ?? []).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13.5px]">
                <span className="min-w-0"><span className="font-medium text-muc">{x.ten}</span> <span className="tabular-nums text-nhan-dam">{tien(Number(x.gia_khuyen_mai))}</span>
                  <span className="block text-[12px] text-muc-3">{x.goi_id || x.dich_vu_id ? [x.goi_id && `Gói: ${tenGoi.get(x.goi_id) ?? "(đã ẩn)"}`, x.dich_vu_id && `Dịch vụ: ${tenDv.get(x.dich_vu_id) ?? "(đã ẩn)"}`].filter(Boolean).join(" · ") : <NhanTrangThai kieu="cho">Chưa ghép gói trong phần mềm</NhanTrangThai>}</span></span>
                <span className="flex gap-2">
                  <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa gói danh mục" action={luuDanhMuc} giaTri={{ id: x.id, ten: x.ten, gia_khuyen_mai: Number(x.gia_khuyen_mai), thu_tu: x.thu_tu, goi_id: x.goi_id ?? "", dich_vu_id: x.dich_vu_id ?? "" }} an={{ id: x.id }}
                    truong={[{ ten: "ten", nhan: "Tên trong chính sách", loai: "chu", batBuoc: true, rong: true }, { ten: "gia_khuyen_mai", nhan: "Giá khuyến mại của gói", loai: "tien", batBuoc: true }, { ten: "thu_tu", nhan: "Thứ tự", loai: "so" }, { ten: "goi_id", nhan: "Gói / thẻ trong phần mềm", loai: "chon", luaChon: chonGoi, rong: true }, { ten: "dich_vu_id", nhan: "Hoặc dịch vụ", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không" }, ...chonDv], rong: true }]} />
                  <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá khỏi danh mục" moTa={x.ten} an={{ id: x.id }} action={xoaDanhMuc} nhanLuu="Xoá" />
                </span>
              </li>
            ))}
          </ul>
        </The>
      )}

      {tab === "nhom" && (
        <The icon={Users} mau="tim" tieuDe="Nhóm hưởng của từng nhân viên" moTa="Quyết định người đó được tính theo khoản nào. Gợi ý ban đầu theo chức danh — kiểm tra lại người đang giữ vị trí Giám đốc chi nhánh, Trưởng phòng Marketing, Telesale.">
          {timKiem}
          <ul className="divide-y divide-vien">
            {loc((nv ?? []).map((x) => ({ ...x, ten: x.ho_ten }))).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13.5px]">
                <span><span className="font-medium text-muc">{x.ho_ten}</span> <span className="text-muc-3">· {x.chuc_danh ?? "chưa có chức danh"}</span></span>
                <span className="flex items-center gap-2">
                  {x.nhom_hh ? <NhanTrangThai kieu={x.nhom_hh === "khong" ? "tram" : "tot"}>{NHOM_HH[x.nhom_hh as keyof typeof NHOM_HH]}</NhanTrangThai> : <NhanTrangThai kieu="cho">Chưa xếp</NhanTrangThai>}
                  <NutHop kieu="chu" nhan="Đổi" tieuDe={`Nhóm hưởng · ${x.ho_ten}`} an={{ id: x.id }} action={luuNhomHh} giaTri={{ nhom_hh: x.nhom_hh ?? "" }}
                    truong={[{ ten: "nhom_hh", nhan: "Nhóm hưởng", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa xếp" }, ...Object.entries(NHOM_HH).map(([k, v]) => ({ gia_tri: k, nhan: v }))] }]} />
                </span>
              </li>
            ))}
          </ul>
        </The>
      )}

      {tab === "phi" && (
        <>
          {chuaGhep.length > 0 && (
            <The icon={Tags} mau="cam" tieuDe={`Dịch vụ tháng này chưa có đơn giá (${chuaGhep.length})`} moTa="Ghép vào dòng đơn giá phù hợp (Giám đốc chi nhánh duyệt). Ghép theo tên dòng, áp cho cả ca dùng thẻ / liệu trình.">
              <ul className="divide-y divide-vien">
                {chuaGhep.map((x) => (
                  <li key={x.doiTuong + x.ten} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]">
                    <span><span className="text-muc">{x.ten}</span> <span className="text-muc-3">· {x.doiTuong === "bac_si" ? "bác sĩ làm" : "trị liệu viên làm"} · {x.soCa} ca</span></span>
                    <NutHop kieu="chu" nhan="Ghép" tieuDe="Ghép vào dòng đơn giá" moTa={x.ten} an={{ ten: x.ten }} action={ghepTenDonGia}
                      truong={[{ ten: "don_gia_id", nhan: "Dòng đơn giá", loai: "chon", batBuoc: true, luaChon: (dg ?? []).filter((d) => d.doi_tuong === x.doiTuong).map((d) => ({ gia_tri: d.id, nhan: `${d.stt}. ${d.ten} · ${tien(Number(d.don_gia))}` })) }]} />
                  </li>
                ))}
              </ul>
            </The>
          )}
          {(["bac_si", "tri_lieu"] as const).map((dt) => (
            <The key={dt} icon={Stethoscope} mau={dt === "bac_si" ? "dat" : "xanh"} tieuDe={dt === "bac_si" ? "PL01 – Đơn giá bác sĩ" : "PL02 – Đơn giá trị liệu viên"} moTa="Mỗi dòng ghép với dịch vụ trong phần mềm và/hoặc tên dòng hoá đơn (ca dùng thẻ chỉ có tên).">
              <ul className="divide-y divide-vien">
                {(dg ?? []).filter((d) => d.doi_tuong === dt).map((d) => (
                  <li key={d.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-[13.5px]">
                    <span className="min-w-0 flex-1"><span className="text-muc-3">{d.stt}.</span> <span className="font-medium text-muc">{d.ten}</span> <span className="text-muc-3">· {d.dvt}</span> <span className="font-semibold tabular-nums text-nhan-dam">{Number(d.don_gia) ? tien(Number(d.don_gia)) : "Không tính"}</span>
                      <span className="mt-0.5 block text-[12px] text-muc-3">{d.dich_vu_ids.length + d.ten_ghep.length ? `${d.dich_vu_ids.length} dịch vụ · ${d.ten_ghep.length} tên dòng: ${[...d.dich_vu_ids.map((i) => tenDv.get(i) ?? ""), ...d.ten_ghep].filter(Boolean).slice(0, 6).join(", ")}${d.dich_vu_ids.length + d.ten_ghep.length > 6 ? "…" : ""}` : "Chưa ghép dịch vụ nào"}</span></span>
                    <NutHop kieu="chu" nhan="Sửa" tieuDe={`${d.stt}. ${d.ten}`} an={{ id: d.id }} action={luuDonGia} rong giaTri={{ don_gia: Number(d.don_gia), dich_vu_ids: d.dich_vu_ids, ten_ghep: d.ten_ghep.join("\n") }}
                      truong={[{ ten: "don_gia", nhan: `Đơn giá (đồng / ${d.dvt})`, loai: "tien" }, { ten: "dich_vu_ids", nhan: "Dịch vụ trong phần mềm", loai: "nhieu", luaChon: chonDv, rong: true }, { ten: "ten_ghep", nhan: "Tên dòng hoá đơn (mỗi dòng một tên)", loai: "nhieu_dong", rong: true, ghiChu: "Ca dùng thẻ / liệu trình chỉ có tên, ghép bằng tên này (không phân biệt hoa thường)." }]} />
                  </li>
                ))}
              </ul>
            </The>
          ))}
        </>
      )}

      {tab === "gia" && (
        <The icon={Tags} mau="hong" tieuDe="Giá khuyến mại và giá tối thiểu" moTa="Theo Bảng giá khách hàng (PL02) và Chính sách giá (PL03). Bán từ giá khuyến mại: mức đầy đủ; giữa giá tối thiểu và giá khuyến mại: giá sàn; dưới giá tối thiểu: không tính hoa hồng. Để trống = tạm tính mức giá khuyến mại.">
          {timKiem}
          {([["goi_the", "Gói, thẻ, liệu trình", goi ?? []], ["dich_vu", "Dịch vụ lẻ", dv ?? []]] as const).map(([bang, ten, ds]) => {
            const hien = loc(ds as { id: string; ten: string; ma: string; gia: number; gia_khuyen_mai: number | null; gia_toi_thieu: number | null }[]);
            return (
              <div key={bang} className="mb-5 last:mb-0">
                <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muc-3">{ten} ({hien.length})</h3>
                <ul className="divide-y divide-vien">
                  {hien.slice(0, 300).map((x) => (
                    <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]">
                      <span className="min-w-0 flex-1"><span className="text-muc">{x.ten}</span> <span className="text-[12px] text-muc-3">· giá niêm yết {tien(Number(x.gia))}</span></span>
                      <span className="flex items-center gap-3 tabular-nums">
                        {x.gia_khuyen_mai != null ? <span className="text-[12.5px] text-muc-2">KM {tien(Number(x.gia_khuyen_mai))}{x.gia_toi_thieu != null ? ` · tối thiểu ${tien(Number(x.gia_toi_thieu))}` : ""}</span> : <NhanTrangThai kieu="cho">Chưa có giá KM</NhanTrangThai>}
                        <NutHop kieu="chu" nhan="Sửa" tieuDe={x.ten} moTa={`Giá niêm yết ${tien(Number(x.gia))}`} an={{ bang, id: x.id }} action={luuGiaMuc} giaTri={{ gia_khuyen_mai: x.gia_khuyen_mai ?? "", gia_toi_thieu: x.gia_toi_thieu ?? "" }}
                          truong={[{ ten: "gia_khuyen_mai", nhan: "Giá khuyến mại", loai: "tien" }, { ten: "gia_toi_thieu", nhan: "Giá tối thiểu", loai: "tien", ghiChu: "Để trống = không chặn mức giá sàn" }]} />
                      </span>
                    </li>
                  ))}
                </ul>
                {hien.length > 300 && <p className="mt-2 text-[12px] text-muc-3">Hiện 300 / {hien.length}. Gõ tên để tìm.</p>}
              </div>
            );
          })}
        </The>
      )}
    </div>
  );
}
