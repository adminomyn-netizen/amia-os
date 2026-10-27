import "server-only";
import nodemailer from "nodemailer";

/** Gửi thư qua SMTP (biến môi trường SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Chưa cấu hình thì trả về false, không gửi. */
export function coCauHinhThu(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function guiThu(den: string, tieuDe: string, chu: string, html: string): Promise<boolean> {
  if (!coCauHinhThu()) return false;
  const cong = Number(process.env.SMTP_PORT || 465);
  const may = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: cong, secure: cong === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  try {
    await may.sendMail({ from: process.env.SMTP_FROM || `AMIA OS <${process.env.SMTP_USER}>`, to: den, subject: tieuDe, text: chu, html });
    return true;
  } catch (e) {
    console.error("[gui-thu]", (e as Error).message);
    return false;
  }
}
