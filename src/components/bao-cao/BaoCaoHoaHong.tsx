import Link from "next/link";
import { sb } from "@/lib/db";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { dongDoiChieu, layChiTietNguonGt, layHoaHongGioiThieu, layHoaHongThucThu, NHAN_VAI_HH, NHOM_HH, VAI_HH, type DongNv } from "@/lib/bao-cao-hoa-hong";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { NutHop } from "@/components/ui/BieuMau";
import { luuMucGioiThieu, themNguonGioiThieu } from "@/app/(app)/hoa-hong/actions";

const KIEU_GT = [{ gia_tri: "phan_tram", nhan: "Theo phần trăm" }, { gia_tri: "tien", nhan: "Theo tiền" }, { gia_tri: "diem", nhan: "Theo điểm" }];
const LOAI_NGUON = [{ gia_tri: "khach_cu", nhan: "Khách hàng" }, { gia_tri: "ctv", nhan: "Đối tác" }, { gia_tri: "kol", nhan: "KOL" }, { gia_tri: "khac", nhan: "Khác" }];

/** Hai báo cáo hoa hồng: theo THỰC THU và GIỚI THIỆU (máy chủ tính, trang chỉ hiển thị). Quyền xem số tiền chặn ở trang. */
type Loc = { tu: string; den: string; cn?: string };

const GhiChu = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[12px] leading-relaxed text-muc-3">{children}</p>;
const TieuDeMuc = ({ children, id }: { children: React.ReactNode; id: string }) => <h2 id={id} className="mb-3 mt-8 text-[15px] font-medium text-muc">{children}</h2>;
const BaoChuaCai = ({ children }: { children: React.ReactNode }) => <p role="status" className="mb-4 rounded-nho border border-vien px-4 py-3 text-[13px] leading-relaxed text-muc-2">{children}</p>;

export async function BaoCaoHoaHongThucThu({ loc, vai, gomThe, coChiNhanh, q, the }: { loc: Loc; vai?: string; gomThe: boolean; coChiNhanh: boolean; q?: string; the?: string }) {
  const d = await layHoaHongThucThu(sb(), { ...loc, vai, gomThe, q });
  const dc = dongDoiChieu(d.doiChieu, gomThe);
  const locVai = VAI_HH.some((v) => v === vai);
  const coKhac = d.nhanVien.some((r) => (r.theoNhom.khac?.doanhSo ?? 0) !== 0 || (r.theoNhom.khac?.hoaHong ?? 0) !== 0);
  // Như SalonHero: mỗi nhóm (tư vấn / d.vụ / s.phẩm / bán thẻ) 2 cột thực thu + hoa hồng.
  const cotNhom = NHOM_HH.filter(([k]) => k !== "khac" || coKhac).flatMap(([k, t]) => [
    { nhan: `Thực thu ${t}`, hienThi: (r: DongNv) => (r.theoNhom[k] ? tienVN(r.theoNhom[k]!.doanhSo) : ""), phai: true },
    { nhan: `Hoa hồng ${t}`, hienThi: (r: DongNv) => (r.theoNhom[k] ? tienVN(r.theoNhom[k]!.hoaHong) : ""), phai: true },
  ]);
  return (
    <>
      {d.chuaCaiTiLe && <BaoChuaCai>Chưa cài tỉ lệ hoa hồng nào nên mọi số hoa hồng đang bằng 0; doanh số thực thu vẫn đúng. Cài tỉ lệ ở mục <Link href="/hoa-hong?tab=ti-le" className="text-nhan-dam hover:underline">Hoa hồng, Tỉ lệ hoa hồng</Link>.</BaoChuaCai>}
      <HangChiSo muc={[{ nhan: "Hoa hồng theo thực thu", so: tienVN(d.tong.hoaHong), ghiChu: `${soVN(d.nhanVien.length)} người` }, { nhan: "Doanh số thực thu (cộng các vai)", so: tienVN(d.tong.doanhSo), ghiChu: `trong đó thu nợ cũ ${tienVN(d.tong.doanhSoNoCu)}` },
        { nhan: "Theo hoá đơn lập trong kỳ", so: tienVN(d.doiChieu.theoHoaDon), ghiChu: "để đối chiếu, bên dưới" }, { nhan: "Hoá đơn kỳ này chưa thu", so: tienVN(d.doiChieu.conNoCuoiKy), ghiChu: "hoa hồng chưa được tính" }]} />
      <form method="get" action="/bao-cao" className="mt-6 flex flex-wrap gap-2">
        <input type="hidden" name="tab" value="hh-thuc-thu" /><input type="hidden" name="tu" value={loc.tu} /><input type="hidden" name="den" value={loc.den} />
        {loc.cn && <input type="hidden" name="cn" value={loc.cn} />}{vai && <input type="hidden" name="vai" value={vai} />}{the && <input type="hidden" name="the" value={the} />}
        <input name="q" defaultValue={q ?? ""} placeholder="Tìm nhân viên" aria-label="Tìm nhân viên" className={`${O_NHAP} w-60`} />
        <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
      </form>
      <div className="mt-4">
        <Bang duLieu={d.nhanVien} khoa={(r) => r.id} trong={q ? "Không tìm thấy nhân viên nào." : "Không có khoản thu nào có gán người hưởng trong khoảng này."}
          cot={[{ nhan: "Nhân viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> }, ...cotNhom,
            { nhan: "Tổng thực thu", hienThi: (r) => <span className="block"><span className="tabular-nums">{tienVN(r.doanhSo)}</span>{r.doanhSoNoCu ? <span className="block text-[12px] text-muc-3">nợ cũ {tienVN(r.doanhSoNoCu)}</span> : null}</span>, phai: true },
            { nhan: "Tổng hoa hồng", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true },
            { nhan: "Chấm điểm d.vụ", hienThi: (r) => (r.chamDiem ? <span className="block tabular-nums">{r.chamDiem.diemTb.toLocaleString("vi-VN")} sao<span className="block text-[12px] text-muc-3">{soVN(r.chamDiem.soLuot)} lượt</span></span> : <span className="text-muc-3">—</span>), phai: true },
            { nhan: "", hienThi: (r) => <Link href={`/hoa-hong/chi-tiet?nv=${r.id}&tu=${loc.tu}&den=${loc.den}${loc.cn ? `&cn=${loc.cn}` : ""}`} className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Chi tiết</Link> }]} />
      </div>
      <TieuDeMuc id="hh-theo-vai">Theo vai</TieuDeMuc>
      <Bang duLieu={d.theoVai} khoa={(r) => r.vai} cot={[{ nhan: "Vai", chinh: true, hienThi: (r) => NHAN_VAI_HH[r.vai] }, { nhan: "Doanh số thực thu", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => tienVN(r.hoaHong), phai: true }]} />
      {coChiNhanh && (<><TieuDeMuc id="hh-chi-nhanh">Theo chi nhánh</TieuDeMuc><Bang duLieu={d.chiNhanh} khoa={(r) => r.id} cot={[{ nhan: "Chi nhánh", chinh: true, hienThi: (r) => r.ten }, { nhan: "Doanh số thực thu", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => tienVN(r.hoaHong), phai: true }]} /></>)}
      <details className="mt-8 rounded-nho border border-vien px-4 py-3" open>
        <summary className="cursor-pointer text-[13px] font-medium text-muc-2">Đối chiếu với hoa hồng theo hoá đơn (cùng khoảng ngày, cả ba vai)</summary>
        <div className="mt-3">
          <Bang duLieu={[...dc.rows, { nhan: "Hoa hồng theo thực thu", so: dc.ket, ghiChu: locVai ? "chưa lọc vai: số này là cả ba vai" : "" }]} khoa={(r) => r.nhan}
            cot={[{ nhan: "Khoản", chinh: true, hienThi: (r) => r.nhan }, { nhan: "Số tiền", hienThi: (r) => tienVN(r.so), phai: true }, { nhan: "Giải thích", hienThi: (r) => r.ghiChu }]} />
          {locVai && <GhiChu>Bảng đối chiếu luôn tính đủ ba vai, không theo ô lọc vai.</GhiChu>}
        </div>
      </details>
      <GhiChu>Định nghĩa: hoa hồng chỉ tính trên phần tiền khách ĐÃ TRẢ THẬT, theo NGÀY THU của từng khoản (không theo ngày hoá đơn). Mỗi khoản thu lấy phần (số tiền ÷ tổng phải thu của hoá đơn) nhân doanh số từng dòng, tỉ lệ chia người và tỉ lệ hoa hồng; khoản hoàn tiền trừ đi. Hoá đơn trả đủ trong kỳ thì ra đúng số theo hoá đơn; còn nợ thì chỉ tính phần đã thu, phần thu sau (thu nợ) tính vào kỳ có ngày thu. “Tiền thật” gồm tiền mặt, chuyển khoản, quẹt thẻ; phần trừ thẻ tiền khách nạp trước tách riêng và chỉ cộng khi chọn “Gồm cả phần trừ thẻ tiền” (hoa hồng của tiền nạp thẻ đã tính lúc bán thẻ). Doanh số được cộng theo từng vai: một dòng hàng có thể được tính cho cả người phục vụ, tư vấn và bán nên tổng doanh số lớn hơn số tiền thực thu. Chưa có phí thực hiện theo buổi cho Chuyên viên trị liệu. Tự thiết kế, chưa đối chiếu SalonHero.</GhiChu>
    </>
  );
}

export async function BaoCaoHoaHongGioiThieu({ loc, xemSdt, q, ct, sua }: { loc: Loc; xemSdt: boolean; q?: string; ct?: string; sua: boolean }) {
  const d = await layHoaHongGioiThieu(sb(), { ...loc, xemSdt, q });
  const tatCa = [...d.khach, ...d.sh];
  const chon = ct ? tatCa.find((r) => `${r.nguon}|${r.khoa}` === ct) : undefined;
  const chiTiet = chon ? await layChiTietNguonGt(sb(), { ...loc, nguon: chon.nguon, khoa: chon.khoa }) : [];
  const ganCt = (r: (typeof tatCa)[number]) => `/bao-cao?${new URLSearchParams(Object.entries({ tab: "hh-gioi-thieu", tu: loc.tu, den: loc.den, cn: loc.cn, q, ct: `${r.nguon}|${r.khoa}` }).filter((e): e is [string, string] => !!e[1])).toString()}#gt-chi-tiet`;
  const muc = (r: (typeof tatCa)[number]) => r.nguonId;
  const truongSua = [{ ten: "hh_kieu", nhan: "Mức hoa hồng mặc định", loai: "chon" as const, luaChon: KIEU_GT, batBuoc: true }, { ten: "hh_gia_tri", nhan: "Giá trị", loai: "so" as const, ghiChu: "Phần trăm: % trên doanh số dòng. Theo tiền: số đồng mỗi lượt. Theo điểm: ghi điểm, không tính tiền." }];
  const truongThem = [
    { ten: "ten", nhan: "Tên nguồn giới thiệu", loai: "chu" as const, batBuoc: true, rong: true }, { ten: "ma_gioi_thieu", nhan: "Mã giới thiệu", loai: "chu" as const, ghiChu: "Để trống thì tự sinh." },
    { ten: "dien_thoai", nhan: "Số điện thoại", loai: "chu" as const, ghiChu: "Trùng đúng một khách thì tự ghép với khách đó." }, { ten: "loai", nhan: "Loại", loai: "chon" as const, luaChon: LOAI_NGUON, batBuoc: true },
    ...truongSua, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu" as const, rong: true },
  ];
  const nutSua = (r: (typeof tatCa)[number]) => (sua && muc(r) ? <NutHop kieu="chu" nhan="Sửa" tieuDe={`Mức hoa hồng — ${r.ten}`} truong={truongSua} giaTri={{ hh_kieu: "phan_tram" }} an={{ id: muc(r)! }} action={luuMucGioiThieu} /> : null);
  const cotChung = [
    { nhan: "Loại nguồn", hienThi: (r: (typeof tatCa)[number]) => r.loai }, { nhan: "Tổng DV khách dùng", hienThi: (r: (typeof tatCa)[number]) => soVN(r.soDv), phai: true },
    { nhan: "Hoá đơn", hienThi: (r: (typeof tatCa)[number]) => soVN(r.soHd), phai: true },
  ];
  return (
    <>
      <HangChiSo muc={[{ nhan: "Hoa hồng giới thiệu", so: tienVN(d.tongKhach.hoaHong + d.tongSh.hoaHong), ghiChu: `${soVN(d.khach.length + d.sh.length)} người giới thiệu` }, { nhan: "Khách giới thiệu (trên hoá đơn)", so: tienVN(d.tongKhach.hoaHong), ghiChu: `${soVN(d.tongKhach.soHd)} hoá đơn · doanh số ${tienVN(d.tongKhach.doanhSo)}` },
        { nhan: "Số SalonHero đã tính", so: tienVN(d.tongSh.hoaHong), ghiChu: `${soVN(d.tongSh.soHd)} hoá đơn cũ` }]} />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form method="get" action="/bao-cao" className="flex flex-wrap gap-2">
          <input type="hidden" name="tab" value="hh-gioi-thieu" /><input type="hidden" name="tu" value={loc.tu} /><input type="hidden" name="den" value={loc.den} />{loc.cn && <input type="hidden" name="cn" value={loc.cn} />}
          <input name="q" defaultValue={q ?? ""} placeholder="Tìm tên, mã, số điện thoại nguồn" aria-label="Tìm nguồn giới thiệu" className={`${O_NHAP} w-64 max-w-full`} />
          <button type="submit" className={`${NUT_PHU} h-10 shrink-0`}>Tìm kiếm</button>
        </form>
        {sua && <NutHop kieu="phu" nhan="Thêm nguồn" tieuDe="Thêm nguồn giới thiệu" truong={truongThem} giaTri={{ loai: "khach_cu", hh_kieu: "phan_tram", hh_gia_tri: 0 }} action={themNguonGioiThieu} />}
      </div>
      {d.chuaCaiTiLeGt && d.khach.length > 0 && <div className="mt-4"><BaoChuaCai>Chưa cài tỉ lệ hoa hồng giới thiệu nên phần khách giới thiệu đang bằng 0. Cài ở <Link href="/hoa-hong?tab=ti-le" className="text-nhan-dam hover:underline">Hoa hồng, Tỉ lệ hoa hồng</Link> (vai Giới thiệu).</BaoChuaCai></div>}
      <TieuDeMuc id="gt-khach">Khách giới thiệu ghi trên hoá đơn</TieuDeMuc>
      <Bang duLieu={d.khach} khoa={(r) => r.khoa} trong={q ? "Không tìm thấy nguồn nào." : "Chưa có hoá đơn nào ghi người giới thiệu trong khoảng này."}
        cot={[{ nhan: "Nguồn giới thiệu", chinh: true, hienThi: (r) => (r.khoa.startsWith("gt:") ? <span className="text-muc">{r.ten}</span> : <Link href={`/khach-hang/${r.khoa}`} className="text-muc hover:underline">{r.ten}</Link>) }, { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Điện thoại", hienThi: (r) => r.dt },
          ...cotChung, { nhan: "Doanh số", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true },
          { nhan: "", hienThi: (r) => <span className="flex gap-3"><Link href={ganCt(r)} scroll={false} className="text-[13px] font-medium text-nhan-dam hover:underline">Chi tiết</Link>{nutSua(r)}</span> }]} />
      <TieuDeMuc id="gt-sh">Số SalonHero đã tính (hoá đơn chuyển sang)</TieuDeMuc>
      <Bang duLieu={d.sh} khoa={(r) => r.khoa} trong={q ? "Không tìm thấy nguồn nào." : "Không có hoa hồng giới thiệu cũ trong khoảng này."}
        cot={[{ nhan: "Nguồn giới thiệu", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Điện thoại", hienThi: (r) => r.dt },
          ...cotChung, { nhan: "Doanh số dòng", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng SalonHero", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true },
          { nhan: "", hienThi: (r) => <span className="flex gap-3"><Link href={ganCt(r)} scroll={false} className="text-[13px] font-medium text-nhan-dam hover:underline">Chi tiết</Link>{nutSua(r)}</span> }]} />
      {chon && (
        <>
          <TieuDeMuc id="gt-chi-tiet">Chi tiết nguồn: {chon.ten}{chon.ma ? ` · ${chon.ma}` : ""} ({chon.loai})</TieuDeMuc>
          <Bang duLieu={chiTiet} khoa={(r) => r.id} trong="Không có hoá đơn nào."
            cot={[{ nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Mã hoá đơn", hienThi: (r) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
              { nhan: "Khách hàng", chinh: true, hienThi: (r) => (r.khachId ? <Link href={`/khach-hang/${r.khachId}`} className="text-muc hover:underline">{r.khach}</Link> : r.khach) },
              { nhan: "Số DV", hienThi: (r) => soVN(r.soDv), phai: true }, { nhan: "Doanh số", hienThi: (r) => tienVN(r.doanhSo), phai: true }, { nhan: "Hoa hồng", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.hoaHong)}</span>, phai: true }]} />
        </>
      )}
      <GhiChu>Định nghĩa: tính theo ngày hoá đơn. Phần “khách giới thiệu” = doanh số các dòng của hoá đơn có ghi người giới thiệu × tỉ lệ hoa hồng vai Giới thiệu đang cài (chưa cài thì 0); không tự tính cho khách chỉ có liên kết “được ai giới thiệu” ở hồ sơ. Phần SalonHero giữ đúng số tiền SalonHero đã tính cho từng dòng, không tính lại. Dòng ghi “chưa ghép” là mã người giới thiệu của SalonHero chưa nối được với nhân viên hay khách trong app. Tự thiết kế, chưa đối chiếu SalonHero.</GhiChu>
    </>
  );
}
