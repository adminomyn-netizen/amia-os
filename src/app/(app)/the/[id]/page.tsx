import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayCuaIso, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { NutBuoi } from "@/components/the/NutBuoi";
import { NutSuaThe } from "@/components/the/NutSuaThe";
import { dieuChinhThe, doiTrangThaiThe, henBuoiKeTiep, huyBuoi, thucHienBuoi, thuHoiThe } from "../actions";
import { NhanTinhTrangThe } from "@/components/the/NhanTinhTrangThe";
import { lichSuSuaThe } from "@/lib/lich-su-sua-the";
import { MAU_TRANG_THAI, NHAN_TRANG_THAI } from "@/lib/lich-hen";
import { luaChonNhanVien } from "@/lib/lua-chon-nhan-vien";

const NHAN_LOAI: Record<string, string> = { cap: "Cấp thẻ", dung_buoi: "Dùng 1 buổi", hoan_buoi: "Hoàn buổi", dieu_chinh: "Điều chỉnh", nap: "Nạp tiền", tru_tien: "Trừ tiền", hoan_tien: "Hoàn tiền", thu_hoi: "Thu hồi", khoa: "Khoá thẻ", mo_khoa: "Mở khoá thẻ", sua_the: "Sửa thẻ" };

export default async function HoSoThe({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const { id } = await params;
  const db = sb();
  const { data: t } = await db.from("v_the_khach").select("*").eq("id", id).maybeSingle();
  if (!t || (nd.chiNhanhId && t.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: so }, { data: buoi }, { data: nv }, { data: k }, { data: g }, { data: dv }, { data: lk }, { data: heKt }] = await Promise.all([
    db.from("the_so_cai").select("*").eq("the_id", id).order("id", { ascending: false }),
    db.from("buoi_thuc_hien").select("*").eq("the_id", id).order("tao_luc", { ascending: false }),
    db.from("nhan_vien").select("id, ho_ten, vai_tro, hoat_dong"), db.from("khach_hang").select("id, ho_ten, ma").eq("id", t.khach_id ?? "").maybeSingle(),
    db.from("goi_the").select("ten").eq("id", t.goi_id ?? "").maybeSingle(), db.from("dich_vu").select("id, ten").eq("hoat_dong", true),
    db.from("goi_the_dich_vu").select("dich_vu_id").eq("goi_id", t.goi_id ?? ""),
    db.from("the_buoi_ke_tiep").select("id, ngay_hen, noi_dung, nguoi_id, tao_luc").eq("the_id", id).order("ngay_hen", { ascending: false }).limit(10),
  ]);
  // Lịch hẹn của chủ thẻ (lich_hen không gắn thẻ; lịch nào đã trừ buổi của CHÍNH thẻ này thì đánh dấu theo buoi_thuc_hien.lich_hen_id).
  const xemLich = coQuyen(nd, "lich.xem"), bayGio = new Date().toISOString();
  const lichCuaThe = new Set((buoi ?? []).filter((b) => b.trang_thai !== "huy" && b.lich_hen_id).map((b) => b.lich_hen_id as string));
  const COT_LICH = "id, bat_dau, trang_thai, dich_vu_ten, nhan_vien_id, nhan_vien_ten, chi_nhanh_id, ma_dat_lich";
  const qLich = () => { const q = db.from("lich_hen").select(COT_LICH).eq("khach_id", t.khach_id ?? ""); return nd.chiNhanhId ? q.eq("chi_nhanh_id", nd.chiNhanhId) : q; };
  const [{ data: lichToi }, { data: lichQua }] = xemLich && t.khach_id ? await Promise.all([
    qLich().gte("bat_dau", bayGio).order("bat_dau").limit(10), qLich().lt("bat_dau", bayGio).order("bat_dau", { ascending: false }).limit(10),
  ]) : [{ data: [] }, { data: [] }];
  const thieu = [...lichCuaThe].filter((x) => !(lichQua ?? []).some((l) => l.id === x) && !(lichToi ?? []).some((l) => l.id === x));
  const { data: lichThem } = thieu.length && xemLich ? await qLich().in("id", thieu) : { data: [] };
  const dsLich = [...(lichToi ?? []).map((l) => ({ ...l, toi: true })), ...[...(lichQua ?? []), ...(lichThem ?? [])].sort((a, b) => b.bat_dau.localeCompare(a.bat_dau)).map((l) => ({ ...l, toi: false }))];
  // Lịch không ghi sẵn tên dịch vụ thì lấy từ lich_hen_dich_vu (như hồ sơ khách).
  const idsThieuDv = dsLich.filter((l) => !l.dich_vu_ten).map((l) => l.id);
  const { data: lhdv } = idsThieuDv.length ? await db.from("lich_hen_dich_vu").select("lich_id, dich_vu(ten)").in("lich_id", idsThieuDv) : { data: [] as { lich_id: string; dich_vu: { ten: string } | null }[] };
  const dvLich = new Map<string, string[]>();
  for (const d of lhdv ?? []) { const ten = (d.dich_vu as unknown as { ten: string } | null)?.ten; if (ten) dvLich.set(d.lich_id, [...(dvLich.get(d.lich_id) ?? []), ten]); }
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const dsSua = lichSuSuaThe(so ?? [], t.loai ?? "lan");
  const tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const dvLC = (lk?.length ? (dv ?? []).filter((d) => lk.some((l) => l.dich_vu_id === d.id)) : dv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }));
  // Ô chọn người làm / bác sĩ: chỉ nhân viên đang làm (tên người đã nghỉ vẫn hiện ở các dòng cũ qua tenNv).
  const nvDangLam = (nv ?? []).filter((n) => n.hoat_dong);
  const nvLC = luaChonNhanVien(nvDangLam.filter((n) => n.vai_tro !== "nha_dau_tu"));
  const bsLC = [{ gia_tri: "", nhan: "Không có" }, ...nvDangLam.filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  const dieuChinh = coQuyen(nd, "the.dieuchinh");

  return (
    <>
      <TieuDeNoi tieuDe={t.ma ?? ""} phu={<span className="flex flex-wrap items-center gap-2"><span>{g?.ten}</span><NhanTinhTrangThe tt={t.tinh_trang} />{k && <Link href={`/khach-hang/${k.id}`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten} · {k.ma}</Link>}{t.cap_tay && <NhanTrangThai kieu="cho">Cấp tay, không tính doanh thu</NhanTrangThai>}</span>}>
        {t.loai === "lan" && coQuyen(nd, "the.thuchien") && (t.tinh_trang === "hoat_dong" || t.tinh_trang === "sap_het") && <NutBuoi theId={id} nhanVien={nvLC} bacSi={bsLC} dichVu={dvLC} action={thucHienBuoi} nhan="Thực hiện buổi" />}
        {t.loai === "lan" && coQuyen(nd, "the.thuchien") && (t.tinh_trang === "hoat_dong" || t.tinh_trang === "sap_het") && <NutHop kieu="phu" nhan="Hẹn buổi kế tiếp" tieuDe="Hẹn buổi kế tiếp" moTa="Ghi ngày + nội dung buổi sau và tạo nhắc ở hồ sơ khách. Không trừ buổi, không đổi tiền." an={{ the_id: id }} truong={[{ ten: "ke_tiep_ngay", nhan: "Ngày hẹn", loai: "ngay", batBuoc: true }, { ten: "ke_tiep_noi_dung", nhan: "Nội dung buổi kế tiếp", loai: "nhieu_dong", goiY: "Vd: làm vùng cổ, kiểm tra sau 2 tuần" }]} action={henBuoiKeTiep} />}
        {dieuChinh && t.trang_thai !== "thu_hoi" && <NutSuaThe kieu="chinh" t={{ id, ma: t.ma ?? "", loai: t.loai ?? "lan", han_dung: t.han_dung, gia_tri_buoi: t.gia_tri_buoi, ghi_chu: t.ghi_chu }} maKhach={k?.ma ?? ""} />}
        {dieuChinh && <NutHop kieu="phu" nhan="Điều chỉnh số dư" tieuDe="Điều chỉnh thẻ" moTa="Cộng hoặc trừ (dùng số âm). Mọi điều chỉnh đều ghi lý do vào lịch sử." an={{ the_id: id }} truong={[{ ten: t.loai === "lan" ? "so_buoi" : "so_tien", nhan: t.loai === "lan" ? "Số buổi cộng/trừ (VD 2 hoặc -1)" : "Số tiền cộng/trừ (VD 500000 hoặc -200000)", loai: "chu", batBuoc: true, rong: true }, { ten: "ly_do", nhan: "Lý do", loai: "nhieu_dong", batBuoc: true }]} action={dieuChinhThe} />}
        {dieuChinh && t.trang_thai !== "thu_hoi" && <NutHop kieu="phu" nhan={t.trang_thai === "khoa" ? "Mở khoá thẻ" : "Khoá thẻ"} tieuDe={t.trang_thai === "khoa" ? "Mở khoá thẻ" : "Khoá thẻ"} moTa={t.trang_thai === "khoa" ? "Cho phép dùng thẻ trở lại. Lý do được ghi vào lịch sử thẻ." : "Thẻ khoá không dùng được cho tới khi mở lại. Lý do được ghi vào lịch sử thẻ."} an={{ the_id: id, trang_thai: t.trang_thai === "khoa" ? "hoat_dong" : "khoa" }} truong={[{ ten: "ly_do", nhan: t.trang_thai === "khoa" ? "Lý do mở khoá" : "Lý do khoá", loai: "nhieu_dong", batBuoc: true, goiY: t.trang_thai === "khoa" ? "Vd: khách đã thanh toán đủ, xác nhận lại" : "Vd: khách tranh chấp hoá đơn, chờ chị Dung xác nhận" }]} nhanLuu="Xác nhận" action={doiTrangThaiThe} />}
        {dieuChinh && t.trang_thai !== "thu_hoi" && <NutHop kieu="chu" nguy nhan="Thu hồi thẻ" tieuDe={`Thu hồi thẻ ${t.ma ?? ""}`}
          moTa="Thẻ đã thu hồi KHÔNG cấp lại được, chỉ có thể cấp thẻ mới. Thu hồi không hoàn tiền và không đụng tới hoá đơn, sổ quỹ: nếu trả tiền cho khách thì ghi một phiếu chi ở Sổ quỹ."
          an={{ the_id: id }} truong={[{ ten: "ly_do", nhan: "Lý do thu hồi", loai: "nhieu_dong", batBuoc: true, goiY: "Vd: khách chuyển nhượng, cấp nhầm thẻ" }]} nhanLuu="Thu hồi thẻ" action={thuHoiThe} />}
      </TieuDeNoi>
      {t.trang_thai === "thu_hoi" && (() => { const k0 = (so ?? []).find((r) => r.loai === "thu_hoi"); return <p className="mb-4 rounded-nho border border-vien bg-loi-nen px-4 py-3 text-[14px] text-loi">Thẻ đã thu hồi{k0 ? <>: {k0.ghi_chu} <span className="text-muc-3">({ngayGioVN(k0.tao_luc)}{tenNv.get(k0.nguoi_id ?? "") ? `, ${tenNv.get(k0.nguoi_id ?? "")}` : ""})</span></> : " (chuyển từ SalonHero)."}</p>; })()}
      {t.trang_thai === "khoa" && (() => { const k0 = (so ?? []).find((r) => r.loai === "khoa"); return k0 ? <p className="mb-4 rounded-nho border border-vien bg-dat-nen px-4 py-3 text-[14px] text-muc-2">Thẻ đang khoá: {k0.ghi_chu} <span className="text-muc-3">({ngayGioVN(k0.tao_luc)}{tenNv.get(k0.nguoi_id ?? "") ? `, ${tenNv.get(k0.nguoi_id ?? "")}` : ""})</span></p> : null; })()}
      <HangChiSo muc={t.loai === "lan"
        ? [{ nhan: "Buổi còn lại", so: (t.so_buoi_tong ?? 0) >= 999999 ? "Không giới hạn" : `${t.so_buoi_con}/${t.so_buoi_tong}` }, { nhan: "Doanh thu mỗi buổi", so: tienVN(t.gia_tri_buoi) }, { nhan: "Ngày cấp", so: ngayVN(t.ngay_cap) }, { nhan: "Hạn dùng", so: ngayVN(t.han_dung) || "Không hạn" }]
        : [{ nhan: "Số dư", so: tienVN(t.so_du_tien) }, { nhan: "Đã nạp", so: tienVN(t.tong_tien) }, { nhan: "Ngày cấp", so: ngayVN(t.ngay_cap) }, { nhan: "Hạn dùng", so: ngayVN(t.han_dung) || "Không hạn" }]} />
      <div className="mt-8 space-y-8">
        {t.loai === "lan" && (
          <MucTrang noi tieuDe="Các buổi đã làm">
            <Bang duLieu={buoi ?? []} khoa={(r) => r.id} trong="Chưa làm buổi nào." cot={[
              { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_lam) }, { nhan: "Dịch vụ", hienThi: (r) => tenDv.get(r.dich_vu_id) ?? "" }, { nhan: "Người làm", hienThi: (r) => tenNv.get(r.nv_thuc_hien_id) ?? "" },
              { nhan: "Tham số", hienThi: (r) => Object.entries((r.tham_so ?? {}) as Record<string, unknown>).map(([a, b]) => `${a}: ${b}`).join(", ") },
              { nhan: "Doanh thu buổi", hienThi: (r) => (r.trang_thai === "huy" ? <s className="text-muc-3">{tienVN(r.doanh_thu_buoi)}</s> : tienVN(r.doanh_thu_buoi)), phai: true },
              { nhan: "", hienThi: (r) => (r.trang_thai === "huy" ? <span className="text-[13px] text-muc-3">Đã huỷ: {r.ly_do_huy}</span> : dieuChinh ? <NutHop kieu="chu" nguy nhan="Huỷ buổi" tieuDe="Huỷ buổi đã làm" moTa="Hoàn lại 1 buổi vào thẻ." an={{ buoi_id: r.id, the_id: id }} nhanLuu="Huỷ buổi" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={huyBuoi} /> : null) },
            ]} />
          </MucTrang>
        )}
        {t.loai === "lan" && (heKt ?? []).length > 0 && (
          <MucTrang noi tieuDe="Hẹn buổi kế tiếp">
            <Bang duLieu={heKt ?? []} khoa={(r) => r.id} cot={[
              { nhan: "Ngày hẹn", chinh: true, hienThi: (r) => ngayVN(r.ngay_hen) }, { nhan: "Nội dung", hienThi: (r) => r.noi_dung ?? "" },
              { nhan: "Người ghi", hienThi: (r) => tenNv.get(r.nguoi_id ?? "") ?? "" }, { nhan: "Ghi lúc", hienThi: (r) => ngayGioVN(r.tao_luc) },
            ]} />
          </MucTrang>
        )}
        {xemLich && (
          <MucTrang noi tieuDe="Lịch hẹn của khách">
            <Bang duLieu={dsLich} khoa={(r) => r.id} trong="Khách chưa có lịch hẹn nào." cot={[
              { nhan: "Giờ hẹn", chinh: true, hienThi: (r) => <span className="tabular-nums">{ngayGioVN(r.bat_dau)}{r.toi && <span className="ml-2 text-[12px] font-medium text-nhan-dam">Sắp tới</span>}</span> },
              { nhan: "Dịch vụ", hienThi: (r) => <span>{r.dich_vu_ten || (dvLich.get(r.id) ?? []).join(", ")}{lichCuaThe.has(r.id) && <span className="ml-2 inline-block rounded-tag bg-sac-luc-nen px-1.5 text-[12px] font-medium text-sac-luc">Đã trừ buổi thẻ này</span>}</span> },
              { nhan: "Người làm", hienThi: (r) => tenNv.get(r.nhan_vien_id ?? "") ?? r.nhan_vien_ten ?? "" },
              { nhan: "Trạng thái", hienThi: (r) => <span className={`inline-block rounded-tag px-2 py-0.5 text-[12px] font-medium ${MAU_TRANG_THAI[r.trang_thai]?.chip ?? "bg-giay-tram text-muc-2"}`}>{NHAN_TRANG_THAI[r.trang_thai] ?? r.trang_thai}</span> },
              { nhan: "", hienThi: (r) => { const d = ngayCuaIso(r.bat_dau); return <Link href={`/lich-hen?tu=${d}&den=${d}&ngay=${d}&cn=${r.chi_nhanh_id}&q=${encodeURIComponent(r.ma_dat_lich ?? "")}`} className="text-[13px] font-medium text-nhan-dam hover:underline">Mở lịch</Link>; } },
            ]} />
            <p className="mt-2 text-[12.5px] text-muc-3">10 lịch sắp tới và 10 lịch gần nhất của khách{nd.chiNhanhId ? " tại chi nhánh của bạn" : ""}, kèm mọi lịch đã trừ buổi của thẻ này.</p>
          </MucTrang>
        )}
        <MucTrang noi tieuDe="Lịch sử sửa thẻ">
          <Bang duLieu={dsSua} khoa={(r) => r.id} trong="Thẻ chưa được sửa lần nào." cot={[
            { nhan: "Lúc", chinh: true, hienThi: (r) => <span className="tabular-nums">{ngayGioVN(r.luc)}</span> },
            { nhan: "Người sửa", hienThi: (r) => tenNv.get(r.nguoiId ?? "") ?? "" },
            { nhan: "Việc", hienThi: (r) => r.viec },
            { nhan: "Thay đổi (cũ → mới)", hienThi: (r) => (
              <ul className="space-y-0.5">{r.thayDoi.map((d, i) => <li key={i} className="[overflow-wrap:anywhere]"><span className="text-muc-3">{d.truong}: </span>{d.cu !== null && <><span className="text-muc-3 line-through decoration-muc-3/60">{d.cu}</span> → </>}<span className="font-medium text-muc">{d.moi}</span></li>)}</ul>
            ) },
            { nhan: "Lý do", hienThi: (r) => r.lyDo ?? "" },
          ]} />
        </MucTrang>
        <MucTrang noi tieuDe="Lịch sử thẻ (sổ cái, chỉ thêm)">
          <Bang duLieu={so ?? []} khoa={(r) => String(r.id)} cot={[
            { nhan: "Lúc", hienThi: (r) => ngayGioVN(r.tao_luc) }, { nhan: "Việc", hienThi: (r) => NHAN_LOAI[r.loai] ?? r.loai }, { nhan: "Người ghi", hienThi: (r) => tenNv.get(r.nguoi_id ?? "") ?? "" }, { nhan: "Ghi chú", hienThi: (r) => r.ghi_chu ?? "" },
            { nhan: t.loai === "lan" ? "Buổi" : "Tiền", hienThi: (r) => (t.loai === "lan" ? (r.so_buoi > 0 ? `+${r.so_buoi}` : r.so_buoi) : (Number(r.so_tien) > 0 ? "+" : "") + tienVN(r.so_tien)), phai: true },
          ]} />
        </MucTrang>
      </div>
    </>
  );
}
