import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen, type Quyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { cuoiThang } from "@/lib/lich-hr";
import { bienDongQuanSo, gopLuongTheoPhong, tienDoOnboarding, tomTatThuViec, tiLe } from "@/lib/bao-cao-hr";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

const TAB: { ma: string; ten: string; quyen: Quyen }[] = [
  { ma: "tong", ten: "Báo cáo nhân sự", quyen: "baocao.tien" },
  { ma: "onboarding", ten: "Onboarding và thử việc", quyen: "hr.hoso" },
  { ma: "cong-luong", ten: "Công lương", quyen: "luong.xem" },
];
const KHONG_AI = ["00000000-0000-0000-0000-000000000000"];

function So({ nhan, giaTri, phu }: { nhan: string; giaTri: string | number; phu?: string }) {
  return (
    <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5">
      <div className="text-[12.5px] text-muc-3">{nhan}</div>
      <div className="mt-0.5 text-[22px] font-semibold tabular-nums text-muc">{giaTri}</div>
      {phu && <div className="text-[12.5px] text-muc-3">{phu}</div>}
    </div>
  );
}

/** Báo cáo nhân sự: ba báo cáo tính thẳng từ hồ sơ, tiến độ onboarding và bảng lương. Khoá theo chi nhánh người xem; mỗi tab theo quyền riêng. Báo cáo tuyển dụng nằm ở trang Tuyển dụng (tab Báo cáo). */
export default async function TrangBaoCaoNhanSu({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const duoc = TAB.filter((t) => coQuyen(nd, t.quyen));
  if (!duoc.length) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem báo cáo nhân sự.</p>;
  const yc = (await searchParams).tab;
  const tab = (duoc.find((t) => t.ma === yc) ?? duoc[0]).ma;
  const db = sb(), hom = homNayHCM();
  const dauThang = `${hom.slice(0, 8)}01`, cuoiT = cuoiThang(Number(hom.slice(0, 4)), Number(hom.slice(5, 7)));

  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, phong_ban_id, hoat_dong, ngay_vao_lam, ngay_vao_chinh_thuc, ngay_nghi_viec").order("ho_ten");
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: nvAll }, { data: pb }] = await Promise.all([qn, db.from("phong_ban").select("id, ten")]);
  const nv = nvAll ?? [], ten = new Map(pb?.map((p) => [p.id, p.ten]));
  const nhanVien = new Map(nv.map((n) => [n.id, n]));
  const ids = nv.map((n) => n.id);

  let noiDung: React.ReactNode = null;
  if (tab === "tong") {
    const dangLam = nv.filter((n) => n.hoat_dong && !n.ngay_nghi_viec);
    const bd = bienDongQuanSo(nv, dauThang, cuoiT);
    const theoPhong = new Map<string, number>();
    for (const n of dangLam) { const k = n.phong_ban_id ? ten.get(n.phong_ban_id) ?? "Khác" : "Chưa gán phòng"; theoPhong.set(k, (theoPhong.get(k) ?? 0) + 1); }
    const [{ data: uv }, { data: kenh }, { data: ky }] = await Promise.all([
      db.from("ung_vien").select("trang_thai, ngay_nhan_ho_so").gte("ngay_nhan_ho_so", dauThang),
      db.from("dang_tin_kenh").select("chi_phi").gte("ngay_dang", dauThang),
      db.from("ky_luong").select("id, thang, nam").order("nam", { ascending: false }).order("thang", { ascending: false }).limit(1),
    ]);
    const nhanViec = (uv ?? []).filter((u) => u.trang_thai === "Nhận việc").length, chiPhiTd = (kenh ?? []).reduce((s, k) => s + Number(k.chi_phi), 0);
    const { data: dong } = ky?.[0] && ids.length ? await db.from("bang_luong_dong").select("thuc_tra").eq("ky_id", ky[0].id).in("nhan_vien_id", ids) : { data: [] };
    const tongLuong = (dong ?? []).reduce((s, d) => s + Number(d.thuc_tra), 0);
    const thu = tomTatThuViec(nv, new Map(), hom);
    noiDung = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <So nhan="Quân số đang làm" giaTri={dangLam.length} />
          <So nhan="Vào mới trong tháng" giaTri={bd.vao} phu={`Từ ${ngayVN(dauThang)}`} />
          <So nhan="Nghỉ việc trong tháng" giaTri={bd.nghi} phu={`Tỉ lệ nghỉ ${bd.tiLeNghi}%`} />
          <So nhan="Đang thử việc" giaTri={thu.dangThu} phu={`${thu.sapHetHan.length} người sắp hết hạn`} />
          <So nhan="Ứng viên nhận trong tháng" giaTri={(uv ?? []).length} phu={`${nhanViec} nhận việc`} />
          <So nhan="Chi phí đăng tin tháng này" giaTri={tienVN(chiPhiTd)} phu={nhanViec ? `${tienVN(Math.round(chiPhiTd / nhanViec))} mỗi người nhận việc` : undefined} />
          <So nhan={ky?.[0] ? `Thực trả kỳ ${String(ky[0].thang).padStart(2, "0")}/${ky[0].nam}` : "Thực trả kỳ gần nhất"} giaTri={ky?.[0] ? tienVN(tongLuong) : "Chưa có kỳ"} />
          <So nhan="Tỉ lệ đạt thử việc" giaTri={`${thu.tiLeDat}%`} phu={`${thu.daLen} lên chính thức, ${thu.nghiKhiThu} nghỉ khi thử`} />
        </div>
        <section>
          <h2 className="nhan-muc mb-3">Quân số theo phòng</h2>
          <Bang noi duLieu={[...theoPhong].sort((a, b) => b[1] - a[1])} khoa={(r) => r[0]} trong="Chưa có nhân sự." cot={[
            { nhan: "Phòng", chinh: true, hienThi: (r) => r[0] }, { nhan: "Số người", phai: true, hienThi: (r) => r[1] },
            { nhan: "Tỉ trọng", phai: true, hienThi: (r) => `${tiLe(r[1], dangLam.length)}%` },
          ]} />
        </section>
        <p className="text-[13px] text-muc-3">Báo cáo tuyển dụng chi tiết theo kênh và theo tháng ở <Link href="/nhan-su/tuyen-dung?tab=bao-cao" className="text-nhan-dam hover:underline">trang Tuyển dụng</Link>.</p>
      </div>
    );
  } else if (tab === "onboarding") {
    const [{ data: muc }, { data: td }, { data: hd }] = await Promise.all([
      db.from("onboarding_muc").select("id, sau_ngay").eq("hoat_dong", true),
      db.from("onboarding_tien_do").select("nhan_vien_id, muc_id").in("nhan_vien_id", ids.length ? ids : KHONG_AI),
      db.from("hd_lao_dong").select("nhan_vien_id, den_ngay").eq("giai_doan", "thu_viec").in("nhan_vien_id", ids.length ? ids : KHONG_AI),
    ]);
    const hanHd = new Map((hd ?? []).map((h) => [h.nhan_vien_id, h.den_ngay as string | null]));
    const tt = tomTatThuViec(nv, hanHd, hom, 45);
    const xong = new Map<string, Set<string>>();
    for (const t of td ?? []) { const s = xong.get(t.nhan_vien_id) ?? new Set<string>(); s.add(t.muc_id); xong.set(t.nhan_vien_id, s); }
    const moi = nv.filter((n) => n.hoat_dong && !n.ngay_nghi_viec && n.ngay_vao_lam && n.ngay_vao_lam >= congNgay(hom, -90)).map((n) => ({ n, td: tienDoOnboarding(n.ngay_vao_lam!, muc ?? [], xong.get(n.id) ?? new Set(), hom) }));
    noiDung = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <So nhan="Đang thử việc" giaTri={tt.dangThu} /><So nhan="Đã lên chính thức" giaTri={tt.daLen} /><So nhan="Nghỉ khi thử việc" giaTri={tt.nghiKhiThu} /><So nhan="Tỉ lệ đạt thử việc" giaTri={`${tt.tiLeDat}%`} />
        </div>
        <section>
          <h2 className="nhan-muc mb-3">Sắp hết hạn thử việc (45 ngày tới)</h2>
          <Bang noi duLieu={tt.sapHetHan} khoa={(r) => r.id} trong="Không ai sắp hết hạn thử việc." cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{nhanVien.get(r.id)?.ho_ten}<div className="text-[12.5px] text-muc-3">{nhanVien.get(r.id)?.ma_nv}</div></div> },
            { nhan: "Hạn thử việc", hienThi: (r) => ngayVN(r.han) }, { nhan: "", hienThi: (r) => <NhanTrangThai kieu={r.conLai < 0 ? "loi" : r.conLai <= 7 ? "cho" : "tram"}>{r.conLai < 0 ? `Quá ${-r.conLai} ngày` : `Còn ${r.conLai} ngày`}</NhanTrangThai> },
          ]} />
        </section>
        <section>
          <h2 className="nhan-muc mb-3">Tiến độ lộ trình, người vào làm 90 ngày gần đây</h2>
          <Bang noi duLieu={moi} khoa={(r) => r.n.id} trong="Không có nhân viên mới trong 90 ngày gần đây." cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{r.n.ho_ten}<div className="text-[12.5px] text-muc-3">{r.n.ma_nv} · vào làm {ngayVN(r.n.ngay_vao_lam)}</div></div> },
            { nhan: "Mốc xong", phai: true, hienThi: (r) => `${r.td.xong}/${r.td.tong}` },
            { nhan: "Quá hạn", phai: true, hienThi: (r) => (r.td.quaHan ? <span className="font-medium text-canh-bao">{r.td.quaHan}</span> : "0") },
          ]} />
          <p className="mt-2 text-[13px]"><Link href="/nhan-su/onboarding" className="text-nhan-dam hover:underline">Mở trang Onboarding để đánh dấu mốc</Link></p>
        </section>
      </div>
    );
  } else {
    const { data: ky } = await db.from("ky_luong").select("id, thang, nam, trang_thai").order("nam", { ascending: false }).order("thang", { ascending: false }).limit(12);
    const kyXem = ky?.[0];
    const { data: dong } = kyXem && ids.length ? await db.from("bang_luong_dong").select("nhan_vien_id, gross, hoa_hong, bhxh_nld, thuc_tra").eq("ky_id", kyXem.id).in("nhan_vien_id", ids) : { data: [] };
    const theoPhong = gopLuongTheoPhong(dong ?? [], (id) => nhanVien.get(id)?.phong_ban_id ?? null, (id) => ten.get(id) ?? "Khác");
    const tong = theoPhong.reduce((s, r) => ({ n: s.n + r.soNguoi, thucTra: s.thucTra + r.thucTra, hoaHong: s.hoaHong + r.hoaHong, bhxh: s.bhxh + r.bhxh }), { n: 0, thucTra: 0, hoaHong: 0, bhxh: 0 });
    noiDung = !kyXem ? <p className="text-[14px] text-muc-3">Chưa có kỳ lương nào.</p> : (
      <div className="space-y-6">
        <p className="text-[14px] text-muc-2">Kỳ lương gần nhất: tháng {String(kyXem.thang).padStart(2, "0")}/{kyXem.nam} · <Link href={`/nhan-su/luong/${kyXem.id}`} className="text-nhan-dam hover:underline">Mở bảng lương</Link></p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <So nhan="Số người có lương" giaTri={tong.n} /><So nhan="Tổng thực trả" giaTri={tienVN(tong.thucTra)} /><So nhan="Hoa hồng" giaTri={tienVN(tong.hoaHong)} /><So nhan="BHXH người lao động" giaTri={tienVN(tong.bhxh)} />
        </div>
        <Bang noi duLieu={theoPhong} khoa={(r) => r.phong} trong="Kỳ này chưa có dòng lương." cot={[
          { nhan: "Phòng", chinh: true, hienThi: (r) => r.phong }, { nhan: "Số người", phai: true, hienThi: (r) => r.soNguoi },
          { nhan: "Tổng thu nhập", phai: true, hienThi: (r) => tienVN(r.gross) }, { nhan: "Hoa hồng", phai: true, hienThi: (r) => tienVN(r.hoaHong) },
          { nhan: "Thực trả", phai: true, hienThi: (r) => tienVN(r.thucTra) },
        ]} />
        <section>
          <h2 className="nhan-muc mb-3">Các kỳ gần đây</h2>
          <Bang noi duLieu={ky ?? []} khoa={(r) => r.id} cot={[
            { nhan: "Kỳ", chinh: true, hienThi: (r) => <Link href={`/nhan-su/luong/${r.id}`} className="text-nhan-dam hover:underline">Tháng {String(r.thang).padStart(2, "0")}/{r.nam}</Link> },
            { nhan: "Trạng thái", hienThi: (r) => r.trang_thai },
          ]} />
        </section>
      </div>
    );
  }

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Báo cáo nhân sự" phu="Quân số, thử việc, onboarding và công lương tính thẳng từ hồ sơ và bảng lương. Báo cáo tuyển dụng ở trang Tuyển dụng." />
      <nav aria-label="Các báo cáo" className="mb-5 flex flex-wrap gap-2">
        {duoc.map((t) => (
          <Link key={t.ma} href={`/nhan-su/bao-cao?tab=${t.ma}`} aria-current={t.ma === tab ? "page" : undefined}
            className={`rounded-nho border px-3.5 py-2 text-[14px] transition-colors ${t.ma === tab ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>
        ))}
      </nav>
      {noiDung}
    </div>
  );
}
