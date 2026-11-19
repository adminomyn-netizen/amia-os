import { kiemQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau } from "@/lib/dinh-dang";
import { docLocThe, goiTheoDichVu, NHAN_TINH_TRANG_THE, tinhTrangCuaLoc } from "@/lib/the-loc";
import { docHet, ngayXuat, phanHoiExcel } from "@/lib/xuat-excel";

/** Đọc ~15.000 thẻ + khách theo lô: cho chạy tới 60 giây. */
export const maxDuration = 60;
const TOI_DA = 30_000;

async function theoLo<R>(ids: string[], co: number, lay: (lo: string[]) => PromiseLike<{ data: R[] | null }>): Promise<R[]> {
  const los: string[][] = [];
  for (let i = 0; i < ids.length; i += co) los.push(ids.slice(i, i + co));
  const ra: R[] = [];
  for (let i = 0; i < los.length; i += 8) for (const r of await Promise.all(los.slice(i, i + 8).map((l) => lay(l)))) ra.push(...(r.data ?? []));
  return ra;
}

/** Xuất Excel thẻ theo đúng bộ lọc trang Thẻ (tab, tình trạng, dịch vụ/tên thẻ, chi nhánh, từ khoá). Quyền the.xem; SĐT chỉ khi có quyền xem SĐT; ghi nhật ký. */
export async function GET(req: Request) {
  const nd = await kiemQuyen("the.xem");
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const u = new URL(req.url).searchParams;
  const loc = docLocThe({ tab: u.get("tab") ?? "", q: u.get("q") ?? "", het: u.get("het") ?? "", tt: u.get("tt") ?? "", dv: u.get("dv") ?? "", cn: u.get("cn") ?? "" });
  const cn = nd.chiNhanhId ?? loc.cn;
  const db = sb();
  const goiIds = await goiTheoDichVu(loc.dv);
  let idsKhachQ: string[] | null = null;
  if (loc.q) {
    const { data: kt } = await db.from("khach_hang").select("id").or(`ho_ten_khong_dau.ilike.%${boDau(loc.q)}%,dien_thoai.ilike.%${loc.q.replace(/^0/, "")}%,ma.ilike.%${loc.q}%`).limit(300);
    idsKhachQ = (kt ?? []).map((k) => k.id);
  }
  const the = await docHet((tu, den) => {
    let q = db.from("v_the_khach").select("*").eq("loai", loc.tab).in("tinh_trang", tinhTrangCuaLoc(loc.tt)).order("ngay_cap", { ascending: false }).order("id").range(tu, den);
    if (cn) q = q.eq("chi_nhanh_id", cn);
    if (goiIds) q = q.in("goi_id", goiIds);
    if (loc.q) q = q.or(idsKhachQ?.length ? `ma.ilike.%${loc.q}%,khach_id.in.(${idsKhachQ.join(",")})` : `ma.ilike.%${loc.q}%`);
    return q;
  });
  if (the.length > TOI_DA) return new Response(`Quá ${TOI_DA} thẻ, hãy lọc hẹp hơn (dịch vụ, tình trạng, chi nhánh).`, { status: 400 });

  const idsK = [...new Set(the.map((t) => t.khach_id).filter(Boolean))] as string[];
  const [khach, { data: goi }, { data: lk }, { data: dv }, { data: chiNhanh }, buoi, shTru] = await Promise.all([
    theoLo(idsK, 150, (lo) => db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, lan_den_cuoi").in("id", lo)),
    db.from("goi_the").select("id, ten").limit(5000), db.from("goi_the_dich_vu").select("goi_id, dich_vu_id").limit(20000), db.from("dich_vu").select("id, ten").limit(5000),
    db.from("chi_nhanh").select("id, ten"),
    // Lần dùng thẻ gần nhất: buổi làm trong app + buổi trừ đồng bộ từ SalonHero (mã đợt SH-DB-YYYYMMDD). Thẻ chuyển từ SalonHero chỉ có số buổi đã dùng, không có ngày từng buổi.
    docHet((tu, den) => db.from("buoi_thuc_hien").select("the_id, ngay_lam").neq("trang_thai", "huy").order("id").range(tu, den)),
    docHet((tu, den) => db.from("the_so_cai").select("the_id, nhap_dot").lt("so_buoi", 0).like("nhap_dot", "SH-DB-%").order("id").range(tu, den)),
  ]);
  const kh = new Map(khach.map((k) => [k.id, k]));
  const tenGoi = new Map((goi ?? []).map((g) => [g.id, g.ten])), tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten])), tenCn = new Map((chiNhanh ?? []).map((c) => [c.id, c.ten]));
  const dvCuaGoi = new Map<string, string[]>();
  for (const l of lk ?? []) { const t = tenDv.get(l.dich_vu_id); if (t) dvCuaGoi.set(l.goi_id, [...(dvCuaGoi.get(l.goi_id) ?? []), t]); }
  const cuoi = new Map<string, string>();
  const ghiNgay = (id: string | null, ngay: string) => { if (id && ngay > (cuoi.get(id) ?? "")) cuoi.set(id, ngay); };
  for (const b of buoi) ghiNgay(b.the_id, b.ngay_lam);
  for (const s of shTru) { const m = /^SH-DB-(\d{4})(\d{2})(\d{2})/.exec(s.nhap_dot ?? ""); if (m) ghiNgay(s.the_id, `${m[1]}-${m[2]}-${m[3]}`); }
  const xemSdt = coQuyen(nd, "khach.sdt");

  const dong = the.map((t) => {
    const k = kh.get(t.khach_id ?? "");
    const tong = t.so_buoi_tong == null ? null : Number(t.so_buoi_tong), con = Number(t.so_buoi_con ?? 0);
    return {
      ma: t.ma, goi: tenGoi.get(t.goi_id ?? "") ?? (loc.tab === "tien" ? "Thẻ tiền" : "Thẻ liệu trình"), dv: (dvCuaGoi.get(t.goi_id ?? "") ?? []).join(", "),
      khach: k?.ho_ten ?? "", ma_khach: k?.ma ?? "", sdt: xemSdt ? k?.dien_thoai ?? "" : "",
      tong: loc.tab === "lan" ? tong ?? "" : Number(t.tong_tien ?? 0), dung: loc.tab === "lan" ? (tong == null ? "" : tong - con) : Number(t.tong_tien ?? 0) - Number(t.so_du_tien ?? 0),
      con: loc.tab === "lan" ? con : Number(t.so_du_tien ?? 0),
      cuoi: ngayXuat(cuoi.get(t.id ?? "")), den: ngayXuat(k?.lan_den_cuoi), cap: ngayXuat(t.ngay_cap), han: ngayXuat(t.han_dung),
      tt: NHAN_TINH_TRANG_THE[t.tinh_trang ?? ""] ?? t.tinh_trang ?? "", cn: tenCn.get(t.chi_nhanh_id ?? "") ?? "",
    };
  });
  const lan = loc.tab === "lan";
  return phanHoiExcel(db, nd, [{
    ten: lan ? "The lieu trinh" : "The tien",
    cot: [
      { nhan: "Mã thẻ", khoa: "ma", rong: 14 }, { nhan: "Tên thẻ", khoa: "goi", rong: 40 }, { nhan: "Dịch vụ trong thẻ", khoa: "dv", rong: 36 },
      { nhan: "Khách", khoa: "khach", rong: 26 }, { nhan: "Mã khách", khoa: "ma_khach", rong: 12 }, { nhan: "SĐT", khoa: "sdt", rong: 14 },
      lan ? { nhan: "Tổng buổi", khoa: "tong", so: true } : { nhan: "Tổng tiền", khoa: "tong", tien: true },
      lan ? { nhan: "Đã dùng", khoa: "dung", so: true } : { nhan: "Đã dùng (tiền)", khoa: "dung", tien: true },
      lan ? { nhan: "Buổi còn lại", khoa: "con", so: true } : { nhan: "Số dư", khoa: "con", tien: true },
      { nhan: "Lần dùng thẻ gần nhất (từ khi dùng app)", khoa: "cuoi", rong: 20 }, { nhan: "Khách đến gần nhất", khoa: "den", rong: 16 },
      { nhan: "Ngày cấp", khoa: "cap", rong: 12 }, { nhan: "Hạn dùng", khoa: "han", rong: 12 }, { nhan: "Tình trạng", khoa: "tt", rong: 14 }, { nhan: "Chi nhánh", khoa: "cn", rong: 18 },
    ],
    dong,
  }], { tenTep: `the-${lan ? "lieu-trinh" : "tien"}-${loc.tt}`, doiTuong: "the", chiTiet: { loai: "the", loc } });
}
