import "server-only";
import { sb } from "@/lib/db";
import { congNgay, tienVN } from "@/lib/dinh-dang";
import { coQuyen, type CoQuyen } from "@/lib/quyen";
import { caCuaNhieuNguoi, caCuaNgayChiTiet } from "@/lib/ca-lam";
import { phutTrongNgayVN, phutTuGio } from "@/lib/nhan-su";
import type { CanhBao } from "@/lib/canh-bao";

type Nd = CoQuyen & { chiNhanhId: string | null; nhanVienId?: string };
const hhmm = (g: string) => g.slice(0, 5);
const thangLech = (hom: string, n: number) => { const [y, m] = hom.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return { nam: d.getUTCFullYear(), thang: d.getUTCMonth() + 1 }; };
const dauThangCua = (t: { nam: number; thang: number }) => `${t.nam}-${String(t.thang).padStart(2, "0")}-01`;
const cuoiThangCua = (t: { nam: number; thang: number }) => `${t.nam}-${String(t.thang).padStart(2, "0")}-${String(new Date(Date.UTC(t.nam, t.thang, 0)).getUTCDate()).padStart(2, "0")}`;

/** Nhắc chấm công và công lương hiện trên chuông (theo giờ hiện tại, tính lại mỗi lần chuông hỏi). Bám các nhắc MSC đang chạy trên Lark:
 *  báo cáo chấm công 09:00 cho Ban giám đốc, nhắc đăng ký lịch nghỉ tuần ngày 25, gửi phiếu lương cho từng người, hạn trả lương trước ngày 10.
 *  Người đi làm: nhắc chấm công vào/ra của chính mình, nhắc ngày hôm qua thiếu chấm công (quy chế: báo trong 30 phút, tối đa 3 lần/tháng), phiếu lương mới. */
export async function layNhacCong(nd: Nd, homNay: string): Promise<CanhBao[]> {
  const phutNay = phutTrongNgayVN(new Date().toISOString());
  const [canhan, quanly] = await Promise.all([nd.nhanVienId ? nhacCaNhan(nd.nhanVienId, homNay, phutNay) : [], nhacQuanLy(nd, homNay, phutNay)]);
  return [...canhan, ...quanly];
}

async function nhacCaNhan(nv: string, hom: string, phutNay: number): Promise<CanhBao[]> {
  const db = sb(), ra: CanhBao[] = [], qua = congNgay(hom, -1), dauThang = `${hom.slice(0, 7)}-01`;
  const [homNayCa, quaCa, { data: cc }, { data: ccQua }, { data: phieuQua }, { count: daQuen }, { data: dongLuong }] = await Promise.all([
    caCuaNgayChiTiet(nv, hom), caCuaNgayChiTiet(nv, qua),
    db.from("cham_cong").select("vao, ra").eq("nhan_vien_id", nv).eq("ngay", hom).maybeSingle(),
    db.from("cham_cong").select("vao, ra").eq("nhan_vien_id", nv).eq("ngay", qua).maybeSingle(),
    db.from("phieu_hr").select("id").eq("nhan_vien_id", nv).eq("loai", "dieu_chinh_cc").in("trang_thai", ["cho_duyet", "da_duyet"]).lte("tu_ngay", qua).gte("den_ngay", qua),
    db.from("phieu_hr").select("id", { count: "exact", head: true }).eq("nhan_vien_id", nv).eq("loai", "dieu_chinh_cc").eq("loi_cham_cong", "quen_cham_cong").in("trang_thai", ["cho_duyet", "da_duyet"]).gte("tu_ngay", dauThang).lte("tu_ngay", hom),
    db.from("bang_luong_dong").select("ky_id, thuc_tra").eq("nhan_vien_id", nv),
  ]);
  const ca = homNayCa.ca;
  if (ca) {
    const vao = phutTuGio(ca.gio_vao), kt = phutTuGio(ca.gio_ra), hv = hhmm(ca.gio_vao), hr = hhmm(ca.gio_ra);
    if (!cc?.vao && phutNay >= vao - 10 && phutNay < kt) {
      ra.push({ ma: "ccvao", href: "/nhan-su/cham-cong", nhan: phutNay < vao ? `Sắp đến giờ vào ca ${hv}, nhớ chấm công vào.` : phutNay <= vao + ca.dung_sai_phut ? `Đã đến giờ vào ca ${hv}, hãy chấm công vào.` : `Bạn chưa chấm công vào ca ${hv}. Chấm ngay, hệ thống sẽ ghi nhận trễ.` });
    } else if (!cc?.vao && phutNay >= kt) {
      ra.push({ ma: "ccvao", href: "/nhan-su/ngay-nghi", nhan: `Hôm nay bạn chưa chấm công. Nếu quên, tạo phiếu Điều chỉnh công (báo trong 30 phút, tối đa 3 lần/tháng, tháng này đã dùng ${daQuen ?? 0}/3).` });
    }
    if (cc?.vao && !cc.ra && phutNay >= kt) ra.push({ ma: "ccra", href: "/nhan-su/cham-cong", nhan: `Đã hết ca (${hr}), nhớ chấm công ra.` });
  }
  if (quaCa.ca && !phieuQua?.length && (!ccQua?.vao || !ccQua?.ra)) {
    const thieu = !ccQua ? "chưa chấm công" : !ccQua.vao ? "thiếu chấm công vào" : "thiếu chấm công ra";
    ra.push({ ma: "ccquen", href: "/nhan-su/ngay-nghi", nhan: `Hôm qua (${qua.slice(8)}/${qua.slice(5, 7)}) bạn ${thieu}. Tạo phiếu Điều chỉnh công (quy chế: báo trong 30 phút, tối đa 3 lần/tháng, tháng này đã dùng ${daQuen ?? 0}/3; từ lần thứ 3 có thể không được tính công).` });
  }
  if (dongLuong?.length) {
    const { data: ky } = await db.from("ky_luong").select("id, nam, thang, duyet_luc").in("id", dongLuong.map((d) => d.ky_id)).in("trang_thai", ["da_duyet", "da_chi"]).gte("duyet_luc", new Date(Date.now() - 20 * 86_400_000).toISOString()).order("nam", { ascending: false }).order("thang", { ascending: false }).limit(1);
    const k = ky?.[0], d = k && dongLuong.find((x) => x.ky_id === k.id);
    if (k && d) ra.push({ ma: "luong", href: "/nhan-su/luong/phieu", nhan: `Phiếu lương tháng ${String(k.thang).padStart(2, "0")}/${k.nam} đã có, thực nhận ${tienVN(d.thuc_tra)}. Có thắc mắc báo nhân sự trong 1 ngày làm việc.` });
  }
  return ra;
}

async function nhacQuanLy(nd: Nd, hom: string, phutNay: number): Promise<CanhBao[]> {
  const db = sb(), ra: CanhBao[] = [], ngayTrongThang = Number(hom.slice(8)), tt = thangLech(hom, -1), ts = thangLech(hom, 1);
  const xemCong = coQuyen(nd, "cong.xem"), suaCong = coQuyen(nd, "cong.sua");
  const xemLuong = coQuyen(nd, "luong.xem") || coQuyen(nd, "luong.sua") || coQuyen(nd, "luong.duyet");
  // Tổng hợp hiệu suất tuần/tháng/năm gần nhất cho người xem được số liệu tiền (doanh số).
  if (coQuyen(nd, "baocao.tien")) {
    const { data: th } = await db.from("tong_hop_hieu_suat").select("loai, tieu_de, noi_dung, tao_luc").gte("tao_luc", new Date(Date.now() - 370 * 86_400_000).toISOString()).order("tao_luc", { ascending: false }).limit(12);
    const HAN = { tuan: 8, thang: 35, nam: 370 } as const, co = new Set<string>();
    for (const t of th ?? []) {
      const loai = t.loai as keyof typeof HAN;
      if (co.has(loai) || !(loai in HAN) || Date.now() - Date.parse(t.tao_luc) > HAN[loai] * 86_400_000) continue;
      co.add(loai);
      ra.push({ ma: `tomtat_${loai}`, href: "/bao-cao", nhan: `${t.tieu_de}. ${t.noi_dung}` });
    }
  }
  // Tuyển dụng cho người quản lý nhân sự: yêu cầu chờ tiếp nhận, ứng viên mới nộp chưa xử lý, tin sắp/đã quá hạn nộp mà chưa đóng.
  if (suaCong) {
    const ba = congNgay(hom, 3);
    const [{ count: yc }, { count: uvMoi }, { data: tins }] = await Promise.all([
      db.from("yeu_cau_tuyen_dung").select("id", { count: "exact", head: true }).eq("trang_thai", "Chờ tiếp nhận"),
      db.from("ung_vien").select("id", { count: "exact", head: true }).eq("trang_thai", "Mới nộp"),
      db.from("tin_tuyen_dung").select("han_nop").neq("trang_thai", "Đã đóng").not("han_nop", "is", null).lte("han_nop", ba),
    ]);
    if ((yc ?? 0) > 0) ra.push({ ma: "tdyc", href: "/nhan-su/tuyen-dung?tab=yeu-cau", nhan: `${yc} yêu cầu tuyển dụng đang chờ tiếp nhận.` });
    if ((uvMoi ?? 0) > 0) ra.push({ ma: "tduv", href: "/nhan-su/tuyen-dung", nhan: `${uvMoi} ứng viên mới nộp chưa được xử lý.` });
    if ((tins?.length ?? 0) > 0) ra.push({ ma: "tdtin", href: "/nhan-su/tuyen-dung?tab=tin", nhan: `${tins!.length} tin tuyển dụng sắp hoặc đã quá hạn nộp mà chưa đóng.` });
  }
  if (!xemCong && !suaCong && !xemLuong) return ra;
  const [caMap, { data: ccHom }, { data: khoa }, { count: ccThangTruoc }, { count: lichThangSau }, { data: ky }] = await Promise.all([
    xemCong && phutNay >= 9 * 60 - 60 ? caCuaNhieuNguoi(hom) : null,
    xemCong ? db.from("cham_cong").select("nhan_vien_id, vao, tre_phut").eq("ngay", hom) : { data: null },
    suaCong ? db.from("bang_cong_thang").select("khoa").eq("nam", tt.nam).eq("thang", tt.thang).maybeSingle() : { data: null },
    suaCong ? db.from("cham_cong").select("id", { count: "exact", head: true }).gte("ngay", dauThangCua(tt)).lte("ngay", cuoiThangCua(tt)) : { count: 0 },
    suaCong && ngayTrongThang >= 25 ? db.from("phan_ca").select("id", { count: "exact", head: true }).gte("ngay", dauThangCua(ts)).lte("ngay", cuoiThangCua(ts)) : { count: 1 },
    xemLuong ? db.from("ky_luong").select("nam, thang, trang_thai").order("nam", { ascending: false }).order("thang", { ascending: false }).limit(24) : { data: null },
  ]);
  if (caMap) {
    // Giống báo cáo chấm công 09:00 cho BOD trên Lark: người có ca hôm nay mà quá 60 phút sau giờ vào vẫn chưa chấm công.
    const daVao = new Map((ccHom ?? []).filter((c) => c.vao).map((c) => [c.nhan_vien_id, c]));
    const trongPhamVi = [...caMap.entries()].filter(([, v]) => v.ca && (!nd.chiNhanhId || v.chiNhanhId === nd.chiNhanhId));
    const chua = trongPhamVi.filter(([id, v]) => !daVao.has(id) && phutNay >= phutTuGio(v.ca!.gio_vao) + 60).length;
    if (chua > 0) ra.push({ ma: "ccnguoi", href: "/nhan-su/cham-cong?tab=bang-cong", nhan: `${chua} người có ca hôm nay mà chưa chấm công vào.` });
  }
  if (suaCong && !khoa?.khoa && (ccThangTruoc ?? 0) > 0) ra.push({ ma: "cckhoa", href: `/nhan-su/cham-cong?tab=tong-hop&thang=${tt.nam}-${String(tt.thang).padStart(2, "0")}`, nhan: `Công tháng ${String(tt.thang).padStart(2, "0")}/${tt.nam} chưa khoá. Chốt công trước khi tính lương (lương trả muộn nhất ngày 10).` });
  if (suaCong && ngayTrongThang >= 25 && (lichThangSau ?? 0) === 0) ra.push({ ma: "ccnghi", href: "/nhan-su/ca-kip", nhan: `Đã đến ngày 25: xếp lịch làm và ngày nghỉ hằng tuần của nhân viên cho tháng ${String(ts.thang).padStart(2, "0")}/${ts.nam} (bảng Ca kíp đang chưa có ngày nào).` });
  if (xemLuong && ky) {
    const cho = ky.filter((k) => k.trang_thai === "cho_duyet").length;
    if (cho > 0 && coQuyen(nd, "luong.duyet")) ra.push({ ma: "klduyet", href: "/nhan-su/luong", nhan: `${cho} kỳ lương đang chờ duyệt.` });
    // Hạn trả lương muộn nhất ngày 10 hằng tháng (quy định trả lương MSC): chưa lập / chưa gửi duyệt nhắc từ ngày 3 đến 12, đã duyệt mà chưa chi nhắc từ ngày 8 cho tới khi chi.
    const kt = ky.find((k) => k.nam === tt.nam && k.thang === tt.thang), nhanKy = `${String(tt.thang).padStart(2, "0")}/${tt.nam}`;
    if (coQuyen(nd, "luong.sua") && ngayTrongThang >= 3 && ngayTrongThang <= 12 && (!kt || kt.trang_thai === "nhap")) ra.push({ ma: "klhan", href: "/nhan-su/luong", nhan: `Kỳ lương tháng ${nhanKy} ${kt ? "chưa gửi duyệt" : "chưa được lập"}, hạn trả lương muộn nhất ngày 10.` });
    else if (kt?.trang_thai === "da_duyet" && ngayTrongThang >= 8) ra.push({ ma: "klhan", href: "/nhan-su/luong", nhan: `Lương tháng ${nhanKy} đã duyệt nhưng chưa chi, hạn trả muộn nhất ngày 10.` });
  }
  return ra;
}
