"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { guiChoNhanVien } from "@/lib/push";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi, chuoiHoacNull, mang, so } from "@/lib/form";
import { ngayVN } from "@/lib/dinh-dang";
import { laKieuLap, ngayLap, TOI_DA_BUOI_LAP } from "@/lib/lich-hen";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/lich-hen");
const MUI = "+07:00";

export async function luuLichHen(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("lich.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const id = chuoi(fd, "id");
  const khachId = chuoi(fd, "khach_id");
  const ngay = chuoi(fd, "ngay");
  const gio = chuoi(fd, "gio");
  const dv = mang(fd, "dich_vu_ids");
  if (!khachId) return { loi: "Chọn khách hàng." };
  // Tài khoản gắn chi nhánh chỉ đặt/sửa lịch của chi nhánh mình, khách và lịch cũ cũng phải thuộc chi nhánh đó (chỉ vai Chủ/không gắn chi nhánh mới xuyên chi nhánh).
  if (nd.chiNhanhId) {
    const { data: k } = await db.from("khach_hang").select("chi_nhanh_id").eq("id", khachId).maybeSingle();
    if (!k || k.chi_nhanh_id !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
    if (id) {
      const { data: cu } = await db.from("lich_hen").select("chi_nhanh_id").eq("id", id).maybeSingle();
      if (!cu || cu.chi_nhanh_id !== nd.chiNhanhId) return { loi: KHONG_DU_QUYEN };
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) return { loi: "Chọn ngày và giờ hẹn." };
  if (dv.length === 0) return { loi: "Chọn ít nhất một dịch vụ." };
  const phut = so(fd, "thoi_luong") || 60;
  if (phut < 5 || phut > 600) return { loi: "Thời lượng phải từ 5 đến 600 phút." };
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
  if (nv) {
    // Một truy vấn cho cả chuỗi: lấy lịch của người này trong khoảng từ buổi đầu đến buổi cuối rồi so từng buổi.
    let q = db.from("lich_hen").select("id, bat_dau, ket_thuc").eq("nhan_vien_id", nv).not("trang_thai", "in", "(huy,khong_den)")
      .lt("bat_dau", buoi[buoi.length - 1].kt.toISOString()).gt("ket_thuc", buoi[0].bd.toISOString());
    if (id) q = q.neq("id", id);
    const { data: trung } = await q.limit(1000);
    const vuong = buoi.findIndex((b) => (trung ?? []).some((t) => new Date(t.bat_dau) < b.kt && new Date(t.ket_thuc) > b.bd));
    if (vuong >= 0) return { loi: `Nhân viên này đã có lịch trùng giờ${buoi.length > 1 ? ` vào ngày ${ngayVN(cacNgay[vuong])}` : ""}. Chọn giờ khác hoặc người khác.` };
  }
  const row = { khach_id: khachId, chi_nhanh_id: nd.chiNhanhId ?? chuoi(fd, "chi_nhanh_id"), nhan_vien_id: nv, phong: chuoiHoacNull(fd, "phong"), nguon: chuoiHoacNull(fd, "nguon"), ghi_chu: chuoiHoacNull(fd, "ghi_chu") };
  if (!row.chi_nhanh_id) return { loi: "Chọn chi nhánh." };
  let ids: string[];
  if (id) {
    const { error } = await db.from("lich_hen").update({ ...row, bat_dau: buoi[0].bd.toISOString(), ket_thuc: buoi[0].kt.toISOString(), cap_nhat_luc: new Date().toISOString() }).eq("id", id).in("trang_thai", ["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"]);
    if (error) return { loi: thongBaoLoi(error) };
    ids = [id];
  } else {
    const nhom = buoi.length > 1 ? crypto.randomUUID() : null;
    const { data, error } = await db.from("lich_hen").insert(buoi.map((b, i) => ({
      ...row, bat_dau: b.bd.toISOString(), ket_thuc: b.kt.toISOString(), tao_boi: nd.nhanVienId,
      ...(nhom ? { kieu_lap: kieuLap, lap_nhom: nhom, lap_khoang: khoang, lap_tong: buoi.length, lap_thu_tu: i + 1 } : {}),
    }))).select("id");
    if (error || !data?.length) return { loi: thongBaoLoi(error) };
    ids = data.map((x) => x.id);
  }
  if (id) await db.from("lich_hen_dich_vu").delete().eq("lich_id", id);
  await db.from("lich_hen_dich_vu").insert(ids.flatMap((l) => dv.map((d) => ({ lich_id: l, dich_vu_id: d }))));
  // Báo cho người được giao lịch (trừ khi chính họ vừa tạo), một lần cho cả chuỗi. Gửi sau khi trả lời để không làm chậm màn hình.
  if (nv && nv !== nd.nhanVienId) {
    after(async () => {
      const { data: k } = await db.from("khach_hang").select("ho_ten").eq("id", khachId).maybeSingle();
      const them = ids.length > 1 ? ` · lặp ${ids.length} buổi` : "";
      await guiChoNhanVien([nv], { tieuDe: id ? "Lịch hẹn đã đổi giờ" : "Có lịch hẹn mới được giao", noiDung: `${gio} ngày ${ngay.split("-").reverse().join("/")} · ${k?.ho_ten ?? "khách"}${them}`, url: "/lich-hen", tag: `lich-${ids[0]}` });
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
  const { error } = await db.from("lich_hen").update({ trang_thai: moi, ly_do_huy: moi === "huy" ? chuoi(fd, "ly_do") : null, cap_nhat_luc: new Date().toISOString() }).eq("id", id);
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
  const { error } = await db.rpc("duyet_yeu_cau_dat_lich", { p_id: id, p_nguoi: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
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
