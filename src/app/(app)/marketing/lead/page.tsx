import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN } from "@/lib/dinh-dang";
import { KENH_LIEN_HE, KET_QUA_LIEN_HE, PHUT_XAC_NHAN, TT_LIEN_HE, TT_PHAN_BO } from "@/lib/marketing";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { chuyenLeadThanhKhach, danhDauLead, ghiLienHe, giaoLead, nhanLead, taoLead } from "../actions";

const phutTroiQua = (iso: string) => (Date.now() - new Date(iso).getTime()) / 60000;
const DONG = ["da_ket_thuc", "sai_sdt", "khong_co_nhu_cau", "khong_phu_hop", "trung_lead"];

export default async function TrangLead({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("lead.xu_ly");
  const duyet = coQuyen(nd, "mkt.duyet");
  const TAB = [{ ma: "cua-toi", ten: "Của tôi" }, { ma: "chua-nhan", ten: "Chưa có người nhận" }, { ma: "tat-ca", ten: "Tất cả" }, { ma: "dong", ten: "Đã kết thúc" }];
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "cua-toi";
  const db = sb();
  let q = db.from("lead").select("*").order("thoi_diem_phat_sinh", { ascending: false }).limit(300);
  if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
  if (tab === "cua-toi") q = q.eq("owner_id", nd.nhanVienId).not("trang_thai_lien_he", "in", `(${DONG.join(",")})`);
  if (tab === "chua-nhan") q = q.is("owner_id", null).not("trang_thai_phan_bo", "in", "(lead_trung,khong_hop_le)");
  if (tab === "dong") q = q.or(`trang_thai_lien_he.in.(${DONG.join(",")}),trang_thai_phan_bo.in.(lead_trung,khong_hop_le)`);
  const [{ data: ds }, { data: nguon }, { data: cd }, { data: dt }, { data: nv }, { data: cn }] = await Promise.all([
    q, db.from("nguon_lead").select("id, ten, hoat_dong").order("thu_tu"), db.from("chien_dich").select("id, ten, ma").in("trang_thai", ["da_duyet", "dang_chay", "tam_dung"]).order("tao_luc", { ascending: false }),
    db.from("doi_tac_gt").select("id, ten").eq("hoat_dong", true).order("ten"), db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"), db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true),
  ]);
  const tenNguon = new Map((nguon ?? []).map((n) => [n.id, n.ten])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenCn = new Map((cn ?? []).map((n) => [n.id, n.ten]));
  const truongTao: Truong[] = [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "sdt", nhan: "Số điện thoại", loai: "chu", batBuoc: true },
    { ten: "nguon_id", nhan: "Nguồn", loai: "chon", batBuoc: true, luaChon: (nguon ?? []).filter((n) => n.hoat_dong).map((n) => ({ gia_tri: n.id, nhan: n.ten })) },
    { ten: "chien_dich_id", nhan: "Chiến dịch", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không có" }, ...(cd ?? []).map((n) => ({ gia_tri: n.id, nhan: `${n.ma} · ${n.ten}` }))] },
    { ten: "doi_tac_id", nhan: "Người giới thiệu", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không có" }, ...(dt ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (cn ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })) }]),
    { ten: "dich_vu_quan_tam", nhan: "Dịch vụ quan tâm", loai: "chu" }, { ten: "nhu_cau", nhan: "Nhu cầu / ghi chú", loai: "nhieu_dong", rong: true },
    { ten: "nhan_ngay", nhan: "Tôi phụ trách lead này ngay", loai: "gat" },
  ];
  const truongLH: Truong[] = [
    { ten: "kenh", nhan: "Kênh", loai: "chon", batBuoc: true, luaChon: Object.entries(KENH_LIEN_HE).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "ket_qua", nhan: "Kết quả", loai: "chon", batBuoc: true, luaChon: KET_QUA_LIEN_HE.map((k) => ({ gia_tri: k, nhan: TT_LIEN_HE[k].ten })) },
    { ten: "han_tiep", nhan: "Hẹn liên hệ tiếp", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú (bắt buộc khi kết thúc lead)", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <Link href="/marketing" className="text-[13px] text-muc-3 hover:text-muc">← Marketing</Link>
      <TieuDeTrang tieuDe="Lead & phễu khách" phu={<>Mọi lead đều ghi lại, <b>không xoá</b>. Người phụ trách xác nhận trong {PHUT_XAC_NHAN} phút; số đã là khách thì không tạo lead mới.</>}>
        <NutHop nhan="Thêm lead" tieuDe="Thêm lead" truong={truongTao} action={taoLead} giaTri={{ nguon_id: "", chien_dich_id: "", doi_tac_id: "", nhan_ngay: true }} rong />
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/marketing/lead" />
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có lead."
        cot={[
          { nhan: "Lead", chinh: true, hienThi: (r) => <div>{r.ma} · {r.ho_ten}<div className="text-[12.5px] text-muc-3">{r.sdt}{!nd.chiNhanhId && ` · ${tenCn.get(r.chi_nhanh_id) ?? ""}`}</div></div> },
          { nhan: "Nguồn", hienThi: (r) => <div>{tenNguon.get(r.nguon_id)}<div className="text-[12.5px] text-muc-3">{r.dich_vu_quan_tam ?? ""}</div></div> },
          { nhan: "Phát sinh", hienThi: (r) => ngayGioVN(r.thoi_diem_phat_sinh) },
          { nhan: "Phụ trách", hienThi: (r) => {
            if (!r.owner_id) return <span className="text-canh-bao">Chưa có người nhận</span>;
            const tre = !r.owner_xac_nhan_luc && phutTroiQua(r.thoi_diem_phat_sinh) > PHUT_XAC_NHAN;
            return <div>{tenNv.get(r.owner_id)}{!r.owner_xac_nhan_luc && <div className={`text-[12.5px] ${tre ? "text-canh-bao" : "text-muc-3"}`}>{tre ? `Quá ${PHUT_XAC_NHAN} phút chưa xác nhận` : "Chờ xác nhận"}</div>}</div>;
          } },
          { nhan: "Trạng thái", hienThi: (r) => <div><NhanTrangThai kieu={TT_LIEN_HE[r.trang_thai_lien_he]?.kieu ?? "tram"}>{TT_LIEN_HE[r.trang_thai_lien_he]?.ten ?? r.trang_thai_lien_he}</NhanTrangThai>{["lead_trung", "khong_hop_le", "cho_tiep_nhan"].includes(r.trang_thai_phan_bo) && <div className="mt-1 text-[12.5px] text-muc-3">{TT_PHAN_BO[r.trang_thai_phan_bo]}</div>}{r.ly_do && <div className="mt-1 text-[12.5px] text-muc-3">{r.ly_do}</div>}{r.khach_id && <div className="mt-1 text-[12.5px] text-nhan-dam">Đã là khách</div>}</div> },
          { nhan: "", hienThi: (r) => {
            const dong = DONG.includes(r.trang_thai_lien_he) || ["lead_trung", "khong_hop_le"].includes(r.trang_thai_phan_bo);
            const cua = r.owner_id === nd.nhanVienId || duyet;
            return (
              <div className="flex flex-wrap justify-end gap-2">
                {!r.owner_id && !dong && <NutHop kieu="chu" nhan="Nhận lead" tieuDe="Nhận lead" xacNhan={`Nhận lead ${r.ma} về mình?`} action={nhanLead} an={{ id: r.id }} nhanLuu="Nhận" />}
                {cua && !dong && <NutHop kieu="chu" nhan="Ghi liên hệ" tieuDe={`Liên hệ ${r.ho_ten}`} truong={truongLH} action={ghiLienHe} an={{ id: r.id }} giaTri={{ kenh: "goi", ket_qua: "da_lien_he" }} />}
                {cua && !r.khach_id && !dong && coQuyen(nd, "khach.sua") && <NutHop kieu="chu" nhan="Thành khách" tieuDe="Chuyển thành khách" xacNhan={`Tạo khách từ lead ${r.ma}?`} action={chuyenLeadThanhKhach} an={{ id: r.id }} nhanLuu="Chuyển" />}
                {cua && !dong && <NutHop kieu="chu" nguy nhan="Trùng/không hợp lệ" tieuDe="Đánh dấu lead" truong={[{ ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "lead_trung", nhan: "Lead trùng" }, { gia_tri: "khong_hop_le", nhan: "Không hợp lệ" }] }, { ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={danhDauLead} an={{ id: r.id }} giaTri={{ loai: "lead_trung" }} />}
                {duyet && !dong && <NutHop kieu="chu" nhan="Giao người khác" tieuDe="Giao lead" truong={[{ ten: "owner_id", nhan: "Người phụ trách", loai: "chon", batBuoc: true, luaChon: (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten })) }]} action={giaoLead} an={{ id: r.id }} />}
              </div>
            );
          } },
        ]} />
    </div>
  );
}
