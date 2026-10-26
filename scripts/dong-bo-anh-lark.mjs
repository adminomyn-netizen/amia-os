// Đẩy ảnh khách từ hàng đợi Supabase (khach_anh.lark_trang_thai) sang Base Lark "AMIA - Kho ảnh khách".
// Chạy: node scripts/dong-bo-anh-lark.mjs  (launchd gọi mỗi 30 giây). Hàng đợi nằm ở DB nên máy tắt không mất ảnh; bật lại tự đuổi kịp.
// Chỉ đẩy mã khách, chi nhánh, ngày, loại, ghi chú, người chụp, cờ đồng ý dùng hình + ảnh. KHÔNG đẩy SĐT, tên khách.
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const chay = promisify(execFile);
const GOC = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(readFileSync(join(GOC, ".env.local"), "utf8").split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LARK = process.env.LARK_CLI ?? "/Users/phamtunglam/.local/bin/lark-cli2";
const BASE = "HqZobkuRNa0giLsmaxwj64lFpCc";
const BANG = "tblgGbAX5KWChgeM";
const LO = Number(process.env.LO ?? 10);
const TOI_DA_LAN = 8;

// Khoá chống chạy chồng: 1 tiến trình tại một thời điểm; khoá cũ hơn 10 phút coi là treo và được lấy lại.
const KHOA = join(tmpdir(), "amia-dong-bo-anh.lock");
try { mkdirSync(KHOA); } catch {
  if (Date.now() - statSync(KHOA).mtimeMs < 10 * 60_000) process.exit(0);
  rmSync(KHOA, { recursive: true, force: true }); mkdirSync(KHOA);
}
process.on("exit", () => rmSync(KHOA, { recursive: true, force: true }));

let thuMucTam = tmpdir();
// Lark CLI chỉ nhận đường dẫn tệp tương đối nằm trong thư mục đang chạy → chạy lệnh ngay trong thư mục tạm.
const lark = async (...a) => {
  const { stdout } = await chay(LARK, ["base", ...a, "--as", "user", "--base-token", BASE], { cwd: thuMucTam, maxBuffer: 20 * 1024 * 1024, timeout: 120_000 });
  const j = JSON.parse(stdout.slice(stdout.indexOf("{")));
  if (!j.ok) throw new Error(j.error?.message ?? "Lark báo lỗi");
  return j.data;
};

// Ảnh kẹt ở 'dang_gui' quá 10 phút (tiến trình chết giữa chừng) → trả về hàng đợi.
await sb.from("khach_anh").update({ lark_trang_thai: "cho" }).eq("lark_trang_thai", "dang_gui").lt("lark_xong_luc", new Date(Date.now() - 10 * 60_000).toISOString());

const { data: ds, error } = await sb.from("khach_anh").select("*").in("lark_trang_thai", ["cho", "loi"]).lt("lark_so_lan", TOI_DA_LAN).order("tao_luc").limit(LO);
if (error) { console.error("Đọc hàng đợi:", error.message); process.exit(1); }
if (!ds?.length) process.exit(0);

const tam = mkdtempSync(join(tmpdir(), "amia-anh-"));
thuMucTam = tam;
let xong = 0, hong = 0;
for (const a of ds) {
  const t0 = Date.now();
  // Nhận việc: chỉ 1 tiến trình giữ được dòng này.
  const { data: nhan } = await sb.from("khach_anh").update({ lark_trang_thai: "dang_gui", lark_so_lan: a.lark_so_lan + 1, lark_xong_luc: new Date().toISOString() }).eq("id", a.id).in("lark_trang_thai", ["cho", "loi"]).select("id");
  if (!nhan?.length) continue;
  try {
    const [{ data: k }, { data: nv }] = await Promise.all([
      sb.from("khach_hang").select("ma, dong_y_dung_hinh, chi_nhanh:chi_nhanh_id(ten)").eq("id", a.khach_id).single(),
      a.tao_boi ? sb.from("nhan_vien").select("ho_ten").eq("id", a.tao_boi).single() : Promise.resolve({ data: null }),
    ]);
    const { data: lk, error: e1 } = await sb.storage.from("khach-anh").createSignedUrl(a.duong_dan, 300);
    if (e1 || !lk) throw new Error("Không cấp được link ảnh nguồn: " + (e1?.message ?? ""));
    const r = await fetch(lk.signedUrl);
    if (!r.ok) throw new Error("Tải ảnh nguồn lỗi " + r.status);
    const tep = `${a.id}.${a.duong_dan.split(".").pop()}`;
    writeFileSync(join(tam, tep), Buffer.from(await r.arrayBuffer()));

    let recId = a.lark_record_id;
    if (!recId) {
      // Phòng trùng khi lần trước tạo xong bản ghi mà chưa kịp ghi lại mã: tìm theo Mã ảnh trước.
      try {
        const f = await lark("+record-search", "--keyword", a.id, "--search-field", "Mã ảnh", "--field-id", "Mã ảnh", "--format", "json", "--limit", "1");
        recId = f?.record_id_list?.[0] ?? f?.records?.[0]?.record_id ?? null;
      } catch { /* không tìm được thì cứ tạo mới */ }
    }
    if (!recId) {
      const d = await lark("+record-upsert", "--table-id", BANG, "--json", JSON.stringify({
        "Mã ảnh": a.id, "Mã khách": k.ma, "Chi nhánh": k.chi_nhanh?.ten ?? "", "Ngày chụp": `${a.ngay_chup} 00:00`,
        "Loại": [{ truoc: "Trước", sau: "Sau", khac: "Khác" }[a.loai] ?? "Khác"], "Ghi chú": a.ghi_chu ?? "", "Người chụp": nv?.ho_ten ?? "",
        "Đồng ý dùng hình": !!k.dong_y_dung_hinh, "Tải lên lúc": a.tao_luc,
      }));
      recId = d.record.record_id_list[0];
      await sb.from("khach_anh").update({ lark_record_id: recId }).eq("id", a.id);
    }
    const up = await lark("+record-upload-attachment", "--table-id", BANG, "--record-id", recId, "--field-id", "Ảnh", "--file", tep);
    const token = Object.values(Object.values(up.attachments ?? {})[0] ?? {})[0]?.at(-1)?.file_token;
    if (!token) throw new Error("Lark không trả mã tệp");
    await sb.from("khach_anh").update({ lark_trang_thai: "xong", lark_file_token: token, lark_loi: null, lark_xong_luc: new Date().toISOString() }).eq("id", a.id);
    xong++;
    console.log(`xong ${a.id} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    const m = String(e.stderr || e.message || e);
    // Lark giới hạn tốc độ: không phải lỗi của ảnh → không tính lần thử, trả về hàng đợi và nghỉ hết đợt này (30 giây sau chạy lại).
    if (/429|frequen|rate|too many|limit/i.test(m)) {
      await sb.from("khach_anh").update({ lark_trang_thai: "cho", lark_so_lan: a.lark_so_lan }).eq("id", a.id);
      console.error(`Lark giới hạn tốc độ, nghỉ đợt này (${a.id})`);
      break;
    }
    hong++;
    await sb.from("khach_anh").update({ lark_trang_thai: "loi", lark_loi: m.slice(0, 500) }).eq("id", a.id);
    console.error(`lỗi ${a.id}:`, m.slice(0, 200));
  }
}
rmSync(tam, { recursive: true, force: true });
console.log(`Đẩy ${xong} ảnh, lỗi ${hong}`);
