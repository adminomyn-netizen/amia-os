import Link from "next/link";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { BieuDoTron } from "@/components/bieu-do/BieuDoTron";
import { CotNgang } from "@/components/bieu-do/CotNgang";
import { CotDung } from "@/components/bieu-do/CotDung";
import { DuongMien } from "@/components/bieu-do/DuongMien";
import { VongTienDo } from "@/components/bieu-do/VongTienDo";
import { NHAN_VAI_TRO, VAI_TRO } from "@/lib/quyen";

/** Các bảng điều hành (mỗi tab một bảng, vẽ bằng SVG ở máy chủ). Số liệu gom ở DB; `cn` = chi nhánh của người xem (null = mọi chi nhánh). */
const cnArg = (cn: string | null) => (cn ?? undefined) as string;
const DAY = (dl: { nhan: string; gia_tri: number }[]) => dl.sort((a, b) => b.gia_tri - a.gia_tri);

type PhanBo = { nhom: string; nhan: string; so: number; tien: number };
async function layPhanBo(cn: string | null) {
  const { data } = await sb().rpc("bc_phan_bo", { p_cn: cnArg(cn) });
  const ds = (data ?? []) as PhanBo[];
  const nhom = (n: string) => ds.filter((r) => r.nhom === n);
  return { nhom, so: (n: string) => nhom(n).map((r) => ({ nhan: r.nhan, gia_tri: Number(r.so) })), tien: (n: string) => nhom(n).map((r) => ({ nhan: r.nhan, gia_tri: Number(r.tien) })) };
}
const doiNhan = (dl: { nhan: string; gia_tri: number }[], bang: Record<string, string>) => dl.map((d) => ({ ...d, nhan: bang[d.nhan] ?? d.nhan }));

const NHAN_TRANG_THAI_KHACH = { dang_lieu_trinh: "Đang liệu trình", het_lieu_trinh: "Hết liệu trình", da_den: "Đã đến", lead: "Khách tiềm năng", mat: "Lâu không đến" };
const NHAN_NGUON = { mkt: "Marketing", telesale: "Telesale", tu_van: "Tư vấn", khach_cu_gioi_thieu: "Khách cũ giới thiệu", khac: "Khác / chưa rõ" };
const NHAN_THE = { hoat_dong: "Đang dùng", sap_het: "Sắp hết", het_han: "Hết hạn", hoan_thanh: "Đã dùng hết", thu_hoi: "Thu hồi", khoa: "Khoá" };
const NHAN_PHIEU = { cho_cap: "Chờ kho cấp", da_cap: "Đã cấp", da_nhan: "KTV đã nhận", da_lam: "Đã làm", da_doi_chieu: "Đã đối chiếu", huy: "Huỷ" };
const NHAN_LOAI_BAN = { dich_vu: "Dịch vụ", san_pham: "Sản phẩm", goi_the: "Gói thẻ" };

const luoi = "grid gap-6 lg:grid-cols-2";
const ngayNganVN = (d: string) => d.slice(8) + "/" + d.slice(5, 7);

export async function BangDoanhThu({ cn }: { cn: string | null }) {
  const db = sb();
  const homNay = homNayHCM(), dauThang = `${homNay.slice(0, 8)}01`;
  const [{ data: ngay30 }, { data: thang }, { data: mucBan }, { data: nv }] = await Promise.all([
    db.rpc("bc_doanh_thu_ngay", { p_tu: congNgay(homNay, -29), p_den: homNay, p_cn: cnArg(cn) }),
    db.rpc("bc_doanh_thu_ngay", { p_tu: dauThang, p_den: homNay, p_cn: cnArg(cn) }),
    db.rpc("bc_muc_ban", { p_tu: dauThang, p_den: homNay, p_cn: cnArg(cn) }),
    db.rpc("bc_nhan_vien", { p_tu: dauThang, p_den: homNay, p_cn: cnArg(cn) }),
  ]);
  const t = (k: "doanh_thu" | "thuc_thu" | "so_don" | "so_buoi" | "no_moi" | "tien_mat" | "chuyen_khoan" | "quet_the" | "tru_the_tien") => (thang ?? []).reduce((s, r) => s + Number(r[k]), 0);
  const ids = [...new Set((nv ?? []).map((r) => r.nhan_vien_id).filter((x): x is string => !!x))];
  const { data: ten } = ids.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", ids) : { data: [] };
  const tenNv = new Map((ten ?? []).map((x) => [x.id, x.ho_ten]));
  const theoNv = new Map<string, number>();
  for (const r of nv ?? []) theoNv.set(r.nhan_vien_id, (theoNv.get(r.nhan_vien_id) ?? 0) + Number(r.doanh_so));
  const theoLoai = new Map<string, number>();
  for (const r of mucBan ?? []) theoLoai.set(r.loai, (theoLoai.get(r.loai) ?? 0) + Number(r.doanh_so));
  const tr = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr` : tienVN(n));
  return (
    <div className="space-y-6">
      <HangChiSo muc={[
        { nhan: "Doanh thu tháng này", so: tienVN(t("doanh_thu")), ghiChu: `${soVN(t("so_don"))} đơn` },
        { nhan: "Thực thu tháng này", so: tienVN(t("thuc_thu")), ghiChu: "tiền mặt, chuyển khoản, quẹt thẻ" },
        { nhan: "Công nợ mới trong tháng", so: tienVN(t("no_moi")) },
        { nhan: "Buổi đã làm", so: soVN(t("so_buoi")) },
      ]} />
      <MucTrang noi tieuDe="Doanh thu 30 ngày gần nhất" phai={<Link href="/bao-cao" className="font-medium text-nhan-dam hover:underline">Báo cáo chi tiết</Link>}>
        <DuongMien ten="Doanh thu và thực thu 30 ngày" nhan={(ngay30 ?? []).map((r) => ngayNganVN(r.ngay))} dinhDang={tienVN}
          chuoi={[{ ten: "Doanh thu", gia_tri: (ngay30 ?? []).map((r) => Number(r.doanh_thu)), mau: "var(--sac-luc-mau)" }, { ten: "Thực thu", gia_tri: (ngay30 ?? []).map((r) => Number(r.thuc_thu)), mau: "var(--dat)" }]} />
      </MucTrang>
      <div className={luoi}>
        <MucTrang noi tieuDe="Thực thu theo hình thức (tháng này)"><BieuDoTron ten="Thực thu theo hình thức" kieu="vong" nhanTam="đồng" dinhDang={tr} duLieu={[{ nhan: "Tiền mặt", gia_tri: t("tien_mat") }, { nhan: "Chuyển khoản", gia_tri: t("chuyen_khoan") }, { nhan: "Quẹt thẻ", gia_tri: t("quet_the") }, { nhan: "Trừ thẻ tiền", gia_tri: t("tru_the_tien") }]} /></MucTrang>
        <MucTrang noi tieuDe="Cơ cấu doanh số (tháng này)"><BieuDoTron ten="Cơ cấu doanh số" kieu="banh" dinhDang={tr} duLieu={[...theoLoai].map(([k, v]) => ({ nhan: NHAN_LOAI_BAN[k as keyof typeof NHAN_LOAI_BAN] ?? k, gia_tri: v }))} /></MucTrang>
        <MucTrang noi tieuDe="Top dịch vụ / sản phẩm bán chạy (tháng này)"><CotNgang dinhDang={tr} duLieu={(mucBan ?? []).slice(0, 8).map((r) => ({ nhan: r.ten, gia_tri: Number(r.doanh_so) }))} trong="Tháng này chưa có đơn nào." /></MucTrang>
        <MucTrang noi tieuDe="Doanh số theo nhân viên (tháng này)"><CotNgang mau="var(--sac-xanh-mau)" dinhDang={tr} duLieu={DAY([...theoNv].map(([id, v]) => ({ nhan: tenNv.get(id) ?? "Không rõ", gia_tri: v }))).slice(0, 8)} trong="Tháng này chưa có doanh số theo nhân viên." /></MucTrang>
      </div>
    </div>
  );
}

export async function BangKhach({ cn }: { cn: string | null }) {
  const pb = await layPhanBo(cn);
  const tong = pb.so("trang_thai").reduce((s, d) => s + d.gia_tri, 0);
  const g = (k: string) => pb.so("trang_thai").find((d) => d.nhan === k)?.gia_tri ?? 0;
  const homNay = homNayHCM();
  const thangNay = homNay.slice(0, 7);
  const moi = pb.so("khach_moi").find((d) => d.nhan === thangNay)?.gia_tri ?? 0;
  const thang = pb.so("khach_moi").sort((a, b) => a.nhan.localeCompare(b.nhan)).map((d) => ({ nhan: `T${Number(d.nhan.slice(5))}`, gia_tri: d.gia_tri }));
  return (
    <div className="space-y-6">
      <HangChiSo muc={[
        { nhan: "Tổng số khách", so: soVN(tong) }, { nhan: "Đang liệu trình", so: soVN(g("dang_lieu_trinh")), ghiChu: `${tong ? ((g("dang_lieu_trinh") / tong) * 100).toFixed(1) : 0}% tổng khách` },
        { nhan: "Lâu không đến", so: soVN(g("mat")), ghiChu: "cần chăm sóc lại" }, { nhan: "Khách mới tháng này", so: soVN(moi) },
      ]} />
      <div className={luoi}>
        <MucTrang noi tieuDe="Khách theo hạng"><BieuDoTron ten="Khách theo hạng" kieu="vong" nhanTam="khách" duLieu={DAY(pb.so("hang"))} /></MucTrang>
        <MucTrang noi tieuDe="Khách theo trạng thái"><BieuDoTron ten="Khách theo trạng thái" kieu="banh" duLieu={DAY(doiNhan(pb.so("trang_thai"), NHAN_TRANG_THAI_KHACH))} /></MucTrang>
        <MucTrang noi tieuDe="Khách theo nguồn"><BieuDoTron ten="Khách theo nguồn" kieu="vong" nhanTam="khách" duLieu={DAY(doiNhan(pb.so("nguon"), NHAN_NGUON))} /></MucTrang>
        <MucTrang noi tieuDe="Khách mới 6 tháng gần nhất"><CotDung ten="Khách mới theo tháng" duLieu={thang} /></MucTrang>
        <MucTrang noi tieuDe="Khách theo người phụ trách"><CotNgang mau="var(--dat)" duLieu={DAY(pb.so("phu_trach"))} /></MucTrang>
      </div>
    </div>
  );
}

export async function BangTheNo({ cn, xemTien }: { cn: string | null; xemTien: boolean }) {
  const db = sb();
  const pb = await layPhanBo(cn);
  const [{ data: du }, { data: no }] = await Promise.all([
    db.rpc("bc_the_con_du", { p_cn: cnArg(cn) }),
    xemTien ? (() => { let q = db.from("hoa_don").select("id, ma, khach_id, con_no, ngay_hd").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("con_no", { ascending: false }).limit(8); if (cn) q = q.eq("chi_nhanh_id", cn); return q; })() : Promise.resolve({ data: [] }),
  ]);
  const d = du?.[0];
  const idsK = [...new Set((no ?? []).map((r) => r.khach_id).filter((x): x is string => !!x))];
  const { data: ks } = idsK.length ? await db.from("khach_hang").select("id, ho_ten").in("id", idsK) : { data: [] };
  const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten]));
  const tongNo = pb.tien("no_tuoi").reduce((s, x) => s + x.gia_tri, 0), soHd = pb.so("no_tuoi").reduce((s, x) => s + x.gia_tri, 0);
  const dangDung = pb.so("the_lan").find((x) => x.nhan === "hoat_dong")?.gia_tri ?? 0, tongLan = pb.so("the_lan").reduce((s, x) => s + x.gia_tri, 0);
  const tuoiThu: Record<string, number> = { "0-30 ngày": 0, "31-90 ngày": 1, "Trên 90 ngày": 2 };
  const tuoi = pb.tien("no_tuoi").sort((a, b) => tuoiThu[a.nhan] - tuoiThu[b.nhan]);
  return (
    <div className="space-y-6">
      <HangChiSo muc={[
        { nhan: "Thẻ liệu trình đang dùng", so: soVN(dangDung), ghiChu: `trên ${soVN(tongLan)} thẻ đã cấp` },
        { nhan: "Buổi còn lại (thẻ có giới hạn)", so: soVN(d?.so_buoi), ghiChu: `${soVN(d?.so_the_lan)} thẻ · ${soVN(d?.so_the_khong_gioi_han)} thẻ không giới hạn` },
        ...(xemTien ? [{ nhan: "Giá trị buổi chưa dùng", so: tienVN(d?.gia_tri_buoi) }, { nhan: "Số dư thẻ tiền", so: tienVN(d?.du_tien), ghiChu: `${soVN(d?.so_the_tien)} thẻ` }] : []),
      ]} />
      <div className={luoi}>
        <MucTrang noi tieuDe="Thẻ liệu trình theo tình trạng"><BieuDoTron ten="Thẻ liệu trình theo tình trạng" kieu="vong" nhanTam="thẻ" duLieu={DAY(doiNhan(pb.so("the_lan"), NHAN_THE))} /></MucTrang>
        <MucTrang noi tieuDe="Thẻ tiền theo tình trạng"><BieuDoTron ten="Thẻ tiền theo tình trạng" kieu="banh" duLieu={DAY(doiNhan(pb.so("the_tien"), NHAN_THE))} /></MucTrang>
        {xemTien && (
          <>
            <MucTrang noi tieuDe="Công nợ theo tuổi nợ" phai={<Link href="/bao-cao?tab=no" className="font-medium text-nhan-dam hover:underline">Xem chi tiết</Link>}>
              <div className="mb-4 flex items-end justify-between gap-4"><div><div className="text-[26px] font-medium leading-none tabular-nums">{tienVN(tongNo)}</div><div className="mt-1.5 text-[13px] text-muc-3">{soVN(soHd)} hoá đơn còn nợ</div></div>
                <VongTienDo tyLe={tongNo ? ((tuoi.find((x) => x.nhan === "Trên 90 ngày")?.gia_tri ?? 0) / tongNo) * 100 : 0} nhan="nợ quá 90 ngày" so="" /></div>
              <CotNgang mau="var(--sac-hong-mau)" dinhDang={(n) => `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`} duLieu={tuoi} />
            </MucTrang>
            <MucTrang noi tieuDe="Khách nợ nhiều nhất">
              {(no ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Không có công nợ.</p> : (
                <ul className="divide-y divide-vien">{(no ?? []).map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-[14px]"><Link href={r.khach_id ? `/khach-hang/${r.khach_id}` : "/hoa-don"} className="min-w-0 truncate hover:text-nhan-dam">{tenK.get(r.khach_id ?? "") ?? "Khách"} <span className="text-muc-3">· {ngayVN(r.ngay_hd)}</span></Link><span className="shrink-0 tabular-nums text-muc">{tienVN(r.con_no)}</span></li>)}</ul>
              )}
            </MucTrang>
          </>
        )}
      </div>
    </div>
  );
}

export async function BangKho({ cn }: { cn: string | null }) {
  const db = sb();
  const pb = await layPhanBo(cn);
  let q = db.from("v_ton_kho").select("san_pham_id, ma, ten, ton, ton_toi_thieu, don_vi, duoi_muc_toi_thieu");
  if (cn) q = q.eq("chi_nhanh_id", cn);
  const { data } = await q;
  const ds = data ?? [];
  const thieu = ds.filter((r) => r.duoi_muc_toi_thieu);
  return (
    <div className="space-y-6">
      <HangChiSo muc={[{ nhan: "Mặt hàng đang theo dõi", so: soVN(ds.length) }, { nhan: "Dưới mức tồn tối thiểu", so: soVN(thieu.length), ghiChu: thieu.length ? "cần nhập thêm" : "kho đủ" }, { nhan: "Phiếu cấp đang chờ", so: soVN(pb.so("phieu").filter((p) => p.nhan === "cho_cap" || p.nhan === "da_cap").reduce((s, p) => s + p.gia_tri, 0)) }]} />
      <div className={luoi}>
        <MucTrang noi tieuDe="Tình trạng tồn kho"><BieuDoTron ten="Tình trạng tồn kho" kieu="vong" nhanTam="mặt hàng" duLieu={[{ nhan: "Đủ hàng", gia_tri: ds.length - thieu.length }, { nhan: "Dưới mức tối thiểu", gia_tri: thieu.length }]} /></MucTrang>
        <MucTrang noi tieuDe="Phiếu cấp vật tư theo trạng thái"><BieuDoTron ten="Phiếu cấp theo trạng thái" kieu="banh" duLieu={DAY(doiNhan(pb.so("phieu"), NHAN_PHIEU))} /></MucTrang>
        <MucTrang noi tieuDe="Mặt hàng cần nhập" phai={<Link href="/kho?thieu=1" className="font-medium text-nhan-dam hover:underline">Mở kho</Link>}>
          {thieu.length === 0 ? <p className="text-[14px] text-muc-3">Không có mặt hàng nào dưới mức tối thiểu.</p> : <CotNgang mau="var(--sac-hong-mau)" duLieu={thieu.slice(0, 8).map((r) => ({ nhan: `${r.ten}`, gia_tri: Number(r.ton) }))} dinhDang={(n) => soVN(n)} />}
        </MucTrang>
      </div>
    </div>
  );
}

export async function BangHeThong() {
  const { data: nv } = await sb().from("nhan_vien").select("vai_tro, user_id, hoat_dong, phai_doi_mat_khau, quyen_rieng");
  const ds = nv ?? [];
  const coTk = ds.filter((n) => n.user_id);
  const daDoi = coTk.filter((n) => !n.phai_doi_mat_khau).length;
  return (
    <div className="space-y-6">
      <div className={luoi}>
        <MucTrang noi tieuDe="Hồ sơ nhân viên theo vai trò"><BieuDoTron ten="Hồ sơ theo vai trò" kieu="vong" nhanTam="hồ sơ" duLieu={VAI_TRO.map((v) => ({ nhan: NHAN_VAI_TRO[v], gia_tri: ds.filter((n) => n.vai_tro === v).length })).filter((x) => x.gia_tri > 0).sort((a, b) => b.gia_tri - a.gia_tri)} /></MucTrang>
        <MucTrang noi tieuDe="An toàn tài khoản">
          <div className="space-y-5">
            <VongTienDo tyLe={coTk.length ? (daDoi / coTk.length) * 100 : 0} nhan="tài khoản đã đổi mật khẩu mặc định" so={`${daDoi}/${coTk.length}`} />
            <VongTienDo tyLe={ds.length ? (coTk.length / ds.length) * 100 : 0} nhan="hồ sơ đã có tài khoản đăng nhập" so={`${coTk.length}/${ds.length}`} />
          </div>
        </MucTrang>
      </div>
    </div>
  );
}
