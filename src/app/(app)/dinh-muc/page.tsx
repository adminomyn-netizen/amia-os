import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { ChonDichVu } from "@/components/dinh-muc/ChonDichVu";
import { luuDinhMuc, nhapDinhMuc, xoaDinhMuc } from "./actions";

export default async function TrangDinhMuc({ searchParams }: { searchParams: Promise<{ dv?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { dv: dvId } = await searchParams;
  const sua = coQuyen(nd.vaiTro, "danhmuc.sua");
  const xemVon = coQuyen(nd.vaiTro, "baocao.tien");
  const db = sb();
  const [{ data: dv }, { data: sp }, { data: dem }] = await Promise.all([
    db.from("dich_vu").select("id, ma, ten, gia, gia_von").eq("hoat_dong", true).order("ma"),
    db.from("san_pham").select("id, ma, ten, don_vi, nhom_cap, gia_nhap_don_vi").eq("hoat_dong", true).order("ten"),
    db.from("dinh_muc").select("dich_vu_id"),
  ]);
  const coDm = new Map<string, number>(); (dem ?? []).forEach((d) => coDm.set(d.dich_vu_id, (coDm.get(d.dich_vu_id) ?? 0) + 1));
  const chon = (dv ?? []).find((d) => d.id === dvId);
  const dm = chon ? (await db.from("dinh_muc").select("*").eq("dich_vu_id", chon.id)).data ?? [] : [];
  const spMap = new Map((sp ?? []).map((s) => [s.id, s]));
  const truong: Truong[] = [
    { ten: "san_pham_id", nhan: "Vật tư", loai: "chon", batBuoc: true, rong: true, luaChon: (sp ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})${s.nhom_cap ? ` · nhóm ${s.nhom_cap}` : ""}` })) },
    { ten: "so_luong", nhan: "Số lượng định mức mỗi ca", loai: "so", batBuoc: true }, { ten: "chon_theo_chi_dinh", nhan: "Bác sĩ chọn theo từng ca (đầu tip, shot...)", loai: "gat" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  const tinh = (r: (typeof dm)[number]) => Number(r.so_luong) * Number(spMap.get(r.san_pham_id)?.gia_nhap_don_vi ?? 0);
  const coDinhA = dm.filter((r) => !r.chon_theo_chi_dinh && spMap.get(r.san_pham_id)?.nhom_cap === "A").reduce((s, r) => s + tinh(r), 0);
  const thieuGia = dm.filter((r) => spMap.get(r.san_pham_id)?.gia_nhap_don_vi == null).length;

  return (
    <>
      <TieuDeTrang tieuDe="Định mức vật tư" phu="Mỗi dịch vụ gắn vật tư và số lượng. Vật tư 'bác sĩ chọn theo ca' (đầu tip MFU, filler...) chỉ là phương án; số thật do bác sĩ chỉ định khi ra phiếu cấp.">
        {sua && <NutHop kieu="phu" nhan="Dán từ bảng tính" tieuDe="Nhập định mức hàng loạt" rong moTa="Mỗi dòng: Dịch vụ, Vật tư, Số lượng, Bác sĩ chọn theo ca (1 hoặc 0), cách nhau bằng Tab (dán từ Excel/Google Sheet). Khớp theo tên hoặc mã đã có trong Danh mục." nhanLuu="Nhập"
          truong={[{ ten: "van_ban", nhan: "Dữ liệu dán vào", loai: "nhieu_dong", batBuoc: true, rong: true, goiY: "Mfu Basic\tĐầu MFU N4.5\t300\t1" }]} action={nhapDinhMuc} />}
      </TieuDeTrang>
      <div className="mb-6 max-w-md"><ChonDichVu giaTri={chon?.id ?? ""} luaChon={[{ gia_tri: "", nhan: "Chưa chọn" }, ...(dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ten}${coDm.get(d.id) ? ` · ${coDm.get(d.id)} vật tư` : " · chưa có định mức"}` }))]} /></div>
      {chon ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-muc-2">{chon.ten} {xemVon && <> · giá bán {tienVN(chon.gia)} · vật tư cố định nhóm A: <span className="font-medium text-muc">{tienVN(Math.round(coDinhA))}</span> mỗi ca{thieuGia > 0 ? <span className="ml-2 text-canh-bao">({thieuGia} vật tư chưa có giá vốn)</span> : null}</>}</p>
            {sua && <NutHop nhan="Thêm vật tư" tieuDe={`Thêm vật tư cho ${chon.ten}`} an={{ dich_vu_id: chon.id }} truong={truong} giaTri={{ so_luong: 1 }} action={luuDinhMuc} />}
          </div>
          <Bang duLieu={dm} khoa={(r) => r.id} trong="Dịch vụ này chưa có định mức."
            cot={[
              { nhan: "Vật tư", hienThi: (r) => <span className="text-muc">{spMap.get(r.san_pham_id)?.ten}</span> }, { nhan: "Nhóm cấp", hienThi: (r) => spMap.get(r.san_pham_id)?.nhom_cap ?? "" },
              { nhan: "Định mức", hienThi: (r) => `${soVN(r.so_luong)} ${spMap.get(r.san_pham_id)?.don_vi ?? ""}`, phai: true },
              { nhan: "Cách cấp", hienThi: (r) => <NhanTrangThai kieu={r.chon_theo_chi_dinh ? "cho" : "tram"}>{r.chon_theo_chi_dinh ? "Bác sĩ chọn theo ca" : "Luôn cấp"}</NhanTrangThai> },
              ...(xemVon ? [{ nhan: "Giá vốn / ca", hienThi: (r: (typeof dm)[number]) => (spMap.get(r.san_pham_id)?.gia_nhap_don_vi == null ? "chưa có giá" : tienVN(Math.round(tinh(r)))), phai: true }] : []),
              ...(sua ? [{ nhan: "", hienThi: (r: (typeof dm)[number]) => (
                <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa định mức" an={{ dich_vu_id: chon.id }} truong={truong} giaTri={{ ...r, ghi_chu: r.ghi_chu ?? "" }} action={luuDinhMuc} />
                  <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá khỏi định mức" xacNhan="Bỏ vật tư này khỏi định mức của dịch vụ?" an={{ id: r.id }} nhanLuu="Xoá" action={xoaDinhMuc} /></span>) }] : []),
            ]} />
        </>
      ) : <p className="chu-tieu-de py-10 text-center text-[24px] text-muc-3">Chọn một dịch vụ ở trên để xem hoặc sửa định mức.</p>}
    </>
  );
}
