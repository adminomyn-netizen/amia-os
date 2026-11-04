import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { BIEN_MAU } from "@/lib/email-tuyen-dung";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { guiThuTrongHangDoi, huyThuTrongHangDoi, ketNoiGmail, luuMauThu, ngatGmail } from "./actions";

const TT = { cho_gui: { ten: "Chờ gửi", kieu: "cho" }, da_gui: { ten: "Đã gửi", kieu: "tot" }, loi: { ten: "Lỗi", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" } } as const;

/** Email tự động trong tuyển dụng: ứng viên sang bước có mẫu thư thì thư được xếp vào hàng đợi; mẫu bật "tự gửi" và đã kết nối Gmail thì gửi luôn. */
export default async function TrangEmailTuyenDung() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem email tuyển dụng.</p>;
  const db = sb(), toanCty = !nd.chiNhanhId;
  const [{ data: kn }, { data: mau }, { data: hd }] = await Promise.all([
    db.from("thu_ket_noi").select("email, sua_luc").eq("id", true).maybeSingle(),
    db.from("tuyen_dung_mau_thu").select("*").order("sua_luc"),
    db.from("tuyen_dung_hang_doi_thu").select("id, ung_vien_id, mau_ma, den_email, tieu_de, noi_dung, trang_thai, loi, tao_luc, gui_luc").order("tao_luc", { ascending: false }).limit(200),
  ]);
  // Người gắn chi nhánh chỉ thấy thư của ứng viên thuộc tin tuyển của chi nhánh mình.
  let ds = hd ?? [];
  if (nd.chiNhanhId) {
    const ids = [...new Set(ds.map((t) => t.ung_vien_id).filter(Boolean))] as string[];
    const { data: uv } = ids.length ? await db.from("ung_vien").select("id, tin_id").in("id", ids) : { data: [] };
    const { data: tins } = await db.from("tin_tuyen_dung").select("id, chi_nhanh_id").eq("chi_nhanh_id", nd.chiNhanhId);
    const tinOk = new Set((tins ?? []).map((t) => t.id)), uvOk = new Set((uv ?? []).filter((u) => tinOk.has(u.tin_id)).map((u) => u.id));
    ds = ds.filter((t) => t.ung_vien_id && uvOk.has(t.ung_vien_id));
  }
  const tenMau = new Map((mau ?? []).map((m) => [m.ma, m.ten]));
  const truongMau: Truong[] = [
    { ten: "tieu_de", nhan: "Tiêu đề thư", loai: "chu", batBuoc: true, rong: true }, { ten: "noi_dung", nhan: "Nội dung", loai: "nhieu_dong", batBuoc: true, rong: true, ghiChu: `Biến dùng được: ${BIEN_MAU.map((b) => `{{${b}}}`).join(" ")}` },
    { ten: "tu_gui", nhan: "Tự gửi khi ứng viên sang bước này (cần đã kết nối Gmail)", loai: "gat" }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" },
  ];
  const truongGmail: Truong[] = [
    { ten: "email", nhan: "Địa chỉ Gmail gửi thư", loai: "email", batBuoc: true, rong: true },
    { ten: "mat_khau", nhan: "Mật khẩu ứng dụng (16 ký tự)", loai: "mat_khau_an", batBuoc: true, rong: true, ghiChu: "Tạo ở tài khoản Google, mục Bảo mật, Mật khẩu ứng dụng (cần bật xác minh 2 bước). Không dùng mật khẩu đăng nhập Gmail." },
  ];
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su/tuyen-dung", nhan: "Tuyển dụng" }} tieuDe="Email tuyển dụng tự động" phu="Mỗi bước của ứng viên (nhận hồ sơ, mời phỏng vấn, đề nghị, nhận việc, cảm ơn) có một mẫu thư. Thư xếp vào hàng đợi; bật tự gửi thì gửi ngay qua Gmail đã kết nối." />
      <section className="the-noi the-noi-thap mb-8 p-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="nhan-muc">Kết nối Gmail</h2>
            <p className="mt-1 text-[14px]">{kn ? <>Đang gửi bằng <span className="font-medium">{kn.email}</span> <span className="text-muc-3">(nối lúc {ngayVN(kn.sua_luc)})</span></> : <span className="text-muc-3">Chưa kết nối. Chưa kết nối thì thư chỉ nằm trong hàng đợi.</span>}</p></div>
          {toanCty && <span className="flex items-center gap-3"><NutHop nhan={kn ? "Đổi tài khoản Gmail" : "Kết nối Gmail"} tieuDe="Kết nối Gmail" moTa="Mật khẩu ứng dụng được mã hoá trước khi lưu và không hiện lại." truong={truongGmail} action={ketNoiGmail} nhanLuu="Kết nối" />
            {kn && <NutHop kieu="chu" nguy nhan="Ngắt kết nối" tieuDe="Ngắt kết nối Gmail" xacNhan="Ngắt kết nối Gmail? Thư mới sẽ chỉ nằm trong hàng đợi." action={ngatGmail} nhanLuu="Ngắt" />}</span>}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="nhan-muc mb-3">Hàng đợi thư</h2>
        <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Chưa có thư nào. Thư xuất hiện khi ứng viên (có email) sang một bước có mẫu thư."
          cot={[
            { nhan: "Lúc", hienThi: (r) => ngayVN(r.tao_luc) }, { nhan: "Mẫu", hienThi: (r) => tenMau.get(r.mau_ma) ?? r.mau_ma },
            { nhan: "Gửi tới", chinh: true, hienThi: (r) => <div className="text-[13px]">{r.den_email}<div className="text-muc-3">{r.tieu_de}</div></div> },
            { nhan: "Trạng thái", hienThi: (r) => <div><NhanTrangThai kieu={TT[r.trang_thai as keyof typeof TT].kieu}>{TT[r.trang_thai as keyof typeof TT].ten}</NhanTrangThai>{r.loi && <div className="mt-1 text-[12px] text-loi">{r.loi}</div>}</div> },
            { nhan: "", hienThi: (r) => (["cho_gui", "loi"].includes(r.trang_thai) ? <span className="flex items-center gap-3"><NutNhanh nhan={r.trang_thai === "loi" ? "Gửi lại" : "Gửi ngay"} action={guiThuTrongHangDoi} du={{ id: r.id }} /><NutNhanh nhan="Huỷ" action={huyThuTrongHangDoi} du={{ id: r.id }} /></span> : null) },
          ]} />
      </section>
      <section>
        <h2 className="nhan-muc mb-3">Mẫu thư theo bước</h2>
        <Bang noi duLieu={mau ?? []} khoa={(r) => r.ma} cot={[
          { nhan: "Bước", hienThi: (r) => r.buoc }, { nhan: "Mẫu", chinh: true, hienThi: (r) => <div>{r.ten}<div className="text-[12.5px] text-muc-3">{r.tieu_de}</div></div> },
          { nhan: "Tự gửi", hienThi: (r) => (r.tu_gui ? <NhanTrangThai kieu="tot">Bật</NhanTrangThai> : <NhanTrangThai kieu="tram">Tắt</NhanTrangThai>) },
          { nhan: "", hienThi: (r) => (toanCty ? <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa mẫu: ${r.ten}`} truong={truongMau} action={luuMauThu} an={{ ma: r.ma }} giaTri={{ tieu_de: r.tieu_de, noi_dung: r.noi_dung, tu_gui: r.tu_gui ? "1" : "", hoat_dong: r.hoat_dong ? "1" : "" }} /> : null) },
        ]} />
      </section>
    </div>
  );
}
