import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { MUC_TIEU, TT_CHIEN_DICH } from "@/lib/marketing";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { doiTrangThaiChienDich, luuChienDich } from "../actions";

const BUOC: Record<string, { nhan: string; dich: string; duyet?: boolean }[]> = {
  nhap: [{ nhan: "Gửi duyệt", dich: "cho_duyet" }],
  cho_duyet: [{ nhan: "Duyệt", dich: "da_duyet", duyet: true }, { nhan: "Trả về nháp", dich: "nhap", duyet: true }],
  da_duyet: [{ nhan: "Bắt đầu chạy", dich: "dang_chay" }, { nhan: "Kết thúc", dich: "ket_thuc" }],
  dang_chay: [{ nhan: "Tạm dừng", dich: "tam_dung" }, { nhan: "Kết thúc", dich: "ket_thuc" }],
  tam_dung: [{ nhan: "Chạy lại", dich: "dang_chay" }, { nhan: "Kết thúc", dich: "ket_thuc" }],
};

export default async function TrangChienDich() {
  const nd = await yeuCauQuyen("mkt.xem");
  const sua = coQuyen(nd, "mkt.sua"), duyet = coQuyen(nd, "mkt.duyet");
  const db = sb();
  const [{ data: ds }, { data: nguon }, { data: nv }, { data: cn }, { data: cp }] = await Promise.all([
    db.from("chien_dich").select("*").order("tao_luc", { ascending: false }).limit(200), db.from("nguon_lead").select("id, ten").eq("hoat_dong", true).order("thu_tu"),
    db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu"), db.from("chi_phi_qc_ngay").select("chien_dich_id, chi_phi"),
  ]);
  const daChi = new Map<string, number>();
  for (const c of cp ?? []) daChi.set(c.chien_dich_id, (daChi.get(c.chien_dich_id) ?? 0) + Number(c.chi_phi));
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truong: Truong[] = [
    { ten: "ten", nhan: "Tên chiến dịch", loai: "chu", batBuoc: true, rong: true },
    { ten: "muc_tieu", nhan: "Mục tiêu (chỉ chọn một)", loai: "chon", batBuoc: true, luaChon: Object.entries(MUC_TIEU).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "kenh", nhan: "Kênh", loai: "chu", goiY: "Facebook, TikTok, Zalo…" },
    { ten: "nguon_id", nhan: "Nguồn lead", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(nguon ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    { ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Tất cả" }, ...(cn ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    { ten: "ngan_sach", nhan: "Ngân sách", loai: "tien" }, { ten: "bat_dau", nhan: "Bắt đầu", loai: "ngay" }, { ten: "ket_thuc", nhan: "Kết thúc", loai: "ngay" },
    { ten: "owner_id", nhan: "Người phụ trách", loai: "chon", luaChon: (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten })) },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Chiến dịch" phu="Mỗi chiến dịch chỉ một mục tiêu: Branding, Slogan, Khuyến mãi hoặc Thông điệp. Cần người có quyền duyệt trước khi chạy.">
        {sua && <NutHop nhan="Tạo chiến dịch" tieuDe="Tạo chiến dịch" truong={truong} action={luuChienDich} giaTri={{ muc_tieu: "thong_diep", nguon_id: "", chi_nhanh_id: "", owner_id: nd.nhanVienId }} rong />}
      </TieuDeNoi>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có chiến dịch."
        cot={[
          { nhan: "Chiến dịch", chinh: true, hienThi: (r) => <div>{r.ma} · {r.ten}<div className="text-[12.5px] text-muc-3">{MUC_TIEU[r.muc_tieu]}{r.kenh && ` · ${r.kenh}`}</div></div> },
          { nhan: "Thời gian", hienThi: (r) => (r.bat_dau || r.ket_thuc ? `${ngayVN(r.bat_dau)} – ${ngayVN(r.ket_thuc)}` : "") },
          { nhan: "Ngân sách", phai: true, hienThi: (r) => { const chi = daChi.get(r.id) ?? 0; return <div>{tienVN(r.ngan_sach)}<div className={`text-[12.5px] ${r.ngan_sach > 0 && chi > r.ngan_sach ? "text-canh-bao" : "text-muc-3"}`}>Đã chi {tienVN(chi)}</div></div>; } },
          { nhan: "Phụ trách", hienThi: (r) => (r.owner_id ? tenNv.get(r.owner_id) : "") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_CHIEN_DICH[r.trang_thai].kieu}>{TT_CHIEN_DICH[r.trang_thai].ten}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (
            <div className="flex flex-wrap justify-end gap-2">
              {(BUOC[r.trang_thai] ?? []).filter((b) => (b.duyet ? duyet : sua)).map((b) => <NutHop key={b.dich} kieu="chu" nhan={b.nhan} tieuDe={b.nhan} xacNhan={`${b.nhan} chiến dịch ${r.ma}?`} action={doiTrangThaiChienDich} an={{ id: r.id, trang_thai: b.dich }} nhanLuu={b.nhan} />)}
              {sua && r.trang_thai === "nhap" && <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa chiến dịch" truong={truong} action={luuChienDich} giaTri={{ id: r.id, ten: r.ten, muc_tieu: r.muc_tieu, kenh: r.kenh ?? "", nguon_id: r.nguon_id ?? "", chi_nhanh_id: r.chi_nhanh_id ?? "", ngan_sach: r.ngan_sach, bat_dau: r.bat_dau ?? "", ket_thuc: r.ket_thuc ?? "", owner_id: r.owner_id ?? "", ghi_chu: r.ghi_chu ?? "" }} rong />}
            </div>
          ) },
        ]} />
    </div>
  );
}
