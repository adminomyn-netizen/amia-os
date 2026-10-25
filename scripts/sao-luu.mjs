// Sao lưu toàn bộ dữ liệu public ra 1 file JSON (đọc bằng service_role). Dùng: node scripts/sao-luu.mjs  → sao-luu/amia-YYYY-MM-DD-HHMM.json
// Chạy trước mỗi lần cập nhật cấu trúc DB hoặc nhập dữ liệu lớn. File chứa dữ liệu khách → giữ ở nơi riêng tư, KHÔNG đưa vào git.
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BANG = ["chi_nhanh", "nhan_vien", "dich_vu_nhom", "dich_vu", "san_pham", "goi_the", "goi_the_dich_vu", "hang_khach", "cau_hinh", "khach_hang", "khach_quan_tam", "khach_nguoi_than", "khach_ghi_chu", "khach_anh",
  "lich_hen", "lich_hen_dich_vu", "hoa_don", "hoa_don_dong", "dong_nhan_vien", "the_khach", "buoi_thuc_hien", "the_so_cai", "thanh_toan", "kho_so_cai", "dinh_muc", "phieu_cap", "phieu_cap_dong", "hoa_hong_ti_le", "dem_ma", "nhat_ky_truy_cap"];
const ra = { luc: new Date().toISOString(), bang: {} };
for (const b of BANG) {
  const dong = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await sb.from(b).select("*").range(i, i + 999);
    if (error) { console.error(b, error.message); process.exit(1); }
    dong.push(...data);
    if (data.length < 1000) break;
  }
  ra.bang[b] = dong;
  console.log(b.padEnd(20), dong.length);
}
mkdirSync("sao-luu", { recursive: true });
const ten = `sao-luu/amia-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1-$2")}.json`;
writeFileSync(ten, JSON.stringify(ra));
console.log("Đã ghi", ten);
