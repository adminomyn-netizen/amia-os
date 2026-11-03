import "server-only";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, tienVN } from "@/lib/dinh-dang";
import { coQuyen, type CoQuyen } from "@/lib/quyen";
import { layNhacCong } from "@/lib/nhac-cong";

/** `ma` = loại việc (khoá trạng thái đã đọc/đã xoá của từng nhân viên). */
export type CanhBao = { ma: "lich" | "phieu" | "the" | "no" | "kho" | "han" | "chuyen" | "xuatkhan" | "hdv" | "vb" | "hdld" | "ccvao" | "ccra" | "ccquen" | "luong" | "ccnguoi" | "cckhoa" | "ccnghi" | "klduyet" | "klhan" | "tomtat_tuan" | "tomtat_thang" | "tomtat_nam" | "tonam" | "tdyc" | "tduv" | "tdtin" | "knai" | "bchung"; nhan: string; href: string };

/** Việc đang chờ người này xử lý (theo quyền và chi nhánh của họ): dùng cho chuông thông báo và Trang chủ. */
/** Cảnh báo nhân sự (hợp đồng lao động...) đã chuyển sang MSC Group OS: bỏ mọi mục trỏ vào /nhan-su. */
export async function layCanhBao(nd: CoQuyen & { chiNhanhId: string | null; nhanVienId?: string }): Promise<CanhBao[]> {
  return (await layCanhBaoGoc(nd)).filter((x) => !x.href?.startsWith("/nhan-su"));
}
async function layCanhBaoGoc(nd: CoQuyen & { chiNhanhId: string | null; nhanVienId?: string }): Promise<CanhBao[]> {
  const db = sb(), cn = nd.chiNhanhId, homNay = homNayHCM();
  const ra: CanhBao[] = [];
  const tu = new Date(`${homNay}T00:00:00+07:00`).toISOString(), den = new Date(`${congNgay(homNay, 1)}T00:00:00+07:00`).toISOString();
  const loc = <T extends { eq: (c: string, v: string) => T }>(q: T) => (cn ? q.eq("chi_nhanh_id", cn) : q);
  // Năm nhóm đếm, nhóm cảnh báo nâng cao, khiếu nại và nhắc chấm công/lương đều độc lập nhau: hỏi CÙNG LÚC (trước đây chạy nối đuôi 4 chặng), rồi ghép lại đúng thứ tự cũ.
  const rieng = async (f: (a: CanhBao[]) => Promise<void>) => { const a: CanhBao[] = []; await f(a); return a; };
  // Thẻ sắp hết + hàng dưới mức tối thiểu + tồn âm: MỘT lần gọi hàm dem_canh_bao_nhanh (0303) thay 3 câu đếm qua view (mỗi câu PostgREST tính view 2 lần).
  type Dem = { the_sap_het?: number; kho_duoi_muc?: number; kho_ton_am?: number };
  const pDem: Promise<Dem | null> = coQuyen(nd, "the.xem") || coQuyen(nd, "kho.xem")
    ? Promise.resolve(db.rpc("dem_canh_bao_nhanh", cn ? { p_cn: cn } : {})).then((r) => (r.data ?? {}) as Dem) : Promise.resolve(null);
  const [[lich, phieu, dem, no], nangCao, khieuNai, nhacCong] = await Promise.all([Promise.all([
    coQuyen(nd, "lich.xem") ? loc(db.from("lich_hen").select("id", { count: "exact", head: true }).gte("bat_dau", tu).lt("bat_dau", den).eq("trang_thai", "chua_xac_nhan")) : null,
    coQuyen(nd, "phieu.xem") ? loc(db.from("phieu_cap").select("id", { count: "exact", head: true }).in("trang_thai", ["cho_cap", "da_cap"])) : null,
    pDem,
    coQuyen(nd, "baocao.tien") ? loc(db.from("hoa_don").select("con_no").eq("trang_thai", "hoan_thanh").gt("con_no", 0)) : null,
  ]), rieng((a) => themCanhBaoNangCao(nd, a, homNay, pDem.then((d) => d?.kho_ton_am ?? 0))), rieng((a) => themCanhBaoKhieuNai(nd, a)), layNhacCong(nd, homNay)]);
  const the = coQuyen(nd, "the.xem") ? { count: dem?.the_sap_het ?? 0 } : null, kho = coQuyen(nd, "kho.xem") ? { count: dem?.kho_duoi_muc ?? 0 } : null;
  if ((lich?.count ?? 0) > 0) ra.push({ ma: "lich", nhan: `${lich!.count} lịch hôm nay chưa xác nhận`, href: "/lich-hen" });
  if ((phieu?.count ?? 0) > 0) ra.push({ ma: "phieu", nhan: `${phieu!.count} phiếu cấp vật tư đang chờ kho cấp hoặc Chuyên viên trị liệu nhận`, href: "/phieu-cap" });
  if ((the?.count ?? 0) > 0) ra.push({ ma: "the", nhan: `${the!.count} thẻ liệu trình sắp hết buổi (nhắc khách mua tiếp)`, href: "/the" });
  const dsNo = (no?.data ?? []) as { con_no: number }[];
  if (dsNo.length > 0) ra.push({ ma: "no", nhan: `${dsNo.length} hoá đơn còn nợ, tổng ${tienVN(dsNo.reduce((s, r) => s + Number(r.con_no), 0))}`, href: "/bao-cao?tab=no" });
  if ((kho?.count ?? 0) > 0) ra.push({ ma: "kho", nhan: `${kho!.count} mặt hàng dưới mức tồn tối thiểu`, href: "/kho?thieu=1" });
  ra.push(...nangCao, ...khieuNai);
  ra.unshift(...nhacCong);
  return ra;
}

/** Cảnh báo kho nâng cao, hoá đơn đầu vào, văn bản và hợp đồng lao động (mỗi loại chỉ hỏi khi người này có quyền). */
async function themCanhBaoNangCao(nd: CoQuyen & { chiNhanhId: string | null }, ra: CanhBao[], homNay: string, pTonAm: Promise<number>) {
  const db = sb(), cn = nd.chiNhanhId;
  const [han, chuyen, xk, hdv, vbHet, vbCho, hd, tonAm] = await Promise.all([
    coQuyen(nd, "kho.xem") ? (cn ? db.from("v_ton_lo").select("san_pham_id", { count: "exact", head: true }).eq("chi_nhanh_id", cn) : db.from("v_ton_lo").select("san_pham_id", { count: "exact", head: true })).gt("con_lai", 0).lte("han_dung", congNgay(homNay, 30)) : null,
    coQuyen(nd, "kho.xem") ? db.from("phieu_chuyen_kho").select("id, trang_thai, den_chi_nhanh_id, han_nhan").in("trang_thai", ["dang_chuyen", "cho_xu_ly_chenh_lech"]) : null,
    coQuyen(nd, "kho.duyet") ? (cn ? db.from("phieu_xuat_khan").select("id", { count: "exact", head: true }).eq("chi_nhanh_id", cn) : db.from("phieu_xuat_khan").select("id", { count: "exact", head: true })).eq("trang_thai", "cho_hau_kiem") : null,
    coQuyen(nd, "quy.ghi") ? db.from("hoa_don_dau_vao").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_hoa_don").lt("han_nhan", homNay) : null,
    coQuyen(nd, "vb.xem") ? db.from("van_ban").select("id", { count: "exact", head: true }).eq("trang_thai", "da_ky").lte("hieu_luc_den", congNgay(homNay, 30)) : null,
    coQuyen(nd, "vb.duyet") ? db.from("van_ban").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet") : null,
    coQuyen(nd, "cong.xem") ? db.from("hd_lao_dong").select("nhan_vien_id, giai_doan, den_ngay") : null,
    coQuyen(nd, "kho.xem") ? pTonAm.then((count) => ({ count })) : null, // tồn âm: đếm chung trong dem_canh_bao_nhanh
  ]);
  if ((tonAm?.count ?? 0) > 0) ra.push({ ma: "tonam", nhan: `${tonAm!.count} mặt hàng tồn kho đang ÂM (sổ kho sai): kiểm kê hoặc điều chỉnh`, href: "/danh-muc?tab=ra-soat&loai=ton_am" });
  if ((han?.count ?? 0) > 0) ra.push({ ma: "han", nhan: `${han!.count} lô vật tư hết hạn trong 30 ngày hoặc đã quá hạn`, href: "/kho?tab=han" });
  const ck = ((chuyen?.data ?? []) as { trang_thai: string; den_chi_nhanh_id: string; han_nhan: string }[]).filter((c) => (!cn || c.den_chi_nhanh_id === cn) && (c.trang_thai === "cho_xu_ly_chenh_lech" || new Date(c.han_nhan).getTime() < Date.now()));
  if (ck.length > 0) ra.push({ ma: "chuyen", nhan: `${ck.length} phiếu chuyển kho quá 24 giờ chưa nhận hoặc đang chờ xử lý chênh lệch`, href: "/kho/chuyen-kho" });
  if ((xk?.count ?? 0) > 0) ra.push({ ma: "xuatkhan", nhan: `${xk!.count} phiếu xuất khẩn cấp chờ hậu kiểm`, href: "/kho/xu-ly?tab=xuat-khan" });
  if ((hdv?.count ?? 0) > 0) ra.push({ ma: "hdv", nhan: `${hdv!.count} khoản “hoá đơn chưa về” đã quá hạn`, href: "/tai-chinh/hoa-don-dau-vao" });
  const nVb = (vbHet?.count ?? 0) + (vbCho?.count ?? 0);
  if (nVb > 0) ra.push({ ma: "vb", nhan: `${nVb} văn bản chờ duyệt hoặc sắp hết hạn`, href: "/van-ban/danh-sach?tab=can-xu-ly" });
  if (hd?.data) {
    const rows = hd.data as { nhan_vien_id: string; giai_doan: string; den_ngay: string | null }[], thu = ["thu_viec", "hdld_1", "hdld_2", "kxd"];
    const moiNhat = new Map<string, (typeof rows)[number]>();
    for (const r of rows) { const c = moiNhat.get(r.nhan_vien_id); if (!c || thu.indexOf(r.giai_doan) > thu.indexOf(c.giai_doan)) moiNhat.set(r.nhan_vien_id, r); }
    const sap = [...moiNhat.values()].filter((r) => r.giai_doan !== "kxd" && r.den_ngay && r.den_ngay <= congNgay(homNay, 45)).length;
    if (sap > 0) ra.push({ ma: "hdld", nhan: `${sap} hợp đồng lao động sắp hết hạn hoặc đã hết hạn`, href: "/nhan-su/hop-dong" });
  }
}

/** Khiếu nại đang xử lý (người ghi nhận/xử lý/duyệt) và biến chứng chưa đóng (bác sĩ, lãnh đạo): biến chứng luôn báo, không có SLA nào làm nó chậm đi. */
async function themCanhBaoKhieuNai(nd: CoQuyen & { chiNhanhId: string | null }, ra: CanhBao[]) {
  const db = sb(), cn = nd.chiNhanhId;
  const xemKn = coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet"), xemBc = coQuyen(nd, "bc.xu_ly") || coQuyen(nd, "kn.duyet");
  const loc = <T extends { eq: (c: string, v: string) => T }>(q: T) => (cn ? q.eq("chi_nhanh_id", cn) : q);
  const [kn, bc] = await Promise.all([
    xemKn ? loc(db.from("khieu_nai").select("trang_thai").in("trang_thai", ["moi", "cho_duyet", "da_duyet"]).limit(500)) : null,
    xemBc ? loc(db.from("bien_chung").select("trang_thai").neq("trang_thai", "dong").limit(500)) : null,
  ]);
  const dsBc = (bc?.data ?? []) as { trang_thai: string }[];
  if (dsBc.length > 0) { const moi = dsBc.filter((x) => x.trang_thai === "moi").length; ra.push({ ma: "bchung", nhan: `${dsBc.length} ca biến chứng chưa đóng${moi ? `, ${moi} ca chờ bác sĩ` : ""}`, href: "/khieu-nai?tab=bien-chung" }); }
  const dsKn = (kn?.data ?? []) as { trang_thai: string }[];
  if (dsKn.length > 0) { const cho = coQuyen(nd, "kn.duyet") ? dsKn.filter((x) => x.trang_thai === "cho_duyet").length : 0; ra.push({ ma: "knai", nhan: `${dsKn.length} khiếu nại đang xử lý${cho ? `, ${cho} chờ duyệt phương án` : ""}`, href: "/khieu-nai" }); }
}
