"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { guiChoNhanVien } from "@/lib/push";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, mang, so } from "@/lib/form";
import { ngayVN } from "@/lib/dinh-dang";
import { gioBaThu } from "@/lib/gio-lam-viec";
import { laKieuLap, ngayLap, thuCuaNgay, TOI_DA_BUOI_LAP, TRANG_THAI_DAT } from "@/lib/lich-hen";
import { docKhachDiCung, dongKhachDiCung } from "@/lib/lich-hen-nhom";
import { layWebDatLich } from "@/lib/web-dat-lich";
import { dongDoiDanhSach, khoaSuaLich, laLoaiLich, laQuanLyLich, quyenSuaLich } from "@/lib/lich-hen-sua";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/lich-hen");
const MUI = "+07:00";

export async function luuLichHen(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const id = chuoi(fd, "id");
  let khachId = chuoi(fd, "khach_id");
  let ngay = chuoi(fd, "ngay");
  let gio = chuoi(fd, "gio");
  let dv = mang(fd, "dich_vu_ids");
  let phut = so(fd, "thoi_luong") || 60;
  // Loại lịch (chị Lâm 10/11): bắt buộc khi đặt mới; khi sửa bỏ trống thì giữ loại cũ.
  const loaiLich = chuoi(fd, "loai_lich");
  if (loaiLich && !laLoaiLich(loaiLich)) return { loi: "Loại lịch không hợp lệ." };
  // Sửa lịch: người tạo lịch hoặc quản lý; trường bị khoá theo trạng thái / hoá đơn thì giữ nguyên giá trị cũ (không tin dữ liệu gửi lên).
  let cu: { trang_thai: string; nhan_vien_id: string | null; chi_nhanh_id: string; khach_id: string; bat_dau: string; ket_thuc: string; tao_boi: string | null; hoa_don_sh_id: number | null } | null = null;
  let khoa = khoaSuaLich("chua_xac_nhan", false);
  let dvCu: string[] = [];
  let diCungCu: { ten: string; dich_vu_ids: string[] | null }[] = [];
  if (id) {
    const [{ data: c }, { data: dc }, { data: kc }] = await Promise.all([
      db.from("lich_hen").select("trang_thai, nhan_vien_id, chi_nhanh_id, khach_id, bat_dau, ket_thuc, tao_boi, hoa_don_sh_id").eq("id", id).maybeSingle(),
      db.from("lich_hen_dich_vu").select("dich_vu_id").eq("lich_id", id),
      db.from("lich_hen_khach").select("ten, dich_vu_ids").eq("lich_id", id).order("thu_tu"),
    ]);
    if (!c) return { loi: "Không tìm thấy lịch hẹn." };
    if (nd.chiNhanhId && c.chi_nhanh_id !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
    const q = quyenSuaLich(nd, c);
    if (!q.duoc) return { loi: `${q.lyDo}.` };
    cu = c; dvCu = (dc ?? []).map((x) => x.dich_vu_id); diCungCu = kc ?? [];
    const { count } = await (c.hoa_don_sh_id != null
      ? db.from("hoa_don").select("id", { count: "exact", head: true }).or(`lich_hen_id.eq.${id},sh_id.eq.${c.hoa_don_sh_id}`)
      : db.from("hoa_don").select("id", { count: "exact", head: true }).eq("lich_hen_id", id));
    khoa = khoaSuaLich(c.trang_thai, (count ?? 0) > 0);
    if (khoa.khach) khachId = c.khach_id;
    if (khoa.gio) {
      ngay = new Date(c.bat_dau).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
      gio = new Date(c.bat_dau).toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false });
      phut = Math.round((Date.parse(c.ket_thuc) - Date.parse(c.bat_dau)) / 60000);
    }
    if (khoa.dichVu) dv = dvCu;
  }
  if (!khachId) return { loi: "Chọn khách hàng." };
  // Tài khoản gắn chi nhánh chỉ đặt/sửa lịch của chi nhánh mình, khách cũng phải thuộc chi nhánh đó (chỉ vai Chủ/không gắn chi nhánh mới xuyên chi nhánh).
  if (nd.chiNhanhId && !(cu && khoa.khach)) {
    const { data: k } = await db.from("khach_hang").select("chi_nhanh_id").eq("id", khachId).maybeSingle();
    if (!k || k.chi_nhanh_id !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) return { loi: "Chọn ngày và giờ hẹn." };
  // Lịch chuyển từ SalonHero có thể chỉ có tên dịch vụ dạng chữ (không có dòng dịch vụ): sửa lịch đó được để trống dịch vụ.
  if (dv.length === 0 && !(id && dvCu.length === 0)) return { loi: "Chọn ít nhất một dịch vụ." };
  if (phut < 5 || (phut > 600 && !khoa.gio)) return { loi: "Thời lượng phải từ 5 đến 600 phút." };
  if (!id && !loaiLich) return { loi: "Chọn loại lịch (tư vấn khách mới, khách liệu trình…)." };
  // Lịch lặp (chỉ khi đặt mới, giống SalonHero): kiểu DAILY/WEEKLY/MONTHLY, mỗi N ngày/tuần/tháng, tổng số buổi.
  const kieuLap = id ? "" : chuoi(fd, "kieu_lap");
  if (kieuLap && !laKieuLap(kieuLap)) return { loi: "Kiểu lặp không hợp lệ." };
  const khoang = kieuLap ? so(fd, "lap_khoang") || 1 : 1;
  const tong = kieuLap ? so(fd, "lap_tong") : 1;
  if (kieuLap && (!Number.isInteger(khoang) || khoang < 1 || khoang > 12)) return { loi: "Khoảng lặp từ 1 đến 12." };
  if (kieuLap && (!Number.isInteger(tong) || tong < 2 || tong > TOI_DA_BUOI_LAP)) return { loi: `Tổng số buổi lặp từ 2 đến ${TOI_DA_BUOI_LAP}.` };
  const cacNgay = laKieuLap(kieuLap) ? ngayLap(ngay, kieuLap, khoang, tong) : [ngay];
  const buoi = cacNgay.map((n) => { const bd = new Date(`${n}T${gio}:00${MUI}`); return { bd, kt: new Date(bd.getTime() + phut * 60000) }; });
  const nv = chuoiHoacNull(fd, "nhan_vien_id");
  // Một lịch nhiều khách (như SalonHero): Khách 2, 3… đi cùng khách chính, cùng giờ bắt đầu; mỗi khách có dịch vụ, người thực hiện, chỗ riêng.
  const diCungDoc = khoa.diCung ? [] : docKhachDiCung(chuoi(fd, "khach_di_cung"));
  if (typeof diCungDoc === "string") return { loi: diCungDoc };
  const diCung = diCungDoc;
  const dvNhom = [...new Set(diCung.flatMap((k) => k.dichVuIds))];
  if (dvNhom.length) {
    const { data: co } = await db.from("dich_vu").select("id").in("id", dvNhom);
    if ((co ?? []).length !== dvNhom.length) return { loi: "Có dịch vụ của khách đi cùng không còn trong danh mục." };
  }
  // Trùng giờ: người thực hiện của khách chính và của từng khách đi cùng (xét cả lịch chính lẫn khách đi cùng của lịch khác). Một truy vấn cho cả chuỗi lặp.
  const canKiem = new Map<string, number>(); // nhân viên → thời lượng phút phải rảnh
  // Lịch đã khoá giờ (đã phục vụ / xong / huỷ) mà giữ nguyên người thực hiện thì không kiểm lại trùng giờ (dữ liệu cũ có thể chồng giờ, không chặn việc sửa ghi chú).
  if (nv && !(cu && khoa.gio && nv === cu.nhan_vien_id)) canKiem.set(nv, phut);
  for (const k of diCung) if (k.nhanVienId) canKiem.set(k.nhanVienId, Math.max(canKiem.get(k.nhanVienId) ?? 0, k.thoiLuong ?? phut));
  if (canKiem.size) {
    const ids = [...canKiem.keys()], tuIso = buoi[0].bd.toISOString(), denIso = new Date(buoi[buoi.length - 1].bd.getTime() + 600 * 60000).toISOString();
    let q1 = db.from("lich_hen").select("id, bat_dau, ket_thuc, nhan_vien_id").in("nhan_vien_id", ids).not("trang_thai", "in", "(huy,khong_den)").lt("bat_dau", denIso).gt("ket_thuc", tuIso);
    if (id) q1 = q1.neq("id", id);
    let q2 = db.from("lich_hen_khach").select("nhan_vien_id, thoi_luong_phut, lich_hen!inner(id, bat_dau, ket_thuc, trang_thai)").in("nhan_vien_id", ids)
      .not("lich_hen.trang_thai", "in", "(huy,khong_den)").lt("lich_hen.bat_dau", denIso).gt("lich_hen.ket_thuc", tuIso);
    if (id) q2 = q2.neq("lich_id", id);
    const [{ data: t1 }, { data: t2 }] = await Promise.all([q1.limit(2000), q2.limit(2000)]);
    const ban = [
      ...(t1 ?? []).map((t) => ({ nv: t.nhan_vien_id, bd: Date.parse(t.bat_dau), kt: Date.parse(t.ket_thuc) })),
      ...(t2 ?? []).map((t) => { const l = t.lich_hen as unknown as { bat_dau: string; ket_thuc: string }; const bd = Date.parse(l.bat_dau); return { nv: t.nhan_vien_id, bd, kt: t.thoi_luong_phut ? bd + t.thoi_luong_phut * 60000 : Date.parse(l.ket_thuc) }; }),
    ];
    for (const [nvK, ph] of canKiem) {
      const vuong = buoi.findIndex((b) => ban.some((t) => t.nv === nvK && t.bd < b.bd.getTime() + ph * 60000 && t.kt > b.bd.getTime()));
      if (vuong >= 0) return { loi: `${nvK === nv ? "Nhân viên này" : "Người thực hiện của khách đi cùng"} đã có lịch trùng giờ${buoi.length > 1 ? ` vào ngày ${ngayVN(cacNgay[vuong])}` : ""}. Chọn giờ khác hoặc người khác.` };
    }
  }
  // Trạng thái lúc tạo (SalonHero: Chưa xác nhận / Đã xác nhận / Chờ phục vụ trong hộp đặt lịch); chỉ khi đặt mới, sai giá trị thì về "Chưa xác nhận".
  const ttDau = id ? "" : TRANG_THAI_DAT.includes(chuoi(fd, "trang_thai") as (typeof TRANG_THAI_DAT)[number]) ? chuoi(fd, "trang_thai") : "chua_xac_nhan";
  const mocDau = ttDau === "cho_phuc_vu" ? { xac_nhan_luc: new Date().toISOString(), checkin_luc: new Date().toISOString() } : ttDau === "da_xac_nhan" ? { xac_nhan_luc: new Date().toISOString() } : {};
  const row = { so_khach: 1 + diCung.length, khach_id: khachId, chi_nhanh_id: cu && khoa.khach ? cu.chi_nhanh_id : nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id"), nhan_vien_id: nv, phong: chuoiHoacNull(fd, "phong"), nguon: chuoiHoacNull(fd, "nguon"), ghi_chu: chuoiHoacNull(fd, "ghi_chu"), sua_boi: nd.nhanVienId, ...(loaiLich ? { loai_lich: loaiLich } : {}) };
  if (!row.chi_nhanh_id) return { loi: "Chọn chi nhánh." };
  let ids: string[];
  if (id && cu) {
    // Lịch nhóm chuyển từ SalonHero chỉ có so_khach, chưa có dòng khách đi cùng: đổi lịch không có khách đi cùng thì giữ nguyên so_khach. Khách đi cùng bị khoá cũng giữ nguyên.
    const giuSoKhach = khoa.diCung || (diCung.length === 0 && diCungCu.length === 0);
    const { so_khach: _sk, ...rowGiu } = row; void _sk;
    // Chỉ ghi khi trạng thái vẫn như lúc đọc (người khác vừa đổi trạng thái thì báo tải lại, không ghi nhầm chế độ khoá). cap_nhat_luc do trigger đặt = now() → đồng bộ đêm không ghi đè.
    const { data: xong, error } = await db.from("lich_hen").update({ ...(giuSoKhach ? rowGiu : row), ...(khoa.gio ? {} : { bat_dau: buoi[0].bd.toISOString(), ket_thuc: buoi[0].kt.toISOString() }), cap_nhat_luc: new Date().toISOString() })
      .eq("id", id).eq("trang_thai", cu.trang_thai).select("id");
    if (error) return { loi: thongBaoLoi(error) };
    if (!xong?.length) return { loi: "Lịch vừa được người khác đổi trạng thái. Tải lại trang rồi sửa lại." };
    ids = [id];
  } else {
    const nhom = buoi.length > 1 ? crypto.randomUUID() : null;
    const { data, error } = await db.from("lich_hen").insert(buoi.map((b, i) => ({
      ...row, bat_dau: b.bd.toISOString(), ket_thuc: b.kt.toISOString(), tao_boi: nd.nhanVienId, trang_thai: ttDau, ...mocDau,
      ...(nhom ? { kieu_lap: kieuLap, lap_nhom: nhom, lap_khoang: khoang, lap_tong: buoi.length, lap_thu_tu: i + 1 } : {}),
    }))).select("id");
    if (error || !data?.length) return { loi: thongBaoLoi(error) };
    ids = data.map((x) => x.id);
  }
  const doiDv = !id || !khoa.dichVu && dongDoiDanhSach("dich_vu", "Dịch vụ", dvCu, dv);
  if (doiDv) {
    if (id) await db.from("lich_hen_dich_vu").delete().eq("lich_id", id);
    if (dv.length) await db.from("lich_hen_dich_vu").insert(ids.flatMap((l) => dv.map((d) => ({ lich_id: l, dich_vu_id: d }))));
  }
  // Lịch sử sửa: dịch vụ và khách đi cùng nằm ở bảng con nên ghi ở đây (các cột của lịch do trigger DB ghi).
  {
    const tenCua = new Map<string, string>();
    const canTen = [...new Set([...dvCu, ...dv, ...diCung.flatMap((k) => k.dichVuIds), ...diCungCu.flatMap((k) => k.dich_vu_ids ?? [])])];
    if (canTen.length) (await db.from("dich_vu").select("id, ten").in("id", canTen)).data?.forEach((d) => tenCua.set(d.id, d.ten));
    const tenDs = (xs: string[]) => xs.map((x) => tenCua.get(x) ?? x);
    const moTaDiCung = (ds: { ten: string; dv: string[] }[]) => ds.map((k) => `${k.ten}${k.dv.length ? ` (${tenDs(k.dv).join(", ")})` : ""}`);
    const thayDoi = [
      dongDoiDanhSach("dich_vu", "Dịch vụ", tenDs(id ? dvCu : []), tenDs(id && khoa.dichVu ? dvCu : dv)),
      khoa.diCung ? null : dongDoiDanhSach("khach_di_cung", "Khách đi cùng", moTaDiCung(diCungCu.map((k) => ({ ten: k.ten, dv: k.dich_vu_ids ?? [] }))), moTaDiCung(diCung.map((k) => ({ ten: k.ten, dv: k.dichVuIds })))),
    ].filter((x) => x !== null);
    if (thayDoi.length) await db.from("lich_hen_lich_su").insert(ids.map((l) => ({ lich_id: l, chi_nhanh_id: row.chi_nhanh_id, khach_id: khachId, nguoi_id: nd.nhanVienId, nguoi_ten: nd.hoTen, hanh_dong: id ? "sua" : "tao", thay_doi: thayDoi })));
  }
  if (id && !khoa.diCung) await db.from("lich_hen_khach").delete().eq("lich_id", id);
  if (diCung.length) {
    const { error: eNhom } = await db.from("lich_hen_khach").insert(ids.flatMap((l) => dongKhachDiCung(l, diCung)));
    if (eNhom) return { loi: `Đã lưu lịch nhưng chưa lưu được khách đi cùng (${thongBaoLoi(eNhom)}). Mở Đổi lịch để thêm lại.` };
  }
  // Báo cho người được giao lịch (trừ khi chính họ vừa tạo), một lần cho cả chuỗi. Gửi sau khi trả lời để không làm chậm màn hình.
  const nvBao = [...new Set([nv, ...diCung.map((k) => k.nhanVienId)].filter((x): x is string => !!x && x !== nd.nhanVienId))];
  if (nvBao.length) {
    after(async () => {
      const { data: k } = await db.from("khach_hang").select("ho_ten").eq("id", khachId).maybeSingle();
      const them = ids.length > 1 ? ` · lặp ${ids.length} buổi` : "";
      await guiChoNhanVien(nvBao, { tieuDe: id ? "Lịch hẹn được giao vừa cập nhật" : "Có lịch hẹn mới được giao", noiDung: `${gio} ngày ${ngay.split("-").reverse().join("/")} · ${k?.ho_ten ?? "khách"}${diCung.length ? ` +${diCung.length} khách` : ""}${them}`, url: "/lich-hen", tag: `lich-${ids[0]}` });
    });
  }
  lamMoi();
  return { ok: true };
}

const CHUYEN: Record<string, string[]> = {
  chua_xac_nhan: ["da_xac_nhan", "huy"], da_xac_nhan: ["cho_phuc_vu", "huy", "khong_den"], cho_phuc_vu: ["dang_phuc_vu", "huy", "khong_den"],
  dang_phuc_vu: ["hoan_thanh", "cho_phuc_vu"], hoan_thanh: [], huy: [], khong_den: ["da_xac_nhan"],
};
export async function doiTrangThaiLich(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const id = chuoi(fd, "id");
  const moi = chuoi(fd, "trang_thai");
  const { data: l } = await db.from("lich_hen").select("trang_thai, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!l) return { loi: "Không tìm thấy lịch hẹn." };
  if (nd.chiNhanhId && nd.chiNhanhId !== l.chi_nhanh_id) return { loi: KHONG_DU_QUYEN };
  if (!(CHUYEN[l.trang_thai] ?? []).includes(moi)) return { loi: "Không chuyển được sang trạng thái này." };
  if (moi === "huy" && !chuoi(fd, "ly_do")) return { loi: "Huỷ lịch phải ghi lý do." };
  // Hộp "Xác nhận giờ đến" (SalonHero): khách đến → chờ phục vụ, ghi giờ đến lễ tân nhập (HH:MM hôm nay, giờ Việt Nam); không nhập thì lấy giờ bấm. Không ghi giờ ở tương lai.
  const bayGio = new Date();
  let moc: { checkin_luc?: string; xac_nhan_luc?: string } = {};
  if (moi === "cho_phuc_vu" && l.trang_thai !== "dang_phuc_vu") {
    const g = chuoi(fd, "gio_den");
    if (g && !/^([01]\d|2[0-3]):[0-5]\d$/.test(g)) return { loi: "Giờ đến chưa đúng." };
    const den = g ? new Date(`${bayGio.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })}T${g}:00${MUI}`) : bayGio;
    if (den.getTime() > bayGio.getTime() + 60_000) return { loi: "Giờ đến không được sau giờ hiện tại." };
    moc = { checkin_luc: den.toISOString() };
  } else if (moi === "da_xac_nhan") moc = { xac_nhan_luc: bayGio.toISOString() };
  const { error } = await db.from("lich_hen").update({ trang_thai: moi, ly_do_huy: moi === "huy" ? chuoi(fd, "ly_do") : null, cap_nhat_luc: bayGio.toISOString(), sua_boi: nd.nhanVienId, ...moc }).eq("id", id);
  lamMoi();
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}

/** Lễ tân duyệt một yêu cầu đặt lịch online: hàm Postgres tạo khách (nếu số điện thoại chưa có) + lịch "chưa xác nhận" trong một giao dịch, từ chối nếu hết chỗ/đã qua giờ. */
export async function duyetYeuCauOnline(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  if (!id) return { loi: "Thiếu yêu cầu." };
  const db = sb();
  const { data: y } = await db.from("yeu_cau_dat_lich").select("chi_nhanh_id").eq("id", id).maybeSingle();
  if (!y) return { loi: "Không tìm thấy yêu cầu." };
  if (nd.chiNhanhId && nd.chiNhanhId !== y.chi_nhanh_id) return { loi: KHONG_DU_QUYEN };
  const { data: lichId, error } = await db.rpc("duyet_yeu_cau_dat_lich", { p_id: id, p_nguoi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  // Cài đặt Web đặt lịch "Trạng thái lịch hẹn khi đặt online" (SalonHero): chọn "Đã xác nhận" thì lịch vừa duyệt vào thẳng Đã xác nhận.
  if (lichId && (await layWebDatLich(db)).trangThai === "da_xac_nhan")
    await db.from("lich_hen").update({ trang_thai: "da_xac_nhan", xac_nhan_luc: new Date().toISOString(), sua_boi: nd.nhanVienId }).eq("id", lichId as unknown as string).eq("trang_thai", "chua_xac_nhan");
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "duyet_yeu_cau_dat_lich", doi_tuong: "yeu_cau_dat_lich", doi_tuong_id: id });
  lamMoi();
  return { ok: true };
}
export async function tuChoiYeuCauOnline(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), lyDo = chuoi(fd, "ly_do").slice(0, 200);
  if (!id || !lyDo) return { loi: "Ghi lý do từ chối." };
  const db = sb();
  const { data: y } = await db.from("yeu_cau_dat_lich").select("chi_nhanh_id, trang_thai").eq("id", id).maybeSingle();
  if (!y || y.trang_thai !== "cho") return { loi: "Yêu cầu này đã được xử lý." };
  if (nd.chiNhanhId && nd.chiNhanhId !== y.chi_nhanh_id) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("yeu_cau_dat_lich").update({ trang_thai: "tu_choi", ly_do: lyDo, xu_ly_boi: nd.nhanVienId, xu_ly_luc: new Date().toISOString() }).eq("id", id).eq("trang_thai", "cho");
  if (error) return { loi: thongBaoLoi(error) };
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "tu_choi_yeu_cau_dat_lich", doi_tuong: "yeu_cau_dat_lich", doi_tuong_id: id, chi_tiet: { ly_do: lyDo } });
  lamMoi();
  return { ok: true };
}

/** Gợi ý khung giờ trống cho hộp Đặt lịch (SalonHero: "Chọn tham khảo các khung giờ sau"). Mốc cách nhau 30 phút trong giờ mở cửa của chi nhánh (giờ riêng hoặc giờ chung).
 *  Có chọn người thực hiện: giờ trống = người đó không có lịch trùng. Không chọn người: giờ trống = số lịch chạy cùng lúc nhỏ hơn số chỗ đang dùng của chi nhánh (như trang đặt lịch online).
 *  Không có cả hai thì chưa có căn cứ lọc: trả mọi mốc trong giờ mở cửa kèm lời nhắn. Chỉ gợi ý, nút Lưu vẫn kiểm trùng giờ người thực hiện. */
export async function khungGioTrong(p: { ngay: string; chiNhanhId: string; nhanVienId: string; phut: number; boQuaLichId?: string }): Promise<{ gio: string[]; ghiChu?: string; loi?: string }> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { gio: [], loi: KHONG_DU_QUYEN };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.ngay)) return { gio: [] };
  const cn = nd.chiNhanhId ?? p.chiNhanhId;
  if (!cn) return { gio: [], ghiChu: "Chọn chi nhánh để xem giờ trống." };
  const phut = Math.min(600, Math.max(5, Math.round(p.phut) || 60));
  const db = sb();
  const dau = new Date(`${p.ngay}T00:00:00${MUI}`).getTime();
  const [{ data: c }, { data: ch }, { data: ls }, { data: cho }] = await Promise.all([
    db.from("chi_nhanh").select("gio_lam_viec").eq("id", cn).maybeSingle(),
    db.from("cua_hang").select("gio_lam_viec").eq("id", 1).maybeSingle(),
    db.from("lich_hen").select("id, bat_dau, ket_thuc, nhan_vien_id").eq("chi_nhanh_id", cn).not("trang_thai", "in", "(huy,khong_den)")
      .lt("bat_dau", new Date(dau + 86400e3).toISOString()).gt("ket_thuc", new Date(dau).toISOString()).limit(2000),
    db.from("cho_lam").select("suc_chua").eq("chi_nhanh_id", cn).eq("hoat_dong", true),
  ]);
  const khoaThu = (["cn", "t2", "t3", "t4", "t5", "t6", "t7"] as const)[thuCuaNgay(p.ngay)];
  const g = gioBaThu(c?.gio_lam_viec, ch?.gio_lam_viec)[khoaThu];
  if (g.nghi) return { gio: [], ghiChu: "Chi nhánh nghỉ ngày này." };
  const phutCua = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const khoang = (ls ?? []).filter((l) => l.id !== p.boQuaLichId).map((l) => ({ bd: (Date.parse(l.bat_dau) - dau) / 60000, kt: (Date.parse(l.ket_thuc) - dau) / 60000, nv: l.nhan_vien_id }));
  const soCho = (cho ?? []).reduce((t, c) => t + (c.suc_chua ?? 1), 0); // như SalonHero: tổng sức chứa (số giường) các chỗ đang dùng
  const bayGio = (Date.now() - dau) / 60000; // ngày hôm nay: bỏ các mốc đã qua
  const gio: string[] = [];
  for (let t = phutCua(g.mo); t + phut <= phutCua(g.dong); t += 30) {
    if (t < bayGio) continue;
    const trung = khoang.filter((k) => k.bd < t + phut && k.kt > t);
    let trong = true;
    if (p.nhanVienId) trong = !trung.some((k) => k.nv === p.nhanVienId);
    else if (soCho > 0) trong = Math.max(0, ...[t, ...trung.map((k) => k.bd).filter((b) => b > t)].map((m) => trung.filter((k) => k.bd <= m && k.kt > m).length)) < soCho;
    if (trong) gio.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  const ghiChu = !p.nhanVienId && soCho === 0 ? "Chưa chọn người thực hiện và chưa có danh mục chỗ nên chưa lọc được giờ bận: đây là các mốc trong giờ mở cửa." : gio.length === 0 ? "Hết giờ trống trong ngày này." : undefined;
  return { gio, ghiChu };
}

/** Dòng thông tin khách trong hộp đặt lịch (SalonHero: "Khách quay lại / được giới thiệu bởi / Mã thẻ"): số lần đã đến (hoá đơn hoàn thành, gồm đơn chuyển từ SalonHero),
 *  người giới thiệu, mã thẻ giấy và mã các thẻ còn dùng được. Người gắn chi nhánh chỉ xem khách chi nhánh mình. */
export async function thongTinKhachDatLich(khachId: string): Promise<{ soLanDen: number; gioiThieu: string; maThe: string[]; coTheLieuTrinh: boolean } | null> {
  const nd = await kiemQuyen("lich.xem");
  if (!nd || !/^[0-9a-f-]{36}$/i.test(khachId)) return null;
  const db = sb();
  const [{ data: k }, { count }, { data: the }] = await Promise.all([
    db.from("khach_hang").select("chi_nhanh_id, nguoi_gioi_thieu_id, ma_the_giay, so_lan_den_goc").eq("id", khachId).maybeSingle(),
    db.from("hoa_don").select("id", { count: "exact", head: true }).eq("khach_id", khachId).eq("trang_thai", "hoan_thanh").eq("la_so_du_dau", false),
    db.from("v_the_khach").select("ma, loai, so_buoi_con").eq("khach_id", khachId).in("tinh_trang", ["hoat_dong", "sap_het"]).order("ngay_cap", { ascending: false }).limit(20),
  ]);
  if (!k || (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId)) return null;
  const gt = k.nguoi_gioi_thieu_id ? (await db.from("khach_hang").select("ma, ho_ten").eq("id", k.nguoi_gioi_thieu_id).maybeSingle()).data : null;
  return {
    soLanDen: Math.max(count ?? 0, Number(k.so_lan_den_goc ?? 0)),
    gioiThieu: gt ? `${gt.ho_ten}${gt.ma ? ` (${gt.ma})` : ""}` : "",
    maThe: [...new Set([k.ma_the_giay, ...(the ?? []).slice(0, 5).map((t) => t.ma as string)].filter((x): x is string => !!x))],
    coTheLieuTrinh: (the ?? []).some((t) => t.loai === "lan" && Number(t.so_buoi_con ?? 0) > 0),
  };
}

/** Lịch sử sửa của một lịch hẹn (khung chi tiết): chỉ Chủ, Kỹ thuật, Quản lý / Leader. */
export async function lichSuSuaLich(lichId: string) {
  const nd = await kiemQuyen("lich.xem");
  if (!nd || !laQuanLyLich(nd.vaiTro) || !/^[0-9a-f-]{36}$/i.test(lichId)) return null;
  const { data } = await sb().from("lich_hen_lich_su").select("id, luc, nguoi_ten, hanh_dong, thay_doi, chi_nhanh_id").eq("lich_id", lichId).order("luc", { ascending: false }).limit(50);
  return (data ?? []).filter((r) => !nd.chiNhanhId || r.chi_nhanh_id === nd.chiNhanhId);
}

/** Gán nhóm khách hàng cho khách vừa tạo ở hộp đặt lịch (SalonHero: ô "Nhóm khách hàng" khi tạo khách). */
export async function ganNhomKhachMoi(khachId: string, nhomIds: string[]): Promise<KQ> {
  const nd = await kiemQuyen("khach.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ids = [...new Set(nhomIds)].filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 30);
  if (!ids.length || !/^[0-9a-f-]{36}$/i.test(khachId)) return { ok: true };
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("chi_nhanh_id").eq("id", khachId).maybeSingle();
  if (!k || (nd.chiNhanhId && k.chi_nhanh_id !== nd.chiNhanhId)) return { loi: KHONG_DU_QUYEN };
  const { error } = await db.from("khach_nhom").upsert(ids.map((n) => ({ khach_id: khachId, nhom_id: n })), { onConflict: "khach_id,nhom_id", ignoreDuplicates: true });
  return error ? { loi: thongBaoLoi(error) } : { ok: true };
}
