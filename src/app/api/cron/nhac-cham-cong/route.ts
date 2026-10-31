import { NextResponse } from "next/server";
import { sb } from "@/lib/db";
import { caCuaNhieuNguoi } from "@/lib/ca-lam";
import { guiChoNhanVien, nguoiCoQuyen } from "@/lib/push";
import { homNayHCM } from "@/lib/dinh-dang";
import { phutTrongNgayVN, phutTuGio } from "@/lib/nhan-su";
import { laVaiTro, quyenHieuLuc, type Quyen } from "@/lib/quyen";
import { kyCanBaoHomNay, tinhTongHop } from "@/lib/tong-hop-hieu-suat";

export const maxDuration = 60;
/** Chấm công đã chuyển sang MSC Group OS (31/10/2026): tạm không gửi nhắc từ AMIA. Đặt false để bật lại. */
const DA_CHUYEN_MSC = true;
const hhmm = (g: string) => g.slice(0, 5);

/** Nhắc chấm công bằng thông báo đẩy, chạy mỗi 5 phút (lịch pg_cron ở Supabase gọi vào đây; Vercel Cron chỉ cần khi gói cho phép chạy theo phút).
 *  Mỗi người mỗi ngày mỗi loại nhắc đúng một lần (bảng nhac_da_gui), nên chạy lặp hay trễ vài phút cũng không gửi trùng.
 *  Người có ca hôm nay: sắp đến giờ vào (10 phút trước) · chưa vào sau giờ vào 10 phút · hết ca mà chưa ra · 20 phút sau hết ca vẫn chưa ra (quy chế: quên chấm công báo trong 30 phút).
 *  Người quản lý: 09:00 tổng hợp ai đã/chưa chấm công (như báo cáo thời gian thực cho BOD trên Lark) · ngày 25 nhắc đăng ký lịch nghỉ hằng tuần. */
export async function GET(req: Request) {
  const mang = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const db = sb();
  const bi = process.env.CRON_SECRET;
  const duoc = (bi && mang === bi) || (mang.length > 0 && (await db.rpc("kiem_token_cron", { p: mang })).data === true);
  if (!duoc) return NextResponse.json({ loi: "Không được phép" }, { status: 401 });
  if (DA_CHUYEN_MSC) return NextResponse.json({ ok: true, bo_qua: "Nhắc chấm công đã chuyển sang MSC Group OS" });

  const hom = homNayHCM(), phut = phutTrongNgayVN(new Date().toISOString());
  const gui = async (nv: string, loai: string, tieuDe: string, noiDung: string, url: string) => {
    // Chèn trước, trùng khoá thì đã gửi rồi: bỏ qua.
    const { error } = await db.from("nhac_da_gui").insert({ nhan_vien_id: nv, ngay: hom, loai });
    if (error) return 0;
    return (await guiChoNhanVien([nv], { tieuDe, noiDung, url, tag: `${loai}-${hom}` })).thanhCong;
  };
  let daGui = 0;
  const caMap = await caCuaNhieuNguoi(hom);
  const { data: ccs } = await db.from("cham_cong").select("nhan_vien_id, vao, ra").eq("ngay", hom);
  const cc = new Map((ccs ?? []).map((c) => [c.nhan_vien_id, c]));

  for (const [nv, k] of caMap) {
    const ca = k.ca;
    if (!ca) continue;
    const vao = phutTuGio(ca.gio_vao), kt = phutTuGio(ca.gio_ra), c = cc.get(nv);
    if (!c?.vao) {
      if (phut >= vao - 10 && phut < vao) daGui += await gui(nv, "vao_truoc", "Sắp đến giờ vào ca", `Ca ${hhmm(ca.gio_vao)}. Nhớ chấm công vào nhé.`, "/nhan-su/cham-cong");
      else if (phut >= vao + ca.dung_sai_phut + 10 && phut < kt) daGui += await gui(nv, "vao_tre", "Bạn chưa chấm công vào", `Ca ${hhmm(ca.gio_vao)}. Chấm ngay, hệ thống sẽ ghi nhận trễ.`, "/nhan-su/cham-cong");
    } else if (!c.ra) {
      if (phut >= kt && phut < kt + 20) daGui += await gui(nv, "ra_het_ca", "Hết ca rồi", `Ca kết thúc ${hhmm(ca.gio_ra)}. Nhớ chấm công ra.`, "/nhan-su/cham-cong");
      else if (phut >= kt + 20 && phut < kt + 60) daGui += await gui(nv, "ra_con_han", "Chưa chấm công ra", "Quên chấm công thì báo điều chỉnh công trong 30 phút (tối đa 3 lần/tháng).", "/nhan-su/ngay-nghi");
    }
  }

  // Người quản lý: tổng hợp 09:00 và nhắc ngày 25.
  if (phut >= 9 * 60 && phut < 10 * 60) {
    const { data: nvs } = await db.from("nhan_vien").select("id, vai_tro, quyen_rieng, chi_nhanh_id").eq("hoat_dong", true);
    const co = (n: NonNullable<typeof nvs>[number], q: Quyen) => laVaiTro(n.vai_tro) && quyenHieuLuc(n.vai_tro, n.quyen_rieng).includes(q);
    for (const n of nvs ?? []) {
      if (co(n, "cong.xem")) {
        const trong = [...caMap.entries()].filter(([, v]) => v.ca && (!n.chi_nhanh_id || v.chiNhanhId === n.chi_nhanh_id));
        const daVao = trong.filter(([id]) => cc.get(id)?.vao).length;
        if (trong.length > 0) daGui += await gui(n.id, "tong_hop_09", "Chấm công lúc 09:00", `Đã chấm công vào ${daVao}/${trong.length} người có ca hôm nay${trong.length - daVao ? `, còn ${trong.length - daVao} người chưa vào` : ""}.`, "/nhan-su/cham-cong?tab=bang-cong");
      }
      if (hom.slice(8) === "25" && co(n, "cong.sua")) daGui += await gui(n.id, "nghi_tuan_25", "Nhắc đăng ký lịch nghỉ hằng tuần", "Đã đến ngày 25: xếp ca và ngày nghỉ hằng tuần cho tháng sau.", "/nhan-su/ca-kip");
    }
  }
  // Tổng hợp hiệu suất tuần (Thứ Hai) / tháng (ngày 1) / năm (1/1) từ 08:00; cửa sổ rộng đến 12:00, mỗi kỳ chỉ ghi và báo một lần nên trễ giờ cũng không sao.
  if (phut >= 8 * 60 && phut < 12 * 60) {
    for (const k of kyCanBaoHomNay(hom)) {
      const tt = await tinhTongHop(k);
      const { data: moi } = await db.from("tong_hop_hieu_suat").upsert({ loai: k.loai, ky: k.ky, tieu_de: tt.tieuDe, noi_dung: tt.noiDung, chi_tiet: tt.chiTiet }, { onConflict: "loai,ky", ignoreDuplicates: true }).select("id");
      if (moi?.length) {
        // Người xem được số liệu tiền mới nhận; thông báo đẩy chung chung, số liệu nằm trong chuông.
        for (const u of await nguoiCoQuyen("baocao.tien", null)) daGui += await gui(u, `tong_hop_${k.loai}`, tt.tieuDe, "Đã có tổng hợp mới. Mở chuông thông báo để xem số liệu.", "/bao-cao");
      }
    }
  }
  await db.from("nhac_da_gui").delete().lt("ngay", new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10));
  return NextResponse.json({ ngay: hom, phut, daGui });
}
