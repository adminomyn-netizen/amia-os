import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { BangIn, khoGiayIn, ToInChung } from "@/components/in/ToInChung";

const MA = /^(?:PN|PX|XL|XK|NB|NK)\d{1,20}$/;
const NHAN_LOAI: Record<string, string> = { nhap: "Nhập", tra_ncc: "Trả NCC", hao_hut: "Xuất huỷ", xuat_khan: "Xuất khẩn cấp", xuat_noi_bo: "Sang kho nội bộ", cap_ca: "Xuất tiêu hao", tra_ca: "Trả về", dieu_chinh: "Điều chỉnh" };

/** In phiếu nhập kho / phiếu xuất kho (SalonHero nút In phiếu ở từng phiếu): các dòng sổ kho cùng mã phiếu như Kho › Phiếu nhập / Phiếu xuất gom (mã PN…/PX… từ SalonHero, XL/XK/NB lập ở AMIA, NK<số dòng> cho lần nhập tay).
 *  ?ma=<mã phiếu>&cn=<chi nhánh>. Chỉ đọc. */
export default async function InPhieuKho({ searchParams }: { searchParams: Promise<{ ma?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  const ma = (sp.ma ?? "").trim();
  if (!MA.test(ma)) notFound();
  const cnId = nd.chiNhanhId ?? (sp.cn && /^[0-9a-f-]{36}$/i.test(sp.cn) ? sp.cn : null);
  const db = sb();
  let q = db.from("kho_so_cai").select("id, chi_nhanh_id, san_pham_id, loai, so_luong, don_gia, so_lo, han_dung, ghi_chu, nguoi_id, tao_luc").order("id").limit(500);
  q = ma.startsWith("NK") ? q.eq("id", Number(ma.slice(2))) : q.ilike("ghi_chu", `%${ma}%`);
  if (cnId) q = q.eq("chi_nhanh_id", cnId);
  const { data: tho } = await q;
  const dong = (tho ?? []).filter((d) => ma.startsWith("NK") || new RegExp(`(^|[^0-9A-Z])${ma}([^0-9]|$)`).test(d.ghi_chu ?? ""));
  if (dong.length === 0) notFound();
  const nhap = dong.every((d) => d.loai === "nhap");
  const cn0 = dong[0].chi_nhanh_id;
  const idSp = [...new Set(dong.map((d) => d.san_pham_id))], idNv = [...new Set(dong.map((d) => d.nguoi_id).filter((x): x is string => !!x))];
  const [{ data: sps }, { data: nv }, { data: cn }, giay] = await Promise.all([
    db.from("san_pham").select("id, ten, ma, don_vi, gia_nhap_don_vi").in("id", idSp),
    idNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
    db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", cn0).maybeSingle(),
    khoGiayIn(cn0),
  ]);
  const tenSp = new Map((sps ?? []).map((s) => [s.id, s]));
  const gia = (d: (typeof dong)[number]) => Number(d.don_gia ?? tenSp.get(d.san_pham_id)?.gia_nhap_don_vi ?? 0);
  const tong = dong.reduce((s, d) => s + Math.round(Math.abs(Number(d.so_luong)) * gia(d)), 0);
  const ghiChu = [...new Set(dong.map((d) => d.ghi_chu).filter(Boolean))].slice(0, 3).join(" · ");
  return (
    <ToInChung giay={giay} tieuDe={nhap ? "Phiếu nhập kho" : "Phiếu xuất kho"} chiNhanh={cn} kyTen={nhap ? ["Người giao", "Thủ kho"] : ["Người nhận", "Thủ kho"]}
      phu={<p>Số: {ma} · {ngayGioVN(dong[0].tao_luc)}{idNv.length ? ` · Người lập: ${(nv ?? []).map((n) => n.ho_ten).join(", ")}` : ""}</p>}>
      <BangIn cot={[{ nhan: "Hàng" }, { nhan: "Loại" }, { nhan: "SL", phai: true }, { nhan: "Đơn giá", phai: true }, { nhan: "Thành tiền", phai: true }]}
        dong={dong.map((d) => { const s = tenSp.get(d.san_pham_id); return [<span key="h">{s?.ten ?? ""}{s?.ma ? ` · ${s.ma}` : ""}{d.so_lo || d.han_dung ? <span className="block text-muc-3">{[d.so_lo ? `Lô ${d.so_lo}` : "", d.han_dung ? `HD ${ngayVN(d.han_dung)}` : ""].filter(Boolean).join(" · ")}</span> : null}</span>, NHAN_LOAI[d.loai] ?? d.loai, `${soVN(Math.abs(Number(d.so_luong)))} ${s?.don_vi ?? ""}`, soVN(gia(d)), soVN(Math.round(Math.abs(Number(d.so_luong)) * gia(d)))]; })}
        cuoi={["Tổng", "", "", "", soVN(tong)]} />
      {ghiChu && <p className="mt-2 whitespace-pre-line text-muc-2 [overflow-wrap:anywhere]">Ghi chú: {ghiChu}</p>}
    </ToInChung>
  );
}
