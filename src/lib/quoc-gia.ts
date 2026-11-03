// Danh sách quốc gia cho ô "Quốc gia" của chi nhánh (SalonHero #/locations: danh sách nước, Việt Nam đứng đầu, lưu mã ISO 2 chữ).
// Tên tiếng Việt lấy từ Intl.DisplayNames của máy chủ, không phải giữ bảng tên tay.
const MA = ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ " +
  "DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ " +
  "OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
  "UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW").split(" ");
export const MA_QUOC_GIA = new Set(MA);

let ten: Intl.DisplayNames | null = null;
/** Tên tiếng Việt của mã nước ("VN" → "Việt Nam"); không dịch được thì trả mã. */
export function tenQuocGia(ma: string): string {
  try { ten ??= new Intl.DisplayNames(["vi"], { type: "region" }); return ten.of(ma) ?? ma; } catch { return ma; }
}
/** Lựa chọn cho ô chọn: Việt Nam đứng đầu, còn lại xếp A→Z theo tên tiếng Việt. */
export function luaChonQuocGia(): { gia_tri: string; nhan: string }[] {
  const ds = MA.filter((m) => m !== "VN").map((m) => ({ gia_tri: m, nhan: tenQuocGia(m) })).sort((a, b) => a.nhan.localeCompare(b.nhan, "vi"));
  return [{ gia_tri: "VN", nhan: tenQuocGia("VN") }, ...ds];
}
