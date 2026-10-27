"use server";

import { headers } from "next/headers";
import { sb } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { coCauHinhThu, guiThu } from "@/lib/gui-thu";

/** Quên mật khẩu: chỉ gửi cho email của nhân viên đang hoạt động, nhưng luôn trả lời giống nhau để không lộ email nào có trong hệ thống. */
export async function guiLienKetDatLai(email: string): Promise<{ ok?: true; loi?: string }> {
  email = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { loi: "Email chưa đúng định dạng." };
  if (!coCauHinhThu()) return { loi: "Hệ thống chưa bật gửi thư tự động. Nhờ bộ phận Kỹ thuật đặt lại mật khẩu." };

  const { data: nv } = await sb().from("nhan_vien").select("ho_ten, hoat_dong").eq("email", email).maybeSingle();
  if (nv?.hoat_dong) {
    const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email });
    const ma = data?.properties?.hashed_token;
    if (!error && ma) {
      const h = await headers();
      const goc = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
      const lienKet = `${goc}/dat-lai-mat-khau?token_hash=${encodeURIComponent(ma)}&type=recovery`;
      await guiThu(
        email,
        "AMIA OS: đặt lại mật khẩu",
        `Chào ${nv.ho_ten},\n\nBấm vào liên kết để đặt mật khẩu mới (có hiệu lực 1 giờ, chỉ dùng được một lần):\n${lienKet}\n\nNếu bạn không yêu cầu, bỏ qua thư này.`,
        `<p>Chào ${nv.ho_ten},</p><p><a href="${lienKet}">Bấm vào đây để đặt mật khẩu mới</a> (có hiệu lực 1 giờ, chỉ dùng được một lần).</p><p>Nếu bạn không yêu cầu, bỏ qua thư này.</p>`,
      );
    }
  }
  return { ok: true };
}
