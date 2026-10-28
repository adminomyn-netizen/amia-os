import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { GioLamViec } from "@/components/cai-dat/GioLamViec";
import { gioBaThu, tomTatGio } from "@/lib/gio-lam-viec";
import { luuGioLamViec } from "./actions";

/** Giờ làm việc theo từng chi nhánh. Tự thiết kế, chưa đối chiếu SalonHero (tài khoản dùng để đối chiếu không có quyền vào #/settingWorkingHours). */
export default async function TrangGioLamViec() {
  const nd = await yeuCauQuyen("danhmuc.xem");
  const sua = coQuyen(nd, "hethong.phanquyen");
  const db = sb();
  const [{ data: cn }, { data: ch }] = await Promise.all([db.from("chi_nhanh").select("id, ten, gio_lam_viec, hien_dat_lich").eq("hoat_dong", true).order("thu_tu").order("ma"), db.from("cua_hang").select("gio_lam_viec").eq("id", 1).maybeSingle()]);
  const chung = tomTatGio(gioBaThu(null, ch?.gio_lam_viec));
  return (
    <div>
      <Link href="/cai-dat" className="text-[13px] text-muc-3 hover:text-muc">← Cài đặt</Link>
      <TieuDeTrang tieuDe="Giờ làm việc" phu="Giờ mở cửa và ngày nghỉ của từng chi nhánh. Khách đặt lịch online chỉ thấy giờ nằm trong khung này." />
      <p className="mb-5 max-w-3xl text-[13.5px] leading-relaxed text-muc-3">Giờ chung của cơ sở (sửa ở Thông tin chung): {chung}. Chi nhánh chưa chỉnh riêng sẽ dùng giờ chung. Giờ này dùng để tính khung giờ trống ở trang đặt lịch online; lưới Lịch hẹn của nhân viên vẫn hiện đủ ngày, không bị chặn theo giờ này.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {(cn ?? []).map((c) => (
          <section key={c.id} aria-labelledby={`gio-${c.id}`} className="the-noi the-noi-thap p-4 sm:p-5">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`gio-${c.id}`} className="text-[16px] font-semibold text-muc">{c.ten}</h2>
              <span className="text-[12.5px] text-muc-3">{c.gio_lam_viec ? "Giờ riêng" : "Đang dùng giờ chung"}</span>
            </div>
            <GioLamViec chiNhanhId={c.id} dau={gioBaThu(c.gio_lam_viec, ch?.gio_lam_viec)} dungChung={!c.gio_lam_viec} sua={sua} luu={luuGioLamViec} />
          </section>
        ))}
      </div>
      {(cn ?? []).length === 0 && <p className="py-10 text-center text-muc-3">Chưa có chi nhánh nào đang hoạt động.</p>}
    </div>
  );
}
