import "server-only";
import { sb } from "@/lib/db";
import { chiNhanhHoatDong } from "@/lib/chi-nhanh";
import { congNgay, homNayHCM } from "@/lib/dinh-dang";
import type { NguoiDung } from "@/lib/auth";
import { mocBatDau, phamViQuaGio, thoiLuongChuan, tinhThucTe, tongPhutDichVu, type CaDangLam } from "@/lib/qua-gio";

type Db = ReturnType<typeof sb>;
const dauNgay = (ngay: string) => new Date(`${ngay}T00:00:00+07:00`).toISOString();

/** Thời lượng + tên mọi dịch vụ (bảng nhỏ, đọc thẳng từ danh mục mỗi lần: thời lượng theo bảng quy trình có thể vừa được sửa). */
async function bangDichVu(db: Db) {
  const { data } = await db.from("dich_vu").select("id, ten, thoi_luong_phut").limit(5000);
  return new Map((data ?? []).map((d) => [d.id, d]));
}

type DongLich = {
  id: string; bat_dau: string; ket_thuc: string; checkin_luc: string | null; bat_dau_lam_luc: string | null; hoan_thanh_luc: string | null; trang_thai: string;
  phong: string | null; nhan_vien_id: string | null; nhan_vien_ten: string | null; dich_vu_ten: string | null; chi_nhanh_id: string;
  khach: { ho_ten: string } | null; nv: { ho_ten: string } | null;
  lich_hen_dich_vu: { dich_vu_id: string; so_luong: number }[];
  lich_hen_khach: { nhan_vien_id: string | null; thoi_luong_phut: number | null; dich_vu_ids: string[] }[];
};
const COT = `id, bat_dau, ket_thuc, checkin_luc, bat_dau_lam_luc, hoan_thanh_luc, trang_thai, phong, nhan_vien_id, nhan_vien_ten, dich_vu_ten, chi_nhanh_id,
  khach:khach_hang!lich_hen_khach_id_fkey(ho_ten), nv:nhan_vien!lich_hen_nhan_vien_id_fkey(ho_ten), lich_hen_dich_vu(dich_vu_id, so_luong), lich_hen_khach(nhan_vien_id, thoi_luong_phut, dich_vu_ids)`;

/** Chuẩn (phút) + tên dịch vụ của một lịch, theo danh mục dịch vụ hiện tại. */
function chuanVaTen(l: DongLich, dv: Awaited<ReturnType<typeof bangDichVu>>) {
  const dsDv = l.lich_hen_dich_vu ?? [];
  const phutDichVu = tongPhutDichVu(dsDv.map((d) => ({ thoi_luong_phut: dv.get(d.dich_vu_id)?.thoi_luong_phut, so_luong: d.so_luong })));
  const khachDiCung = (l.lich_hen_khach ?? []).map((k) => k.thoi_luong_phut ?? tongPhutDichVu(k.dich_vu_ids.map((id) => ({ thoi_luong_phut: dv.get(id)?.thoi_luong_phut }))));
  const ten = dsDv.map((d) => dv.get(d.dich_vu_id)?.ten).filter(Boolean).join(", ") || l.dich_vu_ten || "Dịch vụ";
  return { chuanPhut: thoiLuongChuan({ phutDichVu, batDau: l.bat_dau, ketThuc: l.ket_thuc, khachDiCung }), ten };
}

/** Ca đang làm HÔM NAY (giờ VN) mà người này được báo khi quá giờ: lọc vai trò + chi nhánh ở máy chủ, không tin trình duyệt. */
export async function layCaDangLam(nd: NguoiDung): Promise<CaDangLam[]> {
  const pham = phamViQuaGio(nd);
  if (pham === "khong" || nd.phaiDoiMatKhau) return [];
  const cn = nd.chiNhanhId ? [nd.chiNhanhId] : (await chiNhanhHoatDong().catch(() => [])).map((c) => c.id);
  if (!cn.length) return [];
  const db = sb();
  const hn = homNayHCM();
  const { data, error } = await db.from("lich_hen").select(COT).eq("trang_thai", "dang_phuc_vu").eq("la_lich_su", false).in("chi_nhanh_id", cn)
    .gte("bat_dau", dauNgay(hn)).lt("bat_dau", dauNgay(congNgay(hn, 1))).order("bat_dau").limit(200);
  if (error || !data?.length) return [];
  const ds = (data as unknown as DongLich[]).filter((l) => pham === "chi_nhanh" || l.nhan_vien_id === nd.nhanVienId || (l.lich_hen_khach ?? []).some((k) => k.nhan_vien_id === nd.nhanVienId));
  if (!ds.length) return [];
  const dv = await bangDichVu(db);
  return ds.map((l) => {
    const { chuanPhut, ten } = chuanVaTen(l, dv);
    const { batDau, uocTinh } = mocBatDau(l);
    return { id: l.id, khach: l.khach?.ho_ten ?? "Khách", dichVu: ten, nguoiLam: l.nv?.ho_ten ?? l.nhan_vien_ten ?? "Chưa giao người", phong: l.phong, batDau, uocTinh, chuanPhut };
  });
}

export type DongBaoCaoThoiGian = {
  id: string; ngay: string; khach: string; dichVu: string; nguoiLamId: string | null; nguoiLam: string; gioHen: string;
  batDauLam: string | null; ketThucLam: string | null; dangLam: boolean; chuanPhut: number; thucTe: number | null; qua: number | null;
};
const TOI_DA_TRANG = 10, MOI_TRANG = 1000;

/** Báo cáo Thời gian dịch vụ: lịch đang phục vụ / hoàn thành trong khoảng ngày (theo giờ hẹn), có chuẩn / thực tế / quá giờ.
 *  Ca đang làm tính thực tế tới bây giờ. Lọc dịch vụ làm sau khi đọc (để chuẩn vẫn tính đủ mọi dịch vụ của lịch). */
export async function layThoiGianDichVu(p: { tu: string; den: string; cn?: string; nv?: string; dv?: string }): Promise<DongBaoCaoThoiGian[]> {
  const db = sb();
  const ra: DongLich[] = [];
  for (let i = 0; i < TOI_DA_TRANG; i++) {
    let q = db.from("lich_hen").select(COT).in("trang_thai", ["dang_phuc_vu", "hoan_thanh"]).gte("bat_dau", dauNgay(p.tu)).lt("bat_dau", dauNgay(congNgay(p.den, 1)));
    if (p.cn) q = q.eq("chi_nhanh_id", p.cn);
    if (p.nv) q = q.eq("nhan_vien_id", p.nv);
    const { data, error } = await q.order("bat_dau", { ascending: false }).order("id").range(i * MOI_TRANG, (i + 1) * MOI_TRANG - 1);
    if (error || !data) break;
    ra.push(...(data as unknown as DongLich[]));
    if (data.length < MOI_TRANG) break;
  }
  const dv = await bangDichVu(db);
  const bayGio = new Date().toISOString();
  return ra
    .filter((l) => !p.dv || (l.lich_hen_dich_vu ?? []).some((d) => d.dich_vu_id === p.dv))
    .map((l) => {
      const { chuanPhut, ten } = chuanVaTen(l, dv);
      const dangLam = l.trang_thai === "dang_phuc_vu";
      const ketThucLam = dangLam ? (l.bat_dau_lam_luc ? bayGio : null) : l.hoan_thanh_luc;
      const { thucTe, qua } = tinhThucTe({ batDauLam: l.bat_dau_lam_luc, ketThucLam, chuanPhut });
      return {
        id: l.id, ngay: new Date(l.bat_dau).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }), khach: l.khach?.ho_ten ?? "Khách", dichVu: ten,
        nguoiLamId: l.nhan_vien_id, nguoiLam: l.nv?.ho_ten ?? l.nhan_vien_ten ?? "Chưa giao người", gioHen: l.bat_dau,
        batDauLam: l.bat_dau_lam_luc, ketThucLam: dangLam ? null : l.hoan_thanh_luc, dangLam, chuanPhut, thucTe, qua,
      };
    });
}
