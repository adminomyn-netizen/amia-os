import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { homNayHCM, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";

const SO_KHACH = 30;
type KhachNho = { id: string; ma: string; ho_ten: string; dien_thoai: string };

/** /khach-hang/gan-day — Khách gần đây: khách vừa đến (theo hoá đơn hoàn thành mới nhất) và khách vừa tạo hồ sơ. Chỉ đọc. */
export default async function KhachGanDay() {
  await yeuCauQuyen("khach.xem");
  const db = sb();
  // hoa_don có 2 khoá sang khach_hang (khách, người giới thiệu): chỉ rõ khach_id.
  const [{ data: hd, error: loiHd }, { data: moi }] = await Promise.all([
    db.from("hoa_don").select("id, ma, sh_ma, ngay_hd, tong_phai_thu, khach_hang!khach_id(id, ma, ho_ten, dien_thoai)").eq("trang_thai", "hoan_thanh").eq("la_so_du_dau", false).not("khach_id", "is", null).lte("ngay_hd", homNayHCM())
      .order("ngay_hd", { ascending: false }).order("tao_luc", { ascending: false }).limit(150),
    db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, tao_luc").order("tao_luc", { ascending: false }).limit(SO_KHACH),
  ]);
  if (loiHd) console.error("[khach-gan-day]", loiHd.message);
  // Mỗi khách một dòng: lần đến gần nhất + hoá đơn của lần đó.
  const daCo = new Set<string>();
  const vuaDen: { k: KhachNho; ngay: string; hd: { id: string; ma: string; tien: number } }[] = [];
  for (const h of hd ?? []) {
    const k = h.khach_hang as unknown as KhachNho | null;
    if (!k || daCo.has(k.id)) continue;
    daCo.add(k.id);
    vuaDen.push({ k, ngay: h.ngay_hd, hd: { id: h.id, ma: h.sh_ma ?? h.ma, tien: Number(h.tong_phai_thu) } });
    if (vuaDen.length >= SO_KHACH) break;
  }
  return (
    <div className="space-y-4">
      <Link href="/khach-hang" className="inline-block py-1 text-[13px] text-muc-3 hover:text-muc lg:hidden">← Danh sách khách</Link>
      <h1 className="chu-tieu-de text-[22px] text-muc">Khách gần đây</h1>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-the border border-vien bg-giay-sang">
          <h2 className="border-b border-vien px-4 py-3 text-[15px] font-semibold text-muc">Vừa đến (theo hoá đơn)</h2>
          <ul>
            {vuaDen.map(({ k, ngay, hd: h }) => (
              <li key={k.id} className="flex items-center justify-between gap-3 border-b border-vien px-4 py-2.5 text-[13px] last:border-b-0">
                <Link href={`/khach-hang/${k.id}`} className="min-w-0 hover:text-nhan-dam"><span className="block truncate font-medium text-muc">{k.ho_ten}</span><span className="tabular-nums text-muc-3">{k.dien_thoai} – {k.ma}</span></Link>
                <span className="shrink-0 text-right"><span className="block tabular-nums text-muc">{ngayVN(ngay)}</span><Link href={`/hoa-don/${h.id}`} className="tabular-nums text-nhan-dam hover:underline">{h.ma}</Link><span className="ml-1 tabular-nums text-muc-3">{tienVN(h.tien)}</span></span>
              </li>
            ))}
            {vuaDen.length === 0 && <li className="px-4 py-6 text-center text-muc-3">Chưa có hoá đơn nào.</li>}
          </ul>
        </section>
        <section className="rounded-the border border-vien bg-giay-sang">
          <h2 className="border-b border-vien px-4 py-3 text-[15px] font-semibold text-muc">Vừa tạo hồ sơ</h2>
          <ul>
            {(moi ?? []).map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 border-b border-vien px-4 py-2.5 text-[13px] last:border-b-0">
                <Link href={`/khach-hang/${k.id}`} className="min-w-0 hover:text-nhan-dam"><span className="block truncate font-medium text-muc">{k.ho_ten}</span><span className="tabular-nums text-muc-3">{k.dien_thoai} – {k.ma}</span></Link>
                <span className="shrink-0 tabular-nums text-muc-3">{ngayGioVN(k.tao_luc)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
