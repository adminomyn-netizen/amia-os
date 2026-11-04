import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { taoDonMua } from "../actions";

export const TT_DON: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  nhap: { ten: "Nháp", kieu: "tram" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" },
  dang_nhan: { ten: "Đang nhận hàng", kieu: "cho" }, da_nhan: { ten: "Đã nhận đủ", kieu: "tot" }, huy: { ten: "Đã huỷ", kieu: "loi" },
};
const TAB = [{ ma: "tat-ca", ten: "Tất cả" }, ...Object.entries(TT_DON).map(([ma, v]) => ({ ma, ten: v.ten }))];

export default async function TrangMuaHang({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "tat-ca";
  const db = sb();
  let q = db.from("don_mua").select("*").order("tao_luc", { ascending: false }).limit(300);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (tab !== "tat-ca") q = q.eq("trang_thai", tab);
  const [{ data: don }, { data: ncc }, { data: cn }] = await Promise.all([q, db.from("nha_cung_cap").select("id, ten, hoat_dong").order("ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma")]);
  const ids = (don ?? []).map((d) => d.id);
  const { data: dong } = ids.length ? await db.from("don_mua_dong").select("don_mua_id, so_luong, don_gia").in("don_mua_id", ids) : { data: [] };
  const tong = new Map<string, number>();
  for (const d of dong ?? []) tong.set(d.don_mua_id, (tong.get(d.don_mua_id) ?? 0) + Math.round(Number(d.so_luong) * Number(d.don_gia)));
  const tenNcc = new Map((ncc ?? []).map((n) => [n.id, n.ten]));
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const truong: Truong[] = [
    { ten: "ncc_id", nhan: "Nhà cung cấp", loai: "chon", luaChon: (ncc ?? []).filter((n) => n.hoat_dong).map((n) => ({ gia_tri: n.id, nhan: n.ten })), batBuoc: true },
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Nhận hàng tại chi nhánh", loai: "chon" as const, luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })), batBuoc: true }]),
    { ten: "ngay_du_kien", nhan: "Ngày dự kiến nhận", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho-mua-sam", nhan: "Kho & Mua sắm" }} tieuDe="Mua hàng" phu="Lập đơn mua → gửi duyệt → nhận hàng vào kho. Nhận hàng tự ghi sổ kho và công nợ nhà cung cấp.">
        {coQuyen(nd, "mua.tao") && <NutHop nhan="Tạo đơn mua" tieuDe="Tạo đơn mua" moTa="Tạo xong, bấm vào mã đơn để thêm hàng." truong={truong} action={taoDonMua} giaTri={{}} />}
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc="/kho-mua-sam/mua-hang" />
      <Bang duLieu={don ?? []} khoa={(r) => r.id} trong="Chưa có đơn mua nào."
        cot={[
          { nhan: "Mã đơn", chinh: true, hienThi: (r) => <Link href={`/kho-mua-sam/mua-hang/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> },
          { nhan: "Nhà cung cấp", hienThi: (r) => tenNcc.get(r.ncc_id) ?? "" }, { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id) ?? "" },
          { nhan: "Ngày đặt", hienThi: (r) => ngayVN(r.ngay_dat) }, { nhan: "Giá trị", phai: true, hienThi: (r) => tienVN(tong.get(r.id) ?? 0) },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_DON[r.trang_thai].kieu}>{TT_DON[r.trang_thai].ten}</NhanTrangThai> },
        ]} />
    </div>
  );
}
