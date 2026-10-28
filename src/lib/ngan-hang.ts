// Danh sách ngân hàng của ô "Tên ngân hàng" trong SalonHero (#/bankInfoSetting), đúng thứ tự và đúng chữ (42 mục, đọc 29/10/2026).
export const DANH_SACH_NGAN_HANG: string[] = [
  "Ngân hàng VietinBank", "Ngân hàng BIDV", "Ngân hàng Vietcombank", "Ngân hàng ACB", "Ngân hàng Techcombank", "Ngân hàng Agribank", "Ngân hàng MBBank", "Ngân hàng Sacombank",
  "Ngân hàng TPBank", "Ngân hàng SHB", "Ngân hàng Sài Gòn SCB", "Ngân hàng Đông Á", "Ngân hàng SeABank", "Ngân hàng Maritime", "Ngân hàng VPBank", "Ngân hàng Eximbank",
  "Ngân hàng VIB Bank", "Ngân hàng Petrolimex (PGBank)", "Ngân hàng LPBank", "Ngân hàng HDBank", "Ngân hàng ANZ Bank", "Ngân hàng HSBC", "Ngân hàng Deutsche Bank AG",
  "Ngân hàng Citibank", "Ngân hàng Standard Chartered", "Ngân hàng PVcomBank", "Ngân hàng ABBank", "Ngân hàng BacABank", "Ngân hàng VietBank", "Ngân hàng OCB",
  "Ngân hàng Sài Gòn (SGB)", "Ngân hàng Bảo Việt", "Ngân hàng Viet Capital", "Ngân hàng Kiên Long", "Commonwealth Bank", "Ngân hàng Shinhan Bank", "Ngân hàng Nam Á Bank",
  "Ngân hàng Việt Á Bank", "Ngân hàng Ocean Bank", "Ngân hàng GPBank", "Ngân hàng Quốc Dân (NCB)", "Ngân hàng Woori",
];

/** Chức năng của một tài khoản, đúng chữ SalonHero: "Quẹt thẻ" và/hoặc "Chuyển khoản". */
export const chucNangNganHang = (r: { dung_quet_the: boolean; dung_chuyen_khoan: boolean }): string[] => [...(r.dung_quet_the ? ["Quẹt thẻ"] : []), ...(r.dung_chuyen_khoan ? ["Chuyển khoản"] : [])];
