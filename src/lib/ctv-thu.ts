import "server-only";
import { sb } from "@/lib/db";
import { coCauHinhThu, guiThu } from "@/lib/gui-thu";
import { tienVN } from "@/lib/dinh-dang";

/** Thư gửi CTV (migration 0317, BeDental "Thông báo email" 10 loại). Bộ gửi đặt sau một giao diện: hiện là SMTP (src/lib/gui-thu.ts, biến SMTP_*);
 *  muốn đổi sang dịch vụ khác (Resend, Lark Mail API…) chỉ cần viết BoGuiThu mới. Chưa cấu hình → không gửi được, nhật ký ghi "Chưa cấu hình".
 *  Nội dung KHÔNG có tên dịch vụ, tên khách đã che (che sẵn trong DB), không chứa thông tin y khoa. Xưng "anh/chị". */
export type BoGuiThu = { coCauHinh(): boolean; gui(den: string, tieuDe: string, chu: string, html: string): Promise<boolean> };
export const boGuiSmtp: BoGuiThu = { coCauHinh: coCauHinhThu, gui: guiThu };

export const LOAI_THU_CTV: { ma: string; ten: string; sau?: true; batBuoc?: true }[] = [
  { ma: "da_dat_hen", ten: "Người anh/chị giới thiệu đã đặt hẹn" },
  { ma: "da_thanh_toan_hh", ten: "Đã thanh toán hoa hồng" },
  { ma: "cap_nhat_hh", ten: "Cập nhật hoa hồng (gộp, gửi 20:00)" },
  { ma: "chao_mung", ten: "Chào mừng đối tác mới" },
  { ma: "thay_doi_tuyen_tren", ten: "Thay đổi quan hệ tuyến trên", sau: true },
  { ma: "loi_moi_tuyen_duoi", ten: "Lời mời làm tuyến dưới", sau: true },
  { ma: "khach_dang_ky_doi_tac", ten: "Khách anh/chị giới thiệu đã đăng ký đối tác", sau: true },
  { ma: "da_huy", ten: "Người anh/chị giới thiệu đã huỷ hẹn" },
  { ma: "da_su_dung", ten: "Người anh/chị giới thiệu đã sử dụng dịch vụ" },
  { ma: "ma_dang_nhap", ten: "Mã đăng nhập / xác thực cổng CTV", batBuoc: true },
];
export const TT_THU: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho: { ten: "Chờ gửi", kieu: "cho" }, da_gui: { ten: "Đã gửi", kieu: "tot" }, bo_qua: { ten: "Bỏ qua", kieu: "tram" }, chua_cau_hinh: { ten: "Chưa cấu hình gửi email", kieu: "loi" }, loi: { ten: "Lỗi gửi", kieu: "loi" },
};

const GOC = (process.env.NEXT_PUBLIC_SITE_URL || "https://lammec.mscvn.com").replace(/\/$/, "");
const CHAN = "AMIA · Phòng khám da liễu · Tiên phong công nghệ cao\n39A Lê Hồng Phong, TP. Vinh · GP 1233/NA-GPHĐ";
const thoat = (s: string) => s.replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[x] as string);
function html(dong: string[]) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#0a2b26;max-width:520px">${dong.map((d) => `<p style="margin:0 0 10px">${thoat(d).replace(/\n/g, "<br>")}</p>`).join("")}`
    + `<p style="margin:18px 0 0;font-size:12px;color:#6b7c78">${thoat(CHAN).replace(/\n/g, "<br>")}</p></div>`;
}
type DuLieu = { ten?: string; ngay?: string; ma?: string; so_tien?: number; so_don?: number; hinh_thuc?: string };

/** Tiêu đề + nội dung từng loại thư sự kiện. */
export function soanThu(loai: string, d: DuLieu): { tieuDe: string; dong: string[] } | null {
  const cong = `Xem chi tiết ở Cổng CTV: ${GOC}/ctv`;
  switch (loai) {
    case "chao_mung": return { tieuDe: "Chào mừng anh/chị trở thành đối tác của AMIA", dong: [`Chào ${d.ten ?? "anh/chị"},`, "Cảm ơn anh/chị đã đăng ký đối tác giới thiệu của AMIA. Mã giới thiệu của anh/chị là số điện thoại đã đăng ký.", "Khi người thân, người quen đặt hẹn qua link hoặc mã QR của anh/chị và sử dụng dịch vụ, hoa hồng được ghi nhận tự động.", cong] };
    case "da_dat_hen": return { tieuDe: "Người anh/chị giới thiệu đã đặt hẹn", dong: ["Chào anh/chị,", `Khách ${d.ten ?? ""} vừa đặt hẹn ngày ${d.ngay ?? ""} qua link giới thiệu của anh/chị.`, cong] };
    case "da_huy": return { tieuDe: "Lịch hẹn của người anh/chị giới thiệu đã huỷ", dong: ["Chào anh/chị,", `Lịch hẹn ngày ${d.ngay ?? ""} của khách ${d.ten ?? ""} đã được huỷ.`, cong] };
    case "da_su_dung": return { tieuDe: "Người anh/chị giới thiệu đã đến phòng khám", dong: ["Chào anh/chị,", `Khách ${d.ten ?? ""} đã đến phòng khám theo lịch ngày ${d.ngay ?? ""}. Hoa hồng (nếu có) được ghi nhận khi hoá đơn hoàn tất.`, cong] };
    case "da_thanh_toan_hh": return { tieuDe: `AMIA đã thanh toán hoa hồng ${d.ma ?? ""}`, dong: ["Chào anh/chị,", `AMIA đã chi ${tienVN(Number(d.so_tien ?? 0))} hoa hồng cho yêu cầu ${d.ma ?? ""} (${d.hinh_thuc === "chuyen_khoan" ? "chuyển khoản" : "tiền mặt tại phòng khám"}).`, cong] };
    case "cap_nhat_hh": return { tieuDe: `Cập nhật hoa hồng ngày ${d.ngay ?? ""}`, dong: ["Chào anh/chị,", `Ngày ${d.ngay ?? ""} có ${d.so_don ?? 0} hoá đơn ghi nhận hoa hồng cho anh/chị, tổng ${tienVN(Number(d.so_tien ?? 0))} (đã tính cả điều chỉnh nếu có).`, cong] };
    default: return null;
  }
}

/** Gửi mã xác thực ngay (không xếp hàng, không lưu mã ở đâu); nhật ký chỉ ghi loại + trạng thái. */
export async function guiMaXacThuc(den: string, ma: string, mucDich: "dang_ky" | "dang_nhap" | "rut_hh", dt: string | null, bo: BoGuiThu = boGuiSmtp): Promise<boolean> {
  const viec = mucDich === "dang_ky" ? "đăng ký đối tác" : mucDich === "dang_nhap" ? "đăng nhập Cổng CTV" : "xác nhận yêu cầu thanh toán hoa hồng";
  const han = mucDich === "rut_hh" ? 5 : 10;
  const dong = ["Chào anh/chị,", `Mã ${viec} AMIA của anh/chị là: ${ma}`, `Mã có hiệu lực ${han} phút. Không chia sẻ mã này cho bất kỳ ai, kể cả người tự xưng là nhân viên phòng khám.`, "Nếu anh/chị không yêu cầu mã, vui lòng bỏ qua thư này."];
  const db = sb();
  const { data: bat } = await db.from("cau_hinh").select("gia_tri").eq("khoa", "ctv.email.ma_dang_nhap").maybeSingle();
  let tt = "da_gui", ly: string | null = null;
  if ((bat?.gia_tri ?? "1") !== "1") { tt = "bo_qua"; ly = "Loại thư đang tắt"; }
  else if (!bo.coCauHinh()) { tt = "chua_cau_hinh"; ly = "Máy chủ chưa cấu hình gửi email"; }
  else if (!(await bo.gui(den, `${ma} là mã ${viec} AMIA`, `${dong.join("\n")}\n\n${CHAN}`, html(dong)))) { tt = "loi"; ly = "Máy gửi thư báo lỗi"; }
  await db.from("ctv_thu").insert({ doi_tac_id: dt, loai: "ma_dang_nhap", den, du_lieu: { muc_dich: mucDich }, trang_thai: tt, ly_do: ly, so_lan_gui: tt === "bo_qua" ? 0 : 1, gui_luc: tt === "da_gui" ? new Date().toISOString() : null });
  return tt === "da_gui";
}

/** Gửi các thư đang chờ (gọi từ /api/cron/ctv-thu). Chưa cấu hình gửi email → giữ "Chờ gửi"; thư chờ quá 24 giờ thì bỏ (tin cũ không còn ý nghĩa). */
export async function xuLyHangDoiThuCtv(bo: BoGuiThu = boGuiSmtp, gioiHan = 50): Promise<{ daGui: number; loi: number; boQua: number; chuaCauHinh: boolean }> {
  const db = sb();
  const moc = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: cu } = await db.from("ctv_thu").update({ trang_thai: "bo_qua", ly_do: "Quá 24 giờ chưa gửi được" }).eq("trang_thai", "cho").lt("tao_luc", moc).select("id");
  if (!bo.coCauHinh()) return { daGui: 0, loi: 0, boQua: cu?.length ?? 0, chuaCauHinh: true };
  const { data: ds } = await db.from("ctv_thu").select("id, loai, den, du_lieu, so_lan_gui").eq("trang_thai", "cho").order("tao_luc").limit(gioiHan);
  let daGui = 0, loi = 0;
  for (const t of ds ?? []) {
    const thu = soanThu(t.loai, (t.du_lieu ?? {}) as DuLieu);
    if (!thu || !t.den) { await db.from("ctv_thu").update({ trang_thai: "bo_qua", ly_do: "Không có mẫu thư / địa chỉ" }).eq("id", t.id); continue; }
    const ok = await bo.gui(t.den, thu.tieuDe, `${thu.dong.join("\n")}\n\n${CHAN}`, html(thu.dong));
    const lan = t.so_lan_gui + 1;
    await db.from("ctv_thu").update(ok ? { trang_thai: "da_gui", gui_luc: new Date().toISOString(), so_lan_gui: lan } : { trang_thai: lan >= 3 ? "loi" : "cho", ly_do: "Máy gửi thư báo lỗi", so_lan_gui: lan }).eq("id", t.id);
    if (ok) daGui++; else loi++;
  }
  return { daGui, loi, boQua: cu?.length ?? 0, chuaCauHinh: false };
}
