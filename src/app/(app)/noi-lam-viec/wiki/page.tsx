import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayCuaIso, ngayVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { luuWiki, xoaWiki } from "../actions";

export default async function TrangWiki({ searchParams }: { searchParams: Promise<{ q?: string; bai?: string }> }) {
  const nd = await yeuCauNoiBo();
  const sua = coQuyen(nd, "wiki.sua");
  const { q: tuKhoa = "", bai } = await searchParams;
  let q = sb().from("wiki_bai").select("*").order("ghim", { ascending: false }).order("nhom").order("tieu_de").limit(500);
  if (!sua) q = q.eq("cong_khai", true);
  const { data: ds } = await q;
  const tk = tuKhoa.trim().toLowerCase();
  const loc = (ds ?? []).filter((b) => !tk || `${b.tieu_de} ${b.nhom} ${b.noi_dung}`.toLowerCase().includes(tk));
  const dang = (ds ?? []).find((b) => b.id === bai);
  const nhom = [...new Set(loc.map((b) => b.nhom))];
  const truong: Truong[] = [
    { ten: "tieu_de", nhan: "Tiêu đề", loai: "chu", batBuoc: true, rong: true }, { ten: "nhom", nhan: "Nhóm", loai: "chu", goiY: "Quy trình, Quy định, Hướng dẫn…" },
    { ten: "ghim", nhan: "Ghim lên đầu", loai: "gat" }, { ten: "cong_khai", nhan: "Công khai cho mọi nhân viên", loai: "gat" },
    { ten: "noi_dung", nhan: "Nội dung", loai: "nhieu_dong", batBuoc: true, rong: true },
  ];
  return (
    <div>
      <Link href="/noi-lam-viec" className="text-[13px] text-muc-3 hover:text-muc">← Nơi làm việc</Link>
      <TieuDeTrang tieuDe="Wiki công ty" phu="Quy định, quy trình và tài liệu nội bộ. Chỉ đọc; người có quyền mới viết và sửa bài.">
        {sua && <NutHop nhan="Viết bài" tieuDe="Viết bài mới" truong={truong} action={luuWiki} giaTri={{ nhom: "Chung", cong_khai: true }} rong />}
      </TieuDeTrang>
      <form className="mb-6 flex gap-2.5" action="/noi-lam-viec/wiki">
        <input name="q" defaultValue={tuKhoa} placeholder="Tìm theo tiêu đề, nhóm hoặc nội dung" className="h-11 w-full max-w-md rounded-nho border border-vien-dam bg-giay-sang px-3 text-[14px] outline-none focus:border-nhan" />
        <button className="h-11 rounded-nho border border-vien-dam px-4 text-[14px] text-muc-2 hover:bg-giay-tram">Tìm</button>
      </form>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Danh sách bài" className="space-y-5">
          {loc.length === 0 && <p className="text-[14px] text-muc-3">{ds?.length ? "Không có bài nào khớp." : "Chưa có tài liệu nào."}</p>}
          {nhom.map((n) => (
            <section key={n}>
              <h2 className="nhan-muc mb-1.5">{n}</h2>
              <ul>
                {loc.filter((b) => b.nhom === n).map((b) => (
                  <li key={b.id}><Link href={`/noi-lam-viec/wiki?bai=${b.id}${tuKhoa ? `&q=${encodeURIComponent(tuKhoa)}` : ""}`} className={`block py-1.5 text-[14px] ${dang?.id === b.id ? "font-medium text-nhan-dam" : "text-muc-2 hover:text-muc"}`}>{b.ghim ? "Ghim · " : ""}{b.tieu_de}</Link></li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
        <article>
          {dang ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="chu-tieu-de text-[24px] leading-tight text-muc">{dang.tieu_de}</h2>
                {sua && (
                  <div className="flex gap-1.5">
                    <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa bài" truong={truong} action={luuWiki} rong giaTri={{ id: dang.id, tieu_de: dang.tieu_de, nhom: dang.nhom, ghim: dang.ghim, cong_khai: dang.cong_khai, noi_dung: dang.noi_dung }} />
                    <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá bài" xacNhan={`Xoá bài "${dang.tieu_de}"? Không khôi phục được.`} action={xoaWiki} an={{ id: dang.id }} nhanLuu="Xoá bài" />
                  </div>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muc-3">{dang.nhom} · cập nhật {ngayVN(ngayCuaIso(dang.cap_nhat_luc))}{!dang.cong_khai && <NhanTrangThai kieu="cho">Chưa công khai</NhanTrangThai>}</p>
              <div className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-muc-2">{dang.noi_dung}</div>
            </>
          ) : <p className="text-[14px] text-muc-3">Chọn một bài ở danh sách bên trái để đọc.</p>}
        </article>
      </div>
    </div>
  );
}
