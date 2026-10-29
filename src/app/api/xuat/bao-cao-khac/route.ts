import { kiemQuyen } from "@/lib/auth";
import type { Quyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import { khoangNgay } from "@/lib/bao-cao";
import { NHAN_NGUON, TRANG_THAI_KHACH } from "@/lib/khach";
import { docHet, ngayXuat as ngay, phanHoiExcel, type BangXuat } from "@/lib/xuat-excel";

/** Xuất Excel cho các màn báo cáo nằm ngoài trang Báo cáo: hoa hồng, quyết toán hoa hồng, công nợ khách, đối soát bán hàng, thống kê khách, báo cáo marketing, công nợ nhà cung cấp.
 *  Mỗi loại dùng ĐÚNG quyền của màn tương ứng (chặn ở máy chủ) và cùng nguồn số liệu với màn đó; người gắn chi nhánh chỉ xuất được chi nhánh của mình; mọi lần xuất ghi nhật ký. */
const QUYEN: Record<string, Quyen> = { "danh-muc": "danhmuc.xem", "hoa-hong": "baocao.tien", "ti-le-hoa-hong": "baocao.tien", "quyet-toan-hoa-hong": "luong.xem", "cong-no-khach": "baocao.tien", "doi-soat": "baocao.tien", "thong-ke-khach": "khach.xem", "marketing": "mkt.xem", "cong-no-ncc": "mua.xem" };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const VAI: Record<string, string> = { phuc_vu: "Phục vụ", tu_van: "Tư vấn", ban: "Bán hàng", gioi_thieu: "Giới thiệu" };
const LOAI: Record<string, string> = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Bán thẻ / liệu trình" };
const NHOM_NO = [{ ten: "Chưa đến hạn", den: 0 }, { ten: "1–7 ngày", den: 7 }, { ten: "8–15 ngày", den: 15 }, { ten: "16–30 ngày", den: 30 }, { ten: "31–60 ngày", den: 60 }, { ten: "Trên 60 ngày", den: 99999 }];
const TT_NO: Record<string, string> = { dang_nhac: "Đang nhắc", da_cam_ket: "Đã cam kết", tranh_chap: "Đang tranh chấp" };

export async function GET(req: Request) {
  const u = new URL(req.url);
  const loai = u.searchParams.get("loai") ?? "";
  const quyen = QUYEN[loai];
  if (!quyen) return new Response("Không có báo cáo này", { status: 404 });
  const nd = await kiemQuyen(quyen);
  if (!nd) return new Response("Không đủ quyền", { status: 403 });
  const db = sb();
  const bangs: BangXuat[] = [];
  const hom = homNayHCM();
  const ngayTham = (k: string) => { const v = u.searchParams.get(k); return v && NGAY.test(v) ? v : undefined; };
  let tenTep: string = loai;
  const chiTiet: Record<string, unknown> = { loai };

  if (loai === "hoa-hong") {
    const { tu, den } = khoangNgay(u.searchParams.get("tu") ?? undefined, u.searchParams.get("den") ?? undefined);
    const cn = nd.chiNhanhId ?? (u.searchParams.get("cn") || undefined);
    const [{ data }, { data: nv }] = await Promise.all([db.rpc("bc_nhan_vien", { p_tu: tu, p_den: den, p_cn: cn as string }), db.from("nhan_vien").select("id, ho_ten")]);
    const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    const theo = new Map<string, Record<string, number | string>>();
    for (const r of data ?? []) { const g = theo.get(r.nhan_vien_id) ?? { ten: ten.get(r.nhan_vien_id) ?? "", ds: 0, hh: 0, phuc_vu: 0, tu_van: 0, ban: 0 }; g.ds = Number(g.ds) + Number(r.doanh_so); g.hh = Number(g.hh) + Number(r.hoa_hong); g[r.vai] = Number(g[r.vai] ?? 0) + Number(r.hoa_hong); theo.set(r.nhan_vien_id, g); }
    bangs.push({ ten: "Bảng hoa hồng", dong: [...theo.values()].sort((a, b) => Number(b.hh) - Number(a.hh)), cot: [{ nhan: "Nhân viên", khoa: "ten", rong: 34 }, { nhan: "Doanh số", khoa: "ds", tien: true }, { nhan: "Hoa hồng phục vụ", khoa: "phuc_vu", tien: true }, { nhan: "Hoa hồng tư vấn", khoa: "tu_van", tien: true }, { nhan: "Hoa hồng bán hàng", khoa: "ban", tien: true }, { nhan: "Hoa hồng", khoa: "hh", tien: true }] });
    tenTep = `hoa-hong-${tu}-${den}`; Object.assign(chiTiet, { tu, den, chi_nhanh_id: cn ?? null });
  } else if (loai === "ti-le-hoa-hong") {
    const [{ data: tl }, { data: dv }, { data: sp }, { data: g }, { data: nv }] = await Promise.all([db.from("hoa_hong_ti_le").select("*").order("loai").order("vai"), db.from("dich_vu").select("id, ten"), db.from("san_pham").select("id, ten"), db.from("goi_the").select("id, ten"), db.from("nhan_vien").select("id, ho_ten")]);
    const ten = new Map<string, string>([...(dv ?? []), ...(sp ?? []), ...(g ?? [])].map((x) => [x.id, x.ten])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    bangs.push({ ten: "Tỉ lệ hoa hồng", dong: (tl ?? []).map((r) => ({ dt: r.nhan_vien_id ? `Nhân viên: ${tenNv.get(r.nhan_vien_id) ?? ""}` : r.nhom_chuc_danh ? `Nhóm: ${r.nhom_chuc_danh}` : "Mọi người", loai: LOAI[r.loai] ?? r.loai, vai: VAI[r.vai] ?? r.vai, muc: r.muc_id ? ten.get(r.muc_id) ?? "" : "Mặc định cả loại", ti_le: Number(r.ti_le), so_tien: Number(r.so_tien ?? 0) })),
      cot: [{ nhan: "Áp dụng cho", khoa: "dt", rong: 34 }, { nhan: "Loại", khoa: "loai", rong: 22 }, { nhan: "Vai", khoa: "vai", rong: 14 }, { nhan: "Mục", khoa: "muc", rong: 40 }, { nhan: "Tỉ lệ (%)", khoa: "ti_le", so: true }, { nhan: "Số tiền cố định / lượt", khoa: "so_tien", tien: true }] });
  } else if (loai === "quyet-toan-hoa-hong") {
    const macDinh = (() => { const [y, m] = hom.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; })();
    const t = u.searchParams.get("thang"), thang = t && THANG.test(t) ? t : macDinh;
    const [y, m] = thang.split("-").map(Number);
    const dau = `${thang}-01`, cuoi = congNgay(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`, -1);
    const [{ data: live }, { data: nv }, { data: ky }] = await Promise.all([db.rpc("bc_nhan_vien", { p_tu: dau, p_den: cuoi, p_cn: nd.chiNhanhId ?? undefined }), db.from("nhan_vien").select("id, ho_ten, ma_nv"), db.from("ky_luong").select("id").eq("nam", y).eq("thang", m).maybeSingle()]);
    const { data: chot } = ky ? await db.from("bang_luong_dong").select("nhan_vien_id, hoa_hong").eq("ky_id", ky.id) : { data: [] as { nhan_vien_id: string; hoa_hong: number }[] };
    const ten = new Map((nv ?? []).map((n) => [n.id, `${n.ho_ten}${n.ma_nv ? ` (${n.ma_nv})` : ""}`]));
    const theo = new Map<string, { doanh: number; hh: number }>();
    for (const r of live ?? []) { const x = theo.get(r.nhan_vien_id) ?? { doanh: 0, hh: 0 }; x.doanh += Number(r.doanh_so); x.hh += Number(r.hoa_hong); theo.set(r.nhan_vien_id, x); }
    const daChot = new Map((chot ?? []).map((c) => [c.nhan_vien_id, Number(c.hoa_hong)]));
    const dong = [...new Set([...theo.keys(), ...(ky ? daChot.keys() : [])])].map((id) => ({ ten: ten.get(id) ?? "", doanh: theo.get(id)?.doanh ?? 0, hh: theo.get(id)?.hh ?? 0, chot: ky ? daChot.get(id) ?? 0 : "", lech: ky ? (theo.get(id)?.hh ?? 0) - (daChot.get(id) ?? 0) : "" })).sort((a, b) => b.hh - a.hh);
    bangs.push({ ten: `Quyết toán ${String(m).padStart(2, "0")}-${y}`, dong, cot: [{ nhan: "Nhân viên", khoa: "ten", rong: 34 }, { nhan: "Doanh số", khoa: "doanh", tien: true }, { nhan: "Hoa hồng hiện tại", khoa: "hh", tien: true }, { nhan: "Đã chốt trong lương", khoa: "chot", tien: true }, { nhan: "Lệch", khoa: "lech", tien: true }] });
    tenTep = `quyet-toan-hoa-hong-${thang}`; chiTiet.thang = thang;
  } else if (loai === "cong-no-khach") {
    const [{ data: xl }, { data: ch }, { data: nv }] = await Promise.all([db.from("cong_no_khach_xu_ly").select("*"), db.from("cau_hinh").select("gia_tri").eq("khoa", "no_khach.han_ngay").maybeSingle(), db.from("nhan_vien").select("id, ho_ten")]);
    const hd = await docHet((a, b) => { let q = db.from("hoa_don").select("id, ma, khach_id, ngay_hd, con_no, tong_phai_thu").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("ngay_hd").order("id"); if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId); return q.range(a, b); });
    const ids = [...new Set(hd.map((h) => h.khach_id).filter(Boolean))] as string[];
    const ks: { id: string; ho_ten: string }[] = [];
    for (let i = 0; i < ids.length; i += 300) ks.push(...((await db.from("khach_hang").select("id, ho_ten").in("id", ids.slice(i, i + 300))).data ?? []));
    const khach = new Map(ks.map((k) => [k.id, k.ho_ten])), xuLy = new Map((xl ?? []).map((x) => [x.hoa_don_id, x])), ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    const han = Number(ch?.gia_tri ?? 20);
    const dong = hd.map((h) => {
      const denHan = congNgay(h.ngay_hd, han), tuoi = hom > denHan ? Math.round((new Date(`${hom}T00:00:00Z`).getTime() - new Date(`${denHan}T00:00:00Z`).getTime()) / 86400000) : 0;
      const nhom = tuoi === 0 ? NHOM_NO[0] : NHOM_NO.find((n, i) => i > 0 && tuoi <= n.den) ?? NHOM_NO[5];
      const x = xuLy.get(h.id);
      return { ma: h.ma, ngay: ngay(h.ngay_hd), khach: h.khach_id ? khach.get(h.khach_id) ?? "" : "Khách lẻ", tong: Number(h.tong_phai_thu), no: Number(h.con_no), denHan: ngay(denHan), tuoi, nhom: nhom.ten, tt: x ? TT_NO[x.trang_thai] ?? x.trang_thai : "", nguoi: x?.nguoi_phu_trach_id ? ten.get(x.nguoi_phu_trach_id) ?? "" : "", hen: ngay(x?.hen_tra), gc: x?.ghi_chu ?? "" };
    }).sort((a, b) => b.tuoi - a.tuoi);
    bangs.push({ ten: "Công nợ khách hàng", dong, cot: [{ nhan: "Hoá đơn", khoa: "ma", rong: 16 }, { nhan: "Ngày", khoa: "ngay", rong: 12 }, { nhan: "Khách", khoa: "khach", rong: 28 }, { nhan: "Tổng phải thu", khoa: "tong", tien: true }, { nhan: "Còn nợ", khoa: "no", tien: true },
      { nhan: "Đến hạn", khoa: "denHan", rong: 12 }, { nhan: "Tuổi nợ (ngày)", khoa: "tuoi", so: true }, { nhan: "Nhóm tuổi nợ", khoa: "nhom", rong: 16 }, { nhan: "Trạng thái xử lý", khoa: "tt", rong: 18 }, { nhan: "Người phụ trách", khoa: "nguoi", rong: 22 }, { nhan: "Hẹn trả", khoa: "hen", rong: 12 }, { nhan: "Ghi chú", khoa: "gc", rong: 40 }] });
    tenTep = `cong-no-khach-${hom}`;
  } else if (loai === "doi-soat") {
    const den = ngayTham("den") ?? hom, tu = ngayTham("tu") ?? congNgay(den, -29);
    const { data } = await db.rpc("bc_doi_soat_san_pham", { p_tu: tu, p_den: den, p_cn: nd.chiNhanhId ?? undefined });
    bangs.push({ ten: "Đối soát bán hàng", dong: (data ?? []).map((r) => ({ ...r, sl_ban: Number(r.sl_ban), doanh_thu: Number(r.doanh_thu), sl_huy: Number(r.sl_huy), sl_xuat_kho: Number(r.sl_xuat_kho), gia_von: Number(r.gia_von), chenh_lech: Number(r.chenh_lech) })), cot: [{ nhan: "Mã", khoa: "ma", rong: 14 }, { nhan: "Sản phẩm", khoa: "ten", rong: 40 }, { nhan: "Đơn vị", khoa: "don_vi", rong: 10 }, { nhan: "Bán", khoa: "sl_ban", so: true }, { nhan: "Doanh thu", khoa: "doanh_thu", tien: true }, { nhan: "Đã huỷ", khoa: "sl_huy", so: true }, { nhan: "Xuất kho", khoa: "sl_xuat_kho", so: true }, { nhan: "Giá vốn", khoa: "gia_von", tien: true }, { nhan: "Chênh lệch", khoa: "chenh_lech", so: true }] });
    tenTep = `doi-soat-${tu}-${den}`; Object.assign(chiTiet, { tu, den });
  } else if (loai === "thong-ke-khach") {
    const [{ data }, { data: cns }] = await Promise.all([db.rpc("thong_ke_khach"), db.from("chi_nhanh").select("id, ten")]);
    const t = (data ?? {}) as unknown as Record<string, Record<string, number> | { ten: string; so: number }[] | { thang: string; so: number }[] | number>;
    const tenCn = new Map((cns ?? []).map((c) => [c.id, c.ten]));
    const GIOI: Record<string, string> = { "nữ": "Nữ", nam: "Nam", "khác": "Khác", chua_ro: "Chưa rõ" };
    const TUOI: Record<string, string> = { duoi_18: "Dưới 18", "18_24": "18–24", "25_34": "25–34", "35_44": "35–44", "45_54": "45–54", tu_55: "Từ 55", chua_ro: "Chưa có ngày sinh" };
    const dong: { nhom: string; muc: string; so: number }[] = [{ nhom: "Tổng", muc: "Tổng số khách", so: Number(t.tong ?? 0) }];
    const them = (nhom: string, o: unknown, nhan: (k: string) => string) => { for (const [k, v] of Object.entries((o ?? {}) as Record<string, number>).sort((a, b) => b[1] - a[1])) dong.push({ nhom, muc: nhan(k), so: Number(v) }); };
    them("Trạng thái", t.trang_thai, (k) => TRANG_THAI_KHACH[k]?.nhan ?? k); them("Hạng", t.hang, (k) => k); them("Giới tính", t.gioi_tinh, (k) => GIOI[k] ?? k); them("Độ tuổi", t.tuoi, (k) => TUOI[k] ?? k);
    them("Nguồn khách", t.nguon, (k) => NHAN_NGUON[k] ?? k); them("Chi nhánh", t.chi_nhanh, (k) => tenCn.get(k) ?? "Chưa gắn chi nhánh");
    dong.push({ nhom: "Thẻ, công nợ, điểm", muc: "Có thẻ đang dùng", so: Number(t.co_the ?? 0) }, { nhom: "Thẻ, công nợ, điểm", muc: "Đang nợ", so: Number(t.dang_no ?? 0) }, { nhom: "Thẻ, công nợ, điểm", muc: "Có điểm thưởng", so: Number(t.co_diem ?? 0) }, { nhom: "Thẻ, công nợ, điểm", muc: "Tổng điểm thưởng", so: Number(t.tong_diem ?? 0) });
    for (const x of (t.tinh ?? []) as { ten: string; so: number }[]) dong.push({ nhom: "Tỉnh/thành (10 nơi nhiều nhất)", muc: x.ten, so: Number(x.so) });
    for (const x of (t.moi_theo_thang ?? []) as { thang: string; so: number }[]) dong.push({ nhom: "Khách mới 12 tháng", muc: `${x.thang.slice(5)}/${x.thang.slice(0, 4)}`, so: Number(x.so) });
    bangs.push({ ten: "Thống kê khách", dong, cot: [{ nhan: "Nhóm", khoa: "nhom", rong: 30 }, { nhan: "Mục", khoa: "muc", rong: 34 }, { nhan: "Số khách", khoa: "so", so: true }] });
    tenTep = `thong-ke-khach-${hom}`;
  } else if (loai === "marketing") {
    const den = ngayTham("den") ?? hom, tu = ngayTham("tu") ?? congNgay(den, -29);
    const [{ data: kq }, { data: nguon }, { data: cp }, { data: cd }] = await Promise.all([db.rpc("bc_phieu_marketing", { p_tu: tu, p_den: den, p_cn: nd.chiNhanhId ?? undefined }), db.from("nguon_lead").select("id, ten").order("thu_tu"),
      db.from("chi_phi_qc_ngay").select("chi_phi, chien_dich_id").gte("ngay", tu).lte("ngay", den), db.from("chien_dich").select("id, nguon_id")]);
    const ten = new Map((nguon ?? []).map((n) => [n.id, n.ten])), nguonCua = new Map((cd ?? []).map((c) => [c.id, c.nguon_id]));
    const chi = new Map<string, number>();
    for (const c of cp ?? []) { const n = nguonCua.get(c.chien_dich_id); if (n) chi.set(n, (chi.get(n) ?? 0) + Number(c.chi_phi)); }
    bangs.push({ ten: "Báo cáo marketing", dong: (kq ?? []).filter((r) => r.so_lead > 0 || chi.has(r.nguon_id)).map((r) => ({ nguon: ten.get(r.nguon_id) ?? "", lead: Number(r.so_lead), hop_le: Number(r.hop_le), lien_he: Number(r.da_lien_he), dat_lich: Number(r.da_dat_lich), den: Number(r.khach_den), hd: Number(r.co_hoa_don), chi: chi.get(r.nguon_id) ?? 0, thu: Number(r.thuc_thu) })),
      cot: [{ nhan: "Nguồn", khoa: "nguon", rong: 28 }, { nhan: "Lead", khoa: "lead", so: true }, { nhan: "Hợp lệ", khoa: "hop_le", so: true }, { nhan: "Đã liên hệ", khoa: "lien_he", so: true }, { nhan: "Đặt lịch", khoa: "dat_lich", so: true }, { nhan: "Khách đến", khoa: "den", so: true }, { nhan: "Có hoá đơn", khoa: "hd", so: true }, { nhan: "Chi phí QC", khoa: "chi", tien: true }, { nhan: "Thực thu", khoa: "thu", tien: true }] });
    tenTep = `bao-cao-marketing-${tu}-${den}`; Object.assign(chiTiet, { tu, den });
  } else if (loai === "cong-no-ncc") {
    const { data } = await db.from("v_cong_no_ncc").select("*").order("con_no", { ascending: false });
    bangs.push({ ten: "Công nợ nhà cung cấp", dong: (data ?? []).filter((r) => Number(r.con_no) !== 0).map((r) => ({ ten: r.ten, han: Number(r.so_ngay_no), cuoi: ngay(r.thanh_toan_cuoi), no: Number(r.con_no) })), cot: [{ nhan: "Nhà cung cấp", khoa: "ten", rong: 36 }, { nhan: "Hạn thanh toán (ngày)", khoa: "han", so: true }, { nhan: "Thanh toán gần nhất", khoa: "cuoi", rong: 18 }, { nhan: "Còn nợ", khoa: "no", tien: true }] });
    tenTep = `cong-no-ncc-${hom}`;
  }
  else if (loai === "danh-muc") {
    // Danh mục dịch vụ / gói thẻ / sản phẩm (kiểu "Xuất ra Excel" ở Danh mục của SalonHero). Không có giá vốn khi người xuất thiếu quyền xem tiền.
    const tien = nd.quyen.includes("baocao.tien");
    const [{ data: dv }, { data: nhomDv }, { data: gt }, { data: sp }] = await Promise.all([
      db.from("dich_vu").select("ma, nhom_id, ten, don_vi_tinh, thoi_luong_phut, gia, gia_von, vat_pct, hoat_dong, dat_online").order("ma"),
      db.from("dich_vu_nhom").select("id, ten"),
      db.from("goi_the").select("ma, ten, loai, gia, so_buoi, gia_tri_the, han_dung_ngay, hoat_dong").order("ma"),
      db.from("san_pham").select("ma, ten, nhom, don_vi, gia_ban, gia_nhap_don_vi, ton_toi_thieu, hoat_dong").order("ma"),
    ]);
    const tenNhom = new Map((nhomDv ?? []).map((n) => [n.id, n.ten]));
    const tt = (b: boolean | null) => (b ? "Đang bán" : "Ngừng");
    bangs.push({ ten: "Dịch vụ", dong: (dv ?? []).map((r) => ({ ma: r.ma, nhom: r.nhom_id ? tenNhom.get(r.nhom_id) ?? "" : "", ten: r.ten, dvt: r.don_vi_tinh, tg: r.thoi_luong_phut, gia: Number(r.gia), von: tien ? Number(r.gia_von ?? 0) : "", vat: r.vat_pct, on: r.dat_online ? "Có" : "", tt: tt(r.hoat_dong) })),
      cot: [{ nhan: "Mã", khoa: "ma", rong: 14 }, { nhan: "Nhóm", khoa: "nhom", rong: 24 }, { nhan: "Tên dịch vụ", khoa: "ten", rong: 48 }, { nhan: "Đơn vị", khoa: "dvt", rong: 10 }, { nhan: "Thời gian (phút)", khoa: "tg", so: true }, { nhan: "Giá bán", khoa: "gia", tien: true }, ...(tien ? [{ nhan: "Giá vốn", khoa: "von", tien: true }] : []), { nhan: "VAT (%)", khoa: "vat", so: true }, { nhan: "Đặt online", khoa: "on", rong: 10 }, { nhan: "Tình trạng", khoa: "tt", rong: 12 }] });
    bangs.push({ ten: "Gói thẻ", dong: (gt ?? []).map((r) => ({ ma: r.ma, ten: r.ten, loai: r.loai, gia: Number(r.gia), buoi: r.so_buoi ?? "", gtt: r.gia_tri_the != null ? Number(r.gia_tri_the) : "", han: r.han_dung_ngay ?? "", tt: tt(r.hoat_dong) })),
      cot: [{ nhan: "Mã", khoa: "ma", rong: 14 }, { nhan: "Tên gói", khoa: "ten", rong: 52 }, { nhan: "Loại", khoa: "loai", rong: 10 }, { nhan: "Giá bán", khoa: "gia", tien: true }, { nhan: "Số buổi", khoa: "buoi", so: true }, { nhan: "Giá trị thẻ", khoa: "gtt", tien: true }, { nhan: "Hạn (ngày)", khoa: "han", so: true }, { nhan: "Tình trạng", khoa: "tt", rong: 12 }] });
    bangs.push({ ten: "Sản phẩm", dong: (sp ?? []).map((r) => ({ ma: r.ma, ten: r.ten, nhom: r.nhom ?? "", dv: r.don_vi ?? "", ban: Number(r.gia_ban ?? 0), nhap: tien ? Number(r.gia_nhap_don_vi ?? 0) : "", min: r.ton_toi_thieu ?? "", tt: tt(r.hoat_dong) })),
      cot: [{ nhan: "Mã", khoa: "ma", rong: 14 }, { nhan: "Sản phẩm", khoa: "ten", rong: 52 }, { nhan: "Nhóm", khoa: "nhom", rong: 22 }, { nhan: "Đơn vị", khoa: "dv", rong: 10 }, { nhan: "Giá bán", khoa: "ban", tien: true }, ...(tien ? [{ nhan: "Giá nhập", khoa: "nhap", tien: true }] : []), { nhan: "Tồn tối thiểu", khoa: "min", so: true }, { nhan: "Tình trạng", khoa: "tt", rong: 12 }] });
    tenTep = `danh-muc-${hom}`;
  }
  return phanHoiExcel(db, nd, bangs, { tenTep, doiTuong: "bao_cao", chiTiet });
}
