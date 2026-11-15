import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN } from "@/lib/dinh-dang";
import { TT_CHUYEN } from "@/lib/kho";
import { khoGiayIn, ToInChung } from "@/components/in/ToInChung";

/** Phiếu chuyển kho nội bộ (SalonHero mẫu in phiếu chuyển kho): kho đi → kho đến, hàng, số gửi / số nhận, lô, hạn dùng, chữ ký 2 bên. Chỉ đọc. */
export default async function InChuyenKho({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = sb();
  const { data: p } = await db.from("phieu_chuyen_kho").select("*").eq("id", id).maybeSingle();
  if (!p || (nd.chiNhanhId && nd.chiNhanhId !== p.tu_chi_nhanh_id && nd.chiNhanhId !== p.den_chi_nhanh_id)) notFound();
  const idNv = [p.nguoi_gui_id, p.nguoi_nhan_id].filter((x): x is string => !!x);
  const [{ data: cn }, { data: sp }, { data: nv }, giay] = await Promise.all([
    db.from("chi_nhanh").select("id, ten, dia_chi, dien_thoai").in("id", [p.tu_chi_nhanh_id, p.den_chi_nhanh_id]),
    db.from("san_pham").select("ten, ma, don_vi").eq("id", p.san_pham_id).maybeSingle(),
    db.from("nhan_vien").select("id, ho_ten").in("id", idNv),
    khoGiayIn(p.tu_chi_nhanh_id),
  ]);
  const tenCn = (x: string) => (cn ?? []).find((c) => c.id === x)?.ten ?? "";
  const tenNv = (x: string | null) => (nv ?? []).find((n) => n.id === x)?.ho_ten ?? "";
  const dong: [string, string][] = ([
    ["Kho đi", tenCn(p.tu_chi_nhanh_id)], ["Kho đến", tenCn(p.den_chi_nhanh_id)],
    ["Hàng", `${sp?.ten ?? ""}${sp?.ma ? ` · ${sp.ma}` : ""}`], ["Số lượng gửi", `${soVN(p.so_luong_gui)} ${sp?.don_vi ?? ""}`],
    ["Số lượng nhận", p.so_luong_nhan == null ? "" : `${soVN(p.so_luong_nhan)} ${sp?.don_vi ?? ""}`], ["Lý do lệch", p.ly_do_lech ?? ""],
    ["Số lô", p.so_lo ?? ""], ["Hạn dùng", p.han_dung ? ngayVN(p.han_dung) : ""],
    ["Người gửi", `${tenNv(p.nguoi_gui_id)} · ${ngayGioVN(p.gui_luc)}`], ["Người nhận", p.nguoi_nhan_id ? `${tenNv(p.nguoi_nhan_id)}${p.nhan_luc ? ` · ${ngayGioVN(p.nhan_luc)}` : ""}` : ""],
    ["Tình trạng", TT_CHUYEN[p.trang_thai]?.ten ?? p.trang_thai], ["Ghi chú", p.ghi_chu ?? ""],
  ] as [string, string][]).filter(([, v]) => v);
  return (
    <ToInChung giay={giay} tieuDe="Phiếu chuyển kho" chiNhanh={(cn ?? []).find((c) => c.id === p.tu_chi_nhanh_id) ?? null} kyTen={["Người gửi", "Người nhận"]} phu={<p>Số: {p.ma}</p>}>
      <dl className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: "auto 1fr" }}>
        {dong.map(([n, v]) => <div key={n} className="contents"><dt className="text-muc-2">{n}:</dt><dd className={`whitespace-pre-line [overflow-wrap:anywhere] ${n === "Hàng" || n.startsWith("Số lượng") ? "font-semibold" : ""}`}>{v}</dd></div>)}
      </dl>
    </ToInChung>
  );
}
