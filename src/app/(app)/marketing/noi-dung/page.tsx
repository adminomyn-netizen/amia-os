import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { LOAI_NOI_DUNG, TT_DUYET_ND } from "@/lib/marketing";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { doiTrangThaiNoiDung, luuNoiDung } from "../actions";
import { tenChienDich } from "@/lib/ten-chien-dich";

export default async function TrangNoiDung() {
  const nd = await yeuCauQuyen("mkt.xem");
  const sua = coQuyen(nd, "mkt.sua"), duyet = coQuyen(nd, "mkt.duyet");
  const db = sb(), hom = homNayHCM();
  const [{ data: ds }, { data: cd }, { data: nv }] = await Promise.all([
    db.from("noi_dung_mkt").select("*").order("han", { ascending: true }).limit(300), db.from("chien_dich").select("id, ten, ma").order("tao_luc", { ascending: false }), db.from("nhan_vien").select("id, ho_ten, hoat_dong").order("ho_ten"),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenCd = new Map((cd ?? []).map((c) => [c.id, c.ma]));
  // Chỉ người đang làm; khi sửa giữ người đang gắn (kể cả đã nghỉ) để không mất giá trị.
  const lcNv = (giu?: string | null) => (nv ?? []).filter((n) => n.hoat_dong || n.id === giu).map((n) => ({ gia_tri: n.id, nhan: n.hoat_dong ? n.ho_ten : `${n.ho_ten} (đã nghỉ)` }));
  const truong: Truong[] = [
    { ten: "tieu_de", nhan: "Tiêu đề", loai: "chu", batBuoc: true, rong: true },
    { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_NOI_DUNG).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) }, { ten: "kenh", nhan: "Kênh đăng", loai: "chu" },
    { ten: "chien_dich_id", nhan: "Chiến dịch", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(cd ?? []).map((c) => ({ gia_tri: c.id, nhan: tenChienDich(c.ten) }))] },
    { ten: "nguoi_phu_trach_id", nhan: "Người làm", loai: "chon", luaChon: lcNv() },
    { ten: "han", nhan: "Hạn hoàn thành", loai: "ngay", batBuoc: true }, { ten: "ngay_dang", nhan: "Ngày đăng", loai: "ngay" },
    { ten: "link_bai", nhan: "Link bài đã đăng", loai: "chu", rong: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Nội dung" phu="Mỗi nội dung có người làm và hạn. Nộp duyệt → người duyệt chốt; duyệt hoàn thành cần có link bài hoặc ngày đăng.">
        {sua && <NutHop nhan="Thêm nội dung" tieuDe="Thêm nội dung" truong={truong} action={luuNoiDung} giaTri={{ loai: "bai_viet", han: hom, nguoi_phu_trach_id: nd.nhanVienId, chien_dich_id: "" }} rong />}
      </TieuDeNoi>
      <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có nội dung."
        cot={[
          { nhan: "Nội dung", chinh: true, hienThi: (r) => <div>{r.ma} · {r.tieu_de}<div className="text-[12.5px] text-muc-3">{LOAI_NOI_DUNG[r.loai]}{r.kenh && ` · ${r.kenh}`}{r.chien_dich_id && ` · ${tenCd.get(r.chien_dich_id)}`}</div></div> },
          { nhan: "Người làm", hienThi: (r) => tenNv.get(r.nguoi_phu_trach_id) ?? "" },
          { nhan: "Hạn", hienThi: (r) => { const tre = r.trang_thai_duyet !== "da_duyet" && r.han < hom; return <span className={tre ? "text-canh-bao" : ""}>{ngayVN(r.han)}{tre && " · quá hạn"}</span>; } },
          { nhan: "Bài đăng", hienThi: (r) => (r.link_bai ? <a href={r.link_bai} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">Mở link</a> : r.ngay_dang ? ngayVN(r.ngay_dang) : "") },
          { nhan: "Trạng thái", hienThi: (r) => <div><NhanTrangThai kieu={TT_DUYET_ND[r.trang_thai_duyet].kieu}>{TT_DUYET_ND[r.trang_thai_duyet].ten}</NhanTrangThai>{r.so_lan_duyet > 1 && <div className="mt-1 text-[12.5px] text-muc-3">Duyệt lần {r.so_lan_duyet}</div>}</div> },
          { nhan: "", hienThi: (r) => (
            <div className="flex flex-wrap justify-end gap-2">
              {sua && ["nhap", "chua_dat"].includes(r.trang_thai_duyet) && <NutHop kieu="chu" nhan="Nộp duyệt" tieuDe="Nộp duyệt" xacNhan={`Nộp duyệt ${r.ma}?`} action={doiTrangThaiNoiDung} an={{ id: r.id, trang_thai: "cho_duyet" }} nhanLuu="Nộp" />}
              {duyet && r.trang_thai_duyet === "cho_duyet" && <NutHop kieu="chu" nhan="Duyệt" tieuDe="Duyệt nội dung" xacNhan={`Duyệt ${r.ma}?`} action={doiTrangThaiNoiDung} an={{ id: r.id, trang_thai: "da_duyet" }} nhanLuu="Duyệt" />}
              {duyet && r.trang_thai_duyet === "cho_duyet" && <NutHop kieu="chu" nguy nhan="Chưa đạt" tieuDe="Chưa đạt" xacNhan={`Trả ${r.ma} về làm lại?`} action={doiTrangThaiNoiDung} an={{ id: r.id, trang_thai: "chua_dat" }} nhanLuu="Trả về" />}
              {sua && r.trang_thai_duyet !== "da_duyet" && <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa nội dung" truong={truong.map((t) => (t.ten === "nguoi_phu_trach_id" ? { ...t, luaChon: lcNv(r.nguoi_phu_trach_id) } : t))} action={luuNoiDung} giaTri={{ id: r.id, tieu_de: r.tieu_de, loai: r.loai, kenh: r.kenh ?? "", chien_dich_id: r.chien_dich_id ?? "", nguoi_phu_trach_id: r.nguoi_phu_trach_id, han: r.han, ngay_dang: r.ngay_dang ?? "", link_bai: r.link_bai ?? "", ghi_chu: r.ghi_chu ?? "" }} rong />}
            </div>
          ) },
        ]} />
    </div>
  );
}
