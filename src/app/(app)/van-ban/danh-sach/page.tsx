import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { NHOM_VB, TT_VB, tinhHieuLuc } from "@/lib/van-ban";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { duyetVb, guiDuyetVb, huyVb, kyVb, luuBanDienTu, luuVanBan, taoPhienBanMoi, traVeVb } from "../actions";

const TAB = [{ ma: "can-xu-ly", ten: "Cần xử lý" }, { ma: "tat-ca", ten: "Tất cả" }, { ma: "dang-hieu-luc", ten: "Đang hiệu lực" }, { ma: "luu-tru", ten: "Đã huỷ / thay thế" }];

export default async function TrangDanhSachVb({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("vb.xem");
  const soan = coQuyen(nd, "vb.soan"), duyet = coQuyen(nd, "vb.duyet");
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "can-xu-ly";
  const db = sb(), hom = homNayHCM();
  let q = db.from("van_ban").select("*").order("tao_luc", { ascending: false }).limit(500);
  if (nd.chiNhanhId) q = q.or(`chi_nhanh_id.eq.${nd.chiNhanhId},chi_nhanh_id.is.null`);
  const [{ data: all }, { data: loai }, { data: cn }, { data: ncc }, { data: ch }] = await Promise.all([
    q, db.from("vb_loai").select("*").eq("hoat_dong", true).order("nhom").order("thu_tu"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"),
    db.from("nha_cung_cap").select("id, ten").order("ten"), db.from("cau_hinh").select("khoa, gia_tri").in("khoa", ["van_ban.nhac_truoc_ngay", "van_ban.nguong_gd_chi_nhanh"]),
  ]);
  const cauHinh = new Map((ch ?? []).map((c) => [c.khoa, Number(c.gia_tri)]));
  const truoc = cauHinh.get("van_ban.nhac_truoc_ngay") ?? 30, nguong = cauHinh.get("van_ban.nguong_gd_chi_nhanh") ?? 0;
  const khachIds = [...new Set((all ?? []).map((v) => v.khach_id).filter(Boolean))] as string[];
  const { data: khach } = khachIds.length ? await db.from("khach_hang").select("id, ma, ho_ten").in("id", khachIds) : { data: [] as { id: string; ma: string; ho_ten: string }[] };
  const tenKhach = new Map((khach ?? []).map((k) => [k.id, `${k.ho_ten} (${k.ma})`])), tenNcc = new Map((ncc ?? []).map((n) => [n.id, n.ten])), tenLoai = new Map((loai ?? []).map((l) => [l.id, l]));
  const canXuLy = (v: NonNullable<typeof all>[number]) => {
    const ly: string[] = [];
    if (v.trang_thai === "nhap") ly.push("Bản nháp, chưa gửi duyệt");
    if (v.trang_thai === "nhap") ly.push("Bản nháp, chưa gửi duyệt");
    if (v.trang_thai === "cho_duyet") ly.push("Chờ duyệt");
    if (v.trang_thai === "da_duyet") ly.push("Đã duyệt, chưa ghi nhận ký");
    if (v.trang_thai === "da_ky") {
      const hl = tinhHieuLuc(v.hieu_luc_den, hom, congNgay, truoc);
      if (hl === "het") ly.push(v.dung_tam ? "Đã hết hạn mà vẫn dùng tạm" : "Đã hết hạn");
      if (hl === "sap") ly.push(`Hết hạn ${ngayVN(v.hieu_luc_den)}`);
      if (tenLoai.get(v.loai_id)?.nhom === "khach" && Number(v.gia_tri ?? 0) > 0 && !v.link_ban_dien_tu && v.ngay_ky && v.ngay_ky < hom) ly.push("Chưa có bản điện tử");
    }
    return ly;
  };
  const ds = (all ?? []).filter((v) => {
    if (tab === "can-xu-ly") return canXuLy(v).length > 0;
    if (tab === "dang-hieu-luc") return v.trang_thai === "da_ky" && tinhHieuLuc(v.hieu_luc_den, hom, congNgay, truoc) !== "het";
    if (tab === "luu-tru") return ["huy", "thay_the"].includes(v.trang_thai);
    return true;
  });
  const truong: Truong[] = [
    { ten: "loai_id", nhan: "Loại văn bản", loai: "chon", batBuoc: true, rong: true, luaChon: (loai ?? []).map((l) => ({ gia_tri: l.id, nhan: `${NHOM_VB[l.nhom]} · ${l.ten}` })) },
    { ten: "tieu_de", nhan: "Tiêu đề", loai: "chu", batBuoc: true, rong: true },
    { ten: "sdt_khach", nhan: "Số điện thoại khách (văn bản của khách)", loai: "chu" },
    { ten: "ncc_id", nhan: "Đối tác / nhà cung cấp", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(ncc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, luaChon: [{ gia_tri: "", nhan: "Toàn công ty" }, ...(cn ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] }]),
    { ten: "gia_tri", nhan: "Giá trị (nếu có)", loai: "tien" }, { ten: "hieu_luc_tu", nhan: "Hiệu lực từ", loai: "ngay" }, { ten: "hieu_luc_den", nhan: "Hiệu lực đến", loai: "ngay" },
    { ten: "dung_tam", nhan: "Đang dùng tạm (bản cũ, chờ bản mới ký)", loai: "gat", rong: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/van-ban", nhan: "Văn bản & Hợp đồng" }} tieuDe="Sổ văn bản" phu={<>Soạn → duyệt (người khác người soạn) → ký. Giá trị trên {tienVN(nguong)} do Ban Giám đốc duyệt (mức này đang chờ xác nhận). Văn bản đã ký không sửa, muốn đổi thì tạo phiên bản mới.</>}>
        {soan && <NutHop nhan="Soạn văn bản" tieuDe="Soạn văn bản" truong={truong} action={luuVanBan} giaTri={{ loai_id: "", ncc_id: "", chi_nhanh_id: "" }} rong />}
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc="/van-ban/danh-sach" />
      <Bang noi duLieu={ds} khoa={(r) => r.id} trong={tab === "can-xu-ly" ? "Không có văn bản nào cần xử lý." : "Chưa có văn bản."}
        cot={[
          { nhan: "Văn bản", chinh: true, hienThi: (r) => <div>{r.ma}{r.phien_ban > 1 && ` · bản ${r.phien_ban}`} · {r.tieu_de}<div className="text-[12.5px] text-muc-3">{tenLoai.get(r.loai_id)?.ten}</div></div> },
          { nhan: "Đối tượng", hienThi: (r) => <div>{r.khach_id ? tenKhach.get(r.khach_id) : r.ncc_id ? tenNcc.get(r.ncc_id) : ""}{r.gia_tri != null && <div className="text-[12.5px] text-muc-3">{tienVN(r.gia_tri)}</div>}</div> },
          { nhan: "Hiệu lực", hienThi: (r) => (r.hieu_luc_tu || r.hieu_luc_den ? <div>{ngayVN(r.hieu_luc_tu)} – {r.hieu_luc_den ? ngayVN(r.hieu_luc_den) : "không thời hạn"}{r.ngay_ky && <div className="text-[12.5px] text-muc-3">Ký {ngayVN(r.ngay_ky)}{r.nguoi_ky && ` · ${r.nguoi_ky}`}</div>}</div> : r.ngay_ky ? `Ký ${ngayVN(r.ngay_ky)}` : "") },
          { nhan: "Bản điện tử", hienThi: (r) => (r.link_ban_dien_tu ? <a href={r.link_ban_dien_tu} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">Mở</a> : <span className="text-muc-3">Chưa có</span>) },
          { nhan: "Trạng thái", hienThi: (r) => {
            const ly = canXuLy(r);
            return <div><NhanTrangThai kieu={TT_VB[r.trang_thai].kieu}>{TT_VB[r.trang_thai].ten}</NhanTrangThai>{ly.filter((x) => !["Bản nháp, chưa gửi duyệt", "Chờ duyệt", "Đã duyệt, chưa ghi nhận ký"].includes(x)).map((x) => <div key={x} className="mt-1 text-[12.5px] text-canh-bao">{x}</div>)}{r.ly_do && r.trang_thai !== "da_ky" && <div className="mt-1 text-[12.5px] text-muc-3">{r.ly_do}</div>}</div>;
          } },
          { nhan: "", hienThi: (r) => (
            <div className="flex flex-wrap justify-end gap-2">
              {soan && r.trang_thai === "nhap" && <NutHop kieu="chu" nhan="Gửi duyệt" tieuDe="Gửi duyệt" xacNhan={`Gửi duyệt ${r.ma}?`} action={guiDuyetVb} an={{ id: r.id }} nhanLuu="Gửi duyệt" />}
              {soan && r.trang_thai === "nhap" && <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa văn bản" truong={truong} action={luuVanBan} giaTri={{ id: r.id, loai_id: r.loai_id, tieu_de: r.tieu_de, ncc_id: r.ncc_id ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "", gia_tri: r.gia_tri ?? "", hieu_luc_tu: r.hieu_luc_tu ?? "", hieu_luc_den: r.hieu_luc_den ?? "", dung_tam: r.dung_tam, ghi_chu: r.ghi_chu ?? "", sdt_khach: "" }} rong />}
              {duyet && r.trang_thai === "cho_duyet" && (r.nguoi_soan_id !== nd.nhanVienId || nd.vaiTro === "ky_thuat") && <NutHop kieu="chu" nhan="Duyệt" tieuDe="Duyệt văn bản" xacNhan={`Duyệt ${r.ma}?`} action={duyetVb} an={{ id: r.id }} nhanLuu="Duyệt" />}
              {duyet && r.trang_thai === "cho_duyet" && <NutHop kieu="chu" nhan="Yêu cầu sửa" tieuDe="Yêu cầu sửa" truong={[{ ten: "ly_do", nhan: "Cần sửa gì", loai: "nhieu_dong", batBuoc: true, rong: true }]} action={traVeVb} an={{ id: r.id }} />}
              {soan && r.trang_thai === "da_duyet" && <NutHop kieu="chu" nhan="Ghi nhận đã ký" tieuDe={`Đã ký ${r.ma}`} truong={[{ ten: "ngay_ky", nhan: "Ngày ký", loai: "ngay", batBuoc: true }, { ten: "nguoi_ky", nhan: "Người ký", loai: "chu", batBuoc: true }, { ten: "link_ban_dien_tu", nhan: "Link bản điện tử (https://…)", loai: "chu", rong: true }, { ten: "vi_tri_ban_giay", nhan: "Vị trí lưu bản giấy", loai: "chu", rong: true }]} action={kyVb} an={{ id: r.id }} giaTri={{ ngay_ky: hom }} rong />}
              {soan && ["da_duyet", "da_ky", "cho_duyet", "nhap"].includes(r.trang_thai) && <NutHop kieu="chu" nhan="Bản điện tử" tieuDe="Lưu bản điện tử và vị trí bản giấy" truong={[{ ten: "link_ban_dien_tu", nhan: "Link bản điện tử (https://…)", loai: "chu", rong: true }, { ten: "vi_tri_ban_giay", nhan: "Vị trí lưu bản giấy", loai: "chu", rong: true }]} action={luuBanDienTu} an={{ id: r.id }} giaTri={{ link_ban_dien_tu: r.link_ban_dien_tu ?? "", vi_tri_ban_giay: r.vi_tri_ban_giay ?? "" }} />}
              {soan && r.trang_thai === "da_ky" && <NutHop kieu="chu" nhan="Phiên bản mới" tieuDe="Tạo phiên bản mới" xacNhan={`Tạo bản nháp thay thế ${r.ma}? Bản cũ chỉ chuyển “đã thay thế” khi bản mới được ký.`} action={taoPhienBanMoi} an={{ id: r.id }} nhanLuu="Tạo" />}
              {soan && ["nhap", "cho_duyet", "da_duyet", "da_ky"].includes(r.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ văn bản" truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "nhieu_dong", batBuoc: true, rong: true }]} action={huyVb} an={{ id: r.id }} nhanLuu="Huỷ văn bản" />}
            </div>
          ) },
        ]} />
    </div>
  );
}
