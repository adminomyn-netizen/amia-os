import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sb } from "@/lib/db";
import { anhBlogUrl } from "@/lib/blog";
import { ngayVN } from "@/lib/dinh-dang";

export const metadata: Metadata = { title: "Blog | AMIA Phòng khám da liễu", description: "Kiến thức chăm sóc da và thông tin dịch vụ từ AMIA Phòng khám da liễu, Vinh." };
export const revalidate = 120;

/** Trang Blog công khai của AMIA (không cần đăng nhập): chỉ bài và chuyên mục đang kích hoạt. */
export default async function TrangBlogCongKhai({ searchParams }: { searchParams: Promise<{ cm?: string }> }) {
  const { cm } = await searchParams;
  const db = sb();
  const { data: cms } = await db.from("blog_chuyen_muc").select("id, tieu_de, mo_ta").eq("hoat_dong", true).order("thu_tu", { ascending: false }).order("tieu_de");
  const hien = new Set((cms ?? []).map((c) => c.id));
  let q = db.from("blog_bai_viet").select("id, chuyen_muc_id, tieu_de, mo_ta_ngan, anh, tieu_bieu, cap_nhat_luc").eq("hoat_dong", true).order("tieu_bieu", { ascending: false }).order("cap_nhat_luc", { ascending: false }).limit(60);
  if (cm && hien.has(cm)) q = q.eq("chuyen_muc_id", cm);
  const { data: tat } = await q;
  const bai = (tat ?? []).filter((b) => hien.has(b.chuyen_muc_id));
  const ten = new Map((cms ?? []).map((c) => [c.id, c.tieu_de]));
  const chip = (dang: boolean) => `rounded-nho border px-3 py-1.5 text-[14px] ${dang ? "border-nhan bg-giay-tram font-medium text-nhan-dam" : "border-vien text-muc-2 hover:text-muc"}`;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/blog" aria-label="Blog AMIA"><Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-5 h-auto w-[110px] sm:w-[130px]" /></Link>
      <h1 className="chu-tieu-de text-[30px] leading-tight text-muc sm:text-[34px]">Blog AMIA</h1>
      <p className="mt-2 text-[15px] text-muc-3">Kiến thức chăm sóc da và thông tin dịch vụ từ AMIA Phòng khám da liễu · 39A Lê Hồng Phong, TP. Vinh.</p>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Chuyên mục">
        <Link href="/blog" className={chip(!cm)}>Tất cả</Link>
        {(cms ?? []).map((c) => <Link key={c.id} href={`/blog?cm=${c.id}`} className={chip(cm === c.id)}>{c.tieu_de}</Link>)}
      </nav>
      {bai.length === 0 ? <p className="mt-10 text-muc-3">Chưa có bài viết nào.</p> : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bai.map((b) => {
            const anh = anhBlogUrl(b.anh);
            return (
              <li key={b.id} className="overflow-hidden rounded-nho border border-vien bg-giay-sang">
                <Link href={`/blog/${b.id}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {anh ? <img src={anh} alt={b.tieu_de} loading="lazy" className="h-44 w-full object-cover" /> : <div className="h-44 w-full bg-giay-tram" aria-hidden />}
                  <div className="p-4">
                    <p className="text-[12px] text-muc-3">{b.tieu_bieu ? "Tiêu biểu · " : ""}{ten.get(b.chuyen_muc_id)} · {ngayVN(b.cap_nhat_luc.slice(0, 10))}</p>
                    <h2 className="mt-1 text-[17px] font-medium leading-snug text-muc">{b.tieu_de}</h2>
                    {b.mo_ta_ngan && <p className="mt-2 line-clamp-3 text-[14px] text-muc-2">{b.mo_ta_ngan}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
