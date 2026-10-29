/** Bỏ tiền tố mã nhân viên khi hiển thị: "MSC.TV-25.0115.Nguyễn Thị Thư" / "MSC.CTV - Nguyễn Thị Thùy Giang" → tên. Mã đầy đủ để ở tooltip. */
export const tenGonNv = (t: string) => t.trim().replace(/^MSC\.[^.\s]+\.[^.\s]+\./i, "").replace(/^MSC\.[A-Za-z]+\s*-\s*/i, "").replace(/^\d{3,5}\.\s*/, "").trim() || t.trim();
