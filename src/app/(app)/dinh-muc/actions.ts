"use server";

import { revalidatePath } from "next/cache";
import { kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, so } from "@/lib/form";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => revalidatePath("/dinh-muc");

export async function luuDinhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id");
  const row = { dich_vu_id: chuoi(fd, "dich_vu_id"), san_pham_id: chuoi(fd, "san_pham_id"), so_luong: so(fd, "so_luong"), chon_theo_chi_dinh: bat(fd, "chon_theo_chi_dinh"), ghi_chu: chuoi(fd, "ghi_chu") || null };
  if (!row.san_pham_id) return { loi: "Chọn vật tư." };
  if (!(row.so_luong > 0)) return { loi: "Số lượng định mức phải lớn hơn 0." };
  const { error } = id ? await sb().from("dinh_muc").update(row).eq("id", id) : await sb().from("dinh_muc").insert(row);
  lamMoi();
  return error ? { loi: error.code === "23505" ? "Vật tư này đã có trong định mức của dịch vụ." : thongBaoLoi(error) } : { ok: true };
}

export async function xoaDinhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  await sb().from("dinh_muc").delete().eq("id", chuoi(fd, "id"));
  lamMoi();
  return { ok: true };
}

const chuan = (s: string) => s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
/** Dán nhiều dòng "Dịch vụ ⇥ Vật tư ⇥ Số lượng ⇥ Theo chỉ định (1/0)" (từ Excel/Google Sheet). Khớp theo tên hoặc mã; dòng không khớp được liệt kê, dòng khớp vẫn được lưu. */
export async function nhapDinhMuc(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("danhmuc.sua"))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const [{ data: dv }, { data: sp }] = await Promise.all([db.from("dich_vu").select("id, ma, ten"), db.from("san_pham").select("id, ma, ten")]);
  const mapDv = new Map<string, string>(); (dv ?? []).forEach((d) => { mapDv.set(chuan(d.ten), d.id); mapDv.set(chuan(d.ma), d.id); });
  const mapSp = new Map<string, string>(); (sp ?? []).forEach((s) => { mapSp.set(chuan(s.ten), s.id); mapSp.set(chuan(s.ma), s.id); });
  const dong = chuoi(fd, "van_ban").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: { dich_vu_id: string; san_pham_id: string; so_luong: number; chon_theo_chi_dinh: boolean }[] = [];
  const loi: string[] = [];
  dong.forEach((l, i) => {
    const c = l.split(/\t|\||;/).map((x) => x.trim());
    if (c.length < 3 || /^dịch vụ$/i.test(c[0])) { if (i > 0 || c.length < 3) loi.push(`Dòng ${i + 1}: cần ít nhất 3 cột (dịch vụ, vật tư, số lượng)`); return; }
    const d = mapDv.get(chuan(c[0])), s = mapSp.get(chuan(c[1])), n = Number(c[2].replace(/\./g, "").replace(",", "."));
    if (!d) return void loi.push(`Dòng ${i + 1}: không có dịch vụ "${c[0]}" trong danh mục`);
    if (!s) return void loi.push(`Dòng ${i + 1}: không có vật tư "${c[1]}" trong danh mục`);
    if (!(n > 0)) return void loi.push(`Dòng ${i + 1}: số lượng "${c[2]}" chưa hợp lệ`);
    rows.push({ dich_vu_id: d, san_pham_id: s, so_luong: n, chon_theo_chi_dinh: ["1", "x", "có", "co", "true"].includes((c[3] ?? "").toLowerCase()) });
  });
  const gop = new Map(rows.map((r) => [`${r.dich_vu_id}|${r.san_pham_id}`, r]));
  if (gop.size) {
    const { error } = await db.from("dinh_muc").upsert([...gop.values()], { onConflict: "dich_vu_id,san_pham_id" });
    if (error) return { loi: thongBaoLoi(error) };
  }
  lamMoi();
  if (loi.length) return { loi: `Đã lưu ${gop.size} dòng. ${loi.length} dòng lỗi: ${loi.slice(0, 8).join("; ")}${loi.length > 8 ? "…" : ""}` };
  return { ok: true };
}
