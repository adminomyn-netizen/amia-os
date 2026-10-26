import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layCanhBao } from "@/lib/canh-bao";
import { sb } from "@/lib/db";

type Trang = "chua_doc" | "da_doc";
const KHONG_LUU = { "Cache-Control": "no-store" };

/** Việc đang chờ của người đang đăng nhập, kèm trạng thái đã đọc; việc đã xoá thì ẩn. Đổi nội dung (vd số lượng) thì hiện lại như chưa đọc. */
async function layDs(nd: NonNullable<Awaited<ReturnType<typeof layNguoiDungHienTai>>>) {
  const ds = nd.phaiDoiMatKhau ? [] : await layCanhBao(nd);
  if (!ds.length) return { ds: [] as (typeof ds[number] & { trang: Trang })[], goc: ds };
  const { data } = await sb().from("thong_bao_trang_thai").select("ma, dau_van, trang_thai").eq("nhan_vien_id", nd.nhanVienId);
  const luu = new Map((data ?? []).map((r) => [r.ma, r]));
  const hien = ds.flatMap((m) => {
    const l = luu.get(m.ma);
    if (l && l.dau_van === m.nhan && l.trang_thai === "da_xoa") return [];
    return [{ ...m, trang: (l && l.dau_van === m.nhan && l.trang_thai === "da_doc" ? "da_doc" : "chua_doc") as Trang }];
  });
  return { ds: hien, goc: ds };
}

/** Chuông thông báo: danh sách việc đang chờ (không lưu đệm). */
export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  return NextResponse.json({ ds: (await layDs(nd)).ds }, { headers: KHONG_LUU });
}

/** Đánh dấu đã đọc / xoá một việc, hoặc đọc hết. Nội dung (dau_van) lấy lại từ máy chủ, không tin số liệu từ trình duyệt. */
export async function POST(req: Request) {
  const nd = await layNguoiDungHienTai();
  if (!nd) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  // Chỉ nhận JSON: trình duyệt không gửi được kiểu này từ trang khác nếu không được phép (chống gửi chéo trang).
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ loi: "Sai định dạng" }, { status: 415 });
  const b = (await req.json().catch(() => null)) as { hanhDong?: string; ma?: string } | null;
  if (!b || !["doc", "xoa", "doc_het", "xoa_het"].includes(b.hanhDong ?? "")) return NextResponse.json({ loi: "Yêu cầu không hợp lệ" }, { status: 400 });
  const { ds, goc } = await layDs(nd);
  const dich = b.hanhDong === "doc_het" || b.hanhDong === "xoa_het" ? ds : goc.filter((m) => m.ma === b.ma);
  if (!dich.length) return NextResponse.json({ ok: true, ds }, { headers: KHONG_LUU });
  const trangThai = b.hanhDong === "xoa" || b.hanhDong === "xoa_het" ? "da_xoa" : "da_doc";
  const { error } = await sb().from("thong_bao_trang_thai").upsert(dich.map((m) => ({ nhan_vien_id: nd.nhanVienId, ma: m.ma, dau_van: m.nhan, trang_thai: trangThai, cap_nhat_luc: new Date().toISOString() })), { onConflict: "nhan_vien_id,ma" });
  if (error) return NextResponse.json({ loi: "Không lưu được" }, { status: 500 });
  return NextResponse.json({ ok: true, ds: (await layDs(nd)).ds }, { headers: KHONG_LUU });
}
