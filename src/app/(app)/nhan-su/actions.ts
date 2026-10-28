"use server";

import { revalidatePath } from "next/cache";
import { kiemNoiBo, kiemQuyen, KHONG_DU_QUYEN } from "@/lib/auth";
import { coQuyen } from "@/lib/quyen";
import { sb, thongBaoLoi } from "@/lib/db";
import { bat, chuoi, chuoiHoacNull, mang, so, soHoacNull } from "@/lib/form";
import { homNayHCM } from "@/lib/dinh-dang";
import { caCuaNgay, type Ca } from "@/lib/ca-lam";
import { guiChoNhanVien } from "@/lib/push";
import { isoVN, ngayCongThem, phutTrongNgayVN, phutTuGio, soNgayGiua, thuCuaNgay } from "@/lib/nhan-su";

type KQ = { ok?: true; loi?: string };
const lamMoi = () => { revalidatePath("/nhan-su", "layout"); revalidatePath("/noi-lam-viec", "layout"); };
const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const GIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const dem = async (k: string, tien: string) => `${tien}${String(Number((await sb().rpc("so_tiep_theo", { p_khoa: k })).data ?? 0)).padStart(6, "0")}`;

/** Công theo quy chế MSC: đủ hai lượt = 1, thiếu một lượt = 0,5. Trễ tính từ phút đầu sau giờ vào (trừ dung sai), về sớm so với giờ ra của ca. */
function tinhChamCong(vao: string | null, ra: string | null, ca: Ca | null) {
  const tre = vao && ca ? Math.max(0, phutTrongNgayVN(vao) - phutTuGio(ca.gio_vao) - ca.dung_sai_phut) : 0;
  const veSom = ra && ca ? Math.max(0, phutTuGio(ca.gio_ra) - phutTrongNgayVN(ra)) : 0;
  return { tre_phut: tre, ve_som_phut: veSom, cong: vao && ra ? 1 : 0.5 };
}

// ─── Chấm công ──────────────────────────────────────────────────────────────
export async function chamCongVao(): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const hom = homNayHCM(), bay = new Date().toISOString(), db = sb();
  const { data: cu } = await db.from("cham_cong").select("id, vao").eq("nhan_vien_id", nd.nhanVienId).eq("ngay", hom).maybeSingle();
  if (cu?.vao) return { loi: "Hôm nay bạn đã chấm công vào rồi." };
  const ca = await caCuaNgay(nd.nhanVienId, hom);
  const t = tinhChamCong(bay, null, ca);
  const { error } = cu
    ? await db.from("cham_cong").update({ vao: bay, ca_id: ca?.id ?? null, ...t, loi: t.tre_phut > 0 ? "di_muon" : null, cap_nhat_luc: bay }).eq("id", cu.id)
    : await db.from("cham_cong").insert({ nhan_vien_id: nd.nhanVienId, ngay: hom, vao: bay, ca_id: ca?.id ?? null, ...t, loi: t.tre_phut > 0 ? "di_muon" : null, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function chamCongRa(): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const hom = homNayHCM(), bay = new Date().toISOString(), db = sb();
  const { data: cu } = await db.from("cham_cong").select("id, vao, ca_id").eq("nhan_vien_id", nd.nhanVienId).eq("ngay", hom).maybeSingle();
  const ca = await caCuaNgay(nd.nhanVienId, hom);
  const t = tinhChamCong(cu?.vao ?? null, bay, ca);
  const { error } = cu
    ? await db.from("cham_cong").update({ ra: bay, ve_som_phut: t.ve_som_phut, cong: t.cong, cap_nhat_luc: bay }).eq("id", cu.id)
    : await db.from("cham_cong").insert({ nhan_vien_id: nd.nhanVienId, ngay: hom, ra: bay, ca_id: ca?.id ?? null, ve_som_phut: t.ve_som_phut, cong: 0.5, loi: "quen_cham_cong", nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Nhập công tay (quản lý): ghi đè bản ghi của ngày đó. Tháng đã khoá thì DB chặn. */
export async function nhapCongThuCong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), ngay = chuoi(fd, "ngay"), gv = chuoi(fd, "gio_vao"), gr = chuoi(fd, "gio_ra");
  if (!nv || !NGAY.test(ngay) || ngay > homNayHCM()) return { loi: "Chọn nhân viên và ngày (không ở tương lai)." };
  if ((gv && !GIO.test(gv)) || (gr && !GIO.test(gr)) || (!gv && !gr)) return { loi: "Nhập giờ vào và/hoặc giờ ra dạng 08:00." };
  if (gv && gr && gv >= gr) return { loi: "Giờ ra phải sau giờ vào." };
  const { data: n } = await sb().from("nhan_vien").select("chi_nhanh_id").eq("id", nv).maybeSingle();
  if (!n || (nd.chiNhanhId && n.chi_nhanh_id !== nd.chiNhanhId)) return { loi: "Nhân viên không thuộc phạm vi của bạn." };
  const vao = gv ? isoVN(ngay, gv) : null, ra = gr ? isoVN(ngay, gr) : null;
  const ca = await caCuaNgay(nv, ngay);
  const t = tinhChamCong(vao, ra, ca);
  const { error } = await sb().from("cham_cong").upsert({ nhan_vien_id: nv, ngay, vao, ra, ca_id: ca?.id ?? null, ...t, phuong_thuc: "thu_cong", loi: null, ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "nhan_vien_id,ngay" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function khoaThangCong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nam = Math.round(so(fd, "nam")), thang = Math.round(so(fd, "thang")), khoa = chuoi(fd, "khoa") === "1";
  if (!(nam >= 2024 && nam <= 2100 && thang >= 1 && thang <= 12)) return { loi: "Tháng không hợp lệ." };
  const { error } = await sb().from("bang_cong_thang").upsert({ nam, thang, khoa, khoa_luc: khoa ? new Date().toISOString() : null, nguoi_khoa_id: khoa ? nd.nhanVienId : null }, { onConflict: "nam,thang" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Ca làm, lịch tuần, ngày lễ ────────────────────────────────────────────
export async function luuCa(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const id = chuoi(fd, "id"), vao = chuoi(fd, "gio_vao"), ra = chuoi(fd, "gio_ra"), ten = chuoi(fd, "ten");
  if (!ten || !GIO.test(vao) || !GIO.test(ra) || vao >= ra) return { loi: "Nhập tên ca, giờ vào và giờ ra dạng 08:00 (giờ ra sau giờ vào)." };
  const row = { ten, gio_vao: vao, gio_ra: ra, nghi_phut: Math.max(0, Math.round(so(fd, "nghi_phut"))), dung_sai_phut: Math.max(0, Math.round(so(fd, "dung_sai_phut"))), gio_chuan: soHoacNull(fd, "gio_chuan") ?? 8, hoat_dong: chuoi(fd, "hoat_dong") !== "0" };
  const { error } = id ? await sb().from("ca_lam").update(row).eq("id", id) : await sb().from("ca_lam").insert({ ...row, ma: chuoi(fd, "ma").toUpperCase().replace(/[^A-Z0-9_]/g, "") || `CA_${Date.now().toString(36).toUpperCase()}` });
  if (error) return { loi: error.code === "23505" ? "Mã ca đã tồn tại." : thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

/** Phân ca hàng loạt: nhiều người × một khoảng ngày; chọn "ngày nghỉ hằng tuần" thì ngày đó ghi là nghỉ. Ghi đè lịch cũ. */
export async function phanCa(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ds = mang(fd, "nhan_vien_id"), tu = chuoi(fd, "tu_ngay"), den = chuoi(fd, "den_ngay"), ca = chuoi(fd, "ca_id"), nghiThu = chuoi(fd, "nghi_thu");
  if (!ds.length || !NGAY.test(tu) || !NGAY.test(den) || !ca) return { loi: "Chọn nhân viên, khoảng ngày và ca." };
  if (den < tu || soNgayGiua(tu, den) > 62) return { loi: "Khoảng ngày không hợp lệ (tối đa 62 ngày)." };
  const db = sb();
  const [{ data: c }, { data: nvs }] = await Promise.all([db.from("ca_lam").select("id").eq("id", ca).eq("hoat_dong", true).maybeSingle(), db.from("nhan_vien").select("id, chi_nhanh_id").in("id", ds)]);
  if (!c) return { loi: "Ca không hợp lệ hoặc đã ngừng." };
  const hopLe = (nvs ?? []).filter((n) => !nd.chiNhanhId || n.chi_nhanh_id === nd.chiNhanhId).map((n) => n.id);
  if (!hopLe.length) return { loi: "Không có nhân viên nào thuộc phạm vi của bạn." };
  const dong: { nhan_vien_id: string; ngay: string; ca_id: string | null; nghi: boolean }[] = [];
  for (const nv of hopLe) for (let d = tu; d <= den; d = ngayCongThem(d, 1)) {
    const nghi = nghiThu !== "" && String(thuCuaNgay(d)) === nghiThu;
    dong.push({ nhan_vien_id: nv, ngay: d, ca_id: nghi ? null : c.id, nghi });
  }
  const { error } = await db.from("phan_ca").upsert(dong, { onConflict: "nhan_vien_id,ngay" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function luuNgayLe(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ngay = chuoi(fd, "ngay"), ten = chuoi(fd, "ten");
  if (!NGAY.test(ngay) || !ten) return { loi: "Nhập ngày và tên ngày lễ." };
  const { error } = await sb().from("ngay_le").upsert({ ngay, ten }, { onConflict: "ngay" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}
export async function xoaNgayLe(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("cong.sua"))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().from("ngay_le").delete().eq("ngay", chuoi(fd, "ngay"));
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Phiếu nhân sự ──────────────────────────────────────────────────────────
export async function guiPhieuHr(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const db = sb(), hom = homNayHCM();
  const loai = chuoi(fd, "loai");
  if (!["nghi", "di_tre_ve_som", "ra_ngoai", "lam_online", "lam_them", "dieu_chinh_cc", "cong_tac"].includes(loai)) return { loi: "Chọn loại phiếu." };
  let nv = nd.nhanVienId;
  const thay = chuoi(fd, "nhan_vien_id");
  if (thay && thay !== nd.nhanVienId) {
    if (!coQuyen(nd, "cong.sua")) return { loi: KHONG_DU_QUYEN };
    nv = thay;
  }
  const tu = chuoi(fd, "tu_ngay"), den = chuoi(fd, "den_ngay") || tu, lyDo = chuoi(fd, "ly_do");
  if (!NGAY.test(tu) || !NGAY.test(den) || den < tu) return { loi: "Chọn ngày bắt đầu và kết thúc hợp lệ." };
  if (!lyDo) return { loi: "Nhập lý do." };
  const nhieuNgay = loai === "nghi" || loai === "cong_tac" || loai === "lam_online";
  if (!nhieuNgay && den !== tu) return { loi: "Loại phiếu này chỉ áp dụng cho một ngày." };
  const span = soNgayGiua(tu, den);
  const soNgay = nhieuNgay ? (chuoi(fd, "so_ngay") === "" ? span : so(fd, "so_ngay")) : 1;
  if (!(soNgay > 0) || soNgay > span || Math.round(soNgay * 2) !== soNgay * 2) return { loi: `Số ngày là bội số 0,5 và không quá ${span}.` };
  const loaiNghi = loai === "nghi" ? chuoi(fd, "loai_nghi") : null;
  if (loai === "nghi" && !["phep_nam", "nghi_khong_luong", "nghi_che_do", "nghi_bu", "nghi_om", "thai_san"].includes(loaiNghi ?? "")) return { loi: "Chọn loại nghỉ." };
  const soGio = chuoi(fd, "so_gio") === "" ? null : so(fd, "so_gio");
  if ((loai === "lam_them" || loai === "di_tre_ve_som" || loai === "ra_ngoai") && !(soGio && soGio > 0 && soGio <= 12)) return { loi: "Nhập số giờ (lớn hơn 0, tối đa 12)." };
  let vaoDc: string | null = null, raDc: string | null = null, loiCc: string | null = null;
  if (loai === "dieu_chinh_cc") {
    vaoDc = chuoi(fd, "vao_dieu_chinh") || null; raDc = chuoi(fd, "ra_dieu_chinh") || null; loiCc = chuoi(fd, "loi_cham_cong") || null;
    if ((!vaoDc && !raDc) || (vaoDc && !GIO.test(vaoDc)) || (raDc && !GIO.test(raDc)) || !["di_muon", "quen_cham_cong", "ly_do_cong_viec", "ly_do_khac"].includes(loiCc ?? "")) return { loi: "Nhập giờ vào/ra cần điều chỉnh (08:00) và chọn loại lỗi." };
    if (tu > hom) return { loi: "Không điều chỉnh công cho ngày tương lai." };
  }
  const { data: n } = await db.from("nhan_vien").select("chi_nhanh_id").eq("id", nv).maybeSingle();
  if (!n || (nd.chiNhanhId && n.chi_nhanh_id !== nd.chiNhanhId && nv !== nd.nhanVienId)) return { loi: "Nhân viên không thuộc phạm vi của bạn." };

  let quaHan = false, vuot = false;
  if (loai === "nghi") {
    const { data: trung } = await db.from("phieu_hr").select("ma").eq("nhan_vien_id", nv).eq("loai", "nghi").in("trang_thai", ["cho_duyet", "da_duyet"]).lte("tu_ngay", den).gte("den_ngay", tu).limit(1);
    if (trung?.length) return { loi: `Trùng thời gian với phiếu nghỉ ${trung[0].ma}.` };
    if (loaiNghi === "phep_nam") {
      const nam = Number(tu.slice(0, 4));
      const { data: du } = await db.rpc("so_du_phep", { p_nv: nv, p_nam: nam });
      const { data: cho } = await db.from("phieu_hr").select("so_ngay").eq("nhan_vien_id", nv).eq("loai", "nghi").eq("loai_nghi", "phep_nam").eq("trang_thai", "cho_duyet").gte("tu_ngay", `${nam}-01-01`).lte("tu_ngay", `${nam}-12-31`);
      const conLai = Number(du ?? 0) - (cho ?? []).reduce((a, x) => a + Number(x.so_ngay), 0);
      if (soNgay > conLai) return { loi: `Không đủ phép năm (còn ${conLai.toLocaleString("vi-VN")} ngày, đã trừ phiếu đang chờ). Nghỉ không lương hoặc nhờ nhân sự chỉnh phép.` };
    }
    if (loaiNghi === "nghi_khong_luong") {
      const thang = tu.slice(0, 7), nam = tu.slice(0, 4);
      const { data: kl } = await db.from("phieu_hr").select("so_ngay, tu_ngay").eq("nhan_vien_id", nv).eq("loai", "nghi").eq("loai_nghi", "nghi_khong_luong").in("trang_thai", ["cho_duyet", "da_duyet"]).gte("tu_ngay", `${nam}-01-01`).lte("tu_ngay", `${nam}-12-31`);
      const tThang = (kl ?? []).filter((x) => x.tu_ngay.startsWith(thang)).reduce((a, x) => a + Number(x.so_ngay), 0), tNam = (kl ?? []).reduce((a, x) => a + Number(x.so_ngay), 0);
      if (tThang + soNgay > 7) return { loi: "Nghỉ không lương tối đa 7 ngày/tháng (quy định thời gian làm việc)." };
      if (tNam + soNgay > 15) return { loi: "Nghỉ không lương tối đa 15 ngày/năm (quy định thời gian làm việc)." };
    }
    // Báo trước: nghỉ ≤ 2 ngày báo trước ≥ 5 ngày; từ 2 đến dưới 4 ngày báo trước ≥ 7 ngày. Quá hạn vẫn cho gửi nhưng gắn cờ để người duyệt xét.
    if (["phep_nam", "nghi_khong_luong", "nghi_bu"].includes(loaiNghi ?? "")) {
      const bao = soNgayGiua(hom, tu) - 1;
      quaHan = bao < (soNgay <= 2 ? 5 : 7);
    }
  }
  if (loai === "dieu_chinh_cc" && loiCc === "quen_cham_cong") {
    const { count } = await db.from("phieu_hr").select("id", { count: "exact", head: true }).eq("nhan_vien_id", nv).eq("loai", "dieu_chinh_cc").eq("loi_cham_cong", "quen_cham_cong").in("trang_thai", ["cho_duyet", "da_duyet"]).gte("tu_ngay", `${tu.slice(0, 7)}-01`).lte("tu_ngay", `${tu.slice(0, 7)}-31`);
    vuot = (count ?? 0) >= 3;
  }
  const { error } = await db.from("phieu_hr").insert({
    ma: await dem("phieu_hr", "PH"), loai, loai_nghi: loaiNghi, nhan_vien_id: nv, tu_ngay: tu, den_ngay: den, so_ngay: soNgay, so_gio: soGio, vao_dieu_chinh: vaoDc, ra_dieu_chinh: raDc,
    loi_cham_cong: loiCc, ly_do: lyDo, nguoi_nhan_ban_giao_id: chuoiHoacNull(fd, "nguoi_nhan_ban_giao_id"), qua_han_bao_truoc: quaHan, vuot_han_muc: vuot, nguoi_gui_id: nd.nhanVienId,
  });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

async function layPhieu(id: string, chiNhanhId: string | null) {
  const { data } = await sb().from("phieu_hr").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  if (chiNhanhId) {
    const { data: n } = await sb().from("nhan_vien").select("chi_nhanh_id").eq("id", data.nhan_vien_id).maybeSingle();
    if (n?.chi_nhanh_id !== chiNhanhId) return null;
  }
  return data;
}

/** Duyệt: người gửi và người được nghỉ không tự duyệt phiếu của mình (trừ Kỹ thuật); nghỉ từ 4 ngày cần Ban Giám đốc. Phiếu điều chỉnh công ghi thẳng vào bảng chấm công khi duyệt. */
export async function duyetPhieuHr(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nghi.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieu(chuoi(fd, "id"), nd.chiNhanhId);
  if (!p || p.trang_thai !== "cho_duyet") return { loi: "Phiếu không ở trạng thái chờ duyệt." };
  if ((p.nhan_vien_id === nd.nhanVienId || p.nguoi_gui_id === nd.nhanVienId) && nd.vaiTro !== "ky_thuat") return { loi: "Không tự duyệt phiếu của mình." };
  if (p.loai === "nghi" && Number(p.so_ngay) >= 4 && !coQuyen(nd, "nghi.duyet_bgd")) return { loi: "Nghỉ từ 4 ngày phải do Ban Giám đốc duyệt." };
  const db = sb();
  const { data, error } = await db.from("phieu_hr").update({ trang_thai: "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString(), ly_do_duyet: chuoiHoacNull(fd, "ly_do") }).eq("id", p.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu vừa được xử lý bởi người khác." };
  if (p.loai === "dieu_chinh_cc") {
    const { data: cu } = await db.from("cham_cong").select("vao, ra").eq("nhan_vien_id", p.nhan_vien_id).eq("ngay", p.tu_ngay).maybeSingle();
    const vao = p.vao_dieu_chinh ? isoVN(p.tu_ngay, p.vao_dieu_chinh) : cu?.vao ?? null, ra = p.ra_dieu_chinh ? isoVN(p.tu_ngay, p.ra_dieu_chinh) : cu?.ra ?? null;
    const t = tinhChamCong(vao, ra, await caCuaNgay(p.nhan_vien_id, p.tu_ngay));
    const { error: e2 } = await db.from("cham_cong").upsert({ nhan_vien_id: p.nhan_vien_id, ngay: p.tu_ngay, vao, ra, ...t, phuong_thuc: "thu_cong", loi: p.loi_cham_cong, ghi_chu: `Điều chỉnh theo phiếu ${p.ma}`, nguoi_id: nd.nhanVienId, cap_nhat_luc: new Date().toISOString() }, { onConflict: "nhan_vien_id,ngay" });
    if (e2) {
      await db.from("phieu_hr").update({ trang_thai: "cho_duyet", nguoi_duyet_id: null, duyet_luc: null }).eq("id", p.id);
      return { loi: thongBaoLoi(e2) };
    }
  }
  lamMoi();
  return { ok: true };
}

export async function tuChoiPhieuHr(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("nghi.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieu(chuoi(fd, "id"), nd.chiNhanhId);
  if (!p || p.trang_thai !== "cho_duyet") return { loi: "Phiếu không ở trạng thái chờ duyệt." };
  const ly = chuoi(fd, "ly_do");
  if (!ly) return { loi: "Nhập lý do từ chối." };
  const { data, error } = await sb().from("phieu_hr").update({ trang_thai: "tu_choi", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString(), ly_do_duyet: ly }).eq("id", p.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Phiếu vừa được xử lý bởi người khác." };
  lamMoi();
  return { ok: true };
}

export async function huyPhieuHr(fd: FormData): Promise<KQ> {
  const nd = await kiemNoiBo();
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const p = await layPhieu(chuoi(fd, "id"), nd.chiNhanhId);
  if (!p || (p.nguoi_gui_id !== nd.nhanVienId && !coQuyen(nd, "cong.sua"))) return { loi: KHONG_DU_QUYEN };
  if (p.trang_thai !== "cho_duyet") return { loi: "Chỉ huỷ được phiếu đang chờ duyệt." };
  const { error } = await sb().from("phieu_hr").update({ trang_thai: "huy" }).eq("id", p.id).eq("trang_thai", "cho_duyet");
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function dieuChinhPhep(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("cong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), nam = Math.round(so(fd, "nam")), ngay = so(fd, "so_ngay"), ly = chuoi(fd, "ly_do");
  if (!nv || !(nam >= 2024 && nam <= 2100) || !ngay || Math.round(ngay * 2) !== ngay * 2 || Math.abs(ngay) > 30 || !ly) return { loi: "Chọn nhân viên, năm, số ngày (bội số 0,5, có thể âm) và nhập lý do." };
  const { error } = await sb().from("dieu_chinh_phep").insert({ nhan_vien_id: nv, nam, so_ngay: ngay, ly_do: ly, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

// ─── Lương ──────────────────────────────────────────────────────────────────
export async function luuDieuKienLuong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nv = chuoi(fd, "nhan_vien_id"), tu = chuoi(fd, "hieu_luc_tu"), tt = chuoi(fd, "tinh_trang");
  if (!nv || !NGAY.test(tu) || !["thu_viec", "chinh_thuc", "cong_tac_vien"].includes(tt)) return { loi: "Chọn nhân viên, ngày hiệu lực và tình trạng." };
  const tien = (k: string) => Math.max(0, Math.round(so(fd, k)));
  const ty = chuoi(fd, "ty_le_thu_viec") === "" ? 85 : so(fd, "ty_le_thu_viec");
  if (ty < 0 || ty > 100) return { loi: "Tỉ lệ lương thử việc từ 0 đến 100." };
  const { error } = await sb().from("dieu_kien_luong").upsert({
    nhan_vien_id: nv, hieu_luc_tu: tu, tinh_trang: tt, luong_co_ban: tien("luong_co_ban"), thu_nhap_chuc_danh: chuoi(fd, "thu_nhap_chuc_danh") === "" ? null : tien("thu_nhap_chuc_danh"), ty_le_thu_viec: ty,
    dong_bh: bat(fd, "dong_bh"), luong_dong_bh: tien("luong_dong_bh"), an_ca_ngay: tien("an_ca_ngay"), dong_phuc_cap: tien("dong_phuc_cap"), nha_o_cap: tien("nha_o_cap"), so_npt: Math.max(0, Math.round(so(fd, "so_npt"))),
    ghi_chu: chuoiHoacNull(fd, "ghi_chu"), nguoi_id: nd.nhanVienId,
  }, { onConflict: "nhan_vien_id,hieu_luc_tu" });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function taoKyLuong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const nam = Math.round(so(fd, "nam")), thang = Math.round(so(fd, "thang")), chuan = chuoi(fd, "cong_chuan") === "" ? 26 : so(fd, "cong_chuan");
  if (!(nam >= 2024 && nam <= 2100 && thang >= 1 && thang <= 12) || !(chuan > 0 && chuan <= 31)) return { loi: "Nhập tháng, năm và công chuẩn hợp lệ." };
  const db = sb();
  const { data: ky, error } = await db.from("ky_luong").insert({ nam, thang, cong_chuan: chuan, nguoi_lap_id: nd.nhanVienId }).select("id").single();
  if (error || !ky) return { loi: error?.code === "23505" ? "Kỳ lương tháng này đã có." : thongBaoLoi(error) };
  const { error: e2 } = await db.rpc("tinh_ky_luong", { p_ky: ky.id });
  if (e2) { await db.from("ky_luong").delete().eq("id", ky.id); return { loi: thongBaoLoi(e2) }; }
  lamMoi();
  return { ok: true };
}

/** Gửi phiếu lương cho từng người (như nút "Gửi bảng lương" trên Lark): thông báo đẩy chung chung, không ghi số tiền để khỏi lộ trên màn hình khoá. */
async function baoPhieuLuong(kyId: string, tieuDe: string, noiDung: string) {
  const { data } = await sb().from("bang_luong_dong").select("nhan_vien_id").eq("ky_id", kyId);
  await guiChoNhanVien((data ?? []).map((d) => d.nhan_vien_id), { tieuDe, noiDung, url: "/nhan-su/luong/phieu", tag: `luong-${kyId}` });
}

async function layKy(id: string) {
  const { data } = await sb().from("ky_luong").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function tinhLaiKyLuong(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("luong.sua"))) return { loi: KHONG_DU_QUYEN };
  const { error } = await sb().rpc("tinh_ky_luong", { p_ky: chuoi(fd, "id") });
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function guiDuyetKyLuong(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("luong.sua"))) return { loi: KHONG_DU_QUYEN };
  const ky = await layKy(chuoi(fd, "id"));
  if (!ky || ky.trang_thai !== "nhap") return { loi: "Kỳ lương không ở trạng thái đang lập." };
  const { count } = await sb().from("bang_luong_dong").select("id", { count: "exact", head: true }).eq("ky_id", ky.id);
  if (!count) return { loi: "Kỳ lương chưa có dòng nào. Kiểm tra điều kiện lương của nhân viên." };
  const { count: am } = await sb().from("bang_luong_dong").select("id", { count: "exact", head: true }).eq("ky_id", ky.id).lt("thuc_tra", 0);
  if (am) return { loi: `Có ${am} dòng lương thực trả ÂM (khấu trừ lớn hơn thu nhập). Kiểm tra công, tạm ứng, khoản trừ hoặc điều kiện lương trước khi gửi duyệt.` };
  const { error } = await sb().from("ky_luong").update({ trang_thai: "cho_duyet" }).eq("id", ky.id).eq("trang_thai", "nhap");
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}

export async function duyetKyLuong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.duyet");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ky = await layKy(chuoi(fd, "id"));
  if (!ky || ky.trang_thai !== "cho_duyet") return { loi: "Kỳ lương không ở trạng thái chờ duyệt." };
  if (ky.nguoi_lap_id === nd.nhanVienId && nd.vaiTro !== "ky_thuat") return { loi: "Người lập bảng lương không tự duyệt." };
  const { data, error } = await sb().from("ky_luong").update({ trang_thai: "da_duyet", nguoi_duyet_id: nd.nhanVienId, duyet_luc: new Date().toISOString() }).eq("id", ky.id).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Kỳ lương vừa được xử lý bởi người khác." };
  await baoPhieuLuong(ky.id, `Phiếu lương tháng ${String(ky.thang).padStart(2, "0")}/${ky.nam} đã có`, "Mở để xem chi tiết công và các khoản. Thắc mắc báo nhân sự trong 1 ngày làm việc.");
  lamMoi();
  return { ok: true };
}

export async function traLaiKyLuong(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("luong.duyet"))) return { loi: KHONG_DU_QUYEN };
  const { data, error } = await sb().from("ky_luong").update({ trang_thai: "nhap", ghi_chu: chuoiHoacNull(fd, "ly_do") }).eq("id", chuoi(fd, "id")).eq("trang_thai", "cho_duyet").select("id");
  if (error) return { loi: thongBaoLoi(error) };
  if (!data?.length) return { loi: "Kỳ lương không ở trạng thái chờ duyệt." };
  lamMoi();
  return { ok: true };
}

export async function chiKyLuong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("quy.ghi");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ngay = chuoi(fd, "ngay") || homNayHCM();
  if (!NGAY.test(ngay) || ngay > homNayHCM()) return { loi: "Ngày chi không được ở tương lai." };
  if (!chuoi(fd, "quy_id")) return { loi: "Chọn quỹ chi lương." };
  const { error } = await sb().rpc("chi_ky_luong", { p_ky: chuoi(fd, "id"), p_quy: chuoi(fd, "quy_id"), p_ngay: ngay, p_nguoi: nd.nhanVienId, p_bo_qua_kiem: nd.vaiTro === "ky_thuat" });
  if (error) return { loi: thongBaoLoi(error) };
  const kyChi = await layKy(chuoi(fd, "id"));
  if (kyChi) await baoPhieuLuong(kyChi.id, `Lương tháng ${String(kyChi.thang).padStart(2, "0")}/${kyChi.nam} đã được chi`, "Kiểm tra tài khoản và xem phiếu lương trong AMIA OS.");
  revalidatePath("/tai-chinh", "layout");
  lamMoi();
  return { ok: true };
}

export async function themKhoanLuong(fd: FormData): Promise<KQ> {
  const nd = await kiemQuyen("luong.sua");
  if (!nd) return { loi: KHONG_DU_QUYEN };
  const ky = await layKy(chuoi(fd, "ky_id"));
  if (!ky || ky.trang_thai !== "nhap") return { loi: "Chỉ thêm khoản khi kỳ lương còn đang lập." };
  const loai = chuoi(fd, "loai"), tien = Math.round(so(fd, "so_tien")), td = chuoi(fd, "tieu_de");
  if (!["cong", "tru", "tru_vi_pham"].includes(loai) || !chuoi(fd, "nhan_vien_id") || !td || !(tien > 0)) return { loi: "Chọn nhân viên, loại khoản, nội dung và số tiền lớn hơn 0." };
  const db = sb();
  const { error } = await db.from("luong_khoan").insert({ ky_id: ky.id, nhan_vien_id: chuoi(fd, "nhan_vien_id"), loai, tieu_de: td, so_tien: tien, nguoi_id: nd.nhanVienId });
  if (error) return { loi: thongBaoLoi(error) };
  const { error: e2 } = await db.rpc("tinh_ky_luong", { p_ky: ky.id });
  if (e2) return { loi: thongBaoLoi(e2) };
  lamMoi();
  return { ok: true };
}

export async function xoaKhoanLuong(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("luong.sua"))) return { loi: KHONG_DU_QUYEN };
  const db = sb();
  const { data: k } = await db.from("luong_khoan").select("ky_id").eq("id", chuoi(fd, "id")).maybeSingle();
  const ky = k ? await layKy(k.ky_id) : null;
  if (!k || !ky || ky.trang_thai !== "nhap") return { loi: "Chỉ xoá khoản khi kỳ lương còn đang lập." };
  const { error } = await db.from("luong_khoan").delete().eq("id", chuoi(fd, "id"));
  if (error) return { loi: thongBaoLoi(error) };
  await db.rpc("tinh_ky_luong", { p_ky: ky.id });
  lamMoi();
  return { ok: true };
}

export async function xoaKyLuong(fd: FormData): Promise<KQ> {
  if (!(await kiemQuyen("luong.sua"))) return { loi: KHONG_DU_QUYEN };
  const ky = await layKy(chuoi(fd, "id"));
  if (!ky || ky.trang_thai !== "nhap") return { loi: "Chỉ xoá được kỳ lương đang lập." };
  const db = sb();
  await db.from("de_xuat").update({ ky_luong_tru_id: null }).eq("ky_luong_tru_id", ky.id);
  const { error } = await db.from("ky_luong").delete().eq("id", ky.id);
  if (error) return { loi: thongBaoLoi(error) };
  lamMoi();
  return { ok: true };
}
