import { kiemQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { phanHoiExcel } from "@/lib/xuat-excel";

/** Xuất mã voucher (SalonHero: Xuất mã voucher) ra Excel: mã, đã dùng hay chưa, hoá đơn dùng. Quyền danhmuc.xem; ghi nhật ký như mọi lần xuất. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("danhmuc.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Thiếu voucher", { status: 400 });
  const db = sb();
  const { data: v } = await db.from("voucher").select("id, ten, chi_nhanh_ids").eq("id", id).maybeSingle();
  if (!v || (nd.chiNhanhId && v.chi_nhanh_ids && !v.chi_nhanh_ids.includes(nd.chiNhanhId))) return new Response("Không tìm thấy voucher", { status: 404 });
  const [{ data: ma }, { data: luot }] = await Promise.all([
    db.from("voucher_ma").select("id, ma, tao_luc").eq("voucher_id", id).order("ma").limit(100000),
    db.from("voucher_luot_dung").select("ma_id, loai, hoa_don_id").eq("voucher_id", id).limit(100000),
  ]);
  const dem = new Map<string, number>(), hdCuoi = new Map<string, string>();
  for (const l of luot ?? []) { dem.set(l.ma_id, (dem.get(l.ma_id) ?? 0) + (l.loai === "dung" ? 1 : -1)); if (l.loai === "dung") hdCuoi.set(l.ma_id, l.hoa_don_id); }
  const idHd = [...new Set([...hdCuoi.values()])];
  const { data: hd } = idHd.length ? await db.from("hoa_don").select("id, ma").in("id", idHd.slice(0, 1000)) : { data: [] as { id: string; ma: string }[] };
  const mHd = new Map((hd ?? []).map((x) => [x.id, x.ma]));
  const dong = (ma ?? []).map((m) => ({ ma: m.ma, so_lan: Math.max(dem.get(m.id) ?? 0, 0), tt: (dem.get(m.id) ?? 0) > 0 ? "Đã dùng" : "Chưa dùng", hd: mHd.get(hdCuoi.get(m.id) ?? "") ?? "" }));
  return phanHoiExcel(db, nd, [{ ten: "Mã voucher", cot: [{ nhan: "Mã voucher", khoa: "ma", rong: 18 }, { nhan: "Số lần đã dùng", khoa: "so_lan" }, { nhan: "Tình trạng", khoa: "tt", rong: 14 }, { nhan: "Hoá đơn dùng gần nhất", khoa: "hd", rong: 18 }], dong }],
    { tenTep: `ma-voucher-${v.ten.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^A-Za-z0-9]+/g, "-").slice(0, 40)}`, doiTuong: "danh_muc", chiTiet: { loai: "voucher-ma", voucher_id: id } });
}
