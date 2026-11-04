import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { Bang } from "@/components/ui/Table";
import { danhDauOnboarding, luuMocOnboarding, xoaMocOnboarding } from "./actions";

export default async function TrangOnboarding() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "cong.xem")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem onboarding.</p>;
  const sua = coQuyen(nd, "cong.sua");
  const db = sb(), hom = homNayHCM();
  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, ngay_vao_lam, ngay_vao_chinh_thuc, chi_nhanh_id").eq("hoat_dong", true).not("ngay_vao_lam", "is", null).gte("ngay_vao_lam", congNgay(hom, -90)).order("ngay_vao_lam", { ascending: false });
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const [{ data: nv }, { data: muc }, { data: td }] = await Promise.all([qn, db.from("onboarding_muc").select("*").order("thu_tu"), db.from("onboarding_tien_do").select("*")]);
  const dsMoc = muc ?? [], mocDung = dsMoc.filter((m) => m.hoat_dong);
  const truongMoc: Truong[] = [{ ten: "ten", nhan: "Tên mốc", loai: "chu", batBuoc: true, rong: true }, { ten: "sau_ngay", nhan: "Số ngày sau ngày vào làm", loai: "so", batBuoc: true }];
  const xong = new Set((td ?? []).map((t) => `${t.nhan_vien_id}|${t.muc_id}`));
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Onboarding thử việc" phu="Nhân viên vào làm trong 90 ngày gần đây. Các mốc tính từ ngày vào làm; mốc quá hạn chưa xong hiện màu cảnh báo. Đánh giá 60 ngày xong thì thêm HĐLĐ lần 1 ở trang Hợp đồng lao động." />
      {(nv ?? []).length === 0 && <p className="text-[14px] text-muc-3">Không có nhân viên mới trong 90 ngày gần đây.</p>}
      <div className="space-y-4">
        {(nv ?? []).map((n) => {
          const so = mocDung.filter((m) => xong.has(`${n.id}|${m.id}`)).length;
          return (
            <section key={n.id} className="rounded-the border border-vien p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div><span className="font-medium">{n.ho_ten}</span> <span className="text-[12.5px] text-muc-3">{n.ma_nv} · vào làm {ngayVN(n.ngay_vao_lam)}{n.ngay_vao_chinh_thuc && ` · chính thức ${ngayVN(n.ngay_vao_chinh_thuc)}`}</span></div>
                <NhanTrangThai kieu={so === mocDung.length ? "tot" : "cho"}>{so}/{mocDung.length} mốc</NhanTrangThai>
              </div>
              <ul className="divide-y divide-vien text-[14px]">
                {mocDung.map((m) => {
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
      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="nhan-muc">Các mốc onboarding</h2>
          {sua && <NutHop nhan="Thêm mốc" tieuDe="Thêm mốc onboarding" truong={truongMoc} action={luuMocOnboarding} giaTri={{ sau_ngay: "0" }} />}
        </div>
        <Bang noi duLieu={dsMoc} khoa={(m) => m.id} trong="Chưa có mốc nào."
          cot={[
            { nhan: "Mốc", chinh: true, hienThi: (m) => <span className={m.hoat_dong ? "" : "text-muc-3 line-through"}>{m.ten}</span> },
            { nhan: "Sau ngày vào làm", phai: true, hienThi: (m) => `${m.sau_ngay} ngày` },
            { nhan: "Trạng thái", hienThi: (m) => <NhanTrangThai kieu={m.hoat_dong ? "tot" : "tram"}>{m.hoat_dong ? "Đang dùng" : "Đã tắt"}</NhanTrangThai> },
            { nhan: "", hienThi: (m) => (sua ? <span className="flex items-center gap-3">
              <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa mốc onboarding" truong={[...truongMoc, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" }]} action={luuMocOnboarding} an={{ id: m.id }} giaTri={{ ten: m.ten, sau_ngay: String(m.sau_ngay), hoat_dong: m.hoat_dong }} />
              <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá mốc" xacNhan="Xoá mốc này? Mốc đã có người đánh dấu xong thì chỉ tắt được." action={xoaMocOnboarding} an={{ id: m.id }} nhanLuu="Xoá" />
            </span> : null) },
          ]} />
      </section>
    </div>
  );
}
