import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, gioVN, homNayHCM, ngayCuaIso, ngayVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { baoBienChung } from "../khieu-nai/actions";
import { truongBaoBatThuong } from "@/lib/khieu-nai-form";
import { FormLichHen } from "@/components/lich-hen/FormLichHen";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { timKhach } from "../ban-hang/actions";
import { thucHienBuoi } from "../the/actions";
import { doiTrangThaiLich, luuLichHen } from "./actions";
import { LocNguon } from "@/components/lich-hen/LocNguon";
import { moTaLap, NGUON_DAT, nhanNguon } from "@/lib/lich-hen";

const TT: Record<string, { nhan: string; kieu: "tot" | "cho" | "loi" | "tram"; mau: string }> = {
  chua_xac_nhan: { nhan: "Chưa xác nhận", kieu: "tram", mau: "bg-giay-tram border-vien-dam text-muc-2" },
  da_xac_nhan: { nhan: "Đã xác nhận", kieu: "cho", mau: "bg-dat-nen border-dat text-dat-dam" },
  cho_phuc_vu: { nhan: "Chờ phục vụ", kieu: "cho", mau: "bg-canh-bao-nen border-canh-bao text-canh-bao" },
  dang_phuc_vu: { nhan: "Đang phục vụ", kieu: "tot", mau: "bg-nhan-nhat border-nhan text-nhan-dam" },
  hoan_thanh: { nhan: "Hoàn thành", kieu: "tot", mau: "bg-nhan-nhat/60 border-vien text-muc-2" },
  huy: { nhan: "Đã huỷ", kieu: "loi", mau: "bg-loi-nen border-loi text-loi" },
  khong_den: { nhan: "Khách không đến", kieu: "loi", mau: "bg-loi-nen border-loi text-loi" },
};
const NHAN_PHIEU: Record<string, string> = { cho_cap: "Phiếu chờ cấp", da_cap: "Đã cấp, chờ KTV nhận", da_nhan: "KTV đã nhận", da_lam: "Đã làm xong", da_doi_chieu: "Đã đối chiếu", huy: "Phiếu đã huỷ" };
const GIO_DAU = 7, GIO_CUOI = 21, BUOC = 30;

export default async function TrangLichHen({ searchParams }: { searchParams: Promise<{ ngay?: string; cn?: string; khach?: string; nguon?: string }> }) {
  const nd = await yeuCauQuyen("lich.xem");
  const sp = await searchParams;
  const homNay = homNayHCM();
  const ngay = /^\d{4}-\d{2}-\d{2}$/.test(sp.ngay ?? "") ? sp.ngay! : homNay;
  const db = sb();
  const { data: dsCn } = await db.from("chi_nhanh").select("id, ten").eq("hoat_dong", true).order("thu_tu").order("ma");
  const cnId = nd.chiNhanhId ?? sp.cn ?? dsCn?.[0]?.id ?? "";
  const tu = new Date(`${ngay}T00:00:00+07:00`).toISOString();
  const den = new Date(`${congNgay(ngay, 1)}T00:00:00+07:00`).toISOString();
  const nguon = sp.nguon && (NGUON_DAT[sp.nguon] || /^[A-Z0-9_]{2,20}$/.test(sp.nguon)) ? sp.nguon : "";
  const duoi = nguon ? `&nguon=${nguon}` : "";
  let qLich = db.from("lich_hen").select("*").eq("chi_nhanh_id", cnId).gte("bat_dau", tu).lt("bat_dau", den);
  if (nguon) qLich = qLich.eq("nguon", nguon);
  const dauThang = ngay.slice(0, 8) + "01", cuoiThang = congNgay(congNgay(dauThang, 32).slice(0, 8) + "01", -1);
  const xuat = (a: string, b: string) => `/api/xuat/lich-hen?tu=${a}&den=${b}&cn=${cnId}${duoi}`;
  const [{ data: lich }, { data: nv }, { data: dv }] = await Promise.all([
    qLich.order("bat_dau"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro").eq("hoat_dong", true).order("ho_ten"),
    db.from("dich_vu").select("id, ma, ten, thoi_luong_phut").eq("hoat_dong", true).order("ma"),
  ]);
  const ids = (lich ?? []).map((l) => l.id);
  const idsK = [...new Set((lich ?? []).map((l) => l.khach_id))];
  const [{ data: ld }, { data: ks }, { data: ph }, { data: the }, { data: lk }] = await Promise.all([
    ids.length ? db.from("lich_hen_dich_vu").select("lich_id, dich_vu_id").in("lich_id", ids) : Promise.resolve({ data: [] }),
    idsK.length ? db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id").in("id", idsK) : Promise.resolve({ data: [] }),
    ids.length ? db.from("phieu_cap").select("lich_hen_id, trang_thai, ma").in("lich_hen_id", ids).neq("trang_thai", "huy") : Promise.resolve({ data: [] }),
    idsK.length ? db.from("v_the_khach").select("id, ma, khach_id, goi_id, so_buoi_con").eq("loai", "lan").in("khach_id", idsK).in("tinh_trang", ["hoat_dong", "sap_het"]) : Promise.resolve({ data: [] }),
    db.from("goi_the_dich_vu").select("goi_id, dich_vu_id"),
  ]);
  const tenK = new Map((ks ?? []).map((k) => [k.id, k]));
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const nvLC = (nv ?? []).filter((n) => n.vai_tro !== "nha_dau_tu").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const bsLC = [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  const dichVu = (dv ?? []).map((d) => ({ id: d.id, ma: d.ma, ten: d.ten, thoiLuong: d.thoi_luong_phut }));
  const cnLC = (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }));
  const gioTrongNgay = (iso: string) => { const [h, m] = gioVN(iso).split(":").map(Number); return h * 60 + m; };

  const cot = [...new Set([...(lich ?? []).filter((l) => !["huy", "khong_den"].includes(l.trang_thai)).map((l) => l.nhan_vien_id ?? "")])];
  const soHang = ((GIO_CUOI - GIO_DAU) * 60) / BUOC;
  const moFormMoi = !!sp.khach;
  let khachMoi = null;
  if (sp.khach) khachMoi = (await db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, nguoi_phu_trach_id").eq("id", sp.khach).maybeSingle()).data;
  const sua = coQuyen(nd, "lich.sua");

  return (
    <>
      <TieuDeTrang tieuDe="Lịch hẹn" phu={`${ngayVN(ngay)} · ${(lich ?? []).filter((l) => !["huy", "khong_den"].includes(l.trang_thai)).length} lịch đang hiệu lực`}>
        {sua && <FormLichHen nhan="Đặt lịch" dichVu={dichVu} nhanVien={nvLC} chiNhanh={cnLC} tim={timKhach} action={luuLichHen} ban={{ khach: khachMoi, chiNhanhId: cnId }} mo={moFormMoi} homNay={ngay} />}
      </TieuDeTrang>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-[14px]">
        <Link href={`/lich-hen?ngay=${congNgay(ngay, -1)}&cn=${cnId}${duoi}`} className="rounded-nho border border-vien-dam px-3 py-2 hover:bg-giay-tram">Hôm trước</Link>
        <Link href={`/lich-hen?ngay=${homNay}&cn=${cnId}${duoi}`} className={`rounded-nho border px-3 py-2 ${ngay === homNay ? "border-nhan bg-nhan-nhat text-nhan-dam" : "border-vien-dam hover:bg-giay-tram"}`}>Hôm nay</Link>
        <Link href={`/lich-hen?ngay=${congNgay(ngay, 1)}&cn=${cnId}${duoi}`} className="rounded-nho border border-vien-dam px-3 py-2 hover:bg-giay-tram">Hôm sau</Link>
        {!nd.chiNhanhId && (dsCn?.length ?? 0) > 1 && (dsCn ?? []).map((c) => <Link key={c.id} href={`/lich-hen?ngay=${ngay}&cn=${c.id}${duoi}`} className={`rounded-nho px-3 py-2 ${c.id === cnId ? "bg-nhan-nhat font-medium text-nhan-dam" : "text-muc-3 hover:text-muc"}`}>{c.ten}</Link>)}
        <span className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">
          <LocNguon giaTri={nguon} />
          <a href={xuat(ngay, ngay)} download className="rounded-nho border border-vien-dam px-3 py-2 hover:bg-giay-tram" aria-label={`Xuất Excel lịch hẹn ngày ${ngayVN(ngay)}`}>Xuất Excel ngày</a>
          <a href={xuat(dauThang, cuoiThang)} download className="rounded-nho border border-vien-dam px-3 py-2 hover:bg-giay-tram" aria-label={`Xuất Excel lịch hẹn tháng ${ngay.slice(5, 7)}/${ngay.slice(0, 4)}`}>Xuất cả tháng</a>
        </span>
      </div>

      {cot.length > 0 && (
        <div className="mb-8 overflow-x-auto rounded-the border border-vien bg-giay-sang">
          <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `56px repeat(${cot.length}, minmax(150px, 1fr))` }}>
            <div className="border-b border-vien" />
            {cot.map((c) => <div key={c} className="border-b border-l border-vien px-3 py-2 text-[13px] font-medium text-muc">{c ? tenNv.get(c) : "Chưa phân người"}</div>)}
            <div className="grid" style={{ gridTemplateRows: `repeat(${soHang}, 26px)` }}>
              {Array.from({ length: soHang }, (_, i) => <div key={i} className={`pr-2 text-right text-[11px] leading-[26px] text-muc-3 ${i % 2 ? "" : "border-t border-vien"}`}>{i % 2 === 0 ? `${GIO_DAU + i / 2}:00` : ""}</div>)}
            </div>
            {cot.map((c) => (
              <div key={c} className="relative grid border-l border-vien" style={{ gridTemplateRows: `repeat(${soHang}, 26px)` }}>
                {Array.from({ length: soHang }, (_, i) => <div key={i} className={i % 2 ? "" : "border-t border-vien"} />)}
                {(lich ?? []).filter((l) => (l.nhan_vien_id ?? "") === c && !["huy", "khong_den"].includes(l.trang_thai)).map((l) => {
                  const bd = Math.max(0, gioTrongNgay(l.bat_dau) - GIO_DAU * 60);
                  const dai = Math.max(BUOC, Math.round((new Date(l.ket_thuc).getTime() - new Date(l.bat_dau).getTime()) / 60000));
                  const dong = Math.min(soHang, Math.floor(bd / BUOC)) + 1;
                  const cuoi = Math.min(soHang + 1, dong + Math.ceil(dai / BUOC));
                  return (
                    <div key={l.id} className={`absolute inset-x-1 overflow-hidden rounded-nho border-l-[3px] px-2 py-1 text-[12px] leading-tight ${TT[l.trang_thai].mau}`} style={{ top: (dong - 1) * 26 + 1, height: (cuoi - dong) * 26 - 2 }} title={`${tenK.get(l.khach_id)?.ho_ten} · ${TT[l.trang_thai].nhan}`}>
                      <div className="font-medium">{gioVN(l.bat_dau)} {tenK.get(l.khach_id)?.ho_ten}</div>
                      <div className="truncate opacity-80">{(ld ?? []).filter((x) => x.lich_id === l.id).map((x) => tenDv.get(x.dich_vu_id)).join(", ")}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-vien border-y border-vien">
        {(lich ?? []).length === 0 && <p className="chu-tieu-de py-12 text-center text-[24px] text-muc-3">{nguon ? `Không có lịch hẹn nào từ nguồn ${nhanNguon(nguon)} trong ngày.` : "Chưa có lịch hẹn nào trong ngày."}</p>}
        {(lich ?? []).map((l) => {
          const k = tenK.get(l.khach_id);
          const t = TT[l.trang_thai];
          const dvIds = (ld ?? []).filter((x) => x.lich_id === l.id).map((x) => x.dich_vu_id);
          const phieu = (ph ?? []).filter((p) => p.lich_hen_id === l.id).map((p) => `${p.ma}: ${NHAN_PHIEU[p.trang_thai]}`);
          const theKhach = (the ?? []).filter((x) => x.khach_id === l.khach_id);
          const nvDefault = l.nhan_vien_id ?? "";
          return (
            <article key={l.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-4">
              <div className="min-w-[240px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[17px] font-semibold tabular-nums text-muc">{gioVN(l.bat_dau)}–{gioVN(l.ket_thuc)}</span>
                  <NhanTrangThai kieu={t.kieu}>{t.nhan}</NhanTrangThai>
                </div>
                <div className="mt-1 text-[15px]"><Link href={`/khach-hang/${l.khach_id}`} className="font-medium text-nhan-dam hover:underline">{k?.ho_ten}</Link> <span className="text-muc-3">· {k?.dien_thoai}</span></div>
                <div className="text-[13px] text-muc-2">{dvIds.map((d) => tenDv.get(d)).join(", ")}{l.nhan_vien_id ? ` · ${tenNv.get(l.nhan_vien_id)}` : ""}{l.phong ? ` · ${l.phong}` : ""}</div>
                {(l.nguon || l.kieu_lap) && <div className="text-[12px] text-muc-3">{[l.nguon ? `Nguồn: ${nhanNguon(l.nguon)}` : "", moTaLap(l)].filter(Boolean).join(" · ")}</div>}
                {l.ghi_chu && <div className="text-[13px] text-muc-3">{l.ghi_chu}</div>}
                {phieu.length > 0 && <div className="mt-0.5 text-[12px] text-dat-dam">{phieu.join(" · ")}</div>}
                {(coQuyen(nd, "bc.bao") || coQuyen(nd, "kn.ghi")) && ["cho_phuc_vu", "dang_phuc_vu", "hoan_thanh"].includes(l.trang_thai) && (
                  <div className="mt-1.5"><NutHop kieu="chu" nguy nhan="Báo bất thường" tieuDe={`Báo bất thường: ${k?.ho_ten ?? ""}`} moTa="Thấy đỏ, rát, phồng, sưng, chóng mặt...: ngừng thao tác gây rủi ro, đưa khách đến bác sĩ rồi ghi vào đây. Bác sĩ và lãnh đạo nhận thông báo ngay." action={baoBienChung} an={{ khach_id: l.khach_id }} giaTri={{ dich_vu_id: dvIds.length === 1 ? dvIds[0] : "" }} rong nhanLuu="Báo ngay" truong={truongBaoBatThuong((dv ?? []).map((d) => ({ gia_tri: d.id, nhan: `${d.ma} · ${d.ten}` })), false)} /></div>
                )}
              </div>
              {sua && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {l.trang_thai === "chua_xac_nhan" && <NutNhanh chinh nhan="Xác nhận" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "da_xac_nhan" }} />}
                  {l.trang_thai === "da_xac_nhan" && <NutNhanh chinh nhan="Khách đã đến" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "cho_phuc_vu" }} />}
                  {l.trang_thai === "cho_phuc_vu" && <NutNhanh chinh nhan="Mở ca" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "dang_phuc_vu" }} />}
                  {l.trang_thai === "dang_phuc_vu" && <NutNhanh chinh nhan="Hoàn thành" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "hoan_thanh" }} />}
                  {coQuyen(nd, "phieu.xem") && ["cho_phuc_vu", "dang_phuc_vu", "da_xac_nhan"].includes(l.trang_thai) && <Link href={`/phieu-cap?lich=${l.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Phiếu cấp vật tư</Link>}
                  {["dang_phuc_vu", "hoan_thanh", "cho_phuc_vu"].includes(l.trang_thai) && coQuyen(nd, "ban.tao") && <Link href={`/ban-hang?lich=${l.id}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Thanh toán</Link>}
                  {["cho_phuc_vu", "dang_phuc_vu"].includes(l.trang_thai) && theKhach.length > 0 && coQuyen(nd, "the.thuchien") && (
                    <NutHop kieu="chu" nhan="Dùng thẻ" tieuDe="Dùng thẻ liệu trình" moTa="Trừ 1 buổi của thẻ cho lịch hẹn này." rong nhanLuu="Đã làm xong" an={{ lich_id: l.id }}
                      giaTri={{ nv_id: nvDefault, the_id: theKhach.length === 1 ? theKhach[0].id ?? "" : "", dich_vu_id: dvIds.length === 1 ? dvIds[0] : "", ngay }}
                      truong={[{ ten: "the_id", nhan: "Thẻ", loai: "chon", batBuoc: true, rong: true, luaChon: theKhach.map((x) => ({ gia_tri: x.id ?? "", nhan: `${x.ma} · còn ${x.so_buoi_con} buổi` })) },
                        { ten: "dich_vu_id", nhan: "Dịch vụ đã làm", loai: "chon", batBuoc: true, rong: true, luaChon: (dv ?? []).filter((d) => !(lk ?? []).some((x) => theKhach.some((tk) => tk.goi_id === x.goi_id)) || (lk ?? []).some((x) => x.dich_vu_id === d.id && theKhach.some((tk) => tk.goi_id === x.goi_id))).map((d) => ({ gia_tri: d.id, nhan: d.ten })) },
                        { ten: "nv_id", nhan: "Người thực hiện", loai: "chon", luaChon: nvLC, batBuoc: true }, { ten: "bac_si_id", nhan: "Bác sĩ chỉ định", loai: "chon", luaChon: bsLC },
                        { ten: "vung", nhan: "Vùng làm", loai: "chu" }, { ten: "shot", nhan: "Số shot thực tế", loai: "so" }, { ten: "line", nhan: "Số line thực tế", loai: "so" }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong" }]} action={thucHienBuoi} />
                  )}
                  {["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"].includes(l.trang_thai) && (
                    <FormLichHen kieu="chu" nhan="Đổi lịch" dichVu={dichVu} nhanVien={nvLC} chiNhanh={cnLC} tim={timKhach} action={luuLichHen} homNay={ngay}
                      sua={{ id: l.id, khach: { id: l.khach_id, ma: k?.ma ?? "", ho_ten: k?.ho_ten ?? "", dien_thoai: k?.dien_thoai ?? "", nguoi_phu_trach_id: k?.nguoi_phu_trach_id ?? "" }, ngay: ngayCuaIso(l.bat_dau), gio: gioVN(l.bat_dau), thoiLuong: Math.round((new Date(l.ket_thuc).getTime() - new Date(l.bat_dau).getTime()) / 60000), nhanVienId: l.nhan_vien_id ?? "", phong: l.phong ?? "", nguon: l.nguon ?? "", ghiChu: l.ghi_chu ?? "", dichVuIds: dvIds, chiNhanhId: l.chi_nhanh_id }} />
                  )}
                  {["da_xac_nhan", "cho_phuc_vu"].includes(l.trang_thai) && <NutNhanh nhan="Không đến" action={doiTrangThaiLich} du={{ id: l.id, trang_thai: "khong_den" }} />}
                  {["chua_xac_nhan", "da_xac_nhan", "cho_phuc_vu"].includes(l.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ" tieuDe="Huỷ lịch hẹn" an={{ id: l.id, trang_thai: "huy" }} nhanLuu="Huỷ lịch" truong={[{ ten: "ly_do", nhan: "Lý do huỷ", loai: "chu", batBuoc: true, rong: true }]} action={doiTrangThaiLich} />}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-muc-3">Mở ca chỉ được khi dịch vụ có vật tư nhóm A đã có phiếu cấp và KTV bấm Đã nhận.</p>
    </>
  );
}
