// Pancake → Hộp lead AMIA OS (chị Diệu Thuý / chị Lâm 18/11/2026: "đổ lead Pancake về luôn phần mềm").
// Kéo các hội thoại của fanpage AMIA cập nhật trong N phút gần nhất qua API công khai Pancake (page_access_token),
// hội thoại nào khách đã để SĐT thì tạo lead nguồn "Fanpage" ở chi nhánh Vinh. Trigger của bảng lead tự xếp cột "Mới"
// và tự giao người phụ trách lead của chi nhánh (nếu đã đặt).
// Quy tắc giống nút "Thêm lead" trong app: SĐT đã là khách thì KHÔNG tạo lead, SĐT đang có lead mở thì bỏ qua (không trùng).
// CHỈ ĐỌC Pancake (không nhắn khách, không gắn thẻ). Chỉ ghi bảng lead (+ dòng thời gian do trigger tự ghi). Không tiền, không thẻ, không kho.
// Dùng: PW=… node scripts/pancake/dong-bo-lead.mjs [phút=30] [--ghi]   (không có --ghi = chạy thử, chỉ in)
// Mã trang lấy từ Keychain amia-pancake-page-token (hoặc biến PANCAKE_PAGE_TOKEN). Không in mã, SĐT in đã che.
import { execFileSync } from "node:child_process";
import { ketNoi } from "../chuyen-salonhero/lib.mjs";

const PAGE = "125397971450402";
const NGUON = "Fanpage", CHI_NHANH = "VINH";
const args = process.argv.slice(2);
const PHUT = Number(args.find((a) => !a.startsWith("--")) ?? 30);
const GHI = args.includes("--ghi");
const token = process.env.PANCAKE_PAGE_TOKEN || execFileSync("security", ["find-generic-password", "-s", "amia-pancake-page-token", "-w"], { encoding: "utf8" }).trim();
const che = (s) => String(s).replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");

/** Chuẩn SĐT về dạng 0xxxxxxxxx (bỏ khoảng trắng, dấu chấm; +84/84 → 0). Không hợp lệ thì null. */
export function chuanSdt(s) {
  let d = String(s ?? "").replace(/\D/g, "");
  if (d.startsWith("84") && d.length >= 11) d = "0" + d.slice(2);
  return /^0[0-9]{9,10}$/.test(d) ? d : null;
}

async function keoHoiThoai() {
  const until = Math.floor(Date.now() / 1000), since = until - PHUT * 60, out = [], co = new Set();
  for (let trang = 1; trang <= 30; trang++) {
    const u = `https://pages.fm/api/public_api/v1/pages/${PAGE}/conversations?page_access_token=${encodeURIComponent(token)}&since=${since}&until=${until}&page_number=${trang}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(30_000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new Error(`Pancake trả lỗi ${r.status}: ${String(j.message ?? "").slice(0, 120)}`);
    const moi = (j.conversations ?? []).filter((c) => !co.has(c.id));
    if (!moi.length) break; // hết trang (hoặc Pancake trả lại trang cũ)
    for (const c of moi) co.add(c.id);
    out.push(...moi);
  }
  return out;
}

const db = await ketNoi();
try {
  const hts = await keoHoiThoai();
  const [{ rows: [ng] }, { rows: [cn] }] = await Promise.all([
    db.query("select id from public.nguon_lead where ten = $1 and hoat_dong", [NGUON]),
    db.query("select id from public.chi_nhanh where ma = $1 and hoat_dong", [CHI_NHANH]),
  ]);
  if (!ng || !cn) throw new Error("Thiếu nguồn Fanpage hoặc chi nhánh Vinh");
  const dem = { hoiThoai: hts.length, coSdt: 0, taoMoi: 0, khachCu: 0, trungLead: 0, sdtLoi: 0 };
  const daXet = new Set();
  for (const c of hts) {
    const sdts = [...new Set((c.recent_phone_numbers ?? []).map((p) => chuanSdt(p.phone_number ?? p.captured)).filter(Boolean))];
    if (!sdts.length) { if ((c.recent_phone_numbers ?? []).length) dem.sdtLoi++; continue; }
    dem.coSdt++;
    const sdt = sdts[sdts.length - 1]; // số khách để lại gần nhất
    if (daXet.has(sdt)) continue;
    daXet.add(sdt);
    const { rows: [kh] } = await db.query("select ma from public.khach_hang where dien_thoai = $1 limit 1", [sdt]);
    if (kh) { dem.khachCu++; console.log(`  khách cũ ${che(sdt)} (${kh.ma}) — không tạo lead`); continue; }
    const { rows: [mo] } = await db.query("select ma from public.lead where sdt = $1 and ket_qua <> 'lost' and trang_thai_phan_bo not in ('lead_trung','khong_hop_le') limit 1", [sdt]);
    if (mo) { dem.trungLead++; continue; }
    const kh0 = (c.customers ?? [])[0] ?? {};
    const ten = String(kh0.name ?? c.from?.name ?? "").trim().slice(0, 120) || `Khách Pancake ${sdt.slice(-4)}`;
    const the = (c.tags ?? []).map((t) => t.text).filter(Boolean);
    const nhuCau = [
      `Từ Pancake (${c.type === "COMMENT" ? "bình luận" : "tin nhắn"} fanpage)${the.length ? ` · Thẻ: ${the.join(", ")}` : ""}`,
      c.snippet ? `Tin gần nhất: ${String(c.snippet).slice(0, 200)}` : null,
      `Mở hội thoại: https://pancake.vn/${PAGE}?c_id=${c.id}`,
    ].filter(Boolean).join("\n");
    console.log(`  ${GHI ? "TẠO" : "sẽ tạo"} lead ${che(sdt)} · ${ten} · ${c.type}`);
    dem.taoMoi++;
    if (!GHI) continue;
    try {
      await db.query("begin");
      const { rows: [s] } = await db.query("select public.so_tiep_theo('lead') n");
      const ma = `LD${String(s.n).padStart(6, "0")}`;
      await db.query(`insert into public.lead (ma, ho_ten, sdt, nguon_id, chi_nhanh_id, nhu_cau, thoi_diem_phat_sinh) values ($1,$2,$3,$4,$5,$6,$7)`,
        [ma, ten, sdt, ng.id, cn.id, nhuCau.slice(0, 1000), c.inserted_at ? new Date(c.inserted_at + "Z") : new Date()]);
      await db.query("commit");
    } catch (e) {
      await db.query("rollback").catch(() => {});
      dem.taoMoi--;
      if (e.code === "23505") dem.trungLead++; else console.error(`  LỖI ${che(sdt)}: ${e.message}`);
    }
  }
  console.log(`${new Date().toISOString()} ${GHI ? "GHI" : "THỬ"} ${PHUT}p ${JSON.stringify(dem)}`);
} catch (e) { console.error("LỖI:", e.message); process.exitCode = 1; }
finally { await db.end(); }
