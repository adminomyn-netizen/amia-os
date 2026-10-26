// Lấy ảnh cũ SalonHero của MỘT khách từ kho lưu trữ về kho ảnh AMIA OS để nhân viên xem (giữ tạm 3 ngày rồi tự dọn; bản gốc vẫn ở Lark).
// Chạy: node scripts/lay-anh-cu.mjs  (launchd gọi mỗi 15 giây). Yêu cầu nằm ở bảng yeu_cau_lay_anh nên máy tắt không mất việc.
// Nguồn ảnh theo thứ tự: ổ đĩa ~/amia-anh-tam (bản chép khi chuyển từ SalonHero) → tệp nén .zip chứa ảnh đó ở Base Lark (sổ lark-so.jsonl)
// → còn chưa chuyển tới khách này thì tải thẳng từ SalonHero rồi thu nhỏ y như khi chuyển (nên bấm lúc nào cũng có ảnh).
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const GOC = join(dirname(fileURLToPath(import.meta.url)), "..");
const THU_MUC = join(homedir(), "amia-anh-tam");
const env = Object.fromEntries(readFileSync(join(GOC, ".env.local"), "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LARK = process.env.LARK_CLI ?? "/Users/phamtunglam/.local/bin/lark-cli2";
const BASE = "HqZobkuRNa0giLsmaxwj64lFpCc";
const GIU_NGAY = 3, TOI_DA_MOT_LAN = 300, TRAN_MB = 900, SONG_SONG = 6;
const cdn = (u) => "https://salonhero-wasabi.becdn.net/" + u.split("/PROD/")[1];
const vnNgay = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);

// Khoá chống chạy chồng: 1 tiến trình một lúc; khoá cũ hơn 10 phút coi là treo.
const KHOA = join(tmpdir(), "amia-lay-anh-cu.lock");
try { mkdirSync(KHOA); } catch {
  if (Date.now() - statSync(KHOA).mtimeMs < 10 * 60_000) process.exit(0);
  rmSync(KHOA, { recursive: true, force: true }); mkdirSync(KHOA);
}
process.on("exit", () => rmSync(KHOA, { recursive: true, force: true }));

const dungLuong = async () => Number((await sb.rpc("dung_luong_kho_anh_mb")).data ?? 0);

/** Dọn ảnh tạm đã quá hạn (xoá tệp trong kho + dòng khach_anh). `chuaDon` = số MB cần giải phóng thêm (xoá ảnh sắp hết hạn trước). */
async function don(canGiaiPhongMb = 0, tru = null) {
  let giai = 0;
  for (let vong = 0; vong < 50; vong++) {
    let q = sb.from("khach_anh").select("id, duong_dan, khach_id").not("het_han", "is", null).order("het_han").limit(300);
    q = canGiaiPhongMb > 0 && giai < canGiaiPhongMb ? q : q.lt("het_han", new Date().toISOString());
    if (tru) q = q.neq("khach_id", tru);
    const { data } = await q;
    if (!data?.length) return giai;
    await sb.storage.from("khach-anh").remove(data.map((r) => r.duong_dan));
    await sb.from("khach_anh").delete().in("id", data.map((r) => r.id));
    giai += data.length * 0.07;
    if (canGiaiPhongMb <= 0 && data.length < 300) return giai;
  }
  return giai;
}

// Sổ Lark: mã ảnh → mã tệp nén; mã dòng → (bảng, dòng). Chỉ nạp khi cần tới Lark.
let so = null;
const nap = () => {
  if (so) return so;
  const f = join(THU_MUC, "lark-so.jsonl"), anh = new Map(), dong = new Map(), zipDong = new Map();
  if (existsSync(f)) for (const l of readFileSync(f, "utf8").split("\n").filter(Boolean)) {
    const j = JSON.parse(l);
    if (j.t === "rec") dong.set(j.ma, { rec: j.rec, bang: j.bang ?? 0 });
    else if (j.t === "zip") for (const id of j.anh) anh.set(id, { token: j.token, ma: j.ma, zip: true });
    else if (j.t === "anh") anh.set(j.anh, { token: j.token, ma: j.ma, zip: false }); // đợt đầu: từng ảnh một, chưa nén
  }
  const bang = JSON.parse(readFileSync(join(THU_MUC, "lark-bang.json"), "utf8"));
  return (so = { anh, dong, bang, zipDong });
};
const zipDaTai = new Map(); // token → thư mục đã giải nén (trong một lần chạy)
async function tuLark(a, ngay, tam) {
  const s = nap(), x = s.anh.get(a[1]);
  if (!x) return null;
  if (!x.zip) {
    const d = s.dong.get(x.ma), thuMuc = mkdtempSync(join(tam, "f-"));
    await chay(LARK, ["base", "+record-download-attachment", "--as", "user", "--base-token", BASE, "--table-id", s.bang[d.bang], "--record-id", d.rec, "--file-token", x.token, "--output", "./a.jpg"], { cwd: thuMuc, timeout: 120_000 });
    return readFileSync(join(thuMuc, "a.jpg"));
  }
  let thuMuc = zipDaTai.get(x.token);
  if (!thuMuc) {
    thuMuc = mkdtempSync(join(tam, "z-"));
    const d = s.dong.get(x.ma);
    await chay(LARK, ["base", "+record-download-attachment", "--as", "user", "--base-token", BASE, "--table-id", s.bang[d.bang], "--record-id", d.rec, "--file-token", x.token, "--output", "./z.zip"], { cwd: thuMuc, timeout: 300_000 });
    await chay("unzip", ["-q", "-o", "z.zip"], { cwd: thuMuc });
    zipDaTai.set(x.token, thuMuc);
  }
  const tep = join(thuMuc, `${ngay}_sh-${a[1]}.jpg`);
  return existsSync(tep) ? readFileSync(tep) : null;
}

/** Chưa chuyển tới khách này: tải thẳng từ SalonHero, xoay đúng chiều, thu nhỏ cạnh dài 1200 px (giống bước 1). */
async function tuSalonHero(a) {
  for (let lan = 0; lan < 3; lan++) {
    const r = await fetch(cdn(a[2]), { signal: AbortSignal.timeout(60_000) }).catch(() => null);
    if (r?.ok) return sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    if (r && (r.status === 403 || r.status === 404)) return null;
    await new Promise((x) => setTimeout(x, 1500 * (lan + 1)));
  }
  return null;
}

async function layChoKhach(yc) {
  const { data: k } = await sb.from("khach_hang").select("sh_id").eq("id", yc.khach_id).single();
  if (!k?.sh_id) throw new Error("Khách không có mã SalonHero");
  const sh = Number(k.sh_id);
  const dsNguon = JSON.parse(readFileSync(join(GOC, "sao-luu/salonhero/anh.json"), "utf8")).filter((a) => a[0] === sh && !a[4] && a[3]);
  const { data: co } = await sb.from("khach_anh").select("duong_dan, het_han").eq("khach_id", yc.khach_id).like("duong_dan", "%/sh-%");
  const daCo = new Map((co ?? []).map((r) => [Number(/sh-(\d+)\.jpg$/.exec(r.duong_dan)?.[1]), r.het_han]));
  const hetHan = new Date(Date.now() + GIU_NGAY * 864e5).toISOString();
  // Ảnh tạm đang có thì chỉ gia hạn; ảnh vĩnh viễn (het_han null) bỏ qua; còn lại lấy tối đa TOI_DA_MOT_LAN ảnh mới nhất.
  const dangCoTam = dsNguon.filter((a) => daCo.has(a[1]) && daCo.get(a[1]));
  if (dangCoTam.length) await sb.from("khach_anh").update({ het_han: hetHan }).eq("khach_id", yc.khach_id).not("het_han", "is", null);
  const can = dsNguon.filter((a) => !daCo.has(a[1])).sort((x, y) => y[3].localeCompare(x[3]) || y[1] - x[1]).slice(0, TOI_DA_MOT_LAN);
  if (!can.length) return 0;

  if ((await dungLuong()) + can.length * 0.08 > TRAN_MB) await don(can.length * 0.08 + 20, yc.khach_id); // đầy → dọn ảnh sắp hết hạn của khách khác
  if ((await dungLuong()) + can.length * 0.08 > TRAN_MB + 80) throw new Error("Kho ảnh tạm đang đầy, thử lại sau ít phút");

  const tam = mkdtempSync(join(tmpdir(), "amia-anh-cu-"));
  let xong = 0, i = 0, thieu = 0;
  const lam = async () => {
    while (i < can.length) {
      const a = can[i++], ngay = vnNgay(a[3]);
      try {
        const local = join(THU_MUC, String(sh), ngay, `sh-${a[1]}.jpg`);
        const buf = existsSync(local) ? readFileSync(local) : (await tuLark(a, ngay, tam)) ?? (await tuSalonHero(a));
        if (!buf) { thieu++; continue; }
        const duong = `${yc.khach_id}/${ngay}/sh-${a[1]}.jpg`;
        const { error: e1 } = await sb.storage.from("khach-anh").upload(duong, buf, { contentType: "image/jpeg", upsert: true });
        if (e1) throw new Error("kho: " + e1.message);
        const { error: e2 } = await sb.from("khach_anh").upsert({ khach_id: yc.khach_id, duong_dan: duong, loai: "khac", ngay_chup: ngay, lark_trang_thai: "xong", het_han: hetHan,
          ghi_chu: [a[6], a[5] ? `Chụp bởi ${a[5]} (SalonHero)` : "Chuyển từ SalonHero"].filter(Boolean).join(" — ").slice(0, 500) || null }, { onConflict: "duong_dan" });
        if (e2) throw new Error("db: " + e2.message);
        xong++;
      } catch (e) { thieu++; console.error(`ảnh ${a[1]}:`, String(e.message).slice(0, 160)); }
    }
  };
  try { await Promise.all(Array.from({ length: SONG_SONG }, lam)); } finally { rmSync(tam, { recursive: true, force: true }); }
  if (xong === 0 && thieu > 0) throw new Error(`Không lấy được ảnh nào (thiếu ${thieu})`);
  return xong;
}

// ── Chạy ──
await don(); // dọn ảnh hết hạn mỗi lượt
await sb.from("yeu_cau_lay_anh").update({ trang_thai: "cho" }).eq("trang_thai", "dang_lay").lt("tao_luc", new Date(Date.now() - 20 * 60_000).toISOString()); // kẹt → trả lại hàng đợi
const { data: ds } = await sb.from("yeu_cau_lay_anh").select("*").eq("trang_thai", "cho").order("tao_luc").limit(2);
for (const yc of ds ?? []) {
  const { data: nhan } = await sb.from("yeu_cau_lay_anh").update({ trang_thai: "dang_lay" }).eq("id", yc.id).eq("trang_thai", "cho").select("id");
  if (!nhan?.length) continue;
  const t0 = Date.now();
  try {
    const n = await layChoKhach(yc);
    await sb.from("yeu_cau_lay_anh").update({ trang_thai: "xong", so_anh_lay: n, loi: null, xong_luc: new Date().toISOString() }).eq("id", yc.id);
    console.log(`xong ${yc.khach_id} ${n} ảnh ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    await sb.from("yeu_cau_lay_anh").update({ trang_thai: "loi", loi: String(e.message ?? e).slice(0, 300), xong_luc: new Date().toISOString() }).eq("id", yc.id);
    console.error(`lỗi ${yc.khach_id}:`, String(e.message ?? e).slice(0, 200));
  }
}
