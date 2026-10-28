import "server-only";
import ExcelJS from "exceljs";
import { sb } from "@/lib/db";
import { homNayHCM, ngayGioVN } from "@/lib/dinh-dang";
import { coQuyen, laVaiTro, quyenHieuLuc, NHAN_VAI_TRO, type CoQuyen } from "@/lib/quyen";
import { locMenu } from "@/lib/nav";
import { MODULE } from "@/lib/module";
import { createAdminClient } from "@/lib/supabase/admin";

export const KHO_CHAT = "chat-agent";
export type NguoiHoi = CoQuyen & { nhanVienId: string; hoTen: string; chiNhanhId: string | null };

/** Người hỏi do SERVER dựng từ mã thông hành của tin chat (không bao giờ do mô hình hay trình duyệt khai). Thiếu/hết hạn/tin đã xong → null. */
export async function nguoiTuThongHanh(mang: string): Promise<{ nd: NguoiHoi; tinId: string; cuocId: string } | null> {
  if (!/^[0-9a-f]{48}$/.test(mang)) return null;
  const db = sb();
  const { data: tin } = await db.from("chat_tin").select("id, cuoc_id, nhan_vien_id, trang_thai, han_thong_hanh").eq("thong_hanh", mang).maybeSingle();
  if (!tin || !["cho", "dang_xu_ly"].includes(tin.trang_thai) || !tin.han_thong_hanh || new Date(tin.han_thong_hanh).getTime() < Date.now()) return null;
  const { data: nv } = await db.from("nhan_vien").select("id, ho_ten, vai_tro, chi_nhanh_id, quyen_rieng, hoat_dong").eq("id", tin.nhan_vien_id).maybeSingle();
  if (!nv || !nv.hoat_dong || !laVaiTro(nv.vai_tro)) return null;
  return { nd: { nhanVienId: nv.id, hoTen: nv.ho_ten, chiNhanhId: nv.chi_nhanh_id, vaiTro: nv.vai_tro, quyen: quyenHieuLuc(nv.vai_tro, nv.quyen_rieng) }, tinId: tin.id, cuocId: tin.cuoc_id };
}

const TU_CHOI = (viec: string) => JSON.stringify({ tu_choi: true, ly_do: `Người đang hỏi không có quyền ${viec}. Hãy từ chối lịch sự, không đoán và không gợi ý cách lách.` });
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const cat = (o: unknown, gioiHan = 12000) => { const s = JSON.stringify(o); return s.length > gioiHan ? s.slice(0, gioiHan) + "…(đã cắt bớt, hãy hỏi hẹp hơn)" : s; };
const sach = (q: string) => q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

export const CONG_CU: Record<string, string> = {
  huong_dan: "Danh sách mục menu và chức năng người đang hỏi dùng được trong ứng dụng (để hướng dẫn họ làm gì ở đâu). Không tham số.",
  tim_khach: 'Tìm khách theo tên, số điện thoại hoặc mã. Tham số: {"q": "chuỗi"}. Cần quyền xem khách.',
  lich_hen: 'Lịch hẹn của một ngày. Tham số: {"ngay": "yyyy-mm-dd"} (bỏ trống là hôm nay). Cần quyền xem lịch.',
  doanh_thu: 'Doanh thu, thực thu theo ngày. Tham số: {"tu": "yyyy-mm-dd", "den": "yyyy-mm-dd"} (tối đa 366 ngày). Cần quyền xem số tiền.',
  cong_no: "Các hoá đơn khách còn nợ nhiều nhất. Không tham số. Cần quyền xem số tiền.",
  khieu_nai: "Số vụ khiếu nại đang xử lý và danh sách mới nhất (không gồm nội dung y khoa). Cần quyền khiếu nại.",
  xuat_file: 'Tạo tệp Excel để người hỏi tải về. Tham số: {"ten": "tên-tệp", "cot": ["Cột A","Cột B"], "dong": [["a",1],["b",2]]}. Chỉ đưa vào dữ liệu đã lấy được từ các công cụ khác. Tối đa 3000 dòng, 20 cột.',
};

export async function chayCongCu(ctx: { nd: NguoiHoi; tinId: string; cuocId: string }, ten: string, tham: Record<string, unknown>): Promise<string> {
  const { nd } = ctx, db = sb(), cn = nd.chiNhanhId;
  switch (ten) {
    case "huong_dan": {
      const menu = locMenu(nd).map((m) => ({ ten: m.ten, duong_dan: m.duong_dan, mo_ta: m.moTa }));
      const the = MODULE.filter((m) => !m.quyen || m.quyen.some((q) => coQuyen(nd, q))).flatMap((m) => m.nhom.flatMap((g) => g.the.filter((t) => t.duongDan && t.trangThai === "san_sang" && (!t.quyen || t.quyen.some((q) => coQuyen(nd, q)))).map((t) => ({ ten: t.ten, mo_ta: t.moTa, duong_dan: t.duongDan }))));
      return cat({ vai_tro: NHAN_VAI_TRO[nd.vaiTro], menu, chuc_nang: the });
    }
    case "tim_khach": {
      if (!coQuyen(nd, "khach.xem")) return TU_CHOI("xem khách hàng");
      const q = sach(String(tham.q ?? ""));
      if (q.length < 2) return JSON.stringify({ loi: "Cần ít nhất 2 ký tự để tìm." });
      let t = db.from("khach_hang").select("ma, ho_ten, dien_thoai, chi_nhanh_id").or(`ho_ten.ilike.%${q}%,dien_thoai.ilike.%${q}%,ma.ilike.%${q}%`).limit(15);
      if (cn) t = t.eq("chi_nhanh_id", cn);
      const { data } = await t;
      return cat({ so_luong: data?.length ?? 0, khach: (data ?? []).map((k) => ({ ma: k.ma, ho_ten: k.ho_ten, dien_thoai: k.dien_thoai })) });
    }
    case "lich_hen": {
      if (!coQuyen(nd, "lich.xem")) return TU_CHOI("xem lịch hẹn");
      const ngay = NGAY.test(String(tham.ngay ?? "")) ? String(tham.ngay) : homNayHCM();
      const tu = new Date(`${ngay}T00:00:00+07:00`), den = new Date(tu.getTime() + 86_400_000);
      let t = db.from("lich_hen").select("khach_id, bat_dau, trang_thai").gte("bat_dau", tu.toISOString()).lt("bat_dau", den.toISOString()).order("bat_dau").limit(60);
      if (cn) t = t.eq("chi_nhanh_id", cn);
      const { data } = await t;
      const ids = [...new Set((data ?? []).map((l) => l.khach_id))];
      const { data: kh } = ids.length ? await db.from("khach_hang").select("id, ho_ten").in("id", ids) : { data: [] as { id: string; ho_ten: string }[] };
      const ten2 = new Map((kh ?? []).map((k) => [k.id, k.ho_ten]));
      return cat({ ngay, so_luong: data?.length ?? 0, lich: (data ?? []).map((l) => ({ gio: ngayGioVN(l.bat_dau), khach: ten2.get(l.khach_id) ?? "", trang_thai: l.trang_thai })) });
    }
    case "doanh_thu": {
      if (!coQuyen(nd, "baocao.tien")) return TU_CHOI("xem số tiền doanh thu");
      const den = NGAY.test(String(tham.den ?? "")) ? String(tham.den) : homNayHCM();
      const tu = NGAY.test(String(tham.tu ?? "")) ? String(tham.tu) : den.slice(0, 8) + "01";
      if (new Date(den).getTime() - new Date(tu).getTime() > 366 * 86_400_000) return JSON.stringify({ loi: "Khoảng thời gian tối đa 366 ngày." });
      const { data } = await db.rpc("bc_doanh_thu_ngay", { p_tu: tu, p_den: den, p_cn: (cn ?? undefined) as string });
      const dong = (data ?? []).map((r) => ({ ngay: r.ngay, doanh_thu: Number(r.doanh_thu), thuc_thu: Number(r.thuc_thu), no_moi: Number(r.no_moi), so_don: Number(r.so_don) }));
      const tong = (k: "doanh_thu" | "thuc_thu" | "no_moi" | "so_don") => dong.reduce((s, r) => s + r[k], 0);
      return cat({ tu, den, tong: { doanh_thu: tong("doanh_thu"), thuc_thu: tong("thuc_thu"), no_moi: tong("no_moi"), so_don: tong("so_don") }, theo_ngay: dong.filter((r) => r.doanh_thu || r.thuc_thu || r.no_moi) });
    }
    case "cong_no": {
      if (!coQuyen(nd, "baocao.tien")) return TU_CHOI("xem công nợ khách");
      let t = db.from("hoa_don").select("ma, khach_id, con_no, ngay_hd").eq("trang_thai", "hoan_thanh").gt("con_no", 0).order("con_no", { ascending: false }).limit(20);
      if (cn) t = t.eq("chi_nhanh_id", cn);
      const { data } = await t;
      const ids = [...new Set((data ?? []).map((h) => h.khach_id).filter(Boolean))] as string[];
      const { data: kh } = ids.length ? await db.from("khach_hang").select("id, ho_ten").in("id", ids) : { data: [] as { id: string; ho_ten: string }[] };
      const ten2 = new Map((kh ?? []).map((k) => [k.id, k.ho_ten]));
      return cat({ hoa_don: (data ?? []).map((h) => ({ ma: h.ma, khach: ten2.get(h.khach_id ?? "") ?? "", con_no: Number(h.con_no), ngay: h.ngay_hd })) });
    }
    case "khieu_nai": {
      if (!(coQuyen(nd, "kn.ghi") || coQuyen(nd, "kn.duyet"))) return TU_CHOI("xem khiếu nại");
      let t = db.from("khieu_nai").select("ma, loai, trang_thai, khach_id, tiep_nhan_luc").in("trang_thai", ["moi", "cho_duyet", "da_duyet"]).order("tiep_nhan_luc", { ascending: false }).limit(20);
      if (cn) t = t.eq("chi_nhanh_id", cn);
      const { data } = await t;
      const ids = [...new Set((data ?? []).map((k) => k.khach_id))];
      const { data: kh } = ids.length ? await db.from("khach_hang").select("id, ho_ten").in("id", ids) : { data: [] as { id: string; ho_ten: string }[] };
      const ten2 = new Map((kh ?? []).map((k) => [k.id, k.ho_ten]));
      return cat({ dang_xu_ly: data?.length ?? 0, ds: (data ?? []).map((k) => ({ ma: k.ma, loai: k.loai, trang_thai: k.trang_thai, khach: ten2.get(k.khach_id) ?? "", luc: ngayGioVN(k.tiep_nhan_luc) })) });
    }
    case "xuat_file": {
      const cot = Array.isArray(tham.cot) ? (tham.cot as unknown[]).slice(0, 20).map((c) => String(c).slice(0, 80)) : [];
      const dong = Array.isArray(tham.dong) ? (tham.dong as unknown[]).slice(0, 3000) : [];
      if (!cot.length || !dong.length) return JSON.stringify({ loi: "Cần có cột và ít nhất một dòng dữ liệu." });
      const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet("Dữ liệu");
      ws.addRow(cot).font = { bold: true };
      // Ô bắt đầu bằng = + - @ bị Excel hiểu là công thức: đệm dấu nháy để không chạy công thức lạ.
      const an = (v: unknown) => (typeof v === "number" ? v : v == null ? "" : /^[=+\-@]/.test(String(v)) ? `'${String(v)}` : String(v).slice(0, 2000));
      for (const d of dong) ws.addRow((Array.isArray(d) ? d : [d]).slice(0, cot.length).map(an));
      ws.columns.forEach((c) => { c.width = 22; });
      const ten = (String(tham.ten ?? "du-lieu").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 40) || "du-lieu") + ".xlsx";
      const duongDan = `${ctx.cuocId}/${ctx.tinId}.xlsx`;
      const buf = Buffer.from(await wb.xlsx.writeBuffer());
      const { error } = await createAdminClient().storage.from(KHO_CHAT).upload(duongDan, buf, { upsert: true, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      if (error) return JSON.stringify({ loi: "Chưa tạo được tệp, thử lại sau." });
      await db.from("chat_tin").update({ tep_duong_dan: duongDan, tep_ten: ten }).eq("id", ctx.tinId);
      return JSON.stringify({ ok: true, ghi_chu: `Đã tạo tệp ${ten} (${dong.length} dòng) và đính kèm vào câu trả lời; hãy nhắn người hỏi bấm vào tệp để tải.` });
    }
    default:
      return JSON.stringify({ loi: "Công cụ này không tồn tại." });
  }
}
