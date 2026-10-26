import Link from "next/link";
import { layNguoiDungDangNhap } from "@/lib/auth";
import { sb } from "@/lib/db";
import { layCanhBao } from "@/lib/canh-bao";
import { congNgay, gioVN, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { locMenu } from "@/lib/nav";
import { coQuyen, NHAN_VAI_TRO } from "@/lib/quyen";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { CaiUngDung } from "@/components/trang-chu/CaiUngDung";
import { BatThongBao } from "@/components/trang-chu/BatThongBao";

const LOI_TAT = [
  { href: "/lich-hen", nhan: "Đặt lịch hẹn", q: "lich.sua" as const }, { href: "/ban-hang", nhan: "Bán hàng", q: "ban.tao" as const },
  { href: "/khach-hang", nhan: "Tìm khách", q: "khach.xem" as const }, { href: "/hoa-don", nhan: "Thu nợ", q: "no.thu" as const },
  { href: "/the", nhan: "Thẻ liệu trình", q: "the.thuchien" as const }, { href: "/phieu-cap", nhan: "Phiếu cấp vật tư", q: "phieu.xem" as const },
];

/** Trang chủ cá nhân của MỌI nhân viên (kể cả người không có dashboard): việc đang chờ, hiệu suất của tôi tháng này,
 *  lịch hôm nay, lối tắt theo quyền và toàn bộ chức năng. Dashboard điều hành nằm ở mục Tổng quan. */
export default async function TrangChu({ searchParams }: { searchParams: Promise<{ "khong-du-quyen"?: string }> }) {
  const nd = await layNguoiDungDangNhap();
  const sp = await searchParams;
  const db = sb(), homNay = homNayHCM(), dauThang = `${homNay.slice(0, 8)}01`, cn = nd.chiNhanhId;
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();

  const [canhBao, { data: ban }, { data: buoi }, { data: lichToi }] = await Promise.all([
    layCanhBao(nd),
    db.rpc("bc_nhan_vien", { p_tu: dauThang, p_den: homNay, p_cn: (cn ?? undefined) as string }),
    db.from("buoi_thuc_hien").select("khach_id, doanh_thu_buoi").eq("nv_thuc_hien_id", nd.nhanVienId).eq("trang_thai", "da_lam").gte("ngay_lam", dauThang).lte("ngay_lam", homNay).limit(1000),
    db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").eq("nhan_vien_id", nd.nhanVienId).gte("bat_dau", tu).lt("bat_dau", den).not("trang_thai", "in", "(huy,khong_den)").order("bat_dau").limit(8),
  ]);
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
      <div>
        <p className="nhan-muc">{NHAN_VAI_TRO[nd.vaiTro]}{nd.chucDanh ? ` · ${nd.chucDanh}` : ""}</p>
        <h1 className="chu-tieu-de mt-1 text-[28px] leading-[1.15] text-muc lg:text-[34px]">Xin chào, {nd.hoTen}</h1>
        <p className="mt-1.5 text-[14px] text-muc-3">Hôm nay {ngayVN(homNay)}</p>
      </div>
      {sp["khong-du-quyen"] && <p role="alert" className="rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">Vai trò của bạn không mở được trang vừa chọn.</p>}

      <section aria-label="Hiệu suất của tôi">
        <h2 className="mb-3 text-[15px] font-semibold text-muc">Hiệu suất của tôi · tháng này</h2>
        <HangChiSo muc={[
          { nhan: "Buổi đã thực hiện", so: soVN(soBuoi) }, { nhan: "Khách đã phục vụ", so: soVN(soKhach) },
          { nhan: "Doanh số của tôi", so: tienVN(doanhSo), ghiChu: "theo tỉ lệ chia trên hoá đơn" }, { nhan: "Hoa hồng tạm tính", so: tienVN(hoaHong) },
        ]} />
      </section>

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
