import { bcDoanhThuNgayNho } from "@/lib/bao-cao-nho-dem";
import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { locMenu } from "@/lib/nav";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { TongQuanKyThuat } from "./KyThuat";
import { Tab } from "@/components/ui/Tab";
import { BangDoanhThu, BangHeThong, BangKho, BangKhach, BangTheNo } from "./bang";

const TIEU_DE_VAI_TRO: Partial<Record<string, string>> = { chu: "Bảng điều hành của Chủ", ky_thuat: "Bảng điều khiển kỹ thuật", quan_ly: "Bảng điều hành", ke_toan: "Bảng kế toán", thu_kho: "Bảng kho", thu_ngan: "Bảng thu ngân", marketing: "Bảng marketing", nha_dau_tu: "Bảng nhà đầu tư" };

export default async function TongQuan({ searchParams }: { searchParams: Promise<{ "khong-du-quyen"?: string; tab?: string }> }) {
  const nd = await yeuCauQuyen("tongquan.xem");
  const sp = await searchParams;
  const db = sb();
  const homNay = homNayHCM();
  const cn = nd.chiNhanhId;
  const TAB = [
    { ma: "hom-nay", ten: "Hôm nay", co: true },
    { ma: "doanh-thu", ten: "Doanh thu", co: coQuyen(nd, "baocao.tien") },
    { ma: "khach", ten: "Khách hàng", co: coQuyen(nd, "khach.xem") },
    { ma: "the-no", ten: "Thẻ & công nợ", co: coQuyen(nd, "the.xem") },
    { ma: "kho", ten: "Kho & vật tư", co: coQuyen(nd, "kho.xem") },
    { ma: "he-thong", ten: "Hệ thống", co: coQuyen(nd, "hethong.phanquyen") },
  ].filter((t) => t.co);
  const tab = TAB.some((t) => t.ma === sp.tab) ? sp.tab! : "hom-nay";
  const coBaoCao = coQuyen(nd, "baocao.xem");
  const coTien = coQuyen(nd, "baocao.tien");
  const banner = sp["khong-du-quyen"] ? <p role="alert" className="mb-5 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">Vai trò của bạn không mở được trang vừa chọn.</p> : null;

  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString();
  const den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  let lq = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(60);
  if (cn) lq = lq.eq("chi_nhanh_id", cn);
  let pq = db.from("phieu_cap").select("id", { count: "exact", head: true }).in("trang_thai", ["cho_cap", "da_cap"]).is("buoi_id", null);
  if (cn) pq = pq.eq("chi_nhanh_id", cn);
  const [{ data: lich }, { count: phieuCho }] = await Promise.all([lq, coQuyen(nd, "phieu.xem") ? pq : Promise.resolve({ count: 0 })]);
  const idsK = [...new Set((lich ?? []).map((l) => l.khach_id))];
  const { data: ks } = idsK.length ? await db.from("khach_hang").select("id, ho_ten").in("id", idsK) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));
  const chua = (lich ?? []).filter((l) => l.trang_thai === "chua_xac_nhan").length;

  let phanSo: React.ReactNode = null;
  const canhBao: { nhan: string; href: string }[] = [];
  if (coBaoCao) {
    const tuNgay = congNgay(homNay, -13);
    // Đọc bản tính sẵn của trang chủ (từ đầu tháng trước đến hôm nay, 0305) rồi lấy 14 ngày cuối — số theo ngày y hệt gọi riêng 14 ngày.
    const dauThang = `${homNay.slice(0, 8)}01`, dThang = new Date(`${dauThang}T00:00:00Z`); dThang.setUTCMonth(dThang.getUTCMonth() - 1);
    const ngay = (await bcDoanhThuNgayNho(dThang.toISOString().slice(0, 10), homNay, cn ?? null)).filter((n) => n.ngay >= tuNgay);
    const hn = (ngay ?? []).find((n) => n.ngay === homNay);
    const max = Math.max(1, ...(ngay ?? []).map((n) => Number(n.doanh_thu)));
    let nq = db.from("hoa_don").select("con_no").eq("trang_thai", "hoan_thanh").gt("con_no", 0);
    if (cn) nq = nq.eq("chi_nhanh_id", cn);
    const { data: no } = await nq;
    const tongNo = (no ?? []).reduce((s, r) => s + Number(r.con_no), 0);
    if (tongNo > 0 && coTien) canhBao.push({ nhan: `${(no ?? []).length} hoá đơn còn nợ, tổng ${tienVN(tongNo)}`, href: "/bao-cao?tab=no" });
    phanSo = (
      <>
        <HangChiSo muc={coTien
          ? [{ nhan: "Doanh thu hôm nay", so: tienVN(hn?.doanh_thu) }, { nhan: "Thực thu hôm nay", so: tienVN(hn?.thuc_thu), ghiChu: `tiền mặt ${tienVN(hn?.tien_mat)}` }, { nhan: "Đơn mới", so: String(hn?.so_don ?? 0) }, { nhan: "Buổi đã làm", so: String(hn?.so_buoi ?? 0), ghiChu: `doanh thu buổi ${tienVN(hn?.doanh_thu_buoi)}` }]
          : [{ nhan: "Đơn mới hôm nay", so: String(hn?.so_don ?? 0) }, { nhan: "Buổi đã làm hôm nay", so: String(hn?.so_buoi ?? 0) }]} />
        {coTien && (
          <div className="mt-6"><MucTrang noi tieuDe="Doanh thu 14 ngày gần nhất" phai={<Link href="/bao-cao" className="font-medium text-nhan-dam hover:underline">Xem báo cáo</Link>}>
            <div className="flex h-44 items-end gap-1.5" role="img" aria-label="Biểu đồ doanh thu 14 ngày">
              {(ngay ?? []).map((n) => (
                <div key={n.ngay} className="group flex flex-1 flex-col items-center justify-end gap-1" title={`${ngayVN(n.ngay)}: ${tienVN(n.doanh_thu)}`}>
                  <div className="w-full rounded-t-[3px]" style={{ height: `${Math.max(2, (Number(n.doanh_thu) / max) * 140)}px`, background: n.ngay === homNay ? "var(--gradient-vang)" : "var(--sac-luc-mau)", opacity: n.ngay === homNay ? 1 : 0.55 }} />
                  <span className="text-[10px] text-muc-3">{n.ngay.slice(8)}</span>
                </div>
              ))}
            </div>
          </MucTrang></div>
        )}
      </>
    );
    if (coQuyen(nd, "kho.xem")) {
      let kq = db.from("v_ton_kho").select("san_pham_id", { count: "exact", head: true }).eq("duoi_muc_toi_thieu", true);
      if (cn) kq = kq.eq("chi_nhanh_id", cn);
      const { count } = await kq;
      if ((count ?? 0) > 0) canhBao.push({ nhan: `${count} mặt hàng dưới mức tồn tối thiểu`, href: "/kho?thieu=1" });
    }
  }
  if ((phieuCho ?? 0) > 0) canhBao.push({ nhan: `${phieuCho} phiếu cấp vật tư đang chờ kho cấp hoặc Chuyên viên trị liệu nhận`, href: "/phieu-cap" });
  if (chua > 0 && coQuyen(nd, "lich.xem")) canhBao.push({ nhan: `${chua} lịch hôm nay chưa xác nhận`, href: "/lich-hen" });
  if (coQuyen(nd, "the.xem")) {
    let tq = db.from("v_the_khach").select("id", { count: "exact", head: true }).eq("tinh_trang", "sap_het").eq("loai", "lan");
    if (cn) tq = tq.eq("chi_nhanh_id", cn);
    const { count } = await tq;
    if ((count ?? 0) > 0) canhBao.push({ nhan: `${count} thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)`, href: "/the" });
  }

  const bang = tab === "doanh-thu" ? <BangDoanhThu cn={cn} /> : tab === "khach" ? <BangKhach cn={cn} /> : tab === "the-no" ? <BangTheNo cn={cn} xemTien={coTien} /> : tab === "kho" ? <BangKho cn={cn} /> : tab === "he-thong" ? <><TongQuanKyThuat /><BangHeThong /></> : null;
  return (
    <>
      <TieuDeNoi tieuDe={`Xin chào, ${nd.hoTen}`} phu={`${TIEU_DE_VAI_TRO[nd.vaiTro] ?? "Tổng quan"} · hôm nay ${ngayVN(homNay)}${cn ? "" : " · mọi chi nhánh"}`} />
      {banner}
      {TAB.length > 1 && <Tab muc={TAB} dang={tab} goc="/tong-quan" />}
      {bang ?? (
        <>
          {phanSo}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MucTrang noi tieuDe="Cần xử lý">
          {canhBao.length === 0 ? <p className="text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien">{canhBao.map((c) => <li key={c.href + c.nhan}><Link href={c.href} className="flex items-center justify-between gap-3 py-2.5 text-[14px] hover:text-nhan-dam"><span>{c.nhan}</span><span aria-hidden className="text-muc-3">›</span></Link></li>)}</ul>
          )}
        </MucTrang>
        {coQuyen(nd, "lich.xem") ? (
          <MucTrang noi tieuDe="Lịch hôm nay" phai={<Link href="/lich-hen" className="font-medium text-nhan-dam hover:underline">Mở lịch</Link>}>
            {(lich ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có lịch hẹn nào.</p> : (
              <ul className="divide-y divide-vien">{(lich ?? []).slice(0, 8).map((l) => <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-[14px]"><span><span className="tabular-nums text-muc-3">{gioVN(l.bat_dau)}</span> · {tenK.get(l.khach_id)}</span>{l.trang_thai === "dang_phuc_vu" ? <NhanTrangThai kieu="tot">Đang phục vụ</NhanTrangThai> : l.trang_thai === "hoan_thanh" ? <NhanTrangThai kieu="tram">Xong</NhanTrangThai> : null}</li>)}</ul>
            )}
          </MucTrang>
        ) : (
          <MucTrang noi tieuDe="Lối tắt"><ul className="grid gap-2 sm:grid-cols-2">{locMenu(nd).filter((m) => m.duong_dan !== "/tong-quan").map((m) => <li key={m.duong_dan}><Link href={m.duong_dan} className="block rounded-nho border border-vien px-3 py-2 text-[14px] hover:border-nhan">{m.ten}</Link></li>)}</ul></MucTrang>
        )}
      </div>
        </>
      )}
    </>
  );
}
