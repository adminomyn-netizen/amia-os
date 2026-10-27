export const LOAI_PHIEU: Record<string, string> = {
  nghi: "Nghỉ", di_tre_ve_som: "Đi trễ / về sớm", ra_ngoai: "Ra ngoài", lam_online: "Làm online", lam_them: "Làm thêm giờ", dieu_chinh_cc: "Điều chỉnh chấm công", cong_tac: "Công tác",
};
export const LOAI_NGHI: Record<string, string> = {
  phep_nam: "Phép năm (có lương)", nghi_khong_luong: "Nghỉ không lương", nghi_che_do: "Nghỉ chế độ (cưới, tang…)", nghi_bu: "Nghỉ bù", nghi_om: "Nghỉ ốm", thai_san: "Thai sản",
};
export const LOI_CC: Record<string, string> = { di_muon: "Đi muộn", quen_cham_cong: "Quên chấm công", ly_do_cong_viec: "Lý do công việc", ly_do_khac: "Lý do khác" };
export const TT_PHIEU: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  nhap: { ten: "Nháp", kieu: "tram" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt", kieu: "tot" }, tu_choi: { ten: "Từ chối", kieu: "loi" }, huy: { ten: "Đã huỷ", kieu: "tram" },
};
export const KHUNG_LAM: Record<string, string> = { van_phong: "Văn phòng (T2–T6, T7 xen kẽ)", chi_nhanh: "Chi nhánh (làm cả tuần, nghỉ 1 ngày)", khong_cham_cong: "Không chấm công (26 công)" };
export const TT_LAM: Record<string, string> = { dang_lam: "Đang làm", tam_nghi: "Tạm nghỉ", nghi_viec: "Nghỉ việc", khoa: "Khoá" };
export const TINH_TRANG_LUONG: Record<string, string> = { thu_viec: "Thử việc", chinh_thuc: "Chính thức", cong_tac_vien: "Cộng tác viên" };
export const TT_KY_LUONG: Record<string, { ten: string; kieu: "tot" | "cho" | "loi" | "tram" }> = {
  nhap: { ten: "Đang lập", kieu: "tram" }, cho_duyet: { ten: "Chờ duyệt", kieu: "cho" }, da_duyet: { ten: "Đã duyệt, chờ chi", kieu: "tot" }, da_chi: { ten: "Đã chi", kieu: "tot" },
};
export const THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Giờ Việt Nam (UTC+7, không có giờ mùa hè) → ISO. `ngay` YYYY-MM-DD, `gio` HH:mm. */
export const isoVN = (ngay: string, gio: string) => `${ngay}T${gio.length === 5 ? `${gio}:00` : gio}+07:00`;
export const phutTrongNgayVN = (iso: string) => { const d = new Date(new Date(iso).getTime() + 7 * 3600_000); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
export const phutTuGio = (g: string) => { const [h, m] = g.split(":"); return Number(h) * 60 + Number(m); };
export const ngayCongThem = (ngay: string, n: number) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const soNgayGiua = (tu: string, den: string) => Math.round((new Date(`${den}T00:00:00Z`).getTime() - new Date(`${tu}T00:00:00Z`).getTime()) / 86_400_000) + 1;
export const thuCuaNgay = (ngay: string) => new Date(`${ngay}T00:00:00Z`).getUTCDay();
/** Đầu tuần (thứ Hai) của một ngày. */
export const dauTuan = (ngay: string) => ngayCongThem(ngay, -((thuCuaNgay(ngay) + 6) % 7));
