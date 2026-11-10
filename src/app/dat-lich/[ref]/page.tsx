import { redirect } from "next/navigation";

/** Link giới thiệu dạng BeDental /dat-lich/ref=<SĐT> → /dat-lich?ref=<SĐT>. Đường khác dưới /dat-lich về trang đặt lịch. */
export default async function TrangRef({ params }: { params: Promise<{ ref: string }> }) {
  const doan = decodeURIComponent((await params).ref);
  const m = /^ref=([0-9A-Za-z+ ]{3,30})$/i.exec(doan);
  redirect(m ? `/dat-lich?ref=${encodeURIComponent(m[1])}` : "/dat-lich");
}
