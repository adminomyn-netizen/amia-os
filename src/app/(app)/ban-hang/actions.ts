"use server";

import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuanSdt } from "@/lib/dinh-dang";
import { tinhDon, type DonBan } from "@/lib/ban-hang";
import type { TablesInsert } from "@/lib/supabase/database.types";

export async function timKhach(q: string) {
  if (!(await kiemQuyen("khach.xem"))) return [];
  const an = q.trim().replace(/[%,()]/g, " ");
  if (an.length < 2) return [];
  const so = chuanSdt(an);
  const { data } = await sb().from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id, ngay_sinh")
    .or([`ho_ten.ilike.%${an}%`, `ma.ilike.%${an}%`, so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean).join(",")).order("ho_ten").limit(8);
  return data ?? [];
}

export async function layTheTien(khachId: string) {
  if (!(await kiemQuyen("ban.tao"))) return [];
  const { data } = await sb().from("v_the_khach").select("id, ma, so_du_tien, han_dung, tinh_trang").eq("khach_id", khachId).eq("loai", "tien").in("tinh_trang", ["hoat_dong", "sap_het"]);
  return (data ?? []).filter((t) => Number(t.so_du_tien) > 0).map((t) => ({ id: t.id as string, ma: t.ma as string, soDu: Number(t.so_du_tien) }));
}

type KQ = { ok: true; id: string; ma: string } | { ok?: false; loi: string };

/** Tạo hoá đơn + dòng + người hưởng + thanh toán rồi chốt. Giá lấy từ DB (không tin giá gửi lên). Lỗi trước khi có thanh toán thì xoá nháp; sau đó thì huỷ có hoàn tiền. */
export async function chotDonBanHang(json: string): Promise<KQ> {
  const nd = await kiemQuyen("ban.tao");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  let don: DonBan;
  try { don = JSON.parse(json) as DonBan; } catch { return { loi: "Dữ liệu đơn không đọc được." }; }
  if (!don.dong?.length) return { loi: "Đơn chưa có dòng hàng nào." };
  const db = sb();
  // Người có chi nhánh cố định chỉ bán ở chi nhánh của mình; người xem mọi chi nhánh phải chọn rõ, không tự rơi về chi nhánh đầu.
  if (nd.chiNhanhId) don.chiNhanhId = nd.chiNhanhId;
  else if (!don.chiNhanhId || !(await db.from("chi_nhanh").select("id").eq("id", don.chiNhanhId).eq("hoat_dong", true).maybeSingle()).data) return { loi: "Chọn chi nhánh bán trước khi chốt đơn." };

  const idsDv = don.dong.filter((d) => d.loai === "dich_vu").map((d) => d.ref);
  const idsGoi = don.dong.filter((d) => d.loai === "goi_the").map((d) => d.ref);
  const idsSp = don.dong.filter((d) => d.loai === "san_pham").map((d) => d.ref);
  const [dv, goi, sp] = await Promise.all([
    idsDv.length ? db.from("dich_vu").select("id, ten, gia, hoat_dong").in("id", idsDv) : Promise.resolve({ data: [] }),
    idsGoi.length ? db.from("goi_the").select("id, ten, gia, hoat_dong").in("id", idsGoi) : Promise.resolve({ data: [] }),
    idsSp.length ? db.from("san_pham").select("id, ten, gia_ban, hoat_dong, ban_le").in("id", idsSp) : Promise.resolve({ data: [] }),
  ]);
  const gia = new Map<string, { ten: string; gia: number; ok: boolean }>();
  for (const x of dv.data ?? []) gia.set(`dich_vu:${x.id}`, { ten: x.ten, gia: x.gia, ok: x.hoat_dong });
  for (const x of goi.data ?? []) gia.set(`goi_the:${x.id}`, { ten: x.ten, gia: x.gia, ok: x.hoat_dong });
  for (const x of sp.data ?? []) gia.set(`san_pham:${x.id}`, { ten: x.ten, gia: x.gia_ban, ok: x.hoat_dong && x.ban_le });

  let hang = 0;
  for (const d of don.dong) {
    const m = gia.get(`${d.loai}:${d.ref}`);
    if (!m || !m.ok) return { loi: "Có mục trong đơn đã ngừng bán hoặc không tồn tại. Tải lại trang rồi chọn lại." };
    if (!Number.isInteger(d.sl) || d.sl < 1 || d.sl > 999) return { loi: `Số lượng của "${m.ten}" chưa hợp lệ.` };
    if (!Number.isInteger(d.giam) || d.giam < 0 || d.giam > m.gia * d.sl) return { loi: `Giảm giá của "${m.ten}" chưa hợp lệ.` };
    for (const vai of ["phuc_vu", "tu_van", "ban"] as const) {
      const ds = d.nv?.[vai] ?? [];
      if (ds.length && Math.abs(ds.reduce((s, x) => s + Number(x.ti), 0) - 100) > 0.01) return { loi: `"${m.ten}": phần chia cho vai ${vai === "phuc_vu" ? "Phục vụ" : vai === "tu_van" ? "Tư vấn" : "Bán hàng"} phải cộng đủ 100%.` };
      if (new Set(ds.map((x) => x.id)).size !== ds.length) return { loi: `"${m.ten}": một người không được xuất hiện hai lần trong cùng một vai.` };
    }
    hang += m.gia * d.sl - d.giam;
  }
  for (const v of [don.giamDon, don.phuPhi, don.tip]) if (!Number.isInteger(v) || v < 0) return { loi: "Giảm giá, phụ phí hoặc tip chưa hợp lệ." };
  if (don.giamDon > hang) return { loi: "Giảm giá cả đơn lớn hơn tiền hàng." };
  if (!(don.vatPct >= 0 && don.vatPct <= 100)) return { loi: "VAT chưa hợp lệ." };
  const { phai } = tinhDon(hang, don.giamDon, don.vatPct, don.phuPhi, don.tip);
  const tongThu = (don.thu ?? []).reduce((s, t) => s + t.so_tien, 0);
  if ((don.thu ?? []).some((t) => !Number.isInteger(t.so_tien) || t.so_tien <= 0)) return { loi: "Có khoản thu chưa hợp lệ." };
  if (tongThu > phai) return { loi: "Tổng các khoản thu lớn hơn số phải thu." };
  if (tongThu < phai && !don.khachId) return { loi: "Còn nợ thì phải chọn khách hàng." };
  if (don.dong.some((d) => d.loai === "goi_the") && !don.khachId) return { loi: "Bán thẻ phải chọn khách hàng." };

  if (don.khachId) {
    const { data: k } = await db.from("khach_hang").select("id, ngay_sinh").eq("id", don.khachId).maybeSingle();
    if (!k) return { loi: "Không tìm thấy khách hàng." };
    const { count } = await db.from("hoa_don").select("id", { count: "exact", head: true }).eq("khach_id", k.id).eq("trang_thai", "hoan_thanh");
    if (!k.ngay_sinh && (count ?? 0) === 0) return { loi: "Khách mua lần đầu: cần nhập ngày sinh trong hồ sơ khách trước khi chốt đơn." };
  }

  const ma = "HD" + String(Number((await db.rpc("so_tiep_theo", { p_khoa: "hoa_don" })).data ?? 0)).padStart(6, "0");
  const { data: h, error: eh } = await db.from("hoa_don").insert({
    ma, chi_nhanh_id: don.chiNhanhId, khach_id: don.khachId, lich_hen_id: don.lichId, nguoi_lap_id: nd.nhanVienId, giam_gia_don: don.giamDon, vat_pct: don.vatPct,
    phu_phi: don.phuPhi, tip: don.tip, nguoi_gioi_thieu_id: don.nguoiGioiThieu || null, ghi_chu: don.ghiChu?.trim() || null,
  }).select("id").single();
  if (eh || !h) return { loi: thongBaoLoi(eh) };
  const huyNhap = async () => { await db.from("hoa_don").delete().eq("id", h.id); };

  for (const d of don.dong) {
    const m = gia.get(`${d.loai}:${d.ref}`)!;
    const row: TablesInsert<"hoa_don_dong"> = { hoa_don_id: h.id, loai: d.loai, ten: m.ten, so_luong: d.sl, don_gia: m.gia, giam_gia: d.giam,
      dich_vu_id: d.loai === "dich_vu" ? d.ref : null, goi_id: d.loai === "goi_the" ? d.ref : null, san_pham_id: d.loai === "san_pham" ? d.ref : null };
    const { data: dg, error: ed } = await db.from("hoa_don_dong").insert(row).select("id").single();
    if (ed || !dg) { await huyNhap(); return { loi: thongBaoLoi(ed) }; }
    const chia = (["phuc_vu", "tu_van", "ban"] as const).flatMap((vai) => (d.nv?.[vai] ?? []).map((x) => ({ dong_id: dg.id, nhan_vien_id: x.id, vai, ti_le: x.ti })));
    if (chia.length) {
      const { error: ec } = await db.from("dong_nhan_vien").insert(chia);
      if (ec) { await huyNhap(); return { loi: thongBaoLoi(ec) }; }
    }
  }

  for (const t of don.thu ?? []) {
    const { error: et } = await db.from("thanh_toan").insert({ hoa_don_id: h.id, loai: "thu", phuong_thuc: t.phuong_thuc, so_tien: t.so_tien, the_id: t.phuong_thuc === "the_tien" ? t.the_id ?? null : null, nguoi_id: nd.nhanVienId });
    if (et) {
      const daCo = await db.from("thanh_toan").select("id", { count: "exact", head: true }).eq("hoa_don_id", h.id);
      if ((daCo.count ?? 0) === 0) await huyNhap(); else await db.rpc("huy_hoa_don", { p_id: h.id, p_ly_do: "Tự huỷ do lỗi khi tạo đơn", p_nguoi: nd.nhanVienId });
      return { loi: thongBaoLoi(et) };
    }
  }
  const { error: ex } = await db.rpc("chot_hoa_don", { p_id: h.id, p_nguoi: nd.nhanVienId });
  if (ex) {
    const daCo = await db.from("thanh_toan").select("id", { count: "exact", head: true }).eq("hoa_don_id", h.id);
    if ((daCo.count ?? 0) === 0) await huyNhap(); else await db.rpc("huy_hoa_don", { p_id: h.id, p_ly_do: "Tự huỷ do lỗi khi chốt đơn", p_nguoi: nd.nhanVienId });
    return { loi: thongBaoLoi(ex) };
  }
  if (don.lichId) await db.from("lich_hen").update({ trang_thai: "hoan_thanh" }).eq("id", don.lichId).in("trang_thai", ["cho_phuc_vu", "dang_phuc_vu", "da_xac_nhan", "chua_xac_nhan"]);
  return { ok: true, id: h.id, ma };
}
