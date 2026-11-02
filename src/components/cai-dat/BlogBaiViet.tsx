"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hop } from "@/components/ui/Hop";
import { Chon } from "@/components/ui/Chon";
import { Gat } from "@/components/ui/Gat";
import { NHAN_O, NUT_CHINH, NUT_CHU, NUT_CHU_NGUY, NUT_PHU, O_NHAP, O_NHIEU_DONG } from "@/components/ui/dinh-dang";

type KQ = { ok?: true; loi?: string };
export type BaiSua = { id: string; tieu_de: string; chuyen_muc_id: string; mo_ta_ngan: string; noi_dung: string; tieu_bieu: boolean; hoat_dong: boolean; anh: string | null };

/** Hộp thêm / sửa bài Blog: tiêu đề, chuyên mục, mô tả ngắn, ảnh, bài tiêu biểu, nội dung, trạng thái. Ảnh gửi cùng biểu mẫu lên máy chủ. */
export function BlogBaiViet({ chuyenMuc, bai, luu, nhan = "Thêm blog mới", kieu = "chinh" }: { chuyenMuc: { gia_tri: string; nhan: string }[]; bai?: BaiSua; luu: (fd: FormData) => Promise<KQ>; nhan?: string; kieu?: "chinh" | "chu" }) {
  const router = useRouter();
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [cm, setCm] = useState(bai?.chuyen_muc_id ?? "");
  const [tieuBieu, setTieuBieu] = useState(bai?.tieu_bieu ?? false);
  const [hoatDong, setHoatDong] = useState(bai?.hoat_dong ?? false);
  const [goAnh, setGoAnh] = useState(false);
  const [xem, setXem] = useState<string | null>(null);
  const [dang, bat] = useTransition();

  const gui = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (bai) fd.set("id", bai.id);
    fd.set("chuyen_muc_id", cm);
    fd.set("tieu_bieu", tieuBieu ? "1" : "0");
    fd.set("hoat_dong", hoatDong ? "1" : "0");
    fd.set("go_anh", goAnh ? "1" : "0");
    setLoi("");
    bat(async () => {
      const kq = await luu(fd);
      if (kq.loi) setLoi(kq.loi);
      else { setMo(false); router.refresh(); }
    });
  };
  const chonAnh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setXem(f ? URL.createObjectURL(f) : null);
    if (f) setGoAnh(false);
  };

  return (
    <>
      <button type="button" className={kieu === "chinh" ? NUT_CHINH : NUT_CHU} onClick={() => { setLoi(""); setXem(null); setGoAnh(false); setMo(true); }}>{nhan}</button>
      <Hop mo={mo} dong={() => setMo(false)} tieuDe={bai ? "Sửa bài viết" : "Thêm bài viết"} moTa="Bài chỉ hiện trên website khi để Kích hoạt." rong="rong">
        <form onSubmit={gui} className="grid gap-4">
          <div>
            <label htmlFor="blog-tieu-de" className={NHAN_O}>Tiêu đề <span className="text-loi">*</span></label>
            <input id="blog-tieu-de" name="tieu_de" defaultValue={bai?.tieu_de ?? ""} maxLength={200} className={O_NHAP} autoComplete="off" />
          </div>
          <div>
            <span className={NHAN_O}>Chuyên mục <span className="text-loi">*</span></span>
            <Chon luaChon={chuyenMuc} giaTri={cm} onDoi={setCm} trong="Chọn chuyên mục" ariaLabel="Chuyên mục" />
          </div>
          <div>
            <label htmlFor="blog-mo-ta" className={NHAN_O}>Mô tả ngắn</label>
            <textarea id="blog-mo-ta" name="mo_ta_ngan" defaultValue={bai?.mo_ta_ngan ?? ""} maxLength={600} rows={3} className={O_NHIEU_DONG} />
          </div>
          <div>
            <label htmlFor="blog-anh" className={NHAN_O}>Ảnh (JPG, PNG, WebP, tối đa 5 MB)</label>
            <input id="blog-anh" name="anh" type="file" accept="image/jpeg,image/png,image/webp" onChange={chonAnh} className="block w-full text-[13px] text-muc-2" />
            {xem && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={xem} alt="Ảnh vừa chọn" className="mt-2 h-28 rounded-nho border border-vien object-cover" />
            )}
            {bai?.anh && !xem && (
              <label className="mt-2 flex items-center gap-2 text-[13px] text-muc-2"><input type="checkbox" checked={goAnh} onChange={(e) => setGoAnh(e.target.checked)} /> Gỡ ảnh hiện tại</label>
            )}
          </div>
          <Gat nhan="Bài viết tiêu biểu" giaTriMacDinh={tieuBieu} onDoi={setTieuBieu} />
          <div>
            <label htmlFor="blog-nd" className={NHAN_O}>Nội dung <span className="text-loi">*</span></label>
            <textarea id="blog-nd" name="noi_dung" defaultValue={bai?.noi_dung ?? ""} rows={14} className={O_NHIEU_DONG} />
            <p className="mt-1 text-[12px] text-muc-3">Dòng trống để ngắt đoạn. Gõ &quot;## &quot; đầu dòng để làm tiêu đề nhỏ, &quot;- &quot; đầu dòng để làm danh sách.</p>
          </div>
          <Gat nhan="Kích hoạt (hiện trên website)" giaTriMacDinh={hoatDong} onDoi={setHoatDong} />
          {loi && <p role="alert" className="text-[13px] text-loi">{loi}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={NUT_PHU} onClick={() => setMo(false)}>Huỷ</button>
            <button type="submit" className={NUT_CHINH} disabled={dang}>{dang ? "Đang lưu" : "Lưu bài"}</button>
          </div>
        </form>
      </Hop>
    </>
  );
}

/** Nút nhanh trên dòng: bật/tắt hiển thị và xoá (có hỏi lại). */
export function BlogNutNhanh({ id, hoatDong, doi, xoa }: { id: string; hoatDong: boolean; doi: (fd: FormData) => Promise<KQ>; xoa: (fd: FormData) => Promise<KQ> }) {
  const router = useRouter();
  const [dang, bat] = useTransition();
  const [loi, setLoi] = useState("");
  const chay = (f: (fd: FormData) => Promise<KQ>, them: Record<string, string>) => {
    const fd = new FormData(); fd.set("id", id); for (const [k, v] of Object.entries(them)) fd.set(k, v);
    setLoi("");
    bat(async () => { const kq = await f(fd); if (kq.loi) setLoi(kq.loi); else router.refresh(); });
  };
  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" className={NUT_CHU} disabled={dang} onClick={() => chay(doi, { hoat_dong: hoatDong ? "0" : "1" })}>{hoatDong ? "Tắt" : "Kích hoạt"}</button>
      <button type="button" className={NUT_CHU_NGUY} disabled={dang} onClick={() => { if (window.confirm("Xoá bài viết này? Không khôi phục được.")) chay(xoa, {}); }}>Xoá</button>
      {loi && <span role="alert" className="text-[12px] text-loi">{loi}</span>}
    </span>
  );
}
