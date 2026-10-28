import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { BUOC_UNG_VIEN, KENH_DANG, LOAI_TUYEN, LY_DO_KHONG_DAT, NGUON_UNG_VIEN, TRANG_THAI_TIN, buocTiepTheoYeuCau, soanBaiDang, tinhBaoCaoTuyenDung } from "@/lib/tuyen-dung";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { chuyenYeuCau, goDangKenh, guiYeuCauTuyen, luuDangKenh, luuTinTuyen, luuUngVien, xoaTinTuyen, xoaUngVien } from "./actions";

const TAB = [{ ma: "ung-vien", ten: "Ứng viên" }, { ma: "tin", ten: "Tin tuyển dụng" }, { ma: "yeu-cau", ten: "Yêu cầu tuyển" }, { ma: "bao-cao", ten: "Báo cáo" }];
const lc = (xs: readonly string[]) => xs.map((x) => ({ gia_tri: x, nhan: x }));
const KIEU_BUOC: Record<string, "tot" | "cho" | "loi" | "tram"> = { "Mới nộp": "tram", "Hẹn phỏng vấn": "cho", "Vòng 1": "cho", "Vòng 2": "cho", "Đề nghị": "cho", "Nhận việc": "tot", "Không đạt": "loi" };
const KIEU_YC: Record<string, "tot" | "cho" | "loi" | "tram"> = { "Chờ tiếp nhận": "cho", "Đã tiếp nhận": "cho", "Đang đăng tin": "cho", "Hoàn thành": "tot", "Từ chối": "loi", "Huỷ": "tram" };

/** Tuyển dụng (bê từ Omyn HRM): yêu cầu → tiếp nhận → tin tuyển → ứng viên theo bước → đăng tin theo kênh và chi phí → báo cáo. */
export default async function TrangTuyenDung({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("cong.xem");
  const sua = coQuyen(nd, "cong.sua"), db = sb();
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "ung-vien";
  const trongPhamVi = (cn: string | null) => !nd.chiNhanhId || !cn || cn === nd.chiNhanhId;
  const [{ data: cn }, { data: tinAll }, { data: ucAll }] = await Promise.all([
    db.from("chi_nhanh").select("id, ten").order("thu_tu").order("ma"),
    db.from("tin_tuyen_dung").select("*").order("tao_luc", { ascending: false }),
    db.from("yeu_cau_tuyen_dung").select("*").order("tao_luc", { ascending: false }),
  ]);
  const tenCn = new Map((cn ?? []).map((c) => [c.id, c.ten]));
  const tins = (tinAll ?? []).filter((x) => trongPhamVi(x.chi_nhanh_id)), yeuCau = (ucAll ?? []).filter((x) => trongPhamVi(x.chi_nhanh_id));
  const tinIds = tins.map((x) => x.id);
  const [{ data: uvAll }, { data: kenhAll }, { data: nvAll }] = await Promise.all([
    tinIds.length ? db.from("ung_vien").select("*").in("tin_id", tinIds).order("tao_luc", { ascending: false }) : Promise.resolve({ data: [] }),
    tinIds.length ? db.from("dang_tin_kenh").select("*").in("tin_id", tinIds).order("ngay_dang", { ascending: false }) : Promise.resolve({ data: [] }),
    db.from("nhan_vien").select("id, ho_ten"),
  ]);
  const uv = uvAll ?? [], kenh = kenhAll ?? [];
  const tenTin = new Map(tins.map((x) => [x.id, x.vi_tri])), tenNv = new Map((nvAll ?? []).map((n) => [n.id, n.ho_ten]));
  const luaTin = tins.map((x) => ({ gia_tri: x.id, nhan: `${x.vi_tri}${x.chi_nhanh_id ? ` · ${tenCn.get(x.chi_nhanh_id)}` : ""}` }));
  const luaCn = [{ gia_tri: "", nhan: "Mọi cơ sở" }, ...(cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))];

  const truongUv: Truong[] = [
    { ten: "tin_id", nhan: "Tin tuyển dụng", loai: "chon", luaChon: luaTin, batBuoc: true, rong: true }, { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true },
    { ten: "dien_thoai", nhan: "Điện thoại", loai: "chu" }, { ten: "email", nhan: "Email", loai: "email" }, { ten: "nguon", nhan: "Nguồn", loai: "chon", luaChon: lc(NGUON_UNG_VIEN) },
    { ten: "trang_thai", nhan: "Bước", loai: "chon", luaChon: lc(BUOC_UNG_VIEN), batBuoc: true }, { ten: "ngay_phong_van", nhan: "Ngày phỏng vấn", loai: "ngay" }, { ten: "ngay_nhan_viec", nhan: "Ngày nhận việc (khi Nhận việc)", loai: "ngay" },
    { ten: "ly_do_khong_dat", nhan: "Lý do không đạt (khi Không đạt)", loai: "chon", luaChon: [{ gia_tri: "", nhan: "—" }, ...lc(LY_DO_KHONG_DAT)] }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  const truongTin: Truong[] = [
    { ten: "vi_tri", nhan: "Vị trí tuyển", loai: "chu", batBuoc: true, rong: true }, { ten: "chi_nhanh_id", nhan: "Cơ sở", loai: "chon", luaChon: luaCn },
    { ten: "yeu_cau_id", nhan: "Theo yêu cầu", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không gắn yêu cầu" }, ...yeuCau.filter((y) => y.trang_thai === "Đã tiếp nhận" || y.trang_thai === "Đang đăng tin").map((y) => ({ gia_tri: y.id, nhan: `${y.ma} · ${y.vi_tri}` }))] },
    { ten: "so_luong_can", nhan: "Số lượng cần", loai: "so", batBuoc: true }, { ten: "han_nop", nhan: "Hạn nộp hồ sơ", loai: "ngay" }, { ten: "trang_thai", nhan: "Trạng thái", loai: "chon", luaChon: lc(TRANG_THAI_TIN) },
    { ten: "mo_ta", nhan: "Mô tả, yêu cầu công việc", loai: "nhieu_dong", rong: true },
  ];
  const truongYc: Truong[] = [
    { ten: "vi_tri", nhan: "Vị trí cần tuyển", loai: "chu", batBuoc: true, rong: true }, { ten: "chi_nhanh_id", nhan: "Cơ sở", loai: "chon", luaChon: luaCn }, { ten: "so_luong", nhan: "Số lượng", loai: "so", batBuoc: true },
    { ten: "loai_tuyen", nhan: "Loại tuyển", loai: "chon", luaChon: lc(LOAI_TUYEN) }, { ten: "thay_the_cho", nhan: "Thay thế cho (nếu có)", loai: "chu" }, { ten: "muc_luong", nhan: "Mức lương dự kiến", loai: "chu" },
    { ten: "han_can_nhan_su", nhan: "Cần nhân sự trước ngày", loai: "ngay" }, { ten: "yeu_cau_chinh", nhan: "Yêu cầu chính", loai: "nhieu_dong", rong: true },
  ];
  const truongKenh: Truong[] = [
    { ten: "tin_id", nhan: "Tin tuyển dụng", loai: "chon", luaChon: luaTin, batBuoc: true, rong: true }, { ten: "kenh", nhan: "Kênh đăng", loai: "chon", luaChon: lc(KENH_DANG), batBuoc: true },
    { ten: "link_bai", nhan: "Link bài đăng", loai: "chu", rong: true }, { ten: "ngay_dang", nhan: "Ngày đăng", loai: "ngay" }, { ten: "chi_phi", nhan: "Chi phí (đ)", loai: "tien" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true },
  ];
  const soDem = (b: string) => uv.filter((u) => u.trang_thai === b).length;

  let noiDung: React.ReactNode, nutThem: React.ReactNode = null;
  if (tab === "ung-vien") {
    nutThem = sua && luaTin.length > 0 && <NutHop nhan="Thêm ứng viên" tieuDe="Thêm ứng viên" rong truong={truongUv} giaTri={{ trang_thai: "Mới nộp" }} action={luuUngVien} />;
    noiDung = (
      <>
        <HangChiSo muc={[{ nhan: "Mới nộp", so: String(soDem("Mới nộp")) }, { nhan: "Đang phỏng vấn / vòng", so: String(soDem("Hẹn phỏng vấn") + soDem("Vòng 1") + soDem("Vòng 2")) }, { nhan: "Đề nghị", so: String(soDem("Đề nghị")) }, { nhan: "Đã nhận việc", so: String(soDem("Nhận việc")) }]} />
        <div className="mt-6" />
        <Bang duLieu={uv} khoa={(r) => r.id} trong={luaTin.length ? "Chưa có ứng viên nào." : "Chưa có tin tuyển dụng. Tạo tin ở tab Tin tuyển dụng rồi thêm ứng viên."}
          cot={[
            { nhan: "Ứng viên", chinh: true, hienThi: (r) => <span className="text-muc">{r.ho_ten}<span className="block text-[12px] text-muc-3">{[r.dien_thoai, r.email].filter(Boolean).join(" · ")}</span></span> },
            { nhan: "Vị trí", hienThi: (r) => tenTin.get(r.tin_id) ?? "" }, { nhan: "Nguồn", hienThi: (r) => r.nguon ?? "" }, { nhan: "Ngày nộp", hienThi: (r) => ngayVN(r.ngay_nhan_ho_so) },
            { nhan: "Bước", hienThi: (r) => <NhanTrangThai kieu={KIEU_BUOC[r.trang_thai]}>{r.trang_thai}</NhanTrangThai> },
            { nhan: "Ghi chú", hienThi: (r) => [r.ngay_phong_van ? `PV ${ngayVN(r.ngay_phong_van)}` : "", r.ngay_nhan_viec ? `Nhận việc ${ngayVN(r.ngay_nhan_viec)}` : "", r.ly_do_khong_dat ?? ""].filter(Boolean).join(" · ") },
            ...(sua ? [{ nhan: "", hienThi: (r: (typeof uv)[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Cập nhật" tieuDe={`Cập nhật: ${r.ho_ten}`} rong truong={truongUv} giaTri={{ ...r, ngay_phong_van: r.ngay_phong_van ?? "", ngay_nhan_viec: r.ngay_nhan_viec ?? "", ly_do_khong_dat: r.ly_do_khong_dat ?? "", nguon: r.nguon ?? "" }} action={luuUngVien} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.ho_ten}`} xacNhan="Xoá ứng viên này?" an={{ id: r.id }} action={xoaUngVien} nhanLuu="Xoá" /></span> }] : []),
          ]} />
      </>
    );
  } else if (tab === "tin") {
    nutThem = sua && <NutHop nhan="Tạo tin tuyển dụng" tieuDe="Tạo tin tuyển dụng" rong truong={truongTin} giaTri={{ so_luong_can: 1, trang_thai: "Đang tuyển", chi_nhanh_id: nd.chiNhanhId ?? "" }} action={luuTinTuyen} />;
    noiDung = (
      <>
        <Bang duLieu={tins} khoa={(r) => r.id} trong="Chưa có tin tuyển dụng."
          cot={[
            { nhan: "Vị trí", chinh: true, hienThi: (r) => <span className="text-muc">{r.vi_tri}<span className="block text-[12px] text-muc-3">{r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) : "Mọi cơ sở"}</span></span> },
            { nhan: "Cần / đã nhận", phai: true, hienThi: (r) => `${r.so_luong_can} / ${uv.filter((u) => u.tin_id === r.id && u.trang_thai === "Nhận việc").length}` }, { nhan: "Ứng viên", phai: true, hienThi: (r) => String(uv.filter((u) => u.tin_id === r.id).length) },
            { nhan: "Hạn nộp", hienThi: (r) => ngayVN(r.han_nop) }, { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.trang_thai === "Đã đóng" ? "tram" : "tot"}>{r.trang_thai}</NhanTrangThai> },
            { nhan: "Đã đăng ở", hienThi: (r) => [...new Set(kenh.filter((k) => k.tin_id === r.id && k.trang_thai === "Đang đăng").map((k) => k.kenh))].join(", ") },
            ...(sua ? [{ nhan: "", hienThi: (r: (typeof tins)[number]) => <span className="flex gap-4"><NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa: ${r.vi_tri}`} rong truong={truongTin} giaTri={{ ...r, chi_nhanh_id: r.chi_nhanh_id ?? "", yeu_cau_id: r.yeu_cau_id ?? "", han_nop: r.han_nop ?? "", mo_ta: r.mo_ta ?? "" }} action={luuTinTuyen} /><NutHop kieu="chu" nhan="Ghi bài đăng" tieuDe={`Ghi bài đăng: ${r.vi_tri}`} moTa={soanBaiDang({ ...r, chi_nhanh: r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) : null })} truong={truongKenh} giaTri={{ tin_id: r.id }} action={luuDangKenh} /><NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá: ${r.vi_tri}`} xacNhan="Xoá tin này?" an={{ id: r.id }} action={xoaTinTuyen} nhanLuu="Xoá" /></span> }] : []),
          ]} />
        {kenh.length > 0 && (
          <>
            <h2 className="nhan-muc mb-3 mt-9">Bài đã đăng theo kênh</h2>
            <Bang duLieu={kenh} khoa={(r) => r.id} cot={[
              { nhan: "Tin", chinh: true, hienThi: (r) => tenTin.get(r.tin_id) ?? "" }, { nhan: "Kênh", hienThi: (r) => r.kenh }, { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_dang) },
              { nhan: "Link", hienThi: (r) => (r.link_bai ? <a href={r.link_bai} target="_blank" rel="noopener noreferrer" className="text-nhan-dam hover:underline">Mở bài</a> : "") }, { nhan: "Chi phí", phai: true, hienThi: (r) => (Number(r.chi_phi) ? tienVN(r.chi_phi) : "") },
              { nhan: "Trạng thái", hienThi: (r) => r.trang_thai },
              ...(sua ? [{ nhan: "", hienThi: (r: (typeof kenh)[number]) => (r.trang_thai === "Đang đăng" ? <NutHop kieu="chu" nhan="Gỡ" tieuDe="Gỡ bài đăng" xacNhan="Đánh dấu bài này đã gỡ?" an={{ id: r.id }} action={goDangKenh} nhanLuu="Gỡ" /> : null) }] : []),
            ]} />
          </>
        )}
      </>
    );
  } else if (tab === "yeu-cau") {
    nutThem = <NutHop nhan="Gửi yêu cầu tuyển" tieuDe="Gửi yêu cầu tuyển dụng" moTa="Bộ phận Hành chính nhân sự sẽ tiếp nhận rồi đăng tin." rong truong={truongYc} giaTri={{ so_luong: 1, loai_tuyen: "Trong định biên", chi_nhanh_id: nd.chiNhanhId ?? "" }} action={guiYeuCauTuyen} />;
    noiDung = (
      <Bang duLieu={yeuCau} khoa={(r) => r.id} trong="Chưa có yêu cầu tuyển dụng."
        cot={[
          { nhan: "Mã", hienThi: (r) => r.ma }, { nhan: "Vị trí", chinh: true, hienThi: (r) => <span className="text-muc">{r.vi_tri}<span className="block text-[12px] text-muc-3">{r.loai_tuyen}{r.thay_the_cho ? ` · thay ${r.thay_the_cho}` : ""}</span></span> },
          { nhan: "Cơ sở", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) : "Mọi cơ sở") ?? "" }, { nhan: "SL", phai: true, hienThi: (r) => String(r.so_luong) },
          { nhan: "Người gửi", hienThi: (r) => (r.nguoi_yeu_cau_id ? tenNv.get(r.nguoi_yeu_cau_id) : "") ?? "" }, { nhan: "Cần trước", hienThi: (r) => ngayVN(r.han_can_nhan_su) },
          { nhan: "Trạng thái", hienThi: (r) => <span><NhanTrangThai kieu={KIEU_YC[r.trang_thai]}>{r.trang_thai}</NhanTrangThai>{r.ly_do_tu_choi ? <span className="mt-1 block text-[12px] text-muc-3">{r.ly_do_tu_choi}</span> : null}</span> },
          ...(sua ? [{ nhan: "", hienThi: (r: (typeof yeuCau)[number]) => <span className="flex flex-wrap gap-4">{buocTiepTheoYeuCau(r.trang_thai).map((den) => (den === "Từ chối"
            ? <NutHop key={den} kieu="chu" nguy nhan="Từ chối" tieuDe={`Từ chối ${r.ma}`} truong={[{ ten: "ly_do", nhan: "Lý do từ chối", loai: "nhieu_dong", batBuoc: true, rong: true }]} an={{ id: r.id, den }} action={chuyenYeuCau} />
            : <NutHop key={den} kieu="chu" nguy={den === "Huỷ"} nhan={den === "Đã tiếp nhận" ? "Tiếp nhận" : den} tieuDe={`${den}: ${r.ma}`} xacNhan={`Chuyển yêu cầu ${r.ma} sang “${den}”?`} an={{ id: r.id, den }} action={chuyenYeuCau} nhanLuu={den} />))}</span> }] : []),
        ]} />
    );
  } else {
    const bc = tinhBaoCaoTuyenDung({ tin: tins, ungVien: uv, kenh, yeuCau });
    noiDung = (
      <>
        <HangChiSo muc={[{ nhan: "Ứng viên", so: String(uv.length) }, { nhan: "Đã nhận việc", so: String(bc.soNhanViec) }, { nhan: "Tổng chi phí đăng tin", so: tienVN(bc.tongChiPhi) }, { nhan: "Chi phí mỗi người nhận việc", so: bc.chiPhiMoiNguoi == null ? "—" : tienVN(bc.chiPhiMoiNguoi), ghiChu: bc.ngayLapDayTb == null ? undefined : `TB ${soVN(bc.ngayLapDayTb)} ngày từ yêu cầu đến nhận việc` }]} />
        <h2 className="nhan-muc mb-3 mt-9">Phễu tuyển dụng</h2>
        <Bang duLieu={bc.phau} khoa={(r) => r.buoc} cot={[{ nhan: "Bước", chinh: true, hienThi: (r) => r.buoc }, { nhan: "Số ứng viên", phai: true, hienThi: (r) => String(r.so) }]} />
        <h2 className="nhan-muc mb-3 mt-9">Nguồn ứng viên</h2>
        <Bang duLieu={bc.theoNguon} khoa={(r) => r.nguon} trong="Chưa có ứng viên." cot={[{ nhan: "Nguồn", chinh: true, hienThi: (r) => r.nguon }, { nhan: "Ứng viên", phai: true, hienThi: (r) => String(r.so) }, { nhan: "Nhận việc", phai: true, hienThi: (r) => String(r.nhanViec) }]} />
        <h2 className="nhan-muc mb-3 mt-9">Theo tin tuyển dụng</h2>
        <Bang duLieu={bc.theoTin} khoa={(r) => r.id} trong="Chưa có tin." cot={[{ nhan: "Vị trí", chinh: true, hienThi: (r) => r.viTri }, { nhan: "Cần", phai: true, hienThi: (r) => String(r.canTuyen) }, { nhan: "Ứng viên", phai: true, hienThi: (r) => String(r.ungVien) }, { nhan: "Nhận việc", phai: true, hienThi: (r) => String(r.nhanViec) }, { nhan: "Còn thiếu", phai: true, hienThi: (r) => String(r.conThieu) }, { nhan: "Chi phí", phai: true, hienThi: (r) => (r.chiPhi ? tienVN(r.chiPhi) : "") }]} />
        <h2 className="nhan-muc mb-3 mt-9">Theo kênh đăng</h2>
        <Bang duLieu={bc.theoKenh} khoa={(r) => r.kenh} trong="Chưa ghi bài đăng nào." cot={[{ nhan: "Kênh", chinh: true, hienThi: (r) => r.kenh }, { nhan: "Số bài", phai: true, hienThi: (r) => String(r.soBai) }, { nhan: "Chi phí", phai: true, hienThi: (r) => (r.chiPhi ? tienVN(r.chiPhi) : "") }]} />
      </>
    );
  }
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Tuyển dụng" phu="Yêu cầu tuyển, tin tuyển dụng, ứng viên theo bước, bài đăng theo kênh và báo cáo chi phí.">{nutThem}</TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/nhan-su/tuyen-dung" />
      {noiDung}
    </div>
  );
}
