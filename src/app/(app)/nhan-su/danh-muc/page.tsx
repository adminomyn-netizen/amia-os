import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { luuChucDanh, luuPhongBan } from "../ho-so/actions";

/** Danh mục phòng ban và chức danh (Lark 9.2) — dùng chung cho hồ sơ, lộ trình thăng tiến, báo cáo theo phòng ban. */
export default async function TrangDanhMucNhanSu() {
  await yeuCauQuyen("hr.hoso");
  const db = sb();
  const [{ data: pb }, { data: cd }, { data: nv }] = await Promise.all([
    db.from("phong_ban").select("*").order("thu_tu").order("ten"), db.from("chuc_danh_dm").select("*").order("thu_tu").order("ten"),
    db.from("nhan_vien").select("id, ho_ten, phong_ban_id, chuc_danh, hoat_dong").eq("hoat_dong", true),
  ]);
  const demPb = new Map<string, number>(), demCd = new Map<string, number>();
  for (const n of nv ?? []) { if (n.phong_ban_id) demPb.set(n.phong_ban_id, (demPb.get(n.phong_ban_id) ?? 0) + 1); if (n.chuc_danh) demCd.set(n.chuc_danh, (demCd.get(n.chuc_danh) ?? 0) + 1); }
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truongPb = (a: boolean) => [{ ten: "ten", nhan: "Tên phòng ban", loai: "chu" as const, batBuoc: true, rong: true },
    { ten: "truong_phong_id", nhan: "Trưởng phòng", loai: "chon" as const, rong: true, luaChon: [{ gia_tri: "", nhan: "Chưa có" }, ...(nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))] },
    ...(a ? [{ ten: "hoat_dong", nhan: "Đang sử dụng", loai: "gat" as const }] : [])];
  const truongCd = (a: boolean) => [{ ten: "ten", nhan: "Tên chức danh", loai: "chu" as const, batBuoc: true, rong: true }, ...(a ? [{ ten: "hoat_dong", nhan: "Đang sử dụng", loai: "gat" as const }] : [])];
  return (
    <div>
      <Link href="/nhan-su/ho-so" className="text-[13px] text-muc-3 hover:text-muc">← Hồ sơ nhân sự</Link>
      <TieuDeTrang tieuDe="Phòng ban & chức danh" phu="Danh mục dùng khi lập hồ sơ và ghi lộ trình thăng tiến. Không xoá, chỉ ngừng sử dụng để giữ lịch sử." />
      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[17px] font-semibold text-muc">Phòng ban</h2><NutHop nhan="Thêm phòng ban" tieuDe="Thêm phòng ban" truong={truongPb(false)} action={luuPhongBan} /></div>
          <Bang duLieu={pb ?? []} khoa={(r) => r.id} trong="Chưa có phòng ban."
            cot={[
              { nhan: "Phòng ban", chinh: true, hienThi: (r) => <div>{r.ten}<div className="text-[12.5px] text-muc-3">{r.truong_phong_id ? `Trưởng phòng: ${tenNv.get(r.truong_phong_id) ?? ""}` : "Chưa có trưởng phòng"}</div></div> },
              { nhan: "Nhân viên", phai: true, hienThi: (r) => demPb.get(r.id) ?? 0 }, { nhan: "", hienThi: (r) => (r.hoat_dong ? "" : <NhanTrangThai kieu="tram">Đã ngừng</NhanTrangThai>) },
              { nhan: "", hienThi: (r) => <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truongPb(true)} action={luuPhongBan} an={{ id: r.id }} giaTri={{ ten: r.ten, truong_phong_id: r.truong_phong_id ?? "", hoat_dong: r.hoat_dong }} /> },
            ]} />
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[17px] font-semibold text-muc">Chức danh</h2><NutHop nhan="Thêm chức danh" tieuDe="Thêm chức danh" truong={truongCd(false)} action={luuChucDanh} /></div>
          <Bang duLieu={cd ?? []} khoa={(r) => r.id} trong="Chưa có chức danh."
            cot={[
              { nhan: "Chức danh", chinh: true, hienThi: (r) => r.ten }, { nhan: "Nhân viên", phai: true, hienThi: (r) => demCd.get(r.ten) ?? 0 }, { nhan: "", hienThi: (r) => (r.hoat_dong ? "" : <NhanTrangThai kieu="tram">Đã ngừng</NhanTrangThai>) },
              { nhan: "", hienThi: (r) => <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ten}`} truong={truongCd(true)} action={luuChucDanh} an={{ id: r.id }} giaTri={{ ten: r.ten, hoat_dong: r.hoat_dong }} /> },
            ]} />
        </section>
      </div>
    </div>
  );
}
