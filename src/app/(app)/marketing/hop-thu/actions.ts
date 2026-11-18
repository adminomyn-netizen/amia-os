"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb } from "@/lib/db";
import { chuoi } from "@/lib/form";
import { luuTinTraLoi } from "@/lib/hop-thu";

type KQ = { ok?: true; loi?: string; ghiChu?: string };
const lamMoi = () => revalidatePath("/marketing/hop-thu");

async function hoiThoaiDuocPhep(nd: { chiNhanhId: string | null }, id: string) {
  const { data: ht } = await sb().from("hop_thu_hoi_thoai").select("id, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!ht) return false;
  return !(nd.chiNhanhId && ht.chi_nhanh_id && ht.chi_nhanh_id !== nd.chiNhanhId);
}

/** Trả lời khách: lưu tin ở trạng thái chờ gửi. Chưa có bộ gửi tới Zalo OA / Messenger, nên tin chưa tới khách. */
export async function traLoiKhach(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoi_thoai_id");
  if (!(await hoiThoaiDuocPhep(nd, id))) return { loi: KHONG_DU_QUYEN };
  const { data: ht } = await sb().from("hop_thu_hoi_thoai").select("nguon").eq("id", id).maybeSingle();
  if (ht?.nguon === "pancake") return { loi: "Hội thoại này lấy từ fanpage qua Pancake: bấm \"Trả lời trên Pancake\" để trả lời khách." };
  const kq = await luuTinTraLoi({ hoiThoaiId: id, noiDung: chuoi(fd, "noi_dung"), nguoiId: nd.nhanVienId ?? null });
  if (!kq.ok) return { loi: kq.loi };
  lamMoi();
  return { ok: true, ghiChu: kq.kenhDaNoi ? "Đã lưu, đang chờ gửi (chưa có bộ gửi tự động)." : "Đã lưu, chưa gửi tới khách vì kênh chưa nối." };
}

/** Mở hội thoại thì số chưa đọc về 0. */
export async function danhDauDaDoc(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("mkt.xem");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "hoi_thoai_id");
  if (!(await hoiThoaiDuocPhep(nd, id))) return { loi: KHONG_DU_QUYEN };
  await sb().from("hop_thu_hoi_thoai").update({ chua_doc: 0 }).eq("id", id);
  lamMoi();
  return { ok: true };
}
