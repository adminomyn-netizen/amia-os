import Link from "next/link";
import { ngayVN, tienVN } from "@/lib/dinh-dang";
import { KET_QUA_TV } from "@/lib/tu-van";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import type { luuPhieuTuVan } from "@/app/(app)/khach-hang/tu-van/actions";

export type PhieuHienThi = {
  id: string; ma: string; khach_id: string; ngay_tu_van: string; tu_van_vien_id: string; dich_vu_id: string | null; goi_quan_tam: string | null;
  dat_van_de: string | null; phan_tich: string | null; chung_minh: string | null; ket_qua: string; bao_gia: number; ngay_hen_lai: string | null; ly_do_khong_chot: string | null;
};

/** Danh sách phiếu tư vấn dạng thẻ (đọc được ở 360 px): đầu thẻ = mã, ngày, kết quả, báo giá; thân = ba bước của phễu; cuối = nhu cầu phát sinh, hẹn quay lại, lý do không chốt. */
export function DanhSachPhieuTuVan({ phieu, nhuCau, tenNv, tenDv, khach, truong, duocSua, luu, hienKhach }: {
  phieu: PhieuHienThi[]; nhuCau: Map<string, string[]>; tenNv: Map<string, string>; tenDv: Map<string, string>; khach?: Map<string, { ho_ten: string; ma: string }>;
  truong: Truong[]; duocSua: boolean; luu: typeof luuPhieuTuVan; hienKhach?: boolean;
}) {
  if (phieu.length === 0) return <p className="chu-tieu-de py-10 text-center text-[22px] text-muc-3">Chưa có phiếu tư vấn.</p>;
  return (
    <ol className="space-y-4">
      {phieu.map((p) => {
        const kq = KET_QUA_TV[p.ket_qua] ?? KET_QUA_TV.cho_chot;
        const buoc = ([["1. Đặt vấn đề", p.dat_van_de], ["2. Phân tích", p.phan_tich], ["3. Chứng minh", p.chung_minh]] as const).filter(([, v]) => v);
        const nc = nhuCau.get(p.id) ?? [];
        const k = khach?.get(p.khach_id);
        return (
          <li key={p.id} className="rounded-nho border border-vien bg-giay-sang p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 text-[13px] text-muc-3">
                <span className="font-medium text-muc">{p.ma}</span> · {ngayVN(p.ngay_tu_van)} · {tenNv.get(p.tu_van_vien_id) ?? "—"}
                {hienKhach && k && <> · <Link href={`/khach-hang/${p.khach_id}?tab=tu-van`} className="font-medium text-nhan-dam hover:underline">{k.ho_ten}</Link> <span>({k.ma})</span></>}
              </div>
              <div className="flex items-center gap-2"><NhanTrangThai kieu={kq.kieu}>{kq.ten}</NhanTrangThai>{p.bao_gia > 0 && <span className="text-[13px] font-medium tabular-nums text-muc">{tienVN(p.bao_gia)}</span>}</div>
            </div>
            {(p.dich_vu_id || p.goi_quan_tam) && <p className="mt-1.5 text-[13px] text-muc-2">Quan tâm: {[p.dich_vu_id ? tenDv.get(p.dich_vu_id) : "", p.goi_quan_tam].filter(Boolean).join(" · ")}</p>}
            {buoc.length > 0 && (
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-3">
                {buoc.map(([a, b]) => <div key={a}><dt className="nhan-muc">{a}</dt><dd className="mt-0.5 whitespace-pre-line text-muc">{b}</dd></div>)}
              </dl>
            )}
            {nc.length > 0 && (
              <div className="mt-3 text-[14px]"><div className="nhan-muc">Nhu cầu phát sinh</div><ul className="mt-0.5 list-disc pl-5 text-muc">{nc.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            )}
            {(p.ngay_hen_lai || p.ly_do_khong_chot) && (
              <p className="mt-3 text-[13px] text-muc-2">
                {p.ngay_hen_lai && <>Hẹn quay lại: <span className="font-medium text-muc">{ngayVN(p.ngay_hen_lai)}</span></>}
                {p.ngay_hen_lai && p.ly_do_khong_chot && " · "}
                {p.ly_do_khong_chot && <>Lý do không chốt: <span className="text-loi">{p.ly_do_khong_chot}</span></>}
              </p>
            )}
            {duocSua && (
              <div className="mt-3">
                <NutHop kieu="chu" nhan="Cập nhật" tieuDe={`Phiếu tư vấn ${p.ma}`} moTa="Sửa được; mọi thay đổi đều có nhật ký. Phiếu không xoá được." rong action={luu} truong={truong}
                  giaTri={{ id: p.id, tu_van_vien_id: p.tu_van_vien_id, ngay_tu_van: p.ngay_tu_van, dich_vu_id: p.dich_vu_id ?? "", goi_quan_tam: p.goi_quan_tam ?? "", dat_van_de: p.dat_van_de ?? "", phan_tich: p.phan_tich ?? "", chung_minh: p.chung_minh ?? "",
                    ket_qua: p.ket_qua, bao_gia: Number(p.bao_gia), ngay_hen_lai: p.ngay_hen_lai ?? "", ly_do_khong_chot: p.ly_do_khong_chot ?? "", nhu_cau: "" }} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Đọc nhu cầu phát sinh của một nhóm phiếu: map mã phiếu → các dòng. */
export function gomNhuCau(ds: { phieu_id: string; noi_dung: string }[]) {
  const m = new Map<string, string[]>();
  for (const x of ds) m.set(x.phieu_id, [...(m.get(x.phieu_id) ?? []), x.noi_dung]);
  return m;
}
