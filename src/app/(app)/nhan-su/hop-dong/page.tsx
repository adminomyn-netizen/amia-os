import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { GIAI_DOAN_HD, THU_TU_HD, tinhHieuLuc } from "@/lib/van-ban";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuHdld } from "./actions";

export default async function TrangHopDong() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "cong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem hợp đồng lao động.</p>;
  const sua = coQuyen(nd, "cong.sua");
  const db = sb(), hom = homNayHCM();
  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id, trang_thai_lam").eq("hoat_dong", true).order("ho_ten");
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: nv }, { data: hd }, { data: ch }] = await Promise.all([qn, db.from("hd_lao_dong").select("*"), db.from("cau_hinh").select("gia_tri").eq("khoa", "hd.nhac_truoc_ngay").maybeSingle()]);
  const truoc = Number(ch?.gia_tri ?? 45);
  const theoNv = new Map<string, NonNullable<typeof hd>>();
  for (const h of hd ?? []) theoNv.set(h.nhan_vien_id, [...(theoNv.get(h.nhan_vien_id) ?? []), h]);
  const dong = (nv ?? []).map((n) => {
    const ds = (theoNv.get(n.id) ?? []).sort((a, b) => THU_TU_HD.indexOf(a.giai_doan as never) - THU_TU_HD.indexOf(b.giai_doan as never));
    const hienTai = ds[ds.length - 1];
    const hl = hienTai ? (hienTai.giai_doan === "kxd" ? "con" : tinhHieuLuc(hienTai.den_ngay, hom, congNgay, truoc)) : "khong";
    const tiep = hienTai ? THU_TU_HD[THU_TU_HD.indexOf(hienTai.giai_doan as never) + 1] : "thu_viec";
    return { ...n, ds, hienTai, hl, tiep };
  }).sort((a, b) => ({ het: 0, sap: 1, khong: 2, con: 3 })[a.hl] - ({ het: 0, sap: 1, khong: 2, con: 3 })[b.hl]);
  const truong = (nvId: string, gd: string): Truong[] => [
    ...(nvId ? [] : [{ ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon" as const, batBuoc: true, luaChon: (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` })) }]),
    { ten: "giai_doan", nhan: "Giai đoạn", loai: "chon", batBuoc: true, luaChon: Object.entries(GIAI_DOAN_HD).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "so_hd", nhan: "Số hợp đồng", loai: "chu" }, { ten: "tu_ngay", nhan: "Từ ngày", loai: "ngay", batBuoc: true },
    { ten: "den_ngay", nhan: gd === "thu_viec" ? "Đến ngày (bỏ trống = 60 ngày)" : "Đến ngày (không áp dụng với không xác định thời hạn)", loai: "ngay" },
    { ten: "link_ban_dien_tu", nhan: "Link bản điện tử (https://…)", loai: "chu", rong: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Hợp đồng lao động" phu={<>Chuỗi: thử việc (60 ngày) → HĐLĐ lần 1 → lần 2 → không xác định thời hạn. Nhắc trước {truoc} ngày khi sắp hết hạn. Người sắp hết hạn hoặc chưa có hợp đồng đứng đầu danh sách.</>}>
        {sua && <NutHop nhan="Thêm hợp đồng" tieuDe="Thêm hợp đồng lao động" truong={truong("", "")} action={luuHdld} giaTri={{ nhan_vien_id: "", giai_doan: "thu_viec", tu_ngay: hom }} rong />}
      </TieuDeTrang>
      <Bang duLieu={dong} khoa={(r) => r.id} trong="Chưa có nhân viên."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{r.ho_ten}<div className="text-[12.5px] text-muc-3">{r.ma_nv}</div></div> },
          { nhan: "Chuỗi hợp đồng", hienThi: (r) => (r.ds.length ? <div className="space-y-0.5 text-[13px]">{r.ds.map((h) => <div key={h.id}>{GIAI_DOAN_HD[h.giai_doan]}: {ngayVN(h.tu_ngay)}{h.den_ngay ? ` – ${ngayVN(h.den_ngay)}` : ""}{h.so_hd && ` · ${h.so_hd}`}{h.link_ban_dien_tu && <> · <a href={h.link_ban_dien_tu} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">bản điện tử</a></>}</div>)}</div> : <span className="text-muc-3">Chưa có hợp đồng</span>) },
          { nhan: "Tình trạng", hienThi: (r) => (r.hl === "het" ? <NhanTrangThai kieu="loi">Đã hết hạn</NhanTrangThai> : r.hl === "sap" ? <div><NhanTrangThai kieu="cho">Sắp hết hạn</NhanTrangThai><div className="mt-1 text-[12.5px] text-muc-3">{ngayVN(r.hienTai?.den_ngay)}</div></div> : r.hl === "con" ? <NhanTrangThai kieu="tot">Còn hiệu lực</NhanTrangThai> : <NhanTrangThai kieu="tram">Chưa có</NhanTrangThai>) },
          { nhan: "", hienThi: (r) => (sua && r.tiep && r.hl !== "con" || sua && r.hl === "con" && r.hienTai?.giai_doan !== "kxd" ? <NutHop kieu="chu" nhan={`Thêm ${GIAI_DOAN_HD[r.tiep!] ?? "hợp đồng"}`} tieuDe={`${r.ho_ten}: ${GIAI_DOAN_HD[r.tiep!] ?? ""}`} truong={truong(r.id, r.tiep!).filter((t) => t.ten !== "nhan_vien_id")} action={luuHdld} an={{ nhan_vien_id: r.id }} giaTri={{ giai_doan: r.tiep!, tu_ngay: r.hienTai?.den_ngay ? congNgay(r.hienTai.den_ngay, 1) : hom }} rong /> : null) },
        ]} />
    </div>
  );
}
