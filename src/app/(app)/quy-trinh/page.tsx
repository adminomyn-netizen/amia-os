import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { NHAN_PHU, PHU_BM, PHU_BUOC, type TrangThaiPhu } from "@/lib/khung-kd-phu";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { capNhatDauViec } from "./actions";

const TAB = [
  { ma: "quy-trinh", ten: "14 quy trình" }, { ma: "checklist", ten: "Checklist thao tác" }, { ma: "bieu-mau", ten: "Biểu mẫu" }, { ma: "kich-ban", ten: "Kịch bản mẫu" },
  { ma: "kpi", ten: "Từ điển KPI" }, { ma: "rui-ro", ten: "Rủi ro & tuân thủ" }, { ma: "nhip", ten: "Nhịp vận hành" }, { ma: "ke-hoach", ten: "Kế hoạch triển khai" },
];
const KIEU_PHU: Record<TrangThaiPhu, "tot" | "cho" | "loi" | "tram"> = { co: "tot", mot_phan: "cho", thieu: "loi", ngoai: "tram" };
const TT_VIEC: Record<string, { ten: string; kieu: "tot" | "cho" | "tram" }> = { chua: { ten: "Chưa làm", kieu: "tram" }, dang: { ten: "Đang làm", kieu: "cho" }, xong: { ten: "Xong", kieu: "tot" }, bo: { ten: "Không áp dụng", kieu: "tram" } };
const GD: Record<number, string> = { 1: "Nền tảng (tuần 1–4)", 2: "Triển khai (tháng 2–3)", 3: "Tối ưu (quý sau)" };

function TienDo({ xong, tong }: { xong: number; tong: number }) {
  const pt = tong ? Math.round((xong / tong) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-24 shrink-0 bg-giay-tram" style={{ borderRadius: 2 }}><div className="h-full" style={{ width: `${pt}%`, background: "var(--gradient-vang)", borderRadius: 2 }} /></div>
      <span className="text-[12.5px] tabular-nums text-muc-3">{xong}/{tong} · {pt}%</span>
    </div>
  );
}
const Phu = ({ tt }: { tt: TrangThaiPhu }) => <NhanTrangThai kieu={KIEU_PHU[tt]}>{NHAN_PHU[tt]}</NhanTrangThai>;
const Dai = ({ children }: { children: React.ReactNode }) => <span className="whitespace-pre-line text-[13.5px] leading-snug text-muc-2">{children}</span>;

export default async function TrangQuyTrinh({ searchParams }: { searchParams: Promise<{ tab?: string; cum?: string }> }) {
  const nd = await yeuCauNoiBo();
  const sp = await searchParams;
  const tab = TAB.some((x) => x.ma === sp.tab) ? sp.tab! : "quy-trinh";
  const db = sb();
  const sua = coQuyen(nd, "qt.sua");
  let noiDung: React.ReactNode = null;

  if (tab === "quy-trinh") {
    const { data: ds } = await db.from("kd_quy_trinh").select("ma, ten, chu_tri, bieu_mau_chinh, cum").order("thu_tu");
    const dem = (ma: string) => { const x = Object.entries(PHU_BUOC).filter(([k]) => k.startsWith(`${ma}.`)); return { tong: x.length, co: x.filter(([, v]) => v.tt === "co").length, mot: x.filter(([, v]) => v.tt === "mot_phan").length, thieu: x.filter(([, v]) => v.tt === "thieu").length }; };
    const tatCa = Object.values(PHU_BUOC);
    noiDung = (
      <>
        <HangChiSo muc={[
          { nhan: "Bước đã làm trên hệ thống", so: String(tatCa.filter((x) => x.tt === "co").length), ghiChu: `trên ${tatCa.length} bước` },
          { nhan: "Làm một phần", so: String(tatCa.filter((x) => x.tt === "mot_phan").length) },
          { nhan: "Chưa có, cần xây", so: String(tatCa.filter((x) => x.tt === "thieu").length) },
          { nhan: "Thao tác con người", so: String(tatCa.filter((x) => x.tt === "ngoai").length), ghiChu: "lời nói, kỹ năng, tác phong" },
        ]} />
        <div className="mt-6" />
        <Bang duLieu={ds ?? []} khoa={(r) => r.ma} cot={[
          { nhan: "Quy trình", chinh: true, hienThi: (r) => <Link href={`/quy-trinh/${r.ma}`} className="block hover:underline"><span className="text-muc">{r.ma} · {r.ten}</span><div className="text-[12.5px] text-muc-3">{r.cum}</div></Link> },
          { nhan: "Chủ trì", hienThi: (r) => <Dai>{r.chu_tri}</Dai> },
          { nhan: "Biểu mẫu chính", hienThi: (r) => <Dai>{r.bieu_mau_chinh}</Dai> },
          { nhan: "Trên hệ thống", hienThi: (r) => { const d = dem(r.ma); return <div className="text-[13px]">{d.co} có · {d.mot} một phần · <span className={d.thieu ? "text-loi" : ""}>{d.thieu} thiếu</span></div>; } },
        ]} />
      </>
    );
  } else if (tab === "checklist") {
    const { data: ds } = await db.from("kd_checklist").select("*").order("thu_tu");
    const nhom = [...new Map((ds ?? []).map((x) => [x.nhom, x.ten_nhom])).entries()];
    noiDung = (
      <div className="space-y-8">
        <p className="text-[13.5px] text-muc-3">Từng thao tác và lời nói cụ thể cho các luồng cốt lõi, dùng để đào tạo và kiểm tra tại chỗ (làm đến đâu tick đến đó).</p>
        {nhom.map(([n, ten]) => (
          <section key={n}>
            <h2 className="mb-3 text-[16px] font-semibold text-muc">{n}. {ten}</h2>
            <Bang duLieu={(ds ?? []).filter((x) => x.nhom === n)} khoa={(r) => r.ma} cot={[
              { nhan: "Thao tác", chinh: true, hienThi: (r) => <span className="text-muc">{r.ma} · {r.thao_tac}</span> }, { nhan: "Làm gì / nói gì", hienThi: (r) => <Dai>{r.lam_gi}</Dai> },
              { nhan: "Tiêu chuẩn & lưu ý", hienThi: (r) => <Dai>{r.tieu_chuan}</Dai> }, { nhan: "Công cụ / biểu mẫu", hienThi: (r) => <Dai>{r.cong_cu}</Dai> },
            ]} />
          </section>
        ))}
      </div>
    );
  } else if (tab === "bieu-mau") {
    const { data: ds } = await db.from("kd_bieu_mau").select("*").order("thu_tu");
    const dem = (k: TrangThaiPhu) => Object.values(PHU_BM).filter((x) => x.tt === k).length;
    noiDung = (
      <>
        <HangChiSo muc={[{ nhan: "Đã có", so: String(dem("co")) }, { nhan: "Có một phần", so: String(dem("mot_phan")) }, { nhan: "Chưa có", so: String(dem("thieu")), ghiChu: "đang xây theo thứ tự ưu tiên" }]} />
        <div className="mt-6" />
        <Bang duLieu={ds ?? []} khoa={(r) => r.ma} cot={[
          { nhan: "Biểu mẫu", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ma} · {r.ten}</span><div className="text-[12.5px] text-muc-3">{r.muc_dich}</div></div> },
          { nhan: "Trường thông tin chính", hienThi: (r) => <Dai>{r.truong}</Dai> }, { nhan: "Người dùng", hienThi: (r) => <Dai>{r.nguoi_dung}</Dai> },
          { nhan: "Trên hệ thống", hienThi: (r) => { const p = PHU_BM[r.ma]; return p ? <div><Phu tt={p.tt} /><div className="mt-1 text-[12.5px] text-muc-3">{p.ghi}</div>{p.link && <Link href={p.link} className="mt-1 inline-block text-[13px] text-nhan-dam hover:underline">Mở →</Link>}</div> : null; } },
        ]} />
      </>
    );
  } else if (tab === "kich-ban") {
    const { data: ds } = await db.from("kd_kich_ban").select("*").order("thu_tu");
    noiDung = (
      <div className="grid gap-4 md:grid-cols-2">
        <p className="text-[13.5px] text-muc-3 md:col-span-2">Khung lời thoại để đào tạo. Cá nhân hoá theo dịch vụ và khách, không đọc máy móc, không cam kết kết quả tuyệt đối. Khách xưng &ldquo;chị&rdquo;.</p>
        {(ds ?? []).map((k) => (
          <article key={k.ma} className="the-noi the-noi-thap p-4 sm:p-5">
            <p className="text-[12px] font-medium text-nhan-dam">{k.ma} · {k.muc_tieu}</p>
            <h2 className="mt-0.5 text-[15.5px] font-semibold text-muc">{k.tinh_huong}</h2>
            <p className="mt-3 border-l-2 border-nhan pl-3 text-[14px] leading-relaxed text-muc-2">{k.loi_thoai}</p>
            {k.luu_y && <p className="mt-3 text-[12.5px] text-muc-3">Lưu ý: {k.luu_y}</p>}
          </article>
        ))}
      </div>
    );
  } else if (tab === "kpi") {
    const { data: ds } = await db.from("kd_kpi").select("*").order("thu_tu");
    const NHOM = { T: "Tài chính", K: "Khách hàng", V: "Vận hành", P: "Phát triển" } as const;
    noiDung = (
      <div className="space-y-8">
        <p className="text-[13.5px] text-muc-3">Chỉ tiêu mẫu chỉ là gợi ý, cần chốt theo kế hoạch năm. T = Tài chính · K = Khách hàng · V = Vận hành · P = Phát triển (cùng 4 nhóm với BSC nhân sự).</p>
        {(Object.keys(NHOM) as (keyof typeof NHOM)[]).map((n) => (
          <section key={n}>
            <h2 className="mb-3 text-[16px] font-semibold text-muc">{n} · {NHOM[n]}</h2>
            <Bang duLieu={(ds ?? []).filter((x) => x.nhom === n)} khoa={(r) => r.id} cot={[
              { nhan: "Chỉ số", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Công thức", hienThi: (r) => <Dai>{r.cong_thuc}</Dai> }, { nhan: "Chỉ tiêu mẫu", hienThi: (r) => r.chi_tieu },
              { nhan: "Tần suất", hienThi: (r) => r.tan_suat }, { nhan: "Nguồn dữ liệu", hienThi: (r) => r.nguon }, { nhan: "Chủ trì", hienThi: (r) => r.chu_tri },
            ]} />
          </section>
        ))}
      </div>
    );
  } else if (tab === "rui-ro") {
    const { data: ds } = await db.from("kd_rui_ro").select("*").order("thu_tu");
    noiDung = (
      <>
        <p className="mb-4 text-[13.5px] text-muc-3">Khung quản trị rủi ro nội bộ, không thay thế tư vấn pháp lý. Mục pháp lý, hành nghề, quảng cáo cần luật sư rà soát theo quy định hiện hành.</p>
        <Bang duLieu={ds ?? []} khoa={(r) => r.ma} cot={[
          { nhan: "Rủi ro", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ma} · {r.ten}</span><div className="text-[12.5px] text-muc-3">{r.nhom}</div></div> },
          { nhan: "Mức", hienThi: (r) => <NhanTrangThai kieu={r.muc === "Cao" ? "loi" : "cho"}>{r.muc}</NhanTrangThai> },
          { nhan: "Tình huống", hienThi: (r) => <Dai>{r.mo_ta}</Dai> }, { nhan: "Phòng ngừa và xử lý", hienThi: (r) => <Dai>{r.bien_phap}</Dai> }, { nhan: "Trách nhiệm", hienThi: (r) => <Dai>{r.trach_nhiem}</Dai> },
        ]} />
      </>
    );
  } else if (tab === "nhip") {
    const { data: ds } = await db.from("kd_nhip").select("*").order("thu_tu");
    const bang = (nhom: string) => (
      <Bang duLieu={(ds ?? []).filter((x) => x.nhom === nhom)} khoa={(r) => r.id} cot={[
        { nhan: "Chu kỳ", chinh: true, hienThi: (r) => <span className="text-muc">{r.chu_ky}</span> }, { nhan: "Hoạt động", hienThi: (r) => r.hoat_dong },
        { nhan: "Nội dung", hienThi: (r) => <Dai>{r.noi_dung}</Dai> }, { nhan: "Đầu ra", hienThi: (r) => <Dai>{r.dau_ra}</Dai> }, { nhan: "Chủ trì", hienThi: (r) => r.chu_tri },
      ]} />
    );
    noiDung = (
      <div className="space-y-8">
        <section><h2 className="mb-3 text-[16px] font-semibold text-muc">Nhịp vận hành khối bán</h2>{bang("van_hanh")}</section>
        <section><h2 className="mb-3 text-[16px] font-semibold text-muc">Onboarding tư vấn viên mới (30 · 60 · 90 ngày)</h2>{bang("onboarding")}</section>
      </div>
    );
  } else {
    const [{ data: cum }, { data: hm }, { data: dv }, { data: nv }] = await Promise.all([
      db.from("kd_cum").select("*").order("so"), db.from("kd_hang_muc").select("*").order("thu_tu"),
      db.from("kd_dau_viec").select("*").order("thu_tu"), db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"),
    ]);
    const tong = dv ?? [], xong = tong.filter((x) => x.trang_thai === "xong").length, ap = tong.filter((x) => x.trang_thai !== "bo").length;
    const cumChon = Number(sp.cum) || (cum ?? [])[0]?.so || 1;
    const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    const hmCum = (hm ?? []).filter((h) => h.cum_so === cumChon);
    const truong: Truong[] = [
      { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", batBuoc: true, luaChon: Object.entries(TT_VIEC).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten })) },
      ...(sua ? [{ ten: "nguoi_phu_trach_id", nhan: "Người phụ trách", loai: "chon" as const, luaChon: [{ gia_tri: "", nhan: "Chưa giao" }, ...(nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] }, { ten: "han", nhan: "Hạn hoàn thành", loai: "ngay" as const }] : []),
      { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
    ];
    noiDung = (
      <>
        <HangChiSo muc={[
          { nhan: "Tổng đầu việc", so: String(tong.length), ghiChu: "14 cụm, 73 hạng mục" }, { nhan: "Đã xong", so: String(xong), ghiChu: `${ap ? Math.round((xong / ap) * 100) : 0}% các việc áp dụng` },
          { nhan: "Đang làm", so: String(tong.filter((x) => x.trang_thai === "dang").length) }, { nhan: "Chưa giao người", so: String(tong.filter((x) => !x.nguoi_phu_trach_id && x.trang_thai !== "xong" && x.trang_thai !== "bo").length), ghiChu: "cần chọn người phụ trách" },
        ]} />
        <p className="mb-4 mt-5 text-[13px] text-muc-3">Giai đoạn 1 = Nền tảng (tuần 1–4) · 2 = Triển khai (tháng 2–3) · 3 = Tối ưu (quý sau). Cụm → hạng mục → đầu việc; làm xong thì đổi trạng thái.</p>
        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-vien" role="tablist">
          {(cum ?? []).map((c) => {
            const x = tong.filter((d) => hm?.find((h) => h.ma === d.hang_muc_ma)?.cum_so === c.so);
            return (
              <Link key={c.so} href={`/quy-trinh?tab=ke-hoach&cum=${c.so}`} scroll={false} role="tab" aria-selected={cumChon === c.so}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-[13.5px] ${cumChon === c.so ? "border-nhan font-medium text-nhan-dam" : "border-transparent text-muc-3 hover:text-muc"}`}>
                Cụm {c.so} <span className="text-[12px] text-muc-3">{x.filter((d) => d.trang_thai === "xong").length}/{x.length}</span>
              </Link>
            );
          })}
        </div>
        {(() => { const c = (cum ?? []).find((x) => x.so === cumChon); return c ? <div className="mb-5"><h2 className="text-[17px] font-semibold text-muc">Cụm {c.so}. {c.ten}</h2><p className="mt-1 text-[13.5px] text-muc-3">{c.muc_tieu}</p></div> : null; })()}
        {hmCum.map((h) => {
          const viec = tong.filter((d) => d.hang_muc_ma === h.ma);
          return (
            <section key={h.ma} className="mb-8">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><h3 className="text-[15px] font-semibold text-muc">{h.ma} {h.ten}</h3><TienDo xong={viec.filter((d) => d.trang_thai === "xong").length} tong={viec.length} /></div>
              <p className="mb-2 text-[12.5px] text-muc-3">{h.muc_tieu}</p>
              <Bang duLieu={viec} khoa={(r) => r.ma} cot={[
                { nhan: "Đầu việc", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ma}</span> <Dai>{r.mo_ta}</Dai><div className="mt-1 text-[12.5px] text-muc-3">Đầu ra: {r.san_pham}</div><div className="text-[12.5px] text-muc-3">Hoàn thành khi: {r.dod}</div></div> },
                { nhan: "Chủ trì / phối hợp", hienThi: (r) => <div className="text-[13px]">{r.chu_tri}<div className="text-muc-3">{r.phoi_hop}</div></div> },
                { nhan: "Giai đoạn", hienThi: (r) => <span className="text-[13px]" title={GD[r.giai_doan]}>GĐ {r.giai_doan}</span> },
                { nhan: "Phụ trách / hạn", hienThi: (r) => <div className="text-[13px]">{r.nguoi_phu_trach_id ? tenNv.get(r.nguoi_phu_trach_id) ?? "" : <span className="text-muc-3">Chưa giao</span>}<div className="text-muc-3">{r.han ? `Hạn ${ngayVN(r.han)}` : ""}</div></div> },
                { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_VIEC[r.trang_thai].kieu}>{TT_VIEC[r.trang_thai].ten}</NhanTrangThai> },
                { nhan: "", hienThi: (r) => (sua || r.nguoi_phu_trach_id === nd.nhanVienId ? <NutHop kieu="chu" nhan="Cập nhật" tieuDe={`${r.ma}: cập nhật`} moTa={r.mo_ta.slice(0, 160)} truong={truong} action={capNhatDauViec} an={{ ma: r.ma }} giaTri={{ trang_thai: r.trang_thai, nguoi_phu_trach_id: r.nguoi_phu_trach_id ?? "", han: r.han ?? "", ghi_chu: r.ghi_chu ?? "" }} /> : null) },
              ]} />
            </section>
          );
        })}
      </>
    );
  }

  return (
    <div>
      <TieuDeTrang tieuDe="Quy trình & khung vận hành" phu="Bộ quy trình và khung nghiệp vụ Kinh doanh của MSC/AMIA: ai làm gì, theo chuẩn nào, làm ở màn hình nào của hệ thống." />
      <Tab muc={TAB} dang={tab} goc="/quy-trinh" />
      {noiDung}
    </div>
  );
}
