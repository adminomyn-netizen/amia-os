/** Blog website AMIA: địa chỉ ảnh công khai và tách nội dung bài viết thành khối (không dùng HTML thô nên không có rủi ro chèn mã). */
export const anhBlogUrl = (duong: string | null | undefined): string | null =>
  duong ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-anh/${duong}` : null;

export type KhoiBlog = { loai: "tieu_de" | "doan" | "danh_sach"; chu: string[] };

/** Nội dung gõ thường: dòng trống ngăn đoạn; dòng bắt đầu "## " là tiêu đề nhỏ; các dòng bắt đầu "- " liền nhau là danh sách. */
export function tachNoiDung(nd: string): KhoiBlog[] {
  const ra: KhoiBlog[] = [];
  for (const khoi of nd.replace(/\r/g, "").split(/\n{2,}/)) {
    const dong = khoi.split("\n").map((d) => d.trim()).filter(Boolean);
    if (dong.length === 0) continue;
    let doan: string[] = [], ds: string[] = [];
    const xaDoan = () => { if (doan.length) ra.push({ loai: "doan", chu: [doan.join(" ")] }); doan = []; };
    const xaDs = () => { if (ds.length) ra.push({ loai: "danh_sach", chu: ds }); ds = []; };
    for (const d of dong) {
      if (d.startsWith("## ")) { xaDoan(); xaDs(); ra.push({ loai: "tieu_de", chu: [d.slice(3).trim()] }); }
      else if (d.startsWith("- ")) { xaDoan(); ds.push(d.slice(2).trim()); }
      else { xaDs(); doan.push(d); }
    }
    xaDoan(); xaDs();
  }
  return ra;
}
