"use server";

import { layNguoiDungHienTai } from "@/lib/auth";
import { sb } from "@/lib/db";
import { boDau, chuanSdt } from "@/lib/dinh-dang";
import { coMotQuyen, locMenu } from "@/lib/nav";
import { MODULE } from "@/lib/module";
import { coQuyen } from "@/lib/quyen";

export type KqTim = { nhom: string; muc: { ten: string; phu?: string; href: string }[] };

const bo = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").toLowerCase();

/** Tìm chung trên thanh đầu trang: chức năng (menu + Cài đặt), khách hàng, hoá đơn, sản phẩm / dịch vụ, nhân viên. Chỉ trả những gì người hỏi có quyền xem. */
export async function timChung(tu: string): Promise<KqTim[]> {
  const nd = await layNguoiDungHienTai();
  const t = (tu ?? "").trim().slice(0, 60);
  if (!nd || t.length < 2) return [];
  const an = t.replace(/[%,()*]/g, " ").trim();
  const so = chuanSdt(t);
  const db = sb();
  const b = bo(t);
  const ra: KqTim[] = [];

  const trang: KqTim["muc"] = [];
  for (const m of locMenu(nd)) if (bo(m.ten).includes(b) || bo(m.moTa).includes(b)) trang.push({ ten: m.ten, phu: m.moTa, href: m.duong_dan });
  for (const md of MODULE) {
    if (!coMotQuyen(nd, md.quyen)) continue;
    for (const g of md.nhom) for (const the of g.the) {
      if (!the.duongDan || !coMotQuyen(nd, the.quyen)) continue;
      if (bo(the.ten).includes(b) || bo(the.moTa).includes(b)) trang.push({ ten: the.ten, phu: `${md.ten} · ${g.nhan}`, href: the.duongDan });
    }
  }
  const thay = new Set<string>();
  const trangRoi = trang.filter((x) => (thay.has(x.href) ? false : (thay.add(x.href), true))).slice(0, 6);
  if (trangRoi.length) ra.push({ nhom: "Chức năng", muc: trangRoi });

  const [rkh, rhd, rsp, rdv, rnv] = await Promise.all([
    coQuyen(nd, "khach.xem") ? (() => {
      let q = db.from("khach_hang").select("id, ma, ho_ten, dien_thoai, email").or([`ho_ten_khong_dau.ilike.%${boDau(an)}%`, `ma.ilike.%${an}%`, `email.ilike.%${an}%`, so.length >= 3 ? `dien_thoai.like.%${so}%` : ""].filter(Boolean).join(",")).order("lan_den_cuoi", { ascending: false, nullsFirst: false }).limit(6);
      if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
      return q;
    })() : Promise.resolve({ data: null }),
    coQuyen(nd, "ban.xem") ? (() => {
      let q = db.from("hoa_don").select("id, ma, ngay_hd, tong_phai_thu, trang_thai").ilike("ma", `%${an}%`).order("ngay_hd", { ascending: false }).limit(4);
      if (nd.chiNhanhId) q = q.eq("chi_nhanh_id", nd.chiNhanhId);
      return q;
    })() : Promise.resolve({ data: null }),
    coQuyen(nd, "danhmuc.xem") ? db.from("san_pham").select("id, ma, ten").or(`ten.ilike.%${an}%,ma.ilike.%${an}%`).eq("hoat_dong", true).limit(5) : Promise.resolve({ data: null }),
    coQuyen(nd, "danhmuc.xem") ? db.from("dich_vu").select("id, ma, ten").or(`ten.ilike.%${an}%,ma.ilike.%${an}%`).eq("hoat_dong", true).limit(5) : Promise.resolve({ data: null }),
    coQuyen(nd, "nhanvien.quanly") ? db.from("nhan_vien").select("id, ho_ten, chuc_danh, ma_nv").or(`ho_ten.ilike.%${an}%,ma_nv.ilike.%${an}%`).eq("hoat_dong", true).limit(5) : Promise.resolve({ data: null }),
  ]);
  const kh = rkh.data, hd = rhd.data, sp = rsp.data, dv = rdv.data, nv = rnv.data;
  if (kh?.length) ra.push({ nhom: "Khách hàng", muc: kh.map((k) => ({ ten: k.ho_ten, phu: `${k.ma} · ${k.dien_thoai}${k.email && k.email.toLowerCase().includes(an.toLowerCase()) ? ` · ${k.email}` : ""}`, href: `/khach-hang/${k.id}` })) });
  if (hd?.length) ra.push({ nhom: "Hoá đơn", muc: hd.map((h) => ({ ten: h.ma, phu: `${h.ngay_hd.slice(8)}/${h.ngay_hd.slice(5, 7)}/${h.ngay_hd.slice(0, 4)}`, href: `/hoa-don/${h.id}` })) });
  const dm = [...(sp ?? []).map((x) => ({ ten: x.ten, phu: `Sản phẩm · ${x.ma}`, href: "/danh-muc?tab=san-pham" })), ...(dv ?? []).map((x) => ({ ten: x.ten, phu: `Dịch vụ · ${x.ma}`, href: "/danh-muc?tab=dich-vu" }))];
  if (dm.length) ra.push({ nhom: "Sản phẩm & dịch vụ", muc: dm });
  if (nv?.length) ra.push({ nhom: "Nhân viên", muc: nv.map((n) => ({ ten: n.ho_ten, phu: n.chuc_danh ?? n.ma_nv ?? undefined, href: "/nhan-vien" })) });
  return ra;
}
