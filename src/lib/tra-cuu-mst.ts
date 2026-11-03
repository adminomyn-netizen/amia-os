// Tra cứu mã số thuế doanh nghiệp như SalonHero (nút "Tra cứu MST" ở Hoá đơn đầu vào và hộp tạo hoá đơn điện tử).
// SalonHero gọi THẲNG từ trình duyệt dịch vụ công khai của VietQR, không cần khoá: GET https://api.vietqr.io/v2/business/{mst}
//   code "00" → data.name, data.address; "51"/"52" → không tìm thấy MST; MST dưới 10 ký tự → báo lỗi trước khi gọi.
// Gọi từ trình duyệt (mỗi người một địa chỉ IP) để không dồn hạn mức về một máy chủ; dịch vụ cho phép gọi chéo nguồn (CORS *).
// Dịch vụ có giới hạn số lần gọi; lỗi / quá hạn mức thì trả "loi" để giao diện đưa đường dẫn trang tra cứu của Tổng cục Thuế.

export const API_TRA_CUU_MST = "https://api.vietqr.io/v2/business/";
/** Trang tra cứu chính thức (có mã xác nhận, không điền sẵn MST qua đường dẫn được). */
export const TRANG_TRA_CUU_GDT = "https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp";

/** Chuẩn hoá MST người gõ: bỏ khoảng trắng, dấu chấm; giữ gạch nối của MST chi nhánh (0123456789-001). */
export const chuanMst = (v: string) => v.replace(/[\s.]/g, "").trim();

/** Kiểm trước khi gọi, cùng luật SalonHero: trống → nhắc nhập; dưới 10 ký tự → báo lỗi; sai dạng 10 / 10-3 / 13 số → báo lỗi. */
export function kiemMstTraCuu(raw: string): { mst: string } | { loi: string } {
  const mst = chuanMst(raw);
  if (!mst) return { loi: "Hãy điền mã số thuế cần tra cứu." };
  if (mst.length < 10) return { loi: "Mã số thuế phải từ 10 kí tự trở lên." };
  if (!/^[0-9]{10}(-?[0-9]{3})?$/.test(mst)) return { loi: "Mã số thuế gồm 10 số, hoặc 13 số dạng 0123456789-001." };
  return { mst };
}

export type KetQuaMst = { ok: { ten: string; diaChi: string } } | { khongThay: true } | { loi: string };

/** Đọc phản hồi của dịch vụ VietQR (hàm thuần để kiểm bằng test). */
export function docKetQuaMst(status: number, body: unknown): KetQuaMst {
  if (status === 429) return { loi: "Dịch vụ tra cứu đang giới hạn số lần, thử lại sau ít phút hoặc tra ở trang Tổng cục Thuế." };
  if (status !== 200 || !body || typeof body !== "object") return { loi: "Không gọi được dịch vụ tra cứu MST." };
  const b = body as { code?: unknown; data?: { name?: unknown; address?: unknown } | null };
  const code = String(b.code ?? "");
  if (code === "00") {
    const ten = typeof b.data?.name === "string" ? b.data.name.trim() : "";
    const diaChi = typeof b.data?.address === "string" ? b.data.address.trim() : "";
    return ten ? { ok: { ten, diaChi } } : { khongThay: true };
  }
  if (code === "51" || code === "52") return { khongThay: true };
  return { loi: "Dịch vụ tra cứu MST trả lỗi, thử lại sau." };
}

/** Gọi dịch vụ (chỉ dùng ở trình duyệt). Hết 10 giây coi như lỗi. */
export async function traCuuMst(raw: string, f: typeof fetch = fetch): Promise<KetQuaMst> {
  const k = kiemMstTraCuu(raw);
  if ("loi" in k) return k;
  const ctl = new AbortController();
  const hen = setTimeout(() => ctl.abort(), 10_000);
  try {
    const r = await f(API_TRA_CUU_MST + encodeURIComponent(k.mst), { signal: ctl.signal, headers: { Accept: "application/json" } });
    let body: unknown = null;
    try { body = await r.json(); } catch { body = null; }
    return docKetQuaMst(r.status, body);
  } catch {
    return { loi: "Không gọi được dịch vụ tra cứu MST (mạng chậm hoặc bị chặn)." };
  } finally {
    clearTimeout(hen);
  }
}
