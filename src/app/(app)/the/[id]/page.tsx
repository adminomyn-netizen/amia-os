import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayGioVN, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { NutBuoi } from "@/components/the/NutBuoi";
import { dieuChinhThe, doiTrangThaiThe, huyBuoi, thucHienBuoi } from "../actions";
import { NHAN_TINH_TRANG } from "../page";

const NHAN_LOAI: Record<string, string> = { cap: "Cấp thẻ", dung_buoi: "Dùng 1 buổi", hoan_buoi: "Hoàn buổi", dieu_chinh: "Điều chỉnh", nap: "Nạp tiền", tru_tien: "Trừ tiền", hoan_tien: "Hoàn tiền", thu_hoi: "Thu hồi" };

export default async function HoSoThe({ params }: { params: Promise<{ id: string }> }) {
  const nd = await yeuCauQuyen("the.xem");
  const { id } = await params;
  const db = sb();
  const { data: t } = await db.from("v_the_khach").select("*").eq("id", id).maybeSingle();
  if (!t || (nd.chiNhanhId && t.chi_nhanh_id !== nd.chiNhanhId)) notFound();
  const [{ data: so }, { data: buoi }, { data: nv }, { data: k }, { data: g }, { data: dv }, { data: lk }] = await Promise.all([
    db.from("the_so_cai").select("*").eq("the_id", id).order("id", { ascending: false }),
    db.from("buoi_thuc_hien").select("*").eq("the_id", id).order("tao_luc", { ascending: false }),
    db.from("nhan_vien").select("id, ho_ten, vai_tro"), db.from("khach_hang").select("id, ho_ten, ma").eq("id", t.khach_id ?? "").maybeSingle(),
    db.from("goi_the").select("ten").eq("id", t.goi_id ?? "").maybeSingle(), db.from("dich_vu").select("id, ten").eq("hoat_dong", true),
    db.from("goi_the_dich_vu").select("dich_vu_id").eq("goi_id", t.goi_id ?? ""),
  ]);
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const tenDv = new Map((dv ?? []).map((d) => [d.id, d.ten]));
  const tt = NHAN_TINH_TRANG[t.tinh_trang ?? "hoat_dong"];
  const dvLC = (lk?.length ? (dv ?? []).filter((d) => lk.some((l) => l.dich_vu_id === d.id)) : dv ?? []).map((d) => ({ gia_tri: d.id, nhan: d.ten }));
  const nvLC = (nv ?? []).filter((n) => n.vai_tro !== "nha_dau_tu").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }));
  const bsLC = [{ gia_tri: "", nhan: "Không có" }, ...(nv ?? []).filter((n) => n.vai_tro === "bac_si").map((n) => ({ gia_tri: n.id, nhan: n.ho_ten }))];
  const dieuChinh = coQuyen(nd.vaiTro, "the.dieuchinh");

  return (
    <>
      <TieuDeTrang tieuDe={t.ma ?? ""} phu={<span className="flex flex-wrap items-center gap-2"><span>{g?.ten}</span><NhanTrangThai kieu={tt.kieu}>{tt.nhan}</NhanTrangThai>{k && <Link href={`/khach-hang/${k.id}`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten} · {k.ma}</Link>}{t.cap_tay && <NhanTrangThai kieu="cho">Cấp tay, không tính doanh thu</NhanTrangThai>}</span>}>
        {t.loai === "lan" && coQuyen(nd.vaiTro, "the.thuchien") && (t.tinh_trang === "hoat_dong" || t.tinh_trang === "sap_het") && <NutBuoi theId={id} nhanVien={nvLC} bacSi={bsLC} dichVu={dvLC} action={thucHienBuoi} nhan="Thực hiện buổi" />}
        {dieuChinh && <NutHop kieu="phu" nhan="Điều chỉnh số dư" tieuDe="Điều chỉnh thẻ" moTa="Cộng hoặc trừ (dùng số âm). Mọi điều chỉnh đều ghi lý do vào lịch sử." an={{ the_id: id }} truong={[{ ten: t.loai === "lan" ? "so_buoi" : "so_tien", nhan: t.loai === "lan" ? "Số buổi cộng/trừ (VD 2 hoặc -1)" : "Số tiền cộng/trừ (VD 500000 hoặc -200000)", loai: "chu", batBuoc: true, rong: true }, { ten: "ly_do", nhan: "Lý do", loai: "nhieu_dong", batBuoc: true }]} action={dieuChinhThe} />}
        {dieuChinh && t.trang_thai !== "thu_hoi" && <NutHop kieu="phu" nhan={t.trang_thai === "khoa" ? "Mở khoá thẻ" : "Khoá thẻ"} tieuDe={t.trang_thai === "khoa" ? "Mở khoá thẻ" : "Khoá thẻ"} xacNhan={t.trang_thai === "khoa" ? "Cho phép dùng thẻ trở lại?" : "Khoá thẻ: không dùng được cho tới khi mở lại."} an={{ the_id: id, trang_thai: t.trang_thai === "khoa" ? "hoat_dong" : "khoa" }} nhanLuu="Xác nhận" action={doiTrangThaiThe} />}
      </TieuDeTrang>
      <HangChiSo muc={t.loai === "lan"
        ? [{ nhan: "Buổi còn lại", so: (t.so_buoi_tong ?? 0) >= 999999 ? "Không giới hạn" : `${t.so_buoi_con}/${t.so_buoi_tong}` }, { nhan: "Doanh thu mỗi buổi", so: tienVN(t.gia_tri_buoi) }, { nhan: "Ngày cấp", so: ngayVN(t.ngay_cap) }, { nhan: "Hạn dùng", so: ngayVN(t.han_dung) || "Không hạn" }]
        : [{ nhan: "Số dư", so: tienVN(t.so_du_tien) }, { nhan: "Đã nạp", so: tienVN(t.tong_tien) }, { nhan: "Ngày cấp", so: ngayVN(t.ngay_cap) }, { nhan: "Hạn dùng", so: ngayVN(t.han_dung) || "Không hạn" }]} />
      <div className="mt-8 space-y-8">
        {t.loai === "lan" && (
          <MucTrang tieuDe="Các buổi đã làm">
            <Bang duLieu={buoi ?? []} khoa={(r) => r.id} trong="Chưa làm buổi nào." cot={[
              { nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay_lam) }, { nhan: "Dịch vụ", hienThi: (r) => tenDv.get(r.dich_vu_id) ?? "" }, { nhan: "Người làm", hienThi: (r) => tenNv.get(r.nv_thuc_hien_id) ?? "" },
              { nhan: "Tham số", hienThi: (r) => Object.entries((r.tham_so ?? {}) as Record<string, unknown>).map(([a, b]) => `${a}: ${b}`).join(", ") },
              { nhan: "Doanh thu buổi", hienThi: (r) => (r.trang_thai === "huy" ? <s className="text-muc-3">{tienVN(r.doanh_thu_buoi)}</s> : tienVN(r.doanh_thu_buoi)), phai: true },
              { nhan: "", hienThi: (r) => (r.trang_thai === "huy" ? <span className="text-[13px] text-muc-3">Đã huỷ: {r.ly_do_huy}</span> : dieuChinh ? <NutHop kieu="chu" nguy nhan="Huỷ buổi" tieuDe="Huỷ buổi đã làm" moTa="Hoàn lại 1 buổi vào thẻ." an={{ buoi_id: r.id, the_id: id }} nhanLuu="Huỷ buổi" truong={[{ ten: "ly_do", nhan: "Lý do", loai: "chu", batBuoc: true, rong: true }]} action={huyBuoi} /> : null) },
            ]} />
          </MucTrang>
        )}
        <MucTrang tieuDe="Lịch sử thẻ (sổ cái, chỉ thêm)">
          <Bang duLieu={so ?? []} khoa={(r) => String(r.id)} cot={[
            { nhan: "Lúc", hienThi: (r) => ngayGioVN(r.tao_luc) }, { nhan: "Việc", hienThi: (r) => NHAN_LOAI[r.loai] ?? r.loai }, { nhan: "Người ghi", hienThi: (r) => tenNv.get(r.nguoi_id ?? "") ?? "" }, { nhan: "Ghi chú", hienThi: (r) => r.ghi_chu ?? "" },
            { nhan: t.loai === "lan" ? "Buổi" : "Tiền", hienThi: (r) => (t.loai === "lan" ? (r.so_buoi > 0 ? `+${r.so_buoi}` : r.so_buoi) : (Number(r.so_tien) > 0 ? "+" : "") + tienVN(r.so_tien)), phai: true },
          ]} />
        </MucTrang>
      </div>
    </>
  );
}
