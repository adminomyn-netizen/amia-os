import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, tienVN } from "@/lib/dinh-dang";
import { quyCuaThang, tienThuong, xepHangCaNhan, xepHangPhong, xepHangTrongPhong, type KyKpi } from "@/lib/kpi-thi-dua";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { BangXepHangDep, type DongXepHang } from "@/components/trang-chu/BangXepHangDep";
import { luuDiemKpi, luuThuongKpi } from "./actions";

const HANG_NHAN = ["", "Hạng 1", "Hạng 2", "Hạng 3"];

/** KPI và thi đua: điểm tháng của từng người đổ về, xếp hạng phòng, cá nhân trong phòng và toàn công ty để thi đua, thưởng theo tháng/quý.
 *  Xem: sếp, kỹ thuật, nhân sự thấy cả công ty; trưởng phòng thấy mọi phòng và chi tiết phòng mình; nhân viên thấy phòng mình và xếp hạng toàn công ty.
 *  Bảng xếp hạng cố ý đọc cả công ty (không khoá chi nhánh) vì mục đích là thi đua chung; chỉ lấy tên, phòng, điểm. */
export default async function TrangKpi({ searchParams }: { searchParams: Promise<{ ky?: string; nam?: string; moc?: string }> }) {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "cong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem KPI.</p>;
  const sp = await searchParams, hom = homNayHCM();
  const ky: KyKpi = sp.ky === "quy" ? "quy" : "thang";
  const nam = Number(sp.nam) >= 2020 && Number(sp.nam) <= 2100 ? Number(sp.nam) : Number(hom.slice(0, 4));
  const thangNay = Number(hom.slice(5, 7));
  const mocMax = ky === "quy" ? 4 : 12;
  const moc = Number(sp.moc) >= 1 && Number(sp.moc) <= mocMax ? Number(sp.moc) : ky === "quy" ? quyCuaThang(thangNay) : thangNay;
  const db = sb();
  const [{ data: nvAll }, { data: pb }, { data: diem }, { data: thuong }] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten, ma_nv, phong_ban_id, chuc_danh").eq("hoat_dong", true).is("ngay_nghi_viec", null),
    db.from("phong_ban").select("id, ten, truong_phong_id").eq("hoat_dong", true).order("thu_tu"),
    db.from("kpi_diem").select("nhan_vien_id, nam, thang, diem").eq("nam", nam),
    db.from("kpi_thuong").select("ky, doi_tuong, hang, so_tien"),
  ]);
  const nv = nvAll ?? [], phongs = pb ?? [], tenPb = new Map(phongs.map((p) => [p.id, p.ten]));
  const nguoi = new Map(nv.map((n) => [n.id, { ten: n.ho_ten, phongId: n.phong_ban_id }]));
  const canhan = xepHangCaNhan(diem ?? [], nam, ky, moc, nguoi);
  const phong = xepHangPhong(canhan, (id) => tenPb.get(id) ?? "Khác");
  const toanCty = coQuyen(nd, "hr.hoso") || nd.vaiTro === "chu" || nd.vaiTro === "ky_thuat";
  const toi = nv.find((n) => n.id === nd.nhanVienId);
  const truongPhong = phongs.filter((p) => p.truong_phong_id === nd.nhanVienId).map((p) => p.id);
  const phongToi = new Set([...(toi?.phong_ban_id ? [toi.phong_ban_id] : []), ...truongPhong]);
  const phongHienChiTiet = phongs.filter((p) => toanCty || phongToi.has(p.id));
  const thuongBang = (thuong ?? []).map((t) => ({ ...t, so_tien: Number(t.so_tien) }));
  const nhanKy = ky === "quy" ? `Quý ${moc}/${nam}` : `Tháng ${moc}/${nam}`;
  const dong = (ds: { ten: string; diem: number; phu?: string; thuong: number; hang: number }[]): DongXepHang[] =>
    ds.map((x) => ({ ten: x.ten, phu: x.phu, chu: `${x.diem} điểm`, gt: x.diem, chiTiet: [{ nhan: "Hạng", gt: String(x.hang) }, ...(x.thuong ? [{ nhan: "Thưởng", gt: tienVN(x.thuong) }] : [])] }));
  const lienKet = (k: KyKpi, n: number, m: number) => `/nhan-su/kpi?ky=${k}&nam=${n}&moc=${m}`;
  const truongDiem: Truong[] = [
    { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, rong: true, luaChon: nv.filter((n) => toanCty || (n.phong_ban_id && phongToi.has(n.phong_ban_id)) ).map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten}${n.phong_ban_id ? ` · ${tenPb.get(n.phong_ban_id) ?? ""}` : ""}` })) },
    { ten: "nam", nhan: "Năm", loai: "so", batBuoc: true }, { ten: "thang", nhan: "Tháng", loai: "so", batBuoc: true }, { ten: "diem", nhan: "Điểm KPI", loai: "so", batBuoc: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  const truongThuong: Truong[] = [
    { ten: "ky", nhan: "Kỳ", loai: "chon", luaChon: [{ gia_tri: "thang", nhan: "Tháng" }, { gia_tri: "quy", nhan: "Quý" }] },
    { ten: "doi_tuong", nhan: "Đối tượng", loai: "chon", luaChon: [{ gia_tri: "phong", nhan: "Phòng" }, { gia_tri: "ca_nhan_phong", nhan: "Cá nhân trong phòng" }, { gia_tri: "cong_ty", nhan: "Cá nhân toàn công ty" }] },
    { ten: "hang", nhan: "Hạng", loai: "chon", luaChon: [1, 2, 3].map((h) => ({ gia_tri: String(h), nhan: HANG_NHAN[h] })) }, { ten: "so_tien", nhan: "Tiền thưởng", loai: "tien" },
  ];
  const suaDiem = toanCty && coQuyen(nd, "hr.hoso") || truongPhong.length > 0;
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="KPI và thi đua" phu={`${nhanKy}. Điểm KPI từng người đổ về mỗi tháng; xếp hạng phòng, cá nhân trong phòng và toàn công ty để thi đua, thưởng theo tháng, quý.`}>
        {suaDiem && <NutHop nhan="Nhập điểm KPI" tieuDe="Nhập điểm KPI tháng" truong={truongDiem} action={luuDiemKpi} giaTri={{ nam: String(nam), thang: String(ky === "thang" ? moc : thangNay) }} />}
      </TieuDeTrang>
      <nav aria-label="Kỳ xem" className="mb-5 flex flex-wrap items-center gap-2 text-[14px]">
        {(["thang", "quy"] as const).map((k) => <Link key={k} href={lienKet(k, nam, k === "quy" ? quyCuaThang(thangNay) : thangNay)} aria-current={ky === k ? "page" : undefined} className={`rounded-nho border px-3.5 py-2 ${ky === k ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{k === "thang" ? "Theo tháng" : "Theo quý"}</Link>)}
        <span className="mx-1 text-muc-3">|</span>
        {Array.from({ length: mocMax }, (_, i) => i + 1).map((m) => <Link key={m} href={lienKet(ky, nam, m)} aria-current={m === moc ? "page" : undefined} className={`rounded-nho px-2.5 py-1.5 tabular-nums ${m === moc ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:bg-giay-tram"}`}>{ky === "quy" ? `Q${m}` : m}</Link>)}
        <span className="mx-1 text-muc-3">|</span>
        <Link href={lienKet(ky, nam - 1, moc)} className="text-muc-2 hover:underline">{nam - 1}</Link><span className="font-medium">{nam}</span><Link href={lienKet(ky, nam + 1, moc)} className="text-muc-2 hover:underline">{nam + 1}</Link>
      </nav>
      <div className="grid gap-5 lg:grid-cols-2">
        <BangXepHangDep tieuDe={`Thi đua giữa các phòng, ${nhanKy}`} Icon={Users} trong="Chưa có điểm KPI nào trong kỳ này."
          dong={dong(phong.map((p) => ({ ten: p.ten, diem: p.diem, phu: `${p.soNguoi} người có điểm`, hang: p.hang, thuong: tienThuong(thuongBang, ky, "phong", p.hang) })))} />
        <BangXepHangDep tieuDe={`Xếp hạng cá nhân toàn công ty, ${nhanKy}`} Icon={Trophy} trong="Chưa có điểm KPI nào trong kỳ này."
          dong={dong(canhan.slice(0, 20).map((n) => ({ ten: n.ten, diem: n.diem, phu: n.phongId ? tenPb.get(n.phongId) : undefined, hang: n.hang, thuong: tienThuong(thuongBang, ky, "cong_ty", n.hang) })))} />
      </div>
      <section className="mt-8">
        <h2 className="nhan-muc mb-3">{toanCty ? "Từng phòng" : "Phòng của bạn"}</h2>
        {phongHienChiTiet.length === 0 && <p className="text-[14px] text-muc-3">Bạn chưa được gán vào phòng nào.</p>}
        <div className="space-y-6">
          {phongHienChiTiet.map((p) => {
            const trong = xepHangTrongPhong(canhan, p.id), hangPhong = phong.find((x) => x.id === p.id);
            return (
              <div key={p.id}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-medium">{p.ten}</h3><span className="text-[13px] text-muc-3">{hangPhong ? `Hạng ${hangPhong.hang} giữa các phòng, ${hangPhong.diem} điểm` : "Chưa có điểm trong kỳ"}</span></div>
                <Bang duLieu={trong} khoa={(r) => r.id} trong="Chưa ai trong phòng có điểm."
                  cot={[
                    { nhan: "Hạng", phai: true, hienThi: (r) => r.hang }, { nhan: "Nhân viên", chinh: true, hienThi: (r) => r.ten },
                    { nhan: "Điểm", phai: true, hienThi: (r) => r.diem }, { nhan: "Thưởng", phai: true, hienThi: (r) => { const t = tienThuong(thuongBang, ky, "ca_nhan_phong", r.hang); return t ? tienVN(t) : "—"; } },
                  ]} />
              </div>
            );
          })}
        </div>
      </section>
      {coQuyen(nd, "hr.hoso") && (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="nhan-muc">Mức thưởng thi đua</h2>
            {!nd.chiNhanhId && <NutHop nhan="Đặt mức thưởng" tieuDe="Đặt mức thưởng" truong={truongThuong} action={luuThuongKpi} giaTri={{ ky: "thang", doi_tuong: "phong", hang: "1" }} />}</div>
          <Bang duLieu={[...thuongBang].sort((a, b) => a.ky.localeCompare(b.ky) || a.doi_tuong.localeCompare(b.doi_tuong) || a.hang - b.hang)} khoa={(r) => `${r.ky}${r.doi_tuong}${r.hang}`} trong="Chưa đặt mức thưởng nào."
            cot={[
              { nhan: "Kỳ", hienThi: (r) => (r.ky === "quy" ? "Quý" : "Tháng") }, { nhan: "Đối tượng", hienThi: (r) => ({ phong: "Phòng", ca_nhan_phong: "Cá nhân trong phòng", cong_ty: "Cá nhân toàn công ty" })[r.doi_tuong] },
              { nhan: "Hạng", hienThi: (r) => HANG_NHAN[r.hang] }, { nhan: "Tiền thưởng", phai: true, hienThi: (r) => tienVN(r.so_tien) },
            ]} />
        </section>
      )}
    </div>
  );
}
