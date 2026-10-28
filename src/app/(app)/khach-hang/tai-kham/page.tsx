import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, soVN } from "@/lib/dinh-dang";
import { chiNhanhXem, docHenKeTiep, docNguongCSKH, docTaiKham, soTrongKhoang } from "@/lib/cham-soc-khach";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { datTrangThaiTaiKham, ghiNhacTaiKham, luuKhoangCachGoi } from "../cham-soc/actions";

const NHAN_TT: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  da_goi: { nhan: "Đã gọi", kieu: "cho" }, da_hen: { nhan: "Đã hẹn", kieu: "tot" }, bo_qua: { nhan: "Bỏ qua", kieu: "tram" },
};
const TRUONG_TT: Truong[] = [
  { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "da_goi", nhan: "Đã gọi (chưa chốt lịch)" }, { gia_tri: "da_hen", nhan: "Đã hẹn" }, { gia_tri: "bo_qua", nhan: "Bỏ qua (khách không tái khám lần này)" }] },
  { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" },
];
const BAO_TRUOC = [0, 3, 7, 14, 30], TRE = [30, 60, 90, 180, 365];
const MOI_TRANG = 50;

/** /khach-hang/tai-kham — Nhắc tái khám: khách có thẻ liệu trình còn buổi/còn hạn đã tới (hoặc sắp tới) hẹn mà chưa có lịch hẹn sắp tới. Không gửi SMS/Zalo. */
export default async function NhacTaiKham({ searchParams }: { searchParams: Promise<{ cn?: string; truoc?: string; tre?: string; trang?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const [ng, { cn, ds: dsCn, khoa }] = await Promise.all([docNguongCSKH(), chiNhanhXem(nd, sp.cn)]);
  const truoc = soTrongKhoang(sp.truoc, 0, 60, ng.baoTruoc)!, tre = soTrongKhoang(sp.tre, 1, 730, ng.treToiDa)!;
  const trang = Math.max(1, Math.min(Number(sp.trang) || 1, Math.ceil(2000 / MOI_TRANG)));
  const [dsDau, hen, { data: goi }] = await Promise.all([
    docTaiKham(cn, truoc, tre, undefined, Math.min(trang * MOI_TRANG, 2000)),
    docHenKeTiep(cn, homNayHCM()),
    coQuyen(nd, "danhmuc.sua") ? sb().from("goi_the").select("id, ten, khoang_cach_ngay").eq("loai", "lan").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] }),
  ]);
  const tenCn = new Map(dsCn.map((c) => [c.id, c.ten]));
  const tong = dsDau[0]?.tong ?? 0;
  // Danh sách dài (hàng trăm khách): mỗi trang 50 khách để trang nhẹ, hiện nhanh.
  const ds = dsDau.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
  const gan = (t: number | undefined) => `/khach-hang/tai-kham?${new URLSearchParams(Object.entries({ cn: cn ?? undefined, truoc: sp.truoc, tre: sp.tre, trang: t && t > 1 ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
  const sua = coQuyen(nd, "khach.sua");
  const henTheoKhach = new Map(hen.map((h) => [h.khach_id, h]));
  const dat = (goi ?? []).filter((g) => g.khoang_cach_ngay != null);

  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <div>
        <h1 className="chu-tieu-de text-[22px] text-muc">Nhắc tái khám</h1>
        <p className="text-[13px] text-muc-3">Khách có thẻ liệu trình còn buổi, đã tới ngày hẹn buổi kế tiếp mà chưa đặt lịch. Hẹn tái khám = lần làm gần nhất + khoảng cách giữa 2 buổi của gói (mặc định {ng.macDinhNgay} ngày).</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-52"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Báo trước</span>
          <div className="w-44"><Chon ten="truoc" ariaLabel="Báo trước" giaTriMacDinh={String(truoc)} luaChon={[...new Set([...BAO_TRUOC, truoc])].sort((a, b) => a - b).map((n) => ({ gia_tri: String(n), nhan: n === 0 ? "Đã đến hẹn" : `Trước ${n} ngày` }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Trễ hẹn tối đa</span>
          <div className="w-36"><Chon ten="tre" ariaLabel="Trễ hẹn tối đa" giaTriMacDinh={String(tre)} luaChon={[...new Set([...TRE, tre])].sort((a, b) => a - b).map((n) => ({ gia_tri: String(n), nhan: `${n} ngày` }))} /></div></label>
        <button type="submit" className={NUT_PHU}>Lọc</button>
        {coQuyen(nd, "danhmuc.sua") && (
          <NutHop kieu="phu" nhan="Khoảng cách giữa 2 buổi" tieuDe="Khoảng cách giữa 2 buổi (theo gói)" moTa={`Để trống = dùng mặc định chung (${ng.macDinhNgay} ngày). Chỉ áp cho thẻ liệu trình (thẻ lần).`}
            truong={[{ ten: "goi_id", nhan: "Gói thẻ", loai: "chon", batBuoc: true, rong: true, luaChon: (goi ?? []).map((g) => ({ gia_tri: g.id, nhan: `${g.ten}${g.khoang_cach_ngay ? ` — ${g.khoang_cach_ngay} ngày` : ""}` })) }, { ten: "ngay", nhan: "Khoảng cách (ngày, 1–365)", loai: "so" }]} action={luuKhoangCachGoi} />
        )}
      </form>

      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> khách đến hẹn tái khám{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}</p>

      {hen.length > 0 && (
        <section>
          <h2 className="mb-1 text-[15px] font-semibold text-muc">Đã hẹn buổi kế tiếp ({hen.length})</h2>
          <p className="mb-2 text-[13px] text-muc-3">Ghi lúc trừ buổi thẻ hoặc ở hồ sơ thẻ; đã tự tạo nhắc trong hồ sơ khách. Hiện các hẹn từ 14 ngày trước trở đi.</p>
          <Bang duLieu={hen} khoa={(r) => r.id} cot={[
            { chinh: true, nhan: "Khách hàng", hienThi: (r) => <div><Link href={`/khach-hang/${r.khach_id}`} className="font-medium text-muc hover:underline">{r.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{r.dien_thoai} · {r.ma}</div></div> },
            { nhan: "Đã hẹn buổi kế tiếp ngày", hienThi: (r) => <div className="text-[13px] tabular-nums">{ngayVN(r.ngay_hen)}<div className="text-muc-3">{r.noi_dung ?? ""}</div></div> },
            { nhan: "Thẻ", hienThi: (r) => <Link href={`/the/${r.the_id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">{r.ma_the}</Link> },
            { nhan: "Lịch hẹn", hienThi: (r) => (r.da_co_lich ? <NhanTrangThai kieu="tot">Đã có lịch sắp tới</NhanTrangThai> : <NhanTrangThai kieu="cho">Chưa đặt lịch</NhanTrangThai>) },
            { nhan: "", hienThi: (r) => (coQuyen(nd, "lich.sua") && !r.da_co_lich ? <Link href={`/lich-hen?khach=${r.khach_id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Đặt lịch</Link> : null) },
          ]} />
        </section>
      )}

      <Bang duLieu={ds} khoa={(r) => r.khach_id} trong="Không có khách nào cần nhắc tái khám với điều kiện này."
        cot={[
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => <div><Link href={`/khach-hang/${r.khach_id}`} className="font-medium text-muc hover:underline">{r.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{r.dien_thoai} · {r.ma}</div></div> },
          { nhan: "Thẻ liệu trình", hienThi: (r) => <div className="text-[13px]"><Link href={`/the/${r.the_id}`} className="font-medium text-nhan-dam hover:underline">{r.ma_the}</Link> · {r.ten_goi}{r.so_the > 1 && <span className="nhan-nho ml-1">+{r.so_the - 1} thẻ</span>}<div className="text-muc-3">{r.khong_gioi_han ? "Không giới hạn buổi" : `Còn ${r.so_buoi_con} buổi`}{r.han_dung && r.han_dung >= "2000-01-01" ? ` · hạn ${ngayVN(r.han_dung)}` : ""}</div></div> },
          { nhan: "Làm gần nhất", hienThi: (r) => <div className="text-[13px] tabular-nums">{ngayVN(r.lan_cuoi)}<div className="text-muc-3">cách {r.khoang_cach} ngày/buổi</div></div> },
          { nhan: "Hẹn tái khám", hienThi: (r) => <div className="text-[13px] tabular-nums">{ngayVN(r.den_han)}<div className={r.so_ngay_tre > 0 ? "text-loi" : "text-muc-3"}>{r.so_ngay_tre > 0 ? `Trễ ${r.so_ngay_tre} ngày` : r.so_ngay_tre === 0 ? "Hôm nay" : `Còn ${-r.so_ngay_tre} ngày`}</div></div> },
          { nhan: "Trạng thái", hienThi: (r) => <div className="text-[13px]">{r.trang_thai ? <NhanTrangThai kieu={NHAN_TT[r.trang_thai].kieu}>{NHAN_TT[r.trang_thai].nhan}</NhanTrangThai> : <span className="text-muc-3">Chưa xử lý</span>}{r.nhac_id && <div className="text-muc-3">Đã ghi nhắc</div>}{henTheoKhach.get(r.khach_id) && <div className="text-muc-3">Đã hẹn buổi kế tiếp ngày {ngayVN(henTheoKhach.get(r.khach_id)!.ngay_hen)}</div>}{r.ghi_chu && <div className="mt-0.5 line-clamp-2 text-muc-3">{r.ghi_chu}</div>}</div> },
          { nhan: "", hienThi: (r) => (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {coQuyen(nd, "lich.sua") && <Link href={`/lich-hen?khach=${r.khach_id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Đặt lịch</Link>}
              {sua && <NutHop kieu="chu" nhan="Cập nhật" tieuDe={`Tái khám: ${r.ho_ten}`} truong={TRUONG_TT} an={{ khach_id: r.khach_id, lan_cuoi: r.lan_cuoi }} giaTri={{ trang_thai: r.trang_thai ?? "da_goi", ghi_chu: r.ghi_chu ?? "" }} action={datTrangThaiTaiKham} />}
              {sua && !r.nhac_id && <NutHop kieu="chu" nhan="Ghi nhắc" tieuDe="Ghi nhắc tái khám" xacNhan={`Ghi nhắc tái khám cho ${r.ho_ten} vào mục nhắc chăm sóc của khách? (Không gửi tin nhắn cho khách.)`} nhanLuu="Ghi nhắc" an={{ khach_id: r.khach_id, lan_cuoi: r.lan_cuoi, den_han: r.den_han, ten_goi: r.ten_goi, chi_nhanh_id: r.chi_nhanh_id }} action={ghiNhacTaiKham} />}
            </span>) },
        ]} />
      <ThanhTrang trang={trang} tong={Math.min(tong, 2000)} moi={MOI_TRANG} gan={gan} don="khách" />

      {dat.length > 0 && (
        <details className="rounded-the border border-vien bg-giay-sang px-4 py-3 text-[13px]">
          <summary className="cursor-pointer font-medium text-muc-2">Gói đã đặt khoảng cách riêng ({dat.length})</summary>
          <ul className="mt-2 columns-1 gap-6 sm:columns-2">{dat.map((g) => <li key={g.id} className="flex justify-between gap-3 border-b border-vien py-1"><span>{g.ten}</span><span className="tabular-nums text-muc-3">{g.khoang_cach_ngay} ngày</span></li>)}</ul>
        </details>
      )}
    </div>
  );
}
