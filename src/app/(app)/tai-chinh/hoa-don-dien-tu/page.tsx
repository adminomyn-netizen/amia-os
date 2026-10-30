import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { docLocHddt, hienKhoa, NHA_CUNG_CAP, tenNhaCungCap } from "@/lib/hoa-don-dien-tu";
import { docKetNoiHienThi } from "@/lib/hoa-don-dien-tu-ket-noi";
import { layDaSuaTen, layHoaDonHddt } from "@/lib/hoa-don-dien-tu-truy-van";
import { chuThu } from "@/lib/hoa-don-dien-tu-ngan-hang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { LocHoaDonDienTu } from "@/components/hoa-don/LocHoaDonDienTu";
import { LocNganHangHddt } from "@/components/hoa-don/LocNganHangHddt";
import { BangCanXuat } from "@/components/hoa-don/BangCanXuat";
import { ghiHoaDonDienTu, goHoaDonDienTu, layTenXuat, luuTenXuat, luuKetNoiHoaDonDienTu, ngatKetNoiHoaDonDienTu } from "./actions";

const HIEN_KET_NOI = false;
const TAB = [{ ma: "can", ten: "Cần xuất" }, { ma: "da", ten: "Đã xuất" }, { ma: "ket-noi", ten: "Kết nối" }];
const NUT_XUAT = "h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram";

export default async function TrangHoaDonDienTu({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("ban.xem");
  const loc = docLocHddt(await searchParams);
  const duocGhi = coQuyen(nd, "hd.vat") && coQuyen(nd, "ban.sua_khoa");
  const duocKetNoi = coQuyen(nd, "hd.vat") && coQuyen(nd, "ky.khoa");
  // Kế toán xuất hoá đơn có chọn lọc, làm thủ công (chị Dung 30/10): ẩn ngăn Kết nối, giữ mã để bật lại khi cần.
  const tab = loc.tab === "ket-noi" && !(HIEN_KET_NOI && coQuyen(nd, "hd.vat")) ? "can" : loc.tab;
  const tabCoThe = TAB.filter((t) => t.ma !== "ket-noi" || (HIEN_KET_NOI && coQuyen(nd, "hd.vat")));
  const hom = homNayHCM();
  let noiDung: React.ReactNode;
  let nutXuat: React.ReactNode = null;

  if (tab === "ket-noi") {
    const kn = await docKetNoiHienThi();
    const truong: Truong[] = [
      { ten: "nha_cung_cap", nhan: "Nhà cung cấp", loai: "chon", batBuoc: true, luaChon: NHA_CUNG_CAP.map((n) => ({ gia_tri: n.gia_tri, nhan: n.nhan })) },
      { ten: "ma_so_thue", nhan: "Mã số thuế bên bán", loai: "chu", batBuoc: true, goiY: "10 số, hoặc 13 số dạng 0123456789-001" },
      { ten: "ten_dang_nhap", nhan: "Tên đăng nhập", loai: "chu" },
      { ten: "khoa", nhan: "Mật khẩu hoặc khoá API", loai: "mat_khau_an", ghiChu: kn?.coKhoa ? "Để trống nếu giữ khoá đã lưu. Khoá được mã hoá, không hiện lại." : "Được mã hoá khi lưu, không hiện lại." },
      { ten: "mau_so_mac_dinh", nhan: "Mẫu số mặc định", loai: "chu", goiY: "Ví dụ 1" }, { ten: "ky_hieu_mac_dinh", nhan: "Ký hiệu mặc định", loai: "chu", goiY: "Ví dụ 1C26TAA" },
      { ten: "dia_chi_may_chu", nhan: "Địa chỉ máy chủ (nếu nhà cung cấp cấp riêng)", loai: "chu", rong: true, goiY: "https://…" },
    ];
    const dong: [string, string][] = kn ? [
      ["Nhà cung cấp", tenNhaCungCap(kn.nhaCungCap)], ["Mã số thuế", kn.maSoThue], ["Tên đăng nhập", kn.tenDangNhap || "chưa có"], ["Mật khẩu / khoá API", hienKhoa(kn.coKhoa ? kn.khoaCuoi4 : null)],
      ["Mẫu số mặc định", kn.mauSo || "chưa có"], ["Ký hiệu mặc định", kn.kyHieu || "chưa có"], ["Địa chỉ máy chủ", kn.diaChi || "chưa có"],
    ] : [];
    noiDung = (
      <section className="max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <NhanTrangThai kieu="cho">{kn ? "Đã lưu thông tin, chưa kết nối thử" : "Chưa kết nối nhà cung cấp"}</NhanTrangThai>
          {duocKetNoi && (
            <span className="flex flex-wrap items-center gap-3">
              <NutHop nhan={kn ? "Sửa kết nối" : "Nhập thông tin kết nối"} tieuDe="Kết nối hoá đơn điện tử" moTa="Lưu sẵn thông tin để sau này phát hành tự động. Hiện hệ thống chưa gọi nhà cung cấp, nên chưa phát hành tự động được." truong={truong} action={luuKetNoiHoaDonDienTu} rong
                giaTri={{ nha_cung_cap: kn?.nhaCungCap ?? "", ma_so_thue: kn?.maSoThue ?? "", ten_dang_nhap: kn?.tenDangNhap ?? "", khoa: "", mau_so_mac_dinh: kn?.mauSo ?? "", ky_hieu_mac_dinh: kn?.kyHieu ?? "", dia_chi_may_chu: kn?.diaChi ?? "" }} />
              {kn && <NutHop kieu="chu" nguy nhan="Ngắt kết nối" tieuDe="Ngắt kết nối hoá đơn điện tử" xacNhan="Xoá thông tin kết nối và khoá đã lưu? Số hoá đơn đã ghi vẫn giữ nguyên." action={ngatKetNoiHoaDonDienTu} nhanLuu="Ngắt" />}
            </span>
          )}
        </div>
        {kn ? (
          <dl className="divide-y divide-vien border-y border-vien text-[14px]">
            {dong.map(([nhan, gt]) => <div key={nhan} className="flex flex-wrap justify-between gap-2 py-2.5"><dt className="text-muc-3">{nhan}</dt><dd className="break-all text-right">{gt}</dd></div>)}
          </dl>
        ) : <p className="text-[14px] text-muc-3">Khi có tài khoản Viettel S-Invoice, MISA meInvoice hoặc VNPT Invoice, nhập vào đây một lần. Trong lúc chờ, vẫn ghi tay số hoá đơn ở tab Cần xuất.</p>}
        {!duocKetNoi && <p className="mt-4 text-[13px] text-muc-3">Chỉ kế toán ở văn phòng chung (không gắn chi nhánh) sửa được phần này.</p>}
        <p className="mt-4 text-[13px] text-muc-3">Người dùng và trình duyệt không bao giờ nhận lại khoá; chỉ máy chủ giải mã khi gọi nhà cung cấp.</p>
      </section>
    );
  } else {
    const { dong, conNua, thu } = await layHoaDonHddt(nd, loc, tab === "da" ? "da" : "can");
    const db = sb();
    const idsK = [...new Set(dong.map((d) => d.khach_id).filter(Boolean))] as string[];
    const idsNv = [...new Set(dong.map((d) => d.vat_hd_nguoi_id).filter(Boolean))] as string[];
    const [{ data: k }, { data: nv }] = await Promise.all([
      idsK.length ? db.from("khach_hang").select("id, ho_ten, ma, ma_so_thue, cong_ty").in("id", idsK) : Promise.resolve({ data: [] }),
      idsNv.length ? db.from("nhan_vien").select("id, ho_ten").in("id", idsNv) : Promise.resolve({ data: [] }),
    ]);
    const tenK = new Map((k ?? []).map((x) => [x.id, x])), tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
    const khach = (id: string | null) => (id ? tenK.get(id) : undefined);
    const daSua = tab === "can" ? await layDaSuaTen(dong.map((r) => r.id)) : new Set<string>();
    const tham = new URLSearchParams({ tu: loc.tu, den: loc.den, ...(loc.q ? { q: loc.q } : {}) });
    const cotChung = [
      { nhan: "Hoá đơn bán", chinh: true, hienThi: (r: (typeof dong)[number]) => <Link href={`/hoa-don/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}<span className="block text-[12.5px] font-normal text-muc-3">{ngayVN(r.ngay_hd)}</span></Link> },
      { nhan: "Khách hàng", hienThi: (r: (typeof dong)[number]) => { const x = khach(r.khach_id); return r.khach_id ? <div>{x?.ho_ten ?? ""}{x?.ma_so_thue && <div className="text-[12.5px] text-muc-3">MST {x.ma_so_thue}</div>}</div> : "Khách lẻ"; } },
    ];
    const truongGhi: Truong[] = [
      { ten: "vat_hd_so", nhan: "Số hoá đơn", loai: "chu", batBuoc: true }, { ten: "vat_hd_ngay", nhan: "Ngày xuất", loai: "ngay", batBuoc: true },
      { ten: "vat_hd_mau_so", nhan: "Mẫu số", loai: "chu", goiY: "Ví dụ 1" }, { ten: "vat_hd_ky_hieu", nhan: "Ký hiệu", loai: "chu", goiY: "Ví dụ 1C26TAA" },
      { ten: "vat_hd_tra_cuu", nhan: "Mã hoặc đường dẫn tra cứu (không bắt buộc)", loai: "chu", rong: true, goiY: "https://…" },
    ];
    noiDung = (
      <>
        <LocHoaDonDienTu tu={loc.tu} den={loc.den} tab={tab} />
        {tab === "can" ? (
          <>
            <LocNganHangHddt nh={loc.nh} tu={loc.tu} den={loc.den} q={loc.q} />
            <BangCanXuat conNua={conNua} duocGhi={duocGhi} truongGhi={truongGhi} ngayHomNay={hom} ghiAction={ghiHoaDonDienTu} layTen={layTenXuat} luuTen={luuTenXuat}
              dong={dong.map((r) => {
                const x = khach(r.khach_id);
                return { id: r.id, ma: r.ma, ngay: ngayVN(r.ngay_hd), khach: r.khach_id ? x?.ho_ten ?? "" : "Khách lẻ", mst: x?.ma_so_thue ?? "", phaiThu: tienVN(r.tong_phai_thu),
                  lyDo: Number(r.vat_pct) > 0 || Number(r.vat_tien) > 0 ? `Có VAT ${Number(r.vat_pct) > 0 ? `${Number(r.vat_pct)}%` : tienVN(r.vat_tien)}` : "Khách có mã số thuế", thu: thu.has(r.id) ? chuThu(thu.get(r.id)!, tienVN) : [], daSua: daSua.has(r.id) };
              })} />
          </>
        ) : (
          <Bang duLieu={dong} khoa={(r) => r.id} trong="Chưa có hoá đơn điện tử nào được ghi số trong khoảng này."
            cot={[
              ...cotChung,
              { nhan: "Hoá đơn điện tử", hienThi: (r) => (
                <div>{r.vat_hd_so}{r.vat_hd_ky_hieu && ` / ${r.vat_hd_ky_hieu}`}
                  <div className="text-[12.5px] text-muc-3">{r.vat_hd_mau_so && `Mẫu ${r.vat_hd_mau_so} · `}Xuất {ngayVN(r.vat_hd_ngay ?? r.vat_hd_luc?.slice(0, 10) ?? "")}
                    {r.vat_hd_tra_cuu && (/^https:\/\//.test(r.vat_hd_tra_cuu) ? <> · <a href={r.vat_hd_tra_cuu} target="_blank" rel="noreferrer noopener" className="text-nhan-dam hover:underline">tra cứu</a></> : ` · mã tra cứu ${r.vat_hd_tra_cuu}`)}</div></div>
              ) },
              { nhan: "Người ghi", hienThi: (r) => (r.vat_hd_nguoi_id ? tenNv.get(r.vat_hd_nguoi_id) ?? "" : "") },
              { nhan: "Phải thu", phai: true, hienThi: (r) => tienVN(r.tong_phai_thu) },
              { nhan: "", hienThi: (r) => (duocGhi ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa hoá đơn điện tử của ${r.ma}`} truong={truongGhi} action={ghiHoaDonDienTu} an={{ hoa_don_id: r.id, moi: "0" }}
                    giaTri={{ vat_hd_so: r.vat_hd_so ?? "", vat_hd_ngay: r.vat_hd_ngay ?? r.vat_hd_luc?.slice(0, 10) ?? hom, vat_hd_mau_so: r.vat_hd_mau_so ?? "", vat_hd_ky_hieu: r.vat_hd_ky_hieu ?? "", vat_hd_tra_cuu: r.vat_hd_tra_cuu ?? "" }} />
                  <NutHop kieu="chu" nguy nhan="Gỡ" tieuDe="Gỡ số hoá đơn điện tử" xacNhan={`Gỡ số ${r.vat_hd_so} khỏi ${r.ma}? Hoá đơn sẽ quay lại danh sách Cần xuất.`} action={goHoaDonDienTu} an={{ hoa_don_id: r.id }} nhanLuu="Gỡ" />
                </div>
              ) : null) },
            ]} />
        )}
        {conNua && tab === "da" && <p className="mt-3 text-[13px] text-muc-3">Chỉ hiện 200 hoá đơn mới nhất. Thu hẹp khoảng ngày để xem phần còn lại{tab === "da" ? ", hoặc xuất Excel để lấy đủ" : ""}.</p>}
      </>
    );
    nutXuat = tab === "da" && dong.length > 0 ? <a href={`/api/xuat/hoa-don-dien-tu?${tham}`} download aria-label="Xuất Excel hoá đơn điện tử đã ghi" className={NUT_XUAT}>Xuất Excel</a> : null;
  }
  return (
    <div>
      <Link href="/tai-chinh" className="text-[13px] text-muc-3 hover:text-muc">← Tài chính</Link>
      <TieuDeTrang tieuDe="Hoá đơn điện tử" phu="Chọn các đơn cần xuất rồi bấm Xuất Excel. Xuất hoá đơn điện tử vẫn làm tay ở phần mềm nhà cung cấp, xong ghi số hoá đơn vào đây.">
        {nutXuat}
      </TieuDeTrang>
      <Tab muc={tabCoThe} dang={tab} goc="/tai-chinh/hoa-don-dien-tu" />
      {noiDung}
    </div>
  );
}
