import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sb } from "@/lib/db";
import { anhBlogUrl } from "@/lib/blog";
import { ngayVN } from "@/lib/dinh-dang";
import { NoiDungBlog } from "@/components/blog/NoiDungBlog";

export const revalidate = 120;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lay(id: string) {
  if (!UUID.test(id)) return null;
  const { data: b } = await sb().from("blog_bai_viet").select("*").eq("id", id).eq("hoat_dong", true).maybeSingle();
  if (!b) return null;
  const { data: cm } = await sb().from("blog_chuyen_muc").select("tieu_de, hoat_dong").eq("id", b.chuyen_muc_id).maybeSingle();
  return cm?.hoat_dong ? { b, cm: cm.tieu_de } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await lay((await params).id);
  return r ? { title: `${r.b.tieu_de} | Blog AMIA`, description: r.b.mo_ta_ngan ?? undefined } : { title: "Blog AMIA" };
}

export default async function TrangBaiBlog({ params }: { params: Promise<{ id: string }> }) {
  const r = await lay((await params).id);
  if (!r) notFound();
  const { b, cm } = r;
  const anh = anhBlogUrl(b.anh);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/blog" aria-label="Blog AMIA"><Image src="/logo-amia.png" alt="AMIA" width={150} height={65} priority className="mb-4 h-auto w-[100px] sm:w-[120px]" /></Link>
      <Link href="/blog" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc">← Tất cả bài viết</Link>
      <p className="mt-4 text-[13px] text-muc-3">{cm} · {ngayVN(b.cap_nhat_luc.slice(0, 10))}</p>
      <h1 className="chu-tieu-de mt-1 text-[26px] leading-tight text-muc sm:text-[32px]">{b.tieu_de}</h1>
      {b.mo_ta_ngan && <p className="mt-3 text-[17px] text-muc-2">{b.mo_ta_ngan}</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {anh && <img src={anh} alt={b.tieu_de} className="mt-6 w-full rounded-nho border border-vien object-cover" />}
      <div className="mt-8"><NoiDungBlog noiDung={b.noi_dung} /></div>
      <p className="mt-10 border-t border-vien pt-4 text-[13px] text-muc-3">AMIA Phòng khám da liễu · 39A Lê Hồng Phong, TP. Vinh. Thông tin trong bài mang tính tham khảo, không thay thế thăm khám trực tiếp.</p>
    </main>
  );
}
