import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { khoGiayIn, ToInChung } from "@/components/in/ToInChung";

/** In ghi chú khách (SalonHero mẫu print notes): toàn bộ ghi chú điều trị của một khách, mới nhất trước. Chỉ đọc; ghi nhật ký truy cập như khi mở tab Ghi chú.
 *  ?tu=YYYY-MM-DD&den=YYYY-MM-DD để in một khoảng ngày. */
export default async function InGhiChuKhach({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tu?: string; den?: string }> }) {
  const nd = await yeuCauQuyen("hoso.xem");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = sb();
  const { data: k } = await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, ngay_sinh, gioi_tinh, chi_nhanh_id").eq("id", id).maybeSingle();
  if (!k) notFound();
  const ngay = /^\d{4}-\d{2}-\d{2}$/;
  let q = db.from("khach_ghi_chu").select("*").eq("khach_id", id).order("tao_luc", { ascending: false }).limit(1000);
  if (sp.tu && ngay.test(sp.tu)) q = q.gte("tao_luc", `${sp.tu}T00:00:00+07:00`);
  if (sp.den && ngay.test(sp.den)) q = q.lte("tao_luc", `${sp.den}T23:59:59+07:00`);
  const [{ data: gc }, { data: cn }, giay] = await Promise.all([q, k.chi_nhanh_id ? db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", k.chi_nhanh_id).maybeSingle() : Promise.resolve({ data: null }), khoGiayIn(nd.chiNhanhId ?? k.chi_nhanh_id)]);
  const idNv = [...new Set((gc ?? []).flatMap((g) => [g.bac_si_id, g.tao_boi]).filter((x): x is string => !!x))];
  const { data: nv } = idNv.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", idNv) : { data: [] as { id: string; ho_ten: string }[] };
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: "in_ghi_chu", doi_tuong: "khach_hang", doi_tuong_id: id });
  const muc: [string, string | null][] = [["Tình trạng", "tinh_trang"], ["Yêu cầu của khách", "yeu_cau"], ["Phương án điều trị", "phuong_an"], ["Kết quả", "ket_qua"]];
  return (
    <ToInChung giay={giay} tieuDe="Ghi chú khách hàng" chiNhanh={cn}
      phu={<p>{k.ho_ten} · {k.ma}{coQuyen(nd, "khach.sdt") && k.dien_thoai ? ` · ${k.dien_thoai}` : ""}{k.ngay_sinh ? ` · SN ${ngayVN(k.ngay_sinh)}` : ""}</p>}>
      {(gc ?? []).length === 0 ? <p className="py-6 text-center text-muc-3">Khách chưa có ghi chú.</p> : (
        <ol className="space-y-3">
          {(gc ?? []).map((g) => (
            <li key={g.id} className="border-b border-dashed border-vien pb-2">
              <p className="font-semibold">{ngayGioVN(g.tao_luc)}{g.bac_si_id ? ` · BS ${ten.get(g.bac_si_id) ?? ""}` : ""}{g.tao_boi ? ` · ghi bởi ${ten.get(g.tao_boi) ?? ""}` : ""}</p>
              {muc.map(([nhan, truong]) => { const v = g[truong as keyof typeof g] as string | null; return v ? <p key={nhan} className="whitespace-pre-line [overflow-wrap:anywhere]"><span className="text-muc-2">{nhan}: </span>{v}</p> : null; })}
            </li>
          ))}
        </ol>
      )}
    </ToInChung>
  );
}
