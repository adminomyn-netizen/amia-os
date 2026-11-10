import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { dsNvTrongPham, luaChonNv, luaChonNvGiu } from "@/lib/hr-pham-vi";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { luuTaiSan, thuHoiTaiSan } from "./actions";

export default async function TrangTaiSan() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem tài sản cấp phát.</p>;
  const nv = await dsNvTrongPham(nd.chiNhanhId, false);
  const ids = nv.map((n) => n.id), ten = new Map(nv.map((n) => [n.id, n.ho_ten]));
  const { data } = await sb().from("hr_tai_san").select("*").order("ngay_cap", { ascending: false, nullsFirst: false }).limit(1000);
  // Người gắn chi nhánh chỉ thấy tài sản đã cấp cho nhân viên cùng chi nhánh.
  const ds = (data ?? []).filter((t) => !nd.chiNhanhId || (t.nhan_vien_id && ids.includes(t.nhan_vien_id)));
  const dangGiu = ds.filter((t) => !t.ngay_thu_hoi).length;
  const truong: Truong[] = [
    { ten: "ten_tai_san", nhan: "Tên tài sản", loai: "chu", batBuoc: true, rong: true },
    { ten: "nhan_vien_id", nhan: "Người nhận", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa giao ai" }, ...luaChonNv(nv.filter((n) => n.hoat_dong))] },
    { ten: "ngay_cap", nhan: "Ngày cấp", loai: "ngay" }, { ten: "loai", nhan: "Loại", loai: "chu", goiY: "Laptop, điện thoại, đồng phục…" }, { ten: "hang_model", nhan: "Hãng, model", loai: "chu" },
    { ten: "so_luong", nhan: "Số lượng", loai: "so" }, { ten: "don_vi_tinh", nhan: "Đơn vị tính", loai: "chu" }, { ten: "tinh_trang", nhan: "Tình trạng", loai: "chu", goiY: "Mới, đang dùng, hỏng…" },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Tài sản cấp phát" phu={`${dangGiu} tài sản đang giao, ${ds.length - dangGiu} đã thu hồi. Thu hồi khi nhân viên nghỉ việc nằm trong checklist bàn giao.`}>
        <NutHop nhan="Cấp tài sản" tieuDe="Cấp tài sản" truong={truong} action={luuTaiSan} giaTri={{ so_luong: "1", ngay_cap: homNayHCM() }} />
      </TieuDeNoi>
      <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Chưa cấp tài sản nào."
        cot={[
          { nhan: "Tài sản", chinh: true, hienThi: (r) => <div>{r.ten_tai_san}<div className="text-[12.5px] text-muc-3">{[r.loai, r.hang_model].filter(Boolean).join(" · ")}</div></div> },
          { nhan: "Số lượng", phai: true, hienThi: (r) => `${Number(r.so_luong ?? 1)} ${r.don_vi_tinh ?? ""}`.trim() },
          { nhan: "Người nhận", hienThi: (r) => (r.nhan_vien_id ? ten.get(r.nhan_vien_id) ?? "Đã nghỉ" : "—") },
          { nhan: "Cấp / thu hồi", hienThi: (r) => <span className="text-[13px]">{r.ngay_cap ? ngayVN(r.ngay_cap) : "—"}{r.ngay_thu_hoi ? ` → ${ngayVN(r.ngay_thu_hoi)}` : ""}</span> },
          { nhan: "Trạng thái", hienThi: (r) => (r.ngay_thu_hoi ? <NhanTrangThai kieu="tram">Đã thu hồi</NhanTrangThai> : <NhanTrangThai kieu="tot">Đang giao</NhanTrangThai>) },
          { nhan: "", hienThi: (r) => <span className="flex items-center gap-3">
            <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa tài sản" truong={truong.map((t) => (t.ten === "nhan_vien_id" ? { ...t, luaChon: [{ gia_tri: "", nhan: "Chưa giao ai" }, ...luaChonNvGiu(nv, r.nhan_vien_id)] } : t))} action={luuTaiSan} an={{ id: r.id }} giaTri={{ id: r.id, ten_tai_san: r.ten_tai_san, nhan_vien_id: r.nhan_vien_id ?? "", ngay_cap: r.ngay_cap ?? "", loai: r.loai ?? "", hang_model: r.hang_model ?? "", so_luong: String(r.so_luong ?? 1), don_vi_tinh: r.don_vi_tinh ?? "", tinh_trang: r.tinh_trang ?? "", ghi_chu: r.ghi_chu ?? "" }} />
            {!r.ngay_thu_hoi && <NutNhanh nhan="Thu hồi" action={thuHoiTaiSan} du={{ id: r.id }} />}
          </span> },
        ]} />
    </div>
  );
}
