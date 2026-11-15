import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { BangIn, khoGiayIn, ToInChung } from "@/components/in/ToInChung";

const NHAN: Record<string, string> = { thu: "Thu", chi: "Chi", nap: "Nạp", rut: "Rút" };

/** In sổ quỹ / doanh thu theo khoảng ngày (SalonHero mẫu print revenue): tồn đầu kỳ, tổng thu/chi/nạp/rút, tồn cuối kỳ và từng dòng (bỏ dòng đã đảo).
 *  Cùng bộ lọc với Tài chính › Sổ quỹ: ?quy=tien-mat|ngan-hang&tu&den&cn. Chỉ đọc. */
export default async function InSoQuy({ searchParams }: { searchParams: Promise<{ quy?: string; tu?: string; den?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("quy.xem");
  const sp = await searchParams;
  const nganHang = sp.quy === "ngan-hang";
  const { tu, den } = khoangNgay(sp.tu, sp.den);
  const db = sb();
  const cn = nd.chiNhanhId ?? (sp.cn && /^[0-9a-f-]{36}$/i.test(sp.cn) ? sp.cn : undefined);
  let qq = db.from("quy").select("id, ten, chi_nhanh_id").eq("hoat_dong", true).eq("loai", nganHang ? "ngan_hang" : "tien_mat");
  if (cn) qq = qq.eq("chi_nhanh_id", cn);
  const { data: dsQuy } = await qq;
  const ids = (dsQuy ?? []).map((q) => q.id);
  const [{ data: tong }, { data: dong }, { data: chiNhanh }, giay] = await Promise.all([
    db.rpc("so_quy_tong", { p_quy: ids, p_tu: tu, p_den: den }),
    db.from("v_so_quy").select("*").in("quy_id", ids).gte("ngay", tu).lte("ngay", den).order("ngay").order("tao_luc").limit(5000),
    cn ? db.from("chi_nhanh").select("ten, dia_chi, dien_thoai").eq("id", cn).maybeSingle() : Promise.resolve({ data: null }),
    khoGiayIn(cn ?? null),
  ]);
  const t = tong?.[0];
  const dau = Number(t?.dau ?? 0), thu = Number(t?.thu ?? 0), chi = Number(t?.chi ?? 0), nap = Number(t?.nap ?? 0), rut = Number(t?.rut ?? 0);
  const tatCa = (dong ?? []).reduce<(NonNullable<typeof dong>[number] & { du: number })[]>((acc, r) => { acc.push({ ...r, du: (acc.length ? acc[acc.length - 1].du : dau) + Number(r.bien_dong) }); return acc; }, []).filter((r) => !r.da_dao && r.nguon !== "dao_phieu");
  return (
    <ToInChung giay={giay} tieuDe={nganHang ? "Sổ quỹ ngân hàng" : "Sổ quỹ tiền mặt"} chiNhanh={chiNhanh} kyTen={["Người lập", "Kế toán", "Quản lý"]}
      phu={<p>Từ {ngayVN(tu)} đến {ngayVN(den)}{(dsQuy ?? []).length > 1 ? ` · ${(dsQuy ?? []).map((q) => q.ten).join(", ")}` : ""}</p>}>
      <dl className="mb-3 grid gap-x-2 gap-y-0.5" style={{ gridTemplateColumns: "auto 1fr" }}>
        {([["Tồn đầu kỳ", dau], ["Tổng thu", thu], ["Tổng chi", chi], ["Nạp tiền", nap], ["Rút tiền", rut], ["Tồn cuối kỳ", dau + thu - chi + nap - rut]] as [string, number][]).map(([n, v]) => (
          <div key={n} className="contents"><dt className="text-muc-2">{n}:</dt><dd className={`text-right tabular-nums ${n === "Tồn cuối kỳ" ? "font-bold" : "font-medium"}`}>{tienVN(v)}</dd></div>
        ))}
      </dl>
      <BangIn cot={[{ nhan: "Ngày" }, { nhan: "Mã" }, { nhan: "Nội dung" }, { nhan: "Thu/Chi", phai: true }, { nhan: "Số dư", phai: true }]}
        dong={tatCa.map((r) => [ngayVN(r.ngay), r.ma ?? "", `${NHAN[r.loai ?? ""] ?? ""} · ${r.loai_thu_chi ? `${r.loai_thu_chi} · ` : ""}${r.noi_dung ?? ""}${r.khach_ten ? ` · ${r.khach_ten}` : ""}`, `${Number(r.bien_dong) < 0 ? "−" : "+"}${soVN(r.so_tien)}`, soVN(r.du)])} />
      {tatCa.length === 0 && <p className="py-4 text-center text-muc-3">Không có giao dịch trong khoảng ngày này.</p>}
      {(dong ?? []).length >= 5000 && <p className="mt-2 text-muc-3">Chỉ in 5.000 dòng đầu, thu hẹp khoảng ngày để in đủ.</p>}
    </ToInChung>
  );
}
