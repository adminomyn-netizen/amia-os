import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { boDau, tienVN } from "@/lib/dinh-dang";
import { O_NHAP, NUT_PHU } from "@/components/ui/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuNhaCungCap } from "../actions";

export default async function TrangNhaCungCap({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const { q: tuKhoa = "" } = await searchParams;
  const khoa = boDau(tuKhoa.trim());
  const sua = coQuyen(nd, "mua.tao");
  const [{ data: ncc }, { data: no }] = await Promise.all([sb().from("nha_cung_cap").select("*").order("ten"), sb().from("v_cong_no_ncc").select("ncc_id, con_no")]);
  const dsLoc = (ncc ?? []).filter((r) => !khoa || boDau([r.ma, r.ten, r.nguoi_lien_he, r.dien_thoai, r.email, r.ma_so_thue].filter(Boolean).join(" ")).includes(khoa));
  const noMap = new Map((no ?? []).map((n) => [n.ncc_id, Number(n.con_no)]));
  const truong: Truong[] = [
    { ten: "ten", nhan: "Tên nhà cung cấp", loai: "chu", batBuoc: true, rong: true }, { ten: "nguoi_lien_he", nhan: "Người liên hệ", loai: "chu" }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" },
    { ten: "email", nhan: "Email", loai: "email" }, { ten: "ma_so_thue", nhan: "Mã số thuế", loai: "chu" }, { ten: "dia_chi", nhan: "Địa chỉ", loai: "chu", rong: true },
    { ten: "so_ngay_no", nhan: "Hạn thanh toán (ngày)", loai: "so", goiY: "30" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }, { ten: "hoat_dong", nhan: "Đang giao dịch", loai: "gat" },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/kho-mua-sam", nhan: "Kho & Mua sắm" }} tieuDe="Nhà cung cấp" phu="Danh mục nhà cung cấp, hạn thanh toán và công nợ hiện tại.">
        {sua && <NutHop nhan="Thêm nhà cung cấp" tieuDe="Thêm nhà cung cấp" truong={truong} action={luuNhaCungCap} giaTri={{ so_ngay_no: 30, hoat_dong: true }} />}
      </TieuDeNoi>
      {/* Ô tìm như SalonHero: tìm theo mã, tên, người liên hệ, điện thoại, email, mã số thuế (không dấu). */}
      <form method="get" action="/kho-mua-sam/nha-cung-cap" role="search" className="mb-4 flex max-w-md gap-2">
        <input name="q" defaultValue={tuKhoa} placeholder="Tìm mã, tên, người liên hệ, điện thoại..." aria-label="Tìm nhà cung cấp" className={O_NHAP} autoComplete="off" />
        <button type="submit" className={NUT_PHU}>Tìm</button>
      </form>
      {khoa && <p className="-mt-2 mb-3 text-[12.5px] text-muc-3">Đang hiện {dsLoc.length}/{(ncc ?? []).length} nhà cung cấp. <Link href="/kho-mua-sam/nha-cung-cap" className="font-medium text-nhan-dam hover:underline">Bỏ tìm</Link></p>}
      <Bang noi duLieu={dsLoc} khoa={(r) => r.id} trong={khoa ? "Không có nhà cung cấp nào khớp." : "Chưa có nhà cung cấp nào."}
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Nhà cung cấp", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
          { nhan: "Liên hệ", hienThi: (r) => [r.nguoi_lien_he, r.dien_thoai].filter(Boolean).join(" · ") },
          { nhan: "Hạn TT", hienThi: (r) => `${r.so_ngay_no} ngày` },
          { nhan: "Công nợ", phai: true, hienThi: (r) => ((noMap.get(r.id) ?? 0) > 0 ? <span className="text-canh-bao">{tienVN(noMap.get(r.id))}</span> : "0 đ") },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.hoat_dong ? "tot" : "tram"}>{r.hoat_dong ? "Đang giao dịch" : "Ngừng"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => (sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa nhà cung cấp" truong={truong} action={luuNhaCungCap} giaTri={{ id: r.id, ten: r.ten, nguoi_lien_he: r.nguoi_lien_he ?? "", dien_thoai: r.dien_thoai ?? "", email: r.email ?? "", ma_so_thue: r.ma_so_thue ?? "", dia_chi: r.dia_chi ?? "", so_ngay_no: r.so_ngay_no, ghi_chu: r.ghi_chu ?? "", hoat_dong: r.hoat_dong }} /> : null) },
        ]} />
    </div>
  );
}
