import { bcDoanhThuNgayNho } from "@/lib/bao-cao-nho-dem";
import Link from "next/link";
import { Suspense } from "react";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { locMenu } from "@/lib/nav";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { TongQuanKyThuat } from "./KyThuat";
import { Tab } from "@/components/ui/Tab";
import { BangDoanhThu, BangHeThong, BangKho, BangKhach, BangTheNo } from "./bang";
import { CotDoanhThuNgay } from "@/components/trang-chu/CotDoanhThuNgay";
import { KhoiXepHang } from "@/components/trang-chu/KhoiXepHang";
import { DS_KY_DT, docKy, docKyDt, khoangKy, khoangKyDt, type KyXh } from "@/lib/ky-xep-hang";
import { ChonKhoangNgay } from "@/components/trang-chu/ChonKhoangNgay";
import { ChonKy } from "@/components/trang-chu/ChonKy";
import { KhoiSinhNhatThang } from "@/components/trang-chu/KhoiSinhNhatThang";
import { cnXepHang } from "@/lib/xep-hang";

const TIEU_DE_VAI_TRO: Partial<Record<string, string>> = { chu: "Bảng điều hành của Chủ", ky_thuat: "Bảng điều khiển kỹ thuật", quan_ly: "Bảng điều hành", ke_toan: "Bảng kế toán", thu_kho: "Bảng kho", thu_ngan: "Bảng thu ngân", marketing: "Bảng marketing", nha_dau_tu: "Bảng nhà đầu tư" };

export default async function TongQuan({ searchParams }: { searchParams: Promise<{ "khong-du-quyen"?: string; tab?: string; ky?: string; tu?: string; den?: string }> }) {
  const nd = await yeuCauQuyen("tongquan.xem");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const cn = nd.chiNhanhId;
  const TAB = [
    { ma: "hom-nay", ten: "Tổng quan", co: true },
    { ma: "doanh-thu", ten: "Doanh thu", co: coQuyen(nd, "baocao.tien") },
    { ma: "khach", ten: "Khách hàng", co: coQuyen(nd, "khach.xem") },
    { ma: "the-no", ten: "Thẻ & công nợ", co: coQuyen(nd, "the.xem") },
    { ma: "kho", ten: "Kho & vật tư", co: coQuyen(nd, "kho.xem") },
    { ma: "he-thong", ten: "Hệ thống", co: coQuyen(nd, "hethong.phanquyen") },
  ].filter((t) => t.co);
  const tab = TAB.some((t) => t.ma === sp.tab) ? sp.tab! : "hom-nay";
  const coBaoCao = coQuyen(nd, "baocao.xem");
  const ky = docKy(sp.ky);
  const coTien = coQuyen(nd, "baocao.tien");
  // Tab Doanh thu có bộ kỳ riêng (mặc định Tháng này, thêm Hôm qua / 90 ngày qua / Tùy chỉnh) — chị Lâm 11/11/2026.
  const kyDt = docKyDt(sp.ky);
  const khoangDt = khoangKyDt(kyDt, homNay, sp.tu, sp.den);
  const themTc = `&tu=${khoangDt.tu}&den=${khoangDt.den}`;
  const banner = sp["khong-du-quyen"] ? <p role="alert" className="mb-5 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">Vai trò của bạn không mở được trang vừa chọn.</p> : null;

  const bang = tab === "doanh-thu" ? <BangDoanhThu cn={cn} ky={kyDt} khoang={khoangDt} homNay={homNay} /> : tab === "khach" ? <BangKhach cn={cn} /> : tab === "the-no" ? <BangTheNo cn={cn} xemTien={coTien} /> : tab === "kho" ? <BangKho cn={cn} /> : tab === "he-thong" ? <><TongQuanKyThuat /><BangHeThong /></> : null;
  return (
    <>
      <TieuDeNoi tieuDe={`Xin chào, ${nd.hoTen}`} phu={`${TIEU_DE_VAI_TRO[nd.vaiTro] ?? "Tổng quan"} · hôm nay ${ngayVN(homNay)}${cn ? "" : " · mọi chi nhánh"}`} />
      {banner}
      {TAB.length > 1 && <Tab muc={TAB} dang={tab} goc="/tong-quan" them={tab === "doanh-thu" ? (sp.ky ? `&ky=${kyDt}${kyDt === "tuy-chinh" ? themTc : ""}` : "") : ky !== "hom-nay" ? `&ky=${ky}` : ""} />}
      {tab === "doanh-thu" && <ChonKy dang={kyDt} goc="/tong-quan?tab=doanh-thu" ds={DS_KY_DT} them={{ "tuy-chinh": themTc }} luoi />}
      {tab === "doanh-thu" && kyDt === "tuy-chinh" && <ChonKhoangNgay goc="/tong-quan?tab=doanh-thu" tu={khoangDt.tu} den={khoangDt.den} />}
      {/* Mỗi tab tải riêng: đầu trang + dải tab hiện ngay, phần số liệu hiện khung chờ rồi đổ vào. */}
      <Suspense key={tab === "doanh-thu" ? `${tab}-${khoangDt.tu}-${khoangDt.den}-${kyDt}` : tab} fallback={<KhungCho />}>{bang ?? <HomNay nd={nd} homNay={homNay} coBaoCao={coBaoCao} coTien={coTien} ky={ky} />}</Suspense>
    </>
  );
}

function KhungCho() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-hop bg-vien/60" />)}</div>
      <div className="h-56 animate-pulse rounded-hop bg-vien/50" />
    </div>
  );
}

type Nd = Awaited<ReturnType<typeof yeuCauQuyen>>;
type DongLich = { id: string; khach_id: string; bat_dau: string; trang_thai: string };
const KHUNG = (nhan: string, cao: string) => <div aria-busy="true" aria-label={nhan} className={`${cao} animate-pulse rounded-hop bg-vien/50`} />;

/** Tab Tổng quan (mã hom-nay): mọi truy vấn khởi chạy CÙNG LÚC ngay khi vào trang, mỗi khối một Suspense riêng — khối nào xong trước hiện trước
 *  (trước đây cả tab chờ khối chậm nhất, rồi bảng xếp hạng + sinh nhật mới bắt đầu tải → nối tiếp). */
function HomNay({ nd, homNay, coBaoCao, coTien, ky }: { nd: Nd; homNay: string; coBaoCao: boolean; coTien: boolean; ky: KyXh }) {
  const db = sb();
  const cn = nd.chiNhanhId;
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString();
  const den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  const xemLich = coQuyen(nd, "lich.xem");
  let lq = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(60);
  if (cn) lq = lq.eq("chi_nhanh_id", cn);
  const pLich: Promise<DongLich[]> = xemLich ? Promise.resolve(lq).then((r) => (r.data ?? []) as DongLich[], () => []) : Promise.resolve([]);
  // Đọc bản tính sẵn của trang chủ (từ đầu tháng trước đến hôm nay, 0305) rồi lấy 14 ngày cuối — số theo ngày y hệt gọi riêng 14 ngày.
  const dauThang = `${homNay.slice(0, 8)}01`, dThang = new Date(`${dauThang}T00:00:00Z`); dThang.setUTCMonth(dThang.getUTCMonth() - 1);
  const pNgay = coBaoCao ? bcDoanhThuNgayNho(dThang.toISOString().slice(0, 10), homNay, cn ?? null) : Promise.resolve([]);
  const pCnXh = cnXepHang(cn);
  const khungXh = <div aria-busy="true" aria-label="Đang tải bảng xếp hạng" className="space-y-3"><div className="h-10 w-64 animate-pulse rounded-nho bg-vien/50" /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-hop bg-vien/50" />)}</div></div>;
  // Thứ tự (chị Lâm 10/11/2026): chọn kỳ → chỉ số theo kỳ → BẢNG XẾP HẠNG theo kỳ (lên gần đầu cho dễ thấy) → doanh thu 14 ngày → việc cần xử lý + lịch hôm nay → sinh nhật tháng.
  return (
    <>
      {coBaoCao && <ChonKy dang={ky} goc="/tong-quan?tab=hom-nay" />}
      {coBaoCao && <Suspense key={`so-${ky}`} fallback={<div aria-busy="true" aria-label="Đang tải doanh thu" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-hop bg-vien/60" />)}</div>}>
        <ChiSoKy pNgay={pNgay} ky={ky} homNay={homNay} coTien={coTien} />
      </Suspense>}
      {coBaoCao && (
        <div className="mt-8">
          <Suspense key={`xh-${ky}`} fallback={khungXh}>
            <XepHangHomNay pCnXh={pCnXh} ky={ky} homNay={homNay} xemTien={coTien} />
          </Suspense>
        </div>
      )}
      {coBaoCao && coTien && <div className="mt-8"><Suspense fallback={KHUNG("Đang tải biểu đồ", "h-56")}><BieuDo14Ngay pNgay={pNgay} homNay={homNay} /></Suspense></div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MucTrang noi tieuDe="Cần xử lý">
          <Suspense fallback={KHUNG("Đang tải việc cần xử lý", "h-24")}><CanXuLy nd={nd} pLich={pLich} coBaoCao={coBaoCao} coTien={coTien} /></Suspense>
        </MucTrang>
        {xemLich ? (
          <MucTrang noi tieuDe="Lịch hôm nay" phai={<Link href="/lich-hen" className="font-medium text-nhan-dam hover:underline">Mở lịch</Link>}>
            <Suspense fallback={KHUNG("Đang tải lịch hôm nay", "h-40")}><LichHomNay pLich={pLich} /></Suspense>
          </MucTrang>
        ) : (
          <MucTrang noi tieuDe="Lối tắt"><ul className="grid gap-2 sm:grid-cols-2">{locMenu(nd).filter((m) => m.duong_dan !== "/tong-quan").map((m) => <li key={m.duong_dan}><Link href={m.duong_dan} className="block rounded-nho border border-vien px-3 py-2 text-[14px] hover:border-nhan">{m.ten}</Link></li>)}</ul></MucTrang>
        )}
      </div>
      {coQuyen(nd, "khach.xem") && (
        <div className="mt-8">
          <Suspense fallback={KHUNG("Đang tải khách sinh nhật", "h-64")}>
            <SinhNhatHomNay pCnXh={pCnXh} homNay={homNay} xemSdt={coQuyen(nd, "khach.sdt")} xemTien={coTien} />
          </Suspense>
        </div>
      )}
    </>
  );
}

type DongNgay = Awaited<ReturnType<typeof bcDoanhThuNgayNho>>[number];

/** Chỉ số theo kỳ đang chọn: cộng các ngày trong kỳ từ bản tính sẵn theo ngày (đã gồm đầu tháng trước → hôm nay, đủ cho mọi kỳ) — không thêm truy vấn. */
async function ChiSoKy({ pNgay, ky, homNay, coTien }: { pNgay: Promise<DongNgay[]>; ky: KyXh; homNay: string; coTien: boolean }) {
  const { tu, den, nhan } = khoangKy(ky, homNay);
  const trong = (await pNgay).filter((n) => n.ngay >= tu && n.ngay <= den);
  const tong = (k: "doanh_thu" | "thuc_thu" | "tien_mat" | "so_don" | "so_buoi" | "doanh_thu_buoi") => trong.reduce((s, n) => s + Number(n[k] ?? 0), 0);
  const ten = ky === "hom-nay" ? "hôm nay" : nhan;
  return <HangChiSo muc={coTien
    ? [{ nhan: `Doanh thu ${ten}`, so: tienVN(tong("doanh_thu")) }, { nhan: `Thực thu ${ten}`, so: tienVN(tong("thuc_thu")), ghiChu: `tiền mặt ${tienVN(tong("tien_mat"))}` }, { nhan: "Đơn mới", so: soVN(tong("so_don")) }, { nhan: "Buổi đã làm", so: soVN(tong("so_buoi")), ghiChu: `doanh thu buổi ${tienVN(tong("doanh_thu_buoi"))}` }]
    : [{ nhan: `Đơn mới ${ten}`, so: soVN(tong("so_don")) }, { nhan: `Buổi đã làm ${ten}`, so: soVN(tong("so_buoi")) }]} />;
}

/** Biểu đồ doanh thu 14 ngày gần nhất (giữ nguyên, không theo kỳ). */
async function BieuDo14Ngay({ pNgay, homNay }: { pNgay: Promise<DongNgay[]>; homNay: string }) {
  const tuNgay = congNgay(homNay, -13);
  // Đủ 14 ngày liên tiếp (ngày không có hoá đơn vẫn có cột 0) để trục ngày không bị nhảy.
  const theoNgay = new Map((await pNgay).filter((n) => n.ngay >= tuNgay).map((n) => [n.ngay, n]));
  const cot14 = Array.from({ length: 14 }, (_, i) => congNgay(tuNgay, i)).map((d) => {
    const n = theoNgay.get(d);
    return { ngay: d, doanhThu: Number(n?.doanh_thu ?? 0), thucThu: Number(n?.thuc_thu ?? 0), soDon: Number(n?.so_don ?? 0), soBuoi: Number(n?.so_buoi ?? 0) };
  });
  return (
    <MucTrang noi tieuDe="Doanh thu 14 ngày gần nhất" phai={<Link href="/bao-cao" className="font-medium text-nhan-dam hover:underline">Xem báo cáo</Link>}>
      <CotDoanhThuNgay du={cot14} homNay={homNay} />
    </MucTrang>
  );
}

/** Việc cần xử lý: các số đếm chạy song song (mỗi lượt hosting→Supabase ~90ms). */
async function CanXuLy({ nd, pLich, coBaoCao, coTien }: { nd: Nd; pLich: Promise<DongLich[]>; coBaoCao: boolean; coTien: boolean }) {
  const db = sb();
  const cn = nd.chiNhanhId;
  let pq = db.from("phieu_cap").select("id", { count: "exact", head: true }).in("trang_thai", ["cho_cap", "da_cap"]).is("buoi_id", null);
  if (cn) pq = pq.eq("chi_nhanh_id", cn);
  let nq = db.from("hoa_don").select("con_no").eq("trang_thai", "hoan_thanh").gt("con_no", 0);
  if (cn) nq = nq.eq("chi_nhanh_id", cn);
  let kq = db.from("v_ton_kho").select("san_pham_id", { count: "exact", head: true }).eq("duoi_muc_toi_thieu", true);
  if (cn) kq = kq.eq("chi_nhanh_id", cn);
  let tq = db.from("v_the_khach").select("id", { count: "exact", head: true }).eq("tinh_trang", "sap_het").eq("loai", "lan");
  if (cn) tq = tq.eq("chi_nhanh_id", cn);
  const rong = Promise.resolve({ count: 0, data: [] as { con_no: number }[] });
  const [lich, { count: phieuCho }, { data: no }, { count: demKho }, { count: demThe }] = await Promise.all([
    pLich, coQuyen(nd, "phieu.xem") ? pq : rong, coBaoCao && coTien ? nq : rong, coBaoCao && coQuyen(nd, "kho.xem") ? kq : rong, coQuyen(nd, "the.xem") ? tq : rong,
  ]);
  const canhBao: { nhan: string; href: string }[] = [];
  const tongNo = (no ?? []).reduce((s, r) => s + Number(r.con_no), 0);
  if (tongNo > 0) canhBao.push({ nhan: `${(no ?? []).length} hoá đơn còn nợ, tổng ${tienVN(tongNo)}`, href: "/bao-cao?tab=no" });
  if ((demKho ?? 0) > 0) canhBao.push({ nhan: `${demKho} mặt hàng dưới mức tồn tối thiểu`, href: "/kho?thieu=1" });
  if ((phieuCho ?? 0) > 0) canhBao.push({ nhan: `${phieuCho} phiếu cấp vật tư đang chờ kho cấp hoặc Chuyên viên trị liệu nhận`, href: "/phieu-cap" });
  const chua = lich.filter((l) => l.trang_thai === "chua_xac_nhan").length;
  if (chua > 0) canhBao.push({ nhan: `${chua} lịch hôm nay chưa xác nhận`, href: "/lich-hen" });
  if ((demThe ?? 0) > 0) canhBao.push({ nhan: `${demThe} thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)`, href: "/the" });
  return canhBao.length === 0 ? <p className="text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
    <ul className="divide-y divide-vien">{canhBao.map((c) => <li key={c.href + c.nhan}><Link href={c.href} className="flex items-center justify-between gap-3 py-2.5 text-[14px] hover:text-nhan-dam"><span>{c.nhan}</span><span aria-hidden className="text-muc-3">›</span></Link></li>)}</ul>
  );
}

async function LichHomNay({ pLich }: { pLich: Promise<DongLich[]> }) {
  const lich = (await pLich).slice(0, 8);
  if (lich.length === 0) return <p className="text-[14px] text-muc-3">Chưa có lịch hẹn nào.</p>;
  const idsK = [...new Set(lich.map((l) => l.khach_id))];
  const { data: ks } = await sb().from("khach_hang").select("id, ho_ten").in("id", idsK);
  const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));
  return <ul className="divide-y divide-vien">{lich.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-[14px]"><span><span className="tabular-nums text-muc-3">{gioVN(l.bat_dau)}</span> · {tenK.get(l.khach_id)}</span>{l.trang_thai === "dang_phuc_vu" ? <NhanTrangThai kieu="tot">Đang phục vụ</NhanTrangThai> : l.trang_thai === "hoan_thanh" ? <NhanTrangThai kieu="tram">Xong</NhanTrangThai> : null}</li>)}</ul>;
}

type PCnXh = ReturnType<typeof cnXepHang>;
async function XepHangHomNay({ pCnXh, ky, homNay, xemTien }: { pCnXh: PCnXh; ky: KyXh; homNay: string; xemTien: boolean }) {
  const c = await pCnXh;
  return <KhoiXepHang cn={c.id} tenCn={c.ten} ky={ky} homNay={homNay} xemTien={xemTien} />;
}
async function SinhNhatHomNay({ pCnXh, homNay, xemSdt, xemTien }: { pCnXh: PCnXh; homNay: string; xemSdt: boolean; xemTien: boolean }) {
  const c = await pCnXh;
  return <KhoiSinhNhatThang cn={c.id} tenCn={c.ten} homNay={homNay} xemSdt={xemSdt} xemTien={xemTien} />;
}
