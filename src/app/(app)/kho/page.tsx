import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import Link from "next/link";
import { kiemKe, nhapKho } from "./actions";

const TAB = [{ ma: "ton", ten: "Tồn kho" }, { ma: "so", ten: "Sổ kho" }];
const NHAN_LOAI: Record<string, string> = { nhap: "Nhập kho", xuat_ban: "Bán lẻ", cap_ca: "Cấp theo phiếu", tra_ca: "Trả lại kho", kiem_ke: "Kiểm kê", dieu_chinh: "Điều chỉnh", chuyen_di: "Chuyển đi", chuyen_den: "Chuyển đến", hao_hut: "Hao hụt" };

export default async function TrangKho({ searchParams }: { searchParams: Promise<{ tab?: string; cn?: string; thieu?: string }> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  const tab = sp.tab === "so" ? "so" : "ton";
  const db = sb();
  const { data: dsCn } = await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma");
  const cn = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  const { data: spAll } = await db.from("san_pham").select("id, ma, ten, don_vi, nhom_cap, ton_toi_thieu, gia_nhap_don_vi, theo_doi_kho").eq("hoat_dong", true).eq("theo_doi_kho", true).order("ten");
  const sua = coQuyen(nd.vaiTro, "kho.nhap");
  const spLC = (spAll ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` }));
  let noiDung: React.ReactNode;
  if (tab === "ton") {
    const { data: ton } = await db.from("v_ton_kho").select("*").eq("chi_nhanh_id", cn);
    const tonMap = new Map((ton ?? []).map((t) => [t.san_pham_id, Number(t.ton)]));
    let ds = (spAll ?? []).map((s) => ({ ...s, ton: tonMap.get(s.id) ?? 0 }));
    if (sp.thieu === "1") ds = ds.filter((s) => s.ton < Number(s.ton_toi_thieu));
    noiDung = (
      <>
        <div className="mb-4"><Link href={`/kho?cn=${cn}${sp.thieu === "1" ? "" : "&thieu=1"}`} className="text-[14px] font-medium text-nhan-dam hover:underline">{sp.thieu === "1" ? "Hiện tất cả" : "Chỉ hiện hàng dưới mức tối thiểu"}</Link></div>
        <Bang duLieu={ds} khoa={(r) => r.id} trong="Không có mặt hàng nào."
          cot={[
            { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Vật tư / sản phẩm", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Nhóm cấp", hienThi: (r) => r.nhom_cap ?? "" },
            { nhan: "Tồn", hienThi: (r) => <span className={r.ton < Number(r.ton_toi_thieu) ? "font-medium text-canh-bao" : ""}>{soVN(r.ton)} {r.don_vi}</span>, phai: true },
            { nhan: "Tối thiểu", hienThi: (r) => (Number(r.ton_toi_thieu) > 0 ? soVN(r.ton_toi_thieu) : ""), phai: true },
            { nhan: "Giá trị tồn", hienThi: (r) => (r.gia_nhap_don_vi == null ? "chưa có giá" : tienVN(Math.round(r.ton * Number(r.gia_nhap_don_vi)))), phai: true },
            { nhan: "", hienThi: (r) => (r.ton < Number(r.ton_toi_thieu) ? <NhanTrangThai kieu="cho">Sắp hết</NhanTrangThai> : null) },
            ...(sua ? [{ nhan: "", hienThi: (r: (typeof ds)[number]) => <NutHop kieu="chu" nhan="Kiểm kê" tieuDe={`Kiểm kê: ${r.ten}`} moTa={`Sổ đang ghi ${soVN(r.ton)} ${r.don_vi}. Nhập số đếm thực tế, hệ thống ghi phần chênh lệch.`} an={{ chi_nhanh_id: cn, san_pham_id: r.id }} truong={[{ ten: "so_thuc_te", nhan: `Số thực tế (${r.don_vi})`, loai: "so", batBuoc: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }]} action={kiemKe} /> }] : []),
          ]} />
      </>
    );
  } else {
    const { data: so } = await db.from("kho_so_cai").select("*").eq("chi_nhanh_id", cn).order("id", { ascending: false }).limit(150);
    const tenSp = new Map((spAll ?? []).map((s) => [s.id, s]));
    const { data: nv } = await db.from("nhan_vien").select("id, ho_ten");
    const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    noiDung = (
      <Bang duLieu={so ?? []} khoa={(r) => String(r.id)} trong="Sổ kho còn trống." cot={[
        { nhan: "Lúc", hienThi: (r) => ngayGioVN(r.tao_luc) }, { nhan: "Việc", hienThi: (r) => NHAN_LOAI[r.loai] ?? r.loai }, { nhan: "Vật tư", hienThi: (r) => tenSp.get(r.san_pham_id)?.ten ?? "" },
        { nhan: "Lô / hạn", hienThi: (r) => [r.so_lo, r.han_dung ? ngayVN(r.han_dung) : ""].filter(Boolean).join(" · ") }, { nhan: "Người ghi", hienThi: (r) => tenNv.get(r.nguoi_id ?? "") ?? "" }, { nhan: "Ghi chú", hienThi: (r) => r.ghi_chu ?? "" },
        { nhan: "Số lượng", hienThi: (r) => <span className={Number(r.so_luong) < 0 ? "text-loi" : "text-nhan-dam"}>{Number(r.so_luong) > 0 ? "+" : ""}{soVN(r.so_luong)}</span>, phai: true },
      ]} />
    );
  }
  return (
    <>
      <TieuDeTrang tieuDe="Kho" phu="Tồn kho là tổng sổ kho (nhập, cấp theo phiếu, trả, bán lẻ, kiểm kê). Không sửa số trực tiếp.">
        {sua && <NutHop nhan="Nhập kho" tieuDe="Nhập kho" rong an={{ chi_nhanh_id: cn }} truong={[
          { ten: "san_pham_id", nhan: "Vật tư / sản phẩm", loai: "chon", batBuoc: true, rong: true, luaChon: spLC }, { ten: "so_luong", nhan: "Số lượng (theo đơn vị DÙNG)", loai: "so", batBuoc: true },
          { ten: "tong_tien", nhan: "Tổng tiền nhập (để tính giá vốn, không bắt buộc)", loai: "tien" }, { ten: "so_lo", nhan: "Số lô", loai: "chu" }, { ten: "han_dung", nhan: "Hạn dùng", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú (nhà cung cấp, số phiếu...)", loai: "chu", rong: true }]} action={nhapKho} />}
      </TieuDeTrang>
      {!nd.chiNhanhId && (dsCn?.length ?? 0) > 1 && <div className="mb-4 flex gap-2 text-[14px]">{(dsCn ?? []).map((c) => <Link key={c.id} href={`/kho?tab=${tab}&cn=${c.id}`} className={`rounded-nho px-3 py-2 ${c.id === cn ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}</div>}
      <Tab muc={TAB} dang={tab} goc="/kho" them={`&cn=${cn}`} />
      {noiDung}
    </>
  );
}
