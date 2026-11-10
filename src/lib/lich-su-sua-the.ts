/** "Lịch sử sửa" của một thẻ khách, dựng từ sổ cái thẻ (the_so_cai, chỉ thêm — không có bảng nhật ký riêng vì MỌI đường sửa thẻ đều ghi sổ cái kèm người + giờ):
 *  sua_the (hàm DB sua_the ghi "Hạn: cũ → mới · Chủ thẻ: … · Giá 1 buổi: … · Ghi chú: … · Lý do: …"), khoa / mo_khoa / thu_hoi (lý do), dieu_chinh (cộng/trừ buổi, tiền + lý do), hoan_buoi (huỷ buổi). */
export type DongSoCai = { id: number | string; loai: string; tao_luc: string; nguoi_id: string | null; ghi_chu: string | null; so_buoi: number; so_tien: number | string };
export type ThayDoi = { truong: string; cu: string | null; moi: string };
export type DongSua = { id: string; luc: string; nguoiId: string | null; viec: string; thayDoi: ThayDoi[]; lyDo: string | null };

export const LOAI_SUA = ["sua_the", "khoa", "mo_khoa", "thu_hoi", "dieu_chinh", "hoan_buoi"] as const;
const TRUONG_SUA = ["Hạn", "Chủ thẻ", "Giá 1 buổi", "Ghi chú", "Lý do"];

/** Tách ghi chú dòng sua_the thành từng trường cũ → mới. Mảnh không bắt đầu bằng tên trường (ghi chú có " · ") được nối vào mảnh trước. */
export function tachSuaThe(ghiChu: string): { thayDoi: ThayDoi[]; lyDo: string | null } {
  const manh: string[] = [];
  for (const m of ghiChu.split(" · ")) {
    if (manh.length && !TRUONG_SUA.some((t) => m.startsWith(`${t}: `))) manh[manh.length - 1] += ` · ${m}`;
    else manh.push(m);
  }
  const thayDoi: ThayDoi[] = [];
  let lyDo: string | null = null;
  for (const m of manh) {
    const t = TRUONG_SUA.find((x) => m.startsWith(`${x}: `));
    if (!t) { thayDoi.push({ truong: "Thay đổi", cu: null, moi: m }); continue; }
    const giaTri = m.slice(t.length + 2);
    if (t === "Lý do") { lyDo = giaTri; continue; }
    const i = giaTri.indexOf(" → ");
    thayDoi.push(i < 0 ? { truong: t, cu: null, moi: giaTri } : { truong: t, cu: giaTri.slice(0, i), moi: giaTri.slice(i + 3) });
  }
  return { thayDoi, lyDo };
}

const dau = (n: number) => (n > 0 ? `+${n}` : String(n));
const tien = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("vi-VN")}đ`;

/** Các dòng sổ cái là "sửa" (không gồm cấp thẻ, dùng buổi, nạp/trừ tiền khi bán hàng), mới nhất trước như sổ cái. */
export function lichSuSuaThe(so: DongSoCai[], loaiThe: string): DongSua[] {
  return so.filter((r) => (LOAI_SUA as readonly string[]).includes(r.loai)).map((r) => {
    const goc = { id: String(r.id), luc: r.tao_luc, nguoiId: r.nguoi_id };
    const gc = (r.ghi_chu ?? "").trim() || null;
    switch (r.loai) {
      case "sua_the": { const t = tachSuaThe(r.ghi_chu ?? ""); return { ...goc, viec: "Sửa thông tin thẻ", ...t }; }
      case "khoa": return { ...goc, viec: "Khoá thẻ", thayDoi: [{ truong: "Tình trạng", cu: "Đang dùng", moi: "Đang khoá" }], lyDo: gc };
      case "mo_khoa": return { ...goc, viec: "Mở khoá thẻ", thayDoi: [{ truong: "Tình trạng", cu: "Đang khoá", moi: "Đang dùng" }], lyDo: gc };
      case "thu_hoi": return { ...goc, viec: "Thu hồi thẻ", thayDoi: [{ truong: "Tình trạng", cu: null, moi: "Đã thu hồi" }], lyDo: gc };
      case "hoan_buoi": return { ...goc, viec: "Huỷ buổi, hoàn buổi", thayDoi: [{ truong: "Số buổi", cu: null, moi: dau(r.so_buoi) }], lyDo: gc };
      default: return { ...goc, viec: "Điều chỉnh số dư", thayDoi: [loaiThe === "lan" ? { truong: "Số buổi", cu: null, moi: dau(r.so_buoi) } : { truong: "Số tiền", cu: null, moi: tien(Number(r.so_tien)) }], lyDo: gc };
    }
  });
}
