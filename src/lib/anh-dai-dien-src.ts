/** Đường xem ảnh đại diện khách (dùng được ở cả máy chủ lẫn trình duyệt). `anh` = khach_hang.anh_dai_dien_url; đổi ảnh thì `v` đổi nên trình duyệt không giữ ảnh cũ. */
export function srcAnhKhach(id: string, anh: string | null | undefined): string | null {
  if (!anh) return null;
  let h = 0;
  for (let i = 0; i < anh.length; i++) h = (h * 31 + anh.charCodeAt(i)) | 0;
  return `/api/khach/anh-dai-dien/${id}?v=${(h >>> 0).toString(36)}`;
}
