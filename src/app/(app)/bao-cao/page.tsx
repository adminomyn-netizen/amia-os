import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { LocHoaHong } from "@/components/bao-cao/LocHoaHong";
import { BaoCaoHoaHongGioiThieu, BaoCaoHoaHongThucThu } from "@/components/bao-cao/BaoCaoHoaHong";
import { LUA_CHON_THE, LUA_CHON_VAI } from "@/lib/bao-cao-hoa-hong";
import { BaoCaoDatLich, BaoCaoDungDichVu, BaoCaoThuNgan } from "@/components/bao-cao/BaoCaoMoi";
import { chonNhom, NHOM_KY } from "@/lib/bao-cao-du-lieu";

const TAB = [{ ma: "doanh-thu", ten: "Doanh thu theo ngày" }, { ma: "thu-ngan", ten: "Theo thu ngân" }, { ma: "nhan-vien", ten: "Theo nhân viên" }, { ma: "dich-vu", ten: "Theo dịch vụ, sản phẩm" }, { ma: "dung-dich-vu", ten: "Dùng dịch vụ" }, { ma: "dat-lich", ten: "Đặt lịch" }, { ma: "no", ten: "Khách còn nợ" }, { ma: "the", ten: "Thẻ còn dư" }, { ma: "hh-thuc-thu", ten: "Hoa hồng thực thu" }, { ma: "hh-gioi-thieu", ten: "Hoa hồng giới thiệu" }];
/** Tab không có số tiền: chỉ cần quyền xem báo cáo. Các tab còn lại cần thêm quyền xem số tiền. */
const TAB_KHONG_TIEN = new Set(["doanh-thu", "dat-lich"]);
/** Tab có lựa chọn gom số liệu theo kỳ, và cách gom mặc định. */
const TAB_NHOM: Record<string, "tong" | "thang"> = { "thu-ngan": "tong", "dat-lich": "thang", "dung-dich-vu": "thang" };
const LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ" };
const VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng" };

export default async function TrangBaoCao({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string; nhom?: string; vai?: string; the?: string }> }) {
  const nd = await yeuCauQuyen("baocao.xem");
  const sp = await searchParams;
  const tien = coQuyen(nd, "baocao.tien");
  const tabs = TAB.filter((t) => tien || TAB_KHONG_TIEN.has(t.ma));
  const tab = tabs.some((t) => t.ma === sp.tab) ? sp.tab! : "doanh-thu";
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const db = sb();
  const { data: dsCn } = await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma");
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  const coNhom = tab in TAB_NHOM;
  const { nhom, doiTuNgay } = chonNhom(sp.nhom, tu, den, TAB_NHOM[tab] ?? "tong");
  const cacNhom = tab === "thu-ngan" ? NHOM_KY : NHOM_KY.filter((n) => n.gia_tri !== "tong");
  const lc = <LocBaoCao goc="/bao-cao" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} nhom={coNhom ? nhom : undefined} cacNhom={coNhom ? cacNhom : undefined} />;
  const them = `${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}`;
  const loc = { tu, den, cn, nhom, doiTuNgay };
  const coChiNhanh = !cn && (dsCn ?? []).length > 1;
  const xuat = `/api/xuat/bao-cao?tab=${tab}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}${coNhom ? `&nhom=${nhom}` : ""}${tab === "hh-thuc-thu" ? `${sp.vai ? `&vai=${sp.vai}` : ""}${sp.the === "1" ? "&the=1" : ""}` : ""}`;
  let noiDung: React.ReactNode;

  const dsChiNhanh = nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  if (tab === "hh-thuc-thu") {
    noiDung = <><LocHoaHong goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} vai={sp.vai} cacVai={LUA_CHON_VAI} the={sp.the} cacThe={LUA_CHON_THE} /><BaoCaoHoaHongThucThu loc={{ tu, den, cn }} vai={sp.vai} gomThe={sp.the === "1"} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "hh-gioi-thieu") {
    noiDung = <><LocHoaHong goc="/bao-cao" tu={tu} den={den} chiNhanh={dsChiNhanh} cn={sp.cn} /><BaoCaoHoaHongGioiThieu loc={{ tu, den, cn }} xemSdt={coQuyen(nd, "khach.xem")} /></>;
  } else if (tab === "thu-ngan") {
    noiDung = <>{lc}<BaoCaoThuNgan loc={loc} /></>;
  } else if (tab === "dat-lich") {
    noiDung = <>{lc}<BaoCaoDatLich loc={loc} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "dung-dich-vu") {
    noiDung = <>{lc}<BaoCaoDungDichVu loc={loc} coChiNhanh={coChiNhanh} /></>;
  } else if (tab === "doanh-thu") {
    const { data } = await db.rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: cn as string });
    const ds = data ?? [];
    const cong = (k: "so_don" | "doanh_thu" | "thu_don_moi" | "thu_no_cu" | "thuc_thu" | "tien_mat" | "chuyen_khoan" | "quet_the" | "tru_the_tien" | "no_moi" | "so_buoi" | "doanh_thu_buoi") => ds.reduce((s, r) => s + Number(r[k]), 0);
    noiDung = (
      <>
        {lc}
        <HangChiSo muc={[{ nhan: "Doanh thu bán hàng", so: tienVN(cong("doanh_thu")), ghiChu: `${cong("so_don")} đơn` }, { nhan: "Thực thu", so: tienVN(cong("thuc_thu")), ghiChu: `thu nợ cũ ${tienVN(cong("thu_no_cu"))}` }, { nhan: "Nợ phát sinh", so: tienVN(cong("no_moi")) }, { nhan: "Doanh thu buổi đã làm", so: tienVN(cong("doanh_thu_buoi")), ghiChu: `${cong("so_buoi")} buổi` }]} />
        <div className="mt-6">
          <Bang duLieu={ds.filter((r) => r.so_don > 0 || Number(r.thuc_thu) !== 0 || r.so_buoi > 0 || Number(r.tru_the_tien) !== 0)} khoa={(r) => r.ngay} trong="Không có phát sinh trong khoảng này."
            cot={[
              { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Đơn mới", hienThi: (r) => r.so_don, phai: true }, { nhan: "Doanh thu", hienThi: (r) => tienVN(r.doanh_thu), phai: true },
              { nhan: "Thu đơn mới", hienThi: (r) => tienVN(r.thu_don_moi), phai: true }, { nhan: "Thu nợ cũ", hienThi: (r) => tienVN(r.thu_no_cu), phai: true }, { nhan: "Thực thu", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.thuc_thu)}</span>, phai: true },
              { nhan: "Tiền mặt", hienThi: (r) => tienVN(r.tien_mat), phai: true }, { nhan: "Chuyển khoản", hienThi: (r) => tienVN(r.chuyen_khoan), phai: true }, { nhan: "Quẹt thẻ", hienThi: (r) => tienVN(r.quet_the), phai: true },
              { nhan: "Trừ thẻ tiền", hienThi: (r) => tienVN(r.tru_the_tien), phai: true }, { nhan: "Nợ mới", hienThi: (r) => tienVN(r.no_moi), phai: true }, { nhan: "Buổi làm", hienThi: (r) => r.so_buoi, phai: true },
            ]} />
        </div>
        <p className="mt-3 text-[12px] text-muc-3">Doanh thu = tổng đơn hoàn thành như SalonHero (tiền hàng − giảm giá + VAT + phụ phí + tip) trừ phần thanh toán bằng thẻ tiền. Thực thu = tiền mặt + chuyển khoản + quẹt thẻ; trừ thẻ tiền không phải tiền vào quỹ vì tiền đã vào lúc bán thẻ.</p>
      </>
    );
  } else if (tab === "nhan-vien") {
    const [{ data }, { data: nv }] = await Promise.all([db.rpc("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: cn as string }), db.from("nhan_vien").select("id, ho_ten, vai_tro")]);
    const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    const theo = new Map<string, Record<string, { doanh_so: number; hoa_hong: number; so_dong: number }>>();
    for (const r of data ?? []) { const m = theo.get(r.nhan_vien_id) ?? {}; m[r.vai] = { doanh_so: Number(r.doanh_so), hoa_hong: Number(r.hoa_hong), so_dong: r.so_dong }; theo.set(r.nhan_vien_id, m); }
    const dong = [...theo.entries()].map(([id, m]) => ({ id, m, tong: Object.values(m).reduce((s, x) => s + x.doanh_so, 0), hh: Object.values(m).reduce((s, x) => s + x.hoa_hong, 0) })).sort((a, b) => b.tong - a.tong);
    noiDung = (
      <>
        {lc}
        <Bang duLieu={dong} khoa={(r) => r.id} trong="Chưa có đơn nào có gán người hưởng trong khoảng này."
          cot={[
            { nhan: "Nhân viên", hienThi: (r) => <span className="text-muc">{tenNv.get(r.id)}</span> },
            ...(["phuc_vu", "tu_van", "ban"] as const).flatMap((v) => [{ nhan: `${VAI[v]} (lượt)`, hienThi: (r: (typeof dong)[number]) => r.m[v]?.so_dong ?? "", phai: true }, { nhan: `${VAI[v]} (doanh số)`, hienThi: (r: (typeof dong)[number]) => (r.m[v] ? tienVN(r.m[v].doanh_so) : ""), phai: true }]),
            { nhan: "Tổng doanh số", hienThi: (r) => <span className="font-medium text-muc">{tienVN(r.tong)}</span>, phai: true }, { nhan: "Hoa hồng tạm tính", hienThi: (r) => tienVN(r.hh), phai: true },
          ]} />
        <p className="mt-3 text-[12px] text-muc-3">Doanh số mỗi dòng = thành tiền × tỉ lệ chia của người đó, đã chia lại phần giảm giá cả đơn. Hoa hồng nhân theo tỉ lệ cài ở mục <Link href="/hoa-hong" className="text-nhan-dam hover:underline">Hoa hồng</Link>.</p>
      </>
    );
  } else if (tab === "dich-vu") {
    const { data } = await db.rpc("bc_muc_ban", { p_tu: tu, p_den: den, p_cn: cn as string });
    noiDung = (
      <>
        {lc}
        <Bang duLieu={data ?? []} khoa={(r) => `${r.loai}-${r.muc_id}`} trong="Chưa bán gì trong khoảng này."
          cot={[{ nhan: "Loại", hienThi: (r) => LOAI[r.loai] }, { nhan: "Tên", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Số lượng", hienThi: (r) => soVN(r.so_luong), phai: true }, { nhan: "Doanh số", hienThi: (r) => tienVN(r.doanh_so), phai: true }]} />
      </>
    );
  } else if (tab === "no") {
    let q = db.from("hoa_don").select("id, ma, ngay_hd, tong_phai_thu, da_thu, con_no, khach_id").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("ngay_hd");
    if (cn) q = q.eq("chi_nhanh_id", cn);
    const { data } = await q;
    const ids = [...new Set((data ?? []).map((d) => d.khach_id).filter(Boolean))] as string[];
    const { data: ks } = ids.length ? await db.from("khach_hang").select("id, ho_ten, dien_thoai").in("id", ids) : { data: [] };
    const tenK = new Map((ks ?? []).map((k) => [k.id, k]));
    noiDung = (
      <>
        {lc}
        <HangChiSo muc={[{ nhan: "Tổng nợ", so: tienVN((data ?? []).reduce((s, r) => s + Number(r.con_no), 0)) }, { nhan: "Số hoá đơn nợ", so: String((data ?? []).length) }]} />
        <div className="mt-6"><Bang duLieu={data ?? []} khoa={(r) => r.id} trong="Không có khách nào còn nợ."
          cot={[{ nhan: "Khách", hienThi: (r) => <Link href={`/khach-hang/${r.khach_id}`} className="text-muc hover:underline">{tenK.get(r.khach_id ?? "")?.ho_ten}</Link> }, { nhan: "Điện thoại", hienThi: (r) => tenK.get(r.khach_id ?? "")?.dien_thoai ?? "" },
            { nhan: "Hoá đơn", hienThi: (r) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> }, { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_hd) },
            { nhan: "Tổng", hienThi: (r) => tienVN(r.tong_phai_thu), phai: true }, { nhan: "Đã thu", hienThi: (r) => tienVN(r.da_thu), phai: true }, { nhan: "Còn nợ", hienThi: (r) => <span className="font-medium text-canh-bao">{tienVN(r.con_no)}</span>, phai: true }]} /></div>
      </>
    );
  } else {
    const { data: tong } = await db.rpc("bc_the_con_du", { p_cn: (cn ?? undefined) as string });
    const t = tong?.[0] ?? { so_the_lan: 0, so_buoi: 0, gia_tri_buoi: 0, so_the_khong_gioi_han: 0, so_the_tien: 0, du_tien: 0 };
    noiDung = (
      <>
        {lc}
        <HangChiSo muc={[{ nhan: "Buổi khách đã trả tiền mà chưa làm", so: soVN(Number(t.so_buoi)), ghiChu: `${soVN(t.so_the_lan)} thẻ liệu trình${t.so_the_khong_gioi_han ? ` (chưa kể ${soVN(t.so_the_khong_gioi_han)} thẻ không giới hạn buổi)` : ""}` }, { nhan: "Giá trị buổi chưa làm", so: tienVN(Number(t.gia_tri_buoi)), ghiChu: "doanh thu chưa ghi nhận" }, { nhan: "Số dư thẻ tiền", so: tienVN(Number(t.du_tien)), ghiChu: `${soVN(t.so_the_tien)} thẻ` }]} />
        <p className="mt-4 text-[13px] text-muc-2">Đây là khoản AMIA còn nợ khách (dịch vụ hoặc tiền trong thẻ). Chi tiết từng thẻ ở mục <Link href="/the" className="text-nhan-dam hover:underline">Thẻ liệu trình</Link>.</p>
      </>
    );
  }

  return (
    <>
      <TieuDeTrang tieuDe="Báo cáo" phu={tien ? "Số liệu tính trực tiếp từ sổ hoá đơn, sổ thu tiền, sổ thẻ và sổ kho" : "Báo cáo vận hành"}>
        {(tien || tab === "dat-lich") && <a href={xuat} download aria-label={`Xuất Excel báo cáo ${tabs.find((t) => t.ma === tab)?.ten ?? ""} theo bộ lọc đang chọn`} className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Xuất Excel</a>}
      </TieuDeTrang>
      <Tab muc={tabs} dang={tab} goc="/bao-cao" them={them} />
      {noiDung}
    </>
  );
}
