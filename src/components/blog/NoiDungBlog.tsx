import { tachNoiDung } from "@/lib/blog";

/** Hiển thị nội dung bài Blog: đoạn, tiêu đề nhỏ, danh sách (chữ thường, React tự thoát ký tự, không HTML thô). */
export function NoiDungBlog({ noiDung }: { noiDung: string }) {
  return (
    <div className="space-y-4 text-[16px] leading-[1.75] text-muc-2">
      {tachNoiDung(noiDung).map((k, i) =>
        k.loai === "tieu_de" ? <h2 key={i} className="chu-tieu-de pt-3 text-[22px] leading-snug text-muc">{k.chu[0]}</h2>
        : k.loai === "danh_sach" ? <ul key={i} className="list-disc space-y-1.5 pl-6">{k.chu.map((c, j) => <li key={j}>{c}</li>)}</ul>
        : <p key={i}>{k.chu[0]}</p>)}
    </div>
  );
}
