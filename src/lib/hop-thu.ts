import "server-only";
import { sb } from "@/lib/db";

export type KenhHopThu = "zalo_oa" | "messenger";
export const laKenhHopThu = (k: unknown): k is KenhHopThu => k === "zalo_oa" || k === "messenger";

/**
 * Nhận một tin KHÁCH nhắn đến (webhook của Zalo OA / Messenger sẽ gọi hàm này; chưa có webhook công khai).
 * Tạo hội thoại nếu chưa có (mỗi khách trên mỗi kênh một hội thoại), lưu tin, tăng số chưa đọc.
 * Lưu ý: số chưa đọc cập nhật kiểu đọc rồi ghi; khi làm webhook thật nên chuyển thành một hàm Postgres để không lệch khi nhiều tin đến cùng lúc.
 */
export async function nhanTinDen(v: { kenh: string; maNgoai: string; tenKhach?: string | null; noiDung: string; luc?: string; chiNhanhId?: string | null; khachId?: string | null }): Promise<{ ok: true; hoiThoaiId: string } | { ok: false; loi: string }> {
  const noiDung = v.noiDung.trim(), ma = v.maNgoai.trim();
  if (!laKenhHopThu(v.kenh)) return { ok: false, loi: "Kênh không hợp lệ." };
  if (!ma || ma.length > 200) return { ok: false, loi: "Thiếu mã người gửi." };
  if (!noiDung || noiDung.length > 4000) return { ok: false, loi: "Nội dung tin trống hoặc quá dài." };
  const luc = v.luc ?? new Date().toISOString(), db = sb();
  const dong: Record<string, unknown> = { kenh: v.kenh, ma_ngoai: ma };
  if (v.tenKhach?.trim()) dong.ten_khach = v.tenKhach.trim().slice(0, 200);
  if (v.chiNhanhId) dong.chi_nhanh_id = v.chiNhanhId;
  if (v.khachId) dong.khach_id = v.khachId;
  const { error: e1 } = await db.from("hop_thu_hoi_thoai").upsert(dong as never, { onConflict: "kenh,ma_ngoai" });
  if (e1) return { ok: false, loi: "Chưa lưu được hội thoại." };
  const { data: ht } = await db.from("hop_thu_hoi_thoai").select("id, chua_doc").eq("kenh", v.kenh).eq("ma_ngoai", ma).maybeSingle();
  if (!ht) return { ok: false, loi: "Chưa lưu được hội thoại." };
  const { error: e2 } = await db.from("hop_thu_tin").insert({ hoi_thoai_id: ht.id, huong: "den", noi_dung: noiDung, trang_thai: "da_nhan", tao_luc: luc });
  if (e2) return { ok: false, loi: "Chưa lưu được tin." };
  await db.from("hop_thu_hoi_thoai").update({ tin_cuoi: noiDung.slice(0, 200), tin_cuoi_luc: luc, chua_doc: ht.chua_doc + 1 }).eq("id", ht.id);
  return { ok: true, hoiThoaiId: ht.id };
}

/** Lưu tin nhân viên trả lời. Chưa có bộ gửi tới Zalo OA / Messenger nên tin ở trạng thái chờ gửi, không giả vờ đã tới khách. */
export async function luuTinTraLoi(v: { hoiThoaiId: string; noiDung: string; nguoiId: string | null }): Promise<{ ok: true; kenhDaNoi: boolean } | { ok: false; loi: string }> {
  const noiDung = v.noiDung.trim();
  if (!noiDung || noiDung.length > 4000) return { ok: false, loi: "Nhập nội dung trả lời (tối đa 4000 ký tự)." };
  const db = sb();
  const { data: ht } = await db.from("hop_thu_hoi_thoai").select("id, kenh").eq("id", v.hoiThoaiId).maybeSingle();
  if (!ht) return { ok: false, loi: "Không tìm thấy hội thoại." };
  const { data: kn } = await db.from("ket_noi_ben_thu_ba").select("trang_thai").eq("kenh", ht.kenh).maybeSingle();
  const { error } = await db.from("hop_thu_tin").insert({ hoi_thoai_id: ht.id, huong: "di", noi_dung: noiDung, trang_thai: "cho_gui", nguoi_id: v.nguoiId });
  if (error) return { ok: false, loi: "Chưa lưu được tin trả lời." };
  await db.from("hop_thu_hoi_thoai").update({ tin_cuoi: noiDung.slice(0, 200), tin_cuoi_luc: new Date().toISOString() }).eq("id", ht.id);
  return { ok: true, kenhDaNoi: kn?.trang_thai === "da_noi" };
}
