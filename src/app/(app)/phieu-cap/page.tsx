import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM, ngayVN, soVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { FormPhieu, type DichVuPhieu } from "@/components/phieu-cap/FormPhieu";
import { NutHop } from "@/components/ui/BieuMau";
import { nhanPhieuBuoi, tinhCaCanPhieu } from "@/lib/phieu-cap";
import { chotPhieuNgay, taoPhieu } from "./actions";

export const TT_PHIEU: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  cho_cap: { nhan: "Chờ cấp", kieu: "cho" }, da_cap: { nhan: "Đã cấp", kieu: "cho" }, da_nhan: { nhan: "Chuyên viên trị liệu đã nhận", kieu: "tot" },
  da_lam: { nhan: "Đã làm, chờ đối chiếu", kieu: "cho" }, da_doi_chieu: { nhan: "Đã đối chiếu", kieu: "tot" }, huy: { nhan: "Đã huỷ", kieu: "loi" },
};
const TAB = [{ ma: "phieu", ten: "Phiếu trong ngày" }, { ma: "doi-chieu", ten: "Đối chiếu ngày" }];
const TAB_CHOT = { ma: "chot", ten: "Phiếu theo buổi, chốt cuối ngày" };

export default async function TrangPhieuCap({ searchParams }: { searchParams: Promise<{ tab?: string; ngay?: string; lich?: string; tt?: string }> }) {
  const nd = await yeuCauQuyen("phieu.xem");
  const sp = await searchParams;
  const ngay = /^\d{4}-\d{2}-\d{2}$/.test(sp.ngay ?? "") ? sp.ngay! : homNayHCM();
  const choChot = coQuyen(nd, "phieu.cap") || coQuyen(nd, "phieu.doichieu");
  const tab = sp.tab === "doi-chieu" ? "doi-chieu" : sp.tab === "chot" ? "chot" : "phieu";
  const db = sb();
  const tu = new Date(`${ngay}T00:00:00+07:00`).toISOString();
  const den = new Date(`${congNgay(ngay, 1)}T00:00:00+07:00`).toISOString();

  let phanTao: React.ReactNode = null;
  if (sp.lich && coQuyen(nd, "phieu.chidinh")) {
    const { data: l } = await db.from("lich_hen").select("id, khach_id, chi_nhanh_id, nhan_vien_id").eq("id", sp.lich).maybeSingle();
    if (l) {
      const [{ data: ld }, { data: k }, { data: nv }, { data: phCo }] = await Promise.all([
        db.from("lich_hen_dich_vu").select("dich_vu_id").eq("lich_id", l.id), db.from("khach_hang").select("ho_ten, ma").eq("id", l.khach_id).maybeSingle(),
        db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true), db.from("phieu_cap").select("dich_vu_id").eq("lich_hen_id", l.id).neq("trang_thai", "huy"),
      ]);
      const dvIds = (ld ?? []).map((x) => x.dich_vu_id).filter((id) => !(phCo ?? []).some((p) => p.dich_vu_id === id));
      const [{ data: dv }, { data: dm }] = await Promise.all([
        dvIds.length ? db.from("dich_vu").select("id, ten").in("id", dvIds) : Promise.resolve({ data: [] }),
        dvIds.length ? db.from("dinh_muc").select("dich_vu_id, san_pham_id, so_luong, chon_theo_chi_dinh").in("dich_vu_id", dvIds) : Promise.resolve({ data: [] }),
      ]);
      const idsSp = [...new Set((dm ?? []).map((x) => x.san_pham_id))];
      const { data: sp2 } = idsSp.length ? await db.from("san_pham").select("id, ten, don_vi, nhom_cap").in("id", idsSp) : { data: [] };
      const spMap = new Map((sp2 ?? []).map((s) => [s.id, s]));
      const dichVu: DichVuPhieu[] = (dv ?? []).map((d) => ({
        id: d.id, ten: d.ten,
        coDinh: (dm ?? []).filter((x) => x.dich_vu_id === d.id && !x.chon_theo_chi_dinh && spMap.get(x.san_pham_id)?.nhom_cap === "A").map((x) => ({ ten: spMap.get(x.san_pham_id)!.ten, don_vi: spMap.get(x.san_pham_id)!.don_vi, so_luong: Number(x.so_luong) })),
        phuongAn: (dm ?? []).filter((x) => x.dich_vu_id === d.id && x.chon_theo_chi_dinh).map((x) => ({ san_pham_id: x.san_pham_id, ten: spMap.get(x.san_pham_id)!.ten, don_vi: spMap.get(x.san_pham_id)!.don_vi, dinh_muc: Number(x.so_luong) })),
      })).filter((d) => d.coDinh.length + d.phuongAn.length > 0);
      phanTao = (
        <section className="mb-8 rounded-the border border-dat bg-dat-nen px-5 py-4">
          <h2 className="text-[15px] font-semibold text-muc">Lịch của {k?.ho_ten} ({k?.ma})</h2>
          {dichVu.length === 0 ? <p className="mt-1 text-[14px] text-muc-2">Các dịch vụ của lịch này không có vật tư nhóm A cần phiếu cấp, hoặc đã ra phiếu đủ. Mở ca không bị chặn.</p> : (
            <div className="mt-3"><FormPhieu dichVu={dichVu} khachId={l.khach_id} lichId={l.id} chiNhanhId={l.chi_nhanh_id} macDinhBacSi={nd.vaiTro === "bac_si" ? nd.nhanVienId : ""}
              bacSi={(nv ?? []).filter((n) => ["bac_si", "quan_ly"].includes(n.vai_tro)).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))} ktv={(nv ?? []).filter((n) => n.vai_tro === "ktv" || n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))} action={taoPhieu} /></div>
          )}
        </section>
      );
    }
  }

  let noiDung: React.ReactNode;
  if (tab === "phieu") {
    let q = db.from("phieu_cap").select("*").gte("tao_luc", tu).lt("tao_luc", den).order("tao_luc", { ascending: false });
    if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
    if (sp.tt) q = q.eq("trang_thai", sp.tt);
    const { data: ds } = await q;
    const idsK = [...new Set((ds ?? []).map((p) => p.khach_id))];
    const [{ data: ks }, { data: dv }, { data: nv }, { data: dong }] = await Promise.all([
      idsK.length ? db.from("khach_hang").select("id, ho_ten").in("id", idsK) : Promise.resolve({ data: [] }), db.from("dich_vu").select("id, ten"), db.from("nhan_vien").select("id, ho_ten"),
      (ds ?? []).length ? db.from("phieu_cap_dong").select("phieu_id, so_cap, don_gia").in("phieu_id", (ds ?? []).map((p) => p.id)) : Promise.resolve({ data: [] }),
    ]);
    const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten])), tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    // Ca trong ngày có dịch vụ cần vật tư nhóm A mà chưa ra phiếu: để kho / bác sĩ ra phiếu trước ca, không phải chờ tới lúc mở ca bị chặn.
    let qLich = db.from("lich_hen").select("id, khach_id, bat_dau, trang_thai").gte("bat_dau", tu).lt("bat_dau", den).in("trang_thai", ["da_xac_nhan", "cho_phuc_vu", "dang_phuc_vu"]).order("bat_dau");
    if (nd.chiNhanhId) qLich = qLich.eq("chi_nhanh_id", nd.chiNhanhId);
    const { data: lichNgay } = await qLich;
    const idsLich = (lichNgay ?? []).map((l) => l.id);
    const [{ data: ldv }, { data: phCo }] = await Promise.all([
      idsLich.length ? db.from("lich_hen_dich_vu").select("lich_id, dich_vu_id").in("lich_id", idsLich) : Promise.resolve({ data: [] as { lich_id: string; dich_vu_id: string }[] }),
      idsLich.length ? db.from("phieu_cap").select("lich_hen_id, dich_vu_id").in("lich_hen_id", idsLich).neq("trang_thai", "huy") : Promise.resolve({ data: [] as { lich_hen_id: string | null; dich_vu_id: string }[] }),
    ]);
    const idsDv = [...new Set((ldv ?? []).map((x) => x.dich_vu_id))];
    const { data: dmNgay } = idsDv.length ? await db.from("dinh_muc").select("dich_vu_id, san_pham_id").in("dich_vu_id", idsDv) : { data: [] as { dich_vu_id: string; san_pham_id: string }[] };
    const { data: spNgay } = (dmNgay ?? []).length ? await db.from("san_pham").select("id, nhom_cap").in("id", [...new Set((dmNgay ?? []).map((x) => x.san_pham_id))]) : { data: [] as { id: string; nhom_cap: string | null }[] };
    const caCan = tinhCaCanPhieu(ldv ?? [], dmNgay ?? [], new Map((spNgay ?? []).map((s) => [s.id, s.nhom_cap])), phCo ?? []);
    const lichMap = new Map((lichNgay ?? []).map((l) => [l.id, l]));
    const tenKCan = new Map<string, string>();
    const idsKCan = [...new Set(caCan.map((c) => lichMap.get(c.lichId)?.khach_id).filter((x): x is string => !!x))];
    if (idsKCan.length) for (const k of (await db.from("khach_hang").select("id, ho_ten").in("id", idsKCan)).data ?? []) tenKCan.set(k.id, k.ho_ten);
    const tenDvCan = new Map(((idsDv.length ? (await db.from("dich_vu").select("id, ten").in("id", idsDv)).data : []) ?? []).map((d) => [d.id, d.ten]));
    noiDung = (
      <>
        <div className="mb-4 flex flex-wrap gap-2 text-[13px]">
          {[["", "Tất cả"], ["cho_cap", "Chờ cấp"], ["da_cap", "Đã cấp"], ["da_nhan", "Chuyên viên trị liệu đã nhận"], ["da_lam", "Chờ đối chiếu"], ["da_doi_chieu", "Đã đối chiếu"], ["huy", "Đã huỷ"]].map(([ma, ten]) => (
            <Link key={ma} href={`/phieu-cap?ngay=${ngay}${ma ? `&tt=${ma}` : ""}`} className={`rounded-nho px-3 py-1.5 ${(sp.tt ?? "") === ma ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{ten}</Link>
          ))}
        </div>
        {caCan.length > 0 && coQuyen(nd, "phieu.chidinh") && (
          <section className="mb-6">
            <h2 className="mb-2 text-[15px] font-semibold text-muc">Ca cần ra phiếu cấp ({caCan.length})</h2>
            <p className="mb-2 text-[13px] text-muc-3">Dịch vụ có vật tư nhóm A phải có phiếu cấp, kho cấp và chuyên viên nhận rồi mới mở ca được. Bấm &quot;Ra phiếu&quot; để chọn vật tư theo định mức.</p>
            <ul>
              {caCan.map((c) => {
                const l = lichMap.get(c.lichId)!;
                return (
                  <li key={`${c.lichId}-${c.dichVuId}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-vien py-2.5 text-[14px]">
                    <span className="text-muc"><span className="tabular-nums text-muc-3">{gioVN(l.bat_dau)}</span> · {tenKCan.get(l.khach_id) ?? "Khách"} · {tenDvCan.get(c.dichVuId) ?? "Dịch vụ"}</span>
                    <Link href={`/phieu-cap?ngay=${ngay}&lich=${c.lichId}`} className="font-medium text-nhan-dam hover:underline">Ra phiếu</Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có phiếu cấp nào trong ngày."
          cot={[
            { nhan: "Mã phiếu", hienThi: (r) => <Link href={`/phieu-cap/${r.id}`} className="font-medium text-nhan-dam hover:underline">{r.ma}</Link> }, { nhan: "Giờ", hienThi: (r) => gioVN(r.tao_luc) },
            { chinh: true, nhan: "Khách", hienThi: (r) => tenK.get(r.khach_id) ?? "" }, { nhan: "Dịch vụ", hienThi: (r) => tenDv.get(r.dich_vu_id) ?? "" },
            { nhan: "Bác sĩ", hienThi: (r) => (r.bac_si_id ? tenNv.get(r.bac_si_id) ?? "" : r.buoi_id ? <span className="text-muc-3">Phiếu theo buổi</span> : "") }, { nhan: "Chuyên viên trị liệu", hienThi: (r) => tenNv.get(r.ktv_id ?? "") ?? "" },
            { nhan: "Giá trị cấp", hienThi: (r) => tienVN((dong ?? []).filter((d) => d.phieu_id === r.id).reduce((s, d) => s + Number(d.so_cap) * Number(d.don_gia ?? 0), 0)), phai: true },
            { nhan: "Trạng thái", hienThi: (r) => { const t = nhanPhieuBuoi(r) ?? TT_PHIEU[r.trang_thai]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
          ]} />
      </>
    );
  } else if (tab === "chot") {
    // Phiếu vật tư theo buổi của NGÀY LÀM buổi (buổi có thể ghi lùi ngày). Chưa xác nhận tô đỏ: chốt ngày bỏ qua, phiếu còn mở.
    let qb = db.from("buoi_thuc_hien").select("id").eq("ngay_lam", ngay).eq("trang_thai", "da_lam");
    if (nd.chiNhanhId) qb = qb.eq("chi_nhanh_id", nd.chiNhanhId);
    const idsBuoi = ((await qb).data ?? []).map((b) => b.id);
    const { data: ds } = idsBuoi.length ? await db.from("phieu_cap").select("*").in("buoi_id", idsBuoi).neq("trang_thai", "huy").order("tao_luc") : { data: [] };
    const idsK = [...new Set((ds ?? []).map((p) => p.khach_id))];
    const [{ data: ks }, { data: dv }, { data: nv }, { data: dong }, { data: cn }] = await Promise.all([
      idsK.length ? db.from("khach_hang").select("id, ho_ten").in("id", idsK) : Promise.resolve({ data: [] }), db.from("dich_vu").select("id, ten"), db.from("nhan_vien").select("id, ho_ten"),
      (ds ?? []).length ? db.from("phieu_cap_dong").select("phieu_id").in("phieu_id", (ds ?? []).map((p) => p.id)) : Promise.resolve({ data: [] }),
      nd.chiNhanhId ? Promise.resolve({ data: [] }) : db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu"),
    ]);
    const tenK = new Map((ks ?? []).map((k) => [k.id, k.ho_ten])), tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten])), tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
    const chuaXn = (ds ?? []).filter((p) => p.trang_thai === "cho_cap" && !p.xac_nhan_luc).length;
    const choChotSo = (ds ?? []).filter((p) => p.trang_thai === "cho_cap" && p.xac_nhan_luc).length;
    const daChot = (ds ?? []).length - chuaXn - choChotSo;
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-2">Mỗi buổi thẻ được ghi sẽ ra một phiếu vật tư theo định mức của dịch vụ. Chuyên viên trị liệu kiểm, sửa số lượng rồi bấm &quot;Xác nhận đã kiểm&quot;. Chốt cuối ngày chỉ xuất kho các phiếu đã xác nhận; phiếu chưa xác nhận (tô đỏ) vẫn để mở.</p>
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
          <span className={chuaXn > 0 ? "font-medium text-loi" : "text-muc-2"}>Chưa xác nhận: {chuaXn}</span>
          <span className="text-muc-2">Đã xác nhận, chờ chốt: {choChotSo}</span>
          <span className="text-muc-2">Đã chốt: {daChot}</span>
          {choChot && choChotSo > 0 && (
            <NutHop nhan="Chốt cuối ngày" tieuDe={`Chốt phiếu vật tư ngày ${ngayVN(ngay)}`} nhanLuu="Chốt và xuất kho" an={{ ngay, ...(nd.chiNhanhId ? { chi_nhanh_id: nd.chiNhanhId } : {}) }}
              xacNhan={`Xuất kho ${choChotSo} phiếu đã được chuyên viên trị liệu xác nhận.${chuaXn ? ` ${chuaXn} phiếu chưa xác nhận sẽ KHÔNG được chốt, vẫn để mở.` : ""}`}
              truong={nd.chiNhanhId ? [] : [{ ten: "chi_nhanh_id", nhan: "Chi nhánh", loai: "chon", batBuoc: true, rong: true, luaChon: (cn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten })) }]} action={chotPhieuNgay} />
          )}
        </div>
        <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có phiếu vật tư theo buổi nào trong ngày."
          cot={[
            { nhan: "Mã phiếu", hienThi: (r) => <Link href={`/phieu-cap/${r.id}`} className={`font-medium hover:underline ${r.trang_thai === "cho_cap" && !r.xac_nhan_luc ? "text-loi" : "text-nhan-dam"}`}>{r.ma}</Link> },
            { chinh: true, nhan: "Khách", hienThi: (r) => tenK.get(r.khach_id) ?? "" }, { nhan: "Dịch vụ", hienThi: (r) => tenDv.get(r.dich_vu_id) ?? "" },
            { nhan: "Chuyên viên trị liệu", hienThi: (r) => tenNv.get(r.ktv_id ?? "") ?? "" }, { nhan: "Số vật tư", hienThi: (r) => (dong ?? []).filter((d) => d.phieu_id === r.id).length, phai: true },
            { nhan: "Xác nhận", hienThi: (r) => (r.xac_nhan_luc ? `${tenNv.get(r.xac_nhan_boi ?? "") ?? ""} · ${gioVN(r.xac_nhan_luc)}` : "") },
            { nhan: "Trạng thái", hienThi: (r) => { const t = nhanPhieuBuoi(r) ?? TT_PHIEU[r.trang_thai]; return <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>; } },
          ]} />
      </>
    );
  } else {
    const { data: nguong } = await db.from("cau_hinh").select("gia_tri").eq("khoa", "nguong_lech_pct").maybeSingle();
    const ng = Number(nguong?.gia_tri ?? 5);
    let q = db.from("v_phieu_cap_lech").select("*").gte("lam_xong_luc", tu).lt("lam_xong_luc", den);
    if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
    const { data: l } = await q;
    const nhom = new Map<string, { ten: string; dinhMuc: number; cap: number; tra: number; dung: number; giaTri: number }>();
    for (const r of l ?? []) {
      const k = r.san_pham_id ?? "";
      const g = nhom.get(k) ?? { ten: r.ten_vat_tu ?? "", dinhMuc: 0, cap: 0, tra: 0, dung: 0, giaTri: 0 };
      g.dinhMuc += Number(r.dinh_muc); g.cap += Number(r.so_cap); g.tra += Number(r.so_tra); g.dung += Number(r.dung_that); g.giaTri += Number(r.gia_tri_dung);
      nhom.set(k, g);
    }
    const dong = [...nhom.entries()].map(([id, g]) => ({ id, ...g, lech: g.dinhMuc > 0 ? ((g.dung - g.dinhMuc) / g.dinhMuc) * 100 : 0 }));
    const lechNang = (l ?? []).filter((r) => r.lech_pct != null && Math.abs(Number(r.lech_pct)) > ng);
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-2">Tổng hợp các ca đã làm xong trong ngày. Lệch quá {ng}% so với định mức được tô màu để quản lý ca hỏi lý do.</p>
        <Bang noi duLieu={dong} khoa={(r) => r.id} trong="Chưa có ca nào làm xong trong ngày."
          cot={[
            { nhan: "Vật tư", hienThi: (r) => <span className="text-muc">{r.ten}</span> }, { nhan: "Định mức", hienThi: (r) => soVN(r.dinhMuc), phai: true }, { nhan: "Đã cấp", hienThi: (r) => soVN(r.cap), phai: true },
            { nhan: "Đã trả", hienThi: (r) => soVN(r.tra), phai: true }, { nhan: "Dùng thật", hienThi: (r) => soVN(r.dung), phai: true },
            { nhan: "Lệch", hienThi: (r) => <span className={Math.abs(r.lech) > ng ? "font-medium text-canh-bao" : ""}>{r.dinhMuc > 0 ? `${r.lech > 0 ? "+" : ""}${r.lech.toFixed(1)}%` : ""}</span>, phai: true }, { nhan: "Giá trị dùng", hienThi: (r) => tienVN(Math.round(r.giaTri)), phai: true },
          ]} />
        {lechNang.length > 0 && (<>
          <h3 className="mb-2 mt-8 text-[15px] font-semibold text-muc">Ca lệch quá {ng}%</h3>
          <Bang noi duLieu={lechNang} khoa={(r) => r.dong_id ?? ""} cot={[
            { nhan: "Phiếu", hienThi: (r) => <Link href={`/phieu-cap/${r.phieu_id}`} className="font-medium text-nhan-dam hover:underline">{r.ma_phieu}</Link> }, { nhan: "Vật tư", hienThi: (r) => r.ten_vat_tu },
            { nhan: "Định mức", hienThi: (r) => soVN(r.dinh_muc), phai: true }, { nhan: "Dùng thật", hienThi: (r) => soVN(r.dung_that), phai: true }, { nhan: "Lệch", hienThi: (r) => `${Number(r.lech_pct) > 0 ? "+" : ""}${r.lech_pct}%`, phai: true }, { nhan: "Lý do", hienThi: (r) => r.ly_do_vuot ?? "Chưa có" },
          ]} /></>)}
      </>
    );
  }
  return (
    <>
      <TieuDeNoi tieuDe="Phiếu cấp vật tư" phu={`Ngày ${ngayVN(ngay)}. Vật tư nhóm A cấp trước ca: có phiếu, kho cấp, Chuyên viên trị liệu nhận rồi mới được mở ca.`}>
        <Link href={`/phieu-cap?tab=${tab}&ngay=${congNgay(ngay, -1)}`} className="rounded-nho border border-vien-dam px-3 py-2 text-[14px] hover:bg-giay-tram">Hôm trước</Link>
        <Link href={`/phieu-cap?tab=${tab}&ngay=${homNayHCM()}`} className="rounded-nho border border-vien-dam px-3 py-2 text-[14px] hover:bg-giay-tram">Hôm nay</Link>
        <Link href={`/phieu-cap?tab=${tab}&ngay=${congNgay(ngay, 1)}`} className="rounded-nho border border-vien-dam px-3 py-2 text-[14px] hover:bg-giay-tram">Hôm sau</Link>
      </TieuDeNoi>
      {phanTao}
      <Tab muc={[...TAB, ...(choChot || coQuyen(nd, "phieu.nhan") ? [TAB_CHOT] : [])]} dang={tab} goc="/phieu-cap" them={`&ngay=${ngay}`} />
      {noiDung}
    </>
  );
}
