import Link from "next/link";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const TT_KY: Record<string, string> = { nhap: "Đang lập", cho_duyet: "Chờ duyệt", da_duyet: "Đã duyệt", da_chi: "Đã chi" };

export default async function TrangQuyetToanHoaHong({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "luong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem quyết toán hoa hồng.</p>;
  const sp = await searchParams, hom = homNayHCM();
  const [ny, nt] = hom.split("-").map(Number);
  const macDinh = nt === 1 ? `${ny - 1}-12` : `${ny}-${String(nt - 1).padStart(2, "0")}`;
  const thang = sp.thang && THANG.test(sp.thang) ? sp.thang : macDinh;
  const [y, m] = thang.split("-").map(Number);
  const dau = `${thang}-01`, cuoi = congNgay(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`, -1);
  const db = sb();
  const [{ data: live }, { data: nv }, { data: ky }] = await Promise.all([
    db.rpc("bc_nhan_vien", { p_tu: dau, p_den: cuoi, p_cn: nd.chiNhanhId ?? undefined }), db.from("nhan_vien").select("id, ho_ten, ma_nv"), db.from("ky_luong").select("id, trang_thai").eq("nam", y).eq("thang", m).maybeSingle(),
  ]);
  const { data: chot } = ky ? await db.from("bang_luong_dong").select("nhan_vien_id, hoa_hong").eq("ky_id", ky.id) : { data: [] as { nhan_vien_id: string; hoa_hong: number }[] };
  const ten = new Map((nv ?? []).map((n) => [n.id, `${n.ho_ten}${n.ma_nv ? ` (${n.ma_nv})` : ""}`]));
  const theoNv = new Map<string, { doanh: number; hh: number }>();
  for (const r of live ?? []) { const x = theoNv.get(r.nhan_vien_id) ?? { doanh: 0, hh: 0 }; x.doanh += Number(r.doanh_so); x.hh += Number(r.hoa_hong); theoNv.set(r.nhan_vien_id, x); }
  const daChot = new Map((chot ?? []).map((c) => [c.nhan_vien_id, Number(c.hoa_hong)]));
  const ids = [...new Set([...theoNv.keys(), ...(ky ? daChot.keys() : [])])];
  const dong = ids.map((id) => ({ id, doanh: theoNv.get(id)?.doanh ?? 0, hh: theoNv.get(id)?.hh ?? 0, chot: daChot.get(id) ?? null })).sort((a, b) => b.hh - a.hh);
  const tongHh = dong.reduce((a, r) => a + r.hh, 0), tongChot = dong.reduce((a, r) => a + (r.chot ?? 0), 0);
  const lech = ky ? dong.filter((r) => (r.chot ?? 0) !== r.hh).length : 0;
  const thangTruoc = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`, thangSau = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return (
    <div>
      <Link href="/tai-chinh" className="text-[13px] text-muc-3 hover:text-muc">← Tài chính</Link>
      <TieuDeTrang tieuDe={`Quyết toán hoa hồng ${String(m).padStart(2, "0")}/${y}`} phu="Hoa hồng tính từ doanh số hoá đơn hoàn thành theo tỉ lệ chia và bảng tỉ lệ hoa hồng. Khi tính kỳ lương, số này được chốt vào bảng lương; trang này cho thấy số hiện tại và số đã chốt để phát hiện lệch.">
        <div className="flex items-center gap-3 text-[14px]"><NutXuatExcel loai="quyet-toan-hoa-hong" ten={`quyết toán hoa hồng tháng ${thang}`} tham={{ thang }} /><Link href={`/tai-chinh/quyet-toan-hoa-hong?thang=${thangTruoc}`} className="text-nhan-dam hover:underline">← Tháng trước</Link>{thangSau <= `${ny}-${String(nt).padStart(2, "0")}` && <Link href={`/tai-chinh/quyet-toan-hoa-hong?thang=${thangSau}`} className="text-nhan-dam hover:underline">Tháng sau →</Link>}</div>
      </TieuDeTrang>
      <HangChiSo muc={[
        { nhan: "Hoa hồng hiện tại", so: tienVN(tongHh), ghiChu: `${dong.length} người` },
        { nhan: "Đã chốt vào bảng lương", so: ky ? tienVN(tongChot) : "chưa có kỳ lương", ghiChu: ky ? TT_KY[ky.trang_thai] : "" },
        { nhan: "Người lệch số", so: ky ? String(lech) : "–", ghiChu: ky ? (lech ? "tính lại kỳ lương nếu bảng chưa duyệt" : "khớp") : "" },
      ]} />
      <div className="mt-6" />
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Tháng này không có hoa hồng."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => ten.get(r.id) ?? "" }, { nhan: "Doanh số", phai: true, hienThi: (r) => tienVN(r.doanh) },
          { nhan: "Hoa hồng hiện tại", phai: true, hienThi: (r) => tienVN(r.hh) }, { nhan: "Đã chốt trong lương", phai: true, hienThi: (r) => (r.chot == null ? "" : tienVN(r.chot)) },
          { nhan: "", hienThi: (r) => (ky && (r.chot ?? 0) !== r.hh ? <NhanTrangThai kieu="cho">Lệch {tienVN(r.hh - (r.chot ?? 0))}</NhanTrangThai> : null) },
        ]} />
      {ky && <p className="mt-3 text-[13px] text-muc-3">Kỳ lương tháng này: <span>{TT_KY[ky.trang_thai]}</span>.</p>}
    </div>
  );
}
