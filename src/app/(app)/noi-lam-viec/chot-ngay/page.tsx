import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayGioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { chotViec, doDai, mocChot, thoiDiemHan } from "@/lib/cong-viec-han";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NgayChon } from "@/components/ui/NgayChon";
import { HangChiSo } from "@/components/ui/HangChiSo";

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const MOC = [{ ma: "12", ten: "Chốt 12h" }, { ma: "17", ten: "Chốt 17h" }];

/** /noi-lam-viec/chot-ngay — Bảng chốt 12h và 17h: việc đến hạn, đã nộp, đạt, trễ (cờ đỏ từ 30 phút), kẹt ở ai. Dựng lại từ giờ nộp / giờ chấm / giờ báo kẹt đã lưu. */
export default async function TrangChotNgay({ searchParams }: { searchParams: Promise<{ tab?: string; ngay?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xemHet = coQuyen(nd, "viec.tatca");
  const sp = await searchParams, hom = homNayHCM();
  const ngay = sp.ngay && NGAY.test(sp.ngay) && sp.ngay <= hom ? sp.ngay : hom;
  const tab = MOC.some((m) => m.ma === sp.tab) ? sp.tab! : new Date().toLocaleTimeString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }) >= "14:30" ? "17" : "12";
  const moc = mocChot(ngay, tab === "12" ? "12:00" : "17:00"), bay = new Date();
  const hieuLuc = moc > bay ? bay : moc; // chưa tới mốc: tính tạm đến lúc xem

  const db = sb();
  let q = db.from("cong_viec").select("*").neq("trang_thai", "huy").lte("han", ngay).or(`han.gte.${congNgay(ngay, -7)},trang_thai.in.(moi,dang_lam)`).limit(2000);
  if (!xemHet) q = q.or(`nguoi_nhan_id.eq.${nd.nhanVienId},nguoi_giao_id.eq.${nd.nhanVienId}`);
  const [{ data: viec }, { data: nv }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten").order("ho_ten")]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));

  const dong = (viec ?? []).map((v) => ({ v, c: chotViec(v, ngay, hieuLuc) })).filter((x) => x.c.trongBang);
  const chuaDen = (viec ?? []).filter((v) => chotViec(v, ngay, hieuLuc).chuaDen).length;
  const dem = (f: (c: (typeof dong)[number]["c"]) => boolean) => dong.filter((x) => f(x.c)).length;
  const theoNguoi = new Map<string, { den: number; nop: number; dat: number; tre: number; ket: string[] }>();
  for (const { v, c } of dong) {
    const o = theoNguoi.get(v.nguoi_nhan_id) ?? { den: 0, nop: 0, dat: 0, tre: 0, ket: [] };
    o.den++; if (c.daNop) o.nop++; if (c.dat) o.dat++; if (c.tre) o.tre++;
    if (c.ket && v.ket_nguoi_id) o.ket.push(ten.get(v.ket_nguoi_id) ?? "người khác");
    theoNguoi.set(v.nguoi_nhan_id, o);
  }
  const bangNguoi = [...theoNguoi.entries()].map(([id, o]) => ({ id, ...o })).sort((a, b) => b.tre - a.tre || (b.den - b.nop) - (a.den - a.nop));
  // Việc cần chú ý trước: trễ, kẹt, chưa nộp, chưa đạt, chờ chấm; việc đã Đạt xuống cuối.
  const hang = (c: (typeof dong)[number]["c"]) => (c.tre ? 0 : c.ket ? 1 : c.vuaQua ? 2 : c.chuaDat ? 3 : !c.daNop ? 4 : !c.dat ? 5 : 6);
  const chiTiet = [...dong].sort((a, b) => hang(a.c) - hang(b.c));
  const tinhTrang = (c: (typeof dong)[number]["c"]) => {
    if (c.dat) return <NhanTrangThai kieu="tot">Đạt{c.nopTre ? " (nộp trễ)" : ""}</NhanTrangThai>;
    if (c.chuaDat) return <NhanTrangThai kieu="loi">Chưa đạt</NhanTrangThai>;
    if (c.daNop) return <NhanTrangThai kieu="cho">Đã nộp, chờ chấm{c.nopTre ? " (trễ)" : ""}</NhanTrangThai>;
    if (c.tre) return <NhanTrangThai kieu="loi">Trễ{c.tonCu ? " (tồn từ trước)" : ""}</NhanTrangThai>;
    return <NhanTrangThai kieu="cho">Quá hạn dưới 30 phút</NhanTrangThai>;
  };

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/noi-lam-viec", nhan: "Nơi làm việc" }} tieuDe="Bảng chốt 12h và 17h" phu="Mỗi việc đến hạn tới mốc chốt: đã nộp chưa, đạt chưa, trễ bao lâu, kẹt ở ai. Trễ từ 30 phút trở lên hiện cờ đỏ.">
        <form className="flex flex-wrap items-end gap-2" action="/noi-lam-viec/chot-ngay">
          <input type="hidden" name="tab" value={tab} />
          <label className="text-[12.5px] text-muc-3">Ngày<NgayChon ten="ngay" giaTriMacDinh={ngay} tuNam={2024} denNam={2035} ariaLabel="Ngày chốt" /></label>
          <button className="rounded bg-nhan px-3 py-1.5 text-[14px] text-white">Xem</button>
        </form>
      </TieuDeNoi>
      <Tab muc={MOC} dang={tab} goc="/noi-lam-viec/chot-ngay" them={`&ngay=${ngay}`} />
      {moc > bay && <p className="mb-3 text-[13px] text-muc-3">Chưa tới {tab}h: số tạm tính đến {ngayGioVN(bay.toISOString())}.</p>}
      <HangChiSo muc={[
        { nhan: "Việc đến hạn", so: soVN(dong.length), ghiChu: `${soVN(chuaDen)} việc hạn sau mốc` },
        { nhan: "Đã nộp", so: soVN(dem((c) => c.daNop)), ghiChu: `${soVN(dem((c) => c.daNop && !c.dat && !c.chuaDat))} chờ chấm` },
        { nhan: "Đạt", so: soVN(dem((c) => c.dat)), ghiChu: `${soVN(dem((c) => c.chuaDat))} chưa đạt` },
        { nhan: "Trễ (cờ đỏ)", so: soVN(dem((c) => c.tre)), ghiChu: `${soVN(dem((c) => c.vuaQua))} quá hạn dưới 30 phút` },
        { nhan: "Đang kẹt", so: soVN(dem((c) => c.ket)) },
      ]} />
      <h2 className="mb-2 mt-6 text-[15px] font-medium">Theo người làm</h2>
      <Bang duLieu={bangNguoi} khoa={(r) => r.id} trong="Chưa có việc nào đến hạn tới mốc này."
        cot={[
          { nhan: "Người làm", chinh: true, hienThi: (r) => ten.get(r.id) ?? "" },
          { nhan: "Đến hạn", phai: true, hienThi: (r) => soVN(r.den) }, { nhan: "Đã nộp", phai: true, hienThi: (r) => soVN(r.nop) }, { nhan: "Đạt", phai: true, hienThi: (r) => soVN(r.dat) },
          { nhan: "Trễ", phai: true, hienThi: (r) => (r.tre > 0 ? <NhanTrangThai kieu="loi">{r.tre}</NhanTrangThai> : "0") },
          { nhan: "Kẹt ở ai", hienThi: (r) => [...new Set(r.ket)].join(", ") },
        ]} />
      <h2 className="mb-2 mt-6 text-[15px] font-medium">Từng việc</h2>
      <Bang duLieu={chiTiet} khoa={(r) => r.v.id} trong="Không có việc nào."
        cot={[
          { nhan: "Công việc", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.v.tieu_de}</span>{r.v.san_pham && r.c.daNop && <div className="text-[12.5px] text-muc-3">Sản phẩm: {r.v.san_pham}</div>}</div> },
          { nhan: "Người làm", hienThi: (r) => ten.get(r.v.nguoi_nhan_id) ?? "" },
          { nhan: "Hạn nộp", hienThi: (r) => { const h = thoiDiemHan(r.v.han_gio, r.v.han); return <span className="text-[13px] tabular-nums">{h ? ngayGioVN(h.toISOString()) : ngayVN(r.v.han)}{r.c.tre && h ? <div className="text-loi">Trễ {doDai(Math.floor((hieuLuc.getTime() - h.getTime()) / 60_000))}</div> : null}</span>; } },
          { nhan: "Tình trạng", hienThi: (r) => tinhTrang(r.c) },
          { nhan: "Kẹt ở ai", hienThi: (r) => (r.c.ket && r.v.ket_nguoi_id ? <span className="text-[13px] text-loi">{ten.get(r.v.ket_nguoi_id) ?? "người khác"}{r.v.ket_ly_do ? `: ${r.v.ket_ly_do}` : ""}</span> : "") },
        ]} />
    </div>
  );
}
