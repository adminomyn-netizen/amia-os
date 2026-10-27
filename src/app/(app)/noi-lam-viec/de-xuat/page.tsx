import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, tienVN, ngayCuaIso } from "@/lib/dinh-dang";
import { LOAI_DX, TT_DX } from "@/lib/de-xuat";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { guiDeXuat, huyDeXuat } from "../actions";

const TAB = [{ ma: "mua-sam", ten: "Mua sắm" }, { ma: "thanh-toan", ten: "Thanh toán" }, { ma: "tam-ung", ten: "Tạm ứng lương" }];
const LOAI = { "mua-sam": "mua_sam", "thanh-toan": "thanh_toan", "tam-ung": "tam_ung" } as const;
const MO_TA = {
  mua_sam: "Đề nghị mua hàng hoá, vật tư gửi quản lý duyệt. Duyệt xong, bộ phận mua lập đơn mua từ đề xuất.",
  thanh_toan: "Đề xuất chi một khoản (nhà cung cấp, chi phí…). Duyệt xong, kế toán chi từ sổ quỹ.",
  tam_ung: "Nhân viên xin tạm ứng lương. Duyệt xong, kế toán chi từ sổ quỹ.",
} as const;

export default async function TrangDeXuat({ searchParams }: { searchParams: Promise<{ tab?: string; pham?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xemHet = coQuyen(nd, "dexuat.duyet") || coQuyen(nd, "quy.ghi") || coQuyen(nd, "mua.tao");
  const { tab: t, pham } = await searchParams;
  const tab = (TAB.some((x) => x.ma === t) ? t! : "mua-sam") as keyof typeof LOAI;
  const loai = LOAI[tab];
  const tatCa = xemHet && pham === "tat-ca";
  const db = sb();
  let q = db.from("de_xuat").select("*").eq("loai", loai).order("tao_luc", { ascending: false }).limit(200);
  if (!tatCa) q = q.eq("nguoi_gui_id", nd.nhanVienId);
  else if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: dx }, { data: nv }, { data: cn }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma")]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truong: Truong[] = [
    { ten: "tieu_de", nhan: "Nội dung đề xuất", loai: "chu", batBuoc: true, rong: true },
    { ten: "so_tien", nhan: loai === "mua_sam" ? "Dự toán (không bắt buộc)" : "Số tiền", loai: "tien", batBuoc: loai !== "mua_sam" },
    ...(loai === "tam_ung" ? [] : [{ ten: "doi_tuong", nhan: loai === "mua_sam" ? "Nhà cung cấp dự kiến" : "Trả cho", loai: "chu" as const }]),
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })), batBuoc: true }]),
    { ten: "han_duyet", nhan: "Cần duyệt trước ngày", loai: "ngay" },
    { ten: "noi_dung", nhan: "Chi tiết (hàng cần mua, lý do…)", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <Link href="/noi-lam-viec" className="text-[13px] text-muc-3 hover:text-muc">← Nơi làm việc</Link>
      <TieuDeTrang tieuDe="Đề xuất" phu={<>{MO_TA[loai]} Duyệt và xử lý ở <Link href="/noi-lam-viec/phe-duyet" className="text-nhan-dam hover:underline">Trung tâm phê duyệt</Link>.</>}>
        <NutHop nhan="Tạo đề xuất" tieuDe={`Đề xuất ${LOAI_DX[loai].toLowerCase()}`} truong={truong} action={guiDeXuat} an={{ loai }} giaTri={{}} />
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/noi-lam-viec/de-xuat" them={tatCa ? "&pham=tat-ca" : ""} />
      {xemHet && (
        <div className="mb-4 flex gap-3 text-[14px]">
          <Link href={`/noi-lam-viec/de-xuat?tab=${tab}`} className={!tatCa ? "font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}>Của tôi</Link>
          <Link href={`/noi-lam-viec/de-xuat?tab=${tab}&pham=tat-ca`} className={tatCa ? "font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}>Tất cả</Link>
        </div>
      )}
      <Bang duLieu={dx ?? []} khoa={(r) => r.id} trong="Chưa có đề xuất nào."
        cot={[
          { nhan: "Mã", chinh: true, hienThi: (r) => r.ma }, { nhan: "Nội dung", hienThi: (r) => <div><span className="text-muc">{r.tieu_de}</span>{r.noi_dung && <div className="mt-0.5 text-[13px] text-muc-3">{r.noi_dung}</div>}{r.ly_do && <div className="mt-0.5 text-[13px] text-loi">Lý do từ chối: {r.ly_do}</div>}</div> },
          { nhan: "Người gửi", hienThi: (r) => ten.get(r.nguoi_gui_id) ?? "" }, { nhan: "Ngày gửi", hienThi: (r) => ngayVN(ngayCuaIso(r.tao_luc)) },
          { nhan: "Số tiền", phai: true, hienThi: (r) => (r.so_tien ? tienVN(r.so_tien) : "") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_DX[r.trang_thai].kieu}>{TT_DX[r.trang_thai].ten}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (r.nguoi_gui_id === nd.nhanVienId && r.trang_thai === "cho_duyet" ? <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ đề xuất" xacNhan={`Huỷ đề xuất ${r.ma}?`} action={huyDeXuat} an={{ id: r.id }} nhanLuu="Huỷ đề xuất" /> : null) },
        ]} />
    </div>
  );
}
