import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { dsNvTrongPham } from "@/lib/hr-pham-vi";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { danhDauBanGiao, luuChotNghiViec, luuPhongVanThoiViec } from "./actions";

const TAB = [{ ma: "ban-giao", ten: "Checklist bàn giao", quyen: "hr.hoso" }, { ma: "chot", ten: "Chốt công, lương, BHXH", quyen: "luong.xem" }, { ma: "phong-van", ten: "Phỏng vấn thôi việc", quyen: "hr.hoso" }] as const;

export default async function TrangOffboarding({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const duoc = TAB.filter((t) => coQuyen(nd, t.quyen));
  if (!duoc.length) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem offboarding.</p>;
  const yc = (await searchParams).tab;
  const tab = (duoc.find((t) => t.ma === yc) ?? duoc[0]).ma;
  const db = sb(), hom = homNayHCM();
  const nv = await dsNvTrongPham(nd.chiNhanhId, false);
  const ten = new Map(nv.map((n) => [n.id, n]));
  const ids = nv.map((n) => n.id);
  const { data: dd } = ids.length ? await db.from("nghi_viec").select("id, nhan_vien_id, ngay_lam_cuoi, trang_thai").in("nhan_vien_id", ids).in("trang_thai", ["cho_duyet", "da_duyet", "hoan_tat"]).order("ngay_lam_cuoi", { ascending: false }).limit(200) : { data: [] };
  const don = dd ?? [], donIds = don.map((d) => d.id);
  const KHONG = ["00000000-0000-0000-0000-000000000000"];
  let noiDung: React.ReactNode;
  if (tab === "ban-giao") {
    const [{ data: muc }, { data: td }] = await Promise.all([db.from("ban_giao_muc").select("*").eq("hoat_dong", true).order("thu_tu"), db.from("ban_giao_tien_do").select("nghi_viec_id, muc_id").in("nghi_viec_id", donIds.length ? donIds : KHONG)]);
    const xong = new Set((td ?? []).map((t) => `${t.nghi_viec_id}|${t.muc_id}`)), sua = coQuyen(nd, "hr.hoso");
    noiDung = don.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có đơn nghỉ việc nào cần bàn giao.</p> : (
      <div className="space-y-4">
        {don.map((d) => {
          const so = (muc ?? []).filter((m) => xong.has(`${d.id}|${m.id}`)).length;
          return (
            <section key={d.id} className="rounded-the border border-vien p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div><span className="font-medium">{ten.get(d.nhan_vien_id)?.ho_ten}</span> <span className="text-[12.5px] text-muc-3">làm đến {ngayVN(d.ngay_lam_cuoi)}{d.ngay_lam_cuoi < hom && so < (muc ?? []).length ? " · đã quá ngày mà chưa bàn giao xong" : ""}</span></div>
                <NhanTrangThai kieu={so === (muc ?? []).length ? "tot" : "cho"}>{so}/{(muc ?? []).length} mục</NhanTrangThai>
              </div>
              <ul className="divide-y divide-vien text-[14px]">
                {(muc ?? []).map((m) => {
                  const da = xong.has(`${d.id}|${m.id}`);
                  return (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className={da ? "text-muc-3 line-through" : ""}>{m.ten}</span>
                      {sua && <NutNhanh nhan={da ? "Bỏ đánh dấu" : "Xong"} action={danhDauBanGiao} du={{ nghi_viec_id: d.id, muc_id: m.id, huy: da ? "1" : "" }} />}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    );
  } else if (tab === "chot") {
    const { data: ch } = await db.from("chot_nghi_viec").select("*").in("nghi_viec_id", donIds.length ? donIds : KHONG);
    const theo = new Map((ch ?? []).map((c) => [c.nghi_viec_id, c])), sua = coQuyen(nd, "luong.sua");
    const truong: Truong[] = [
      { ten: "cong_den_ngay", nhan: "Chốt công đến ngày", loai: "ngay" }, { ten: "luong_con_lai", nhan: "Lương còn lại phải trả", loai: "tien" }, { ten: "tien_phep_con", nhan: "Tiền phép còn lại", loai: "tien" },
      { ten: "bhxh_chot_den", nhan: "Đóng BHXH đến ngày", loai: "ngay" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true }, { ten: "chot", nhan: "Chốt luôn (chốt xong không sửa nữa)", loai: "gat" },
    ];
    noiDung = (
      <Bang noi duLieu={don} khoa={(r) => r.id} trong="Chưa có đơn nghỉ việc nào."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{ten.get(r.nhan_vien_id)?.ho_ten}<div className="text-[12.5px] text-muc-3">làm đến {ngayVN(r.ngay_lam_cuoi)}</div></div> },
          { nhan: "Công đến", hienThi: (r) => { const c = theo.get(r.id); return c?.cong_den_ngay ? ngayVN(c.cong_den_ngay) : "—"; } },
          { nhan: "Lương còn lại", phai: true, hienThi: (r) => { const c = theo.get(r.id); return c?.luong_con_lai == null ? "—" : tienVN(c.luong_con_lai); } },
          { nhan: "Tiền phép", phai: true, hienThi: (r) => { const c = theo.get(r.id); return c?.tien_phep_con == null ? "—" : tienVN(c.tien_phep_con); } },
          { nhan: "BHXH đến", hienThi: (r) => { const c = theo.get(r.id); return c?.bhxh_chot_den ? ngayVN(c.bhxh_chot_den) : "—"; } },
          { nhan: "Trạng thái", hienThi: (r) => (theo.get(r.id)?.chot_luc ? <NhanTrangThai kieu="tot">Đã chốt</NhanTrangThai> : <NhanTrangThai kieu="cho">Chưa chốt</NhanTrangThai>) },
          { nhan: "", hienThi: (r) => { const c = theo.get(r.id); return sua && !c?.chot_luc ? <NutHop kieu="chu" nhan="Nhập, chốt" tieuDe="Chốt công, lương, BHXH" truong={truong} action={luuChotNghiViec} an={{ nghi_viec_id: r.id }} giaTri={{ cong_den_ngay: c?.cong_den_ngay ?? r.ngay_lam_cuoi, luong_con_lai: c?.luong_con_lai == null ? "" : String(c.luong_con_lai), tien_phep_con: c?.tien_phep_con == null ? "" : String(c.tien_phep_con), bhxh_chot_den: c?.bhxh_chot_den ?? "", ghi_chu: c?.ghi_chu ?? "" }} /> : null; } },
        ]} />
    );
  } else {
    const { data: pv } = await db.from("phong_van_thoi_viec").select("*").in("nghi_viec_id", donIds.length ? donIds : KHONG);
    const theo = new Map((pv ?? []).map((p) => [p.nghi_viec_id, p])), sua = coQuyen(nd, "hr.hoso");
    const truong: Truong[] = [
      { ten: "ngay_pv", nhan: "Ngày phỏng vấn", loai: "ngay", batBuoc: true }, { ten: "co_the_quay_lai", nhan: "Có thể quay lại không", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa rõ" }, { gia_tri: "1", nhan: "Có" }, { gia_tri: "0", nhan: "Không" }] },
      { ten: "ly_do_chinh", nhan: "Lý do chính", loai: "nhieu_dong", rong: true }, { ten: "dieu_hai_long", nhan: "Điều hài lòng", loai: "nhieu_dong", rong: true },
      { ten: "dieu_chua_hai_long", nhan: "Điều chưa hài lòng", loai: "nhieu_dong", rong: true }, { ten: "de_xuat", nhan: "Đề xuất với công ty", loai: "nhieu_dong", rong: true },
    ];
    noiDung = (
      <Bang noi duLieu={don} khoa={(r) => r.id} trong="Chưa có đơn nghỉ việc nào."
        cot={[
          { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{ten.get(r.nhan_vien_id)?.ho_ten}<div className="text-[12.5px] text-muc-3">làm đến {ngayVN(r.ngay_lam_cuoi)}</div></div> },
          { nhan: "Phỏng vấn", hienThi: (r) => { const p = theo.get(r.id); return p ? <div className="text-[13px]">{ngayVN(p.ngay_pv)}<div className="text-muc-3">{p.ly_do_chinh ?? ""}</div></div> : <NhanTrangThai kieu="cho">Chưa phỏng vấn</NhanTrangThai>; } },
          { nhan: "Quay lại", hienThi: (r) => { const p = theo.get(r.id); return p?.co_the_quay_lai == null ? "—" : p.co_the_quay_lai ? "Có" : "Không"; } },
          { nhan: "", hienThi: (r) => { const p = theo.get(r.id); return sua ? <NutHop kieu="chu" nhan={p ? "Sửa" : "Ghi phỏng vấn"} tieuDe="Phỏng vấn thôi việc" truong={truong} action={luuPhongVanThoiViec} an={{ nghi_viec_id: r.id }} giaTri={{ ngay_pv: p?.ngay_pv ?? hom, co_the_quay_lai: p?.co_the_quay_lai == null ? "" : p.co_the_quay_lai ? "1" : "0", ly_do_chinh: p?.ly_do_chinh ?? "", dieu_hai_long: p?.dieu_hai_long ?? "", dieu_chua_hai_long: p?.dieu_chua_hai_long ?? "", de_xuat: p?.de_xuat ?? "" }} /> : null; } },
        ]} />
    );
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/nhan-su", nhan: "Nhân sự" }} tieuDe="Offboarding" phu="Bàn giao, chốt công lương BHXH và phỏng vấn thôi việc cho người đã gửi đơn nghỉ. Đơn nghỉ việc xử lý ở trang Nghỉ việc." />
      <nav aria-label="Offboarding" className="mb-5 flex flex-wrap gap-2">
        {duoc.map((t) => <Link key={t.ma} href={`/nhan-su/offboarding?tab=${t.ma}`} aria-current={t.ma === tab ? "page" : undefined} className={`rounded-nho border px-3.5 py-2 text-[14px] ${t.ma === tab ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>)}
      </nav>
      {noiDung}
    </div>
  );
}
