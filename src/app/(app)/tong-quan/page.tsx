import Link from "next/link";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { locMenu } from "@/lib/nav";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

export default async function TongQuan({ searchParams }: { searchParams: Promise<{ "khong-du-quyen"?: string }> }) {
  const nd = await layNguoiDungDangNhap();
  const sp = await searchParams;
  const db = sb();
  const homNay = homNayHCM();
  const cn = nd.chiNhanhId;
  const coBaoCao = coQuyen(nd.vaiTro, "baocao.xem");
  const coTien = coQuyen(nd.vaiTro, "baocao.tien");
  const banner = sp["khong-du-quyen"] ? <p role="alert" className="mb-5 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">Vai trò của bạn không mở được trang vừa chọn.</p> : null;

  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString();
  const den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  let lq = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(60);
  if (cn) lq = lq.eq("chi_nhanh_id", cn);
  let pq = db.from("phieu_cap").select("id", { count: "exact", head: true }).in("trang_thai", ["cho_cap", "da_cap"]);
  if (cn) pq = pq.eq("chi_nhanh_id", cn);
  const [{ data: lich }, { count: phieuCho }] = await Promise.all([lq, coQuyen(nd.vaiTro, "phieu.xem") ? pq : Promise.resolve({ count: 0 })]);
  const idsK = [...new Set((lich ?? []).map((l) => l.khach_id))];
  const { data: ks } = idsK.length ? await db.from("khach_hang").select("id, ho_ten").in("id", idsK) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));
  const chua = (lich ?? []).filter((l) => l.trang_thai === "chua_xac_nhan").length;

  let phanSo: React.ReactNode = null;
  const canhBao: { nhan: string; href: string }[] = [];
  if (coBaoCao) {
    const tuNgay = congNgay(homNay, -13);
    const { data: ngay } = await db.rpc("bc_doanh_thu_ngay", { p_tu: tuNgay, p_den: homNay, p_cn: (cn ?? undefined) as string });
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
          <div className="mt-8"><MucTrang tieuDe="Doanh thu 14 ngày gần nhất" phai={<Link href="/bao-cao" className="font-medium text-nhan-dam hover:underline">Xem báo cáo</Link>}>
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
    if (coQuyen(nd.vaiTro, "kho.xem")) {
      let kq = db.from("v_ton_kho").select("san_pham_id", { count: "exact", head: true }).eq("duoi_muc_toi_thieu", true);
      if (cn) kq = kq.eq("chi_nhanh_id", cn);
      const { count } = await kq;
      if ((count ?? 0) > 0) canhBao.push({ nhan: `${count} mặt hàng dưới mức tồn tối thiểu`, href: "/kho?thieu=1" });
    }
  }
  if ((phieuCho ?? 0) > 0) canhBao.push({ nhan: `${phieuCho} phiếu cấp vật tư đang chờ kho cấp hoặc KTV nhận`, href: "/phieu-cap" });
  if (chua > 0 && coQuyen(nd.vaiTro, "lich.xem")) canhBao.push({ nhan: `${chua} lịch hôm nay chưa xác nhận`, href: "/lich-hen" });
  if (coQuyen(nd.vaiTro, "the.xem")) {
    let tq = db.from("v_the_khach").select("id", { count: "exact", head: true }).eq("tinh_trang", "sap_het").eq("loai", "lan");
    if (cn) tq = tq.eq("chi_nhanh_id", cn);
    const { count } = await tq;
    if ((count ?? 0) > 0) canhBao.push({ nhan: `${count} thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)`, href: "/the" });
  }

  return (
    <>
      <TieuDeTrang tieuDe={`Xin chào, ${nd.hoTen}`} phu={`Hôm nay ${ngayVN(homNay)}`} />
      {banner}
      {phanSo}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <MucTrang tieuDe="Cần xử lý">
          {canhBao.length === 0 ? <p className="text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien">{canhBao.map((c) => <li key={c.href + c.nhan}><Link href={c.href} className="flex items-center justify-between gap-3 py-2.5 text-[14px] hover:text-nhan-dam"><span>{c.nhan}</span><span aria-hidden className="text-muc-3">›</span></Link></li>)}</ul>
          )}
        </MucTrang>
        {coQuyen(nd.vaiTro, "lich.xem") ? (
          <MucTrang tieuDe="Lịch hôm nay" phai={<Link href="/lich-hen" className="font-medium text-nhan-dam hover:underline">Mở lịch</Link>}>
            {(lich ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có lịch hẹn nào.</p> : (
              <ul className="divide-y divide-vien">{(lich ?? []).slice(0, 8).map((l) => <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-[14px]"><span><span className="tabular-nums text-muc-3">{gioVN(l.bat_dau)}</span> · {tenK.get(l.khach_id)}</span>{l.trang_thai === "dang_phuc_vu" ? <NhanTrangThai kieu="tot">Đang phục vụ</NhanTrangThai> : l.trang_thai === "hoan_thanh" ? <NhanTrangThai kieu="tram">Xong</NhanTrangThai> : null}</li>)}</ul>
            )}
          </MucTrang>
        ) : (
          <MucTrang tieuDe="Lối tắt"><ul className="grid gap-2 sm:grid-cols-2">{locMenu(nd.vaiTro).filter((m) => m.duong_dan !== "/tong-quan").map((m) => <li key={m.duong_dan}><Link href={m.duong_dan} className="block rounded-nho border border-vien px-3 py-2 text-[14px] hover:border-nhan">{m.ten}</Link></li>)}</ul></MucTrang>
        )}
      </div>
    </>
  );
}
