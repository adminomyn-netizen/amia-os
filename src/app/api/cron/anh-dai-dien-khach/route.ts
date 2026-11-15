import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { coAnhDaiDien, keoAnhSalonHero } from "@/lib/anh-dai-dien-khach";

export const maxDuration = 60;

/** Kéo trước ảnh đại diện SalonHero về ổ hosting theo từng đợt (máy Tula gọi lặp, khoá CRON_SECRET), để ảnh còn kể cả khi SalonHero ngừng.
 *  ?tu=<id cuối đợt trước>&so=<≤150>. Trả { daKeo, daCo, loi, cuoi } — cuoi null là hết. */
export async function POST(req: Request) {
  const bi = process.env.CRON_SECRET;
  if (!bi || req.headers.get("authorization") !== `Bearer ${bi}`) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  const u = new URL(req.url).searchParams;
  const so = Math.max(1, Math.min(150, Number(u.get("so")) || 100));
  let q = sb().from("khach_hang").select("id, anh_dai_dien_url").like("anh_dai_dien_url", "https://s3%").order("id").limit(so);
  const tu = u.get("tu");
  if (tu && /^[0-9a-f-]{36}$/i.test(tu)) q = q.gt("id", tu);
  const { data, error } = await q;
  if (error) return NextResponse.json({ loi: error.message }, { status: 500 });
  const kq = { daKeo: 0, daCo: 0, loi: 0, cuoi: data.length === so ? data[data.length - 1].id : null as string | null };
  const ds = [...data];
  await Promise.all(Array.from({ length: 8 }, async () => {
    for (let r = ds.shift(); r; r = ds.shift()) {
      if (await coAnhDaiDien(r.id)) kq.daCo++;
      else if (await keoAnhSalonHero(r.id, r.anh_dai_dien_url!)) kq.daKeo++;
      else kq.loi++;
    }
  }));
  return NextResponse.json(kq);
}
