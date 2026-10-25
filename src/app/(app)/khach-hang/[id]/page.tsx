import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { NHAN_NGUON, TRANG_THAI_KHACH, truongKhach } from "@/lib/khach";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { TaiAnh } from "@/components/khach/TaiAnh";
import { danhDauMat, luuGhiChu, luuKhach, luuNguoiThan, xoaNguoiThan } from "../actions";

const TAB = [{ ma: "thong-tin", ten: "Thông tin" }, { ma: "ghi-chu", ten: "Ghi chú điều trị" }, { ma: "nguoi-than", ten: "Người thân" }, { ma: "lich-su", ten: "Lịch sử giao dịch" }, { ma: "anh", ten: "Ảnh khách hàng" }];
const LOAI_ANH: Record<string, string> = { truoc: "Trước", sau: "Sau", khac: "Khác" };

export default async function HoSoKhach({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("khach.xem");
  const { id } = await params;
  const { tab: t } = await searchParams;
  const xemSucKhoe = coQuyen(nd.vaiTro, "hoso.xem");
  const tabHopLe = TAB.filter((x) => (x.ma !== "ghi-chu" || xemSucKhoe) && (x.ma !== "anh" || coQuyen(nd.vaiTro, "anh.xem")) && (x.ma !== "lich-su" || coQuyen(nd.vaiTro, "ban.xem")));
  const tab = tabHopLe.some((x) => x.ma === t) ? t! : "thong-tin";
  const db = sb();
  const { data: k } = await db.from("v_khach_hang").select("*").eq("id", id).maybeSingle();
  if (!k) notFound();
  const [{ data: nv }, { data: cn }, { data: dv }, { data: qt }, { data: no }, { data: the }] = await Promise.all([
    db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten"),
    db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("ma"),
    db.from("dich_vu").select("id, ma, ten").eq("hoat_dong", true).order("ma"),
    db.from("khach_quan_tam").select("dich_vu_id").eq("khach_id", id),
    db.from("hoa_don").select("con_no").eq("khach_id", id).eq("trang_thai", "hoan_thanh").gt("con_no", 0),
    db.from("v_the_khach").select("*").eq("khach_id", id).order("ngay_cap", { ascending: false }),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const nvLC = (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const truong = truongKhach({ dichVu: (dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), nhanVien: nvLC, chiNhanh: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) });
  const tongNo = (no ?? []).reduce((s, r) => s + Number(r.con_no), 0);
  const tt = TRANG_THAI_KHACH[k.trang_thai ?? "lead"];
  const sua = coQuyen(nd.vaiTro, "khach.sua");
  const giaTriSua = { id: k.id, ho_ten: k.ho_ten, dien_thoai: k.dien_thoai, zalo: k.zalo ?? "", email: k.email ?? "", gioi_tinh: k.gioi_tinh ?? "", ngay_sinh: k.ngay_sinh ?? "", dia_chi: k.dia_chi ?? "", chi_nhanh_id: k.chi_nhanh_id, nguon: k.nguon, nguon_chi_tiet: k.nguon_chi_tiet ?? "", nguoi_gioi_thieu: "", nguoi_phu_trach_id: k.nguoi_phu_trach_id, ghi_chu: k.ghi_chu ?? "", dong_y_dung_hinh: k.dong_y_dung_hinh, quan_tam: (qt ?? []).map((x) => x.dich_vu_id) };

  // Dữ liệu sức khoẻ: ghi vết mỗi lần mở tab ghi chú hoặc ảnh.
  if (tab === "ghi-chu" || tab === "anh") await db.from("nhat_ky_truy_cap").insert({ nguoi_id: nd.nhanVienId, hanh_dong: `xem_${tab}`, doi_tuong: "khach_hang", doi_tuong_id: id });

  let noiDung: React.ReactNode = null;
  if (tab === "thong-tin") {
    const hang: [string, React.ReactNode][] = [
      ["Điện thoại", k.dien_thoai], ["Zalo", k.zalo ?? ""], ["Email", k.email ?? ""], ["Giới tính", k.gioi_tinh ?? ""], ["Ngày sinh", ngayVN(k.ngay_sinh) || "Chưa có"], ["Địa chỉ", k.dia_chi ?? ""],
      ["Nguồn khách", NHAN_NGUON[k.nguon ?? ""] ?? k.nguon], ["Chi tiết nguồn", k.nguon_chi_tiet ?? ""], ["Người phụ trách", tenNv.get(k.nguoi_phu_trach_id ?? "") ?? ""],
      ["Đồng ý dùng hình ảnh", k.dong_y_dung_hinh ? `Có (${ngayVN(k.dong_y_dung_hinh_luc)})` : "Chưa"], ["Ghi chú chung", k.ghi_chu ?? ""],
    ];
    noiDung = (
      <>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {hang.map(([a, b]) => (<div key={a} className="border-b border-vien pb-3"><dt className="nhan-muc">{a}</dt><dd className="mt-1 text-[15px] text-muc">{b || "—"}</dd></div>))}
        </dl>
        <h3 className="mb-3 mt-8 text-[15px] font-semibold text-muc">Thẻ của khách</h3>
        <Bang duLieu={the ?? []} khoa={(r) => r.id ?? ""} trong="Khách chưa có thẻ nào."
          cot={[
            { nhan: "Mã thẻ", hienThi: (r) => r.ma }, { nhan: "Loại", hienThi: (r) => (r.loai === "lan" ? "Liệu trình" : "Thẻ tiền") },
            { nhan: "Còn lại", hienThi: (r) => (r.loai === "lan" ? `${r.so_buoi_con}/${r.so_buoi_tong} buổi` : tienVN(r.so_du_tien)), phai: true },
            { nhan: "Hạn", hienThi: (r) => ngayVN(r.han_dung) || "Không hạn" },
            { nhan: "Tình trạng", hienThi: (r) => <NhanTrangThai kieu={r.tinh_trang === "hoat_dong" ? "tot" : r.tinh_trang === "sap_het" ? "cho" : "tram"}>{({ hoat_dong: "Đang dùng", sap_het: "Sắp hết", het_han: "Hết hạn", hoan_thanh: "Đã dùng hết", khoa: "Đang khoá", thu_hoi: "Đã thu hồi" } as Record<string, string>)[r.tinh_trang ?? ""]}</NhanTrangThai> },
          ]} />
      </>
    );
  } else if (tab === "ghi-chu") {
    const { data: gc } = await db.from("khach_ghi_chu").select("*").eq("khach_id", id).order("tao_luc", { ascending: false });
    const tr: Truong[] = [
      { ten: "tinh_trang", nhan: "Tình trạng", loai: "nhieu_dong" }, { ten: "yeu_cau", nhan: "Yêu cầu của khách", loai: "nhieu_dong" },
      { ten: "phuong_an", nhan: "Phương án điều trị", loai: "nhieu_dong" }, { ten: "ket_qua", nhan: "Kết quả", loai: "nhieu_dong" },
    ];
    noiDung = (
      <>
        {coQuyen(nd.vaiTro, "hoso.sua") && <div className="mb-5"><NutHop nhan="Thêm ghi chú" tieuDe="Thêm ghi chú điều trị" moTa="Ghi chú chỉ thêm, không sửa hay xoá để giữ lịch sử hồ sơ." rong truong={tr} an={{ khach_id: id }} action={luuGhiChu} /></div>}
        {(gc ?? []).length === 0 && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Chưa có ghi chú điều trị.</p>}
        <ol className="space-y-5">
          {(gc ?? []).map((g) => (
            <li key={g.id} className="border-l-2 border-dat pl-4">
              <div className="text-[12px] text-muc-3">{ngayGioVN(g.tao_luc)} · {tenNv.get(g.tao_boi ?? "") ?? "—"}</div>
              <dl className="mt-1.5 grid gap-x-6 gap-y-2 sm:grid-cols-2 text-[14px]">
                {([["Tình trạng", g.tinh_trang], ["Yêu cầu", g.yeu_cau], ["Phương án", g.phuong_an], ["Kết quả", g.ket_qua]] as const).map(([a, b]) => b && (<div key={a}><dt className="nhan-muc">{a}</dt><dd className="mt-0.5 whitespace-pre-line text-muc">{b}</dd></div>))}
              </dl>
            </li>
          ))}
        </ol>
      </>
    );
  } else if (tab === "nguoi-than") {
    const { data: nt } = await db.from("khach_nguoi_than").select("*").eq("khach_id", id).order("ho_ten");
    const tr: Truong[] = [{ ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "quan_he", nhan: "Quan hệ", loai: "chu", goiY: "Mẹ, chồng, bạn..." }, { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" }];
    noiDung = (
      <>
        {sua && <div className="mb-5"><NutHop nhan="Thêm người thân" tieuDe="Thêm người thân" truong={tr} an={{ khach_id: id }} action={luuNguoiThan} /></div>}
        <Bang duLieu={nt ?? []} khoa={(r) => r.id} trong="Chưa có người thân nào." cot={[
          { nhan: "Họ tên", hienThi: (r) => <span className="text-muc">{r.ho_ten}</span> }, { nhan: "Quan hệ", hienThi: (r) => r.quan_he ?? "" }, { nhan: "Điện thoại", hienThi: (r) => r.dien_thoai ?? "" },
          ...(sua ? [{ nhan: "", hienThi: (r: NonNullable<typeof nt>[number]) => (
            <span className="flex gap-4">
              <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.ho_ten}`} truong={tr} an={{ khach_id: id }} giaTri={{ ...r, quan_he: r.quan_he ?? "", dien_thoai: r.dien_thoai ?? "" }} action={luuNguoiThan} />
              <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá người thân" xacNhan={`Xoá ${r.ho_ten} khỏi danh sách người thân?`} an={{ id: r.id, khach_id: id }} nhanLuu="Xoá" action={xoaNguoiThan} />
            </span>) }] : []),
        ]} />
      </>
    );
  } else if (tab === "lich-su") {
    const [{ data: hd }, { data: buoi }, { data: lich }] = await Promise.all([
      db.from("hoa_don").select("id, ma, ngay_hd, trang_thai, tong_phai_thu, da_thu, con_no").eq("khach_id", id).order("ngay_hd", { ascending: false }).limit(50),
      db.from("buoi_thuc_hien").select("id, ngay_lam, dich_vu_id, nv_thuc_hien_id, trang_thai, doanh_thu_buoi").eq("khach_id", id).order("ngay_lam", { ascending: false }).limit(50),
      db.from("lich_hen").select("id, bat_dau, trang_thai").eq("khach_id", id).order("bat_dau", { ascending: false }).limit(20),
    ]);
    const { data: dvAll } = await db.from("dich_vu").select("id, ten");
    const tenDv = new Map((dvAll ?? []).map((d) => [d.id, d.ten]));
    noiDung = (
      <div className="space-y-8">
        <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Hoá đơn</h3>
          <Bang duLieu={hd ?? []} khoa={(r) => r.id} trong="Chưa có hoá đơn." cot={[
            { nhan: "Mã", hienThi: (r) => <Link className="font-medium text-nhan-dam hover:underline" href={`/hoa-don/${r.id}`}>{r.ma}</Link> }, { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_hd) },
            { nhan: "Trạng thái", hienThi: (r) => ({ nhap: "Nháp", hoan_thanh: "Hoàn thành", huy: "Đã huỷ" } as Record<string, string>)[r.trang_thai] },
            { nhan: "Phải thu", hienThi: (r) => tienVN(r.tong_phai_thu), phai: true }, { nhan: "Đã thu", hienThi: (r) => tienVN(r.da_thu), phai: true }, { nhan: "Còn nợ", hienThi: (r) => (r.trang_thai === "hoan_thanh" ? tienVN(r.con_no) : ""), phai: true },
          ]} /></section>
        <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Buổi đã thực hiện</h3>
          <Bang duLieu={buoi ?? []} khoa={(r) => r.id} trong="Chưa có buổi nào." cot={[
            { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_lam) }, { nhan: "Dịch vụ", hienThi: (r) => tenDv.get(r.dich_vu_id) ?? "" }, { nhan: "Người làm", hienThi: (r) => tenNv.get(r.nv_thuc_hien_id) ?? "" },
            { nhan: "Trạng thái", hienThi: (r) => (r.trang_thai === "da_lam" ? "Đã làm" : "Đã huỷ") }, { nhan: "Doanh thu buổi", hienThi: (r) => tienVN(r.doanh_thu_buoi), phai: true },
          ]} /></section>
        <section><h3 className="mb-2 text-[15px] font-semibold text-muc">Lịch hẹn gần đây</h3>
          <Bang duLieu={lich ?? []} khoa={(r) => r.id} trong="Chưa có lịch hẹn." cot={[{ nhan: "Giờ hẹn", hienThi: (r) => ngayGioVN(r.bat_dau) }, { nhan: "Trạng thái", hienThi: (r) => r.trang_thai }]} /></section>
      </div>
    );
  } else {
    const { data: anh } = await db.from("khach_anh").select("*").eq("khach_id", id).order("ngay_chup", { ascending: false }).order("tao_luc", { ascending: false });
    const link = anh?.length ? (await db.storage.from("khach-anh").createSignedUrls(anh.map((a) => a.duong_dan), 3600)).data ?? [] : [];
    const urlTheo = new Map(link.map((l) => [l.path, l.signedUrl]));
    const theoNgay = new Map<string, NonNullable<typeof anh>>();
    for (const a of anh ?? []) theoNgay.set(a.ngay_chup, [...(theoNgay.get(a.ngay_chup) ?? []), a]);
    noiDung = (
      <>
        {coQuyen(nd.vaiTro, "anh.them") && <TaiAnh khachId={id} />}
        {!k.dong_y_dung_hinh && <p className="mb-4 rounded-nho bg-canh-bao-nen px-3 py-2 text-[13px] text-canh-bao">Khách chưa đồng ý bằng văn bản cho dùng hình ảnh: ảnh chỉ lưu hồ sơ điều trị, không dùng cho quảng cáo.</p>}
        {(anh ?? []).length === 0 && <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Chưa có ảnh nào.</p>}
        {[...theoNgay.entries()].map(([ngay, ds]) => (
          <section key={ngay} className="mb-6">
            <h3 className="mb-2 text-[14px] font-semibold text-muc">{ngayVN(ngay)}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {ds.map((a) => (
                <figure key={a.id} className="overflow-hidden rounded-nho border border-vien bg-giay-tram">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlTheo.get(a.duong_dan) ?? undefined} alt={`Ảnh ${LOAI_ANH[a.loai]} điều trị ngày ${ngayVN(a.ngay_chup)}`} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                  <figcaption className="px-2 py-1.5 text-[12px] text-muc-2">{LOAI_ANH[a.loai]}{a.ghi_chu ? ` · ${a.ghi_chu}` : ""}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </>
    );
  }

  return (
    <>
      <TieuDeTrang tieuDe={k.ho_ten ?? ""} phu={<span className="flex flex-wrap items-center gap-2"><span>{k.ma}</span><NhanTrangThai kieu={tt.kieu}>{tt.nhan}</NhanTrangThai><NhanTrangThai kieu="tram">Hạng {k.hang}</NhanTrangThai></span>}>
        {coQuyen(nd.vaiTro, "lich.sua") && <Link href={`/lich-hen?khach=${id}`} className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Đặt lịch</Link>}
        {coQuyen(nd.vaiTro, "ban.tao") && <Link href={`/ban-hang?khach=${id}`} className="nut-vang h-10 rounded-nho px-4 text-[14px] leading-10">Tạo đơn</Link>}
        {sua && <NutHop kieu="phu" nhan="Sửa hồ sơ" tieuDe="Sửa hồ sơ khách" rong truong={truong} giaTri={giaTriSua} action={luuKhach} />}
        {sua && <NutHop kieu="phu" nhan={k.danh_dau_mat ? "Bỏ đánh dấu mất" : "Đánh dấu đã mất"} tieuDe="Đánh dấu khách" xacNhan={k.danh_dau_mat ? "Đưa khách trở lại luồng chăm sóc?" : "Khách không còn quay lại? Trạng thái sẽ là 'Đã mất' cho tới khi bỏ đánh dấu."} an={{ id, mat: k.danh_dau_mat ? "0" : "1" }} nhanLuu="Xác nhận" action={danhDauMat} />}
      </TieuDeTrang>
      <HangChiSo muc={[
        { nhan: "Chi 12 tháng gần nhất", so: tienVN(k.chi_12_thang) }, { nhan: "Thẻ đang dùng", so: soVN(k.so_the_dang_dung) },
        { nhan: "Còn nợ", so: tienVN(tongNo) }, { nhan: "Tạo hồ sơ", so: ngayVN(k.tao_luc) },
      ]} />
      <div className="mt-6"><Tab muc={tabHopLe} dang={tab} goc={`/khach-hang/${id}`} /></div>
      {noiDung}
    </>
  );
}
