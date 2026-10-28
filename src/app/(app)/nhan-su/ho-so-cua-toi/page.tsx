import { redirect } from "next/navigation";
import { yeuCauNoiBo } from "@/lib/auth";

/** Lối tắt "Hồ sơ của tôi": mở đúng hồ sơ của chính mình (tự điền thông tin, tải giấy tờ, xin nghỉ việc). */
export default async function TrangHoSoCuaToi({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [nd, { tab }] = await Promise.all([yeuCauNoiBo(), searchParams]);
  redirect(`/nhan-su/ho-so/${nd.nhanVienId}${tab ? `?tab=${encodeURIComponent(tab)}` : "?tab=ho-so"}`);
}
