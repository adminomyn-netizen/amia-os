const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Đối tượng áp dụng gửi từ biểu mẫu: "" = chung mọi người; "nv:<id>" = một nhân viên; "nhom:<chức danh>" = nhóm theo chức danh (viết thường, bỏ khoảng trắng thừa). */
export function docDoiTuong(s: string): { kieu: "chung" | "nhan_vien" | "nhom"; khoa: string } | null {
  if (!s || s === "chung") return { kieu: "chung", khoa: "" };
  if (s.startsWith("nv:")) return UUID.test(s.slice(3)) ? { kieu: "nhan_vien", khoa: s.slice(3).toLowerCase() } : null;
  if (s.startsWith("nhom:")) { const k = s.slice(5).trim().toLowerCase(); return k ? { kieu: "nhom", khoa: k } : null; }
  return null;
}

