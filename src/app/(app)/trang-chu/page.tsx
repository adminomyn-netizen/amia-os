import Link from "next/link";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { sb } from "@/lib/db";
import { layCanhBao } from "@/lib/canh-bao";
import { congNgay, gioVN, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { locMenu } from "@/lib/nav";
import { coQuyen, NHAN_VAI_TRO, type VaiTro } from "@/lib/quyen";
import { DongHo } from "@/components/layout/DongHo";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { CaiUngDung } from "@/components/trang-chu/CaiUngDung";
import { BatThongBao } from "@/components/trang-chu/BatThongBao";

const LOI_TAT = [
  { href: "/nhan-su/cham-cong", nhan: "Chấm công", q: "noibo.dung" as const },
  { href: "/lich-hen", nhan: "Đặt lịch hẹn", q: "lich.sua" as const }, { href: "/ban-hang", nhan: "Bán hàng", q: "ban.tao" as const },
  { href: "/khach-hang", nhan: "Tìm khách", q: "khach.xem" as const }, { href: "/hoa-don", nhan: "Thu nợ", q: "no.thu" as const },
  { href: "/the", nhan: "Thẻ liệu trình", q: "the.thuchien" as const }, { href: "/phieu-cap", nhan: "Phiếu cấp vật tư", q: "phieu.xem" as const },
];

/** Mỗi vai trò thấy một câu "việc chính của tôi" ngay dưới lời chào, để biết mình cần nhìn gì trước. */
const VIEC_CHINH: Partial<Record<VaiTro, string>> = {
  chu: "Toàn cảnh cửa hàng hôm nay, việc cần Chủ duyệt và các thiết lập hệ thống.",
  ky_thuat: "Tình trạng hệ thống, tài khoản và các thiết lập cần xử lý.",
  quan_ly: "Doanh thu, lịch hẹn và các việc cần duyệt của chi nhánh.",
  le_tan: "Lịch hẹn hôm nay, khách đến và khách cần nhắc.",
  thu_ngan: "Hoá đơn hôm nay, thu nợ và đối chiếu quỹ.",
  tu_van: "Khách đang tư vấn, lịch hẹn và gói liệu trình đề xuất.",
  bac_si: "Lịch khám hôm nay và hồ sơ khách sắp tới.",
  ktv: "Các buổi liệu trình hôm nay và phiếu cấp vật tư.",
  thu_kho: "Tồn kho, hàng sắp hết hạn và phiếu chờ xử lý.",
  ke_toan: "Phiếu chờ duyệt, công nợ và sổ quỹ.",
  marketing: "Chiến dịch, khách mới và hiệu quả kênh.",
  nha_dau_tu: "Chỉ số kinh doanh tổng quan, chỉ xem.",
  nhan_vien: "Chấm công, đề xuất, lịch làm việc và phiếu lương của tôi.",
};

/** Lối tắt quản trị chỉ Chủ / Kỹ thuật thấy. */
const QUAN_TRI = [
  { href: "/nhan-vien", nhan: "Tài khoản & phân quyền", phu: "Cấp tài khoản, chỉnh quyền từng người" },
  { href: "/cai-dat/vai-tro", nhan: "Vai trò & quyền", phu: "Mỗi vai trò làm được gì" },
  { href: "/cai-dat/chinh-sach-duyet", nhan: "Chính sách phê duyệt", phu: "Ai duyệt, ngưỡng tiền" },
  { href: "/hoa-hong", nhan: "Hoa hồng", phu: "Tỉ lệ theo loại và vai" },
  { href: "/danh-muc", nhan: "Danh mục", phu: "Dịch vụ, sản phẩm, chi nhánh" },
  { href: "/cai-dat", nhan: "Cài đặt cửa hàng", phu: "Thông tin chung, ngân hàng, bảng tin" },
];

/** Trang chủ cá nhân của MỌI nhân viên (kể cả người không có dashboard): việc đang chờ, hiệu suất của tôi tháng này,
 *  lịch hôm nay, lối tắt theo quyền và toàn bộ chức năng. Dashboard điều hành nằm ở mục Tổng quan. */
export default async function TrangChu({ searchParams }: { searchParams: Promise<{ "khong-du-quyen"?: string }> }) {
  const nd = await layNguoiDungDangNhap();
  const sp = await searchParams;
  const db = sb(), homNay = homNayHCM(), dauThang = `${homNay.slice(0, 8)}01`, cn = nd.chiNhanhId;
  const { data: dsTin } = await db.from("bang_tin").select("id, tieu_de, noi_dung, hien_den").eq("hoat_dong", true).lte("hien_tu", homNay).order("ghim", { ascending: false }).order("hien_tu", { ascending: false }).limit(10);
  const tin = (dsTin ?? []).filter((t) => !t.hien_den || t.hien_den >= homNay).slice(0, 3);
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();

  const dieuHanh = nd.vaiTro === "chu" || nd.vaiTro === "ky_thuat" || nd.vaiTro === "quan_ly";
  const laChu = nd.vaiTro === "chu" || nd.vaiTro === "ky_thuat";
  const [canhBao, { data: ban }, { data: buoi }, { data: lichToi }, { data: dtNgay }] = await Promise.all([
    layCanhBao(nd),
    db.rpc("bc_nhan_vien", { p_tu: dauThang, p_den: homNay, p_cn: (cn ?? undefined) as string }),
    db.from("buoi_thuc_hien").select("khach_id, doanh_thu_buoi").eq("nv_thuc_hien_id", nd.nhanVienId).eq("trang_thai", "da_lam").gte("ngay_lam", dauThang).lte("ngay_lam", homNay).limit(1000),
    db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").eq("nhan_vien_id", nd.nhanVienId).gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(8),
    dieuHanh && coQuyen(nd, "baocao.xem") ? db.rpc("bc_doanh_thu_ngay", { p_tu: homNay, p_den: homNay, p_cn: (cn ?? undefined) as string }) : Promise.resolve({ data: null }),
  ]);
  const hn = (dtNgay ?? []).find((n) => n.ngay === homNay);
  let lich = lichToi ?? [], tieuDeLich = "Lịch của tôi hôm nay";
  if (lich.length === 0 && coQuyen(nd, "lich.xem")) {
    let q = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(6);
    if (cn) q = q.eq("chi_nhanh_id", cn);
    lich = (await q).data ?? []; tieuDeLich = "Lịch hôm nay của chi nhánh";
  }
  const ids = [...new Set(lich.map((l) => l.khach_id))];
  const { data: ks } = ids.length ? await db.from("khach_hang").select("id, ho_ten").in("id", ids) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));

  const toi = (ban ?? []).filter((r) => r.nhan_vien_id === nd.nhanVienId);
  const doanhSo = toi.reduce((s, r) => s + Number(r.doanh_so), 0), hoaHong = toi.reduce((s, r) => s + Number(r.hoa_hong), 0);
  const soBuoi = (buoi ?? []).length, soKhach = new Set((buoi ?? []).map((b) => b.khach_id)).size;
  const loiTat = LOI_TAT.filter((l) => coQuyen(nd, l.q));
  const tatCa = locMenu(nd).filter((m) => m.duong_dan !== "/trang-chu");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-stretch justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="nhan-muc">{nd.vaiTro === "chu" ? "CHỦ · quản trị toàn hệ thống" : `${NHAN_VAI_TRO[nd.vaiTro]}${nd.chucDanh ? ` · ${nd.chucDanh}` : ""}`}</p>
          <h1 className="chu-tieu-de mt-1 text-[28px] leading-[1.15] text-muc lg:text-[34px]">Xin chào, {nd.hoTen}</h1>
          <p className="mt-1.5 text-[14px] text-muc-3">Hôm nay {ngayVN(homNay)}</p>
          {VIEC_CHINH[nd.vaiTro] && <p className="mt-2 max-w-xl text-[14px] text-muc-2">Việc chính của tôi: {VIEC_CHINH[nd.vaiTro]}</p>}
        </div>
        <DongHo />
      </div>
      {tin.length > 0 && (
        <section aria-label="Bảng tin công ty" className="space-y-2.5">
          {tin.map((t) => (
            <article key={t.id} className="the-noi the-noi-thap px-4 py-3.5">
              <h2 className="text-[15px] font-semibold text-muc">{t.tieu_de}</h2>
              <p className="mt-1 whitespace-pre-line text-[14px] text-muc-2">{t.noi_dung}</p>
            </article>
          ))}
        </section>
      )}
      {sp["khong-du-quyen"] && <p role="alert" className="rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">Vai trò của bạn không mở được trang vừa chọn.</p>}

      {dieuHanh ? (
        <section aria-label="Điều hành hôm nay">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Cửa hàng hôm nay{cn ? " · chi nhánh của tôi" : " · toàn hệ thống"}</h2>
          {hn || coQuyen(nd, "baocao.xem") ? (
            <HangChiSo muc={[
              { nhan: "Doanh thu hôm nay", so: tienVN(Number(hn?.doanh_thu ?? 0)) }, { nhan: "Số đơn", so: soVN(Number(hn?.so_don ?? 0)) },
              { nhan: "Buổi liệu trình", so: soVN(Number(hn?.so_buoi ?? 0)) }, { nhan: "Việc chờ xử lý", so: soVN(canhBao.length), ghiChu: canhBao.length ? "xem ở mục bên dưới" : "đã xong hết" },
            ]} />
          ) : <HangChiSo muc={[{ nhan: "Việc chờ xử lý", so: soVN(canhBao.length) }, { nhan: "Lịch hôm nay", so: soVN(lich.length) }]} />}
          {coQuyen(nd, "tongquan.xem") && <p className="mt-3 text-[13.5px]"><Link href="/tong-quan" className="font-medium text-nhan-dam hover:underline">Mở bảng Tổng quan đầy đủ →</Link></p>}
        </section>
      ) : nd.vaiTro === "nhan_vien" ? null : (
      <section aria-label="Hiệu suất của tôi">
        <h2 className="mb-3 text-[15px] font-semibold text-muc">Hiệu suất của tôi · tháng này</h2>
        <HangChiSo muc={[
          { nhan: "Buổi đã thực hiện", so: soVN(soBuoi) }, { nhan: "Khách đã phục vụ", so: soVN(soKhach) },
          { nhan: "Doanh số của tôi", so: tienVN(doanhSo), ghiChu: "theo tỉ lệ chia trên hoá đơn" }, { nhan: "Hoa hồng tạm tính", so: tienVN(hoaHong) },
        ]} />
      </section>
      )}

      {laChu && (
        <section aria-label="Quản trị hệ thống">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Quản trị hệ thống</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUAN_TRI.map((q) => <li key={q.href}><Link href={q.href} className="the-noi the-noi-nang block px-4 pb-4 pt-5"><span className="block text-[14.5px] font-medium text-muc">{q.nhan}</span><span className="mt-1 block text-[12.5px] text-muc-3">{q.phu}</span></Link></li>)}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <MucTrang noi tieuDe={`Việc đang chờ${canhBao.length ? ` (${canhBao.length})` : ""}`}>
          {canhBao.length === 0 ? <p className="text-[14px] text-muc-3">Không có việc nào đang chờ.</p> : (
            <ul className="divide-y divide-vien">{canhBao.map((c) => <li key={c.href + c.nhan}><Link href={c.href} className="flex items-center justify-between gap-3 py-3 text-[14px] hover:text-nhan-dam"><span>{c.nhan}</span><span aria-hidden className="text-muc-3">›</span></Link></li>)}</ul>
          )}
        </MucTrang>
        {(coQuyen(nd, "lich.xem") || lich.length > 0) && (
          <MucTrang noi tieuDe={tieuDeLich} phai={<Link href="/lich-hen" className="font-medium text-nhan-dam hover:underline">Mở lịch</Link>}>
            {lich.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có lịch hẹn nào.</p> : (
              <ul className="divide-y divide-vien">{lich.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]"><span><span className="tabular-nums text-muc-3">{gioVN(l.bat_dau)}</span> · {tenK.get(l.khach_id)}</span>{l.trang_thai === "dang_phuc_vu" ? <NhanTrangThai kieu="tot">Đang phục vụ</NhanTrangThai> : l.trang_thai === "hoan_thanh" ? <NhanTrangThai kieu="tram">Xong</NhanTrangThai> : null}</li>)}</ul>
            )}
          </MucTrang>
        )}
      </div>

      {loiTat.length > 0 && (
        <section aria-label="Lối tắt nhanh">
          <h2 className="mb-3 text-[15px] font-semibold text-muc">Làm nhanh</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {loiTat.map((l) => <li key={l.href}><Link href={l.href} className="the-noi the-noi-nang block px-4 pb-4 pt-5 text-[14px] font-medium text-muc">{l.nhan}</Link></li>)}
          </ul>
        </section>
      )}

      <div className="grid gap-4"><BatThongBao /><CaiUngDung /></div>

      <section aria-label="Tất cả chức năng">
        <h2 className="mb-3 text-[15px] font-semibold text-muc">Tất cả chức năng</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tatCa.map((m) => { const Icon = m.icon; return (
            <li key={m.duong_dan}><Link href={m.duong_dan} className="the-noi the-noi-thap flex h-full items-center gap-3 px-4 pb-3.5 pt-4.5 text-[14px] text-muc"><Icon strokeWidth={1.6} className="h-[22px] w-[22px] shrink-0 text-nhan" /><span className="min-w-0"><span className="block font-medium">{m.ten}</span><span className="mt-0.5 block text-[12px] leading-snug text-muc-3">{m.moTa}</span></span></Link></li>
          ); })}
        </ul>
      </section>
    </div>
  );
}
