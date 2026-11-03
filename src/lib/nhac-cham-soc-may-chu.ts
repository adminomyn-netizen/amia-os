import "server-only";
import { sb } from "@/lib/db";
import { docQuyTac } from "@/lib/nhac-cham-soc";
import type { DichVuNhac } from "@/components/khach/HopTaoNhac";

/** Dịch vụ đang dùng + quy tắc nhắc đã lưu (cột dich_vu.quy_tac_nhac không khai trong database.types.ts, xem actions). */
export async function dichVuChoNhac(): Promise<DichVuNhac[]> {
  const { data } = await sb().from("dich_vu").select("id, ten, quy_tac_nhac" as "id, ten").eq("hoat_dong", true).order("ten");
  return ((data ?? []) as unknown as { id: string; ten: string; quy_tac_nhac: unknown }[]).map((d) => ({ id: d.id, ten: d.ten, quyTac: docQuyTac(d.quy_tac_nhac) }));
}
