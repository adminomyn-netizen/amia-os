import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { dsNvTrongPham, luaChonNv } from "@/lib/hr-pham-vi";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuCapBac, luuThangChuc } from "./actions";

const TAB = [{ ma: "cap-bac", ten: "Khung cấp bậc" }, { ma: "lich-su", ten: "Lịch sử thăng chức, điều chuyển" }] as const;
const LOAI = { thang_chuc: "Thăng chức", dieu_chuyen: "Điều chuyển", ha_bac: "Hạ bậc", tang_luong: "Tăng lương" } as const;

export default async function TrangThangTien({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem thăng tiến.</p>;
  const yc = (await searchParams).tab;
  const tab = TAB.find((t) => t.ma === yc)?.ma ?? "cap-bac";
  const db = sb();
  const [{ data: cb }, { data: pb }] = await Promise.all([db.from("cap_bac").select("*").order("bac"), db.from("phong_ban").select("id, ten").order("thu_tu")]);
  const dsCb = cb ?? [], tenCb = new Map(dsCb.map((c) => [c.id, c.ten])), tenPb = new Map((pb ?? []).map((p) => [p.id, p.ten]));
  let noiDung: React.ReactNode;
  if (tab === "cap-bac") {
    const sua = !nd.chiNhanhId;
    const truong: Truong[] = [
      { ten: "ma", nhan: "Mã", loai: "chu", batBuoc: true }, { ten: "bac", nhan: "Bậc (1 là thấp nhất)", loai: "so", batBuoc: true }, { ten: "ten", nhan: "Tên cấp bậc", loai: "chu", batBuoc: true, rong: true },
      { ten: "luong_tu", nhan: "Lương từ", loai: "tien" }, { ten: "luong_den", nhan: "Lương đến", loai: "tien" }, { ten: "dieu_kien", nhan: "Điều kiện lên bậc", loai: "nhieu_dong", rong: true }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat", chiKhiTao: false },
    ];
    noiDung = (
      <>
        {sua && <div className="mb-3 flex justify-end"><NutHop nhan="Thêm cấp bậc" tieuDe="Thêm cấp bậc" truong={truong.filter((t) => t.ten !== "hoat_dong")} action={luuCapBac} giaTri={{ bac: String((dsCb.at(-1)?.bac ?? 0) + 1) }} /></div>}
        <Bang duLieu={dsCb} khoa={(r) => r.id} trong="Chưa có cấp bậc nào."
          cot={[
            { nhan: "Bậc", phai: true, hienThi: (r) => r.bac }, { nhan: "Mã", hienThi: (r) => r.ma },
            { nhan: "Cấp bậc", chinh: true, hienThi: (r) => <span className={r.hoat_dong ? "" : "text-muc-3 line-through"}>{r.ten}</span> },
            { nhan: "Khoảng lương", phai: true, hienThi: (r) => (r.luong_tu == null && r.luong_den == null ? "—" : `${r.luong_tu == null ? "…" : tienVN(r.luong_tu)} đến ${r.luong_den == null ? "…" : tienVN(r.luong_den)}`) },
            { nhan: "Điều kiện lên bậc", hienThi: (r) => <span className="text-[13px]">{r.dieu_kien ?? ""}</span> },
            { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa cấp bậc" truong={truong} action={luuCapBac} an={{ id: r.id }} giaTri={{ id: r.id, ma: r.ma, bac: String(r.bac), ten: r.ten, luong_tu: r.luong_tu == null ? "" : String(r.luong_tu), luong_den: r.luong_den == null ? "" : String(r.luong_den), dieu_kien: r.dieu_kien ?? "", hoat_dong: r.hoat_dong ? "1" : "" }} /> : null) },
          ]} />
        {!sua && <p className="mt-2 text-[13px] text-muc-3">Khung cấp bậc dùng chung toàn công ty, chỉ tài khoản không gắn chi nhánh được sửa.</p>}
      </>
    );
  } else {
    const nv = await dsNvTrongPham(nd.chiNhanhId, false);
    const ids = nv.map((n) => n.id), ten = new Map(nv.map((n) => [n.id, n.ho_ten]));
    const { data: ls } = ids.length ? await db.from("thang_chuc").select("*").in("nhan_vien_id", ids).order("hieu_luc_tu", { ascending: false }).limit(500) : { data: [] };
    const truong: Truong[] = [
      { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: luaChonNv(nv.filter((n) => n.hoat_dong)), rong: true },
      { ten: "loai", nhan: "Loại thay đổi", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) }, { ten: "hieu_luc_tu", nhan: "Hiệu lực từ", loai: "ngay", batBuoc: true },
      { ten: "den_chuc_danh", nhan: "Chức danh mới", loai: "chu" }, { ten: "den_phong_id", nhan: "Phòng mới", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Giữ nguyên" }, ...(pb ?? []).map((p) => ({ gia_tri: p.id, nhan: p.ten }))] },
      { ten: "cap_bac_id", nhan: "Cấp bậc mới", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không đổi" }, ...dsCb.filter((c) => c.hoat_dong).map((c) => ({ gia_tri: c.id, nhan: c.ten }))] }, { ten: "so_quyet_dinh", nhan: "Số quyết định", loai: "chu" },
      { ten: "ly_do", nhan: "Lý do", loai: "nhieu_dong", rong: true }, { ten: "cap_nhat_ho_so", nhan: "Cập nhật chức danh, phòng trong hồ sơ", loai: "gat" },
    ];
    noiDung = (
      <>
        <div className="mb-3 flex justify-end"><NutHop nhan="Ghi thay đổi" tieuDe="Ghi thăng chức, điều chuyển" truong={truong} action={luuThangChuc} giaTri={{ loai: "thang_chuc", hieu_luc_tu: homNayHCM(), cap_nhat_ho_so: "1" }} /></div>
        <Bang duLieu={ls ?? []} khoa={(r) => r.id} trong="Chưa có thay đổi nào."
          cot={[
            { nhan: "Hiệu lực", hienThi: (r) => ngayVN(r.hieu_luc_tu) }, { nhan: "Nhân viên", chinh: true, hienThi: (r) => ten.get(r.nhan_vien_id) ?? "Đã nghỉ" },
            { nhan: "Loại", hienThi: (r) => <NhanTrangThai kieu={r.loai === "ha_bac" ? "cho" : "tot"}>{LOAI[r.loai as keyof typeof LOAI]}</NhanTrangThai> },
            { nhan: "Từ → đến", hienThi: (r) => <span className="text-[13px]">{[r.tu_chuc_danh && r.den_chuc_danh ? `${r.tu_chuc_danh} → ${r.den_chuc_danh}` : r.den_chuc_danh, r.den_phong_id ? `Phòng: ${tenPb.get(r.tu_phong_id ?? "") ?? "—"} → ${tenPb.get(r.den_phong_id) ?? "—"}` : "", r.cap_bac_id ? `Bậc: ${tenCb.get(r.cap_bac_id) ?? ""}` : ""].filter(Boolean).join(" · ")}</span> },
            { nhan: "Quyết định", hienThi: (r) => <span className="text-[13px]">{r.so_quyet_dinh ?? ""}</span> },
          ]} />
      </>
    );
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Thăng tiến" phu="Khung cấp bậc của công ty và lịch sử thăng chức, điều chuyển của từng người." />
      <nav aria-label="Thăng tiến" className="mb-5 flex flex-wrap gap-2">
        {TAB.map((t) => <Link key={t.ma} href={`/nhan-su/thang-tien?tab=${t.ma}`} aria-current={t.ma === tab ? "page" : undefined} className={`rounded-nho border px-3.5 py-2 text-[14px] ${t.ma === tab ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>)}
      </nav>
      {noiDung}
    </div>
  );
}
