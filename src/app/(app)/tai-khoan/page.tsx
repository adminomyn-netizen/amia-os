import { layNguoiDungDangNhap } from "@/lib/auth";
import { NHAN_VAI_TRO } from "@/lib/quyen";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NutHop } from "@/components/ui/BieuMau";
import { AnhDaiDien } from "@/components/layout/AnhDaiDien";
import { DoiAnhDaiDien } from "@/components/tai-khoan/DoiAnhDaiDien";
import { doiMatKhau } from "./actions";

export default async function TrangTaiKhoan({ searchParams }: { searchParams: Promise<{ "doi-mat-khau"?: string }> }) {
  const nd = await layNguoiDungDangNhap(true);
  const sp = await searchParams;
  return (
    <>
      <TieuDeNoi tieuDe="Tài khoản của tôi" phu={`${nd.hoTen} · ${NHAN_VAI_TRO[nd.vaiTro]}`} />
      {nd.phaiDoiMatKhau && (
        <p role="alert" className="the-noi-thap mb-6 max-w-2xl rounded-nho bg-canh-bao-nen px-4 py-3 text-[14px] text-canh-bao">
          {sp["doi-mat-khau"] ? "Tài khoản đang dùng mật khẩu do người khác đặt. Hãy đổi mật khẩu của riêng bạn trước khi dùng phần mềm." : "Bạn cần đổi mật khẩu mặc định."}
        </p>
      )}
      <div className="grid max-w-3xl gap-6 sm:grid-cols-[auto_1fr]">
        <section className="the-noi vao flex flex-col items-center gap-4 p-6 pt-8" aria-label="Ảnh đại diện">
          <AnhDaiDien hoTen={nd.hoTen} anh={nd.anhDaiDien} kichCo={112} />
          <DoiAnhDaiDien coAnh={!!nd.anhDaiDien} />
        </section>
        <section className="the-noi vao p-6 pt-8" style={{ animationDelay: "80ms" }} aria-label="Thông tin đăng nhập">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="border-b border-vien pb-3"><dt className="nhan-muc">Email đăng nhập</dt><dd className="mt-1 break-all text-[15px]">{nd.email}</dd></div>
            <div className="border-b border-vien pb-3"><dt className="nhan-muc">Vai trò</dt><dd className="mt-1 text-[15px]">{NHAN_VAI_TRO[nd.vaiTro]}</dd></div>
          </dl>
          <p className="mt-4 text-[13px] text-muc-3">Ai cũng tự đổi được mật khẩu của chính mình, không cần xin Kỹ thuật.</p>
          <div className="mt-4">
            <NutHop nhan="Đổi mật khẩu" tieuDe="Đổi mật khẩu" truong={[{ ten: "mat_khau_moi", nhan: "Mật khẩu mới (≥ 8 ký tự)", loai: "mat_khau_an", batBuoc: true, rong: true }]} action={doiMatKhau} />
          </div>
        </section>
      </div>
    </>
  );
}
