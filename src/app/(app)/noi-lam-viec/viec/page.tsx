import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, homNayHCM } from "@/lib/dinh-dang";
import { TT_VIEC, UU_TIEN } from "@/lib/de-xuat";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { baoKetViec, chamViec, doiTrangThaiViec, giaoViec } from "../actions";
import { doDai, thoiDiemHan, tinhTrangHan, type TinhTrangHan } from "@/lib/cong-viec-han";

/** Đường dẫn nội bộ trong mô tả việc (vd "Mở lead: /marketing/lead/<id>" do Hộp Lead tạo) thành link bấm được. */
const DUONG_NOI_BO = /(\/marketing\/lead\/[0-9a-f-]{36})/g;
function moTaCoLink(t: string) {
  return t.split(DUONG_NOI_BO).map((x, i) => (i % 2 === 1 ? <Link key={i} href={x} className="font-medium text-nhan-dam hover:underline">bấm để mở</Link> : x));
}

export default async function TrangViec({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xemHet = coQuyen(nd, "viec.tatca");
  const TAB = [{ ma: "cho-toi", ten: "Giao cho tôi" }, { ma: "toi-giao", ten: "Tôi giao" }, { ma: "qua-han", ten: "Quá hạn" }, ...(xemHet ? [{ ma: "tat-ca", ten: "Tất cả" }] : [])];
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "cho-toi";
  const hom = homNayHCM();
  const db = sb();
  let q = db.from("cong_viec").select("*").order("han", { ascending: true, nullsFirst: false }).order("tao_luc", { ascending: false }).limit(300);
  if (tab === "cho-toi") q = q.eq("nguoi_nhan_id", nd.nhanVienId).in("trang_thai", ["moi", "dang_lam"]);
  else if (tab === "toi-giao") q = q.eq("nguoi_giao_id", nd.nhanVienId).in("trang_thai", ["moi", "dang_lam", "xong"]);
  else if (tab === "qua-han") { q = q.in("trang_thai", ["moi", "dang_lam"]).lte("han", hom); if (!xemHet) q = q.or(`nguoi_nhan_id.eq.${nd.nhanVienId},nguoi_giao_id.eq.${nd.nhanVienId}`); }
  const [{ data: viec }, { data: nv }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten, hoat_dong").order("ho_ten")]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), nvLam = (nv ?? []).filter((n) => n.hoat_dong);
  const bay = new Date();
  const hanCua = (r: NonNullable<typeof viec>[number]) => tinhTrangHan(thoiDiemHan(r.han_gio, r.han), r.trang_thai === "xong" ? r.hoan_thanh_luc : null, bay);
  const dsHien = tab === "qua-han" ? (viec ?? []).filter((r) => { const h = hanCua(r); return h.loai === "vua_qua" || h.loai === "tre"; }) : (viec ?? []);
  const truong: Truong[] = [
    { ten: "tieu_de", nhan: "Công việc", loai: "chu", batBuoc: true, rong: true },
    { ten: "nguoi_nhan_id", nhan: "Giao cho", loai: "chon", luaChon: nvLam.map((n) => ({ gia_tri: n.id, nhan: n.id === nd.nhanVienId ? `${n.ho_ten} (tôi)` : n.ho_ten })), batBuoc: true },
    { ten: "han", nhan: "Hạn nộp (ngày)", loai: "ngay", batBuoc: true },
    { ten: "han_gio", nhan: "Hạn nộp (giờ)", loai: "gio", batBuoc: true },
    { ten: "tieu_chi_xong", nhan: "Tiêu chí xong", loai: "nhieu_dong", batBuoc: true, rong: true, goiY: "Làm được gì · xem ở đâu · đo bằng gì · dùng thế nào", ghiChu: "Làm được, thấy được, đo được, dùng được: ghi rõ sản phẩm sẽ nộp để người giao chấm Đạt." },
    { ten: "uu_tien", nhan: "Ưu tiên", loai: "chon", luaChon: Object.entries(UU_TIEN).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", rong: true },
  ];
  const nopVe: Truong[] = [
    { ten: "san_pham", nhan: "Sản phẩm ở đâu", loai: "chu", batBuoc: true, rong: true, goiY: "Đường dẫn, tên tệp hoặc nơi xem" },
    { ten: "ket_qua", nhan: "Kết quả (không bắt buộc)", loai: "nhieu_dong", rong: true },
    { ten: "tc_lam_duoc", nhan: "Làm được: đã chạy thử", loai: "gat" }, { ten: "tc_thay_duoc", nhan: "Thấy được: có chỗ để xem", loai: "gat" },
    { ten: "tc_do_duoc", nhan: "Đo được: có số liệu", loai: "gat" }, { ten: "tc_dung_duoc", nhan: "Dùng được: người dùng thao tác được", loai: "gat" },
  ];
  const baoKet: Truong[] = [
    { ten: "ket_nguoi_id", nhan: "Kẹt ở ai", loai: "chon", batBuoc: true, luaChon: nvLam.map((n) => ({ gia_tri: n.id, nhan: n.ho_ten })) },
    { ten: "ket_ly_do", nhan: "Lý do kẹt", loai: "nhieu_dong", batBuoc: true, rong: true },
  ];
  const chuaDat: Truong[] = [{ ten: "ghi_chu", nhan: "Lý do chưa đạt", loai: "nhieu_dong", batBuoc: true, rong: true }];
  const nhanHan = (h: TinhTrangHan) => {
    switch (h.loai) {
      case "tre": return <NhanTrangThai kieu="loi">Trễ {doDai(h.phutTre)}</NhanTrangThai>;
      case "vua_qua": return <NhanTrangThai kieu="cho">Quá hạn {doDai(h.phutTre)}</NhanTrangThai>;
      case "con_han": return <span className="text-[12px] text-muc-3">Còn {doDai(h.phutCon)}</span>;
      case "nop_tre": return <NhanTrangThai kieu="cho">Nộp trễ {doDai(h.phutTre)}</NhanTrangThai>;
      case "nop_dung_han": return <NhanTrangThai kieu="tot">Nộp đúng hạn</NhanTrangThai>;
      default: return null;
    }
  };
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/noi-lam-viec", nhan: "Nơi làm việc" }} tieuDe="Việc cần hoàn thành" phu="Việc giao cho tôi, việc tôi giao và việc quá hạn. Phê duyệt tiền không đi qua đây — xem Trung tâm phê duyệt.">
        <Link href="/noi-lam-viec/chot-ngay" className="text-[14px] font-medium text-nhan-dam hover:underline">Bảng chốt 12h / 17h</Link>
        <NutHop nhan="Giao việc" tieuDe="Giao việc" truong={truong} action={giaoViec} giaTri={{ nguoi_nhan_id: nd.nhanVienId, uu_tien: "thuong", han: hom, han_gio: "17:00" }} />
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc="/noi-lam-viec/viec" />
      <Bang noi duLieu={dsHien} khoa={(r) => r.id} trong="Không có việc nào."
        cot={[
          { nhan: "Công việc", chinh: true, hienThi: (r) => (
            <div>
              <span className="text-muc">{r.tieu_de}</span>
              {r.mo_ta && <div className="mt-0.5 whitespace-pre-line text-[13px] text-muc-3">{moTaCoLink(r.mo_ta)}</div>}
              {r.tieu_chi_xong && <div className="mt-0.5 whitespace-pre-line text-[13px] text-muc-2">Tiêu chí xong: {r.tieu_chi_xong}</div>}
              {r.trang_thai === "xong" && (
                <div className="mt-0.5 text-[13px] text-nhan-dam">
                  {r.san_pham && <div>Sản phẩm: {r.san_pham}</div>}{r.ket_qua && <div>Kết quả: {r.ket_qua}</div>}
                  <div className="text-muc-3">{[r.tc_lam_duoc && "làm được", r.tc_thay_duoc && "thấy được", r.tc_do_duoc && "đo được", r.tc_dung_duoc && "dùng được"].filter(Boolean).join(" · ") || "Chưa tick tiêu chí nào"}</div>
                </div>
              )}
              {r.ket_nguoi_id && ["moi", "dang_lam"].includes(r.trang_thai) && <div className="mt-0.5 text-[13px] text-loi">Kẹt ở {ten.get(r.ket_nguoi_id) ?? "người khác"}: {r.ket_ly_do}</div>}
              {r.danh_gia !== "cho" && <div className={`mt-0.5 text-[13px] ${r.danh_gia === "dat" ? "text-nhan-dam" : "text-loi"}`}>{r.danh_gia === "dat" ? "Đã chấm Đạt" : "Chưa đạt"}{r.danh_gia_ghi_chu ? `: ${r.danh_gia_ghi_chu}` : ""}</div>}
            </div>) },
          { nhan: "Người nhận", hienThi: (r) => ten.get(r.nguoi_nhan_id) ?? "" }, { nhan: "Người giao", hienThi: (r) => ten.get(r.nguoi_giao_id) ?? "" },
          { nhan: "Hạn nộp", hienThi: (r) => (
            <div className="text-[13px]">
              {r.han_gio ? <span className="tabular-nums">{ngayGioVN(r.han_gio)}</span> : r.han ? <span className="tabular-nums">{ngayVN(r.han)}</span> : ""}
              <div>{nhanHan(hanCua(r))}</div>
            </div>) },
          { nhan: "Ưu tiên", hienThi: (r) => UU_TIEN[r.uu_tien] },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_VIEC[r.trang_thai].kieu}>{TT_VIEC[r.trang_thai].ten}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => {
            const nhan = r.nguoi_nhan_id === nd.nhanVienId || r.nguoi_giao_id === nd.nhanVienId || xemHet, giao = r.nguoi_giao_id === nd.nhanVienId || xemHet;
            const dangLam = ["moi", "dang_lam"].includes(r.trang_thai);
            return (
              <div className="flex flex-wrap justify-end gap-1.5">
                {nhan && r.trang_thai === "moi" && <NutHop kieu="chu" nhan="Bắt đầu" tieuDe="Bắt đầu làm" xacNhan={`Chuyển "${r.tieu_de}" sang đang làm?`} action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "dang_lam" }} nhanLuu="Bắt đầu" />}
                {nhan && dangLam && <NutHop kieu="chu" nhan="Nộp kết quả" tieuDe="Nộp kết quả" moTa={r.tieu_chi_xong ? `Tiêu chí xong: ${r.tieu_chi_xong}` : undefined} truong={nopVe} action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "xong" }} nhanLuu="Nộp" />}
                {nhan && dangLam && !r.ket_nguoi_id && <NutHop kieu="chu" nhan="Báo kẹt" tieuDe="Báo kẹt ở ai" truong={baoKet} action={baoKetViec} an={{ id: r.id }} nhanLuu="Báo kẹt" />}
                {nhan && dangLam && r.ket_nguoi_id && <NutHop kieu="chu" nhan="Hết kẹt" tieuDe="Hết kẹt" xacNhan="Việc không còn kẹt?" action={baoKetViec} an={{ id: r.id, go: "1" }} nhanLuu="Hết kẹt" />}
                {giao && r.trang_thai === "xong" && r.danh_gia !== "dat" && <NutHop kieu="chu" nhan="Đạt" tieuDe="Chấm Đạt" xacNhan={`Chấm "${r.tieu_de}" là Đạt?`} action={chamViec} an={{ id: r.id, ket: "dat" }} nhanLuu="Đạt" />}
                {giao && r.trang_thai === "xong" && r.danh_gia !== "dat" && <NutHop kieu="chu" nguy nhan="Chưa đạt" tieuDe="Chấm Chưa đạt" truong={chuaDat} action={chamViec} an={{ id: r.id, ket: "chua_dat" }} nhanLuu="Chưa đạt" />}
                {giao && dangLam && <NutHop kieu="chu" nguy nhan="Huỷ việc" tieuDe="Huỷ việc" xacNhan={`Huỷ việc "${r.tieu_de}"?`} action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "huy" }} nhanLuu="Huỷ" />}
                {giao && ["xong", "huy"].includes(r.trang_thai) && <NutHop kieu="chu" nhan="Mở lại" tieuDe="Mở lại việc" xacNhan="Mở lại việc này?" action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "moi" }} nhanLuu="Mở lại" />}
              </div>
            );
          } },
        ]} />
    </div>
  );
}
