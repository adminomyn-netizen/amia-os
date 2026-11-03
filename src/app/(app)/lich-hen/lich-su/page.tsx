import Link from "next/link";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau, chuanSdt, congNgay, gioVN, homNayHCM, ngayCuaIso, ngayGioVN, ngayVN } from "@/lib/dinh-dang";
import { Bang, type Cot } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { BoLocLichSu } from "@/components/lich-hen/BoLocLichSu";
import { LUA_CHON_NGUON, MAU_TRANG_THAI, NGUON_DAT, NHAN_TRANG_THAI, nhanNguon } from "@/lib/lich-hen";
import type { Tables } from "@/lib/supabase/database.types";

const DAT = /^\d{4}-\d{2}-\d{2}$/;
const CO_TRANG = [10, 25, 50, 100];
const TOI_DA_NGAY = 92; // như SalonHero: khoảng xem tối đa 3 tháng
type Sp = { tu?: string; den?: string; cn?: string; q?: string; tt?: string; nguon?: string; tao?: string; trang?: string; moi?: string };
/** Bỏ ký tự làm hỏng điều kiện lọc của PostgREST. */
const sach = (t: string | undefined) => (t ?? "").trim().replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").slice(0, 60);

/** Lịch sử lịch hẹn: bảng riêng 11 cột như SalonHero (Mã đặt lịch, Giờ hẹn, Khách hàng, Trạng thái, Nguồn, Số khách, Dịch vụ, Kĩ thuật viên, Ghi chú, Được tạo bởi, Tạo lúc), có lọc và phân trang. */
export default async function TrangLichSuLichHen({ searchParams }: { searchParams: Promise<Sp> }) {
  const nd = await yeuCauQuyen("lich.xem");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const tu = DAT.test(sp.tu ?? "") ? sp.tu! : congNgay(homNay, -29);
  let den = DAT.test(sp.den ?? "") ? sp.den! : homNay;
  if (den < tu) den = tu;
  if (den > congNgay(tu, TOI_DA_NGAY)) den = congNgay(tu, TOI_DA_NGAY);
  const q = sach(sp.q), tao = sach(sp.tao);
  const tt = NHAN_TRANG_THAI[sp.tt ?? ""] ? sp.tt! : "";
  const nguon = sp.nguon && (NGUON_DAT[sp.nguon] || /^[A-Z0-9_]{2,20}$/.test(sp.nguon)) ? sp.nguon : "";
  const moi = CO_TRANG.includes(Number(sp.moi)) ? Number(sp.moi) : 25;
  const trang = Math.max(1, Math.min(10000, Math.floor(Number(sp.trang)) || 1));
  const db = sb();
  const { data: dsCn } = await dsChiNhanhRutGon();
  const cnId = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  const url = (doi: Record<string, string> = {}) => {
    const m: Record<string, string> = { tu, den, cn: cnId, q, tt, nguon, tao, moi: String(moi), ...doi };
    return `/lich-hen/lich-su?${new URLSearchParams(Object.entries(m).filter(([, v]) => v))}`;
  };

  // Tìm khách theo tên / SĐT / mã (cùng cách với ô tìm khách ở Đặt lịch), tìm người tạo theo tên nhân viên.
  let idsKhach: string[] | null = null, idsNguoiTao: string[] = [];
  if (q) {
    const so = chuanSdt(q);
    const { data } = await db.from("khach_hang").select("id").eq("chi_nhanh_id", cnId)
      .or([`ho_ten_khong_dau.ilike.%${boDau(q)}%`, `ma.ilike.%${q}%`, so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean).join(",")).limit(150);
    idsKhach = (data ?? []).map((k) => k.id);
  }
  // Người tạo: gõ không dấu vẫn tìm được ("duong" ra "Dương"). Tên nhân viên so ở máy chủ để ra mã người tạo; chữ tên lưu cùng lịch (lịch chuyển từ SalonHero chỉ có chữ) so bằng ilike,
  // trong đó mỗi nguyên âm / chữ d gõ không dấu thành 1 ký tự bất kỳ (chữ có dấu là 1 ký tự).
  if (tao) {
    const khop = ((await db.from("nhan_vien").select("id, ho_ten").limit(2000)).data ?? []).filter((n) => boDau(n.ho_ten).includes(boDau(tao))).slice(0, 60);
    idsNguoiTao = khop.map((n) => n.id);
  }

  const tuIso = new Date(`${tu}T00:00:00+07:00`).toISOString(), denIso = new Date(`${congNgay(den, 1)}T00:00:00+07:00`).toISOString();
  let ql = db.from("lich_hen").select("*", { count: "exact" }).eq("chi_nhanh_id", cnId).gte("bat_dau", tuIso).lt("bat_dau", denIso).order("bat_dau", { ascending: false }).order("id").range((trang - 1) * moi, trang * moi - 1);
  if (tt) ql = ql.eq("trang_thai", tt);
  if (nguon) ql = ql.eq("nguon", nguon);
  if (q) ql = ql.or([`ma_dat_lich.ilike.%${q}%`, idsKhach?.length ? `khach_id.in.(${idsKhach.join(",")})` : ""].filter(Boolean).join(","));
  if (tao) ql = ql.or([`nguoi_tao_ten.ilike.%${boDau(tao).replace(/[aeiouyd]/g, "_")}%`, idsNguoiTao.length ? `tao_boi.in.(${idsNguoiTao.join(",")})` : ""].filter(Boolean).join(","));
  const { data: lichTho, count, error } = await ql;
  const lich = (lichTho ?? []) as Tables<"lich_hen">[];
  const tong = count ?? 0;

  // Thông tin phụ chỉ cho các dòng của trang này.
  const idsL = lich.map((l) => l.id), idsK = [...new Set(lich.map((l) => l.khach_id))];
  const idsNv = [...new Set(lich.flatMap((l) => [l.nhan_vien_id, l.tao_boi]).filter((x): x is string => !!x))];
  const [{ data: ks }, { data: nvs }, { data: ldv }] = await Promise.all([
    idsK.length ? db.rpc("khach_cho_lich", { p_ids: idsK }) : Promise.resolve({ data: [] as { id: string; ma: string; ho_ten: string; dien_thoai: string; hang: string | null }[] }),
    idsNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idsNv) : Promise.resolve({ data: [] as { id: string; ho_ten: string }[] }),
    idsL.length ? db.from("lich_hen_dich_vu").select("lich_id, dich_vu(ten)").in("lich_id", idsL) : Promise.resolve({ data: [] as { lich_id: string; dich_vu: { ten: string } | null }[] }),
  ]);
  const tenK = new Map((ks ?? []).map((k) => [k.id as string, k]));
  const tenNv = new Map((nvs ?? []).map((n) => [n.id, n.ho_ten]));
  const dvCua = new Map<string, string[]>();
  for (const x of (ldv ?? []) as { lich_id: string; dich_vu: { ten: string } | null }[]) if (x.dich_vu?.ten) dvCua.set(x.lich_id, [...(dvCua.get(x.lich_id) ?? []), x.dich_vu.ten]);
  const xemSdt = coQuyen(nd, "khach.sdt");

  const cot: Cot<Tables<"lich_hen">>[] = [
    { nhan: "Mã đặt lịch", chinh: true, hienThi: (l) => <Link href={`/lich-hen?tu=${ngayCuaIso(l.bat_dau)}&den=${ngayCuaIso(l.bat_dau)}&ngay=${ngayCuaIso(l.bat_dau)}&cn=${l.chi_nhanh_id}&q=${encodeURIComponent(l.ma_dat_lich ?? "")}`} className="font-medium text-nhan-dam hover:underline">#{l.ma_dat_lich ?? l.id.slice(0, 8).toUpperCase()}</Link> },
    { nhan: "Giờ hẹn", hienThi: (l) => <span className="whitespace-nowrap tabular-nums">{gioVN(l.bat_dau)} {ngayVN(ngayCuaIso(l.bat_dau))}</span> },
    { nhan: "Khách hàng", hienThi: (l) => { const k = tenK.get(l.khach_id); return (
      <div className="min-w-[150px]"><Link href={`/khach-hang/${l.khach_id}`} className="font-medium text-nhan-dam hover:underline">{k?.ho_ten ?? "—"}</Link>
        <div className="text-[12px] text-muc-3">{xemSdt ? k?.dien_thoai : ""}{xemSdt && k?.ma ? " · " : ""}{k?.ma}</div></div>); } },
    { nhan: "Trạng thái", hienThi: (l) => <span className={`inline-block whitespace-nowrap rounded-tag px-2 py-0.5 text-[12px] font-medium ${MAU_TRANG_THAI[l.trang_thai]?.chip ?? "bg-giay-tram text-muc-2"}`}>{NHAN_TRANG_THAI[l.trang_thai] ?? l.trang_thai}</span> },
    { nhan: "Nguồn", hienThi: (l) => nhanNguon(l.nguon) || "—" },
    { nhan: "Số khách", phai: true, hienThi: (l) => l.so_khach ?? 1 },
    { nhan: "Dịch vụ", hienThi: (l) => <span className="block max-w-[260px]">{(dvCua.get(l.id) ?? []).join(", ") || l.dich_vu_ten || "—"}</span> },
    { nhan: "Kĩ thuật viên", hienThi: (l) => l.nhan_vien_ten ?? tenNv.get(l.nhan_vien_id ?? "") ?? "—" },
    { nhan: "Ghi chú", hienThi: (l) => <span className="block max-w-[220px]">{l.ghi_chu || "—"}</span> },
    { nhan: "Được tạo bởi", hienThi: (l) => l.nguoi_tao_ten ?? tenNv.get(l.tao_boi ?? "") ?? "—" },
    { nhan: "Tạo lúc", hienThi: (l) => <span className="whitespace-nowrap tabular-nums">{ngayGioVN(l.tao_luc)}</span> },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <h1 className="chu-tieu-de text-[28px] leading-[1.15] text-muc lg:text-[34px]">Lịch sử lịch hẹn</h1>
          <Link href={`/lich-hen?cn=${cnId}`} className="text-[14px] font-medium text-nhan-dam hover:underline">← Về lưới lịch hẹn</Link>
        </div>
        {!nd.chiNhanhId && (dsCn?.length ?? 0) > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">{(dsCn ?? []).map((c) => <Link key={c.id} href={url({ cn: c.id, trang: "" })} className={`rounded-nho px-3 py-1.5 ${c.id === cnId ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}</div>
        )}
      </div>
      <BoLocLichSu q={q} tt={tt} nguon={nguon} tao={tao} tu={tu} den={den} moi={String(moi)}
        luaChonTt={[{ gia_tri: "", nhan: "Tất cả trạng thái" }, ...Object.entries(NHAN_TRANG_THAI).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))]}
        luaChonNguon={[{ gia_tri: "", nhan: "Mọi nguồn đặt" }, ...LUA_CHON_NGUON]} />
      {error && <p role="alert" className="mb-3 rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Không tải được lịch sử lịch hẹn. Thử lại sau ít phút.</p>}
      <div className="rounded-the border border-vien bg-giay-sang px-4 pb-2 pt-1">
        <Bang cot={cot} duLieu={lich} khoa={(l) => l.id} trong={q || tt || nguon || tao ? "Không có lịch hẹn nào khớp bộ lọc." : "Chưa có lịch hẹn nào trong khoảng ngày này."} />
      </div>
      <ThanhTrang trang={trang} tong={tong} moi={moi} don="dữ liệu" luonHien gan={(t) => url({ trang: t ? String(t) : "" })} />
      <p className="mt-3 text-[12px] text-muc-3">Khoảng giờ hẹn từ {ngayVN(tu)} đến {ngayVN(den)} (tối đa 3 tháng một lần xem). Bảng gồm cả lịch đã huỷ và khách không đến.</p>
    </>
  );
}
