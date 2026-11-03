import { NextResponse } from "next/server";
import { layNguoiDungHienTai } from "@/lib/auth";
import { layCanhBao } from "@/lib/canh-bao";
import { sb } from "@/lib/db";
import { nhomCuaThongBao } from "@/lib/nhom-thong-bao";

type Trang = "chua_doc" | "da_doc";
const KHONG_LUU = { "Cache-Control": "no-store" };

/** Việc đang chờ của người đang đăng nhập, kèm trạng thái đã đọc; việc đã xoá thì ẩn. Đổi nội dung (vd số lượng) thì hiện lại như chưa đọc. */
async function layDs(nd: NonNullable<Awaited<ReturnType<typeof layNguoiDungHienTai>>>) {
  const ds = nd.phaiDoiMatKhau ? [] : await layCanhBao(nd);
  if (!ds.length) return { ds: [] as (typeof ds[number] & { trang: Trang; nhom: ReturnType<typeof nhomCuaThongBao> })[], goc: ds };
  const { data } = await sb().from("thong_bao_trang_thai").select("ma, dau_van, trang_thai").eq("nhan_vien_id", nd.nhanVienId);
  const luu = new Map((data ?? []).map((r) => [r.ma, r]));
  const hien = ds.flatMap((m) => {
    const l = luu.get(m.ma);
    if (l && l.dau_van === m.nhan && l.trang_thai === "da_xoa") return [];
    return [{ ...m, nhom: nhomCuaThongBao(m.ma), trang: (l && l.dau_van === m.nhan && l.trang_thai === "da_doc" ? "da_doc" : "chua_doc") as Trang }];
  });
  return { ds: hien, goc: ds };
}

/** Cài đặt "Tắt tiếng" của chính người này (tắt âm/rung chuông và thông báo đẩy trên thiết bị của họ). */
async function layTatTieng(nhanVienId: string) {
  const { data } = await sb().from("nhan_vien").select("tat_tieng_thong_bao").eq("id", nhanVienId).maybeSingle();
  return !!data?.tat_tieng_thong_bao;
}

/** Chuông thông báo: danh sách việc đang chờ (không lưu đệm) + cài đặt tắt tiếng. */
export async function GET() {
  const nd = await layNguoiDungHienTai();
  if (!nd) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  const [{ ds }, tatTieng] = await Promise.all([layDs(nd), layTatTieng(nd.nhanVienId)]);
  return NextResponse.json({ ds, tatTieng }, { headers: KHONG_LUU });
}

/** Đánh dấu đã đọc / xoá một việc, hoặc đọc hết. Nội dung (dau_van) lấy lại từ máy chủ, không tin số liệu từ trình duyệt. */
export async function POST(req: Request) {
  const nd = await layNguoiDungHienTai();
  if (!nd) return NextResponse.json({ loi: "Chưa đăng nhập" }, { status: 401 });
  // Chỉ nhận JSON: trình duyệt không gửi được kiểu này từ trang khác nếu không được phép (chống gửi chéo trang).
  if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ loi: "Sai định dạng" }, { status: 415 });
  const b = (await req.json().catch(() => null)) as { hanhDong?: string; ma?: string; bat?: unknown } | null;
  if (!b || !["doc", "xoa", "doc_het", "xoa_het", "tat_tieng"].includes(b.hanhDong ?? "")) return NextResponse.json({ loi: "Yêu cầu không hợp lệ" }, { status: 400 });
  // Tắt/bật tiếng: chỉ đổi cài đặt của CHÍNH người đang đăng nhập.
  if (b.hanhDong === "tat_tieng") {
    if (typeof b.bat !== "boolean") return NextResponse.json({ loi: "Yêu cầu không hợp lệ" }, { status: 400 });
    const { error } = await sb().from("nhan_vien").update({ tat_tieng_thong_bao: b.bat }).eq("id", nd.nhanVienId);
    if (error) return NextResponse.json({ loi: "Không lưu được cài đặt tắt tiếng" }, { status: 500 });
    return NextResponse.json({ ok: true, tatTieng: b.bat }, { headers: KHONG_LUU });
  }
  const { ds, goc } = await layDs(nd);
  const dich = b.hanhDong === "doc_het" || b.hanhDong === "xoa_het" ? ds : goc.filter((m) => m.ma === b.ma);
  if (!dich.length) return NextResponse.json({ ok: true, ds }, { headers: KHONG_LUU });
  const trangThai = b.hanhDong === "xoa" || b.hanhDong === "xoa_het" ? "da_xoa" : "da_doc";
  const { error } = await sb().from("thong_bao_trang_thai").upsert(dich.map((m) => ({ nhan_vien_id: nd.nhanVienId, ma: m.ma, dau_van: m.nhan, trang_thai: trangThai, cap_nhat_luc: new Date().toISOString() })), { onConflict: "nhan_vien_id,ma" });
  if (error) return NextResponse.json({ loi: "Không lưu được" }, { status: 500 });
  return NextResponse.json({ ok: true, ds: (await layDs(nd)).ds }, { headers: KHONG_LUU });
}
