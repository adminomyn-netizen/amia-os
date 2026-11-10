import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauMotTrong } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { gioVN, ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { KENH_LIEN_HE, KET_QUA_LIEN_HE, TT_LIEN_HE } from "@/lib/marketing";
import { capNhatTruoc, HOAT_DONG_GHI_TAY, KET_QUA_LEAD, LOAI_HOAT_DONG, NHAN_TEP, SO_TEP_TAI_TAY, quaSla } from "@/lib/lead";
import { layLeadDuocXem } from "@/lib/lead-quyen";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { ChonGiaiDoan } from "@/components/lead/DoiGiaiDoan";
import { TaiTepLead } from "@/components/lead/TepLead";
import { chuyenLeadThanhKhach, danhDauLead, ghiLienHe, giaoLead, nhanLead } from "../../actions";
import { dongNhac, dongTacVu, doiNhanTep, ganKhachLead, ghiHoatDong, goHoTro, suaThongTinLead, taoNhac, taoTacVu, themHoTro, xoaTepLead } from "../actions";

const TAB = [{ ma: "thong-tin", ten: "Thông tin" }, { ma: "hoat-dong", ten: "Hoạt động" }, { ma: "tac-vu", ten: "Tác vụ" }, { ma: "nhac", ten: "Nhắc việc" }, { ma: "tep", ten: "Tệp" }];
const O_THONG_TIN = "grid gap-x-6 gap-y-3 sm:grid-cols-2";
const Dong = ({ nhan, children }: { nhan: string; children: React.ReactNode }) => (
  <div className="min-w-0"><dt className="text-[12.5px] text-muc-3">{nhan}</dt><dd className="mt-0.5 text-[14.5px] text-muc [overflow-wrap:anywhere]">{children}</dd></div>
);
const The = ({ tieuDe, children, hanhDong }: { tieuDe: string; children: React.ReactNode; hanhDong?: React.ReactNode }) => (
  <section className="khung-bang mb-4 p-4 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[15px] font-semibold text-muc">{tieuDe}</h2>{hanhDong}</div>
    {children}
  </section>
);

/** Khung làm việc của một lead (BeDental "Bảng làm việc Lead"): 5 tab Thông tin · Hoạt động · Tác vụ · Nhắc việc · Tệp. */
export default async function TrangLeadChiTiet({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; so?: string; nhan?: string }> }) {
  const nd = await yeuCauMotTrong(["lead.xu_ly", "mkt.xem"]);
  const { id } = await params;
  const sp = await searchParams;
  const tab = TAB.some((t) => t.ma === sp.tab) ? sp.tab! : "thong-tin";
  const lead = await layLeadDuocXem(id, nd);
  if (!lead) notFound();
  const db = sb();
  const ghi = coQuyen(nd, "lead.xu_ly") && nd.vaiTro !== "chi_xem", duyet = coQuyen(nd, "mkt.duyet");
  const [{ data: gdAll }, { data: lyDo }, { data: htRows }, { data: nv }, { count: soTacVu }, { count: soNhac }, { count: soTep }] = await Promise.all([
    db.from("lead_giai_doan").select("id, ten, mau, thu_tu, sla_phut, la_thang, la_thua, dang_dung").order("thu_tu"),
    db.from("lead_ly_do_thua").select("id, ten, dang_dung").order("thu_tu"),
    db.from("lead_nguoi_ho_tro").select("nhan_vien_id").eq("lead_id", id),
    db.from("nhan_vien").select("id, ho_ten, hoat_dong").order("ho_ten"),
    db.from("lead_tac_vu").select("id", { count: "exact", head: true }).eq("lead_id", id).eq("trang_thai", "mo"),
    db.from("lead_nhac").select("id", { count: "exact", head: true }).eq("lead_id", id).eq("trang_thai", "cho"),
    db.from("lead_tep").select("id", { count: "exact", head: true }).eq("lead_id", id),
  ]);
  const hoTro = (htRows ?? []).map((h) => h.nhan_vien_id);
  const sua = ghi && (duyet || lead.owner_id === nd.nhanVienId || hoTro.includes(nd.nhanVienId));
  const mo = lead.ket_qua === "open";
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const nvDangLam = (nv ?? []).filter((n) => n.hoat_dong).map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const gd = (gdAll ?? []).find((g) => g.id === lead.giai_doan_id);
  const cotChon = (gdAll ?? []).filter((g) => g.dang_dung).sort((a, b) => Number(a.la_thang || a.la_thua) - Number(b.la_thang || b.la_thua) || a.thu_tu - b.thu_tu);
  const lyDoChon = (lyDo ?? []).filter((l) => l.dang_dung).map((l) => ({ gia_tri: l.id, nhan: l.ten }));
  const nguoiLead = [...new Set([...(lead.owner_id ? [lead.owner_id] : []), ...hoTro])].map((x) => ({ gia_tri: x, nhan: tenNv.get(x) ?? "?" }));
  const truongLH: Truong[] = [
    { ten: "kenh", nhan: "Kênh", loai: "chon", batBuoc: true, luaChon: Object.entries(KENH_LIEN_HE).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "ket_qua", nhan: "Kết quả", loai: "chon", batBuoc: true, luaChon: KET_QUA_LIEN_HE.map((k) => ({ gia_tri: k, nhan: TT_LIEN_HE[k].ten })) },
    { ten: "han_tiep", nhan: "Hẹn liên hệ tiếp", loai: "ngay", ghiChu: "Tự tạo nhắc việc 08:00 ngày đó cho người phụ trách." }, { ten: "ghi_chu", nhan: "Ghi chú (bắt buộc khi kết thúc lead)", loai: "nhieu_dong", rong: true },
  ];

  let noiDung: React.ReactNode = null;
  if (tab === "thong-tin") {
    const [{ data: nguon }, { data: dt }, { data: cn }, { data: kh }] = await Promise.all([
      db.from("nguon_lead").select("id, ten, hoat_dong").order("thu_tu"), db.from("doi_tac_gt").select("id, ten, hoat_dong").order("ten"), db.from("chi_nhanh").select("id, ten"),
      lead.khach_id ? db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("id", lead.khach_id).maybeSingle() : db.from("khach_hang").select("id, ma, ho_ten, dien_thoai").eq("dien_thoai", lead.sdt).maybeSingle(),
    ]);
    let tk: { den: number; gan: string | null; huy: number; no: number } | null = null;
    if (kh && coQuyen(nd, "khach.xem")) {
      const [{ count: den }, { data: gan }, { count: huy }, { data: no }] = await Promise.all([
        db.from("lich_hen").select("id", { count: "exact", head: true }).eq("khach_id", kh.id).eq("trang_thai", "hoan_thanh"),
        db.from("lich_hen").select("bat_dau").eq("khach_id", kh.id).eq("trang_thai", "hoan_thanh").order("bat_dau", { ascending: false }).limit(1).maybeSingle(),
        db.from("lich_hen").select("id", { count: "exact", head: true }).eq("khach_id", kh.id).in("trang_thai", ["huy", "khong_den"]),
        db.from("hoa_don").select("con_no").eq("khach_id", kh.id).eq("trang_thai", "hoan_thanh").gt("con_no", 0),
      ]);
      tk = { den: den ?? 0, gan: gan?.bat_dau ?? null, huy: huy ?? 0, no: (no ?? []).reduce((s, r) => s + Number(r.con_no), 0) };
    }
    const tenNguon = (nguon ?? []).find((n) => n.id === lead.nguon_id)?.ten, tenDt = (dt ?? []).find((n) => n.id === lead.doi_tac_id)?.ten;
    const truongSua: Truong[] = [
      { ten: "ho_ten", nhan: "Họ tên", loai: "chu", batBuoc: true }, { ten: "sdt", nhan: "Số điện thoại", loai: "chu", batBuoc: true },
      { ten: "email", nhan: "Email", loai: "email" }, { ten: "gia_tri_du_kien", nhan: "Giá trị dự kiến (đ)", loai: "tien" },
      { ten: "nguon_id", nhan: "Nguồn", loai: "chon", batBuoc: true, luaChon: (nguon ?? []).filter((n) => n.hoat_dong || n.id === lead.nguon_id).map((n) => ({ gia_tri: n.id, nhan: n.ten })) },
      { ten: "doi_tac_id", nhan: "Người giới thiệu", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không có" }, ...(dt ?? []).filter((n) => n.hoat_dong || n.id === lead.doi_tac_id).map((n) => ({ gia_tri: n.id, nhan: n.ten }))] },
      { ten: "dich_vu_quan_tam", nhan: "Dịch vụ quan tâm", loai: "chu" }, { ten: "nhu_cau", nhan: "Nhu cầu / ghi chú", loai: "nhieu_dong", rong: true },
    ];
    noiDung = (
      <>
        <The tieuDe="Thông tin lead" hanhDong={sua && <NutHop kieu="chu" nhan="Sửa thông tin" tieuDe="Sửa thông tin lead" truong={truongSua} action={suaThongTinLead} an={{ id }} rong
          giaTri={{ ho_ten: lead.ho_ten, sdt: lead.sdt, email: lead.email ?? "", gia_tri_du_kien: Number(lead.gia_tri_du_kien), nguon_id: lead.nguon_id, doi_tac_id: lead.doi_tac_id ?? "", dich_vu_quan_tam: lead.dich_vu_quan_tam ?? "", nhu_cau: lead.nhu_cau ?? "" }} />}>
          <dl className={O_THONG_TIN}>
            <Dong nhan="Giai đoạn"><span className="block max-w-[280px]"><ChonGiaiDoan id={id} giaTri={lead.giai_doan_id} cot={cotChon} lyDoThua={lyDoChon} voHieu={!sua} /></span></Dong>
            <Dong nhan="Trạng thái"><NhanTrangThai kieu={KET_QUA_LEAD[lead.ket_qua]?.kieu}>{KET_QUA_LEAD[lead.ket_qua]?.ten}</NhanTrangThai>{lead.ket_qua === "lost" && <span className="ml-2 text-[13px] text-muc-2">{(lyDo ?? []).find((l) => l.id === lead.ly_do_thua_id)?.ten ?? lead.ly_do}</span>}</Dong>
            <Dong nhan="Kết quả liên hệ gần nhất">{TT_LIEN_HE[lead.trang_thai_lien_he]?.ten ?? lead.trang_thai_lien_he}</Dong>
            <Dong nhan="Email">{lead.email ?? <span className="text-muc-3">Chưa có</span>}</Dong>
            <Dong nhan="Giá trị dự kiến">{tienVN(lead.gia_tri_du_kien)}</Dong>
            <Dong nhan="Nguồn">{tenNguon ?? ""}</Dong>
            <Dong nhan="Người giới thiệu">{tenDt ?? <span className="text-muc-3">Không có</span>}</Dong>
            <Dong nhan="Chi nhánh">{(cn ?? []).find((c) => c.id === lead.chi_nhanh_id)?.ten ?? ""}</Dong>
            <Dong nhan="Dịch vụ quan tâm">{lead.dich_vu_quan_tam ?? <span className="text-muc-3">Chưa ghi</span>}</Dong>
            <Dong nhan="Phát sinh">{ngayGioVN(lead.thoi_diem_phat_sinh)}</Dong>
            {lead.nhu_cau && <div className="sm:col-span-2"><Dong nhan="Nhu cầu / ghi chú"><span className="whitespace-pre-line">{lead.nhu_cau}</span></Dong></div>}
          </dl>
        </The>
        <The tieuDe="Người phụ trách & hỗ trợ" hanhDong={sua && <NutHop kieu="chu" nhan="Thêm người hỗ trợ" tieuDe="Thêm người hỗ trợ" truong={[{ ten: "nhan_vien_id", nhan: "Nhân viên", loai: "chon", batBuoc: true, luaChon: nvDangLam.filter((n) => n.gia_tri !== lead.owner_id && !hoTro.includes(n.gia_tri)) }]} action={themHoTro} an={{ id }} nhanLuu="Thêm" />}>
          <dl className={O_THONG_TIN}>
            <Dong nhan="Người phụ trách">{lead.owner_id ? tenNv.get(lead.owner_id) : <span className="text-canh-bao">Chưa ai nhận</span>}{lead.owner_id && !lead.owner_xac_nhan_luc && <span className="ml-2 text-[12.5px] text-muc-3">Chờ xác nhận</span>}</Dong>
            <Dong nhan="Người hỗ trợ">
              {hoTro.length === 0 ? <span className="text-muc-3">Chưa có</span> : (
                <ul className="space-y-1">{hoTro.map((h) => <li key={h} className="flex flex-wrap items-center gap-3">{tenNv.get(h)}{sua && <NutNhanh nhan="Bỏ" action={goHoTro} du={{ id, nhan_vien_id: h }} />}</li>)}</ul>
              )}
            </Dong>
          </dl>
        </The>
        <The tieuDe="Hồ sơ khách">
          {kh ? (
            <div className="space-y-3">
              <p className="text-[14px]">
                {lead.khach_id ? "Đã gắn: " : "Gợi ý khách cùng số điện thoại: "}
                {coQuyen(nd, "khach.xem") ? <Link href={`/khach-hang/${kh.id}`} className="font-medium text-nhan-dam hover:underline">{kh.ho_ten} ({kh.ma})</Link> : <b>{kh.ho_ten} ({kh.ma})</b>}
              </p>
              {tk && <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Dong nhan="Số lần đến">{tk.den}</Dong><Dong nhan="Lần gần nhất">{tk.gan ? ngayVN(new Date(tk.gan).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })) : "—"}</Dong><Dong nhan="Hủy / không đến">{tk.huy}</Dong><Dong nhan="Còn nợ">{tienVN(tk.no)}</Dong></dl>}
              {!lead.khach_id && sua && <NutHop kieu="phu" nhan="Đúng khách này" tieuDe="Xác nhận hồ sơ khách" xacNhan={`Gắn lead ${lead.ma} vào hồ sơ ${kh.ho_ten} (${kh.ma})?`} action={ganKhachLead} an={{ id, khach_id: kh.id }} nhanLuu="Gắn" />}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-muc-2">
              Lead chưa gắn hồ sơ khách và chưa có khách cùng số điện thoại.
              {sua && coQuyen(nd, "khach.sua") && <NutHop kieu="phu" nhan="Tạo hồ sơ khách" tieuDe="Chuyển thành khách" xacNhan={`Tạo khách từ lead ${lead.ma}?`} action={chuyenLeadThanhKhach} an={{ id }} nhanLuu="Tạo" />}
            </div>
          )}
        </The>
      </>
    );
  } else if (tab === "hoat-dong") {
    const so = Math.min(500, Math.max(30, Number(sp.so) || 30));
    const [{ data: hd }, { data: lh }] = await Promise.all([
      db.from("lead_hoat_dong").select("id, loai, noi_dung, nguoi_id, tao_luc").eq("lead_id", id).order("tao_luc", { ascending: false }).limit(so + 1),
      db.from("lead_lien_he").select("id, kenh, ket_qua, ghi_chu, han_tiep, nguoi_id, tao_luc").eq("lead_id", id).order("tao_luc", { ascending: false }).limit(so + 1),
    ]);
    const ds = [
      ...(hd ?? []).map((h) => ({ khoa: `h${h.id}`, loai: h.loai, chu: h.noi_dung ?? "", nguoi: h.nguoi_id, luc: h.tao_luc })),
      ...(lh ?? []).map((l) => ({ khoa: `l${l.id}`, loai: "lien_he", chu: `${KENH_LIEN_HE[l.kenh] ?? l.kenh} · ${TT_LIEN_HE[l.ket_qua]?.ten ?? l.ket_qua}${l.ghi_chu ? ` · ${l.ghi_chu}` : ""}${l.han_tiep ? ` · hẹn ${ngayVN(l.han_tiep)}` : ""}`, nguoi: l.nguoi_id, luc: l.tao_luc })),
    ].sort((a, b) => (a.luc < b.luc ? 1 : -1));
    noiDung = (
      <The tieuDe="Dòng thời gian" hanhDong={sua && (
        <span className="flex flex-wrap gap-4">
          <NutHop kieu="chu" nhan="Ghi hoạt động" tieuDe="Ghi hoạt động" truong={[{ ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: [...HOAT_DONG_GHI_TAY] }, { ten: "noi_dung", nhan: "Nội dung", loai: "nhieu_dong", batBuoc: true, rong: true }]} action={ghiHoatDong} an={{ id }} giaTri={{ loai: "ghi_chu" }} />
          {mo && <NutHop kieu="chu" nhan="Ghi liên hệ" tieuDe={`Liên hệ ${lead.ho_ten}`} truong={truongLH} action={ghiLienHe} an={{ id }} giaTri={{ kenh: "goi", ket_qua: "da_lien_he" }} />}
        </span>
      )}>
        {ds.length === 0 ? <p className="text-[14px] text-muc-3">Chưa có hoạt động.</p> : (
          <ol className="relative space-y-3 border-l border-vien pl-4">
            {ds.slice(0, so).map((x) => (
              <li key={x.khoa} className="relative">
                <span aria-hidden className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-tag ${["ghi_chu", "goi", "nhan_tin", "lien_he"].includes(x.loai) ? "bg-nhan" : "bg-vien-dam"}`} />
                <div className="text-[12.5px] text-muc-3">{gioVN(x.luc)} {ngayVN(new Date(x.luc).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }))} · {LOAI_HOAT_DONG[x.loai] ?? x.loai}{x.nguoi ? ` · ${tenNv.get(x.nguoi) ?? ""}` : ""}</div>
                <div className="whitespace-pre-line text-[14px] text-muc [overflow-wrap:anywhere]">{x.chu}</div>
              </li>
            ))}
          </ol>
        )}
        {ds.length > so && <Link href={`/marketing/lead/${id}?tab=hoat-dong&so=${so + 30}`} scroll={false} className="mt-3 inline-block text-[13px] font-medium text-nhan-dam hover:underline">Tải thêm</Link>}
      </The>
    );
  } else if (tab === "tac-vu") {
    const { data: tv } = await db.from("lead_tac_vu").select("id, ten, giao_cho_id, han, trang_thai, nguon, cong_viec_id, tao_luc").eq("lead_id", id).order("trang_thai").order("tao_luc", { ascending: false });
    noiDung = (
      <The tieuDe="Tác vụ" hanhDong={sua && <NutHop kieu="chu" nhan="Thêm tác vụ" tieuDe="Thêm tác vụ" moTa="Tác vụ hiện cả ở Nơi làm việc › Việc cần làm của người được giao."
        truong={[{ ten: "ten", nhan: "Tên tác vụ", loai: "chu", batBuoc: true, rong: true }, { ten: "giao_cho_id", nhan: "Giao cho", loai: "chon", batBuoc: true, luaChon: nguoiLead, ghiChu: "Chỉ người phụ trách hoặc người hỗ trợ lead." }, { ten: "han", nhan: "Hạn", loai: "ngay" }]}
        action={taoTacVu} an={{ id }} giaTri={{ giao_cho_id: lead.owner_id ?? "" }} />}>
        {!lead.owner_id && sua && <p className="mb-3 text-[13px] text-canh-bao">Lead chưa có người phụ trách: nhận lead hoặc thêm người hỗ trợ trước khi giao tác vụ.</p>}
        {(tv ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có tác vụ.</p> : (
          <ul className="divide-y divide-vien">
            {(tv ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className={`text-[14.5px] ${t.trang_thai === "mo" ? "text-muc" : "text-muc-3 line-through"}`}>{t.ten}{t.nguon === "ai" && <span className="ml-2 rounded-tag bg-canh-bao-nen px-1.5 py-0.5 text-[11px] text-canh-bao">AI tạo · cần xử lý</span>}</div>
                  <div className="text-[12.5px] text-muc-3">{tenNv.get(t.giao_cho_id)}{t.han ? ` · hạn ${ngayVN(t.han)}` : ""} · {t.trang_thai === "mo" ? "Đang mở" : t.trang_thai === "xong" ? "Đã xong" : "Đã hủy"}</div>
                </div>
                {t.trang_thai === "mo" && (sua || t.giao_cho_id === nd.nhanVienId) && ghi && <span className="flex gap-4"><NutNhanh nhan="Hoàn thành" action={dongTacVu} du={{ id: t.id, trang_thai: "xong" }} /><NutNhanh nhan="Hủy" action={dongTacVu} du={{ id: t.id, trang_thai: "huy" }} /></span>}
              </li>
            ))}
          </ul>
        )}
      </The>
    );
  } else if (tab === "nhac") {
    const { data: nh } = await db.from("lead_nhac").select("id, noi_dung, nhac_luc, nhac_cho_id, trang_thai").eq("lead_id", id).order("trang_thai").order("nhac_luc");
    const bay = new Date().toISOString();
    noiDung = (
      <The tieuDe="Nhắc việc" hanhDong={sua && <NutHop kieu="chu" nhan="Thêm nhắc việc" tieuDe="Thêm nhắc việc" moTa="Đến giờ, nhắc hiện ở chuông thông báo và Trang chủ của người được nhắc."
        truong={[{ ten: "noi_dung", nhan: "Nội dung", loai: "chu", batBuoc: true, rong: true }, { ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "gio", nhan: "Giờ", loai: "gio", batBuoc: true, tuGio: "06:00", denGio: "22:00" }, { ten: "nhac_cho_id", nhan: "Nhắc cho", loai: "chon", batBuoc: true, luaChon: nguoiLead }]}
        action={taoNhac} an={{ id }} giaTri={{ nhac_cho_id: lead.owner_id ?? "", gio: "09:00" }} />}>
        {(nh ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có nhắc việc.</p> : (
          <ul className="divide-y divide-vien">
            {(nh ?? []).map((n) => {
              const quaHan = n.trang_thai === "cho" && n.nhac_luc < bay;
              return (
                <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className={`text-[14.5px] ${n.trang_thai === "cho" ? "text-muc" : "text-muc-3 line-through"}`}>{n.noi_dung}</div>
                    <div className={`text-[12.5px] ${quaHan ? "font-medium text-loi" : "text-muc-3"}`}>{ngayGioVN(n.nhac_luc)} · {tenNv.get(n.nhac_cho_id)} · {n.trang_thai === "cho" ? (quaHan ? "Đã đến giờ" : "Sắp tới") : n.trang_thai === "xong" ? "Đã xử lý" : "Đã hủy"}</div>
                  </div>
                  {n.trang_thai === "cho" && ghi && (sua || n.nhac_cho_id === nd.nhanVienId) && <span className="flex gap-4"><NutNhanh nhan="Đã xử lý" action={dongNhac} du={{ id: n.id, trang_thai: "xong" }} /><NutNhanh nhan="Hủy" action={dongNhac} du={{ id: n.id, trang_thai: "huy" }} /></span>}
                </li>
              );
            })}
          </ul>
        )}
      </The>
    );
  } else {
    const loc = sp.nhan && sp.nhan in NHAN_TEP ? sp.nhan : "";
    let q = db.from("lead_tep").select("id, ten, mime, kich_thuoc, nhan, nguon, tao_luc").eq("lead_id", id).order("tao_luc", { ascending: false });
    if (loc) q = q.eq("nhan", loc);
    const { data: tep } = await q;
    const { count: taiTay } = await db.from("lead_tep").select("id", { count: "exact", head: true }).eq("lead_id", id).eq("nguon", "tai_tay");
    noiDung = (
      <The tieuDe="Tệp" hanhDong={sua && <TaiTepLead leadId={id} conLai={SO_TEP_TAI_TAY - (taiTay ?? 0)} />}>
        <div className="mb-3 flex flex-wrap gap-2 text-[13px]">
          {[["", "Tất cả"], ...Object.entries(NHAN_TEP)].map(([m, t]) => (
            <Link key={m} href={`/marketing/lead/${id}?tab=tep${m ? `&nhan=${m}` : ""}`} scroll={false} className={`rounded-nho border px-2.5 py-1 ${loc === m ? "border-nhan bg-nhan-nhat font-medium text-nhan-dam" : "border-vien text-muc-2 hover:bg-giay-tram"}`}>{t}</Link>
          ))}
        </div>
        {(tep ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có tệp.</p> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(tep ?? []).map((t) => (
              <li key={t.id} className="overflow-hidden rounded-nho border border-vien bg-giay-sang">
                <a href={`/api/lead-tep/${t.id}`} target="_blank" rel="noopener" className="block aspect-[4/3] bg-giay-tram">
                  {t.mime?.startsWith("image/") && t.mime !== "image/heic"
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`/api/lead-tep/${t.id}`} alt={t.ten} loading="lazy" className="h-full w-full object-cover" />
                    : <span className="flex h-full items-center justify-center text-[13px] font-medium text-muc-2">{t.mime === "application/pdf" ? "PDF" : "Ảnh"}</span>}
                </a>
                <div className="space-y-1 p-2">
                  <div className="truncate text-[13px] text-muc" title={t.ten}>{t.ten}</div>
                  <div className="text-[12px] text-muc-3">{NHAN_TEP[t.nhan]}{t.nguon === "chat" ? " · từ chat" : ""}</div>
                  <div className="flex flex-wrap gap-3">
                    <a href={`/api/lead-tep/${t.id}?tai=1`} className="text-[12.5px] font-medium text-nhan-dam hover:underline">Tải về</a>
                    {sua && <NutHop kieu="chu" nhan="Đổi nhãn" tieuDe="Đổi tên / nhãn tệp" truong={[{ ten: "ten", nhan: "Tên tệp", loai: "chu", batBuoc: true, rong: true }, { ten: "nhan", nhan: "Nhãn", loai: "chon", batBuoc: true, luaChon: Object.entries(NHAN_TEP).map(([gia_tri, n]) => ({ gia_tri, nhan: n })) }]} action={doiNhanTep} an={{ id: t.id }} giaTri={{ ten: t.ten, nhan: t.nhan }} />}
                    {sua && <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá tệp" xacNhan={`Xoá tệp ${t.ten}? Không lấy lại được.`} action={xoaTepLead} an={{ id: t.id }} nhanLuu="Xoá" />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </The>
    );
  }

  const muc = TAB.map((t) => ({ ...t, ten: t.ma === "tac-vu" && soTacVu ? `${t.ten} (${soTacVu})` : t.ma === "nhac" && soNhac ? `${t.ten} (${soNhac})` : t.ma === "tep" && soTep ? `${t.ten} (${soTep})` : t.ten }));
  const tre = quaSla(lead.giai_doan_luc, gd?.sla_phut ?? null, lead.ket_qua);
  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing/lead", nhan: "Hộp Lead" }} tieuDe={lead.ho_ten}
        phu={<>{lead.ma} · {lead.sdt} · {capNhatTruoc(lead.cap_nhat_luc)}{gd && <> · <span style={{ color: gd.mau }} className="font-medium">{gd.ten}</span></>}{tre && <span className="font-medium text-canh-bao"> · Quá SLA cột</span>}</>}>
        {ghi && !lead.owner_id && mo && <NutHop nhan="Nhận lead" tieuDe="Nhận lead" xacNhan={`Nhận lead ${lead.ma} về mình?`} action={nhanLead} an={{ id }} nhanLuu="Nhận" />}
        {sua && mo && <NutHop kieu="phu" nhan="Ghi liên hệ" tieuDe={`Liên hệ ${lead.ho_ten}`} truong={truongLH} action={ghiLienHe} an={{ id }} giaTri={{ kenh: "goi", ket_qua: "da_lien_he" }} />}
        {duyet && ghi && mo && <NutHop kieu="phu" nhan="Giao người khác" tieuDe="Giao lead" truong={[{ ten: "owner_id", nhan: "Người phụ trách", loai: "chon", batBuoc: true, luaChon: nvDangLam }]} action={giaoLead} an={{ id }} giaTri={{ owner_id: lead.owner_id ?? "" }} />}
        {sua && mo && <NutHop kieu="chu" nguy nhan="Trùng/không hợp lệ" tieuDe="Đánh dấu lead" truong={[{ ten: "loai", nhan: "Loại", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "lead_trung", nhan: "Lead trùng" }, { gia_tri: "khong_hop_le", nhan: "Không hợp lệ" }] }, { ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={danhDauLead} an={{ id }} giaTri={{ loai: "lead_trung" }} />}
      </TieuDeNoi>
      <Tab muc={muc} dang={tab} goc={`/marketing/lead/${id}`} />
      {noiDung}
    </div>
  );
}
