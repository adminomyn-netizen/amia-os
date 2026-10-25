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

const TAB = [{ ma: "doanh-thu", ten: "Doanh thu theo ngày" }, { ma: "nhan-vien", ten: "Theo nhân viên" }, { ma: "dich-vu", ten: "Theo dịch vụ, sản phẩm" }, { ma: "no", ten: "Khách còn nợ" }, { ma: "the", ten: "Thẻ còn dư" }];
const LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ" };
const VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng" };

export default async function TrangBaoCao({ searchParams }: { searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("baocao.xem");
  const sp = await searchParams;
  const tien = coQuyen(nd.vaiTro, "baocao.tien");
  const tabs = TAB.filter((t) => tien || t.ma === "doanh-thu");
  const tab = tabs.some((t) => t.ma === sp.tab) ? sp.tab! : "doanh-thu";
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const db = sb();
  const { data: dsCn } = await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma");
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  const lc = <LocBaoCao goc="/bao-cao" tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />;
  const them = `${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}`;
  let noiDung: React.ReactNode;

  if (tab === "doanh-thu") {
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
        <p className="mt-3 text-[12px] text-muc-3">Doanh thu = tiền hàng − giảm giá cả đơn (không gồm VAT, tip). Thực thu = tiền mặt + chuyển khoản + quẹt thẻ; trừ thẻ tiền không phải tiền vào quỹ vì tiền đã vào lúc bán thẻ.</p>
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
    let q = db.from("v_the_khach").select("id, ma, khach_id, loai, so_buoi_con, so_du_tien, gia_tri_buoi, tinh_trang, han_dung").in("tinh_trang", ["hoat_dong", "sap_het"]);
    if (cn) q = q.eq("chi_nhanh_id", cn);
    const { data } = await q;
    const lan = (data ?? []).filter((t) => t.loai === "lan"), tienThe = (data ?? []).filter((t) => t.loai === "tien");
    const nghiaVu = lan.reduce((s, t) => s + (t.so_buoi_con ?? 0) * Number(t.gia_tri_buoi), 0);
    const duTien = tienThe.reduce((s, t) => s + Number(t.so_du_tien), 0);
    noiDung = (
      <>
        {lc}
        <HangChiSo muc={[{ nhan: "Buổi khách đã trả tiền mà chưa làm", so: soVN(lan.reduce((s, t) => s + (t.so_buoi_con ?? 0), 0)), ghiChu: `${lan.length} thẻ liệu trình` }, { nhan: "Giá trị buổi chưa làm", so: tienVN(nghiaVu), ghiChu: "doanh thu chưa ghi nhận" }, { nhan: "Số dư thẻ tiền", so: tienVN(duTien), ghiChu: `${tienThe.length} thẻ` }]} />
        <p className="mt-4 text-[13px] text-muc-2">Đây là khoản AMIA còn nợ khách (dịch vụ hoặc tiền trong thẻ). Chi tiết từng thẻ ở mục <Link href="/the" className="text-nhan-dam hover:underline">Thẻ liệu trình</Link>.</p>
      </>
    );
  }

  return (
    <>
      <TieuDeTrang tieuDe="Báo cáo" phu={tien ? "Số liệu tính trực tiếp từ sổ hoá đơn, sổ thu tiền, sổ thẻ và sổ kho" : "Báo cáo vận hành"} />
      <Tab muc={tabs} dang={tab} goc="/bao-cao" them={them} />
      {noiDung}
    </>
  );
}
