import { headers } from "next/headers";
import QRCode from "qrcode";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { soVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuLink } from "../actions";

export default async function TrangLink() {
  const nd = await yeuCauQuyen("mkt.xem");
  const sua = coQuyen(nd, "mkt.sua");
  const db = sb();
  const h = await headers();
  const goc = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const [{ data: ds }, { data: nguon }, { data: cd }, { data: dt }] = await Promise.all([
    db.from("link_theo_doi").select("*").order("tao_luc", { ascending: false }).limit(200), db.from("nguon_lead").select("id, ten").eq("hoat_dong", true).order("thu_tu"),
    db.from("chien_dich").select("id, ten, ma").order("tao_luc", { ascending: false }), db.from("doi_tac_gt").select("id, ten").eq("hoat_dong", true).order("ten"),
  ]);
  const qr = new Map<string, string>();
  for (const l of ds ?? []) qr.set(l.id, await QRCode.toString(`${goc}/l/${l.ma}`, { type: "svg", margin: 1, width: 96 }));
  const tenNguon = new Map((nguon ?? []).map((n) => [n.id, n.ten]));
  const truong: Truong[] = [
    { ten: "ten", nhan: "Tên link", loai: "chu", batBuoc: true, rong: true },
    { ten: "ma", nhan: "Mã link (không đổi được sau khi tạo)", loai: "chu", batBuoc: true, chiKhiTao: true, goiY: "vd: khuyen-mai-11" },
    { ten: "dich_den", nhan: "Địa chỉ đích", loai: "chu", batBuoc: true, rong: true, goiY: "https://…" },
    { ten: "nguon_id", nhan: "Nguồn", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(nguon ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    { ten: "chien_dich_id", nhan: "Chiến dịch", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(cd ?? []).map((n) => ({ gia_tri: n.id, nhan: `${n.ma} · ${n.ten}` }))] },
    { ten: "doi_tac_id", nhan: "Đối tác giới thiệu", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...(dt ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
    { ten: "hoat_dong", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "1", nhan: "Đang bật" }, { gia_tri: "0", nhan: "Đã tắt" }] },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing", nhan: "Marketing" }} tieuDe="Link & mã QR theo dõi" phu="Mỗi link đếm số lượt bấm trước khi chuyển tới địa chỉ đích. In mã QR lên ấn phẩm để biết khách đến từ đâu.">
        {sua && <NutHop nhan="Tạo link" tieuDe="Tạo link theo dõi" truong={truong} action={luuLink} giaTri={{ nguon_id: "", chien_dich_id: "", doi_tac_id: "", hoat_dong: "1" }} rong />}
      </TieuDeNoi>
      <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có link."
        cot={[
          { nhan: "Link", chinh: true, hienThi: (r) => <div>{r.ten}<div className="break-all text-[12.5px] text-muc-3">{goc}/l/{r.ma}</div><div className="break-all text-[12.5px] text-muc-3">→ {r.dich_den}</div></div> },
          { nhan: "Nguồn", hienThi: (r) => (r.nguon_id ? tenNguon.get(r.nguon_id) : "") },
          { nhan: "Lượt bấm", phai: true, hienThi: (r) => soVN(r.luot_click) },
          { nhan: "Mã QR", hienThi: (r) => <div className="h-24 w-24 bg-white p-1" role="img" aria-label={`Mã QR ${r.ma}`} dangerouslySetInnerHTML={{ __html: qr.get(r.id) ?? "" }} /> },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang bật" : "Đã tắt"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa link" truong={truong} action={luuLink} giaTri={{ id: r.id, ten: r.ten, dich_den: r.dich_den, nguon_id: r.nguon_id ?? "", chien_dich_id: r.chien_dich_id ?? "", doi_tac_id: r.doi_tac_id ?? "", hoat_dong: r.hoat_dong ? "1" : "0" }} rong /> : null) },
        ]} />
    </div>
  );
}
