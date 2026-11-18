import { sb } from "@/lib/db";
import { congNgay, ngayCuaIso, ngayVN, soVN, tienGon, tienVN } from "@/lib/dinh-dang";
import { soNgayGom } from "@/lib/ky-xep-hang";
import { MucTrang } from "@/components/ui/MucTrang";
import { Bang } from "@/components/ui/Table";
import { BieuDoTron } from "@/components/bieu-do/BieuDoTron";
import { CotNgang } from "@/components/bieu-do/CotNgang";
import { CotTheoKy } from "@/components/bieu-do/CotTheoKy";
import { DuongMien } from "@/components/bieu-do/DuongMien";

/** Bảng điều khiển Marketing (chị Lâm 18/11/2026: "dashboard đồ thị rõ, nhiều số liệu, ranking đầy đủ"). CHỈ ĐỌC.
 *  - Chi phí: cộng các chiến dịch Meta trong chi_phi_qc_ngay; tin nhắn / có SĐT: chiến dịch giả `pancake-hoi-thoai` (số đo thực ở Pancake).
 *  - Lead + phễu + thực thu: hàm bc_phieu_marketing (như trang cũ, ngày theo thoi_diem_phat_sinh giờ VN); xu hướng / người phụ trách đọc thẳng bảng lead cùng mốc ngày.
 *  - Dịch vụ / nguồn / giai đoạn / nhân viên trực page: mkt_chat_ngay. */

type Khoang = { tu: string; den: string; nhan: string; catBot?: boolean };
type Phieu = { nguon_id: string; so_lead: number; hop_le: number; da_lien_he: number; da_dat_lich: number; khach_den: number; co_hoa_don: number; thuc_thu: number };
type KhoaPhieu = Exclude<keyof Phieu, "nguon_id">;

const TRANG = 1000;
/** Đọc hết các trang (PostgREST trả tối đa 1000 dòng/lượt); kỳ thường chỉ một lượt. */
async function layHet<T>(q: (tu: number, den: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, ten: string): Promise<T[]> {
  const ra: T[] = [];
  for (let i = 0; ; i += TRANG) {
    const { data, error } = await q(i, i + TRANG - 1);
    if (error) throw new Error(`${ten}: ${error.message}`);
    ra.push(...(data ?? []));
    if ((data ?? []).length < TRANG) return ra;
  }
}

const ngayNgan = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;
const ti = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");
const chia = (a: number, b: number) => (b > 0 ? Math.round(a / b) : 0);
/** Tên chiến dịch Meta dễ đọc: bỏ mã số dài (id bài/QC 10+ chữ số) và tiền tố tài khoản "G99-AMIA - ". */
const tenGon = (ten: string) => ten.replace(/\b\d{10,}\b/g, "").replace(/^\s*G99-AMIA\s*-\s*/i, "").replace(/\s*-\s*(-\s*)+/g, " - ").replace(/^[\s-]+|[\s-]+$/g, "").trim() || ten;
const phut = (s: number) => (s < 90 ? `${Math.round(s)} giây` : `${Math.round(s / 60)} phút`);

/** Ô số có so sánh kỳ trước. `tot`: tăng là tốt ("len"), giảm là tốt ("xuong") hoặc không tô màu. */
type O = { nhan: string; so: string; nay: number; truoc: number; dd: (n: number) => string; tot?: "len" | "xuong"; phu?: string; /** Có thì không so sánh, hiện câu này (vd chưa có chi phí). */ khongSo?: string };
function HangKpi({ muc }: { muc: O[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {muc.map((m, i) => {
        const p = m.truoc ? Math.round(((m.nay - m.truoc) / Math.abs(m.truoc)) * 100) : null;
        const tot = p == null || p === 0 || !m.tot ? null : (p > 0) === (m.tot === "len");
        return (
          <div key={m.nhan} className="the-noi the-noi-nang vao min-w-0 px-4 pb-4 pt-5" style={{ animationDelay: `${i * 50}ms` }}>
            <dt className="text-[13px] text-muc-3">{m.nhan}</dt>
            <dd className={`mt-2 truncate font-medium leading-none tabular-nums text-muc ${m.so.length > 11 ? "text-[21px]" : "text-[26px]"} max-sm:text-[19px]`} title={m.so}>{m.so}</dd>
            <dd className="mt-2 text-[12px] leading-snug text-muc-3">
              {m.khongSo ? m.khongSo : p == null ? (m.nay ? "kỳ trước chưa có" : "kỳ trước cũng 0") : (
                <><span className={`font-medium ${tot == null ? "text-muc-2" : tot ? "text-sac-luc" : "text-loi"}`}>{p > 0 ? "▲" : p < 0 ? "▼" : "="} {Math.abs(p)}%</span> · trước {m.dd(m.truoc)}</>
              )}
            </dd>
            {m.phu && <dd className="mt-1 text-[12px] text-muc-3">{m.phu}</dd>}
          </div>
        );
      })}
    </dl>
  );
}

/** Phễu ngang: thanh dài theo bước đầu, bên phải là số + tỉ lệ so với lead hợp lệ và so với bước liền trước. */
function Pheu({ buoc }: { buoc: { nhan: string; so: number }[] }) {
  const dau = Math.max(1, buoc[0]?.so ?? 0), hopLe = buoc[1]?.so ?? 0;
  if (!buoc.some((b) => b.so > 0)) return <p className="py-6 text-center text-[14px] text-muc-3">Chưa có lead trong khoảng này.</p>;
  return (
    <ol className="space-y-2.5">
      {buoc.map((b, i) => (
        <li key={b.nhan} className="grid grid-cols-[minmax(84px,30%)_1fr_auto] items-center gap-3 text-[13px]">
          <span className="truncate text-muc-2">{b.nhan}</span>
          <span className="h-6 overflow-hidden bg-giay-tram" style={{ borderRadius: 5 }}>
            <span className="block h-full" style={{ width: `${Math.max(3, (b.so / dau) * 100)}%`, background: `color-mix(in srgb, var(--sac-luc-mau) ${100 - i * 11}%, var(--dat))`, borderRadius: 5 }}>
            </span>
          </span>
          <span className="min-w-[92px] text-right tabular-nums text-muc">
            {soVN(b.so)}{i > 1 && <span className="text-muc-3"> · {ti(b.so, hopLe)}</span>}
            {i > 1 && <span className="block text-[11px] text-muc-3">bước trước {ti(b.so, buoc[i - 1].so)}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

const Hang = ({ i }: { i: number }) => (
  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${i < 3 ? "bg-vang text-[color:var(--chu-tren-vang)]" : "bg-giay-tram text-muc-2"}`}>{i + 1}</span>
);

export async function BangMkt({ cn, khoang, truoc, homNay }: { cn: string | null; khoang: Khoang; truoc: { tu: string; den: string }; homNay: string }) {
  const db = sb();
  const { tu, den } = khoang;
  const motNgay = tu === den;
  // Kỳ một ngày: biểu đồ vẽ 14 ngày đến ngày đó (một điểm thì không thấy xu hướng); ô số vẫn đúng kỳ.
  const tuBd = motNgay ? congNgay(den, -13) : tu;
  const tuCp = truoc.tu < tuBd ? truoc.tu : tuBd;
  const moc = (d: string) => `${d}T00:00:00+07:00`;

  const [rNay, rTruoc, cp, chat, { data: cd }, { data: nguon }, leads, { data: gd }] = await Promise.all([
    db.rpc("bc_phieu_marketing", { p_tu: tu, p_den: den, p_cn: cn ?? undefined }),
    db.rpc("bc_phieu_marketing", { p_tu: truoc.tu, p_den: truoc.den, p_cn: cn ?? undefined }),
    layHet((a, b) => db.from("chi_phi_qc_ngay").select("id, ngay, chien_dich_id, chi_phi, hien_thi, click, tin_nhan_moi, lead_so").gte("ngay", tuCp).lte("ngay", den).order("ngay").order("id").range(a, b), "chi_phi_qc_ngay"),
    layHet((a, b) => db.from("mkt_chat_ngay").select("id, loai, khoa, hoi_thoai, co_sdt, phan_hoi_trung_vi_giay, bo_lo").gte("ngay", tu).lte("ngay", den).order("ngay").order("id").range(a, b), "mkt_chat_ngay"),
    db.from("chien_dich").select("id, ma, ten, nguon_id"),
    db.from("nguon_lead").select("id, ten").order("thu_tu"),
    layHet((a, b) => {
      let q = db.from("lead").select("id, nguon_id, chien_dich_id, owner_id, ket_qua, giai_doan_id, trang_thai_phan_bo, trang_thai_lien_he, thoi_diem_phat_sinh")
        .gte("thoi_diem_phat_sinh", moc(tuBd)).lt("thoi_diem_phat_sinh", moc(congNgay(den, 1)));
      if (cn) q = q.eq("chi_nhanh_id", cn);
      return q.order("thoi_diem_phat_sinh").order("id").range(a, b);
    }, "lead"),
    db.from("lead_giai_doan").select("id, ma, la_thang"),
  ]);
  for (const r of [rNay, rTruoc]) if (r.error) throw new Error(`bc_phieu_marketing: ${r.error.message}`);
  const pNay = (rNay.data ?? []) as Phieu[], pTruoc = (rTruoc.data ?? []) as Phieu[];
  const t = (k: KhoaPhieu) => pNay.reduce((s, r) => s + Number(r[k]), 0), tt = (k: KhoaPhieu) => pTruoc.reduce((s, r) => s + Number(r[k]), 0);

  // ── Chi phí / tin nhắn ──────────────────────────────────────────────
  const idPancake = (cd ?? []).find((c) => c.ma === "pancake-hoi-thoai")?.id;
  const cdTheoId = new Map((cd ?? []).map((c) => [c.id, c]));
  const trongKy = (d: string) => d >= tu && d <= den, kyTruocCo = (d: string) => d >= truoc.tu && d <= truoc.den;
  const theoNgay = new Map<string, { chi: number; tin: number; sdt: number; lead: number }>();
  for (let d = tuBd; d <= den; d = congNgay(d, 1)) theoNgay.set(d, { chi: 0, tin: 0, sdt: 0, lead: 0 });
  const tong = { chi: 0, tin: 0, sdt: 0 }, tongTr = { chi: 0, tin: 0, sdt: 0 };
  const chiTheoNguon = new Map<string, number>();
  let chiChung = 0;
  type DongCd = { id: string; ten: string; tenDu: string; chi: number; hien: number; click: number; tin: number; lead: number; leadCrm: number };
  const theoCd = new Map<string, DongCd>();
  for (const r of cp) {
    const laPc = r.chien_dich_id === idPancake, chi = Number(r.chi_phi);
    const o = theoNgay.get(r.ngay);
    if (o) { if (laPc) { o.tin += r.tin_nhan_moi; o.sdt += r.lead_so; } else o.chi += chi; }
    const dich = trongKy(r.ngay) ? tong : kyTruocCo(r.ngay) ? tongTr : null;
    if (dich) { if (laPc) { dich.tin += r.tin_nhan_moi; dich.sdt += r.lead_so; } else dich.chi += chi; }
    if (!laPc && trongKy(r.ngay)) {
      const c = cdTheoId.get(r.chien_dich_id);
      if (c?.nguon_id) chiTheoNguon.set(c.nguon_id, (chiTheoNguon.get(c.nguon_id) ?? 0) + chi); else chiChung += chi;
      const ten = c?.ten ?? "Chiến dịch đã xoá";
      const x = theoCd.get(r.chien_dich_id) ?? { id: r.chien_dich_id, ten: tenGon(ten), tenDu: ten, chi: 0, hien: 0, click: 0, tin: 0, lead: 0, leadCrm: 0 };
      x.chi += chi; x.hien += r.hien_thi; x.click += r.click; x.tin += r.tin_nhan_moi; x.lead += r.lead_so;
      theoCd.set(r.chien_dich_id, x);
    }
  }

  // ── Lead (bảng lead, cùng mốc ngày với bc_phieu_marketing) ────────────
  const gdTheoId = new Map((gd ?? []).map((g) => [g.id, g]));
  const hopLe = (l: (typeof leads)[number]) => !["lead_trung", "khong_hop_le"].includes(l.trang_thai_phan_bo) && !["sai_sdt", "trung_lead"].includes(l.trang_thai_lien_he);
  const thang = (l: (typeof leads)[number]) => l.ket_qua === "won" || !!(l.giai_doan_id && gdTheoId.get(l.giai_doan_id)?.la_thang);
  const datLich = (l: (typeof leads)[number]) => thang(l) || l.trang_thai_lien_he === "da_dat_lich" || (l.giai_doan_id ? gdTheoId.get(l.giai_doan_id)?.ma === "da_dat_lich" : false);
  const theoOwner = new Map<string, { lead: number; hopLe: number; datLich: number; chot: number }>();
  for (const l of leads) {
    const ngay = ngayCuaIso(l.thoi_diem_phat_sinh), o = theoNgay.get(ngay);
    if (o) o.lead += 1;
    if (!trongKy(ngay)) continue;
    const k = l.owner_id ?? "", w = theoOwner.get(k) ?? { lead: 0, hopLe: 0, datLich: 0, chot: 0 };
    w.lead += 1; if (hopLe(l)) w.hopLe += 1; if (datLich(l)) w.datLich += 1; if (thang(l)) w.chot += 1;
    theoOwner.set(k, w);
    if (l.chien_dich_id) { const x = theoCd.get(l.chien_dich_id); if (x) x.leadCrm += 1; }
  }
  const idsOwner = [...theoOwner.keys()].filter(Boolean);
  const { data: nv } = idsOwner.length ? await db.from("nhan_vien").select("id, ho_ten").in("id", idsOwner) : { data: [] as { id: string; ho_ten: string }[] };
  const tenNv = new Map((nv ?? []).map((n) => [n.id, n.ho_ten]));
  const owner = [...theoOwner].map(([id, w]) => ({ id: id || "chua-giao", ten: id ? tenNv.get(id) ?? "Nhân viên đã nghỉ" : "Chưa giao người phụ trách", ...w }))
    .sort((a, b) => b.chot - a.chot || b.datLich - a.datLich || b.lead - a.lead);

  // ── Hội thoại Pancake theo thẻ ───────────────────────────────────────
  type DongChat = { khoa: string; ht: number; sdt: number; tg: number; tgN: number; boLo: number | null };
  const theoLoai = new Map<string, Map<string, DongChat>>();
  for (const r of chat) {
    const m = theoLoai.get(r.loai) ?? new Map<string, DongChat>();
    const d = m.get(r.khoa) ?? { khoa: r.khoa, ht: 0, sdt: 0, tg: 0, tgN: 0, boLo: null };
    d.ht += Number(r.hoi_thoai); d.sdt += Number(r.co_sdt);
    if (r.phan_hoi_trung_vi_giay != null) { d.tg += Number(r.phan_hoi_trung_vi_giay) * Number(r.hoi_thoai); d.tgN += Number(r.hoi_thoai); }
    if (r.bo_lo != null) d.boLo = (d.boLo ?? 0) + Number(r.bo_lo);
    m.set(r.khoa, d); theoLoai.set(r.loai, m);
  }
  const ds = (loai: string) => [...(theoLoai.get(loai)?.values() ?? [])].sort((a, b) => b.ht - a.ht || b.sdt - a.sdt);
  const dichVu = ds("the_dich_vu"), nguonChat = ds("nguon"), giaiDoan = ds("giai_doan"), nhanVien = ds("nhan_vien");

  // ── Hiển thị ─────────────────────────────────────────────────────────
  const tenNguon = new Map((nguon ?? []).map((n) => [n.id, n.ten]));
  const ngayBd = [...theoNgay].map(([ngay, v]) => ({ ngay, ...v }));
  const khoangChu = motNgay ? ngayVN(tu) : `${ngayNgan(tu)}–${ngayNgan(den)}/${den.slice(0, 4)}`;
  const nhanTruoc = truoc.tu === truoc.den ? ngayVN(truoc.tu) : `${ngayNgan(truoc.tu)}–${ngayNgan(truoc.den)}`;
  const tieuBd = motNgay ? `14 ngày đến ${ngayNgan(den)}` : `theo ngày ${khoangChu}`;
  const cdDs = [...theoCd.values()].filter((c) => c.chi > 0 || c.tin > 0 || c.lead > 0).sort((a, b) => b.chi - a.chi);
  const coLeadCrm = cdDs.some((c) => c.leadCrm > 0);
  const dongNguon = pNay.filter((r) => r.so_lead > 0 || chiTheoNguon.has(r.nguon_id)).sort((a, b) => b.so_lead - a.so_lead);
  const nayHL = t("hop_le"), truocHL = tt("hop_le");
  const dem = soVN;

  return (
    <div className="space-y-6">
      {khoang.catBot && <p role="status" className="text-[12px] text-muc-3">Khoảng tùy chỉnh dài quá 366 ngày nên chỉ tính 366 ngày cuối.</p>}
      <p className="text-[13px] text-muc-3">
        Kỳ đang xem: <span className="font-medium text-muc">{khoangChu}</span> ({soNgayGom(tu, den)} ngày{den === homNay ? ", đến hôm nay" : ""}) · so với {nhanTruoc}
      </p>

      <HangKpi muc={[
        { nhan: "Chi phí quảng cáo", so: tienVN(tong.chi), nay: tong.chi, truoc: tongTr.chi, dd: tienGon },
        { nhan: "Tin nhắn mới (Pancake)", so: dem(tong.tin), nay: tong.tin, truoc: tongTr.tin, dd: dem, tot: "len", phu: `${dem(tong.sdt)} có SĐT (${ti(tong.sdt, tong.tin)})` },
        { nhan: "Lead hợp lệ", so: dem(nayHL), nay: nayHL, truoc: truocHL, dd: dem, tot: "len", phu: `${dem(t("so_lead"))} lead ghi nhận` },
        { nhan: "Giá / tin nhắn", khongSo: tong.chi ? undefined : "chưa có chi phí trong kỳ", so: tong.chi && tong.tin ? tienVN(chia(tong.chi, tong.tin)) : "–", nay: chia(tong.chi, tong.tin), truoc: chia(tongTr.chi, tongTr.tin), dd: tienGon, tot: "xuong" },
        { nhan: "Giá / lead hợp lệ", khongSo: tong.chi ? undefined : "chưa có chi phí trong kỳ", so: tong.chi && nayHL ? tienVN(chia(tong.chi, nayHL)) : "–", nay: chia(tong.chi, nayHL), truoc: chia(tongTr.chi, truocHL), dd: tienGon, tot: "xuong" },
        { nhan: "Đặt lịch", so: dem(t("da_dat_lich")), nay: t("da_dat_lich"), truoc: tt("da_dat_lich"), dd: dem, tot: "len", phu: `${ti(t("da_dat_lich"), nayHL)} lead hợp lệ` },
        { nhan: "Khách đến", so: dem(t("khach_den")), nay: t("khach_den"), truoc: tt("khach_den"), dd: dem, tot: "len", phu: `${ti(t("khach_den"), nayHL)} lead · ${ti(t("khach_den"), t("da_dat_lich"))} đặt lịch` },
        { nhan: "Có hoá đơn", so: dem(t("co_hoa_don")), nay: t("co_hoa_don"), truoc: tt("co_hoa_don"), dd: dem, tot: "len", phu: `${ti(t("co_hoa_don"), nayHL)} lead · ${ti(t("co_hoa_don"), t("khach_den"))} khách đến` },
        { nhan: "Thực thu từ lead", so: tienVN(t("thuc_thu")), nay: t("thuc_thu"), truoc: tt("thuc_thu"), dd: tienGon, tot: "len" },
        { nhan: "ROAS (thực thu / chi phí)", khongSo: tong.chi ? undefined : "chưa có chi phí trong kỳ", so: tong.chi ? `${(t("thuc_thu") / tong.chi).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} lần` : "–", nay: tong.chi ? t("thuc_thu") / tong.chi : 0, truoc: tongTr.chi ? tt("thuc_thu") / tongTr.chi : 0, dd: (n) => `${n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} lần`, tot: "len" },
      ]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MucTrang noi tieuDe={`Chi phí quảng cáo ${tieuBd}`}>
          <CotTheoKy ten="Chi phí quảng cáo theo ngày" duLieu={ngayBd.map((d) => ({ nhan: ngayVN(d.ngay), nhanNgan: ngayNgan(d.ngay), gia_tri: d.chi }))} trong="Chưa có chi phí quảng cáo trong khoảng này." />
        </MucTrang>
        <MucTrang noi tieuDe={`Tin nhắn và lead ${tieuBd}`}>
          <DuongMien ten="Tin nhắn và lead theo ngày" nhan={ngayBd.map((d) => ngayNgan(d.ngay))} trong="Chưa có tin nhắn hay lead trong khoảng này."
            chuoi={[{ ten: "Tin nhắn mới (Pancake)", gia_tri: ngayBd.map((d) => d.tin) }, { ten: "Có SĐT (Pancake)", gia_tri: ngayBd.map((d) => d.sdt) }, { ten: "Lead ghi nhận", gia_tri: ngayBd.map((d) => d.lead) }]}
            dinhDangTruc={(n) => soVN(n)} />
        </MucTrang>
        <MucTrang noi tieuDe="Phễu chuyển đổi">
          <Pheu buoc={[
            { nhan: "Lead ghi nhận", so: t("so_lead") }, { nhan: "Lead hợp lệ", so: nayHL }, { nhan: "Đã liên hệ", so: t("da_lien_he") },
            { nhan: "Đặt lịch", so: t("da_dat_lich") }, { nhan: "Khách đến", so: t("khach_den") }, { nhan: "Có hoá đơn", so: t("co_hoa_don") },
          ]} />
          <p className="mt-3 text-[12px] text-muc-3">Tỉ lệ sau dấu chấm tính trên lead hợp lệ. Thực thu {tienVN(t("thuc_thu"))} (không tính trừ thẻ tiền).</p>
        </MucTrang>
        <MucTrang noi tieuDe="Cơ cấu lead theo nguồn">
          <BieuDoTron ten="Lead theo nguồn" kieu="vong" nhanTam="lead" trong="Chưa có lead trong khoảng này."
            duLieu={pNay.filter((r) => r.so_lead > 0).map((r) => ({ nhan: tenNguon.get(r.nguon_id) ?? "Khác", gia_tri: Number(r.so_lead) })).sort((a, b) => b.gia_tri - a.gia_tri)} />
        </MucTrang>
        <MucTrang noi tieuDe="Dịch vụ khách hỏi (hội thoại Pancake)">
          <CotNgang duLieu={dichVu.slice(0, 10).map((d) => ({ nhan: d.khoa, gia_tri: d.ht }))} trong="Chưa có hội thoại gắn thẻ dịch vụ trong khoảng này." />
        </MucTrang>
        <MucTrang noi tieuDe="Hội thoại theo nguồn (thẻ Pancake)">
          <BieuDoTron ten="Hội thoại theo nguồn" kieu="banh" trong="Chưa có hội thoại gắn thẻ nguồn trong khoảng này." duLieu={nguonChat.map((d) => ({ nhan: d.khoa, gia_tri: d.ht }))} />
        </MucTrang>
        <MucTrang noi tieuDe="Giai đoạn chăm sóc (thẻ Pancake)">
          <CotNgang mau="var(--sac-xanh-mau)" duLieu={giaiDoan.slice(0, 10).map((d) => ({ nhan: d.khoa, gia_tri: d.ht }))} trong="Chưa có hội thoại gắn thẻ giai đoạn trong khoảng này." />
        </MucTrang>
        <MucTrang noi tieuDe="Hội thoại theo nhân viên trực page">
          <CotNgang mau="var(--sac-tim-mau)" duLieu={nhanVien.slice(0, 10).map((d) => ({ nhan: d.khoa, gia_tri: d.ht }))} trong="Chưa có hội thoại gắn nhân viên trong khoảng này." />
        </MucTrang>
      </div>

      <MucTrang tieuDe="Xếp hạng chiến dịch quảng cáo">
        <Bang noi duLieu={cdDs} khoa={(r) => r.id} trong="Chưa có chiến dịch chạy trong khoảng này."
          cot={[
            { nhan: "#", hienThi: (r) => <Hang i={cdDs.indexOf(r)} /> },
            { nhan: "Chiến dịch", chinh: true, hienThi: (r) => <span title={r.tenDu}>{r.ten}</span> },
            { nhan: "Chi phí", phai: true, hienThi: (r) => tienVN(r.chi) },
            { nhan: "Tỉ trọng", phai: true, hienThi: (r) => ti(r.chi, tong.chi) },
            { nhan: "Hiển thị", phai: true, hienThi: (r) => dem(r.hien) },
            { nhan: "Click", phai: true, hienThi: (r) => dem(r.click) },
            { nhan: "Tin nhắn (Meta)", phai: true, hienThi: (r) => dem(r.tin) },
            { nhan: "Giá / tin", phai: true, hienThi: (r) => (r.tin ? tienVN(chia(r.chi, r.tin)) : "–") },
            { nhan: "Lead (Meta)", phai: true, hienThi: (r) => dem(r.lead) },
            { nhan: "Giá / lead", phai: true, hienThi: (r) => (r.lead ? tienVN(chia(r.chi, r.lead)) : "–") },
            ...(coLeadCrm ? [{ nhan: "Lead gắn chiến dịch", phai: true, hienThi: (r: DongCd) => dem(r.leadCrm) }] : []),
          ]} />
        <p className="mt-2 text-[12px] text-muc-3">
          Tin nhắn và lead ở bảng này là số Meta tự báo cho từng chiến dịch; tổng tin nhắn ở ô số phía trên là số đếm thực ở Pancake nên có thể khác.
          {coLeadCrm ? "" : " Lead trong hệ thống chưa gắn chiến dịch nên chưa tách được thực thu theo chiến dịch."} Chi phí Meta tự kéo lúc 5:30 sáng hôm sau, nên hôm nay thường chưa có chi phí.
        </p>
      </MucTrang>

      <div className="grid gap-6 lg:grid-cols-2">
        <MucTrang tieuDe="Xếp hạng dịch vụ được hỏi nhiều">
          <Bang noi duLieu={dichVu} khoa={(r) => r.khoa} trong="Chưa có hội thoại gắn thẻ dịch vụ."
            cot={[
              { nhan: "#", hienThi: (r) => <Hang i={dichVu.indexOf(r)} /> },
              { nhan: "Dịch vụ", chinh: true, hienThi: (r) => r.khoa },
              { nhan: "Hội thoại", phai: true, hienThi: (r) => dem(r.ht) },
              { nhan: "Tỉ trọng", phai: true, hienThi: (r) => ti(r.ht, tong.tin) },
              { nhan: "Có SĐT", phai: true, hienThi: (r) => <>{dem(r.sdt)} <span className="text-muc-3">({ti(r.sdt, r.ht)})</span></> },
            ]} />
        </MucTrang>
        <MucTrang tieuDe="Xếp hạng nhân viên trực page">
          <Bang noi duLieu={nhanVien} khoa={(r) => r.khoa} trong="Chưa có hội thoại gắn nhân viên."
            cot={[
              { nhan: "#", hienThi: (r) => <Hang i={nhanVien.indexOf(r)} /> },
              { nhan: "Nhân viên", chinh: true, hienThi: (r) => r.khoa },
              { nhan: "Hội thoại", phai: true, hienThi: (r) => dem(r.ht) },
              { nhan: "Xin được SĐT", phai: true, hienThi: (r) => <>{dem(r.sdt)} <span className="text-muc-3">({ti(r.sdt, r.ht)})</span></> },
              { nhan: "Phản hồi đầu", phai: true, hienThi: (r) => (r.tgN ? phut(r.tg / r.tgN) : "–") },
              { nhan: "Bỏ lỡ", phai: true, hienThi: (r) => (r.boLo != null ? dem(r.boLo) : "–") },
            ]} />
        </MucTrang>
      </div>

      <MucTrang tieuDe="Xếp hạng người phụ trách lead">
        <Bang noi duLieu={owner} khoa={(r) => r.id} trong="Chưa có lead trong khoảng này."
          cot={[
            { nhan: "#", hienThi: (r) => <Hang i={owner.indexOf(r)} /> },
            { nhan: "Người phụ trách", chinh: true, hienThi: (r) => r.ten },
            { nhan: "Lead", phai: true, hienThi: (r) => dem(r.lead) },
            { nhan: "Hợp lệ", phai: true, hienThi: (r) => dem(r.hopLe) },
            { nhan: "Đặt lịch", phai: true, hienThi: (r) => <>{dem(r.datLich)} <span className="text-muc-3">({ti(r.datLich, r.hopLe)})</span></> },
            { nhan: "Chốt được (Thắng)", phai: true, hienThi: (r) => <>{dem(r.chot)} <span className="text-muc-3">({ti(r.chot, r.hopLe)})</span></> },
          ]} />
      </MucTrang>

      <MucTrang tieuDe="Phễu theo nguồn lead">
        <Bang noi duLieu={dongNguon} khoa={(r) => r.nguon_id} trong="Chưa có lead trong khoảng này."
          cot={[
            { nhan: "Nguồn", chinh: true, hienThi: (r) => tenNguon.get(r.nguon_id) ?? "" }, { nhan: "Lead", phai: true, hienThi: (r) => dem(r.so_lead) }, { nhan: "Hợp lệ", phai: true, hienThi: (r) => dem(r.hop_le) },
            { nhan: "Đã liên hệ", phai: true, hienThi: (r) => <>{dem(r.da_lien_he)} <span className="text-muc-3">({ti(r.da_lien_he, r.hop_le)})</span></> },
            { nhan: "Đặt lịch", phai: true, hienThi: (r) => <>{dem(r.da_dat_lich)} <span className="text-muc-3">({ti(r.da_dat_lich, r.hop_le)})</span></> },
            { nhan: "Khách đến", phai: true, hienThi: (r) => <>{dem(r.khach_den)} <span className="text-muc-3">({ti(r.khach_den, r.hop_le)})</span></> },
            { nhan: "Có hoá đơn", phai: true, hienThi: (r) => dem(r.co_hoa_don) },
            { nhan: "Chi phí QC", phai: true, hienThi: (r) => (chiTheoNguon.has(r.nguon_id) ? tienVN(chiTheoNguon.get(r.nguon_id)) : "") },
            { nhan: "Giá / lead", phai: true, hienThi: (r) => (chiTheoNguon.has(r.nguon_id) && r.hop_le > 0 ? tienVN(chia(chiTheoNguon.get(r.nguon_id)!, r.hop_le)) : "") },
            { nhan: "Thực thu", phai: true, hienThi: (r) => tienVN(r.thuc_thu) },
          ]} />
        {chiChung > 0 && <p className="mt-2 text-[12px] text-muc-3">Có {tienVN(chiChung)} chi phí của chiến dịch chưa gắn nguồn lead nên chỉ tính vào tổng.</p>}
      </MucTrang>

      <p className="text-[12px] text-muc-3">
        Ngày tính theo giờ Việt Nam. Thẻ hội thoại lấy theo trạng thái hiện tại trên Pancake; một hội thoại có thể có nhiều thẻ nên cộng các dòng có thể lớn hơn tổng.
        Khách đến, hoá đơn và thực thu tính cho lead phát sinh trong kỳ (kể cả khi khách đến sau kỳ).
      </p>
    </div>
  );
}
