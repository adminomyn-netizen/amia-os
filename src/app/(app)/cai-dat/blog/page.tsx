import Link from "next/link";
import { yeuCauQuyen } from "@/lib/auth";
import { sb } from "@/lib/db";
import { ngayVN } from "@/lib/dinh-dang";
import { TieuDeNoi } from "@/components/ui/TieuDeNoi";
import { Newspaper } from "lucide-react";
import { Tab } from "@/components/ui/Tab";
import { Bang } from "@/components/ui/Table";
import { NhanTrangThai } from "@/components/ui/NhanTrangThai";
import { NutHop, type Truong } from "@/components/ui/BieuMau";
import { O_NHAP, NUT_PHU } from "@/components/ui/dinh-dang";
import { BlogBaiViet, BlogNutNhanh } from "@/components/cai-dat/BlogBaiViet";
import { doiTrangThaiBai, luuBaiViet, luuChuyenMuc, xoaBaiViet, xoaChuyenMuc } from "./actions";

type SP = { tab?: string; q?: string; cm?: string; tt?: string };
const MUC = [{ ma: "bai-viet", ten: "Bài viết" }, { ma: "chuyen-muc", ten: "Chuyên mục" }];

/** Blog website AMIA (như Blog của SalonHero): Chủ và Kỹ thuật quản lý chuyên mục và bài viết; bài kích hoạt hiện ở /blog. */
export default async function TrangBlog({ searchParams }: { searchParams: Promise<SP> }) {
  await yeuCauQuyen("hethong.phanquyen");
  const sp = await searchParams;
  const tab = sp.tab === "chuyen-muc" ? "chuyen-muc" : "bai-viet";
  const db = sb();
  const { data: cms } = await db.from("blog_chuyen_muc").select("*").order("thu_tu", { ascending: false }).order("tieu_de");
  const tenCm = new Map((cms ?? []).map((c) => [c.id, c.tieu_de]));
  const dsCm = (cms ?? []).map((c) => ({ gia_tri: c.id, nhan: c.tieu_de }));

  const truongCm: Truong[] = [
    { ten: "tieu_de", nhan: "Tiêu đề", loai: "chu", batBuoc: true, rong: true, goiY: "Tiêu đề chuyên mục" },
    { ten: "mo_ta", nhan: "Mô tả", loai: "nhieu_dong" },
    { ten: "thu_tu", nhan: "Thứ tự sắp xếp (số lớn sẽ lên đầu)", loai: "so", goiY: "0" },
    { ten: "hoat_dong", nhan: "Kích hoạt", loai: "gat" },
  ];

  let noiDung: React.ReactNode;
  if (tab === "chuyen-muc") {
    const { data: dem } = await db.from("blog_bai_viet").select("chuyen_muc_id");
    const soBai = new Map<string, number>();
    for (const r of dem ?? []) soBai.set(r.chuyen_muc_id, (soBai.get(r.chuyen_muc_id) ?? 0) + 1);
    noiDung = (
      <Bang noi duLieu={cms ?? []} khoa={(r) => r.id} trong="Chưa có chuyên mục nào."
        cot={[
          { nhan: "Chuyên mục", chinh: true, hienThi: (r) => <span className="text-muc">{r.tieu_de}</span> },
          { nhan: "Mô tả", hienThi: (r) => r.mo_ta ?? "" },
          { nhan: "Thứ tự", hienThi: (r) => String(r.thu_tu) },
          { nhan: "Bài viết", hienThi: (r) => String(soBai.get(r.id) ?? 0) },
          { nhan: "Ngày cập nhật", hienThi: (r) => ngayVN(r.cap_nhat_luc.slice(0, 10)) },
          { nhan: "Trạng thái", hienThi: (r) => (r.hoat_dong ? <NhanTrangThai kieu="tot">Kích hoạt</NhanTrangThai> : <NhanTrangThai kieu="tram">Chưa kích hoạt</NhanTrangThai>) },
          { nhan: "", hienThi: (r) => (
            <span className="inline-flex items-center gap-3">
              <NutHop kieu="chu" nhan="Sửa" tieuDe="Sửa chuyên mục" truong={truongCm} action={luuChuyenMuc} giaTri={{ id: r.id, tieu_de: r.tieu_de, mo_ta: r.mo_ta ?? "", thu_tu: r.thu_tu, hoat_dong: r.hoat_dong }} />
              <NutHop kieu="chu" nguy nhan="Xoá" tieuDe="Xoá chuyên mục" xacNhan="Chỉ xoá được chuyên mục chưa có bài viết." truong={[]} action={xoaChuyenMuc} giaTri={{ id: r.id }} />
            </span>
          ) },
        ]} />
    );
  } else {
    let q = db.from("blog_bai_viet").select("*").order("cap_nhat_luc", { ascending: false }).limit(300);
    if (sp.cm && tenCm.has(sp.cm)) q = q.eq("chuyen_muc_id", sp.cm);
    if (sp.tt === "kich-hoat") q = q.eq("hoat_dong", true);
    if (sp.tt === "chua") q = q.eq("hoat_dong", false);
    const tim = (sp.q ?? "").trim().replace(/[%,()]/g, " ").slice(0, 80);
    if (tim) q = q.ilike("tieu_de", `%${tim}%`);
    const { data: bai } = await q;
    const link = (them: Partial<SP>) => {
      const p = new URLSearchParams({ tab: "bai-viet" });
      const g = { ...sp, ...them };
      for (const k of ["q", "cm", "tt"] as const) if (g[k]) p.set(k, g[k]!);
      return `/cai-dat/blog?${p.toString()}`;
    };
    const chip = (dang: boolean) => `rounded-nho border px-3 py-1.5 text-[13px] ${dang ? "border-nhan bg-giay-tram font-medium text-nhan-dam" : "border-vien text-muc-2 hover:text-muc"}`;
    noiDung = (
      <>
        <form action="/cai-dat/blog" className="mb-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value="bai-viet" />
          {sp.cm && <input type="hidden" name="cm" value={sp.cm} />}
          {sp.tt && <input type="hidden" name="tt" value={sp.tt} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Tìm tiêu đề bài viết" className={`${O_NHAP} max-w-xs`} aria-label="Tìm tiêu đề bài viết" />
          <button type="submit" className={NUT_PHU}>Tìm</button>
        </form>
        <div className="mb-2 flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
          <Link href={link({ tt: undefined })} className={chip(!sp.tt)}>Tất cả</Link>
          <Link href={link({ tt: "kich-hoat" })} className={chip(sp.tt === "kich-hoat")}>Kích hoạt</Link>
          <Link href={link({ tt: "chua" })} className={chip(sp.tt === "chua")}>Chưa kích hoạt</Link>
        </div>
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Lọc theo chuyên mục">
          <Link href={link({ cm: undefined })} className={chip(!sp.cm)}>Mọi chuyên mục</Link>
          {(cms ?? []).map((c) => <Link key={c.id} href={link({ cm: c.id })} className={chip(sp.cm === c.id)}>{c.tieu_de}</Link>)}
        </div>
        <Bang noi duLieu={bai ?? []} khoa={(r) => r.id} trong="Chưa có bài viết nào."
          cot={[
            { nhan: "Tiêu đề", chinh: true, hienThi: (r) => <span className="text-muc">{r.tieu_bieu ? "Tiêu biểu · " : ""}{r.tieu_de}</span> },
            { nhan: "Chuyên mục", hienThi: (r) => tenCm.get(r.chuyen_muc_id) ?? "" },
            { nhan: "Mô tả", hienThi: (r) => <span className="line-clamp-2">{r.mo_ta_ngan ?? ""}</span> },
            { nhan: "Ngày cập nhật", hienThi: (r) => ngayVN(r.cap_nhat_luc.slice(0, 10)) },
            { nhan: "Trạng thái", hienThi: (r) => (r.hoat_dong ? <NhanTrangThai kieu="tot">Kích hoạt</NhanTrangThai> : <NhanTrangThai kieu="tram">Chưa kích hoạt</NhanTrangThai>) },
            { nhan: "Xem trên website", hienThi: (r) => (r.hoat_dong ? <Link href={`/blog/${r.id}`} target="_blank" className="text-[13px] font-medium text-nhan-dam underline-offset-4 hover:underline">Xem</Link> : <span className="text-muc-3">Chưa hiện</span>) },
            { nhan: "", hienThi: (r) => (
              <span className="inline-flex flex-wrap items-center gap-3">
                <BlogBaiViet kieu="chu" nhan="Sửa" chuyenMuc={dsCm} luu={luuBaiViet} bai={{ id: r.id, tieu_de: r.tieu_de, chuyen_muc_id: r.chuyen_muc_id, mo_ta_ngan: r.mo_ta_ngan ?? "", noi_dung: r.noi_dung, tieu_bieu: r.tieu_bieu, hoat_dong: r.hoat_dong, anh: r.anh }} />
                <BlogNutNhanh id={r.id} hoatDong={r.hoat_dong} doi={doiTrangThaiBai} xoa={xoaBaiViet} />
              </span>
            ) },
          ]} />
      </>
    );
  }

  return (
    <div>
      <TieuDeNoi icon={Newspaper} quayLai={{ href: "/cai-dat", nhan: "Cài đặt" }} tieuDe="Blog" phu="Bài viết hiện trên website AMIA. Chủ và Kỹ thuật quản lý chuyên mục và bài viết.">
        {tab === "chuyen-muc"
          ? <NutHop nhan="Thêm chuyên mục mới" tieuDe="Thêm chuyên mục" truong={truongCm} action={luuChuyenMuc} giaTri={{ hoat_dong: true, thu_tu: 0 }} />
          : <BlogBaiViet chuyenMuc={dsCm} luu={luuBaiViet} />}
      </TieuDeNoi>
      <Tab muc={MUC} dang={tab} goc="/cai-dat/blog" />
      {noiDung}
    </div>
  );
}
