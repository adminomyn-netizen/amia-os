import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { quyenHoSo, layHoSoDayDu } from "@/lib/data-ho-so";
import {
  LOAI_NGHI_VIEC, LOAI_THAY_DOI, NHAN_HINH_THUC_LUONG, NHOM_HO_SO, NHOM_LY_DO_NGHI, QUAN_HE_THAN_NHAN, TT_NGHI_VIEC, VAI_TRO_CHUYEN_MON, VI_TRI,
  giayToConThieu, nhomTuoi, thamNien, tuoi, tyLeDienHoSo,
} from "@/lib/ho-so";
import { GIAI_DOAN_HD, THU_TU_HD, tinhHieuLuc } from "@/lib/van-ban";
import { congNgay } from "@/lib/dinh-dang";
import { KHUNG_LAM, LOAI_NGHI, LOAI_PHIEU, TINH_TRANG_LUONG, TT_LAM, TT_PHIEU } from "@/lib/nhan-su";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { GiayToHoSo } from "@/components/nhan-su/GiayToHoSo";
import {
  capNhatBanGiao, duyetNghiViec, guiNghiViec, hoanTatNghiViec, huyNghiViec, luuHoSoNhom, luuLoTrinh, luuThongTinCongViec, themThanNhan, xoaThanNhan,
} from "../actions";

function Cap({ tieuDe, moTa, nut, children }: { tieuDe: string; moTa?: string; nut?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="the-noi the-noi-thap mb-4 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0"><h2 className="text-[16px] font-semibold text-muc">{tieuDe}</h2>{moTa && <p className="mt-0.5 text-[12.5px] text-muc-3">{moTa}</p>}</div>
        {nut}
      </div>
      {children}
    </section>
  );
}
function Cap2({ muc }: { muc: { nhan: string; gt: React.ReactNode; rong?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
      {muc.map((m) => (
        <div key={m.nhan} className={`min-w-0 ${m.rong ? "sm:col-span-2 xl:col-span-3" : ""}`}>
          <dt className="text-[12px] text-muc-3">{m.nhan}</dt>
          <dd className="mt-0.5 break-words text-[14px] text-muc">{m.gt || <span className="text-muc-3">Chưa điền</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function TrangHoSoNhanSu({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab: t }] = await Promise.all([params, searchParams]);
  const nd = await yeuCauNoiBo();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const q = await quyenHoSo(nd, id);
  if (!q.xem) notFound();
  const du = await layHoSoDayDu(id);
  if (!du) notFound();
  const { nhanVien: nv, hoSo: hs, thanNhan, taiLieu } = du;
  const quanTri = q.quanTri;
  const xemLuong = coQuyen(nd, "luong.xem"), suaLuong = coQuyen(nd, "luong.sua");
  const TAB = [
    { ma: "tong-quan", ten: "Tổng quan" }, { ma: "ho-so", ten: "Thông tin cá nhân" }, { ma: "nguoi-than", ten: `Người thân (${thanNhan.length})` }, { ma: "giay-to", ten: `Giấy tờ (${taiLieu.length})` },
    ...(quanTri ? [{ ma: "hop-dong", ten: "Hợp đồng" }, { ma: "lo-trinh", ten: "Lộ trình & lương" }] : []), { ma: "cong-phep", ten: "Công & phép" }, { ma: "nghi-viec", ten: "Nghỉ việc" },
  ];
  const tab = TAB.some((x) => x.ma === t) ? t! : "tong-quan";
  const hom = homNayHCM(), nam = Number(hom.slice(0, 4)), thang = Number(hom.slice(5, 7));
  const db = sb();
  const thieu = giayToConThieu(taiLieu);
  const goc = `/nhan-su/ho-so/${id}`;

  const [{ data: pb }, { data: cd }, { data: cn }] = await Promise.all([
    db.from("phong_ban").select("id, ten").eq("hoat_dong", true).order("thu_tu"), db.from("chuc_danh_dm").select("ten").eq("hoat_dong", true).order("thu_tu"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu"),
  ]);
  const tenPb = new Map((pb ?? []).map((p) => [p.id, p.ten])), tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));

  // ── dữ liệu theo tab (chỉ nạp phần cần) ──
  const [hd, dk, nghi, phieu, phep, congThang] = await Promise.all([
    tab === "tong-quan" || tab === "hop-dong" ? db.from("hd_lao_dong").select("*").eq("nhan_vien_id", id).then((r) => r.data ?? []) : Promise.resolve([]),
    tab === "lo-trinh" || tab === "tong-quan" ? db.from("dieu_kien_luong").select("*").eq("nhan_vien_id", id).order("hieu_luc_tu", { ascending: false }).then((r) => r.data ?? []) : Promise.resolve([]),
    tab === "nghi-viec" || tab === "tong-quan" ? db.from("nghi_viec").select("*").eq("nhan_vien_id", id).order("tao_luc", { ascending: false }).then((r) => r.data ?? []) : Promise.resolve([]),
    tab === "cong-phep" ? db.from("phieu_hr").select("*").eq("nhan_vien_id", id).order("tao_luc", { ascending: false }).limit(12).then((r) => r.data ?? []) : Promise.resolve([]),
    tab === "cong-phep" || tab === "tong-quan" ? db.rpc("so_du_phep", { p_nv: id, p_nam: nam }).then((r) => Number(r.data ?? 0)) : Promise.resolve(0),
    tab === "cong-phep" ? Promise.all([0, 1, 2].map((i) => { const d = new Date(Date.UTC(nam, thang - 1 - i, 1)); return db.rpc("tong_hop_cong", { p_nam: d.getUTCFullYear(), p_thang: d.getUTCMonth() + 1, p_cn: nv.chi_nhanh_id ?? undefined }).then((r) => ({ nam: d.getUTCFullYear(), thang: d.getUTCMonth() + 1, d: (r.data ?? []).find((x) => x.nhan_vien_id === id) })); })) : Promise.resolve([]),
  ]);

  const nhanHttl = (v: string | null) => (v ? NHAN_HINH_THUC_LUONG[v] ?? v : "");
  const tt = TT_LAM[nv.trang_thai_lam] ?? nv.trang_thai_lam;
  const ngayVao = nv.ngay_vao_lam ?? "";
  const t_ = tuoi(hs?.ngay_sinh, hom);
  const phieuNghiMoi = nghi[0];

  const truongCongViec = (): Truong[] => [
    { ten: "chuc_danh", nhan: "Chức danh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa có" }, ...(cd ?? []).map((c) => ({ gia_tri: c.ten, nhan: c.ten })), ...(nv.chuc_danh && !(cd ?? []).some((c) => c.ten === nv.chuc_danh) ? [{ gia_tri: nv.chuc_danh, nhan: nv.chuc_danh }] : [])] },
    { ten: "phong_ban_id", nhan: "Phòng ban", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa có" }, ...(pb ?? []).map((p) => ({ gia_tri: p.id, nhan: p.ten }))] },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Trụ sở / mọi chi nhánh" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] },
    { ten: "dien_thoai", nhan: "Điện thoại công việc", loai: "chu" },
    { ten: "ngay_vao_lam", nhan: "Ngày vào làm (bắt đầu thử việc)", loai: "ngay" }, { ten: "ngay_vao_chinh_thuc", nhan: "Ngày lên chính thức", loai: "ngay" },
    { ten: "khung_lam_viec", nhan: "Khung chấm công", loai: "chon", rong: true, luaChon: Object.entries(KHUNG_LAM).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "vai_tro_chuyen_mon", nhan: "Vai trò chuyên môn (chọn nhiều)", loai: "nhieu", luaChon: Object.entries(VAI_TRO_CHUYEN_MON).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
  ];

  return (
    <div>
      <Link href={q.chinhChu && !coQuyen(nd, "hr.hoso") ? "/trang-chu" : "/nhan-su/ho-so"} className="text-[13px] text-muc-3 hover:text-muc">← {coQuyen(nd, "hr.hoso") ? "Hồ sơ nhân sự" : "Trang chủ"}</Link>
      <TieuDeTrang tieuDe={nv.ho_ten} phu={<>{[nv.ma_nv, nv.chuc_danh, nv.phong_ban_id ? tenPb.get(nv.phong_ban_id) : null, nv.chi_nhanh_id ? tenCn.get(nv.chi_nhanh_id) : "Mọi chi nhánh"].filter(Boolean).join(" · ")}{" "}
        <NhanTrangThai kieu={nv.trang_thai_lam === "dang_lam" ? "tot" : nv.trang_thai_lam === "tam_nghi" ? "cho" : "tram"}>{tt}</NhanTrangThai></>}>
        {quanTri && <NutHop kieu="phu" nhan="Sửa thông tin công việc" tieuDe={`Thông tin công việc: ${nv.ho_ten}`} truong={truongCongViec()} action={luuThongTinCongViec} rong
          giaTri={{ nhan_vien_id: nv.id, chuc_danh: nv.chuc_danh ?? "", phong_ban_id: nv.phong_ban_id ?? "", chi_nhanh_id: nv.chi_nhanh_id ?? "", dien_thoai: nv.dien_thoai ?? "", ngay_vao_lam: nv.ngay_vao_lam ?? "", ngay_vao_chinh_thuc: nv.ngay_vao_chinh_thuc ?? "", khung_lam_viec: nv.khung_lam_viec, vai_tro_chuyen_mon: nv.vai_tro_chuyen_mon ?? [] }} />}
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc={goc} />

      {tab === "tong-quan" && (
        <>
          <HangChiSo muc={[
            { nhan: "Thâm niên", so: thamNien(ngayVao, hom) || "—", ghiChu: ngayVao ? `Vào làm ${ngayVN(ngayVao)}` : "Chưa có ngày vào làm" },
            { nhan: "Hồ sơ đã điền", so: `${tyLeDienHoSo(hs)}%`, ghiChu: thieu.length ? `Thiếu ${thieu.length} giấy tờ bắt buộc` : "Đủ giấy tờ bắt buộc" },
            { nhan: `Phép năm ${nam} còn`, so: `${soVN(phep)} ngày`, ghiChu: "1 ngày/tháng từ ngày lên chính thức" },
            { nhan: "Tuổi", so: t_ === null ? "—" : String(t_), ghiChu: t_ === null ? "Chưa có ngày sinh" : nhomTuoi(t_) },
          ]} />
          <div className="mt-6" />
          <Cap tieuDe="Công việc" nut={quanTri && <Link href={`${goc}?tab=lo-trinh`} className="text-[13px] text-nhan-dam hover:underline">Lộ trình thăng tiến →</Link>}>
            <Cap2 muc={[
              { nhan: "Mã nhân viên", gt: nv.ma_nv }, { nhan: "Chức danh", gt: nv.chuc_danh }, { nhan: "Phòng ban", gt: nv.phong_ban_id ? tenPb.get(nv.phong_ban_id) : "" },
              { nhan: "Chi nhánh", gt: nv.chi_nhanh_id ? tenCn.get(nv.chi_nhanh_id) : "Mọi chi nhánh" }, { nhan: "Email đăng nhập", gt: nv.email }, { nhan: "Điện thoại công việc", gt: nv.dien_thoai },
              { nhan: "Ngày vào làm", gt: ngayVN(nv.ngay_vao_lam) }, { nhan: "Ngày lên chính thức", gt: ngayVN(nv.ngay_vao_chinh_thuc) }, { nhan: "Khung chấm công", gt: KHUNG_LAM[nv.khung_lam_viec] ?? nv.khung_lam_viec },
              { nhan: "Vai trò chuyên môn", gt: (nv.vai_tro_chuyen_mon ?? []).map((m) => VAI_TRO_CHUYEN_MON[m] ?? m).join(", "), rong: true },
              ...(nv.ngay_nghi_viec ? [{ nhan: "Ngày nghỉ việc", gt: ngayVN(nv.ngay_nghi_viec) }] : []),
            ]} />
          </Cap>
          {quanTri && hd.length > 0 && (
            <Cap tieuDe="Hợp đồng lao động" nut={<Link href={`${goc}?tab=hop-dong`} className="text-[13px] text-nhan-dam hover:underline">Chi tiết →</Link>}>
              {(() => {
                const ds = [...hd].sort((a, b) => THU_TU_HD.indexOf(a.giai_doan as never) - THU_TU_HD.indexOf(b.giai_doan as never)), h = ds[ds.length - 1];
                const hl = h.giai_doan === "kxd" ? "con" : tinhHieuLuc(h.den_ngay, hom, congNgay, 45);
                return <p className="text-[14px]">{GIAI_DOAN_HD[h.giai_doan]} · từ {ngayVN(h.tu_ngay)}{h.den_ngay ? ` đến ${ngayVN(h.den_ngay)}` : ""} {hl === "het" ? <NhanTrangThai kieu="loi">Đã hết hạn</NhanTrangThai> : hl === "sap" ? <NhanTrangThai kieu="cho">Sắp hết hạn</NhanTrangThai> : <NhanTrangThai kieu="tot">Còn hiệu lực</NhanTrangThai>}</p>;
              })()}
            </Cap>
          )}
          {phieuNghiMoi && ["cho_duyet", "da_duyet"].includes(phieuNghiMoi.trang_thai) && (
            <Cap tieuDe="Đang có phiếu nghỉ việc" nut={<Link href={`${goc}?tab=nghi-viec`} className="text-[13px] text-nhan-dam hover:underline">Xem →</Link>}>
              <p className="text-[14px]">Ngày làm việc cuối {ngayVN(phieuNghiMoi.ngay_lam_cuoi)} · <NhanTrangThai kieu={TT_NGHI_VIEC[phieuNghiMoi.trang_thai].kieu}>{TT_NGHI_VIEC[phieuNghiMoi.trang_thai].ten}</NhanTrangThai></p>
            </Cap>
          )}
        </>
      )}

      {tab === "ho-so" && NHOM_HO_SO.map((n) => {
        const r = (hs ?? {}) as Record<string, string | null>;
        const truong: Truong[] = n.truong.map((f) => ({ ten: f.ten, nhan: f.nhan, loai: f.loai === "ngay" ? "ngay" : f.loai === "chon" ? "chon" : "chu", rong: f.rong, goiY: f.goiY,
          luaChon: f.loai === "chon" ? [{ gia_tri: "", nhan: "Chưa chọn" }, ...f.luaChon!.map((l) => ({ gia_tri: l, nhan: NHAN_HINH_THUC_LUONG[l] ?? l }))] : undefined }));
        const giaTri: Record<string, string> = { nhan_vien_id: id, nhom: n.ma };
        for (const f of n.truong) giaTri[f.ten] = r[f.ten] ?? "";
        return (
          <Cap key={n.ma} tieuDe={n.ten} moTa={n.moTa} nut={<NutHop kieu="chu" nhan="Sửa" tieuDe={n.ten} truong={truong} giaTri={giaTri} an={{ nhan_vien_id: id, nhom: n.ma }} action={luuHoSoNhom} />}>
            <Cap2 muc={n.truong.map((f) => ({ nhan: f.nhan, rong: f.rong, gt: f.ten.startsWith("ngay") ? ngayVN(r[f.ten]) : f.ten === "hinh_thuc_nhan_luong" ? nhanHttl(r[f.ten]) : r[f.ten] }))} />
          </Cap>
        );
      })}

      {tab === "nguoi-than" && (
        <Cap tieuDe="Người thân và người phụ thuộc" moTa="Khai người phụ thuộc để được giảm trừ gia cảnh khi tính thuế TNCN."
          nut={<NutHop nhan="Thêm người thân" tieuDe="Thêm người thân" action={themThanNhan} an={{ nhan_vien_id: id }} giaTri={{ quan_he: "Con" }}
            truong={[{ ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "quan_he", nhan: "Quan hệ", loai: "chon", batBuoc: true, luaChon: QUAN_HE_THAN_NHAN.map((x) => ({ gia_tri: x, nhan: x })) },
              { ten: "ngay_sinh", nhan: "Ngày sinh", loai: "ngay" }, { ten: "cccd", nhan: "Số CCCD", loai: "chu" }, { ten: "phu_thuoc", nhan: "Đăng ký là người phụ thuộc (giảm trừ gia cảnh)", loai: "gat", rong: true }]} />}>
          <Bang duLieu={thanNhan} khoa={(r) => r.id} trong="Chưa khai người thân nào."
            cot={[
              { nhan: "Họ tên", chinh: true, hienThi: (r) => r.ho_ten }, { nhan: "Quan hệ", hienThi: (r) => r.quan_he }, { nhan: "Ngày sinh", hienThi: (r) => ngayVN(r.ngay_sinh) },
              { nhan: "Phụ thuộc", hienThi: (r) => (r.phu_thuoc ? <NhanTrangThai kieu="tot">Người phụ thuộc</NhanTrangThai> : "") },
              { nhan: "", hienThi: (r) => <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ho_ten}`} xacNhan="Xoá người thân này khỏi hồ sơ?" action={xoaThanNhan} an={{ id: r.id, nhan_vien_id: id }} nhanLuu="Xoá" /> },
            ]} />
          {thanNhan.filter((x) => x.phu_thuoc).length > 0 && <p className="mt-3 text-[13px] text-muc-3">Số người phụ thuộc đã khai: {thanNhan.filter((x) => x.phu_thuoc).length}. Số dùng để tính thuế nằm ở điều kiện lương.</p>}
        </Cap>
      )}

      {tab === "giay-to" && <Cap tieuDe="Giấy tờ đính kèm"><GiayToHoSo nhanVienId={id} quanTri={quanTri} taiLieu={taiLieu} /></Cap>}

      {tab === "hop-dong" && quanTri && (
        <Cap tieuDe="Chuỗi hợp đồng lao động" moTa="Thử việc 60 ngày → HĐLĐ lần 1 (12 tháng) → lần 2 → không xác định thời hạn." nut={coQuyen(nd, "cong.xem") && <Link href="/nhan-su/hop-dong" className="text-[13px] text-nhan-dam hover:underline">Thêm / sửa ở Hợp đồng lao động →</Link>}>
          <Bang duLieu={[...hd].sort((a, b) => THU_TU_HD.indexOf(a.giai_doan as never) - THU_TU_HD.indexOf(b.giai_doan as never))} khoa={(r) => r.id} trong="Chưa có hợp đồng nào."
            cot={[
              { nhan: "Giai đoạn", chinh: true, hienThi: (r) => GIAI_DOAN_HD[r.giai_doan] }, { nhan: "Số hợp đồng", hienThi: (r) => r.so_hd ?? "" },
              { nhan: "Từ ngày", hienThi: (r) => ngayVN(r.tu_ngay) }, { nhan: "Đến ngày", hienThi: (r) => (r.den_ngay ? ngayVN(r.den_ngay) : "Không thời hạn") },
              { nhan: "Bản điện tử", hienThi: (r) => (r.link_ban_dien_tu ? <a href={r.link_ban_dien_tu} target="_blank" rel="noopener noreferrer" className="text-nhan-dam hover:underline">Mở</a> : "") },
            ]} />
        </Cap>
      )}

      {tab === "lo-trinh" && quanTri && (
        <Cap tieuDe="Lộ trình thăng tiến và điều kiện lương" moTa="Mỗi lần điều chỉnh là một dòng mới có hiệu lực theo ngày; kỳ lương lấy dòng hiệu lực mới nhất không sau cuối tháng."
          nut={<div className="flex flex-wrap gap-2">
            <NutHop kieu="phu" nhan="Ghi mốc lộ trình" tieuDe="Ghi mốc lộ trình" action={luuLoTrinh} an={{ nhan_vien_id: id }} giaTri={{ hieu_luc_tu: hom, chuc_danh: nv.chuc_danh ?? "", phong_ban_id: nv.phong_ban_id ?? "", loai_thay_doi: "dieu_chinh" }} rong
              truong={[
                { ten: "hieu_luc_tu", nhan: "Có hiệu lực từ", loai: "ngay", batBuoc: true }, { ten: "loai_thay_doi", nhan: "Loại thay đổi", loai: "chon", luaChon: Object.entries(LOAI_THAY_DOI).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
                { ten: "chuc_danh", nhan: "Chức danh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Giữ nguyên" }, ...(cd ?? []).map((c) => ({ gia_tri: c.ten, nhan: c.ten }))] },
                { ten: "phong_ban_id", nhan: "Phòng ban", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Giữ nguyên" }, ...(pb ?? []).map((p) => ({ gia_tri: p.id, nhan: p.ten }))] },
                { ten: "vi_tri", nhan: "Vị trí", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không đổi" }, ...Object.entries(VI_TRI).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))] },
                { ten: "so_quyet_dinh", nhan: "Số quyết định", loai: "chu" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
              ]} />
            {suaLuong && <Link href="/nhan-su/luong/dieu-kien" className="self-center text-[13px] text-nhan-dam hover:underline">Cài điều kiện lương →</Link>}
          </div>}>
          <Bang duLieu={dk} khoa={(r) => r.id} trong="Chưa có mốc nào."
            cot={[
              { nhan: "Hiệu lực từ", chinh: true, hienThi: (r) => ngayVN(r.hieu_luc_tu) },
              { nhan: "Thay đổi", hienThi: (r) => (r.loai_thay_doi ? LOAI_THAY_DOI[r.loai_thay_doi] : "") },
              { nhan: "Chức danh / phòng ban", hienThi: (r) => <div>{r.chuc_danh ?? ""}<div className="text-[12.5px] text-muc-3">{[r.phong_ban_id ? tenPb.get(r.phong_ban_id) : "", r.vi_tri ? VI_TRI[r.vi_tri] : ""].filter(Boolean).join(" · ")}</div></div> },
              { nhan: "Tình trạng", hienThi: (r) => TINH_TRANG_LUONG[r.tinh_trang] ?? r.tinh_trang },
              ...(xemLuong ? [{ nhan: "Lương cơ bản", phai: true, hienThi: (r: (typeof dk)[number]) => tienVN(r.luong_co_ban) }, { nhan: "BHXH", hienThi: (r: (typeof dk)[number]) => (r.dong_bh ? `Đóng (${tienVN(r.luong_dong_bh)})` : "Không") }] : []),
              { nhan: "Quyết định", hienThi: (r) => <div>{r.so_quyet_dinh ?? ""}{r.ghi_chu && <div className="text-[12.5px] text-muc-3">{r.ghi_chu}</div>}</div> },
            ]} />
          {!xemLuong && <p className="mt-3 text-[12.5px] text-muc-3">Số tiền lương chỉ hiện với người có quyền xem lương.</p>}
        </Cap>
      )}

      {tab === "cong-phep" && (
        <>
          <HangChiSo muc={[{ nhan: `Phép năm ${nam} còn lại`, so: `${soVN(phep)} ngày`, ghiChu: "1 ngày/tháng từ ngày lên chính thức" }, { nhan: "Khung chấm công", so: KHUNG_LAM[nv.khung_lam_viec]?.split(" (")[0] ?? "" }]} />
          <div className="mt-6" />
          <Cap tieuDe="Công 3 tháng gần nhất" nut={coQuyen(nd, "cong.xem") && <Link href="/nhan-su/cham-cong" className="text-[13px] text-nhan-dam hover:underline">Bảng chấm công →</Link>}>
            <Bang duLieu={congThang} khoa={(r) => `${r.nam}-${r.thang}`} trong="Chưa có dữ liệu."
              cot={[
                { nhan: "Tháng", chinh: true, hienThi: (r) => `${r.thang}/${r.nam}` }, { nhan: "Công chuẩn", phai: true, hienThi: (r) => soVN(r.d?.cong_chuan) },
                { nhan: "Đi làm", phai: true, hienThi: (r) => soVN(r.d?.cong_di_lam) }, { nhan: "Phép", phai: true, hienThi: (r) => soVN(r.d?.phep_co_luong) },
                { nhan: "Trễ (phút)", phai: true, hienThi: (r) => soVN(r.d?.phut_tre) }, { nhan: "Vắng (ngày)", phai: true, hienThi: (r) => soVN(r.d?.ngay_vang) }, { nhan: "Tăng ca (giờ)", phai: true, hienThi: (r) => soVN(r.d?.ot_gio) },
                { nhan: "Công tính lương", phai: true, hienThi: (r) => soVN(r.d?.cong_tinh_luong) },
              ]} />
          </Cap>
          <Cap tieuDe="Phiếu gần đây" nut={<Link href="/nhan-su/ngay-nghi" className="text-[13px] text-nhan-dam hover:underline">Quản lý ngày nghỉ →</Link>}>
            <Bang duLieu={phieu} khoa={(r) => r.id} trong="Chưa có phiếu nào."
              cot={[
                { nhan: "Mã", chinh: true, hienThi: (r) => r.ma }, { nhan: "Loại", hienThi: (r) => <div>{LOAI_PHIEU[r.loai]}{r.loai_nghi && <div className="text-[12.5px] text-muc-3">{LOAI_NGHI[r.loai_nghi]}</div>}</div> },
                { nhan: "Thời gian", hienThi: (r) => `${ngayVN(r.tu_ngay)}${r.den_ngay !== r.tu_ngay ? ` – ${ngayVN(r.den_ngay)}` : ""}` },
                { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_PHIEU[r.trang_thai].kieu}>{TT_PHIEU[r.trang_thai].ten}</NhanTrangThai> },
              ]} />
          </Cap>
        </>
      )}

      {tab === "nghi-viec" && (
        <>
          {(!phieuNghiMoi || !["cho_duyet", "da_duyet"].includes(phieuNghiMoi.trang_thai)) && nv.trang_thai_lam !== "nghi_viec" && (
            <Cap tieuDe="Xin nghỉ việc" moTa="Gửi đơn cho Ban Giám đốc duyệt. Sau khi duyệt, HCNS cùng bạn bàn giao và ký biên bản trước ngày làm việc cuối.">
              <NutHop nhan="Gửi đơn xin nghỉ việc" tieuDe="Đơn xin nghỉ việc" action={guiNghiViec} an={{ nhan_vien_id: id }} giaTri={{ loai: "dung_han", nhom_ly_do: "khac" }}
                moTa={'Báo trước đúng quy định thì chọn "Đúng hạn báo trước". Lý do giúp công ty cải thiện, không ảnh hưởng quyền lợi của bạn.'}
                truong={[
                  { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_NGHI_VIEC).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
                  { ten: "ngay_lam_cuoi", nhan: "Ngày làm việc cuối cùng", loai: "ngay", batBuoc: true },
                  { ten: "nhom_ly_do", nhan: "Lý do chính", loai: "chon", batBuoc: true, rong: true, luaChon: Object.entries(NHOM_LY_DO_NGHI).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
                  { ten: "ly_do", nhan: "Chia sẻ thêm (không bắt buộc)", loai: "nhieu_dong", rong: true },
                ]} />
            </Cap>
          )}
          {nghi.length === 0 ? <p className="text-[13px] text-muc-3">Chưa có phiếu nghỉ việc nào.</p> : nghi.map((p) => (
            <Cap key={p.id} tieuDe={`Phiếu nghỉ việc ${ngayVN(p.tao_luc.slice(0, 10))}`} nut={<NhanTrangThai kieu={TT_NGHI_VIEC[p.trang_thai].kieu}>{TT_NGHI_VIEC[p.trang_thai].ten}</NhanTrangThai>}>
              <Cap2 muc={[
                { nhan: "Loại", gt: LOAI_NGHI_VIEC[p.loai] }, { nhan: "Ngày làm việc cuối", gt: ngayVN(p.ngay_lam_cuoi) }, { nhan: "Lý do chính", gt: NHOM_LY_DO_NGHI[p.nhom_ly_do] },
                { nhan: "Chia sẻ thêm", gt: p.ly_do, rong: true },
                ...(["da_duyet", "hoan_tat"].includes(p.trang_thai) ? [{ nhan: "Bàn giao", gt: p.ban_giao_xong ? "Đã xong" : "Chưa xong" }, { nhan: "Biên bản thoả thuận nghỉ việc", gt: p.bien_ban_thoa_thuan ? "Đã ký" : "Chưa ký" }, { nhan: "Cam kết bảo mật", gt: p.cam_ket_bao_mat ? "Đã ký" : "Chưa ký" }] : []),
                ...(p.ly_do_duyet ? [{ nhan: "Ghi chú của người duyệt", gt: p.ly_do_duyet, rong: true }] : []),
              ]} />
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {p.trang_thai === "cho_duyet" && coQuyen(nd, "nghi.duyet_bgd") && (
                  <>
                    <NutHop kieu="chu" nhan="Duyệt" tieuDe="Duyệt đơn nghỉ việc" xacNhan="Duyệt đơn nghỉ việc này? HCNS sẽ tiếp tục bàn giao." action={duyetNghiViec} an={{ id: p.id, quyet: "duyet" }} nhanLuu="Duyệt" />
                    <NutHop kieu="chu" nguy nhan="Từ chối" tieuDe="Từ chối đơn nghỉ việc" action={duyetNghiViec} an={{ id: p.id, quyet: "tu_choi" }} truong={[{ ten: "ly_do_duyet", nhan: "Lý do từ chối", loai: "nhieu_dong", batBuoc: true, rong: true }]} nhanLuu="Từ chối" />
                  </>
                )}
                {p.trang_thai === "cho_duyet" && <NutHop kieu="chu" nguy nhan="Huỷ đơn" tieuDe="Huỷ đơn nghỉ việc" xacNhan="Huỷ đơn xin nghỉ việc này?" action={huyNghiViec} an={{ id: p.id }} nhanLuu="Huỷ đơn" />}
                {p.trang_thai === "da_duyet" && quanTri && (
                  <>
                    <NutHop kieu="chu" nhan="Cập nhật bàn giao" tieuDe="Bàn giao và biên bản" action={capNhatBanGiao} an={{ id: p.id }}
                      giaTri={{ ban_giao_xong: p.ban_giao_xong, bien_ban_thoa_thuan: p.bien_ban_thoa_thuan, cam_ket_bao_mat: p.cam_ket_bao_mat, khao_sat: p.khao_sat ?? "" }}
                      truong={[{ ten: "ban_giao_xong", nhan: "Đã bàn giao xong công việc", loai: "gat", rong: true }, { ten: "bien_ban_thoa_thuan", nhan: "Đã ký biên bản thoả thuận nghỉ việc", loai: "gat", rong: true }, { ten: "cam_ket_bao_mat", nhan: "Đã ký cam kết bảo mật", loai: "gat", rong: true }, { ten: "khao_sat", nhan: "Khảo sát thôi việc (link hoặc tóm tắt)", loai: "nhieu_dong", rong: true }]} />
                    <NutHop kieu="chu" nguy nhan="Hoàn tất nghỉ việc" tieuDe="Hoàn tất nghỉ việc" xacNhan="Khoá tài khoản và ghi ngày nghỉ việc. Hồ sơ vẫn được giữ lại. Chắc chắn hoàn tất?" action={hoanTatNghiViec} an={{ id: p.id }} nhanLuu="Hoàn tất" />
                  </>
                )}
              </div>
            </Cap>
          ))}
        </>
      )}
    </div>
  );
}
