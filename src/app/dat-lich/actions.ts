"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { sb, thongBaoLoi } from "@/lib/db";
import { nguoiCoQuyen, guiChoNhanVien } from "@/lib/push";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { NOI_DAT_LICH } from "@/lib/ban-hang";
import { layWebDatLich } from "@/lib/web-dat-lich";

/** TRANG CÔNG KHAI (không đăng nhập): mọi hàm ở đây là cửa mở ra Internet — chỉ gọi hàm Postgres đã kiểm đầu vào/giới hạn, KHÔNG ghi thẳng khách hay lịch. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
export type KQGio = { gio: string[]; loi?: string };
export type KQGui = { ok?: true; loi?: string; tomTat?: string };

/** Băm IP + muối bí mật: đủ để đếm giới hạn theo IP mà không lưu IP thật. */
async function dauVetIp() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "khong-ro";
  return createHash("sha256").update(`${ip}|${process.env.CRON_SECRET ?? "amia"}`).digest("hex").slice(0, 40);
}
const danhSachId = (v: string) => v.split(",").filter(Boolean);
/** Dịch vụ khách được chọn ở chi nhánh này: đang hoạt động, bật đặt online, nơi hiển thị có đặt lịch, có cung cấp ở chi nhánh (null = mọi chi nhánh). cn đã kiểm là UUID. */
const dvDatDuoc = (cn: string, ids: string[]) => sb().from("dich_vu").select("id, thoi_luong_phut").in("id", ids).eq("hoat_dong", true).eq("dat_online", true)
  .in("noi_hien_thi", NOI_DAT_LICH).or(`chi_nhanh_ids.is.null,chi_nhanh_ids.eq.{},chi_nhanh_ids.cs.{${cn}}`);

/** Các khung giờ còn trống của một ngày cho tập dịch vụ đã chọn. Chỉ đọc; đầu vào sai thì trả rỗng. */
export async function layGioTrong(cn: string, ngay: string, dichVuIds: string[]): Promise<KQGio> {
  if (!UUID.test(cn) || !NGAY.test(ngay) || dichVuIds.length < 1 || dichVuIds.length > 5 || !dichVuIds.every((d) => UUID.test(d))) return { gio: [] };
  if (ngay < homNayHCM() || ngay > congNgay(homNayHCM(), 61)) return { gio: [] };
  const db = sb();
  const { data: dv } = await dvDatDuoc(cn, dichVuIds);
  if (!dv || dv.length !== new Set(dichVuIds).size) return { gio: [], loi: "Có dịch vụ chưa nhận đặt online ở chi nhánh này." };
  const phut = dv.reduce((a, d) => a + d.thoi_luong_phut, 0);
  const { data, error } = await db.rpc("gio_trong_online", { p_cn: cn, p_ngay: ngay, p_phut: phut });
  if (error) return { gio: [], loi: thongBaoLoi(error) };
  return { gio: (data as unknown as string[]) ?? [] };
}

/** Khách gửi yêu cầu đặt lịch. Chống lạm dụng: ô bẫy (honeypot), thời gian điền tối thiểu, kiểm tra + giới hạn tốc độ trong cơ sở dữ liệu. Không bao giờ nói số điện thoại đã là khách hay chưa. */
export async function guiYeuCauDatLich(_: KQGui | undefined, fd: FormData): Promise<KQGui> {
  const chuoi = (k: string) => String(fd.get(k) ?? "").slice(0, 400);
  const GIONG_THANH_CONG: KQGui = { ok: true, tomTat: "Đã nhận yêu cầu. Phòng khám sẽ gọi điện xác nhận lịch cho bạn sớm." };
  // Ô bẫy: người thật không thấy ô này; bot điền → giả vờ thành công, không ghi gì.
  if (chuoi("website") !== "") return GIONG_THANH_CONG;
  const batDauForm = Number(chuoi("mo_luc"));
  if (!Number.isFinite(batDauForm) || Date.now() - batDauForm < 2500) return { loi: "Bạn thao tác quá nhanh. Vui lòng kiểm tra lại và gửi lần nữa." };
  const cn = chuoi("chi_nhanh_id"), ngay = chuoi("ngay"), gio = chuoi("gio"), dv = danhSachId(chuoi("dich_vu_ids"));
  if (!UUID.test(cn) || dv.length === 0 || !dv.every((d) => UUID.test(d))) return { loi: "Vui lòng chọn chi nhánh và dịch vụ." };
  if (!NGAY.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) return { loi: "Vui lòng chọn ngày và giờ hẹn." };
  const db = sb();
  // Hàm Postgres đã kiểm "đặt online"; ở đây kiểm thêm "Nơi hiển thị" + "Địa điểm cung cấp" (cột 0194) trước khi ghi.
  const { data: dvOk } = dv.length <= 5 ? await dvDatDuoc(cn, dv) : { data: null };
  if (!dvOk || dvOk.length !== new Set(dv).size) return { loi: "Có dịch vụ chưa nhận đặt online ở chi nhánh này. Vui lòng chọn lại." };
  const { data, error } = await db.rpc("gui_yeu_cau_dat_lich", {
    p_cn: cn, p_dv: dv, p_bat_dau: new Date(`${ngay}T${gio}:00+07:00`).toISOString(), p_ho_ten: chuoi("ho_ten"), p_sdt: chuoi("dien_thoai"),
    p_ghi_chu: chuoi("ghi_chu") as unknown as string, p_ip_bam: await dauVetIp(),
  });
  if (error || !data) return { loi: thongBaoLoi(error) || "Chưa gửi được. Vui lòng thử lại." };
  const id = data as unknown as string;
  // Báo cho lễ tân (thông báo đẩy nội bộ), gửi sau khi đã trả lời khách; hỏng thì thôi, không ảnh hưởng yêu cầu.
  // Cài đặt "Tắt thông báo khi có lịch đặt online" (SalonHero) thì không đẩy thông báo cho lễ tân; yêu cầu vẫn nằm ở cột Yêu cầu đặt lịch.
  after(async () => {
    if ((await layWebDatLich(db)).tatThongBao) return;
    const ids = await nguoiCoQuyen("lich.sua", cn);
    await guiChoNhanVien(ids, { tieuDe: "Có yêu cầu đặt lịch online", noiDung: `${gio} ${ngayVN(ngay)} · ${chuoi("ho_ten").slice(0, 40)}`, url: "/lich-hen", tag: `yc-${id}` });
  });
  return { ok: true, tomTat: `Đã nhận yêu cầu lúc ${gio} ngày ${ngayVN(ngay)}. Phòng khám sẽ gọi điện xác nhận lịch cho bạn sớm.` };
}
