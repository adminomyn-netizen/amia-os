/** Mã vạch Code 128 (bộ B: chữ, số, dấu thường gặp) vẽ thành SVG, không cần thư viện. Dùng cho in mã khách (máy quét mã vạch ở quầy đọc được). */

// Độ rộng vạch/khoảng trắng của 107 ký hiệu Code 128 (0–102 dữ liệu, 103–105 bắt đầu A/B/C, 106 kết thúc). Mỗi ký hiệu = 11 mô-đun, kết thúc = 13.
export const MAU_128 = (
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 " +
  "221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 " +
  "231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 " +
  "314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 " +
  "111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 " +
  "114131 311141 411131 211412 211214 211232 2331112"
).split(" ");

/** Các ký hiệu (kèm bắt đầu B, tổng kiểm tra, kết thúc) của chuỗi `s`. Chỉ nhận ký tự ASCII in được (32–126). */
export function kyHieu128(s: string): number[] {
  if (!/^[\x20-\x7e]+$/.test(s)) throw new Error("Mã vạch chỉ nhận chữ không dấu, số và dấu thường.");
  const du = [...s].map((c) => c.charCodeAt(0) - 32);
  const tong = du.reduce((t, v, i) => t + v * (i + 1), 104) % 103;
  return [104, ...du, tong, 106];
}

/** SVG mã vạch Code 128-B, cao `cao` px, mỗi mô-đun `mo` px, có le trắng 10 mô-đun hai bên. */
export function svgMaVach(s: string, { cao = 64, mo = 2 }: { cao?: number; mo?: number } = {}): string {
  const le = 10;
  let x = le, vach = "";
  for (const k of kyHieu128(s)) {
    [...MAU_128[k]].forEach((w, i) => {
      const r = Number(w);
      if (i % 2 === 0) vach += `M${x * mo} 0h${r * mo}v${cao}h${-r * mo}z`;
      x += r;
    });
  }
  const rong = (x + le) * mo;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${rong}" height="${cao}" viewBox="0 0 ${rong} ${cao}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${vach}" fill="#000"/></svg>`;
}
