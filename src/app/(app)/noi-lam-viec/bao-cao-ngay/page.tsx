import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, homNayHCM } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { nopBaoCaoNgay } from "../actions";

export default async function TrangBaoCaoNgay({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xemHet = coQuyen(nd, "viec.tatca");
  const TAB = [{ ma: "cua-toi", ten: "Của tôi" }, ...(xemHet ? [{ ma: "tat-ca", ten: "Tất cả" }] : [])];
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "cua-toi";
  const hom = homNayHCM();
  const db = sb();
  let q = db.from("bao_cao_ngay").select("*").order("ngay", { ascending: false }).order("cap_nhat_luc", { ascending: false }).limit(200);
  if (tab === "cua-toi") q = q.eq("nhan_vien_id", nd.nhanVienId);
  const [{ data: bc }, { data: nv }, { data: toi }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten, hoat_dong").order("ho_ten"), db.from("bao_cao_ngay").select("da_lam, vuong, ke_hoach").eq("nhan_vien_id", nd.nhanVienId).eq("ngay", hom).maybeSingle()]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truong: Truong[] = [
    { ten: "ngay", nhan: "Ngày báo cáo", loai: "ngay" },
    ...(xemHet ? [{ ten: "thay_cho", nhan: "Nộp thay nhân viên", loai: "chon" as const, goiY: "Chính tôi", luaChon: (nv ?? []).filter((n) => n.hoat_dong && n.id !== nd.nhanVienId).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten })) }] : []),
    { ten: "da_lam", nhan: "Đã làm hôm nay", loai: "nhieu_dong", batBuoc: true, rong: true },
    { ten: "vuong", nhan: "Vướng mắc", loai: "nhieu_dong", rong: true },
    { ten: "ke_hoach", nhan: "Kế hoạch hôm sau", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/noi-lam-viec", nhan: "Nơi làm việc" }} tieuDe="Báo cáo ngày" phu="Nộp báo cáo công việc cuối ngày: đã làm, vướng mắc, kế hoạch hôm sau. Mỗi người một báo cáo mỗi ngày — nộp lại cùng ngày sẽ cập nhật bản cũ.">
        <NutHop nhan={toi ? "Sửa báo cáo hôm nay" : "Nộp báo cáo hôm nay"} tieuDe="Báo cáo ngày" truong={truong} action={nopBaoCaoNgay} giaTri={{ ngay: hom, da_lam: toi?.da_lam ?? "", vuong: toi?.vuong ?? "", ke_hoach: toi?.ke_hoach ?? "" }} rong nhanLuu="Nộp báo cáo" />
      </TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc="/noi-lam-viec/bao-cao-ngay" />
      <Bang noi duLieu={bc ?? []} khoa={(r) => r.id} trong="Chưa có báo cáo nào."
        cot={[
          { nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Nhân viên", hienThi: (r) => ten.get(r.nhan_vien_id) ?? "" },
          { nhan: "Đã làm", hienThi: (r) => <span className="whitespace-pre-line">{r.da_lam}</span> },
          { nhan: "Vướng mắc", hienThi: (r) => <span className="whitespace-pre-line">{r.vuong ?? ""}</span> },
          { nhan: "Kế hoạch hôm sau", hienThi: (r) => <span className="whitespace-pre-line">{r.ke_hoach ?? ""}</span> },
        ]} />
    </div>
  );
}
