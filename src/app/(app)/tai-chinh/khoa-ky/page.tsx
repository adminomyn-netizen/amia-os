import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayGioVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { khoaKy, moLaiKy } from "./actions";

/** 6 tháng gần nhất đã kết thúc (không gồm tháng hiện tại). */
function cacThang(hom: string) {
  const [n, t] = hom.split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => { const x = new Date(Date.UTC(n, t - 2 - i, 1)); return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}`; });
}
const nhanThang = (t: string) => `${t.slice(5)}/${t.slice(0, 4)}`;

export default async function TrangKhoaKy() {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "ky.khoa") && !coQuyen(nd, "ky.mo_lai")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem khoá kỳ.</p>;
  const khoa = coQuyen(nd, "ky.khoa"), mo = coQuyen(nd, "ky.mo_lai");
  const db = sb(), hom = homNayHCM();
  const [{ data: ky }, { data: nk }, { data: nv }, kk, ck, xl, xk, dx, luong] = await Promise.all([
    db.from("ky_ke_toan").select("*"), db.from("ky_ke_toan_nhat_ky").select("*").order("id", { ascending: false }).limit(30), db.from("nhan_vien").select("id, ho_ten"),
    db.from("phieu_kiem_ke").select("id", { count: "exact", head: true }).in("trang_thai", ["dang_dem", "cho_duyet"]),
    db.from("phieu_chuyen_kho").select("id", { count: "exact", head: true }).in("trang_thai", ["dang_chuyen", "cho_xu_ly_chenh_lech"]),
    db.from("xu_ly_vat_tu").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet"),
    db.from("phieu_xuat_khan").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_hau_kiem"),
    db.from("de_xuat").select("id", { count: "exact", head: true }).eq("trang_thai", "da_duyet").neq("loai", "mua_sam"),
    db.from("ky_luong").select("nam, thang, trang_thai").neq("trang_thai", "da_chi"),
  ]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten])), kyMap = new Map((ky ?? []).map((k) => [k.thang, k]));
  const luongChua = new Set((luong.data ?? []).map((l) => `${l.nam}-${String(l.thang).padStart(2, "0")}`));
  const viec: { nhan: string; so: number; href: string }[] = [
    { nhan: "phiếu kiểm kê chưa duyệt", so: kk.count ?? 0, href: "/kho/kiem-ke" }, { nhan: "phiếu chuyển kho chưa xong", so: ck.count ?? 0, href: "/kho/chuyen-kho" },
    { nhan: "phiếu xử lý vật tư chờ duyệt", so: xl.count ?? 0, href: "/kho/xu-ly" }, { nhan: "phiếu xuất khẩn chờ hậu kiểm", so: xk.count ?? 0, href: "/kho/xu-ly?tab=xuat-khan" },
    { nhan: "đề xuất chi đã duyệt nhưng chưa chi", so: dx.count ?? 0, href: "/noi-lam-viec/phe-duyet" },
  ].filter((v) => v.so > 0);
  const dong = cacThang(hom).map((t) => ({ thang: t, ky: kyMap.get(t) }));
  const [ny, nt] = hom.split("-").map(Number);
  const hanBaoCao = congNgay(`${nt === 12 ? ny + 1 : ny}-${String(nt === 12 ? 1 : nt + 1).padStart(2, "0")}-01`, 6);
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính" }} tieuDe="Khoá kỳ kế toán" phu="Khoá một tháng đã kết thúc thì không ghi thêm được sổ quỹ và công nợ nhà cung cấp của tháng đó. Chứng từ đến muộn: ghi vào kỳ sau, hoặc mở lại kỳ có lý do (để lại dấu vết)." />
      <div className="mb-5 rounded-the border border-vien bg-nen-2 px-4 py-3 text-[13.5px]">
        <div className="mb-1 font-medium text-muc">Rà trước khi khoá</div>
        {viec.length === 0 ? <div className="text-muc-3">Không có việc nào đang treo. Vẫn nên đối chiếu quỹ, ngân hàng và công nợ với người xác nhận độc lập.</div> : <ul className="list-disc pl-5 text-muc-2">{viec.map((v) => <li key={v.nhan}><Link href={v.href} className="text-nhan-dam hover:underline">{v.so} {v.nhan}</Link></li>)}</ul>}
        <div className="mt-2 text-muc-3">Mốc của kỳ này: kiểm kê và khoá kho ngày cuối tháng; đối soát doanh thu, quỹ, ngân hàng trước ngày làm việc thứ 2; chốt công nợ và lương trước thứ 5; khoá kỳ cuối ngày làm việc thứ 6 (khoảng {hanBaoCao.split("-").reverse().join("/")} cho tháng này).</div>
      </div>
      <Bang noi duLieu={dong} khoa={(r) => r.thang} trong=""
        cot={[
          { nhan: "Tháng", chinh: true, hienThi: (r) => nhanThang(r.thang) },
          { nhan: "Trạng thái", hienThi: (r) => (r.ky?.trang_thai === "da_khoa" ? <NhanTrangThai kieu="tot">Đã khoá</NhanTrangThai> : r.ky ? <NhanTrangThai kieu="cho">Đang mở lại</NhanTrangThai> : <NhanTrangThai kieu="tram">Chưa khoá</NhanTrangThai>) },
          { nhan: "Ghi chú", hienThi: (r) => <div>{r.ky?.khoa_boi && <div>Khoá bởi {ten.get(r.ky.khoa_boi)} lúc {ngayGioVN(r.ky.khoa_luc)}</div>}{r.ky?.trang_thai === "mo_lai" && <div className="text-canh-bao">Mở lại: {r.ky.ly_do_mo_lai}</div>}{luongChua.has(r.thang) && <div className="text-[12.5px] text-canh-bao">Kỳ lương tháng này chưa chi</div>}</div> },
          { nhan: "", hienThi: (r) => (
            <div className="flex justify-end gap-2">
              {khoa && (!r.ky || r.ky.trang_thai === "mo_lai") && <NutHop kieu="chu" nhan={r.ky ? "Khoá lại" : "Khoá kỳ"} tieuDe={`Khoá tháng ${nhanThang(r.thang)}`} moTa="Sau khi khoá, sổ quỹ và công nợ nhà cung cấp của tháng này không ghi thêm được." truong={[{ ten: "ghi_chu", nhan: "Ghi chú (ngoại lệ còn tồn nếu có)", loai: "nhieu_dong", rong: true }]} action={khoaKy} an={{ thang: r.thang }} nhanLuu="Khoá" />}
              {mo && r.ky?.trang_thai === "da_khoa" && <NutHop kieu="chu" nguy nhan="Mở lại kỳ" tieuDe={`Mở lại tháng ${nhanThang(r.thang)}`} moTa="Chỉ mở khi chứng từ muộn ảnh hưởng đến số đã chốt. Lý do được lưu cùng người thực hiện." truong={[{ ten: "ly_do", nhan: "Lý do mở lại", loai: "nhieu_dong", batBuoc: true, rong: true }]} action={moLaiKy} an={{ thang: r.thang }} nhanLuu="Mở lại" />}
            </div>
          ) },
        ]} />
      <h2 className="mb-2 mt-8 text-[15px] font-semibold">Nhật ký khoá / mở kỳ</h2>
      <Bang noi duLieu={nk ?? []} khoa={(r) => String(r.id)} trong="Chưa có thao tác nào."
        cot={[
          { nhan: "Lúc", hienThi: (r) => ngayGioVN(r.luc) }, { nhan: "Tháng", hienThi: (r) => nhanThang(r.thang) },
          { nhan: "Việc", hienThi: (r) => ({ khoa: "Khoá kỳ", mo_lai: "Mở lại kỳ", khoa_lai: "Khoá lại" } as Record<string, string>)[r.hanh_dong] },
          { nhan: "Người làm", hienThi: (r) => ten.get(r.nguoi_id) ?? "" }, { nhan: "Lý do / ghi chú", hienThi: (r) => r.ly_do ?? "" },
        ]} />
    </div>
  );
}
