import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { DanhSachDichVu } from "@/components/dinh-muc/DanhSachDichVu";
import { tinhGiaVonDinhMuc, canhBaoDinhMuc } from "@/lib/dinh-muc";
import { SaoChepDinhMuc } from "@/components/dinh-muc/SaoChepDinhMuc";
import { apDungGiaVonDichVu, apDungSaoChepDinhMuc, luuDinhMuc, nhapDinhMuc, xemTruocSaoChepDinhMuc, xoaDinhMuc } from "./actions";

export default async function TrangDinhMuc({ searchParams }: { searchParams: Promise<{ dv?: string; chua?: string }> }) {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const { dv: dvId, chua } = await searchParams;
  const sua = coQuyen(nd, "danhmuc.sua");
  const xemVon = coQuyen(nd, "baocao.tien");
  const db = sb();
  const [{ data: dv }, { data: sp }, { data: dem }, { data: nhomDv }] = await Promise.all([
    db.from("dich_vu").select("id, ma, ten, gia, gia_von, nhom_id").eq("hoat_dong", true).order("ma"),
    db.from("san_pham").select("id, ma, ten, don_vi, nhom_cap, gia_nhap_don_vi, dung_tich, dung_tich_dv").eq("hoat_dong", true).order("ten"),
    db.from("dinh_muc").select("dich_vu_id"),
    db.from("dich_vu_nhom").select("id, ten, thu_tu").order("thu_tu").order("ten"),
  ]);
  const coDm = new Map<string, number>(); (dem ?? []).forEach((d) => coDm.set(d.dich_vu_id, (coDm.get(d.dich_vu_id) ?? 0) + 1));
  const chon = (dv ?? []).find((d) => d.id === dvId);
  const dm = chon ? (await db.from("dinh_muc").select("*").eq("dich_vu_id", chon.id)).data ?? [] : [];
  const tonTheoSp = new Map<string, number>();
  if (dm.length) for (const t of (await db.from("v_ton_kho").select("san_pham_id, ton").in("san_pham_id", dm.map((r) => r.san_pham_id))).data ?? []) if (t.san_pham_id) tonTheoSp.set(t.san_pham_id, (tonTheoSp.get(t.san_pham_id) ?? 0) + Number(t.ton));
  const spMap = new Map((sp ?? []).map((s) => [s.id, s]));
  const truong: Truong[] = [
    { ten: "san_pham_id", nhan: "Vật tư", loai: "chon", batBuoc: true, rong: true, luaChon: (sp ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})${s.nhom_cap ? ` · nhóm ${s.nhom_cap}` : ""}` })) },
    { ten: "so_luong", nhan: "Số lượng định mức mỗi ca", loai: "so", batBuoc: true }, { ten: "chon_theo_chi_dinh", nhan: "Bác sĩ chọn theo từng ca (đầu tip, shot...)", loai: "gat" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  const tinh = (r: (typeof dm)[number]) => Number(r.so_luong) * Number(spMap.get(r.san_pham_id)?.gia_nhap_don_vi ?? 0);
  const dongTinh = dm.map((r) => ({ san_pham_id: r.san_pham_id, so_luong: Number(r.so_luong), chon_theo_chi_dinh: r.chon_theo_chi_dinh, nhom_cap: spMap.get(r.san_pham_id)?.nhom_cap ?? null, gia_nhap_don_vi: spMap.get(r.san_pham_id)?.gia_nhap_don_vi == null ? null : Number(spMap.get(r.san_pham_id)!.gia_nhap_don_vi) }));
  const von = tinhGiaVonDinhMuc(dongTinh), canhBao = canhBaoDinhMuc(dongTinh, tonTheoSp);
  // Hai ô tổng như SalonHero: tổng giá nhập vào (cộng cột "Giá nhập vào") và tổng chi phí khấu hao mỗi ca (cộng cột "Chi phí khấu hao"). Tự thiết kế theo ảnh SalonHero: bảng mẫu bên đó đang trống nên chưa đối chiếu được cách cộng.
  const tongGiaNhap = dm.reduce((t, r) => t + Number(spMap.get(r.san_pham_id)?.gia_nhap_don_vi ?? 0), 0);
  const tongKhauHao = dm.reduce((t, r) => t + tinh(r), 0);
  const nhomHienThi = (nhomDv ?? []).map((n) => ({ ten: n.ten, dichVu: (dv ?? []).filter((d) => d.nhom_id === n.id).map((d) => ({ id: d.id, ma: d.ma, ten: d.ten, soVatTu: coDm.get(d.id) ?? 0 })) })).filter((n) => n.dichVu.length > 0);

  return (
    <>
      <TieuDeNoi tieuDe="Công thức chi phí" phu="Định mức vật tư của từng dịch vụ. Vật tư 'bác sĩ chọn theo ca' (đầu tip MFU, filler...) chỉ là phương án; số thật do bác sĩ chỉ định khi ra phiếu cấp.">
        {sua && <NutHop kieu="phu" nhan="Dán từ bảng tính" tieuDe="Nhập định mức hàng loạt" rong moTa="Mỗi dòng: Mã (hoặc tên) dịch vụ, Mã (hoặc tên) vật tư, Số lượng, Bác sĩ chọn theo ca (1 hoặc 0), cách nhau bằng Tab (dán từ Excel/Google Sheet). Nên bật Chỉ kiểm tra trước để xem dòng nào lỗi." nhanLuu="Chạy"
          truong={[{ ten: "van_ban", nhan: "Dữ liệu dán vào", loai: "nhieu_dong", batBuoc: true, rong: true, goiY: "CSDCNC.30\tVT-FD41E4F4\t300\t1" }, { ten: "chi_kiem", nhan: "Chỉ kiểm tra, chưa lưu", loai: "gat" }]} giaTri={{ chi_kiem: true }} action={nhapDinhMuc} />}
      </TieuDeNoi>
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <DanhSachDichVu nhom={nhomHienThi} chon={chon?.id ?? ""} chiChuaCo={chua === "1"} />
        <div className="min-w-0">
          {chon ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px] font-medium text-muc">{chon.ten}{xemVon && <span className="font-normal text-muc-2"> · giá bán {tienVN(chon.gia)}</span>}</p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {xemVon && (
                    <>
                      <span className="rounded-nho bg-nhan-nhat px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-nhan-dam">Tổng giá nhập vào <b className="ml-1 text-[14px] tabular-nums">{tienVN(Math.round(tongGiaNhap))}</b></span>
                      <span className="rounded-nho bg-nhan-nhat px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-nhan-dam">Tổng chi phí khấu hao <b className="ml-1 text-[14px] tabular-nums">{tienVN(Math.round(tongKhauHao))}</b></span>
                    </>
                  )}
                  {sua && <SaoChepDinhMuc dichId={chon.id} tenDich={chon.ten} luaChon={(dv ?? []).filter((d) => d.id !== chon.id && (coDm.get(d.id) ?? 0) > 0).map((d) => ({ gia_tri: d.id, nhan: `${d.ten} · ${coDm.get(d.id)} vật tư` }))} xemTruoc={xemTruocSaoChepDinhMuc} apDung={apDungSaoChepDinhMuc} />}
                  {sua && <NutHop nhan="Thêm sản phẩm" tieuDe={`Thêm vật tư cho ${chon.ten}`} an={{ dich_vu_id: chon.id }} truong={truong} giaTri={{ so_luong: 1 }} action={luuDinhMuc} />}
                </div>
              </div>
              {xemVon && dm.length > 0 && (
                <div className="mb-3 text-[13px] text-muc-3">
                  <p>Giá vốn vật tư cố định mỗi ca: <span className="font-medium text-muc-2">{tienVN(Math.round(von.coDinh))}</span>{von.coDinhThieuGia > 0 ? <span className="ml-2 text-canh-bao">({von.coDinhThieuGia} vật tư chưa có giá nhập)</span> : null}
                    {von.phuongAnTong > 0 ? <> · phương án bác sĩ chọn: tối đa <span className="font-medium text-muc-2">{tienVN(Math.round(von.phuongAnTong))}</span> nếu dùng hết, một loại đắt nhất <span className="font-medium text-muc-2">{tienVN(Math.round(von.phuongAnLonNhat))}</span></> : null}</p>
                  <p className="mt-1">Giá vốn đang ghi ở dịch vụ: <span className="font-medium text-muc-2">{tienVN(chon.gia_von)}</span>
                    {sua && von.coDinhThieuGia === 0 && Math.round(von.coDinh) !== Number(chon.gia_von) && <span className="ml-3 inline-block"><NutHop kieu="chu" nhan="Ghi giá vốn theo định mức" tieuDe="Ghi giá vốn" xacNhan={`Đổi giá vốn của "${chon.ten}" từ ${tienVN(chon.gia_von)} thành ${tienVN(Math.round(von.coDinh))} (vật tư cố định theo định mức)?`} an={{ id: chon.id }} nhanLuu="Ghi giá vốn" action={apDungGiaVonDichVu} /></span>}
                  </p>
                </div>
              )}
              {canhBao.length > 0 && <ul className="mb-3 space-y-1 text-[13px] text-canh-bao">{canhBao.map((c) => <li key={c.ma}>{c.nhan}</li>)}</ul>}
              <Bang noi duLieu={dm} khoa={(r) => r.id} trong="Dịch vụ này chưa có định mức. Cài đặt số lượng sử dụng và tính toán chi phí khấu hao cho sản phẩm kèm theo dịch vụ."
                cot={[
                  { nhan: "Sản phẩm", hienThi: (r) => <span className="text-muc">{spMap.get(r.san_pham_id)?.ten}</span> }, { nhan: "Nhóm cấp", hienThi: (r) => spMap.get(r.san_pham_id)?.nhom_cap ?? "" },
                  { nhan: "Dung tích", phai: true, hienThi: (r) => { const p = spMap.get(r.san_pham_id); return p?.dung_tich == null ? <span className="text-muc-3">chưa nhập</span> : `${soVN(Number(p.dung_tich))} ${p.dung_tich_dv ?? ""}`.trim(); } },
                  ...(xemVon ? [{ nhan: "Giá nhập vào", hienThi: (r: (typeof dm)[number]) => (spMap.get(r.san_pham_id)?.gia_nhap_don_vi == null ? "chưa có giá" : tienVN(spMap.get(r.san_pham_id)!.gia_nhap_don_vi)), phai: true }] : []),
                  { nhan: "Số lượng", hienThi: (r) => `${soVN(r.so_luong)} ${spMap.get(r.san_pham_id)?.don_vi ?? ""}`, phai: true },
                  ...(xemVon ? [{ nhan: "Chi phí khấu hao", hienThi: (r: (typeof dm)[number]) => (spMap.get(r.san_pham_id)?.gia_nhap_don_vi == null ? "chưa có giá" : tienVN(Math.round(tinh(r)))), phai: true }] : []),
                  { nhan: "Cách cấp", hienThi: (r) => <NhanTrangThai kieu={r.chon_theo_chi_dinh ? "cho" : "tram"}>{r.chon_theo_chi_dinh ? "Bác sĩ chọn theo ca" : "Luôn cấp"}</NhanTrangThai> },
                  ...(sua ? [{ nhan: "", hienThi: (r: (typeof dm)[number]) => (
                    <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa định mức" an={{ dich_vu_id: chon.id }} truong={truong} giaTri={{ ...r, ghi_chu: r.ghi_chu ?? "" }} action={luuDinhMuc} />
                      <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá khỏi định mức" xacNhan="Bỏ vật tư này khỏi định mức của dịch vụ?" an={{ id: r.id }} nhanLuu="Xoá" action={xoaDinhMuc} /></span>) }] : []),
                ]} />
            </>
          ) : <p className="the-noi the-noi-thap px-6 py-16 text-center text-[16px] text-muc-3">Chọn một dịch vụ ở bên trái để cài đặt số lượng sử dụng và tính toán chi phí khấu hao cho sản phẩm kèm theo dịch vụ.</p>}
        </div>
      </div>
    </>
  );
}
