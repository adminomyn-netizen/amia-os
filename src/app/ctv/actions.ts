"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sb, thongBaoLoi } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { coCauHinhThu } from "@/lib/gui-thu";
import { chuanMaRef, cheEmail } from "@/lib/ctv";
import { bamMa, bangNhau, soMa } from "@/lib/ctv-ky";
import { datPhienCtv, ipBamCtv, khoaCtv, layCtv, xoaPhienCtv } from "@/lib/ctv-phien";
import { guiMaXacThuc } from "@/lib/ctv-thu";

/** CỔNG CTV CÔNG KHAI — mọi hàm ở đây là cửa mở ra Internet.
 *  - Mã 6 số: chỉ lưu HMAC băm; giới hạn gửi (SĐT/email/IP/toàn hệ thống) + 5 lần nhập + dùng 1 lần nằm trong hàm Postgres (0317); so băm hằng thời gian ở đây.
 *  - Không lộ SĐT nào đã đăng ký: đăng nhập luôn trả cùng một câu, thư gửi sau khi đã trả lời (after) nên thời gian phản hồi như nhau.
 *  - Sau khi đăng nhập: mọi đọc/ghi lấy doi_tac_id từ phiên đã ký (layCtv), KHÔNG BAO GIỜ từ form. */
export type KQMa = { buoc?: "ma"; sdt?: string; email?: string; loi?: string; ok?: true; ref?: string };
type KQ = { ok?: true; loi?: string; thongBao?: string };
const MA = /^\d{6}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SAI_MA = "Mã không đúng hoặc đã hết hạn. Anh/chị kiểm tra lại hoặc gửi mã mới.";
const CHUA_GUI_DUOC = "Hiện phòng khám chưa bật gửi email xác thực. Anh/chị vui lòng liên hệ phòng khám, hoặc thử lại sau.";

/** So mã người dùng nhập với mã đang hiệu lực (mỗi lần gọi trừ 1 lượt thử trong DB), đúng thì đánh dấu đã dùng. Trả về dòng mã hoặc null. */
async function kiemMa(mucDich: "dang_ky" | "dang_nhap" | "rut_hh", sdt: string, ma: string) {
  const khoa = khoaCtv();
  if (!khoa || !MA.test(ma)) return null;
  const db = sb();
  const { data } = await db.rpc("ctv_ma_thu", { p_muc_dich: mucDich, p_sdt: sdt });
  const r = data?.[0];
  const bam = bamMa(khoa, mucDich, sdt, ma);
  if (!r || !bangNhau(bam, r.ma_bam)) return null;
  const { data: dung } = await db.rpc("ctv_ma_dung", { p_id: r.id });
  return dung ? r : null;
}

// ── Đăng ký ────────────────────────────────────────────────────────────────
export async function guiMaDangKy(_: KQMa | undefined, fd: FormData): Promise<KQMa> {
  if (chuoi(fd, "website") !== "") return { buoc: "ma", sdt: "", email: "" }; // ô bẫy
  const ten = chuoi(fd, "ho_ten").replace(/\s+/g, " "), sdt = chuanMaRef(chuoi(fd, "dien_thoai")), email = chuoi(fd, "email").toLowerCase();
  if (ten.length < 2 || ten.length > 80) return { loi: "Vui lòng nhập họ tên (2–80 ký tự)." };
  if (!sdt) return { loi: "Số điện thoại di động gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09." };
  if (!EMAIL.test(email) || email.length > 120) return { loi: "Email chưa đúng." };
  if (fd.get("dong_y") !== "1") return { loi: "Anh/chị cần đồng ý Điều khoản chương trình và Chính sách bảo mật." };
  const khoa = khoaCtv();
  if (!khoa || !coCauHinhThu()) return { loi: CHUA_GUI_DUOC };
  const ma = soMa();
  const { data, error } = await sb().rpc("ctv_ma_tao", {
    p_muc_dich: "dang_ky", p_sdt: sdt, p_email: email, p_ma_bam: bamMa(khoa, "dang_ky", sdt, ma), p_ip_bam: await ipBamCtv(),
    p_du_lieu: { ho_ten: ten, dong_y_luc: new Date().toISOString() },
  });
  if (error || !data) return { loi: thongBaoLoi(error) || "Chưa gửi được mã. Vui lòng thử lại." };
  if (!(await guiMaXacThuc(email, ma, "dang_ky", null))) return { loi: "Chưa gửi được thư chứa mã. Anh/chị kiểm tra lại email hoặc thử lại sau ít phút." };
  return { buoc: "ma", sdt, email: cheEmail(email) };
}

export async function xacNhanDangKy(_: KQMa | undefined, fd: FormData): Promise<KQMa> {
  const sdt = chuanMaRef(chuoi(fd, "sdt")), ma = chuoi(fd, "ma").replace(/\D/g, "");
  if (!sdt) return { loi: SAI_MA };
  const m = await kiemMa("dang_ky", sdt, ma);
  if (!m) return { buoc: "ma", sdt, email: chuoi(fd, "email_che"), loi: SAI_MA };
  const { data, error } = await sb().rpc("ctv_tu_dang_ky", { p_ma_id: m.id });
  if (error || !data) return { loi: thongBaoLoi(error) || "Chưa đăng ký được. Vui lòng thử lại." };
  const kq = data as { id: string; ma_ref: string; phien_ver: number };
  await datPhienCtv(kq.id, kq.phien_ver);
  after(async () => { await sb().from("nhat_ky_truy_cap").insert({ hanh_dong: "ctv_tu_dang_ky", doi_tuong: "doi_tac_gt", doi_tuong_id: kq.id, chi_tiet: { qua: "cong_ctv" } }); });
  return { ok: true, ref: kq.ma_ref };
}

// ── Đăng nhập ──────────────────────────────────────────────────────────────
export async function guiMaDangNhap(_: KQMa | undefined, fd: FormData): Promise<KQMa> {
  if (chuoi(fd, "website") !== "") return { buoc: "ma", sdt: "" };
  const sdt = chuanMaRef(chuoi(fd, "dien_thoai"));
  if (!sdt) return { loi: "Số điện thoại di động gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09." };
  const khoa = khoaCtv();
  if (!khoa || !coCauHinhThu()) return { loi: CHUA_GUI_DUOC };
  const ma = soMa();
  const { data, error } = await sb().rpc("ctv_ma_tao", { p_muc_dich: "dang_nhap", p_sdt: sdt, p_email: null, p_ma_bam: bamMa(khoa, "dang_nhap", sdt, ma), p_ip_bam: await ipBamCtv() });
  if (error || !data) return { loi: thongBaoLoi(error) || "Chưa gửi được mã. Vui lòng thử lại." };
  const r = data as { gui: boolean; email: string | null; doi_tac_id: string | null };
  if (r.gui && r.email) { const den = r.email, dt = r.doi_tac_id; after(() => guiMaXacThuc(den, ma, "dang_nhap", dt).then(() => undefined)); }
  return { buoc: "ma", sdt };
}

export async function xacNhanDangNhap(_: KQMa | undefined, fd: FormData): Promise<KQMa> {
  const sdt = chuanMaRef(chuoi(fd, "sdt")), ma = chuoi(fd, "ma").replace(/\D/g, "");
  if (!sdt) return { loi: SAI_MA };
  const m = await kiemMa("dang_nhap", sdt, ma);
  if (!m?.doi_tac_id) return { buoc: "ma", sdt, loi: SAI_MA };
  const { data: d } = await sb().from("doi_tac_gt").select("id, phien_ver, hoat_dong, ma_ref").eq("id", m.doi_tac_id).maybeSingle();
  if (!d || !d.hoat_dong || d.ma_ref !== sdt) return { buoc: "ma", sdt, loi: SAI_MA };
  await datPhienCtv(d.id, d.phien_ver);
  return { ok: true };
}

export async function dangXuatCtv(): Promise<void> {
  await xoaPhienCtv();
  revalidatePath("/ctv");
}

/** Đăng xuất mọi thiết bị: tăng phiên bản phiên → mọi cookie cũ hết hiệu lực. */
export async function dangXuatMoiNoi(): Promise<void> {
  const ctv = await layCtv();
  if (ctv) await sb().from("doi_tac_gt").update({ phien_ver: ctv.phien_ver + 1 }).eq("id", ctv.id).eq("phien_ver", ctv.phien_ver);
  await xoaPhienCtv();
  revalidatePath("/ctv");
}

// ── Sau đăng nhập ──────────────────────────────────────────────────────────
export async function luuHoSoCtv(_: KQ | undefined, fd: FormData): Promise<KQ> {
  const ctv = await layCtv();
  if (!ctv) return { loi: "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại." };
  const ten = chuoi(fd, "ten_hien_thi").replace(/\s+/g, " ");
  if (ten.length > 80) return { loi: "Tên hiển thị tối đa 80 ký tự." };
  const { error } = await sb().from("doi_tac_gt").update({ ten_hien_thi: ten || null, gui_email: fd.get("gui_email") === "1" && !!ctv.email }).eq("id", ctv.id);
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/ctv");
  return { ok: true, thongBao: "Đã lưu hồ sơ." };
}

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
export async function guiKhieuNaiCtv(_: KQ | undefined, fd: FormData): Promise<KQ> {
  const ctv = await layCtv();
  if (!ctv) return { loi: "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại." };
  const tu = chuoi(fd, "tu"), den = chuoi(fd, "den");
  if (!NGAY.test(tu) || !NGAY.test(den)) return { loi: "Kỳ đối soát không hợp lệ." };
  const { error } = await sb().rpc("ctv_khieu_nai_gui", { p_dt: ctv.id, p_tu: tu, p_den: den, p_ma_hd: chuoi(fd, "ma_hd").slice(0, 40) || null, p_noi_dung: chuoi(fd, "noi_dung").slice(0, 1000) });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/ctv");
  return { ok: true, thongBao: "Đã gửi khiếu nại. Phòng khám sẽ kiểm tra và phản hồi trong cổng." };
}

/** Bước 1 yêu cầu thanh toán: gửi mã 5 phút tới email của chính CTV. */
export async function guiMaRutCtv(_: KQMa | undefined): Promise<KQMa> {
  const ctv = await layCtv();
  if (!ctv) return { loi: "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại." };
  const khoa = khoaCtv();
  if (!ctv.email) return { loi: "Tài khoản chưa có email nhận mã. Vui lòng liên hệ phòng khám." };
  if (!khoa || !coCauHinhThu()) return { loi: CHUA_GUI_DUOC };
  const ma = soMa();
  const { error } = await sb().rpc("ctv_ma_tao", { p_muc_dich: "rut_hh", p_sdt: ctv.ma_ref, p_email: null, p_ma_bam: bamMa(khoa, "rut_hh", ctv.ma_ref, ma), p_ip_bam: await ipBamCtv(), p_dt: ctv.id });
  if (error) return { loi: thongBaoLoi(error) };
  if (!(await guiMaXacThuc(ctv.email, ma, "rut_hh", ctv.id))) return { loi: "Chưa gửi được thư chứa mã. Vui lòng thử lại sau ít phút." };
  return { buoc: "ma", email: cheEmail(ctv.email) };
}

/** Bước 2: nhập mã + thông tin nhận tiền → yêu cầu chi trả (cùng quy tắc rut_hh_tao: tối thiểu, số dư, một yêu cầu một lúc). */
export async function taoYeuCauRutCtv(_: KQ | undefined, fd: FormData): Promise<KQ> {
  const ctv = await layCtv();
  if (!ctv) return { loi: "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại." };
  const tien = Math.round(Number(chuoi(fd, "so_tien").replace(/\D/g, "")));
  const hinhThuc = chuoi(fd, "hinh_thuc") === "chuyen_khoan" ? "chuyen_khoan" : "tien_mat";
  const nh = chuoi(fd, "ngan_hang").slice(0, 80), tk = chuoi(fd, "so_tk").replace(/\s/g, "").slice(0, 30), chu = chuoi(fd, "ten_chu_tk").slice(0, 80);
  if (!Number.isFinite(tien) || tien <= 0) return { loi: "Nhập số tiền muốn nhận." };
  if (hinhThuc === "chuyen_khoan" && (!nh || !/^\d{4,30}$/.test(tk) || !chu)) return { loi: "Nhập đủ ngân hàng, số tài khoản (chỉ số) và tên chủ tài khoản." };
  const m = await kiemMa("rut_hh", ctv.ma_ref, chuoi(fd, "ma").replace(/\D/g, ""));
  if (!m || m.doi_tac_id !== ctv.id) return { loi: SAI_MA };
  const { error } = await sb().rpc("rut_hh_tao_ctv", {
    p_dt: ctv.id, p_so_tien: tien, p_hinh_thuc: hinhThuc, p_ngan_hang: hinhThuc === "chuyen_khoan" ? nh : null, p_so_tk: hinhThuc === "chuyen_khoan" ? tk : null,
    p_ten_chu_tk: hinhThuc === "chuyen_khoan" ? chu : null, p_ghi_chu: chuoi(fd, "ghi_chu").slice(0, 300) || null,
  });
  if (error) return { loi: thongBaoLoi(error) };
  revalidatePath("/ctv");
  revalidatePath("/marketing/doi-tac");
  return { ok: true, thongBao: "Đã gửi yêu cầu thanh toán. Phòng khám sẽ duyệt và báo khi đã chi." };
}
