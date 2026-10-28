import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { sb } from "@/lib/db";
import { gioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { LOAI_PHIEU, LOAI_NGHI, THU, TINH_TRANG_LUONG, thuCuaNgay } from "@/lib/nhan-su";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";

type Dong = { nhan: string; cach?: string; tien: number; dam?: boolean };
const thang2 = (t: number) => String(t).padStart(2, "0");

/** Phiếu lương của chính tôi theo từng kỳ đã duyệt: công trong tháng, từng khoản thu nhập, khấu trừ, thuế TNCN, thực nhận và chấm công từng ngày.
 *  Các số tiền là bản chụp lúc tính lương (không đổi sau khi duyệt); phần công chi tiết là số liệu hiện tại của tháng. */
export default async function TrangPhieuLuong({ searchParams }: { searchParams: Promise<{ ky?: string }> }) {
  const nd = await yeuCauNoiBo();
  const db = sb();
  const sp = await searchParams;
  const { data: dongCaNhan } = await db.from("bang_luong_dong").select("*").eq("nhan_vien_id", nd.nhanVienId);
  const ids = (dongCaNhan ?? []).map((d) => d.ky_id);
  const { data: dsKy } = ids.length ? await db.from("ky_luong").select("id, nam, thang, trang_thai").in("id", ids).in("trang_thai", ["da_duyet", "da_chi"]).order("nam", { ascending: false }).order("thang", { ascending: false }) : { data: [] };
  const ky = (dsKy ?? []).find((k) => k.id === sp.ky) ?? (dsKy ?? [])[0];
  const khung = (noiDung: React.ReactNode) => (
    <div>
      <Link href="/noi-lam-viec" className="text-[13px] text-muc-3 hover:text-muc">← Nơi làm việc</Link>
      <TieuDeTrang tieuDe="Phiếu lương của tôi" phu="Chỉ hiện các kỳ lương đã được duyệt. Có thắc mắc, báo bộ phận nhân sự trong 1 ngày làm việc kể từ khi nhận." />
      {noiDung}
    </div>
  );
  const d = ky && (dongCaNhan ?? []).find((x) => x.ky_id === ky.id);
  if (!ky || !d) return khung(<p className="text-[14px] text-muc-3">Chưa có phiếu lương nào được duyệt.</p>);

  const dau = `${ky.nam}-${thang2(ky.thang)}-01`, cuoi = `${ky.nam}-${thang2(ky.thang)}-${String(new Date(Date.UTC(ky.nam, ky.thang, 0)).getUTCDate()).padStart(2, "0")}`;
  const [{ data: cc }, { data: ph }, { data: khoan }, { data: tongHop }, { data: le }] = await Promise.all([
    db.from("cham_cong").select("*").eq("nhan_vien_id", nd.nhanVienId).gte("ngay", dau).lte("ngay", cuoi).order("ngay"),
    db.from("phieu_hr").select("ma, loai, loai_nghi, tu_ngay, den_ngay, so_ngay, so_gio").eq("nhan_vien_id", nd.nhanVienId).eq("trang_thai", "da_duyet").lte("tu_ngay", cuoi).gte("den_ngay", dau).order("tu_ngay"),
    db.from("luong_khoan").select("id, loai, tieu_de, so_tien").eq("ky_id", ky.id).eq("nhan_vien_id", nd.nhanVienId).order("tao_luc"),
    db.rpc("tong_hop_cong", { p_nam: ky.nam, p_thang: ky.thang }),
    db.from("ngay_le").select("ngay, ten").gte("ngay", dau).lte("ngay", cuoi),
  ]);
  const th = (tongHop ?? []).find((t) => t.nhan_vien_id === nd.nhanVienId);
  const kho = (khoan ?? []);
  const tong = (loai: string) => kho.filter((k) => k.loai === loai).reduce((a, k) => a + Number(k.so_tien), 0);

  const thuNhap: Dong[] = [
    { nhan: "Lương theo ngày công", cach: `${tienVN(d.luong_co_ban)} × ${soVN(d.cong_tinh)} ÷ ${soVN(d.cong_chuan)} công${d.tinh_trang === "thu_viec" ? " × tỷ lệ thử việc" : ""}`, tien: d.luong_cong },
    ...(Number(d.ot_gio) > 0 || Number(d.luong_ot) > 0 ? [{ nhan: "Làm thêm giờ (OT)", cach: `${soVN(d.ot_gio)} giờ đã duyệt × hệ số tăng ca`, tien: d.luong_ot }] : []),
    { nhan: "Ăn ca", cach: "Công tính lương × mức ăn ca mỗi ngày, làm tròn lên nghìn", tien: d.an_ca },
    { nhan: "Hỗ trợ đồng phục", cach: "Theo ngày công, có trần", tien: d.dong_phuc },
    { nhan: "Hỗ trợ nhà ở", cach: "Theo ngày công", tien: d.nha_o },
    { nhan: "Hoa hồng và dịch vụ", cach: "Từ doanh số trong tháng", tien: d.hoa_hong },
    { nhan: "Cộng khác", cach: kho.filter((k) => k.loai === "cong").map((k) => k.tieu_de).join(", ") || undefined, tien: d.cong_khac },
    { nhan: "Tổng thu nhập", tien: d.gross, dam: true },
  ].filter((r) => r.dam || Number(r.tien) !== 0 || r.nhan === "Lương theo ngày công");
  const khauTru: Dong[] = [
    { nhan: "Bảo hiểm xã hội người lao động", cach: "Lương đóng bảo hiểm × 10,5%", tien: d.bhxh_nld },
    { nhan: "Thuế TNCN", cach: `Thu nhập tính thuế ${tienVN(d.thu_nhap_tinh_thue)} (đã trừ giảm trừ ${tienVN(d.giam_tru)} và bảo hiểm)`, tien: d.thue_tncn },
    { nhan: "Trừ khác", cach: kho.filter((k) => k.loai === "tru").map((k) => k.tieu_de).join(", ") || undefined, tien: d.tru_khac },
    { nhan: "Trừ vi phạm", cach: kho.filter((k) => k.loai === "tru_vi_pham").map((k) => k.tieu_de).join(", ") || undefined, tien: d.tru_vi_pham },
    { nhan: "Tạm ứng lương", cach: "Hoàn ứng đã chốt vào kỳ này", tien: d.tam_ung },
  ].filter((r) => Number(r.tien) !== 0 || r.nhan === "Thuế TNCN" || r.nhan.startsWith("Bảo hiểm"));
  const tongKhauTru = Number(d.bhxh_nld) + Number(d.thue_tncn) + Number(d.tru_khac) + Number(d.tru_vi_pham) + Number(d.tam_ung);
  khauTru.push({ nhan: "Tổng khấu trừ", tien: tongKhauTru, dam: true });
  const cotTien = [
    { nhan: "Khoản", chinh: true, hienThi: (r: Dong) => (r.dam ? <b>{r.nhan}</b> : r.nhan) },
    { nhan: "Cách tính", hienThi: (r: Dong) => <span className="text-muc-3">{r.cach ?? ""}</span> },
    { nhan: "Số tiền", phai: true, hienThi: (r: Dong) => (r.dam ? <b>{tienVN(r.tien)}</b> : tienVN(r.tien)) },
  ];
  const congTH: { nhan: string; cong: number | string; ghiChu?: string }[] = th ? [
    { nhan: "Công chuẩn của kỳ lương", cong: soVN(d.cong_chuan) },
    { nhan: "Công đi làm (chấm công)", cong: soVN(th.cong_di_lam) },
    { nhan: "Nghỉ phép có lương, nghỉ chế độ", cong: soVN(th.phep_co_luong) },
    { nhan: "Nghỉ lễ", cong: soVN(th.nghi_le), ghiChu: (le ?? []).map((l) => `${ngayVN(l.ngay)} ${l.ten}`).join(", ") },
    { nhan: "Công tác, làm online", cong: soVN(th.cong_tac) },
    { nhan: "Đi trễ / về sớm bị trừ", cong: Number(th.cong_tru_tre) ? `−${soVN(th.cong_tru_tre)}` : "0", ghiChu: th.so_lan_tre + th.so_lan_ve_som ? `${th.so_lan_tre} lần trễ (${th.phut_tre} phút), ${th.so_lan_ve_som} lần về sớm (${th.phut_ve_som} phút); trừ = số phút ÷ 480` : undefined },
    { nhan: "Nghỉ không lương (không tính công)", cong: soVN(th.nghi_khong_luong) },
    { nhan: "Công tính lương hiện tại", cong: soVN(th.cong_tinh_luong) },
  ] : [];

  return khung(
    <>
      <nav aria-label="Chọn kỳ lương" className="mb-5 flex flex-wrap items-center gap-2 text-[14px]">
        {(dsKy ?? []).map((k) => (
          <Link key={k.id} href={`/nhan-su/luong/phieu?ky=${k.id}`} aria-current={k.id === ky.id ? "page" : undefined}
            className={`rounded-nho px-3 py-1.5 ${k.id === ky.id ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-2 hover:text-muc"}`}>Tháng {thang2(k.thang)}/{k.nam}</Link>
        ))}
      </nav>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-[14px] text-muc-2">
        <span className="font-medium text-muc">Tháng {thang2(ky.thang)}/{ky.nam}</span>
        <NhanTrangThai kieu="tot">{ky.trang_thai === "da_chi" ? "Đã chi" : "Đã duyệt, chờ chi"}</NhanTrangThai>
        <span>{TINH_TRANG_LUONG[d.tinh_trang] ?? d.tinh_trang}</span>
      </div>
      <HangChiSo muc={[
        { nhan: "Công tính lương", so: `${soVN(d.cong_tinh)}/${soVN(d.cong_chuan)}`, ghiChu: "công" },
        { nhan: "Tổng thu nhập", so: tienVN(d.gross) },
        { nhan: "Tổng khấu trừ", so: tienVN(tongKhauTru) },
        { nhan: "Thực nhận", so: tienVN(d.thuc_tra), ghiChu: "làm tròn theo bảng lương đã duyệt" },
      ]} />

      <h2 className="nhan-muc mb-3 mt-9">Công trong tháng</h2>
      <Bang duLieu={congTH} khoa={(r) => r.nhan} trong="Chưa có số liệu công."
        cot={[{ nhan: "Loại công", chinh: true, hienThi: (r) => r.nhan }, { nhan: "Ghi chú", hienThi: (r) => <span className="text-muc-3">{r.ghiChu ?? ""}</span> }, { nhan: "Công", phai: true, hienThi: (r) => r.cong }]} />
      <p className="mt-2 text-[12px] text-muc-3">Phần công này tính từ dữ liệu hiện tại của tháng; số liệu trên phiếu (công tính lương, tiền) là bản chụp lúc tính lương và không đổi sau khi duyệt.</p>

      <h2 className="nhan-muc mb-3 mt-9">Thu nhập</h2>
      <Bang duLieu={thuNhap} khoa={(r) => r.nhan} cot={cotTien} />
      <h2 className="nhan-muc mb-3 mt-9">Khấu trừ</h2>
      <Bang duLieu={khauTru} khoa={(r) => r.nhan} cot={cotTien} />
      <p className="mt-2 text-[12px] text-muc-3">Thực nhận = Tổng thu nhập − Tổng khấu trừ{tong("cong") + tong("tru") > 0 ? " (đã gồm các khoản cộng/trừ khác do nhân sự nhập)" : ""}, làm tròn xuống theo bảng lương.</p>

      {(ph ?? []).length > 0 && (
        <>
          <h2 className="nhan-muc mb-3 mt-9">Phiếu đã duyệt trong tháng</h2>
          <Bang duLieu={ph ?? []} khoa={(r) => r.ma} cot={[
            { nhan: "Mã", chinh: true, hienThi: (r) => r.ma }, { nhan: "Loại", hienThi: (r) => `${LOAI_PHIEU[r.loai]}${r.loai_nghi ? ` · ${LOAI_NGHI[r.loai_nghi]}` : ""}` },
            { nhan: "Từ ngày", hienThi: (r) => ngayVN(r.tu_ngay) }, { nhan: "Đến ngày", hienThi: (r) => ngayVN(r.den_ngay) },
            { nhan: "Số ngày / giờ", phai: true, hienThi: (r) => (r.so_gio ? `${soVN(r.so_gio)} giờ` : `${soVN(r.so_ngay)} ngày`) },
          ]} />
        </>
      )}

      <h2 className="nhan-muc mb-3 mt-9">Chấm công từng ngày</h2>
      <Bang duLieu={cc ?? []} khoa={(r) => r.id} trong="Không có ngày chấm công nào trong tháng."
        cot={[
          { nhan: "Ngày", chinh: true, hienThi: (r) => `${THU[thuCuaNgay(r.ngay)]} ${ngayVN(r.ngay)}` }, { nhan: "Vào", hienThi: (r) => gioVN(r.vao) }, { nhan: "Ra", hienThi: (r) => gioVN(r.ra) },
          { nhan: "Công", phai: true, hienThi: (r) => soVN(r.cong) }, { nhan: "Trễ (phút)", phai: true, hienThi: (r) => (r.tre_phut ? <span className="text-canh-bao">{r.tre_phut}</span> : "") },
          { nhan: "Về sớm (phút)", phai: true, hienThi: (r) => (r.ve_som_phut ? <span className="text-canh-bao">{r.ve_som_phut}</span> : "") },
        ]} />
    </>,
  );
}
