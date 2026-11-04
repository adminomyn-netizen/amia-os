import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN } from "@/lib/dinh-dang";
import { KENH_NOI, THONG_TIN_KENH, type KenhNoi } from "@/lib/ket-noi-ben-thu-ba";
import { trangThaiCacKenh } from "@/lib/ket-noi-ben-thu-ba-may-chu";
import { BIEN_TIN, cheSdt, KENH_TIN, tenKenh } from "@/lib/tin-nhan";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { MessageSquareText } from "lucide-react";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { NutNhanh } from "@/components/lich-hen/NutNhanh";
import { guiThu, huyTinTrongHangDoi, luuKetNoi, luuMauTin, ngatKetNoi } from "./actions";

const TAB = [{ ma: "ket-noi", ten: "Kết nối" }, { ma: "mau-tin", ten: "Mẫu tin" }, { ma: "hang-doi", ten: "Hàng đợi" }];
const TT = { cho_gui: { ten: "Chờ gửi", kieu: "cho" }, da_gui: { ten: "Đã gửi", kieu: "tot" }, loi: { ten: "Lỗi", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" } } as const;

/** Zalo OA / SMS: nối kênh, soạn mẫu tin, xem hàng đợi. Chưa gọi nhà cung cấp thật; khoá lưu mã hoá và không hiện lại. */
export default async function TrangZaloSms({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  // Trang có nội dung tin gửi khách nên chỉ người có quyền sửa danh mục mới mở được; người gắn chi nhánh chỉ xem, không sửa kết nối.
  const nd = await yeuCauQuyen("danhmuc.sua");
  const suaDuoc = !nd.chiNhanhId;
  const huyDuoc = true;
  const yc = (await searchParams).tab;
  const tab = TAB.find((t) => t.ma === yc)?.ma ?? "ket-noi";
  const db = sb();
  let noiDung: React.ReactNode;

  if (tab === "ket-noi") {
    const tt = await trangThaiCacKenh();
    noiDung = (
      <div className="space-y-4">
        {KENH_NOI.map((k) => <KhoiKenh key={k} kenh={k} t={tt[k]} sua={suaDuoc} />)}
      </div>
    );
  } else if (tab === "mau-tin") {
    const { data: mau } = await db.from("tin_nhan_mau").select("*").order("ma");
    const truong: Truong[] = [
      { ten: "ten", nhan: "Tên mẫu", loai: "chu", batBuoc: true, rong: true },
      { ten: "kenh", nhan: "Gửi qua", loai: "chon", batBuoc: true, luaChon: KENH_TIN.map((x) => ({ gia_tri: x.ma, nhan: x.ten })) },
      { ten: "noi_dung", nhan: "Nội dung", loai: "nhieu_dong", batBuoc: true, rong: true, ghiChu: `Biến dùng được: ${BIEN_TIN.map((b) => `{{${b}}}`).join(" ")}` },
      { ten: "bat", nhan: "Bật mẫu này", loai: "gat" },
    ];
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-3">Mẫu mới cài đều đang tắt. Hiện chưa có việc nào tự xếp tin, nên bật mẫu chưa làm tin nào được gửi đi.</p>
        <Bang noi duLieu={mau ?? []} khoa={(r) => r.ma} trong="Chưa có mẫu tin."
          cot={[
            { nhan: "Mẫu", chinh: true, hienThi: (r) => <div>{r.ten}<div className="max-w-[560px] text-[12.5px] text-muc-3">{r.noi_dung}</div></div> },
            { nhan: "Kênh", hienThi: (r) => tenKenh(r.kenh) },
            { nhan: "Trạng thái", hienThi: (r) => (r.bat ? <NhanTrangThai kieu="tot">Bật</NhanTrangThai> : <NhanTrangThai kieu="tram">Tắt</NhanTrangThai>) },
            { nhan: "", hienThi: (r) => (suaDuoc ? <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa mẫu: ${r.ten}`} truong={truong} action={luuMauTin} an={{ ma: r.ma }} giaTri={{ ten: r.ten, kenh: r.kenh, noi_dung: r.noi_dung, bat: r.bat ? "1" : "" }} /> : null) },
          ]} />
      </>
    );
  } else {
    let q = db.from("tin_nhan_hang_doi").select("id, kenh, den_so_dien_thoai, khach_id, chi_nhanh_id, mau_ma, noi_dung, trang_thai, loi, tao_luc, gui_luc").order("tao_luc", { ascending: false }).limit(200);
    if (nd.chiNhanhId) q = q.or(`chi_nhanh_id.is.null,chi_nhanh_id.eq.${nd.chiNhanhId}`);
    const { data: hd } = await q;
    const ds = hd ?? [], ids = [...new Set(ds.map((t) => t.khach_id).filter(Boolean))] as string[];
    const { data: kh } = ids.length ? await db.from("khach_hang").select("id, ho_ten").in("id", ids) : { data: [] };
    const ten = new Map((kh ?? []).map((k) => [k.id, k.ho_ten])), xemSdt = coQuyen(nd, "khach.sdt");
    noiDung = (
      <>
        <p className="mb-4 text-[14px] text-muc-3">Chỉ để xem và huỷ. Chưa có bộ gửi tự động, nên tin xếp vào đây sẽ chờ cho tới khi kênh được nối và bật gửi.</p>
        <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Chưa có tin nào trong hàng đợi."
          cot={[
            { nhan: "Lúc", hienThi: (r) => ngayGioVN(r.tao_luc) },
            { nhan: "Gửi tới", chinh: true, hienThi: (r) => <div>{r.khach_id ? ten.get(r.khach_id) ?? "Khách" : "Số lẻ"}<div className="text-[12.5px] text-muc-3">{tenKenh(r.kenh)} · {xemSdt ? r.den_so_dien_thoai : cheSdt(r.den_so_dien_thoai)}</div></div> },
            { nhan: "Nội dung", hienThi: (r) => <span className="line-clamp-2 max-w-[420px] text-[13px]">{r.noi_dung}</span> },
            { nhan: "Trạng thái", hienThi: (r) => <div><NhanTrangThai kieu={TT[r.trang_thai as keyof typeof TT].kieu}>{TT[r.trang_thai as keyof typeof TT].ten}</NhanTrangThai>{r.loi && <div className="mt-1 text-[12px] text-loi">{r.loi}</div>}</div> },
            { nhan: "", hienThi: (r) => (huyDuoc && r.trang_thai === "cho_gui" ? <NutNhanh nhan="Huỷ" action={huyTinTrongHangDoi} du={{ id: r.id }} /> : null) },
          ]} />
      </>
    );
  }

  return (
    <div>
      <TieuDeNoi icon={MessageSquareText} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Zalo OA và SMS" phu="Nối kênh nhắn tin, soạn mẫu tin nhắc lịch, chăm sóc, sinh nhật. Khoá được mã hoá và không hiện lại." />
      <Tab muc={TAB} dang={tab} goc="/cai-dat/zalo-sms" />
      {noiDung}
    </div>
  );
}

function KhoiKenh({ kenh, t, sua }: { kenh: KenhNoi; t: Awaited<ReturnType<typeof trangThaiCacKenh>>[KenhNoi]; sua: boolean }) {
  const tt = THONG_TIN_KENH[kenh];
  const truong: Truong[] = tt.truong.map((f) => ({
    ten: f.ten, nhan: f.nhan, loai: f.loai, rong: true, batBuoc: !t.daNoi, luaChon: f.luaChon, ghiChu: t.xem[f.ten] && !f.hien ? `Đang lưu: ${t.xem[f.ten]}. Để trống nếu giữ nguyên.` : f.ghiChu,
  }));
  const truongThu: Truong[] = [{ ten: "den", nhan: tt.nhanGuiThu, loai: "chu", batBuoc: true, rong: true }];
  return (
    <section className="the-noi the-noi-thap p-4 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><h2 className="nhan-muc">{tt.ten}</h2>{t.daNoi ? <NhanTrangThai kieu="tot">Đã nối</NhanTrangThai> : <NhanTrangThai kieu="tram">Chưa nối</NhanTrangThai>}</div>
          <p className="mt-1 text-[14px] text-muc-3">{tt.moTa}</p>
          {t.daNoi && (
            <>
              <p className="mt-2 text-[13px] text-muc-3">Khoá đã lưu lúc {ngayGioVN(t.suaLuc)}, chưa kiểm với nhà cung cấp.{t.hong && " Khoá lưu bị hỏng, hãy nhập lại."}</p>
              <ul className="mt-2 text-[13px] text-muc-2">{tt.truong.filter((f) => t.xem[f.ten]).map((f) => <li key={f.ten}>{f.nhan}: <span className="tabular-nums">{t.xem[f.ten]}</span></li>)}</ul>
            </>
          )}
        </div>
        {sua && (
          <span className="flex flex-wrap items-center gap-3">
            <NutHop nhan={t.daNoi ? "Đổi khoá" : "Kết nối"} tieuDe={`Kết nối ${tt.ten}`} moTa="Khoá được mã hoá trước khi lưu và không hiện lại." truong={truong} action={luuKetNoi} an={{ kenh }} nhanLuu="Lưu khoá" giaTri={t.xem.nha_cung_cap ? { nha_cung_cap: t.xem.nha_cung_cap, ten_thuong_hieu: t.xem.ten_thuong_hieu ?? "" } : t.xem.ten_thuong_hieu ? { ten_thuong_hieu: t.xem.ten_thuong_hieu } : {}} />
            {t.daNoi && <NutHop kieu="chu" nhan="Gửi thử" tieuDe={`Gửi thử qua ${tt.ten}`} moTa="Chưa có bộ gửi tới nhà cung cấp, nên nút này sẽ báo chưa gửi được." truong={truongThu} action={guiThu} an={{ kenh }} nhanLuu="Gửi thử" />}
            {(t.daNoi || t.hong) && <NutHop kieu="chu" nguy nhan="Ngắt kết nối" tieuDe={`Ngắt kết nối ${tt.ten}`} xacNhan={`Ngắt kết nối ${tt.ten}? Khoá đã lưu sẽ bị xoá.`} action={ngatKetNoi} an={{ kenh }} nhanLuu="Ngắt" />}
          </span>
        )}
      </div>
    </section>
  );
}
