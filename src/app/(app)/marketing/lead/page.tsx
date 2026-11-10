import Link from "next/link";
import { yeuCauMotTrong } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { PHUT_XAC_NHAN } from "@/lib/marketing";
import { capNhatTruoc, LOC_NHAC, MUC_CHAM_SOC, quaSla } from "@/lib/lead";
import { apDungLoc, type LocLeadMay } from "@/lib/lead-loc";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NUT_PHU } from "@/components/ui/dinh-dang";
import { BoLocLead, type LocLead } from "@/components/lead/BoLocLead";
import { KanbanLead, type CotKanban } from "@/components/lead/KanbanLead";
import { BangLead, type DongLead } from "@/components/lead/BangLead";
import { taoLead } from "../actions";

const MOI_TRANG = 50, MOI_COT = 50;
const COT_THE = "id, ma, ho_ten, sdt, email, chi_nhanh_id, giai_doan_id, owner_id, gia_tri_du_kien, nguon_id, ket_qua, cap_nhat_luc, giai_doan_luc, khach_id, so_tep, so_nhac_cho, nhac_som_nhat, so_tac_vu_mo, ho_tro_ids";

/** Hộp Lead (M3, như BeDental): Kanban kéo thả theo giai đoạn hoặc Bảng nhập nhanh; tìm + lọc trên địa chỉ trang; bấm lead mở khung làm việc 5 tab. */
export default async function TrangLead({ searchParams }: { searchParams: Promise<LocLead & { trang?: string }> }) {
  const nd = await yeuCauMotTrong(["lead.xu_ly", "mkt.xem"]);
  const ghi = coQuyen(nd, "lead.xu_ly") && nd.vaiTro !== "chi_xem";
  const duyet = coQuyen(nd, "mkt.duyet");
  const sp = await searchParams;
  const xem = sp.xem === "bang" ? "bang" : "kanban";
  const trang = Math.max(1, Number(sp.trang) || 1);
  const loc: LocLeadMay = sp;
  const db = sb();
  const [{ data: gdAll }, { data: lyDo }, { data: nguon }, { data: dt }, { data: nv }, { data: cn }, { count: chuaNhan }] = await Promise.all([
    db.from("lead_giai_doan").select("id, ten, mau, thu_tu, sla_phut, la_thang, la_thua, dang_dung").order("thu_tu"),
    db.from("lead_ly_do_thua").select("id, ten").eq("dang_dung", true).order("thu_tu"),
    db.from("nguon_lead").select("id, ten, hoat_dong, loai").order("thu_tu"),
    db.from("doi_tac_gt").select("id, ten").eq("hoat_dong", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu"),
    apDungLoc(db.from("lead").select("id", { count: "exact", head: true }), {}, nd).is("owner_id", null).eq("ket_qua", "open"),
  ]);
  const cot = (gdAll ?? []).filter((g) => g.dang_dung).sort((a, b) => Number(a.la_thang || a.la_thua) - Number(b.la_thang || b.la_thua) || a.thu_tu - b.thu_tu);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), tenCn = new Map((cn ?? []).map((n) => [n.id, n.ten]));
  const bayD = new Date(), bay = bayD.getTime(), bayIso = bayD.toISOString();
  const slaCot = new Map((gdAll ?? []).map((g) => [g.id, g.sla_phut]));
  type Dong = { id: string; ma: string; ho_ten: string; sdt: string; email: string | null; chi_nhanh_id: string; giai_doan_id: string; owner_id: string | null; gia_tri_du_kien: number; nguon_id: string; ket_qua: string; cap_nhat_luc: string; giai_doan_luc: string; khach_id: string | null; so_tep: number; so_nhac_cho: number; nhac_som_nhat: string | null; so_tac_vu_mo: number; ho_tro_ids: string[] | null };
  const suaDuoc = (r: Dong) => ghi && (duyet || r.owner_id === nd.nhanVienId || (r.ho_tro_ids ?? []).includes(nd.nhanVienId));
  const sla = (r: Dong) => quaSla(r.giai_doan_luc, slaCot.get(r.giai_doan_id) ?? null, r.ket_qua, bay);

  let noiDung: React.ReactNode;
  if (xem === "kanban") {
    const theoCot = await Promise.all(cot.map((c) => apDungLoc(db.from("v_lead_ds").select(COT_THE, { count: "exact" }), loc, nd).eq("giai_doan_id", c.id).order("cap_nhat_luc", { ascending: false }).limit(MOI_COT)));
    const dsCot: CotKanban[] = cot.map((c, i) => ({
      id: c.id, ten: c.ten, mau: c.mau, sla_phut: c.sla_phut, la_thang: c.la_thang, la_thua: c.la_thua, tong: theoCot[i].count ?? 0,
      the: ((theoCot[i].data ?? []) as unknown as Dong[]).map((r) => ({
        id: r.id, ma: r.ma, ho_ten: r.ho_ten, sdt: r.sdt, gia_tri: Number(r.gia_tri_du_kien), cap_nhat: capNhatTruoc(r.cap_nhat_luc, new Date(bay)), qua_sla: sla(r),
        phu_trach: r.owner_id ? tenNv.get(r.owner_id) ?? "?" : null, so_tep: r.so_tep ?? 0, so_nhac: r.so_nhac_cho ?? 0, nhac_qua_han: !!r.nhac_som_nhat && r.nhac_som_nhat < bayIso, so_tac_vu: r.so_tac_vu_mo ?? 0, la_khach: !!r.khach_id,
      })),
    }));
    noiDung = <KanbanLead cot={dsCot} lyDoThua={(lyDo ?? []).map((l) => ({ gia_tri: l.id, nhan: l.ten }))} ghi={ghi} them="" />;
  } else {
    const { data, count } = await apDungLoc(db.from("v_lead_ds").select(COT_THE, { count: "exact" }), loc, nd).order("cap_nhat_luc", { ascending: false }).range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1);
    const dong: DongLead[] = ((data ?? []) as unknown as Dong[]).map((r) => ({
      id: r.id, ma: r.ma, ho_ten: r.ho_ten, sdt: r.sdt, email: r.email, chi_nhanh: tenCn.get(r.chi_nhanh_id) ?? "", giai_doan_id: r.giai_doan_id, phu_trach: r.owner_id ? tenNv.get(r.owner_id) ?? "?" : null,
      gia_tri: Number(r.gia_tri_du_kien), nguon_id: r.nguon_id, ket_qua: r.ket_qua, cap_nhat: capNhatTruoc(r.cap_nhat_luc, new Date(bay)), qua_sla: sla(r), sua: suaDuoc(r),
    }));
    const u = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "trang") as [string, string][]);
    noiDung = (
      <>
        <BangLead dong={dong} cot={cot} lyDoThua={(lyDo ?? []).map((l) => ({ gia_tri: l.id, nhan: l.ten }))} ghi={ghi} them=""
          nguon={(nguon ?? []).map((n) => ({ gia_tri: n.id, nhan: n.hoat_dong ? n.ten : `${n.ten} (ngừng)` }))}
          nguonMoi={(nguon ?? []).filter((n) => n.hoat_dong).map((n) => ({ gia_tri: n.id, nhan: n.ten }))}
          chiNhanh={nd.chiNhanhId ? null : (cn ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))} />
        <ThanhTrang trang={trang} tong={count ?? 0} moi={MOI_TRANG} don="lead" luonHien gan={(t) => { const v = new URLSearchParams(u); if (t) v.set("trang", String(t)); return `/marketing/lead${v.size ? `?${v}` : ""}`; }} />
      </>
    );
  }

  const nvChon = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const truongTao: Truong[] = [
    { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "sdt", nhan: "Số điện thoại", loai: "chu", batBuoc: true },
    { ten: "email", nhan: "Email", loai: "email" }, { ten: "gia_tri_du_kien", nhan: "Giá trị dự kiến (đ)", loai: "tien" },
    { ten: "nguon_id", nhan: "Nguồn", loai: "chon", batBuoc: true, luaChon: (nguon ?? []).filter((n) => n.hoat_dong).map((n) => ({ gia_tri: n.id, nhan: n.ten })) },
    { ten: "doi_tac_id", nhan: "Người giới thiệu", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không có" }, ...(dt ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    ...(nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon" as const, batBuoc: true, luaChon: (cn ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })) }]),
    { ten: "dich_vu_quan_tam", nhan: "Dịch vụ quan tâm", loai: "chu" }, { ten: "nhu_cau", nhan: "Nhu cầu / ghi chú", loai: "nhieu_dong", rong: true },
    { ten: "nhan_ngay", nhan: "Tôi phụ trách lead này ngay", loai: "gat" },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Hộp Lead"
        phu={<>Kéo thả lead giữa các cột để đổi giai đoạn. Mọi lead đều ghi lại, <b>không xoá</b>; người phụ trách xác nhận trong {PHUT_XAC_NHAN} phút.{(chuaNhan ?? 0) > 0 && <> <Link href="/marketing/lead?pt=chua&kq=open" className="font-medium text-canh-bao hover:underline">{chuaNhan} lead chưa ai nhận</Link>.</>}</>}>
        <Link href="/marketing/lead/cau-hinh" className={`${NUT_PHU} inline-flex items-center`}>Cấu hình cột & nguồn</Link>
        {ghi && <NutHop nhan="Thêm lead" tieuDe="Thêm lead" truong={truongTao} action={taoLead} giaTri={{ nguon_id: (nguon ?? []).find((n) => n.hoat_dong)?.id ?? "", doi_tac_id: "", gia_tri_du_kien: 0, nhan_ngay: true }} rong />}
      </TieuDeNoi>
      <BoLocLead loc={sp} chon={{
        gd: cot.map((c) => ({ gia_tri: c.id, nhan: c.ten })),
        kq: [{ gia_tri: "open", nhan: "Đang mở" }, { gia_tri: "won", nhan: "Thắng" }, { gia_tri: "lost", nhan: "Thua" }],
        cn: nd.chiNhanhId ? null : (cn ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })),
        pt: [{ gia_tri: "toi", nhan: "Của tôi" }, { gia_tri: "chua", nhan: "Chưa ai nhận" }, ...nvChon],
        ht: [{ gia_tri: "toi", nhan: "Tôi hỗ trợ" }, ...nvChon],
        dt: [{ gia_tri: "co", nhan: "Có người giới thiệu" }, ...(dt ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))],
        ng: (nguon ?? []).map((n) => ({ gia_tri: n.id, nhan: `${n.ten}${n.loai === "doi_tac" ? " · Đối tác" : ""}` })),
        tv: [{ gia_tri: "mo", nhan: "Còn tác vụ mở" }, { gia_tri: "khong", nhan: "Không có tác vụ mở" }],
        nh: LOC_NHAC.map((x) => ({ gia_tri: x.ma, nhan: x.ten })),
        cs: MUC_CHAM_SOC.map((x) => ({ gia_tri: x.ma, nhan: x.ten })),
      }} />
      {noiDung}
    </div>
  );
}
