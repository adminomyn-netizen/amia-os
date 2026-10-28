import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { layTomTatHoSo } from "@/lib/data-ho-so";
import { THU_TU_HD, tinhHieuLuc } from "@/lib/van-ban";
import { THU_TU_THAM_NIEN, THU_TU_TUOI, VAI_TRO_CHUYEN_MON, nhomThamNien, nhomTuoi, ngayToiSinhNhat, thamNien, tuoi } from "@/lib/ho-so";
import { TT_LAM } from "@/lib/nhan-su";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { Chon } from "@/components/ui/Chon";
import { NHAN_O, NUT_CHINH, NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { ThanhTyLe } from "@/components/ui/ThanhTyLe";

const MOI_TRANG = 20;
type SP = { q?: string; tt?: string; vt?: string; cn?: string; pb?: string; thieu?: string; trang?: string };

export default async function TrangDanhSachHoSo({ searchParams }: { searchParams: Promise<SP> }) {
  const nd = await yeuCauQuyen("hr.hoso");
  const sp = await searchParams;
  const db = sb(), hom = homNayHCM(), nam = hom.slice(0, 4);
  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, email, dien_thoai, chuc_danh, chi_nhanh_id, phong_ban_id, ngay_vao_lam, ngay_nghi_viec, trang_thai_lam, vai_tro, vai_tro_chuyen_mon, hoat_dong").order("ho_ten");
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: ds }, { data: cn }, { data: pb }, { data: hd }, { data: ch }, tomTat, { data: nghiCho }] = await Promise.all([
    qn, db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu"), db.from("phong_ban").select("id, ten").eq("hoat_dong", true).order("thu_tu"),
    db.from("hd_lao_dong").select("nhan_vien_id, giai_doan, den_ngay"), db.from("cau_hinh").select("gia_tri").eq("khoa", "hd.nhac_truoc_ngay").maybeSingle(), layTomTatHoSo(),
    db.from("nghi_viec").select("id").eq("trang_thai", "cho_duyet"),
  ]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten])), tenPb = new Map((pb ?? []).map((p) => [p.id, p.ten]));
  const truoc = Number(ch?.gia_tri ?? 45);
  const hdTheo = new Map<string, { giai_doan: string; den_ngay: string | null }>();
  for (const h of (hd ?? []).sort((a, b) => THU_TU_HD.indexOf(a.giai_doan as never) - THU_TU_HD.indexOf(b.giai_doan as never))) hdTheo.set(h.nhan_vien_id, h);
  const tinhHd = (id: string) => { const h = hdTheo.get(id); return h ? (h.giai_doan === "kxd" ? "con" : tinhHieuLuc(h.den_ngay, hom, congNgay, truoc)) : "khong"; };

  const tatCa = (ds ?? []).filter((n) => n.vai_tro !== "nha_dau_tu");
  const dangLam = tatCa.filter((n) => n.hoat_dong && n.trang_thai_lam !== "nghi_viec");

  // ── quân số theo năm (công thức Lark 1.1) ──
  const dauNam = `${nam}-01-01`, cuoiNam = `${nam}-12-31`;
  const dauKy = tatCa.filter((n) => n.ngay_vao_lam && n.ngay_vao_lam <= dauNam && (!n.ngay_nghi_viec || n.ngay_nghi_viec >= dauNam)).length;
  const cuoiKy = tatCa.filter((n) => (!n.ngay_vao_lam || n.ngay_vao_lam <= cuoiNam) && (!n.ngay_nghi_viec || n.ngay_nghi_viec > cuoiNam)).length;
  const moi = tatCa.filter((n) => n.ngay_vao_lam && n.ngay_vao_lam >= dauNam && n.ngay_vao_lam <= cuoiNam).length;
  const nghi = tatCa.filter((n) => n.ngay_nghi_viec && n.ngay_nghi_viec >= dauNam && n.ngay_nghi_viec <= cuoiNam).length;
  const binhQuan = (dauKy + cuoiKy) / 2;
  const bienDong = binhQuan ? Math.round((nghi / binhQuan) * 100) : 0;
  const giuChan = cuoiKy - moi + nghi > 0 ? Math.round(((cuoiKy - moi) / (cuoiKy - moi + nghi)) * 100) : 100;

  // ── cơ cấu ──
  const demTheo = <T,>(ds2: T[], f: (x: T) => string, thuTu: string[]) => { const m = new Map<string, number>(); for (const x of ds2) m.set(f(x), (m.get(f(x)) ?? 0) + 1); return thuTu.filter((k) => m.has(k)).map((k) => ({ k, v: m.get(k)! })); };
  const hsMap = tomTat;
  const coCau = {
    thamNien: demTheo(dangLam, (n) => nhomThamNien(n.ngay_vao_lam, hom), THU_TU_THAM_NIEN),
    tuoi: demTheo(dangLam, (n) => nhomTuoi(tuoi(hsMap.get(n.id)?.ngaySinh, hom)), THU_TU_TUOI),
  };
  const sinhNhat = dangLam.map((n) => ({ n, ngay: hsMap.get(n.id)?.ngaySinh })).filter((x) => x.ngay).map((x) => ({ ...x, con: ngayToiSinhNhat(x.ngay!, hom) })).filter((x) => x.con <= 14).sort((a, b) => a.con - b.con);
  const thieuHs = dangLam.filter((n) => (hsMap.get(n.id)?.tyLe ?? 0) < 100 || (hsMap.get(n.id)?.thieu ?? 0) > 0).length;
  const choXn = dangLam.reduce((s, n) => s + (hsMap.get(n.id)?.choXacNhan ?? 0), 0);

  // ── lọc ──
  const q = (sp.q ?? "").trim().toLowerCase();
  const tt = sp.tt ?? "dang_lam";
  let loc = tatCa.filter((n) => (tt === "tat_ca" ? true : tt === "dang_lam" ? n.hoat_dong && n.trang_thai_lam === "dang_lam" : n.trang_thai_lam === tt || (tt === "khoa" && !n.hoat_dong)));
  if (q) loc = loc.filter((n) => `${n.ho_ten} ${n.ma_nv} ${n.email ?? ""} ${n.dien_thoai ?? ""}`.toLowerCase().includes(q));
  if (sp.vt) loc = loc.filter((n) => (n.vai_tro_chuyen_mon ?? []).includes(sp.vt!));
  if (sp.cn) loc = loc.filter((n) => n.chi_nhanh_id === sp.cn);
  if (sp.pb) loc = loc.filter((n) => n.phong_ban_id === sp.pb);
  if (sp.thieu === "1") loc = loc.filter((n) => (hsMap.get(n.id)?.tyLe ?? 0) < 100 || (hsMap.get(n.id)?.thieu ?? 0) > 0);
  const tong = loc.length, soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG)), trang = Math.min(soTrang, Math.max(1, Number(sp.trang) || 1));
  const hien = loc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const lienKet = (p: number) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries(sp)) if (v && k !== "trang") u.set(k, v); if (p > 1) u.set("trang", String(p)); const s = u.toString(); return `/nhan-su/ho-so${s ? `?${s}` : ""}`; };

  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Hồ sơ nhân sự" phu="Một nơi xem hồ sơ từng người: thông tin cá nhân, giấy tờ, hợp đồng, lộ trình, công phép, nghỉ việc. Mỗi lần mở giấy tờ đều được ghi lại.">
        <Link href="/nhan-su/nghi-viec" className={`${NUT_PHU} inline-flex items-center`}>Nghỉ việc{(nghiCho ?? []).length ? ` (${(nghiCho ?? []).length})` : ""}</Link>
        <Link href="/nhan-su/danh-muc" className={`${NUT_PHU} inline-flex items-center`}>Phòng ban & chức danh</Link>
      </TieuDeTrang>
      <HangChiSo muc={[
        { nhan: "Đang làm việc", so: String(dangLam.length), ghiChu: `Đầu năm ${dauKy} · cuối năm ${cuoiKy}` },
        { nhan: `Vào làm ${nam}`, so: String(moi), ghiChu: `Nghỉ việc ${nghi}` },
        { nhan: "Biến động nghỉ việc", so: `${bienDong}%`, ghiChu: `Giữ chân ${giuChan}% (quân số bình quân ${binhQuan.toLocaleString("vi-VN")})` },
        { nhan: "Hồ sơ chưa đủ", so: String(thieuHs), ghiChu: choXn ? `${choXn} giấy tờ chờ xác nhận` : "Không có giấy tờ chờ xác nhận" },
      ]} />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="the-noi the-noi-thap p-4 sm:p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Thâm niên</h2>
          <ThanhTyLe dong={coCau.thamNien.map((x) => ({ nhan: x.k, so: x.v }))} donVi="người" />
        </section>
        <section className="the-noi the-noi-thap p-4 sm:p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Độ tuổi</h2>
          <ThanhTyLe dong={coCau.tuoi.map((x) => ({ nhan: x.k, so: x.v }))} donVi="người" />
        </section>
        <section className="the-noi the-noi-thap p-4 sm:p-5">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Sinh nhật 14 ngày tới</h2>
          {sinhNhat.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có (hoặc chưa ai điền ngày sinh).</p> : (
            <ul className="space-y-2 text-[14px]">{sinhNhat.slice(0, 8).map((x) => <li key={x.n.id} className="flex justify-between gap-3"><Link href={`/nhan-su/ho-so/${x.n.id}`} className="truncate hover:underline">{x.n.ho_ten}</Link><span className="shrink-0 text-muc-3">{x.con === 0 ? "Hôm nay" : `${x.con} ngày nữa`} · {ngayVN(x.ngay!).slice(0, 5)}</span></li>)}</ul>
          )}
        </section>
      </div>

      <form method="get" action="/nhan-su/ho-so" className="mb-4 mt-8 grid grid-cols-2 items-end gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="col-span-2 md:col-span-3 xl:col-span-2"><label htmlFor="f-q" className={NHAN_O}>Tìm theo tên, mã, email, điện thoại</label><input id="f-q" name="q" defaultValue={sp.q ?? ""} className={O_NHAP} placeholder="Nhập rồi bấm Lọc" /></div>
        <div><label className={NHAN_O}>Trạng thái</label><Chon ten="tt" giaTriMacDinh={tt} luaChon={[{ gia_tri: "dang_lam", nhan: "Đang làm" }, ...Object.entries(TT_LAM).filter(([k]) => k !== "dang_lam").map(([gia_tri, nhan]) => ({ gia_tri, nhan })), { gia_tri: "tat_ca", nhan: "Tất cả" }]} /></div>
        <div><label className={NHAN_O}>Phòng ban</label><Chon ten="pb" giaTriMacDinh={sp.pb ?? ""} luaChon={[{ gia_tri: "", nhan: "Mọi phòng ban" }, ...(pb ?? []).map((p) => ({ gia_tri: p.id, nhan: p.ten }))]} /></div>
        {!nd.chiNhanhId && <div><label className={NHAN_O}>Chi nhánh</label><Chon ten="cn" giaTriMacDinh={sp.cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Mọi chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div>}
        <div><label className={NHAN_O}>Vai trò chuyên môn</label><Chon ten="vt" giaTriMacDinh={sp.vt ?? ""} luaChon={[{ gia_tri: "", nhan: "Mọi vai trò" }, ...Object.entries(VAI_TRO_CHUYEN_MON).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))]} /></div>
        <label className="flex h-11 items-center gap-2 text-[14px] text-muc-2"><input type="checkbox" name="thieu" value="1" defaultChecked={sp.thieu === "1"} /> Chỉ hồ sơ còn thiếu</label>
        <div className="flex gap-2"><button type="submit" className={NUT_CHINH}>Lọc</button><Link href="/nhan-su/ho-so" className={`${NUT_PHU} inline-flex items-center`}>Bỏ lọc</Link></div>
      </form>

      <Bang duLieu={hien} khoa={(r) => r.id} trong="Không có nhân viên nào khớp bộ lọc."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <Link href={`/nhan-su/ho-so/${r.id}`} className="block"><span className="text-muc hover:underline">{r.ho_ten}</span><div className="text-[12.5px] text-muc-3">{r.ma_nv}</div></Link> },
          { nhan: "Liên hệ", hienThi: (r) => <div className="text-[13px]">{r.dien_thoai ?? "—"}<div className="text-muc-3">{r.email ?? "Chưa có tài khoản"}</div></div> },
          { nhan: "Công việc", hienThi: (r) => <div className="text-[13px]">{r.chuc_danh ?? "—"}<div className="text-muc-3">{[r.phong_ban_id ? tenPb.get(r.phong_ban_id) : "", (r.vai_tro_chuyen_mon ?? []).map((m) => VAI_TRO_CHUYEN_MON[m] ?? m).join(", ")].filter(Boolean).join(" · ")}</div></div> },
          { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : "Mọi chi nhánh") },
          { nhan: "Vào làm", hienThi: (r) => (r.ngay_vao_lam ? <div className="text-[13px]">{ngayVN(r.ngay_vao_lam)}<div className="text-muc-3">{thamNien(r.ngay_vao_lam, hom)}</div></div> : <span className="text-canh-bao">Chưa có</span>) },
          { nhan: "HĐLĐ", hienThi: (r) => { const h = tinhHd(r.id); return h === "het" ? <NhanTrangThai kieu="loi">Hết hạn</NhanTrangThai> : h === "sap" ? <NhanTrangThai kieu="cho">Sắp hết hạn</NhanTrangThai> : h === "con" ? <NhanTrangThai kieu="tot">Còn hạn</NhanTrangThai> : <span className="text-muc-3">Chưa có</span>; } },
          { nhan: "Hồ sơ", hienThi: (r) => { const t = hsMap.get(r.id); return <div className="text-[13px]">{t?.tyLe ?? 0}%{t && t.thieu > 0 ? <div className="text-canh-bao">Thiếu {t.thieu} giấy tờ</div> : t && t.choXacNhan > 0 ? <div className="text-muc-3">{t.choXacNhan} chờ xác nhận</div> : null}</div>; } },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong && r.trang_thai_lam === "dang_lam" ? "tot" : r.trang_thai_lam === "tam_nghi" ? "cho" : "tram"}>{TT_LAM[r.trang_thai_lam] ?? ""}</NhanTrangThai> },
        ]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muc-3">
        <span>{tong === 0 ? "Không có kết quả" : `Hiện ${(trang - 1) * MOI_TRANG + 1} đến ${Math.min(tong, trang * MOI_TRANG)} của ${tong} nhân viên`}</span>
        {soTrang > 1 && (
          <nav className="flex items-center gap-1" aria-label="Phân trang">
            {trang > 1 && <Link href={lienKet(trang - 1)} className="rounded-nho border border-vien px-3 py-1.5 hover:bg-giay-tram">Trước</Link>}
            <span className="px-2">Trang {trang}/{soTrang}</span>
            {trang < soTrang && <Link href={lienKet(trang + 1)} className="rounded-nho border border-vien px-3 py-1.5 hover:bg-giay-tram">Sau</Link>}
          </nav>
        )}
      </div>
    </div>
  );
}
