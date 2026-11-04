import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { FormHoanTat } from "@/components/phieu-cap/FormHoanTat";
import { TT_PHIEU } from "../page";
import { capPhieu, capThemPhieu, doiChieuPhieu, hoanTatPhieu, huyPhieu, nhanPhieu } from "../actions";

export default async function ChiTietPhieu({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("phieu.xem");
  const { id } = await params;
  const db = sb();
  const { data: p } = await db.from("phieu_cap").select("*").eq("id", id).maybeSingle();
  if (!p || (nd.chiNhanhId && p.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: k }, { data: dv }, { data: nv }, { data: nguong }, { data: spAll }] = await Promise.all([
    db.from("phieu_cap_dong").select("*").eq("phieu_id", id), db.from("khach_hang").select("id, ho_ten, ma").eq("id", p.khach_id).maybeSingle(),
    db.from("dich_vu").select("ten").eq("id", p.dich_vu_id).maybeSingle(), db.from("nhan_vien").select("id, ho_ten, vai_tro"),
    db.from("cau_hinh").select("gia_tri").eq("khoa", "nguong_lech_pct").maybeSingle(), db.from("san_pham").select("id, ten, don_vi").eq("tieu_hao", true).eq("hoat_dong", true).order("ten"),
  ]);
  const sp = new Map((spAll ?? []).map((s) => [s.id, s]));
  const idsSp = (dong ?? []).map((d) => d.san_pham_id).filter((x) => !sp.has(x));
  if (idsSp.length) (await db.from("san_pham").select("id, ten, don_vi").in("id", idsSp)).data?.forEach((s) => sp.set(s.id, s));
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const ng = Number(nguong?.gia_tri ?? 5);
  const tt = TT_PHIEU[p.trang_thai];
  const bsLC = (nv ?? []).filter((n) => ["bac_si", "quan_ly"].includes(n.vai_tro)).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const tongCap = (dong ?? []).reduce((s, d) => s + Number(d.so_cap) * Number(d.don_gia ?? 0), 0);
  const tongDung = (dong ?? []).reduce((s, d) => s + (d.so_tra == null ? 0 : (Number(d.so_cap) - Number(d.so_tra)) * Number(d.don_gia ?? 0)), 0);
  const lamXong = p.trang_thai === "da_lam" || p.trang_thai === "da_doi_chieu";

  return (
    <>
      <TieuDeNoi tieuDe={p.ma} phu={<span className="flex flex-wrap items-center gap-2"><NhanTrangThai kieu={tt.kieu}>{tt.nhan}</NhanTrangThai><span>{dv?.ten}</span>{k && <Link href={`/khach-hang/${k.id}`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten} · {k.ma}</Link>}</span>}>
        {p.trang_thai === "cho_cap" && coQuyen(nd, "phieu.cap") && <NutNhanh chinh nhan="Kho cấp vật tư" action={capPhieu} du={{ id }} />}
        {p.trang_thai === "da_cap" && coQuyen(nd, "phieu.nhan") && (
          <NutHop nhan="Chuyên viên trị liệu nhận vật tư" tieuDe="Xác nhận đã nhận vật tư" moTa="Kiểm đủ số lượng trên phiếu. Chưa nhận thì không mở ca được." an={{ id }} nhanLuu="Đã nhận đủ" truong={[{ ten: "dem_truoc", nhan: "Số đếm máy TRƯỚC ca (nếu máy có bộ đếm)", loai: "so", rong: true }]} action={nhanPhieu} />
        )}
        {p.trang_thai === "da_nhan" && coQuyen(nd, "phieu.nhan") && <FormHoanTat id={id} nguongPct={ng} bacSi={bsLC} action={hoanTatPhieu}
          dong={(dong ?? []).map((d) => ({ id: d.id, ten: sp.get(d.san_pham_id)?.ten ?? "", don_vi: sp.get(d.san_pham_id)?.don_vi ?? "", so_cap: Number(d.so_cap), dinh_muc: Number(d.dinh_muc) }))} />}
        {["da_cap", "da_nhan"].includes(p.trang_thai) && coQuyen(nd, "phieu.cap") && (
          <NutHop kieu="phu" nhan="Cấp thêm" tieuDe="Cấp thêm vật tư giữa ca" moTa="Phải có lý do và bác sĩ xác nhận." an={{ id }} nhanLuu="Cấp thêm"
            truong={[{ ten: "san_pham_id", nhan: "Vật tư", loai: "chon", batBuoc: true, rong: true, luaChon: (spAll ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` })) }, { ten: "so_luong", nhan: "Số cấp thêm", loai: "so", batBuoc: true },
              { ten: "bac_si_xn", nhan: "Bác sĩ xác nhận", loai: "chon", luaChon: bsLC, batBuoc: true }, { ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={capThemPhieu} />
        )}
        {p.trang_thai === "da_lam" && coQuyen(nd, "phieu.doichieu") && <NutNhanh chinh nhan="Đã đối chiếu" action={doiChieuPhieu} du={{ id }} />}
        {["cho_cap", "da_cap", "da_nhan"].includes(p.trang_thai) && coQuyen(nd, "phieu.cap") && <NutHop kieu="phu" nhan="Huỷ phiếu" tieuDe="Huỷ phiếu cấp" moTa="Vật tư đã cấp sẽ được hoàn lại kho." an={{ id }} nhanLuu="Huỷ phiếu" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={huyPhieu} />}
      </TieuDeNoi>
      {p.trang_thai === "cho_cap" && coQuyen(nd, "phieu.cap") && <p className="mb-4 text-[13px] text-muc-3">Kho báo &quot;Kho không đủ&quot; khi tồn của vật tư bằng 0: vào <Link href="/kho/chuan-hoa?tab=ton-dau" className="font-medium text-nhan-dam hover:underline">Chuẩn hoá vật tư, tồn đầu</Link> để chốt tồn đầu hoặc nhập kho trước.</p>}
      <HangChiSo muc={[{ nhan: "Bác sĩ chỉ định", so: tenNv.get(p.bac_si_id) ?? "" }, { nhan: "Chuyên viên trị liệu nhận", so: tenNv.get(p.ktv_id ?? "") ?? "Chưa" }, { nhan: "Giá trị đã cấp", so: tienVN(Math.round(tongCap)) }, { nhan: "Giá trị dùng thật", so: lamXong ? tienVN(Math.round(tongDung)) : "Chưa làm xong" }]} />
      <div className="mt-8 space-y-8">
        <MucTrang noi tieuDe="Vật tư trên phiếu">
          <Bang duLieu={dong ?? []} khoa={(r) => r.id} cot={[
            { nhan: "Vật tư", hienThi: (r) => <span className="text-muc">{sp.get(r.san_pham_id)?.ten}{r.cap_them ? <span className="ml-2 text-[12px] text-dat-dam">cấp thêm</span> : null}</span> }, { nhan: "Nhóm", hienThi: (r) => r.nhom_cap ?? "" },
            { nhan: "Định mức", hienThi: (r) => (Number(r.dinh_muc) > 0 ? soVN(r.dinh_muc) : "—"), phai: true }, { nhan: "Đã cấp", hienThi: (r) => soVN(r.so_cap), phai: true },
            { nhan: "Đã trả", hienThi: (r) => (r.so_tra == null ? "" : soVN(r.so_tra)), phai: true }, { nhan: "Dùng thật", hienThi: (r) => (r.so_tra == null ? "" : soVN(Number(r.so_cap) - Number(r.so_tra))), phai: true },
            { nhan: "Lệch", hienThi: (r) => { if (r.so_tra == null || !(Number(r.dinh_muc) > 0)) return ""; const l = ((Number(r.so_cap) - Number(r.so_tra) - Number(r.dinh_muc)) / Number(r.dinh_muc)) * 100; return <span className={Math.abs(l) > ng ? "font-medium text-canh-bao" : ""}>{l > 0 ? "+" : ""}{l.toFixed(1)}%</span>; }, phai: true },
            { nhan: "Lý do vượt", hienThi: (r) => (r.ly_do_vuot ? `${r.ly_do_vuot} (BS ${tenNv.get(r.bac_si_xac_nhan_id ?? "") ?? ""})` : "") },
          ]} />
        </MucTrang>
        <MucTrang noi tieuDe="Các bước">
          <ol className="space-y-1.5 text-[14px] text-muc-2">
            <li>Ra phiếu: {ngayGioVN(p.tao_luc)} · {tenNv.get(p.tao_boi ?? "") ?? ""}</li>
            {p.cap_luc && <li>Kho cấp: {ngayGioVN(p.cap_luc)} · {tenNv.get(p.cap_boi ?? "") ?? ""}</li>}
            {p.nhan_luc && <li>Chuyên viên trị liệu nhận: {ngayGioVN(p.nhan_luc)} · {tenNv.get(p.nhan_boi ?? "") ?? ""}{p.dem_may_truoc != null ? ` · đếm máy trước ${p.dem_may_truoc}` : ""}</li>}
            {p.lam_xong_luc && <li>Làm xong: {ngayGioVN(p.lam_xong_luc)}{p.dem_may_sau != null ? ` · đếm máy sau ${p.dem_may_sau}${p.dem_may_truoc != null ? ` (chênh ${p.dem_may_sau - p.dem_may_truoc})` : ""}` : ""}</li>}
            {p.doi_chieu_luc && <li>Đối chiếu: {ngayGioVN(p.doi_chieu_luc)} · {tenNv.get(p.doi_chieu_boi ?? "") ?? ""}</li>}
            {p.ly_do_huy && <li className="text-loi">Huỷ: {p.ly_do_huy}</li>}
          </ol>
        </MucTrang>
      </div>
    </>
  );
}
