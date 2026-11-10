import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { KhachChoLam } from "@/components/the/KhachChoLam";
import { docBuoiCho } from "@/lib/buoi-cho-lam";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";

/** Khách chờ làm: thu ngân / lễ tân chuyển khách cho chuyên viên trị liệu ở hộp Thực hiện buổi.
 *  Tab "Của tôi" = khách chuyển cho chính người đang xem; tab "Cả chi nhánh" = bảng theo dõi trong ngày cho thu ngân / quản lý. */
export default async function TrangKhachChoLam({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const thaoTacChung = coQuyen(nd, "ban.tao") || coQuyen(nd, "the.dieuchinh");
  const macDinh = ["ktv", "bac_si"].includes(nd.vaiTro) ? "toi" : "chi_nhanh";
  const tab = sp.tab === "toi" || sp.tab === "chi_nhanh" ? sp.tab : macDinh;
  const db = sb();
  const [ds, { data: nv }] = await Promise.all([
    docBuoiCho({ chiNhanhId: nd.chiNhanhId, ngay: homNay, ...(tab === "toi" ? { nvId: nd.nhanVienId } : {}) }),
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
  ]);
  const nvLC = luaChonNhanVien(nv ?? []);
  const bacSiLC = [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  const coThaoTac = coQuyen(nd, "the.thuchien") || coQuyen(nd, "ban.tao");
  const thaoTacIds = coThaoTac ? ds.filter((r) => thaoTacChung || r.nvIds.includes(nd.nhanVienId) || r.chuyenBoi === nd.nhanVienId).map((r) => r.id) : [];
  const mo = ds.filter((r) => r.trangThai === "cho_lam" || r.trangThai === "dang_lam"), dong = ds.filter((r) => !mo.includes(r));
  const dem = (t: string) => ds.filter((r) => r.trangThai === t).length;

  return (
    <>
      <TieuDeNoi tieuDe="Khách chờ làm" quayLai={{ href: "/the", nhan: "Thẻ liệu trình" }}
        phu={`Thu ngân bấm "Chuyển cho chuyên viên trị liệu" ở hộp Thực hiện buổi thì khách hiện ở đây. Chuyên viên bấm Bắt đầu làm, làm xong bấm Đã làm xong: lúc đó mới trừ 1 buổi, ghi doanh thu và ra phiếu vật tư. Hôm nay ${ngayVN(homNay)}.`} />
      <Tab goc="/the/cho-lam" dang={tab} muc={[{ ma: "toi", ten: "Của tôi" }, { ma: "chi_nhanh", ten: "Cả chi nhánh hôm nay" }]} />
      <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muc-3" aria-live="polite">
        <span>Chờ làm <b className="font-semibold text-canh-bao">{dem("cho_lam")}</b></span>
        <span>Đang làm <b className="font-semibold text-nhan-dam">{dem("dang_lam")}</b></span>
        <span>Đã làm xong <b className="font-semibold text-muc">{dem("xong")}</b></span>
        {dem("tra_lai") + dem("huy") > 0 && <span>Trả lại / không làm <b className="font-semibold text-loi">{dem("tra_lai") + dem("huy")}</b></span>}
      </p>
      <section aria-label="Khách đang chờ và đang làm" className="space-y-3">
        <KhachChoLam ds={mo} nhanVien={nvLC} bacSi={bacSiLC} thaoTacIds={thaoTacIds}
          trong={tab === "toi" ? "Chưa có khách nào chuyển cho bạn. Khi thu ngân chuyển, khách hiện ở đây và chuông thông báo sẽ báo." : "Chưa có khách nào đang chờ làm."} />
      </section>
      {dong.length > 0 && (
        <section aria-label="Đã xử lý hôm nay" className="mt-8 space-y-3">
          <h2 className="text-[15px] font-semibold text-muc">Đã xử lý hôm nay</h2>
          <KhachChoLam ds={dong} nhanVien={nvLC} bacSi={bacSiLC} thaoTacIds={[]} />
        </section>
      )}
    </>
  );
}
