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
