import Link from "next/link";
import { CreditCard } from "lucide-react";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { docLocDungThe, LOAI_DUNG_THE as LOAI, thamSoDiaChi, thamSoRpc, TINH_TRANG_DUNG_THE as TINH_TRANG } from "@/lib/khach-dung-the";
import { NutXuatExcel } from "@/components/ui/NutXuatExcel";
import { chiNhanhXem } from "@/lib/cham-soc-khach";
import { Bang } from "@/components/ui/Table";
import { ThanhTrang } from "@/components/ui/ThanhTrang";
import { NUT_PHU, O_NHAP } from "@/components/ui/dinh-dang";
import { Chon } from "@/components/ui/Chon";
import { NgayChon } from "@/components/ui/NgayChon";
import { NutHop } from "@/components/ui/BieuMau";
import { TRUONG_CAP_THE } from "../../the/page";
import { NhanTinhTrangThe } from "@/components/the/NhanTinhTrangThe";
import { capTheTay, suaThe, thuHoiThe } from "../../the/actions";

const MOI_TRANG = 50;
const KHONG_GIOI_HAN = 999999;

type TongDungThe = { so_khach: number; tong_tien: number; tong_lan: number } | null;

/** /khach-hang/dung-the — Danh sách khách dùng thẻ (như SalonHero #/membercards): lọc chi nhánh, nhóm khách, ngày cấp, ngày hết hạn, 8 tình trạng, loại thẻ, ô tìm; cột Gần nhất, Lần sử dụng, link lịch sử dùng thẻ; dòng báo thẻ sắp hết hạn. Sửa thẻ (hạn, chủ thẻ, giá 1 buổi) + Thu hồi thẻ như SalonHero (câu 8, 9 đợt 2). */
export default async function KhachDungThe({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const nd = await yeuCauQuyen("the.xem");
  const sp = await searchParams;
  const { cn, ds: dsCn, khoa } = await chiNhanhXem(nd, sp.cn);
  const hom = homNayHCM(), db = sb();
  const f = docLocDungThe(sp, cn, hom);
  const trang = Math.max(1, Math.min(Number(sp.trang) || 1, 2000));
  const rpcLoc = thamSoRpc(f);

  const choCap = coQuyen(nd, "the.dieuchinh");
  const [{ data: the, count, error: loiDs }, tongRaw, sapHan, { data: nhomDs }, { data: goi }] = await Promise.all([
    db.rpc("the_dung_loc", rpcLoc, { count: "exact" }).order("ngay_cap", { ascending: false }).order("id").range((trang - 1) * MOI_TRANG, trang * MOI_TRANG - 1),
    db.rpc("tong_khach_dung_the", rpcLoc).then((r) => r.data as TongDungThe),
    db.rpc("dem_the_sap_het_han", { p_cn: cn ?? undefined, p_hom: hom }).then((r) => r.data as { tuan: number; thang: number } | null),
    db.from("nhom_khach").select("id, ten").eq("hoat_dong", true).order("ten"),
    choCap ? db.from("goi_the").select("id, ten, loai, so_buoi").eq("hoat_dong", true).order("ten") : Promise.resolve({ data: [] as { id: string; ten: string; loai: string; so_buoi: number | null }[] }),
  ]);
  if (loiDs) console.error("[khach-dung-the]", loiDs.code, loiDs.message);
  const ds = the ?? [];
  const idsK = [...new Set(ds.map((t) => t.khach_id))].filter((x): x is string => !!x), idsG = [...new Set(ds.map((t) => t.goi_id))].filter((x): x is string => !!x), idsThe = ds.map((t) => t.id).filter((x): x is string => !!x);
  const [{ data: ks }, { data: gs }, { data: gn }] = await Promise.all([
    idsK.length ? db.from("khach_hang").select("id, ho_ten, ma, dien_thoai").in("id", idsK) : Promise.resolve({ data: [] as { id: string; ho_ten: string; ma: string; dien_thoai: string | null }[] }),
    idsG.length ? db.from("goi_the").select("id, ten").in("id", idsG) : Promise.resolve({ data: [] as { id: string; ten: string }[] }),
    idsThe.length ? db.rpc("the_gan_nhat", { p_ids: idsThe }) : Promise.resolve({ data: [] as { the_id: string; ngay: string }[] }),
  ]);
  const khach = new Map((ks ?? []).map((k) => [k.id, k])), tenGoi = new Map((gs ?? []).map((g) => [g.id, g.ten])), ganNhat = new Map((gn ?? []).map((x) => [x.the_id, x.ngay]));
  const tong = count ?? 0, tenCn = new Map(dsCn.map((c) => [c.id, c.ten]));
  const tenNhom = new Map((nhomDs ?? []).map((n) => [n.id, n.ten]));
  const diaChi = (o: Record<string, string>, t?: number) => {
    const u = new URLSearchParams({ ...(cn && !khoa ? { cn } : {}), ...o, ...(t && t > 1 ? { trang: String(t) } : {}) });
    return `/khach-hang/dung-the${u.size ? `?${u}` : ""}`;
  };
  const gan = (t: number | undefined) => diaChi(thamSoDiaChi(f), t);
  const locDangBat = Object.keys(thamSoDiaChi(f)).length > 0;
  const hanSap = sapHan && (sapHan.tuan > 0 || sapHan.thang > 0) ? sapHan : null;
  const ttHienTai = TINH_TRANG.find((x) => x.ma === f.tt)?.nhan ?? "";
  const hienTong = tongRaw;

  return (
    <div className="space-y-4">
      <TieuDeNoi gon tieuDe="Danh sách khách dùng thẻ" icon={CreditCard} quayLai={{ href: "/khach-hang", nhan: "Danh sách khách" }} quayLaiDienThoai phu={<>Thẻ liệu trình và thẻ tiền của khách. Mặc định chỉ thẻ đang dùng (gồm thẻ đang khoá); chọn “Tất cả” hoặc một tình trạng để xem thẻ đã hết, hết hạn, thu hồi.</>}>
          {choCap && (
            <NutHop kieu="chinh" nhan="Cấp thẻ mới" tieuDe="Cấp thẻ mới" moTa="Dùng khi tặng thẻ hoặc chuyển thẻ còn buổi từ phần mềm cũ. Thẻ cấp tay không tính doanh thu; muốn bán thẻ có thu tiền thì dùng Thu ngân." rong
              truong={[{ ten: "khach", nhan: "Khách (mã hoặc số điện thoại)", loai: "chu", batBuoc: true, rong: true }, { ten: "goi_id", nhan: "Gói thẻ", loai: "chon", batBuoc: true, rong: true, luaChon: (goi ?? []).map((g) => ({ gia_tri: g.id, nhan: `${g.ten} (${g.loai === "lan" ? `${g.so_buoi} buổi` : "thẻ tiền"})` })) },
                ...TRUONG_CAP_THE]} action={capTheTay} />
          )}
          {coQuyen(nd, "ban.tao") && <Link href="/ban-hang" className="flex h-10 items-center rounded-nho border border-vien-dam px-4 text-[14px] font-medium text-muc-2 hover:bg-giay-tram">Bán thẻ ở Thu ngân</Link>}
          <NutXuatExcel loai="khach-dung-the" ten="khách dùng thẻ" tham={{ cn: cn ?? undefined, ...thamSoDiaChi(f) }} />
      </TieuDeNoi>

      {hienTong && (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-3">
          <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5"><dt className="text-[12px] text-muc-3">Số khách hàng dùng thẻ</dt><dd className="mt-1 whitespace-nowrap text-[19px] font-medium tabular-nums text-muc">{soVN(hienTong.so_khach)}</dd></div>
          <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5"><dt className="text-[12px] text-muc-3">Tổng giá trị trong thẻ tiền</dt><dd className="mt-1 whitespace-nowrap text-[19px] font-medium tabular-nums text-muc">{tienVN(Number(hienTong.tong_tien))}</dd></div>
          <div className="the-noi the-noi-thap px-4 pb-3 pt-3.5"><dt className="text-[12px] text-muc-3">Tổng giá trị trong thẻ lần (không tính thẻ không giới hạn)</dt><dd className="mt-1 whitespace-nowrap text-[19px] font-medium tabular-nums text-muc">{tienVN(Number(hienTong.tong_lan))}</dd></div>
        </dl>
      )}

      {hanSap && f.tt !== "tuan" && f.tt !== "thang" && (
        <p role="status" className="rounded-nho border border-vien bg-canh-bao-nen px-4 py-2.5 text-[13px] text-canh-bao">
          Thẻ sắp hết hạn{cn ? ` (${tenCn.get(cn) ?? ""})` : ""}:{" "}
          <Link href={diaChi({ ...thamSoDiaChi(f), tt: "tuan" })} className="font-medium underline underline-offset-2">{soVN(hanSap.tuan)} thẻ trong 1 tuần tới</Link>
          {" · "}
          <Link href={diaChi({ ...thamSoDiaChi(f), tt: "thang" })} className="font-medium underline underline-offset-2">{soVN(hanSap.thang)} thẻ trong 1 tháng tới</Link>
        </p>
      )}

      <form method="get" className="the-noi the-noi-thap flex flex-wrap items-end gap-x-3 gap-y-3 px-4 pb-3.5 pt-4 text-[13px]">
        {!khoa && (
          <label className="block"><span className="mb-1 block font-medium text-muc-2">Chi nhánh</span>
            <div className="w-56"><Chon ten="cn" ariaLabel="Chi nhánh" giaTriMacDinh={cn ?? ""} luaChon={[{ gia_tri: "", nhan: "Tất cả các chi nhánh" }, ...dsCn.map((c) => ({ gia_tri: c.id, nhan: c.ten }))]} /></div></label>
        )}
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Nhóm khách hàng</span>
          <div className="w-52"><Chon ten="nhom" ariaLabel="Nhóm khách hàng" giaTriMacDinh={f.nhom} luaChon={[{ gia_tri: "", nhan: "Tất cả nhóm" }, ...(nhomDs ?? []).map((n) => ({ gia_tri: n.id, nhan: n.ten }))]} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Tình trạng</span>
          <div className="w-52"><Chon ten="tt" ariaLabel="Tình trạng" giaTriMacDinh={f.tt} luaChon={TINH_TRANG.map((x) => ({ gia_tri: x.ma, nhan: x.nhan }))} /></div></label>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Loại thẻ</span>
          <div className="w-40"><Chon ten="loai" ariaLabel="Loại thẻ" giaTriMacDinh={f.loai} luaChon={LOAI.map((x) => ({ gia_tri: x.ma, nhan: x.nhan }))} /></div></label>
        <div className="block"><span className="mb-1 block font-medium text-muc-2">Ngày cấp</span>
          <div className="flex items-center gap-1.5"><NgayChon ten="cap_tu" giaTriMacDinh={f.capTu} tuNam={2018} denNam={2035} ariaLabel="Ngày cấp từ" className="w-36" /><span aria-hidden className="text-muc-3">–</span><NgayChon ten="cap_den" giaTriMacDinh={f.capDen} tuNam={2018} denNam={2035} ariaLabel="Ngày cấp đến" className="w-36" /></div></div>
        <div className="block"><span className="mb-1 block font-medium text-muc-2">Ngày hết hạn</span>
          <div className="flex items-center gap-1.5"><NgayChon ten="han_tu" giaTriMacDinh={f.hanTu} tuNam={2018} denNam={2045} ariaLabel="Ngày hết hạn từ" className="w-36" /><span aria-hidden className="text-muc-3">–</span><NgayChon ten="han_den" giaTriMacDinh={f.hanDen} tuNam={2018} denNam={2045} ariaLabel="Ngày hết hạn đến" className="w-36" /></div></div>
        <label className="block"><span className="mb-1 block font-medium text-muc-2">Tìm khách / mã thẻ</span>
          <input name="q" defaultValue={f.tuKhoa} placeholder="Tên, SĐT, mã khách, mã thẻ" className={`${O_NHAP} !h-10 !w-60`} /></label>
        <button type="submit" className={NUT_PHU}>Lọc</button>
        {(locDangBat || (cn && !khoa)) && <Link href="/khach-hang/dung-the" className="flex h-10 items-center px-1 text-muc-3 underline underline-offset-2 hover:text-muc">Bỏ lọc</Link>}
      </form>

      {loiDs && <p role="alert" className="rounded-nho bg-loi-nen px-3 py-2.5 text-[14px] text-loi">Chưa tải được danh sách (hệ thống đang chậm). Tải lại trang để thử lại.</p>}
      <p className="text-[13px] text-muc"><b className="tabular-nums">{soVN(tong)}</b> thẻ{ttHienTai && f.tt ? ` · ${ttHienTai}` : " đang dùng"}{cn ? ` · ${tenCn.get(cn) ?? ""}` : ""}{f.nhom ? ` · nhóm ${tenNhom.get(f.nhom) ?? ""}` : ""}</p>
      <Bang noi duLieu={ds} khoa={(r) => r.id ?? ""} trong="Không có thẻ nào với điều kiện này."
        cot={[
          { chinh: true, nhan: "Khách hàng", hienThi: (r) => { const k = khach.get(r.khach_id ?? ""); return k ? <div><Link href={`/khach-hang/${k.id}`} className="font-medium text-muc hover:underline">{k.ho_ten}</Link><div className="text-[12px] tabular-nums text-muc-3">{k.dien_thoai} · {k.ma}</div></div> : ""; } },
          { nhan: "Tên thẻ", hienThi: (r) => <div className="text-[13px]"><Link href={`/the/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> <span className="text-muc-3">· {r.loai === "tien" ? "Thẻ tiền" : "Thẻ lần"}</span><div className="text-muc-3">{tenGoi.get(r.goi_id ?? "") ?? ""}</div></div> },
          { nhan: "Ngày cấp", hienThi: (r) => <span className="tabular-nums">{ngayVN(r.ngay_cap)}</span> },
          { nhan: "Hết hạn", hienThi: (r) => <span className="tabular-nums">{r.han_dung && r.han_dung >= "2000-01-01" ? ngayVN(r.han_dung) : "Không hạn"}</span> },
          { nhan: "Gần nhất", hienThi: (r) => { const g = ganNhat.get(r.id ?? ""); return <span className="tabular-nums">{g ? ngayVN(g) : "—"}</span>; } },
          { nhan: "Lần sử dụng", phai: true, hienThi: (r) => {
            if (r.loai === "tien") return <span className="text-muc-3">—</span>;
            const tongBuoi = r.so_buoi_tong ?? 0, con = r.so_buoi_con ?? 0;
            return <span className="tabular-nums">{soVN(Math.max(0, tongBuoi - con))} / {tongBuoi >= KHONG_GIOI_HAN ? "Không giới hạn" : soVN(tongBuoi)}</span>;
          } },
          { nhan: "Còn lại", phai: true, hienThi: (r) => <span className="tabular-nums">{r.loai === "tien" ? tienVN(r.so_du_tien) : (r.so_buoi_tong ?? 0) >= KHONG_GIOI_HAN ? "Không giới hạn" : tienVN(Math.max(0, (r.so_buoi_con ?? 0)) * Number(r.gia_tri_buoi ?? 0))}</span> },
          { nhan: "Tình trạng", hienThi: (r) => <NhanTinhTrangThe tt={r.tinh_trang} /> },
          { nhan: "Lịch sử", hienThi: (r) => (
            <div className="flex flex-col items-start gap-1">
              <Link href={`/the/${r.id}`} className="whitespace-nowrap text-[13px] font-medium text-nhan-dam hover:underline">Lịch sử dùng thẻ</Link>
              {choCap && r.trang_thai !== "thu_hoi" && <>
                <NutHop kieu="chu" nhan="Sửa thẻ" tieuDe={`Sửa thẻ ${r.ma ?? ""}`} rong moTa="Sửa hạn thẻ, đổi chủ thẻ, giá 1 buổi làm dịch vụ, ghi chú. Không đổi số buổi / số dư. Mỗi lần sửa ghi vào Lịch sử thẻ."
                  an={{ the_id: r.id ?? "" }} giaTri={{ han_dung: r.han_dung ?? "", khach: khach.get(r.khach_id ?? "")?.ma ?? "", gia_tri_buoi: r.loai === "lan" ? Number(r.gia_tri_buoi ?? 0) : "", ghi_chu: r.ghi_chu ?? "" }}
                  truong={[{ ten: "han_dung", nhan: "Hạn thẻ", loai: "ngay", ghiChu: "Để trống = thẻ không hạn." }, { ten: "khach", nhan: "Chủ thẻ (mã khách hoặc số điện thoại)", loai: "chu", batBuoc: true, rong: true },
                    ...(r.loai === "lan" ? [{ ten: "gia_tri_buoi", nhan: "Giá 1 buổi làm dịch vụ", loai: "tien" as const, ghiChu: "Áp cho các buổi làm từ nay về sau." }] : []),
                    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true }, { ten: "ly_do", nhan: "Lý do sửa (không bắt buộc)", loai: "chu", rong: true }]} action={suaThe} />
                <NutHop kieu="chu" nguy nhan="Thu hồi thẻ" tieuDe={`Thu hồi thẻ ${r.ma ?? ""}`} moTa="Thẻ đã thu hồi KHÔNG cấp lại được, chỉ có thể cấp thẻ mới. Không hoàn tiền, không đụng hoá đơn / sổ quỹ: nếu trả tiền cho khách thì ghi phiếu chi ở Sổ quỹ."
                  an={{ the_id: r.id ?? "" }} truong={[{ ten: "ly_do", nhan: "Lý do thu hồi", loai: "nhieu_dong", batBuoc: true }]} nhanLuu="Thu hồi thẻ" action={thuHoiThe} />
              </>}
            </div>) },
        ]} />
      <ThanhTrang trang={trang} tong={tong} moi={MOI_TRANG} gan={gan} don="thẻ" />
    </div>
  );
}
