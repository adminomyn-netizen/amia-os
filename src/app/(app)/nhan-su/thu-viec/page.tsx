import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { luaChonNv } from "@/lib/hr-pham-vi";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuDanhGiaThuViec, luuMucTieuThuViec, xoaMucTieuThuViec } from "./actions";

const TAB = [{ ma: "muc-tieu", ten: "Mục tiêu thử việc" }, { ma: "danh-gia", ten: "Đánh giá thử việc" }] as const;
const KQ = { chua: { ten: "Chưa xong", kieu: "tram" }, dat: { ten: "Đạt", kieu: "tot" }, chua_dat: { ten: "Chưa đạt", kieu: "cho" } } as const;
const VAI = [{ gia_tri: "mentor", nhan: "Mentor" }, { gia_tri: "quan_ly", nhan: "Quản lý" }, { gia_tri: "nhan_su", nhan: "Nhân sự" }];
const QD = { len_chinh_thuc: "Lên chính thức", gia_han: "Gia hạn thử việc", khong_dat: "Không đạt" } as const;

export default async function TrangThuViec({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  if (!coQuyen(nd, "hr.hoso")) return <p className="text-[14px] text-muc-3">Bạn không có quyền xem thử việc.</p>;
  const yc = (await searchParams).tab;
  const tab = TAB.find((t) => t.ma === yc)?.ma ?? "muc-tieu";
  const db = sb();
  // Người đang thử việc = còn làm, chưa có ngày chính thức; vẫn hiện người đã có mục tiêu/đánh giá để xem lại.
  let qn = db.from("nhan_vien").select("id, ho_ten, ma_nv, ngay_vao_lam, ngay_vao_chinh_thuc, hoat_dong").order("ho_ten");
  if (nd.chiNhanhId) qn = qn.eq("chi_nhanh_id", nd.chiNhanhId);
  const { data: tatCa } = await qn;
  const nv = tatCa ?? [], ten = new Map(nv.map((n) => [n.id, n]));
  const thu = nv.filter((n) => n.hoat_dong && n.ngay_vao_lam && !n.ngay_vao_chinh_thuc);
  const ids = nv.map((n) => n.id);
  const lcNv = luaChonNv(thu);
  const lcMoc = [{ gia_tri: "30", nhan: "Mốc 30 ngày" }, { gia_tri: "60", nhan: "Mốc 60 ngày" }];
  let noiDung: React.ReactNode;
  if (tab === "muc-tieu") {
    const { data: mt } = ids.length ? await db.from("thu_viec_muc_tieu").select("*").in("nhan_vien_id", ids).order("tao_luc", { ascending: false }).limit(500) : { data: [] };
    const truong: Truong[] = [
      { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: lcNv, rong: true }, { ten: "moc", nhan: "Mốc", loai: "chon", batBuoc: true, luaChon: lcMoc },
      { ten: "ket_qua", nhan: "Kết quả", loai: "chon", luaChon: Object.entries(KQ).map(([gia_tri, v]) => ({ gia_tri, nhan: v.ten })) },
      { ten: "noi_dung", nhan: "Mục tiêu", loai: "nhieu_dong", batBuoc: true, rong: true }, { ten: "tieu_chi", nhan: "Tiêu chí đạt", loai: "nhieu_dong", rong: true },
    ];
    noiDung = (
      <>
        <div className="mb-3 flex justify-end"><NutHop nhan="Thêm mục tiêu" tieuDe="Thêm mục tiêu thử việc" truong={truong} action={luuMucTieuThuViec} giaTri={{ moc: "30", ket_qua: "chua" }} /></div>
        <Bang duLieu={mt ?? []} khoa={(r) => r.id} trong="Chưa có mục tiêu thử việc nào."
          cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => ten.get(r.nhan_vien_id)?.ho_ten },
            { nhan: "Mốc", hienThi: (r) => `${r.moc} ngày` },
            { nhan: "Mục tiêu", hienThi: (r) => <div className="text-[13px]">{r.noi_dung}{r.tieu_chi && <div className="text-muc-3">Tiêu chí: {r.tieu_chi}</div>}</div> },
            { nhan: "Kết quả", hienThi: (r) => <NhanTrangThai kieu={KQ[r.ket_qua as keyof typeof KQ].kieu}>{KQ[r.ket_qua as keyof typeof KQ].ten}</NhanTrangThai> },
            { nhan: "", hienThi: (r) => <span className="flex items-center gap-3">
              <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa mục tiêu" truong={truong.map((t) => (t.ten === "nhan_vien_id" ? { ...t, luaChon: luaChonNv(nv) } : t))} action={luuMucTieuThuViec} an={{ id: r.id }} giaTri={{ id: r.id, nhan_vien_id: r.nhan_vien_id, moc: String(r.moc), ket_qua: r.ket_qua, noi_dung: r.noi_dung, tieu_chi: r.tieu_chi ?? "" }} />
              <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá mục tiêu" xacNhan="Xoá mục tiêu này?" action={xoaMucTieuThuViec} an={{ id: r.id }} nhanLuu="Xoá" />
            </span> },
          ]} />
      </>
    );
  } else {
    const { data: dg } = ids.length ? await db.from("thu_viec_danh_gia").select("*").in("nhan_vien_id", ids) : { data: [] };
    const dong = thu.flatMap((n) => [30, 60].map((moc) => ({ n, moc, ds: (dg ?? []).filter((d) => d.nhan_vien_id === n.id && d.moc === moc) })));
    const truong: Truong[] = [
      { ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: lcNv, rong: true }, { ten: "moc", nhan: "Mốc", loai: "chon", batBuoc: true, luaChon: lcMoc },
      { ten: "vai", nhan: "Vai đánh giá", loai: "chon", batBuoc: true, luaChon: VAI }, { ten: "diem", nhan: "Điểm (1 đến 5)", loai: "so", batBuoc: true },
      { ten: "quyet_dinh", nhan: "Quyết định (chỉ vai Nhân sự)", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Chưa quyết" }, ...Object.entries(QD).map(([gia_tri, nhan]) => ({ gia_tri, nhan }))] },
      { ten: "nhan_xet", nhan: "Nhận xét", loai: "nhieu_dong", rong: true },
    ];
    noiDung = (
      <>
        <p className="mb-3 text-[13px] text-muc-3">Mentor, quản lý, nhân sự mỗi người đánh giá ở mốc 30 và 60 ngày. Quyết định lên chính thức xong thì thêm HĐLĐ lần 1 ở trang Hợp đồng để ghi ngày chính thức.</p>
        <div className="mb-3 flex justify-end"><NutHop nhan="Đánh giá" tieuDe="Đánh giá thử việc" truong={truong} action={luuDanhGiaThuViec} giaTri={{ moc: "30", vai: "quan_ly", diem: "3" }} /></div>
        <Bang duLieu={dong} khoa={(r) => `${r.n.id}-${r.moc}`} trong="Không có ai đang thử việc."
          cot={[
            { nhan: "Nhân viên", chinh: true, hienThi: (r) => <div>{r.n.ho_ten}<div className="text-[12.5px] text-muc-3">Vào làm {ngayVN(r.n.ngay_vao_lam)}</div></div> },
            { nhan: "Mốc", hienThi: (r) => `${r.moc} ngày` },
            { nhan: "Điểm", hienThi: (r) => (r.ds.length ? <div className="text-[13px]">{r.ds.map((d) => <div key={d.vai}>{VAI.find((v) => v.gia_tri === d.vai)?.nhan}: {d.diem}/5</div>)}</div> : <span className="text-muc-3">Chưa có</span>) },
            { nhan: "Quyết định", hienThi: (r) => { const q = r.ds.find((d) => d.quyet_dinh)?.quyet_dinh as keyof typeof QD | undefined; return q ? <NhanTrangThai kieu={q === "len_chinh_thuc" ? "tot" : q === "gia_han" ? "cho" : "loi"}>{QD[q]}</NhanTrangThai> : ""; } },
          ]} />
      </>
    );
  }
  return (
    <div>
      <Link href="/nhan-su" className="text-[13px] text-muc-3 hover:text-muc">← Nhân sự</Link>
      <TieuDeTrang tieuDe="Thử việc" phu="Mục tiêu 30 và 60 ngày thống nhất với quản lý; đánh giá của mentor, quản lý, nhân sự ở từng mốc." />
      <nav aria-label="Thử việc" className="mb-5 flex flex-wrap gap-2">
        {TAB.map((t) => <Link key={t.ma} href={`/nhan-su/thu-viec?tab=${t.ma}`} aria-current={t.ma === tab ? "page" : undefined} className={`rounded-nho border px-3.5 py-2 text-[14px] ${t.ma === tab ? "border-transparent bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t.ten}</Link>)}
      </nav>
      {noiDung}
    </div>
  );
}
