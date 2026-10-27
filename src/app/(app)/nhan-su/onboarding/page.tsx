import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { danhDauOnboarding } from "./actions";

export default async function TrangOnboarding() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "cong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem onboarding.</p>;
  const sua = coQuyen(nd, "cong.sua");
  const db = sb(), hom = homNayHCM();
  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, ngay_vao_lam, ngay_vao_chinh_thuc, chi_nhanh_id").eq("hoat_dong", true).not("ngay_vao_lam", "is", null).gte("ngay_vao_lam", congNgay(hom, -90)).order("ngay_vao_lam", { ascending: false });
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: nv }, { data: muc }, { data: td }] = await Promise.all([qn, db.from("onboarding_muc").select("*").eq("hoat_dong", true).order("thu_tu"), db.from("onboarding_tien_do").select("*")]);
  const xong = new Set((td ?? []).map((t) => `${t.nhan_vien_id}|${t.muc_id}`));
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Onboarding thử việc" phu="Nhân viên vào làm trong 90 ngày gần đây. Các mốc tính từ ngày vào làm; mốc quá hạn chưa xong hiện màu cảnh báo. Đánh giá 60 ngày xong thì thêm HĐLĐ lần 1 ở trang Hợp đồng lao động." />
      {(nv ?? []).length === 0 && <p className="text-[14px] text-muc-3">Không có nhân viên mới trong 90 ngày gần đây.</p>}
      <div className="space-y-4">
        {(nv ?? []).map((n) => {
          const so = (muc ?? []).filter((m) => xong.has(`${n.id}|${m.id}`)).length;
          return (
            <section key={n.id} className="rounded-the border border-vien p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div><span className="font-medium">{n.ho_ten}</span> <span className="text-[12.5px] text-muc-3">{n.ma_nv} · vào làm {ngayVN(n.ngay_vao_lam)}{n.ngay_vao_chinh_thuc && ` · chính thức ${ngayVN(n.ngay_vao_chinh_thuc)}`}</span></div>
                <NhanTrangThai kieu={so === (muc ?? []).length ? "tot" : "cho"}>{so}/{(muc ?? []).length} mốc</NhanTrangThai>
              </div>
              <ul className="divide-y divide-vien text-[14px]">
                {(muc ?? []).map((m) => {
                  const han = congNgay(n.ngay_vao_lam!, m.sau_ngay), da = xong.has(`${n.id}|${m.id}`), tre = !da && han < hom;
                  return (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className={da ? "text-muc-3 line-through" : ""}>{m.ten}</span>
                      <span className="flex items-center gap-3"><span className={`text-[12.5px] ${tre ? "text-canh-bao" : "text-muc-3"}`}>{da ? "Đã xong" : `Hạn ${ngayVN(han)}${tre ? " · quá hạn" : ""}`}</span>
                        {sua && (da ? <NutNhanh nhan="Bỏ đánh dấu" action={danhDauOnboarding} du={{ nhan_vien_id: n.id, muc_id: m.id, huy: "1" }} /> : <NutNhanh nhan="Xong" action={danhDauOnboarding} du={{ nhan_vien_id: n.id, muc_id: m.id }} />)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
