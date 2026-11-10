import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { khoangNgay } from "@/lib/bao-cao";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { LOAI_DOI_TAC, nhanMucHoaHong } from "@/lib/marketing";
import { HINH_THUC_RUT, LOAI_BT, LOAI_MUC_HH, TT_RUT, linkDatLich } from "@/lib/ctv";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { LocBaoCao } from "@/components/bao-cao/LocBaoCao";
import { LinkQrNguon } from "@/components/marketing/LinkQrNguon";
import { HhTheoMuc, type MucHh } from "@/components/marketing/HhTheoMuc";
import { luuDoiTac } from "../../actions";
import { luuHhTheoMuc, taoYeuCauRut } from "../actions";
import { truongDoiTac } from "../truong";

const GOC = (process.env.NEXT_PUBLIC_SITE_URL || "https://lammec.mscvn.com").replace(/\/$/, "");
const TAB = [{ ma: "but-toan", ten: "Bút toán hoa hồng" }, { ma: "hh-muc", ten: "Hoa hồng theo dịch vụ" }, { ma: "chi-tra", ten: "Chi trả" }, { ma: "khach", ten: "Khách đã giới thiệu" }];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cheSdt = (s: string | null) => (s && s.length >= 7 ? `${s.slice(0, 3)}****${s.slice(-3)}` : s ?? "");

export default async function TrangChiTietNguon({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; tu?: string; den?: string; cn?: string }> }) {
  const nd = await yeuCauQuyen("mkt.xem");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const tab = TAB.some((t) => t.ma === sp.tab) ? sp.tab! : "but-toan";
  const db = sb();
  const { data: d } = await db.from("doi_tac_gt").select("*").eq("id", id).maybeSingle();
  if (!d) notFound();
  const sua = coQuyen(nd, "mkt.sua");
  const { data: sd } = await db.rpc("so_du_hh_gt", { p_dt: id });
  const soDu = sd?.[0] ?? { tong_hh: 0, da_chi: 0, dang_cho: 0, kha_dung: 0 };
  const tenHienThi = d.ten_hien_thi?.trim() || d.ten;
  const mucChung = nhanMucHoaHong(d.hh_kieu, Number(d.hh_gia_tri));
  const truong = truongDoiTac();

  let noiDung: React.ReactNode = null;
  if (tab === "but-toan") {
    const { tu, den } = khoangNgay(sp.tu, sp.den);
    const cn = nd.chiNhanhId ?? (sp.cn || undefined);
    let qb = db.from("but_toan_hh_gt").select("*").eq("doi_tac_id", id).gte("ngay_hd", tu).lte("ngay_hd", den).order("ghi_luc", { ascending: false }).limit(1000);
    if (cn) qb = qb.eq("chi_nhanh_id", cn);
    const [{ data: bt }, { data: dsCn }] = await Promise.all([qb, db.from("chi_nhanh").select("id, ten").order("thu_tu").order("ma")]);
    const tenCn = new Map((dsCn ?? []).map((c) => [c.id, c.ten]));
    const tongHh = (bt ?? []).reduce((t, r) => t + Number(r.so_tien), 0), tongDs = (bt ?? []).reduce((t, r) => t + Number(r.doanh_so), 0);
    noiDung = (
      <>
        <LocBaoCao goc={`/marketing/doi-tac/${id}`} tu={tu} den={den} chiNhanh={nd.chiNhanhId ? undefined : (dsCn ?? []).map((c) => ({ gia_tri: c.id, nhan: c.ten }))} cn={sp.cn} />
        <p className="mb-3 text-[13.5px] text-muc-2">Trong kỳ: doanh thu tính hoa hồng <b className="tabular-nums">{tienVN(tongDs)}</b> · hoa hồng <b className="tabular-nums">{tienVN(tongHh)}</b></p>
        <Bang noi duLieu={bt ?? []} khoa={(r) => r.id} trong="Chưa có bút toán trong kỳ."
          cot={[
            { nhan: "Thời gian", hienThi: (r) => <span className="text-[13px]">{ngayGioVN(r.ghi_luc)}<span className="block text-[12px] text-muc-3">HĐ ngày {ngayVN(r.ngay_hd)}</span></span> },
            { nhan: "Mã HĐ", hienThi: (r) => <Link href={`/hoa-don/${r.hoa_don_id}`} className="text-nhan-dam hover:underline">{r.ma_hd ?? "—"}</Link> },
            { nhan: "Chi nhánh", hienThi: (r) => (r.chi_nhanh_id ? tenCn.get(r.chi_nhanh_id) ?? "" : "") },
            { nhan: "Dịch vụ / SP", chinh: true, hienThi: (r) => <span>{r.ten_muc}<span className="block text-[12px] text-muc-3">{LOAI_MUC_HH[r.muc_loai] ?? r.muc_loai}</span></span> },
            { nhan: "DT tính HH", phai: true, hienThi: (r) => <span className="tabular-nums">{tienVN(Number(r.doanh_so))}</span> },
            { nhan: "Tỷ lệ", phai: true, hienThi: (r) => (r.kieu ? nhanMucHoaHong(r.kieu, Number(r.gia_tri ?? 0)) : "") },
            { nhan: "Hoa hồng", phai: true, hienThi: (r) => <span className={`tabular-nums ${Number(r.so_tien) < 0 ? "text-loi" : ""}`}>{tienVN(Number(r.so_tien))}</span> },
            { nhan: "Loại BT", hienThi: (r) => <NhanTrangThai kieu={LOAI_BT[r.loai]?.kieu ?? "tram"}>{LOAI_BT[r.loai]?.ten ?? r.loai}</NhanTrangThai> },
          ]} />
        <p className="mt-3 text-[12.5px] text-muc-3">Sổ chỉ thêm dòng: hoá đơn huỷ hoặc mở lại để sửa thì ghi dòng &quot;Đảo&quot; âm, chốt lại thì ghi nhận lại; không sửa dòng cũ.</p>
      </>
    );
  } else if (tab === "hh-muc") {
    const [{ data: dv }, { data: spm }, { data: goi }, { data: nhom }, { data: rieng }] = await Promise.all([
      db.from("dich_vu").select("id, ten, nhom_id").eq("hoat_dong", true).order("ten"),
      db.from("san_pham").select("id, ten, nhom").eq("hoat_dong", true).eq("ban_le", true).order("ten"),
      db.from("goi_the").select("id, ten, loai").eq("hoat_dong", true).order("ten"),
      db.from("dich_vu_nhom").select("id, ten"),
      db.from("doi_tac_hh_muc").select("loai, muc_id, kieu, gia_tri").eq("doi_tac_id", id),
    ]);
    const tenNhom = new Map((nhom ?? []).map((n) => [n.id, n.ten]));
    const mr = new Map((rieng ?? []).map((r) => [`${r.loai}:${r.muc_id}`, r]));
    const gan = (loai: MucHh["loai"], x: { id: string; ten: string }, nhomTen: string): MucHh => {
      const r = mr.get(`${loai}:${x.id}`);
      return { loai, id: x.id, ten: x.ten, nhom: nhomTen, ...(r ? { kieu: r.kieu as "phan_tram" | "tien", giaTri: Number(r.gia_tri) } : {}) };
    };
    const muc: MucHh[] = [
      ...(dv ?? []).map((x) => gan("dich_vu", x, tenNhom.get(x.nhom_id) ?? "Dịch vụ")),
      ...(spm ?? []).map((x) => gan("san_pham", x, x.nhom ?? "Sản phẩm")),
      ...(goi ?? []).map((x) => gan("goi_the", x, x.loai === "lan" ? "Liệu trình" : "Thẻ tiền")),
    ];
    noiDung = <HhTheoMuc doiTacId={id} mucChung={mucChung} muc={muc} sua={sua} luu={luuHhTheoMuc} />;
  } else if (tab === "chi-tra") {
    const [{ data: ds }, { data: nv }, { data: cfg }] = await Promise.all([
      db.from("yeu_cau_rut_hh").select("*").eq("doi_tac_id", id).order("tao_luc", { ascending: false }),
      db.from("nhan_vien").select("id, ho_ten"),
      db.from("cau_hinh").select("gia_tri").eq("khoa", "ctv.toi_thieu_rut").maybeSingle(),
    ]);
    const tenNv = new Map((nv ?? []).map((x) => [x.id, x.ho_ten]));
    const coMo = (ds ?? []).some((r) => r.trang_thai === "cho_xu_ly" || r.trang_thai === "dang_duyet_chi");
    const toiThieu = Number(cfg?.gia_tri ?? 0);
    noiDung = (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {sua && !coMo && Number(soDu.kha_dung) > 0 && <NutHop nhan="Tạo yêu cầu chi trả" tieuDe={`Yêu cầu chi trả cho ${d.ten}`} moTa={`Số dư được rút: ${tienVN(Number(soDu.kha_dung))}${toiThieu > 0 ? ` · tối thiểu ${tienVN(toiThieu)}` : ""}. Mỗi nguồn chỉ một yêu cầu đang mở.`}
            an={{ doi_tac_id: id }} action={taoYeuCauRut} nhanLuu="Gửi yêu cầu"
            giaTri={{ so_tien: Number(soDu.kha_dung), hinh_thuc: "chuyen_khoan", ngan_hang: "", so_tk: "", ten_chu_tk: d.ten, ghi_chu: "" }}
            truong={[
              { ten: "so_tien", nhan: "Số tiền", loai: "tien", batBuoc: true },
              { ten: "hinh_thuc", nhan: "Nhận qua", loai: "chon", batBuoc: true, luaChon: [{ gia_tri: "chuyen_khoan", nhan: "Chuyển khoản" }, { gia_tri: "tien_mat", nhan: "Tiền mặt" }] },
              { ten: "ngan_hang", nhan: "Ngân hàng", loai: "chu", hienKhi: { ten: "hinh_thuc", la: ["chuyen_khoan"] } },
              { ten: "so_tk", nhan: "Số tài khoản", loai: "chu", hienKhi: { ten: "hinh_thuc", la: ["chuyen_khoan"] } },
              { ten: "ten_chu_tk", nhan: "Tên chủ tài khoản", loai: "chu", hienKhi: { ten: "hinh_thuc", la: ["chuyen_khoan"] } },
              { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
            ]} />}
          {coMo && <span className="text-[13.5px] text-muc-3">Đang có một yêu cầu chưa xử lý xong. Xử lý ở <Link className="text-nhan-dam underline" href="/marketing/doi-tac?tab=chi-tra">Chi trả hoa hồng</Link>.</span>}
          {!coMo && Number(soDu.kha_dung) <= 0 && <span className="text-[13.5px] text-muc-3">Chưa có hoa hồng chưa thanh toán để chi trả.</span>}
        </div>
        <Bang noi duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có yêu cầu chi trả."
          cot={[
            { nhan: "Ngày gửi", hienThi: (r) => <span>{ngayVN(r.tao_luc.slice(0, 10))}<span className="block text-[12px] text-muc-3">{r.ma} · {r.tu_cong_ctv ? "CTV tự gửi từ cổng" : tenNv.get(r.tao_boi ?? "") ?? ""}</span></span> },
            { nhan: "Số tiền", phai: true, hienThi: (r) => <span className="tabular-nums font-medium">{tienVN(Number(r.so_tien))}</span> },
            { nhan: "Nhận qua", hienThi: (r) => HINH_THUC_RUT[r.hinh_thuc] },
            { nhan: "Trạng thái", chinh: true, hienThi: (r) => <span><NhanTrangThai kieu={TT_RUT[r.trang_thai].kieu}>{TT_RUT[r.trang_thai].ten}</NhanTrangThai>{r.ly_do_tu_choi && <span className="block text-[12px] text-loi">Lý do: {r.ly_do_tu_choi}</span>}</span> },
          ]} />
      </>
    );
  } else {
    const [{ data: kh }, { data: lich }] = await Promise.all([
      db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, tao_luc").eq("doi_tac_id", id).order("tao_luc", { ascending: false }).limit(300),
      db.from("lich_hen").select("id, bat_dau, trang_thai, khach_id").eq("doi_tac_id", id).order("bat_dau", { ascending: false }).limit(300),
    ]);
    const xemSdt = coQuyen(nd, "khach.sdt");
    const soLich = new Map<string, number>();
    for (const l of lich ?? []) soLich.set(l.khach_id, (soLich.get(l.khach_id) ?? 0) + 1);
    noiDung = (
      <Bang noi duLieu={kh ?? []} khoa={(r) => r.id} trong="Chưa có khách gắn nguồn này (khách đặt lịch qua link REF sẽ tự gắn)."
        cot={[
          { nhan: "Khách", chinh: true, hienThi: (r) => <Link href={`/khach-hang/${r.id}`} className="hover:text-nhan-dam">{r.ho_ten}<span className="block text-[12px] text-muc-3">{r.ma}</span></Link> },
          { nhan: "SĐT", hienThi: (r) => (xemSdt ? r.dien_thoai : cheSdt(r.dien_thoai)) },
          { nhan: "Gắn từ", hienThi: (r) => ngayVN(r.tao_luc.slice(0, 10)) },
          { nhan: "Lịch hẹn qua nguồn", phai: true, hienThi: (r) => soLich.get(r.id) ?? 0 },
        ]} />
    );
  }

  return (
    <div>
      <TieuDeNoi quayLai={{ href: "/marketing/doi-tac", nhan: "Giới thiệu & CTV" }} tieuDe={d.ten}
        phu={`${LOAI_DOI_TAC[d.loai] ?? d.loai} · mã ${d.ma_gioi_thieu}${d.ma_ref ? ` · REF ${d.ma_ref}` : ""} · mức chung ${mucChung}${d.hoat_dong ? "" : " · Đã ngừng"}`}>
        {sua && <NutHop kieu="phu" nhan="Sửa nguồn" tieuDe="Sửa nguồn giới thiệu" truong={truong} action={luuDoiTac} rong
          giaTri={{ id: d.id, ten: d.ten, loai: d.loai, dien_thoai: d.dien_thoai ?? "", ten_hien_thi: d.ten_hien_thi ?? "", email: d.email ?? "", gui_email: d.gui_email, hoat_dong: d.hoat_dong ? "1" : "0", hh_kieu: d.hh_kieu, hh_gia_tri: Number(d.hh_gia_tri), ghi_chu: d.ghi_chu ?? "" }} />}
      </TieuDeNoi>
      <div className="mb-6"><HangChiSo muc={[
        { nhan: "Tổng hoa hồng (sổ)", so: tienVN(Number(soDu.tong_hh)) }, { nhan: "Đã chi", so: tienVN(Number(soDu.da_chi)) },
        { nhan: "Đang chờ chi", so: tienVN(Number(soDu.dang_cho)) }, { nhan: "Được rút", so: tienVN(Number(soDu.kha_dung)), ghiChu: "Chưa thanh toán trừ phần đang chờ" },
      ]} /></div>
      <section className="the-noi mb-6 p-5">
        <h2 className="mb-3 text-[15px] font-semibold">Link / QR đặt lịch</h2>
        {d.ma_ref && d.hoat_dong
          ? <LinkQrNguon link={linkDatLich(GOC, d.ma_ref)} tenHienThi={tenHienThi} maRef={d.ma_ref} />
          : <p className="text-[14px] text-muc-3">{d.hoat_dong ? "Nguồn chưa có SĐT di động hợp lệ (10 số, đầu 03/05/07/08/09) nên chưa có link. Bấm Sửa nguồn để nhập SĐT." : "Nguồn đã ngừng hợp tác: link REF không còn ghi người giới thiệu."}
            {d.ma_gioi_thieu && d.hoat_dong ? ` Tạm dùng mã GT: ${linkDatLich(GOC, d.ma_gioi_thieu)}` : ""}</p>}
      </section>
      <Tab muc={TAB} dang={tab} goc={`/marketing/doi-tac/${id}`} />
      {noiDung}
    </div>
  );
}
