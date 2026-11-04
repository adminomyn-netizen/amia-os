import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { dsChiNhanhRutGon } from "@/lib/chi-nhanh";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { NHAN_LECH, NHAN_VAN_DE_KHO, VAN_DE_NANG, phanLoaiLech, tinhBoiCanh, vanDeVatTu, type VatTuKho } from "@/lib/chuan-hoa-kho";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NutHop } from "@/components/ui/BieuMau";
import { DongSua } from "./DongSua";
import { taoKiemKeTonDau } from "./actions";

const TAB = [{ ma: "viec", ten: "Việc cần làm" }, { ma: "ton-dau", ten: "Tồn đầu & đối chiếu" }];
const MOI_TRANG = 40;

export default async function TrangChuanHoaKho({ searchParams }: { searchParams: Promise<{ tab?: string; loai?: string; trang?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("kho.xem");
  const sp = await searchParams;
  const tab = sp.tab === "ton-dau" ? "ton-dau" : "viec";
  const sua = (coQuyen(nd, "kho.duyet") || coQuyen(nd, "danhmuc.sua")) && !nd.chiNhanhId;
  const db = sb();
  const [{ data: dsSp }, { data: dm }, { data: dsCn }] = await Promise.all([
    db.from("san_pham").select("id, ma, ten, nhom, nhom_cap, don_vi, don_vi_mua, he_so_quy_doi, gia_nhap_don_vi, tieu_hao, theo_doi_kho, ban_le, ma_vach, hoat_dong").eq("hoat_dong", true).order("ten"),
    db.from("dinh_muc").select("san_pham_id"), dsChiNhanhRutGon(),
  ]);
  const vatTu: VatTuKho[] = (dsSp ?? []).map((s) => ({ ...s, he_so_quy_doi: Number(s.he_so_quy_doi), gia_nhap_don_vi: s.gia_nhap_don_vi == null ? null : Number(s.gia_nhap_don_vi) }));
  const bc = tinhBoiCanh(vatTu, (dm ?? []).map((x) => x.san_pham_id));
  const cn = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
  const chonCn = !nd.chiNhanhId && (dsCn?.length ?? 0) > 1 ? (
    <div className="mb-4 flex gap-2 text-[14px]">{(dsCn ?? []).map((c) => <Link key={c.id} href={`/kho/chuan-hoa?tab=${tab}&cn=${c.id}`} className={`rounded-nho px-3 py-2 ${c.id === cn ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}</div>
  ) : null;

  let noiDung: React.ReactNode;
  if (tab === "viec") {
    const dong = vatTu.map((s) => ({ s, vd: vanDeVatTu(s, bc) })).filter((x) => x.vd.length > 0);
    const dem = new Map<string, number>();
    for (const x of dong) for (const v of x.vd) dem.set(v, (dem.get(v) ?? 0) + 1);
    const loc = sp.loai && NHAN_VAN_DE_KHO[sp.loai] ? sp.loai : "";
    const ds = loc ? dong.filter((x) => x.vd.includes(loc)) : dong;
    const trang = Math.max(1, Math.min(Number(sp.trang) || 1, Math.max(1, Math.ceil(ds.length / MOI_TRANG))));
    const hien = ds.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);
    const gan = (t: number | undefined) => `/kho/chuan-hoa?${new URLSearchParams(Object.entries({ tab: "viec", loai: loc || undefined, trang: t && t > 1 ? String(t) : undefined }).filter((e): e is [string, string] => !!e[1])).toString()}`;
    noiDung = (
      <>
        <p className="mb-4 max-w-3xl text-[13.5px] leading-snug text-muc-3">Mỗi dòng là một mặt hàng cần chuẩn hoá trước khi định mức và phiếu cấp chạy đúng. Giá nhập còn thiếu chỉ được nhắc, hệ thống không tự điền số. Sửa xong bấm &quot;Lưu dòng này&quot;; mỗi lần lưu đều có nhật ký.{!sua && " Tài khoản của anh/chị chỉ được xem."}</p>
        <nav aria-label="Lọc theo vấn đề" className="mb-5 flex flex-wrap gap-2 text-[13px]">
          <Link href="/kho/chuan-hoa" className={`rounded-nho px-3 py-1.5 ${!loc ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:text-muc"}`}>Tất cả ({dong.length})</Link>
          {Object.entries(NHAN_VAN_DE_KHO).filter(([k]) => dem.get(k)).map(([k, n]) => (
            <Link key={k} href={`/kho/chuan-hoa?loai=${k}`} className={`rounded-nho px-3 py-1.5 ${loc === k ? "bg-nhan-nhat font-medium text-nhan-dam" : (VAN_DE_NANG as readonly string[]).includes(k) ? "text-canh-bao hover:text-muc" : "text-muc-2 hover:text-muc"}`}>{n} ({dem.get(k)})</Link>
          ))}
        </nav>
        {hien.length === 0 ? <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">Không còn vấn đề nào ở nhóm này.</p> : (
          <ul>{hien.map(({ s, vd }) => <DongSua key={`${s.id}-${s.don_vi}-${s.don_vi_mua}-${s.gia_nhap_don_vi}-${s.nhom_cap}-${s.tieu_hao}-${s.he_so_quy_doi}`} sua={sua} nhanVanDe={NHAN_VAN_DE_KHO} d={{ id: s.id, ma: s.ma, ten: s.ten, nhom: s.nhom, don_vi: s.don_vi, don_vi_mua: s.don_vi_mua, he_so_quy_doi: Number(s.he_so_quy_doi), gia_nhap_don_vi: s.gia_nhap_don_vi, nhom_cap: s.nhom_cap, tieu_hao: s.tieu_hao, vanDe: vd }} />)}</ul>
        )}
        <ThanhTrang trang={trang} tong={ds.length} moi={MOI_TRANG} gan={gan} don="mặt hàng" />
      </>
    );
  } else {
    const [{ data: ton }, { data: ref }, { data: kk }] = await Promise.all([
      db.from("v_ton_kho").select("san_pham_id, ton").eq("chi_nhanh_id", cn),
      db.from("kho_ton_sh_tham_chieu").select("sh_id, san_pham_id, ten_sh, ton_cuoi").eq("chi_nhanh_id", cn),
      db.from("phieu_kiem_ke").select("id, ma, trang_thai, loai").eq("chi_nhanh_id", cn).in("trang_thai", ["dang_dem", "cho_duyet"]).maybeSingle(),
    ]);
    const tonMap = new Map((ton ?? []).map((t) => [t.san_pham_id, Number(t.ton)]));
    const coSo = new Set((ton ?? []).map((t) => t.san_pham_id));
    const spMap = new Map(vatTu.map((s) => [s.id, s]));
    const refMap = new Map((ref ?? []).filter((r) => r.san_pham_id).map((r) => [r.san_pham_id!, Number(r.ton_cuoi)]));
    const dongRef = (ref ?? []).map((r) => ({ ten: spMap.get(r.san_pham_id ?? "")?.ten ?? r.ten_sh, sh: Number(r.ton_cuoi), amia: tonMap.get(r.san_pham_id ?? "") ?? 0, don_vi: spMap.get(r.san_pham_id ?? "")?.don_vi ?? "", id: `${r.sh_id}` }))
      .map((r) => ({ ...r, ...phanLoaiLech(r.sh, r.amia) }));
    const lech = dongRef.filter((r) => r.loai !== "khop");
    const chiAmia = vatTu.filter((s) => s.theo_doi_kho && !refMap.has(s.id) && (tonMap.get(s.id) ?? 0) !== 0 && !s.tieu_hao);
    const demLoai = (l: string) => dongRef.filter((r) => r.loai === l).length;
    const thieuTonDau = vatTu.filter((s) => s.theo_doi_kho && s.tieu_hao && (tonMap.get(s.id) ?? 0) <= 0);
    const tonAm = vatTu.filter((s) => (tonMap.get(s.id) ?? 0) < 0);
    noiDung = (
      <>
        {chonCn}
        <p className="mb-4 max-w-3xl text-[13.5px] leading-snug text-muc-3">So tồn trong sổ kho AMIA với tồn cuối SalonHero chốt 28/10 tại {tenCn.get(cn) ?? "chi nhánh này"}. Trang này chỉ so sánh, không tự sửa sổ. Muốn chốt số đúng thì tạo phiếu kiểm kê tồn đầu: hai người đếm, nhập số lô và hạn dùng, người khác duyệt thì phần thừa mới vào sổ dưới dạng &quot;Tồn đầu kỳ&quot;.</p>
        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          {[["Khớp SalonHero", demLoai("khop")], ["SalonHero ghi âm, AMIA để 0", demLoai("sh_am")], ["Lệch thật cần xem", demLoai("amia_nhieu") + demLoai("amia_it")], ["Vật tư tiêu hao chưa có tồn", thieuTonDau.length]].map(([t, n]) => (
            <div key={String(t)}><dt className="text-[12.5px] text-muc-3">{t}</dt><dd className="text-[24px] tabular-nums text-muc">{n}</dd></div>
          ))}
        </dl>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {kk ? <Link href={`/kho/kiem-ke/${kk.id}`} className="text-[14px] font-medium text-nhan-dam hover:underline">Đang có phiếu kiểm kê {kk.ma} chưa xong, mở phiếu</Link>
            : coQuyen(nd, "kho.nhap") ? <NutHop nhan="Tạo phiếu kiểm kê tồn đầu" tieuDe="Tạo phiếu kiểm kê tồn đầu" moTa="Hệ thống chụp tồn sổ của mọi mặt hàng theo dõi kho. Người đếm nhập số thực tế, số lô, hạn dùng; người khác duyệt." an={{ chi_nhanh_id: cn }} nhanLuu="Tạo phiếu" action={taoKiemKeTonDau} rong /> : null}
        </div>
        {tonAm.length > 0 && <p className="mb-4 text-[13.5px] text-loi">{tonAm.length} mặt hàng đang tồn âm tại chi nhánh này: {tonAm.slice(0, 5).map((s) => s.ten).join("; ")}{tonAm.length > 5 ? "…" : ""}</p>}
        <h2 className="mb-2 text-[15px] font-semibold text-muc">Vật tư dùng trong ca chưa có tồn ({thieuTonDau.length})</h2>
        <p className="mb-3 max-w-3xl text-[13px] text-muc-3">Phiếu cấp vật tư bị chặn &quot;Kho không đủ&quot; khi tồn bằng 0. Các vật tư này chưa có dòng tồn nào trong sổ kho; cần kiểm kê tồn đầu hoặc nhập kho.</p>
        <Bang duLieu={thieuTonDau.slice(0, 60)} khoa={(r) => r.id} trong="Mọi vật tư tiêu hao đều đã có tồn."
          cot={[{ chinh: true, nhan: "Vật tư", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Đơn vị", hienThi: (r) => r.don_vi }, { nhan: "Tồn sổ", phai: true, hienThi: (r) => soVN(tonMap.get(r.id) ?? 0) }, { nhan: "Có dòng sổ", hienThi: (r) => (coSo.has(r.id) ? "Có" : "Chưa") }]} />
        <h2 className="mb-2 mt-10 text-[15px] font-semibold text-muc">Chênh lệch với SalonHero ({lech.length})</h2>
        {(ref ?? []).length === 0 ? <p className="text-[13.5px] text-muc-3">Chưa nạp tồn SalonHero cho chi nhánh này (chạy scripts/kho/nap-ton-salonhero.mjs).</p> : (
          <Bang duLieu={lech.slice(0, 200)} khoa={(r) => r.id} trong="Không có chênh lệch."
            cot={[{ chinh: true, nhan: "Mặt hàng", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "SalonHero", phai: true, hienThi: (r) => soVN(r.sh) }, { nhan: "AMIA", phai: true, hienThi: (r) => `${soVN(r.amia)} ${r.don_vi}` }, { nhan: "Chênh", phai: true, hienThi: (r) => soVN(r.chenh) }, { nhan: "Ghi chú", hienThi: (r) => NHAN_LECH[r.loai] }]} />
        )}
        {chiAmia.length > 0 && <p className="mt-4 text-[13px] text-muc-3">{chiAmia.length} mặt hàng có tồn ở AMIA nhưng SalonHero không có: {chiAmia.slice(0, 5).map((s) => s.ten).join("; ")}{chiAmia.length > 5 ? "…" : ""}</p>}
      </>
    );
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho", nhan: "Kho" }} tieuDe="Chuẩn hoá vật tư" phu="Đơn vị, đơn vị mua, giá nhập, nhóm cấp, trùng tên và tồn đầu. Làm xong bước này mới đặt định mức và cấp vật tư trước ca." />
      <Tab muc={TAB} dang={tab} goc="/kho/chuan-hoa" them={cn ? `&cn=${cn}` : ""} />
      {noiDung}
    </div>
  );
}
