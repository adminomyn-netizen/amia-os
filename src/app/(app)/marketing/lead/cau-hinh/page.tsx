import { yeuCauMotTrong } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { MAU_COT } from "@/lib/lead";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { cauHinhCot, datPhuTrachLead, luuLyDoThua } from "../actions";
import { luuNguonLead } from "../../actions";

const slaChu = (p: number | null) => (!p ? "—" : p % 1440 === 0 ? `${p / 1440} ngày` : p % 60 === 0 ? `${p / 60} giờ` : `${p} phút`);
const LOAI_NGUON = [{ gia_tri: "nguon_ngoai", nhan: "Nguồn ngoài" }, { gia_tri: "doi_tac", nhan: "Đối tác" }];

/** Cấu hình Hộp Lead (như BeDental "Cấu hình cột & nguồn"): cột kanban có phiên bản, nguồn lead, lý do thua, phụ trách lead theo chi nhánh. */
export default async function TrangCauHinhLead() {
  const nd = await yeuCauMotTrong(["lead.xu_ly", "mkt.xem"]);
  const sua = coQuyen(nd, "mkt.sua") && nd.vaiTro !== "chi_xem", duyet = coQuyen(nd, "mkt.duyet") && nd.vaiTro !== "chi_xem";
  const db = sb();
  const [{ data: gd }, { data: nguon }, { data: lyDo }, { data: cn }, { data: nv }] = await Promise.all([
    db.from("lead_giai_doan").select("*").order("thu_tu"),
    db.from("nguon_lead").select("id, ten, loai, hoat_dong").order("thu_tu"),
    db.from("lead_ly_do_thua").select("id, ten, dang_dung").order("thu_tu"),
    db.from("chi_nhanh").select("id, ten, phu_trach_lead_id").eq("hoat_dong", true).order("thu_tu"),
    db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"),
  ]);
  const cot = (gd ?? []).sort((a, b) => Number(a.la_thang || a.la_thua) - Number(b.la_thang || b.la_thua) || a.thu_tu - b.thu_tu);
  const phienBan = String(Math.max(0, ...cot.map((c) => c.phien_ban)));
  const dem = await Promise.all(cot.map((c) => db.from("lead").select("id", { count: "exact", head: true }).eq("giai_doan_id", c.id)));
  const soLead = new Map(cot.map((c, i) => [c.id, dem[i].count ?? 0]));
  const truongCot: Truong[] = [
    { ten: "ten", nhan: "Tên cột", loai: "chu", batBuoc: true },
    { ten: "mau", nhan: "Màu", loai: "chon", batBuoc: true, luaChon: MAU_COT.map((m) => ({ gia_tri: m, nhan: m })) },
    { ten: "sla_phut", nhan: "SLA (phút, để trống nếu không cần)", loai: "so" },
  ];
  const moTong = cot.filter((c) => !c.la_thang && !c.la_thua);
  const nvChon = [{ gia_tri: "", nhan: "Chưa chọn" }, ...(nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing/lead", nhan: "Hộp Lead" }} tieuDe="Cấu hình cột & nguồn" phu={<>Cột Thắng và Thua cố định ở cuối. Cột còn lead thì không ngừng dùng được. Phiên bản cấu hình: <b>{phienBan}</b>.</>}>
        {sua && <NutHop nhan="Thêm cột" tieuDe="Thêm cột kanban" truong={truongCot} action={cauHinhCot} an={{ thao_tac: "them", phien_ban: phienBan }} giaTri={{ mau: MAU_COT[0] }} />}
      </TieuDeNoi>

      <h2 className="mb-2 text-[15px] font-semibold">Cột kanban</h2>
      <Bang noi duLieu={cot} khoa={(r) => r.id} trong="Chưa có cột."
        cot={[
          { nhan: "Cột", chinh: true, hienThi: (r) => <span className="inline-flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-tag" style={{ background: r.mau }} />{r.ten}{(r.la_thang || r.la_thua) && <span className="text-[12px] text-muc-3">(cố định)</span>}</span> },
          { nhan: "SLA", hienThi: (r) => slaChu(r.sla_phut) },
          { nhan: "Số lead", phai: true, hienThi: (r) => (soLead.get(r.id) ?? 0).toLocaleString("vi-VN") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.dang_dung ? "tot" : "tram"}>{r.dang_dung ? "Đang dùng" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => !sua ? null : (
            <div className="flex flex-wrap justify-end gap-3">
              <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa cột ${r.ten}`} truong={truongCot} action={cauHinhCot} an={{ thao_tac: "sua", id: r.id, phien_ban: phienBan }} giaTri={{ ten: r.ten, mau: r.mau, sla_phut: r.sla_phut ?? "" }} />
              {!r.la_thang && !r.la_thua && moTong[0]?.id !== r.id && <NutNhanh nhan="↑ Lên" action={cauHinhCot} du={{ thao_tac: "len", id: r.id, phien_ban: phienBan }} />}
              {!r.la_thang && !r.la_thua && moTong[moTong.length - 1]?.id !== r.id && <NutNhanh nhan="↓ Xuống" action={cauHinhCot} du={{ thao_tac: "xuong", id: r.id, phien_ban: phienBan }} />}
              {!r.la_thang && !r.la_thua && (r.dang_dung
                ? <NutNhanh nhan="Ngừng dùng" action={cauHinhCot} du={{ thao_tac: "ngung", id: r.id, phien_ban: phienBan }} />
                : <NutNhanh nhan="Dùng lại" action={cauHinhCot} du={{ thao_tac: "dung_lai", id: r.id, phien_ban: phienBan }} />)}
            </div>
          ) },
        ]} />

      <div className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">Nguồn lead</h2>
        {sua && <NutHop kieu="phu" nhan="Thêm nguồn" tieuDe="Thêm nguồn lead" truong={[{ ten: "ten", nhan: "Tên nguồn", loai: "chu", batBuoc: true }, { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: LOAI_NGUON }]} action={luuNguonLead} giaTri={{ loai: "nguon_ngoai" }} />}
      </div>
      <Bang noi duLieu={nguon ?? []} khoa={(r) => r.id}
        cot={[
          { nhan: "Nguồn", chinh: true, hienThi: (r) => r.ten },
          { nhan: "Loại", hienThi: (r) => (r.loai === "doi_tac" ? "Đối tác" : "Nguồn ngoài") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang dùng" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => !sua ? null : (
            <div className="flex flex-wrap justify-end gap-3">
              <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa nguồn" truong={[{ ten: "ten", nhan: "Tên nguồn", loai: "chu", batBuoc: true }, { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: LOAI_NGUON }]} action={luuNguonLead} an={{ hoat_dong: r.hoat_dong ? "1" : "0" }} giaTri={{ id: r.id, ten: r.ten, loai: r.loai }} />
              <NutNhanh nhan={r.hoat_dong ? "Ngừng dùng" : "Dùng lại"} action={luuNguonLead} du={{ id: r.id, ten: r.ten, loai: r.loai, hoat_dong: r.hoat_dong ? "0" : "1" }} />
            </div>
          ) },
        ]} />

      <div className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">Lý do thua</h2>
        {sua && <NutHop kieu="phu" nhan="Thêm lý do" tieuDe="Thêm lý do thua" truong={[{ ten: "ten", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={luuLyDoThua} />}
      </div>
      <Bang noi duLieu={lyDo ?? []} khoa={(r) => r.id}
        cot={[
          { nhan: "Lý do", chinh: true, hienThi: (r) => r.ten },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.dang_dung ? "tot" : "tram"}>{r.dang_dung ? "Đang dùng" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => !sua ? null : <div className="flex justify-end"><NutNhanh nhan={r.dang_dung ? "Ngừng dùng" : "Dùng lại"} action={luuLyDoThua} du={{ id: r.id, ten: r.ten, dang_dung: r.dang_dung ? "0" : "1" }} /></div> },
        ]} />

      <h2 className="mb-1 mt-8 text-[15px] font-semibold">Phụ trách lead theo chi nhánh</h2>
      <p className="mb-3 text-[13px] text-muc-3">Lead mới của chi nhánh chưa có người phụ trách sẽ tự giao cho người này. Để &quot;Chưa chọn&quot; thì lead chờ người nhận như cũ.</p>
      <Bang noi duLieu={(cn ?? []).filter((c) => !nd.chiNhanhId || c.id === nd.chiNhanhId)} khoa={(r) => r.id}
        cot={[
          { nhan: "Chi nhánh", chinh: true, hienThi: (r) => r.ten },
          { nhan: "Phụ trách lead", hienThi: (r) => (r.phu_trach_lead_id ? tenNv.get(r.phu_trach_lead_id) ?? "Nhân viên đã nghỉ" : <span className="text-muc-3">Chưa chọn</span>) },
          { nhan: "", hienThi: (r) => !duyet ? null : <div className="flex justify-end"><NutHop kieu="chu" nhan="Đổi" tieuDe={`Phụ trách lead · ${r.ten}`} truong={[{ ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", luaChon: nvChon }]} action={datPhuTrachLead} an={{ chi_nhanh_id: r.id }} giaTri={{ nhan_vien_id: r.phu_trach_lead_id ?? "" }} /></div> },
        ]} />
    </div>
  );
}
