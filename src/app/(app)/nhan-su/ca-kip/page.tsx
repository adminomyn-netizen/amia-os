import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, soVN } from "@/lib/dinh-dang";
import { THU, dauTuan, ngayCongThem } from "@/lib/nhan-su";
import { homNayHCM } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuCa, phanCa, luuNgayLe, xoaNgayLe } from "../actions";

export default async function TrangCaKip({ searchParams }: { searchParams: Promise<{ tuan?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xem = coQuyen(nd, "cong.xem"), sua = coQuyen(nd, "cong.sua");
  const { tuan: t } = await searchParams;
  const dau = dauTuan(/^\d{4}-\d{2}-\d{2}$/.test(t ?? "") ? t! : homNayHCM());
  const ngay = Array.from({ length: 7 }, (_, i) => ngayCongThem(dau, i));
  const db = sb();
  const [{ data: ca }, { data: nv }, { data: pc }, { data: le }] = await Promise.all([
    db.from("ca_lam").select("*").order("gio_vao").order("ma"),
    db.from("nhan_vien").select("id, ho_ten, ma_nv, chi_nhanh_id, khung_lam_viec").eq("hoat_dong", true).neq("khung_lam_viec", "khong_cham_cong").order("ho_ten"),
    db.from("phan_ca").select("nhan_vien_id, ngay, ca_id, nghi").gte("ngay", dau).lte("ngay", ngay[6]),
    db.from("ngay_le").select("*").gte("ngay", `${new Date().getUTCFullYear()}-01-01`).order("ngay"),
  ]);
  const tenCa = new Map((ca ?? []).map((c) => [c.id, c.ma]));
  const lich = new Map((pc ?? []).map((p) => [`${p.nhan_vien_id}|${p.ngay}`, p.nghi ? "Nghỉ" : tenCa.get(p.ca_id ?? "") ?? ""]));
  const ds = (nv ?? []).filter((n) => !nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId);
  const truongCa: Truong[] = [
    { ten: "ten", nhan: "Tên ca", loai: "chu", batBuoc: true, rong: true }, { ten: "ma", nhan: "Mã ca (chữ hoa, không dấu)", loai: "chu", chiKhiTao: true }, { ten: "gio_vao", nhan: "Giờ vào (08:00)", loai: "chu", batBuoc: true }, { ten: "gio_ra", nhan: "Giờ ra (17:00)", loai: "chu", batBuoc: true },
    { ten: "nghi_phut", nhan: "Nghỉ giữa ca (phút)", loai: "so" }, { ten: "dung_sai_phut", nhan: "Dung sai đi trễ (phút)", loai: "so" }, { ten: "gio_chuan", nhan: "Số giờ chuẩn", loai: "so" }, { ten: "hoat_dong", nhan: "Đang sử dụng", loai: "gat" },
  ];
  const truongPhan: Truong[] = [
    { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "nhieu", batBuoc: true, luaChon: ds.map((n) => ({ gia_tri: n.id, nhan: `${n.ho_ten} (${n.ma_nv})` })) },
    { ten: "ca_id", nhan: "Ca làm", loai: "chon", batBuoc: true, luaChon: (ca ?? []).filter((c) => c.hoat_dong).map((c) => ({ gia_tri: c.id, nhan: `${c.ma} · ${c.gio_vao.slice(0, 5)}–${c.gio_ra.slice(0, 5)}` })) },
    { ten: "tu_ngay", nhan: "Từ ngày", loai: "ngay", batBuoc: true }, { ten: "den_ngay", nhan: "Đến ngày (tối đa 62 ngày)", loai: "ngay", batBuoc: true },
    { ten: "nghi_thu", nhan: "Ngày nghỉ hằng tuần (khối chi nhánh nghỉ 1 ngày/tuần, không nghỉ T2/T7/CN)", loai: "chon", rong: true, luaChon: [{ gia_tri: "", nhan: "Không có ngày nghỉ" }, ...[2, 3, 4, 5, 6, 1, 0].map((d) => ({ gia_tri: String(d), nhan: d === 0 ? "Chủ nhật" : `Thứ ${d + 1}` }))] },
  ];
  const truongLe: Truong[] = [{ ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "ten", nhan: "Tên ngày lễ", loai: "chu", batBuoc: true }];
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Quản lý ca kíp" phu="Ca làm, lịch tuần và ngày lễ. Khối văn phòng 08:00–17:00 (nghỉ CN và hai thứ Bảy mỗi tháng); khối chi nhánh 08:00–18:30, làm cả tuần, nghỉ một ngày.">
        {sua && <NutHop nhan="Phân ca nhân viên" tieuDe="Phân ca nhân viên" moTa="Ghi đè lịch cũ trong khoảng ngày đã chọn." truong={truongPhan} action={phanCa} giaTri={{ nghi_thu: "", nhan_vien_id: [] }} rong />}
        {sua && <NutHop kieu="phu" nhan="Tạo ca mới" tieuDe="Tạo ca mới" truong={truongCa} action={luuCa} giaTri={{ nghi_phut: 0, dung_sai_phut: 0, gio_chuan: 8, hoat_dong: true }} />}
      </TieuDeTrang>
      <h2 className="nhan-muc mb-2">Danh sách ca</h2>
      <Bang duLieu={ca ?? []} khoa={(r) => r.id}
        cot={[
          { nhan: "Ca", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ten}</span><div className="text-[12.5px] text-muc-3">{r.ma}</div></div> },
          { nhan: "Giờ làm", hienThi: (r) => `${r.gio_vao.slice(0, 5)} – ${r.gio_ra.slice(0, 5)}` }, { nhan: "Nghỉ giữa ca", phai: true, hienThi: (r) => `${r.nghi_phut} phút` },
          { nhan: "Dung sai trễ", phai: true, hienThi: (r) => `${r.dung_sai_phut} phút` }, { nhan: "Giờ chuẩn", phai: true, hienThi: (r) => `${soVN(r.gio_chuan)} giờ` },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang dùng" : "Đã ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa ca ${r.ma}`} truong={truongCa} action={luuCa} giaTri={{ id: r.id, ten: r.ten, gio_vao: r.gio_vao.slice(0, 5), gio_ra: r.gio_ra.slice(0, 5), nghi_phut: r.nghi_phut, dung_sai_phut: r.dung_sai_phut, gio_chuan: r.gio_chuan, hoat_dong: r.hoat_dong }} /> : null) },
        ]} />
      {xem && (
        <>
          <div className="mb-3 mt-9 flex flex-wrap items-center gap-4">
            <h2 className="nhan-muc mr-auto">Lịch tuần {ngayVN(dau)} – {ngayVN(ngay[6])}</h2>
            <Link href={`/nhan-su/ca-kip?tuan=${ngayCongThem(dau, -7)}`} className="text-[14px] text-muc-3 hover:text-muc">← Tuần trước</Link>
            <Link href={`/nhan-su/ca-kip?tuan=${ngayCongThem(dau, 7)}`} className="text-[14px] text-muc-3 hover:text-muc">Tuần sau →</Link>
          </div>
          <Bang duLieu={ds} khoa={(r) => r.id} trong="Chưa có nhân viên cần chấm công."
            cot={[
              { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ho_ten}</span><div className="text-[12.5px] text-muc-3">{r.ma_nv}</div></div> },
              ...ngay.map((d) => ({ nhan: `${THU[new Date(`${d}T00:00:00Z`).getUTCDay()]} ${d.slice(8)}`, hienThi: (r: (typeof ds)[number]) => { const v = lich.get(`${r.id}|${d}`); return v === "Nghỉ" ? <span className="text-muc-3">Nghỉ</span> : v ?? ""; } })),
            ]} />
        </>
      )}
      <div className="mb-3 mt-9 flex items-center justify-between gap-3">
        <h2 className="nhan-muc">Ngày lễ (tính trọn công cho người chấm công)</h2>
        {sua && <NutHop kieu="chu" nhan="Thêm ngày lễ" tieuDe="Thêm ngày lễ" truong={truongLe} action={luuNgayLe} />}
      </div>
      <Bang duLieu={le ?? []} khoa={(r) => r.ngay} trong="Chưa khai báo ngày lễ nào."
        cot={[{ nhan: "Ngày", chinh: true, hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Tên", hienThi: (r) => r.ten }, { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá ngày lễ" xacNhan={`Xoá ${r.ten} (${ngayVN(r.ngay)})?`} action={xoaNgayLe} an={{ ngay: r.ngay }} nhanLuu="Xoá" /> : null) }]} />
    </div>
  );
}
