/** Hạn nộp việc và cờ trễ (chị Lâm 31/10/2026): quá hạn giờ 30 phút mà chưa nộp thì cờ đỏ. Việc cũ chỉ có hạn ngày thì coi hạn là 17:00 ngày đó (giờ Việt Nam). */
export const NGUONG_TRE_PHUT = 30;
export const GIO_HAN_MAC_DINH = "17:00";

/** Đổi ngày + giờ nhập theo giờ Việt Nam (UTC+7) sang thời điểm chuẩn; sai định dạng thì null. */
export const hanGioTuNhap = (ngay: string, gio: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(gio)) return null;
  const t = new Date(`${ngay}T${gio}:00+07:00`);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
};

/** Thời điểm hạn dùng để tính trễ: hạn giờ nếu có, không thì 17:00 của hạn ngày; không có hạn thì null. */
export const thoiDiemHan = (hanGio: string | null, hanNgay: string | null): Date | null => {
  if (hanGio) return new Date(hanGio);
  if (hanNgay) return new Date(`${hanNgay}T${GIO_HAN_MAC_DINH}:00+07:00`);
  return null;
};

export type TinhTrangHan =
  | { loai: "khong_han" }
  | { loai: "con_han"; phutCon: number }
  | { loai: "vua_qua"; phutTre: number }   // qua hạn nhưng chưa tới ngưỡng cờ đỏ
  | { loai: "tre"; phutTre: number }       // qua hạn từ 30 phút trở lên: cờ đỏ
  | { loai: "nop_dung_han" }
  | { loai: "nop_tre"; phutTre: number };

/** Tình trạng hạn của một việc tại thời điểm `bay`. `nopLuc` có nghĩa là đã nộp (người làm bấm nộp kết quả). */
export function tinhTrangHan(han: Date | null, nopLuc: string | null, bay: Date): TinhTrangHan {
  if (!han) return { loai: "khong_han" };
  if (nopLuc) {
    const phut = Math.floor((new Date(nopLuc).getTime() - han.getTime()) / 60_000);
    return phut > 0 ? { loai: "nop_tre", phutTre: phut } : { loai: "nop_dung_han" };
  }
  const phut = Math.floor((bay.getTime() - han.getTime()) / 60_000);
  if (phut < 0) return { loai: "con_han", phutCon: -phut };
  return phut >= NGUONG_TRE_PHUT ? { loai: "tre", phutTre: phut } : { loai: "vua_qua", phutTre: phut };
}

/** "2 giờ 5 phút" / "45 phút" cho tiếng Việt đời thường. */
export const doDai = (phut: number) => (phut >= 60 ? `${Math.floor(phut / 60)} giờ${phut % 60 ? ` ${phut % 60} phút` : ""}` : `${phut} phút`);

// ─── Bảng chốt 12h / 17h ────────────────────────────────────────────────────
export type ViecChot = {
  han: string | null; han_gio: string | null; trang_thai: string;
  hoan_thanh_luc: string | null; danh_gia: string; danh_gia_luc: string | null; ket_nguoi_id: string | null; ket_luc: string | null;
};
export type ChotViec = {
  /** Có trong bảng chốt: đã tới hạn tại mốc (hạn trong ngày chốt, hoặc việc tồn từ ngày trước chưa nộp). */
  trongBang: boolean;
  /** Hạn nằm sau mốc: chưa tới hạn. */
  chuaDen: boolean;
  daNop: boolean; dat: boolean; chuaDat: boolean; nopTre: boolean;
  /** Chưa nộp, quá hạn từ 30 phút (cờ đỏ). */
  tre: boolean;
  /** Chưa nộp, quá hạn dưới 30 phút. */
  vuaQua: boolean;
  /** Kẹt (báo trước mốc) khi chưa nộp. */
  ket: boolean;
  /** Việc tồn từ ngày trước, chưa nộp. */
  tonCu: boolean;
};

/** Mốc chốt của một ngày (giờ Việt Nam): 12:00 hoặc 17:00. */
export const mocChot = (ngay: string, gio: "12:00" | "17:00") => new Date(`${ngay}T${gio}:00+07:00`);

/** Trạng thái của một việc TẠI mốc `moc` (dựng lại từ giờ nộp / giờ chấm / giờ báo kẹt đã lưu). Việc huỷ không vào bảng. */
export function chotViec(v: ViecChot, ngay: string, moc: Date): ChotViec {
  const khong: ChotViec = { trongBang: false, chuaDen: false, daNop: false, dat: false, chuaDat: false, nopTre: false, tre: false, vuaQua: false, ket: false, tonCu: false };
  const han = thoiDiemHan(v.han_gio, v.han);
  if (!han || v.trang_thai === "huy") return khong;
  const dauNgay = new Date(`${ngay}T00:00:00+07:00`);
  const nop = v.trang_thai === "xong" && v.hoan_thanh_luc ? new Date(v.hoan_thanh_luc) : null;
  const daNop = !!nop && nop <= moc;
  const dat = daNop && v.danh_gia === "dat" && !!v.danh_gia_luc && new Date(v.danh_gia_luc) <= moc;
  const tonCu = han < dauNgay && !daNop;
  const denHan = han <= moc;
  const trongBang = denHan && (han >= dauNgay || tonCu || (daNop && nop! >= dauNgay));
  const phutTre = Math.floor((moc.getTime() - han.getTime()) / 60_000);
  return {
    trongBang, chuaDen: !denHan && han >= dauNgay && han < new Date(dauNgay.getTime() + 86_400_000),
    daNop, dat, chuaDat: daNop && v.danh_gia === "chua_dat", nopTre: daNop && nop! > han,
    tre: trongBang && !daNop && phutTre >= NGUONG_TRE_PHUT, vuaQua: trongBang && !daNop && phutTre < NGUONG_TRE_PHUT,
    ket: !daNop && !!v.ket_nguoi_id && !!v.ket_luc && new Date(v.ket_luc) <= moc, tonCu,
  };
}
