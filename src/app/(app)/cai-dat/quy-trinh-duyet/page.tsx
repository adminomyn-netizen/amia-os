import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, ngayCuaIso, tienVN } from "@/lib/dinh-dang";
import { CHUC_DANH_TC } from "@/lib/de-xuat";
import { moTaNguoiDuyet, NHAN_VAI_TRO_DU_PHONG } from "@/lib/quy-trinh-duyet";
import { laNguoiSuaQuyTrinh } from "@/lib/quy-trinh-duyet-server";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { ClipboardCheck } from "lucide-react";
import { luuQuyTacDuyet } from "../actions";
import { batTatQuyTrinh, luuBuocQuyTrinh, xoaBuocQuyTrinh } from "./actions";

const HANH_DONG: Record<string, string> = { them_buoc: "Thêm bước", sua_buoc: "Sửa bước", xoa_buoc: "Xoá bước", bat_quy_trinh: "Bật quy trình", tat_quy_trinh: "Tắt quy trình" };
const LY_DO: Truong = { ten: "ly_do", nhan: "Lý do sửa (ghi vào nhật ký)", loai: "nhieu_dong", batBuoc: true, rong: true };

export default async function TrangQuyTrinhDuyet() {
  const nd = await yeuCauNoiBo();
  const sua = await laNguoiSuaQuyTrinh(nd.nhanVienId);
  const xemHanMuc = sua || coQuyen(nd, "hethong.phanquyen");
  const db = sb();
  const [{ data: qt }, { data: buoc }, { data: nguong }, { data: nv }, { data: nk }] = await Promise.all([
    db.from("quy_trinh_duyet").select("*").order("ma"),
    db.from("quy_trinh_duyet_buoc").select("*").order("thu_tu"),
    db.from("quy_tac_duyet").select("*").order("nguong_tien"),
    db.from("nhan_vien").select("id, ho_ten, vai_tro, chuc_danh_tai_chinh, han_muc_duyet").eq("hoat_dong", true).order("ho_ten"),
    db.from("quy_trinh_duyet_nhat_ky").select("*").order("luc", { ascending: false }).limit(15),
  ]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const giu = (cd: string) => (nv ?? []).filter((n) => n.chuc_danh_tai_chinh === cd).map((n) => n.ho_ten);
  const tenNguong = new Map((nguong ?? []).map((n) => [n.ma, n]));
  const luaNguoi = [
    { gia_tri: "quan_ly_chi_nhanh", nhan: "Quản lý đơn vị (quản lý / chủ của chi nhánh)" },
    ...Object.entries(CHUC_DANH_TC).map(([k, v]) => ({ gia_tri: `chuc_danh:${k}`, nhan: `Chức danh: ${v}` })),
    ...["chu", "quan_ly", "ke_toan"].map((k) => ({ gia_tri: `vai_tro:${k}`, nhan: `Vai trò: ${NHAN_VAI_TRO_DU_PHONG[k]}` })),
    ...(nv ?? []).map((n) => ({ gia_tri: `nhan_vien:${n.id}`, nhan: `Người cụ thể: ${n.ho_ten}` })),
  ];
  const truongBuoc = (_ma: string, cuoi: number): Truong[] => [
    { ten: "thu_tu", nhan: "Thứ tự bước", loai: "so", batBuoc: true },
    { ten: "ten", nhan: "Tên bước (hiện cho người duyệt thấy)", loai: "chu", batBuoc: true, rong: true },
    { ten: "nguoi_duyet", nhan: "Ai duyệt", loai: "chon", batBuoc: true, rong: true, luaChon: luaNguoi, ghiChu: `Chọn chức danh là tốt nhất: đổi người chỉ cần đổi chức danh ở mục Nhân viên, không phải sửa lại quy trình. (Bước kế tiếp gợi ý: ${cuoi + 1}.)` },
    { ten: "du_phong", nhan: "Chưa ai giữ chức danh thì vai trò nào được duyệt thay", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Không ai (bước đứng chờ)" }, ...["ke_toan", "quan_ly", "chu"].map((k) => ({ gia_tri: k, nhan: NHAN_VAI_TRO_DU_PHONG[k] }))] },
    { ten: "nguong_quy_tac", nhan: "Chỉ áp dụng từ ngưỡng tiền", loai: "chon", luaChon: [{ gia_tri: "", nhan: "Mọi số tiền" }, ...(nguong ?? []).map((n) => ({ gia_tri: n.ma, nhan: `${n.ten} (${tienVN(n.nguong_tien)})` }))] },
    { ten: "sla_ngay", nhan: "Hạn xử lý của bước (ngày)", loai: "so" },
    { ten: "kiem_han_muc", nhan: "Kiểm hạn mức duyệt riêng của người duyệt (nếu đã đặt)", loai: "gat" },
    LY_DO,
  ];
  return (
    <div>
      <TieuDeNoi icon={ClipboardCheck} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Quy trình phê duyệt" phu="Chuỗi người duyệt của từng loại đề xuất (thanh toán, tạm ứng, hoàn ứng, hoàn trả khách, mua sắm), bê từ Approval của Lark MSC. Đề xuất mới chép chuỗi bước tại lúc gửi; đề xuất đang chạy không bị đổi giữa chừng." />
      <div className="mb-6 rounded-lg border border-vien bg-giay-tram px-4 py-3 text-[14px] leading-relaxed text-muc-2">
        {sua
          ? <>Anh là người duy nhất được sửa quy trình, ngưỡng tiền, chức danh tài chính và hạn mức duyệt. Mọi lần sửa phải ghi lý do và được lưu nhật ký ở cuối trang.</>
          : <>Mọi người xem được quy trình. <b>Chỉ anh Nam</b> được sửa quy trình, ngưỡng tiền, chức danh tài chính và hạn mức duyệt. Cần đổi thì nhắn anh Nam.</>}
      </div>

      {(qt ?? []).map((q) => {
        const ds = (buoc ?? []).filter((b) => b.quy_trinh_ma === q.ma);
        return (
          <section key={q.ma} className="mb-8">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="nhan-muc">{q.ten}{q.ma_lark ? <span className="ml-2 text-[12.5px] font-normal text-muc-3">{q.ma_lark}</span> : null}</h2>
              <NhanTrangThai kieu={q.hoat_dong ? "tot" : "tram"}>{q.hoat_dong ? "Đang áp dụng" : "Đang tắt (duyệt 1 cấp)"}</NhanTrangThai>
              {sua && <NutHop kieu="chu" nhan={q.hoat_dong ? "Tắt quy trình" : "Bật quy trình"} tieuDe={`${q.hoat_dong ? "Tắt" : "Bật"} quy trình: ${q.ten}`} moTa={q.hoat_dong ? "Đề xuất mới của loại này duyệt 1 cấp như trước. Đề xuất đang chạy giữ nguyên chuỗi đã chép." : "Đề xuất mới của loại này duyệt theo chuỗi bước."} truong={[LY_DO]} action={batTatQuyTrinh} an={{ ma: q.ma, hoat_dong: q.hoat_dong ? "0" : "1" }} nhanLuu={q.hoat_dong ? "Tắt" : "Bật"} nguy={q.hoat_dong} />}
              {sua && <NutHop kieu="chu" nhan="Thêm bước" tieuDe={`Thêm bước: ${q.ten}`} truong={truongBuoc(q.ma, ds.length)} action={luuBuocQuyTrinh} an={{ quy_trinh_ma: q.ma }} giaTri={{ thu_tu: ds.length + 1, sla_ngay: 1, kiem_han_muc: false }} />}
            </div>
            <p className="mb-2 text-[13px] text-muc-3">{q.mo_ta}</p>
            <Bang noi duLieu={ds} khoa={(r) => r.id} trong="Chưa có bước nào (đề xuất loại này duyệt 1 cấp)."
              cot={[
                { nhan: "Bước", chinh: true, hienThi: (r) => <span><span className="tabular-nums text-muc-3">{r.thu_tu}.</span> <span className="text-muc">{r.ten}</span></span> },
                { nhan: "Ai duyệt", hienThi: (r) => {
                  const ai = moTaNguoiDuyet(r);
                  const ng = r.nguoi_duyet_loai === "chuc_danh" ? giu(r.nguoi_duyet_gia_tri ?? "") : r.nguoi_duyet_loai === "nhan_vien" ? [ten.get(r.nguoi_duyet_gia_tri ?? "") ?? "(người đã nghỉ)"] : [];
                  return <div>{ai}<div className="text-[12.5px] text-muc-3">{r.nguoi_duyet_loai === "chuc_danh" ? (ng.length ? ng.join(", ") : `Chưa gán người${r.du_phong_vai_tro.length ? ` · tạm: ${r.du_phong_vai_tro.map((v) => NHAN_VAI_TRO_DU_PHONG[v] ?? v).join(", ")}` : ""}`) : ng.join(", ")}</div></div>;
                } },
                { nhan: "Điều kiện", hienThi: (r) => { const n = r.nguong_quy_tac ? tenNguong.get(r.nguong_quy_tac) : null; return n ? <span>Từ {tienVN(n.nguong_tien)}{n.trang_thai !== "hieu_luc" && <span className="text-muc-3"> · chờ xác nhận</span>}</span> : "Mọi số tiền"; } },
                { nhan: "Hạn xử lý", hienThi: (r) => `${r.sla_ngay} ngày` },
                { nhan: "", hienThi: (r) => sua ? (
                  <div className="flex justify-end gap-3">
                    <NutHop kieu="chu" nhan="Sửa" tieuDe={`Sửa bước ${r.thu_tu}: ${r.ten}`} truong={truongBuoc(q.ma, ds.length)} action={luuBuocQuyTrinh} an={{ quy_trinh_ma: q.ma }}
                      giaTri={{ id: r.id, thu_tu: r.thu_tu, ten: r.ten, nguoi_duyet: r.nguoi_duyet_loai === "quan_ly_chi_nhanh" ? "quan_ly_chi_nhanh" : `${r.nguoi_duyet_loai}:${r.nguoi_duyet_gia_tri}`, du_phong: r.du_phong_vai_tro[0] ?? "", nguong_quy_tac: r.nguong_quy_tac ?? "", sla_ngay: r.sla_ngay, kiem_han_muc: r.kiem_han_muc }} />
                    <NutHop kieu="chu" nguy nhan="Xoá" tieuDe={`Xoá bước ${r.thu_tu}: ${r.ten}`} truong={[LY_DO]} action={xoaBuocQuyTrinh} an={{ id: r.id }} nhanLuu="Xoá bước" />
                  </div>
                ) : null },
              ]} />
          </section>
        );
      })}

      <h2 className="nhan-muc mb-2 mt-9">Ngưỡng tiền</h2>
      <Bang noi duLieu={nguong ?? []} khoa={(r) => r.id}
        cot={[
          { nhan: "Quy tắc", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.ten}</span><div className="mt-0.5 text-[13px] text-muc-3">{r.mo_ta}</div></div> },
          { nhan: "Ngưỡng", phai: true, hienThi: (r) => tienVN(r.nguong_tien) },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={r.trang_thai === "hieu_luc" ? "tot" : "cho"}>{r.trang_thai === "hieu_luc" ? "Đang áp dụng" : "Chờ chị Lâm xác nhận"}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => sua ? <NutHop kieu="chu" nhan="Sửa" tieuDe={r.ten} truong={[{ ten: "nguong_tien", nhan: "Ngưỡng (đ)", loai: "tien", batBuoc: true }, { ten: "hieu_luc", nhan: "Đã được chủ phòng khám xác nhận, đang áp dụng", loai: "gat" }]} action={luuQuyTacDuyet} giaTri={{ id: r.id, nguong_tien: r.nguong_tien, hieu_luc: r.trang_thai === "hieu_luc" }} /> : null },
        ]} />

      <h2 className="nhan-muc mb-2 mt-9">Ai đang giữ chức danh tài chính</h2>
      <p className="mb-3 text-[13px] text-muc-3">Chức danh gán ở mục <Link href="/nhan-vien" className="text-nhan-dam hover:underline">Nhân viên</Link> (chỉ anh Nam gán được). Chức danh chưa có người giữ thì vai trò dự phòng của bước được duyệt thay.</p>
      <Bang noi duLieu={Object.entries(CHUC_DANH_TC)} khoa={([k]) => k}
        cot={[
          { nhan: "Chức danh", chinh: true, hienThi: ([, v]) => <span className="text-muc">{v}</span> },
          { nhan: "Người giữ", hienThi: ([k]) => (giu(k).length ? giu(k).join(", ") : <span className="text-muc-3">Chưa gán</span>) },
          ...(xemHanMuc ? [{ nhan: "Hạn mức duyệt", phai: true, hienThi: ([k]: [string, string]) => { const ds = (nv ?? []).filter((n) => n.chuc_danh_tai_chinh === k); return ds.length ? ds.map((n) => (n.han_muc_duyet != null ? tienVN(n.han_muc_duyet) : "Không đặt")).join(", ") : ""; } }] : []),
        ]} />

      <h2 className="nhan-muc mb-2 mt-9">Nhật ký sửa quy trình</h2>
      <Bang noi duLieu={nk ?? []} khoa={(r) => r.id} trong="Chưa có lần sửa nào."
        cot={[
          { nhan: "Lúc", chinh: true, hienThi: (r) => ngayVN(ngayCuaIso(r.luc)) },
          { nhan: "Ai sửa", hienThi: (r) => ten.get(r.nguoi_id) ?? "" },
          { nhan: "Việc", hienThi: (r) => `${HANH_DONG[r.hanh_dong] ?? r.hanh_dong}${r.quy_trinh_ma ? ` · ${(qt ?? []).find((q) => q.ma === r.quy_trinh_ma)?.ten ?? r.quy_trinh_ma}` : ""}` },
          { nhan: "Lý do", hienThi: (r) => r.ly_do ?? "" },
        ]} />
    </div>
  );
}
