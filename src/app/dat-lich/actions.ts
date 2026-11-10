"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { sb, thongBaoLoi } from "@/lib/db";
import { nguoiCoQuyen, guiChoNhanVien } from "@/lib/push";
import { coCauHinhThu, guiThu } from "@/lib/gui-thu";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { NOI_DAT_LICH } from "@/lib/ban-hang";
import { layWebDatLich, thoiLuongMacDinh, type WebDatLich } from "@/lib/web-dat-lich";

/** TRANG CÔNG KHAI (không đăng nhập): mọi hàm ở đây là cửa mở ra Internet — chỉ gọi hàm Postgres đã kiểm đầu vào/giới hạn (dat_lich_online, khung_gio_online — migration 0270). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
export type KhungGio = { gio: string; con: boolean };
export type KQGio = { gio: KhungGio[]; loi?: string };
export type DaDat = { gio: string; ngay: string; ten: string; sdt: string; diaChi: string; dichVu: string[]; nguoiLam: string };
export type KQGui = { ok?: true; loi?: string; daDat?: DaDat };

/** Trang mở bằng link giới thiệu: ghi một lượt ghé (mỗi IP băm 1 lần/ngày, trong DB) và lấy tên hiển thị người giới thiệu. REF sai → null. */
export async function traGioiThieu(ref: string): Promise<{ ref: string; ten: string } | null> {
  const r = ref.trim();
  if (!/^[0-9A-Za-z+ ]{3,30}$/.test(r)) return null;
  const { data } = await sb().rpc("ghi_luot_ghe_ref", { p_ref: r, p_ip_bam: await dauVetIp() });
  const ten = (data as { ten?: string } | null)?.ten;
  return ten ? { ref: r, ten } : null;
}

/** Băm IP + muối bí mật: đủ để đếm giới hạn theo IP mà không lưu IP thật. */
async function dauVetIp() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "khong-ro";
  return createHash("sha256").update(`${ip}|${process.env.CRON_SECRET ?? "amia"}`).digest("hex").slice(0, 40);
}
const danhSachId = (v: string) => v.split(",").filter(Boolean);
/** Dịch vụ khách được chọn ở chi nhánh này: đang hoạt động, bật đặt online, nơi hiển thị có đặt lịch, có cung cấp ở chi nhánh (null = mọi chi nhánh). cn đã kiểm là UUID. */
const dvDatDuoc = (cn: string, ids: string[]) => sb().from("dich_vu").select("id, ten, thoi_luong_phut").in("id", ids).eq("hoat_dong", true).eq("dat_online", true)
  .in("noi_hien_thi", NOI_DAT_LICH).or(`chi_nhanh_ids.is.null,chi_nhanh_ids.eq.{},chi_nhanh_ids.cs.{${cn}}`);

/** Thời lượng lịch: tổng dịch vụ đã chọn (chỉ khi cài đặt bật "Hiện thị thông tin dịch vụ"), không thì thời lượng mặc định. Trả null nếu có dịch vụ không hợp lệ. */
async function thoiLuong(web: WebDatLich, cn: string, dv: string[]): Promise<{ phut: number; ten: string[] } | null> {
  if (!web.hienDvSp || dv.length === 0) return { phut: thoiLuongMacDinh(web), ten: [] };
  if (dv.length > 5 || !dv.every((d) => UUID.test(d))) return null;
  const { data } = await dvDatDuoc(cn, dv);
  if (!data || data.length !== new Set(dv).size) return null;
  return { phut: Math.max(5, data.reduce((a, d) => a + d.thoi_luong_phut, 0)), ten: data.map((d) => d.ten) };
}

/** Mọi khung giờ của một ngày (còn chỗ / hết chỗ) cho lựa chọn hiện tại. Chỉ đọc; đầu vào sai thì trả rỗng. */
export async function layKhungGio(cn: string, ngay: string, dichVuIds: string[], soKhach: number, nhanVien: string): Promise<KQGio> {
  if (!UUID.test(cn) || !NGAY.test(ngay) || !Number.isInteger(soKhach) || soKhach < 1 || soKhach > 20) return { gio: [] };
  if (nhanVien && !UUID.test(nhanVien)) return { gio: [] };
  if (ngay < homNayHCM() || ngay > congNgay(homNayHCM(), 61)) return { gio: [] };
  const db = sb();
  const web = await layWebDatLich(db);
  const tl = await thoiLuong(web, cn, dichVuIds);
  if (!tl) return { gio: [], loi: "Có dịch vụ chưa nhận đặt online ở chi nhánh này." };
  const { data, error } = await db.rpc("khung_gio_online", { p_cn: cn, p_ngay: ngay, p_phut: tl.phut, p_so_khach: soKhach, ...(web.chonKtv && nhanVien ? { p_nv: nhanVien } : {}) });
  if (error) return { gio: [], loi: thongBaoLoi(error) };
  return { gio: (data ?? []).map((k) => ({ gio: k.gio, con: k.con_cho })) };
}

/** Khách bấm "Đặt lịch hẹn": hàm Postgres tạo lịch hẹn ngay (trạng thái theo cài đặt), tạo khách nếu SĐT mới. Chống lạm dụng: ô bẫy, thời gian điền tối thiểu, giới hạn SĐT/IP trong DB. Không bao giờ nói SĐT đã là khách hay chưa. */
export async function datLichOnline(_: KQGui | undefined, fd: FormData): Promise<KQGui> {
  const chuoi = (k: string) => String(fd.get(k) ?? "").slice(0, 400);
  if (chuoi("website") !== "") return { ok: true }; // ô bẫy: bot điền → giả vờ thành công, không ghi gì
  const batDauForm = Number(chuoi("mo_luc"));
  if (!Number.isFinite(batDauForm) || Date.now() - batDauForm < 2500) return { loi: "Quý khách thao tác quá nhanh. Vui lòng kiểm tra lại và gửi lần nữa." };
  const cn = chuoi("chi_nhanh_id"), ngay = chuoi("ngay"), gio = chuoi("gio"), dv = danhSachId(chuoi("dich_vu_ids")), nv = chuoi("nhan_vien_id");
  const soKhach = Number(chuoi("so_khach") || "1");
  if (!UUID.test(cn)) return { loi: "Vui lòng chọn địa điểm." };
  if (!NGAY.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) return { loi: "Vui lòng chọn thời gian đặt lịch." };
  if (nv && !UUID.test(nv)) return { loi: "Người làm không hợp lệ." };
  const db = sb();
  const web = await layWebDatLich(db);
  const tl = await thoiLuong(web, cn, dv);
  if (!tl) return { loi: "Có dịch vụ chưa nhận đặt online ở chi nhánh này. Vui lòng chọn lại." };
  const { data, error } = await db.rpc("dat_lich_online", {
    p_cn: cn, p_dv: web.hienDvSp ? dv : [], p_bat_dau: new Date(`${ngay}T${gio}:00+07:00`).toISOString(), p_ho_ten: chuoi("ho_ten"), p_sdt: chuoi("dien_thoai"),
    p_gioi_tinh: chuoi("gioi_tinh") === "nam" ? "nam" : "nữ", p_so_khach: Number.isInteger(soKhach) ? soKhach : 1, p_nv: web.chonKtv && nv ? nv : null,
    p_ghi_chu: chuoi("ghi_chu"), p_ip_bam: await dauVetIp(), p_ref: /^[0-9A-Za-z+ ]{3,30}$/.test(chuoi("ref")) ? chuoi("ref") : null,
  });
  if (error || !data) return { loi: thongBaoLoi(error) || "Có lỗi xảy ra, không thể đặt được lịch" };
  const kq = data as { lich_id: string; ma: string };
  const [{ data: c }, { data: n }] = await Promise.all([
    db.from("chi_nhanh").select("ten, dia_chi").eq("id", cn).maybeSingle(),
    web.chonKtv && nv ? db.from("nhan_vien").select("ho_ten, email").eq("id", nv).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const ten = chuoi("ho_ten").trim().replace(/\s+/g, " ").slice(0, 100);
  const daDat: DaDat = { gio, ngay, ten, sdt: chuoi("dien_thoai").trim(), diaChi: [c?.ten, c?.dia_chi].filter(Boolean).join(" · "), dichVu: tl.ten, nguoiLam: (n?.ho_ten ?? "").replace(/^MSC[.\-A-Z0-9]*\.\s*/, "").trim() };
  // Báo cho lễ tân sau khi đã trả lời khách; hỏng thì thôi, không ảnh hưởng lịch đã đặt.
  // "Tắt tất cả thông báo lịch hẹn" → không đẩy, không gửi thư. "Âm thanh" tắt → thông báo im lặng. Email: danh sách nhận + người làm (nếu bật).
  after(async () => {
    if (web.tatThongBao) return;
    const tieuDe = "Có lịch đặt online mới";
    const noiDung = `${gio} ${ngayVN(ngay)} · ${ten.slice(0, 40)}${soKhach > 1 ? ` · ${soKhach} khách` : ""}${daDat.nguoiLam ? ` · ${daDat.nguoiLam}` : ""}`;
    const ids = await nguoiCoQuyen("lich.sua", cn);
    await guiChoNhanVien(ids, { tieuDe, noiDung, url: `/lich-hen?tu=${ngay}&den=${ngay}`, tag: `dl-${kq.lich_id}`, imLang: !web.amThanh });
    if (!coCauHinhThu()) return;
    const den = new Set(web.emailNhan);
    if (web.guiEmailNv && n?.email) den.add(n.email);
    const chu = `${tieuDe}\nMã đặt lịch: ${kq.ma}\nThời gian: ${gio} ngày ${ngayVN(ngay)}\nChi nhánh: ${daDat.diaChi}\nKhách: ${ten}${soKhach > 1 ? ` (${soKhach} khách)` : ""}\n${tl.ten.length ? `Dịch vụ: ${tl.ten.join(", ")}\n` : ""}${daDat.nguoiLam ? `Người làm: ${daDat.nguoiLam}\n` : ""}Xem trong AMIA OS › Lịch hẹn.`;
    const html = chu.split("\n").map((d) => `<p style="margin:0 0 6px">${d.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[x] as string)}</p>`).join("");
    await Promise.all([...den].map((e) => guiThu(e, `${tieuDe}: ${gio} ${ngayVN(ngay)}`, chu, html)));
  });
  return { ok: true, daDat };
}
