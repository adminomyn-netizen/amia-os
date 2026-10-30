/** Kéo số liệu quảng cáo Meta (Facebook/Instagram) theo ngày × chiến dịch về bảng chi_phi_qc_ngay. Hàm thuần ở đây để kiểm thử; phần gọi mạng + ghi DB ở /api/cron/meta-ads. */

export type DongInsight = {
  campaign_id?: string; campaign_name?: string; date_start?: string;
  spend?: string; impressions?: string; reach?: string; inline_link_clicks?: string;
  actions?: { action_type: string; value: string }[];
};
export type SoLieuQc = { metaId: string; ten: string; ngay: string; chi_phi: number; hien_thi: number; tiep_can: number; click: number; tin_nhan_moi: number; lead_so: number };

const TIN_NHAN = ["onsite_conversion.messaging_conversation_started_7d"];
const LEAD = ["lead", "onsite_conversion.lead_grouped"]; // lấy loại đầu tiên có số: các loại này là cùng một lượt lead, cộng cả hai sẽ đếm đôi

const nguyen = (v: string | undefined) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? Math.round(x) : 0;
};
const hanhDong = (d: DongInsight, loai: string[], gop: boolean) => {
  const a = d.actions ?? [];
  if (gop) return loai.reduce((s, l) => s + nguyen(a.find((x) => x.action_type === l)?.value), 0);
  for (const l of loai) { const v = nguyen(a.find((x) => x.action_type === l)?.value); if (v > 0) return v; }
  return 0;
};

/** Một dòng insights của Meta → một dòng chi_phi_qc_ngay. Dòng thiếu mã chiến dịch/ngày thì bỏ (null), không đoán. */
export function chuyenDong(d: DongInsight): SoLieuQc | null {
  if (!d.campaign_id || !d.date_start || !/^\d{4}-\d{2}-\d{2}$/.test(d.date_start)) return null;
  return {
    metaId: d.campaign_id, ten: (d.campaign_name ?? "").trim() || `Meta ${d.campaign_id}`, ngay: d.date_start,
    chi_phi: nguyen(d.spend), hien_thi: nguyen(d.impressions), tiep_can: nguyen(d.reach), click: nguyen(d.inline_link_clicks),
    tin_nhan_moi: hanhDong(d, TIN_NHAN, true), lead_so: hanhDong(d, LEAD, false),
  };
}

export const maChienDich = (metaId: string) => `meta-${metaId}`;

/**
 * Meta nhân bản chiến dịch thành "… - Bản sao N": cùng một chiến dịch mà hiện thành hàng chục dòng. Gộp theo TÊN đã bỏ đuôi "Bản sao N"
 * (không phân biệt hoa/thường, khoảng trắng quanh dấu gạch) về một chiến dịch trong app; mã nhóm `meta-n-<tên rút gọn không dấu>`.
 */
export function nhomChienDich(ten: string): { ma: string; ten: string } {
  const goc = ten.replace(/\s*-?\s*B[ảa]n sao(\s+\d+)?/gi, "").replace(/\s+/g, " ").trim() || ten.trim();
  const khoa = goc.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return { ma: `meta-n-${khoa}`, ten: goc };
}

export type SoLieuNhom = Omit<SoLieuQc, "metaId"> & { ma: string };

/** Cộng các dòng cùng nhóm cùng ngày. Tiếp cận (reach) cộng dồn nên có thể cao hơn số người thật khi nhiều bản sao trùng đối tượng. */
export function gopTheoNhom(so: SoLieuQc[]): SoLieuNhom[] {
  const m = new Map<string, SoLieuNhom>();
  for (const x of so) {
    const n = nhomChienDich(x.ten), k = `${n.ma}|${x.ngay}`, c = m.get(k);
    if (!c) { m.set(k, { ma: n.ma, ten: n.ten, ngay: x.ngay, chi_phi: x.chi_phi, hien_thi: x.hien_thi, tiep_can: x.tiep_can, click: x.click, tin_nhan_moi: x.tin_nhan_moi, lead_so: x.lead_so }); continue; }
    c.chi_phi += x.chi_phi; c.hien_thi += x.hien_thi; c.tiep_can += x.tiep_can; c.click += x.click; c.tin_nhan_moi += x.tin_nhan_moi; c.lead_so += x.lead_so;
  }
  return [...m.values()];
}

/** Cửa sổ kéo: hôm nay lùi `soNgay` ngày. Meta còn điều chỉnh số 1–3 ngày sau (quy cho lượt xem/chat muộn) nên mỗi lần kéo lại cả cửa sổ và ghi đè. */
export function cuaSoNgay(homNay: string, soNgay: number): { since: string; until: string } {
  const [y, m, d] = homNay.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - (soNgay - 1)));
  return { since: t.toISOString().slice(0, 10), until: homNay };
}

type Trang = { data?: DongInsight[]; paging?: { next?: string }; error?: { message?: string; code?: number } };

/** Gọi Graph API insights cấp chiến dịch, chia theo ngày, đi hết các trang. Token đi qua header, không nằm trong URL/nhật ký. */
export async function keoInsights(opts: { token: string; taiKhoan: string; since: string; until: string; phienBan?: string; fetchFn?: typeof fetch }): Promise<DongInsight[]> {
  const f = opts.fetchFn ?? fetch, ver = opts.phienBan || "v23.0";
  const act = opts.taiKhoan.startsWith("act_") ? opts.taiKhoan : `act_${opts.taiKhoan}`;
  const q = new URLSearchParams({
    level: "campaign", time_increment: "1", limit: "200",
    time_range: JSON.stringify({ since: opts.since, until: opts.until }),
    fields: "campaign_id,campaign_name,spend,impressions,reach,inline_link_clicks,actions",
  });
  let url: string | undefined = `https://graph.facebook.com/${ver}/${act}/insights?${q}`;
  const ra: DongInsight[] = [];
  for (let trang = 0; url && trang < 50; trang++) {
    const r = await f(url, { headers: { Authorization: `Bearer ${opts.token}` }, cache: "no-store" });
    const j = (await r.json().catch(() => ({}))) as Trang;
    if (!r.ok || j.error) throw new Error(`Meta ${act}: ${j.error?.code ?? r.status} ${j.error?.message ?? ""}`.trim());
    ra.push(...(j.data ?? []));
    url = j.paging?.next;
  }
  return ra;
}

/** Tiền tệ tài khoản: chỉ nhận VND (spend của Meta tính theo đơn vị tiền tệ của tài khoản; khác VND thì không quy đổi tại đây). */
export async function layTienTe(opts: { token: string; taiKhoan: string; phienBan?: string; fetchFn?: typeof fetch }): Promise<string> {
  const f = opts.fetchFn ?? fetch, act = opts.taiKhoan.startsWith("act_") ? opts.taiKhoan : `act_${opts.taiKhoan}`;
  const r = await f(`https://graph.facebook.com/${opts.phienBan || "v23.0"}/${act}?fields=currency`, { headers: { Authorization: `Bearer ${opts.token}` }, cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { currency?: string; error?: { message?: string } };
  if (!r.ok || !j.currency) throw new Error(`Meta ${act}: không đọc được tiền tệ ${j.error?.message ?? r.status}`);
  return j.currency;
}
