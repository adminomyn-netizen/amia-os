import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { docHet } from "@/lib/xuat-excel";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { boDau, tienVN } from "@/lib/dinh-dang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { NutTinhLai } from "@/components/hoa-hong/NutTinhLai";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NutHop } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { SaoChepHoaHong } from "@/components/hoa-hong/SaoChepHoaHong";
import { NhapTiLeHoaHong } from "@/components/hoa-hong/NhapTiLeHoaHong";
import { LocTiLe } from "@/components/hoa-hong/LocTiLe";
import { LuoiTheoNhanVien, LuoiTheoSanPham, type DoiTuong, type DongTl, type Muc } from "@/components/hoa-hong/LuoiTiLe";
import { GIO_HE_SO, SAO_HE_SO } from "@/lib/hoa-hong";
import { apDungNhapTiLe, apDungSaoChep, luuCaiDatNangCao, luuMucGioiThieu, luuTiLe, themNguonGioiThieu, xemTruocNhapTiLe, xemTruocSaoChep, xoaTiLe } from "./actions";

const TAB = [{ ma: "bang", ten: "Bảng hoa hồng" }, { ma: "ti-le", ten: "Tỉ lệ hoa hồng" }, { ma: "nang-cao", ten: "Cài đặt nâng cao" }, { ma: "nguon", ten: "Nguồn giới thiệu" }];
const KIEU_GT = [{ gia_tri: "phan_tram", nhan: "Theo phần trăm" }, { gia_tri: "tien", nhan: "Theo tiền" }, { gia_tri: "diem", nhan: "Theo điểm" }];
const CHIA = [{ gia_tri: "giu_nguyen", nhan: "Giữ nguyên" }, { gia_tri: "chia_deu", nhan: "Chia đều" }];
const LOAI = [{ gia_tri: "dich_vu", nhan: "Dịch vụ" }, { gia_tri: "san_pham", nhan: "Sản phẩm" }, { gia_tri: "goi_the", nhan: "Bán thẻ / liệu trình" }];
const VAI = [{ gia_tri: "phuc_vu", nhan: "Phục vụ" }, { gia_tri: "tu_van", nhan: "Tư vấn" }, { gia_tri: "ban", nhan: "Bán hàng" }, { gia_tri: "gioi_thieu", nhan: "Giới thiệu" }];
const nhan = (lc: { gia_tri: string; nhan: string }[], v: string) => lc.find((x) => x.gia_tri === v)?.nhan ?? v;

export default async function TrangHoaHong({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string; q?: string; xem?: string; dt?: string; muc?: string; loai?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("baocao.tien");
  const sp = await searchParams;
  const tab = sp.tab === "ti-le" || sp.tab === "nang-cao" || sp.tab === "nguon" ? sp.tab : "bang";
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const db = sb();
  const sua = coQuyen(nd, "danhmuc.sua");
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  let noiDung: React.ReactNode;
  if (tab === "bang") {
    const [{ data, error: loiHh }, { data: nv }, { data: dsCn }, { data: cd }] = await Promise.all([db.rpc("bc_hoa_hong_nv_nhom", { p_tu: tu, p_den: den, p_cn: cn as string }), db.from("nhan_vien").select("id, ho_ten, chuc_danh"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"), db.rpc("bc_cham_diem_nv", { p_tu: tu, p_den: den, p_cn: cn as string })]);
    const chamDiem = new Map((cd ?? []).map((x) => [x.nhan_vien_id, x]));
    const nvMap = new Map((nv ?? []).map((n) => [n.id, n]));
    type Nhom = { so: number; ds: number; hh: number };
    const theo = new Map<string, { id: string; nhom: Record<string, Nhom>; tong: number }>();
    for (const r of data ?? []) {
      const g = theo.get(r.nhan_vien_id) ?? { id: r.nhan_vien_id, nhom: {}, tong: 0 };
      g.nhom[r.nhom] = { so: r.so_dong, ds: Number(r.doanh_so), hh: Number(r.hoa_hong) }; g.tong += Number(r.hoa_hong); theo.set(r.nhan_vien_id, g);
    }
    const tuKhoa = boDau((sp.q ?? "").trim());
    const ds = [...theo.values()].filter((g) => !tuKhoa || boDau(nvMap.get(g.id)?.ho_ten ?? "").includes(tuKhoa)).sort((a, b) => b.tong - a.tong || (nvMap.get(a.id)?.ho_ten ?? "").localeCompare(nvMap.get(b.id)?.ho_ten ?? "", "vi"));
    const o = (g: (typeof ds)[number], k: string): Nhom => g.nhom[k] ?? { so: 0, ds: 0, hh: 0 };
    const coKhac = ds.some((g) => o(g, "khac").ds !== 0 || o(g, "khac").hh !== 0);
    const tongHh = ds.reduce((t, g) => t + g.tong, 0), tongDs = ds.reduce((t, g) => t + Object.values(g.nhom).reduce((x, y) => x + y.ds, 0), 0);
    const hienDs = (g: (typeof ds)[number], k: string) => <span className="block"><span className="tabular-nums">{tienVN(o(g, k).ds)}</span><span className="block text-[12px] text-muc-3">Số lượng: {o(g, k).so}</span></span>;
    const nutChiTiet = (g: (typeof ds)[number]) => <Link href={`/hoa-hong/chi-tiet?nv=${g.id}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Chi tiết</Link>;
    const cotNhom = [["tu_van", "tư vấn"], ["dich_vu", "d.vụ"], ["san_pham", "s.phẩm"], ["ban_the", "bán thẻ"]].flatMap(([k, t]) => [
      { nhan: `Doanh số ${t}`, phai: true, hienThi: (g: (typeof ds)[number]) => hienDs(g, k) }, { nhan: `Hoa hồng ${t}`, phai: true, hienThi: (g: (typeof ds)[number]) => tienVN(o(g, k).hh) },
    ]);
    if (loiHh) console.error("[hoa-hong]", loiHh.message);
    noiDung = loiHh ? (
      <>
        <LocBaoCao goc="/hoa-hong" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <div role="alert" className="rounded-nho bg-loi-nen px-3.5 py-3 text-[14px] text-loi">Chưa tính được hoa hồng vì hệ thống đang chậm (không phải do chưa có doanh số). Chờ vài giây rồi bấm tải lại, hoặc chọn khoảng ngày ngắn hơn.</div>
        <div className="mt-3"><NutTinhLai /></div>
      </>
    ) : (
      <>
        <LocBaoCao goc="/hoa-hong" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form method="get" action="/hoa-hong" className="flex flex-wrap gap-2">
            <input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />{sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm nhân viên" aria-label="Tìm nhân viên" className={`${O_NHAP} w-60`} />
            <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
          </form>
          <NutTinhLai />
          <form id="hh-chon" method="get" action="/api/xuat/hoa-hong-chi-tiet" className="flex flex-wrap gap-2">
            <input type="hidden" name="tu" value={tu} /><input type="hidden" name="den" value={den} />{sp.cn && <input type="hidden" name="cn" value={sp.cn} />}
            <a href={`/api/xuat/hoa-hong-chi-tiet?tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`} className={`${NUT_PHU} inline-flex h-10 items-center`}>Chi tiết toàn bộ nhân viên</a>
            <button type="submit" className={`${NUT_PHU} h-10`} title="Tích ô ở cột đầu để chọn nhân viên">Chi tiết nhân viên được chọn</button>
          </form>
        </div>
        <HangChiSo muc={[{ nhan: "Tổng hoa hồng", so: tienVN(tongHh), ghiChu: tongHh === 0 ? "chưa cài tỉ lệ nào nên đang tính 0" : undefined }, { nhan: "Tổng doanh số có gán người hưởng", so: tienVN(tongDs) }]} />
        <div className="mt-6" />
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có doanh số nào có gán người hưởng trong khoảng này."
          cot={[{ nhan: "", hienThi: (r) => <input type="checkbox" name="nv" value={r.id} form="hh-chon" aria-label={`Chọn ${nvMap.get(r.id)?.ho_ten ?? "nhân viên"}`} className="h-4 w-4 accent-[var(--nhan)]" /> },
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{nvMap.get(r.id)?.ho_ten}</span><span className="block text-[12px] text-muc-3">{nvMap.get(r.id)?.chuc_danh ?? ""}</span></span> },
            ...cotNhom,
            ...(coKhac ? [{ nhan: "Doanh số khác", phai: true, hienThi: (g: (typeof ds)[number]) => hienDs(g, "khac") }, { nhan: "Hoa hồng khác", phai: true, hienThi: (g: (typeof ds)[number]) => tienVN(o(g, "khac").hh) }] : []),
            { nhan: "Tổng hoa hồng", phai: true, hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.tong)}</span> },
            { nhan: "Chấm điểm d.vụ", phai: true, hienThi: (r) => { const c = chamDiem.get(r.id); return c ? <span className="block tabular-nums">{Number(c.diem_tb).toLocaleString("vi-VN")} sao<span className="block text-[12px] text-muc-3">{c.so_luot} lượt</span></span> : <span className="text-muc-3">—</span>; } },
            { nhan: "", hienThi: nutChiTiet }]} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Hoa hồng tạm tính theo tỉ lệ đang cài (mục chưa cài tỉ lệ tính 0). Doanh số dịch vụ làm bằng thẻ tính theo giá một buổi của thẻ (như SalonHero); hoa hồng buổi làm bằng thẻ tính trên “giá trị 1 lần làm dịch vụ” của thẻ (thẻ khách có số riêng thì dùng, không thì theo loại thẻ: tự tính = giá bán ÷ số lần), như SalonHero. Cách chia nhiều người, giảm giá, giờ, sao: tab Cài đặt nâng cao. Doanh số tư vấn = các dòng đứng vai Tư vấn; dịch vụ = vai Phục vụ ở dòng dịch vụ; sản phẩm / bán thẻ = vai Bán hàng ở dòng sản phẩm / thẻ. “Tính lại hoa hồng” chỉ tải lại số: AMIA tính trực tiếp từ hoá đơn mỗi lần mở trang nên không có số cũ lưu sẵn. Phí bác sĩ: SalonHero không có mục riêng, bác sĩ hưởng hoa hồng làm dịch vụ như nhân viên phục vụ — muốn trả theo buổi thì cài tỉ lệ hoặc số tiền cố định riêng cho bác sĩ đó ở tab Tỉ lệ hoa hồng.</p>
      </>
    );
  } else if (tab === "nguon") {
    const { data: dsNg, error: loiNg } = await db.from("doi_tac_gt").select("id, ma, ma_gioi_thieu, ten, loai, loai_sh, dien_thoai, hoat_dong, hh_kieu, hh_gia_tri, khach_id, sh_id, khach_hang(ho_ten, ma)").order("ten");
    if (loiNg) console.error("[hoa-hong/nguon]", loiNg.message);
    const tuKhoa = boDau((sp.q ?? "").trim());
    const ds = (dsNg ?? []).filter((r) => !tuKhoa || boDau(`${r.ten} ${r.ma_gioi_thieu} ${r.dien_thoai ?? ""}`).includes(tuKhoa));
    const muc = (r: (typeof ds)[number]) => (r.hh_kieu === "tien" ? tienVN(Number(r.hh_gia_tri)) : r.hh_kieu === "diem" ? `${Number(r.hh_gia_tri)} điểm` : `${Number(r.hh_gia_tri)}%`);
    const truong = [{ ten: "hh_kieu", nhan: "Mức hoa hồng mặc định", loai: "chon" as const, luaChon: KIEU_GT, batBuoc: true }, { ten: "hh_gia_tri", nhan: "Giá trị", loai: "so" as const, ghiChu: "Phần trăm: % trên doanh số dòng sau giảm giá (số lẻ dùng dấu phẩy, vd 12,5). Theo tiền: số đồng mỗi lượt. Theo điểm: ghi điểm, không tính tiền." }];
    const nhanLoai = (r: (typeof ds)[number]) => (r.loai_sh === "CUSTOMER" || r.loai === "khach_cu" ? "Khách hàng" : r.loai_sh === "OPERATOR" ? "Nhân viên" : r.loai_sh === "PARTNER" || r.loai === "ctv" ? "Đối tác" : r.loai === "kol" ? "KOL" : "Khác");
    noiDung = loiNg ? <div role="alert" className="rounded-nho bg-loi-nen px-3.5 py-3 text-[14px] text-loi">Chưa tải được danh sách nguồn giới thiệu. Chờ vài giây rồi tải lại trang.</div> : (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
        <form method="get" action="/hoa-hong" className="flex flex-wrap gap-2">
          <input type="hidden" name="tab" value="nguon" />
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm tên, mã, số điện thoại" aria-label="Tìm nguồn giới thiệu" className={`${O_NHAP} w-64 max-w-full`} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
        </form>
          {sua && <NutHop kieu="phu" nhan="Thêm nguồn" tieuDe="Thêm nguồn giới thiệu" action={themNguonGioiThieu} giaTri={{ loai: "khach_cu", hh_kieu: "phan_tram", hh_gia_tri: 0 }}
            truong={[{ ten: "ten", nhan: "Tên nguồn giới thiệu", loai: "chu", batBuoc: true, rong: true }, { ten: "ma_gioi_thieu", nhan: "Mã giới thiệu", loai: "chu", ghiChu: "Để trống thì tự sinh." },
              { ten: "dien_thoai", nhan: "Số điện thoại", loai: "chu", ghiChu: "Trùng đúng một khách thì tự ghép với khách đó." },
              { ten: "loai", nhan: "Loại", loai: "chon", luaChon: [{ gia_tri: "khach_cu", nhan: "Khách hàng" }, { gia_tri: "ctv", nhan: "Đối tác" }, { gia_tri: "kol", nhan: "KOL" }, { gia_tri: "khac", nhan: "Khác" }], batBuoc: true }, ...truong, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }]} />}
        </div>
        <HangChiSo muc={[{ nhan: "Nguồn giới thiệu", so: String((dsNg ?? []).length) }, { nhan: "Có mức hoa hồng khác 0", so: String((dsNg ?? []).filter((r) => Number(r.hh_gia_tri) > 0).length) }]} />
        <div className="mt-6" />
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có nguồn giới thiệu nào."
          cot={[{ nhan: "Nguồn", chinh: true, hienThi: (r) => <span className="block"><span className="text-muc">{r.ten}</span><span className="block text-[12px] text-muc-3">{[r.ma_gioi_thieu, r.dien_thoai].filter(Boolean).join(" · ")}{r.hoat_dong ? "" : " · ngừng"}</span></span> },
            { nhan: "Loại", hienThi: nhanLoai },
            { nhan: "Khách trên AMIA", hienThi: (r) => { const k = r.khach_hang as { ho_ten: string; ma: string } | null; return k && r.khach_id ? <Link href={`/khach-hang/${r.khach_id}`} className="text-nhan-dam underline-offset-4 hover:underline">{k.ma}</Link> : <span className="text-muc-3">chưa ghép</span>; } },
            { nhan: "Mức hoa hồng mặc định", phai: true, hienThi: (r) => <span className="tabular-nums">{muc(r)}</span> },
            ...(sua ? [{ nhan: "", hienThi: (r: (typeof ds)[number]) => <NutHop kieu="chu" nhan="Sửa" tieuDe={`Mức hoa hồng — ${r.ten}`} truong={truong} giaTri={{ id: r.id, hh_kieu: r.hh_kieu, hh_gia_tri: Number(r.hh_gia_tri) }} an={{ id: r.id }} action={luuMucGioiThieu} /> }] : [])]} />
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Như SalonHero: mỗi nguồn giới thiệu có mức hoa hồng mặc định theo phần trăm, theo tiền hoặc theo điểm. 78 nguồn đã chuyển từ SalonHero ngày 03/11/2026 (70 nguồn 0%, 3 nguồn 10%, 3 nguồn theo tiền). Hoá đơn có người giới thiệu là khách đã ghép với một nguồn thì hoa hồng giới thiệu tính theo mức của nguồn đó (xem báo cáo Hoa hồng giới thiệu); khách chưa là nguồn thì theo tỉ lệ vai Giới thiệu ở tab Tỉ lệ. Thêm nguồn hoặc sửa tên, số điện thoại ở <Link href="/marketing/doi-tac" className="text-nhan-dam underline-offset-4 hover:underline">Marketing · Đối tác giới thiệu</Link>.</p>
      </>
    );
  } else if (tab === "nang-cao") {
    const [{ data: dsCd }, { data: dsCn }] = await Promise.all([db.from("hoa_hong_cai_dat").select("*"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma")]);
    const cdMap = new Map((dsCd ?? []).map((c) => [c.chi_nhanh_id, c]));
    const cns = (dsCn ?? []).filter((c) => !nd.chiNhanhId || c.id === nd.chiNhanhId);
    const heSo = (o: unknown) => Object.entries((o ?? {}) as Record<string, number>);
    const truong = [
      { ten: "chia_dv", nhan: "Hoa hồng dịch vụ (khi số người làm nhiều hơn tiêu chuẩn)", loai: "chon" as const, luaChon: [{ gia_tri: "giu_nguyen", nhan: "Giữ nguyên hoa hồng dịch vụ" }, { gia_tri: "chia_deu", nhan: "Chia đều hoa hồng dịch vụ theo nhóm" }], batBuoc: true, rong: true },
      { ten: "chia_ban", nhan: "Hoa hồng bán sản phẩm / thẻ", loai: "chon" as const, luaChon: [{ gia_tri: "giu_nguyen", nhan: "Giữ nguyên hoa hồng bán hàng" }, { gia_tri: "chia_deu", nhan: "Chia đều hoa hồng" }], batBuoc: true },
      { ten: "chia_tu_van", nhan: "Hoa hồng tư vấn", loai: "chon" as const, luaChon: [{ gia_tri: "giu_nguyen", nhan: "Giữ nguyên hoa hồng tư vấn" }, { gia_tri: "chia_deu", nhan: "Chia đều hoa hồng tư vấn" }], batBuoc: true },
      { ten: "so_nv_tieu_chuan", nhan: "Số người tiêu chuẩn mỗi dòng", loai: "so" as const, ghiChu: "SalonHero để trống = 1 người." },
      { ten: "thoi_diem", nhan: "Thời điểm tính hoa hồng", loai: "chon" as const, luaChon: [{ gia_tri: "sau", nhan: "Tính sau khi áp dụng giảm giá" }, { gia_tri: "truoc", nhan: "Tính trước khi áp dụng giảm giá" }], batBuoc: true },
      { ten: "loai_giam", nhan: "Các loại giảm giá áp dụng khi tính hoa hồng", loai: "chon" as const, luaChon: [{ gia_tri: "ca_hai", nhan: "Cả giảm giá từng dòng và giảm giá tổng hoá đơn" }, { gia_tri: "chi_dong", nhan: "Chỉ giảm giá trên từng sản phẩm, dịch vụ" }], hienKhi: { ten: "thoi_diem", la: ["sau"] } },
      ...GIO_HE_SO.map((g) => ({ ten: `gio_${g}`, nhan: `Hoa hồng làm dịch vụ lúc ${g} giờ (%)`, loai: "so" as const, goiY: "100" })),
      ...SAO_HE_SO.map((k) => ({ ten: `sao_${k}`, nhan: `Khách chấm ${k} sao (%)`, loai: "so" as const, goiY: "100" })),
    ];
    noiDung = (
      <>
        <div className="space-y-4">
          {cns.map((c) => {
            const x = cdMap.get(c.id);
            const g = {
              chi_nhanh_id: c.id, chia_dv: x?.chia_deu_dich_vu ? "chia_deu" : "giu_nguyen", chia_ban: x && !x.chia_deu_ban ? "giu_nguyen" : "chia_deu", chia_tu_van: x && !x.chia_deu_tu_van ? "giu_nguyen" : "chia_deu",
              so_nv_tieu_chuan: x?.so_nv_tieu_chuan ?? 1, thoi_diem: x && !x.tinh_sau_giam_gia ? "truoc" : "sau", loai_giam: x && !x.ap_giam_gia_tong_don ? "chi_dong" : "ca_hai",
              ...Object.fromEntries(heSo(x?.he_so_gio).map(([k, v]) => [`gio_${k}`, v])), ...Object.fromEntries(heSo(x?.he_so_sao).map(([k, v]) => [`sao_${k}`, v])),
            };
            const gio = heSo(x?.he_so_gio), sao = heSo(x?.he_so_sao);
            return (
              <section key={c.id} className="rounded-nho border border-vien bg-giay p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[15px] font-medium text-muc">{c.ten}</h2>
                  {sua && <NutHop kieu="phu" nhan="Sửa" tieuDe={`Cài đặt nâng cao — ${c.ten}`} moTa="Áp cho mọi báo cáo hoa hồng và bảng lương tính từ nay. Hệ số để trống = 100%." truong={truong} giaTri={g} an={{ chi_nhanh_id: c.id }} action={luuCaiDatNangCao} />}
                </div>
                <dl className="grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
                  <div><dt className="text-[12px] text-muc-3">Số người nhiều hơn tiêu chuẩn ({g.so_nv_tieu_chuan} người)</dt><dd className="text-muc">Dịch vụ: {nhan(CHIA, g.chia_dv)} · Bán sản phẩm / thẻ: {nhan(CHIA, g.chia_ban)} · Tư vấn: {nhan(CHIA, g.chia_tu_van)}</dd></div>
                  <div><dt className="text-[12px] text-muc-3">Thời điểm tính</dt><dd className="text-muc">{g.thoi_diem === "sau" ? `Sau giảm giá (${g.loai_giam === "ca_hai" ? "cả giảm giá dòng và tổng hoá đơn" : "chỉ giảm giá từng dòng"})` : "Trước giảm giá"}</dd></div>
                  <div><dt className="text-[12px] text-muc-3">Theo giờ phục vụ</dt><dd className="text-muc">{gio.length ? gio.map(([k, v]) => `${k}h: ${v}%`).join(" · ") + " · giờ khác 100%" : "100% mọi giờ"}</dd></div>
                  <div><dt className="text-[12px] text-muc-3">Theo số sao khách chấm</dt><dd className="text-muc">{sao.length ? sao.map(([k, v]) => `${k} sao: ${v}%`).join(" · ") + " · còn lại 100%" : "100% mọi mức sao"}</dd></div>
                </dl>
                {x?.sua_boi && <p className="mt-2 text-[12px] text-muc-3">Sửa lần cuối {new Date(x.sua_luc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>}
              </section>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Mặc định đặt đúng lựa chọn SalonHero đang dùng ở cả Vinh và Đà Lạt (đọc ngày 03/11/2026): dịch vụ Giữ nguyên, bán hàng và tư vấn Chia đều, tính sau giảm giá gồm cả giảm giá tổng hoá đơn, theo giờ / theo sao 100%. Giữ nguyên: mỗi người làm nhận đủ hoa hồng của dòng. Chia đều: khi số người vượt tiêu chuẩn thì chia theo tỉ lệ chia người trên hoá đơn (tiêu chuẩn 1, hai người 50/50 → mỗi người một nửa). Hệ số giờ (giờ vào của hoá đơn) và hệ số sao (khách chấm nhân viên đó) chỉ áp cho hoa hồng làm dịch vụ. Doanh số không đổi theo các lựa chọn này.</p>
      </>
    );
  } else {
    const [tl, { data: dv }, { data: sp2 }, { data: g }, { data: nvs }] = await Promise.all([docHet((a, b) => db.from("hoa_hong_ti_le").select("*").order("id").range(a, b)), db.from("dich_vu").select("id, ten, ma, hoat_dong").order("ten"), db.from("san_pham").select("id, ten, ma, hoat_dong").order("ten"), db.from("goi_the").select("id, ten, ma, hoat_dong").order("ten"), db.from("nhan_vien").select("id, ho_ten, chuc_danh, hoat_dong, chi_nhanh_id").order("ho_ten")]);
    const { data: dsCnTl } = await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma");
    // Mục đang bán chưa có tỉ lệ riêng: dùng tỉ lệ mặc định của loại, không có mặc định thì hoa hồng tính 0.
    const chuaRieng = (loai: string, nhanLoai: string, ds: { id: string; hoat_dong: boolean }[] | null) => {
      const co = new Set((tl ?? []).filter((r) => r.loai === loai && r.muc_id).map((r) => r.muc_id));
      const n = (ds ?? []).filter((m) => m.hoat_dong && !co.has(m.id)).length;
      if (!n) return null;
      return `${n} ${nhanLoai} chưa có tỉ lệ riêng, ${(tl ?? []).some((r) => r.loai === loai && !r.muc_id) ? "đang dùng tỉ lệ mặc định của loại" : "chưa có tỉ lệ mặc định nên đang tính 0%"}.`;
    };
    const canhBao = (tl ?? []).length ? [chuaRieng("dich_vu", "dịch vụ", dv), chuaRieng("goi_the", "gói thẻ / liệu trình", g), chuaRieng("san_pham", "sản phẩm", sp2)].filter(Boolean) : [];
    const ten = new Map<string, string>([...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => [x.id, x.ten]));
    const mucLC = [{ gia_tri: "", nhan: "Mặc định cả loại" }, ...[...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => ({ gia_tri: x.id, nhan: x.ten }))];
    // Đối tượng áp dụng: chung, nhóm theo chức danh (chuẩn hoá chữ thường, bỏ khoảng thừa), hoặc một nhân viên (người đang làm + người đã có cài đặt riêng).
    const chuan = (c: string | null) => (c ?? "").trim().toLowerCase();
    const nhom = new Map<string, string>();
    for (const n of nvs ?? []) if (n.hoat_dong && chuan(n.chuc_danh) && !nhom.has(chuan(n.chuc_danh))) nhom.set(chuan(n.chuc_danh), n.chuc_danh!.trim());
    for (const r of tl ?? []) if (r.nhom_chuc_danh && !nhom.has(r.nhom_chuc_danh)) nhom.set(r.nhom_chuc_danh, r.nhom_chuc_danh);
    const coRieng = new Set((tl ?? []).map((r) => r.nhan_vien_id).filter(Boolean));
    const tenNvMap = new Map((nvs ?? []).map((n) => [n.id, n.ho_ten]));
    const doiTuongLC = [{ gia_tri: "", nhan: "Mọi người (cài đặt chung)" }, ...[...nhom.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi")).map(([k, t]) => ({ gia_tri: `nhom:${k}`, nhan: `Nhóm: ${t}` })),
      ...(nvs ?? []).filter((n) => n.hoat_dong || coRieng.has(n.id)).map((n) => ({ gia_tri: `nv:${n.id}`, nhan: `Nhân viên: ${n.ho_ten}${n.hoat_dong ? "" : " (đã nghỉ)"}` }))];
    const tenDoiTuong = (r: NonNullable<typeof tl>[number]) => (r.nhan_vien_id ? `Nhân viên: ${tenNvMap.get(r.nhan_vien_id) ?? ""}` : r.nhom_chuc_danh ? `Nhóm: ${nhom.get(r.nhom_chuc_danh) ?? r.nhom_chuc_danh}` : "Mọi người");
    const maDoiTuong = (r: NonNullable<typeof tl>[number]) => (r.nhan_vien_id ? `nv:${r.nhan_vien_id}` : r.nhom_chuc_danh ? `nhom:${r.nhom_chuc_danh}` : "");
    const dsTl = [...(tl ?? [])].sort((a, b) => (a.nhan_vien_id ? 2 : a.nhom_chuc_danh ? 1 : 0) - (b.nhan_vien_id ? 2 : b.nhom_chuc_danh ? 1 : 0) || tenDoiTuong(a).localeCompare(tenDoiTuong(b), "vi") || a.loai.localeCompare(b.loai) || a.vai.localeCompare(b.vai));
    // Lọc như SalonHero (mục 88): chi nhánh (dòng riêng của nhân viên thuộc chi nhánh khác bị ẩn; dòng chung / nhóm luôn hiện), loại, ô tìm tên–mã mục hoặc người.
    const cnTl = nd.chiNhanhId ?? (sp.cn || "");
    const nvCn = new Map((nvs ?? []).map((n) => [n.id, n.chi_nhanh_id]));
    const loaiTl = ["dich_vu", "san_pham", "goi_the"].includes(sp.loai ?? "") ? sp.loai! : "";
    const tuKhoaTl = boDau((sp.q ?? "").trim());
    const maMuc = new Map<string, string>([...(dv ?? []), ...(sp2 ?? []), ...(g ?? [])].map((x) => [x.id, x.ma ?? ""]));
    const dsLoc = dsTl.filter((r) => (!cnTl || !r.nhan_vien_id || nvCn.get(r.nhan_vien_id) === cnTl) && (!loaiTl || r.loai === loaiTl)
      && (!tuKhoaTl || boDau(`${r.muc_id ? `${ten.get(r.muc_id) ?? ""} ${maMuc.get(r.muc_id) ?? ""}` : "mặc định cả loại"} ${tenDoiTuong(r)}`).includes(tuKhoaTl)));
    const xem = sp.xem === "nv" || sp.xem === "sp" ? sp.xem : "";
    const tatCaMuc: Muc[] = [...(dv ?? []).map((x) => ({ ...x, loai: "dich_vu" as const })), ...(sp2 ?? []).map((x) => ({ ...x, loai: "san_pham" as const })), ...(g ?? []).map((x) => ({ ...x, loai: "goi_the" as const }))]
      .filter((x) => x.hoat_dong).map((x) => ({ id: x.id, ten: x.ten, ma: x.ma ?? "", loai: x.loai }));
    const dtLC = doiTuongLC.filter((l) => !l.gia_tri.startsWith("nv:") || !cnTl || nvCn.get(l.gia_tri.slice(3)) === cnTl);
    const dtChon = dtLC.some((l) => l.gia_tri === sp.dt) ? sp.dt! : "";
    const nhomCua = (ma: string) => (ma.startsWith("nv:") ? chuan((nvs ?? []).find((n) => n.id === ma.slice(3))?.chuc_danh ?? null) || null : null);
    const mucLoc = tatCaMuc.filter((m) => (!loaiTl || m.loai === loaiTl) && (!tuKhoaTl || boDau(`${m.ten} ${m.ma}`).includes(tuKhoaTl)));
    const SO_DONG = 50, trangTl = Math.max(1, Number(sp.trang) || 1), soTrangTl = Math.max(1, Math.ceil(mucLoc.length / SO_DONG));
    const mucChon = tatCaMuc.find((m) => m.id === sp.muc) ?? tatCaMuc[0];
    const dtTheoSp: DoiTuong[] = dtLC.map((l) => ({ ma: l.gia_tri, ten: l.nhan, nhom: nhomCua(l.gia_tri) })).filter((d) => !tuKhoaTl || boDau(d.ten).includes(tuKhoaTl));
    const ganTrang = (t: number) => `/hoa-hong?${new URLSearchParams(Object.entries({ tab: "ti-le", xem, dt: dtChon, loai: loaiTl, q: sp.q, cn: sp.cn, trang: t > 1 ? String(t) : "" }).filter((e): e is [string, string] => !!e[1])).toString()}`;
    const locTl = <LocTiLe xem={xem} cn={sp.cn ?? ""} loai={loaiTl} q={sp.q ?? ""} dt={dtChon} muc={mucChon?.id ?? ""} chiNhanh={nd.chiNhanhId ? undefined : (dsCnTl ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} doiTuong={dtLC} mucLC={tatCaMuc.map((m) => ({ gia_tri: m.id, nhan: `${m.ten}${m.ma ? ` · ${m.ma}` : ""}`, nhom: m.loai === "dich_vu" ? "Dịch vụ" : m.loai === "san_pham" ? "Sản phẩm" : "Thẻ / liệu trình" }))} />;
    const truong = [{ ten: "doi_tuong", nhan: "Áp dụng cho (nhân viên hoặc nhóm chức danh)", loai: "chon" as const, luaChon: doiTuongLC, rong: true, ghiChu: "Để “Mọi người” cho cài đặt chung. Cài riêng cho nhân viên thắng cài đặt nhóm, nhóm thắng cài đặt chung. Đặt 0% là loại riêng người/nhóm/mục đó khỏi hoa hồng; bấm Xoá thì quay về cài đặt chung." },
      { ten: "loai", nhan: "Loại", loai: "chon" as const, luaChon: LOAI, batBuoc: true }, { ten: "vai", nhan: "Vai", loai: "chon" as const, luaChon: VAI, batBuoc: true },
      { ten: "muc_id", nhan: "Áp dụng cho (chọn mục cụ thể để đặt riêng)", loai: "chon" as const, luaChon: mucLC, rong: true }, { ten: "ti_le", nhan: "Tỉ lệ hoa hồng (%)", loai: "so" as const },
      { ten: "so_tien", nhan: "Hoặc cộng số tiền cố định mỗi lượt (đồng)", loai: "tien" as const, ghiChu: "Nhân với số lượng trên hoá đơn; có thể dùng cùng tỉ lệ." }];
    noiDung = (
      <>
        {(tl ?? []).length === 0 && <div role="status" className="mb-4 border-l-2 border-nhan bg-giay-tram px-3 py-2.5 text-[14px] text-muc">Chưa cài tỉ lệ nào nên hoa hồng của mọi đơn đang tính 0. {sua && !nd.chiNhanhId ? "Bấm Nhập từ Excel để cài cả bảng một lần." : "Nhờ quản trị cài bảng tỉ lệ."}</div>}
        {canhBao.length > 0 && <ul className="mb-4 space-y-1 text-[13px] text-muc-2">{canhBao.map((c) => <li key={c}>{c}</li>)}</ul>}
        {sua && <div className="mb-4 flex flex-wrap gap-2.5">{!nd.chiNhanhId && <NhapTiLeHoaHong xemTruoc={xemTruocNhapTiLe} apDung={apDungNhapTiLe} />}<NutHop nhan="Thêm tỉ lệ" tieuDe="Thêm tỉ lệ hoa hồng" moTa="Tỉ lệ riêng cho một dịch vụ, sản phẩm hoặc gói thắng tỉ lệ mặc định của loại đó; cài cho nhân viên hoặc nhóm thì thắng cài đặt chung." truong={truong} giaTri={{ doi_tuong: "", loai: "dich_vu", vai: "ban", muc_id: "" }} action={luuTiLe} />
          <NutHop kieu="phu" nhan="Cài đặt nhanh cho toàn bộ" tieuDe="Cài đặt nhanh cho toàn bộ" moTa="Một tỉ lệ áp cho TẤT CẢ dịch vụ / sản phẩm / gói của loại đã chọn (mặc định loại), như SalonHero “Cài đặt cho toàn bộ”. Mục nào đã cài riêng vẫn giữ tỉ lệ riêng." truong={truong.filter((t) => t.ten !== "muc_id")} an={{ muc_id: "" }} giaTri={{ doi_tuong: "", loai: "dich_vu", vai: "ban" }} action={luuTiLe} nhanLuu="Áp cho toàn bộ" />
          <SaoChepHoaHong luaChon={doiTuongLC.map((l) => (l.gia_tri === "" ? { gia_tri: "chung", nhan: l.nhan } : l))} tenMuc={Object.fromEntries(ten)} xemTruoc={xemTruocSaoChep} apDung={apDungSaoChep} /></div>}
        {locTl}
        {xem === "nv" ? (
          <>
            <LuoiTheoNhanVien tl={(tl ?? []) as DongTl[]} dt={dtChon} nhomNv={nhomCua(dtChon)} muc={mucLoc.slice((trangTl - 1) * SO_DONG, trangTl * SO_DONG)} sua={sua} luu={luuTiLe} />
            {soTrangTl > 1 && <p className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-muc-2">Trang {trangTl}/{soTrangTl} · {mucLoc.length} mục{trangTl > 1 && <Link href={ganTrang(trangTl - 1)} className="text-nhan-dam hover:underline">← Trang trước</Link>}{trangTl < soTrangTl && <Link href={ganTrang(trangTl + 1)} className="text-nhan-dam hover:underline">Trang sau →</Link>}</p>}
          </>
        ) : xem === "sp" ? (
          mucChon ? <LuoiTheoSanPham tl={(tl ?? []) as DongTl[]} muc={mucChon} doiTuong={dtTheoSp} sua={sua} luu={luuTiLe} /> : null
        ) : (
        <Bang duLieu={dsLoc} khoa={(r) => r.id} trong={(tl ?? []).length ? "Không có dòng tỉ lệ nào khớp bộ lọc." : "Chưa cài tỉ lệ nào: mọi hoa hồng đang tính 0."}
          cot={[{ nhan: "Áp dụng cho", chinh: true, hienThi: (r) => <span className="text-muc">{tenDoiTuong(r)}</span> }, { nhan: "Loại", hienThi: (r) => nhan(LOAI, r.loai) }, { nhan: "Vai", hienThi: (r) => nhan(VAI, r.vai) }, { nhan: "Mục", hienThi: (r) => (r.muc_id ? ten.get(r.muc_id) ?? "" : "Mặc định cả loại") }, { nhan: "Tỉ lệ", hienThi: (r) => `${Number(r.ti_le)}%`, phai: true },
            { nhan: "Số tiền cố định / lượt", hienThi: (r) => (r.so_tien ? tienVN(r.so_tien) : ""), phai: true },
            ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof tl>[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa tỉ lệ" truong={truong} giaTri={{ doi_tuong: maDoiTuong(r), loai: r.loai, vai: r.vai, muc_id: r.muc_id ?? "", ti_le: Number(r.ti_le), so_tien: r.so_tien ?? 0 }} action={luuTiLe} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá tỉ lệ" xacNhan="Xoá tỉ lệ này?" an={{ id: r.id }} nhanLuu="Xoá" action={xoaTiLe} /></span> }] : [])]} />
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-muc-3">Thứ tự áp dụng khi tính (người đầu thắng): nhân viên + mục cụ thể, nhân viên + cả loại, nhóm + mục cụ thể, nhóm + cả loại, chung + mục cụ thể, chung + cả loại; không có dòng nào thì 0. Hoa hồng một dòng hàng = (doanh số × tỉ lệ + số tiền cố định × số lượng) × tỉ lệ chia người. Nhóm = chức danh trong hồ sơ nhân viên. Đổi cài đặt chỉ ảnh hưởng số tính lại từ nay, hoá đơn đã chốt vào bảng lương không đổi. Vai Giới thiệu dùng cho báo cáo hoa hồng giới thiệu. Bác sĩ hưởng hoa hồng làm dịch vụ như nhân viên phục vụ (SalonHero không có phí bác sĩ riêng): cài riêng theo nhân viên. Đối chiếu SalonHero 03/11/2026: SalonHero cài theo dịch vụ × nhân viên, hiện mọi mức đang 0%.</p>
      </>
    );
  }
  return (
    <>
      <TieuDeTrang tieuDe="Hoa hồng" phu="Tính từ hoá đơn đã chốt: doanh số chia theo vai Phục vụ, Tư vấn, Bán hàng, nhân tỉ lệ hoa hồng, theo Cài đặt nâng cao.">
        {tab === "bang" ? <NutXuatExcel loai="hoa-hong" ten="bảng hoa hồng theo bộ lọc đang chọn" tham={{ tu, den, cn: sp.cn }} /> : tab === "ti-le" ? <NutXuatExcel loai="ti-le-hoa-hong" ten="tỉ lệ hoa hồng" /> : null}
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/hoa-hong" them={`${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}`} />
      {noiDung}
    </>
  );
}
