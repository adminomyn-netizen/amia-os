import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayCuaIso, ngayVN, tienVN } from "@/lib/dinh-dang";
import { LOAI_DX, TT_DX } from "@/lib/de-xuat";
import { LOAI_PHIEU, LOAI_NGHI, TT_PHIEU } from "@/lib/nhan-su";
import { TT_DON } from "@/app/(app)/kho-mua-sam/mua-hang/page";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { duyetDeXuat, tuChoiDeXuat, chiTheoDeXuat, lapDonMuaTuDeXuat } from "../actions";
import { duyetDonMua, tuChoiDonMua } from "@/app/(app)/kho-mua-sam/actions";
import { duyetPhieuHr, tuChoiPhieuHr } from "@/app/(app)/nhan-su/actions";

type Dong = {
  khoa: string; nguon: "dx" | "dm" | "hr"; soNgay?: number; id: string; ma: string; loai: string; tieuDe: string; nguoiGui: string | null; chiNhanh: string; tien: number | null;
  tt: string; ttTen: string; kieu: "tot" | "cho" | "loi" | "tram"; luc: string; han: string | null; ly: string | null; loaiDx?: string; quy?: string | null;
};

const TAB = [
  { ma: "tat-ca", ten: "Tất cả" }, { ma: "hr", ten: "Nghỉ phép · OT · HR" }, { ma: "cho-duyet", ten: "Chờ tôi duyệt" }, { ma: "cho-thuc-hien", ten: "Chờ thực hiện" },
  { ma: "toi-gui", ten: "Tôi đã gửi" }, { ma: "da-xu-ly", ten: "Đã xử lý" }, { ma: "tu-choi", ten: "Bị từ chối" },
];

export default async function TrangPheDuyet({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const duyetDx = coQuyen(nd, "dexuat.duyet"), duyetDm = coQuyen(nd, "mua.duyet"), chi = coQuyen(nd, "quy.ghi"), lapDon = coQuyen(nd, "mua.tao");
  const duyetHr = coQuyen(nd, "nghi.duyet"), xemHr = duyetHr || coQuyen(nd, "cong.xem");
  const xemHet = duyetDx || chi || lapDon || duyetDm;
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "tat-ca";
  const db = sb();
  let qx = db.from("de_xuat").select("*").order("tao_luc", { ascending: false }).limit(300);
  if (!xemHet) qx = qx.eq("nguoi_gui_id", nd.nhanVienId);
  else if (nd.chiNhanhId) qx = qx.eq("chi_nhanh_id", nd.chiNhanhId);
  let qm = db.from("don_mua").select("*").in("trang_thai", ["cho_duyet", "da_duyet", "dang_nhan", "da_nhan"]).order("tao_luc", { ascending: false }).limit(200);
  if (nd.chiNhanhId) qm = qm.eq("chi_nhanh_id", nd.chiNhanhId);
  const coDm = coQuyen(nd, "mua.xem");
  const [{ data: dx }, { data: dm }, { data: hr }, { data: nv }, { data: cn }, { data: quy }, { data: ncc }, { data: ltc }] = await Promise.all([
    qx, coDm ? qm : Promise.resolve({ data: [] as never[] }),
    (xemHr ? db.from("phieu_hr").select("*").order("tao_luc", { ascending: false }).limit(300) : db.from("phieu_hr").select("*").or(`nhan_vien_id.eq.${nd.nhanVienId},nguoi_gui_id.eq.${nd.nhanVienId}`).order("tao_luc", { ascending: false }).limit(100)),
    db.from("nhan_vien").select("id, ho_ten, chi_nhanh_id"), db.from("chi_nhanh").select("id, ten"),
    chi ? db.from("quy").select("id, ten, chi_nhanh_id").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] }),
    lapDon ? db.from("nha_cung_cap").select("id, ten").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] }),
    chi ? db.from("loai_thu_chi").select("id, ten").eq("huong", "chi").eq("he_thong", false).eq("hoat_dong", true).order("thu_tu") : Promise.resolve({ data: [] }),
  ]);
  const ids = (dm ?? []).map((d) => d.id);
  const { data: dong } = ids.length ? await db.from("don_mua_dong").select("don_mua_id, so_luong, don_gia").in("don_mua_id", ids) : { data: [] };
  const tongDm = new Map<string, number>();
  for (const d of dong ?? []) tongDm.set(d.don_mua_id, (tongDm.get(d.don_mua_id) ?? 0) + Math.round(Number(d.so_luong) * Number(d.don_gia)));
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));

  const cnCua = new Map((nv ?? []).map((n) => [n.id, n.chi_nhanh_id]));
  const hrDong: Dong[] = (hr ?? []).filter((r) => !nd.chiNhanhId || !xemHr || cnCua.get(r.nhan_vien_id) === nd.chiNhanhId).map((r): Dong => ({
    khoa: `hr${r.id}`, nguon: "hr", id: r.id, ma: r.ma, loai: `Phiếu ${LOAI_PHIEU[r.loai].toLowerCase()}`, soNgay: Number(r.so_ngay),
    tieuDe: `${r.loai_nghi ? `${LOAI_NGHI[r.loai_nghi]} · ` : ""}${ngayVN(r.tu_ngay)}${r.den_ngay !== r.tu_ngay ? ` – ${ngayVN(r.den_ngay)}` : ""} · ${r.so_gio ? `${r.so_gio} giờ` : `${r.so_ngay} ngày`} — ${r.ly_do}${r.qua_han_bao_truoc ? " (báo trễ)" : ""}${r.vuot_han_muc ? " (quên chấm công quá 3 lần/tháng)" : ""}`,
    nguoiGui: r.nhan_vien_id, chiNhanh: tenCn.get(cnCua.get(r.nhan_vien_id) ?? "") ?? "", tien: null, tt: r.trang_thai, ttTen: TT_PHIEU[r.trang_thai].ten, kieu: TT_PHIEU[r.trang_thai].kieu, luc: r.tao_luc, han: null, ly: r.ly_do_duyet && r.trang_thai === "tu_choi" ? r.ly_do_duyet : null,
  }));
  const tatCa: Dong[] = [
    ...(dx ?? []).map((r): Dong => ({ khoa: `dx${r.id}`, nguon: "dx", id: r.id, ma: r.ma, loai: `Đề xuất ${LOAI_DX[r.loai as keyof typeof LOAI_DX].toLowerCase()}`, tieuDe: r.tieu_de, nguoiGui: r.nguoi_gui_id, chiNhanh: tenCn.get(r.chi_nhanh_id) ?? "", tien: r.so_tien, tt: r.trang_thai, ttTen: TT_DX[r.trang_thai].ten, kieu: TT_DX[r.trang_thai].kieu, luc: r.tao_luc, han: r.han_duyet, ly: r.ly_do, loaiDx: r.loai })),
    ...(dm ?? []).map((r): Dong => ({ khoa: `dm${r.id}`, nguon: "dm", id: r.id, ma: r.ma, loai: "Đơn mua hàng", tieuDe: r.ghi_chu || "Đơn mua hàng", nguoiGui: r.nguoi_tao_id, chiNhanh: tenCn.get(r.chi_nhanh_id) ?? "", tien: tongDm.get(r.id) ?? 0, tt: r.trang_thai, ttTen: TT_DON[r.trang_thai].ten, kieu: TT_DON[r.trang_thai].kieu, luc: r.tao_luc, han: null, ly: r.ly_do })),
    ...hrDong,
  ].sort((a, b) => b.luc.localeCompare(a.luc));

  const choToiDuyet = (r: Dong) => r.tt === "cho_duyet" && (r.nguon === "dx" ? duyetDx : r.nguon === "hr" ? duyetHr : duyetDm) && (r.nguoiGui !== nd.nhanVienId || nd.vaiTro === "ky_thuat") && (r.nguon !== "hr" || (r.soNgay ?? 0) < 4 || r.loai !== "Phiếu nghỉ" || coQuyen(nd, "nghi.duyet_bgd"));
  const choThucHien = (r: Dong) => r.nguon === "dx" && r.tt === "da_duyet" && (r.loaiDx === "mua_sam" ? lapDon : chi);
  const daXuLy = (r: Dong) => ["da_duyet", "da_thuc_hien", "tu_choi", "huy", "dang_nhan", "da_nhan"].includes(r.tt) && !choThucHien(r);
  const loc: Record<string, (r: Dong) => boolean> = {
    "tat-ca": () => true, hr: (r) => r.nguon === "hr", "cho-duyet": choToiDuyet, "cho-thuc-hien": choThucHien, "toi-gui": (r) => r.nguoiGui === nd.nhanVienId, "da-xu-ly": daXuLy, "tu-choi": (r) => r.tt === "tu_choi",
  };
  const dem = (ma: string) => tatCa.filter(loc[ma]).length;
  const hienThi = tatCa.filter(loc[tab]);
  const hom = homNayHCM();
  const lyDo = (nhan: string): Truong[] => [{ ten: "ly_do", nhan, loai: "nhieu_dong", batBuoc: true, rong: true }];

  return (
    <div>
      <Link href="/noi-lam-viec" className="text-[13px] text-muc-3 hover:text-muc">← Nơi làm việc</Link>
      <TieuDeTrang tieuDe="Trung tâm phê duyệt" phu="Một nơi duy nhất duyệt đề xuất mua sắm, thanh toán, tạm ứng và đơn mua hàng. Duyệt xong thì thực hiện ngay tại đây: chi từ sổ quỹ hoặc lập đơn mua." />
      <HangChiSo muc={[{ nhan: "Chờ tôi duyệt", so: String(dem("cho-duyet")) }, { nhan: "Chờ thực hiện", so: String(dem("cho-thuc-hien")) }, { nhan: "Tôi đã gửi", so: String(dem("toi-gui")) }, { nhan: "Bị từ chối", so: String(dem("tu-choi")) }]} />
      <div className="mt-6" />
      <Tab muc={TAB.map((x) => ({ ma: x.ma, ten: `${x.ten} (${dem(x.ma)})` }))} dang={tab} goc="/noi-lam-viec/phe-duyet" />
      <Bang duLieu={hienThi} khoa={(r) => r.khoa} trong="Không có mục nào."
        cot={[
          { nhan: "Loại", chinh: true, hienThi: (r) => <div><div className="text-muc">{r.loai}</div><div className="text-[12.5px] text-muc-3">{r.ma}</div></div> },
          { nhan: "Nội dung", hienThi: (r) => <div><span className="text-muc">{r.tieuDe}</span>{r.ly && <div className="mt-0.5 text-[13px] text-loi">{r.ly}</div>}</div> },
          { nhan: "Người gửi", hienThi: (r) => <div>{ten.get(r.nguoiGui ?? "") ?? ""}<div className="text-[12.5px] text-muc-3">{r.chiNhanh} · {ngayVN(ngayCuaIso(r.luc))}</div></div> },
          { nhan: "Số tiền", phai: true, hienThi: (r) => (r.tien ? tienVN(r.tien) : "") },
          { nhan: "Hạn duyệt", hienThi: (r) => (r.han && r.tt === "cho_duyet" ? <span className={r.han < hom ? "text-loi" : ""}>{ngayVN(r.han)}{r.han < hom ? " · quá hạn" : ""}</span> : "") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.kieu}>{r.ttTen}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => {
            const nut = [];
            if (choToiDuyet(r)) {
              nut.push(<NutHop key="d" kieu="chu" nhan="Duyệt" tieuDe="Duyệt" xacNhan={`Duyệt ${r.ma}${r.tien ? ` · ${tienVN(r.tien)}` : ""}?`} action={r.nguon === "dx" ? duyetDeXuat : r.nguon === "hr" ? duyetPhieuHr : duyetDonMua} an={r.nguon === "dm" ? { don_id: r.id } : { id: r.id }} nhanLuu="Duyệt" />);
              nut.push(<NutHop key="t" kieu="chu" nguy nhan="Từ chối" tieuDe="Từ chối" truong={lyDo("Lý do từ chối")} action={r.nguon === "dx" ? tuChoiDeXuat : r.nguon === "hr" ? tuChoiPhieuHr : tuChoiDonMua} an={r.nguon === "dm" ? { don_id: r.id } : { id: r.id }} nhanLuu="Từ chối" />);
            }
            if (choThucHien(r) && r.loaiDx !== "mua_sam") {
              const cnId = (dx ?? []).find((x) => x.id === r.id)?.chi_nhanh_id;
              nut.push(<NutHop key="c" kieu="chu" nhan={r.loaiDx === "hoan_ung" ? "Thực hiện" : "Chi tiền"} tieuDe={`${r.loaiDx === "hoan_ung" ? "Thực hiện hoàn ứng" : "Chi tiền"} · ${r.ma}`} moTa={r.loaiDx === "hoan_ung" ? `${r.tieuDe} — chi thực tế ${tienVN(r.tien)}. Hệ thống so với khoản tạm ứng gốc: thiếu thì chi thêm, thừa thì thu lại vào quỹ, bằng nhau thì chỉ đóng.` : `${r.tieuDe} — ${tienVN(r.tien)}. Ghi một dòng chi vào sổ quỹ. Người duyệt không tự chi cùng đề xuất (trừ Kỹ thuật).`} action={chiTheoDeXuat} an={{ id: r.id }} giaTri={{ ngay: hom }} nhanLuu={r.loaiDx === "hoan_ung" ? "Thực hiện" : "Chi tiền"}
                truong={[{ ten: "quy_id", nhan: "Chi từ quỹ", loai: "chon", batBuoc: true, luaChon: (quy ?? []).filter((q) => q.chi_nhanh_id === cnId).map((q) => ({ gia_tri: q.id, nhan: q.ten })) },
                  ...(r.loaiDx === "hoan_ung" || r.loaiDx === "hoan_khach" ? [] : [{ ten: "loai_thu_chi_id", nhan: "Phân loại chi", loai: "chon" as const, batBuoc: true, luaChon: (ltc ?? []).map((l) => ({ gia_tri: l.id, nhan: l.ten })) }]), { ten: "ngay", nhan: "Ngày chi", loai: "ngay" },
                  ...(r.loaiDx !== "hoan_ung" && r.loaiDx !== "hoan_khach" && (nd.vaiTro === "ky_thuat" || coQuyen(nd, "ky.khoa")) ? [{ ten: "chap_nhan_vuot", nhan: "Chấp nhận nếu khoản chi vượt ngân sách tháng", loai: "gat" as const }] : [])]} />);
            }
            if (choThucHien(r) && r.loaiDx === "mua_sam") {
              nut.push(<NutHop key="l" kieu="chu" nhan="Lập đơn mua" tieuDe={`Lập đơn mua · ${r.ma}`} moTa="Tạo đơn mua nháp từ đề xuất này; thêm hàng và gửi duyệt ở màn Mua hàng." action={lapDonMuaTuDeXuat} an={{ id: r.id }} nhanLuu="Lập đơn"
                truong={[{ ten: "ncc_id", nhan: "Nhà cung cấp", loai: "chon", batBuoc: true, luaChon: (ncc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })) }]} />);
            }
            if (r.nguon === "dm") nut.push(<Link key="m" href={`/kho-mua-sam/mua-hang/${r.id}`} className="text-[14px] text-nhan-dam hover:underline">Mở đơn</Link>);
            return nut.length ? <div className="flex flex-wrap items-center justify-end gap-1.5">{nut}</div> : null;
          } },
        ]} />
    </div>
  );
}
