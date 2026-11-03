import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { KIEU_HH_GIOI_THIEU, LOAI_DOI_TAC, nhanMucHoaHong } from "@/lib/marketing";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuDoiTac, luuNguonLead } from "../actions";

export default async function TrangDoiTac() {
  const nd = await yeuCauQuyen("mkt.xem");
  const sua = coQuyen(nd, "mkt.sua");
  const db = sb();
  const [{ data: ds }, { data: lead }, { data: nguon }] = await Promise.all([db.from("doi_tac_gt").select("*").order("tao_luc", { ascending: false }), db.from("lead").select("doi_tac_id, khach_id").not("doi_tac_id", "is", null), db.from("nguon_lead").select("*").order("thu_tu")]);
  const dem = new Map<string, { lead: number; khach: number }>();
  for (const l of lead ?? []) { const x = dem.get(l.doi_tac_id!) ?? { lead: 0, khach: 0 }; x.lead++; if (l.khach_id) x.khach++; dem.set(l.doi_tac_id!, x); }
  const truong: Truong[] = [
    { ten: "ten", nhan: "Tên", loai: "chu", batBuoc: true }, { ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_DOI_TAC).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "dien_thoai", nhan: "Số điện thoại", loai: "chu" }, { ten: "hoat_dong", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "1", nhan: "Đang hợp tác" }, { gia_tri: "0", nhan: "Ngừng" }] },
    { ten: "hh_kieu", nhan: "Mức hoa hồng mặc định", loai: "chon", batBuoc: true, luaChon: KIEU_HH_GIOI_THIEU.map((k) => ({ ...k })) },
    { ten: "hh_gia_tri", nhan: "Giá trị", loai: "so", ghiChu: "Phần trăm: % trên doanh số dòng sau giảm giá (số lẻ dùng dấu phẩy, vd 12,5). Theo tiền: số đồng mỗi lượt. Theo điểm: ghi điểm, không tính tiền." },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  const truongNguon: Truong[] = [{ ten: "ten", nhan: "Tên nguồn", loai: "chu", batBuoc: true, rong: true }, { ten: "hoat_dong", nhan: "Trạng thái", loai: "chon", luaChon: [{ gia_tri: "1", nhan: "Đang dùng" }, { gia_tri: "0", nhan: "Ngừng" }] }];
  return (
    <div>
      <Link href="/marketing" className="text-[13px] text-muc-3 hover:text-muc">← Marketing</Link>
      <TieuDeTrang tieuDe="Nguồn giới thiệu & cộng tác viên" phu="Mỗi đối tác có mã giới thiệu riêng và một mức hoa hồng mặc định (theo phần trăm, theo tiền hoặc theo điểm) như SalonHero. Hoa hồng giới thiệu tự tính ở Hoa hồng › Nguồn giới thiệu.">
        {sua && <NutHop nhan="Thêm đối tác" tieuDe="Thêm đối tác" truong={truong} action={luuDoiTac} giaTri={{ loai: "ctv", hoat_dong: "1", hh_kieu: "phan_tram", hh_gia_tri: 0 }} />}
      </TieuDeTrang>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có đối tác."
        cot={[
          { nhan: "Đối tác", chinh: true, hienThi: (r) => <div>{r.ma} · {r.ten}<div className="text-[12.5px] text-muc-3">{LOAI_DOI_TAC[r.loai]}{r.dien_thoai && ` · ${r.dien_thoai}`}</div></div> },
          { nhan: "Mã giới thiệu", hienThi: (r) => <code>{r.ma_gioi_thieu}</code> },
          { nhan: "Mức hoa hồng mặc định", phai: true, hienThi: (r) => <span className="tabular-nums">{nhanMucHoaHong(r.hh_kieu, Number(r.hh_gia_tri))}</span> },
          { nhan: "Lead", phai: true, hienThi: (r) => dem.get(r.id)?.lead ?? 0 }, { nhan: "Đã thành khách", phai: true, hienThi: (r) => dem.get(r.id)?.khach ?? 0 },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang hợp tác" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa đối tác" truong={truong} action={luuDoiTac} giaTri={{ id: r.id, ten: r.ten, loai: r.loai, dien_thoai: r.dien_thoai ?? "", hoat_dong: r.hoat_dong ? "1" : "0", hh_kieu: r.hh_kieu, hh_gia_tri: Number(r.hh_gia_tri), ghi_chu: r.ghi_chu ?? "" }} /> : null) },
        ]} />
      <h2 className="mb-2 mt-8 text-[15px] font-semibold">Nguồn lead</h2>
      <p className="mb-3 text-[13px] text-muc-3">Danh sách nguồn dùng khi nhập lead và làm báo cáo. Nguồn đã có lead thì chỉ ngừng dùng, không xoá.</p>
      <div className="mb-3">{sua && <NutHop kieu="phu" nhan="Thêm nguồn" tieuDe="Thêm nguồn lead" truong={truongNguon} action={luuNguonLead} giaTri={{ hoat_dong: "1" }} />}</div>
      <Bang duLieu={nguon ?? []} khoa={(r) => r.id} trong="Chưa có nguồn."
        cot={[
          { nhan: "Nguồn", chinh: true, hienThi: (r) => r.ten }, { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang dùng" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa nguồn" truong={truongNguon} action={luuNguonLead} giaTri={{ id: r.id, ten: r.ten, hoat_dong: r.hoat_dong ? "1" : "0" }} /> : null) },
        ]} />
    </div>
  );
}
