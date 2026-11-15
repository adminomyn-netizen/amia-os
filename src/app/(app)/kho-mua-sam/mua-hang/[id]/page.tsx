import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { NhanHangForm } from "@/components/mua-hang/NhanHangForm";
import { TT_DON } from "../page";
import { chonBaoGia, duyetDonMua, guiDuyetDonMua, huyDonMua, nhanHangDonMua, ngoaiLeBaoGia, themBaoGia, themDongDonMua, tuChoiDonMua, xoaBaoGia, xoaDongDonMua } from "../../actions";

export default async function ChiTietDonMua({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const { id } = await params;
  const db = sb();
  const { data: don } = await db.from("don_mua").select("*").eq("id", id).maybeSingle();
  if (!don || (nd.chiNhanhId && don.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: dong }, { data: ncc }, { data: cn }, { data: sp }, { data: nv }, { data: bg }, { data: dsNcc }] = await Promise.all([
    db.from("don_mua_dong").select("*").eq("don_mua_id", id).order("id"), db.from("nha_cung_cap").select("ten").eq("id", don.ncc_id).maybeSingle(),
    db.from("chi_nhanh").select("ten").eq("id", don.chi_nhanh_id).maybeSingle(), db.from("san_pham").select("id, ten, don_vi, gia_nhap_don_vi").eq("hoat_dong", true).order("ten"),
    db.from("nhan_vien").select("id, ho_ten").in("id", [don.nguoi_tao_id, ...(don.nguoi_duyet_id ? [don.nguoi_duyet_id] : [])]),
    db.from("bao_gia_don_mua").select("*").eq("don_mua_id", id).order("tong_tien"), db.from("nha_cung_cap").select("id, ten").order("ten"),
  ]);
  const tenNccBg = new Map((dsNcc ?? []).map((n) => [n.id, n.ten]));
  const tenSp = new Map((sp ?? []).map((s) => [s.id, s]));
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tong = (dong ?? []).reduce((s, d) => s + Math.round(Number(d.so_luong) * Number(d.don_gia)), 0);
  const daNhanGt = (dong ?? []).reduce((s, d) => s + Math.round(Number(d.da_nhan) * Number(d.don_gia)), 0);
  const tt = TT_DON[don.trang_thai];
  const tao = coQuyen(nd, "mua.tao"), duyet = coQuyen(nd, "mua.duyet"), nhan = coQuyen(nd, "kho.nhap");
  const duocNhan = (don.trang_thai === "da_duyet" || don.trang_thai === "dang_nhan") && nhan;
  const truongDong: Truong[] = [
    { ten: "san_pham_id", nhan: "Sản phẩm / vật tư", loai: "chon", luaChon: (sp ?? []).map((s) => ({ gia_tri: s.id, nhan: `${s.ten} (${s.don_vi})` })), batBuoc: true, rong: true },
    { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true }, { ten: "don_gia", nhan: "Đơn giá (đ)", loai: "tien" },
  ];
  const lyDo = (nhan: string): Truong[] => [{ ten: "ly_do", nhan, loai: "chu", batBuoc: true, rong: true }];
  return (
    <div className="space-y-6">
      <div>
        <TieuDeNoi quayLai={{ href: "/kho-mua-sam/mua-hang", nhan: "Mua hàng" }} tieuDe={`Đơn mua ${don.ma}`} phu={<span className="inline-flex flex-wrap items-center gap-2"><NhanTrangThai kieu={tt.kieu}>{tt.ten}</NhanTrangThai><span>{ncc?.ten} · nhận tại {cn?.ten}</span></span>}>
          {tao && don.trang_thai === "nhap" && <NutHop nhan="Thêm hàng" tieuDe="Thêm hàng vào đơn" moTa="Thêm lại sản phẩm đã có thì cập nhật số lượng và giá." truong={truongDong} action={themDongDonMua} an={{ don_id: id }} giaTri={{ so_luong: 1, don_gia: 0 }} />}
          {tao && don.trang_thai === "nhap" && (dong?.length ?? 0) > 0 && <NutNhanh chinh nhan="Gửi duyệt" action={guiDuyetDonMua} du={{ don_id: id }} />}
          {duyet && don.trang_thai === "cho_duyet" && <NutNhanh chinh nhan="Duyệt đơn" action={duyetDonMua} du={{ don_id: id }} />}
          {duyet && don.trang_thai === "cho_duyet" && <NutHop kieu="phu" nhan="Từ chối" tieuDe="Từ chối đơn mua" truong={lyDo("Lý do từ chối")} action={tuChoiDonMua} an={{ don_id: id }} nhanLuu="Từ chối" />}
          {duocNhan && <NhanHangForm donId={id} action={nhanHangDonMua} dong={(dong ?? []).filter((d) => Number(d.da_nhan) < Number(d.so_luong)).map((d) => ({ id: d.id, ten: tenSp.get(d.san_pham_id)?.ten ?? "", don_vi: tenSp.get(d.san_pham_id)?.don_vi ?? "", con: Number(d.so_luong) - Number(d.da_nhan) }))} />}
          {["dang_nhan", "da_nhan"].includes(don.trang_thai) && <a href={`/in/phieu-nhap-ncc/${id}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc-2 hover:bg-giay-tram">In phiếu nhập (công nợ NCC)</a>}
          {tao && ["nhap", "cho_duyet", "da_duyet"].includes(don.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ đơn" tieuDe="Huỷ đơn mua" truong={lyDo("Lý do huỷ")} action={huyDonMua} an={{ don_id: id }} nhanLuu="Huỷ đơn" />}
        </TieuDeNoi>
      </div>
      {don.ly_do && <p className="rounded-nho bg-canh-bao-nen px-3 py-2.5 text-[14px] text-canh-bao">{don.trang_thai === "huy" ? "Lý do huỷ: " : ""}{don.ly_do}</p>}
      <HangChiSo muc={[{ nhan: "Giá trị đơn", so: tienVN(tong) }, { nhan: "Đã nhận hàng (giá trị)", so: tienVN(daNhanGt), ghiChu: `Còn ${tienVN(tong - daNhanGt)}` }, { nhan: "Ngày đặt", so: ngayVN(don.ngay_dat), ghiChu: don.ngay_du_kien ? `Dự kiến nhận ${ngayVN(don.ngay_du_kien)}` : undefined }]} />
      <Bang noi duLieu={dong ?? []} khoa={(r) => r.id} trong="Đơn chưa có dòng hàng nào."
        cot={[
          { nhan: "Sản phẩm", chinh: true, hienThi: (r) => <span className="text-muc">{tenSp.get(r.san_pham_id)?.ten ?? ""}</span> },
          { nhan: "Số lượng", phai: true, hienThi: (r) => `${soVN(r.so_luong)} ${tenSp.get(r.san_pham_id)?.don_vi ?? ""}` },
          { nhan: "Đơn giá", phai: true, hienThi: (r) => tienVN(r.don_gia) },
          { nhan: "Thành tiền", phai: true, hienThi: (r) => tienVN(Math.round(Number(r.so_luong) * Number(r.don_gia))) },
          { nhan: "Đã nhận", phai: true, hienThi: (r) => soVN(r.da_nhan) },
          { nhan: "", hienThi: (r) => (tao && don.trang_thai === "nhap" ? <NutNhanh nhan="Xoá dòng" action={xoaDongDonMua} du={{ don_id: id, dong_id: r.id }} /> : null) },
        ]} />
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Báo giá</h2>
          <div className="flex gap-2">
            {tao && ["nhap", "cho_duyet"].includes(don.trang_thai) && <NutHop kieu="phu" nhan="Thêm báo giá" tieuDe="Thêm báo giá" truong={[{ ten: "ncc_id", nhan: "Nhà cung cấp", loai: "chon", batBuoc: true, rong: true, luaChon: (dsNcc ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten })) }, { ten: "tong_tien", nhan: "Tổng tiền báo giá", loai: "tien", batBuoc: true }, { ten: "link_file", nhan: "Link file báo giá (https://…)", loai: "chu", rong: true }, { ten: "ghi_chu", nhan: "Ghi chú (điều kiện giao, bảo hành…)", loai: "nhieu_dong", rong: true }]} action={themBaoGia} an={{ don_id: id }} giaTri={{ ncc_id: "" }} rong />}
            {duyet && ["nhap", "cho_duyet"].includes(don.trang_thai) && <NutHop kieu="phu" nhan="Ngoại lệ báo giá" tieuDe="Ngoại lệ thiếu báo giá" truong={lyDo("Lý do (nhà cung cấp độc quyền, mua gấp…)")} action={ngoaiLeBaoGia} an={{ don_id: id }} giaTri={{ ly_do: don.ly_do_ngoai_le_bao_gia ?? "" }} />}
          </div>
        </div>
        <p className="mb-2 text-[12.5px] text-muc-3">Đơn từ 20 triệu cần ít nhất 2 báo giá, từ 30 triệu cần 3 (ngưỡng ở Chính sách phê duyệt).{don.ly_do_ngoai_le_bao_gia && <> Ngoại lệ: <b>{don.ly_do_ngoai_le_bao_gia}</b>.</>}</p>
        <Bang noi duLieu={bg ?? []} khoa={(r) => r.id} trong="Chưa có báo giá."
          cot={[
            { nhan: "Nhà cung cấp", chinh: true, hienThi: (r) => <div>{tenNccBg.get(r.ncc_id)}{r.ghi_chu && <div className="text-[12.5px] text-muc-3">{r.ghi_chu}</div>}</div> },
            { nhan: "Tổng tiền", phai: true, hienThi: (r) => tienVN(r.tong_tien) },
            { nhan: "File", hienThi: (r) => (r.link_file ? <a href={r.link_file} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">Mở</a> : "") },
            { nhan: "Chọn", hienThi: (r) => (r.duoc_chon ? <NhanTrangThai kieu="tot">Đã chọn</NhanTrangThai> : tao && ["nhap", "cho_duyet"].includes(don.trang_thai) ? <NutNhanh nhan="Chọn" action={chonBaoGia} du={{ bao_gia_id: r.id }} /> : null) },
            { nhan: "", hienThi: (r) => (tao && don.trang_thai === "nhap" ? <NutNhanh nhan="Xoá" action={xoaBaoGia} du={{ bao_gia_id: r.id }} /> : null) },
          ]} />
      </section>
      <p className="text-[12px] text-muc-3">Lập bởi {tenNv.get(don.nguoi_tao_id)} lúc {ngayGioVN(don.tao_luc)}{don.nguoi_duyet_id ? ` · duyệt bởi ${tenNv.get(don.nguoi_duyet_id)} lúc ${ngayGioVN(don.duyet_luc)}` : ""}. Người lập đơn không tự duyệt đơn của mình (trừ Kỹ thuật).</p>
    </div>
  );
}
