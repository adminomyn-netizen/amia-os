import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { congNgay, homNayHCM, ngayVN } from "@/lib/dinh-dang";
import { LOAI_CONSENT, tinhHieuLuc } from "@/lib/van-ban";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { luuConsent, rutConsent } from "../actions";

export default async function TrangDongYAnh() {
  const nd = await yeuCauQuyen("vb.xem");
  const soan = coQuyen(nd, "vb.soan");
  const db = sb(), hom = homNayHCM();
  const { data: ds } = await db.from("consent_anh").select("*").order("tao_luc", { ascending: false }).limit(300);
  const ids = [...new Set((ds ?? []).map((c) => c.khach_id))];
  const { data: khach } = ids.length ? await db.from("khach_hang").select("id, ma, ho_ten").in("id", ids) : { data: [] as { id: string; ma: string; ho_ten: string }[] };
  const ten = new Map((khach ?? []).map((k) => [k.id, `${k.ho_ten} (${k.ma})`]));
  const truong: Truong[] = [
    { ten: "sdt_khach", nhan: "Số điện thoại khách", loai: "chu", batBuoc: true },
    { ten: "loai", nhan: "Loại đồng ý", loai: "chon", batBuoc: true, luaChon: Object.entries(LOAI_CONSENT).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "ngay_ky", nhan: "Ngày ký", loai: "ngay", batBuoc: true }, { ten: "hieu_luc_den", nhan: "Hiệu lực đến (bắt buộc với truyền thông)", loai: "ngay" },
    { ten: "pham_vi_kenh", nhan: "Phạm vi kênh (Facebook, TikTok, website…; bắt buộc với truyền thông)", loai: "chu", rong: true },
    { ten: "ghi_chu", nhan: "Ghi chú", loai: "nhieu_dong", rong: true },
  ];
  return (
    <div>
      <Link href="/van-ban" className="text-[13px] text-muc-3 hover:text-muc">← Văn bản & Hợp đồng</Link>
      <TieuDeTrang tieuDe="Đồng ý dùng ảnh" phu="Đồng ý chụp ảnh để theo dõi điều trị khác với đồng ý dùng ảnh cho truyền thông. Truyền thông là tự nguyện, ký riêng, có hạn và phạm vi kênh, khách rút lại lúc nào cũng được; hết hạn hoặc rút thì phải gỡ ảnh.">
        {soan && <NutHop nhan="Ghi nhận đồng ý" tieuDe="Ghi nhận đồng ý" truong={truong} action={luuConsent} giaTri={{ loai: "truyen_thong", ngay_ky: hom }} rong />}
      </TieuDeTrang>
      <Bang duLieu={ds ?? []} khoa={(r) => r.id} trong="Chưa có ghi nhận nào."
        cot={[
          { nhan: "Khách", chinh: true, hienThi: (r) => <Link href={`/khach-hang/${r.khach_id}`} className="text-nhan-dam hover:underline">{ten.get(r.khach_id) ?? ""}</Link> },
          { nhan: "Loại", hienThi: (r) => LOAI_CONSENT[r.loai] }, { nhan: "Phạm vi kênh", hienThi: (r) => r.pham_vi_kenh ?? "" },
          { nhan: "Ký / hiệu lực", hienThi: (r) => <div>{ngayVN(r.ngay_ky)}<div className="text-[12.5px] text-muc-3">{r.hieu_luc_den ? `đến ${ngayVN(r.hieu_luc_den)}` : "không thời hạn"}</div></div> },
          { nhan: "Trạng thái", hienThi: (r) => {
            if (r.da_rut) return <div><NhanTrangThai kieu="loi">Đã rút</NhanTrangThai><div className="mt-1 text-[12.5px] text-canh-bao">Gỡ ảnh còn đăng</div></div>;
            const hl = r.loai === "truyen_thong" ? tinhHieuLuc(r.hieu_luc_den, hom, congNgay, 30) : "con";
            return hl === "het" ? <div><NhanTrangThai kieu="loi">Hết hạn</NhanTrangThai><div className="mt-1 text-[12.5px] text-canh-bao">Gỡ ảnh còn đăng</div></div> : hl === "sap" ? <NhanTrangThai kieu="cho">Sắp hết hạn</NhanTrangThai> : <NhanTrangThai kieu="tot">Còn hiệu lực</NhanTrangThai>;
          } },
          { nhan: "", hienThi: (r) => (soan && !r.da_rut ? <NutHop kieu="chu" nguy nhan="Khách rút lại" tieuDe="Khách rút lại đồng ý" truong={[{ ten: "ly_do", nhan: "Ghi chú (kênh nào cần gỡ)", loai: "nhieu_dong", rong: true }]} action={rutConsent} an={{ id: r.id }} nhanLuu="Ghi nhận rút" /> : null) },
        ]} />
    </div>
  );
}
