import Link from "next/link";
import { AlertTriangle, Tags } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { docNhomQuanLy, docThamSo, khoaCnKhach, nhomTrungTen } from "@/lib/khach-danh-sach";
import { KHOA_LOC } from "@/lib/khach";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NhanNhom } from "@/components/khach/DanhSachKhach";
import { O_NHAP, NUT_PHU } from "@/components/ui/dinh-dang";
import { GanNhomHangLoat } from "@/components/khach/GanNhomHangLoat";
import { anNhom, ganHangLoat, luuNhom } from "./actions";

const TRUONG: Truong[] = [
  { ten: "ten", nhan: "Tên nhóm khách hàng mới", loai: "chu", batBuoc: true, rong: true },
  { ten: "mau", nhan: "Màu nhãn (#RRGGBB)", loai: "chu", goiY: "#03a9f4" },
  { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong" },
];

/** /khach-hang/nhom — “Quản lý nhóm” (tên và bố cục theo SalonHero: ô tìm nhóm, Tạo mới, bảng Tên nhóm / Số lượng khách, nút Thêm khách): tạo / sửa / ẩn nhóm, cảnh báo nhóm trùng tên, gán hàng loạt theo bộ lọc đang chọn ở cột trái. */
export default async function NhomKhach({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const sp = await searchParams;
  const tim = typeof sp.tim === "string" ? sp.tim.trim().slice(0, 60) : "";
  const dich = typeof sp.dich === "string" ? sp.dich : "";
  const sua = coQuyen(nd, "danhmuc.sua");
  const hangLoat = coQuyen(nd, "khach.nhap");
  const ds = await docNhomQuanLy();
  const trung = nhomTrungTen(ds);
  const bo = (x: string) => x.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").toLowerCase();
  const dangDungTatCa = ds.filter((n) => n.hoat_dong).sort((a, b) => b.so - a.so || a.ten.localeCompare(b.ten, "vi"));
  const dangDung = tim ? dangDungTatCa.filter((n) => bo(n.ten).includes(bo(tim))) : dangDungTatCa;
  const daAn = ds.filter((n) => !n.hoat_dong);

  // Bộ lọc đang chọn = các tham số địa chỉ giống danh sách khách (đọc lại ở máy chủ khi gán).
  const u = new URLSearchParams();
  for (const k of [...KHOA_LOC, "q"] as const) { const v = sp[k]; if (typeof v === "string" && v) u.set(k, v); }
  const ts = khoaCnKhach(docThamSo(u), nd);
  const boLoc = new URLSearchParams(Object.entries(ts).filter(([k, v]) => v && k !== "sx") as [string, string][]);
  const soDieuKien = [...boLoc.keys()].length;

  const dong = (n: (typeof ds)[number]) => (
    <li key={n.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-vien py-3 last:border-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><NhanNhom ten={n.ten} mau={n.mau} />{!n.hoat_dong && <span className="text-[12px] text-muc-3">đã ẩn</span>}</div>
        {n.mo_ta && <p className="mt-1 text-[13px] text-muc-3 [overflow-wrap:anywhere]">{n.mo_ta}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <Link href={`/khach-hang?nhom=${n.id}`} aria-label={`Xem khách của nhóm ${n.ten}`} className="tabular-nums font-medium text-nhan-dam hover:underline">{n.so.toLocaleString("vi-VN")}</Link>
        {hangLoat && n.hoat_dong && <Link href={`/khach-hang/nhom?${[...boLoc.entries()].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).concat(`dich=${n.id}`).join("&")}#gan-hang-loat`} className="flex h-8 items-center rounded-nho border border-vien-dam px-2.5 font-medium text-muc-2 hover:bg-giay-tram">Thêm khách</Link>}
        {sua && <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa nhóm: ${n.ten}`} truong={TRUONG} giaTri={{ id: n.id, ten: n.ten, mau: n.mau ?? "", mo_ta: n.mo_ta ?? "" }} action={luuNhom} />}
        {sua && (n.hoat_dong
          ? <NutHop kieu="chu" nguy nhan="Ẩn" tieuDe="Ẩn nhóm" xacNhan={`Ẩn nhóm ${n.ten}? Khách vẫn giữ liên kết, nhóm hiện lại khi khôi phục.`} an={{ id: n.id, an: "1" }} nhanLuu="Ẩn nhóm" action={anNhom} />
          : <NutHop kieu="chu" nhan="Khôi phục" tieuDe="Khôi phục nhóm" xacNhan={`Khôi phục nhóm ${n.ten}?`} an={{ id: n.id, an: "0" }} nhanLuu="Khôi phục" action={anNhom} />)}
      </div>
    </li>
  );

  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Quản lý nhóm" icon={Tags} quayLai={{ href: "/khach-hang", nhan: "Danh sách khách" }} quayLaiDienThoai phu={<>{dangDungTatCa.length} nhóm đang dùng{daAn.length ? ` · ${daAn.length} nhóm đã ẩn` : ""}. Một khách có thể thuộc nhiều nhóm.</>}>
        {sua && <NutHop nhan="Tạo mới" tieuDe="Quản lý nhóm" nhanLuu="Lưu thay đổi" truong={TRUONG} giaTri={{ mau: "#03a9f4" }} action={luuNhom} />}
      </TieuDeNoi>

      {trung.length > 0 && (
        <div role="note" className="flex gap-2.5 rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[13px] text-canh-bao">
          <AlertTriangle aria-hidden strokeWidth={1.7} className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Có nhóm trùng tên (chỉ khác chữ hoa/thường): nên cân nhắc gộp.</p>
            <ul className="mt-1 list-inside list-disc">
              {trung.map((g) => <li key={g[0].id}>{g.map((n) => `${n.ten} (${(n as (typeof ds)[number]).so.toLocaleString("vi-VN")} khách)`).join(" và ")}</li>)}
            </ul>
            <p className="mt-1">Hệ thống không tự gộp. Muốn gộp: lọc khách theo nhóm cần bỏ, thêm vào nhóm giữ lại bằng khung “Thêm khách vào nhóm theo bộ lọc” bên dưới, rồi ẩn nhóm thừa.</p>
          </div>
        </div>
      )}

      <form method="get" role="search" className="flex gap-2">
        {[...boLoc.entries()].map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <input type="search" name="tim" defaultValue={tim} placeholder="Tìm kiếm nhóm khách hàng" aria-label="Tìm kiếm nhóm khách hàng" className={`${O_NHAP} !h-10`} />
        <button type="submit" className={NUT_PHU}>Tìm</button>
      </form>

      <section className="rounded-the border border-vien bg-giay-sang px-4">
        <div className="flex justify-between border-b border-vien py-2 text-[12px] font-medium uppercase tracking-wide text-muc-3"><span>Tên nhóm</span><span>Số lượng khách</span></div>
        <ul>{dangDung.map(dong)}</ul>
        {dangDung.length === 0 && <p className="py-8 text-center text-muc-3">Chưa có nhóm nào.</p>}
      </section>

      {hangLoat && <GanNhomHangLoat nhomMacDinh={dangDungTatCa.some((n) => n.id === dich) ? dich : ""} nhom={dangDungTatCa.map((n) => ({ gia_tri: n.id, nhan: `${n.ten} (${n.so.toLocaleString("vi-VN")})` }))} boLoc={boLoc.toString()} soDieuKien={soDieuKien} action={ganHangLoat} />}

      {daAn.length > 0 && (
        <details className="rounded-the border border-vien bg-giay-sang px-4 py-3">
          <summary className="cursor-pointer text-[14px] font-medium text-muc-2">Nhóm đã ẩn ({daAn.length})</summary>
          <ul className="mt-2">{daAn.map(dong)}</ul>
        </details>
      )}
    </div>
  );
}
