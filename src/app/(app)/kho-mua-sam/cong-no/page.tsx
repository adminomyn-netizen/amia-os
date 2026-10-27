import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { homNayHCM, ngayVN, tienVN } from "@/lib/dinh-dang";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop } from "@/components/ui/BieuMau";
import { thanhToanNcc } from "../actions";

const NHAN_LOAI: Record<string, string> = { hoa_don: "Nhận hàng (phát sinh nợ)", thanh_toan: "Thanh toán", dieu_chinh: "Điều chỉnh" };

export default async function TrangCongNo({ searchParams }: { searchParams: Promise<{ ncc?: string }> }) {
  const nd = await yeuCauQuyen("mua.xem");
  const { ncc: chon } = await searchParams;
  const db = sb();
  const { data: ds } = await db.from("v_cong_no_ncc").select("*").order("con_no", { ascending: false });
  const co = (ds ?? []).filter((r) => Number(r.con_no) !== 0);
  const tong = co.reduce((s, r) => s + Number(r.con_no), 0);
  const dangXem = chon ? (ds ?? []).find((r) => r.ncc_id === chon) : undefined;
  const ghi = coQuyen(nd, "quy.ghi");
  const [{ data: so }, { data: quy }] = await Promise.all([
    dangXem ? db.from("ncc_so_cai").select("*").eq("ncc_id", dangXem.ncc_id ?? "").order("id", { ascending: false }).limit(200) : Promise.resolve({ data: [] }),
    ghi ? (nd.chiNhanhId ? db.from("quy").select("id, ten").eq("hoat_dong", true).eq("chi_nhanh_id", nd.chiNhanhId) : db.from("quy").select("id, ten").eq("hoat_dong", true)) : Promise.resolve({ data: [] }),
  ]);
  return (
    <div>
      <Link href="/kho-mua-sam" className="text-[13px] text-muc-3 hover:text-muc">← Kho &amp; Mua sắm</Link>
      <TieuDeTrang tieuDe="Công nợ nhà cung cấp" phu="Công nợ phải trả: tăng khi nhận hàng, giảm khi thanh toán. Thanh toán tự ghi một dòng chi vào Sổ quỹ." />
      <HangChiSo muc={[{ nhan: "Tổng phải trả", so: tienVN(tong) }, { nhan: "Nhà cung cấp còn nợ", so: String(co.length) }]} />
      <div className="mt-5">
        <Bang duLieu={co} khoa={(r) => r.ncc_id ?? ""} trong="Hiện không còn khoản nợ nhà cung cấp nào."
          cot={[
            { nhan: "Nhà cung cấp", chinh: true, hienThi: (r) => <Link href={`/kho-mua-sam/cong-no?ncc=${r.ncc_id}`} className="font-medium text-nhan-dam hover:underline">{r.ten}</Link> },
            { nhan: "Hạn thanh toán", hienThi: (r) => `${r.so_ngay_no} ngày` }, { nhan: "Thanh toán gần nhất", hienThi: (r) => (r.thanh_toan_cuoi ? ngayVN(r.thanh_toan_cuoi) : "Chưa có") },
            { nhan: "Còn nợ", phai: true, hienThi: (r) => <span className="text-canh-bao">{tienVN(r.con_no)}</span> },
          ]} />
      </div>
      {dangXem && (
        <section className="mt-8" aria-label={`Sổ công nợ ${dangXem.ten}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-muc">Sổ công nợ · {dangXem.ten} <NhanTrangThai kieu={Number(dangXem.con_no) > 0 ? "cho" : "tot"}>{Number(dangXem.con_no) > 0 ? `Còn nợ ${tienVN(dangXem.con_no)}` : "Đã thanh toán hết"}</NhanTrangThai></h2>
            {ghi && Number(dangXem.con_no) > 0 && (
              <NutHop nhan="Thanh toán" tieuDe={`Thanh toán ${dangXem.ten}`} moTa={`Đang nợ ${tienVN(dangXem.con_no)}. Tiền sẽ ghi chi vào quỹ bạn chọn.`} action={thanhToanNcc} an={{ ncc_id: dangXem.ncc_id ?? "" }}
                truong={[{ ten: "quy_id", nhan: "Chi từ quỹ", loai: "chon", luaChon: (quy ?? []).map((q) => ({ gia_tri: q.id, nhan: q.ten })), batBuoc: true }, { ten: "so_tien", nhan: "Số tiền", loai: "tien", batBuoc: true }, { ten: "ngay", nhan: "Ngày", loai: "ngay", batBuoc: true }, { ten: "ghi_chu", nhan: "Ghi chú", loai: "chu", rong: true }]}
                giaTri={{ ngay: homNayHCM(), so_tien: Number(dangXem.con_no), quy_id: quy?.[0]?.id ?? "" }} />
            )}
          </div>
          <Bang duLieu={so ?? []} khoa={(r) => String(r.id)} trong="Chưa có giao dịch."
            cot={[{ nhan: "Ngày", hienThi: (r) => ngayVN(r.ngay) }, { nhan: "Loại", hienThi: (r) => NHAN_LOAI[r.loai] }, { nhan: "Ghi chú", chinh: true, hienThi: (r) => r.ghi_chu ?? "" }, { nhan: "Số tiền", phai: true, hienThi: (r) => <span className={Number(r.so_tien) < 0 ? "text-nhan-dam" : "text-canh-bao"}>{Number(r.so_tien) < 0 ? "−" : "+"}{tienVN(Math.abs(Number(r.so_tien)))}</span> }]} />
        </section>
      )}
    </div>
  );
}
