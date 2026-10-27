import Link from "next/link";
import { yeuCauNoiBo } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb } from "@/lib/db";
import { ngayVN, homNayHCM } from "@/lib/dinh-dang";
import { TT_VIEC, UU_TIEN } from "@/lib/de-xuat";
import { TieuDeTrang } from "@/components/ui/TieuDeTrang";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { giaoViec, doiTrangThaiViec } from "../actions";

export default async function TrangViec({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const nd = await yeuCauNoiBo();
  const xemHet = coQuyen(nd, "viec.tatca");
  const TAB = [{ ma: "cho-toi", ten: "Giao cho tôi" }, { ma: "toi-giao", ten: "Tôi giao" }, { ma: "qua-han", ten: "Quá hạn" }, ...(xemHet ? [{ ma: "tat-ca", ten: "Tất cả" }] : [])];
  const { tab: t } = await searchParams;
  const tab = TAB.some((x) => x.ma === t) ? t! : "cho-toi";
  const hom = homNayHCM();
  const db = sb();
  let q = db.from("cong_viec").select("*").order("han", { ascending: true, nullsFirst: false }).order("tao_luc", { ascending: false }).limit(300);
  if (tab === "cho-toi") q = q.eq("nguoi_nhan_id", nd.nhanVienId).in("trang_thai", ["moi", "dang_lam"]);
  else if (tab === "toi-giao") q = q.eq("nguoi_giao_id", nd.nhanVienId).in("trang_thai", ["moi", "dang_lam", "xong"]);
  else if (tab === "qua-han") { q = q.in("trang_thai", ["moi", "dang_lam"]).lt("han", hom); if (!xemHet) q = q.or(`nguoi_nhan_id.eq.${nd.nhanVienId},nguoi_giao_id.eq.${nd.nhanVienId}`); }
  const [{ data: viec }, { data: nv }] = await Promise.all([q, db.from("nhan_vien").select("id, ho_ten").eq("hoat_dong", true).order("ho_ten")]);
  const ten = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const truong: Truong[] = [
    { ten: "tieu_de", nhan: "Công việc", loai: "chu", batBuoc: true, rong: true },
    { ten: "nguoi_nhan_id", nhan: "Giao cho", loai: "chon", luaChon: (nv ?? []).map((n) => ({ gia_tri: n.id, nhan: n.id === nd.nhanVienId ? `${n.ho_ten} (tôi)` : n.ho_ten })), batBuoc: true },
    { ten: "han", nhan: "Hạn hoàn thành", loai: "ngay" },
    { ten: "uu_tien", nhan: "Ưu tiên", loai: "chon", luaChon: Object.entries(UU_TIEN).map(([gia_tri, nhan]) => ({ gia_tri, nhan })) },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong", rong: true },
  ];
  const ketQua: Truong[] = [{ ten: "ket_qua", nhan: "Kết quả (không bắt buộc)", loai: "nhieu_dong", rong: true }];
  return (
    <div>
      <Link href="/noi-lam-viec" className="text-[13px] text-muc-3 hover:text-muc">← Nơi làm việc</Link>
      <TieuDeTrang tieuDe="Việc cần hoàn thành" phu="Việc giao cho tôi, việc tôi giao và việc quá hạn. Phê duyệt tiền không đi qua đây — xem Trung tâm phê duyệt.">
        <NutHop nhan="Giao việc" tieuDe="Giao việc" truong={truong} action={giaoViec} giaTri={{ nguoi_nhan_id: nd.nhanVienId, uu_tien: "thuong" }} />
      </TieuDeTrang>
      <Tab muc={TAB} dang={tab} goc="/noi-lam-viec/viec" />
      <Bang duLieu={viec ?? []} khoa={(r) => r.id} trong="Không có việc nào."
        cot={[
          { nhan: "Công việc", chinh: true, hienThi: (r) => <div><span className="text-muc">{r.tieu_de}</span>{r.mo_ta && <div className="mt-0.5 text-[13px] text-muc-3">{r.mo_ta}</div>}{r.ket_qua && <div className="mt-0.5 text-[13px] text-nhan-dam">Kết quả: {r.ket_qua}</div>}</div> },
          { nhan: "Người nhận", hienThi: (r) => ten.get(r.nguoi_nhan_id) ?? "" }, { nhan: "Người giao", hienThi: (r) => ten.get(r.nguoi_giao_id) ?? "" },
          { nhan: "Hạn", hienThi: (r) => (r.han ? <span className={r.han < hom && ["moi", "dang_lam"].includes(r.trang_thai) ? "text-loi" : ""}>{ngayVN(r.han)}{r.han < hom && ["moi", "dang_lam"].includes(r.trang_thai) ? " · quá hạn" : ""}</span> : "") },
          { nhan: "Ưu tiên", hienThi: (r) => UU_TIEN[r.uu_tien] },
          { nhan: "Trạng thái", hienThi: (r) => <NhanTrangThai kieu={TT_VIEC[r.trang_thai].kieu}>{TT_VIEC[r.trang_thai].ten}</NhanTrangThai> },
          { nhan: "", hienThi: (r) => {
            const nhan = r.nguoi_nhan_id === nd.nhanVienId || r.nguoi_giao_id === nd.nhanVienId || xemHet, giao = r.nguoi_giao_id === nd.nhanVienId || xemHet;
            return (
              <div className="flex flex-wrap justify-end gap-1.5">
                {nhan && r.trang_thai === "moi" && <NutHop kieu="chu" nhan="Bắt đầu" tieuDe="Bắt đầu làm" xacNhan={`Chuyển "${r.tieu_de}" sang đang làm?`} action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "dang_lam" }} nhanLuu="Bắt đầu" />}
                {nhan && ["moi", "dang_lam"].includes(r.trang_thai) && <NutHop kieu="chu" nhan="Hoàn thành" tieuDe="Hoàn thành công việc" truong={ketQua} action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "xong" }} nhanLuu="Hoàn thành" />}
                {giao && ["moi", "dang_lam"].includes(r.trang_thai) && <NutHop kieu="chu" nguy nhan="Huỷ việc" tieuDe="Huỷ việc" xacNhan={`Huỷ việc "${r.tieu_de}"?`} action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "huy" }} nhanLuu="Huỷ việc" />}
                {giao && ["xong", "huy"].includes(r.trang_thai) && <NutHop kieu="chu" nhan="Mở lại" tieuDe="Mở lại việc" xacNhan="Mở lại việc này?" action={doiTrangThaiViec} an={{ id: r.id, trang_thai: "moi" }} nhanLuu="Mở lại" />}
              </div>
            );
          } },
        ]} />
    </div>
  );
}
