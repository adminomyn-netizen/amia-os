import Link from "next/link";
import { sb } from "@/lib/db";
import { NHAN_VAI_TRO, VAI_TRO } from "@/lib/quyen";
import { gioVN, ngayVN } from "@/lib/dinh-dang";
import { HangChiSo } from "@/components/ui/HangChiSo";
import { MucTrang } from "@/components/ui/MucTrang";

const SO = new Intl.NumberFormat("vi-VN");

/** Dashboard riêng của Kỹ thuật: tài khoản, phân quyền, nhật ký truy cập hồ sơ khách, quy mô dữ liệu. */
export async function TongQuanKyThuat() {
  const db = sb();
  const dem = async (bang: "khach_hang" | "the_khach" | "hoa_don") => (await db.from(bang).select("id", { count: "exact", head: true })).count ?? 0;
  const [{ data: nv }, khach, the, hd, { data: nk }] = await Promise.all([
    db.from("nhan_vien").select("vai_tro, user_id, hoat_dong, phai_doi_mat_khau, quyen_rieng"),
    dem("khach_hang"), dem("the_khach"), dem("hoa_don"),
    db.from("nhat_ky_truy_cap").select("id, nguoi_id, hanh_dong, doi_tuong, luc").order("luc", { ascending: false }).limit(8),
  ]);
  const ds = nv ?? [];
  const coTk = ds.filter((n) => n.user_id && n.hoat_dong);
  const chuaDoi = ds.filter((n) => n.user_id && n.phai_doi_mat_khau).length;
  const rieng = ds.filter((n) => n.quyen_rieng).length;
  const ids = [...new Set((nk ?? []).map((n) => n.nguoi_id).filter(Boolean))] as string[];
  const { data: ten } = ids.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", ids) : { data: [] };
  const tenNv = new Map((ten ?? []).map((t) => [t.id, t.ho_ten]));

  return (
    <div className="mb-10 space-y-8">
      <HangChiSo muc={[
        { nhan: "Tài khoản đang đăng nhập được", so: String(coTk.length), ghiChu: `${ds.length} hồ sơ nhân viên` },
        { nhan: "Chưa đổi mật khẩu mặc định", so: String(chuaDoi), ghiChu: chuaDoi ? "Nhắc họ đăng nhập và đổi" : "Tất cả đã đổi" },
        { nhan: "Có phân quyền riêng", so: String(rieng), ghiChu: "Khác mặc định của vai trò" },
        { nhan: "Dữ liệu trong hệ thống", so: SO.format(khach), ghiChu: `khách · ${SO.format(the)} thẻ · ${SO.format(hd)} hoá đơn` },
      ]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <MucTrang noi tieuDe="Tài khoản theo vai trò" phai={<Link href="/nhan-vien" className="font-medium text-nhan-dam hover:underline">Quản lý tài khoản</Link>}>
          <ul className="divide-y divide-vien">
            {VAI_TRO.map((v) => ({ v, tong: ds.filter((n) => n.vai_tro === v).length, tk: coTk.filter((n) => n.vai_tro === v).length })).filter((x) => x.tong > 0).map((x) => (
              <li key={x.v} className="flex items-center justify-between py-2 text-[14px]"><span>{NHAN_VAI_TRO[x.v]}</span><span className="tabular-nums text-muc-3">{x.tk} có tài khoản / {x.tong} hồ sơ</span></li>
            ))}
          </ul>
        </MucTrang>
        <MucTrang noi tieuDe="Truy cập hồ sơ khách gần đây">
          {(nk ?? []).length === 0 ? <p className="text-[14px] text-muc-3">Chưa có lượt xem nào được ghi.</p> : (
            <ul className="divide-y divide-vien">
              {(nk ?? []).map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                  <span className="min-w-0 truncate">{tenNv.get(n.nguoi_id ?? "") ?? "Không rõ"} · {n.hanh_dong} {n.doi_tuong}</span>
                  <span className="shrink-0 tabular-nums text-muc-3">{ngayVN(n.luc.slice(0, 10))} {gioVN(n.luc)}</span>
                </li>
              ))}
            </ul>
          )}
        </MucTrang>
      </div>
    </div>
  );
}
