import "server-only";
import nodemailer from "nodemailer";
import { sb } from "@/lib/db";
import { dienMau, giaiMaThu, MAU_THEO_BUOC, ngayThu, emailHopLe } from "@/lib/email-tuyen-dung";

/** Khoá mã hoá lấy từ khoá máy chủ có sẵn; không bao giờ trả về trình duyệt. Hàm này KHÔNG nằm trong tệp "use server" để không thành điểm gọi công khai. */
export const biMatThu = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Gửi một thư bằng Gmail đã kết nối. Trả về null nếu gửi được, ngược lại là lời báo lỗi để ghi vào hàng đợi. */
export async function guiBangGmail(den: string, tieuDe: string, noiDung: string): Promise<string | null> {
  const { data: kn } = await sb().from("thu_ket_noi").select("email, mat_khau_ma_hoa").eq("id", true).maybeSingle();
  if (!kn) return "Chưa kết nối Gmail.";
  const mk = giaiMaThu(kn.mat_khau_ma_hoa, biMatThu());
  if (!mk) return "Kết nối Gmail đã hỏng, nhập lại mật khẩu ứng dụng.";
  try {
    const may = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: kn.email, pass: mk } });
    await may.sendMail({ from: `AMIA Nhân sự <${kn.email}>`, to: den, subject: tieuDe, text: noiDung });
    return null;
  } catch (e) { return `Gmail từ chối: ${(e as Error).message.slice(0, 160)}`; }
}

/** Khi ứng viên sang một bước có mẫu thư: xếp thư vào hàng đợi; mẫu bật "tự gửi" và đã kết nối Gmail thì gửi luôn. Không ném lỗi: thư hỏng không được làm hỏng việc chuyển bước. */
export async function xepThuTheoBuoc(ungVienId: string, nguoiId: string | null) {
  try {
    const db = sb();
    const { data: uv } = await db.from("ung_vien").select("id, tin_id, ho_ten, email, trang_thai, ngay_phong_van, ngay_nhan_viec").eq("id", ungVienId).maybeSingle();
    const ma = uv ? MAU_THEO_BUOC[uv.trang_thai] : undefined;
    if (!uv || !ma || !uv.email || !emailHopLe(uv.email)) return;
    const [{ data: mau }, { data: tin }] = await Promise.all([db.from("tuyen_dung_mau_thu").select("*").eq("ma", ma).maybeSingle(), db.from("tin_tuyen_dung").select("vi_tri").eq("id", uv.tin_id).maybeSingle()]);
    if (!mau || !mau.hoat_dong) return;
    const v = { ten: uv.ho_ten, vi_tri: tin?.vi_tri ?? "", ngay_phong_van: ngayThu(uv.ngay_phong_van), ngay_nhan_viec: ngayThu(uv.ngay_nhan_viec) };
    const hang = { ung_vien_id: uv.id, mau_ma: ma, den_email: uv.email, tieu_de: dienMau(mau.tieu_de, v), noi_dung: dienMau(mau.noi_dung, v), nguoi_tao_id: nguoiId };
    const { data: moi } = await db.from("tuyen_dung_hang_doi_thu").insert(hang).select("id").maybeSingle();
    if (!moi || !mau.tu_gui) return;
    const loi = await guiBangGmail(hang.den_email, hang.tieu_de, hang.noi_dung);
    await db.from("tuyen_dung_hang_doi_thu").update(loi ? { trang_thai: "loi", loi } : { trang_thai: "da_gui", gui_luc: new Date().toISOString() }).eq("id", moi.id);
  } catch (e) { console.error("[xep-thu-tuyen-dung]", (e as Error).message); }
}
