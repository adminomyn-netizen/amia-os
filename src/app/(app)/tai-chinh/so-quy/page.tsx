import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { boDau, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { TachQuyNganHang } from "@/components/ban-hang/TachQuyNganHang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { LocSoQuy } from "@/components/tai-chinh/LocSoQuy";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { chuyenQuy, daoPhieu, ghiNapRut, ghiThuChi, luuLoaiThuChi } from "./actions";

const TAB = [{ ma: "tien-mat", ten: "Sổ quỹ tiền mặt" }, { ma: "ngan-hang", ten: "Sổ quỹ ngân hàng" }, { ma: "loai", ten: "Phân loại thu/chi" }];
const NHAN_LOAI: Record<string, { ten: string; kieu: "tot" | "loi" | "cho" | "tram" }> = { thu: { ten: "Thu vào", kieu: "tot" }, chi: { ten: "Chi ra", kieu: "loi" }, nap: { ten: "Nạp tiền", kieu: "cho" }, rut: { ten: "Rút tiền", kieu: "cho" } };

type SP = { tab?: string; tu?: string; den?: string; cn?: string; loai?: string; pl?: string; nh?: string; da?: string; q?: string };

export default async function TrangSoQuy({ searchParams }: { searchParams: Promise<SP> }) {
  const nd = await yeuCauQuyen("quy.xem");
  const sp = await searchParams;
  const tab = TAB.some((t) => t.ma === sp.tab) ? sp.tab! : "tien-mat";
  const ghi = coQuyen(nd, "quy.ghi");
  const dao = coQuyen(nd, "quy.dao");
  const db = sb();
  const { tu, den, homNay } = khoangNgay(sp.tu, sp.den);
  const [{ data: dsCn }, { data: loaiTC }] = await Promise.all([db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma"), db.from("loai_thu_chi").select("*").order("huong", { ascending: false }).order("thu_tu")]);
  const cn = nd.chiNhanhId ?? (sp.cn || undefined);
  let qq = db.from("quy").select("*").eq("hoat_dong", true).order("loai").order("ten");
  if (cn) qq = qq.eq("chi_nhanh_id", cn);
  const { data: dsQuy } = await qq;
  const quyHienTai = (dsQuy ?? []).filter((q) => q.loai === (tab === "ngan-hang" ? "ngan_hang" : "tien_mat"));
  const luaQuy = (dsQuy ?? []).map((q) => ({ gia_tri: q.id, nhan: q.ten }));
  const goc = "/tai-chinh/so-quy";
  const them = `${sp.tu ? `&tu=${sp.tu}` : ""}${sp.den ? `&den=${sp.den}` : ""}${sp.cn ? `&cn=${sp.cn}` : ""}`;
  const quyMacDinh = quyHienTai[0]?.id ?? luaQuy[0]?.gia_tri ?? "";
  const luaLoai = (h: "thu" | "chi") => (loaiTC ?? []).filter((l) => l.huong === h && l.hoat_dong && !l.he_thong).map((l) => ({ gia_tri: l.id, nhan: l.ten }));
  const chung: Truong[] = [
    { ten: "quy_id", nhan: "Quỹ", loai: "chon", luaChon: luaQuy, batBuoc: true }, { ten: "so_tien", nhan: "Số tiền", loai: "tien", batBuoc: true },
    { ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "doi_tuong", nhan: "Người nộp / người nhận", loai: "chu" }, { ten: "nguoi_nhan", nhan: "Người nhận tiền", loai: "chu" }, { ten: "noi_dung", nhan: "Nội dung", loai: "chu", batBuoc: true, rong: true },
  ];
  const truongThu: Truong[] = [{ ten: "loai_thu_chi_id", nhan: "Phân loại", loai: "chon", luaChon: luaLoai("thu"), batBuoc: true }, ...chung];
  const truongChi: Truong[] = [{ ten: "loai_thu_chi_id", nhan: "Phân loại", loai: "chon", luaChon: luaLoai("chi"), batBuoc: true }, ...chung];
  const nutGhi = ghi && (
    <>
      <NutHop nhan="Thêm khoản thu" tieuDe="Thêm khoản thu" truong={truongThu} action={ghiThuChi} an={{ huong: "thu" }} giaTri={{ quy_id: quyMacDinh, ngay: homNay }} />
      <NutHop kieu="phu" nhan="Thêm khoản chi" tieuDe="Thêm khoản chi" truong={truongChi} action={ghiThuChi} an={{ huong: "chi" }} giaTri={{ quy_id: quyMacDinh, ngay: homNay }} />
      <NutHop kieu="phu" nhan="Nạp tiền" tieuDe="Nạp tiền vào quỹ" moTa="Tiền đưa thêm vào quỹ (không phải tiền khách trả, không phải chuyển giữa 2 quỹ)." truong={chung} action={ghiNapRut} an={{ huong: "nap" }} giaTri={{ quy_id: quyMacDinh, ngay: homNay }} />
      <NutHop kieu="phu" nhan="Rút tiền" tieuDe="Rút tiền khỏi quỹ" moTa="Tiền lấy ra khỏi quỹ (không phải khoản chi, không phải chuyển giữa 2 quỹ)." truong={chung} action={ghiNapRut} an={{ huong: "rut" }} giaTri={{ quy_id: quyMacDinh, ngay: homNay }} />
      <NutHop kieu="phu" nhan="Chuyển quỹ" tieuDe="Chuyển tiền giữa hai quỹ" moTa="Rút từ quỹ này, nạp vào quỹ kia (vd nộp tiền mặt vào ngân hàng)." action={chuyenQuy}
        truong={[{ ten: "quy_tu", nhan: "Từ quỹ", loai: "chon", luaChon: luaQuy, batBuoc: true }, { ten: "quy_den", nhan: "Sang quỹ", loai: "chon", luaChon: luaQuy, batBuoc: true }, { ten: "so_tien", nhan: "Số tiền", loai: "tien", batBuoc: true }, { ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "noi_dung", nhan: "Nội dung", loai: "chu", rong: true }]}
        giaTri={{ ngay: homNay }} />
    </>
  );

  let noiDung: React.ReactNode;
  if (tab === "loai") {
    const truong: Truong[] = [{ ten: "huong", nhan: "Loại", loai: "chon", luaChon: [{ gia_tri: "thu", nhan: "Thu vào" }, { gia_tri: "chi", nhan: "Chi ra" }], chiKhiTao: true, batBuoc: true }, { ten: "ten", nhan: "Tên phân loại", loai: "chu", batBuoc: true, rong: true }, { ten: "hoat_dong", nhan: "Đang dùng", loai: "gat" }];
    noiDung = (
      <>
        {ghi && <div className="mb-4"><NutHop nhan="Thêm phân loại" tieuDe="Thêm phân loại thu/chi" truong={truong} action={luuLoaiThuChi} giaTri={{ huong: "chi", hoat_dong: true }} /></div>}
        <Bang noi duLieu={loaiTC ?? []} khoa={(r) => r.id} trong="Chưa có phân loại."
          cot={[
            { nhan: "Phân loại", chinh: true, hienThi: (r) => <span className="text-muc">{r.ten}</span> },
            { nhan: "Loại", hienThi: (r) => <NhanTrangThai kieu={r.huong === "thu" ? "tot" : "loi"}>{r.huong === "thu" ? "Thu vào" : "Chi ra"}</NhanTrangThai> },
            { nhan: "Ghi chú", hienThi: (r) => (r.he_thong ? "Hệ thống tự ghi, không sửa" : r.hoat_dong ? "" : "Ngừng dùng") },
            { nhan: "", hienThi: (r) => (ghi && !r.he_thong ? <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa phân loại" truong={truong.filter((t) => t.ten !== "huong")} action={luuLoaiThuChi} giaTri={{ id: r.id, ten: r.ten, hoat_dong: r.hoat_dong }} /> : null) },
          ]} />
      </>
    );
  } else {
    const ids = quyHienTai.map((q) => q.id);
    const [{ data: tong, error: loiTong }, { data: dong, error: loiDong }] = await Promise.all([
      db.rpc("so_quy_tong", { p_quy: ids, p_tu: tu, p_den: den }),
      db.from("v_so_quy").select("*").in("quy_id", ids).gte("ngay", tu).lte("ngay", den).order("ngay").order("tao_luc").limit(5000),
    ]);
    if (loiTong || loiDong) console.error("[so-quy]", loiTong?.message ?? loiDong?.message);
    const t = tong?.[0];
    const dau = Number(t?.dau ?? 0);
    const tatCa = (dong ?? []).reduce<(NonNullable<typeof dong>[number] & { du: number })[]>((acc, r) => { acc.push({ ...r, du: (acc.length ? acc[acc.length - 1].du : dau) + Number(r.bien_dong) }); return acc; }, []);
    let ds = tatCa;
    if (sp.da !== "1") ds = ds.filter((r) => !r.da_dao && r.nguon !== "dao_phieu");
    if (sp.loai === "chuyen-di" || sp.loai === "chuyen-den") ds = ds.filter((r) => r.nguon === "chuyen_quy" && r.loai === (sp.loai === "chuyen-di" ? "rut" : "nap"));
    else if (sp.loai === "nap" || sp.loai === "rut") ds = ds.filter((r) => r.loai === sp.loai && r.nguon !== "chuyen_quy");
    else if (sp.loai) ds = ds.filter((r) => r.loai === sp.loai);
    const tuKhoa = boDau((sp.q ?? "").trim());
    if (tuKhoa) ds = ds.filter((r) => boDau(`${r.ma ?? ""} ${r.noi_dung ?? ""} ${r.doi_tuong ?? ""} ${r.loai_thu_chi ?? ""} ${r.khach_ten ?? ""} ${r.nguoi_nhan ?? ""} ${r.nguoi_ten ?? ""}`).includes(tuKhoa));
    if (sp.pl) ds = ds.filter((r) => r.loai_thu_chi === sp.pl);
    const dsNganHang = tab === "ngan-hang" ? [...new Set(tatCa.map((r) => r.ngan_hang).filter((x): x is string => !!x))].sort() : [];
    if (sp.nh) ds = ds.filter((r) => (sp.nh === "-" ? !r.ngan_hang : r.ngan_hang === sp.nh));
    ds = ds.reverse();
    const nguoiIds = [...new Set(ds.map((r) => r.nguoi_id).filter((x): x is string => !!x))];
    const { data: nvTen } = nguoiIds.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", nguoiIds.slice(0, 300)) : { data: [] as { id: string; ho_ten: string }[] };
    const tenNguoi = new Map((nvTen ?? []).map((n) => [n.id, n.ho_ten]));
    const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
    noiDung = (loiTong || loiDong) ? (
      <>
        <LocBaoCao goc={goc} tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <div role="alert" className="rounded-nho bg-loi-nen px-3.5 py-3 text-[14px] text-loi">Chưa tính được số liệu sổ quỹ vì hệ thống đang chậm. Số 0 ở đây sẽ sai, nên chưa hiện. Chờ vài giây rồi tải lại trang, hoặc thu hẹp khoảng ngày.</div>
      </>
    ) : (
      <>
        <LocBaoCao goc={goc} tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <ChiSoQuy dau={dau} thu={Number(t?.thu ?? 0)} chi={Number(t?.chi ?? 0)} nap={Number(t?.nap ?? 0)} rut={Number(t?.rut ?? 0)} hienTai={Number(t?.hien_tai ?? 0)} />
        {tab === "ngan-hang" && <TachQuyNganHang chiNhanhIds={[...new Set(quyHienTai.map((q) => q.chi_nhanh_id))]} tu={tu} den={den} />}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <LocSoQuy goc={goc} loai={sp.loai ?? ""} pl={sp.pl ?? ""} nh={sp.nh ?? ""} nganHang={tab === "ngan-hang" ? dsNganHang : null} da={sp.da === "1"} q={sp.q ?? ""} phanLoai={(loaiTC ?? []).map((l) => l.ten)} quyKia={tab === "ngan-hang" ? "quỹ tiền mặt" : "quỹ ngân hàng"} />
          <a href={`/api/xuat/so-quy?quy=${tab}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`} className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">Xuất Excel</a>
          <a href={`/in/so-quy?quy=${tab}&tu=${tu}&den=${den}${sp.cn ? `&cn=${sp.cn}` : ""}`} target="_blank" rel="noopener" className="h-10 rounded-nho border border-vien-dam px-4 text-[14px] font-medium leading-10 text-muc-2 hover:bg-giay-tram">In sổ quỹ</a>
        </div>
        <div className="mt-3">
          <Bang noi duLieu={ds} khoa={(r) => r.id ?? ""} trong="Chưa có giao dịch nào trong bộ lọc này."
            cot={[
              { nhan: "Ngày tạo", hienThi: (r) => ngayVN(r.ngay) },
              { nhan: "Chi nhánh", hienThi: (r) => tenCn.get(r.chi_nhanh_id ?? "") ?? "" },
              { nhan: "Mã HĐ / thu chi", hienThi: (r) => <span className="tabular-nums">{r.ma}</span> },
              { nhan: "Khách hàng", hienThi: (r) => (r.khach_id ? <Link href={`/khach-hang/${r.khach_id}`} className="text-muc hover:underline">{r.khach_ten}</Link> : r.khach_ten ?? "") },
              { nhan: "Người thu / chi", hienThi: (r) => r.nguoi_ten ?? tenNguoi.get(r.nguoi_id ?? "") ?? "" },
              { nhan: "Loại", hienThi: (r) => { const n = NHAN_LOAI[r.loai ?? ""]; if (!n) return null; const quyKia = tab === "ngan-hang" ? "quỹ tiền mặt" : "quỹ ngân hàng"; return <NhanTrangThai kieu={n.kieu}>{r.nguon === "chuyen_quy" ? (r.loai === "rut" ? `Chuyển sang ${quyKia}` : `Nhận từ ${quyKia}`) : n.ten}</NhanTrangThai>; } },
              { nhan: "Phân loại", hienThi: (r) => r.loai_thu_chi ?? "" },
              ...(tab === "ngan-hang" ? [{ nhan: "Ngân hàng", hienThi: (r: { ngan_hang: string | null }) => r.ngan_hang ?? "" }] : []),
              { nhan: "Nội dung", chinh: true, hienThi: (r) => <span className="text-muc">{r.noi_dung}{r.doi_tuong && r.sh_id == null ? <span className="text-muc-3"> · {r.doi_tuong}</span> : null}{r.da_dao ? <span className="text-muc-3"> · đã đảo</span> : null}</span> },
              { nhan: "Người nhận tiền", hienThi: (r) => r.nguoi_nhan ?? "" },
              { nhan: "Số tiền", phai: true, hienThi: (r) => <span className={Number(r.bien_dong) < 0 ? "text-loi" : "text-nhan-dam"}>{Number(r.bien_dong) < 0 ? "−" : "+"}{soVN(r.so_tien)}</span> },
              { nhan: "Số dư", phai: true, hienThi: (r) => soVN(r.du) },
              { nhan: "", hienThi: (r) => (dao && r.sua_duoc && r.sh_id == null && !r.da_dao && r.nguon !== "dao_phieu" ? <NutHop kieu="chu" nguy nhan="Đảo phiếu" tieuDe="Đảo phiếu" xacNhan={`Ghi dòng ngược chiều để huỷ ${r.ma}. Phiếu gốc vẫn còn trong sổ.`} truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={daoPhieu} an={{ id: r.id ?? "" }} nhanLuu="Đảo phiếu" /> : null) },
            ]} />
        </div>
        {ds.length === 0 ? null : <p className="mt-3 text-[12px] text-muc-3">Số dư chạy tính từ tồn đầu kỳ {tienVN(dau)}. Tiền khách trả (tiền mặt vào quỹ tiền mặt; chuyển khoản, quẹt thẻ, ví điện tử vào quỹ ngân hàng; trừ thẻ tiền và Ship COD không tính) tự vào sổ quỹ.</p>}
      </>
    );
  }
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/tai-chinh", nhan: "Tài chính - Kế toán" }} tieuDe="Sổ quỹ thu/chi" phu="Tiền mặt và ngân hàng: thu, chi, nạp, rút, chuyển quỹ. Tồn quỹ cộng dồn từ ngày đầu dùng (như SalonHero, không có số dư đầu). Dòng đã ghi chỉ đảo được, không sửa hay xoá.">{nutGhi}</TieuDeNoi>
      <Tab muc={TAB} dang={tab} goc={goc} them={them} />
      {noiDung}
    </div>
  );
}

function ChiSoQuy({ dau, thu, chi, nap, rut, hienTai }: { dau: number; thu: number; chi: number; nap: number; rut: number; hienTai: number }) {
  const cuoi = dau + thu - chi + nap - rut;
  return (
    <div className="space-y-3">
      <HangChiSo muc={[{ nhan: "Tổng thu", so: tienVN(thu) }, { nhan: "Tổng chi", so: tienVN(chi) }, { nhan: "Nạp tiền", so: tienVN(nap) }, { nhan: "Rút tiền", so: tienVN(rut) }]} />
      <HangChiSo muc={[{ nhan: "Tồn quỹ đầu kỳ", so: tienVN(dau) }, { nhan: "Tồn quỹ cuối kỳ", so: tienVN(cuoi), ghiChu: `Đầu kỳ + thu − chi + nạp − rút` }, { nhan: "Tồn quỹ hiện tại", so: tienVN(hienTai) }]} />
    </div>
  );
}
